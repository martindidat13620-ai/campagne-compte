import { TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { cn } from '@/lib/utils';

interface PlafondCardProps {
  totalDepenses: number;
  plafond: number;
  depensesRestantes: number;
}

export function PlafondCard({ totalDepenses, plafond, depensesRestantes }: PlafondCardProps) {
  const pourcentage = (totalDepenses / plafond) * 100;

  const getStatus = () => {
    if (pourcentage >= 90) return { 
      label: 'Attention : plafond presque atteint', 
      icon: AlertTriangle, 
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    };
    if (pourcentage >= 75) return { 
      label: 'Vigilance recommandée', 
      icon: TrendingUp, 
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    };
    return { 
      label: 'Budget maîtrisé', 
      icon: CheckCircle2, 
      color: 'text-success',
      bgColor: 'bg-success/10'
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <div className="stat-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Suivi du plafond</h3>
        <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium", status.bgColor, status.color)}>
          <StatusIcon size={16} />
          <span className="hidden sm:inline">{status.label}</span>
        </div>
      </div>

      <ProgressBar 
        value={totalDepenses} 
        max={plafond}
        size="lg"
        className="mb-6"
      />

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Dépensé</p>
          <p className="text-lg font-bold text-foreground">
            {totalDepenses.toLocaleString('fr-FR')} €
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Plafond légal</p>
          <p className="text-lg font-bold text-foreground">
            {plafond.toLocaleString('fr-FR')} €
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Restant</p>
          <p className={cn(
            "text-lg font-bold",
            depensesRestantes < 0 ? 'text-destructive' : 'text-success'
          )}>
            {depensesRestantes.toLocaleString('fr-FR')} €
          </p>
        </div>
      </div>
    </div>
  );
}
