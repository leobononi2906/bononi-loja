# Plano — Distribuição automática de serviços (TV + tela do gestor)

> Pedido do Leo em 30/10/2026. Este documento é o **ponto de partida**: mostra o que já existe, o que
> falta e a ordem de construção. Atualizar a seção "Decisões" conforme o Leo for respondendo.
> Módulo: Loja Física › Gestão de Serviços. Piloto **só MLB PR** (`id_empresa=2`), igual ao resto do módulo.

## 1. O que o Leo quer (em uma frase cada)

1. **TV na oficina:** mostra cada colaborador — em qual O.S./serviço está, ou se está livre (e há quanto
   tempo) — e quais são os próximos serviços dele.
2. **Tela do gestor:** mexer na sequência; num serviço, escolher quem pode fazer: uma **área inteira** ou
   **colaboradores específicos**.
3. **Sequência automática:** o gestor intervém o mínimo possível.
4. **As duas telas respondem uma pergunta:** "como está cada área, o que vem depois e se dá para pegar
   mais serviço hoje".

## 2. Como funciona hoje no ERP legado (Firebird) — e por que isso importa

- O vendedor abre a O.S. e lança **uma linha de serviço por tarefa** (`TBL_SERVICO`).
  - O tipo vem do cadastro (`TBL_SERVICOP`, ex.: "AUTO ELETRICA").
  - O que fazer vai na coluna "Qtd. Desc." (`QTD_DESC`, ex.: "TROCAR FAROL").
  - Uma O.S. pode ter SV1, SV2… do mesmo tipo.
- **Colaborador "marcado" no serviço:** fica uma linha em `TBL_FUNCSERV_OS` (serviço × colaborador),
  mesmo sem nenhuma hora apontada. É o "SV2, eu também vou fazer".
- **Apontamento:** fica em `TBL_APONTAMENTO_FUNC`, pendurado no `TBL_FUNCSERV_OS`, com data, hora de
  início e hora de término.
  - Apontamento sem término = **trabalhando agora**.
- **Fim do serviço:** o colaborador marca OK (`TBL_SERVICO.OK = 'X'`). Ele é obrigado a dar OK em todos,
  inclusive no SV2 que nunca teve apontamento.
- **Nosso app nunca escreve no Firebird.** A regra é absoluta: a produção é só leitura. Por isso:
  - o colaborador continua se lançando e se marcando **no ERP**, como hoje;
  - a nossa "distribuição" é **orientação** — o que o gestor e a TV mostram;
  - a verdade sobre quem está fazendo o quê vem do apontamento lido do ERP.
  - Se alguém pegar outro serviço que não o sugerido, o motor simplesmente recalcula.
  - Não dá para travar ninguém, e nem queremos.

## 3. O que já existe (construído em 25-26/08/2026)

Tudo está em `vishxwdxqiygbxmtpfoy`. Os detalhes estão no `STATUS.md` e na memória
`gestao-servicos-distribuicao-precificacao`.

| Peça | O que é | Estado |
|---|---|---|
| `vw_fb_os_servico` | Cópia das linhas de serviço (O.S. abertas + 6 meses), com OK, apontado e horas | ✅ funciona, mas **chega 2x por dia** |
| `vw_fb_os_apontamento` | Apontamentos por colaborador (início/término) | ✅ funciona, mas **chega 2x por dia** |
| `dist_areas` | 7 áreas: Pátio, Tapeçaria, Auto Vidros, Tacógrafo, Elétrica, Solda, Acessórios | ✅ |
| `dist_area_servicop` | Tipo de serviço do ERP → área (automático) | ⚠️ só 6 tipos mapeados |
| `dist_colaborador_area` | Colaborador → área | ⚠️ só 13 vínculos |
| `dist_servico` / `dist_servico_colaborador` | Atribuição manual (área, colaboradores, parado, validado) | ✅, mas **quase sem uso** (8 linhas, nenhuma distribuição registrada) |
| Telas | Lista de Distribuição, Painel do Gestor, Precificação, Config. Áreas | ✅ no ar; presença "trabalhando/pausado" calculada em `src/lib/dist.ts` |

### Por que "não está funcional"

Dois buracos de dado, ambos comprovados em 30/10:

1. **Atraso de horas.** A cópia do ERP roda às 04:00 e às 12:30.
   - Às 15:25 de 30/10, o último apontamento visível era o das 11:59.
   - Uma TV com 3 horas de atraso mostra gente "trabalhando" que já foi embora. É inútil.
