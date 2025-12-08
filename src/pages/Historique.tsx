import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { OperationsTable } from '@/components/operations/OperationsTable';
import { supabase } from '@/integrations/supabase/client';
import { useMandataireData } from '@/hooks/useMandataireData';
import { Operation } from '@/types';
import { Loader2 } from 'lucide-react';

export default function Historique() {
  const { mandataire, candidat, loading: mandataireLoading } = useMandataireData();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOperations() {
      if (!mandataire) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('operations')
          .select('*')
          .eq('mandataire_id', mandataire.id)
          .order('date', { ascending: false });

        if (error) throw error;

        setOperations(data as Operation[] || []);
      } catch (err) {
        console.error('Erreur lors du chargement des opérations:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!mandataireLoading) {
      fetchOperations();
    }
  }, [mandataire, mandataireLoading]);

  const isLoading = mandataireLoading || loading;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Historique des opérations</h1>
          <p className="text-muted-foreground">
            Consultez et filtrez toutes vos dépenses et recettes
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : operations.length === 0 ? (
          <div className="text-center p-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">Aucune opération enregistrée</p>
            <p className="text-sm text-muted-foreground mt-1">
              Commencez par ajouter une dépense ou une recette
            </p>
          </div>
        ) : (
          <OperationsTable operations={operations} />
        )}
      </div>
    </AppLayout>
  );
}
