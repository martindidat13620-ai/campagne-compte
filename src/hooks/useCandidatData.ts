import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CandidatInfo {
  id: string;
  nom: string;
  prenom: string;
  plafond_depenses: number;
  circonscription: string | null;
  campaign: {
    nom: string;
    type_election: string;
    annee: number;
  } | null;
}

interface Operation {
  id: string;
  type_operation: string;
  categorie: string;
  montant: number;
  date: string;
  beneficiaire: string | null;
  donateur_nom: string | null;
  statut_validation: string;
  mode_paiement: string;
  commentaire: string | null;
  justificatif_url: string | null;
  justificatif_nom: string | null;
}

export function useCandidatData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [candidat, setCandidat] = useState<CandidatInfo | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch candidat info for the logged-in user
        const { data: candidatData, error: candidatError } = await supabase
          .from('candidats')
          .select(`
            id,
            nom,
            prenom,
            plafond_depenses,
            circonscription,
            campaign:campaigns(nom, type_election, annee)
          `)
          .eq('user_id', user.id)
          .single();

        if (candidatError) {
          console.error('Erreur candidat:', candidatError);
          setError('Impossible de charger les données du candidat');
          setLoading(false);
          return;
        }

        setCandidat({
          ...candidatData,
          campaign: Array.isArray(candidatData.campaign) 
            ? candidatData.campaign[0] 
            : candidatData.campaign
        });

        // Fetch operations for this candidat
        const { data: operationsData, error: operationsError } = await supabase
          .from('operations')
          .select('*')
          .eq('candidat_id', candidatData.id)
          .order('date', { ascending: false });

        if (operationsError) {
          console.error('Erreur opérations:', operationsError);
          setError('Impossible de charger les opérations');
          setLoading(false);
          return;
        }

        setOperations(operationsData || []);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  // Calculate stats from operations
  const stats = {
    totalDepenses: operations
      .filter(op => op.type_operation === 'depense' && op.statut_validation === 'validee')
      .reduce((sum, op) => sum + Number(op.montant), 0),
    totalRecettes: operations
      .filter(op => op.type_operation === 'recette' && op.statut_validation === 'validee')
      .reduce((sum, op) => sum + Number(op.montant), 0),
    plafond: candidat?.plafond_depenses || 0,
    get depensesRestantes() {
      return this.plafond - this.totalDepenses;
    },
    get pourcentagePlafond() {
      return this.plafond > 0 ? Math.round((this.totalDepenses / this.plafond) * 100) : 0;
    }
  };

  return { loading, candidat, operations, stats, error };
}
