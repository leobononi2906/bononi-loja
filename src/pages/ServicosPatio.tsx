import { PatioTab } from "@/components/dashboard/PatioTab";
import { useShell } from "@/components/layout/AppShell";

export default function ServicosPatio() {
  const { filters } = useShell();
  return <PatioTab filters={filters} />;
}
