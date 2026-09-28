/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Wrench, ParkingCircle, Scissors, Settings2, Tag, Gauge, AlertTriangle, X,
  ClipboardList, LayoutGrid, Calculator, MapPin, Bell, type LucideIcon,
} from "lucide-react";
import logoBononiReverse from "@/assets/logo-bononi-reverse.png";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { EMPRESA_MLB_PR } from "@/lib/dist";

// Views vw_dist_servicos/vw_taco_venc_pendentes não estão no types.ts gerado —
// mesmo padrão de src/lib/dist.ts e src/lib/taco.ts (cliente sem tipagem aqui).
const db = supabase as any;

// Selos de contagem no menu — mesma fila que o sino de pendências do Hub conta
// (link ?abrir=... não existe aqui: este app não tem tela única de "abrir na fila",
// cada link do sino já aponta pra rota certa via react-router).
type SeloKey = "distribuicao" | "taco_vencimentos";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  seloKey?: SeloKey;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const groups: NavGroup[] = [
  {
    label: "Vendas",
    items: [
      { to: "/vendas", label: "Visão Geral", icon: LayoutDashboard, end: true },
      { to: "/vendas/vendedores", label: "Vendedores", icon: Users },
      { to: "/vendas/sem-faturamento", label: "Sem Faturamento", icon: AlertTriangle },
    ],
  },
  {
    label: "Serviços",
    items: [
      { to: "/servicos", label: "Resumo", icon: Wrench, end: true },
      { to: "/servicos/patio", label: "Pátio", icon: ParkingCircle },
      { to: "/servicos/tapecaria", label: "Tapeçaria", icon: Scissors },
      { to: "/servicos/config-colaboradores", label: "Config. Colaboradores", icon: Settings2 },
    ],
  },
  {
    label: "Loja",
    items: [
      { to: "/gondola", label: "Gôndola", icon: Tag, end: true },
      { to: "/tacografo", label: "Tacógrafo", icon: Gauge },
      { to: "/tacografo-vencimentos", label: "Vencimentos", icon: Bell, seloKey: "taco_vencimentos" },
    ],
  },
  {
    label: "Gestão de Serviços",
    items: [
      { to: "/gestao-servicos/distribuicao", label: "Lista de Distribuição", icon: ClipboardList, seloKey: "distribuicao" },
      { to: "/gestao-servicos/painel", label: "Painel do Gestor", icon: LayoutGrid },
      { to: "/gestao-servicos/precificacao", label: "Precificação", icon: Calculator },
      { to: "/gestao-servicos/areas", label: "Config. Áreas", icon: MapPin },
    ],
  },
];

interface Props {
  onClose?: () => void;
}

export function AppSidebar({ onClose }: Props) {
  const location = useLocation();
  const [selos, setSelos] = useState<Partial<Record<SeloKey, number>>>({});

  // Contagem leve (head + count=exact, sem baixar linha nenhuma). Recalcula ao
  // montar a sidebar e a cada troca de rota (a sidebar é da casca do AppShell,
  // não remonta sozinha ao navegar). Silencioso em erro — selo não pode derrubar
  // a navegação por falha de rede.
  useEffect(() => {
    let cancelado = false;
    async function carregarSelos() {
      try {
        const [dist, taco] = await Promise.all([
          // só MLB PR, igual à Lista de Distribuição (src/lib/dist.ts)
          db.from("vw_dist_servicos").select("*", { count: "exact", head: true }).eq("status", "aberto").eq("id_empresa", EMPRESA_MLB_PR),
          db.from("vw_taco_venc_pendentes").select("*", { count: "exact", head: true }),
        ]);
        if (cancelado) return;
        setSelos({
          distribuicao: dist.error ? undefined : dist.count ?? undefined,
          taco_vencimentos: taco.error ? undefined : taco.count ?? undefined,
        });
      } catch {
        // idem — falha de rede não aparece na tela, só o selo fica sem número
      }
    }
    carregarSelos();
    return () => { cancelado = true; };
  }, [location.pathname]);

  return (
    <aside
      className="flex flex-col w-[232px] h-full"
      style={{ background: "hsl(var(--sidebar-background))" }}
    >
      {/* Brand */}
      <div className="px-5 py-5 flex items-center justify-between border-b" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <div className="min-w-0">
          <img src={logoBononiReverse} alt="Bononi Acessórios" className="h-[26px] w-auto" />
          <div className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.16em]" style={{ color: "rgba(255,255,255,0.5)" }}>
            Dashboard Loja
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white p-1">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        {groups.map((g) => (
          <div key={g.label} className="mb-2">
            <div className="b-nav-label">{g.label}</div>
            {g.items.map((item) => {
              const Icon = item.icon;
              const selo = item.seloKey ? selos[item.seloKey] : undefined;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) => `b-nav-item ${isActive ? "active" : ""}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {!!selo && (
                    <Badge
                      variant="secondary"
                      className="ml-auto h-5 min-w-[20px] shrink-0 justify-center rounded-full px-1 text-[10px] font-bold leading-none"
                    >
                      {selo > 99 ? "99+" : selo}
                    </Badge>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t text-[10px]" style={{ borderColor: "hsl(var(--sidebar-border))", color: "rgba(255,255,255,0.4)" }}>
        Bononi Acessórios · Loja v1.0
      </div>
    </aside>
  );
}
