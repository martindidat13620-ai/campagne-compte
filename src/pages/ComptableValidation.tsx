import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { OperationsTable } from '@/components/operations/OperationsTable';
import { mockOperations } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ComptableValidation() {
  const [operations, setOperations] = useState(mockOperations);

  const handleValidate = (id: string) => {
    setOperations(ops => 
      ops.map(op => op.id === id ? { ...op, statutValidation: 'validee' as const } : op)
    );
    toast({
      title: "Opération validée",
      description: "L'opération a été validée avec succès"
    });
  };

  const handleReject = (id: string, comment: string) => {
    setOperations(ops => 
      ops.map(op => op.id === id ? { 
        ...op, 
        statutValidation: 'refusee' as const,
        commentaireComptable: comment 
      } : op)
    );
    toast({
      title: "Opération refusée",
      description: "L'opération a été refusée",
      variant: "destructive"
    });
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
