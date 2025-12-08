import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  label, 
  showPercentage = true,
  size = 'md',
  className 
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getVariant = () => {
    if (percentage >= 90) return 'danger';
    if (percentage >= 75) return 'warning';
    return 'default';
  };

  const variant = getVariant();

  const sizeStyles = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-foreground">{label}</span>}
          {showPercentage && (
            <span className={cn(
              "text-sm font-semibold",
              variant === 'danger' && 'text-destructive',
              variant === 'warning' && 'text-warning',
              variant === 'default' && 'text-foreground'
            )}>
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div className={cn("progress-bar-container", sizeStyles[size])}>
        <div 
          className={cn(
            "progress-bar-fill",
            variant === 'warning' && 'warning',
            variant === 'danger' && 'danger'
          )}
          style={{ 
            width: `${percentage}%`,
            '--progress-value': `${percentage}%`
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
