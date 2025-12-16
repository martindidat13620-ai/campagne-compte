import { AppLayout } from '@/components/layout/AppLayout';
import MandataireChat from '@/components/chat/MandataireChat';

export default function MandataireConnaissances() {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ma Base de Connaissance</h1>
          <p className="text-muted-foreground">
            Posez vos questions sur la gestion des comptes de campagne
          </p>
        </div>

        {/* Chat Interface */}
        <MandataireChat />
      </div>
    </AppLayout>
  );
}
