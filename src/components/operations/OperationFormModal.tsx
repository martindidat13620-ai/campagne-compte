import { useState, useEffect } from 'react';
import { Loader2, Upload, X, FileText, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { 
  CATEGORIES_RECETTES, 
  CATEGORIES_DEPENSES,
  MODES_PAIEMENT,
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
  donateur_prenom: string | null;
  donateur_adresse: string | null;
  donateur_code_postal: string | null;
  donateur_ville: string | null;
  donateur_pays: string | null;
  donateur_nationalite: string | null;
  numero_recu: string | null;
  numero_releve_bancaire: string | null;
  is_collecte: boolean | null;
  collecte_date: string | null;
  collecte_organisation: string | null;
  // Champs parti politique
  parti_nom: string | null;
  parti_adresse: string | null;
  parti_code_postal: string | null;
  parti_ville: string | null;
  parti_siret: string | null;
  parti_rna: string | null;
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
  campaignDates?: {
    date_debut: string | null;
    date_fin: string | null;
  };
}

export function OperationFormModal({
  open,
  onOpenChange,
  operation,
  candidatId,
  onSuccess,
  campaignDates,
}: OperationFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mandataires, setMandataires] = useState<{ id: string; nom: string; prenom: string }[]>([]);
  const [justificatif, setJustificatif] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form state
  const [typeOperation, setTypeOperation] = useState<'depense' | 'recette'>('depense');
  const [montant, setMontant] = useState('');
  const [date, setDate] = useState('');
  const [categorie, setCategorie] = useState('');
  const [modePaiement, setModePaiement] = useState('');
  const [numeroReleveBancaire, setNumeroReleveBancaire] = useState('');
  const [beneficiaire, setBeneficiaire] = useState('');
  // Donateur fields
  const [donateurNom, setDonateurNom] = useState('');
  const [donateurPrenom, setDonateurPrenom] = useState('');
  const [donateurAdresse, setDonateurAdresse] = useState('');
  const [donateurCodePostal, setDonateurCodePostal] = useState('');
  const [donateurVille, setDonateurVille] = useState('');
  const [donateurPays, setDonateurPays] = useState('France');
  const [donateurNationalite, setDonateurNationalite] = useState('Française');
  const [numeroRecu, setNumeroRecu] = useState('');
  // Collecte fields
  const [isCollecte, setIsCollecte] = useState(false);
  const [collecteDate, setCollecteDate] = useState('');
  const [collecteOrganisation, setCollecteOrganisation] = useState('');
  // Parti politique fields
  const [partiNom, setPartiNom] = useState('');
  const [partiAdresse, setPartiAdresse] = useState('');
  const [partiCodePostal, setPartiCodePostal] = useState('');
  const [partiVille, setPartiVille] = useState('');
  const [partiSiret, setPartiSiret] = useState('');
  const [partiRna, setPartiRna] = useState('');
  // Other fields
  const [commentaire, setCommentaire] = useState('');
  const [mandataireId, setMandataireId] = useState('');
  const [statutValidation, setStatutValidation] = useState('en_attente');

  const isEditing = !!operation;
  
  // Computed values for conditional rendering
  const isDon = categorie === 'dons';
  const isVersementCandidat = categorie === 'versements_personnels';
  const isVersementParti = categorie === 'versements_formations_politiques';
  const isDepense = typeOperation === 'depense';
  const montantNum = parseFloat(montant) || 0;
  const isEspeces = modePaiement === 'especes';
  const donEspecesSuperieur150 = isDon && isEspeces && montantNum > 150;
  const donSuperieur3000 = isDon && montantNum > 3000;
  const versementCandidatSuperieur10000 = isVersementCandidat && montantNum > 10000;

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

  // Reset specific fields when category changes
  useEffect(() => {
    if (!isDon) {
      setDonateurNom('');
      setDonateurPrenom('');
      setDonateurNationalite('Française');
      setDonateurAdresse('');
      setDonateurCodePostal('');
      setDonateurVille('');
      setDonateurPays('France');
      setNumeroRecu('');
      setIsCollecte(false);
      setCollecteDate('');
      setCollecteOrganisation('');
    }
  }, [isDon]);

  // Populate form when editing
  useEffect(() => {
    if (operation) {
      setTypeOperation(operation.type_operation as 'depense' | 'recette');
      setMontant(operation.montant.toString());
      setDate(operation.date);
      setCategorie(operation.categorie);
      setModePaiement(operation.mode_paiement);
      setNumeroReleveBancaire(operation.numero_releve_bancaire || '');
      setBeneficiaire(operation.beneficiaire || '');
      setDonateurNom(operation.donateur_nom || '');
      setDonateurPrenom(operation.donateur_prenom || '');
      setDonateurAdresse(operation.donateur_adresse || '');
      setDonateurCodePostal(operation.donateur_code_postal || '');
      setDonateurVille(operation.donateur_ville || '');
      setDonateurPays(operation.donateur_pays || 'France');
      setDonateurNationalite(operation.donateur_nationalite || 'Française');
      setNumeroRecu(operation.numero_recu || '');
      setIsCollecte(operation.is_collecte || false);
      setCollecteDate(operation.collecte_date || '');
      setCollecteOrganisation(operation.collecte_organisation || '');
      setPartiNom(operation.parti_nom || '');
      setPartiAdresse(operation.parti_adresse || '');
      setPartiCodePostal(operation.parti_code_postal || '');
      setPartiVille(operation.parti_ville || '');
      setPartiSiret(operation.parti_siret || '');
      setPartiRna(operation.parti_rna || '');
      setCommentaire(operation.commentaire || '');
      setMandataireId(operation.mandataire_id);
      setStatutValidation(operation.statut_validation);
      setJustificatif(null);
    } else {
      // Reset form for new operation
      setTypeOperation('depense');
      setMontant('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategorie('');
      setModePaiement('');
      setNumeroReleveBancaire('');
      setBeneficiaire('');
      setDonateurNom('');
      setDonateurPrenom('');
      setDonateurAdresse('');
      setDonateurCodePostal('');
      setDonateurVille('');
      setDonateurPays('France');
      setDonateurNationalite('Française');
      setNumeroRecu('');
      setIsCollecte(false);
      setCollecteDate('');
      setCollecteOrganisation('');
      setPartiNom('');
      setPartiAdresse('');
      setPartiCodePostal('');
      setPartiVille('');
      setPartiSiret('');
      setPartiRna('');
      setCommentaire('');
      setMandataireId('');
      setStatutValidation('validee');
      setJustificatif(null);
      setErrors({});
    }
  }, [operation, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "Le fichier ne doit pas dépasser 10 Mo",
          variant: "destructive"
        });
        return;
      }
      setJustificatif(file);
      setErrors(prev => ({ ...prev, justificatif: '' }));
    }
  };

  const removeFile = () => {
    setJustificatif(null);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!montant || montantNum <= 0) newErrors.montant = 'Montant invalide';
    if (!date) newErrors.date = 'La date est obligatoire';
    
    // Validation des dates de campagne
    if (date && campaignDates) {
      const operationDate = new Date(date);
      const dateDebut = campaignDates.date_debut ? new Date(campaignDates.date_debut) : null;
      const dateFin = campaignDates.date_fin ? new Date(campaignDates.date_fin) : null;
      
      if (dateDebut && operationDate < dateDebut) {
        newErrors.date = `La date doit être après le début de la campagne (${dateDebut.toLocaleDateString('fr-FR')})`;
      }
      if (dateFin && operationDate > dateFin) {
        newErrors.date = `La date doit être avant la fin de la campagne (${dateFin.toLocaleDateString('fr-FR')})`;
      }
    }
    
    if (!categorie) newErrors.categorie = 'La catégorie est obligatoire';
    if (!modePaiement) newErrors.modePaiement = 'Le mode de paiement est obligatoire';
    if (!mandataireId) newErrors.mandataireId = 'Le mandataire est obligatoire';

    // Dépense specific
    if (isDepense) {
      if (!beneficiaire.trim()) newErrors.beneficiaire = 'Le bénéficiaire est obligatoire';
      // Justificatif obligatoire pour dépenses (sauf si modification avec justificatif existant)
      if (!justificatif && !operation?.justificatif_url) {
        newErrors.justificatif = 'Le justificatif est obligatoire';
      }
    }

    // Recette specific
    if (!isDepense) {
      if (!numeroReleveBancaire.trim()) {
        newErrors.numeroReleveBancaire = 'Le numéro du relevé bancaire est obligatoire';
      }

      // Don > 150€ en espèces
      if (donEspecesSuperieur150) {
        newErrors.modePaiement = 'Les dons supérieurs à 150 € ne peuvent pas être en espèces';
      }

      // Validations spécifiques aux dons
      if (isDon) {
        if (isCollecte) {
          if (!collecteDate) newErrors.collecteDate = 'La date de collecte est obligatoire';
          if (!collecteOrganisation.trim()) newErrors.collecteOrganisation = "Le mode d'organisation est obligatoire";
        } else {
          if (!donateurNom.trim()) newErrors.donateurNom = 'Le nom est obligatoire';
          if (!donateurPrenom.trim()) newErrors.donateurPrenom = 'Le prénom est obligatoire';
          if (!donateurNationalite) newErrors.donateurNationalite = 'La nationalité est obligatoire';
          if (!donateurAdresse.trim()) newErrors.donateurAdresse = "L'adresse est obligatoire";
          if (!donateurCodePostal.trim()) newErrors.donateurCodePostal = 'Le code postal est obligatoire';
          if (!donateurVille.trim()) newErrors.donateurVille = 'La ville est obligatoire';
          if (!donateurPays.trim()) newErrors.donateurPays = 'Le pays est obligatoire';
          if (!numeroRecu.trim()) newErrors.numeroRecu = 'Le numéro de reçu don est obligatoire';
        }
      }

      // Versement candidat: justificatif obligatoire (sauf si modification avec justificatif existant)
      if (isVersementCandidat && !justificatif && !operation?.justificatif_url) {
        newErrors.justificatif = 'Le justificatif est obligatoire';
      }

      // Validations spécifiques aux versements des partis politiques
      if (isVersementParti) {
        if (!partiNom.trim()) newErrors.partiNom = 'Le nom du parti est obligatoire';
        if (!partiAdresse.trim()) newErrors.partiAdresse = "L'adresse est obligatoire";
        if (!partiCodePostal.trim()) newErrors.partiCodePostal = 'Le code postal est obligatoire';
        if (!partiVille.trim()) newErrors.partiVille = 'La ville est obligatoire';
        if (!partiSiret.trim()) newErrors.partiSiret = 'Le SIRET est obligatoire';
        if (!partiRna.trim()) {
          newErrors.partiRna = 'Le numéro RNA est obligatoire';
        } else if (!partiRna.trim().toUpperCase().startsWith('W')) {
          newErrors.partiRna = 'Le numéro RNA doit commencer par W';
        }
        if (!justificatif && !operation?.justificatif_url) {
          newErrors.justificatif = 'Le justificatif est obligatoire';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast({
        title: "Formulaire incomplet",
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

      let justificatifUrl = operation?.justificatif_url || null;
      let justificatifNom = operation?.justificatif_nom || null;

      // Upload justificatif if provided
      if (justificatif) {
        const fileExt = justificatif.name.split('.').pop();
        const fileName = `${mandataireId}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('justificatifs')
          .upload(fileName, justificatif);

        if (uploadError) {
          console.error('Erreur upload:', uploadError);
          throw new Error("Impossible d'uploader le justificatif");
        }

        justificatifUrl = uploadData.path;
        justificatifNom = justificatif.name;
      }

      // Construction de l'adresse complète pour les dons
      const adresseComplete = !isCollecte && isDon && !isDepense
        ? `${donateurAdresse}, ${donateurCodePostal} ${donateurVille}, ${donateurPays}`
        : null;

      const operationData = {
        candidat_id: candidatId,
        mandataire_id: mandataireId,
        type_operation: typeOperation,
        montant: montantNum,
        date,
        categorie,
        mode_paiement: modePaiement,
        numero_releve_bancaire: !isDepense ? numeroReleveBancaire.trim() || null : null,
        beneficiaire: isDepense ? beneficiaire.trim() || null : null,
        // Donateur fields (only for dons non-collecte)
        donateur_nom: !isCollecte && isDon && !isDepense ? donateurNom.trim() : null,
        donateur_prenom: !isCollecte && isDon && !isDepense ? donateurPrenom.trim() : null,
        donateur_nationalite: !isCollecte && isDon && !isDepense ? donateurNationalite : null,
        donateur_adresse: adresseComplete,
        donateur_code_postal: !isCollecte && isDon && !isDepense ? donateurCodePostal.trim() : null,
        donateur_ville: !isCollecte && isDon && !isDepense ? donateurVille.trim() : null,
        donateur_pays: !isCollecte && isDon && !isDepense ? donateurPays.trim() : null,
        numero_recu: !isCollecte && isDon && !isDepense ? numeroRecu.trim() : null,
        // Collecte fields
        is_collecte: isDon && !isDepense ? isCollecte : false,
        collecte_date: isCollecte && isDon && !isDepense ? collecteDate : null,
        collecte_organisation: isCollecte && isDon && !isDepense ? collecteOrganisation.trim() : null,
        // Parti politique fields
        parti_nom: isVersementParti && !isDepense ? partiNom.trim() : null,
        parti_adresse: isVersementParti && !isDepense ? partiAdresse.trim() : null,
        parti_code_postal: isVersementParti && !isDepense ? partiCodePostal.trim() : null,
        parti_ville: isVersementParti && !isDepense ? partiVille.trim() : null,
        parti_siret: isVersementParti && !isDepense ? partiSiret.trim() : null,
        parti_rna: isVersementParti && !isDepense ? partiRna.trim().toUpperCase() : null,
        // Justificatif
        justificatif_url: justificatifUrl,
        justificatif_nom: justificatifNom,
        // Other
        commentaire: commentaire.trim() || null,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier l'opération" : 'Nouvelle opération'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type d'opération */}
          <div className="space-y-2">
            <Label>Type d'opération *</Label>
            <Select value={typeOperation} onValueChange={(v) => {
              setTypeOperation(v as 'depense' | 'recette');
              setCategorie('');
              setErrors({});
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
              <SelectTrigger className={errors.mandataireId ? 'border-destructive' : ''}>
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
            {errors.mandataireId && <p className="text-sm text-destructive">{errors.mandataireId}</p>}
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
                className={errors.montant ? 'border-destructive' : ''}
              />
              {errors.montant && <p className="text-sm text-destructive">{errors.montant}</p>}
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={errors.date ? 'border-destructive' : ''}
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
            </div>
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label>Catégorie *</Label>
            <Select value={categorie} onValueChange={setCategorie}>
              <SelectTrigger className={errors.categorie ? 'border-destructive' : ''}>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {typeOperation === 'recette' ? (
                  <>
                    {categories.filter((cat: any) => !cat.parent).map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-1">
                      Emprunts
                    </div>
                    {categories.filter((cat: any) => cat.parent === 'Emprunts').map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="pl-6">{cat.label}</SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-1">
                      Concours en nature
                    </div>
                    {categories.filter((cat: any) => cat.parent === 'Concours en nature').map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="pl-6">{cat.label}</SelectItem>
                    ))}
                  </>
                ) : (
                  categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.categorie && <p className="text-sm text-destructive">{errors.categorie}</p>}
          </div>

          {/* Mode de paiement */}
          <div className="space-y-2">
            <Label>Mode de paiement *</Label>
            <Select value={modePaiement} onValueChange={setModePaiement}>
              <SelectTrigger className={errors.modePaiement ? 'border-destructive' : ''}>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {MODES_PAIEMENT.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.modePaiement && <p className="text-sm text-destructive">{errors.modePaiement}</p>}
          </div>

          {/* Numéro relevé bancaire (recettes only) */}
          {!isDepense && (
            <div className="space-y-2">
              <Label>N° relevé bancaire *</Label>
              <Input
                value={numeroReleveBancaire}
                onChange={(e) => setNumeroReleveBancaire(e.target.value)}
                placeholder="Ex: RB-2024-001"
                className={errors.numeroReleveBancaire ? 'border-destructive' : ''}
              />
              {errors.numeroReleveBancaire && <p className="text-sm text-destructive">{errors.numeroReleveBancaire}</p>}
            </div>
          )}

          {/* Champs spécifiques aux dépenses */}
          {isDepense && (
            <div className="space-y-2">
              <Label>Bénéficiaire *</Label>
              <Input
                value={beneficiaire}
                onChange={(e) => setBeneficiaire(e.target.value)}
                placeholder="Nom du fournisseur ou prestataire"
                className={errors.beneficiaire ? 'border-destructive' : ''}
              />
              {errors.beneficiaire && <p className="text-sm text-destructive">{errors.beneficiaire}</p>}
            </div>
          )}

          {/* Alerte don > 150€ en espèces */}
          {donEspecesSuperieur150 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Mode de paiement interdit</AlertTitle>
              <AlertDescription>
                Les dons supérieurs à 150 € ne peuvent pas être réglés en espèces. Veuillez choisir un autre mode de paiement.
              </AlertDescription>
            </Alert>
          )}

          {/* Alerte don > 3000€ */}
          {donSuperieur3000 && !isCollecte && (
            <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 dark:text-amber-200">Attestation d'origine des fonds requise</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                <p className="mb-2">
                  Pour les dons supérieurs à 3 000 €, il est nécessaire de faire remplir une attestation d'origine des fonds par le donateur.
                </p>
                <a 
                  href="/documents/attestation_origine_fonds.pdf" 
                  download="attestation_origine_fonds.pdf"
                  className="inline-flex items-center gap-2 text-amber-800 dark:text-amber-200 underline hover:no-underline font-medium"
                >
                  <FileText size={16} />
                  Télécharger l'attestation
                </a>
              </AlertDescription>
            </Alert>
          )}

          {/* Checkbox Collecte (uniquement pour les dons) */}
          {isDon && !isDepense && (
            <div className="flex items-center space-x-2 p-4 bg-secondary rounded-lg">
              <Checkbox
                id="isCollecte"
                checked={isCollecte}
                onCheckedChange={(checked) => setIsCollecte(checked as boolean)}
              />
              <Label htmlFor="isCollecte" className="cursor-pointer">
                Il s'agit d'une collecte (quête, urne, etc.)
              </Label>
            </div>
          )}

          {/* Champs spécifiques aux dons (non collecte) */}
          {isDon && !isCollecte && !isDepense && (
            <>
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-3">Informations du donateur</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom *</Label>
                    <Input
                      value={donateurNom}
                      onChange={(e) => setDonateurNom(e.target.value)}
                      placeholder="Nom de famille"
                      className={errors.donateurNom ? 'border-destructive' : ''}
                    />
                    {errors.donateurNom && <p className="text-sm text-destructive">{errors.donateurNom}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Prénom *</Label>
                    <Input
                      value={donateurPrenom}
                      onChange={(e) => setDonateurPrenom(e.target.value)}
                      placeholder="Prénom"
                      className={errors.donateurPrenom ? 'border-destructive' : ''}
                    />
                    {errors.donateurPrenom && <p className="text-sm text-destructive">{errors.donateurPrenom}</p>}
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Nationalité *</Label>
                    <Select value={donateurNationalite} onValueChange={setDonateurNationalite}>
                      <SelectTrigger className={errors.donateurNationalite ? 'border-destructive' : ''}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Française">Française</SelectItem>
                        <SelectItem value="Membre UE">Membre UE</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.donateurNationalite && <p className="text-sm text-destructive">{errors.donateurNationalite}</p>}
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-3">Adresse du donateur</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Adresse *</Label>
                    <Input
                      value={donateurAdresse}
                      onChange={(e) => setDonateurAdresse(e.target.value)}
                      placeholder="Numéro et nom de rue"
                      className={errors.donateurAdresse ? 'border-destructive' : ''}
                    />
                    {errors.donateurAdresse && <p className="text-sm text-destructive">{errors.donateurAdresse}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Code postal *</Label>
                    <Input
                      value={donateurCodePostal}
                      onChange={(e) => setDonateurCodePostal(e.target.value)}
                      placeholder="Ex: 75001"
                      className={errors.donateurCodePostal ? 'border-destructive' : ''}
                    />
                    {errors.donateurCodePostal && <p className="text-sm text-destructive">{errors.donateurCodePostal}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Ville *</Label>
                    <Input
                      value={donateurVille}
                      onChange={(e) => setDonateurVille(e.target.value)}
                      placeholder="Ex: Paris"
                      className={errors.donateurVille ? 'border-destructive' : ''}
                    />
                    {errors.donateurVille && <p className="text-sm text-destructive">{errors.donateurVille}</p>}
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Pays *</Label>
                    <Input
                      value={donateurPays}
                      onChange={(e) => setDonateurPays(e.target.value)}
                      placeholder="Ex: France"
                      className={errors.donateurPays ? 'border-destructive' : ''}
                    />
                    {errors.donateurPays && <p className="text-sm text-destructive">{errors.donateurPays}</p>}
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-3">Justificatif</h4>
                <div className="space-y-2">
                  <Label>Numéro de reçu don *</Label>
                  <Input
                    value={numeroRecu}
                    onChange={(e) => setNumeroRecu(e.target.value)}
                    placeholder="Ex: RD-2024-001"
                    className={errors.numeroRecu ? 'border-destructive' : ''}
                  />
                  {errors.numeroRecu && <p className="text-sm text-destructive">{errors.numeroRecu}</p>}
                </div>
              </div>
            </>
          )}

          {/* Champs collecte */}
          {isDon && isCollecte && !isDepense && (
            <div className="border-t border-border pt-4">
              <h4 className="font-semibold mb-3">Informations de la collecte</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de la collecte *</Label>
                  <Input
                    type="date"
                    value={collecteDate}
                    onChange={(e) => setCollecteDate(e.target.value)}
                    className={errors.collecteDate ? 'border-destructive' : ''}
                  />
                  {errors.collecteDate && <p className="text-sm text-destructive">{errors.collecteDate}</p>}
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Mode d'organisation de la collecte *</Label>
                  <Textarea
                    value={collecteOrganisation}
                    onChange={(e) => setCollecteOrganisation(e.target.value)}
                    placeholder="Ex: Quête lors du meeting du 15 janvier..."
                    className={errors.collecteOrganisation ? 'border-destructive' : ''}
                    rows={2}
                  />
                  {errors.collecteOrganisation && <p className="text-sm text-destructive">{errors.collecteOrganisation}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Note justificatifs pour versement du candidat */}
          {isVersementCandidat && !isDepense && (
            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800 dark:text-blue-200">Pièces justificatives requises</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                Pour ce versement, vous devez joindre comme justificatif l'un des documents suivants :
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Avis de virement bancaire</li>
                  <li>Copie du chèque</li>
                  <li>Copie du relevé bancaire du candidat</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Alerte versement candidat > 10 000€ */}
          {versementCandidatSuperieur10000 && (
            <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 dark:text-amber-200">Attestation d'origine des fonds requise</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                <p className="mb-2">
                  Pour les versements du candidat supérieurs à 10 000 €, il est nécessaire de faire remplir une attestation d'origine des fonds.
                </p>
                <a 
                  href="/documents/attestation_origine_fonds.pdf" 
                  download="attestation_origine_fonds.pdf"
                  className="inline-flex items-center gap-2 text-amber-800 dark:text-amber-200 underline hover:no-underline font-medium"
                >
                  <FileText size={16} />
                  Télécharger l'attestation
                </a>
              </AlertDescription>
            </Alert>
          )}

          {/* Champs spécifiques aux versements des partis politiques */}
          {isVersementParti && !isDepense && (
            <div className="border-t border-border pt-4">
              <h4 className="font-semibold mb-3">Coordonnées du parti politique</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Nom du parti politique *</Label>
                  <Input
                    value={partiNom}
                    onChange={(e) => setPartiNom(e.target.value)}
                    placeholder="Ex: Les Républicains"
                    className={errors.partiNom ? 'border-destructive' : ''}
                  />
                  {errors.partiNom && <p className="text-sm text-destructive">{errors.partiNom}</p>}
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Adresse *</Label>
                  <Input
                    value={partiAdresse}
                    onChange={(e) => setPartiAdresse(e.target.value)}
                    placeholder="Numéro et nom de rue"
                    className={errors.partiAdresse ? 'border-destructive' : ''}
                  />
                  {errors.partiAdresse && <p className="text-sm text-destructive">{errors.partiAdresse}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Code postal *</Label>
                  <Input
                    value={partiCodePostal}
                    onChange={(e) => setPartiCodePostal(e.target.value)}
                    placeholder="Ex: 75008"
                    className={errors.partiCodePostal ? 'border-destructive' : ''}
                  />
                  {errors.partiCodePostal && <p className="text-sm text-destructive">{errors.partiCodePostal}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Ville *</Label>
                  <Input
                    value={partiVille}
                    onChange={(e) => setPartiVille(e.target.value)}
                    placeholder="Ex: Paris"
                    className={errors.partiVille ? 'border-destructive' : ''}
                  />
                  {errors.partiVille && <p className="text-sm text-destructive">{errors.partiVille}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Numéro SIRET *</Label>
                  <Input
                    value={partiSiret}
                    onChange={(e) => setPartiSiret(e.target.value)}
                    placeholder="Ex: 123 456 789 00012"
                    className={errors.partiSiret ? 'border-destructive' : ''}
                  />
                  {errors.partiSiret && <p className="text-sm text-destructive">{errors.partiSiret}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Numéro RNA *</Label>
                  <Input
                    value={partiRna}
                    onChange={(e) => setPartiRna(e.target.value)}
                    placeholder="Ex: W751234567"
                    className={errors.partiRna ? 'border-destructive' : ''}
                  />
                  {errors.partiRna && <p className="text-sm text-destructive">{errors.partiRna}</p>}
                  <p className="text-xs text-muted-foreground">Le numéro RNA commence par la lettre W</p>
                </div>
              </div>
            </div>
          )}

          {/* Upload justificatif (dépenses + versement candidat + versement parti) */}
          {(isDepense || isVersementCandidat || isVersementParti) && (
            <div className="border-t border-border pt-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Upload size={18} />
                Justificatif {(!operation?.justificatif_url) && '*'}
              </h4>
              
              {operation?.justificatif_url && !justificatif && (
                <div className="mb-3 p-3 bg-secondary rounded-lg flex items-center gap-2">
                  <FileText size={18} className="text-accent" />
                  <span className="text-sm">Justificatif existant: {operation.justificatif_nom || 'Fichier'}</span>
                </div>
              )}
              
              {!justificatif ? (
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer hover:border-accent hover:bg-accent/5 ${
                    errors.justificatif ? 'border-destructive bg-destructive/5' : 'border-border'
                  }`}
                  onClick={() => document.getElementById('file-upload-modal')?.click()}
                >
                  <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Cliquez pour télécharger (PDF, JPG, PNG - max 10 Mo)
                  </p>
                  <input
                    id="file-upload-modal"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <FileText size={18} className="text-accent" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{justificatif.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(justificatif.size / 1024 / 1024).toFixed(2)} Mo
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X size={18} />
                  </Button>
                </div>
              )}
              
              {errors.justificatif && (
                <p className="text-sm text-destructive flex items-center gap-1 mt-2">
                  <AlertCircle size={14} />
                  {errors.justificatif}
                </p>
              )}
            </div>
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
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || donEspecesSuperieur150}>
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
