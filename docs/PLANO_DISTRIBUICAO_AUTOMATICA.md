# Plano — Distribuição automática de serviços (TV + gestor + consulta por placa)

> **Para quem vai tocar (Gustavo):** este é o documento único do projeto. Começa pelo resumo (§1),
> depois o que já está pronto (§4) e as fases que faltam (§6). As regras de dado (§3) e as
> armadilhas (§8) são o que mais quebra se ignorar.
> Módulo: **Loja Física › Gestão de Serviços**. Piloto **só MLB PR** (`id_empresa = 2`).
> Pedido do Leo em 30/10/2026. Última revisão: 30/10/2026.

## 1. Resumo em 6 linhas

1. A oficina passa a ter **uma fila automática por área**, na **ordem de chegada** da O.S.
2. Uma **TV** mostra, por área, os **próximos serviços**, **quem está disponível** e uma **faixa
   colorida** que diz ao vendedor se ainda cabe serviço hoje.
3. O **gestor** só intervém nas exceções: subir um serviço, escolher quem faz, pausar.
4. Pelo **celular**, qualquer um consulta a **placa** e vê o andamento do veículo.
5. O dado vem do ERP (Firebird) **a cada 3 min**, só das **O.S. abertas**. **Nada é gravado no ERP**.
6. As telas novas **substituem** a "Lista de Distribuição" e o "Painel do Gestor" atuais (§5).

## 2. Como o ERP funciona hoje (base de tudo)

- O vendedor abre a O.S. e lança **uma linha de serviço por tarefa** (`TBL_SERVICO`).
  - O tipo vem do cadastro (`TBL_SERVICOP`, ex.: AUTO ELETRICA).
  - O que fazer vai em "Qtd. Desc." (`QTD_DESC`, ex.: "TROCAR FAROL").
  - Exemplo: SV1 AUTO ELETRICA "trocar farol" e SV2 AUTO ELETRICA "troca lâmpada seta".
- O colaborador **se aponta** no SV1 (`TBL_APONTAMENTO_FUNC`: data, início, término) e **se marca**
  no SV2 (`TBL_FUNCSERV_OS`, colaborador × serviço). O SV2 muitas vezes fica sem nenhuma hora apontada.
- No fim, ele é **obrigado a dar OK em todos** (`TBL_SERVICO.OK = 'X'`).
- **Nosso app nunca escreve no Firebird.** A regra é absoluta: produção é só leitura, nem view se cria. Por isso:
  - o colaborador continua se lançando e se marcando **no ERP**, como hoje;
  - a distribuição é **orientação**; não trava ninguém;
  - se alguém pegar outro serviço, o motor simplesmente recalcula.

## 3. Regras de dado (o porquê de cada uma)

| Regra | Por quê |
|---|---|
| **Apontamento aberto = término vazio OU `'00:00'`** | O trigger `TBL_APONTAMENTO_FUNC_BI` grava `00:00` quando o término vem vazio. Testar só "vazio" nunca acha ninguém trabalhando (era o bug do app antigo). Helper: `apontamentoAberto()` em `src/lib/dist.ts`. |
| **Copia só O.S. com `status = 'A'`** (não cancelada) | Decisão do Leo (30/10). No ERP só existem `A` (aberta) e `F` (fechada). O.S. fechada some da TV sozinha, porque cada cópia substitui as tabelas inteiras. |
| **A cópia relê tudo a cada ciclo** (sem incremental) | Não existe data/hora de alteração utilizável: `TBL_OS.DATA_ATUALIZACAO` é só DATE; serviço, marcação e apontamento não têm data; `TBL_LOG` não registra OK, marcação nem apontamento; fechar apontamento é UPDATE. São só ~430 serviços abertos, então a leitura leva ~1 s. |
| **Encoding `WIN1252`** na conexão da cópia rápida | Com o padrão (UTF8), o acento do ERP vira "SERVI�OS". |
| **Colaborador com vários apontamentos abertos** | É comum. O "atual" é o aberto mais recente; os de outras O.S. antigas são "esquecido aberto" (aviso para o gestor). |
| **"Antigo parado" sai da fila** | O.S. com mais de 7 dias (`dist_config.dias_antigo`) e nenhum apontamento nesse prazo vai para a lista `antigos`, para o gestor resolver. Eram 36 serviços em 30/10: O.S. de fev–out nunca concluídas no ERP, que entupiam a fila. |
| **Tempo estimado de cada serviço** | Ajuste manual do gestor (`dist_tempo_servicop`); senão, a mediana dos últimos 180 dias do tipo (mínimo 5 casos, < 40 h); senão, 1 h. Serviço já começado conta só o que falta (mínimo 15 min). |
| **Capacidade do dia** | Colaboradores da área × horas que restam do expediente, menos o que falta dos serviços com apontamento aberto hoje. Expediente: **08:00–12:00 e 13:12–18:00** (8,8 h/dia, em `dist_config.expediente`). |
| **Área do serviço** | A escolha do gestor (`dist_servico`), senão o mapa tipo → área (`dist_area_servicop`). |
| **Disponível** | Colaborador ligado à área (`dist_colaborador_area`) **sem** apontamento aberto hoje. Quem não estiver ligado a nenhuma área **não aparece**. |

