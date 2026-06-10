import { DollarSign, ShoppingCart, Users, FileText, Wrench, Package } from "lucide-react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ErrorAlert } from "@/components/dashboard/ErrorAlert";
import { KPISkeleton, ChartSkeleton } from "@/components/dashboard/LoadingSkeleton";
import { useViewData } from "@/hooks/useComercialData";
import { formatCurrency, formatCurrencyInt } from "@/data/mockData";
import { useShell } from "@/components/layout/AppShell";
import { buildVendedorInfo, resolveVendedorNome } from "@/lib/dim-vendedor";

export default function VendasVisaoGeral() {
  const { filters } = useShell();

  const loja = useViewData("vw_comercial_loja", filters, 15000);
  // Totalizador oficial de faturamento OS
  const osRes = useViewData("vw_os_res_fat", filters, 15000, { skipTipoSaida: true });
  // Detalhamento por vendedor (precisa de id_vendedor — vw_os_res_fat não tem)
  const osServ = useViewData("vw_os_servicos_faturados", filters, 15000);
  const osPecas = useViewData("vw_os_pecas_faturadas", filters, 15000);
  const docs = useViewData("vw_comercial_docs_faturados", filters, 15000);
  const dimVendedor = useViewData("vw_loja_vendedores", filters, 50000, { skipDate: true, skipTipoSaida: true });
  const vendedorInfo = buildVendedorInfo(dimVendedor.data);

  // 6m history
  const sixAgo = subMonths(filters.mesAno, 5);
  const y = filters.mesAno.getFullYear();
  const m = filters.mesAno.getMonth() + 1;
  const lastDay = new Date(y, m, 0).getDate();
  const histOpts = {
    startDate: `${sixAgo.getFullYear()}-${String(sixAgo.getMonth() + 1).padStart(2, "0")}-01`,
    endDate: `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  };
  const lojaHist = useViewData("vw_comercial_loja", filters, 30000, histOpts);
  const osResHist = useViewData("vw_os_res_fat", filters, 50000, { ...histOpts, skipTipoSaida: true });

  const includeOS = filters.canal !== "LOJA";
  const includeLoja = filters.canal !== "OS";

  const lojaRows = includeLoja ? loja.data ?? [] : [];
  const osResRows = includeOS ? osRes.data ?? [] : [];
  const servRows = includeOS ? osServ.data ?? [] : [];
  const pecasRows = includeOS ? osPecas.data ?? [] : [];
  const docsRows = docs.data ?? [];

  const fatLoja = lojaRows.reduce((s, r) => s + (Number(r.faturamento_doc) || 0), 0);
  const fatServ = osResRows.reduce((s, r) => s + (Number(r.fat_servicos) || 0), 0);
  const fatPecasOS = osResRows.reduce((s, r) => s + (Number(r.fat_pecas) || 0), 0);
  const fatTotal = fatLoja + fatServ + fatPecasOS;

  const docIds = new Set<string>();
  lojaRows.forEach((r) => docIds.add(`L-${r.id_doc}`));
  pecasRows.forEach((r) => docIds.add(`O-${r.id_os}`));
  servRows.forEach((r) => docIds.add(`O-${r.id_os}`));
  const numDocs = docIds.size;
  const ticket = numDocs > 0 ? fatTotal / numDocs : 0;
  const clientesAtivos = new Set([
    ...lojaRows.map((r) => r.id_cliente),
    ...docsRows.map((r) => r.id_cliente),
  ].filter(Boolean)).size;

  // Daily chart — Peças (Loja) e Ordem de serviço (peças + serviços de OS via vw_os_res_fat)
  const diarioMap: Record<string, { pecas: number; ordemServico: number }> = {};
  lojaRows.forEach((r) => {
    const d = String(r.data_faturamento || "").slice(8, 10);
    if (!d) return;
    if (!diarioMap[d]) diarioMap[d] = { pecas: 0, ordemServico: 0 };
    diarioMap[d].pecas += Number(r.faturamento_doc) || 0;
  });
  osResRows.forEach((r) => {
    const d = String(r.data_faturamento || "").slice(8, 10);
    if (!d) return;
    if (!diarioMap[d]) diarioMap[d] = { pecas: 0, ordemServico: 0 };
    diarioMap[d].ordemServico += Number(r.fat_total) || 0;
  });
  const diarioData = Object.entries(diarioMap).map(([dia, v]) => ({ dia, ...v })).sort((a, b) => a.dia.localeCompare(b.dia));

  // 6m monthly
  const monthlyMap: Record<string, { pecas: number; servicos: number }> = {};
  const addMonth = (mk: string, key: "pecas" | "servicos", val: number) => {
    if (!monthlyMap[mk]) monthlyMap[mk] = { pecas: 0, servicos: 0 };
    monthlyMap[mk][key] += val;
  };
  (lojaHist.data ?? []).forEach((r) => addMonth(String(r.data_faturamento || "").slice(0, 7), "pecas", Number(r.faturamento_doc) || 0));
  (osResHist.data ?? []).forEach((r) => {
    const mk = String(r.data_faturamento || "").slice(0, 7);
    addMonth(mk, "pecas", Number(r.fat_pecas) || 0);
    addMonth(mk, "servicos", Number(r.fat_servicos) || 0);
  });
  const monthlyData = Object.entries(monthlyMap)
    .filter(([mk]) => mk)
    .map(([mk, v]) => {
      const [yy, mm] = mk.split("-");
      return { mes: format(new Date(Number(yy), Number(mm) - 1), "MMM/yy", { locale: ptBR }).toUpperCase(), raw: mk, ...v };
    })
    .sort((a, b) => a.raw.localeCompare(b.raw));

  // Top vendedores
  const vendMap = new Map<string, number>();
  const addVend = (r: Record<string, unknown>, val: number) => {
    const id = String(r.id_vendedor ?? "").trim();
    if (!id || id === "0" || id === "null") return;
    if (vendedorInfo.ids.size && !vendedorInfo.ids.has(id)) return;
    const nome = resolveVendedorNome(id, r.nome_vendedor ?? r.vendedor, vendedorInfo);
    vendMap.set(nome, (vendMap.get(nome) || 0) + val);
  };
  lojaRows.forEach((r) => addVend(r, Number(r.faturamento_doc) || 0));
  pecasRows.forEach((r) => addVend(r, Number(r.total_item) || 0));
  servRows.forEach((r) => addVend(r, Number(r.total_servico) || 0));
  const topVend = Array.from(vendMap.entries())
    .map(([nome, fat]) => ({ nome: nome.length > 18 ? nome.slice(0, 18) + "…" : nome, fat }))
    .sort((a, b) => b.fat - a.fat)
    .slice(0, 10);

  const hasErr = loja.error || osRes.error || osServ.error || osPecas.error;
  const isLoading = loja.isLoading || osRes.isLoading || osServ.isLoading || osPecas.isLoading;
  const histLoading = lojaHist.isLoading || osResHist.isLoading;

  return (
    <div className="dashboard-section space-y-5">
      {hasErr && <ErrorAlert message="Erro ao carregar dados" details={(loja.error as Error)?.message || ""} />}

      {isLoading ? <KPISkeleton /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard label="Faturamento" value={formatCurrencyInt(fatTotal)} icon={<DollarSign className="h-4 w-4" />} />
          <MetricCard label="Peças (Loja)" value={formatCurrencyInt(fatLoja)} icon={<Package className="h-4 w-4" />} />
          <MetricCard label="Serviços (OS)" value={formatCurrencyInt(fatServ)} icon={<Wrench className="h-4 w-4" />} />
          <MetricCard label="Ticket Médio" value={formatCurrencyInt(ticket)} icon={<ShoppingCart className="h-4 w-4" />} />
          <MetricCard label="Documentos" value={String(numDocs)} icon={<FileText className="h-4 w-4" />} />
          <MetricCard label="Clientes Ativos" value={String(clientesAtivos)} icon={<Users className="h-4 w-4" />} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {isLoading ? <ChartSkeleton /> : (
          <div className="chart-container">
            <div className="table-card-title mb-3">Evolução diária do mês</div>
            {diarioData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={diarioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={(l) => `Dia ${l}`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="pecas" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Peças" />
                  <Line type="monotone" dataKey="ordemServico" stroke="hsl(var(--success))" strokeWidth={2} dot={false} name="Ordem de serviço" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {histLoading ? <ChartSkeleton /> : (
          <div className="chart-container">
            <div className="table-card-title mb-3">Comparativo 6 meses</div>
            {monthlyData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="pecas" stackId="a" fill="hsl(var(--primary))" name="Peças" />
                  <Bar dataKey="servicos" stackId="a" fill="hsl(var(--success))" name="Serviços" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>

      {isLoading ? <ChartSkeleton /> : (
        <div className="chart-container">
          <div className="table-card-title mb-3">Top 10 vendedores · mês</div>
          {topVend.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(280, topVend.length * 32)}>
              <BarChart data={topVend} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="nome" type="category" tick={{ fontSize: 11 }} width={140} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="fat" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Faturamento" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
