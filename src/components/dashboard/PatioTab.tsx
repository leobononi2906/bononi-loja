import { useState } from "react";
import { Clock, Percent, DollarSign, TrendingUp } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { MetricCard } from "./MetricCard";
import { ErrorAlert } from "./ErrorAlert";
import { KPISkeleton, ChartSkeleton, TableSkeleton } from "./LoadingSkeleton";
import { SortableHeader } from "./SortableHeader";
import { Progress } from "@/components/ui/progress";
import { useSortable } from "@/hooks/useSortable";
import { useViewData } from "@/hooks/useComercialData";
import { formatCurrency, formatCurrencyInt, formatPercent, type DashboardFilters } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Props { filters: DashboardFilters; }

function prodColor(pct: number) {
  if (pct >= 80) return "hsl(var(--success))";
  if (pct >= 60) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

function prodBg(pct: number) {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

// Busca colaboradores configurados como PATIO
function usePatioColabs() {
  return useQuery({
    queryKey: ["config_patio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loja_config_colaborador")
        .select("id_colaborador, nome_colaborador")
        .eq("setor", "PATIO")
        .eq("ativo", true)
        .range(0, 9999);
      if (error) throw error;
      return new Set((data ?? []).map(r => r.id_colaborador));
    },
    staleTime: 60_000,
  });
}

export function PatioTab({ filters }: Props) {
  const [fatMode] = useState<"faturado" | "produzido">("faturado");

  const patioColabs = usePatioColabs();
  const patioColabIds = patioColabs.data ?? new Set();

  const produtividade = useViewData("vw_patio_produtividade_v2", filters);
  // OP dos colaboradores do pátio (quem fez peça tapeçaria mas é do setor pátio)
  const patioOp = useViewData("vw_tap_prod_v3", filters, 5000, { skipTipoSaida: true });
  const fatCol       = useViewData("vw_patio_fat_col_v2", filters);
  const produzido    = useViewData("vw_patio_produzido_v2", filters);
  const diario       = useViewData("vw_patio_diario_v2", filters);
  const servicosFat  = useViewData("vw_os_servicos_faturados", filters);

  // Filtra pelo setor PATIO da config
  const patioOpData = (patioOp.data ?? []).filter(r =>
    (patioColabIds.size === 0 || patioColabIds.has(Number(r.id_colaborador))) &&
    String(r.tipo_lancamento || "").toUpperCase() === "PRODUTO"
  );
  const prodDataRaw = (produtividade.data ?? []).filter(r =>
    (Number(r.horas_trabalhadas) || 0) > 0 &&
    (patioColabIds.size === 0 || patioColabIds.has(Number(r.id_colaborador)))
  );
  const fatData = (fatCol.data ?? []).filter(r =>
    patioColabIds.size === 0 || patioColabIds.has(Number(r.id_colaborador))
  );
  const produzidoData = produzido.data ?? [];
  const diarioData    = diario.data ?? [];

  // ─── DEDUPLICAÇÃO: vw_patio_produtividade_v2 tem 1 linha por colaborador/dia/OS
  // Precisamos de 1 linha por colaborador/dia para não multiplicar horas_disponiveis (8.8 fixo)
  const dedupMap: Record<string, { nome: string; id: number; trab: number; disp: number }> = {};
  prodDataRaw.forEach(r => {
    const key = `${r.id_colaborador}__${String(r.data_apontamento).slice(0, 10)}`;
    if (!dedupMap[key]) {
      dedupMap[key] = {
        nome: String(r.nome_colaborador || "-"),
        id:   Number(r.id_colaborador),
        trab: 0,
        disp: 8.8, // fixo por dia por colaborador
      };
    }
    dedupMap[key].trab += Number(r.horas_trabalhadas) || 0;
  });
  // Aplica teto de 8.8h por dia
  const prodData = Object.values(dedupMap).map(v => ({
    ...v,
    trab: Math.min(v.trab, 8.8),
  }));

  const horasDisp      = prodData.reduce((s, r) => s + r.disp, 0);
  const horasTrab      = prodData.reduce((s, r) => s + r.trab, 0);
  const prodGeral      = horasDisp > 0 ? (horasTrab / horasDisp) * 100 : 0;
  const valorProduzido = produzidoData.reduce((s, r) => s + (Number(r.valor_produzido) || 0), 0);
  const fatRateado     = fatData.reduce((s, r) => s + (Number(r.fat_rateado) || 0), 0);

  const dailyChart = diarioData
    .map(r => ({
      dia: String(r.data_apontamento || "").slice(5).replace("-", "/"),
      rawDate: String(r.data_apontamento || ""),
      trabalhadas: +(Number(r.horas_trabalhadas) || 0).toFixed(1),
      disponiveis: +(Number(r.horas_disponiveis) || 0).toFixed(1),
    }))
    .sort((a, b) => a.rawDate.localeCompare(b.rawDate));

  // Ranking por colaborador — já deduplicado (prodData é 1 linha por colab/dia)
  const colabProdMap: Record<string, { trab: number; disp: number; nome: string }> = {};
  prodData.forEach(r => {
    const nome = r.nome;
    if (!colabProdMap[nome]) colabProdMap[nome] = { trab: 0, disp: 0, nome };
    colabProdMap[nome].trab += r.trab;
    colabProdMap[nome].disp += r.disp;
  });

  const prodRanking = Object.values(colabProdMap)
    .map(v => ({
      nome: v.nome,
      trab: +v.trab.toFixed(1),
      disp: +v.disp.toFixed(1),
      pct:  v.disp > 0 ? +((v.trab / v.disp) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.pct - a.pct);

  const { sorted: sortedProd, sort: prodSort, toggle: toggleProd } = useSortable(
    prodRanking as unknown as Record<string, unknown>[], "pct", "desc"
  );

  // OP por colaborador do pátio
  const opColabMap: Record<string, number> = {};
  patioOpData.forEach(r => {
    const nome = String(r.nome_colaborador || "-");
    opColabMap[nome] = (opColabMap[nome] || 0) + (Number(r.produto_rateado) || 0);
  });

  const colabFatMap: Record<string, { nome: string; fat: number; op: number; total: number; horas: number }> = {};
  fatData.forEach(r => {
    const nome = String(r.nome_colaborador || "-");
    if (!colabFatMap[nome]) colabFatMap[nome] = { nome, fat: 0, op: 0, total: 0, horas: 0 };
    colabFatMap[nome].fat   += Number(r.fat_rateado) || 0;
    colabFatMap[nome].horas += Number(r.horas_colab) || 0;
  });

  const fatRanking = Object.values(colabFatMap)
    .map(v => {
      const op    = +(opColabMap[v.nome] || 0).toFixed(2);
      const fat   = +v.fat.toFixed(2);
      const total = +(fat + op).toFixed(2);
      return { nome: v.nome, fat, op, total, horas: +v.horas.toFixed(1) };
    })
    .filter(r => r.fat > 0 || r.op > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 30);

  const { sorted: sortedFat, sort: fatSort, toggle: toggleFat } = useSortable(
    fatRanking as unknown as Record<string, unknown>[], "fat", "desc"
  );

  const grupoMap: Record<string, number> = {};
  (servicosFat.data ?? []).forEach(r => {
    const g = String(r.grupo_serv || r.grupo_servico || "Outros").trim();
    grupoMap[g] = (grupoMap[g] || 0) + (Number(r.total_servico) || 0);
  });
  const grupoChart = Object.entries(grupoMap)
    .map(([grupo, valor]) => ({ grupo, valor: +valor.toFixed(2) }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  const isLoading = produtividade.isLoading || fatCol.isLoading || produzido.isLoading || patioColabs.isLoading;

  return (
    <div className="dashboard-section space-y-6">
      {produtividade.error && <ErrorAlert message="Erro ao carregar produtividade Pátio" details={(produtividade.error as Error).message} />}

      {isLoading ? <KPISkeleton /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard label="Horas Disponíveis"   value={`${Math.round(horasDisp)}h`}      icon={<Clock className="h-5 w-5" />} />
          <MetricCard label="Horas Trabalhadas"   value={`${Math.round(horasTrab)}h`}      icon={<Clock className="h-5 w-5" />} />
          <div className="metric-card" style={{ borderLeft: `4px solid ${prodColor(prodGeral)}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="metric-label">Produtividade Geral</span>
              <Percent className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="metric-value" style={{ color: prodColor(prodGeral) }}>{formatPercent(prodGeral)}</div>
          </div>
          <MetricCard label="Valor Produzido"     value={formatCurrencyInt(valorProduzido)} icon={<TrendingUp className="h-5 w-5" />} />
          <MetricCard label="Faturamento Rateado" value={formatCurrencyInt(fatRateado)}     icon={<DollarSign className="h-5 w-5" />} />
        </div>
      )}

      {diario.isLoading ? <ChartSkeleton /> : (
        <div className="chart-container">
          <h3 className="text-sm font-semibold font-display mb-4 text-foreground">Evolução diária do Pátio</h3>
          {dailyChart.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" angle={-45} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => `${v}h`} />
                <Legend />
                <Line type="monotone" dataKey="disponiveis" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" name="Disponíveis" dot={false} />
                <Line type="monotone" dataKey="trabalhadas" stroke="hsl(var(--primary))" name="Trabalhadas" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {produtividade.isLoading ? <TableSkeleton /> : (
          <div className="chart-container">
            <h3 className="text-sm font-semibold font-display mb-4 text-foreground">Produtividade por colaborador</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground text-xs">#</th>
                    <SortableHeader label="Colaborador"   field="nome" sort={prodSort} onToggle={toggleProd} />
                    <SortableHeader label="Horas"         field="trab" sort={prodSort} onToggle={toggleProd} className="text-right" />
                    <SortableHeader label="Disponível"    field="disp" sort={prodSort} onToggle={toggleProd} className="text-right" />
                    <SortableHeader label="Produtividade" field="pct"  sort={prodSort} onToggle={toggleProd} className="text-right" />
                  </tr>
                </thead>
                <tbody>
                  {sortedProd.map((r, i) => {
                    const pct = Number(r.pct);
                    return (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-2 text-xs text-muted-foreground">{i + 1}</td>
                        <td className="py-2 text-xs font-medium">{String(r.nome)}</td>
                        <td className="py-2 text-xs text-right">{String(r.trab)}h</td>
                        <td className="py-2 text-xs text-right">{String(r.disp)}h</td>
                        <td className="py-2 text-xs text-right w-40">
                          <div className="flex items-center gap-2 justify-end">
                            <Progress value={Math.min(pct, 100)} className={`h-2 w-20 [&>div]:${prodBg(pct)}`} />
                            <span style={{ color: prodColor(pct) }} className="font-semibold min-w-[40px] text-right">{formatPercent(pct)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {fatCol.isLoading ? <TableSkeleton /> : (
          <div className="chart-container">
            <h3 className="text-sm font-semibold font-display mb-4 text-foreground">Faturamento por colaborador</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground text-xs">#</th>
                    <SortableHeader label="Colaborador" field="nome"  sort={fatSort} onToggle={toggleFat} />
                    <SortableHeader label="Horas"       field="horas" sort={fatSort} onToggle={toggleFat} className="text-right" />
                    <SortableHeader label="Serviço"     field="fat"   sort={fatSort} onToggle={toggleFat} className="text-right" />
                    <SortableHeader label="OP"          field="op"    sort={fatSort} onToggle={toggleFat} className="text-right" />
                    <SortableHeader label="Total"       field="total" sort={fatSort} onToggle={toggleFat} className="text-right" />
                  </tr>
                </thead>
                <tbody>
                  {sortedFat.map((r, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 text-xs text-muted-foreground">{i + 1}</td>
                      <td className="py-2 text-xs font-medium">{String(r.nome)}</td>
                      <td className="py-2 text-xs text-right">{String(r.horas)}h</td>
                      <td className="py-2 text-xs text-right font-display">{formatCurrency(Number(r.fat))}</td>
                      <td className="py-2 text-xs text-right font-display">{Number(r.op) > 0 ? formatCurrency(Number(r.op)) : <span className="text-muted-foreground">—</span>}</td>
                      <td className="py-2 text-xs text-right font-display font-semibold">{formatCurrency(Number(r.total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {servicosFat.isLoading ? <ChartSkeleton /> : (
        <div className="chart-container">
          <h3 className="text-sm font-semibold font-display mb-4 text-foreground">Faturamento por grupo de serviço</h3>
          {grupoChart.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={grupoChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
                <YAxis dataKey="grupo" type="category" width={150} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
