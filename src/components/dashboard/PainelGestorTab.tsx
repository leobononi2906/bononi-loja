import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, PackageOpen, Users } from "lucide-react";
import { TableSkeleton } from "./LoadingSkeleton";
import { ErrorAlert } from "./ErrorAlert";
import {
  db, STATUS_INFO, STATUS_ATIVOS, EMPRESA_MLB_PR, fmtDataAbrev, limparObservacao,
  type DistArea, type DistServicoRow, type DistColabAreaRow, type StatusDistServico,
} from "@/lib/dist";

// Ordem da fila: primeiro quem precisa de ação (aberto), depois quem já foi
// destinado, depois quem já está em serviço, parado por último.
const ORDEM_STATUS: Record<StatusDistServico, number> = {
  aberto: 0, distribuido: 1, em_servico: 2, parado: 3, cancelado: 4,
};

export function PainelGestorTab() {
  const { data: areas, isLoading: loadingAreas } = useQuery({
    queryKey: ["dist_areas"],
    queryFn: async () => {
      const { data, error } = await db.from("dist_areas").select("*").eq("ativo", true).order("ordem", { ascending: true }).range(0, 9999);
      if (error) throw error;
      return (data ?? []) as DistArea[];
    },
  });

  const { data: servicos, isLoading: loadingServicos, error: erroServicos } = useQuery({
    queryKey: ["vw_dist_servicos"],
    queryFn: async () => {
      const { data, error } = await db.from("vw_dist_servicos").select("*").eq("id_empresa", EMPRESA_MLB_PR).range(0, 9999);
      if (error) throw error;
      return (data ?? []) as DistServicoRow[];
    },
  });

  const { data: colabArea, isLoading: loadingColabArea, error: erroColabArea } = useQuery({
    queryKey: ["vw_dist_colab_area"],
    queryFn: async () => {
      const { data, error } = await db.from("vw_dist_colab_area").select("*").range(0, 9999);
      if (error) throw error;
      return (data ?? []) as DistColabAreaRow[];
    },
  });

  const servicosList = Array.isArray(servicos) ? servicos : [];

  // Serviço "em serviço" pode nunca ter sido destinado por aqui — busca o
  // colaborador do apontamento do legado como fallback (mesma lógica da Lista
  // de Distribuição), pra mostrar quem está mexendo em vez do status genérico.
  const idsSemColab = useMemo(
    () => servicosList.filter((s) => s.fl_apontado === 1 && !s.colaboradores).map((s) => s.id_servico),
    [servicosList]
  );

  const { data: apontamentosColab, isLoading: loadingApontColab } = useQuery({
    queryKey: ["vw_fb_os_apontamento_colabs", idsSemColab],
    queryFn: async () => {
      const { data, error } = await db.from("vw_fb_os_apontamento").select("id_servico, id_colaborador, colaborador").in("id_servico", idsSemColab);
      if (error) throw error;
      return (data ?? []) as { id_servico: number; id_colaborador: number; colaborador: string | null }[];
    },
    enabled: idsSemColab.length > 0,
  });

  const colabsApontamentoMap = useMemo(() => {
    const map = new Map<number, string>();
    (apontamentosColab ?? []).forEach((a) => {
      if (!a.colaborador) return;
      const nomes = new Set((map.get(a.id_servico) ?? "").split(", ").filter(Boolean));
      nomes.add(a.colaborador);
      map.set(a.id_servico, Array.from(nomes).sort().join(", "));
    });
    return map;
  }, [apontamentosColab]);

  // Ids de dist_servico "em serviço" já com distribuição manual — usados pra
  // achar o prisma do que cada colaborador tá trabalhando agora.
  const idsEmServicoComDist = useMemo(
    () => servicosList.filter((s) => s.status === "em_servico" && s.id_dist != null).map((s) => s.id_dist as number),
    [servicosList]
  );

  const { data: colabsEmServicoManual, isLoading: loadingColabsEmServico } = useQuery({
    queryKey: ["dist_servico_colaborador_em_servico", idsEmServicoComDist],
    queryFn: async () => {
      const { data, error } = await db.from("dist_servico_colaborador").select("id_colaborador, id_dist_servico").in("id_dist_servico", idsEmServicoComDist);
      if (error) throw error;
      return (data ?? []) as { id_colaborador: number; id_dist_servico: number }[];
    },
    enabled: idsEmServicoComDist.length > 0,
  });

  // id_colaborador -> prisma do serviço em serviço que ele tá fazendo agora
  // (manual, via dist_servico_colaborador, ou via apontamento quando nunca
  // foi destinado por aqui) — mesma lógica de "ocupado" do popup da Lista.
  const colabIdParaPrisma = useMemo(() => {
    const prismaPorIdDist = new Map<number, string>();
    const prismaPorIdServico = new Map<number, string>();
    servicosList.forEach((s) => {
      if (s.status !== "em_servico" || !s.prisma) return;
      if (s.id_dist != null) prismaPorIdDist.set(s.id_dist, s.prisma);
      prismaPorIdServico.set(s.id_servico, s.prisma);
    });
    const map = new Map<number, string>();
    (colabsEmServicoManual ?? []).forEach((c) => {
      const prisma = prismaPorIdDist.get(c.id_dist_servico);
      if (prisma) map.set(c.id_colaborador, prisma);
    });
    (apontamentosColab ?? []).forEach((a) => {
      const prisma = prismaPorIdServico.get(a.id_servico);
      if (prisma) map.set(a.id_colaborador, prisma);
    });
    return map;
  }, [servicosList, colabsEmServicoManual, apontamentosColab]);

  const isLoading =
    loadingAreas || loadingServicos || loadingColabArea ||
    (idsSemColab.length > 0 && loadingApontColab) ||
    (idsEmServicoComDist.length > 0 && loadingColabsEmServico);
  const areasList = Array.isArray(areas) ? areas : [];
  const colabAreaList = Array.isArray(colabArea) ? colabArea : [];

  const filaPorArea = useMemo(() => {
    const grupos = new Map<string, DistServicoRow[]>();
    servicosList.forEach((s) => {
      if (!STATUS_ATIVOS.includes(s.status)) return;
      const colaboradores = s.colaboradores || colabsApontamentoMap.get(s.id_servico) || null;
      const chave = s.area ?? "Sem área";
      const arr = grupos.get(chave) ?? [];
      arr.push({ ...s, colaboradores });
      grupos.set(chave, arr);
    });
    // Fila: primeiro por status (aberto > distribuído > em serviço > parado),
    // dentro do mesmo status, quem abriu primeiro (data/hora da OS) primeiro.
    grupos.forEach((arr) => {
      arr.sort((a, b) => {
        const porStatus = ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status];
        if (porStatus !== 0) return porStatus;
        const dataHoraA = `${a.data_os}T${a.hora_os ?? "00:00"}`;
        const dataHoraB = `${b.data_os}T${b.hora_os ?? "00:00"}`;
        return dataHoraA.localeCompare(dataHoraB);
      });
    });
    return grupos;
  }, [servicosList, colabsApontamentoMap]);

  const colabsPorArea = useMemo(() => {
    const grupos = new Map<string, DistColabAreaRow[]>();
    colabAreaList.forEach((c) => {
      const arr = grupos.get(c.area) ?? [];
      arr.push(c);
      grupos.set(c.area, arr);
    });
    return grupos;
  }, [colabAreaList]);

  if (isLoading) return <TableSkeleton />;
  if (erroServicos) return <ErrorAlert message="Erro ao carregar a fila por área" details={(erroServicos as Error).message} />;
  if (erroColabArea) return <ErrorAlert message="Erro ao carregar colaboradores por área" details={(erroColabArea as Error).message} />;

  const nomesArea = [...areasList.map((a) => a.nome), "Sem área"];

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-2">
        <LayoutGrid className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-base font-semibold font-display">Painel do Gestor</h2>
          <p className="text-xs text-muted-foreground">Fila de serviços e colaboradores por área</p>
        </div>
      </div>

      {/* Fila por área */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Fila por área</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {nomesArea.map((nomeArea) => {
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
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {itens.map((s) => {
                      const info = STATUS_INFO[s.status];
                      const obs = limparObservacao(s.observacao);
                      return (
                        <div key={s.id_dist ?? -s.id_servico} className="py-1.5 px-2 rounded-md hover:bg-muted/40 text-xs border-b last:border-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-muted-foreground">
                              {s.prisma ? `Prisma ${s.prisma}` : `OS ${s.id_os}`} · {fmtDataAbrev(s.data_os)} {s.hora_os ?? ""}
                            </span>
                            {s.colaboradores ? (
                              <span className="font-medium shrink-0 truncate max-w-[45%]" title={s.colaboradores}>{s.colaboradores}</span>
                            ) : (
                              <span className={`b-badge ${info.badgeClass} shrink-0`}>{info.label}</span>
                            )}
                          </div>
                          <div className="font-medium truncate" title={s.servico}>{s.servico}</div>
                          {obs && <div className="text-muted-foreground line-clamp-2 mt-0.5">{obs}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Colaboradores por área */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> Colaboradores por área
        </h3>
        {colabAreaList.length === 0 ? (
          <div className="chart-container py-10 text-center">
            <PackageOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Nenhum colaborador vinculado a área ainda — configure em Config. Áreas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...colabsPorArea.entries()].map(([nomeArea, colabs]) => (
              <div key={nomeArea} className="chart-container">
                <h4 className="text-sm font-semibold font-display mb-2 flex items-center gap-2">
                  {nomeArea}
                  <span className="b-badge b-badge-info">{colabs.length}</span>
                </h4>
                <div className="space-y-0.5">
                  {colabs.map((c) => {
                    const prisma = colabIdParaPrisma.get(c.id_colaborador);
                    return (
                      <div key={c.id_colaborador} className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-muted/40">
                        <span className="text-xs font-medium">{c.colaborador}</span>
                        {prisma ? (
                          <span className="b-badge b-badge-critico" title="Em serviço agora">Prisma {prisma}</span>
                        ) : (
                          <span className={`b-badge ${c.situacao === "A" ? "b-badge-ok" : "b-badge-muted"}`}>{c.situacao === "A" ? "Ativo" : c.situacao}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