## 4. O que já está pronto (30/10/2026)

### 4.1 Servidor — cópia rápida (SRV-DASHBOARD)

- **Servidor:** SRV-DASHBOARD, agora em **`192.168.0.11`** (era `.8`; mudou de IP sem aviso, mas é a mesma máquina, conferida pela chave SSH). Acesso só por SSH. Doc: `bononi-replicador/docs/SERVIDOR_PRODUCAO.md`.
- **Arquivos em `C:\bononi-replicador`:**
  - `land-dist-aovivo.js` (o programa);
  - `alvos\dist_aovivo.js` (as 3 consultas, só leitura);
  - `run-dist-aovivo.bat` (o que a tarefa chama; grava log em `logs\dist-aovivo.log`).
  - Backup da versão anterior do alvo: `alvos\dist_aovivo.js.bak-20261030`.
- **Teste no servidor** em 30/10, já com "só abertas": **426 serviços** de 198 O.S., 232 marcações, 246 apontamentos, **1,1 s**.
- **Proteções:**
  - usa tabelas e programa próprios, sem a staging compartilhada do `refresh-all` (regra "1 fonte por tabela");
  - se ler 0 serviço, aborta sem apagar nada.
- ⏳ **Falta criar a tarefa agendada** `BononiDistAoVivo3min`. A permissão do Claude Code bloqueia; quem tem acesso à máquina do servidor roda, no **Prompt de Comando como Administrador**:
  ```
  schtasks /create /tn BononiDistAoVivo3min /tr "cmd.exe /c C:\bononi-replicador\run-dist-aovivo.bat" /sc weekly /d MON,TUE,WED,THU,FRI,SAT /st 07:00 /ri 3 /du 12:00 /k /ru SYSTEM /rl HIGHEST /f
  schtasks /run /tn BononiDistAoVivo3min
  ```
  Ela roda a cada 3 min, das 07h às 19h, de segunda a sábado. Para conferir, `dist_aovivo_estado.atualizado_em` deve andar a cada 3 min.

### 4.2 Banco (Supabase `vishxwdxqiygbxmtpfoy`)

Estado final em `supabase/migrations/20261030180000_dist_painel.sql`.

| Objeto | O que é |
|---|---|
| `dist_aovivo_servico` | Serviços das O.S. abertas (todas as empresas). |
| `dist_aovivo_marcacao` | `TBL_FUNCSERV_OS` **com ou sem** apontamento (o "SV2 marcado"). |
| `dist_aovivo_apontamento` | Apontamentos, com a coluna `aberto`. |
| `dist_aovivo_estado` | Uma linha: hora da última cópia e contagens. |
| `dist_aovivo_carregar(...)` | Única porta de gravação (só service_role). Apaga e regrava as 3 tabelas numa transação só, então a TV nunca vê cópia pela metade. |
| `dist_config` | `expediente`, `dias_antigo`. |
| `dist_tempo_servicop` | Tempo padrão por tipo, ajustado pelo gestor. |
| `dist_horas_restantes_hoje()` | Horas do expediente que ainda faltam hoje. |
| **`dist_painel(p_empresa)`** | **O motor.** Devolve, por área: fila (ordem de chegada), disponíveis, `fila_horas`, `capacidade_horas`, mais as listas `sem_area` e `antigos`. A TV e o gestor usam a mesma função, portanto veem a mesma resposta. |
| `dist_areas`, `dist_area_servicop`, `dist_colaborador_area`, `dist_servico`, `dist_servico_colaborador` | Já existiam (25/08): áreas, tipo → área, colaborador → área, decisões do gestor. |

Leitura liberada só para usuário logado (RLS).

### 4.3 App — TV (`/tv`)

