import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Folder, FolderOpen, ChevronRight, Wrench, FileSpreadsheet, Download } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import guideEntretien from '@/assets/guide_entretien.xlsx.asset.json';
import scoringRisque from '@/assets/scoring_risque.xlsm.asset.json';
import questionnaireIndependance from '@/assets/questionnaire_independance.xlsx.asset.json';

interface Dossier {
  id: string;
  titre: string;
  description: string;
  outils: { titre: string; description: string; fichier: string; nomFichier: string }[];
}

const DOSSIERS: Dossier[] = [
  {
    id: 'avant-mission',
    titre: "Avant l'entrée en mission",
    description: 'Outils à utiliser avant d’accepter et de démarrer une mission',
    outils: [
      {
        titre: "1 : Le guide d'entretien et prise de connaissance",
        description: 'Fichier Excel à télécharger',
        fichier: guideEntretien.url,
        nomFichier: "Outil_1_Guide_entretien.xlsx",
      },
      {
        titre: "2 : Scoring du risque et aide à la décision",
        description: 'Fichier Excel avec macros à télécharger',
        fichier: scoringRisque.url,
        nomFichier: "Outil_2_Scoring_du_risque.xlsm",
      },
      {
        titre: "3 : Questionnaire d'indépendance",
        description: 'Fichier Excel à télécharger',
        fichier: questionnaireIndependance.url,
        nomFichier: "Outil_3_Questionnaire_independance.xlsx",
      },
    ],
  },
];

export default function ComptableOutils() {
  const [ouvert, setOuvert] = useState<string | null>(null);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <Link
            to="/comptable"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            Retour à l'accueil
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Ma Boîte à Outils</h1>
          <p className="text-muted-foreground">Outils et ressources pour faciliter votre gestion</p>
        </div>

        <div className="space-y-3">
          {DOSSIERS.map(d => {
            const isOpen = ouvert === d.id;
            return (
              <Card key={d.id}>
                <button
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/50 transition-colors rounded-lg"
                  onClick={() => setOuvert(isOpen ? null : d.id)}
                >
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    {isOpen ? <FolderOpen className="w-6 h-6 text-accent" /> : <Folder className="w-6 h-6 text-accent" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{d.titre}</div>
                    <div className="text-sm text-muted-foreground">
                      {d.description} · {d.outils.length} outil(s)
                    </div>
                  </div>
                  <ChevronRight className={cn('text-muted-foreground transition-transform', isOpen && 'rotate-90')} />
                </button>
                {isOpen && (
                  <CardContent className="pt-0">
                    {d.outils.length === 0 ? (
                      <div className="border border-dashed border-border rounded-lg py-10 text-center text-muted-foreground">
                        <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        Aucun outil pour le moment
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {d.outils.map(o => (
                          <a key={o.titre} href={o.fichier} download={o.nomFichier} className="flex items-center gap-3 border border-border rounded-lg p-3 hover:bg-muted/50">
                            <FileSpreadsheet className="w-6 h-6 text-success shrink-0" />
                            <div className="flex-1">
                            <div className="font-medium">{o.titre}</div>
                            <div className="text-sm text-muted-foreground">{o.description}</div>
                            </div>
                            <Download className="w-4 h-4 text-muted-foreground" />
                          </a>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
