import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, TrendingUp, Users, Loader2, LayoutDashboard, FileText, FileCheck, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { PlafondCard } from '@/components/dashboard/PlafondCard';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { OperationsTable } from '@/components/operations/OperationsTable';
import { OperationFormModal } from '@/components/operations/OperationFormModal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Operation as OperationType } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface Candidat {
  id: string;
  nom: string;
  prenom: string;
  circonscription: string | null;
  plafond_depenses: number;
  campaign_id: string;
}

interface Campaign {
  id: string;
  nom: string;
  type_election: string;
  annee: number;
}

interface Operation {
  id: string;
  candidat_id: string;
  mandataire_id: string;
  type_operation: string;
  montant: number;
  statut_validation: string;
  justificatif_url: string | null;
  justificatif_nom: string | null;
  date: string;
  categorie: string;
  mode_paiement: string;
  beneficiaire: string | null;
  donateur_nom: string | null;
  donateur_prenom: string | null;
  donateur_adresse: string | null;
  donateur_code_postal: string | null;
  donateur_ville: string | null;
  donateur_pays: string | null;
  donateur_nationalite: string | null;
  numero_recu: string | null;
  numero_releve_bancaire: string | null;
  is_collecte: boolean | null;
  collecte_date: string | null;
  collecte_organisation: string | null;
  commentaire: string | null;
  commentaire_comptable: string | null;
  compte_comptable: string | null;
  created_at: string;
  updated_at: string;
}

