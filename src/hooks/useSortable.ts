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
    return [...data].sort((a, b) => {
      const va = a[sort.field];
      const vb = b[sort.field];
      const na = typeof va === "number" ? va : Number(va) || 0;
      const nb = typeof vb === "number" ? vb : Number(vb) || 0;
      if (typeof va === "number" || typeof vb === "number" || !isNaN(na) && String(va) !== "") {
        return sort.dir === "asc" ? na - nb : nb - na;
      }
      const sa = String(va || "");
      const sb = String(vb || "");
      return sort.dir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [data, sort]);

  return { sorted, sort, toggle };
}
