export type Canal = "TODOS" | "LOJA" | "OS";
export type Empresa = "TODAS" | "BONONI PR" | "BONONI SC" | "MLB PR" | "MLB SC" | "MLB SP" | "TRUCKPREST" | "SANTA TEREZA" | "BATTOGO" | "OPERADOR LOGÍSTICO";
export type Grupo = "TODOS" | "Ar condicionado" | "Geladeiras" | "Geradores" | "Acessórios" | "Peças";

export interface DashboardFilters {
  canal: Canal;
  mesAno: Date;
  empresa: Empresa;
  grupo: Grupo;
  /** Day of month start (1-based). null = first day */
  diaInicio: number | null;
  /** Day of month end (1-based). null = last day */
  diaFim: number | null;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCurrencyInt(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Resolve a display name from a row, trying name columns first then falling back to ID */
export function resolveName(row: Record<string, unknown>, ...fields: string[]): string {
  for (const f of fields) {
    const v = row[f];
    if (v != null && String(v).trim() !== "" && String(v).trim() !== "0") {
      return String(v).trim();
    }
  }
  return "-";
}

export function resolveClienteName(row: Record<string, unknown>): string {
  return resolveName(row, "nome_cliente", "cliente", "razao_social", "nome", "id_cliente");
}

export function resolveVendedorName(row: Record<string, unknown>): string {
  return resolveName(row, "nome_vendedor", "vendedor", "nome", "id_vendedor");
}

export function resolveColaboradorName(row: Record<string, unknown>): string {
  return resolveName(row, "nome_colaborador", "colaborador", "nome", "id_colaborador");
}
