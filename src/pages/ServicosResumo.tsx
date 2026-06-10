import { GerencialTab } from "@/components/dashboard/GerencialTab";
import { useShell } from "@/components/layout/AppShell";

export default function ServicosResumo() {
  const { filters } = useShell();
  return <GerencialTab filters={filters} />;
}
