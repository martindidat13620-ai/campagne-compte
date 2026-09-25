import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, FileType, Folder, FolderOpen, ChevronRight, Wrench, FileSpreadsheet, Download, ExternalLink, GraduationCap, Bot } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import guideEntretien from '@/assets/guide_entretien.xlsx.asset.json';
import scoringRisque from '@/assets/scoring_risque.xlsm.asset.json';
import questionnaireIndependance from '@/assets/questionnaire_independance_v2.xlsx.asset.json';
import questionnaireLab from '@/assets/questionnaire_lab.xlsx.asset.json';
import grilleHonoraires from '@/assets/grille_honoraires.xlsx.asset.json';
import lettreMission from '@/assets/lettre_mission.docx.asset.json';
import workflowJalonnement from '@/assets/outil_11_workflow_jalonnement.xlsx.asset.json';
import fichesMemo from '@/assets/fiches_memo_depenses.pdf.asset.json';
import fichesMemoRecettes from '@/assets/fiches_memo_recettes.pdf.asset.json';
import fichesMemoEnveloppe from '@/assets/fiches_memo_enveloppe.pdf.asset.json';
import manuelProcedures from '@/assets/manuel_procedures_internes.pdf.asset.json';
import tableauBordSuivi from '@/assets/outil_12_tableau_bord_suivi_commercial.xlsx.asset.json';
import checklistFinMission from '@/assets/outil_13_checklist_fin_mission.xlsx.asset.json';

interface Dossier {
  id: string;
  titre: string;
  description: string;
  outils: { titre: string; description: string; fichier: string; nomFichier?: string; lien?: boolean }[];
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
      {
        titre: "4 : Questionnaire LAB comptes de campagne",
        description: 'Fichier Excel à télécharger',
        fichier: questionnaireLab.url,
        nomFichier: "Outil_4_Questionnaire_LAB.xlsx",
      },
      {
        titre: "5 : Grille d'honoraires interactive",
        description: 'Fichier Excel à télécharger',
        fichier: grilleHonoraires.url,
        nomFichier: "Outil_5_Grille_honoraires.xlsx",
      },
      {
        titre: "6 : Modèle de lettre de mission",
        description: 'Fichier Word à télécharger',
        fichier: lettreMission.url,
        nomFichier: "Outil_6_Lettre_de_mission.docx",
      },
    ],
  },
  {
    id: 'pendant-mission',
    titre: 'Pendant la mission',
    description: 'Outils à utiliser au cours de la mission',
    outils: [
      {
        titre: '7 : Manuel des procédures internes « spécial comptes de campagne »',
        description: 'Fichier PDF à télécharger',
        fichier: manuelProcedures.url,
        nomFichier: 'Outil_7_Manuel_procedures_internes.pdf',
      },
      {
        titre: '8 : E-learning à destination des collaborateurs pour les comptes de campagne',
        description: 'Lien vers le dossier Google Drive',
        fichier: 'https://drive.google.com/drive/folders/1n1Cz3QmeEAyJdA0AlPYN448s6WpVUdSG?usp=sharing',
        lien: true,
      },
      {
        titre: '9 : Fiches mémo « dépenses »',
        description: 'Fichier PDF à télécharger',
        fichier: fichesMemo.url,
        nomFichier: 'Outil_9_Fiches_memo_depenses.pdf',
      },
      {
        titre: '9 : Fiches mémo « recettes »',
        description: 'Fichier PDF à télécharger',
        fichier: fichesMemoRecettes.url,
        nomFichier: 'Outil_9_Fiches_memo_recettes.pdf',
      },
      {
        titre: '9 : Fiches mémo « enveloppe »',
        description: 'Fichier PDF à télécharger',
        fichier: fichesMemoEnveloppe.url,
        nomFichier: 'Outil_9_Fiches_memo_enveloppe.pdf',
      },
      {
        titre: '10 : Assistant IA conversationnel spécial compte de campagne',
        description: 'Lien vers l\'assistant IA (Gemini)',
        fichier: 'https://gemini.google.com/gem/a5d80097a6e8',
        lien: true,
      },
      {
        titre: '11 : Workflow de jalonnement et de vigilance de la mission',
        description: 'Fichier Excel à télécharger',
        fichier: workflowJalonnement.url,
        nomFichier: 'Outil_11_Workflow_de_jalonnement_et_de_vigilance_de_la_mission.xlsx',
      },
      {
        titre: '12 : Tableau de bord de suivi commercial',
        description: 'Fichier Excel à télécharger',
        fichier: tableauBordSuivi.url,
        nomFichier: 'Outil_12_Tableau_de_bord_de_suivi_commercial.xlsx',
      },
      {
        titre: '13 : Checklist de fin de mission interactive',
        description: 'Fichier Excel à télécharger',
        fichier: checklistFinMission.url,
        nomFichier: 'Outil_13_Checklist_de_fin_de_mission_interactive.xlsx',
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
                          <a key={o.titre} href={o.fichier} {...(o.lien ? { target: '_blank', rel: 'noopener noreferrer' } : { download: o.nomFichier })} className="flex items-center gap-3 border border-border rounded-lg p-3 hover:bg-muted/50">
                            {o.lien && o.fichier.includes('gemini.google.com') ? <Bot className="w-6 h-6 text-accent shrink-0" /> : o.lien ? <GraduationCap className="w-6 h-6 text-accent shrink-0" /> : o.nomFichier?.endsWith('.docx') ? <FileType className="w-6 h-6 text-primary shrink-0" /> : o.nomFichier?.endsWith('.pdf') ? <FileText className="w-6 h-6 text-destructive shrink-0" /> : <FileSpreadsheet className="w-6 h-6 text-success shrink-0" />}
                            <div className="flex-1">
                            <div className="font-medium">{o.titre}</div>
                            <div className="text-sm text-muted-foreground">{o.description}</div>
                            {o.lien && (
                              <div className="text-xs text-muted-foreground italic mt-1">
                                Si le lien ne s'ouvre pas : clic droit sur cette carte puis « Ouvrir le lien dans un nouvel onglet ».
                              </div>
                            )}
                            </div>
                            {o.lien ? <ExternalLink className="w-4 h-4 text-muted-foreground" /> : <Download className="w-4 h-4 text-muted-foreground" />}
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
