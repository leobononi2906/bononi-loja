import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Wrench, ParkingCircle, Scissors, Settings2, Tag, Gauge, AlertTriangle, X, ClipboardList, LayoutGrid, Calculator, MapPin, Bell } from "lucide-react";
import logoBononiReverse from "@/assets/logo-bononi-reverse.png";

const groups = [
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
      { to: "/tacografo-vencimentos", label: "Vencimentos", icon: Bell },
    ],
  },
  {
    label: "Gestão de Serviços",
    items: [
      { to: "/gestao-servicos/distribuicao", label: "Lista de Distribuição", icon: ClipboardList },
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
