import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Calendar, Euro, CreditCard, FileText, X, AlertCircle } from 'lucide-react';
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
import { CATEGORIES_DEPENSES, MODES_PAIEMENT } from '@/types';
import { toast } from '@/hooks/use-toast';

export function DepenseForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    montant: '',
    beneficiaire: '',
    categorie: '',
    modePaiement: '',
    commentaire: '',
  });
  const [justificatif, setJustificatif] = useState<File | null>(null);
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

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) newErrors.date = 'La date est obligatoire';
    if (!formData.montant || parseFloat(formData.montant) <= 0) {
      newErrors.montant = 'Montant invalide';
    }
    if (!formData.beneficiaire.trim()) newErrors.beneficiaire = 'Le bénéficiaire est obligatoire';
    if (!formData.categorie) newErrors.categorie = 'La catégorie est obligatoire';
    if (!formData.modePaiement) newErrors.modePaiement = 'Le mode de paiement est obligatoire';
    if (!justificatif) newErrors.justificatif = 'Le justificatif est obligatoire';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    // Simulated submission
    toast({
      title: "Dépense enregistrée",
      description: `Dépense de ${parseFloat(formData.montant).toLocaleString('fr-FR')} € ajoutée avec succès`,
    });

    navigate('/dashboard');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Bénéficiaire */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="beneficiaire">Bénéficiaire *</Label>
          <Input
            id="beneficiaire"
            placeholder="Nom du fournisseur ou prestataire"
            value={formData.beneficiaire}
            onChange={(e) => setFormData({ ...formData, beneficiaire: e.target.value })}
            className={errors.beneficiaire ? 'border-destructive' : ''}
          />
          {errors.beneficiaire && <p className="text-sm text-destructive">{errors.beneficiaire}</p>}
        </div>

        {/* Catégorie */}
        <div className="space-y-2">
          <Label>Catégorie *</Label>
          <Select
            value={formData.categorie}
            onValueChange={(value) => setFormData({ ...formData, categorie: value })}
          >
            <SelectTrigger className={errors.categorie ? 'border-destructive' : ''}>
              <SelectValue placeholder="Sélectionner une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES_DEPENSES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categorie && <p className="text-sm text-destructive">{errors.categorie}</p>}
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

        {/* Commentaire */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="commentaire" className="flex items-center gap-2">
            <FileText size={16} className="text-muted-foreground" />
            Commentaire (optionnel)
          </Label>
          <Textarea
            id="commentaire"
            placeholder="Description ou notes supplémentaires..."
            value={formData.commentaire}
            onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
            rows={3}
          />
        </div>

        {/* Justificatif */}
        <div className="space-y-2 md:col-span-2">
          <Label className="flex items-center gap-2">
            <Upload size={16} className="text-muted-foreground" />
            Justificatif *
          </Label>
          
          {!justificatif ? (
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-accent hover:bg-accent/5 ${
                errors.justificatif ? 'border-destructive bg-destructive/5' : 'border-border'
              }`}
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
          
          {errors.justificatif && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.justificatif}
            </p>
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
        >
          Annuler
        </Button>
        <Button type="submit" className="flex-1 sm:flex-none bg-primary hover:bg-primary/90">
          Enregistrer la dépense
        </Button>
      </div>
    </form>
  );
}
