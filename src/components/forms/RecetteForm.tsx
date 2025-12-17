import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Euro, CreditCard, User, MapPin, Globe, FileText, AlertTriangle, Info, Receipt, Upload, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { CATEGORIES_RECETTES, CATEGORIES_DEPENSES, MODES_PAIEMENT, getCompteComptable, getCompteComptableDepense } from '@/types';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMandataireData } from '@/hooks/useMandataireData';
import { Loader2 } from 'lucide-react';

interface RecetteFormProps {
  onSuccess?: () => void;
}

export function RecetteForm({ onSuccess }: RecetteFormProps) {
  const navigate = useNavigate();
  const { candidat, mandataire, loading: dataLoading } = useMandataireData();
  const [submitting, setSubmitting] = useState(false);
  const [justificatif, setJustificatif] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    montant: '',
    categorie: '',
    modePaiement: '',
    numeroReleveBancaire: '',
    // Champs donateur
    donateurNom: '',
    donateurPrenom: '',
    donateurNationalite: 'Française',
    donateurAdresse: '',
    donateurCodePostal: '',
    donateurVille: '',
    donateurPays: 'France',
    numeroRecu: '',
    // Champs collecte
    isCollecte: false,
    collecteDate: '',
    collecteOrganisation: '',
    // Champs parti politique
    partiNom: '',
    partiAdresse: '',
    partiCodePostal: '',
    partiVille: '',
    partiSiret: '',
    partiRna: '',
    // Catégorie de dépense associée (pour depenses_directes_formations)
    categorieDepenseAssociee: '',
    // Autres
    commentaire: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const isDon = formData.categorie === 'dons';
  const isVersementCandidat = formData.categorie === 'versements_personnels';
  const isVersementParti = formData.categorie === 'versements_formations_politiques';
  const isDepenseDirecteParti = formData.categorie === 'depenses_directes_formations';
  const isProduitsDivers = formData.categorie === 'produits_divers';
  const montant = parseFloat(formData.montant) || 0;
  const isEspeces = formData.modePaiement === 'especes';
  const donEspecesSuperieur150 = isDon && isEspeces && montant > 150;
  const donSuperieur3000 = isDon && montant > 3000;
  const versementCandidatSuperieur10000 = isVersementCandidat && montant > 10000;

  // Reset specific fields when category changes
  useEffect(() => {
    if (!isDon) {
      setFormData(prev => ({
        ...prev,
        donateurNom: '',
        donateurPrenom: '',
        donateurNationalite: 'Française',
        donateurAdresse: '',
        donateurCodePostal: '',
        donateurVille: '',
        donateurPays: 'France',
        numeroRecu: '',
        isCollecte: false,
        collecteDate: '',
        collecteOrganisation: '',
      }));
    }
  }, [isDon]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Validations communes
    if (!formData.date) newErrors.date = 'La date est obligatoire';
    
    // Validation des dates de campagne
    if (formData.date && candidat?.campaign) {
      const operationDate = new Date(formData.date);
      const dateDebut = candidat.campaign.date_debut ? new Date(candidat.campaign.date_debut) : null;
      const dateFin = candidat.campaign.date_fin ? new Date(candidat.campaign.date_fin) : null;
      
      if (dateDebut && operationDate < dateDebut) {
        newErrors.date = `La date doit être après le début de la campagne (${dateDebut.toLocaleDateString('fr-FR')})`;
      }
      if (dateFin && operationDate > dateFin) {
        newErrors.date = `La date doit être avant la fin de la campagne (${dateFin.toLocaleDateString('fr-FR')})`;
      }
    }
    
    if (!formData.montant || montant <= 0) {
      newErrors.montant = 'Montant invalide';
    }
    if (!formData.categorie) newErrors.categorie = 'Le type de recette est obligatoire';
    
    // Mode de paiement et relevé bancaire non requis pour dépenses directes parti (pas de flux bancaire)
    if (!isDepenseDirecteParti) {
      if (!formData.modePaiement) newErrors.modePaiement = 'Le mode de paiement est obligatoire';
      if (!formData.numeroReleveBancaire.trim()) {
        newErrors.numeroReleveBancaire = 'Le numéro du relevé bancaire est obligatoire';
      }
    }

    // Validation don > 150€ en espèces
    if (donEspecesSuperieur150) {
      newErrors.modePaiement = 'Les dons supérieurs à 150 € ne peuvent pas être en espèces';
    }

    // Validations spécifiques aux dons
    if (isDon) {
      if (formData.isCollecte) {
        // Mode collecte
        if (!formData.collecteDate) newErrors.collecteDate = 'La date de collecte est obligatoire';
        if (!formData.collecteOrganisation.trim()) {
          newErrors.collecteOrganisation = 'Le mode d\'organisation est obligatoire';
        }
      } else {
        // Mode don normal
        if (!formData.donateurNom.trim()) newErrors.donateurNom = 'Le nom est obligatoire';
        if (!formData.donateurPrenom.trim()) newErrors.donateurPrenom = 'Le prénom est obligatoire';
        if (!formData.donateurNationalite) newErrors.donateurNationalite = 'La nationalité est obligatoire';
        if (!formData.donateurAdresse.trim()) newErrors.donateurAdresse = 'L\'adresse est obligatoire';
        if (!formData.donateurCodePostal.trim()) newErrors.donateurCodePostal = 'Le code postal est obligatoire';
        if (!formData.donateurVille.trim()) newErrors.donateurVille = 'La ville est obligatoire';
        if (!formData.donateurPays.trim()) newErrors.donateurPays = 'Le pays est obligatoire';
        if (!formData.numeroRecu.trim()) newErrors.numeroRecu = 'Le numéro de reçu don est obligatoire';
      }
    }

    // Validation justificatif obligatoire pour versement candidat
    if (isVersementCandidat && !justificatif) {
      newErrors.justificatif = 'Le justificatif est obligatoire';
    }

    // Validations spécifiques aux versements des partis politiques
    if (isVersementParti || isDepenseDirecteParti) {
      if (!formData.partiNom.trim()) newErrors.partiNom = 'Le nom du parti est obligatoire';
      if (!formData.partiAdresse.trim()) newErrors.partiAdresse = "L'adresse est obligatoire";
      if (!formData.partiCodePostal.trim()) newErrors.partiCodePostal = 'Le code postal est obligatoire';
      if (!formData.partiVille.trim()) newErrors.partiVille = 'La ville est obligatoire';
      if (!formData.partiSiret.trim()) newErrors.partiSiret = 'Le SIRET est obligatoire';
      if (!formData.partiRna.trim()) {
        newErrors.partiRna = 'Le numéro RNA est obligatoire';
      } else if (!formData.partiRna.trim().toUpperCase().startsWith('W')) {
        newErrors.partiRna = 'Le numéro RNA doit commencer par W';
      }
      if (!justificatif) {
        newErrors.justificatif = 'Le justificatif est obligatoire';
      }
    }

    // Validation catégorie de dépense associée pour depenses_directes_formations
    if (isDepenseDirecteParti && !formData.categorieDepenseAssociee) {
      newErrors.categorieDepenseAssociee = 'La catégorie de dépense associée est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (!candidat || !mandataire) {
      toast({
        title: "Erreur",
        description: "Données mandataire/candidat non disponibles",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const compteComptable = getCompteComptable(formData.categorie);

      let justificatifUrl: string | null = null;

      // Upload du justificatif vers Supabase Storage (pour versement candidat, parti ou dépense directe)
      if (justificatif && (isVersementCandidat || isVersementParti || isDepenseDirecteParti)) {
        const fileExt = justificatif.name.split('.').pop();
        const fileName = `${mandataire.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('justificatifs')
          .upload(fileName, justificatif);

        if (uploadError) {
          console.error('Erreur upload:', uploadError);
          throw new Error('Impossible d\'uploader le justificatif');
        }

        justificatifUrl = uploadData.path;
      }

      // Construction de l'adresse complète pour stockage
      const adresseComplete = !formData.isCollecte && isDon 
        ? `${formData.donateurAdresse}, ${formData.donateurCodePostal} ${formData.donateurVille}, ${formData.donateurPays}`
        : null;

      // Champs communs parti politique (pour versement parti ou dépense directe parti)
      const partiData = (isVersementParti || isDepenseDirecteParti) ? {
        parti_nom: formData.partiNom.trim(),
        parti_adresse: formData.partiAdresse.trim(),
        parti_code_postal: formData.partiCodePostal.trim(),
        parti_ville: formData.partiVille.trim(),
        parti_siret: formData.partiSiret.trim(),
        parti_rna: formData.partiRna.trim().toUpperCase(),
      } : {
        parti_nom: null,
        parti_adresse: null,
        parti_code_postal: null,
        parti_ville: null,
        parti_siret: null,
        parti_rna: null,
      };

      // Cas spécial: Dépenses payées directement par le parti (créer 2 opérations)
      if (isDepenseDirecteParti) {
        const compteComptableDepense = getCompteComptableDepense(formData.categorieDepenseAssociee);
        const commentaireRecette = `Dépense payée par ${formData.partiNom.trim()}${formData.commentaire ? ' - ' + formData.commentaire.trim() : ''}`;
        const commentaireDepense = `Payée par ${formData.partiNom.trim()}${formData.commentaire ? ' - ' + formData.commentaire.trim() : ''}`;

        // Créer la recette
        const { error: errorRecette } = await supabase
          .from('operations')
          .insert({
            candidat_id: candidat.id,
            mandataire_id: mandataire.id,
            type_operation: 'recette',
            date: formData.date,
            montant: montant,
            categorie: formData.categorie,
            compte_comptable: compteComptable || null,
            mode_paiement: 'virement', // Pas de flux réel, valeur par défaut
            numero_releve_bancaire: null, // Pas de relevé bancaire pour ce type
            ...partiData,
            justificatif_url: justificatifUrl,
            justificatif_nom: justificatif?.name || null,
            commentaire: commentaireRecette,
            statut_validation: 'en_attente'
          } as any);

        if (errorRecette) throw errorRecette;

        // Créer la dépense associée
        const { error: errorDepense } = await supabase
          .from('operations')
          .insert({
            candidat_id: candidat.id,
            mandataire_id: mandataire.id,
            type_operation: 'depense',
            date: formData.date,
            montant: montant,
            categorie: formData.categorieDepenseAssociee,
            compte_comptable: compteComptableDepense || null,
            mode_paiement: 'virement', // Pas de flux réel, valeur par défaut
            numero_releve_bancaire: null, // Pas de relevé bancaire pour ce type
            beneficiaire: formData.partiNom.trim(),
            ...partiData,
            justificatif_url: justificatifUrl,
            justificatif_nom: justificatif?.name || null,
            commentaire: commentaireDepense,
            statut_validation: 'en_attente'
          } as any);

        if (errorDepense) throw errorDepense;

        toast({
          title: "Opérations enregistrées",
          description: `Recette et dépense de ${montant.toLocaleString('fr-FR')} € créées (opération à zéro)`,
        });
      } else {
        // Cas normal: une seule opération
        const { error } = await supabase
          .from('operations')
          .insert({
            candidat_id: candidat.id,
            mandataire_id: mandataire.id,
            type_operation: 'recette',
            date: formData.date,
            montant: montant,
            categorie: formData.categorie,
            compte_comptable: compteComptable || null,
            mode_paiement: formData.modePaiement,
            numero_releve_bancaire: formData.numeroReleveBancaire.trim(),
            // Champs donateur (uniquement pour les dons non-collecte)
            donateur_nom: !formData.isCollecte && isDon ? formData.donateurNom.trim() : null,
            donateur_prenom: !formData.isCollecte && isDon ? formData.donateurPrenom.trim() : null,
            donateur_nationalite: !formData.isCollecte && isDon ? formData.donateurNationalite : null,
            donateur_adresse: adresseComplete,
            donateur_code_postal: !formData.isCollecte && isDon ? formData.donateurCodePostal.trim() : null,
            donateur_ville: !formData.isCollecte && isDon ? formData.donateurVille.trim() : null,
            donateur_pays: !formData.isCollecte && isDon ? formData.donateurPays.trim() : null,
            numero_recu: !formData.isCollecte && isDon ? formData.numeroRecu.trim() : null,
            // Champs collecte
            is_collecte: isDon ? formData.isCollecte : false,
            collecte_date: formData.isCollecte && isDon ? formData.collecteDate : null,
            collecte_organisation: formData.isCollecte && isDon ? formData.collecteOrganisation.trim() : null,
            // Champs parti politique
            ...partiData,
            // Justificatif (pour versement candidat ou parti)
            justificatif_url: justificatifUrl,
            justificatif_nom: justificatif?.name || null,
            // Autres
            commentaire: formData.commentaire.trim() || null,
            statut_validation: 'en_attente'
          } as any);

        if (error) throw error;

        toast({
          title: "Recette enregistrée",
          description: `Recette de ${montant.toLocaleString('fr-FR')} € ajoutée avec succès`,
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/mandataire');
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la recette",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type de recette */}
      <div className="space-y-2">
        <Label>Type de recette *</Label>
        <Select
          value={formData.categorie}
          onValueChange={(value) => setFormData({ ...formData, categorie: value })}
        >
          <SelectTrigger className={errors.categorie ? 'border-destructive' : ''}>
            <SelectValue placeholder="Sélectionner le type de recette" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES_RECETTES.filter(cat => !cat.parent).map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-1">
              Emprunts
            </div>
            {CATEGORIES_RECETTES.filter(cat => cat.parent === 'Emprunts').map((cat) => (
              <SelectItem key={cat.value} value={cat.value} className="pl-6">{cat.label}</SelectItem>
            ))}
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-1">
              Concours en nature
            </div>
            {CATEGORIES_RECETTES.filter(cat => cat.parent === 'Concours en nature').map((cat) => (
              <SelectItem key={cat.value} value={cat.value} className="pl-6">{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categorie && <p className="text-sm text-destructive">{errors.categorie}</p>}
      </div>

      {/* Checkbox Collecte (uniquement pour les dons) */}
      {isDon && (
        <div className="flex items-center space-x-2 p-4 bg-secondary rounded-lg">
          <Checkbox
            id="isCollecte"
            checked={formData.isCollecte}
            onCheckedChange={(checked) => setFormData({ ...formData, isCollecte: checked as boolean })}
          />
          <Label htmlFor="isCollecte" className="cursor-pointer">
            Il s'agit d'une collecte (quête, urne, etc.)
          </Label>
        </div>
      )}

      {/* Champs communs */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date" className="flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground" />
            Date *
          </Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className={errors.date ? 'border-destructive' : ''}
          />
          {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
        </div>

        {/* Montant */}
        <div className="space-y-2">
          <Label htmlFor="montant" className="flex items-center gap-2">
            <Euro size={16} className="text-muted-foreground" />
            Montant (€) *
          </Label>
          <Input
            id="montant"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.montant}
            onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
            className={errors.montant ? 'border-destructive' : ''}
          />
          {errors.montant && <p className="text-sm text-destructive">{errors.montant}</p>}
        </div>

        {/* Mode de paiement - masqué pour dépenses directes parti */}
        {!isDepenseDirecteParti && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CreditCard size={16} className="text-muted-foreground" />
              Mode de règlement *
            </Label>
            <Select
              value={formData.modePaiement}
              onValueChange={(value) => setFormData({ ...formData, modePaiement: value })}
            >
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
        )}

        {/* Numéro relevé bancaire - masqué pour dépenses directes parti */}
        {!isDepenseDirecteParti && (
          <div className="space-y-2">
            <Label htmlFor="numeroReleveBancaire" className="flex items-center gap-2">
              <FileText size={16} className="text-muted-foreground" />
              N° relevé bancaire *
            </Label>
            <Input
              id="numeroReleveBancaire"
              placeholder="Ex: RB-2024-001"
              value={formData.numeroReleveBancaire}
              onChange={(e) => setFormData({ ...formData, numeroReleveBancaire: e.target.value })}
              className={errors.numeroReleveBancaire ? 'border-destructive' : ''}
            />
            {errors.numeroReleveBancaire && <p className="text-sm text-destructive">{errors.numeroReleveBancaire}</p>}
          </div>
        )}
      </div>

      {/* Alerte don > 150€ en espèces */}
      {donEspecesSuperieur150 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Mode de paiement interdit</AlertTitle>
          <AlertDescription>
            Les dons supérieurs à 150 € ne peuvent pas être réglés en espèces. Veuillez choisir un autre mode de paiement (chèque, virement, carte bancaire, prélèvement).
          </AlertDescription>
        </Alert>
      )}

      {/* Alerte don > 3000€ - Attestation origine des fonds */}
      {donSuperieur3000 && !formData.isCollecte && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">Attestation d'origine des fonds requise</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            <p className="mb-2">
              Pour les dons supérieurs à 3 000 €, il est nécessaire de faire remplir une attestation d'origine des fonds par le donateur, dans le cadre du respect de la norme anti-blanchiment.
            </p>
            <a 
              href="/documents/attestation_origine_fonds.pdf" 
              download="attestation_origine_fonds.pdf"
              className="inline-flex items-center gap-2 text-amber-800 dark:text-amber-200 underline hover:no-underline font-medium"
            >
              <FileText size={16} />
              Télécharger l'attestation d'origine des fonds
            </a>
            <p className="mt-2 text-sm">
              Ce document sera à annexer au compte de campagne.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Note justificatifs pour versement du candidat */}
      {isVersementCandidat && (
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">Pièces justificatives requises</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            Pour ce versement, vous devez joindre comme justificatif l'un des documents suivants :
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Avis de virement bancaire</li>
              <li>Copie du chèque</li>
              <li>Copie du relevé bancaire du candidat</li>
              <li>Tout autre document attestant du versement</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Alerte versement candidat > 10 000€ - Attestation origine des fonds */}
      {versementCandidatSuperieur10000 && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">Attestation d'origine des fonds requise</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            <p className="mb-2">
              Pour les versements du candidat supérieurs à 10 000 €, il est nécessaire de faire remplir une attestation d'origine des fonds par le candidat, dans le cadre du respect de la norme anti-blanchiment.
            </p>
            <a 
              href="/documents/attestation_origine_fonds.pdf" 
              download="attestation_origine_fonds.pdf"
              className="inline-flex items-center gap-2 text-amber-800 dark:text-amber-200 underline hover:no-underline font-medium"
            >
              <FileText size={16} />
              Télécharger l'attestation d'origine des fonds
            </a>
            <p className="mt-2 text-sm">
              Ce document sera à annexer au compte de campagne.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload justificatif pour versement candidat */}
      {isVersementCandidat && (
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Upload size={20} className="text-primary" />
            Justificatif *
          </h3>
          
          {!justificatif ? (
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-accent hover:bg-accent/5 ${
                errors.justificatif ? 'border-destructive bg-destructive/5' : 'border-border'
              }`}
              onClick={() => document.getElementById('file-upload-recette')?.click()}
            >
              <Upload size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-1">
                Cliquez pour télécharger ou glissez-déposez
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, JPG, PNG (max. 10 Mo)
              </p>
              <input
                id="file-upload-recette"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
              <div className="p-2 bg-accent/10 rounded-lg">
                <FileText size={20} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{justificatif.name}</p>
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

      {/* Champs spécifiques aux versements des partis politiques ou dépenses directes */}
      {(isVersementParti || isDepenseDirecteParti) && (
        <>
          {/* Alerte explicative pour dépenses directes */}
          {isDepenseDirecteParti && (
            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800 dark:text-blue-200">Opération à zéro</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                Cette recette génère automatiquement une dépense du même montant. Le parti paie directement une dépense de campagne, ce qui crée deux écritures comptables qui s'équilibrent (recette = dépense).
              </AlertDescription>
            </Alert>
          )}

          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User size={20} className="text-primary" />
              Coordonnées du parti politique
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Nom du parti */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="partiNom">Nom du parti politique *</Label>
                <Input
                  id="partiNom"
                  placeholder="Ex: Les Républicains"
                  value={formData.partiNom}
                  onChange={(e) => setFormData({ ...formData, partiNom: e.target.value })}
                  className={errors.partiNom ? 'border-destructive' : ''}
                />
                {errors.partiNom && <p className="text-sm text-destructive">{errors.partiNom}</p>}
              </div>

              {/* Adresse */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="partiAdresse" className="flex items-center gap-2">
                  <MapPin size={16} className="text-muted-foreground" />
                  Adresse *
                </Label>
                <Input
                  id="partiAdresse"
                  placeholder="Numéro et nom de rue"
                  value={formData.partiAdresse}
                  onChange={(e) => setFormData({ ...formData, partiAdresse: e.target.value })}
                  className={errors.partiAdresse ? 'border-destructive' : ''}
                />
                {errors.partiAdresse && <p className="text-sm text-destructive">{errors.partiAdresse}</p>}
              </div>

              {/* Code postal */}
              <div className="space-y-2">
                <Label htmlFor="partiCodePostal">Code postal *</Label>
                <Input
                  id="partiCodePostal"
                  placeholder="Ex: 75008"
                  value={formData.partiCodePostal}
                  onChange={(e) => setFormData({ ...formData, partiCodePostal: e.target.value })}
                  className={errors.partiCodePostal ? 'border-destructive' : ''}
                />
                {errors.partiCodePostal && <p className="text-sm text-destructive">{errors.partiCodePostal}</p>}
              </div>

              {/* Ville */}
              <div className="space-y-2">
                <Label htmlFor="partiVille">Ville *</Label>
                <Input
                  id="partiVille"
                  placeholder="Ex: Paris"
                  value={formData.partiVille}
                  onChange={(e) => setFormData({ ...formData, partiVille: e.target.value })}
                  className={errors.partiVille ? 'border-destructive' : ''}
                />
                {errors.partiVille && <p className="text-sm text-destructive">{errors.partiVille}</p>}
              </div>

              {/* SIRET */}
              <div className="space-y-2">
                <Label htmlFor="partiSiret">Numéro SIRET *</Label>
                <Input
                  id="partiSiret"
                  placeholder="Ex: 123 456 789 00012"
                  value={formData.partiSiret}
                  onChange={(e) => setFormData({ ...formData, partiSiret: e.target.value })}
                  className={errors.partiSiret ? 'border-destructive' : ''}
                />
                {errors.partiSiret && <p className="text-sm text-destructive">{errors.partiSiret}</p>}
              </div>

              {/* RNA */}
              <div className="space-y-2">
                <Label htmlFor="partiRna">Numéro RNA *</Label>
                <Input
                  id="partiRna"
                  placeholder="Ex: W751234567"
                  value={formData.partiRna}
                  onChange={(e) => setFormData({ ...formData, partiRna: e.target.value })}
                  className={errors.partiRna ? 'border-destructive' : ''}
                />
                {errors.partiRna && <p className="text-sm text-destructive">{errors.partiRna}</p>}
                <p className="text-xs text-muted-foreground">Le numéro RNA commence par la lettre W</p>
              </div>
            </div>
          </div>

          {/* Sélecteur de catégorie de dépense associée (uniquement pour dépenses directes) */}
          {isDepenseDirecteParti && (
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Receipt size={20} className="text-primary" />
                Catégorie de dépense associée
              </h3>
              
              <div className="space-y-2">
                <Label>Type de dépense payée par le parti *</Label>
                <Select
                  value={formData.categorieDepenseAssociee}
                  onValueChange={(value) => setFormData({ ...formData, categorieDepenseAssociee: value })}
                >
                  <SelectTrigger className={errors.categorieDepenseAssociee ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Sélectionner la catégorie de dépense" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES_DEPENSES.filter(cat => !cat.parent).map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-1">
                      Location
                    </div>
                    {CATEGORIES_DEPENSES.filter(cat => cat.parent === 'Location').map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="pl-6">{cat.label}</SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-1">
                      Personnel
                    </div>
                    {CATEGORIES_DEPENSES.filter(cat => cat.parent === 'Personnel').map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="pl-6">{cat.label}</SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-1">
                      Honoraires
                    </div>
                    {CATEGORIES_DEPENSES.filter(cat => cat.parent === 'Honoraires').map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="pl-6">{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categorieDepenseAssociee && <p className="text-sm text-destructive">{errors.categorieDepenseAssociee}</p>}
                <p className="text-xs text-muted-foreground mt-2">
                  Sélectionnez le type de dépense que le parti a directement payé pour la campagne.
                </p>
              </div>
            </div>
          )}

          {/* Upload justificatif pour versement parti */}
          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload size={20} className="text-primary" />
              Justificatif *
            </h3>
            
            {/* Note informative pour versements définitifs des partis */}
            {formData.categorie === 'versements_formations_politiques' && (
              <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <span className="font-medium">Justification de l'origine des fonds</span>
                  <br />
                  L'origine des fonds doit être justifiée par tout moyen : copies des chèques, relevés bancaires mentionnant l'auteur et le motif des virements, relevés bancaires du parti faisant apparaître le débit.
                </AlertDescription>
              </Alert>
            )}
            
            {!justificatif ? (
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-accent hover:bg-accent/5 ${
                  errors.justificatif ? 'border-destructive bg-destructive/5' : 'border-border'
                }`}
                onClick={() => document.getElementById('file-upload-parti')?.click()}
              >
                <Upload size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-1">
                  Cliquez pour télécharger ou glissez-déposez
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, JPG, PNG (max. 10 Mo)
                </p>
                <input
                  id="file-upload-parti"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <FileText size={20} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{justificatif.name}</p>
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
        </>
      )}

      {/* Champs spécifiques aux produits divers */}
      {isProduitsDivers && (
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Upload size={20} className="text-primary" />
            Justificatif
          </h3>
          
          <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <span className="font-medium">Activité commerciale</span>
              <br />
              S'il s'agit d'une activité commerciale, merci d'y joindre la comptabilité correspondante précisant le coût unitaire de vente des produits, ainsi que le nombre de ventes.
            </AlertDescription>
          </Alert>
          
          {!justificatif ? (
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-accent hover:bg-accent/5 border-border`}
              onClick={() => document.getElementById('file-upload-produits')?.click()}
            >
              <Upload size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-1">
                Cliquez pour télécharger ou glissez-déposez
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, JPG, PNG (max. 10 Mo)
              </p>
              <input
                id="file-upload-produits"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
              <div className="p-2 bg-accent/10 rounded-lg">
                <FileText size={20} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{justificatif.name}</p>
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
        </div>
      )}

      {/* Champs spécifiques aux dons */}
      {isDon && !formData.isCollecte && (
        <>
          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User size={20} className="text-primary" />
              Informations du donateur
            </h3>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Nom */}
              <div className="space-y-2">
                <Label htmlFor="donateurNom">Nom *</Label>
                <Input
                  id="donateurNom"
                  placeholder="Nom de famille"
                  value={formData.donateurNom}
                  onChange={(e) => setFormData({ ...formData, donateurNom: e.target.value })}
                  className={errors.donateurNom ? 'border-destructive' : ''}
                />
                {errors.donateurNom && <p className="text-sm text-destructive">{errors.donateurNom}</p>}
              </div>

              {/* Prénom */}
              <div className="space-y-2">
                <Label htmlFor="donateurPrenom">Prénom *</Label>
                <Input
                  id="donateurPrenom"
                  placeholder="Prénom"
                  value={formData.donateurPrenom}
                  onChange={(e) => setFormData({ ...formData, donateurPrenom: e.target.value })}
                  className={errors.donateurPrenom ? 'border-destructive' : ''}
                />
                {errors.donateurPrenom && <p className="text-sm text-destructive">{errors.donateurPrenom}</p>}
              </div>

              {/* Nationalité */}
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-2">
                  <Globe size={16} className="text-muted-foreground" />
                  Nationalité *
                </Label>
                <Select
                  value={formData.donateurNationalite}
                  onValueChange={(value) => setFormData({ ...formData, donateurNationalite: value })}
                >
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

          {/* Adresse du donateur */}
          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-primary" />
              Adresse du donateur
            </h3>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Adresse */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="donateurAdresse">Adresse *</Label>
                <Input
                  id="donateurAdresse"
                  placeholder="Numéro et nom de rue"
                  value={formData.donateurAdresse}
                  onChange={(e) => setFormData({ ...formData, donateurAdresse: e.target.value })}
                  className={errors.donateurAdresse ? 'border-destructive' : ''}
                />
                {errors.donateurAdresse && <p className="text-sm text-destructive">{errors.donateurAdresse}</p>}
              </div>

              {/* Code postal */}
              <div className="space-y-2">
                <Label htmlFor="donateurCodePostal">Code postal *</Label>
                <Input
                  id="donateurCodePostal"
                  placeholder="Ex: 75001"
                  value={formData.donateurCodePostal}
                  onChange={(e) => setFormData({ ...formData, donateurCodePostal: e.target.value })}
                  className={errors.donateurCodePostal ? 'border-destructive' : ''}
                />
                {errors.donateurCodePostal && <p className="text-sm text-destructive">{errors.donateurCodePostal}</p>}
              </div>

              {/* Ville */}
              <div className="space-y-2">
                <Label htmlFor="donateurVille">Ville *</Label>
                <Input
                  id="donateurVille"
                  placeholder="Ex: Paris"
                  value={formData.donateurVille}
                  onChange={(e) => setFormData({ ...formData, donateurVille: e.target.value })}
                  className={errors.donateurVille ? 'border-destructive' : ''}
                />
                {errors.donateurVille && <p className="text-sm text-destructive">{errors.donateurVille}</p>}
              </div>

              {/* Pays */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="donateurPays">Pays *</Label>
                <Input
                  id="donateurPays"
                  placeholder="Ex: France"
                  value={formData.donateurPays}
                  onChange={(e) => setFormData({ ...formData, donateurPays: e.target.value })}
                  className={errors.donateurPays ? 'border-destructive' : ''}
                />
                {errors.donateurPays && <p className="text-sm text-destructive">{errors.donateurPays}</p>}
              </div>
            </div>
          </div>

          {/* Numéro de reçu don */}
          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Receipt size={20} className="text-primary" />
              Justificatif
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="numeroRecu">Numéro de reçu don *</Label>
                <Input
                  id="numeroRecu"
                  placeholder="Ex: RD-2024-001"
                  value={formData.numeroRecu}
                  onChange={(e) => setFormData({ ...formData, numeroRecu: e.target.value })}
                  className={errors.numeroRecu ? 'border-destructive' : ''}
                />
                {errors.numeroRecu && <p className="text-sm text-destructive">{errors.numeroRecu}</p>}
              </div>

              <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  <strong>Important :</strong> Conservez bien le carnet de reçus dons. Il devra être remis en physique lors du dépôt du compte de campagne.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </>
      )}

      {/* Champs spécifiques à la collecte */}
      {isDon && formData.isCollecte && (
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            Informations de la collecte
          </h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Date de collecte */}
            <div className="space-y-2">
              <Label htmlFor="collecteDate">Date de la collecte *</Label>
              <Input
                id="collecteDate"
                type="date"
                value={formData.collecteDate}
                onChange={(e) => setFormData({ ...formData, collecteDate: e.target.value })}
                className={errors.collecteDate ? 'border-destructive' : ''}
              />
              {errors.collecteDate && <p className="text-sm text-destructive">{errors.collecteDate}</p>}
            </div>

            {/* Mode d'organisation */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="collecteOrganisation">Mode d'organisation de la collecte *</Label>
              <Textarea
                id="collecteOrganisation"
                placeholder="Ex: Quête lors du meeting du 15 janvier, urne placée au QG de campagne, etc."
                value={formData.collecteOrganisation}
                onChange={(e) => setFormData({ ...formData, collecteOrganisation: e.target.value })}
                className={errors.collecteOrganisation ? 'border-destructive' : ''}
                rows={3}
              />
              {errors.collecteOrganisation && <p className="text-sm text-destructive">{errors.collecteOrganisation}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Commentaire (optionnel) */}
      <div className="space-y-2">
        <Label htmlFor="commentaire">Commentaire (optionnel)</Label>
        <Textarea
          id="commentaire"
          placeholder="Informations complémentaires..."
          value={formData.commentaire}
          onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex-1 sm:flex-none"
          disabled={submitting}
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          className="flex-1 sm:flex-none bg-primary hover:bg-primary/90"
          disabled={submitting || donEspecesSuperieur150}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer la recette'
          )}
        </Button>
      </div>
    </form>
  );
}