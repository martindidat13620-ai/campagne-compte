import { Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft, Lock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { PlafondCard } from '@/components/dashboard/PlafondCard';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { RecentOperations } from '@/components/dashboard/RecentOperations';
import { calculatePlafond, getOperationsByMandataire, getMandataireById } from '@/data/mockData';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CandidatDashboard() {
  // For demo, using default mandataireId - will be linked to candidat later
  const mandataireId = 'm1';
  
  const mandataire = getMandataireById(mandataireId);
  const operations = getOperationsByMandataire(mandataireId);
  const plafondData = calculatePlafond(mandataireId);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Read-only Alert */}
        <Alert className="border-accent/20 bg-accent/5">
          <Lock size={16} className="text-accent" />
          <AlertDescription className="text-foreground">
            Vous êtes en mode <strong>lecture seule</strong>. Seul le mandataire peut modifier les opérations.
          </AlertDescription>
        </Alert>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord Candidat</h1>
          <p className="text-muted-foreground">
            Campagne : {mandataire?.candidatNom} • {mandataire?.typeElection}
          </p>
        </div>

        {/* Plafond Card */}
        <PlafondCard 
          totalDepenses={plafondData.totalDepenses}
          plafond={mandataire?.plafondDepenses || 0}
          depensesRestantes={plafondData.depensesRestantes}
        />

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Dépenses validées"
            value={`${plafondData.totalDepenses.toLocaleString('fr-FR')} €`}
            icon={<ArrowUpRight size={18} className="text-destructive" />}
          />
          <StatCard
            title="Recettes totales"
            value={`${plafondData.totalRecettes.toLocaleString('fr-FR')} €`}
            icon={<ArrowDownLeft size={18} className="text-success" />}
          />
          <StatCard
            title="Solde disponible"
            value={`${(plafondData.totalRecettes - plafondData.totalDepenses).toLocaleString('fr-FR')} €`}
            icon={<Wallet size={18} className="text-accent" />}
          />
          <StatCard
            title="Utilisation plafond"
            value={`${plafondData.pourcentagePlafond}%`}
            icon={<TrendingUp size={18} className="text-primary" />}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ExpenseChart operations={operations} type="bar" />
          <ExpenseChart operations={operations} type="pie" />
        </div>

        {/* Recent Operations (view only) */}
        <RecentOperations operations={operations} showViewAll={false} />
      </div>
    </AppLayout>
  );
}
