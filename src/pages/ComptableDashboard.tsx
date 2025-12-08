import { Link } from 'react-router-dom';
import { Building2, Users, TrendingUp, AlertTriangle, ChevronRight, FileCheck, Loader2, ArrowLeft, ArrowUpRight, ArrowDownLeft, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { PlafondCard } from '@/components/dashboard/PlafondCard';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
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
  date: string;
  categorie: string;
  beneficiaire: string | null;
  donateur_nom: string | null;
}

interface CandidatWithData extends Candidat {
  operations: Operation[];
  totalDepenses: number;
  totalRecettes: number;
  pourcentagePlafond: number;
  pendingCount: number;
  missingDocs: number;
  depensesParCategorie: { name: string; value: number }[];
  depensesParDate: { date: string; depenses: number; recettes: number }[];
}

interface CampaignWithData extends Campaign {
  candidats: CandidatWithData[];
}

export default function ComptableDashboard() {
  const [campaigns, setCampaigns] = useState<CampaignWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidat, setSelectedCandidat] = useState<CandidatWithData | null>(null);
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

              // Group by category
              const categoriesMap = new Map<string, number>();
              validatedDepenses.forEach(op => {
                const current = categoriesMap.get(op.categorie) || 0;
                categoriesMap.set(op.categorie, current + Number(op.montant));
              });
              const depensesParCategorie = Array.from(categoriesMap.entries())
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);

              // Group by date
              const datesMap = new Map<string, { depenses: number; recettes: number }>();
              candidatOperations
                .filter(op => op.statut_validation === 'validee')
                .forEach(op => {
                  const date = op.date;
                  const current = datesMap.get(date) || { depenses: 0, recettes: 0 };
                  if (op.type_operation === 'depense') {
                    current.depenses += Number(op.montant);
                  } else {
                    current.recettes += Number(op.montant);
                  }
                  datesMap.set(date, current);
                });
              const depensesParDate = Array.from(datesMap.entries())
                .map(([date, values]) => ({ date, ...values }))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

              return {
                ...candidat,
                operations: candidatOperations,
                totalDepenses,
                totalRecettes,
                pourcentagePlafond,
                pendingCount,
                missingDocs,
                depensesParCategorie,
                depensesParDate,
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

  // Detailed view for a selected candidate
  if (selectedCandidat) {
    const campaign = campaigns.find(c => c.id === selectedCandidat.campaign_id);
    const plafond = Number(selectedCandidat.plafond_depenses) || 0;
    const depensesRestantes = Math.max(0, plafond - selectedCandidat.totalDepenses);

    return (
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div>
            <button 
              onClick={() => setSelectedCandidat(null)}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft size={18} />
              Retour à la liste
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {selectedCandidat.prenom} {selectedCandidat.nom}
                </h1>
                <p className="text-muted-foreground">
                  {campaign?.nom} • {selectedCandidat.circonscription || 'Circonscription non définie'}
                </p>
              </div>
              <div className="flex gap-2">
                {selectedCandidat.pendingCount > 0 && (
                  <Badge variant="outline" className="badge-pending">
                    {selectedCandidat.pendingCount} en attente
                  </Badge>
                )}
                {selectedCandidat.missingDocs > 0 && (
                  <Badge variant="outline" className="badge-rejected">
                    {selectedCandidat.missingDocs} pièces manquantes
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Dépenses"
              value={`${selectedCandidat.totalDepenses.toLocaleString('fr-FR')} €`}
              icon={<ArrowUpRight size={18} className="text-destructive" />}
            />
            <StatCard
              title="Total Recettes"
              value={`${selectedCandidat.totalRecettes.toLocaleString('fr-FR')} €`}
              icon={<ArrowDownLeft size={18} className="text-success" />}
            />
            <StatCard
              title="Budget Restant"
              value={`${depensesRestantes.toLocaleString('fr-FR')} €`}
              icon={<TrendingUp size={18} className="text-accent" />}
              variant={selectedCandidat.pourcentagePlafond >= 90 ? 'danger' : 'default'}
            />
            <StatCard
              title="Opérations"
              value={selectedCandidat.operations.length}
              icon={<Users size={18} className="text-primary" />}
            />
          </div>

          {/* Plafond Card */}
          <PlafondCard
            plafond={plafond}
            totalDepenses={selectedCandidat.totalDepenses}
            depensesRestantes={depensesRestantes}
          />

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Expenses by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dépenses par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCandidat.depensesParCategorie.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune dépense validée</p>
                ) : (
                  <div className="space-y-3">
                    {selectedCandidat.depensesParCategorie.map((cat, index) => (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground">{cat.name}</span>
                          <span className="font-medium">{cat.value.toLocaleString('fr-FR')} €</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ 
                              width: `${(cat.value / selectedCandidat.totalDepenses) * 100}%`,
                              opacity: 1 - (index * 0.15)
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Evolution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dépenses par mois</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCandidat.operations.filter(op => op.statut_validation === 'validee').length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune donnée</p>
                ) : (
                  <ExpenseChart 
                    operations={selectedCandidat.operations.map(op => ({
                      id: op.id,
                      candidat_id: op.candidat_id,
                      mandataire_id: '',
                      type_operation: op.type_operation as 'depense' | 'recette',
                      montant: Number(op.montant),
                      statut_validation: op.statut_validation as 'en_attente' | 'validee' | 'rejetee',
                      date: op.date,
                      categorie: op.categorie,
                      mode_paiement: '',
                      beneficiaire: op.beneficiaire,
                      donateur_nom: op.donateur_nom,
                      justificatif_url: op.justificatif_url,
                      justificatif_nom: null,
                      commentaire: null,
                      commentaire_comptable: null,
                      donateur_adresse: null,
                      donateur_nationalite: null,
                      numero_recu: null,
                      created_at: '',
                      updated_at: ''
                    }))} 
                    type="bar" 
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Operations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dernières opérations</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCandidat.operations.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Aucune opération</p>
              ) : (
                <div className="space-y-2">
                  {selectedCandidat.operations.slice(0, 10).map(op => (
                    <div key={op.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-md",
                          op.type_operation === 'depense' ? 'bg-destructive/10' : 'bg-success/10'
                        )}>
                          {op.type_operation === 'depense' ? (
                            <ArrowUpRight size={16} className="text-destructive" />
                          ) : (
                            <ArrowDownLeft size={16} className="text-success" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{op.beneficiaire || op.donateur_nom || op.categorie}</p>
                          <p className="text-xs text-muted-foreground">{op.date} • {op.categorie}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-semibold",
                          op.type_operation === 'depense' ? 'text-destructive' : 'text-success'
                        )}>
                          {op.type_operation === 'depense' ? '-' : '+'}{Number(op.montant).toLocaleString('fr-FR')} €
                        </p>
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          op.statut_validation === 'validee' ? 'badge-validated' :
                          op.statut_validation === 'rejetee' ? 'badge-rejected' : 'badge-pending'
                        )}>
                          {op.statut_validation === 'validee' ? 'Validée' :
                           op.statut_validation === 'rejetee' ? 'Refusée' : 'En attente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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

        {/* Campaign Filter */}
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

        {/* Campaigns List */}
        <div className="stat-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Liste des candidats</h2>
          
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune campagne pour le moment.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/comptable/gestion">Créer une campagne</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
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
                        className="p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors ml-4 cursor-pointer"
                        onClick={() => setSelectedCandidat(candidat)}
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
                            Voir détails
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
