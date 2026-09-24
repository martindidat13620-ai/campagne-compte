import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, Loader2, Save } from 'lucide-react';

interface Op {
  id: string;
  type_operation: string;
  montant: number;
  date: string;
  statut_validation: string;
  categorie: string;
  beneficiaire?: string | null;
  donateur_nom?: string | null;
  donateur_prenom?: string | null;
  numero_releve_bancaire?: string | null;
  numero_cheque?: string | null;
}

const fmt = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

export function RapprochementBancaire({ candidatId, operations }: { candidatId: string; operations: Op[] }) {
  const { toast } = useToast();
  const [mois, setMois] = useState(() => new Date().toISOString().slice(0, 7));
  const [soldeDebut, setSoldeDebut] = useState('0');
  const [soldeFin, setSoldeFin] = useState('0');
  const [pointees, setPointees] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dejaPointees, setDejaPointees] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from('rapprochements_bancaires')
        .select('*')
        .eq('candidat_id', candidatId)
        .lte('mois', mois)
        .order('mois', { ascending: false });
      if (cancelled) return;
      const current = data?.find((r: any) => r.mois === mois);
      const previous = data?.find((r: any) => r.mois < mois);
      const prevPointed = new Set<string>();
      (data || []).filter((r: any) => r.mois < mois)
        .forEach((r: any) => (r.operations_pointees || []).forEach((id: string) => prevPointed.add(id)));
      setDejaPointees(prevPointed);
      if (current) {
        setSoldeDebut(String(current.solde_debut));
        setSoldeFin(String(current.solde_fin));
        setPointees(new Set(current.operations_pointees || []));
      } else {
        setSoldeDebut(previous ? String(previous.solde_fin) : '0');
        setSoldeFin('0');
        setPointees(new Set());
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [candidatId, mois]);

  // Opérations validées jusqu'à la fin du mois, non rapprochées sur un mois précédent
  const opsMois = useMemo(
    () => operations
      .filter(op => op.statut_validation === 'validee' && op.date && op.date.slice(0, 7) <= mois && !dejaPointees.has(op.id))
      .sort((a, b) => a.date.localeCompare(b.date)),
    [operations, mois, dejaPointees]
  );

  const debut = parseFloat(soldeDebut.replace(',', '.')) || 0;
  const fin = parseFloat(soldeFin.replace(',', '.')) || 0;
  const recettes = opsMois.filter(o => pointees.has(o.id) && o.type_operation === 'recette').reduce((s, o) => s + Number(o.montant), 0);
  const depenses = opsMois.filter(o => pointees.has(o.id) && o.type_operation === 'depense').reduce((s, o) => s + Number(o.montant), 0);
  const theorique = debut + recettes - depenses;
  const ecart = Math.round((fin - theorique) * 100) / 100;

  const toggle = (id: string) => {
    setPointees(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    setPointees(prev => prev.size === opsMois.length ? new Set() : new Set(opsMois.map(o => o.id)));
  };

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase as any).from('rapprochements_bancaires').upsert(
      { candidat_id: candidatId, mois, solde_debut: debut, solde_fin: fin, operations_pointees: Array.from(pointees) },
      { onConflict: 'candidat_id,mois' }
    );
    setSaving(false);
    toast(error
      ? { title: 'Erreur', description: "Impossible d'enregistrer le rapprochement", variant: 'destructive' }
      : { title: 'Rapprochement enregistré' });
  };

  const libelle = (o: Op) =>
    o.type_operation === 'recette'
      ? [o.donateur_prenom, o.donateur_nom].filter(Boolean).join(' ') || o.categorie
      : o.beneficiaire || o.categorie;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">Rapprochement bancaire</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>Mois</Label>
            <Input type="month" value={mois} onChange={e => e.target.value && setMois(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Solde de début (relevé)</Label>
            <Input type="number" step="0.01" value={soldeDebut} onChange={e => setSoldeDebut(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Solde de fin (relevé)</Label>
            <Input type="number" step="0.01" value={soldeFin} onChange={e => setSoldeFin(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Opérations validées du mois ({opsMois.length})</CardTitle>
          {opsMois.length > 0 && (
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {pointees.size === opsMois.length ? 'Tout décocher' : 'Tout cocher'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : opsMois.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune opération validée sur ce mois</p>
          ) : (
            <div className="divide-y divide-border">
              {opsMois.map(o => (
                <label key={o.id} className="flex items-center gap-3 py-2 cursor-pointer">
                  <Checkbox checked={pointees.has(o.id)} onCheckedChange={() => toggle(o.id)} />
                  <span className="w-24 text-sm text-muted-foreground">{new Date(o.date).toLocaleDateString('fr-FR')}</span>
                  <span className="flex-1 text-sm truncate">
                    {libelle(o)}
                    {o.numero_releve_bancaire && <span className="text-muted-foreground"> · Relevé {o.numero_releve_bancaire}</span>}
                    {o.numero_cheque && <span className="text-muted-foreground"> · Chèque {o.numero_cheque}</span>}
                  </span>
                  <span className={cn('text-sm font-medium', o.type_operation === 'recette' ? 'text-success' : 'text-destructive')}>
                    {o.type_operation === 'recette' ? '+' : '−'}{fmt(Number(o.montant))}
                  </span>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-2 text-sm">
          <div className="flex justify-between"><span>Solde de début</span><span>{fmt(debut)}</span></div>
          <div className="flex justify-between"><span>+ Recettes pointées</span><span className="text-success">{fmt(recettes)}</span></div>
          <div className="flex justify-between"><span>− Dépenses pointées</span><span className="text-destructive">{fmt(depenses)}</span></div>
          <div className="flex justify-between font-medium border-t border-border pt-2"><span>Solde théorique</span><span>{fmt(theorique)}</span></div>
          <div className="flex justify-between"><span>Solde de fin (relevé)</span><span>{fmt(fin)}</span></div>
          <div className={cn('flex items-center justify-between rounded-md p-3 mt-2 font-semibold',
            ecart === 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
            <span className="flex items-center gap-2">
              {ecart === 0 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {ecart === 0 ? 'Aucun écart' : 'Écart constaté'}
            </span>
            <span>{fmt(ecart)}</span>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
