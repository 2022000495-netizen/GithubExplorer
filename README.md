# Experimento: arquitetura de software e consumo de tokens de LLMs

Material de replicação do Trabalho de Conclusão de Curso (TCC2) do curso de Tecnologia em
Sistemas para Internet do IFRS, Campus Porto Alegre: *Impacto da arquitetura de software no
consumo de tokens de LLMs: um estudo experimental comparativo em aplicações React desenvolvidas
com e sem Clean Architecture na migração de funcionalidades*.

O experimento pede a um agente de programação (Claude Code) que implemente as mesmas três
funcionalidades em duas variantes funcionalmente equivalentes da aplicação GithubExplorer e mede
tokens, custo, interações e a densidade de ruído no contexto.

## Como este repositório está organizado

| Branch | Conteúdo |
|---|---|
| `experimento-tcc2` (esta) | Scripts, prompts, dados brutos e resultados do experimento |
| `dev` | Aplicação COM Clean Architecture (base do experimento) |
| `project-without-ddd` | Aplicação SEM Clean Architecture (base do experimento) |
| `exp/<feature>/<modelo>/<base>-r<repetição>` | Solução produzida pelo agente em cada execução (55 branches) |

Cada branch `exp/...` parte de uma das duas bases e contém um commit cujo assunto registra a
funcionalidade, o modelo, a base, a repetição e o carimbo de data/hora da execução. Esse carimbo é
a chave que liga a branch à linha correspondente do `resultados.csv`.

Há 55 branches `exp/...` para 54 linhas de resultado: a branch
`exp/pequena/claude-haiku-4-5-20251001/dev-r1` (carimbo `20260910T165608`) vem de uma execução
piloto anterior à coleta definitiva e não entra nos resultados; a execução válida dessa combinação
está na branch de mesmo nome com sufixo de data/hora.

## Arquivos desta branch

- `run_experiment.sh`: executa o experimento (worktree isolado por rodada, Claude Code em modo
  não interativo, uma branch local por execução).
- `analyze_run.py`: extrai as métricas de uma execução a partir da transcrição e do diff.
- `reconciliar_diffs.py`: recalcula, a partir das branches, as colunas de diff e a densidade de ruído.
- `analisar_resultados.py`: gera as tabelas agregadas e os gráficos.
- `estatistica.py`: testes estatísticos (t de Welch, Mann-Whitney, d de Cohen, sinais e Wilcoxon).
- `prompts/`: os três pedidos feitos ao agente (`pequena.txt`, `media.txt`, `grande.txt`).
- `resultados.csv`: uma linha por execução válida (54). `resultados-bkp.csv` é a versão anterior à
  reconciliação das colunas de diff, mantida como trilha de auditoria.
- `estatistica_pvalores.csv`: saída do `estatistica.py`.
- `analise/`: `resumo_agregado.csv`, `comparativo_clean.csv` e os gráficos.
- `execucoes-brutas/`: transcrição (`.jsonl`) e diff (`.diff`) de cada execução válida.

## Requisitos

- `git`, `python3` (com `pip install -r requirements.txt`) e Node.js com `yarn` ou `npm`.
- Claude Code (`claude`) instalado e autenticado, apenas para executar o experimento de novo.

## Reproduzir a análise com os dados publicados

Não exige acesso a nenhum modelo. Clone o repositório com todas as branches e rode:

```bash
git clone https://github.com/2022000495-netizen/GithubExplorer.git
cd GithubExplorer
for b in $(git branch -r | grep -v HEAD | sed 's#origin/##'); do git branch --track "$b" "origin/$b" 2>/dev/null; done
git checkout experimento-tcc2

# 1) conferir que as colunas de diff e a densidade de ruído saem das branches (deve relatar 0 alterações)
python3 reconciliar_diffs.py --csv resultados.csv --repo . --raw execucoes-brutas

# 2) tabelas e gráficos
python3 analisar_resultados.py --csv resultados.csv --outdir analise

# 3) testes estatísticos
python3 estatistica.py --csv resultados.csv --out estatistica_pvalores.csv
```

## Executar o experimento novamente

```bash
chmod +x run_experiment.sh
# 3 modelos, 3 funcionalidades, 2 bases, 3 repetições = 54 execuções
./run_experiment.sh --repo /caminho/para/GithubExplorer --reps 3
```

| Parâmetro | Padrão | Descrição |
|---|---|---|
| `--repo` | (obrigatório) | Caminho de um clone deste repositório com as branches `dev` e `project-without-ddd` |
| `--models` | `claude-haiku-4-5-20251001,claude-sonnet-5,claude-fable-5` | IDs completos dos modelos, separados por vírgula |
| `--features` | `pequena,media,grande` | Subconjunto das funcionalidades |
| `--branches` | `dev,project-without-ddd` | Bases a testar |
| `--reps` | `3` | Repetições por combinação |
| `--out` | `resultados.csv` | CSV de saída (acrescenta linhas) |
| `--preinstall` / `--no-preinstall` | ligado | Pré-instala as dependências uma vez por base e as reaproveita, para reduzir a variância |
| `--install-cmd` | automático | Sobrescreve o comando de instalação |

O script usa `--dangerously-skip-permissions` para o agente editar arquivos sem interação; rode em
ambiente controlado. Ele só altera worktrees temporários e cria branches locais, sem fazer `push`.
Os valores de tokens e custo dependem do modelo, da versão do Claude Code e da tabela de preços
vigente, de modo que uma nova execução não reproduz os números exatos, apenas o protocolo.

## Colunas do `resultados.csv`

`timestamp`, `modelo`, `branch` (base: `dev` = com Clean Architecture; `project-without-ddd` = sem),
`feature`, `repeticao`, `input_tokens`, `output_tokens`, `cache_read`, `cache_creation`,
`total_tokens` (entrada + saída, sem cache), `custo_usd`, `num_interacoes`, `duracao_s`,
`arquivos_alterados`, `linhas_add`, `linhas_rem`, `linhas_contexto` (linhas lidas pela ferramenta
Read), `linhas_contexto_alteradas`, `densidade_ruido` e `erro`.

Densidade de ruído = 1 − (linhas lidas que foram alteradas ÷ total de linhas lidas). Perto de 1, o
agente leu muito e alterou pouco. Limitação: só contam leituras feitas pela ferramenta Read com
numeração de linhas.

## Sobre os dados publicados

- As transcrições em `execucoes-brutas/` são versões reduzidas das originais: preservam o uso de
  tokens, o custo, o número de interações, os arquivos lidos e o conteúdo lido do repositório, que é
  o necessário para recalcular todas as métricas. Textos do agente, saídas de comandos e leituras
  fora do repositório foram substituídos por `[omitido]`, e caminhos locais foram generalizados, por
  conterem informações da máquina usada na coleta sem relação com o experimento.
- A identificação de autoria do histórico e os dados de contato nos arquivos foram normalizados para
  a conta deste repositório. Datas, mensagens e conteúdo de código dos commits foram preservados, e
  os diffs entre cada base e sua branch `exp/...` são idênticos aos da coleta original.
