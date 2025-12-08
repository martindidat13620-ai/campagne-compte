import { AppLayout } from '@/components/layout/AppLayout';
import { OperationsTable } from '@/components/operations/OperationsTable';
import { getOperationsByMandataire } from '@/data/mockData';

export default function Historique() {
  // For demo, using default mandataireId
  const mandataireId = 'm1';
  const operations = getOperationsByMandataire(mandataireId);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Historique des opérations</h1>
          <p className="text-muted-foreground">
            Consultez et filtrez toutes vos dépenses et recettes
          </p>
        </div>

        <OperationsTable operations={operations} />
      </div>
    </AppLayout>
  );
}
