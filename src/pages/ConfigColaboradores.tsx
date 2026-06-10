import { useState, useEffect } from "react";
import { Settings, Save, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useShell } from "@/components/layout/AppShell";

interface Colaborador {
  id_colaborador: number;
  nome_colaborador: string;
  setor: "PATIO" | "TAPECARIA";
  ativo: boolean;
}

// Busca todos colaboradores que tiveram movimento no mês selecionado
async function fetchColabsAtivos(mes: string, ano: string): Promise<{ id_colaborador: number; nome_colaborador: string }[]> {
  const dataInicio = `${ano}-${mes.padStart(2,"0")}-01`;
  const dataFim    = `${ano}-${mes.padStart(2,"0")}-31`;

  // SV (serviços/pátio)
  const { data: sv } = await supabase
    .from("vw_patio_fat_col_v2" as never)
    .select("id_colaborador, nome_colaborador")
    .gte("data_faturamento", dataInicio)
    .lte("data_faturamento", dataFim)
    .range(0, 9999);

  // OP (tapeçaria) — usa v3
  const { data: op } = await supabase
    .from("vw_tap_prod_v3" as never)
    .select("id_colaborador, nome_colaborador")
    .gte("data_faturamento", dataInicio)
    .lte("data_faturamento", dataFim)
    .range(0, 9999);

  const map = new Map<number, string>();
  [...(sv ?? []), ...(op ?? [])].forEach((r: any) => {
    if (r.id_colaborador && r.nome_colaborador) {
      map.set(Number(r.id_colaborador), String(r.nome_colaborador));
    }
  });
  return Array.from(map.entries())
    .map(([id, nome]) => ({ id_colaborador: id, nome_colaborador: nome }))
    .sort((a, b) => a.nome_colaborador.localeCompare(b.nome_colaborador));
}

export default function ConfigColaboradores() {
  const { filters } = useShell();
  const qc = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Record<number, "PATIO" | "TAPECARIA">>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // Config atual no banco
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ["loja_config_colaborador"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loja_config_colaborador")
        .select("id_colaborador, nome_colaborador, setor, ativo")
        .range(0, 9999);
      if (error) throw error;
      const map: Record<number, Colaborador> = {};
      (data ?? []).forEach((r: any) => { map[r.id_colaborador] = r as Colaborador; });
      return map;
    },
  });

  // Colaboradores ativos no mês filtrado
  const { data: colabsAtivos, isLoading: colabsLoading } = useQuery({
    queryKey: ["colabs_ativos", filters.mes, filters.ano],
    queryFn: () => fetchColabsAtivos(String(filters.mes ?? new Date().getMonth() + 1), String(filters.ano ?? new Date().getFullYear())),
  });

  const config = configData ?? {};

  function getSetor(id: number): "PATIO" | "TAPECARIA" {
    if (pendingChanges[id] !== undefined) return pendingChanges[id];
    return config[id]?.setor ?? "PATIO";
  }

  function toggle(id: number, nome: string) {
    const atual = getSetor(id);
    const novo: "PATIO" | "TAPECARIA" = atual === "PATIO" ? "TAPECARIA" : "PATIO";
    setPendingChanges(prev => ({ ...prev, [id]: novo }));
  }

  async function salvar() {
    if (Object.keys(pendingChanges).length === 0) return;
    setSaving(true);
    setSavedMsg("");

    const upserts = Object.entries(pendingChanges).map(([id, setor]) => ({
      id_colaborador: Number(id),
      nome_colaborador: config[Number(id)]?.nome_colaborador
        ?? colabsAtivos?.find(c => c.id_colaborador === Number(id))?.nome_colaborador
        ?? String(id),
      setor,
      ativo: true,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("loja_config_colaborador")
      .upsert(upserts, { onConflict: "id_colaborador" });

    setSaving(false);
    if (!error) {
      setPendingChanges({});
      setSavedMsg("Salvo com sucesso!");
      qc.invalidateQueries({ queryKey: ["loja_config_colaborador"] });
      qc.invalidateQueries({ queryKey: ["config_patio"] });
      qc.invalidateQueries({ queryKey: ["config_tapecaria"] });
      setTimeout(() => setSavedMsg(""), 3000);
    } else {
      setSavedMsg("Erro ao salvar: " + error.message);
    }
  }

  const isLoading = configLoading || colabsLoading;
  const hasPending = Object.keys(pendingChanges).length > 0;

  const colabs = colabsAtivos ?? [];
  const patio     = colabs.filter(c => getSetor(c.id_colaborador) === "PATIO");
  const tapecaria = colabs.filter(c => getSetor(c.id_colaborador) === "TAPECARIA");

  return (
    <div className="dashboard-section space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold font-display">Configuração de Colaboradores</h2>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && (
            <span className={`text-xs ${savedMsg.includes("Erro") ? "text-destructive" : "text-green-600"}`}>
              {savedMsg}
            </span>
          )}
          {hasPending && (
            <Button size="sm" onClick={salvar} disabled={saving}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? "Salvando..." : `Salvar (${Object.keys(pendingChanges).length})`}
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Mostrando colaboradores com faturamento no período selecionado. Clique no badge para alternar entre Pátio e Tapeçaria.
      </p>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PÁTIO */}
          <div className="chart-container">
            <h3 className="text-sm font-semibold font-display mb-4 text-foreground flex items-center gap-2">
              Pátio
              <Badge variant="secondary">{patio.length}</Badge>
            </h3>
            <div className="space-y-1">
              {patio.length === 0 && <p className="text-xs text-muted-foreground">Nenhum colaborador</p>}
              {patio.map(c => (
                <div key={c.id_colaborador}
                  className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggle(c.id_colaborador, c.nome_colaborador)}
                >
                  <span className="text-xs font-medium">{c.nome_colaborador}</span>
                  <div className="flex items-center gap-2">
                    {pendingChanges[c.id_colaborador] !== undefined && (
                      <span className="text-xs text-orange-500">●</span>
                    )}
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer text-xs">
                      PÁTIO → TAPECARIA
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TAPEÇARIA */}
          <div className="chart-container">
            <h3 className="text-sm font-semibold font-display mb-4 text-foreground flex items-center gap-2">
              Tapeçaria
              <Badge variant="secondary">{tapecaria.length}</Badge>
            </h3>
            <div className="space-y-1">
              {tapecaria.length === 0 && <p className="text-xs text-muted-foreground">Nenhum colaborador</p>}
              {tapecaria.map(c => (
                <div key={c.id_colaborador}
                  className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggle(c.id_colaborador, c.nome_colaborador)}
                >
                  <span className="text-xs font-medium">{c.nome_colaborador}</span>
                  <div className="flex items-center gap-2">
                    {pendingChanges[c.id_colaborador] !== undefined && (
                      <span className="text-xs text-orange-500">●</span>
                    )}
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer text-xs">
                      TAPECARIA → PÁTIO
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
