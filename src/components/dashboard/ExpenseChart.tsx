import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Operation } from '@/types';

interface ExpenseChartProps {
  operations: Operation[];
  type: 'bar' | 'pie';
}

const COLORS = [
  'hsl(220, 60%, 22%)',
  'hsl(165, 60%, 40%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 60%, 50%)',
  'hsl(200, 70%, 50%)',
  'hsl(340, 70%, 50%)',
  'hsl(100, 60%, 45%)',
  'hsl(30, 80%, 55%)',
];

export function ExpenseChart({ operations, type }: ExpenseChartProps) {
  const depenses = operations.filter(op => op.type === 'depense' && op.statutValidation === 'validee');

  const barData = useMemo(() => {
    const grouped: Record<string, number> = {};
    depenses.forEach(op => {
      const month = new Date(op.date).toLocaleDateString('fr-FR', { month: 'short' });
      grouped[month] = (grouped[month] || 0) + op.montant;
    });
    return Object.entries(grouped).map(([month, montant]) => ({ month, montant }));
  }, [depenses]);

  const pieData = useMemo(() => {
    const grouped: Record<string, number> = {};
    depenses.forEach(op => {
      grouped[op.categorie] = (grouped[op.categorie] || 0) + op.montant;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [depenses]);

  if (type === 'bar') {
    return (
      <div className="stat-card border border-border">
        <h3 className="font-semibold text-foreground mb-4">Dépenses par mois</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)'
                }}
                formatter={(value: number) => [`${value.toLocaleString('fr-FR')} €`, 'Dépenses']}
              />
              <Bar 
                dataKey="montant" 
                fill="hsl(220, 60%, 22%)" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card border border-border">
      <h3 className="font-semibold text-foreground mb-4">Répartition par catégorie</h3>
      <div className="h-64 flex items-center">
        <ResponsiveContainer width="60%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: number) => [`${value.toLocaleString('fr-FR')} €`]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2 overflow-auto max-h-64">
          {pieData.slice(0, 6).map((item, index) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-muted-foreground truncate">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
