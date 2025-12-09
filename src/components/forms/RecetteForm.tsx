import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Calendar, Euro, CreditCard, FileText, X, User, MapPin, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORIES_RECETTES, MODES_PAIEMENT, type CategorieRecette } from '@/types';
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
    donateurNom: '',
    donateurAdresse: '',
    donateurNationalite: 'Française',
    numeroRecu: '',
    commentaire: '',
  });
  const [justificatif, setJustificatif] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const requiresAddress = parseFloat(formData.montant) > 150;

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
    }
  };

  const removeFile = () => {
    setJustificatif(null);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) newErrors.date = 'La date est obligatoire';
    if (!formData.montant || parseFloat(formData.montant) <= 0) {
      newErrors.montant = 'Montant invalide';
    }
    if (!formData.categorie) newErrors.categorie = 'Le type de recette est obligatoire';
    if (!formData.modePaiement) newErrors.modePaiement = 'Le mode de paiement est obligatoire';
    if (!formData.donateurNom.trim()) newErrors.donateurNom = 'Le nom du donateur est obligatoire';
    
    if (requiresAddress && !formData.donateurAdresse.trim()) {
      newErrors.donateurAdresse = 'L\'adresse est obligatoire pour les dons > 150€';
    }
    
    if (!formData.donateurNationalite) newErrors.donateurNationalite = 'La nationalité est obligatoire';
    if (!formData.numeroRecu.trim()) newErrors.numeroRecu = 'Le numéro de reçu est obligatoire';

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
      let justificatifUrl: string | null = null;

      // Upload du justificatif vers Supabase Storage
      if (justificatif) {
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

      const { error } = await supabase
        .from('operations')
        .insert({
          candidat_id: candidat.id,
          mandataire_id: mandataire.id,
          type_operation: 'recette',
          date: formData.date,
          montant: parseFloat(formData.montant),
          donateur_nom: formData.donateurNom.trim(),
          donateur_adresse: formData.donateurAdresse.trim() || null,
          donateur_nationalite: formData.donateurNationalite,
          categorie: formData.categorie,
          mode_paiement: formData.modePaiement,
          numero_recu: formData.numeroRecu.trim(),
          commentaire: formData.commentaire.trim() || null,
          justificatif_url: justificatifUrl,
          justificatif_nom: justificatif?.name || null,
          statut_validation: 'en_attente'
        });

      if (error) throw error;

      toast({
        title: "Recette enregistrée",
        description: `Recette de ${parseFloat(formData.montant).toLocaleString('fr-FR')} € ajoutée avec succès`,
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
      <div className="grid gap-6 md:grid-cols-2">
        {/* Type de recette */}
        <div className="space-y-2 md:col-span-2">
          <Label>Type de recette *</Label>
          <Select
            value={formData.categorie}
            onValueChange={(value) => setFormData({ ...formData, categorie: value })}
          >
            <SelectTrigger className={errors.categorie ? 'border-destructive' : ''}>
              <SelectValue placeholder="Sélectionner le type de recette" />
            </SelectTrigger>
            <SelectContent>
              {/* Catégories simples (sans parent) */}
              {CATEGORIES_RECETTES.filter(cat => !cat.parent).map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
              
              {/* Groupe Emprunts */}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-1">
                Emprunts
              </div>
              {CATEGORIES_RECETTES.filter(cat => cat.parent === 'Emprunts').map((cat) => (
                <SelectItem key={cat.value} value={cat.value} className="pl-6">{cat.label}</SelectItem>
              ))}
              
              {/* Groupe Concours en nature */}
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

        {/* Donateur */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="donateurNom" className="flex items-center gap-2">
            <User size={16} className="text-muted-foreground" />
            Nom du donateur *
          </Label>
          <Input
            id="donateurNom"
            placeholder="Prénom et nom complet"
            value={formData.donateurNom}
            onChange={(e) => setFormData({ ...formData, donateurNom: e.target.value })}
            className={errors.donateurNom ? 'border-destructive' : ''}
          />
          {errors.donateurNom && <p className="text-sm text-destructive">{errors.donateurNom}</p>}
        </div>

        {/* Adresse (obligatoire si > 150€) */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="donateurAdresse" className="flex items-center gap-2">
            <MapPin size={16} className="text-muted-foreground" />
            Adresse du donateur {requiresAddress ? '*' : '(optionnel)'}
          </Label>
          <Textarea
            id="donateurAdresse"
            placeholder="Adresse complète"
            value={formData.donateurAdresse}
            onChange={(e) => setFormData({ ...formData, donateurAdresse: e.target.value })}
            className={errors.donateurAdresse ? 'border-destructive' : ''}
            rows={2}
          />
          {requiresAddress && (
            <p className="text-xs text-muted-foreground">
              L'adresse est obligatoire pour les dons supérieurs à 150 €
            </p>
          )}
          {errors.donateurAdresse && <p className="text-sm text-destructive">{errors.donateurAdresse}</p>}
        </div>

        {/* Nationalité */}
        <div className="space-y-2">
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

        {/* Mode de paiement */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <CreditCard size={16} className="text-muted-foreground" />
            Mode de paiement *
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

        {/* Numéro de reçu */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="numeroRecu">Numéro de reçu fiscal *</Label>
          <Input
            id="numeroRecu"
            placeholder="Ex: RC-2024-001"
            value={formData.numeroRecu}
            onChange={(e) => setFormData({ ...formData, numeroRecu: e.target.value })}
            className={errors.numeroRecu ? 'border-destructive' : ''}
          />
          {errors.numeroRecu && <p className="text-sm text-destructive">{errors.numeroRecu}</p>}
        </div>

        {/* Justificatif */}
        <div className="space-y-2 md:col-span-2">
          <Label className="flex items-center gap-2">
            <Upload size={16} className="text-muted-foreground" />
            Justificatif (optionnel)
          </Label>
          
          {!justificatif ? (
            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-accent hover:bg-accent/5"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-1">
                Cliquez pour télécharger ou glissez-déposez
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, JPG, PNG (max. 10 Mo)
              </p>
              <input
                id="file-upload"
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
          disabled={submitting}
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
