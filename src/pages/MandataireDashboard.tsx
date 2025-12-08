import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { PlafondCard } from '@/components/dashboard/PlafondCard';
import { RecentOperations } from '@/components/dashboard/RecentOperations';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface CandidatInfo {
  id: string;
  nom: string;
  prenom: string;
  plafond_depenses: number;
  campaign: {
    nom: string;
    type_election: string;
  };
}

export default function MandataireDashboard() {
  const { user } = useAuth();
  const [candidat, setCandidat] = useState<CandidatInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMandataireData() {
      if (!user) return;

      try {
        // Get mandataire linked to current user
        const { data: mandataire, error: mandataireError } = await supabase
          .from('mandataires')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (mandataireError || !mandataire) {
          console.error('Error fetching mandataire:', mandataireError);
          setLoading(false);
          return;
        }

        // Get candidat linked to this mandataire
        const { data: link, error: linkError } = await supabase
          .from('mandataire_candidats')
          .select('candidat_id')
          .eq('mandataire_id', mandataire.id)
          .single();

        if (linkError || !link) {
          console.error('Error fetching mandataire-candidat link:', linkError);
          setLoading(false);
          return;
        }

        // Get candidat details with campaign
        const { data: candidatData, error: candidatError } = await supabase
          .from('candidats')
          .select(`
            id,
            nom,
            prenom,
            plafond_depenses,
            campaigns:campaign_id (
              nom,
              type_election
            )
          `)
          .eq('id', link.candidat_id)
          .single();

        if (candidatError) {
          console.error('Error fetching candidat:', candidatError);
        } else if (candidatData) {
          const campaign = Array.isArray(candidatData.campaigns) 
            ? candidatData.campaigns[0] 
            : candidatData.campaigns;
          
          setCandidat({
            id: candidatData.id,
            nom: candidatData.nom,
            prenom: candidatData.prenom,
            plafond_depenses: candidatData.plafond_depenses || 0,
            campaign: campaign || { nom: '', type_election: '' }
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMandataireData();
  }, [user]);

  // Pour l'instant, pas d'opérations (table à créer)
  const operations: any[] = [];
  const totalDepenses = 0;
  const totalRecettes = 0;
  const depensesEnAttente = 0;

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-muted-foreground">
              Campagne : {candidat ? `${candidat.prenom} ${candidat.nom}` : 'Non assigné'} • {candidat?.campaign?.type_election || 'N/A'}
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
          totalDepenses={totalDepenses}
          plafond={candidat?.plafond_depenses || 0}
          depensesRestantes={(candidat?.plafond_depenses || 0) - totalDepenses}
        />

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Dépenses validées"
            value={`${totalDepenses.toLocaleString('fr-FR')} €`}
            icon={<ArrowUpRight size={18} className="text-destructive" />}
            className="animate-slide-up stagger-1"
          />
          <StatCard
            title="Recettes totales"
            value={`${totalRecettes.toLocaleString('fr-FR')} €`}
            icon={<ArrowDownLeft size={18} className="text-success" />}
            className="animate-slide-up stagger-2"
          />
          <StatCard
            title="Solde disponible"
            value={`${(totalRecettes - totalDepenses).toLocaleString('fr-FR')} €`}
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
