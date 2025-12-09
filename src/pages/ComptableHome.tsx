import { Link } from 'react-router-dom';
import { FolderOpen, Wrench, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';

export default function ComptableHome() {
  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center animate-fade-in">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Bienvenue dans votre espace
          </h1>
          <p className="text-muted-foreground text-lg">
            Que souhaitez-vous faire aujourd'hui ?
          </p>
        </div>

        {/* Main Cards */}
        <div className="grid gap-6 md:grid-cols-2 w-full max-w-3xl px-4">
          {/* Mes Comptes de Campagne */}
          <Link to="/comptable/campagnes" className="group">
            <Card className="h-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-primary/50 bg-gradient-to-br from-primary/5 to-transparent border-2">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <FolderOpen className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Mes Comptes de Campagne
                </h2>
                <p className="text-muted-foreground text-sm mb-4">
                  Accédez à vos dossiers de campagne, consultez les tableaux de bord et validez les opérations
                </p>
                <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                  Accéder
                  <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Ma Boîte à Outils */}
          <Link to="/comptable/outils" className="group">
            <Card className="h-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-accent/50 bg-gradient-to-br from-accent/5 to-transparent border-2">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                  <Wrench className="w-10 h-10 text-accent" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Ma Boîte à Outils
                </h2>
                <p className="text-muted-foreground text-sm mb-4">
                  Outils et ressources complémentaires pour faciliter votre gestion au quotidien
                </p>
                <div className="flex items-center gap-2 text-accent font-medium text-sm group-hover:gap-3 transition-all">
                  Explorer
                  <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