- `src/pages/TvServicos.tsx`. Rota fora do menu, mas exige login no Hub com o módulo `loja`.
- Tela cheia, escura, sem clique. Atualiza a cada 1 min. A letra acompanha a altura da TV (testado em 1080p e 768p).
- **Por área:**
  - nome e quantos na fila;
  - **faixa do vendedor** (`lotacaoArea()` em `src/lib/dist.ts`):
    - 🟢 "Cabe +Xh hoje";
    - 🟡 "Só serviço rápido hoje";
    - 🔴 "Cheio hoje — só amanhã" / "Fila de X dias";
  - **Disponíveis** (primeiro nome · há quanto tempo livre);
  - **3 próximos veículos**, agrupados por O.S. (a frota chega com 5–10 serviços na mesma O.S.), com prisma, serviços, veículo e tempo estimado.
- Selo vermelho "Sem atualização há X" se a cópia passar de 15 min parada.
- **Login da TV:** criar no Hub o usuário "TV Oficina" com o módulo `loja`; abrir `https://bononiloja.vercel.app/tv` uma vez e entrar (a sessão fica salva). Limite: esse usuário enxerga o app da loja inteiro; restringir exige um módulo novo no Hub (depois).

## 5. O que substitui o quê no app

Menu atual de Gestão de Serviços → como fica:

| Hoje | Fonte de dado hoje | Fica como |
|---|---|---|
| **Lista de Distribuição** (`/gestao-servicos/distribuicao`, `DistribuicaoListaTab.tsx`, 756 linhas) | `vw_fb_os_servico` / `vw_fb_os_apontamento`, que chegam **2× por dia**; "Destinar" serviço a serviço (ninguém usava: zero distribuições) | ❌ **Sai.** Vira o novo **Painel do Gestor** (Fase A). |
| **Painel do Gestor** (`/gestao-servicos/painel`, `PainelGestorTab.tsx`) | Mesmas views 2×/dia; presença calculada no navegador | ❌ **Substituído** pelo novo Painel do Gestor sobre `dist_painel`. |
| **Precificação** (`/gestao-servicos/precificacao`) | `vw_fb_os_servico` (histórico 6 meses) | ✅ **Fica como está.** Outro propósito: conferir preço × horas do serviço feito. Não depende de "ao vivo". |
| **Config. Áreas** (`/gestao-servicos/areas`) | `dist_areas`, `dist_area_servicop`, `dist_colaborador_area` | ✅ **Fica e ganha:** tempo padrão por tipo e expediente (Fase C). |
| — | — | ➕ **TV** `/tv` (pronta). |
| — | — | ➕ **Consulta por placa** `/placa` (Fase B), no menu e otimizada para celular. |

**Ordem segura de troca:**
1. publicar o Painel novo numa rota nova;
2. o gestor usa uns dias;
3. trocar o item do menu;
4. só então apagar `DistribuicaoListaTab.tsx` / `PainelGestorTab.tsx` e o que só eles usam em `src/lib/dist.ts`.

As tabelas `dist_servico*` **continuam**: o painel novo grava nelas.

## 6. O que falta — fases

### Fase 0 — Ligar a cópia automática (bloqueia tudo) ⏳
- [ ] Criar a tarefa no servidor (comando no §4.1).
- [ ] Conferir que `dist_aovivo_estado.atualizado_em` anda a cada 3 min e que a TV some com o selo vermelho.
- [ ] Pedir a quem cuida da rede **IP fixo** para o SRV-DASHBOARD (`192.168.0.11`).

### Fase A — Novo Painel do Gestor (substitui Lista + Painel)
Público simples: **pouca coisa na tela, botões grandes (44 px), sem jargão.**
- **Topo:** um botão por área, com cor da faixa e tamanho da fila. Clicar filtra.
- **Por área, a fila** (a mesma do `dist_painel`), um cartão por veículo, com **3 ações grandes**:
  - **↑ Subir:** passa à frente. Precisa de uma **coluna de prioridade** nova em `dist_servico` (ex.: `prioridade int`), e o `dist_painel` passa a ordenar por prioridade e depois por chegada.
  - **Quem faz:** a área inteira (padrão), outra área ou pessoas escolhidas. Grava em `dist_servico` / `dist_servico_colaborador`. O motor precisa respeitar "pessoas escolhidas" na hora de mostrar o "com Fulano".
  - **Pausar** com motivo (aguardando peça / cliente / aprovação): `status_manual = 'parado'`, que o motor já exclui da fila.
