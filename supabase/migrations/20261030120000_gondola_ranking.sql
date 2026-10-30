-- 2026-10-30 — Gôndola: subaba Ranking (pedido do Leo). Aplicada em produção 30/10
-- (migrations loja_gondola_ranking, _inclui_os_loja, _vendedores_balcao — este arquivo é o estado final).
--
-- Mede o que a gôndola vende para reorganizar a loja. Venda da loja =
--   (a) itens faturados com tipo de saída LOJA (id_tipo_saida = 1), de QUALQUER empresa —
--       "o que está em gôndola está aqui" (Leo), então não filtra empresa; e
--   (b) peças de REVENDA (id_servico_os nulo) de O.S. feitas por vendedor de BALCÃO
--       (tabela loja_vendedor_balcao).
-- Por que (b): a partir de 07/09/2026 a loja quase parou de faturar como tipo LOJA (~100 vendas
-- por semana → ~5) e os vendedores do balcão passaram a vender por O.S. (Michael 49 O.S. em
-- jun–set → 427 depois). Só com (a) os últimos 2 meses ficavam zerados. Decisão do Leo 30/10.
-- Por que lista de vendedores e não "departamento LOJA": Alexsandro e Henrique também são do
-- departamento LOJA, mas são consultores da oficina (centenas de O.S. de pátio por mês); com eles
-- a peça instalada em serviço virava "venda da gôndola". Balcão = quem vendia como tipo LOJA
-- (Michael, Claudeir, Thiago, Marcio). Vendedor novo no balcão → inserir em loja_vendedor_balcao.
-- Peça fabricada (id_servico_os preenchido, ex.: capa da tapeçaria) fica fora — não é gôndola.
--
-- 1) loja_gondola.local  — onde o produto está ("Gôndola 1".."Gôndola 6" ou "Expositor - <nome>").
--    Opcional; a lista é fixa no front. O mapa da loja virá depois.
-- 2) loja_gondola_ranking(p_dias) — 1 linha por referência: todos os itens da gôndola (mesmo os
--    que não venderam) + os que NÃO estão na gôndola mas venderam pelo menos
--    max(2, p_dias/30) vezes no período (na_gondola = false; a tela mostra num bloco à parte).
--    vendas = nº de vendas (documentos distintos), não unidades. ultima_venda olha 2 anos para trás,
--    independente do período escolhido. estoque e localizacao_erp = empresa 2 (MLB PR, a da loja,
--    a mesma que a tela de Etiquetas usa para o preço). ~1,4 s por chamada.
-- Não apaga nada.

alter table public.loja_gondola add column if not exists local text;

create table if not exists public.loja_vendedor_balcao (
  id_vendedor integer primary key,
  nome text not null,
  criado_em timestamptz not null default now()
);
alter table public.loja_vendedor_balcao enable row level security;
drop policy if exists loja_vendedor_balcao_ler on public.loja_vendedor_balcao;
create policy loja_vendedor_balcao_ler on public.loja_vendedor_balcao for select to authenticated using (true);
revoke all on public.loja_vendedor_balcao from anon, authenticated;
grant select on public.loja_vendedor_balcao to authenticated;

insert into public.loja_vendedor_balcao (id_vendedor, nome) values
  (47544, 'MICHAEL DOUGLAS RAMOS DOS SANTOS'),
  (7686,  'CLAUDEIR HENRIQUE TROMBINI'),
  (10532, 'THIAGO NOVAK LAZZARIM'),
  (14803, 'MARCIO SANTOS DE ANDRADE')
on conflict (id_vendedor) do nothing;

create or replace function public.loja_gondola_ranking(p_dias integer default 90)
returns table (
  referencia text, produto text, grupo text, na_gondola boolean, id_gondola bigint, local text,
  vendas integer, qtd numeric, fat numeric, ultima_venda date, estoque numeric, localizacao_erp text
)
language sql
stable
set search_path = public
as $$
  with itens as (
    select distinct i.tipo_doc, i.id_doc, i.id_item, btrim(i.referencia) as ref, i.produto, i.grupo,
           i.qtd, i.total_item, i.data_faturamento
      from vw_comercial_itens_faturados i
     where i.id_tipo_saida = 1
       and i.data_faturamento >= current_date - 730
    union
    select distinct 'O.S.', o.id_os, o.id_item, btrim(o.referencia), o.produto, o.grupo,
           o.qtd, o.total_item, o.data_faturamento
      from vw_os_pecas_faturadas o
     where o.id_servico_os is null
       and o.data_faturamento >= current_date - 730
       and o.id_vendedor in (select b.id_vendedor from loja_vendedor_balcao b)
  ),
  por_ref as (
    select ref,
           max(produto) as produto,
           max(grupo) as grupo,
           count(distinct (tipo_doc, id_doc)) filter (where data_faturamento >= current_date - p_dias) as vendas,
           coalesce(sum(qtd) filter (where data_faturamento >= current_date - p_dias), 0) as qtd,
           coalesce(sum(total_item) filter (where data_faturamento >= current_date - p_dias), 0) as fat,
           max(data_faturamento)::date as ultima_venda
      from itens
     group by ref
  ),
  prod as (
    select distinct on (btrim(p.referencia)) btrim(p.referencia) as ref, p.grupo, p.estoque_fisico,
           nullif(btrim(p.localizacao), '') as localizacao
      from vw_fb_produtos_compras p
     where p.id_empresa = 2
     order by btrim(p.referencia), p.id
  ),
  gond as (
    select g.id, btrim(g.referencia) as ref, g.nome, g.local from loja_gondola g
  )
  select coalesce(g.ref, r.ref)::text,
         coalesce(g.nome, r.produto)::text,
         coalesce(p.grupo, r.grupo)::text,
         g.id is not null,
         g.id::bigint,
         g.local,
         coalesce(r.vendas, 0)::integer,
         coalesce(r.qtd, 0)::numeric,
         round(coalesce(r.fat, 0)::numeric, 2),
         r.ultima_venda,
         p.estoque_fisico::numeric,
         p.localizacao::text
    from gond g
    full join por_ref r on r.ref = g.ref
    left join prod p on p.ref = coalesce(g.ref, r.ref)
   where g.id is not null
      or r.vendas >= greatest(2, p_dias / 30);
$$;

revoke all on function public.loja_gondola_ranking(integer) from public, anon;
grant execute on function public.loja_gondola_ranking(integer) to authenticated;

-- Volta:
--   drop function public.loja_gondola_ranking(integer);
--   drop table public.loja_vendedor_balcao;
--   alter table public.loja_gondola drop column local;
