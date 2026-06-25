import { useState } from "react";
import { DollarSign, Package, Wrench, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "./MetricCard";
import { ErrorAlert } from "./ErrorAlert";
import { KPISkeleton, ChartSkeleton, TableSkeleton } from "./LoadingSkeleton";
import { SortableHeader } from "./SortableHeader";
import { useSortable } from "@/hooks/useSortable";
import { useViewData } from "@/hooks/useComercialData";
import { formatCurrency, formatCurrencyInt, formatPercent, type DashboardFilters } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Props { filters: DashboardFilters; }

const TAP_GRUPOS = new Set(["TAPECARIA"]);
const TAP_SUBGRUPOS = new Set(["FORROS TAPECARIA", "PECAS TAPECARIA"]);

function isTapecaria(r: Record<string, unknown>): boolean {
  const grupo = String(r.grupo || "").trim().toUpperCase();
  const subgrupo = String(r.subgrupo || "").trim().toUpperCase();
  return TAP_GRUPOS.has(grupo) || TAP_SUBGRUPOS.has(subgrupo);
}

// Busca colaboradores configurados como TAPECARIA
function useTapecariaColabs() {
  return useQuery({
    queryKey: ["config_tapecaria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loja_config_colaborador")
        .select("id_colaborador, nome_colaborador")
        .eq("setor", "TAPECARIA")
        .eq("ativo", true)
        .range(0, 9999);
      if (error) throw error;
      return new Set((data ?? []).map(r => r.id_colaborador));
    },
    staleTime: 60_000,
  });
}

