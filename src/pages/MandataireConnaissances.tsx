import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function MandataireConnaissances() {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ma Base de Connaissance</h1>
          <p className="text-muted-foreground">
            Ressources et informations sur la gestion des comptes de campagne
          </p>
        </div>

        {/* Placeholder */}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Bientôt disponible
            </h2>
            <p className="text-muted-foreground max-w-md">
              Cette section contiendra des ressources pour vous aider dans la gestion 
              de votre compte de campagne : guides, FAQ, et assistant virtuel.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
