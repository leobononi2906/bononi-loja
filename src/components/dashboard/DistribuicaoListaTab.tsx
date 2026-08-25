import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ClipboardList, Plus, Copy, PauseCircle, PlayCircle, Pencil, PackageOpen, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { TableSkeleton } from "./LoadingSkeleton";
import { ErrorAlert } from "./ErrorAlert";
import {
  db, distLog, getUsuarioNome, setUsuarioNome, deriveStatusEfetivo, STATUS_INFO, STATUS_FILTRO,
  type DistArea, type DistServico, type DistServicoColaborador, type StatusEfetivo,
} from "@/lib/dist";

interface Colaborador {
  id_colaborador: number;
  nome_colaborador: string;
}

type DialogMode = "novo" | "duplicar" | "editar";

interface DialogState {
  mode: DialogMode;
  base?: DistServico;
  colabsBase?: number[];
}

export function DistribuicaoListaTab() {
  const qc = useQueryClient();
  const [statusFiltro, setStatusFiltro] = useState<StatusEfetivo | "TODOS">("TODOS");
  const [areaFiltro, setAreaFiltro] = useState<string>("TODOS");
  const [colabFiltro, setColabFiltro] = useState<string>("TODOS");
  const [busca, setBusca] = useState("");
  const [dialogState, setDialogState] = useState<DialogState | null>(null);

  const { data: areas, isLoading: loadingAreas } = useQuery({
    queryKey: ["dist_areas"],
    queryFn: async () => {
      const { data, error } = await db.from("dist_areas").select("*").order("ordem", { ascending: true }).range(0, 9999);
      if (error) throw error;
      return (data ?? []) as DistArea[];
    },
  });

  const { data: colaboradores, isLoading: loadingColabs } = useQuery({
    queryKey: ["loja_config_colaborador_ativos"],
    queryFn: async () => {
      const { data, error } = await db
        .from("loja_config_colaborador")
        .select("id_colaborador, nome_colaborador")
        .eq("ativo", true)
        .order("nome_colaborador", { ascending: true })
        .range(0, 9999);
      if (error) throw error;
      return (data ?? []) as Colaborador[];
    },
  });

  const { data: servicos, isLoading: loadingServicos, error: erroServicos } = useQuery({
    queryKey: ["dist_servico"],
    queryFn: async () => {
      const { data, error } = await db.from("dist_servico").select("*").order("atualizado_em", { ascending: false }).range(0, 9999);
      if (error) throw error;
      return (data ?? []) as DistServico[];
    },
  });

  const { data: servicoColabs, isLoading: loadingServicoColabs } = useQuery({
    queryKey: ["dist_servico_colaborador"],
    queryFn: async () => {
      const { data, error } = await db.from("dist_servico_colaborador").select("*").range(0, 9999);
      if (error) throw error;
      return (data ?? []) as DistServicoColaborador[];
    },
  });

  const isLoading = loadingAreas || loadingColabs || loadingServicos || loadingServicoColabs;

  const areasList = Array.isArray(areas) ? areas : [];
  const colabsList = Array.isArray(colaboradores) ? colaboradores : [];
  const servicosList = Array.isArray(servicos) ? servicos : [];
  const vinculos = Array.isArray(servicoColabs) ? servicoColabs : [];

  const areaMap = useMemo(() => new Map(areasList.map((a) => [a.id, a.nome])), [areasList]);
  const colabMap = useMemo(() => new Map(colabsList.map((c) => [c.id_colaborador, c.nome_colaborador])), [colabsList]);

  const colabsPorServico = useMemo(() => {
    const map = new Map<number, number[]>();
    vinculos.forEach((v) => {
      const arr = map.get(v.id_dist_servico) ?? [];
      arr.push(v.id_colaborador);
      map.set(v.id_dist_servico, arr);
    });
    return map;
  }, [vinculos]);

  const linhas = useMemo(() => {
    return servicosList.map((s) => {
      const colabsIds = colabsPorServico.get(s.id) ?? [];
      const status = deriveStatusEfetivo({
        status_manual: s.status_manual,
        id_area: s.id_area,
        temColaborador: colabsIds.length > 0,
      });
      return {
        servico: s,
        colabsIds,
        colabsNomes: colabsIds.map((id) => colabMap.get(id) ?? `#${id}`).join(", "),
        areaNome: s.id_area != null ? (areaMap.get(s.id_area) ?? `#${s.id_area}`) : null,
        status,
      };
    });
  }, [servicosList, colabsPorServico, colabMap, areaMap]);

  const filtradas = linhas.filter((l) => {
    if (statusFiltro !== "TODOS" && l.status !== statusFiltro) return false;
    if (areaFiltro !== "TODOS" && String(l.servico.id_area ?? "") !== areaFiltro) return false;
    if (colabFiltro !== "TODOS" && !l.colabsIds.includes(Number(colabFiltro))) return false;
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return (
      String(l.servico.id_servico_legado).includes(q) ||
      String(l.servico.id_os ?? "").includes(q) ||
      (l.servico.observacao ?? "").toLowerCase().includes(q) ||
      (l.areaNome ?? "").toLowerCase().includes(q) ||
      l.colabsNomes.toLowerCase().includes(q)
    );
  });

  async function toggleParado(s: DistServico) {
    const novo = s.status_manual === "parado" ? null : "parado";
    const { error } = await db.from("dist_servico").update({ status_manual: novo, atualizado_em: new Date().toISOString() }).eq("id", s.id);
    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
      distLog("error", "ERRO_TOGGLE_PARADO", error.message);
      return;
    }
    toast.success(novo === "parado" ? "Serviço marcado como parado." : "Serviço reaberto.");
    qc.invalidateQueries({ queryKey: ["dist_servico"] });
  }

  if (isLoading) return <TableSkeleton />;
  if (erroServicos) return <ErrorAlert message="Erro ao carregar a lista de distribuição" details={(erroServicos as Error).message} />;

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-base font-semibold font-display">Lista de Distribuição</h2>
            <p className="text-xs text-muted-foreground">Serviços em aberto e sua distribuição por área/colaborador</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setDialogState({ mode: "novo" })}>
          <Plus className="h-4 w-4 mr-1" /> Nova distribuição
        </Button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-900/40 rounded-lg p-3 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Lista provisória — mostra só os serviços já lançados aqui manualmente. Quando a view <span className="font-mono">vw_dist_servicos</span> for
          publicada, a lista passa a trazer automaticamente todos os serviços em aberto do sistema (cliente, placa, serviço, preço e tempo).
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFiltro} onValueChange={(v) => setStatusFiltro(v as StatusEfetivo | "TODOS")}>
          <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_FILTRO.map((s) => <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={areaFiltro} onValueChange={setAreaFiltro}>
          <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Área" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS" className="text-xs">Todas as áreas</SelectItem>
            {areasList.map((a) => <SelectItem key={a.id} value={String(a.id)} className="text-xs">{a.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={colabFiltro} onValueChange={setColabFiltro}>
          <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue placeholder="Colaborador" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS" className="text-xs">Todos os colaboradores</SelectItem>
            {colabsList.map((c) => <SelectItem key={c.id_colaborador} value={String(c.id_colaborador)} className="text-xs">{c.nome_colaborador}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por serviço, OS, área, colaborador..."
          className="h-8 text-xs max-w-[260px]"
        />
      </div>

      {/* Tabela */}
      <div className="chart-container overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Serviço</th>
              <th>OS</th>
              <th>Área</th>
              <th>Colaborador(es)</th>
              <th>Status</th>
              <th>Observação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((l) => {
              const info = STATUS_INFO[l.status];
              const parado = l.servico.status_manual === "parado";
              return (
                <tr key={l.servico.id}>
                  <td className="font-mono text-xs">
                    #{l.servico.id_servico_legado}
                    {l.servico.duplicado_de != null && <span className="text-[10px] text-muted-foreground ml-1">(dup.)</span>}
                  </td>
                  <td className="font-mono text-xs">{l.servico.id_os ?? "—"}</td>
                  <td className="text-xs">{l.areaNome ?? "—"}</td>
                  <td className="text-xs min-w-0 max-w-[220px] truncate" title={l.colabsNomes}>{l.colabsNomes || "—"}</td>
                  <td><span className={`b-badge ${info.badgeClass}`}>{info.label}</span></td>
                  <td className="text-xs min-w-0 max-w-[200px] truncate" title={l.servico.observacao ?? ""}>{l.servico.observacao || "—"}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm" variant="ghost" className="h-7 px-2 text-[11px]"
                        onClick={() => setDialogState({ mode: "editar", base: l.servico, colabsBase: l.colabsIds })}
                      >
                        <Pencil className="h-3 w-3 mr-1" /> Destinar
                      </Button>
                      <Button
                        size="sm" variant="ghost" className="h-7 px-2 text-[11px]"
                        onClick={() => setDialogState({ mode: "duplicar", base: l.servico })}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Duplicar
                      </Button>
                      <Button
                        size="sm" variant="ghost" className="h-7 px-2 text-[11px]"
                        onClick={() => toggleParado(l.servico)}
                      >
                        {parado ? <PlayCircle className="h-3 w-3 mr-1" /> : <PauseCircle className="h-3 w-3 mr-1" />}
                        {parado ? "Reabrir" : "Parar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center">
                  <PackageOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Nenhum serviço encontrado para este filtro.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {dialogState && (
        <DistribuirDialog
          state={dialogState}
          areas={areasList.filter((a) => a.ativo)}
          colaboradores={colabsList}
          onClose={() => setDialogState(null)}
          onSaved={() => {
            setDialogState(null);
            qc.invalidateQueries({ queryKey: ["dist_servico"] });
            qc.invalidateQueries({ queryKey: ["dist_servico_colaborador"] });
          }}
        />
      )}
    </div>
  );
}

function DistribuirDialog({
  state, areas, colaboradores, onClose, onSaved,
}: {
  state: DialogState;
  areas: DistArea[];
  colaboradores: Colaborador[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { mode, base, colabsBase } = state;
  const [idServicoLegado, setIdServicoLegado] = useState(mode === "novo" ? "" : String(base?.id_servico_legado ?? ""));
  const [idOs, setIdOs] = useState(mode === "novo" ? "" : String(base?.id_os ?? ""));
  const [idArea, setIdArea] = useState<string>(mode === "editar" && base?.id_area != null ? String(base.id_area) : "");
  const [colabsSel, setColabsSel] = useState<Set<number>>(new Set(mode === "editar" ? colabsBase ?? [] : []));
  const [observacao, setObservacao] = useState(mode === "editar" ? base?.observacao ?? "" : "");
  const [usuario, setUsuario] = useState(getUsuarioNome());
  const [salvando, setSalvando] = useState(false);

  const titulo = mode === "novo" ? "Nova distribuição" : mode === "duplicar" ? "Duplicar distribuição" : "Destinar área/colaborador";
  const legadoEditavel = mode === "novo";

  function toggleColab(id: number) {
    setColabsSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function salvar() {
    if (mode === "novo" && !idServicoLegado.trim()) {
      toast.error("Informe o nº do serviço (legado).");
      return;
    }
    setSalvando(true);
    setUsuarioNome(usuario.trim());

    const agora = new Date().toISOString();
    const temDestino = !!idArea || colabsSel.size > 0;
    const colabsIds = Array.from(colabsSel);

    try {
      let distServicoId: number;

      if (mode === "editar" && base) {
        const { error } = await db.from("dist_servico").update({
          id_area: idArea ? Number(idArea) : null,
          status_manual: temDestino ? "distribuido" : null,
          observacao: observacao.trim() || null,
          distribuido_por: usuario.trim() || null,
          distribuido_em: temDestino ? agora : base.distribuido_em,
          atualizado_em: agora,
        }).eq("id", base.id);
        if (error) throw error;
        distServicoId = base.id;
        await db.from("dist_servico_colaborador").delete().eq("id_dist_servico", distServicoId);
      } else {
        const payload = {
          id_servico_legado: mode === "novo" ? Number(idServicoLegado) : base!.id_servico_legado,
          id_os: mode === "novo" ? (idOs.trim() ? Number(idOs) : null) : base!.id_os,
          id_area: idArea ? Number(idArea) : null,
          status_manual: temDestino ? "distribuido" : null,
          duplicado_de: mode === "duplicar" ? base!.id : null,
          observacao: observacao.trim() || null,
          distribuido_por: usuario.trim() || null,
          distribuido_em: temDestino ? agora : null,
        };
        const { data, error } = await db.from("dist_servico").insert(payload).select("id").single();
        if (error) throw error;
        distServicoId = data.id;
      }

      if (colabsIds.length > 0) {
        const rows = colabsIds.map((id_colaborador) => ({ id_dist_servico: distServicoId, id_colaborador }));
        const { error: errColab } = await db.from("dist_servico_colaborador").insert(rows);
        if (errColab) throw errColab;
      }

      distLog("info", mode === "editar" ? "DESTINAR_SERVICO" : mode === "duplicar" ? "DUPLICAR_SERVICO" : "NOVA_DISTRIBUICAO", `id_dist_servico=${distServicoId}`);
      toast.success("Distribuição salva.");
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Erro ao salvar: " + msg);
      distLog("error", "ERRO_SALVAR_DISTRIBUICAO", msg);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Nº Serviço (legado)</label>
              <Input
                value={idServicoLegado}
                onChange={(e) => setIdServicoLegado(e.target.value)}
                disabled={!legadoEditavel}
                placeholder="Ex: 12345"
                className="h-8 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Nº OS</label>
              <Input
                value={idOs}
                onChange={(e) => setIdOs(e.target.value)}
                disabled={!legadoEditavel}
                placeholder="Opcional"
                className="h-8 text-sm mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Área</label>
            <Select value={idArea || "__none"} onValueChange={(v) => setIdArea(v === "__none" ? "" : v)}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Selecione a área" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none" className="text-xs">Sem área</SelectItem>
                {areas.map((a) => <SelectItem key={a.id} value={String(a.id)} className="text-xs">{a.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Colaborador(es)</label>
            <div className="mt-1 max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
              {colaboradores.length === 0 && <p className="text-xs text-muted-foreground py-1">Nenhum colaborador ativo cadastrado.</p>}
              {colaboradores.map((c) => (
                <label key={c.id_colaborador} className="flex items-center gap-2 py-0.5 cursor-pointer">
                  <Checkbox checked={colabsSel.has(c.id_colaborador)} onCheckedChange={() => toggleColab(c.id_colaborador)} />
                  <span className="text-xs">{c.nome_colaborador}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Observação</label>
            <Input value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Opcional" className="h-8 text-sm mt-1" />
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Seu nome</label>
            <Input value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Quem está distribuindo" className="h-8 text-sm mt-1" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
