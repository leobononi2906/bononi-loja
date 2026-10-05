-- 2026-10-05 — vw_tap_prod_v3 lenta (77 s/mês; timeout na fetch-comercial)
-- aplicada em produção em 2026-10-05 (pós-conferência: set/2026 = 1.935 linhas,
-- 109.141,19 / 242.615,15; fetch-comercial do mês em 20 s, HTTP 200).
--
-- O QUE FAZ
--   1. Cria public.fn_tap_prod_v3_calc(): o corpo da vw_tap_prod_v3 COPIADO SEM MUDANÇA
--      (pg_get_viewdef de 05/10/2026), dentro de uma função SQL com
--      SET enable_nestloop = off. Só muda o plano, não a regra.
--   2. Troca a vw_tap_prod_v3 por "select * from fn_tap_prod_v3_calc()": mesmas 20
--      colunas, mesmos nomes, mesma ordem e mesmos tipos. Nenhum app precisa mudar.
--
-- POR QUÊ
--   As deduplicações "id IN (SELECT min(id) ... GROUP BY ...)" fazem o planejador
--   estimar 1 linha e escolher nested loop com seq scan repetido. Com nested loop
--   desligado, a view inteira (19.924 linhas) sai em ~0,36 s no servidor; antes, 77 s/mês.
--   Os filtros de data não descem na view de qualquer jeito (data_faturamento é CASE e
--   data_apontamento é min()), então calcular tudo e filtrar fora custa o mesmo.
--
-- O QUE NÃO FAZ
--   Não apaga dado, não mexe em tabela, não altera as tabelas-espelho do replicador
--   (vw_os_base, vw_os_pecas_faturadas, vw_os_servicos_faturados,
--   vw_serv_apontamentos_base) nem os_data_fat_lock.
--
-- SEGURANÇA
--   security definer + search_path fixo reproduz o que a view já fazia: ela roda como
--   o dono (postgres) e por isso já passava pela RLS de os_data_fat_lock.
--   A função só lê; não tem parâmetro.
--
-- VOLTA: docs/sql/2026-10-05_tap_prod_v3_plano_VOLTA.sql (view original + drop da função).