2. **O "marcado" não é copiado.** A extração só pega o `TBL_FUNCSERV_OS` que já tem apontamento.
   - O caso do SV2 (marcado, sem hora) **não chega** ao Supabase hoje.
   - Sem ele, não dá para saber que o SV2 já tem dono.

3. **"Trabalhando agora" nunca é detectado (bug, achado 30/10).** Quando o colaborador inicia o
   apontamento sem fechar, o ERP grava `HORA_TERMINO = '00:00'` — **não grava vazio** (trigger
   `TBL_APONTAMENTO_FUNC_BI`: `if (new.hora_termino is null) then new.hora_termino = '00:00'`).
   O app testa `!a.hora_termino` (`src/lib/dist.ts:218`, `DistribuicaoListaTab.tsx:173`) → nunca
   é verdade → ninguém aparece "trabalhando". Em 30/10 havia 16 apontamentos abertos (`00:00`) hoje
   e 0 nulos. Regra certa: aberto = `hora_termino` nulo **ou** `'00:00'`. É também por isso que a
   soma de horas do dia sai negativa (00:00 − 08:30).

### Existe "data da última alteração" no Firebird? (pergunta do Leo 30/10)

Não serve para isto. Conferido no DDL (`ERP FIREBIRD/ddl_dump.sql`):
- `TBL_OS.DATA_ATUALIZACAO` existe e o trigger `TBL_OS_BU` grava `'now'` a cada alteração da O.S.
  — mas o campo é **DATE** (só o dia, sem hora). Diz "mexeram hoje", não "mexeram nos últimos 3 min".
- `TBL_SERVICO`, `TBL_FUNCSERV_OS` e `TBL_APONTAMENTO_FUNC` **não têm** data de alteração. O log
  `TBL_LOG` (com `DATA_ALTERACAO` TIMESTAMP) só registra mudança de código/qtd/preço/desconto do
  serviço e campos comerciais da O.S. — **não** registra OK, marcação nem apontamento.
- Fechar um apontamento é UPDATE (o código não muda), então "pegar só os códigos novos" também perde
  o fechamento.

Conclusão: a cópia rápida **relê o conjunto inteiro das O.S. abertas** a cada ciclo (≈150 serviços da
MLB PR + marcados + apontamentos — poucas centenas de linhas, leitura leve). Não precisa de marca
d'água. `DATA_ATUALIZACAO = hoje` pode servir de filtro extra para pegar O.S. concluída hoje (para ela
sair da TV na hora).

Também falta o **motor**: hoje alguém precisa clicar em "Destinar" serviço por serviço, e ninguém faz
isso (zero distribuições registradas).

## 4. Números reais (MLB PR, para dimensionar)

- **Volume:** de 13 a 16 colaboradores apontam por dia, em 25 a 50 serviços.
- **Fila:** cerca de 147 serviços em aberto agora.
- **Tempo típico por tipo** (horas apontadas, últimos 90 dias):

| Tipo | Mediana | 80% dos casos até |
|---|---|---|
| Tapeçaria | 1,8 h | 4,4 h |
| Acessórios | 0,4 h | 1,2 h |
| Auto elétrica | 0,5 h | 1,0 h |
| Ar-condicionado | 1,5 h | 8,7 h |
| Auto vidros | 0,4 h | 1,1 h |
| Tacógrafo | 0,6 h | 1,7 h |
| Solda/escape | 1,8 h | 3,9 h |

  É a base do "dá para pegar mais hoje?": o padrão de cada tipo sai do histórico, e o gestor pode
  ajustar.
- **Lacuna de apontamento:** só cerca de 35 a 50 horas apontadas por dia contra cerca de 100 horas de
  gente disponível. Ou seja, **muita coisa é feita sem apontar**. A TV vai deixar isso visível (gente
  "livre há 2 h" que na verdade está trabalhando), o que por si só cobra o apontamento.

## 5. Como vai funcionar (o desenho)

### 5.1 O motor de sequência (automático)

Para cada área, uma **fila**:

1. **Ordem da fila:**
   - primeiro, a prioridade manual, se o gestor arrastou ou fixou algo;
   - depois, a hora de entrada da O.S. (quem chegou primeiro sai primeiro).
   - Serviços da **mesma O.S.** ficam juntos.
