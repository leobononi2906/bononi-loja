// Helper: build a vendedor name map + ids set from vw_loja_vendedores rows.
// vw_loja_vendedores columns: id_empresa, empresa, id_vendedor, nome_vendedor,
// departamento, tipo_doc, tipo_saida, faturamento, ...

const LOJA_DEPARTMENTS = new Set(["LOJA", "LOJA / GONDOLA"]);

export interface VendedorInfo {
  /** id_vendedor -> nome_vendedor */
  names: Map<string, string>;
  /** Set of LOJA vendedor ids (for filtering) */
  ids: Set<string>;
}

export function buildVendedorInfo(rows: Array<Record<string, unknown>> | undefined): VendedorInfo {
  const names = new Map<string, string>();
  const ids = new Set<string>();
  (rows ?? []).forEach((row) => {
    const id = String(row.id_vendedor ?? "").trim();
    if (!id || id === "0" || id === "null") return;
    const nome = String(row.nome_vendedor ?? "").trim();
    if (nome && nome !== "null" && nome !== "0") {
      // keep first non-empty name
      if (!names.has(id)) names.set(id, nome);
    }
    const dept = String(row.departamento ?? "").trim().toUpperCase();
    if (LOJA_DEPARTMENTS.has(dept)) ids.add(id);
  });
  return { names, ids };
}

export function resolveVendedorNome(
  id: string | number | null | undefined,
  fallbackName: unknown,
  info: VendedorInfo,
): string {
  const sid = String(id ?? "").trim();
  if (sid && info.names.has(sid)) return info.names.get(sid)!;
  const fb = String(fallbackName ?? "").trim();
  if (fb && fb !== "null" && fb !== "0") return fb;
  return sid ? `Vend. #${sid}` : "-";
}
