// Helper: resolves cliente names by combining inline rows that already carry
// nome_cliente with client dimension rows (id_cliente/id_contato -> name).

import { supabase } from "@/integrations/supabase/client";

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

// Busca nomes de clientes específicos na vw_dim_cliente pelo id
// Usa os ids que aparecem nos dados do período (não traz todos os 69k)
export async function enrichClienteNames(
  map: ClienteNameMap,
  sources: Array<Array<Record<string, unknown>> | undefined>
): Promise<ClienteNameMap> {
  // Coleta ids que ainda não têm nome resolvido
  const missing = new Set<number>();
  for (const rows of sources) {
    (rows ?? []).forEach(row => {
      const id = String(row.id_cliente ?? row.id_contato ?? "").trim();
      if (!id || id === "0") return;
      if (map.has(id)) return; // já tem nome
      const num = Number(id);
      if (num > 0) missing.add(num);
    });
  }

  if (missing.size === 0) return map;

  // Busca em lotes de 200 (IN clause)
  const ids = Array.from(missing);
  const BATCH = 200;
  const enriched = new Map(map);

  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    try {
      const { data } = await supabase
        .from("vw_dim_cliente")
        .select("id_cliente,nome_cliente")
        .in("id_cliente", batch)
        .range(0, batch.length - 1);

      (data ?? []).forEach(row => {
        const id = String(row.id_cliente ?? "").trim();
        const nome = String(row.nome_cliente ?? "").trim();
        if (id && nome && nome !== "null") enriched.set(id, nome);
      });
    } catch (_) {
      // silencioso — fallback já cuida
    }
  }

  return enriched;
}
