import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

interface MandataireInfo {
  id: string;
  nom: string;
  prenom: string;
}

export function useMandataireData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [candidat, setCandidat] = useState<CandidatInfo | null>(null);
  const [mandataire, setMandataire] = useState<MandataireInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Récupérer le mandataire lié à l'utilisateur
        const { data: mandataireData, error: mandataireError } = await supabase
          .from('mandataires')
          .select('id, nom, prenom')
          .eq('user_id', user.id)
          .maybeSingle();

        if (mandataireError) throw mandataireError;
        if (!mandataireData) {
          setError('Aucun mandataire trouvé pour cet utilisateur');
          setLoading(false);
          return;
        }

        setMandataire(mandataireData);

        // Récupérer le candidat lié au mandataire
        const { data: linkData, error: linkError } = await supabase
          .from('mandataire_candidats')
          .select('candidat_id')
          .eq('mandataire_id', mandataireData.id);

        if (linkError) throw linkError;
        if (!linkData || linkData.length === 0) {
          setError('Aucun candidat lié à ce mandataire');
          setLoading(false);
          return;
        }

        // Récupérer les infos du candidat avec sa campagne
        const { data: candidatData, error: candidatError } = await supabase
          .from('candidats')
          .select(`
            id,
            nom,
            prenom,
            plafond_depenses,
            campaigns:campaign_id(nom, type_election)
          `)
          .eq('id', linkData[0].candidat_id)
          .maybeSingle();

        if (candidatError) throw candidatError;
        if (!candidatData) {
          setError('Candidat non trouvé');
          setLoading(false);
          return;
        }

        setCandidat({
          id: candidatData.id,
          nom: candidatData.nom,
          prenom: candidatData.prenom,
          plafond_depenses: candidatData.plafond_depenses || 0,
          campaign: candidatData.campaigns as { nom: string; type_election: string }
        });

      } catch (err) {
        console.error('Erreur lors du chargement des données mandataire:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  return { loading, candidat, mandataire, error };
}
