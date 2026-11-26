#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
estatistica.py — tratamento estatístico do experimento de consumo de tokens.

Compara a versão COM Clean Architecture (branch dev) contra a versão SEM
(branch project-without-ddd), para as métricas total_tokens, custo_usd e
densidade_ruido. NUNCA modifica o resultados.csv (apenas leitura).

Para cada célula (feature x modelo) com n repetições em cada lado calcula:
    - médias, diferença absoluta e diferença percentual (com em relação a sem);
    - teste t de Welch (variâncias desiguais);
    - Mann-Whitney U (não paramétrico);
    - tamanho de efeito Cohen's d.
E, agregando as 9 células (pareando com vs sem por feature x modelo):
    - teste dos sinais (binomial) sobre a direção da diferença;
    - Wilcoxon dos postos sinalizados sobre as diferenças das médias.

Uso:
  python3 estatistica.py --csv /caminho/resultados.csv \
          [--out /caminho/estatistica_pvalores.csv] [--alpha 0.05]

Saída no terminal (resumo legível) e, se --out for informado, um CSV com uma
linha por (métrica x célula) mais linhas globais (feature/modelo = GLOBAL).
"""
import argparse
import csv
import math
from collections import defaultdict

from scipy import stats

METRICAS = ["total_tokens", "custo_usd", "densidade_ruido"]
COM = "dev"                     # com Clean Architecture
SEM = "project-without-ddd"     # sem Clean Architecture
FEATURES = ["pequena", "media", "grande"]


def ler(csv_path):
    """Retorna dados[(feature, modelo)][branch][metrica] = [valores]."""
    dados = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    with open(csv_path, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r.get("erro", "0") != "0":
                continue
            chave = (r["feature"], r["modelo"])
            for m in METRICAS:
                v = r.get(m, "")
                if v == "" or v is None:
                    continue
                try:
                    dados[chave][r["branch"]][m].append(float(v))
                except ValueError:
                    pass
    return dados


def cohen_d(a, b):
    """Cohen's d com desvio-padrão combinado (amostral)."""
    na, nb = len(a), len(b)
    if na < 2 or nb < 2:
        return float("nan")
    va, vb = stats.tvar(a), stats.tvar(b)
    sp = math.sqrt(((na - 1) * va + (nb - 1) * vb) / (na + nb - 2))
    if sp == 0:
        return float("nan")
    return (stats.tmean(a) - stats.tmean(b)) / sp


def analisar(dados, alpha):
    linhas = []                      # linhas para o CSV/terminal (por célula)
    globais = defaultdict(list)      # metrica -> lista de (media_com, media_sem)

    for m in METRICAS:
        for feat in FEATURES:
            for chave in sorted(k for k in dados if k[0] == feat):
                modelo = chave[1]
                com = dados[chave][COM][m]
                sem = dados[chave][SEM][m]
                if not com or not sem:
                    continue
                mc, ms = stats.tmean(com), stats.tmean(sem)
                dif = mc - ms
                difpct = (dif / ms * 100) if ms else float("nan")
                # Welch t-test
                try:
                    tp = stats.ttest_ind(com, sem, equal_var=False).pvalue
                except Exception:
                    tp = float("nan")
                # Mann-Whitney U (bilateral)
                try:
                    mw = stats.mannwhitneyu(com, sem, alternative="two-sided").pvalue
                except Exception:
                    mw = float("nan")
                d = cohen_d(com, sem)
                linhas.append({
                    "metrica": m, "feature": feat, "modelo": modelo,
                    "n_com": len(com), "n_sem": len(sem),
                    "media_com": round(mc, 4), "media_sem": round(ms, 4),
                    "dif": round(dif, 4), "dif_pct": round(difpct, 2),
                    "welch_p": round(tp, 4), "mw_p": round(mw, 4),
                    "cohen_d": round(d, 3),
                })
                globais[m].append((mc, ms))
    return linhas, globais


