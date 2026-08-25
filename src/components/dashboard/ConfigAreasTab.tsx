import { useState } from "react";
import { MapPin, Plus, GripVertical } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { db, distLog, type DistArea } from "@/lib/dist";
import { TableSkeleton } from "./LoadingSkeleton";
import { ErrorAlert } from "./ErrorAlert";

export function ConfigAreasTab() {
  const qc = useQueryClient();
  const [novaArea, setNovaArea] = useState("");
  const [salvandoNova, setSalvandoNova] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");

  const { data: areas, isLoading, error } = useQuery({
    queryKey: ["dist_areas"],
    queryFn: async () => {
      const { data, error } = await db.from("dist_areas").select("*").order("ordem", { ascending: true }).range(0, 9999);
      if (error) throw error;
      return (data ?? []) as DistArea[];
    },
  });

  const lista = Array.isArray(areas) ? areas : [];

  async function adicionar() {
    const nome = novaArea.trim();
    if (!nome) return;
    setSalvandoNova(true);
    const maxOrdem = lista.reduce((m, a) => Math.max(m, a.ordem ?? 0), 0);
    const { error } = await db.from("dist_areas").insert({ nome, ativo: true, ordem: maxOrdem + 1 });
    setSalvandoNova(false);
    if (error) {
      toast.error("Erro ao criar área: " + error.message);
      distLog("error", "ERRO_CRIAR_AREA", error.message);
      return;
    }
    setNovaArea("");
    toast.success("Área criada.");
    qc.invalidateQueries({ queryKey: ["dist_areas"] });
  }

  async function salvarNome(id: number) {
    const nome = editNome.trim();
    setEditId(null);
    if (!nome) return;
    const { error } = await db.from("dist_areas").update({ nome, atualizado_em: new Date().toISOString() }).eq("id", id);
    if (error) {
      toast.error("Erro ao renomear: " + error.message);
      distLog("error", "ERRO_RENOMEAR_AREA", error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["dist_areas"] });
  }

  async function toggleAtivo(area: DistArea) {
    const { error } = await db.from("dist_areas").update({ ativo: !area.ativo, atualizado_em: new Date().toISOString() }).eq("id", area.id);
    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
      distLog("error", "ERRO_TOGGLE_AREA", error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["dist_areas"] });
  }

  if (isLoading) return <TableSkeleton />;
  if (error) return <ErrorAlert message="Erro ao carregar áreas" details={(error as Error).message} />;

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-base font-semibold font-display">Configurações · Áreas</h2>
          <p className="text-xs text-muted-foreground">Áreas de destino da distribuição de serviços (Pátio, Tapeçaria, etc.)</p>
        </div>
      </div>

      <div className="chart-container space-y-0.5">
        {lista.length === 0 && (
          <p className="text-xs text-muted-foreground py-6 text-center">Nenhuma área cadastrada ainda.</p>
        )}
        {lista.map((a) => (
          <div key={a.id} className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/40">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              {editId === a.id ? (
                <Input
                  autoFocus
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  onBlur={() => salvarNome(a.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setEditId(null);
                  }}
                  className="h-7 text-sm max-w-[240px]"
                />
              ) : (
                <span
                  className={`text-sm font-medium cursor-text truncate ${!a.ativo ? "text-muted-foreground line-through" : ""}`}
                  onClick={() => { setEditId(a.id); setEditNome(a.nome); }}
                  title="Clique para renomear"
                >
                  {a.nome}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`b-badge ${a.ativo ? "b-badge-ok" : "b-badge-muted"}`}>{a.ativo ? "Ativa" : "Inativa"}</span>
              <Switch checked={a.ativo} onCheckedChange={() => toggleAtivo(a)} />
            </div>
          </div>
        ))}
      </div>

      <div className="chart-container">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Nova área</h3>
        <div className="flex items-center gap-2">
          <Input
            value={novaArea}
            onChange={(e) => setNovaArea(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") adicionar(); }}
            placeholder="Ex: Elétrica, Funilaria..."
            className="h-8 text-sm max-w-[280px]"
          />
          <Button size="sm" onClick={adicionar} disabled={salvandoNova || !novaArea.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}
