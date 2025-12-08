import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import EnAttente from "./pages/EnAttente";
import MandataireDashboard from "./pages/MandataireDashboard";
import NouvelleDepense from "./pages/NouvelleDepense";
import NouvelleRecette from "./pages/NouvelleRecette";
import Historique from "./pages/Historique";
import ComptableDashboard from "./pages/ComptableDashboard";
import ComptableValidation from "./pages/ComptableValidation";
import CandidatDashboard from "./pages/CandidatDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/en-attente" element={<EnAttente />} />
            <Route path="/mandataire" element={<MandataireDashboard />} />
            <Route path="/depense/nouvelle" element={<NouvelleDepense />} />
            <Route path="/recette/nouvelle" element={<NouvelleRecette />} />
            <Route path="/historique" element={<Historique />} />
            <Route path="/comptable" element={<ComptableDashboard />} />
            <Route path="/comptable/validation" element={<ComptableValidation />} />
            <Route path="/candidat" element={<CandidatDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
