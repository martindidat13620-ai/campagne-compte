import { BookOpen, GraduationCap, FileText, Video } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MandataireConnaissances() {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ma Base de Connaissance</h1>
          <p className="text-muted-foreground">
            Formations et ressources pour vous accompagner
          </p>
        </div>

        {/* Coming Soon Message */}
        <Card className="border-2 border-dashed border-muted-foreground/30">
          <CardContent className="p-12 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Bientôt disponible
            </h2>
            <p className="text-muted-foreground max-w-md">
              Cette section sera bientôt enrichie avec des formations, guides pratiques et ressources 
              pour vous accompagner dans votre mission de mandataire financier.
            </p>
          </CardContent>
        </Card>

        {/* Preview of future content */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="opacity-60">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-base">Formations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Modules de formation sur la gestion des comptes de campagne
              </p>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <CardTitle className="text-base">Guides pratiques</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Documentation et tutoriels pour vos tâches quotidiennes
              </p>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mb-2">
                <Video className="w-5 h-5 text-success" />
              </div>
              <CardTitle className="text-base">Vidéos tutorielles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Vidéos explicatives pour maîtriser l'application
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
