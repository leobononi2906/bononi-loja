import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endOfWeek, format, startOfWeek, subWeeks } from "date-fns";
import { AlertTriangle, CheckCircle2, MessageSquarePlus, PackageOpen, Trash2 } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { ErrorAlert } from "./ErrorAlert";
import { KPISkeleton, TableSkeleton } from "./LoadingSkeleton";
import { SortableHeader } from "./SortableHeader";
import { useSortable } from "@/hooks/useSortable";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// vw_vendas_sem_faturamento / vendas_sem_fat_followup não estão no types.ts gerado (tabelas novas) — "as never" nos .from()

interface VendaSemFat {
  tipo_doc: string;
  id_doc: number;
  data_venda: string;
  dias_parado: number;
  id_empresa: number;
  empresa: string;
  id_vendedor: number;
  vendedor: string;
  id_cliente: number;
  cliente: string;
  tipo_saida: string;
  valor: number;
  status: string;
  fase: string;
  atualizado_em: string;
  followups_abertos: number;
  ultimo_followup_em: string | null;
}

interface Followup {
  id: number;
  tipo_doc: string;
  id_doc: number;
  texto: string;
  autor: string;
  criado_em: string;
  concluido: boolean;
  concluido_em: string | null;
  concluido_por: string | null;
}

type QuickFilter = "todos" | "7d" | "15d" | "30d" | "mais30d" | "semana_anterior" | "custom";
type TipoFiltro = "todos" | "VENDA" | "O.S.";
type StatusOsFiltro = "todas" | "F" | "A";

const TIPO_FILTROS: { value: TipoFiltro; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "VENDA", label: "Venda" },
  { value: "O.S.", label: "OS" },
];

// "Finalizada" é o andamento do serviço (status da OS) — diferente de "faturada"
// (que é o próprio critério da lista: só entra quem NÃO faturou ainda).
const STATUS_OS_FILTROS: { value: StatusOsFiltro; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "F", label: "Finalizadas" },
  { value: "A", label: "Abertas" },
];

const QUICK_FILTERS: { value: QuickFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "7d", label: "Últimos 7d" },
  { value: "15d", label: "Últimos 15d" },
  { value: "30d", label: "Últimos 30d" },
  { value: "semana_anterior", label: "Semana anterior" },
  { value: "mais30d", label: "Mais de 30d" },
  { value: "custom", label: "Personalizado" },
];

const USUARIO_KEY = "loja_usuario_nome";

function getUsuarioNome(): string {
  return localStorage.getItem(USUARIO_KEY) || "";
}

