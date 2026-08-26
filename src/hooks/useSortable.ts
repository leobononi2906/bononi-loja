import { useState, useMemo } from "react";

export type SortDir = "asc" | "desc";

export interface SortState {
  field: string;
  dir: SortDir;
}

export function useSortable<T extends Record<string, unknown>>(
  data: T[],
  defaultField: string,
  defaultDir: SortDir = "desc"
) {
  const [sort, setSort] = useState<SortState>({ field: defaultField, dir: defaultDir });

  const toggle = (field: string) => {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "desc" }
    );
  };

  const sorted = useMemo(() => {
    // Só compara como número quando os DOIS valores são de fato numéricos —
    // string não-numérica (data "2026-08-25", nome, etc.) vira 0 com
    // `Number(v) || 0` e comparar 0 com 0 não ordena nada (bug real: o ícone
    // trocava de direção mas a lista ficava parada). Datas/textos usam
    // localeCompare, que já ordena certo strings no formato ISO (yyyy-mm-dd[Thh:mm]).
    const isNumeric = (v: unknown) => typeof v === "number" || (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v)));
    return [...data].sort((a, b) => {
      const va = a[sort.field];
      const vb = b[sort.field];
      if (isNumeric(va) && isNumeric(vb)) {
        const na = typeof va === "number" ? va : Number(va);
        const nb = typeof vb === "number" ? vb : Number(vb);
        return sort.dir === "asc" ? na - nb : nb - na;
      }
      const sa = String(va ?? "");
      const sb = String(vb ?? "");
      return sort.dir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [data, sort]);

  return { sorted, sort, toggle };
}
