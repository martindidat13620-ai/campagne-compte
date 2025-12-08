import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, variant = 'default', className }: StatCardProps) {
  const variantStyles = {
    default: 'bg-card border-border',
    primary: 'bg-primary text-primary-foreground border-primary',
    success: 'bg-success/10 border-success/20',
    warning: 'bg-warning/10 border-warning/20',
    danger: 'bg-destructive/10 border-destructive/20',
  };

  const valueStyles = {
    default: 'text-foreground',
    primary: 'text-primary-foreground',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive',
  };

  return (
    <div className={cn(
      "stat-card border transition-all hover:shadow-md",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between mb-2">
        <p className={cn(
          "text-sm font-medium",
          variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
        )}>
          {title}
        </p>
        {icon && (
          <div className={cn(
            "p-2 rounded-lg",
            variant === 'primary' ? 'bg-primary-foreground/20' : 'bg-secondary'
          )}>
            {icon}
          </div>
        )}
      </div>
      <p className={cn("text-2xl font-bold", valueStyles[variant])}>
        {value}
      </p>
      {subtitle && (
        <p className={cn(
          "text-sm mt-1",
          variant === 'primary' ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
