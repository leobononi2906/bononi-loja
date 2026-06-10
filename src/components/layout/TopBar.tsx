import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Menu } from "lucide-react";
import { format, subMonths, addMonths, getDaysInMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Canal, Empresa, DashboardFilters } from "@/data/mockData";

const canais: { value: Canal; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "LOJA", label: "Loja" },
  { value: "OS", label: "OS" },
];

const empresas: Empresa[] = ["TODAS", "BONONI PR", "BONONI SC", "MLB PR", "MLB SC", "MLB SP", "TRUCKPREST", "SANTA TEREZA", "BATTOGO", "OPERADOR LOGÍSTICO"];

interface Props {
  filters: DashboardFilters;
  onChange: (f: DashboardFilters) => void;
  title: string;
  subtitle?: string;
  onToggleSidebar?: () => void;
}

export function TopBar({ filters, onChange, title, subtitle, onToggleSidebar }: Props) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const isMobile = useIsMobile();

  useEffect(() => {
    setLastUpdated(new Date());
  }, [filters.canal, filters.mesAno, filters.empresa, filters.diaInicio, filters.diaFim]);

  const daysInMonth = getDaysInMonth(filters.mesAno);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <header className="sticky top-0 z-30 bg-card border-b">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {onToggleSidebar && (
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={onToggleSidebar}>
              <Menu className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold tracking-tight truncate">{title}</h1>
            {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
          <RefreshCw className="h-3 w-3" />
          <span className="font-mono">{format(lastUpdated, "dd/MM HH:mm")}</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="border-t px-4 sm:px-5 py-2.5 flex flex-wrap items-center gap-3" style={{ background: "hsl(var(--surface2))" }}>
        {/* Canal */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mr-1">Canal</span>
          {canais.map((c) => (
            <button
              key={c.value}
              onClick={() => onChange({ ...filters, canal: c.value })}
              className={`h-7 px-2.5 rounded-md text-[11px] font-medium border transition-colors ${
                filters.canal === c.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:bg-card"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Período */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mr-1">Período</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange({ ...filters, mesAno: subMonths(filters.mesAno, 1), diaInicio: null, diaFim: null })}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[12px] font-semibold min-w-[88px] text-center font-mono">
            {format(filters.mesAno, "MMM yyyy", { locale: ptBR }).toUpperCase()}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange({ ...filters, mesAno: addMonths(filters.mesAno, 1), diaInicio: null, diaFim: null })}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Dia range */}
        <div className="hidden sm:flex items-center gap-1">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Dia</span>
          <Select value={filters.diaInicio != null ? String(filters.diaInicio) : "todos"} onValueChange={(v) => onChange({ ...filters, diaInicio: v === "todos" ? null : Number(v) })}>
            <SelectTrigger className="h-7 w-[60px] text-[11px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos" className="text-xs">01</SelectItem>
              {days.map((d) => <SelectItem key={d} value={String(d)} className="text-xs">{String(d).padStart(2, "0")}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-[10px] text-muted-foreground">a</span>
          <Select value={filters.diaFim != null ? String(filters.diaFim) : "todos"} onValueChange={(v) => onChange({ ...filters, diaFim: v === "todos" ? null : Number(v) })}>
            <SelectTrigger className="h-7 w-[60px] text-[11px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos" className="text-xs">{String(daysInMonth).padStart(2, "0")}</SelectItem>
              {days.map((d) => <SelectItem key={d} value={String(d)} className="text-xs">{String(d).padStart(2, "0")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Empresa */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Empresa</span>
          <Select value={filters.empresa} onValueChange={(v) => onChange({ ...filters, empresa: v as Empresa })}>
            <SelectTrigger className="h-7 w-[140px] text-[11px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {empresas.map((e) => <SelectItem key={e} value={e} className="text-xs">{e === "TODAS" ? "Todas" : e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
