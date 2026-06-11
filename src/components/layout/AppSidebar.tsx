import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Wrench, ParkingCircle, Scissors, Boxes, Settings2, X } from "lucide-react";

const groups = [
  {
    label: "Vendas",
    items: [
      { to: "/vendas", label: "Visão Geral", icon: LayoutDashboard, end: true },
      { to: "/vendas/vendedores", label: "Vendedores", icon: Users },
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
];

interface Props {
  onClose?: () => void;
}

export function AppSidebar({ onClose }: Props) {
  return (
    <aside
      className="flex flex-col w-[240px] h-full"
      style={{ background: "hsl(var(--sidebar-background))" }}
    >
      {/* Brand */}
      <div className="px-5 py-5 flex items-center justify-between border-b" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "hsl(var(--blue-light))" }}>
            <Boxes className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold tracking-tight text-[15px] leading-tight">BONONI</div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.16em]" style={{ color: "rgba(255,255,255,0.5)" }}>
              Dashboard Loja
            </div>
          </div>
        </div>
        {/* Botão fechar no mobile */}
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
