import { AppLayout } from '@/components/layout/AppLayout';
import { DepenseForm } from '@/components/forms/DepenseForm';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NouvelleDepense() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Link 
          to="/mandataire" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Retour au tableau de bord
        </Link>

        <div className="stat-card border border-border">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Nouvelle dépense</h1>
            <p className="text-muted-foreground">
              Enregistrez une dépense de campagne avec son justificatif
            </p>
          </div>

          <DepenseForm />
        </div>
      </div>
    </AppLayout>
  );
}
