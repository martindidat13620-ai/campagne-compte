import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, Loader2, Save, Plus, History, Trash2 } from 'lucide-react';

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

interface Rappro {
  id: string;
  date_debut: string;
  date_fin: string;
  numero_releve: string | null;
  solde_debut: number;
  solde_fin: number;
  operations_pointees: string[];
  created_at: string;
  updated_at: string;
}

const fmt = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR');
const addDays = (d: string, n: number) => {
  const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10);
};

export function RapprochementBancaire({ candidatId, operations }: { candidatId: string; operations: Op[] }) {
  const { toast } = useToast();
  const [historique, setHistorique] = useState<Rappro[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [numeroReleve, setNumeroReleve] = useState('');
  const [soldeDebut, setSoldeDebut] = useState('0');
  const [soldeFin, setSoldeFin] = useState('0');
  const [pointees, setPointees] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await (supabase as any)
      .from('rapprochements_bancaires')
      .select('*')
      .eq('candidat_id', candidatId)
      .order('date_fin', { ascending: false });
    const list: Rappro[] = (data || []).filter((r: any) => r.date_fin);
    setHistorique(list);
    return list;
  };

  const startNew = (list: Rappro[]) => {
    const last = list[0];
    const today = new Date().toISOString().slice(0, 10);
    setEditingId(null);
    setDateDebut(last ? addDays(last.date_fin, 1) : today.slice(0, 8) + '01');
    setDateFin(today);
    setNumeroReleve('');
    setSoldeDebut(last ? String(last.solde_fin) : '0');
    setSoldeFin('0');
    setPointees(new Set());
  };

  const openRappro = (r: Rappro) => {
    setEditingId(r.id);
    setDateDebut(r.date_debut);
    setDateFin(r.date_fin);
    setNumeroReleve(r.numero_releve || '');
    setSoldeDebut(String(r.solde_debut));
    setSoldeFin(String(r.solde_fin));
    setPointees(new Set(r.operations_pointees || []));
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const list = await load();
      startNew(list);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidatId]);

  // Opérations déjà pointées dans un autre rapprochement
  const dejaPointees = useMemo(() => {
    const s = new Set<string>();
    historique.filter(r => r.id !== editingId).forEach(r => (r.operations_pointees || []).forEach(id => s.add(id)));
    return s;
  }, [historique, editingId]);

  const opsARapprocher = useMemo(
    () => operations
      .filter(op => op.statut_validation === 'validee' && op.date && (!dateFin || op.date <= dateFin) && !dejaPointees.has(op.id))
      .sort((a, b) => a.date.localeCompare(b.date)),
    [operations, dateFin, dejaPointees]
  );

  const debut = parseFloat(soldeDebut.replace(',', '.')) || 0;
  const fin = parseFloat(soldeFin.replace(',', '.')) || 0;
  const pointed = opsARapprocher.filter(o => pointees.has(o.id));
  const recettes = pointed.filter(o => o.type_operation === 'recette').reduce((s, o) => s + Number(o.montant), 0);
  const depenses = pointed.filter(o => o.type_operation === 'depense').reduce((s, o) => s + Number(o.montant), 0);
  const theorique = debut + recettes - depenses;
  const ecart = Math.round((fin - theorique) * 100) / 100;

  const toggle = (id: string) => setPointees(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const allChecked = opsARapprocher.length > 0 && pointed.length === opsARapprocher.length;
  const toggleAll = () => setPointees(allChecked ? new Set() : new Set(opsARapprocher.map(o => o.id)));

  const save = async () => {
    if (!dateDebut || !dateFin || dateFin < dateDebut) {
      toast({ title: 'Dates invalides', description: 'La date de fin doit être après la date de début', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      candidat_id: candidatId,
      date_debut: dateDebut,
      date_fin: dateFin,
      mois: dateFin.slice(0, 7),
      numero_releve: numeroReleve.trim() || null,
      solde_debut: debut,
      solde_fin: fin,
      operations_pointees: pointed.map(o => o.id),
    };
    const q = (supabase as any).from('rapprochements_bancaires');
    const { data, error } = editingId
      ? await q.update(payload).eq('id', editingId).select().single()
      : await q.insert(payload).select().single();
    setSaving(false);
    if (error) {
      toast({ title: 'Erreur', description: "Impossible d'enregistrer le rapprochement", variant: 'destructive' });
      return;
    }
    toast({ title: 'Rapprochement enregistré' });
    await load();
    if (data) setEditingId(data.id);
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce rapprochement ?')) return;
    const { error } = await (supabase as any).from('rapprochements_bancaires').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erreur', description: 'Suppression impossible', variant: 'destructive' });
      return;
    }
    const list = await load();
    if (editingId === id) startNew(list);
  };

  const ecartDe = (r: Rappro) => {
    const ids = new Set(r.operations_pointees || []);
    const total = operations.filter(o => ids.has(o.id))
      .reduce((s, o) => s + (o.type_operation === 'recette' ? 1 : -1) * Number(o.montant), 0);
    return Math.round((Number(r.solde_fin) - (Number(r.solde_debut) + total)) * 100) / 100;
  };

  const libelle = (o: Op) =>
    o.type_operation === 'recette'
      ? [o.donateur_prenom, o.donateur_nom].filter(Boolean).join(' ') || o.categorie
      : o.beneficiaire || o.categorie;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{editingId ? 'Rapprochement enregistré' : 'Nouveau rapprochement'}</CardTitle>
            {editingId && (
              <Button variant="outline" size="sm" onClick={() => startNew(historique)}>
                <Plus size={16} className="mr-1" /> Nouveau
              </Button>
            )}
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Du</Label>
              <Input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Au</Label>
              <Input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>N° de relevé</Label>
              <Input value={numeroReleve} onChange={e => setNumeroReleve(e.target.value)} placeholder="Ex : 07/2026" />
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
            <CardTitle className="text-base">Opérations à rapprocher ({opsARapprocher.length})</CardTitle>
            {opsARapprocher.length > 0 && (
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {allChecked ? 'Tout décocher' : 'Tout cocher'}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {opsARapprocher.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune opération validée à rapprocher</p>
            ) : (
              <div className="divide-y divide-border">
                {opsARapprocher.map(o => (
                  <label key={o.id} className="flex items-center gap-3 py-2 cursor-pointer">
                    <Checkbox checked={pointees.has(o.id)} onCheckedChange={() => toggle(o.id)} />
                    <span className="w-24 text-sm text-muted-foreground">{fmtDate(o.date)}</span>
                    <span className="flex-1 text-sm truncate">
                      {libelle(o)}
                      {o.numero_releve_bancaire && <span className="text-muted-foreground"> · Relevé {o.numero_releve_bancaire}</span>}
                      {o.numero_cheque && <span className="text-muted-foreground"> · Chèque {o.numero_cheque}</span>}
                      {dateDebut && o.date < dateDebut && <span className="ml-2 text-xs text-warning">(reporté)</span>}
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

      <Card className="h-fit">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><History size={16} /> Historique</CardTitle></CardHeader>
        <CardContent>
          {historique.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun rapprochement enregistré</p>
          ) : (
            <div className="space-y-2">
              {historique.map(r => {
                const e = ecartDe(r);
                return (
                  <div key={r.id}
                    className={cn('rounded-md border border-border p-3 text-sm cursor-pointer hover:bg-muted/50',
                      editingId === r.id && 'border-primary bg-muted/50')}
                    onClick={() => openRappro(r)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{fmtDate(r.date_debut)} → {fmtDate(r.date_fin)}</div>
                        {r.numero_releve && <div className="text-xs text-muted-foreground">Relevé {r.numero_releve}</div>}
                      </div>
                      <button className="text-muted-foreground hover:text-destructive"
                        onClick={ev => { ev.stopPropagation(); remove(r.id); }} aria-label="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                      <span className="text-muted-foreground">{(r.operations_pointees || []).length} opération(s) · solde {fmt(Number(r.solde_fin))}</span>
                      <span className={e === 0 ? 'text-success' : 'text-destructive'}>{e === 0 ? 'OK' : `Écart ${fmt(e)}`}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Enregistré le {new Date(r.updated_at).toLocaleString('fr-FR')}</div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