2. **Quem pode fazer cada serviço:**
   - por padrão, **qualquer colaborador da área** (área automática pelo tipo de serviço);
   - o gestor pode trocar por **colaboradores específicos**, ou mandar para outra área.
3. **Próximos de cada colaborador:**
   - o motor percorre a fila e reserva para cada pessoa os próximos serviços que ela pode fazer,
     considerando quando ela deve ficar livre (tempo restante do serviço atual pela estimativa);
   - mostra os próximos 2 ou 3 de cada pessoa.
4. **Marcado = já é dele:**
   - serviço em que o colaborador se marcou no ERP (o SV2) vai para a lista dele, logo depois do atual;
   - não é oferecido a mais ninguém.
5. **Recalcula sozinho** a cada atualização de dado (poucos minutos). Começou um apontamento? O serviço
   sai da fila e vai para "trabalhando". Deu OK? Sai de tudo.
6. **Gestor só intervém quando quer:** arrastar para o topo, fixar um serviço numa pessoa, mudar a área,
   ou pausar ("aguardando peça/cliente").

O motor fica no banco (função SQL), não na tela. Assim a TV e o gestor veem **a mesma resposta**.

### 5.2 Capacidade do dia ("dá para pegar mais?")

Por área:
- **Horas disponíveis hoje** = para cada colaborador da área, quanto falta até o fim do expediente,
  menos o que falta do serviço atual.
- **Horas na fila** = soma das estimativas dos serviços que aguardam.
- **Saldo:** "sobram 6 h hoje" (verde) / "fila de 1,5 dia" (vermelho).
- Na tela do gestor também aparece **até que hora** a fila atual vai.

### 5.3 TV (`/tv/servicos`)

- Tela cheia, fonte grande, sem menu e sem clique. Atualiza sozinha.
- **Uma coluna por área.** No topo, a barra de capacidade do dia.
- **Um cartão por colaborador**, com cor pelo estado:
  - 🟢 trabalhando: Prisma, O.S., serviço e "há 35 min";
  - 🟡 pausado: apontou e fechou, mas o serviço continua aberto;
  - ⚪ livre há X min;
  - abaixo, os **próximos 2 ou 3** dele.
- Rodapé: serviços aguardando na fila sem ninguém previsto (sobrou para amanhã).

### 5.4 Tela do gestor

Evolução do Painel do Gestor atual. Sem tela nova no menu.
- A mesma visão por área da TV, mas mexível:
  - arrastar para reordenar;
  - num serviço, "quem pode fazer": a área (padrão) ou colaboradores escolhidos;
  - fixar numa pessoa;
  - pausar com motivo.
- Avisos de exceção, o que exige o gestor:
  - serviço sem área (tipo não mapeado);
  - serviço parado há dias;
  - colaborador livre com fila na área dele.
- **Config:** tempo padrão por tipo de serviço (já vem preenchido pelo histórico) e expediente por
  colaborador.

## 6. Ordem de construção

| Fase | Entrega | Depende de |
|---|---|---|
| **0. Dado ao vivo** | Nova cópia rápida no servidor, a cada 2–3 min no horário de expediente. Só O.S. **abertas** da MLB PR: serviços + marcados (`TBL_FUNCSERV_OS` sem exigir apontamento) + apontamentos do dia. Volume pequeno (centenas de linhas). Só leitura no Firebird. | OK do Leo para mexer no servidor (SRV-DASHBOARD: backup + diff antes) |
| **1. Cadastros** | Mapear os tipos de serviço restantes → área; colaboradores → área; tempo padrão por tipo (do histórico); expediente | Fase 0 não é necessária; o gestor confere os mapas |
| **2. Motor** | Função SQL de fila + próximos + capacidade, com teste em dado real | 0 e 1 |
| **3. TV** | `/tv/servicos` | 2 + forma de login da TV |
| **4. Gestor** | Painel do Gestor mexível (arrastar, quem pode, fixar, pausar) | 2 |

Sugestão: Fase 0 e Fase 1 em paralelo. Sem o dado ao vivo, nada do resto é confiável.

## 7. Decisões

Resposta do Leo pendente nas 4 primeiras:

1. **Mexer no servidor para a cópia rápida (Fase 0).** Proposta: a cada 3 min, das 7h às 19h, de segunda
   a sábado.
