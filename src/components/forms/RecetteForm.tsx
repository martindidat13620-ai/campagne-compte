import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Euro, CreditCard, User, MapPin, Globe, FileText, AlertTriangle, Info, Receipt } from 'lucide-react';
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
import { CATEGORIES_RECETTES, MODES_PAIEMENT, getCompteComptable } from '@/types';
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
    // Autres
    commentaire: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDon = formData.categorie === 'dons';
  const montant = parseFloat(formData.montant) || 0;
  const isEspeces = formData.modePaiement === 'especes';
  const donEspecesSuperieur150 = isDon && isEspeces && montant > 150;
  const donSuperieur3000 = isDon && montant > 3000;

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
    if (!formData.montant || montant <= 0) {
      newErrors.montant = 'Montant invalide';
    }
    if (!formData.categorie) newErrors.categorie = 'Le type de recette est obligatoire';
    if (!formData.modePaiement) newErrors.modePaiement = 'Le mode de paiement est obligatoire';
    if (!formData.numeroReleveBancaire.trim()) {
      newErrors.numeroReleveBancaire = 'Le numéro du relevé bancaire est obligatoire';
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

      // Construction de l'adresse complète pour stockage
      const adresseComplete = !formData.isCollecte && isDon 
        ? `${formData.donateurAdresse}, ${formData.donateurCodePostal} ${formData.donateurVille}, ${formData.donateurPays}`
        : null;

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
          // Autres
          commentaire: formData.commentaire.trim() || null,
          statut_validation: 'en_attente'
        } as any);

      if (error) throw error;

      toast({
        title: "Recette enregistrée",
        description: `Recette de ${montant.toLocaleString('fr-FR')} € ajoutée avec succès`,
      });

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

        {/* Mode de paiement */}
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

        {/* Numéro relevé bancaire */}
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
              target="_blank" 
              rel="noopener noreferrer"
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