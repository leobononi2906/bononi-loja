# Design system Bononi (interno) — bononi-loja, 2026-09-17

## O que existia antes

`src/index.css:9-116` já tinha um `:root`/`.dark` rotulado `/* === BONONI Design System (HSL) === */`,
mas era um tema genérico de SaaS azul (`--primary: #1A3A8F`, sidebar azul, fonte DM Sans/DM Mono) —
não vinha do design system real da marca (skill `bononi-design`). Não existia `ds/*.css` nem
referência a um pacote compartilhado: os valores estavam escritos à mão, direto neste arquivo.

## O que mudou

App é React + Vite + Tailwind + shadcn/ui — a alavanca aqui não é um arquivo `ds/` separado, é o
próprio `:root`/`.dark` de `src/index.css`, que o `tailwind.config.ts` já mapeia por nome
(`primary`, `secondary`, `accent`, `sidebar-*`, …) no padrão shadcn. Reescrevi os dois blocos com
os tokens canônicos da skill `bononi-design` (`tokens/colors.css`, `tokens/fonts.css`), convertidos
de hex pra HSL (formato que o `tailwind.config.ts` já espera, `hsl(var(--x))`):

- **`--primary` (ação primária) virou tinta** `#14161a` (220 13% 9%) — antes era azul. Vermelho
  (`--accent`, `#c11f25`) fica só pra destaque único por tela, como manda a skill.
- **Sidebar** (`--sidebar-*`) trocou de azul profundo pra tinta (`#14161a`/`#1f232b`), com o rule
  ativo em vermelho (`--sidebar-primary`) — antes usava ciano.
- **`--blue-mid`/`--blue-light`/`--blue-pale`** (usados em `.b-badge-info` e no item ativo da nav)
  foram realocados: `blue-mid` → `--bnn-blue-500` (status info), `blue-light` → `--bnn-red-400`
  (vermelho reverso, a cor que a marca reserva pra realce sobre fundo escuro), `blue-pale` →
  `--bnn-blue-50`. Não são mais "azul" de verdade — o nome ficou só por compatibilidade com quem já
  usa essas variáveis; não renomeei pra não quebrar todo o consumo existente.
- **Neutros, bordas e superfícies** trocaram pra escala grafite fria (`bnn-ink-*`/`bnn-gray-*`) —
  antes eram tons de azul-acinzentado.
- **Fontes**: Archivo (títulos/números grandes) + Barlow (interface) + IBM Plex Mono (código,
  dinheiro, mono) — antes DM Sans/DM Mono. Atualizado no `@import` do Google Fonts em
  `src/index.css` e no `fontFamily` do `tailwind.config.ts`.
- **Raio**: `--radius` 12px→8px (cartão, no padrão da skill), `--radius-sm` 8px→3px (chip).
- **Gráficos** (`--chart-*`) recompostos com as 6 cores distinguíveis da paleta (vermelho, azul,
  âmbar, verde) em vez do azul monocromático anterior.

Nada fora de `src/index.css` e `tailwind.config.ts` precisou mudar — os ~102 arquivos de tela
consomem tudo por classe Tailwind (`bg-primary`, `text-muted-foreground`, `bg-sidebar`, …) ou por
`hsl(var(--x))` nas classes utilitárias do próprio `index.css` (`.b-badge-*`, `.data-table`,
`.b-nav-item`). Confirmado por `npm run build` limpo e checagem visual (visão geral de Vendas e
tabela de Gôndola) — ver Dev-log.

## O que fica de fora, de propósito

- **`GondolaLoja.tsx`** monta HTML de etiqueta térmica (`#000`/`#555`/`#fff` fixos) pra impressão
  física — não é chrome de tela, é o layout da etiqueta impressa; fora do escopo de token de UI.
- **`src/components/ui/chart.tsx`** tem seletores de atributo batendo com hex que o próprio
  Recharts grava inline (`[stroke='#ccc']`, `[stroke='#fff']`) — é boilerplate do shadcn pra anular
  o estilo padrão da lib, não é cor literal da tela.
- **`src/App.css`** é resíduo do template Vite/React (logo girando) e não é importado em lugar
  nenhum — não editei porque está morto, não porque falta migrar.
- **`index.html`** ainda tem título/meta "Lovable App" (resíduo do gerador) — é metadado de
  documento, não token visual; fora do escopo desta aplicação de design system.

## Como conferir depois

Não existia entrada `loja` no `.claude/launch.json` (raiz "Aplicações Bononi") nem `run-loja.cmd`.
Criei os dois. Errei da primeira vez: usei o molde de app estático (caminho curto 8.3, sem
`chcp`) — pra app Vite é o oposto (caminho **real com acento** + `chcp 65001`, ver
`codigo-nesta-maquina` na memória e `run-exped.cmd`); com o caminho curto o Vite responde
"outside of Vite serving allow list" e a tela fica preta, não tem nada a ver com o app em si.
Corrigido, `npm run dev` sobe normal na porta 5305.
