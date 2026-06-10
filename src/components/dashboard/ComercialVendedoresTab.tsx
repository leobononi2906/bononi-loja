import { useMemo, useState } from "react";
import { subMonths, getDaysInMonth, isSameMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { DollarSign, FileText, Package, Users, Wrench, TrendingUp, TrendingDown } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { ErrorAlert } from "./ErrorAlert";
import { KPISkeleton, TableSkeleton, ChartSkeleton } from "./LoadingSkeleton";
import { useViewData } from "@/hooks/useComercialData";
import { formatCurrency, formatCurrencyInt, formatPercent, type DashboardFilters } from "@/data/mockData";
import { buildVendedorInfo, resolveVendedorNome } from "@/lib/dim-vendedor";
import { buildClienteNameMap, resolveClienteNome } from "@/lib/dim-cliente";

interface Props {
  filters: DashboardFilters;
}



const INTERNAL_CLIENTS = new Set([
  8340, 28540, 32535, 69939, 48622, 69873, 33131, 36396,
  14185, 55329, 69655, 860, 11000, 6551, 5640, 1964,
  6288, 6068, 6073, 2208, 6036, 79832, 79830, 79831,
  367, 6745, 48750, 42350,
]);

type Row = Record<string, unknown>;

type SellerAgg = {
  id: string;
  nome: string;
  faturamento: number;
  pecas: number;
  servicos: number;
  docs: Set<string>;
  clientes: Set<string>;
  osAbertas: number;
};

function cleanName(value: unknown, fallback = "-") {
  const name = String(value || "").trim();
  return name && name !== "null" && name !== "0" ? name : fallback;
}

function toMoney(value: unknown) {
  return Number(value) || 0;
}

function sellerId(row: Row) {
  return String(row.id_vendedor || "");
}

function sellerName(row: Row, map: Map<string, string>) {
  const id = sellerId(row);
  return map.get(id) || cleanName(row.nome_vendedor, id ? `Vend. #${id}` : "-");
}

function clientId(row: Row) {
  return String(row.id_cliente || row.id_contato || "");
}

function topName(name: string, size = 18) {
  return name.length > size ? `${name.slice(0, size)}…` : name;
}

export function ComercialVendedoresTab({ filters }: Props) {
  const [selectedSeller, setSelectedSeller] = useState("TODOS");

  const docsFat = useViewData("vw_comercial_docs_faturados", filters, 15000);
  const osBase = useViewData("vw_os_base_fat_corrigido", filters, 15000, { dateCol: "data_faturamento_corrigida" });
  const osEntrada = useViewData("vw_os_base", filters, 8000, { dateCol: "data_entrada" });
  const dimVendedor = useViewData("vw_loja_vendedores", filters, 50000, { skipDate: true, skipTipoSaida: true });
  const dimCliente = useViewData("vw_dim_cliente", filters, 80000, {
    skipDate: true,
    skipTipoSaida: true,
    columns: "id_cliente,nome_cliente",
  });

  const itens = useViewData("vw_comercial_itens_faturados", filters, 20000);
  const osPecas = useViewData("vw_os_pecas_faturadas", filters, 20000);
  const osServicos = useViewData("vw_os_servicos_faturados", filters, 20000);

  // Comparativo mês anterior: clampar ao mesmo dia carregado do mês atual.
  const today = new Date();
  const refIsCurrentMonth = isSameMonth(filters.mesAno, today);
  const lastDay = getDaysInMonth(filters.mesAno);
  const clampDay = filters.diaFim ?? (refIsCurrentMonth ? today.getDate() : lastDay);
  const prevFilters = {
    ...filters,
    mesAno: subMonths(filters.mesAno, 1),
    diaInicio: 1,
    diaFim: clampDay,
  };
  const prevDocsFat = useViewData("vw_comercial_docs_faturados", prevFilters, 15000);
  const prevOsBase = useViewData("vw_os_base_fat_corrigido", prevFilters, 15000, { dateCol: "data_faturamento_corrigida" });
  const prevItens = useViewData("vw_comercial_itens_faturados", prevFilters, 20000);
  const prevOsPecas = useViewData("vw_os_pecas_faturadas", prevFilters, 20000);

  const vendedorInfo = useMemo(() => buildVendedorInfo(dimVendedor.data), [dimVendedor.data]);
  const clienteNameMap = useMemo(
    () => buildClienteNameMap(docsFat.data, osBase.data, prevDocsFat.data, prevOsBase.data, dimCliente.data),
    [dimCliente.data, docsFat.data, osBase.data, prevDocsFat.data, prevOsBase.data],
  );

  function aggregateSellers(docsRows: Row[], osRows: Row[], osEntradaRows: Row[]) {
    const map = new Map<string, SellerAgg>();

    function ensure(id: string, nome: string) {
      if (!map.has(id)) {
        map.set(id, { id, nome, faturamento: 0, pecas: 0, servicos: 0, docs: new Set(), clientes: new Set(), osAbertas: 0 });
      }
      const entry = map.get(id)!;
      if ((entry.nome === id || entry.nome === "-") && nome !== id && nome !== "-") entry.nome = nome;
      return entry;
    }

    docsRows.forEach((row) => {
      if (String(row.tipo_saida || "").trim().toUpperCase() !== "LOJA") return;
      if (INTERNAL_CLIENTS.has(Number(row.id_cliente || 0))) return;
      const id = sellerId(row);
      if (!id || id === "0" || id === "null") return;
      if (vendedorInfo.ids.size && !vendedorInfo.ids.has(id)) return;
      const entry = ensure(id, sellerName(row, vendedorInfo.names));
      const value = toMoney(row.faturamento_doc);
      entry.faturamento += value;
      entry.pecas += value;
      entry.docs.add(`L-${row.id_doc}`);
      const cid = clientId(row);
      if (cid) entry.clientes.add(cid);
    });

    osRows.forEach((row) => {
      if (Number(row.fl_faturada) !== 1) return;
      if (Number(row.id_tipo_os) !== 1) return;
      const id = sellerId(row);
      if (!id || id === "0" || id === "null") return;
      if (vendedorInfo.ids.size && !vendedorInfo.ids.has(id)) return;
      const entry = ensure(id, sellerName(row, vendedorInfo.names));
      const value = toMoney(row.vl_total || row.faturamento_doc);
      entry.faturamento += value;
      entry.servicos += value;
      entry.docs.add(`O-${row.id_os || row.id_doc}`);
      const cid = clientId(row);
      if (cid) entry.clientes.add(cid);
    });

    osEntradaRows.forEach((row) => {
      if (String(row.tipo_os || "").toUpperCase() !== "NORMAL") return;
      const id = sellerId(row);
      if (!id || id === "0" || id === "null") return;
      if (vendedorInfo.ids.size && !vendedorInfo.ids.has(id)) return;
      const entry = ensure(id, sellerName(row, vendedorInfo.names));
      entry.osAbertas += 1;
    });

    return map;
  }

  const currentMap = useMemo(
    () => aggregateSellers(docsFat.data ?? [], osBase.data ?? [], osEntrada.data ?? []),
    [docsFat.data, osBase.data, osEntrada.data, vendedorInfo]
  );

  const prevMap = useMemo(
    () => aggregateSellers(prevDocsFat.data ?? [], prevOsBase.data ?? [], []),
    [prevDocsFat.data, prevOsBase.data, vendedorInfo]
  );

  const sellers = useMemo(() => {
    return Array.from(currentMap.values())
      .map((seller) => {
        const prev = prevMap.get(seller.id)?.faturamento || 0;
        const qtdDocs = seller.docs.size;
        return {
          ...seller,
          qtdDocs,
          ticket: qtdDocs > 0 ? seller.faturamento / qtdDocs : 0,
          clientesAtivos: seller.clientes.size,
          varValor: seller.faturamento - prev,
          varPct: prev > 0 ? ((seller.faturamento - prev) / prev) * 100 : seller.faturamento > 0 ? 100 : 0,
        };
      })
      .sort((a, b) => b.faturamento - a.faturamento);
  }, [currentMap, prevMap]);

  const visibleSellers = selectedSeller === "TODOS" ? sellers : sellers.filter((s) => s.id === selectedSeller);
  const selected = selectedSeller === "TODOS" ? null : sellers.find((s) => s.id === selectedSeller) || null;

  const totals = visibleSellers.reduce(
    (acc, seller) => {
      acc.faturamento += seller.faturamento;
      acc.pecas += seller.pecas;
      acc.servicos += seller.servicos;
      acc.docs += seller.qtdDocs;
      acc.osAbertas += seller.osAbertas;
      seller.clientes.forEach((id) => acc.clientes.add(id));
      return acc;
    },
    { faturamento: 0, pecas: 0, servicos: 0, docs: 0, osAbertas: 0, clientes: new Set<string>() }
  );

  const prevTotal = visibleSellers.reduce((sum, seller) => sum + (prevMap.get(seller.id)?.faturamento || 0), 0);
  const totalVarPct = prevTotal > 0 ? ((totals.faturamento - prevTotal) / prevTotal) * 100 : totals.faturamento > 0 ? 100 : 0;

  function aggregateBySellerClient(rows: Row[], osRows: Row[]) {
    const map = new Map<string, { id: string; nome: string; faturamento: number }>();
    const add = (row: Row, value: number) => {
      const idVend = sellerId(row);
      if (selectedSeller !== "TODOS" && idVend !== selectedSeller) return;
      if (selectedSeller === "TODOS" && vendedorInfo.ids.size && !vendedorInfo.ids.has(idVend)) return;
      const id = clientId(row);
      if (!id || INTERNAL_CLIENTS.has(Number(id))) return;
      const nome = resolveClienteNome(id, row.nome_cliente, clienteNameMap);
      const existing = map.get(id) || { id, nome, faturamento: 0 };
      existing.faturamento += value;
      if (existing.nome.startsWith("Cliente #") && !nome.startsWith("Cliente #")) existing.nome = nome;
      map.set(id, existing);
    };

    rows.forEach((row) => {
      if (String(row.tipo_saida || "").trim().toUpperCase() !== "LOJA") return;
      add(row, toMoney(row.faturamento_doc));
    });
    osRows.forEach((row) => add(row, toMoney(row.faturamento_doc || row.vl_total)));
    return map;
  }

  const clientLists = useMemo(() => {
    const cur = aggregateBySellerClient(docsFat.data ?? [], osBase.data ?? []);
    const prev = aggregateBySellerClient(prevDocsFat.data ?? [], prevOsBase.data ?? []);

    const maiores = Array.from(cur.values()).sort((a, b) => b.faturamento - a.faturamento).slice(0, 10);
    const crescimento = Array.from(cur.values())
      .map((c) => {
        const old = prev.get(c.id)?.faturamento || 0;
        return { ...c, anterior: old, varValor: c.faturamento - old, varPct: old > 0 ? ((c.faturamento - old) / old) * 100 : 100 };
      })
      .filter((c) => c.varValor > 0 && c.anterior > 0)
      .sort((a, b) => b.varValor - a.varValor)
      .slice(0, 10);

    const queda = Array.from(prev.values())
      .map((old) => {
        const curVal = cur.get(old.id)?.faturamento || 0;
        return { ...old, atual: curVal, varValor: curVal - old.faturamento, varPct: old.faturamento > 0 ? ((curVal - old.faturamento) / old.faturamento) * 100 : 0 };
      })
      .filter((c) => c.varValor < 0)
      .sort((a, b) => a.varValor - b.varValor)
      .slice(0, 10);

    return { maiores, crescimento, queda };
  }, [docsFat.data, osBase.data, prevDocsFat.data, prevOsBase.data, selectedSeller, vendedorInfo, clienteNameMap]);

  function aggregateProducts(rows: Row[], osRows: Row[]) {
    const map = new Map<string, { id: string; nome: string; grupo: string; qtd: number; faturamento: number }>();
    const add = (row: Row, value: number, qtd: number) => {
      const idVend = sellerId(row);
      if (selectedSeller !== "TODOS" && idVend !== selectedSeller) return;
      if (selectedSeller === "TODOS" && idVend && vendedorInfo.ids.size && !vendedorInfo.ids.has(idVend)) return;
      const id = String(row.id_produto || row.id_servico || row.id_servico_os || row.produto || row.servico || "");
      if (!id) return;
      const nome = cleanName(row.produto || row.descricao || row.servico || row.nome_servico, id);
      const grupo = cleanName(row.grupo || row.grupo_serv || row.grupo_servico, "-");
      const existing = map.get(id) || { id, nome, grupo, qtd: 0, faturamento: 0 };
      existing.qtd += qtd;
      existing.faturamento += value;
      map.set(id, existing);
    };

    rows.forEach((row) => add(row, toMoney(row.total_item), Number(row.qtd) || 0));
    osRows.forEach((row) => add(row, toMoney(row.total_item), Number(row.qtd) || 0));
    return map;
  }

  const productLists = useMemo(() => {
    const cur = aggregateProducts(itens.data ?? [], osPecas.data ?? []);
    const prev = aggregateProducts(prevItens.data ?? [], prevOsPecas.data ?? []);
    const servicos = (osServicos.data ?? [])
      .filter((row) => selectedSeller === "TODOS" || sellerId(row) === selectedSeller)
      .reduce((map, row) => {
        const id = String(row.id_servico || row.id_servico_os || row.servico || row.grupo_serv || "SERVICO");
        const nome = cleanName(row.servico || row.nome_servico || row.grupo_serv || row.grupo_servico, "Serviço");
        const existing = map.get(id) || { id, nome, grupo: "SERVIÇOS", qtd: 0, faturamento: 0 };
        existing.qtd += 1;
        existing.faturamento += toMoney(row.total_servico);
        map.set(id, existing);
        return map;
      }, new Map<string, { id: string; nome: string; grupo: string; qtd: number; faturamento: number }>());

    servicos.forEach((value, key) => {
      const existing = cur.get(key) || value;
      if (existing !== value) {
        existing.qtd += value.qtd;
        existing.faturamento += value.faturamento;
      }
      cur.set(key, existing);
    });

    const maisVendidos = Array.from(cur.values()).sort((a, b) => b.faturamento - a.faturamento).slice(0, 10);
    const crescimento = Array.from(cur.values())
      .map((p) => {
        const old = prev.get(p.id)?.faturamento || 0;
        return { ...p, anterior: old, varValor: p.faturamento - old, varPct: old > 0 ? ((p.faturamento - old) / old) * 100 : 100 };
      })
      .filter((p) => p.varValor > 0 && p.anterior > 0)
      .sort((a, b) => b.varValor - a.varValor)
      .slice(0, 10);

    const queda = Array.from(prev.values())
      .map((old) => {
        const curVal = cur.get(old.id)?.faturamento || 0;
        return { ...old, atual: curVal, varValor: curVal - old.faturamento, varPct: old.faturamento > 0 ? ((curVal - old.faturamento) / old.faturamento) * 100 : 0 };
      })
      .filter((p) => p.varValor < 0)
      .sort((a, b) => a.varValor - b.varValor)
      .slice(0, 10);

    return { maisVendidos, crescimento, queda };
  }, [itens.data, osPecas.data, osServicos.data, prevItens.data, prevOsPecas.data, selectedSeller, vendedorInfo]);

  const sellerChart = visibleSellers.slice(0, 12).map((seller) => ({
    nome: topName(seller.nome, 14),
    faturamento: seller.faturamento,
    pecas: seller.pecas,
    servicos: seller.servicos,
  }));

  const evolutionChart = sellers.slice(0, 8).map((seller) => ({
    nome: topName(seller.nome, 14),
    atual: seller.faturamento,
    anterior: prevMap.get(seller.id)?.faturamento || 0,
  }));

  const hasError = docsFat.error || osBase.error || dimVendedor.error || dimCliente.error;
  const isLoading = docsFat.isLoading || osBase.isLoading || dimVendedor.isLoading || dimCliente.isLoading;
  const allLoading = isLoading || prevDocsFat.isLoading || prevOsBase.isLoading || itens.isLoading || osPecas.isLoading;

  if (hasError) {
    return <div className="dashboard-section"><ErrorAlert message="Erro ao carregar vendedores" details={(docsFat.error as Error)?.message || (osBase.error as Error)?.message || (dimVendedor.error as Error)?.message || (dimCliente.error as Error)?.message || ""} /></div>;
  }

  return (
    <div className="dashboard-section space-y-6">
      <div className="chart-container">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold font-display text-foreground">Painel de Vendedores</h2>
            <p className="text-xs text-muted-foreground">Visão operacional de vendas, peças, serviços, clientes e produtos.</p>
          </div>
          <select
            value={selectedSeller}
            onChange={(event) => setSelectedSeller(event.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-xs font-medium text-foreground outline-none"
          >
            <option value="TODOS">Todos os vendedores</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>{seller.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? <KPISkeleton /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard label="Faturamento" value={formatCurrencyInt(totals.faturamento)} change={totalVarPct} changeLabel="vs mês ant." icon={<DollarSign className="h-5 w-5" />} />
          <MetricCard label="Peças" value={formatCurrencyInt(totals.pecas)} icon={<Package className="h-5 w-5" />} />
          <MetricCard label="Serviços" value={formatCurrencyInt(totals.servicos)} icon={<Wrench className="h-5 w-5" />} />
          <MetricCard label="Docs" value={String(totals.docs)} icon={<FileText className="h-5 w-5" />} />
          <MetricCard label="Clientes" value={String(totals.clientes.size)} icon={<Users className="h-5 w-5" />} />
          <MetricCard label="Ticket Médio" value={formatCurrencyInt(totals.docs > 0 ? totals.faturamento / totals.docs : 0)} icon={<TrendingUp className="h-5 w-5" />} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {allLoading ? <ChartSkeleton /> : (
          <div className="chart-container">
            <h3 className="text-sm font-semibold font-display mb-4 text-foreground">Mix por vendedor</h3>
            {sellerChart.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p> : (
              <ResponsiveContainer width="100%" height={330}>
                <BarChart data={sellerChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="nome" type="category" tick={{ fontSize: 10 }} width={125} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="pecas" stackId="a" fill="hsl(var(--primary))" name="Peças" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="servicos" stackId="a" fill="hsl(var(--accent))" name="Serviços" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {allLoading ? <ChartSkeleton /> : (
          <div className="chart-container">
            <h3 className="text-sm font-semibold font-display mb-4 text-foreground">Atual x mês anterior</h3>
            {evolutionChart.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p> : (
              <ResponsiveContainer width="100%" height={330}>
                <LineChart data={evolutionChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="nome" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" angle={-25} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="anterior" stroke="hsl(var(--muted-foreground))" strokeWidth={2} name="Mês anterior" />
                  <Line type="monotone" dataKey="atual" stroke="hsl(var(--primary))" strokeWidth={2} name="Atual" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>

      {allLoading ? <TableSkeleton /> : (
        <div className="chart-container">
          <h3 className="text-sm font-semibold font-display mb-4 text-foreground">Ranking operacional</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 text-xs font-medium text-muted-foreground">#</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground">Vendedor</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground text-right">Faturamento</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground text-right">Peças</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground text-right">Serviços</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground text-right">Docs</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground text-right">Ticket</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground text-right">Var.</th>
                </tr>
              </thead>
              <tbody>
                {visibleSellers.map((seller, index) => (
                  <tr key={seller.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-2 text-xs text-muted-foreground">{index + 1}</td>
                    <td className="py-2 text-xs font-medium whitespace-nowrap">{seller.nome}</td>
                    <td className="py-2 text-xs text-right font-display">{formatCurrency(seller.faturamento)}</td>
                    <td className="py-2 text-xs text-right font-display">{formatCurrency(seller.pecas)}</td>
                    <td className="py-2 text-xs text-right font-display">{formatCurrency(seller.servicos)}</td>
                    <td className="py-2 text-xs text-right">{seller.qtdDocs}</td>
                    <td className="py-2 text-xs text-right font-display">{formatCurrency(seller.ticket)}</td>
                    <td className={`py-2 text-xs text-right font-medium ${seller.varPct >= 0 ? "metric-change-up" : "metric-change-down"}`}>
                      {seller.varPct >= 0 ? "+" : ""}{formatPercent(seller.varPct)}
                    </td>
                  </tr>
                ))}
                {visibleSellers.length === 0 && <tr><td colSpan={8} className="py-4 text-center text-xs text-muted-foreground">Sem dados</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <SimpleTable title="Maiores clientes" rows={clientLists.maiores} valueLabel="Faturamento" />
        <SimpleTable title="Clientes crescendo" rows={clientLists.crescimento} valueLabel="Variação" mode="variation" positive />
        <SimpleTable title="Clientes caindo" rows={clientLists.queda} valueLabel="Queda" mode="variation" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <SimpleTable title="Produtos e serviços mais vendidos" rows={productLists.maisVendidos} valueLabel="Faturamento" showGroup />
        <SimpleTable title="Produtos crescendo" rows={productLists.crescimento} valueLabel="Variação" mode="variation" positive showGroup />
        <SimpleTable title="Produtos caindo" rows={productLists.queda} valueLabel="Queda" mode="variation" showGroup />
      </div>

      {selected && (
        <div className="chart-container border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <TrendingUp className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm font-semibold font-display text-foreground">Leitura rápida de {selected.nome}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Este vendedor faturou {formatCurrency(selected.faturamento)} no período, com {formatCurrency(selected.pecas)} em peças e {formatCurrency(selected.servicos)} em serviços. Use os blocos de clientes e produtos para puxar ações comerciais da semana.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type SimpleRow = {
  id: string;
  nome?: string;
  produto?: string;
  grupo?: string;
  faturamento?: number;
  varValor?: number;
  varPct?: number;
  qtd?: number;
};

function SimpleTable({
  title,
  rows,
  valueLabel,
  mode = "value",
  positive = false,
  showGroup = false,
}: {
  title: string;
  rows: SimpleRow[];
  valueLabel: string;
  mode?: "value" | "variation";
  positive?: boolean;
  showGroup?: boolean;
}) {
  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold font-display text-foreground">{title}</h3>
        {mode === "variation" && (positive ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />)}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 text-xs font-medium text-muted-foreground">Nome</th>
              {showGroup && <th className="pb-2 text-xs font-medium text-muted-foreground">Grupo</th>}
              <th className="pb-2 text-xs font-medium text-muted-foreground text-right">{valueLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const name = row.nome || row.produto || row.id;
              const value = mode === "variation" ? row.varValor || 0 : row.faturamento || 0;
              return (
                <tr key={`${title}-${row.id}`} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                  <td className="py-2 text-xs font-medium max-w-[210px] truncate" title={name}>{name}</td>
                  {showGroup && <td className="py-2 text-xs text-muted-foreground max-w-[110px] truncate">{row.grupo || "-"}</td>}
                  <td className={`py-2 text-xs text-right font-display ${mode === "variation" ? value >= 0 ? "metric-change-up" : "metric-change-down" : ""}`}>
                    {mode === "variation" ? `${value >= 0 ? "+" : ""}${formatCurrencyInt(value)}${row.varPct !== undefined ? ` (${value >= 0 ? "+" : ""}${formatPercent(row.varPct)})` : ""}` : formatCurrency(value)}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={showGroup ? 3 : 2} className="py-4 text-center text-xs text-muted-foreground">Sem dados</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
