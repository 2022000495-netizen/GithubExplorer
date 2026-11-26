#!/usr/bin/env bash
#
# run_experiment.sh
# Executa os prompts do experimento (pequena/media/grande) em cada branch do
# GithubExplorer, com contexto ISOLADO por rodada (git worktree novo), usando
# o Claude Code em modo headless. Coleta tokens de entrada/saida, custo, numero
# de interacoes e linhas alteradas em um CSV.
#
# Requisitos: git, python3 e Claude Code (comando `claude`) autenticado.
#             yarn ou npm, para o pre-install de dependencias (ligado por padrao,
#             instala node_modules 1x por branch e reaproveita, reduzindo variancia de tokens).
#
# Modelos do experimento (IDs completos, para reprodutibilidade):
#   Simples (Haiku)  : claude-haiku-4-5-20251001
#   Médio   (Sonnet) : claude-sonnet-5
#   Robusto (Fable)  : claude-fable-5
#
# Exemplos:
#   ./run_experiment.sh --repo /caminho/para/GithubExplorer --reps 3   # usa os 3 IDs padrao + pre-install
#   ./run_experiment.sh --repo /caminho/para/GithubExplorer --models "claude-haiku-4-5-20251001" \
#        --features "pequena,grande" --branches "dev" --reps 5 --out resultados.csv
#   ./run_experiment.sh --repo /caminho/para/GithubExplorer --no-preinstall   # deixa o agente instalar deps
#
set -euo pipefail

# ---------- Padroes ----------
REPO=""
MODELS="claude-haiku-4-5-20251001,claude-sonnet-5,claude-fable-5"  # IDs completos: simples, medio, robusto
FEATURES="pequena,media,grande"       # subconjunto de: pequena,media,grande
BRANCHES="dev,project-without-ddd"    # dev = com Clean Arch ; project-without-ddd = sem
REPS=3
OUT="resultados.csv"
PREINSTALL=1                          # 1 = pre-instala dependencias no worktree (reduz variancia de tokens); use --no-preinstall para desligar
INSTALL_CMD=""                        # comando de instalacao (vazio = auto: yarn / npm ci / npm install)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPTS_DIR="$SCRIPT_DIR/prompts"

# ---------- Parse de argumentos ----------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)     REPO="$2"; shift 2;;
    --models)   MODELS="$2"; shift 2;;
    --features) FEATURES="$2"; shift 2;;
    --branches) BRANCHES="$2"; shift 2;;
    --reps)     REPS="$2"; shift 2;;
    --out)      OUT="$2"; shift 2;;
    --preinstall)    PREINSTALL=1; shift;;
    --no-preinstall) PREINSTALL=0; shift;;
    --install-cmd)   INSTALL_CMD="$2"; shift 2;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0;;
    *) echo "Argumento desconhecido: $1"; exit 1;;
  esac
done

[[ -z "$REPO" ]] && { echo "ERRO: informe --repo <caminho do GithubExplorer>"; exit 1; }
command -v claude >/dev/null 2>&1 || { echo "ERRO: comando 'claude' (Claude Code) nao encontrado no PATH."; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "ERRO: python3 nao encontrado."; exit 1; }
REPO="$(cd "$REPO" && pwd)"

# ---------- Pre-instalacao de dependencias (reduz variancia de tokens) ----------
# Instala node_modules UMA VEZ por branch em um cache e reaproveita via symlink em
# cada worktree, para que o agente nao gaste turnos/tokens instalando dependencias.
CACHE_DIR="$SCRIPT_DIR/.deps-cache"

detectar_install() {  # $1 = diretorio com package.json/lockfile
  local dir="$1"
  if [[ -n "$INSTALL_CMD" ]]; then echo "$INSTALL_CMD"; return; fi
  if [[ -f "$dir/yarn.lock" ]] && command -v yarn >/dev/null 2>&1; then
    echo "yarn install --frozen-lockfile"
  elif [[ -f "$dir/package-lock.json" ]] && command -v npm >/dev/null 2>&1; then
    echo "npm ci --no-audit --no-fund --legacy-peer-deps"
  elif command -v npm >/dev/null 2>&1; then
    echo "npm install --no-audit --no-fund --legacy-peer-deps"
  else
    echo ""
  fi
}

