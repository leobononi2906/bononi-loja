import { useState } from "react";
import { Settings, Save } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useShell } from "@/components/layout/AppShell";
import { getMonth, getYear } from "date-fns";

interface Colaborador {
  id_colaborador: number;
  nome_colaborador: string;
  setor: "PATIO" | "TAPECARIA";
  ativo: boolean;
}

const SUPABASE_URL = "https://vishxwdxqiygbxmtpfoy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpc2h4d2R4cWl5Z2J4bXRwZm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Njg2MjIsImV4cCI6MjA4ODA0NDYyMn0.J647m3ieDHahNQYBWMRESl0aPFXsT_zt_7ZcDvyB-SA";

async function fetchViaEdge(view: string, startDate: string, endDate: string, columns: string) {
  const params = new URLSearchParams({
    view, canal: "TODOS", empresa: "TODAS", grupo: "TODOS",
    limit: "9999", start_date: startDate, end_date: endDate, columns,
    skip_tipo_saida: "1",
  });
  const res = await fetch(`${SUPABASE_URL}/functions/v1/fetch-comercial?${params}`, {
    headers: { apikey: SUPABASE_KEY },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

async function fetchColabsAtivos(mes: number, ano: number) {
  const m = String(mes).padStart(2, "0");
  const start = `${ano}-${m}-01`;
  // Calcula último dia real do mês (evita end_date=XX-31 em meses com 30 ou 28 dias)
  const lastDay = new Date(ano, mes, 0).getDate();
  const end   = `${ano}-${m}-${String(lastDay).padStart(2, "0")}`;
  const cols  = "id_colaborador,nome_colaborador";

  const [sv, op] = await Promise.all([
    fetchViaEdge("vw_patio_fat_col_v2", start, end, cols),
    fetchViaEdge("vw_tap_prod_v3",       start, end, cols + ",produto_rateado,servico_rateado"),
  ]);

  const map = new Map<number, string>();
  [...sv, ...op].forEach((r: any) => {
    // para v3 só incluir se tiver valor
    const hasValue = r.produto_rateado !== undefined
      ? (Number(r.produto_rateado) || 0) + (Number(r.servico_rateado) || 0) > 0
      : true;
    if (r.id_colaborador && r.nome_colaborador && hasValue) {
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

  const mes = getMonth(filters.mesAno) + 1;
  const ano = getYear(filters.mesAno);

  // Config atual do banco
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ["loja_config_colaborador"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loja_config_colaborador" as never)
        .select("id_colaborador, nome_colaborador, setor, ativo")
        .range(0, 9999);
      if (error) throw error;
      const map: Record<number, Colaborador> = {};
      (data ?? []).forEach((r: any) => { map[r.id_colaborador] = r as Colaborador; });
      return map;
    },
  });

  // Colaboradores que tiveram movimento no mês
  const { data: colabsAtivos, isLoading: colabsLoading } = useQuery({
    queryKey: ["colabs_ativos", mes, ano],
    queryFn: () => fetchColabsAtivos(mes, ano),
    staleTime: 5 * 60 * 1000,
  });

  const config = configData ?? {};

  function getSetor(id: number): "PATIO" | "TAPECARIA" {
    if (pendingChanges[id] !== undefined) return pendingChanges[id];
    return config[id]?.setor ?? "PATIO";
  }

  function toggle(id: number) {
    const novo: "PATIO" | "TAPECARIA" = getSetor(id) === "PATIO" ? "TAPECARIA" : "PATIO";
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
      .from("loja_config_colaborador" as never)
      .upsert(upserts as never, { onConflict: "id_colaborador" } as never);

    setSaving(false);
    if (!error) {
      setPendingChanges({});
      setSavedMsg("Salvo!");
      qc.invalidateQueries({ queryKey: ["loja_config_colaborador"] });
      qc.invalidateQueries({ queryKey: ["config_patio"] });
      qc.invalidateQueries({ queryKey: ["config_tapecaria"] });
      setTimeout(() => setSavedMsg(""), 3000);
    } else {
      setSavedMsg("Erro: " + error.message);
    }
  }

  const isLoading = configLoading || colabsLoading;
  const colabs = colabsAtivos ?? [];
  const patio     = colabs.filter(c => getSetor(c.id_colaborador) === "PATIO");
  const tapecaria = colabs.filter(c => getSetor(c.id_colaborador) === "TAPECARIA");
  const hasPending = Object.keys(pendingChanges).length > 0;

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-base font-semibold font-display">Config. Colaboradores</h2>
            <p className="text-xs text-muted-foreground">Clique no colaborador para alternar o setor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8 text-center animate-pulse">
          Carregando colaboradores do mês...
        </div>
      ) : colabs.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          Nenhum colaborador com movimento em {String(mes).padStart(2,"0")}/{ano}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* PÁTIO */}
          <div className="chart-container">
            <h3 className="text-sm font-semibold font-display mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Pátio
              <Badge variant="secondary" className="text-xs">{patio.length}</Badge>
            </h3>
            <div className="space-y-0.5">
              {patio.length === 0 && <p className="text-xs text-muted-foreground py-2">Nenhum</p>}
              {patio.map(c => (
                <div
                  key={c.id_colaborador}
                  onClick={() => toggle(c.id_colaborador)}
                  className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                >
                  <span className="text-xs font-medium">{c.nome_colaborador}</span>
                  <div className="flex items-center gap-1.5">
                    {pendingChanges[c.id_colaborador] !== undefined && (
                      <span className="text-[10px] text-orange-500 font-medium">alterado</span>
                    )}
                    <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 cursor-pointer hover:bg-blue-200">
                      → TAP
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TAPEÇARIA */}
          <div className="chart-container">
            <h3 className="text-sm font-semibold font-display mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
              Tapeçaria
              <Badge variant="secondary" className="text-xs">{tapecaria.length}</Badge>
            </h3>
            <div className="space-y-0.5">
              {tapecaria.length === 0 && <p className="text-xs text-muted-foreground py-2">Nenhum</p>}
              {tapecaria.map(c => (
                <div
                  key={c.id_colaborador}
                  onClick={() => toggle(c.id_colaborador)}
                  className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                >
                  <span className="text-xs font-medium">{c.nome_colaborador}</span>
                  <div className="flex items-center gap-1.5">
                    {pendingChanges[c.id_colaborador] !== undefined && (
                      <span className="text-[10px] text-orange-500 font-medium">alterado</span>
                    )}
                    <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 cursor-pointer hover:bg-purple-200">
                      → PAT
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

