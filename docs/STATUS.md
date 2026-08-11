# STATUS — Loja Física (bononi-loja)

> Atualizado: 2026-08-11

## O que é
Dashboard de gestão da **loja física**: acompanhamento de vendas, serviços (pátio e tapeçaria), planograma de gôndola e ordens de **tacógrafo** (com upload de documentos).

## Onde está
- **Clone real (git):** `C:\CLAUDE\Projetos GitHub\bononi-loja` (remote `leobononi2906/bononi-loja`, branch `main`). *(Clonado em 11/08/2026 — antes era só stub README.)*
- **Deploy:** https://bononiloja.vercel.app/vendas (chave de acesso no Hub = `loja`) · push na `main` → Vercel automático.
- **Supabase:** `vishxwdxqiygbxmtpfoy` (prefixos `loja_` e `taco_`).

## Stack
React + **TypeScript** + Vite + Tailwind + **shadcn/ui** + react-router-dom. Client Supabase padrão (`supabase.from()`, `src/integrations/supabase/client.ts`; `types.ts` gerado, 270KB). Log próprio em `loja_frontend_logs`.

## Telas (rotas em `src/App.tsx`, sob `AppShell`)
- **Vendas:** `/vendas` (visão geral) · `/vendas/vendedores`.
- **Serviços:** `/servicos` (resumo) · `/servicos/patio` · `/servicos/tapecaria` · `/servicos/config-colaboradores`.
- **Gôndola:** `/gondola` (planograma da loja — `GondolaLoja.tsx`, 22KB).
- **Tacógrafo:** `/tacografo` (lista) · `/tacografo/nova` · `/tacografo/:id` (`TacografoOrdem.tsx`, 37KB — maior tela).

## Dados
- **Próprias `loja_`:** `loja_gondola` (planograma), `loja_config_colaborador` (setor/colaborador da loja), `loja_frontend_logs`.
- **Tacógrafo `taco_`:** `taco_ordens`, `taco_anexos`, `taco_cnpj_cards`, `taco_logs`. Storage bucket **`taco-docs`** (upload de documentos, badge automático).
- **Compartilhadas:** `vw_dim_cliente`, `vw_fb_produtos_compras`, dados comerciais (`useComercialData.ts`, `dim-cliente.ts`, `dim-vendedor.ts`).

## Pendências / próximos passos
- [ ] Sem STATUS anterior — este é o primeiro. Backlog a levantar com o Leo.
- [ ] `ServicosPatio`/`ServicosTapecaria`/`VendasVendedores` são páginas pequenas (~250B) — confirmar se são placeholders a desenvolver.

## Dívidas e armadilhas conhecidas
- Anon (publishable) key hard-coded no `client.ts` — padrão do grupo (exposição por design).
- `loja_config_colaborador` é a fonte de setor/colaborador da loja (padrão Bononi: **não** usar `departamento` do ERP p/ filtrar setor).

## Dev-log
- 2026-08-11 — Repo clonado localmente; criado este STATUS.
- 2026-07-13 (commit `ae2a81a`) — Tacógrafo: badge upload automático + confirmação ao desvincular cartão CNPJ.
