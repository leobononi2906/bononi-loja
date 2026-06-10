// Helper: resolves cliente names by combining inline rows that already carry
// nome_cliente with client dimension rows (id_cliente/id_contato -> name).

export type ClienteNameMap = Map<string, string>;

export function buildClienteNameMap(
  ...sources: Array<Array<Record<string, unknown>> | undefined>
): ClienteNameMap {
  const map: ClienteNameMap = new Map();
  for (const rows of sources) {
    (rows ?? []).forEach((row) => {
      const id = String(row.id_cliente ?? row.id_contato ?? "").trim();
      if (!id) return;
      const nome = String(
        row.nome_cliente ?? row.nome_contato ?? row.razao_social ?? row.nome ?? ""
      ).trim();
      if (!nome || nome === "null" || nome === "0") return;
      if (!map.has(id)) map.set(id, nome);
    });
  }
  return map;
}

export function resolveClienteNome(
  id: string | number | null | undefined,
  fallback: unknown,
  map: ClienteNameMap,
): string {
  const sid = String(id ?? "").trim();
  if (sid && map.has(sid)) return map.get(sid)!;
  const fb = String(fallback ?? "").trim();
  if (fb && fb !== "null" && fb !== "0" && !fb.startsWith("#") && !/^\d+$/.test(fb)) return fb;
  return sid ? `Cliente #${sid}` : "-";
}
