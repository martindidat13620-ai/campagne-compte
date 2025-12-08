import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { OperationsTable } from '@/components/operations/OperationsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Operation } from '@/types';

export default function ComptableValidation() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    try {
      const { data, error } = await supabase
        .from('operations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOperations(data.map(op => ({
        ...op,
        type_operation: op.type_operation as 'recette' | 'depense',
        statut_validation: op.statut_validation as 'en_attente' | 'validee' | 'rejetee'
      })));
    } catch (error) {
      console.error('Erreur chargement opérations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les opérations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

        <OperationsTable 
          operations={operations}
          showValidationActions={true}
          onValidate={handleValidate}
          onReject={handleReject}
        />
      </div>
    </AppLayout>
  );
}
