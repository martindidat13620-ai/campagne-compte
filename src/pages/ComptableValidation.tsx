import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { OperationsTable } from '@/components/operations/OperationsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Operation } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Campaign {
  id: string;
  nom: string;
  annee: number;
}

interface Candidat {
  id: string;
  nom: string;
  prenom: string;
  campaign_id: string;
}

export default function ComptableValidation() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [candidats, setCandidats] = useState<Candidat[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedCandidat, setSelectedCandidat] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [operationsRes, campaignsRes, candidatsRes] = await Promise.all([
        supabase.from('operations').select('*').order('created_at', { ascending: false }),
        supabase.from('campaigns').select('id, nom, annee').order('annee', { ascending: false }),
        supabase.from('candidats').select('id, nom, prenom, campaign_id')
      ]);

      if (operationsRes.error) throw operationsRes.error;
      if (campaignsRes.error) throw campaignsRes.error;
      if (candidatsRes.error) throw candidatsRes.error;

      setOperations((operationsRes.data || []).map(op => ({
        ...op,
        type_operation: op.type_operation as 'recette' | 'depense',
        statut_validation: op.statut_validation as 'en_attente' | 'validee' | 'rejetee'
      })));
      setCampaigns(campaignsRes.data || []);
      setCandidats(candidatsRes.data || []);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter candidats based on selected campaign
  const filteredCandidats = selectedCampaign === 'all' 
    ? candidats 
    : candidats.filter(c => c.campaign_id === selectedCampaign);

  // Filter operations based on selected campaign and candidat
  const filteredOperations = operations.filter(op => {
    if (selectedCandidat !== 'all') {
      return op.candidat_id === selectedCandidat;
    }
    if (selectedCampaign !== 'all') {
      const campaignCandidatIds = candidats
        .filter(c => c.campaign_id === selectedCampaign)
        .map(c => c.id);
      return campaignCandidatIds.includes(op.candidat_id);
    }
    return true;
  });

  // Get candidat name for display
  const getCandidatName = (candidatId: string) => {
    const candidat = candidats.find(c => c.id === candidatId);
    return candidat ? `${candidat.prenom} ${candidat.nom}` : 'Inconnu';
  };

  const handleValidate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('operations')
        .update({ statut_validation: 'validee' })
        .eq('id', id);

      if (error) throw error;

      setOperations(ops => 
        ops.map(op => op.id === id ? { ...op, statut_validation: 'validee' as const } : op)
      );
      toast({
        title: "Opération validée",
        description: "L'opération a été validée avec succès"
      });
    } catch (error) {
      console.error('Erreur validation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de valider l'opération",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (id: string, comment: string) => {
    try {
      const { error } = await supabase
        .from('operations')
        .update({ 
          statut_validation: 'rejetee',
          commentaire_comptable: comment 
        })
        .eq('id', id);

      if (error) throw error;

      setOperations(ops => 
        ops.map(op => op.id === id ? { 
          ...op, 
          statut_validation: 'rejetee' as const,
          commentaire_comptable: comment 
        } : op)
      );
      toast({
        title: "Opération refusée",
        description: "L'opération a été refusée",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast({
        title: "Erreur",
        description: "Impossible de refuser l'opération",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('operations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOperations(ops => ops.filter(op => op.id !== id));
      toast({
        title: "Opération supprimée",
        description: "L'opération a été supprimée avec succès"
      });
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'opération",
        variant: "destructive"
      });
    }
  };

  // Reset candidat filter when campaign changes
  const handleCampaignChange = (value: string) => {
    setSelectedCampaign(value);
    setSelectedCandidat('all');
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <Link 
            to="/comptable" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            Retour aux campagnes
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Validation des opérations</h1>
          <p className="text-muted-foreground">
            Vérifiez et validez les opérations de toutes les campagnes
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-lg border border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter size={18} />
            <span className="font-medium">Filtrer par :</span>
          </div>
          
          <div className="flex-1 grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Campagne</Label>
              <Select value={selectedCampaign} onValueChange={handleCampaignChange}>
                <SelectTrigger>
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
            
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Candidat</Label>
              <Select value={selectedCandidat} onValueChange={setSelectedCandidat}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les candidats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les candidats</SelectItem>
                  {filteredCandidats.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.prenom} {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {filteredOperations.length} opération(s) trouvée(s)
        </div>

        <OperationsTable 
          operations={filteredOperations}
          showValidationActions={true}
          isComptable={true}
          onValidate={handleValidate}
          onReject={handleReject}
          onDelete={handleDelete}
        />
      </div>
    </AppLayout>
  );
}
