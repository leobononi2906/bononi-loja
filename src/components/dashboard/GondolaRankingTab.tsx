import { Fragment, useMemo, useState } from "react";
import { Search, Plus, CheckCircle2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSortable } from "@/hooks/useSortable";
import { SortableHeader } from "./SortableHeader";

// Ranking da gôndola — quanto cada produto vende (pedido do Leo 30/10).
// Fonte: RPC loja_gondola_ranking (migration 20261030120000_gondola_ranking.sql) — venda tipo LOJA
// de qualquer empresa + peças de revenda em O.S. dos vendedores de balcão (desde 07/09 a loja
// vende por O.S.). Tipos do Supabase não conhecem a RPC nem loja_gondola.local → db as any.
const db = supabase as any;

type Situacao = "bem" | "pouco" | "parado";

interface LinhaRanking {
  referencia: string;
  produto: string;
  grupo: string | null;
  na_gondola: boolean;
  id_gondola: number | null;
  local: string | null;
  vendas: number;
  qtd: number;
  fat: number;
  ultima_venda: string | null;
  estoque: number | null;
  localizacao_erp: string | null;
}

type Linha = LinhaRanking & {
  pos: number;
  dias_sem_venda: number;
  situacao: Situacao;
  situacao_ord: number;
  local_ord: string;
};

const PERIODOS = [30, 90, 180] as const;
const GONDOLAS = [1, 2, 3, 4, 5, 6].map(n => `Gôndola ${n}`);
const NOVO_EXPOSITOR = "__novo_expositor__";
// Parado = sem venda há mais de 90 dias, qualquer que seja o período escolhido.
const DIAS_PARADO = 90;

const SITUACAO: Record<Situacao, { label: string; cls: string }> = {
  bem: { label: "Vende bem", cls: "text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/30" },
  pouco: { label: "Vende pouco", cls: "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/30" },
  parado: { label: "Parado", cls: "text-destructive bg-red-100 dark:bg-red-950/30" },
};

