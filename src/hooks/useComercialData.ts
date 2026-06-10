import { useQuery } from "@tanstack/react-query";
import { getDaysInMonth } from "date-fns";
import type { DashboardFilters } from "@/data/mockData";

export interface FetchError {
  error: string;
  details?: string;
  hint?: string;
}

const ONE_HOUR = 60 * 60 * 1000;

interface FetchViewOptions {
  skipDate?: boolean;
  /** Override date range instead of using mesAno */
  startDate?: string;
  endDate?: string;
  /** Override the date column used for filtering */
  dateCol?: string;
  /** Skip tipo_saida filtering (for cross-channel queries like tapecaria) */
  skipTipoSaida?: boolean;
  /** Skip automatic deduplication */
  skipDedup?: boolean;
  /** Filter by status_os (for vw_os_gerencial) */
  statusOs?: string;
  /** Restrict selected columns for heavy views */
  columns?: string;
}

const VIEWS_WITH_GRUPO = new Set([
  "vw_comercial_itens_faturados",
  "vw_comercial_produtos",
]);

function buildDateRange(filters: DashboardFilters): { startDate: string; endDate: string } {
  const y = filters.mesAno.getFullYear();
  const m = filters.mesAno.getMonth() + 1;
  const mStr = String(m).padStart(2, "0");
  const daysInMonth = getDaysInMonth(filters.mesAno);

  const diaInicio = filters.diaInicio ?? 1;
  const diaFim = filters.diaFim ?? daysInMonth;

  const startDate = `${y}-${mStr}-${String(diaInicio).padStart(2, "0")}`;
  const endDate = `${y}-${mStr}-${String(Math.min(diaFim, daysInMonth)).padStart(2, "0")}`;

  return { startDate, endDate };
}

async function fetchView(
  view: string,
  filters: DashboardFilters,
  limit = 5000,
  options?: FetchViewOptions
): Promise<Record<string, unknown>[]> {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  const params = new URLSearchParams({
    view,
    canal: filters.canal,
    empresa: filters.empresa,
    grupo: VIEWS_WITH_GRUPO.has(view) ? filters.grupo : "TODOS",
    limit: String(limit),
  });

  if (options?.dateCol) {
    params.set("date_col", options.dateCol);
  }

  if (options?.columns) {
    params.set("columns", options.columns);
  }

  if (options?.skipDate) {
    params.set("skip_date", "1");
  } else if (options?.startDate && options?.endDate) {
    params.set("start_date", options.startDate);
    params.set("end_date", options.endDate);
  } else {
    const { startDate, endDate } = buildDateRange(filters);
    params.set("start_date", startDate);
    params.set("end_date", endDate);
  }

  if (options?.skipTipoSaida) {
    params.set("skip_tipo_saida", "1");
  }

  if (options?.skipDedup) {
    params.set("skip_dedup", "1");
  }

  if (options?.statusOs) {
    params.set("status_os", options.statusOs);
  }

  const url = `https://${projectId}.supabase.co/functions/v1/fetch-comercial?${params}`;

  const response = await fetch(url, {
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });

  if (!response.ok) {
    let err: FetchError = { error: `Erro ao buscar ${view}` };

    try {
      err = await response.json();
    } catch {
      // noop
    }

    if (view === "vw_tap_prod_v2" && /statement timeout/i.test(err.error || "")) {
      return [];
    }

    throw new Error(err.error || `Erro ao buscar ${view}`);
  }

  const result = await response.json();
  return result.data || [];
}

export function useViewData(
  view: string,
  filters: DashboardFilters,
  limit = 5000,
  options?: FetchViewOptions
) {
  const { startDate, endDate } = buildDateRange(filters);

  return useQuery({
    queryKey: [
      "view-data",
      view,
      filters.canal,
      options?.startDate || startDate,
      options?.endDate || endDate,
      filters.empresa,
      filters.grupo,
      limit,
      options?.skipDate ?? false,
      options?.dateCol ?? "",
      options?.skipTipoSaida ?? false,
      options?.skipDedup ?? false,
      options?.statusOs ?? "",
      options?.columns ?? "",
    ],
    queryFn: () => fetchView(view, filters, limit, options),
    staleTime: ONE_HOUR,
    refetchInterval: ONE_HOUR,
    retry: 1,
  });
}
