import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import VendasVisaoGeral from "./pages/VendasVisaoGeral";
import VendasVendedores from "./pages/VendasVendedores";
import ServicosResumo from "./pages/ServicosResumo";
import ServicosPatio from "./pages/ServicosPatio";
import ServicosTapecaria from "./pages/ServicosTapecaria";
import ConfigColaboradores from "./pages/ConfigColaboradores";
import GondolaLoja from "./pages/GondolaLoja";
import TacografoLista from "./pages/TacografoLista";
import TacografoOrdem from "./pages/TacografoOrdem";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/vendas" replace />} />
            <Route path="/vendas" element={<VendasVisaoGeral />} />
            <Route path="/vendas/vendedores" element={<VendasVendedores />} />
            <Route path="/servicos" element={<ServicosResumo />} />
            <Route path="/servicos/patio" element={<ServicosPatio />} />
            <Route path="/servicos/tapecaria" element={<ServicosTapecaria />} />
            <Route path="/servicos/config-colaboradores" element={<ConfigColaboradores />} />
            <Route path="/gondola" element={<GondolaLoja />} />
            <Route path="/tacografo" element={<TacografoLista />} />
            <Route path="/tacografo/nova" element={<TacografoOrdem />} />
            <Route path="/tacografo/:id" element={<TacografoOrdem />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

