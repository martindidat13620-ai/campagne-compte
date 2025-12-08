import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { Operation } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface RecentOperationsProps {
  operations: Operation[];
  limit?: number;
  showViewAll?: boolean;
}

export function RecentOperations({ operations, limit = 5, showViewAll = true }: RecentOperationsProps) {
  const recentOps = operations
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validee':
        return (
          <Badge variant="outline" className="badge-validated gap-1">
            <CheckCircle2 size={12} />
            Validée
          </Badge>
        );
      case 'refusee':
        return (
          <Badge variant="outline" className="badge-rejected gap-1">
            <XCircle size={12} />
            Refusée
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="badge-pending gap-1">
            <Clock size={12} />
            En attente
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short'
    });
  };

  return (
    <div className="stat-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Opérations récentes</h3>
        {showViewAll && (
          <Link 
            to="/historique"
            className="text-sm text-accent hover:underline flex items-center gap-1"
          >
            Voir tout
            <ChevronRight size={16} />
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {recentOps.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Aucune opération enregistrée
          </p>
        ) : (
          recentOps.map((op) => (
            <div 
              key={op.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className={cn(
                "p-2 rounded-lg",
                op.type === 'depense' ? 'bg-destructive/10' : 'bg-success/10'
              )}>
                {op.type === 'depense' ? (
                  <ArrowUpRight size={18} className="text-destructive" />
                ) : (
                  <ArrowDownLeft size={18} className="text-success" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {op.beneficiaire || op.donateurNom || op.categorie}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(op.date)} • {op.categorie}
                </p>
              </div>

              <div className="text-right">
                <p className={cn(
                  "font-semibold",
                  op.type === 'depense' ? 'text-destructive' : 'text-success'
                )}>
                  {op.type === 'depense' ? '-' : '+'}{op.montant.toLocaleString('fr-FR')} €
                </p>
                <div className="mt-1">
                  {getStatusBadge(op.statutValidation)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
