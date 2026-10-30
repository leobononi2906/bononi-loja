import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  buscarPainel, buscarHorasDia, lotacaoArea, fmtHoras, minutosDesde, primeiroNome,
  limparObservacao, type PainelArea, type PainelFilaItem, type Lotacao,
} from "@/lib/dist";

// TV da oficina (/tv) — pedido do Leo 30/10/2026. Tela cheia, sem clique, sem menu.
// Mostra por área: os PRÓXIMOS serviços (ordem de chegada) e QUEM ESTÁ DISPONÍVEL.
// Não mostra quem está trabalhando (decisão do Leo). A faixa colorida de cada área é o
// recado para o vendedor: dá para vender serviço para hoje? Regras em lotacaoArea().
const PROXIMOS_NA_TV = 3;
const ATRASO_ALERTA_MIN = 15; // dado mais velho que isso = cópia do ERP parada

const COR_FAIXA: Record<Lotacao, string> = {
  verde: "bg-emerald-600 text-white",
  amarelo: "bg-amber-400 text-amber-950",
  vermelho: "bg-red-600 text-white",
  sem_equipe: "bg-slate-600 text-slate-100",
};

function useRelogio() {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return agora;
}

// Uma linha por VEÍCULO (O.S.) na TV: frota chega com 5–10 linhas de serviço na mesma O.S.
// (ex.: Gazin) e, uma por linha, o mesmo prisma enchia o cartão. A fila já vem em ordem de
// chegada, então as linhas da mesma O.S. são vizinhas.
interface VeiculoNaFila { id_os: number; prisma: string | null; veiculo: string; itens: string[]; horas: number; com: string | null }

function agruparPorOs(fila: PainelFilaItem[]): VeiculoNaFila[] {
  const out: (VeiculoNaFila & { _com: Set<string> })[] = [];
  const porOs = new Map<number, VeiculoNaFila & { _com: Set<string> }>();
  for (const f of fila) {
    let v = porOs.get(f.id_os);
    if (!v) {
      v = { id_os: f.id_os, prisma: f.prisma, veiculo: f.modelo ?? f.placa ?? "", itens: [], horas: 0, com: null, _com: new Set() };
      porOs.set(f.id_os, v);
      out.push(v);
    }
    v.itens.push(limparObservacao(f.obs) || f.servico || "Serviço");
    v.horas += f.horas;
    (f.marcado_para ?? "").split(",").map((s) => s.trim()).filter(Boolean).forEach((n) => v!._com.add(primeiroNome(n)));
  }
  return out.map(({ _com, ...v }) => ({ ...v, com: _com.size ? [..._com].join(", ") : null }));
}

function CartaoArea({ area, horasDia, agora }: { area: PainelArea; horasDia: number; agora: Date }) {
  const lot = lotacaoArea(area, horasDia);
  const veiculos = agruparPorOs(area.fila);
  const proximos = veiculos.slice(0, PROXIMOS_NA_TV);
  const resto = veiculos.length - proximos.length;

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-slate-700">
      <header className="flex items-center justify-between gap-3 px-5 pt-4">
        <h2 className="truncate text-3xl font-semibold text-white">{area.nome}</h2>
        <span className="shrink-0 text-lg text-slate-400">{area.fila_qtd} na fila</span>
      </header>
      <div className={`mx-5 mt-3 rounded-xl px-4 py-2 text-2xl font-semibold ${COR_FAIXA[lot.cor]}`}>{lot.texto}</div>

      <div className="px-5 pt-4">
        <p className="text-base uppercase tracking-wide text-slate-400">Disponíveis</p>
        {area.disponiveis.length === 0 ? (
          <p className="mt-1 text-xl text-slate-500">Todos ocupados</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {area.disponiveis.map((d) => (
              <span key={d.id} className="rounded-lg bg-emerald-950 px-3 py-1 text-xl text-emerald-200 ring-1 ring-emerald-700">
                {primeiroNome(d.nome)} <span className="text-emerald-400">· {fmtHoras(minutosDesde(d.livre_desde, agora) / 60)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 px-5 pb-4 pt-4">
        <p className="text-base uppercase tracking-wide text-slate-400">Próximos</p>
        {proximos.length === 0 ? (
          <p className="mt-1 text-xl text-slate-500">Nada na fila</p>
        ) : (
          <ol className="mt-1 divide-y divide-slate-800">
            {proximos.map((v) => (
              <li key={v.id_os} className="flex items-baseline gap-3 py-1.5">
                <span className="w-16 shrink-0 text-2xl font-semibold text-sky-300">{v.prisma ?? "—"}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xl text-white">
                    {v.itens.length > 1 && <span className="text-sky-300">{v.itens.length}× </span>}
                    {v.itens.join(" · ")}
                  </span>
                  <span className="block truncate text-base text-slate-400">
                    {v.veiculo}{v.com ? ` · com ${v.com}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-lg text-slate-300">~{fmtHoras(v.horas)}</span>
              </li>
            ))}
          </ol>
        )}
        {resto > 0 && <p className="pt-1 text-lg text-slate-400">+ {resto} {resto === 1 ? "veículo" : "veículos"} depois destes</p>}
      </div>
    </section>
  );
}

// A TV pode ser 1080p ou 720p/768p: o tamanho de letra do documento acompanha a altura da tela
// (16px em 1080) e todos os tamanhos do Tailwind (rem) escalam junto. Volta ao sair da página.
function useEscalaPelaAltura() {
  useEffect(() => {
    const html = document.documentElement;
    const anterior = html.style.fontSize;
    const ajustar = () => { html.style.fontSize = `${Math.max(9, window.innerHeight / 67.5)}px`; };
    ajustar();
    window.addEventListener("resize", ajustar);
    return () => { window.removeEventListener("resize", ajustar); html.style.fontSize = anterior; };
  }, []);
}

export default function TvServicos() {
  useEscalaPelaAltura();
  const agora = useRelogio();
  const { data: painel, error, isLoading } = useQuery({
    queryKey: ["dist-painel"],
    queryFn: buscarPainel,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    retry: true,
  });
  const { data: horasDia = 8.8 } = useQuery({ queryKey: ["dist-horas-dia"], queryFn: buscarHorasDia, staleTime: 60 * 60_000 });

  const atrasoMin = painel?.atualizado_em ? Math.round((agora.getTime() - new Date(painel.atualizado_em).getTime()) / 60_000) : null;
  const atrasado = atrasoMin != null && atrasoMin > ATRASO_ALERTA_MIN;
  const areas = (painel?.areas ?? []).filter((a) => a.colaboradores > 0 || a.fila_qtd > 0);

  return (
    <div className="flex h-screen flex-col gap-4 overflow-hidden bg-slate-950 p-5 text-white">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Serviços da oficina</h1>
        <div className="flex items-center gap-6 text-2xl text-slate-300">
          {atrasado && (
            <span className="rounded-lg bg-red-600 px-3 py-1 text-xl text-white">Sem atualização há {fmtHoras(atrasoMin! / 60)}</span>
          )}
          <span>{agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-slate-500" /></div>
      ) : error && !painel ? (
        <div className="flex flex-1 items-center justify-center text-2xl text-red-300">Não consegui carregar. Tentando de novo…</div>
      ) : (
        <main className="grid min-h-0 flex-1 auto-rows-fr grid-cols-3 gap-4">
          {areas.map((a) => <CartaoArea key={a.id} area={a} horasDia={horasDia} agora={agora} />)}
        </main>
      )}
    </div>
  );
}