export default function ComptableDossier() {
  const { candidatId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [candidat, setCandidat] = useState<Candidat | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [operationModalOpen, setOperationModalOpen] = useState(false);
  const [selectedOperationForEdit, setSelectedOperationForEdit] = useState<Operation | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!candidatId) return;

      try {
        // Fetch candidat
        const { data: candidatData, error: candidatError } = await supabase
          .from('candidats')
          .select('*')
          .eq('id', candidatId)
          .single();

        if (candidatError) throw candidatError;
        setCandidat(candidatData);

        // Fetch campaign
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', candidatData.campaign_id)
          .single();

        if (campaignError) throw campaignError;
        setCampaign(campaignData);

        // Fetch operations
        const { data: operationsData, error: operationsError } = await supabase
          .from('operations')
          .select('*')
          .eq('candidat_id', candidatId)
          .order('date', { ascending: false });

        if (operationsError) throw operationsError;
        setOperations(operationsData || []);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du dossier",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [candidatId, toast]);

  const handleValidate = async (operationId: string) => {
    try {
      const { error } = await supabase
        .from('operations')
        .update({ statut_validation: 'validee' })
        .eq('id', operationId);

      if (error) throw error;

      setOperations(prev => prev.map(op => 
        op.id === operationId ? { ...op, statut_validation: 'validee' } : op
      ));

      toast({ title: "Opération validée" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de valider l'opération", variant: "destructive" });
    }
  };

  const handleReject = async (operationId: string, comment: string) => {
    try {
      const { error } = await supabase
        .from('operations')
        .update({ statut_validation: 'rejetee', commentaire_comptable: comment })
        .eq('id', operationId);

      if (error) throw error;

      setOperations(prev => prev.map(op => 
        op.id === operationId ? { ...op, statut_validation: 'rejetee', commentaire_comptable: comment } : op
      ));

      toast({ title: "Opération rejetée" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de rejeter l'opération", variant: "destructive" });
    }
  };

  const handleDelete = async (operationId: string) => {
    try {
      const { error } = await supabase
        .from('operations')
        .delete()
        .eq('id', operationId);

      if (error) throw error;

      setOperations(prev => prev.filter(op => op.id !== operationId));

      toast({ title: "Opération supprimée" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer l'opération", variant: "destructive" });
    }
  };

  const handleEditOperation = (operation: OperationType) => {
    const op = operations.find(o => o.id === operation.id);
    if (op) {
      setSelectedOperationForEdit(op);
      setOperationModalOpen(true);
    }
  };

  const handleNewOperation = () => {
    setSelectedOperationForEdit(null);
    setOperationModalOpen(true);
  };

  const handleOperationSuccess = async () => {
    // Refetch operations after create/edit
    const { data: operationsData } = await supabase
      .from('operations')
      .select('*')
      .eq('candidat_id', candidatId)
      .order('date', { ascending: false });
    
    if (operationsData) {
      setOperations(operationsData);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!candidat || !campaign) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Dossier non trouvé</p>
          <Link to="/comptable/campagnes" className="text-primary hover:underline mt-2 inline-block">
            Retour aux campagnes
          </Link>
        </div>
      </AppLayout>
    );
  }

  // Calculate stats
  const validatedDepenses = operations.filter(op => op.type_operation === 'depense' && op.statut_validation === 'validee');
  const totalDepenses = validatedDepenses.reduce((sum, op) => sum + Number(op.montant), 0);
  const totalRecettes = operations
    .filter(op => op.type_operation === 'recette' && op.statut_validation === 'validee')
    .reduce((sum, op) => sum + Number(op.montant), 0);
  const plafond = Number(candidat.plafond_depenses) || 0;
  const depensesRestantes = Math.max(0, plafond - totalDepenses);
  const pourcentagePlafond = plafond > 0 ? Math.round((totalDepenses / plafond) * 100) : 0;
  const pendingOperations = operations.filter(op => op.statut_validation === 'en_attente');
  const missingDocs = operations.filter(op => op.type_operation === 'depense' && !op.justificatif_url).length;

  // Group by category for chart
  const categoriesMap = new Map<string, number>();
  validatedDepenses.forEach(op => {
    const current = categoriesMap.get(op.categorie) || 0;
    categoriesMap.set(op.categorie, current + Number(op.montant));
  });
  const depensesParCategorie = Array.from(categoriesMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Transform operations for OperationsTable
  const transformedOperations: OperationType[] = operations.map(op => ({
    id: op.id,
    candidat_id: op.candidat_id,
    mandataire_id: op.mandataire_id,
    type_operation: op.type_operation as 'depense' | 'recette',
    montant: Number(op.montant),
    statut_validation: op.statut_validation as 'en_attente' | 'validee' | 'rejetee',
    date: op.date,
    categorie: op.categorie,
    mode_paiement: op.mode_paiement,
    beneficiaire: op.beneficiaire,
    donateur_nom: op.donateur_nom,
    donateur_adresse: op.donateur_adresse,
    donateur_nationalite: op.donateur_nationalite,
    numero_recu: op.numero_recu,
    justificatif_url: op.justificatif_url,
    justificatif_nom: op.justificatif_nom,
    commentaire: op.commentaire,
    commentaire_comptable: op.commentaire_comptable,
    compte_comptable: op.compte_comptable,
    created_at: op.created_at,
    updated_at: op.updated_at
  }));

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <Link 
            to="/comptable/campagnes"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            Retour aux campagnes
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {candidat.prenom} {candidat.nom}
              </h1>
              <p className="text-muted-foreground">
                {campaign.nom} • {candidat.circonscription || 'Circonscription non définie'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleNewOperation}>
                <Plus size={16} className="mr-2" />
                Nouvelle opération
              </Button>
              {pendingOperations.length > 0 && (
                <Badge variant="outline" className="badge-pending">
                  {pendingOperations.length} en attente
                </Badge>
              )}
              {missingDocs > 0 && (
                <Badge variant="outline" className="badge-rejected">
                  {missingDocs} pièces manquantes
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard size={16} />
              <span className="hidden sm:inline">Tableau de bord</span>
              <span className="sm:hidden">TdB</span>
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex items-center gap-2">
              <FileText size={16} />
              Opérations
            </TabsTrigger>
            <TabsTrigger value="validation" className="flex items-center gap-2">
              <FileCheck size={16} />
              Validation
              {pendingOperations.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {pendingOperations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Dépenses"
                value={`${totalDepenses.toLocaleString('fr-FR')} €`}
                icon={<ArrowUpRight size={18} className="text-destructive" />}
              />
              <StatCard
                title="Total Recettes"
                value={`${totalRecettes.toLocaleString('fr-FR')} €`}
                icon={<ArrowDownLeft size={18} className="text-success" />}
              />
              <StatCard
                title="Budget Restant"
                value={`${depensesRestantes.toLocaleString('fr-FR')} €`}
                icon={<TrendingUp size={18} className="text-accent" />}
                variant={pourcentagePlafond >= 90 ? 'danger' : 'default'}
              />
              <StatCard
                title="Opérations"
                value={operations.length}
                icon={<Users size={18} className="text-primary" />}
              />
            </div>

            {/* Plafond Card */}
            <PlafondCard
              plafond={plafond}
              totalDepenses={totalDepenses}
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
                  {depensesParCategorie.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucune dépense validée</p>
                  ) : (
                    <div className="space-y-3">
                      {depensesParCategorie.map((cat, index) => (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground">{cat.name}</span>
                            <span className="font-medium">{cat.value.toLocaleString('fr-FR')} €</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ 
                                width: `${(cat.value / totalDepenses) * 100}%`,
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
                  <CardTitle className="text-lg">Évolution des opérations</CardTitle>
                </CardHeader>
                <CardContent>
                  {operations.filter(op => op.statut_validation === 'validee').length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucune donnée</p>
                  ) : (
                    <ExpenseChart 
                      operations={transformedOperations} 
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
                {operations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Aucune opération</p>
                ) : (
                  <div className="space-y-2">
                    {operations.slice(0, 5).map(op => (
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
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="operations" className="mt-6">
            <OperationsTable 
              operations={transformedOperations}
              showValidationActions={true}
              isComptable={true}
              onEdit={handleEditOperation}
              onDelete={handleDelete}
            />
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation" className="mt-6">
            <OperationsTable 
              operations={transformedOperations.filter(op => op.statut_validation === 'en_attente')}
              showValidationActions={true}
              isComptable={true}
              onValidate={handleValidate}
              onReject={handleReject}
              onDelete={handleDelete}
              onEdit={handleEditOperation}
            />
            {pendingOperations.length === 0 && (
              <div className="text-center py-12">
                <FileCheck className="w-12 h-12 mx-auto text-success/50 mb-4" />
                <p className="text-muted-foreground">Toutes les opérations ont été traitées</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Operation Form Modal */}
        <OperationFormModal
          open={operationModalOpen}
          onOpenChange={setOperationModalOpen}
          operation={selectedOperationForEdit}
          candidatId={candidatId!}
          onSuccess={handleOperationSuccess}
        />
      </div>
    </AppLayout>
  );
}