create or replace function public.fn_tap_prod_v3_calc()
returns table (
    data_apontamento date,
    id_empresa integer,
    empresa character varying,
    id_colaborador integer,
    nome_colaborador character varying,
    tipo_lancamento text,
    nome_servico text,
    grupo_serv text,
    data_faturamento date,
    id_produto integer,
    produto character varying,
    grupo character varying,
    id_subgrupo integer,
    subgrupo character varying,
    qtd_rateada numeric,
    horas_colab numeric,
    horas_total numeric,
    participacao_perc numeric,
    produto_rateado numeric,
    servico_rateado numeric
)
language sql
stable
security definer
set search_path = public, pg_temp
set enable_nestloop = off
as $fn$
WITH colab_serv AS (
         SELECT a.id_servico_os,
            a.id_colaborador,
            a.nome_colaborador,
            a.id_empresa,
            a.empresa,
            min(a.data_apontamento) AS data_apontamento,
            sum(
                CASE
                    WHEN a.horas_trabalhadas > 0::double precision THEN LEAST(a.horas_trabalhadas, 8.8::double precision)
                    ELSE 0::double precision
                END) AS horas_colab
           FROM vw_serv_apontamentos_base a
          GROUP BY a.id_servico_os, a.id_colaborador, a.nome_colaborador, a.id_empresa, a.empresa
        ), horas_total_serv AS (
         SELECT colab_serv.id_servico_os,
            sum(colab_serv.horas_colab) AS horas_total
           FROM colab_serv
          GROUP BY colab_serv.id_servico_os
        ), pecas_tap AS (
         SELECT p.id_servico_os,
            p.id_os,
            p.id_produto,
            p.produto,
            p.grupo,
            p.id_subgrupo,
            p.subgrupo,
                CASE
                    WHEN lock.data_faturamento_original IS NOT NULL AND lock.data_faturamento_original < COALESCE(mlb.data_faturamento, p.data_faturamento) THEN lock.data_faturamento_original
                    WHEN mlb.data_faturamento IS NOT NULL THEN mlb.data_faturamento
                    ELSE p.data_faturamento
                END AS data_faturamento,
            sum(p.qtd) AS qtd_total,
            sum(p.total_item) AS total_pecas
           FROM vw_os_pecas_faturadas p
             LEFT JOIN vw_os_base truck_os ON truck_os.id_os = p.id_os AND truck_os.num_controle IS NOT NULL AND truck_os.num_controle::text <> ''::text
             LEFT JOIN vw_os_base mlb ON mlb.id_os::text = truck_os.num_controle::text AND mlb.id_empresa <> truck_os.id_empresa
             LEFT JOIN os_data_fat_lock lock ON lock.id_os = COALESCE(mlb.id_os, p.id_os)
          WHERE (p.id IN ( SELECT min(vw_os_pecas_faturadas.id) AS min
                   FROM vw_os_pecas_faturadas
                  GROUP BY vw_os_pecas_faturadas.id_item)) AND p.total_item > 0::numeric AND upper(p.grupo::text) = 'TAPECARIA'::text AND (p.id_os IN ( SELECT vw_os_base.id_os
                   FROM vw_os_base
                  WHERE (vw_os_base.id IN ( SELECT min(b.id) AS min
                           FROM vw_os_base b
                          GROUP BY b.id_os)) AND vw_os_base.id_tipo_os = 1)) AND p.id_servico_os IS NOT NULL
          GROUP BY p.id_servico_os, p.id_os, p.id_produto, p.produto, p.grupo, p.id_subgrupo, p.subgrupo, (
                CASE
                    WHEN lock.data_faturamento_original IS NOT NULL AND lock.data_faturamento_original < COALESCE(mlb.data_faturamento, p.data_faturamento) THEN lock.data_faturamento_original
                    WHEN mlb.data_faturamento IS NOT NULL THEN mlb.data_faturamento
                    ELSE p.data_faturamento
                END)
        ), servicos_tap AS (
         SELECT s.id_servico_os,
            s.id_os,
            s.nome_servico,
            s.grupo_serv,
                CASE
                    WHEN lock.data_faturamento_original IS NOT NULL AND lock.data_faturamento_original < COALESCE(mlb.data_faturamento, s.data_faturamento) THEN lock.data_faturamento_original
                    WHEN mlb.data_faturamento IS NOT NULL THEN mlb.data_faturamento
                    ELSE s.data_faturamento
                END AS data_faturamento,
            s.total_servico
           FROM vw_os_servicos_faturados s
             LEFT JOIN vw_os_base truck_os ON truck_os.id_os = s.id_os AND truck_os.num_controle IS NOT NULL AND truck_os.num_controle::text <> ''::text
             LEFT JOIN vw_os_base mlb ON mlb.id_os::text = truck_os.num_controle::text AND mlb.id_empresa <> truck_os.id_empresa
             LEFT JOIN os_data_fat_lock lock ON lock.id_os = COALESCE(mlb.id_os, s.id_os)
          WHERE (s.id IN ( SELECT min(vw_os_servicos_faturados.id) AS min
                   FROM vw_os_servicos_faturados
                  GROUP BY vw_os_servicos_faturados.id_servico_os)) AND s.id_tipo_os = 1 AND s.total_servico > 0::numeric AND (s.id_servico_os IN ( SELECT DISTINCT colab_serv.id_servico_os
                   FROM colab_serv))
        )
 SELECT cs.data_apontamento,
    cs.id_empresa,
    cs.empresa,
    cs.id_colaborador,
    cs.nome_colaborador,
    'PRODUTO'::text AS tipo_lancamento,
    NULL::text AS nome_servico,
    NULL::text AS grupo_serv,
    p.data_faturamento,
    p.id_produto,
    p.produto,
    p.grupo,
    p.id_subgrupo,
    p.subgrupo,
    round((p.qtd_total::double precision * cs.horas_colab / NULLIF(ht.horas_total, 0::double precision))::numeric, 3) AS qtd_rateada,
    round(cs.horas_colab::numeric, 2) AS horas_colab,
    round(ht.horas_total::numeric, 2) AS horas_total,
    round((cs.horas_colab / NULLIF(ht.horas_total, 0::double precision) * 100::double precision)::numeric, 1) AS participacao_perc,
    round((p.total_pecas::double precision * cs.horas_colab / NULLIF(ht.horas_total, 0::double precision))::numeric, 2) AS produto_rateado,
    0::numeric AS servico_rateado
   FROM colab_serv cs
     JOIN horas_total_serv ht ON ht.id_servico_os = cs.id_servico_os
     JOIN pecas_tap p ON p.id_servico_os = cs.id_servico_os
UNION ALL
 SELECT cs.data_apontamento,
    cs.id_empresa,
    cs.empresa,
    cs.id_colaborador,
    cs.nome_colaborador,
    'SERVICO'::text AS tipo_lancamento,
    s.nome_servico,
    s.grupo_serv,
    s.data_faturamento,
    NULL::integer AS id_produto,
    NULL::text AS produto,
    NULL::text AS grupo,
    NULL::integer AS id_subgrupo,
    NULL::text AS subgrupo,
    NULL::numeric AS qtd_rateada,
    round(cs.horas_colab::numeric, 2) AS horas_colab,
    round(ht.horas_total::numeric, 2) AS horas_total,
    round((cs.horas_colab / NULLIF(ht.horas_total, 0::double precision) * 100::double precision)::numeric, 1) AS participacao_perc,
    0::numeric AS produto_rateado,
    round((s.total_servico::double precision * cs.horas_colab / NULLIF(ht.horas_total, 0::double precision))::numeric, 2) AS servico_rateado
   FROM colab_serv cs
     JOIN horas_total_serv ht ON ht.id_servico_os = cs.id_servico_os
     JOIN servicos_tap s ON s.id_servico_os = cs.id_servico_os
$fn$;

comment on function public.fn_tap_prod_v3_calc() is
  'Corpo da vw_tap_prod_v3 com enable_nestloop=off (77 s -> <1 s). Ver bononi-loja/docs/sql/2026-10-05_tap_prod_v3_plano.sql.';

create or replace view public.vw_tap_prod_v3 as
select * from public.fn_tap_prod_v3_calc();
