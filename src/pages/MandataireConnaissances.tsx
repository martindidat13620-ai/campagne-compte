import { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, FileText, Download, Bot, ExternalLink } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import fichesMemoDepenses from '@/assets/fiches_memo_depenses.pdf.asset.json';
import fichesMemoRecettes from '@/assets/fiches_memo_recettes.pdf.asset.json';
import fichesMemoEnveloppe from '@/assets/fiches_memo_enveloppe.pdf.asset.json';

interface Dossier {
  id: string;
  titre: string;
  description: string;
  fichiers: { titre: string; description: string; fichier: string; nomFichier: string }[];
}

const DOSSIERS: Dossier[] = [
  {
    id: 'fiches-memo',
    titre: 'Fiches mémo',
    description: 'Mémos pratiques pour la gestion du compte de campagne',
    fichiers: [
      {
        titre: 'Fiches mémo « dépenses »',
        description: 'Fichier PDF à télécharger',
        fichier: fichesMemoDepenses.url,
        nomFichier: 'Fiches_memo_depenses.pdf',
      },
      {
        titre: 'Fiches mémo « recettes »',
        description: 'Fichier PDF à télécharger',
        fichier: fichesMemoRecettes.url,
        nomFichier: 'Fiches_memo_recettes.pdf',
      },
      {
        titre: 'Fiches mémo « enveloppe »',
        description: 'Fichier PDF à télécharger',
        fichier: fichesMemoEnveloppe.url,
        nomFichier: 'Fiches_memo_enveloppe.pdf',
      },
    ],
  },
];

const LIENS: { titre: string; description: string; url: string }[] = [
  {
    titre: 'Mon assistant comptes de campagne',
    description:
      "Assistant jurisprudentiel IA. Important : pensez à anonymiser toutes vos requêtes — ne saisissez jamais de noms, prénoms ou données personnelles identifiables.",
    url: 'https://gemini.google.com/gem/1Xa5kPkk95GDv-tUcKwVcPdnYwgv3VpDl?usp=sharing',
  },
];

export default function MandataireConnaissances() {
  const [ouvert, setOuvert] = useState<string | null>('fiches-memo');

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ma Base de Connaissance</h1>
          <p className="text-muted-foreground">
            Ressources et informations sur la gestion des comptes de campagne
          </p>
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
                      {d.description} · {d.fichiers.length} fichier(s)
                    </div>
                  </div>
                  <ChevronRight className={cn('text-muted-foreground transition-transform', isOpen && 'rotate-90')} />
                </button>
                {isOpen && (
                  <CardContent className="pt-0">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {d.fichiers.map(f => (
                        <a
                          key={f.titre}
                          href={f.fichier}
                          download={f.nomFichier}
                          className="flex items-center gap-3 border border-border rounded-lg p-3 hover:bg-muted/50"
                        >
                          <FileText className="w-6 h-6 text-destructive shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium">{f.titre}</div>
                            <div className="text-sm text-muted-foreground">{f.description}</div>
                          </div>
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </a>
                      ))}
                    </div>
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
