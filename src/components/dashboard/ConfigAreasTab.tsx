import { useState } from "react";
import { MapPin, Plus, GripVertical, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  db, distLog, type DistArea, type ColaboradorDim, type ServicopOption, type DistServicoRow,
} from "@/lib/dist";
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

      <MapaAreaSection areas={lista.filter((a) => a.ativo)} />
    </div>
  );
}

interface DistAreaServicop {
  id: number;
  id_area: number;
  id_servicop: number;
  nome_servicop: string;
}

interface DistColaboradorArea {
  id: number;
  id_colaborador: number;
  id_area: number;
}

function MapaAreaSection({ areas }: { areas: DistArea[] }) {
  const qc = useQueryClient();
  const [areaSelId, setAreaSelId] = useState<string>(areas[0] ? String(areas[0].id) : "");
  const [buscaServicop, setBuscaServicop] = useState("");
  const [buscaColab, setBuscaColab] = useState("");

  const { data: mapaServicop, isLoading: loadingMapa } = useQuery({
    queryKey: ["dist_area_servicop"],
    queryFn: async () => {
      const { data, error } = await db.from("dist_area_servicop").select("*").range(0, 9999);
      if (error) throw error;
      return (data ?? []) as DistAreaServicop[];
    },
  });

  const { data: mapaColab, isLoading: loadingMapaColab } = useQuery({
    queryKey: ["dist_colaborador_area"],
    queryFn: async () => {
      const { data, error } = await db.from("dist_colaborador_area").select("*").range(0, 9999);
      if (error) throw error;
      return (data ?? []) as DistColaboradorArea[];
    },
  });

  // Catálogo de códigos de serviço = distinct id_servicop/servico já visto em vw_dist_servicos
  // (fonte viva, sem precisar replicar TBL_SERVICOP à parte).
  const { data: servicosVista, isLoading: loadingCatalogo } = useQuery({
    queryKey: ["dist_servicop_catalogo"],
    queryFn: async () => {
      const { data, error } = await db.from("vw_dist_servicos").select("id_servicop, servico").range(0, 9999);
      if (error) throw error;
      return (data ?? []) as Pick<DistServicoRow, "id_servicop" | "servico">[];
    },
  });

  const { data: colaboradores, isLoading: loadingColabs } = useQuery({
    queryKey: ["vw_dim_colaborador_ativos"],
    queryFn: async () => {
      const { data, error } = await db
        .from("vw_dim_colaborador")
        .select("id_colaborador, nome_colaborador, situacao, departamento")
        .eq("situacao", "A")
        .order("nome_colaborador", { ascending: true })
        .range(0, 9999);
      if (error) throw error;
      return (data ?? []) as ColaboradorDim[];
    },
  });

  const isLoading = loadingMapa || loadingMapaColab || loadingCatalogo || loadingColabs;
  if (isLoading) return <TableSkeleton />;
  if (areas.length === 0) {
    return <p className="text-xs text-muted-foreground">Ative uma área acima para configurar códigos de serviço e colaboradores.</p>;
  }

  const mapaList = mapaServicop ?? [];
  const mapaColabList = mapaColab ?? [];
  const colabsList = colaboradores ?? [];
  const areaSel = areas.find((a) => String(a.id) === areaSelId) ?? areas[0];

  const catalogo: ServicopOption[] = [];
  const vistos = new Set<number>();
  (servicosVista ?? []).forEach((s) => {
    if (!vistos.has(s.id_servicop)) { vistos.add(s.id_servicop); catalogo.push({ id_servicop: s.id_servicop, servico: s.servico }); }
  });
  catalogo.sort((a, b) => a.servico.localeCompare(b.servico));

  const servicopJaMapeado = new Set(mapaList.map((m) => m.id_servicop));
  const servicopDestaArea = mapaList.filter((m) => m.id_area === areaSel.id);
  const servicopDisponiveis = catalogo
    .filter((s) => !servicopJaMapeado.has(s.id_servicop))
    .filter((s) => s.servico.toLowerCase().includes(buscaServicop.trim().toLowerCase()));

  const colabsDestaArea = mapaColabList.filter((m) => m.id_area === areaSel.id);
  const colabsIdsDestaArea = new Set(colabsDestaArea.map((c) => c.id_colaborador));
  const colabNome = (id: number) => colabsList.find((c) => c.id_colaborador === id)?.nome_colaborador ?? `#${id}`;
  const colabsDisponiveis = colabsList
    .filter((c) => !colabsIdsDestaArea.has(c.id_colaborador))
    .filter((c) => c.nome_colaborador.toLowerCase().includes(buscaColab.trim().toLowerCase()));

  async function addServicop(s: ServicopOption) {
    const { error } = await db.from("dist_area_servicop").insert({ id_area: areaSel.id, id_servicop: s.id_servicop, nome_servicop: s.servico });
    if (error) {
      toast.error("Erro ao vincular serviço: " + error.message);
      distLog("error", "ERRO_VINCULAR_SERVICOP", error.message);
      return;
    }
    toast.success(`"${s.servico}" agora cai automático em ${areaSel.nome}.`);
    qc.invalidateQueries({ queryKey: ["dist_area_servicop"] });
  }

  async function removeServicop(id: number) {
    const { error } = await db.from("dist_area_servicop").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover: " + error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["dist_area_servicop"] });
  }

  async function addColab(c: ColaboradorDim) {
    const { error } = await db.from("dist_colaborador_area").insert({ id_area: areaSel.id, id_colaborador: c.id_colaborador });
    if (error) {
      toast.error("Erro ao vincular colaborador: " + error.message);
      distLog("error", "ERRO_VINCULAR_COLABORADOR_AREA", error.message);
      return;
    }
    toast.success(`${c.nome_colaborador} adicionado a ${areaSel.nome}.`);
    qc.invalidateQueries({ queryKey: ["dist_colaborador_area"] });
  }

  async function removeColab(id: number) {
    const { error } = await db.from("dist_colaborador_area").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover: " + error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["dist_colaborador_area"] });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Configurar área</span>
        <Select value={areaSelId || String(areaSel.id)} onValueChange={setAreaSelId}>
          <SelectTrigger className="h-8 w-[200px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {areas.map((a) => <SelectItem key={a.id} value={String(a.id)} className="text-xs">{a.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Códigos de serviço da área */}
        <div className="chart-container">
          <h3 className="text-sm font-semibold font-display mb-1">Códigos de serviço (automático)</h3>
          <p className="text-xs text-muted-foreground mb-2">Se o vendedor lança a OS com um desses códigos, cai direto em {areaSel.nome}.</p>
          <div className="space-y-0.5 mb-2 max-h-40 overflow-y-auto">
            {servicopDestaArea.length === 0 && <p className="text-xs text-muted-foreground py-2">Nenhum código vinculado ainda.</p>}
            {servicopDestaArea.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-muted/40">
                <span className="text-xs">{m.nome_servicop} <span className="text-muted-foreground font-mono">#{m.id_servicop}</span></span>
                <button onClick={() => removeServicop(m.id)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <Input value={buscaServicop} onChange={(e) => setBuscaServicop(e.target.value)} placeholder="Buscar código de serviço..." className="h-7 text-xs mb-1" />
          <div className="max-h-32 overflow-y-auto border rounded-md">
            {servicopDisponiveis.length === 0 && <p className="text-xs text-muted-foreground py-2 px-2">Nada encontrado (ou tudo já vinculado a alguma área).</p>}
            {servicopDisponiveis.map((s) => (
              <button
                key={s.id_servicop}
                onClick={() => addServicop(s)}
                className="w-full text-left text-xs px-2 py-1 hover:bg-muted/60 flex items-center justify-between"
              >
                <span>{s.servico}</span>
                <Plus className="h-3 w-3 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Colaboradores da área */}
        <div className="chart-container">
          <h3 className="text-sm font-semibold font-display mb-1">Colaboradores da área</h3>
          <p className="text-xs text-muted-foreground mb-2">Alimenta o Painel do Gestor.</p>
          <div className="space-y-0.5 mb-2 max-h-40 overflow-y-auto">
            {colabsDestaArea.length === 0 && <p className="text-xs text-muted-foreground py-2">Nenhum colaborador vinculado ainda.</p>}
            {colabsDestaArea.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-muted/40">
                <span className="text-xs">{colabNome(m.id_colaborador)}</span>
                <button onClick={() => removeColab(m.id)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <Input value={buscaColab} onChange={(e) => setBuscaColab(e.target.value)} placeholder="Buscar colaborador..." className="h-7 text-xs mb-1" />
          <div className="max-h-32 overflow-y-auto border rounded-md">
            {colabsDisponiveis.length === 0 && <p className="text-xs text-muted-foreground py-2 px-2">Nada encontrado.</p>}
            {colabsDisponiveis.map((c) => (
              <button
                key={c.id_colaborador}
                onClick={() => addColab(c)}
                className="w-full text-left text-xs px-2 py-1 hover:bg-muted/60 flex items-center justify-between"
              >
                <span>{c.nome_colaborador}</span>
                <Plus className="h-3 w-3 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
