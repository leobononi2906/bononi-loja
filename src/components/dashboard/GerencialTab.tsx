import { subMonths, format, getDaysInMonth } from "date-fns";
import { Wrench, Clock, FileCheck, DollarSign, Package, ShieldAlert } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MetricCard } from "./MetricCard";
import { ErrorAlert } from "./ErrorAlert";
import { KPISkeleton, ChartSkeleton, TableSkeleton } from "./LoadingSkeleton";
import { SortableHeader } from "./SortableHeader";
import { useSortable } from "@/hooks/useSortable";
import { useViewData } from "@/hooks/useComercialData";
import { formatCurrency, formatCurrencyInt, type DashboardFilters } from "@/data/mockData";

interface Props { filters: DashboardFilters; }

export function GerencialTab({ filters }: Props) {
  // ── Snapshot cards via vw_os_gerencial_cards_v2 (no date filter) ──
  const cards = useViewData("vw_os_gerencial_cards_v2", filters, 1, { skipDate: true });

  // ── OS Faturadas (view oficial com data_faturamento_corrigida) ──
  const osBase = useViewData("vw_os_base_fat_corrigido", filters, 50000, { dateCol: "data_faturamento_corrigida" });

  // ── Detail rows for tables ──
  const osAndamento = useViewData("vw_os_andamento_v2", filters, 5000, { skipDate: true });
  const osAgFat = useViewData("vw_os_ag_fat_v2", filters, 5000, { skipDate: true });

  // ── OS abertas por dia: use vw_os_base with MLB PR filters ──
  const osEntrada = useViewData("vw_os_base", filters, 50000, { dateCol: "data_entrada", skipDate: false });

  // ── Totalizador oficial de faturamento OS (peças + serviços) ──
  const osRes = useViewData("vw_os_res_fat", filters, 15000, { skipTipoSaida: true });
  // Detalhamento por grupo de serviço (precisa de grupo_serv — vw_os_res_fat não tem)
  const servicos = useViewData("vw_os_servicos_faturados", filters);
  const servicoPecas = useViewData("vw_os_servico_x_pecas_faturado", filters);

  // ── 6-month range for Faturamento OS por Mês chart ──
  const sixMonthsAgo = subMonths(filters.mesAno, 5);
  const sixMonthStart = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`;
  const curY = filters.mesAno.getFullYear();
  const curM = filters.mesAno.getMonth() + 1;
  const lastDay = new Date(curY, curM, 0).getDate();
  const sixMonthEnd = `${curY}-${String(curM).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const osRes6m = useViewData("vw_os_res_fat", filters, 50000, {
    startDate: sixMonthStart, endDate: sixMonthEnd, skipTipoSaida: true,
  });

  // ── Snapshot cards ──
  const cardsRow = (cards.data ?? [])[0] ?? {};
  const osAndamentoCount = Number(cardsRow.os_andamento) || 0;
  const osAgFatCount = Number(cardsRow.os_ag_fat) || 0;
  const garantiaCount = Number(cardsRow.os_garantia) || 0;

  // ── OS Faturadas (period-filtered from vw_os_base) ──
  const osBaseData = osBase.data ?? [];
  const osFaturadasIds = new Set<string>();
  osBaseData.forEach(r => {
    if (Number(r.fl_faturada) === 1 && Number(r.id_tipo_os) === 1) {
      osFaturadasIds.add(String(r.id_os));
    }
  });
  const osFaturadasCount = osFaturadasIds.size;

  // Fat. Serviços / Peças (totalizador oficial vw_os_res_fat)
  const osResData = osRes.data ?? [];
  const faturamentoServicos = osResData.reduce((s, r) => s + (Number(r.fat_servicos) || 0), 0);
  const faturamentoPecas = osResData.reduce((s, r) => s + (Number(r.fat_pecas) || 0), 0);
  // Para o ranking por grupo continuamos usando vw_os_servicos_faturados (precisa de grupo_serv)
  const servicosData = servicos.data ?? [];

  // Chart: OS Abertas por Dia — MLB PR (from vw_os_base, deduped by id_os)
  const osEntradaData = osEntrada.data ?? [];
  // Filter: MLB PR (id_empresa=2), id_tipo_os=1, cancelada='N', dedup by id_os
  const osEntradaDeduped = new Map<string, Record<string, unknown>>();
  osEntradaData.forEach(r => {
    if (Number(r.id_empresa) !== 2) return;
    if (Number(r.id_tipo_os) !== 1) return;
    if (String(r.cancelada).toUpperCase() === 'S') return;
    const idOs = String(r.id_os);
    if (!osEntradaDeduped.has(idOs)) osEntradaDeduped.set(idOs, r);
  });
  const osAbertasPorDia: Record<string, number> = {};
  osEntradaDeduped.forEach(r => {
    const dia = String(r.data_entrada || "").slice(0, 10);
    if (!dia) return;
    osAbertasPorDia[dia] = (osAbertasPorDia[dia] || 0) + 1;
  });
  const osChartData = Object.entries(osAbertasPorDia)
    .map(([dia, abertas]) => ({ dia: dia.slice(5).replace("-", "/"), rawDate: dia, abertas }))
    .sort((a, b) => a.rawDate.localeCompare(b.rawDate));

  // Top Service Groups by revenue (deduped)
  const grupoServAgg: Record<string, number> = {};
  servicosData.forEach(r => {
    const grupo = String(r.grupo_serv || r.grupo_servico || "Outros").trim();
    grupoServAgg[grupo] = (grupoServAgg[grupo] || 0) + (Number(r.total_servico) || 0);
  });
  const grupoServChartData = Object.entries(grupoServAgg)
    .map(([grupo, valor]) => ({ grupo, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  // Service Group x Parts (deduped)
  const grupoServPecas: Record<string, { totalPecas: number; custoPecas: number; margemPecas: number }> = {};
  (servicoPecas.data ?? []).forEach(r => {
    const grupo = String(r.grupo_serv || r.grupo_servico || "Outros").trim();
    if (!grupoServPecas[grupo]) grupoServPecas[grupo] = { totalPecas: 0, custoPecas: 0, margemPecas: 0 };
    grupoServPecas[grupo].totalPecas += Number(r.total_pecas) || 0;
    grupoServPecas[grupo].custoPecas += Number(r.custo_pecas) || 0;
    grupoServPecas[grupo].margemPecas += Number(r.margem_pecas) || 0;
  });
  const grupoServPecasData = Object.entries(grupoServPecas)
    .map(([grupo, v]) => ({ grupo, ...v }))
    .sort((a, b) => b.totalPecas - a.totalPecas)
    .slice(0, 15);

  const { sorted: sortedPecas, sort: pecasSort, toggle: togglePecas } = useSortable(
    grupoServPecasData as unknown as Record<string, unknown>[], "totalPecas", "desc"
  );

  // ── Faturamento OS por Mês (últimos 6 meses) — vw_os_res_fat ──
  const fatOsMensal: Record<string, { servicos: number; pecas: number }> = {};
  (osRes6m.data ?? []).forEach(r => {
    const dt = String(r.data_faturamento || "").slice(0, 7);
    if (!dt) return;
    if (!fatOsMensal[dt]) fatOsMensal[dt] = { servicos: 0, pecas: 0 };
    fatOsMensal[dt].servicos += Number(r.fat_servicos) || 0;
    fatOsMensal[dt].pecas += Number(r.fat_pecas) || 0;
  });
  const fatOsChartData = Object.entries(fatOsMensal)
    .map(([mes, v]) => {
      const [y, m] = mes.split("-");
      const d = new Date(Number(y), Number(m) - 1);
      return {
        mes: format(d, "MMM/yy").toUpperCase(),
        rawMes: mes,
        servicos: Math.round(v.servicos * 100) / 100,
        pecas: Math.round(v.pecas * 100) / 100,
        total: Math.round((v.servicos + v.pecas) * 100) / 100,
      };
    })
    .sort((a, b) => a.rawMes.localeCompare(b.rawMes));


  const andamentoRows = (osAndamento.data ?? [])
    .filter(r => String(r.tipo_os).toUpperCase() === "NORMAL" && (Number(r.valor_total) || 0) > 0)
    .map(r => ({
      id_os: String(r.id_os),
      cliente: String(r.cliente || "-"),
      vendedor: String(r.vendedor || "-"),
      data_entrada: String(r.data_entrada || "-").slice(0, 10),
      valor_total: Number(r.valor_total) || 0,
    }));
  const { sorted: sortedAbertas, sort: abertasSort, toggle: toggleAbertas } = useSortable(
    andamentoRows as unknown as Record<string, unknown>[], "valor_total", "desc"
  );

  // Sortable OS tables - Aguardando (from vw_os_ag_fat_v2)
  const aguardRows = (osAgFat.data ?? [])
    .filter(r => String(r.tipo_os).toUpperCase() === "NORMAL" && (Number(r.valor_total) || 0) > 0)
    .map(r => ({
      id_os: String(r.id_os),
      cliente: String(r.cliente || "-"),
      vendedor: String(r.vendedor || "-"),
      data_finalizacao: String(r.data_finalizacao || "-").slice(0, 10),
      valor_total: Number(r.valor_total) || 0,
    }));
  const { sorted: sortedAguard, sort: aguardSort, toggle: toggleAguard } = useSortable(
    aguardRows as unknown as Record<string, unknown>[], "valor_total", "desc"
  );

  const hasError = cards.error || osAndamento.error || osAgFat.error || servicos.error || servicoPecas.error || osBase.error;
  const isLoading = cards.isLoading || osAndamento.isLoading || osAgFat.isLoading || osBase.isLoading;

  return (
    <div className="dashboard-section space-y-6">
      {hasError && (
        <div className="space-y-2">
          {cards.error && <ErrorAlert message="Erro ao carregar cards OS" details={(cards.error as Error).message} />}
          {osAndamento.error && <ErrorAlert message="Erro ao carregar OS em andamento" details={(osAndamento.error as Error).message} />}
          {osAgFat.error && <ErrorAlert message="Erro ao carregar OS aguardando" details={(osAgFat.error as Error).message} />}
          {servicos.error && <ErrorAlert message="Erro ao carregar serviços" details={(servicos.error as Error).message} />}
          {servicoPecas.error && <ErrorAlert message="Erro ao carregar serviço x peças" details={(servicoPecas.error as Error).message} />}
        </div>
      )}

      {isLoading ? <KPISkeleton /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard label="OS em Andamento" value={String(osAndamentoCount)} icon={<Wrench className="h-5 w-5" />} />
          <MetricCard label="Aguard. Faturamento" value={String(osAgFatCount)} icon={<Clock className="h-5 w-5" />} />
          <MetricCard label="OS Faturadas" value={String(osFaturadasCount)} icon={<FileCheck className="h-5 w-5" />} />
          <MetricCard label="Fat. Serviços" value={formatCurrencyInt(faturamentoServicos)} icon={<DollarSign className="h-5 w-5" />} />
          <MetricCard label="Fat. Peças" value={formatCurrencyInt(faturamentoPecas)} icon={<Package className="h-5 w-5" />} />
          <MetricCard label="M.O. Produzida" value={formatCurrencyInt(moProduzida)} icon={<DollarSign className="h-5 w-5" />} />
          <MetricCard label="OS Garantia" value={String(garantiaCount)} icon={<ShieldAlert className="h-5 w-5" />} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {osEntrada.isLoading ? <ChartSkeleton /> : (
          <div className="chart-container">
            <h3 className="text-sm font-semibold font-display mb-4 text-foreground">OS Abertas por Dia no Período — MLB PR</h3>
            {osChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={osChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" angle={-45} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="abertas" fill="hsl(var(--primary))" name="OS Abertas" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {servicos.isLoading ? <ChartSkeleton /> : (
          <div className="chart-container">
            <h3 className="text-sm font-semibold font-display mb-4 text-foreground">Top Grupos de Serviço por Receita</h3>
            {grupoServChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={grupoServChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="grupo" type="category" tick={{ fontSize: 9 }} width={120} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="valor" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} name="Receita" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {osAndamento.isLoading ? <TableSkeleton /> : (
          <div className="chart-container">
            <h3 className="text-sm font-semibold font-display mb-4 text-foreground">Fila — OS em Andamento ({andamentoRows.length})</h3>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground text-xs">OS</th>
                    <SortableHeader label="Cliente" field="cliente" sort={abertasSort} onToggle={toggleAbertas} />
                    <th className="pb-2 font-medium text-muted-foreground text-xs">Vendedor</th>
                    <SortableHeader label="Entrada" field="data_entrada" sort={abertasSort} onToggle={toggleAbertas} />
                    <SortableHeader label="Total" field="valor_total" sort={abertasSort} onToggle={toggleAbertas} className="text-right" />
                  </tr>
                </thead>
                <tbody>
                  {sortedAbertas.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-1.5 text-xs font-medium">{String(r.id_os)}</td>
                      <td className="py-1.5 text-xs">{String(r.cliente)}</td>
                      <td className="py-1.5 text-xs">{String(r.vendedor)}</td>
                      <td className="py-1.5 text-xs">{String(r.data_entrada).split("-").reverse().join("/")}</td>
                      <td className="py-1.5 text-xs text-right font-display">{formatCurrency(Number(r.valor_total))}</td>
                    </tr>
                  ))}
                  {sortedAbertas.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-xs text-muted-foreground">Nenhuma OS aberta</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {osAgFat.isLoading ? <TableSkeleton /> : (
          <div className="chart-container">
            <h3 className="text-sm font-semibold font-display mb-4 text-foreground">Fila — Aguardando Faturamento ({aguardRows.length})</h3>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground text-xs">OS</th>
                    <SortableHeader label="Cliente" field="cliente" sort={aguardSort} onToggle={toggleAguard} />
                    <SortableHeader label="Vendedor" field="vendedor" sort={aguardSort} onToggle={toggleAguard} />
                    <SortableHeader label="Finalização" field="data_finalizacao" sort={aguardSort} onToggle={toggleAguard} />
                    <SortableHeader label="Total" field="valor_total" sort={aguardSort} onToggle={toggleAguard} className="text-right" />
                  </tr>
                </thead>
                <tbody>
                  {sortedAguard.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-1.5 text-xs font-medium">{String(r.id_os)}</td>
                      <td className="py-1.5 text-xs">{String(r.cliente)}</td>
                      <td className="py-1.5 text-xs">{String(r.vendedor)}</td>
                      <td className="py-1.5 text-xs">{String(r.data_finalizacao) !== "-" ? String(r.data_finalizacao).split("-").reverse().join("/") : "-"}</td>
                      <td className="py-1.5 text-xs text-right font-display">{formatCurrency(Number(r.valor_total))}</td>
                    </tr>
                  ))}
                  {sortedAguard.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-xs text-muted-foreground">Nenhuma OS aguardando</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Faturamento OS por Mês (últimos 6 meses) */}
      {osRes6m.isLoading ? <ChartSkeleton /> : (
        <div className="chart-container">
          <h3 className="text-sm font-semibold font-display mb-4 text-foreground">Faturamento OS por Mês (últimos 6 meses)</h3>
          {fatOsChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={fatOsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="servicos" stackId="a" fill="hsl(var(--primary))" name="Serviços" />
                <Bar dataKey="pecas" stackId="a" fill="hsl(var(--accent))" name="Peças" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