ensure_deps() {  # $1 = branch ; imprime no stdout o caminho do node_modules (ou vazio)
  local branch="$1"
  local cache="$CACHE_DIR/${branch//\//_}"
  if [[ -d "$cache/node_modules" ]]; then echo "$cache/node_modules"; return 0; fi
  mkdir -p "$cache"
  git -C "$REPO" show "$branch:package.json" > "$cache/package.json" 2>/dev/null || { echo ""; return 1; }
  git -C "$REPO" cat-file -e "$branch:yarn.lock" 2>/dev/null && git -C "$REPO" show "$branch:yarn.lock" > "$cache/yarn.lock" 2>/dev/null || true
  git -C "$REPO" cat-file -e "$branch:package-lock.json" 2>/dev/null && git -C "$REPO" show "$branch:package-lock.json" > "$cache/package-lock.json" 2>/dev/null || true
  git -C "$REPO" cat-file -e "$branch:.npmrc" 2>/dev/null && git -C "$REPO" show "$branch:.npmrc" > "$cache/.npmrc" 2>/dev/null || true
  local cmd; cmd="$(detectar_install "$cache")"
  [[ -z "$cmd" ]] && { echo ""; return 1; }
  echo ">> Pre-instalando dependencias de '$branch' (uma vez, em cache): $cmd" >&2
  if ! ( cd "$cache" && eval "$cmd" ) > "$cache/install.log" 2>&1; then
    echo ">> AVISO: pre-install de '$branch' falhou (veja $cache/install.log). A execucao segue; o agente instalara as deps." >&2
    echo ""; return 1
  fi
  echo "$cache/node_modules"
}

# O cabecalho do CSV e criado automaticamente por analyze_run.py na primeira gravacao.
ANALYZER="$SCRIPT_DIR/analyze_run.py"
[[ -f "$ANALYZER" ]] || { echo "ERRO: analyze_run.py nao encontrado em $SCRIPT_DIR"; exit 1; }

IFS=',' read -r -a MODEL_ARR   <<< "$MODELS"
IFS=',' read -r -a FEAT_ARR    <<< "$FEATURES"
IFS=',' read -r -a BRANCH_ARR  <<< "$BRANCHES"

RAW_DIR="$SCRIPT_DIR/execucoes-brutas"
mkdir -p "$RAW_DIR"