function semanaAnteriorRange() {
  const base = subWeeks(new Date(), 1);
  return {
    inicio: format(startOfWeek(base, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    fim: format(endOfWeek(base, { weekStartsOn: 1 }), "yyyy-MM-dd"),
  };
}

// dias_parado já vem calculado da view — evita bug de timezone com new Date() em cima de campo `date`
function formatDataBR(dateStr: string): string {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function badgeDias(dias: number): { cls: string; label: string } {
  const label = `${dias}d`;
  if (dias <= 7) return { cls: "b-badge-ok", label };
  if (dias <= 15) return { cls: "b-badge-info", label };
  if (dias <= 30) return { cls: "b-badge-critico", label };
  return { cls: "b-badge-ruptura", label };
}

export function VendasSemFaturamentoTab() {
  const qc = useQueryClient();
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>("todos");
  const [statusOsFiltro, setStatusOsFiltro] = useState<StatusOsFiltro>("todas");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("30d");
  const [customInicio, setCustomInicio] = useState("");
  const [customFim, setCustomFim] = useState("");
  const [vendedorFiltro, setVendedorFiltro] = useState("todos");
  const [drawerVenda, setDrawerVenda] = useState<VendaSemFat | null>(null);
  const [usuario, setUsuario] = useState(getUsuarioNome());

  const { data, isLoading, error } = useQuery({
    queryKey: ["vendas_sem_faturamento"],
    queryFn: async () => {
      // VENDA (snapshot) + O.S. (ao vivo via vw_os_base.fl_faturada, 18/08) na mesma view — tela abre
      // em "Últimos 30d" por padrão. O projeto tem um teto de "max rows" no PostgREST (retorna no
      // máx. 10000 por página, mesmo pedindo range maior) — pagina até esgotar pra não truncar
      // silenciosamente (defensivo: volume atual é baixo, ~350 linhas no total, mas pode crescer).
      const PAGE_SIZE = 1000;
      const MAX_PAGES = 50; // 50k linhas de teto de segurança
      const all: VendaSemFat[] = [];
      for (let page = 0; page < MAX_PAGES; page++) {
        const from = page * PAGE_SIZE;
        const { data, error } = await supabase
          .from("vw_vendas_sem_faturamento" as never)
          .select("*")
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        const rows = (data ?? []) as unknown as VendaSemFat[];
        all.push(...rows);
        if (rows.length < PAGE_SIZE) break;
      }
      return all;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  // Escopo fixo da loja física: O.S. só tipo NORMAL, Venda só canal LOJA (exclui DISTRIBUICAO/ONLINE
  // — vendedores de marketplace/atacado como SHOPEE/ML BONONI não são operação de loja).
  const rows = useMemo(() => {
    return (data ?? []).filter(
      (r) =>
        (r.tipo_doc === "O.S." && r.tipo_saida === "NORMAL") ||
        (r.tipo_doc === "VENDA" && r.tipo_saida === "LOJA")
    );
  }, [data]);

  const vendedores = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      if (r.id_vendedor) map.set(String(r.id_vendedor), r.vendedor || `Vend. #${r.id_vendedor}`);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const filtered = useMemo(() => {
    let out = rows;
    if (tipoFiltro !== "todos") {
      out = out.filter((r) => r.tipo_doc === tipoFiltro);
    }
    if (statusOsFiltro !== "todas") {
      // Só afeta O.S. — Venda não tem esse conceito de "andamento" aqui, sempre passa.
      out = out.filter((r) => r.tipo_doc !== "O.S." || r.status === statusOsFiltro);
    }
    if (vendedorFiltro !== "todos") {
      out = out.filter((r) => String(r.id_vendedor) === vendedorFiltro);
    }
    if (quickFilter === "7d") out = out.filter((r) => r.dias_parado <= 7);
    else if (quickFilter === "15d") out = out.filter((r) => r.dias_parado <= 15);
    else if (quickFilter === "30d") out = out.filter((r) => r.dias_parado <= 30);
    else if (quickFilter === "mais30d") out = out.filter((r) => r.dias_parado > 30);
    else if (quickFilter === "semana_anterior") {
      const { inicio, fim } = semanaAnteriorRange();
      out = out.filter((r) => r.data_venda >= inicio && r.data_venda <= fim);
    } else if (quickFilter === "custom" && customInicio && customFim) {
      out = out.filter((r) => r.data_venda >= customInicio && r.data_venda <= customFim);
    }
    return out;
  }, [rows, tipoFiltro, statusOsFiltro, vendedorFiltro, quickFilter, customInicio, customFim]);

  const { sorted, sort, toggle } = useSortable(
    filtered as unknown as Record<string, unknown>[],
    "dias_parado",
    "desc"
  );

  // Renderizar milhares de <tr> sem virtualização trava o navegador — mostra as mais relevantes
  // (topo da ordenação atual) e avisa em vez de truncar silenciosamente.
  const RENDER_CAP = 1000;
  const visible = sorted.length > RENDER_CAP ? sorted.slice(0, RENDER_CAP) : sorted;

  const totalValor = filtered.reduce((s, r) => s + (Number(r.valor) || 0), 0);
  const totalFollowupsAbertos = filtered.reduce((s, r) => s + (Number(r.followups_abertos) || 0), 0);
  const totalMais30 = filtered.filter((r) => r.dias_parado > 30).length;

  if (error) {
    return (
      <div className="p-4">
        <ErrorAlert
          message="Não foi possível carregar as vendas sem faturamento."
          details={(error as Error).message}
        />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      <div>
        <h2 className="text-base font-semibold font-display flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
          Vendas sem Faturamento
        </h2>
        <p className="text-xs text-muted-foreground">
          Vendas (canal loja) e O.S. normais concluídas que ainda não geraram movimento de faturamento — ordenadas pelas mais paradas.
        </p>
      </div>

      {isLoading ? (
        <KPISkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Itens no filtro" value={String(filtered.length)} />
          <MetricCard label="Valor total" value={formatCurrency(totalValor)} />
          <MetricCard label="Mais de 30 dias parado" value={String(totalMais30)} />
          <MetricCard label="Follow-ups abertos" value={String(totalFollowupsAbertos)} />
        </div>
      )}

      <div className="chart-container flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mr-1">
            Tipo
          </span>
          {TIPO_FILTROS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTipoFiltro(t.value)}
              className={`h-7 px-2.5 rounded-md text-[11px] font-medium border transition-colors ${
                tipoFiltro === t.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:bg-muted/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tipoFiltro !== "VENDA" && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mr-1">
              Status OS
            </span>
            {STATUS_OS_FILTROS.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusOsFiltro(s.value)}
                className={`h-7 px-2.5 rounded-md text-[11px] font-medium border transition-colors ${
                  statusOsFiltro === s.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:bg-muted/60"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="w-px self-stretch bg-border hidden sm:block" />

        <div className="flex items-center gap-1 flex-wrap">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setQuickFilter(f.value)}
              className={`h-7 px-2.5 rounded-md text-[11px] font-medium border transition-colors ${
                quickFilter === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:bg-muted/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {quickFilter === "custom" && (
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={customInicio}
              onChange={(e) => setCustomInicio(e.target.value)}
              className="h-7 w-[145px] text-[11px]"
            />
            <span className="text-[10px] text-muted-foreground">a</span>
            <Input
              type="date"
              value={customFim}
              onChange={(e) => setCustomFim(e.target.value)}
              className="h-7 w-[145px] text-[11px]"
            />
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:ml-auto">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
            Vendedor
          </span>
          <Select value={vendedorFiltro} onValueChange={setVendedorFiltro}>
            <SelectTrigger className="h-7 w-[190px] text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos" className="text-xs">Todos</SelectItem>
              {vendedores.map(([id, nome]) => (
                <SelectItem key={id} value={id} className="text-xs">{nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="chart-container">
          {sorted.length > RENDER_CAP && (
            <p className="text-xs mb-3 px-2 py-1.5 rounded bg-warning/10 text-warning-foreground" style={{ background: "hsl(var(--warning-bg))", color: "hsl(var(--warning))" }}>
              Mostrando as {RENDER_CAP} mais paradas de {sorted.length} — refine o filtro (vendedor ou período) pra ver o restante.
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <SortableHeader label="Tipo" field="tipo_doc" sort={sort} onToggle={toggle} />
                  <SortableHeader label="Nº" field="id_doc" sort={sort} onToggle={toggle} />
                  <SortableHeader label="Vendedor" field="vendedor" sort={sort} onToggle={toggle} />
                  <SortableHeader label="Cliente" field="cliente" sort={sort} onToggle={toggle} />
                  <SortableHeader label="Empresa" field="empresa" sort={sort} onToggle={toggle} />
                  <th className="pb-2 font-medium text-muted-foreground text-xs">Canal</th>
                  <SortableHeader label="Data" field="data_venda" sort={sort} onToggle={toggle} className="text-right" />
                  <SortableHeader label="Valor" field="valor" sort={sort} onToggle={toggle} className="text-right" />
                  <SortableHeader label="Dias parado" field="dias_parado" sort={sort} onToggle={toggle} className="text-right" />
                  <th className="pb-2 font-medium text-muted-foreground text-xs text-center">Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((rowUnknown) => {
                  const row = rowUnknown as unknown as VendaSemFat;
                  const badge = badgeDias(row.dias_parado);
                  return (
                    <tr
                      key={`${row.tipo_doc}-${row.id_doc}`}
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setDrawerVenda(row)}
                    >
                      <td className="py-2 text-xs whitespace-nowrap">
                        <span className={`b-badge ${row.tipo_doc === "O.S." ? "b-badge-info" : "b-badge-muted"}`}>
                          {row.tipo_doc}
                        </span>
                      </td>
                      <td className="py-2 text-xs font-medium whitespace-nowrap">{row.id_doc}</td>
                      <td className="py-2 text-xs max-w-[160px] truncate" title={row.vendedor}>{row.vendedor || "-"}</td>
                      <td className="py-2 text-xs max-w-[180px] truncate" title={row.cliente}>{row.cliente || "-"}</td>
                      <td className="py-2 text-xs whitespace-nowrap">{row.empresa}</td>
                      <td className="py-2 text-xs whitespace-nowrap">{row.tipo_saida}</td>
                      <td className="py-2 text-xs text-right whitespace-nowrap">{formatDataBR(row.data_venda)}</td>
                      <td className="py-2 text-xs text-right font-display whitespace-nowrap">{formatCurrency(Number(row.valor) || 0)}</td>
                      <td className="py-2 text-xs text-right">
                        <span className={`b-badge ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="py-2 text-xs text-center">
                        {row.followups_abertos > 0 ? (
                          <Badge variant="secondary" className="text-[10px]">{row.followups_abertos}</Badge>
                        ) : (
                          <MessageSquarePlus className="h-3.5 w-3.5 text-muted-foreground/40 inline" />
                        )}
                      </td>
                    </tr>
                  );
                })}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-10 text-center">
                      <PackageOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Nenhuma venda sem faturamento para este filtro.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {drawerVenda && (
        <FollowupDialog
          venda={drawerVenda}
          usuario={usuario}
          onUsuarioChange={(nome) => {
            setUsuario(nome);
            localStorage.setItem(USUARIO_KEY, nome);
          }}
          onClose={() => setDrawerVenda(null)}
          onChanged={() => qc.invalidateQueries({ queryKey: ["vendas_sem_faturamento"] })}
        />
      )}
    </div>
  );
}

function FollowupDialog({
  venda,
  usuario,
  onUsuarioChange,
  onClose,
  onChanged,
}: {
  venda: VendaSemFat;
  usuario: string;
  onUsuarioChange: (nome: string) => void;
  onClose: () => void;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");
  const [nomeInput, setNomeInput] = useState(usuario);

  const queryKey = ["followups", venda.tipo_doc, venda.id_doc];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendas_sem_fat_followup" as never)
        .select("*")
        .eq("tipo_doc", venda.tipo_doc)
        .eq("id_doc", venda.id_doc)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Followup[];
    },
  });

  const followups = data ?? [];

  function commitNome() {
    const nome = nomeInput.trim();
    if (nome) onUsuarioChange(nome);
  }

  function invalidate() {
    qc.invalidateQueries({ queryKey });
    onChanged();
  }

  const addMutation = useMutation({
    mutationFn: async (novoTexto: string) => {
      const autor = nomeInput.trim() || "Sem nome";
      const { error } = await supabase.from("vendas_sem_fat_followup" as never).insert({
        tipo_doc: venda.tipo_doc,
        id_doc: venda.id_doc,
        texto: novoTexto,
        autor,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      commitNome();
      setTexto("");
      invalidate();
    },
  });

  const concluirMutation = useMutation({
    mutationFn: async (id: number) => {
      const autor = nomeInput.trim() || "Sem nome";
      const { error } = await supabase
        .from("vendas_sem_fat_followup" as never)
        .update({
          concluido: true,
          concluido_em: new Date().toISOString(),
          concluido_por: autor,
        } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      commitNome();
      invalidate();
    },
  });

  const excluirMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("vendas_sem_fat_followup" as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Follow-up — {venda.tipo_doc} #{venda.id_doc}</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground -mt-2">
          <span className="font-medium text-foreground">{venda.cliente}</span> · {venda.vendedor} ·{" "}
          {formatCurrency(Number(venda.valor) || 0)} · {venda.dias_parado}d parado
        </p>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
            Seu nome
          </label>
          <Input
            value={nomeInput}
            onChange={(e) => setNomeInput(e.target.value)}
            placeholder="Ex: Sardi"
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
          {isLoading && <p className="text-xs text-muted-foreground py-4 text-center">Carregando...</p>}
          {!isLoading && followups.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">Nenhum follow-up ainda.</p>
          )}
          {followups.map((f) => (
            <div
              key={f.id}
              className={`rounded-lg border p-2.5 text-xs ${f.concluido ? "opacity-60 bg-muted/30" : "bg-card"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="whitespace-pre-wrap">{f.texto}</p>
                <div className="flex items-center gap-1 shrink-0">
                  {!f.concluido && (
                    <button
                      onClick={() => concluirMutation.mutate(f.id)}
                      title="Concluir"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => excluirMutation.mutate(f.id)}
                    title="Excluir"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {f.autor} · {new Date(f.criado_em).toLocaleString("pt-BR")}
                {f.concluido && ` · concluído por ${f.concluido_por || "-"}`}
              </p>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 items-stretch sm:items-stretch sm:flex-col">
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Adicionar follow-up..."
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && texto.trim() && !addMutation.isPending) addMutation.mutate(texto.trim());
            }}
          />
          <Button
            size="sm"
            onClick={() => texto.trim() && addMutation.mutate(texto.trim())}
            disabled={!texto.trim() || addMutation.isPending}
          >
            {addMutation.isPending ? "Adicionando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