export function TapecariaTab({ filters }: Props) {
  const [detailPage, setDetailPage] = useState(0);

  const tapColabs = useTapecariaColabs();
  const tapColabIds = tapColabs.data ?? new Set();

  // ── Data sources — usa vw_tap_prod_v3 (sem filtro departamento, bug de duplicação corrigido) ──
  const tapProd = useViewData("vw_tap_prod_v3", filters, 5000, {
    columns: "id_colaborador,nome_colaborador,produto_rateado,servico_rateado,tipo_lancamento,produto,grupo,subgrupo,nome_servico,grupo_serv,horas_colab,data_apontamento,id_produto",
  });
  const itensVendidos = useViewData("vw_comercial_itens_faturados", filters, 5000, { skipTipoSaida: true });

  // Filtra só colaboradores do setor TAPECARIA (pela config)
  const tapProdData = (tapProd.data ?? []).filter(r =>
    tapColabIds.size === 0 || tapColabIds.has(Number(r.id_colaborador))
  );

  // ── KPIs ──
  const pecasOsFat = tapProdData
    .filter(r => String(r.tipo_lancamento || "").toUpperCase() === "PRODUTO")
    .reduce((s, r) => s + (Number(r.produto_rateado) || 0), 0);
  const servicosOsFat = tapProdData
    .filter(r => String(r.tipo_lancamento || "").toUpperCase() === "SERVICO")
    .reduce((s, r) => s + (Number(r.servico_rateado) || 0), 0);
  const vendaDiretaTapFat = (itensVendidos.data ?? [])
    .filter(isTapecaria)
    .reduce((s, r) => s + (Number(r.total_item) || 0), 0);
  const fatTotal = pecasOsFat + servicosOsFat + vendaDiretaTapFat;

  // ── Ranking por colaborador: OP + Serviço + Total ──
  // DEDUPLICAÇÃO: vw_tap_prod_v3 tem 1 linha por (id_servico_os, colaborador, tipo_lancamento)
  // horas_colab já está correto por OS, mas pode aparecer múltiplas linhas por colab/OS (PRODUTO + SERVICO)
  // Deduplica horas por (id_colaborador, id_servico_os) para não somar dobrado
  const horasDedup: Record<string, number> = {};
  tapProdData.forEach(r => {
    const key = `${r.id_colaborador}__${r.id_produto}`;
    // Pega o maior valor de horas_colab para essa chave (deve ser igual em PRODUTO e SERVICO da mesma OS)
    const h = Number(r.horas_colab) || 0;
    if (!horasDedup[key] || h > horasDedup[key]) {
      horasDedup[key] = h;
    }
  });

  // Mapa de horas corretas por colaborador
  const horasColabMap: Record<string, number> = {};
  Object.entries(horasDedup).forEach(([key, h]) => {
    const idColab = key.split("__")[0];
    horasColabMap[idColab] = (horasColabMap[idColab] || 0) + h;
  });

  const fatColabMap: Record<string, { nome: string; id: string; op: number; servico: number }> = {};
  tapProdData.forEach(r => {
    const id = String(r.id_colaborador);
    const nome = String(r.nome_colaborador || "-");
    if (!fatColabMap[id]) fatColabMap[id] = { nome, id, op: 0, servico: 0 };
    fatColabMap[id].op      += Number(r.produto_rateado) || 0;
    fatColabMap[id].servico += Number(r.servico_rateado) || 0;
  });

  const colabRanking = Object.entries(fatColabMap)
    .map(([id, v]) => ({
      nome:    v.nome,
      op:      +v.op.toFixed(2),
      servico: +v.servico.toFixed(2),
      total:   +(v.op + v.servico).toFixed(2),
      horas:   +(horasColabMap[id] || 0).toFixed(1),
    }))
    .filter(r => r.op > 0 || r.servico > 0)
    .sort((a, b) => b.total - a.total);

  const { sorted: sortedColab, sort: colabSort, toggle: toggleColab } = useSortable(
    colabRanking as unknown as Record<string, unknown>[], "total", "desc"
  );

  // ── Evolução diária ──
  const dailyMap: Record<string, number> = {};
  tapProdData.forEach(r => {
    const dia = String(r.data_apontamento || "").slice(0, 10);
    if (!dia) return;
    dailyMap[dia] = (dailyMap[dia] || 0) + (Number(r.horas_colab) || 0);
  });
  const dailyChart = Object.entries(dailyMap)
    .map(([dia, horas]) => ({ dia: dia.slice(5).replace("-", "/"), rawDate: dia, horas: +horas.toFixed(1) }))
    .sort((a, b) => a.rawDate.localeCompare(b.rawDate));

  const totalHoras = colabRanking.reduce((s, r) => s + r.horas, 0);

  // ── Produtos mais vendidos ──
  const PAGE_SIZE = 50;
  const productGroupMap: Record<string, { subgrupo: string; valor: number; qtd: number }> = {};
  tapProdData
    .filter(r => String(r.tipo_lancamento || "").toUpperCase() === "PRODUTO")
    .forEach(r => {
      const item = String(r.produto || "-");
      if (!productGroupMap[item]) productGroupMap[item] = { subgrupo: String(r.subgrupo || "-"), valor: 0, qtd: 0 };
      productGroupMap[item].valor += Number(r.produto_rateado) || 0;
      productGroupMap[item].qtd += 1;
    });

  const detailRows = Object.entries(productGroupMap)
    .map(([item, v]) => ({ item, subgrupo: v.subgrupo, valor: +v.valor.toFixed(2), qtd: v.qtd }))
    .filter(r => r.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const { sorted: sortedDetail, sort: detSort, toggle: toggleDet } = useSortable(
    detailRows as unknown as Record<string, unknown>[], "valor", "desc"
  );
  const totalPages = Math.ceil(sortedDetail.length / PAGE_SIZE);
  const pagedDetail = sortedDetail.slice(detailPage * PAGE_SIZE, (detailPage + 1) * PAGE_SIZE);

  const allLoading = tapProd.isLoading || itensVendidos.isLoading || tapColabs.isLoading;

  return (
    <div className="dashboard-section space-y-6">
      {tapProd.error && <ErrorAlert message="Erro ao carregar dados tapeçaria" details={(tapProd.error as Error).message} />}

      {/* KPIs */}
      {allLoading ? <KPISkeleton /> : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Faturamento Total Tapeçaria" value={formatCurrencyInt(fatTotal)} icon={<DollarSign className="h-5 w-5" />} />
          <MetricCard label="OP (Peças OS)" value={formatCurrencyInt(pecasOsFat)} icon={<Package className="h-5 w-5" />} />
          <MetricCard label="Serviços OS" value={formatCurrencyInt(servicosOsFat)} icon={<Wrench className="h-5 w-5" />} />
          <MetricCard label="Horas Apontadas" value={`${Math.round(totalHoras)}h`} icon={<Clock className="h-5 w-5" />} />
        </div>
      )}

      {!allLoading && (
        <div className="grid grid-cols-3 gap-3">
          <div className="metric-card">
            <span className="metric-label text-xs">OP (Peças OS)</span>
            <div className="metric-value text-sm">{formatCurrency(pecasOsFat)}</div>
          </div>
          <div className="metric-card">
            <span className="metric-label text-xs">Serviços OS</span>
            <div className="metric-value text-sm">{formatCurrency(servicosOsFat)}</div>
          </div>
          <div className="metric-card">
            <span className="metric-label text-xs">Venda Direta Balcão</span>
            <div className="metric-value text-sm">{formatCurrency(vendaDiretaTapFat)}</div>
          </div>
        </div>
      )}

      {/* Evolução diária */}
      {tapProd.isLoading ? <ChartSkeleton /> : (
        <div className="chart-container">
          <h3 className="text-sm font-semibold font-display mb-4 text-foreground">Evolução Diária — Horas Tapeçaria</h3>
          {dailyChart.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" angle={-45} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => `${v}h`} />
                <Bar dataKey="horas" fill="hsl(var(--primary))" name="Horas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Ranking colaboradores — OP + Serviço + Total */}
      {allLoading ? <TableSkeleton /> : (
        <div className="chart-container">
          <h3 className="text-sm font-semibold font-display mb-4 text-foreground">
            Ranking — Colaboradores Tapeçaria
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-muted-foreground text-xs">#</th>
                  <SortableHeader label="Colaborador" field="nome" sort={colabSort} onToggle={toggleColab} />
                  <SortableHeader label="Horas" field="horas" sort={colabSort} onToggle={toggleColab} className="text-right" />
                  <SortableHeader label="Part.%" field="pct" sort={colabSort} onToggle={toggleColab} className="text-right" />
                  <SortableHeader label="OP" field="op" sort={colabSort} onToggle={toggleColab} className="text-right" />
                  <SortableHeader label="Serviço" field="servico" sort={colabSort} onToggle={toggleColab} className="text-right" />
                  <SortableHeader label="Total" field="total" sort={colabSort} onToggle={toggleColab} className="text-right" />
                </tr>
              </thead>
              <tbody>
                {sortedColab.map((r, i) => {
                  const pct = totalHoras > 0 ? +((Number(r.horas) / totalHoras) * 100).toFixed(1) : 0;
                  return (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 text-xs text-muted-foreground">{i + 1}</td>
                      <td className="py-2 text-xs font-medium">{String(r.nome)}</td>
                      <td className="py-2 text-xs text-right">{String(r.horas)}h</td>
                      <td className="py-2 text-xs text-right w-32">
                        <div className="flex items-center gap-2 justify-end">
                          <Progress value={Math.min(pct, 100)} className="h-2 w-16" />
                          <span className="min-w-[36px] text-right">{formatPercent(pct)}</span>
                        </div>
                      </td>
                      <td className="py-2 text-xs text-right font-display">{formatCurrency(Number(r.op))}</td>
                      <td className="py-2 text-xs text-right font-display">{formatCurrency(Number(r.servico))}</td>
                      <td className="py-2 text-xs text-right font-display font-semibold">{formatCurrency(Number(r.total))}</td>
                    </tr>
                  );
                })}
                {sortedColab.length === 0 && (
                  <tr><td colSpan={7} className="py-4 text-center text-xs text-muted-foreground">Sem dados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Produtos mais vendidos */}
      {tapProd.isLoading ? <TableSkeleton /> : (
        <div className="chart-container">
          <h3 className="text-sm font-semibold font-display mb-4 text-foreground">Produtos Mais Vendidos — Tapeçaria</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <SortableHeader label="Produto" field="item" sort={detSort} onToggle={toggleDet} />
                  <th className="pb-2 font-medium text-muted-foreground text-xs">Subgrupo</th>
                  <SortableHeader label="Valor Total" field="valor" sort={detSort} onToggle={toggleDet} className="text-right" />
                  <SortableHeader label="Qtd" field="qtd" sort={detSort} onToggle={toggleDet} className="text-right" />
                </tr>
              </thead>
              <tbody>
                {pagedDetail.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-1.5 text-xs">{String(r.item)}</td>
                    <td className="py-1.5 text-xs">{String(r.subgrupo)}</td>
                    <td className="py-1.5 text-xs text-right font-display">{formatCurrency(Number(r.valor))}</td>
                    <td className="py-1.5 text-xs text-right">{String(r.qtd)}</td>
                  </tr>
                ))}
                {pagedDetail.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-xs text-muted-foreground">Sem dados</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <span className="text-xs text-muted-foreground">Página {detailPage + 1} de {totalPages} ({sortedDetail.length} registros)</span>
              <div className="flex gap-1">
                <Button size="icon" variant="outline" className="h-7 w-7" disabled={detailPage === 0} onClick={() => setDetailPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" className="h-7 w-7" disabled={detailPage >= totalPages - 1} onClick={() => setDetailPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