total=$(( ${#MODEL_ARR[@]} * ${#FEAT_ARR[@]} * ${#BRANCH_ARR[@]} * REPS ))
i=0
echo ">> $total execucoes planejadas. Resultados em: $OUT"

for model in "${MODEL_ARR[@]}"; do
  for feat in "${FEAT_ARR[@]}"; do
    PROMPT_FILE="$PROMPTS_DIR/${feat}.txt"
    [[ -f "$PROMPT_FILE" ]] || { echo "AVISO: prompt '$feat' nao encontrado ($PROMPT_FILE), pulando."; continue; }
    PROMPT="$(cat "$PROMPT_FILE")"
    for branch in "${BRANCH_ARR[@]}"; do
      for rep in $(seq 1 "$REPS"); do
        i=$((i+1))
        stamp="$(date +%Y%m%dT%H%M%S)"
        tag="${model//\//-}_${branch}_${feat}_r${rep}_${stamp}"
        WT="$(mktemp -d "${TMPDIR:-/tmp}/exp_${tag}.XXXX")"
        echo "[$i/$total] modelo=$model branch=$branch feature=$feat rep=$rep"

        # Worktree isolado a partir da branch (estado limpo por rodada)
        git -C "$REPO" worktree add --detach --quiet "$WT" "$branch"

        # Reaproveita node_modules pre-instalado (evita o agente gastar tokens instalando deps)
        if [[ "$PREINSTALL" -eq 1 ]]; then
          NM="$(ensure_deps "$branch" || true)"
          if [[ -n "$NM" && -d "$NM" ]]; then
            ln -s "$NM" "$WT/node_modules" 2>/dev/null || cp -R "$NM" "$WT/node_modules"
          else
            echo "    (aviso: pre-install indisponivel para '$branch'; o agente pode instalar deps)"
          fi
        fi

        JSONL_OUT="$RAW_DIR/${tag}.jsonl"
        DIFF_OUT="$RAW_DIR/${tag}.diff"
        err=0
        # Execucao headless em stream-json: permite extrair as linhas lidas como
        # contexto (ferramenta Read) e as metricas finais (tokens, custo, etc.).
        ( cd "$WT" && claude -p "$PROMPT" \
              --model "$model" \
              --output-format stream-json --verbose \
              --dangerously-skip-permissions ) > "$JSONL_OUT" 2> "$RAW_DIR/${tag}.err" || err=1

        # Remove o symlink de node_modules para nao entrar no diff nem no commit da branch
        [[ -L "$WT/node_modules" ]] && rm -f "$WT/node_modules" 2>/dev/null || true

        # Diff final (lado antigo, -U0), excluindo lockfiles e artefatos gerados
        git -C "$WT" add -A >/dev/null 2>&1 || true
        git -C "$WT" diff --cached -U0 -- . \
            ':!*.lock' ':!*.lockb' ':!*-lock.json' ':!pnpm-lock.yaml' \
            ':!node_modules' ':!node_modules/*' \
            ':!*/dist/*' ':!*/coverage/*' ':!*/build/*' > "$DIFF_OUT" 2>/dev/null || true

        # Analisa metricas + densidade de ruido e grava uma linha no CSV
        python3 "$ANALYZER" "$JSONL_OUT" "$DIFF_OUT" "$WT" "$OUT" \
            "$stamp" "$model" "$branch" "$feat" "$rep" "$err"

        # Em execucoes bem-sucedidas, preserva o resultado em uma branch LOCAL
        # (feature + modelo + base + repeticao) com um commit local. Nunca faz push.
        if [[ "$err" -eq 0 ]]; then
          safe_model="${model//[^A-Za-z0-9._-]/-}"
          BR="exp/${feat}/${safe_model}/${branch}-r${rep}"
          if git -C "$WT" rev-parse --verify --quiet "refs/heads/$BR" >/dev/null; then
            BR="${BR}-${stamp}"   # evita colisao se a mesma combinacao for repetida
          fi
          if ( cd "$WT" \
                 && git checkout -q -b "$BR" \
                 && git add -A \
                 && git -c user.name='experimento-tokens' -c user.email='experimento@local' \
                        commit -q --allow-empty \
                        -m "exp: ${feat} | ${model} | base=${branch} | rep=${rep} | ${stamp}" ); then
            echo "    branch local criada: $BR  (git checkout \"$BR\" para inspecionar)"
          else
            echo "    (aviso: nao foi possivel criar a branch $BR)"
          fi
        fi

        # Descarta o worktree (a branch criada permanece no repositorio)
        git -C "$REPO" worktree remove --force "$WT" >/dev/null 2>&1 || rm -rf "$WT"
      done
    done
  done
done

git -C "$REPO" worktree prune >/dev/null 2>&1 || true

# ---------- Reconciliacao final: fonte de verdade das colunas de diff ----------
# As colunas arquivos_alterados, linhas_add, linhas_rem, linhas_contexto_alteradas e
# densidade_ruido sao RECOMPUTADAS aqui a partir do `git diff` de cada branch criada
# (base...branch), cruzado com o contexto lido no transcript. Isso substitui a captura
# por-execucao (que podia falhar e gerar zeros) e deixa as metricas auditaveis por
# terceiros: basta o repositorio com as branches exp/* e a pasta execucoes-brutas.
RECON="$SCRIPT_DIR/reconciliar_diffs.py"
if [[ -f "$RECON" ]]; then
  echo ">> Reconciliando colunas de diff a partir das branches criadas..."
  python3 "$RECON" --csv "$OUT" --repo "$REPO" --raw "$RAW_DIR" --write || \
    echo "   (aviso: reconciliacao falhou; verifique manualmente com reconciliar_diffs.py)"
fi

echo ">> Concluido. CSV: $OUT | JSONs brutos: $RAW_DIR"
