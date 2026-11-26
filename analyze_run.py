#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
analyze_run.py — analisa uma execução do experimento.

Lê:
  1) o transcript stream-json (JSONL) do Claude Code, do qual extrai
     as métricas finais (tokens, custo, interações, duração) e as linhas
     de código submetidas como contexto (ferramenta Read);
  2) o diff final (git diff --cached -U0) do worktree, do qual extrai as
     linhas alteradas.

Calcula a densidade de ruído no contexto conforme definida no TCC:
    densidade = (linhas submetidas que NÃO foram alteradas) / (total submetido)
onde "submetidas" = linhas lidas como contexto (Read) e "alteradas" = linhas
do lado antigo tocadas no diff final (interseção por número de linha e arquivo).

Uso:
  python3 analyze_run.py <jsonl> <diff> <wt_root> <csv> <stamp> <modelo> <branch> <feature> <rep> <erro>
"""
import json, re, sys, os

def carregar_jsonl(path):
    eventos = []
    try:
        with open(path, encoding="utf-8") as f:
            for linha in f:
                linha = linha.strip()
                if not linha:
                    continue
                try:
                    eventos.append(json.loads(linha))
                except json.JSONDecodeError:
                    pass
    except FileNotFoundError:
        pass
    return eventos

def texto_do_conteudo(conteudo):
    """tool_result.content pode ser string ou lista de blocos {type,text}."""
    if isinstance(conteudo, str):
        return conteudo
    if isinstance(conteudo, list):
        partes = []
        for b in conteudo:
            if isinstance(b, dict):
                partes.append(b.get("text") or b.get("content") or "")
            else:
                partes.append(str(b))
        return "\n".join(partes)
    return ""

RE_LINHA = re.compile(r"^\s*(\d+)(?:→|\t|\|)")  # prefixos de número de linha (Read)

def linhas_numeradas(texto):
    nums = set()
    for l in texto.splitlines():
        m = RE_LINHA.match(l)
        if m:
            nums.add(int(m.group(1)))
    return nums

def relativizar(p, base):
    """Torna o caminho absoluto p relativo a base, resolvendo symlinks (ex.: /var -> /private/var no macOS)."""
    try:
        rp = os.path.realpath(p)
        rb = os.path.realpath(base)
        rel = os.path.relpath(rp, rb)
        if not rel.startswith(".."):
            return rel
    except Exception:
        pass
    # fallback: tenta cortar a partir de "/src/" (raiz típica do projeto)
    marcador = os.sep + "src" + os.sep
    i = p.find(marcador)
    return p[i+1:] if i >= 0 else os.path.basename(p)

def parse_metricas_e_contexto(eventos, wt_root):
    metr = {"input_tokens":0,"output_tokens":0,"cache_read":0,"cache_creation":0,
            "custo":0.0,"turns":0,"dur":0.0,"erro":0}
    read_files = {}      # id do tool_use Read -> caminho absoluto lido
    read_nums  = {}      # id -> conjunto de números de linha lidos
    init_cwd = None      # diretório de trabalho relatado pelo agente (base confiável)

    for ev in eventos:
        t = ev.get("type")
        if t == "system" and ev.get("subtype") == "init" and ev.get("cwd"):
            init_cwd = ev.get("cwd")
        # tool_use dentro de mensagens do assistente
        msg = ev.get("message") if isinstance(ev.get("message"), dict) else None
        if msg and isinstance(msg.get("content"), list):
            for bloco in msg["content"]:
                if not isinstance(bloco, dict):
                    continue
                if bloco.get("type") == "tool_use" and bloco.get("name") == "Read":
                    fid = bloco.get("id")
                    fp = (bloco.get("input") or {}).get("file_path")
                    if fid and fp:
                        read_files[fid] = fp
                if bloco.get("type") == "tool_result":
                    fid = bloco.get("tool_use_id")
                    if fid in read_files:
                        nums = linhas_numeradas(texto_do_conteudo(bloco.get("content")))
                        if nums:
                            read_nums.setdefault(fid, set()).update(nums)
        # evento final de resultado
        if t == "result":
            u = ev.get("usage") or {}
            metr["input_tokens"]   = u.get("input_tokens", 0) or 0
            metr["output_tokens"]  = u.get("output_tokens", 0) or 0
            metr["cache_read"]     = u.get("cache_read_input_tokens", 0) or 0
            metr["cache_creation"] = u.get("cache_creation_input_tokens", 0) or 0
            metr["custo"]  = ev.get("total_cost_usd", 0) or 0
            metr["turns"]  = ev.get("num_turns", 0) or 0
            metr["dur"]    = round((ev.get("duration_ms", 0) or 0)/1000.0, 1)
            if ev.get("is_error"):
                metr["erro"] = 1
    base = init_cwd or wt_root
    submetidas = {}
    for fid, fp in read_files.items():
        nums = read_nums.get(fid)
        if not nums:
            continue
        submetidas.setdefault(relativizar(fp, base), set()).update(nums)
    return metr, submetidas

def ignorar_arquivo(path):
    """Ignora lockfiles e artefatos gerados (não são código da feature)."""
    base = os.path.basename(path)
    if base == "node_modules":
        return True
    if base in ("yarn.lock", "package-lock.json", "pnpm-lock.yaml", "bun.lockb"):
        return True
    if base.endswith(".lock") or base.endswith(".lockb") or base.endswith("-lock.json"):
        return True
    for d in ("/dist/", "/build/", "/coverage/", "/node_modules/", "/.next/"):
        if d in ("/" + path + "/"):
            return True
    return False

def parse_diff(path):
    """Retorna: arquivo -> conjunto de números de linha (lado antigo) removidas/alteradas,
    além de totais de arquivos e linhas adicionadas/removidas. Ignora lockfiles/artefatos."""
    alteradas = {}
    add = rem = 0
    arquivos = set()
    arquivo = None
    old_ln = None
    skip = False
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            for l in f:
                if l.startswith("+++ b/") or l.startswith("+++ "):
                    arquivo = (l[6:] if l.startswith("+++ b/") else l[4:]).rstrip("\n")
                    skip = ignorar_arquivo(arquivo)
                    if not skip:
                        arquivos.add(arquivo)
                elif l.startswith("@@"):
                    m = re.search(r"@@ -(\d+)(?:,(\d+))? \+", l)
                    old_ln = int(m.group(1)) if m else None
                elif l.startswith("-") and not l.startswith("---"):
                    if skip:
                        continue
                    rem += 1
                    if arquivo is not None and old_ln is not None:
                        alteradas.setdefault(arquivo, set()).add(old_ln)
                        old_ln += 1
                elif l.startswith("+") and not l.startswith("+++"):
                    if not skip:
                        add += 1
    except FileNotFoundError:
        pass
    return alteradas, len(arquivos), add, rem

def main():
    (jsonl, diff, wt_root, csv, stamp, modelo, branch, feat, rep, erro) = sys.argv[1:11]
    eventos = carregar_jsonl(jsonl)
    metr, submetidas = parse_metricas_e_contexto(eventos, wt_root)
    alteradas, arq, add, rem = parse_diff(diff)
    erro_final = 1 if str(erro) == "1" else metr["erro"]

    total_ctx = sum(len(s) for s in submetidas.values())
    usadas = 0
    for arqv, linhas in submetidas.items():
        if arqv in alteradas:
            usadas += len(linhas & alteradas[arqv])
    if total_ctx > 0:
        densidade = round(1 - (usadas / total_ctx), 4)
    else:
        densidade = ""  # não foi possível estimar (sem leituras numeradas)

    total_tokens = (metr["input_tokens"] or 0) + (metr["output_tokens"] or 0)
    custo = metr["custo"]
    custo_str = f"{custo:.6f}" if isinstance(custo, (int, float)) else str(custo)

    row = [stamp, modelo, branch, feat, rep,
           metr["input_tokens"], metr["output_tokens"], metr["cache_read"], metr["cache_creation"],
           total_tokens, custo_str, metr["turns"], metr["dur"],
           arq, add, rem, total_ctx, usadas, densidade, erro_final]

    novo = not os.path.exists(csv)
    with open(csv, "a", encoding="utf-8") as f:
        if novo:
            f.write("timestamp,modelo,branch,feature,repeticao,input_tokens,output_tokens,"
                    "cache_read,cache_creation,total_tokens,custo_usd,num_interacoes,duracao_s,"
                    "arquivos_alterados,linhas_add,linhas_rem,linhas_contexto,"
                    "linhas_contexto_alteradas,densidade_ruido,erro\n")
        f.write(",".join(str(x) for x in row) + "\n")

    print(f"    -> in={metr['input_tokens']} out={metr['output_tokens']} "
          f"custo=US$ {custo_str} interacoes={metr['turns']} "
          f"contexto={total_ctx} linhas usadas={usadas} densidade_ruido={densidade} erro={erro_final}")

if __name__ == "__main__":
    main()
