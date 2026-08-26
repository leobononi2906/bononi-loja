import { Fragment, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ClipboardList, Copy, PauseCircle, PlayCircle, Pencil, PackageOpen, ChevronDown, ChevronRight,
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
import { SortableHeader } from "./SortableHeader";
import { useSortable } from "@/hooks/useSortable";
import {
  db, distLog, getUsuarioNome, setUsuarioNome, fmtDataAbrev, limparObservacao,
  STATUS_INFO, STATUS_ATIVOS,
  type DistArea, type DistServicoRow, type ColaboradorDim, type StatusDistServico,
} from "@/lib/dist";

type DialogMode = "editar" | "duplicar";

interface DialogState {
  mode: DialogMode;
  row: DistServicoRow;
}

const STATUS_CHIPS: { value: StatusDistServico; label: string }[] = [
  { value: "aberto", label: "Aberto" },
  { value: "distribuido", label: "Distribuído" },
  { value: "em_servico", label: "Em serviço" },
  { value: "parado", label: "Parado" },
  { value: "cancelado", label: "Cancelado" },
];

export function DistribuicaoListaTab() {
  const qc = useQueryClient();
  const [statusAtivos, setStatusAtivos] = useState<Set<StatusDistServico>>(new Set(STATUS_ATIVOS));
  const [areaFiltro, setAreaFiltro] = useState<string>("TODOS");
  const [colabFiltro, setColabFiltro] = useState<string>("TODOS");
  const [busca, setBusca] = useState("");
  const [expandido, setExpandido] = useState<number | null>(null);
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [osAberta, setOsAberta] = useState<{ id_os: number; id_empresa: number } | null>(null);

  const { data: areas, isLoading: loadingAreas } = useQuery({
    queryKey: ["dist_areas"],
    queryFn: async () => {
      const { data, error } = await db.from("dist_areas").select("*").order("ordem", { ascending: true }).range(0, 9999);
      if (error) throw error;
      return (data ?? []) as DistArea[];
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

  const { data: servicos, isLoading: loadingServicos, error: erroServicos } = useQuery({
    queryKey: ["vw_dist_servicos"],
    queryFn: async () => {
      const { data, error } = await db
        .from("vw_dist_servicos")
        .select("*")
        .order("data_os", { ascending: false })
        .order("hora_os", { ascending: false })
        .range(0, 9999);
      if (error) throw error;
      return (data ?? []) as DistServicoRow[];
    },
  });

  const isLoading = loadingAreas || loadingColabs || loadingServicos;
  const areasList = Array.isArray(areas) ? areas : [];
  const colabsList = Array.isArray(colaboradores) ? colaboradores : [];
  const servicosList = Array.isArray(servicos) ? servicos : [];

  const filtradas = servicosList.filter((l) => {
    if (!statusAtivos.has(l.status)) return false;
    if (areaFiltro === "SEM_AREA" && l.id_area != null) return false;
    if (areaFiltro !== "TODOS" && areaFiltro !== "SEM_AREA" && String(l.id_area ?? "") !== areaFiltro) return false;
    if (colabFiltro !== "TODOS") {
      const nome = colabsList.find((c) => String(c.id_colaborador) === colabFiltro)?.nome_colaborador;
      if (!nome || !(l.colaboradores ?? "").includes(nome)) return false;
    }
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return (
      String(l.id_servico).includes(q) ||
      String(l.id_os).includes(q) ||
      (l.prisma ?? "").toLowerCase().includes(q) ||
      (l.cliente ?? "").toLowerCase().includes(q) ||
      (l.placa ?? "").toLowerCase().includes(q) ||
      (l.modelo ?? "").toLowerCase().includes(q) ||
      (l.servico ?? "").toLowerCase().includes(q) ||
      (limparObservacao(l.observacao) ?? "").toLowerCase().includes(q) ||
      (l.area ?? "").toLowerCase().includes(q) ||
      (l.colaboradores ?? "").toLowerCase().includes(q)
    );
  }).map((l) => ({ ...l, dataHora: `${l.data_os}T${l.hora_os ?? "00:00"}` }));

  const { sorted, sort, toggle } = useSortable(filtradas, "dataHora", "desc");

  function toggleStatus(s: StatusDistServico) {
    setStatusAtivos((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }

  async function toggleParado(row: DistServicoRow) {
    const parado = row.status === "parado";
    const novoStatusManual = parado ? null : "parado";
    let error;
    if (row.id_dist != null) {
      ({ error } = await db.from("dist_servico").update({ status_manual: novoStatusManual, atualizado_em: new Date().toISOString() }).eq("id", row.id_dist));
    } else {
      ({ error } = await db.from("dist_servico").insert({
        id_servico_legado: row.id_servico, id_os: row.id_os, id_area: row.id_area, status_manual: novoStatusManual,
      }));
    }
    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
      distLog("error", "ERRO_TOGGLE_PARADO", error.message);
      return;
    }
    toast.success(parado ? "Serviço reaberto." : "Serviço marcado como parado.");
    qc.invalidateQueries({ queryKey: ["vw_dist_servicos"] });
  }

  if (isLoading) return <TableSkeleton />;
  if (erroServicos) return <ErrorAlert message="Erro ao carregar a lista de distribuição" details={(erroServicos as Error).message} />;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-base font-semibold font-display">Lista de Distribuição</h2>
          <p className="text-xs text-muted-foreground">Serviços lançados na OS pelo vendedor — destine por área e colaborador</p>
        </div>
      </div>

      {/* Filtro de status — chips clicáveis (default: os 4 ativos; Cancelado só quando clicado) */}
      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_CHIPS.map((s) => {
          const ativo = statusAtivos.has(s.value);
          return (
            <button
              key={s.value}
              onClick={() => toggleStatus(s.value)}
              className={`b-badge ${STATUS_INFO[s.value].badgeClass} cursor-pointer transition-opacity ${ativo ? "" : "opacity-30 hover:opacity-70"}`}
              title={ativo ? "Clique pra esconder" : "Clique pra mostrar"}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={areaFiltro} onValueChange={setAreaFiltro}>
          <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Área" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS" className="text-xs">Todas as áreas</SelectItem>
            <SelectItem value="SEM_AREA" className="text-xs">Sem área</SelectItem>
            {areasList.map((a) => <SelectItem key={a.id} value={String(a.id)} className="text-xs">{a.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={colabFiltro} onValueChange={setColabFiltro}>
          <SelectTrigger className="h-8 w-[190px] text-xs"><SelectValue placeholder="Colaborador" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS" className="text-xs">Todos os colaboradores</SelectItem>
            {colabsList.map((c) => <SelectItem key={c.id_colaborador} value={String(c.id_colaborador)} className="text-xs">{c.nome_colaborador}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por OS, prisma, cliente, placa, serviço..."
          className="h-8 text-xs max-w-[260px]"
        />
        <span className="text-[11px] text-muted-foreground ml-auto">{sorted.length} serviço(s)</span>
      </div>

      {/* Tabela */}
      <div className="chart-container overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <SortableHeader label="Data/Hora" field="dataHora" sort={sort} onToggle={toggle} />
              <th>Prisma</th>
              <th>Nº OS</th>
              <th>Cliente</th>
              <th>Placa</th>
              <th>Modelo</th>
              <th>Serviço</th>
              <th>Área</th>
              <th>Colaborador(es)</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const info = STATUS_INFO[row.status];
              const parado = row.status === "parado";
              const chave = row.id_dist ?? -row.id_servico; // chave única mesmo sem id_dist ainda
              const aberta = expandido === chave;
              const obs = limparObservacao(row.observacao);
              const temDetalhe = !!(obs || row.obs_distribuicao || row.distribuido_por);
              return (
                <Fragment key={chave}>
                  <tr
                    className={`cursor-pointer ${row.is_duplicado ? "bg-muted/20" : ""}`}
                    onClick={() => setOsAberta({ id_os: row.id_os, id_empresa: row.id_empresa })}
                    title="Clique pra ver todos os serviços desta OS"
                  >
                    <td className="w-6">
                      {temDetalhe && (
                        <button onClick={(e) => { e.stopPropagation(); setExpandido(aberta ? null : chave); }} className="text-muted-foreground hover:text-foreground">
                          {aberta ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </td>
                    <td className="text-xs font-mono whitespace-nowrap">{fmtDataAbrev(row.data_os)} {row.hora_os ?? ""}</td>
                    <td className="text-xs font-mono">{row.prisma ?? "—"}</td>
                    <td className="text-xs font-mono">
                      {row.id_os}
                      {row.is_duplicado && <span className="text-[10px] text-muted-foreground ml-1">(dup.)</span>}
                    </td>
                    <td className="text-xs min-w-0 max-w-[180px] truncate" title={row.cliente}>{row.cliente}</td>
                    <td className="text-xs font-mono whitespace-nowrap">{row.placa ?? "—"}</td>
                    <td className="text-xs min-w-0 max-w-[140px] truncate" title={row.modelo ?? ""}>{row.modelo ?? "—"}</td>
                    <td className="text-xs min-w-0 max-w-[220px]">
                      <div className="truncate" title={row.servico}>{row.servico}</div>
                      {obs && (
                        <div className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5" title={obs}>{obs}</div>
                      )}
                    </td>
                    <td className="text-xs whitespace-nowrap">
                      {row.area ?? "—"}
                      {row.area_automatica && row.area && <span className="text-[10px] text-muted-foreground ml-1">(auto)</span>}
                    </td>
                    <td className="text-xs min-w-0 max-w-[180px] truncate" title={row.colaboradores ?? ""}>{row.colaboradores || "—"}</td>
                    <td><span className={`b-badge ${info.badgeClass}`}>{info.label}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {row.status !== "cancelado" && (
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => setDialogState({ mode: "editar", row })}>
                            <Pencil className="h-3 w-3 mr-1" /> Destinar
                          </Button>
                          {row.id_dist != null && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => setDialogState({ mode: "duplicar", row })}>
                              <Copy className="h-3 w-3 mr-1" /> Duplicar
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => toggleParado(row)}>
                            {parado ? <PlayCircle className="h-3 w-3 mr-1" /> : <PauseCircle className="h-3 w-3 mr-1" />}
                            {parado ? "Reabrir" : "Parar"}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {aberta && temDetalhe && (
                    <tr onClick={(e) => e.stopPropagation()}>
                      <td colSpan={12} className="bg-muted/20 text-xs px-4 py-2 space-y-1">
                        {obs && <p><span className="font-semibold text-muted-foreground">Obs. do vendedor: </span>{obs}</p>}
                        {row.obs_distribuicao && <p><span className="font-semibold text-muted-foreground">Obs. da distribuição: </span>{row.obs_distribuicao}</p>}
                        {row.distribuido_por && (
                          <p className="text-muted-foreground">
                            Distribuído por {row.distribuido_por}{row.distribuido_em ? ` em ${new Date(row.distribuido_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}` : ""}
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={12} className="py-10 text-center">
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
            qc.invalidateQueries({ queryKey: ["vw_dist_servicos"] });
          }}
        />
      )}

      {osAberta && (
        <OsServicosDialog
          idOs={osAberta.id_os}
          servicos={servicosList.filter((s) => s.id_os === osAberta.id_os && s.id_empresa === osAberta.id_empresa)}
          onClose={() => setOsAberta(null)}
        />
      )}
    </div>
  );
}

function OsServicosDialog({
  idOs, servicos, onClose,
}: {
  idOs: number;
  servicos: DistServicoRow[];
  onClose: () => void;
}) {
  const empresa = servicos[0]?.empresa ?? "";
  const cliente = servicos[0]?.cliente ?? "";
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>OS {idOs} — {empresa}</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-muted-foreground -mt-2">{cliente}</div>

        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {servicos.map((s) => {
            const info = STATUS_INFO[s.status];
            return (
              <div key={s.id_dist ?? -s.id_servico} className="border rounded-md p-2 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{s.servico}</span>
                  <span className={`b-badge ${info.badgeClass} shrink-0`}>{info.label}</span>
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3">
                  <span>Área: {s.area ?? "—"}</span>
                  <span>Colaborador(es): {s.colaboradores || "—"}</span>
                </div>
              </div>
            );
          })}
          {servicos.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">Nenhum serviço encontrado pra esta OS.</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DistribuirDialog({
  state, areas, colaboradores, onClose, onSaved,
}: {
  state: DialogState;
  areas: DistArea[];
  colaboradores: ColaboradorDim[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { mode, row } = state;
  const editando = mode === "editar";

  // Ao editar uma linha já distribuída, busca os colaboradores de verdade (ids) —
  // o campo "colaboradores" da view é só texto agregado, não dá pra pré-marcar por nome.
  const { data: colabsAtuais } = useQuery({
    queryKey: ["dist_servico_colaborador", row.id_dist],
    queryFn: async () => {
      if (row.id_dist == null) return [];
      const { data, error } = await db.from("dist_servico_colaborador").select("id_colaborador").eq("id_dist_servico", row.id_dist);
      if (error) throw error;
      return (data ?? []).map((r: { id_colaborador: number }) => r.id_colaborador) as number[];
    },
    enabled: editando && row.id_dist != null,
  });

  const [idArea, setIdArea] = useState<string>(editando && row.id_area != null ? String(row.id_area) : "");
  const [colabsSel, setColabsSel] = useState<Set<number>>(new Set());
  const [colabsInicializado, setColabsInicializado] = useState(!editando || row.id_dist == null);
  const [buscaColab, setBuscaColab] = useState("");
  const [observacao, setObservacao] = useState(editando ? row.obs_distribuicao ?? "" : "");
  const [usuario, setUsuario] = useState(getUsuarioNome());
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!colabsInicializado && colabsAtuais) {
      setColabsSel(new Set(colabsAtuais));
      setColabsInicializado(true);
    }
  }, [colabsInicializado, colabsAtuais]);

  const titulo = editando ? "Destinar área/colaborador" : "Duplicar distribuição";
  const colabsFiltrados = colaboradores.filter((c) => c.nome_colaborador.toLowerCase().includes(buscaColab.trim().toLowerCase()));

  function toggleColab(id: number) {
    setColabsSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function salvar() {
    setSalvando(true);
    setUsuarioNome(usuario.trim());

    const agora = new Date().toISOString();
    const temDestino = !!idArea || colabsSel.size > 0;
    const colabsIds = Array.from(colabsSel);

    try {
      let distServicoId: number;

      if (editando && row.id_dist != null) {
        const { error } = await db.from("dist_servico").update({
          id_area: idArea ? Number(idArea) : null,
          status_manual: temDestino ? "distribuido" : null,
          observacao: observacao.trim() || null,
          distribuido_por: usuario.trim() || null,
          distribuido_em: agora,
          atualizado_em: agora,
        }).eq("id", row.id_dist);
        if (error) throw error;
        distServicoId = row.id_dist;
        await db.from("dist_servico_colaborador").delete().eq("id_dist_servico", distServicoId);
      } else {
        const payload = {
          id_servico_legado: row.id_servico,
          id_os: row.id_os,
          id_area: idArea ? Number(idArea) : null,
          status_manual: temDestino ? "distribuido" : null,
          duplicado_de: mode === "duplicar" ? row.id_dist : null,
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

      distLog("info", editando ? "DESTINAR_SERVICO" : "DUPLICAR_SERVICO", `id_servico=${row.id_servico} id_dist=${distServicoId}`);
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

        <div className="text-xs text-muted-foreground -mt-2">
          <span className="font-mono">#{row.id_servico}</span> · OS {row.id_os} · {row.servico} · {row.cliente}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Área</label>
            <Select value={idArea || "__none"} onValueChange={(v) => setIdArea(v === "__none" ? "" : v)}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Selecione a área" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none" className="text-xs">Sem área</SelectItem>
                {areas.map((a) => <SelectItem key={a.id} value={String(a.id)} className="text-xs">{a.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            {editando && row.area_automatica && row.area && !idArea && (
              <p className="text-[10px] text-muted-foreground mt-1">Hoje cai automático em "{row.area}" pelo código do serviço.</p>
            )}
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
              Colaborador(es) {colabsSel.size > 0 && `(${colabsSel.size} selecionado${colabsSel.size > 1 ? "s" : ""})`}
            </label>
            <Input
              value={buscaColab}
              onChange={(e) => setBuscaColab(e.target.value)}
              placeholder="Buscar colaborador..."
              className="h-7 text-xs mt-1 mb-1"
            />
            <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
              {colabsFiltrados.length === 0 && <p className="text-xs text-muted-foreground py-1">Nenhum colaborador encontrado.</p>}
              {colabsFiltrados.map((c) => (
                <label key={c.id_colaborador} className="flex items-center gap-2 py-0.5 cursor-pointer">
                  <Checkbox checked={colabsSel.has(c.id_colaborador)} onCheckedChange={() => toggleColab(c.id_colaborador)} />
                  <span className="text-xs">{c.nome_colaborador}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Observação da distribuição</label>
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
