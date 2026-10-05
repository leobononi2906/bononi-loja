import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VIEW_DATE_COLUMNS: Record<string, string | null> = {
  vw_comercial_itens_faturados: "data_faturamento",
  vw_comercial_docs_faturados: "data_faturamento",
  vw_comercial_diario: "data_ref",
  vw_comercial_produtos: null,
  vw_comercial_vendedores: null,
  vw_comercial_clientes: null,
  vw_comercial_loja: "data_faturamento",
  vw_comercial_os: "data_faturamento",
  vw_os_base: "data_faturamento",
  vw_os_base_fat_corrigido: "data_faturamento_corrigida",
  vw_os_res_fat: "data_faturamento",
  vw_os_andamento_v2: null,
  vw_os_ag_fat_v2: null,
  vw_os_servicos_faturados: "data_faturamento",
  vw_os_servico_x_pecas_faturado: "data_faturamento",
  vw_os_pecas_faturadas: "data_faturamento",
  vw_os_gerencial_cards_v2: null,
  vw_patio_apontamentos: "data_apontamento",
  vw_patio_produtividade_v2: "data_apontamento",
  vw_patio_fat_col: "data_faturamento",
  vw_patio_fat_col_v2: "data_faturamento",
  vw_patio_produzido_v2: "data_apontamento",
  vw_os_abert_60d: "data_entrada",
  vw_patio_diario: "data_apontamento",
  vw_patio_diario_v2: "data_apontamento",
  vw_tap_prod_v2: "data_faturamento",
  vw_tap_prod_v3: "data_faturamento",
  vw_tapecaria_apontamentos: "data_apontamento",
  vw_dim_cliente: null,
  vw_dim_contato: null,
  vw_dim_vendedor: null,
  vw_dim_colaborador: null,
  vw_loja_vendedores: "data_faturamento",
  loja_config_colaborador: null,
  geral_patio_horas_reais: "data_apontamento",
  geral_itens_faturados: "data_faturamento",
  geral_docs_faturados: "data_faturamento",
};

const ALLOWED_VIEWS = Object.keys(VIEW_DATE_COLUMNS);

const VIEW_HAS_TIPO_SAIDA = new Set([
  "vw_comercial_itens_faturados",
  "vw_comercial_docs_faturados",
  "vw_comercial_diario",
  "vw_comercial_produtos",
  "vw_comercial_vendedores",
  "vw_comercial_clientes",
  "vw_comercial_loja",
]);

const VIEW_HAS_GRUPO = new Set([
  "vw_comercial_itens_faturados",
  "vw_comercial_produtos",
]);

const VIEW_SKIP_EMPRESA = new Set([
  "vw_dim_cliente",
  "vw_dim_contato",
  "vw_dim_vendedor",
  "vw_dim_colaborador",
  "loja_config_colaborador",
  "geral_patio_horas_reais",
  "geral_itens_faturados",
  "geral_docs_faturados",
]);

const CANAL_TIPO_SAIDA: Record<string, string[]> = {
  OS: ["O.S."],
  LOJA: ["Loja", "LOJA", "loja"],
};

const TODOS_TIPO_SAIDA = ["Loja", "LOJA", "loja", "O.S.", "O.S", "OS"];

const VIEW_DEDUP_KEYS: Record<string, string[]> = {
  vw_comercial_docs_faturados: ["id_doc", "tipo_doc"],
  vw_comercial_diario: ["data_ref", "tipo_doc", "tipo_saida", "id_empresa"],
  vw_comercial_itens_faturados: ["id_doc", "id_produto"],
  vw_os_servicos_faturados: ["id_servico_os"],
  vw_os_pecas_faturadas: ["id_item"],
  vw_os_servico_x_pecas_faturado: ["id_servico_os", "id_os"],
  vw_comercial_loja: ["id_doc"],
  vw_comercial_os: ["id_doc"],
  vw_os_base_fat_corrigido: ["id_os"],
};

function deduplicateRows(rows: Record<string, unknown>[], keyColumns: string[]): Record<string, unknown>[] {
  const seen = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const key = keyColumns.map((c) => String(row[c] ?? "")).join("|");
    const existing = seen.get(key);
    if (!existing || (Number(row.id) || 0) < (Number(existing.id) || 0)) seen.set(key, row);
  }
  return Array.from(seen.values());
}

const PAGE_SIZE = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const VIEW_SELECT_COLUMNS: Record<string, string> = {
  vw_tap_prod_v2: "id_colaborador,nome_colaborador,id_empresa,empresa,data_faturamento,data_apontamento,tipo_lancamento,produto,grupo,subgrupo,id_subgrupo,nome_servico,grupo_serv,id_servico_os,qtd_rateada,horas_colab,horas_total,participacao_perc,produto_rateado,servico_rateado",
  // v3 não tem id_servico_os (pedir essa coluna dava erro 500 em quem não passava `columns`).
  vw_tap_prod_v3: "id_colaborador,nome_colaborador,id_empresa,empresa,data_faturamento,data_apontamento,tipo_lancamento,produto,grupo,subgrupo,id_subgrupo,nome_servico,grupo_serv,qtd_rateada,horas_colab,horas_total,participacao_perc,produto_rateado,servico_rateado",
};

// v3: desde 05/10/2026 a view calcula tudo em < 1 s (bononi-loja/docs/sql/2026-10-05_tap_prod_v3_plano.sql), mas
// recalcula a cada chamada. Pedaço de 31 dias e página de 5.000 = um mês (~2.000 linhas) numa chamada só, sem
// depender de ordem entre páginas (a view não tem chave única para ordenar).
const HEAVY_VIEW_PAGE_SIZE: Record<string, number> = {
  vw_tap_prod_v2: 200,
  vw_tap_prod_v3: 5000,
};

