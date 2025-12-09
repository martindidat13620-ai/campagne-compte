import { Link, useNavigate } from 'react-router-dom';
import { Building2, Users, ChevronRight, Loader2, ArrowLeft, Settings } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

interface CandidatWithData extends Candidat {
  totalDepenses: number;
  totalRecettes: number;
  pourcentagePlafond: number;
  pendingCount: number;
  missingDocs: number;
}

interface CampaignWithData extends Campaign {
  candidats: CandidatWithData[];
}

export default function ComptableCampagnes() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCampaign, setFilterCampaign] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        if (campaignsError) throw campaignsError;

        const { data: candidatsData, error: candidatsError } = await supabase
          .from('candidats')
          .select('*');

        if (candidatsError) throw candidatsError;

        const { data: operationsData, error: operationsError } = await supabase
          .from('operations')
          .select('*');

        if (operationsError) throw operationsError;

        const campaignsWithData: CampaignWithData[] = (campaignsData || []).map(campaign => {
          const campaignCandidats = (candidatsData || [])
            .filter(c => c.campaign_id === campaign.id)
            .map(candidat => {
              const candidatOperations = (operationsData || []).filter(
                op => op.candidat_id === candidat.id
              );
              
              const validatedDepenses = candidatOperations.filter(
                op => op.type_operation === 'depense' && op.statut_validation === 'validee'
              );
              
              const totalDepenses = validatedDepenses.reduce((sum, op) => sum + Number(op.montant), 0);
              
              const totalRecettes = candidatOperations
                .filter(op => op.type_operation === 'recette' && op.statut_validation === 'validee')
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
                totalDepenses,
                totalRecettes,
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

  const filteredCampaigns = filterCampaign === 'all' 
    ? campaigns 
    : campaigns.filter(c => c.id === filterCampaign);

  const totalCampagnes = campaigns.length;
  const allCandidats = campaigns.flatMap(c => c.candidats);

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
        <div>
          <Link 
            to="/comptable"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            Retour à l'accueil
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mes Comptes de Campagne</h1>
              <p className="text-muted-foreground">
                Sélectionnez un dossier pour accéder aux détails
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/comptable/gestion">
                <Settings size={18} className="mr-2" />
                Gestion
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 max-w-md">
          <StatCard
            title="Campagnes actives"
            value={totalCampagnes}
            icon={<Building2 size={18} className="text-primary" />}
          />
          <StatCard
            title="Candidats"
            value={allCandidats.length}
            icon={<Users size={18} className="text-accent" />}
          />
        </div>

        {/* Filter */}
        {campaigns.length > 1 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Filtrer par campagne :</span>
            <Select value={filterCampaign} onValueChange={setFilterCampaign}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Toutes les campagnes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les campagnes</SelectItem>
                {campaigns.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom} ({c.annee})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Campaigns and Candidates */}
        {filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Aucune campagne trouvée</p>
              <Button asChild className="mt-4">
                <Link to="/comptable/gestion">Créer une campagne</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      {campaign.nom}
                    </CardTitle>
                    <Badge variant="outline">{campaign.annee}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{campaign.type_election}</p>
                </CardHeader>
                <CardContent>
                  {campaign.candidats.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Aucun candidat dans cette campagne
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {campaign.candidats.map((candidat) => (
                        <div
                          key={candidat.id}
                          onClick={() => navigate(`/comptable/dossier/${candidat.id}`)}
                          className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-all group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="font-semibold text-foreground">
                                {candidat.prenom} {candidat.nom}
                              </p>
                              {candidat.pendingCount > 0 && (
                                <Badge variant="outline" className="badge-pending text-xs">
                                  {candidat.pendingCount} en attente
                                </Badge>
                              )}
                              {candidat.missingDocs > 0 && (
                                <Badge variant="outline" className="badge-rejected text-xs">
                                  {candidat.missingDocs} pièces
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {candidat.circonscription || 'Circonscription non définie'}
                            </p>
                            <div className="flex items-center gap-4">
                              <div className="flex-1 max-w-xs">
                                <ProgressBar 
                                  value={candidat.pourcentagePlafond} 
                                  showPercentage={false}
                                  size="sm"
                                />
                              </div>
                              <span className={cn(
                                "text-sm font-medium",
                                candidat.pourcentagePlafond >= 90 ? 'text-destructive' :
                                candidat.pourcentagePlafond >= 75 ? 'text-warning' : 'text-muted-foreground'
                              )}>
                                {candidat.pourcentagePlafond}% du plafond
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
