# STATUS — Loja Física (bononi-loja)

> Atualizado: 2026-08-21

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
- **Vendas sem faturamento:** `vw_vendas_sem_faturamento` (VENDA vem do snapshot `rep_vendas_sem_faturamento`; O.S. é **ao vivo**, calculada direto de `vw_os_base.fl_faturada` desde 18/08 — some da lista no mesmo ciclo do comercial, sem defasagem de 30min) + `vendas_sem_fat_followup` (CRUD anon direto). Tela restringe direto na base a O.S. `tipo_saida=NORMAL` + Venda `tipo_saida=LOJA` (exclui DISTRIBUICAO/ONLINE — não é operação de loja física), abre por padrão em "Últimos 30d". `status` (F=Finalizada/A=Aberta) é o andamento do serviço da OS — **diferente** de faturada (critério da lista inteira).

## Arquitetura
- **Padrão de tela:** página em `src/pages/` é fina (repassa `filters` do `AppShell`) e delega pra um componente pesado em `src/components/dashboard/` (ex: `ServicosPatio.tsx` ~250B → `PatioTab.tsx` 20.9KB). Não é placeholder — é o padrão do projeto inteiro.
- **Duas vias de dado:** views leves via `supabase.from()` direto (tipadas em `types.ts`, schema **compartilhado com outros apps Bononi** — `loja_*`/`taco_*` não estão tipadas nele). Views comerciais pesadas (Vendas/Serviços) passam pela **Edge Function `fetch-comercial`** (fora deste repo) via `fetch()` cru + anon key.

## Pendências / próximos passos
- [x] Aba "Vendas sem Faturamento" construída e testada (18/08) — VENDA+O.S. juntos, default "Últimos 30d", confirmado com o Leo.
- [ ] Tabela tem teto de 1000 linhas renderizadas (mostra as mais paradas primeiro, com aviso) — se o volume total continuar crescendo, considerar paginação real ou infinite scroll em vez do corte fixo.
- [x] Tacógrafo — dossiê PDF: teto de 10MB (limite do sistema de aferição externo) + fotos do disco em retrato lado a lado (21/08).

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
- Tacógrafo — dossiê PDF (`taco-pdf.ts`): fotos (`FOTO_TACOGRAFO*`/`DISCO_*`) já vêm comprimidas no upload (`comprimirImagem`, maxDim 1600, JPEG q=0.82), mas PDF anexado (CRLV/comprovante) é copiado **cru** com `pdf.copyPages` — é o maior risco de estourar o teto de 10MB do dossiê final. Por isso o upload de PDF (não-imagem) trava em 8MB (`MAX_PDF_ANEXO_MB` em `TacografoOrdem.tsx`) e o `gerarDossiePdf` checa o tamanho final e lança erro amigável se passar de 10MB — não tenta recomprimir automaticamente (pdf-lib não faz downsampling de página copiada).

## Dev-log
- 2026-08-21 — Tacógrafo: dossiê PDF trava em 10MB total (erro amigável orientando trocar o PDF pesado por um menor/foto) + upload de PDF (CRLV/comprovante) trava em 8MB cru. Fotos do disco em retrato (`DISCO_1`/`DISCO_2`, ou qualquer par de fotos retrato adjacentes) agora saem **lado a lado** numa página dedicada, em vez de empilhadas — layout empilhado (2 por página) seguiu igual pra fotos paisagem. Verificado com script isolado (`vite-node` rodando `gerarDossiePdf` direto, sem precisar de OS real) confirmando 1 imagem na página da foto solta vs. 2 imagens na página do par retrato.
- 2026-08-18 — Vendas sem Faturamento: backend passou O.S. a calcular ao vivo (via `vw_os_base.fl_faturada`, antes vinha do snapshot com defasagem) — volume caiu de ~10.766 pra ~233 O.S. (mais ~118 Venda-loja); nenhuma mudança de schema/front necessária. Adicionado filtro "Status OS" (Todas/Finalizadas/Abertas, coluna `status` F/A) — só afeta O.S., Venda passa direto; "finalizada" é andamento do serviço, não é o mesmo que "faturada".
- 2026-08-18 — Vendas sem Faturamento: trocado o filtro de vendedor (via `vw_loja_vendedores`) por restrição direta na base — O.S. só `tipo_saida=NORMAL`, Venda só `tipo_saida=LOJA` (exclui DISTRIBUICAO/ONLINE). Dropdown de vendedor passa a derivar naturalmente dessa base já restrita, sem cruzar com outra view.
- 2026-08-18 — Vendas sem Faturamento: filtro Vendedor restrito a vendedores da loja física (`vw_loja_vendedores`, mesma fonte do `ComercialVendedoresTab`) + filtro Tipo (Todos/Venda/OS) no topo da tela.
- 2026-08-18 — Aba "Vendas sem Faturamento" (`/vendas/sem-faturamento`): lista + filtros rápidos/data custom/vendedor + follow-up (CRUD) por venda, VENDA+O.S. juntos (default "Últimos 30d"), paginação da busca (teto de max-rows do PostgREST) e teto de renderização de 1000 linhas c/ aviso. Achado e corrigido timeout de performance na view (índice faltando). Ver armadilhas acima.
- 2026-08-18 — Mapeamento profundo do código (arquitetura, dados, armadilhas) registrado aqui e em memória global.
- 2026-08-11 — Repo clonado localmente; criado este STATUS.
- 2026-07-13 (commit `ae2a81a`) — Tacógrafo: badge upload automático + confirmação ao desvincular cartão CNPJ.
