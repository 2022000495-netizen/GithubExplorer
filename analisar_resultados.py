#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
analisar_resultados.py — lê o resultados.csv do experimento e gera:
  - resumo_agregado.csv       (média e desvio por feature × modelo × branch)
  - comparativo_clean.csv      (com vs sem Clean Architecture, com % de redução)
  - graficos/*.png             (barras comparativas por feature, modelo e branch)
  - um resumo no terminal

Uso:
  python3 analisar_resultados.py --csv resultados.csv --outdir analise
Requisitos: python3 e matplotlib (pip install matplotlib).
"""
import csv, os, sys, argparse, statistics

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
except ImportError:
    print("ERRO: matplotlib nao instalado. Rode: pip install matplotlib")
    sys.exit(1)

BRANCH_LABEL = {"dev": "Com Clean Arch.", "project-without-ddd": "Sem Clean Arch."}
BRANCH_ORDER = ["dev", "project-without-ddd"]         # com, sem
FEATURE_ORDER = ["pequena", "media", "grande"]
CORES = {"dev": "#3b78c3", "project-without-ddd": "#e08a3c"}

METRICAS = [
    ("total_tokens", "Tokens totais"),
    ("input_tokens", "Tokens de entrada"),
    ("output_tokens", "Tokens de saída"),
    ("custo_usd", "Custo (US$)"),
    ("num_interacoes", "Interações"),
    ("densidade_ruido", "Densidade de ruído"),
]
GRAFICOS = ["total_tokens", "custo_usd", "densidade_ruido", "num_interacoes"]

def num(v):
    if v is None or v == "":
        return None
    try:
        return float(v)
    except ValueError:
        return None

def ler(csv_path):
    linhas = []
    with open(csv_path, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            linhas.append(r)
    return linhas

def mean_std(vals):
    vals = [v for v in vals if v is not None]
    if not vals:
        return None, None, 0
    m = statistics.mean(vals)
    s = statistics.stdev(vals) if len(vals) > 1 else 0.0
    return m, s, len(vals)

def ordenar(chaves, ordem):
    conhecidos = [k for k in ordem if k in chaves]
    resto = sorted(k for k in chaves if k not in ordem)
    return conhecidos + resto

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default="resultados.csv")
    ap.add_argument("--outdir", default="analise")
    args = ap.parse_args()

    if not os.path.exists(args.csv):
        print(f"ERRO: arquivo nao encontrado: {args.csv}"); sys.exit(1)
    os.makedirs(args.outdir, exist_ok=True)
    gdir = os.path.join(args.outdir, "graficos"); os.makedirs(gdir, exist_ok=True)

    linhas = ler(args.csv)
    total = len(linhas)
    erros = sum(1 for r in linhas if str(r.get("erro", "0")).strip() == "1")
    validas = [r for r in linhas if str(r.get("erro", "0")).strip() != "1"]
    print(f">> {total} execucoes lidas | {len(validas)} validas | {erros} com erro (ignoradas).")
    if not validas:
        print("Sem execucoes validas para analisar."); sys.exit(0)

    # agrega: (feature, modelo, branch) -> metrica -> lista de valores
    agg = {}
    modelos, features, branches = set(), set(), set()
    for r in validas:
        feat = r.get("feature", ""); model = r.get("modelo", ""); br = r.get("branch", "")
        modelos.add(model); features.add(feat); branches.add(br)
        d = agg.setdefault((feat, model, br), {})
        for m, _ in METRICAS + [("duracao_s", ""), ("linhas_add", ""), ("linhas_rem", ""), ("arquivos_alterados", "")]:
            d.setdefault(m, []).append(num(r.get(m)))

    features = ordenar(features, FEATURE_ORDER)
    branches = ordenar(branches, BRANCH_ORDER)
    modelos = sorted(modelos)

    # ---------- resumo_agregado.csv ----------
    campos_metr = [m for m, _ in METRICAS] + ["duracao_s", "linhas_add", "linhas_rem", "arquivos_alterados"]
    resumo_path = os.path.join(args.outdir, "resumo_agregado.csv")
    with open(resumo_path, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        cab = ["feature", "modelo", "branch", "n"]
        for m in campos_metr:
            cab += [f"{m}_media", f"{m}_desvio"]
        w.writerow(cab)
        for feat in features:
            for model in modelos:
                for br in branches:
                    d = agg.get((feat, model, br))
                    if not d:
                        continue
                    n = mean_std(d.get("total_tokens", []))[2]
                    row = [feat, model, BRANCH_LABEL.get(br, br), n]
                    for m in campos_metr:
                        mm, ss, _ = mean_std(d.get(m, []))
                        row += ["" if mm is None else round(mm, 4), "" if ss is None else round(ss, 4)]
                    w.writerow(row)
    print(f">> Resumo agregado: {resumo_path}")

    # ---------- comparativo_clean.csv (com vs sem) ----------
    comp_path = os.path.join(args.outdir, "comparativo_clean.csv")
    linhas_console = []
    with open(comp_path, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["feature", "modelo",
                    "tokens_com", "tokens_sem", "reducao_tokens_%",
                    "custo_com", "custo_sem", "reducao_custo_%",
                    "densidade_com", "densidade_sem"])
        for feat in features:
            for model in modelos:
                com = agg.get((feat, model, "dev"))
                sem = agg.get((feat, model, "project-without-ddd"))
                if not com or not sem:
                    continue
                tc = mean_std(com.get("total_tokens", []))[0]
                ts = mean_std(sem.get("total_tokens", []))[0]
                cc = mean_std(com.get("custo_usd", []))[0]
                cs = mean_std(sem.get("custo_usd", []))[0]
                dc = mean_std(com.get("densidade_ruido", []))[0]
                ds = mean_std(sem.get("densidade_ruido", []))[0]
                red_tok = ((ts - tc) / ts * 100) if (ts and tc is not None) else None
                red_cus = ((cs - cc) / cs * 100) if (cs and cc is not None) else None
                w.writerow([feat, model,
                            _r(tc), _r(ts), _r(red_tok, 1),
                            _r(cc, 6), _r(cs, 6), _r(red_cus, 1),
                            _r(dc, 4), _r(ds, 4)])
                if red_tok is not None:
                    sinal = "reducao" if red_tok > 0 else "AUMENTO"
                    linhas_console.append(f"  {feat:8s} | {model:28s} | tokens com={_r(tc)} sem={_r(ts)} -> {sinal} de {abs(red_tok):.1f}%")
    print(f">> Comparativo com vs sem Clean Arch.: {comp_path}")

    if linhas_console:
        print("\n== Redução de tokens (Clean Arch. vs sem) por feature/modelo ==")
        print("\n".join(linhas_console))

    # ---------- graficos ----------
    for metric in GRAFICOS:
        label = dict(METRICAS).get(metric, metric)
        ncols = max(1, len(modelos))
        fig, axes = plt.subplots(1, ncols, figsize=(4.6 * ncols, 4.2), squeeze=False)
        for j, model in enumerate(modelos):
            ax = axes[0][j]
            x = list(range(len(features)))
            w = 0.38
            for k, br in enumerate(branches):
                medias, desvios = [], []
                for feat in features:
                    d = agg.get((feat, model, br), {})
                    mm, ss, _ = mean_std(d.get(metric, []))
                    medias.append(mm if mm is not None else 0)
                    desvios.append(ss if ss is not None else 0)
                pos = [xi + (k - (len(branches) - 1) / 2) * w for xi in x]
                ax.bar(pos, medias, w, yerr=desvios, capsize=3,
                       label=BRANCH_LABEL.get(br, br), color=CORES.get(br))
            ax.set_xticks(x)
            ax.set_xticklabels([feat.capitalize() for feat in features], fontsize=9)
            ax.set_title(model, fontsize=9)
            ax.set_ylabel(label, fontsize=9)
            ax.spines[["top", "right"]].set_visible(False)
            ax.legend(fontsize=8, frameon=False)
        fig.suptitle(f"{label} por feature (com vs sem Clean Architecture)", fontsize=12)
        fig.tight_layout(rect=[0, 0, 1, 0.95])
        out = os.path.join(gdir, f"{metric}.png")
        fig.savefig(out, dpi=150, facecolor="white")
        plt.close(fig)
        print(f">> Grafico: {out}")

    print("\n>> Analise concluida. Traga os arquivos de", args.outdir, "que eu monto as tabelas/figuras do TCC.")

def _r(v, casas=1):
    return "" if v is None else round(v, casas)

if __name__ == "__main__":
    main()
