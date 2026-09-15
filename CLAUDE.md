# Loja Física (bononi-loja) — guia do projeto

> **Estado atual, pendências e dev-log: `docs/STATUS.md`.** Este arquivo é só o que é estável.
> Contexto do grupo e regras de banco: skill `bononi-contexto`. Consultar o banco:
> `consultar-banco`. Publicar: `publicar-e-conferir`. Registrar: `registrar-status`.

## O que é

Dashboard de gestão da **loja física**: acompanhamento de vendas, serviços (pátio e tapeçaria),
planograma de gôndola e ordens de **tacógrafo**, com upload de documentos.

## Onde está

- **Clone nesta máquina (`ecommerce06`):** `C:\Aplicações da bononi\bononi-loja`.
- **Remote:** `leobononi2906/bononi-loja`, branch `main`. Push na `main` = produção.
- **Deploy:** https://bononiloja.vercel.app/vendas (chave no Hub = `loja`) — note que a raiz não é
  a tela inicial.
- **Supabase:** `vishxwdxqiygbxmtpfoy`, prefixos `loja_` e `taco_` (+ views `vw_patio_*`,
  `vw_tap_*`, `vw_serv_*`).

## Stack

React + Vite + TypeScript + Tailwind + Radix/shadcn. `npm run dev` para subir; tem `npm run test`.

## Armadilhas deste repo

- **Tacógrafo tem exigência legal.** Ordem de tacógrafo e os documentos anexados são registro
  regulamentado — apagar ou sobrescrever documento aqui não é só perder arquivo. Mexer na
  retenção ou no fluxo pede confirmação antes.
- **Views de serviço (`vw_patio_*`, `vw_tap_*`, `vw_serv_*`) são espelho do Firebird** — nunca
  alterar; a replicação sobrescreve.
- **Separar interno de externo** ao contar serviço e venda: OS de empresa do grupo infla o número.
- Projeto veio de gerador (shadcn/Lovable): tem componente que nunca foi usado. Antes de refatorar
  em massa, confira o que está em uso — e prefira editar o que existe a criar arquivo novo.
- Tela operada em pé, no balcão: altura de controle de **44px** é obrigatória (design system).
