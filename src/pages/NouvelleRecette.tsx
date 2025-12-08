import { AppLayout } from '@/components/layout/AppLayout';
import { RecetteForm } from '@/components/forms/RecetteForm';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NouvelleRecette() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Retour au tableau de bord
        </Link>

        <div className="stat-card border border-border">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Nouvelle recette</h1>
            <p className="text-muted-foreground">
              Enregistrez un don ou une contribution de campagne
            </p>
          </div>

          <RecetteForm />
        </div>
      </div>
    </AppLayout>
  );
}
