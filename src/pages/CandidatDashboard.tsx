import { Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft, Lock, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { PlafondCard } from '@/components/dashboard/PlafondCard';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { RecentOperations } from '@/components/dashboard/RecentOperations';
import { useCandidatData } from '@/hooks/useCandidatData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Operation } from '@/types';

export default function CandidatDashboard() {
  const { loading, candidat, operations, stats, error } = useCandidatData();

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (error || !candidat) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-destructive">{error || 'Aucune donnée candidat trouvée'}</p>
        </div>
      </AppLayout>
    );
  }

  // Transform operations for components that expect the Operation type
  const formattedOperations: Operation[] = operations.map(op => ({
    id: op.id,
    candidat_id: candidat.id,
    mandataire_id: '',
    type_operation: op.type_operation as 'depense' | 'recette',
    categorie: op.categorie,
    montant: Number(op.montant),
    date: op.date,
    beneficiaire: op.beneficiaire,
    donateur_nom: op.donateur_nom,
    statut_validation: op.statut_validation as 'en_attente' | 'validee' | 'rejetee',
    mode_paiement: op.mode_paiement,
    commentaire: op.commentaire,
    justificatif_url: op.justificatif_url,
    justificatif_nom: op.justificatif_nom,
    created_at: '',
    updated_at: '',
  }));

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
            Campagne : {candidat.prenom} {candidat.nom} • {candidat.campaign?.type_election || 'N/A'}
          </p>
        </div>

        {/* Plafond Card */}
        <PlafondCard 
          totalDepenses={stats.totalDepenses}
          plafond={stats.plafond}
          depensesRestantes={stats.depensesRestantes}
        />

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Dépenses validées"
            value={`${stats.totalDepenses.toLocaleString('fr-FR')} €`}
            icon={<ArrowUpRight size={18} className="text-destructive" />}
          />
          <StatCard
            title="Recettes totales"
            value={`${stats.totalRecettes.toLocaleString('fr-FR')} €`}
            icon={<ArrowDownLeft size={18} className="text-success" />}
          />
          <StatCard
            title="Solde disponible"
            value={`${(stats.totalRecettes - stats.totalDepenses).toLocaleString('fr-FR')} €`}
            icon={<Wallet size={18} className="text-accent" />}
          />
          <StatCard
            title="Utilisation plafond"
            value={`${stats.pourcentagePlafond}%`}
            icon={<TrendingUp size={18} className="text-primary" />}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ExpenseChart operations={formattedOperations} type="bar" />
          <ExpenseChart operations={formattedOperations} type="pie" />
        </div>

        {/* Recent Operations (view only) */}
        <RecentOperations operations={formattedOperations} showViewAll={false} />
      </div>
    </AppLayout>
  );
}