const HEAVY_VIEW_CHUNK_DAYS: Record<string, number> = {
  vw_tap_prod_v2: 1,
  vw_tap_prod_v3: 31,
};

function splitDateRangeIntoChunks(start: string, end: string, chunkDays: number) {
  const chunks: Array<{ start: string; end: string }> = [];
  let cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cursor.getTime() <= last.getTime()) {
    const chunkStart = cursor.toISOString().slice(0, 10);
    const chunkEndDate = new Date(Math.min(cursor.getTime() + (chunkDays - 1) * DAY_MS, last.getTime()));
    const chunkEnd = chunkEndDate.toISOString().slice(0, 10);
    chunks.push({ start: chunkStart, end: chunkEnd });
    cursor = new Date(chunkEndDate.getTime() + DAY_MS);
  }
  return chunks;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const externalUrl = Deno.env.get("EXTERNAL_SUPABASE_URL")!;
    const externalKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY")!;
    const external = createClient(externalUrl, externalKey);

    const url = new URL(req.url);
    const view = url.searchParams.get("view") || "vw_comercial_itens_faturados";
    const canal = url.searchParams.get("canal") || "TODOS";
    const mesAno = url.searchParams.get("mes_ano");
    const empresa = url.searchParams.get("empresa") || "TODAS";
    const grupo = url.searchParams.get("grupo") || "TODOS";
    const maxLimit = parseInt(url.searchParams.get("limit") || "50000");
    const skipDateFilter = url.searchParams.get("skip_date") === "1";
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");
    const dateCol = url.searchParams.get("date_col");
    const skipDedup = url.searchParams.get("skip_dedup") === "1";
    const skipTipoSaida = url.searchParams.get("skip_tipo_saida") === "1";
    const statusOs = url.searchParams.get("status_os");

    if (!ALLOWED_VIEWS.includes(view)) {
      return new Response(
        JSON.stringify({ error: `View n\u00e3o permitida: ${view}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const selectColumns = url.searchParams.get("columns") || VIEW_SELECT_COLUMNS[view] || "*";

    function buildQuery(from: number, to: number, overrideStartDate?: string, overrideEndDate?: string) {
      let query = external.from(view).select(selectColumns).range(from, to);
      if (!skipTipoSaida && VIEW_HAS_TIPO_SAIDA.has(view)) {
        if (canal && canal !== "TODOS") {
          const vals = CANAL_TIPO_SAIDA[canal];
          if (vals) query = vals.length === 1 ? query.eq("tipo_saida", vals[0]) : query.in("tipo_saida", vals);
        } else {
          query = query.in("tipo_saida", TODOS_TIPO_SAIDA);
        }
      }
      if (statusOs && view === "vw_os_base") query = query.eq("status_os", statusOs);
      const dateColumn = dateCol || VIEW_DATE_COLUMNS[view];
      const effStart = overrideStartDate ?? startDate;
      const effEnd = overrideEndDate ?? endDate;
      if (!skipDateFilter && dateColumn) {
        if (effStart && effEnd) {
          query = query.gte(dateColumn, effStart).lte(dateColumn, effEnd);
        } else if (!overrideStartDate && !overrideEndDate && mesAno) {
          const s = `${mesAno}-01`;
          const [y, m] = mesAno.split("-").map(Number);
          const e = `${mesAno}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
          query = query.gte(dateColumn, s).lte(dateColumn, e);
        }
      }
      if (empresa && empresa !== "TODAS" && !VIEW_SKIP_EMPRESA.has(view)) query = query.eq("empresa", empresa);
      if (grupo && grupo !== "TODOS" && VIEW_HAS_GRUPO.has(view)) query = query.eq("grupo", grupo);
      return query;
    }

    async function fetchPagedRange(rangeStart?: string, rangeEnd?: string, remainingLimit = maxLimit) {
      const rows: Record<string, unknown>[] = [];
      let offset = 0;
      let hasMore = true;
      const ps = HEAVY_VIEW_PAGE_SIZE[view] || PAGE_SIZE;
      while (hasMore && offset < remainingLimit) {
        const batchEnd = Math.min(offset + ps - 1, remainingLimit - 1);
        const { data, error } = await buildQuery(offset, batchEnd, rangeStart, rangeEnd);
        if (error) return new Response(JSON.stringify({ error: error.message, details: error.details, hint: error.hint }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (data && data.length > 0) {
          rows.push(...data);
          if (data.length < ps) hasMore = false; else offset += ps;
        } else hasMore = false;
      }
      return rows;
    }

    const allData: Record<string, unknown>[] = [];
    const resolvedDateColumn = dateCol || VIEW_DATE_COLUMNS[view];
    const chunkDays = HEAVY_VIEW_CHUNK_DAYS[view];

    if (chunkDays && !skipDateFilter && resolvedDateColumn && startDate && endDate) {
      for (const chunk of splitDateRangeIntoChunks(startDate, endDate, chunkDays)) {
        const rem = maxLimit - allData.length;
        if (rem <= 0) break;
        const r = await fetchPagedRange(chunk.start, chunk.end, rem);
        if (r instanceof Response) return r;
        allData.push(...r);
      }
    } else {
      const r = await fetchPagedRange(undefined, undefined, maxLimit);
      if (r instanceof Response) return r;
      allData.push(...r);
    }

    let finalData = allData;
    if (!skipDedup) {
      const dk = VIEW_DEDUP_KEYS[view];
      if (dk) finalData = deduplicateRows(allData, dk);
    }

    return new Response(JSON.stringify({ data: finalData, count: finalData.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
