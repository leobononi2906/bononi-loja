# STATUS — Loja Física (bononi-loja)

> Atualizado: 2026-08-18

## O que é
Dashboard de gestão da **loja física**: acompanhamento de vendas, serviços (pátio e tapeçaria), planograma de gôndola e ordens de **tacógrafo** (com upload de documentos).

## Onde está
- **Clone real (git):** `C:\CLAUDE\Projetos GitHub\bononi-loja` (remote `leobononi2906/bononi-loja`, branch `main`). *(Clonado em 11/08/2026 — antes era só stub README.)*
- **Deploy:** https://bononiloja.vercel.app/vendas (chave de acesso no Hub = `loja`) · push na `main` → Vercel automático.
- **Supabase:** `vishxwdxqiygbxmtpfoy` (prefixos `loja_` e `taco_`).

## Stack
React + **TypeScript** + Vite + Tailwind + **shadcn/ui** + react-router-dom. Client Supabase padrão (`supabase.from()`, `src/integrations/supabase/client.ts`; `types.ts` gerado, 270KB). Log próprio em `loja_frontend_logs`.

## Telas (rotas em `src/App.tsx`, sob `AppShell`)
- **Vendas:** `/vendas` (visão geral) · `/vendas/vendedores` · `/vendas/sem-faturamento` (lista de vendas paradas p/ o Sardi, `VendasSemFaturamentoTab.tsx`).
- **Serviços:** `/servicos` (resumo) · `/servicos/patio` · `/servicos/tapecaria` · `/servicos/config-colaboradores`.
- **Gôndola:** `/gondola` (controle de preço de etiqueta da gôndola — `GondolaLoja.tsx`, 22KB; **não** é planograma visual, é lista/CRUD com detecção de divergência de preço e impressão de etiqueta).
- **Tacógrafo:** `/tacografo` (lista) · `/tacografo/nova` · `/tacografo/:id` (`TacografoOrdem.tsx`, 37KB — maior tela).

## Dados
- **Próprias `loja_`:** `loja_gondola` (planograma), `loja_config_colaborador` (setor/colaborador da loja), `loja_frontend_logs`.
- **Tacógrafo `taco_`:** `taco_ordens`, `taco_anexos`, `taco_cnpj_cards`, `taco_logs`. Storage bucket **`taco-docs`** (upload de documentos, badge automático).
- **Compartilhadas:** `vw_dim_cliente`, `vw_fb_produtos_compras`, dados comerciais (`useComercialData.ts`, `dim-cliente.ts`, `dim-vendedor.ts`).
- **Vendas sem faturamento:** `vw_vendas_sem_faturamento` (backend do replicador, `rep_vendas_sem_faturamento`) + `vendas_sem_fat_followup` (CRUD anon direto). Tela mostra VENDA **e** O.S. juntos (~11.3k linhas), abre por padrão em "Últimos 30d".

## Arquitetura
- **Padrão de tela:** página em `src/pages/` é fina (repassa `filters` do `AppShell`) e delega pra um componente pesado em `src/components/dashboard/` (ex: `ServicosPatio.tsx` ~250B → `PatioTab.tsx` 20.9KB). Não é placeholder — é o padrão do projeto inteiro.
- **Duas vias de dado:** views leves via `supabase.from()` direto (tipadas em `types.ts`, schema **compartilhado com outros apps Bononi** — `loja_*`/`taco_*` não estão tipadas nele). Views comerciais pesadas (Vendas/Serviços) passam pela **Edge Function `fetch-comercial`** (fora deste repo) via `fetch()` cru + anon key.

## Pendências / próximos passos
- [x] Aba "Vendas sem Faturamento" construída e testada (18/08) — VENDA+O.S. juntos, default "Últimos 30d", confirmado com o Leo.
- [ ] Tabela tem teto de 1000 linhas renderizadas (mostra as mais paradas primeiro, com aviso) — se o volume total continuar crescendo, considerar paginação real ou infinite scroll em vez do corte fixo.

## Dívidas e armadilhas conhecidas
- Anon (publishable) key hard-coded — no `client.ts` **e duplicada** em `useComercialData.ts:101` e `ConfigColaboradores.tsx:18` — padrão do grupo (exposição por design), mas as 3 cópias precisam ser trocadas juntas se a key rotacionar.
- `loja_config_colaborador` é a fonte de setor/colaborador da loja (padrão Bononi: **não** usar `departamento` do ERP p/ filtrar setor). Tela fonte de verdade: `ConfigColaboradores.tsx`.
- `INTERNAL_CLIENTS` (`ComercialVendedoresTab.tsx:19-24`) — lista hardcoded de ~27 clientes internos excluída dos rankings de vendedor/cliente.
- `vw_os_res_fat` é o totalizador **oficial** de faturamento de OS — usar essa view, não somar peças+serviços na mão.
- KPI "vs mês ant." em Vendedores na verdade compara com a **média dos 3 meses anteriores**, não o mês anterior simples.
- Tacógrafo: `status` no banco é só `ABERTA`/`CONCLUIDA` (muda só no clique manual "Concluir OS"); os badges `PEND_DOC`/`DOCS_OK` na lista são **derivados/cosméticos**, não refletem coluna do banco. `numero_os` é gerado client-side (maior + 1) — risco de corrida em concorrência.
- `src/data/mockData.ts` não tem mock data — só tipos (`DashboardFilters`) e formatters; nome ficou desatualizado mas é código vivo.
- Clone git é raso (só 2 commits locais) — histórico anterior do projeto não está disponível localmente.
- `vw_vendas_sem_faturamento` deu **timeout no anon role** (`statement_timeout=3s`) até 18/08 — a view faz subquery correlacionada por linha em `vw_dim_cliente` (71.842 linhas, sem índice em `id_cliente`) e `vw_dim_vendedor`. Corrigido com `CREATE INDEX ON vw_dim_cliente(id_cliente)` / `vw_dim_vendedor(id_vendedor)` (migração `idx_vw_dim_cliente_vendedor_id_lookup`). Se voltar a dar timeout depois de a view crescer mais, comece por aqui.
- O projeto Supabase tem um teto de **"max rows" no PostgREST** (retorna no máx. 10000 por request, mesmo pedindo `.range()` maior) — `useQuery` da tela pagina em lotes de 1000 até esgotar. Se outra tela algum dia buscar uma tabela/view que passe de 10k linhas, lembrar desse teto (não é bug do Supabase, é config do projeto).

## Dev-log
- 2026-08-18 — Vendas sem Faturamento: filtro Vendedor restrito a vendedores da loja física (`vw_loja_vendedores`, mesma fonte do `ComercialVendedoresTab`) + filtro Tipo (Todos/Venda/OS) no topo da tela.
- 2026-08-18 — Aba "Vendas sem Faturamento" (`/vendas/sem-faturamento`): lista + filtros rápidos/data custom/vendedor + follow-up (CRUD) por venda, VENDA+O.S. juntos (default "Últimos 30d"), paginação da busca (teto de max-rows do PostgREST) e teto de renderização de 1000 linhas c/ aviso. Achado e corrigido timeout de performance na view (índice faltando). Ver armadilhas acima.
- 2026-08-18 — Mapeamento profundo do código (arquitetura, dados, armadilhas) registrado aqui e em memória global.
- 2026-08-11 — Repo clonado localmente; criado este STATUS.
- 2026-07-13 (commit `ae2a81a`) — Tacógrafo: badge upload automático + confirmação ao desvincular cartão CNPJ.
