import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { OperationsTable } from '@/components/operations/OperationsTable';
import { supabase } from '@/integrations/supabase/client';
import { useMandataireData } from '@/hooks/useMandataireData';
import { Operation } from '@/types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Historique() {
  const { mandataire, candidat, loading: mandataireLoading } = useMandataireData();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOperations = async () => {
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
  };

  useEffect(() => {
    if (!mandataireLoading) {
      fetchOperations();
    }
  }, [mandataire, mandataireLoading]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('operations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Opération supprimée');
      setOperations(ops => ops.filter(op => op.id !== id));
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      toast.error('Erreur lors de la suppression');
    }
  };

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
          <OperationsTable 
            operations={operations} 
            showDeleteAction={true}
            onDelete={handleDelete}
          />
        )}
      </div>
    </AppLayout>
  );
}