function fmtReais(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function diasDesde(data: string | null) {
  if (!data) return 99999;
  const d = new Date(data + "T00:00:00");
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
}

function fmtUltima(dias: number) {
  if (dias >= 99999) return "nunca";
  if (dias === 0) return "hoje";
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}

// "Vende bem" = produtos da gôndola que, somados do que mais vende para o que menos vende,
// fazem 80% das vendas (curva A por nº de vendas, não por R$ — senão geladeira cara ocupa o topo).
function classificar(rows: LinhaRanking[]): Linha[] {
  const totalVendas = rows.reduce((s, r) => s + r.vendas, 0);
  const ordem = [...rows].sort((a, b) => b.vendas - a.vendas || b.fat - a.fat);
  const bem = new Set<string>();
  let acum = 0;
  for (const r of ordem) {
    if (r.vendas <= 0 || acum >= totalVendas * 0.8) break;
    bem.add(r.referencia);
    acum += r.vendas;
  }
  return ordem.map((r, i) => {
    const dias = diasDesde(r.ultima_venda);
    const situacao: Situacao = dias > DIAS_PARADO ? "parado" : bem.has(r.referencia) ? "bem" : "pouco";
    return {
      ...r,
      pos: i + 1,
      dias_sem_venda: dias,
      situacao,
      situacao_ord: situacao === "bem" ? 3 : situacao === "pouco" ? 2 : 1,
      local_ord: r.local ?? "",
    };
  });
}

function SeloSituacao({ s }: { s: Situacao }) {
  const c = SITUACAO[s];
  return <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${c.cls}`}>{c.label}</span>;
}

function SeletorLocal({ linha, expositores, onSalvo }: { linha: Linha; expositores: string[]; onSalvo: () => void }) {
  const [salvando, setSalvando] = useState(false);
  const opcoes = Array.from(new Set([...GONDOLAS, ...expositores, ...(linha.local ? [linha.local] : [])]));

  async function trocar(valor: string) {
    let local: string | null = valor || null;
    if (valor === NOVO_EXPOSITOR) {
      const nome = window.prompt("Nome do expositor (ex.: caixa, entrada):")?.trim();
      if (!nome) return;
      local = `Expositor - ${nome}`;
    }
    setSalvando(true);
    const { error } = await db.from("loja_gondola").update({ local }).eq("id", linha.id_gondola);
    setSalvando(false);
    if (error) { window.alert("Não foi possível salvar o local: " + error.message); return; }
    onSalvo();
  }

  return (
    <select
      value={linha.local ?? ""}
      disabled={salvando}
      onClick={e => e.stopPropagation()}
      onChange={e => trocar(e.target.value)}
      className="h-11 w-full min-w-[130px] px-2 text-xs border rounded-lg bg-background"
    >
      <option value="">—</option>
      {opcoes.map(o => <option key={o} value={o}>{o}</option>)}
      <option value={NOVO_EXPOSITOR}>+ Novo expositor…</option>
    </select>
  );
}

export default function GondolaRankingTab() {
  const qc = useQueryClient();
  const [dias, setDias] = useState<number>(90);
  const [busca, setBusca] = useState("");
  const [filtroLocal, setFiltroLocal] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState<Situacao | "">("");
  const [aberto, setAberto] = useState<string | null>(null);
  const [verFora, setVerFora] = useState(false);
  const [adicionados, setAdicionados] = useState<Set<string>>(new Set());

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["gondola-ranking", dias],
    queryFn: async () => {
      const { data, error } = await db.rpc("loja_gondola_ranking", { p_dias: dias });
      if (error) throw error;
      return (data ?? []).map((r: LinhaRanking) => ({
        ...r,
        vendas: Number(r.vendas) || 0,
        qtd: Number(r.qtd) || 0,
        fat: Number(r.fat) || 0,
        estoque: r.estoque == null ? null : Number(r.estoque),
      })) as LinhaRanking[];
    },
    staleTime: 5 * 60_000,
  });

  const recarregar = () => {
    qc.invalidateQueries({ queryKey: ["gondola-ranking"] });
    qc.invalidateQueries({ queryKey: ["gondola"] });
  };

  const gondola = useMemo(() => classificar(data.filter(r => r.na_gondola)), [data]);
  const fora = useMemo(
    () => data.filter(r => !r.na_gondola && !adicionados.has(r.referencia))
      .sort((a, b) => b.vendas - a.vendas || b.fat - a.fat)
      .map((r, i) => ({ ...r, pos: i + 1, dias_sem_venda: diasDesde(r.ultima_venda) })),
    [data, adicionados],
  );

  const expositores = useMemo(
    () => Array.from(new Set(gondola.map(r => r.local).filter((l): l is string => !!l && !GONDOLAS.includes(l)))).sort(),
    [gondola],
  );

  const filtrada = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return gondola.filter(r =>
      (!t || r.referencia.toLowerCase().includes(t) || r.produto.toLowerCase().includes(t)) &&
      (!filtroLocal || (filtroLocal === "__sem__" ? !r.local : r.local === filtroLocal)) &&
      (!filtroSituacao || r.situacao === filtroSituacao),
    );
  }, [gondola, busca, filtroLocal, filtroSituacao]);

  const { sorted, sort, toggle } = useSortable(filtrada as unknown as Record<string, unknown>[], "vendas", "desc");
  const linhas = sorted as unknown as Linha[];
  const foraSort = useSortable(fora as unknown as Record<string, unknown>[], "vendas", "desc");
  const foraLinhas = foraSort.sorted as unknown as (LinhaRanking & { pos: number; dias_sem_venda: number })[];

  const cont = {
    bem: gondola.filter(r => r.situacao === "bem").length,
    pouco: gondola.filter(r => r.situacao === "pouco").length,
    parado: gondola.filter(r => r.situacao === "parado").length,
  };

  async function adicionarNaGondola(r: LinhaRanking) {
    const { error } = await db.from("loja_gondola").upsert(
      { referencia: r.referencia, nome: r.produto },
      { onConflict: "referencia" },
    );
    if (error) { window.alert("Não foi possível adicionar: " + error.message); return; }
    setAdicionados(prev => new Set(prev).add(r.referencia));
    recarregar();
  }

  const th = "py-2.5 px-3";

  return (
    <div className="space-y-4">
      {/* Resumo — cada cartão também filtra a lista */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          ["", "Na gôndola", gondola.length, "hsl(var(--primary))", ""],
          ["bem", "Vende bem", cont.bem, "hsl(var(--success))", "text-green-600 dark:text-green-400"],
          ["pouco", "Vende pouco", cont.pouco, "hsl(var(--warning, 38 92% 50%))", "text-amber-600 dark:text-amber-400"],
          ["parado", "Parado (90+ dias)", cont.parado, "hsl(var(--destructive))", "text-destructive"],
        ] as const).map(([key, label, n, cor, txt]) => (
          <button
            key={label}
            onClick={() => setFiltroSituacao(key as Situacao | "")}
            className={`metric-card border-l-4 text-left transition-shadow ${filtroSituacao === key ? "ring-2 ring-primary/40" : ""}`}
            style={{ borderLeftColor: cor }}
          >
            <div className="metric-label">{label}</div>
            <div className={`metric-value text-[22px] ${txt}`}>{n}</div>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Referência ou nome do produto..."
            className="h-11 w-full pl-9 pr-3 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select value={filtroLocal} onChange={e => setFiltroLocal(e.target.value)}
          className="h-11 px-3 text-sm border rounded-lg bg-background">
          <option value="">Todas as gôndolas</option>
          {GONDOLAS.map(g => <option key={g} value={g}>{g}</option>)}
          {expositores.map(g => <option key={g} value={g}>{g}</option>)}
          <option value="__sem__">Sem local</option>
        </select>
        <select value={filtroSituacao} onChange={e => setFiltroSituacao(e.target.value as Situacao | "")}
          className="h-11 px-3 text-sm border rounded-lg bg-background">
          <option value="">Todas as situações</option>
          <option value="bem">Vende bem</option>
          <option value="pouco">Vende pouco</option>
          <option value="parado">Parado</option>
        </select>
        <div className="inline-flex rounded-lg border overflow-hidden" role="group" aria-label="Período">
          {PERIODOS.map(p => (
            <button key={p} onClick={() => setDias(p)}
              className={`h-11 px-4 text-sm font-medium ${dias === p ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>
              {p} dias
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground px-1">
        Vendas = em quantas vendas o produto saiu (balcão e O.S. dos vendedores da loja) nos últimos {dias} dias.
        Clique no título da coluna para ordenar e na linha para ver detalhes.
      </p>

      {error ? (
        <div className="chart-container text-center py-10 text-sm text-destructive">Erro ao carregar o ranking: {(error as Error).message}</div>
      ) : isLoading ? (
        <div className="chart-container text-center py-10 text-sm text-muted-foreground">Carregando...</div>
      ) : (
        <div className="chart-container p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  <SortableHeader label="#" field="pos" sort={sort} onToggle={toggle} className={`${th} w-12`} />
                  <SortableHeader label="Referência" field="referencia" sort={sort} onToggle={toggle} className={th} />
                  <SortableHeader label="Produto" field="produto" sort={sort} onToggle={toggle} className={th} />
                  <SortableHeader label="Local" field="local_ord" sort={sort} onToggle={toggle} className={th} />
                  <SortableHeader label="Vendas" field="vendas" sort={sort} onToggle={toggle} className={`${th} text-right`} />
                  <SortableHeader label="R$" field="fat" sort={sort} onToggle={toggle} className={`${th} text-right`} />
                  <SortableHeader label="Última venda" field="dias_sem_venda" sort={sort} onToggle={toggle} className={th} />
                  <SortableHeader label="Situação" field="situacao_ord" sort={sort} onToggle={toggle} className={th} />
                </tr>
              </thead>
              <tbody>
                {linhas.length === 0 && (
                  <tr><td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">Nenhum produto com esse filtro.</td></tr>
                )}
                {linhas.map(r => (
                  <Fragment key={r.referencia}>
                    <tr className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                      onClick={() => setAberto(a => (a === r.referencia ? null : r.referencia))}>
                      <td className="py-1.5 px-3 text-xs text-muted-foreground font-mono">{r.pos}</td>
                      <td className="py-1.5 px-3 text-xs font-mono text-muted-foreground">{r.referencia}</td>
                      <td className="py-1.5 px-3 text-xs font-medium max-w-[260px]"><span className="line-clamp-2">{r.produto}</span></td>
                      <td className="py-1.5 px-3"><SeletorLocal linha={r} expositores={expositores} onSalvo={recarregar} /></td>
                      <td className="py-1.5 px-3 text-xs text-right font-mono font-semibold">{r.vendas}</td>
                      <td className="py-1.5 px-3 text-xs text-right font-mono">{fmtReais(r.fat)}</td>
                      <td className="py-1.5 px-3 text-xs whitespace-nowrap">{fmtUltima(r.dias_sem_venda)}</td>
                      <td className="py-1.5 px-3"><SeloSituacao s={r.situacao} /></td>
                    </tr>
                    {aberto === r.referencia && (
                      <tr className="border-b bg-muted/20">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="flex flex-wrap gap-x-8 gap-y-1 text-xs">
                            <span><span className="text-muted-foreground">Grupo:</span> {r.grupo ?? "—"}</span>
                            <span><span className="text-muted-foreground">Unidades vendidas ({dias}d):</span> {r.qtd.toLocaleString("pt-BR")}</span>
                            <span><span className="text-muted-foreground">Estoque hoje:</span> {r.estoque == null ? "—" : r.estoque.toLocaleString("pt-BR")}</span>
                            <span><span className="text-muted-foreground">Última venda:</span> {r.ultima_venda ? new Date(r.ultima_venda + "T00:00:00").toLocaleDateString("pt-BR") : "nunca"}</span>
                            <span><span className="text-muted-foreground">Localização no ERP:</span> {r.localizacao_erp ?? "—"}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fora da gôndola que vendem — bloco à parte para não misturar */}
      {!isLoading && !error && (
        <div className="space-y-2">
          <button onClick={() => setVerFora(v => !v)}
            className="h-11 px-4 rounded-lg text-sm font-medium border bg-background hover:bg-muted transition-colors">
            {verFora ? "Esconder" : "Ver"} produtos fora da gôndola que vendem ({fora.length})
          </button>
          {verFora && (
            <div className="chart-container p-0 overflow-hidden">
              <p className="text-[11px] text-muted-foreground px-3 pt-3">
                Vendem pelo menos {Math.max(2, Math.floor(dias / 30))} vezes em {dias} dias e não estão na gôndola.
                Ao adicionar, o produto vai para Etiquetas como "Sem etiqueta" até imprimir.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-left">
                      <SortableHeader label="#" field="pos" sort={foraSort.sort} onToggle={foraSort.toggle} className={`${th} w-12`} />
                      <SortableHeader label="Referência" field="referencia" sort={foraSort.sort} onToggle={foraSort.toggle} className={th} />
                      <SortableHeader label="Produto" field="produto" sort={foraSort.sort} onToggle={foraSort.toggle} className={th} />
                      <SortableHeader label="Vendas" field="vendas" sort={foraSort.sort} onToggle={foraSort.toggle} className={`${th} text-right`} />
                      <SortableHeader label="R$" field="fat" sort={foraSort.sort} onToggle={foraSort.toggle} className={`${th} text-right`} />
                      <SortableHeader label="Última venda" field="dias_sem_venda" sort={foraSort.sort} onToggle={foraSort.toggle} className={th} />
                      <th className={th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {foraLinhas.map(r => (
                      <tr key={r.referencia} className="border-b border-border/50">
                        <td className="py-1.5 px-3 text-xs text-muted-foreground font-mono">{r.pos}</td>
                        <td className="py-1.5 px-3 text-xs font-mono text-muted-foreground">{r.referencia}</td>
                        <td className="py-1.5 px-3 text-xs font-medium max-w-[260px]"><span className="line-clamp-2">{r.produto}</span></td>
                        <td className="py-1.5 px-3 text-xs text-right font-mono font-semibold">{r.vendas}</td>
                        <td className="py-1.5 px-3 text-xs text-right font-mono">{fmtReais(r.fat)}</td>
                        <td className="py-1.5 px-3 text-xs whitespace-nowrap">{fmtUltima(r.dias_sem_venda)}</td>
                        <td className="py-1.5 px-3 text-right">
                          <button onClick={() => adicionarNaGondola(r)}
                            className="h-11 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                            <Plus className="h-3.5 w-3.5" /> Adicionar à gôndola
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {adicionados.size > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> {adicionados.size} produto(s) adicionado(s) — imprima a etiqueta na aba Etiquetas.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
