import { Link } from 'react-router-dom';
import { PlusCircle, ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { PlafondCard } from '@/components/dashboard/PlafondCard';
import { RecentOperations } from '@/components/dashboard/RecentOperations';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { Button } from '@/components/ui/button';
import { calculatePlafond, getOperationsByMandataire, getMandataireById } from '@/data/mockData';

export default function MandataireDashboard() {
  // For demo, using default mandataireId - will be linked to user later
  const mandataireId = 'm1';
  
  const mandataire = getMandataireById(mandataireId);
  const operations = getOperationsByMandataire(mandataireId);
  const plafondData = calculatePlafond(mandataireId);

  const depensesEnAttente = operations.filter(
    op => op.type === 'depense' && op.statutValidation === 'en_attente'
  ).length;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-muted-foreground">
              Campagne : {mandataire?.candidatNom} • {mandataire?.typeElection}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/recette/nouvelle">
                <ArrowDownLeft size={18} className="mr-2" />
                Recette
              </Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link to="/depense/nouvelle">
                <PlusCircle size={18} className="mr-2" />
                Dépense
              </Link>
            </Button>
          </div>
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
            className="animate-slide-up stagger-1"
          />
          <StatCard
            title="Recettes totales"
            value={`${plafondData.totalRecettes.toLocaleString('fr-FR')} €`}
            icon={<ArrowDownLeft size={18} className="text-success" />}
            className="animate-slide-up stagger-2"
          />
          <StatCard
            title="Solde disponible"
            value={`${(plafondData.totalRecettes - plafondData.totalDepenses).toLocaleString('fr-FR')} €`}
            icon={<Wallet size={18} className="text-accent" />}
            className="animate-slide-up stagger-3"
          />
          <StatCard
            title="En attente"
            value={depensesEnAttente}
            subtitle="opérations à valider"
            icon={<TrendingUp size={18} className="text-warning" />}
            variant={depensesEnAttente > 0 ? 'warning' : 'default'}
            className="animate-slide-up stagger-4"
          />
        </div>

        {/* Charts & Recent Operations */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ExpenseChart operations={operations} type="bar" />
          <ExpenseChart operations={operations} type="pie" />
        </div>

        <RecentOperations operations={operations} />
      </div>
    </AppLayout>
  );
}
