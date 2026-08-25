import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { LayoutGrid, Info, PackageOpen, Clock } from "lucide-react";
import { TableSkeleton } from "./LoadingSkeleton";
import { ErrorAlert } from "./ErrorAlert";
import {
  db, deriveStatusEfetivo, STATUS_INFO,
  type DistArea, type DistServico, type DistServicoColaborador,
} from "@/lib/dist";

interface ColabConfig {
  id_colaborador: number;
  nome_colaborador: string;
  setor: "PATIO" | "TAPECARIA";
}

interface Apontamento {
  id: number;
  id_apontamento: number;
  id_colaborador: number;
  hora_inicio: string | null;
  hora_termino: string | null;
  horas_trabalhadas: number | null;
}

// Hoje as áreas nascem espelhando o setor já cadastrado em loja_config_colaborador.
// Não existe ainda vínculo colaborador↔área explícito (dist_colaborador_area está vazia,
// "uso futuro") — quando a operação criar áreas além de Pátio/Tapeçaria, esse mapeamento
// direto por nome deixa de bastar e o vínculo real vai ter que ser usado aqui.
const SETOR_AREA_NOME: Record<ColabConfig["setor"], string> = {
  PATIO: "Pátio",
  TAPECARIA: "Tapeçaria",
};

export function PainelGestorTab() {
  const hoje = format(new Date(), "yyyy-MM-dd");

  const { data: areas, isLoading: loadingAreas } = useQuery({
    queryKey: ["dist_areas"],
    queryFn: async () => {
      const { data, error } = await db.from("dist_areas").select("*").eq("ativo", true).order("ordem", { ascending: true }).range(0, 9999);
      if (error) throw error;
      return (data ?? []) as DistArea[];
    },
  });

  const { data: colaboradores, isLoading: loadingColabs } = useQuery({
    queryKey: ["loja_config_colaborador_ativos"],
    queryFn: async () => {
      const { data, error } = await db
        .from("loja_config_colaborador")
        .select("id_colaborador, nome_colaborador, setor")
        .eq("ativo", true)
        .order("nome_colaborador", { ascending: true })
        .range(0, 9999);
      if (error) throw error;
      return (data ?? []) as ColabConfig[];
    },
  });

  const { data: servicos, isLoading: loadingServicos, error: erroServicos } = useQuery({
    queryKey: ["dist_servico"],
    queryFn: async () => {
      const { data, error } = await db.from("dist_servico").select("*").range(0, 9999);
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

  const { data: apontamentos, isLoading: loadingApontamentos, error: erroApontamentos } = useQuery({
    queryKey: ["vw_serv_apontamentos_base_hoje", hoje],
    queryFn: async () => {
      const { data, error } = await db
        .from("vw_serv_apontamentos_base")
        .select("id, id_apontamento, id_colaborador, hora_inicio, hora_termino, horas_trabalhadas")
        .eq("data_apontamento", hoje)
        .range(0, 9999);
      if (error) throw error;
      return (data ?? []) as Apontamento[];
    },
  });

  const isLoading = loadingAreas || loadingColabs || loadingServicos || loadingServicoColabs || loadingApontamentos;

  const areasList = Array.isArray(areas) ? areas : [];
  const colabsList = Array.isArray(colaboradores) ? colaboradores : [];
  const servicosList = Array.isArray(servicos) ? servicos : [];
  const vinculos = Array.isArray(servicoColabs) ? servicoColabs : [];
  const apontamentosList = Array.isArray(apontamentos) ? apontamentos : [];

  const colabMap = useMemo(() => new Map(colabsList.map((c) => [c.id_colaborador, c.nome_colaborador])), [colabsList]);
  const areaMap = useMemo(() => new Map(areasList.map((a) => [a.id, a.nome])), [areasList]);

  const colabsPorServico = useMemo(() => {
    const map = new Map<number, number[]>();
    vinculos.forEach((v) => {
      const arr = map.get(v.id_dist_servico) ?? [];
      arr.push(v.id_colaborador);
      map.set(v.id_dist_servico, arr);
    });
    return map;
  }, [vinculos]);

  // ─── Fila por área (dist_servico — mesma base provisória da Lista de Distribuição) ─
  const filaPorArea = useMemo(() => {
    const grupos = new Map<string, { servico: DistServico; colabsNomes: string; status: ReturnType<typeof deriveStatusEfetivo> }[]>();
    servicosList.forEach((s) => {
      const colabsIds = colabsPorServico.get(s.id) ?? [];
      const status = deriveStatusEfetivo({ status_manual: s.status_manual, id_area: s.id_area, temColaborador: colabsIds.length > 0 });
      if (status === "finalizado") return; // não entra na fila
      const chave = s.id_area != null ? (areaMap.get(s.id_area) ?? `Área #${s.id_area}`) : "Sem área";
      const arr = grupos.get(chave) ?? [];
      arr.push({ servico: s, colabsNomes: colabsIds.map((id) => colabMap.get(id) ?? `#${id}`).join(", "), status });
      grupos.set(chave, arr);
    });
    return grupos;
  }, [servicosList, colabsPorServico, areaMap, colabMap]);

  // ─── Atividade de hoje por colaborador (dedup — a view duplica linha por apontamento) ─
  const horasHojePorColab = useMemo(() => {
    const dedupe = new Map<number, Apontamento>();
    apontamentosList.forEach((a) => {
      if (!dedupe.has(a.id_apontamento)) dedupe.set(a.id_apontamento, a);
    });
    const somaPorColab = new Map<number, number>();
    dedupe.forEach((a) => {
      const horas = Math.max(0, Number(a.horas_trabalhadas) || 0); // horas negativas = virada de dia mal calculada no legado
      somaPorColab.set(a.id_colaborador, (somaPorColab.get(a.id_colaborador) ?? 0) + horas);
    });
    return somaPorColab;
  }, [apontamentosList]);

  const gruposColabPorArea = useMemo(() => {
    const grupos = new Map<string, ColabConfig[]>();
    colabsList.forEach((c) => {
      const nomeArea = SETOR_AREA_NOME[c.setor];
      const existeArea = areasList.some((a) => a.nome === nomeArea);
      const chave = existeArea ? nomeArea : "Sem área mapeada";
      const arr = grupos.get(chave) ?? [];
      arr.push(c);
      grupos.set(chave, arr);
    });
    return grupos;
  }, [colabsList, areasList]);

  if (isLoading) return <TableSkeleton />;
  if (erroServicos) return <ErrorAlert message="Erro ao carregar a fila por área" details={(erroServicos as Error).message} />;
  if (erroApontamentos) return <ErrorAlert message="Erro ao carregar a atividade de hoje" details={(erroApontamentos as Error).message} />;

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-2">
        <LayoutGrid className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-base font-semibold font-display">Painel do Gestor</h2>
          <p className="text-xs text-muted-foreground">Fila de serviços por área e atividade dos colaboradores hoje</p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-900/40 rounded-lg p-3 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          A fila por área ainda usa a mesma base provisória da Lista de Distribuição (<span className="font-mono">dist_servico</span>) — só traz o que
          já foi lançado manualmente lá. A atividade de hoje mostra quem já registrou apontamento e quantas horas — o sistema não expõe apontamento
          "em aberto" (os registros chegam já fechados), então isso não é status de disponibilidade em tempo real.
        </p>
      </div>

      {/* Fila por área */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Fila por área</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...areasList.map((a) => a.nome), "Sem área"].map((nomeArea) => {
            const itens = filaPorArea.get(nomeArea) ?? [];
            return (
              <div key={nomeArea} className="chart-container">
                <h4 className="text-sm font-semibold font-display mb-2 flex items-center gap-2">
                  {nomeArea}
                  <span className="b-badge b-badge-info">{itens.length}</span>
                </h4>
                {itens.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center">Fila vazia.</p>
                ) : (
                  <div className="space-y-1">
                    {itens.map(({ servico, colabsNomes, status }) => (
                      <div key={servico.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/40 text-xs">
                        <div className="min-w-0">
                          <span className="font-mono">#{servico.id_servico_legado}</span>
                          {colabsNomes && <span className="text-muted-foreground ml-2 truncate">{colabsNomes}</span>}
                        </div>
                        <span className={`b-badge ${STATUS_INFO[status].badgeClass} shrink-0 ml-2`}>{STATUS_INFO[status].label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Atividade de hoje */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Atividade de hoje ({format(new Date(), "dd/MM")})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from(gruposColabPorArea.entries()).map(([nomeArea, colabs]) => {
            const comApontamento = colabs.filter((c) => horasHojePorColab.has(c.id_colaborador)).sort((a, b) => (horasHojePorColab.get(b.id_colaborador) ?? 0) - (horasHojePorColab.get(a.id_colaborador) ?? 0));
            const semApontamento = colabs.filter((c) => !horasHojePorColab.has(c.id_colaborador));
            return (
              <div key={nomeArea} className="chart-container">
                <h4 className="text-sm font-semibold font-display mb-2">{nomeArea}</h4>
                {colabs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center">Nenhum colaborador neste setor.</p>
                ) : (
                  <div className="space-y-2">
                    {comApontamento.length > 0 && (
                      <div className="space-y-0.5">
                        {comApontamento.map((c) => (
                          <div key={c.id_colaborador} className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-muted/40">
                            <span className="text-xs font-medium">{c.nome_colaborador}</span>
                            <span className="text-[11px] font-mono text-muted-foreground">{(horasHojePorColab.get(c.id_colaborador) ?? 0).toFixed(1)}h</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {semApontamento.length > 0 && (
                      <div className="pt-1 border-t">
                        <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/70 px-2 pt-1">Sem apontamento hoje</p>
                        {semApontamento.map((c) => (
                          <div key={c.id_colaborador} className="py-1 px-2 text-xs text-muted-foreground/70">{c.nome_colaborador}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {gruposColabPorArea.size === 0 && (
            <div className="chart-container py-10 text-center col-span-full">
              <PackageOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Nenhum colaborador ativo cadastrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