def testes_globais(globais, alpha):
    """Testes agregados sobre as 9 células (com vs sem por feature x modelo)."""
    out = []
    for m, pares in globais.items():
        difs = [c - s for c, s in pares]
        n = len(difs)
        pos = sum(1 for x in difs if x > 0)   # células em que com > sem
        neg = sum(1 for x in difs if x < 0)
        # teste dos sinais (binomial bilateral), ignora empates
        k = max(pos, neg)
        nt = pos + neg
        sign_p = stats.binomtest(k, nt, 0.5).pvalue if nt > 0 else float("nan")
        # Wilcoxon dos postos sinalizados sobre as diferenças
        try:
            wil_p = stats.wilcoxon(difs).pvalue
        except Exception:
            wil_p = float("nan")
        out.append({
            "metrica": m, "n_celulas": n,
            "celulas_com_maior": pos, "celulas_sem_maior": neg,
            "dif_media": round(sum(difs) / n, 4) if n else float("nan"),
            "sign_p": round(sign_p, 4), "wilcoxon_p": round(wil_p, 4),
            "significativo_5pct": (sign_p < alpha) if not math.isnan(sign_p) else False,
        })
    return out


def imprimir(linhas, glob, alpha):
    rot = {"total_tokens": "TOKENS TOTAIS", "custo_usd": "CUSTO (US$)",
           "densidade_ruido": "DENSIDADE DE RUÍDO"}
    for m in METRICAS:
        print("\n" + "=" * 78)
        print(rot.get(m, m))
        print("=" * 78)
        print(f"{'feature':8s} {'modelo':26s} {'com':>10s} {'sem':>10s} "
              f"{'dif%':>8s} {'Welch_p':>8s} {'MW_p':>6s} {'d':>7s}")
        for r in [x for x in linhas if x["metrica"] == m]:
            sig = "*" if (not math.isnan(r["welch_p"]) and r["welch_p"] < alpha) else " "
            print(f"{r['feature']:8s} {r['modelo']:26s} "
                  f"{r['media_com']:>10.4g} {r['media_sem']:>10.4g} "
                  f"{r['dif_pct']:>7.1f}% {r['welch_p']:>7.4f}{sig} "
                  f"{r['mw_p']:>6.3f} {r['cohen_d']:>7.2f}")
        g = next((x for x in glob if x["metrica"] == m), None)
        if g:
            print(f"  GLOBAL (9 células): com>sem em {g['celulas_com_maior']}/"
                  f"{g['celulas_com_maior'] + g['celulas_sem_maior']}  |  "
                  f"sign test p={g['sign_p']:.4f}  Wilcoxon p={g['wilcoxon_p']:.4f}  |  "
                  f"dif média (com-sem)={g['dif_media']:.4g}")
    print("\n* = diferença significativa no teste t de Welch (p < %.2f)." % alpha)
    print("Obs.: com n=3 por lado, Mann-Whitney não atinge p<0,05 (piso 0,10);")
    print("a evidência robusta vem dos testes globais (sign/Wilcoxon).")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True)
    ap.add_argument("--out", default=None, help="CSV de saída com os p-valores")
    ap.add_argument("--alpha", type=float, default=0.05)
    args = ap.parse_args()

    dados = ler(args.csv)
    linhas, globais = analisar(dados, args.alpha)
    glob = testes_globais(globais, args.alpha)
    imprimir(linhas, glob, args.alpha)

    if args.out:
        cols = ["metrica", "feature", "modelo", "n_com", "n_sem",
                "media_com", "media_sem", "dif", "dif_pct",
                "welch_p", "mw_p", "cohen_d"]
        with open(args.out, "w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=cols, lineterminator="\n")
            w.writeheader()
            w.writerows(linhas)
            # linhas globais (feature/modelo = GLOBAL) reaproveitando as colunas
            for g in glob:
                w.writerow({
                    "metrica": g["metrica"], "feature": "GLOBAL", "modelo": "GLOBAL",
                    "n_com": g["celulas_com_maior"], "n_sem": g["celulas_sem_maior"],
                    "media_com": "", "media_sem": "", "dif": g["dif_media"], "dif_pct": "",
                    "welch_p": g["sign_p"], "mw_p": g["wilcoxon_p"], "cohen_d": "",
                })
        print(f"\n>> CSV salvo em: {args.out}")


if __name__ == "__main__":
    main()