2. **Login da TV.** A TV precisa entrar sem ninguém digitar senha todo dia. Proposta: um usuário "TV
   Oficina" no Hub, só com acesso a essa tela, logado uma vez no navegador da TV.
3. **Ordem padrão da fila.** Proposta: chegada da O.S. (primeiro que entra, primeiro que sai). A
   alternativa é priorizar o cliente que está esperando na loja (precisaria de um marcador).
4. **Expediente.** Horário padrão da oficina (ex.: 8h–18h com almoço 12h–13h30)? Muda por pessoa?
5. Já decidido: só MLB PR no piloto (como o resto do módulo); o colaborador continua se lançando no ERP;
   nada volta para o Firebird.

## 8. Andamento

### 30/10/2026 — Fase 0 (dado ao vivo) construída; falta agendar no servidor
- **Leo aprovou** seguir com o banco e com o login de TV.
- **Tabelas novas no Supabase** (migration `dist_aovivo_tabelas`), todas só com leitura para usuário logado:
  - `dist_aovivo_servico`: serviços das O.S. abertas + as concluídas hoje, de todas as empresas;
  - `dist_aovivo_marcacao`: `TBL_FUNCSERV_OS` **com ou sem** apontamento, o SV2 "marcado";
  - `dist_aovivo_apontamento`: com a coluna `aberto` (término nulo ou `00:00`);
  - `dist_aovivo_estado`: hora da última cópia e contagens.
- **Gravação.** Só a RPC `dist_aovivo_carregar` grava (service_role).
  - Ela apaga e regrava as 3 tabelas numa transação só, então a TV nunca vê a cópia pela metade.
  - Trava: se vier 0 serviço, aborta sem apagar.
- **Lander.** `bononi-replicador/land-dist-aovivo.js` + `alvos/dist_aovivo.js` + `run-dist-aovivo.bat`. Por que tabelas e lander próprios:
  - não usa a staging do `refresh-all` (regra "1 fonte por tabela");
  - não briga com o `diario`.
- **Testado deste PC contra a produção (só leitura):** 754 serviços, 554 marcações, 652 apontamentos, em cerca de 1,5 s.
- **Achado no dado.** O mesmo colaborador pode ter **vários apontamentos abertos ao mesmo tempo**: Ricardo (tacógrafo) tinha 3 abertos desde 08:22, em prismas diferentes.
  - SV1 + SV2 abertos juntos na mesma O.S. = normal.
  - Apontamento antigo esquecido aberto = comum.
  - **Regra para a TV:** o "atual" da pessoa é o apontamento aberto mais recente. Os outros abertos da mesma O.S. aparecem juntos; os de O.S. antiga contam como "esquecido aberto" (aviso no gestor).
- **PENDENTE: agendar.** O SRV-DASHBOARD não respondeu SSH em 30/10 (porta 22 com timeout).
  - Quando responder, subir os 3 arquivos (são novos, não sobrescrevem nada) e criar a tarefa `BononiDistAoVivo`: a cada 3 min, das 07h às 19h, de segunda a sábado.
  - Enquanto isso, a cópia só roda manualmente (`node land-dist-aovivo.js`).
  - Tentei criar uma tarefa temporária no PC de dev; ela foi bloqueada pela permissão do Claude Code, e é melhor assim: deve ser 1 fonte só, no servidor.
- **Bug corrigido e publicado** (`3ea4d3b`): o app considerava "trabalhando" só quando o término estava vazio, e o ERP grava `00:00`. Helper `apontamentoAberto()` em `src/lib/dist.ts`.

### Desenho das telas combinado (esboço mostrado ao Leo em 30/10)
- **TV:**
  - colunas por área;
  - barra de capacidade no topo de cada área. É o **recado para o vendedor**: verde = dá para vender serviço para hoje; amarelo = só se for rápido; vermelho = só para amanhã;
  - cartão por colaborador (trabalhando / pausado / livre há X min) com os próximos dele.
- **Gestor:** público simples, então **3 ações grandes por serviço**: ↑ Subir, Quem faz (a área inteira ou pessoas escolhidas), Pausar (com motivo). No topo, os botões das áreas com o tamanho da fila, e avisos de exceção (sem área, esquecido aberto).
- **Celular, consulta por placa:**
  - campo grande de placa;
  - mostra veículo, prisma e entrada, e cada serviço: pronto / quem está fazendo e há quanto tempo / na fila;
  - mostra a previsão de pronto.
