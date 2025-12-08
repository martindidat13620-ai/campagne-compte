import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, TrendingUp, AlertTriangle, ChevronRight, FileCheck } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockMandataires, mockOperations, calculatePlafond } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function ComptableDashboard() {
  const totalCampagnes = mockMandataires.length;
  const totalOperations = mockOperations.length;
  const operationsEnAttente = mockOperations.filter(op => op.statutValidation === 'en_attente').length;
  const pieceManquantes = mockOperations.filter(op => op.type === 'depense' && !op.pieceJustificativeUrl).length;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Espace Expert-Comptable</h1>
            <p className="text-muted-foreground">
              Vue d'ensemble de toutes les campagnes
            </p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link to="/comptable/validation">
              <FileCheck size={18} className="mr-2" />
              Validation
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Campagnes actives"
            value={totalCampagnes}
            icon={<Building2 size={18} className="text-primary" />}
          />
          <StatCard
            title="Opérations totales"
            value={totalOperations}
            icon={<TrendingUp size={18} className="text-accent" />}
          />
          <StatCard
            title="En attente de validation"
            value={operationsEnAttente}
            icon={<Users size={18} className="text-warning" />}
            variant={operationsEnAttente > 0 ? 'warning' : 'default'}
          />
          <StatCard
            title="Pièces manquantes"
            value={pieceManquantes}
            icon={<AlertTriangle size={18} className="text-destructive" />}
            variant={pieceManquantes > 0 ? 'danger' : 'default'}
          />
        </div>

        {/* Campaigns List */}
        <div className="stat-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Liste des campagnes</h2>
          
          <div className="space-y-4">
            {mockMandataires.map((mandataire) => {
              const plafondData = calculatePlafond(mandataire.id);
              const mandataireOps = mockOperations.filter(op => op.mandataireId === mandataire.id);
              const pendingCount = mandataireOps.filter(op => op.statutValidation === 'en_attente').length;
              const missingDocs = mandataireOps.filter(op => op.type === 'depense' && !op.pieceJustificativeUrl).length;

              return (
                <div 
                  key={mandataire.id}
                  className="p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {mandataire.candidatNom}
                        </h3>
                        {pendingCount > 0 && (
                          <Badge variant="outline" className="badge-pending">
                            {pendingCount} en attente
                          </Badge>
                        )}
                        {missingDocs > 0 && (
                          <Badge variant="outline" className="badge-rejected">
                            {missingDocs} pièces manquantes
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {mandataire.circonscription} • {mandataire.typeElection} • 
                        Mandataire : {mandataire.prenom} {mandataire.nom}
                      </p>
                      
                      <ProgressBar 
                        value={plafondData.totalDepenses}
                        max={mandataire.plafondDepenses}
                        size="sm"
                        showPercentage={false}
                      />
                      <div className="flex justify-between mt-2 text-sm">
                        <span className="text-muted-foreground">
                          {plafondData.totalDepenses.toLocaleString('fr-FR')} € / {mandataire.plafondDepenses.toLocaleString('fr-FR')} €
                        </span>
                        <span className={cn(
                          "font-medium",
                          plafondData.pourcentagePlafond >= 90 ? 'text-destructive' :
                          plafondData.pourcentagePlafond >= 75 ? 'text-warning' : 'text-success'
                        )}>
                          {plafondData.pourcentagePlafond}%
                        </span>
                      </div>
                    </div>

                    <Button variant="ghost" className="self-end lg:self-center">
                      Détails
                      <ChevronRight size={16} className="ml-1" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
