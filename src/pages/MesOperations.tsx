import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, ArrowDownLeft, History } from 'lucide-react';
import { DepenseForm } from '@/components/forms/DepenseForm';
import { RecetteForm } from '@/components/forms/RecetteForm';
import { OperationsTable } from '@/components/operations/OperationsTable';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Operation } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function MesOperations() {
  const { user } = useAuth();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('depense');

  const fetchOperations = async () => {
    if (!user) return;

    try {
      // Get mandataire linked to current user
      const { data: mandataire, error: mandataireError } = await supabase
        .from('mandataires')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (mandataireError || !mandataire) {
        console.error('Error fetching mandataire:', mandataireError);
        setLoading(false);
        return;
      }

      // Fetch operations for this mandataire
      const { data: operationsData, error: operationsError } = await supabase
        .from('operations')
        .select('*')
        .eq('mandataire_id', mandataire.id)
        .order('date', { ascending: false });

      if (operationsError) {
        console.error('Error fetching operations:', operationsError);
      } else {
        setOperations(operationsData as Operation[] || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
  }, [user]);

  const handleFormSuccess = () => {
    fetchOperations();
    setActiveTab('historique');
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('operations')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchOperations();
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-12 w-full max-w-md" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mes opérations</h1>
          <p className="text-muted-foreground">
            Gérez vos dépenses, recettes et consultez l'historique
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="depense" className="flex items-center gap-2">
              <PlusCircle size={16} />
              <span className="hidden sm:inline">Dépense</span>
            </TabsTrigger>
            <TabsTrigger value="recette" className="flex items-center gap-2">
              <ArrowDownLeft size={16} />
              <span className="hidden sm:inline">Recette</span>
            </TabsTrigger>
            <TabsTrigger value="historique" className="flex items-center gap-2">
              <History size={16} />
              <span className="hidden sm:inline">Historique</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="depense" className="mt-6">
            <DepenseForm onSuccess={handleFormSuccess} />
          </TabsContent>

          <TabsContent value="recette" className="mt-6">
            <RecetteForm onSuccess={handleFormSuccess} />
          </TabsContent>

          <TabsContent value="historique" className="mt-6">
            <OperationsTable 
              operations={operations} 
              onDelete={handleDelete}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
