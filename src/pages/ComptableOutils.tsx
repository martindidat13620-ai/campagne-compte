import { Link } from 'react-router-dom';
import { ArrowLeft, Wrench, Clock, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';

export default function ComptableOutils() {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <Link 
            to="/comptable"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            Retour à l'accueil
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Ma Boîte à Outils</h1>
          <p className="text-muted-foreground">
            Outils et ressources pour faciliter votre gestion
          </p>
        </div>

        {/* Coming Soon */}
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Wrench className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Bientôt disponible
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Nous travaillons sur de nouveaux outils pour vous aider dans votre gestion quotidienne. 
              Revenez bientôt pour découvrir les nouveautés !
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                En développement
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Nouvelles fonctionnalités à venir
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
