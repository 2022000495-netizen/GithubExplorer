#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
reconciliar_diffs.py — fonte de verdade das colunas de diff do experimento.

Para cada linha do resultados.csv, localiza a branch local correspondente
(exp/...), criada a partir da branch base, e recomputa via `git diff`:
    arquivos_alterados, linhas_add, linhas_rem,
    linhas_contexto_alteradas, densidade_ruido
cruzando o diff real da branch (git diff <base>...<branch>) com as linhas
lidas como contexto (ferramenta Read no transcript .jsonl da execucao).

Isso torna as métricas auditáveis por terceiros (basta o repositório com as
branches) e corrige capturas por-execucao que eventualmente falharam.

Uso:
  python3 reconciliar_diffs.py --csv resultados.csv --repo /caminho/GithubExplorer \
          --raw execucoes-brutas [--write] [--backup resultados-bkp.csv]
Sem --write, apenas relata as diferenças (dry-run).
"""
import argparse, csv, glob, json, os, re, subprocess, sys

EXC = ["--", ".",
       ":(exclude)*.lock", ":(exclude)*.lockb", ":(exclude)*-lock.json", ":(exclude)pnpm-lock.yaml",
       ":(exclude)node_modules", ":(exclude)node_modules/**",
       ":(exclude)**/dist/**", ":(exclude)**/coverage/**", ":(exclude)**/build/**"]
RE_LINHA = re.compile(r"^\s*(\d+)(?:→|\t|\|)")
COLS = ["arquivos_alterados", "linhas_add", "linhas_rem", "linhas_contexto_alteradas", "densidade_ruido"]

def git(repo, *args):
    return subprocess.run(["git", "-C", repo, *args], capture_output=True, text=True).stdout

def mapa_stamp_branch(repo):
    """stamp -> (branch, base). base vem do assunto do commit ('base=...')."""
    out = git(repo, "for-each-ref", "--format=%(refname:short)|%(subject)", "refs/heads/exp/")
    m = {}
    for line in out.splitlines():
        if "|" not in line: continue
        br, subj = line.split("|", 1)
        st = re.search(r"\|\s*(\d{8}T\d{6})\s*$", subj)
        mb = re.search(r"base=(\S+)", subj)
        if st: m[st.group(1)] = (br.strip(), mb.group(1) if mb else None)
    return m

def numstat(repo, rng):
    # rng = "base...branch": compara a branch contra o ancestral comum (robusto a commits do agente)
    out = git(repo, "diff", "--numstat", rng, *EXC)
    files = add = rem = 0
    for l in out.splitlines():
        p = l.split("\t")
        if len(p) >= 3:
            files += 1
            add += int(p[0]) if p[0].isdigit() else 0
            rem += int(p[1]) if p[1].isdigit() else 0
    return files, add, rem

def removidas_lado_antigo(repo, rng):
    """arquivo -> conjunto de números de linha (lado antigo) tocadas."""
    out = git(repo, "diff", "-U0", rng, *EXC)
    alt = {}
    arq = None; old = None
    for l in out.splitlines():
        if l.startswith("+++ b/") or (l.startswith("+++ ") and not l.startswith("+++ /dev/null")):
            arq = l[6:] if l.startswith("+++ b/") else l[4:]
        elif l.startswith("@@"):
            mm = re.search(r"@@ -(\d+)(?:,\d+)? \+", l); old = int(mm.group(1)) if mm else None
        elif l.startswith("-") and not l.startswith("---"):
            if arq is not None and old is not None:
                alt.setdefault(arq, set()).add(old); old += 1
    return alt

def texto(c):
    if isinstance(c, str): return c
    if isinstance(c, list):
        return "\n".join((b.get("text") or b.get("content") or "") if isinstance(b, dict) else str(b) for b in c)
    return ""

def contexto_lido(jsonl_path):
    """arquivo(relativo) -> conjunto de linhas lidas como contexto (Read)."""
    read_files = {}; read_nums = {}; init_cwd = None
    try:
        eventos = [json.loads(l) for l in open(jsonl_path, encoding="utf-8") if l.strip()]
    except Exception:
        return {}
    for ev in eventos:
        if ev.get("type") == "system" and ev.get("subtype") == "init" and ev.get("cwd"):
            init_cwd = ev.get("cwd")
        msg = ev.get("message") if isinstance(ev.get("message"), dict) else None
        if msg and isinstance(msg.get("content"), list):
            for b in msg["content"]:
                if not isinstance(b, dict): continue
                if b.get("type") == "tool_use" and b.get("name") == "Read":
                    fp = (b.get("input") or {}).get("file_path")
                    if b.get("id") and fp: read_files[b["id"]] = fp
                if b.get("type") == "tool_result" and b.get("tool_use_id") in read_files:
                    nums = {int(m.group(1)) for m in (RE_LINHA.match(x) for x in texto(b.get("content")).splitlines()) if m}
                    if nums: read_nums.setdefault(b["tool_use_id"], set()).update(nums)
    base = init_cwd
    sub = {}
    for fid, fp in read_files.items():
        nums = read_nums.get(fid)
        if not nums: continue
        rel = os.path.relpath(os.path.realpath(fp), os.path.realpath(base)) if base else fp
        if rel.startswith(".."):
            i = fp.find(os.sep + "src" + os.sep); rel = fp[i+1:] if i >= 0 else os.path.basename(fp)
        sub.setdefault(rel, set()).update(nums)
    return sub

def achar_jsonl(raw, stamp):
    hits = glob.glob(os.path.join(raw, f"*_{stamp}.jsonl"))
    return hits[0] if hits else None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True)
    ap.add_argument("--repo", required=True)
    ap.add_argument("--raw", default=None, help="pasta execucoes-brutas (para densidade de ruido)")
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--backup", default=None)
    args = ap.parse_args()
    repo = os.path.abspath(args.repo)
    raw = args.raw or os.path.join(os.path.dirname(os.path.abspath(args.csv)), "execucoes-brutas")

    with open(args.csv, encoding="utf-8") as f:
        header = f.readline().rstrip("\n").split(",")
    idx = {c: header.index(c) for c in header}
    rows = list(csv.reader(open(args.csv, encoding="utf-8")))
    header, data = rows[0], rows[1:]

    stamp2br = mapa_stamp_branch(repo)
    mudancas = []
    for r in data:
        if r[idx["erro"]] != "0":
            continue
        stamp = r[idx["timestamp"]]
        info = stamp2br.get(stamp)
        if not info:
            print(f"  [aviso] sem branch para {stamp} ({r[idx['feature']]}/{r[idx['branch']]}/r{r[idx['repeticao']]})")
            continue
        br, base_branch = info
        base_branch = base_branch or r[idx["branch"]]
        rng = f"{base_branch}...{br}"
        f_, a_, rr_ = numstat(repo, rng)
        rem_old = removidas_lado_antigo(repo, rng)
        jl = achar_jsonl(raw, stamp)
        ctx = contexto_lido(jl) if jl else {}
        total_ctx = sum(len(s) for s in ctx.values())
        usadas = sum(len(ctx[a] & rem_old.get(a, set())) for a in ctx)
        dens = round(1 - usadas / total_ctx, 4) if total_ctx > 0 else ""
        novo = {"arquivos_alterados": str(f_), "linhas_add": str(a_), "linhas_rem": str(rr_),
                "linhas_contexto_alteradas": str(usadas), "densidade_ruido": str(dens)}
        antigo = {c: r[idx[c]] for c in COLS}
        difs = {c: (antigo[c], novo[c]) for c in COLS if antigo[c] != novo[c]}
        if difs:
            mudancas.append((r[idx["feature"]], r[idx["modelo"]], r[idx["branch"]], r[idx["repeticao"]], difs))
        for c in COLS:
            r[idx[c]] = novo[c]

    print(f">> Linhas com alteracao: {len(mudancas)}")
    for feat, model, branch, rep, difs in mudancas:
        campos = "; ".join(f"{c}: {o}->{n}" for c, (o, n) in difs.items())
        print(f"  {feat:8s} {branch:20s} r{rep} {model:26s} | {campos}")

    if args.write:
        if args.backup and not os.path.exists(args.backup):
            import shutil; shutil.copyfile(args.csv, args.backup)
            print(f">> Backup criado: {args.backup}")
        with open(args.csv, "w", encoding="utf-8", newline="") as f:
            w = csv.writer(f, lineterminator="\n")
            w.writerow(header); w.writerows(data)
        print(f">> resultados.csv atualizado ({len(data)} linhas).")
    else:
        print(">> (dry-run) nada foi escrito. Use --write para aplicar.")

if __name__ == "__main__":
    main()
