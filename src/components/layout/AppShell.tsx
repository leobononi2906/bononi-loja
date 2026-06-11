import { useState, createContext, useContext } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import type { DashboardFilters } from "@/data/mockData";

interface ShellCtx {
  filters: DashboardFilters;
  setFilters: (f: DashboardFilters) => void;
  setPageTitle: (t: { title: string; subtitle?: string }) => void;
}

const Ctx = createContext<ShellCtx | null>(null);

export function useShell() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShell must be used inside AppShell");
  return ctx;
}

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/vendas": { title: "Vendas · Visão Geral", subtitle: "Leitura rápida da operação comercial" },
  "/vendas/vendedores": { title: "Vendas · Vendedores", subtitle: "Painel operacional por vendedor" },
  "/servicos": { title: "Serviços · Resumo", subtitle: "Indicadores e fila de OS" },
  "/servicos/patio": { title: "Serviços · Pátio", subtitle: "Central operacional da oficina" },
  "/servicos/tapecaria": { title: "Serviços · Tapeçaria", subtitle: "Produção e produtividade" },
  "/servicos/config-colaboradores": { title: "Config. Colaboradores", subtitle: "Defina o setor de cada colaborador" },
};

export function AppShell() {
  const [filters, setFilters] = useState<DashboardFilters>({
    canal: "TODOS",
    mesAno: new Date(),
    empresa: "TODAS",
    grupo: "TODOS",
    diaInicio: null,
    diaFim: null,
  });
  const [pageTitle, setPageTitle] = useState<{ title: string; subtitle?: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const fallback = ROUTE_TITLES[pathname] ?? { title: "Bononi", subtitle: "" };
  const titleData = pageTitle ?? fallback;

  return (
    <Ctx.Provider value={{ filters, setFilters, setPageTitle }}>
      <div className="min-h-screen bg-background">
        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <AppSidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Conteúdo */}
        <div className="lg:pl-[240px]">
          <TopBar
            filters={filters}
            onChange={setFilters}
            title={titleData.title}
            subtitle={titleData.subtitle}
            onToggleSidebar={() => setSidebarOpen(v => !v)}
          />
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </Ctx.Provider>
  );
}