- **Caixa "Precisa de você"** (exceções):
  - **Sem área:** tipos sem mapa (hoje Ar-condicionado, forro, gerador, digitalização) → botão "definir área", que grava o mapa do tipo e não só o serviço.
  - **Antigos parados:** botões "reativar" (volta para a fila) ou "ignorar".
  - **Esquecido aberto:** colaborador com apontamento aberto de outra O.S. → lembrar de fechar no ERP.
  - **Gente livre com fila na área.**
- Ao vivo: refetch a cada 1 min, como a TV.

### Fase B — Consulta por placa (celular) `/placa`
- Um campo grande; digitou a placa (sem traço, maiúscula), buscou nas `dist_aovivo_*`.
- Mostra:
  - veículo, prisma, cliente (sem telefone, por LGPD) e data/hora de entrada;
  - cada serviço com estado: ✅ **pronto** (OK) / 🔧 **Fulano fazendo há 35 min** (apontamento aberto) / ⏸ **pausado** / 🕒 **na fila (posição N da área)**;
  - **previsão de pronto:** a soma das horas que faltam na fila da área até este veículo, dividida pelos colaboradores da área, projetada no expediente.
- Precisa de uma RPC nova `dist_consulta_placa(p_placa)`, que reaproveita a lógica do `dist_painel`.
- Placa de O.S. fechada não aparece ("nenhuma O.S. aberta para essa placa").

### Fase C — Config. Áreas completa
- **Tempo padrão por tipo:** a tabela mostra a mediana do histórico; o gestor pode sobrescrever (`dist_tempo_servicop`).
- **Expediente** editável (`dist_config.expediente`).
- **Colaborador → área:** a tela já existe. **Decisão do Leo: o gestor faz esse cadastro.**
  - Hoje há só 13 colaboradores ligados, mas 23 apontaram nos últimos 30 dias.
  - Sugestão de melhoria: listar no topo "apontou nos últimos 30 dias e não tem área".
- Criar a área **Ar-condicionado** (ou decidir que ele vai para Elétrica).

### Fase D — Limpeza
- Remover as telas antigas (ordem segura no §5).
- Atualizar `docs/STATUS.md` e o `AppShell` (títulos do menu).

## 7. Decisões tomadas

| Data | Decisão (Leo) |
|---|---|
| 30/10 | Fila em **ordem de chegada** da O.S. |
| 30/10 | Expediente **08:00–12:00 e 13:12–18:00**. |
| 30/10 | Na TV **não aparece quem está trabalhando**: só os próximos serviços por área e quem está disponível. A TV também orienta a venda. |
| 30/10 | Login da TV = usuário do Hub com o módulo `loja`. |
| 30/10 | O cadastro colaborador → área é do **gestor**, em Config. Áreas. |
| 30/10 | A cópia rápida pode rodar no servidor, **somente O.S. abertas**. |
| 30/10 | As funções novas **substituem** o que existe hoje no app (§5). |
| — | Piloto só MLB PR; o colaborador continua no ERP; nada volta para o Firebird. |

## 8. Armadilhas

- **Firebird de produção (`192.168.0.5`) é só leitura.** Nenhum CREATE, ALTER, UPDATE ou DELETE, nem view. Campo novo = consulta nova em `bononi-replicador/alvos/`.
- **No servidor, manda o código do SERVIDOR** (o repo do replicador não tem git nem sincroniza). Antes de mexer: baixar o arquivo do servidor, comparar, fazer backup `.bak-AAAAMMDD`, subir, `node -c`, testar só o alvo.
- **Não rodar a cópia rápida de dois lugares** ao mesmo tempo (este PC + servidor). É uma fonte só.
- **Lacuna de apontamento:** só ~35–50 h apontadas por dia contra ~100 h de gente. Quem trabalha sem apontar aparece "livre" na TV. É esperado; a TV acaba cobrando o apontamento.
- **Frota (ex.: Gazin)** enche a fila da Tapeçaria (2,8 dias em 30/10). A TV agrupa por O.S. para não repetir o prisma.
- **Push na `main` = produção** (Vercel).
- **Telas operadas em pé:** controle com 44 px.

## 9. Histórico

- **25–26/08:** primeira versão (Lista de Distribuição, Painel, Precificação, Config. Áreas) sobre as views 2×/dia. Ficou sem uso: dado atrasado em horas, o "marcado" sem apontamento não era copiado, e o bug do `00:00` impedia ver alguém trabalhando.
- **30/10:** correção do `00:00` (`3ea4d3b`); cópia rápida + motor `dist_painel` + TV `/tv` (`ad5f93d`); servidor achado no IP novo; cópia restrita a O.S. abertas; plano reescrito para passagem ao Gustavo.
