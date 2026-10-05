-- VOLTA da 2026-10-05_tap_prod_v3_plano.sql: devolve a vw_tap_prod_v3 ao texto de
-- 05/10/2026 (pg_get_viewdef) e remove a função. Não apaga dado.

create or replace view public.vw_tap_prod_v3 as
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
     JOIN servicos_tap s ON s.id_servico_os = cs.id_servico_os;

drop function if exists public.fn_tap_prod_v3_calc();
