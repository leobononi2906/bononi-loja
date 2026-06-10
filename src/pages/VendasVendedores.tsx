import { ComercialVendedoresTab } from "@/components/dashboard/ComercialVendedoresTab";
import { useShell } from "@/components/layout/AppShell";

export default function VendasVendedores() {
  const { filters } = useShell();
  return <ComercialVendedoresTab filters={filters} />;
}
