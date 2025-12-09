import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CATEGORIES_RECETTES, 
  CATEGORIES_DEPENSES, 
  getCompteComptable, 
  getCompteComptableDepense 
} from '@/types';

interface Operation {
  id: string;
  candidat_id: string;
  mandataire_id: string;
  type_operation: string;
  montant: number;
  statut_validation: string;
  justificatif_url: string | null;
  justificatif_nom: string | null;
  date: string;
  categorie: string;
  mode_paiement: string;
  beneficiaire: string | null;
  donateur_nom: string | null;
  donateur_adresse: string | null;
  donateur_nationalite: string | null;
  numero_recu: string | null;
  commentaire: string | null;
  commentaire_comptable: string | null;
  compte_comptable: string | null;
}

interface OperationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation: Operation | null;
  candidatId: string;
  onSuccess: () => void;
}

export function OperationFormModal({
  open,
  onOpenChange,
  operation,
  candidatId,
  onSuccess,
}: OperationFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mandataires, setMandataires] = useState<{ id: string; nom: string; prenom: string }[]>([]);
  
  // Form state
  const [typeOperation, setTypeOperation] = useState<'depense' | 'recette'>('depense');
  const [montant, setMontant] = useState('');
  const [date, setDate] = useState('');
  const [categorie, setCategorie] = useState('');
  const [modePaiement, setModePaiement] = useState('');
  const [beneficiaire, setBeneficiaire] = useState('');
  const [donateurNom, setDonateurNom] = useState('');
  const [donateurAdresse, setDonateurAdresse] = useState('');
  const [donateurNationalite, setDonateurNationalite] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [mandataireId, setMandataireId] = useState('');
  const [statutValidation, setStatutValidation] = useState('en_attente');

  const isEditing = !!operation;

  // Fetch mandataires for this candidat
  useEffect(() => {
    const fetchMandataires = async () => {
      const { data } = await supabase
        .from('mandataire_candidats')
        .select('mandataire_id, mandataires!inner(id, nom, prenom)')
        .eq('candidat_id', candidatId);
      
      if (data) {
        setMandataires(data.map((d: any) => ({
          id: d.mandataires.id,
          nom: d.mandataires.nom,
          prenom: d.mandataires.prenom,
        })));
      }
    };
    
    if (open && candidatId) {
      fetchMandataires();
    }
  }, [open, candidatId]);

  // Populate form when editing
  useEffect(() => {
    if (operation) {
      setTypeOperation(operation.type_operation as 'depense' | 'recette');
      setMontant(operation.montant.toString());
      setDate(operation.date);
      setCategorie(operation.categorie);
      setModePaiement(operation.mode_paiement);
      setBeneficiaire(operation.beneficiaire || '');
      setDonateurNom(operation.donateur_nom || '');
      setDonateurAdresse(operation.donateur_adresse || '');
      setDonateurNationalite(operation.donateur_nationalite || '');
      setCommentaire(operation.commentaire || '');
      setMandataireId(operation.mandataire_id);
      setStatutValidation(operation.statut_validation);
    } else {
      // Reset form for new operation
      setTypeOperation('depense');
      setMontant('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategorie('');
      setModePaiement('');
      setBeneficiaire('');
      setDonateurNom('');
      setDonateurAdresse('');
      setDonateurNationalite('');
      setCommentaire('');
      setMandataireId('');
      setStatutValidation('validee'); // Comptable operations are validated by default
    }
  }, [operation, open]);

  const handleSubmit = async () => {
    if (!montant || !date || !categorie || !modePaiement || !mandataireId) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const compteComptable = typeOperation === 'recette' 
        ? getCompteComptable(categorie) 
        : getCompteComptableDepense(categorie);

      const operationData = {
        candidat_id: candidatId,
        mandataire_id: mandataireId,
        type_operation: typeOperation,
        montant: parseFloat(montant),
        date,
        categorie,
        mode_paiement: modePaiement,
        beneficiaire: typeOperation === 'depense' ? beneficiaire || null : null,
        donateur_nom: typeOperation === 'recette' ? donateurNom || null : null,
        donateur_adresse: typeOperation === 'recette' ? donateurAdresse || null : null,
        donateur_nationalite: typeOperation === 'recette' ? donateurNationalite || null : null,
        commentaire: commentaire || null,
        statut_validation: statutValidation,
        compte_comptable: compteComptable || null,
      };

      if (isEditing && operation) {
        const { error } = await supabase
          .from('operations')
          .update(operationData)
          .eq('id', operation.id);

        if (error) throw error;
        toast({ title: "Opération modifiée avec succès" });
      } else {
        const { error } = await supabase
          .from('operations')
          .insert(operationData);

        if (error) throw error;
        toast({ title: "Opération créée avec succès" });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving operation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder l'opération",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = typeOperation === 'recette' ? CATEGORIES_RECETTES : CATEGORIES_DEPENSES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier l\'opération' : 'Nouvelle opération'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type d'opération */}
          <div className="space-y-2">
            <Label>Type d'opération *</Label>
            <Select value={typeOperation} onValueChange={(v) => {
              setTypeOperation(v as 'depense' | 'recette');
              setCategorie('');
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="depense">Dépense</SelectItem>
                <SelectItem value="recette">Recette</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mandataire */}
          <div className="space-y-2">
            <Label>Mandataire *</Label>
            <Select value={mandataireId} onValueChange={setMandataireId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un mandataire" />
              </SelectTrigger>
              <SelectContent>
                {mandataires.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.prenom} {m.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Montant et Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Montant (€) *</Label>
              <Input
                type="number"
                step="0.01"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label>Catégorie *</Label>
            <Select value={categorie} onValueChange={setCategorie}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mode de paiement */}
          <div className="space-y-2">
            <Label>Mode de paiement *</Label>
            <Select value={modePaiement} onValueChange={setModePaiement}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="virement">Virement</SelectItem>
                <SelectItem value="cheque">Chèque</SelectItem>
                <SelectItem value="carte">Carte bancaire</SelectItem>
                <SelectItem value="especes">Espèces</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Champs spécifiques aux dépenses */}
          {typeOperation === 'depense' && (
            <div className="space-y-2">
              <Label>Bénéficiaire</Label>
              <Input
                value={beneficiaire}
                onChange={(e) => setBeneficiaire(e.target.value)}
                placeholder="Nom du bénéficiaire"
              />
            </div>
          )}

          {/* Champs spécifiques aux recettes */}
          {typeOperation === 'recette' && (
            <>
              <div className="space-y-2">
                <Label>Nom du donateur</Label>
                <Input
                  value={donateurNom}
                  onChange={(e) => setDonateurNom(e.target.value)}
                  placeholder="Nom du donateur"
                />
              </div>
              <div className="space-y-2">
                <Label>Adresse du donateur</Label>
                <Input
                  value={donateurAdresse}
                  onChange={(e) => setDonateurAdresse(e.target.value)}
                  placeholder="Adresse"
                />
              </div>
              <div className="space-y-2">
                <Label>Nationalité du donateur</Label>
                <Input
                  value={donateurNationalite}
                  onChange={(e) => setDonateurNationalite(e.target.value)}
                  placeholder="Nationalité"
                />
              </div>
            </>
          )}

          {/* Statut de validation */}
          <div className="space-y-2">
            <Label>Statut de validation</Label>
            <Select value={statutValidation} onValueChange={setStatutValidation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="validee">Validée</SelectItem>
                <SelectItem value="rejetee">Rejetée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Commentaire */}
          <div className="space-y-2">
            <Label>Commentaire</Label>
            <Textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Commentaire optionnel"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              isEditing ? 'Modifier' : 'Créer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
