import { Link } from 'react-router-dom';
import { Building2, Users, TrendingUp, AlertTriangle, ChevronRight, FileCheck, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Campaign {
  id: string;
  nom: string;
  type_election: string;
  annee: number;
}

interface Candidat {
  id: string;
  nom: string;
  prenom: string;
  circonscription: string | null;
  plafond_depenses: number;
  campaign_id: string;
}

interface Operation {
  id: string;
  candidat_id: string;
  type_operation: string;
  montant: number;
  statut_validation: string;
  justificatif_url: string | null;
}

interface CampaignWithData extends Campaign {
  candidats: (Candidat & {
    operations: Operation[];
    totalDepenses: number;
    pourcentagePlafond: number;
    pendingCount: number;
    missingDocs: number;
  })[];
}

export default function ComptableDashboard() {
  const [campaigns, setCampaigns] = useState<CampaignWithData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all campaigns
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        if (campaignsError) throw campaignsError;

        // Fetch all candidats
        const { data: candidatsData, error: candidatsError } = await supabase
          .from('candidats')
          .select('*');

        if (candidatsError) throw candidatsError;

        // Fetch all operations
        const { data: operationsData, error: operationsError } = await supabase
          .from('operations')
          .select('*');

        if (operationsError) throw operationsError;

        // Build campaigns with nested data
        const campaignsWithData: CampaignWithData[] = (campaignsData || []).map(campaign => {
          const campaignCandidats = (candidatsData || [])
            .filter(c => c.campaign_id === campaign.id)
            .map(candidat => {
              const candidatOperations = (operationsData || []).filter(
                op => op.candidat_id === candidat.id
              );
              
              const totalDepenses = candidatOperations
                .filter(op => op.type_operation === 'depense' && op.statut_validation === 'validee')
                .reduce((sum, op) => sum + Number(op.montant), 0);
              
              const plafond = Number(candidat.plafond_depenses) || 0;
              const pourcentagePlafond = plafond > 0 ? Math.round((totalDepenses / plafond) * 100) : 0;
              
              const pendingCount = candidatOperations.filter(
                op => op.statut_validation === 'en_attente'
              ).length;
              
              const missingDocs = candidatOperations.filter(
                op => op.type_operation === 'depense' && !op.justificatif_url
              ).length;

              return {
                ...candidat,
                operations: candidatOperations,
                totalDepenses,
                pourcentagePlafond,
                pendingCount,
                missingDocs,
              };
            });

          return {
            ...campaign,
            candidats: campaignCandidats,
          };
        });

        setCampaigns(campaignsWithData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate totals
  const totalCampagnes = campaigns.length;
  const allCandidats = campaigns.flatMap(c => c.candidats);
  const totalOperations = allCandidats.reduce((sum, c) => sum + c.operations.length, 0);
  const operationsEnAttente = allCandidats.reduce((sum, c) => sum + c.pendingCount, 0);
  const pieceManquantes = allCandidats.reduce((sum, c) => sum + c.missingDocs, 0);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <h1 className="text-2xl font-bold text-foreground">Espace Expert-Comptable</h1>
            <p className="text-muted-foreground">
              Vue d'ensemble de toutes les campagnes
            </p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link to="/comptable/validation">
              <FileCheck size={18} className="mr-2" />
              Validation
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Campagnes actives"
            value={totalCampagnes}
            icon={<Building2 size={18} className="text-primary" />}
          />
          <StatCard
            title="Opérations totales"
            value={totalOperations}
            icon={<TrendingUp size={18} className="text-accent" />}
          />
          <StatCard
            title="En attente de validation"
            value={operationsEnAttente}
            icon={<Users size={18} className="text-warning" />}
            variant={operationsEnAttente > 0 ? 'warning' : 'default'}
          />
          <StatCard
            title="Pièces manquantes"
            value={pieceManquantes}
            icon={<AlertTriangle size={18} className="text-destructive" />}
            variant={pieceManquantes > 0 ? 'danger' : 'default'}
          />
        </div>

        {/* Campaigns List */}
        <div className="stat-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Liste des campagnes</h2>
          
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune campagne pour le moment.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/comptable/gestion">Créer une campagne</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="space-y-3">
                  <h3 className="font-medium text-foreground border-b border-border pb-2">
                    {campaign.nom} - {campaign.type_election} ({campaign.annee})
                  </h3>
                  
                  {campaign.candidats.length === 0 ? (
                    <p className="text-sm text-muted-foreground pl-4">Aucun candidat dans cette campagne</p>
                  ) : (
                    campaign.candidats.map((candidat) => (
                      <div 
                        key={candidat.id}
                        className="p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors ml-4"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-foreground">
                                {candidat.prenom} {candidat.nom}
                              </h4>
                              {candidat.pendingCount > 0 && (
                                <Badge variant="outline" className="badge-pending">
                                  {candidat.pendingCount} en attente
                                </Badge>
                              )}
                              {candidat.missingDocs > 0 && (
                                <Badge variant="outline" className="badge-rejected">
                                  {candidat.missingDocs} pièces manquantes
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {candidat.circonscription || 'Circonscription non définie'}
                            </p>
                            
                            <ProgressBar 
                              value={candidat.totalDepenses}
                              max={Number(candidat.plafond_depenses) || 1}
                              size="sm"
                              showPercentage={false}
                            />
                            <div className="flex justify-between mt-2 text-sm">
                              <span className="text-muted-foreground">
                                {candidat.totalDepenses.toLocaleString('fr-FR')} € / {Number(candidat.plafond_depenses).toLocaleString('fr-FR')} €
                              </span>
                              <span className={cn(
                                "font-medium",
                                candidat.pourcentagePlafond >= 90 ? 'text-destructive' :
                                candidat.pourcentagePlafond >= 75 ? 'text-warning' : 'text-success'
                              )}>
                                {candidat.pourcentagePlafond}%
                              </span>
                            </div>
                          </div>

                          <Button variant="ghost" className="self-end lg:self-center">
                            Détails
                            <ChevronRight size={16} className="ml-1" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
