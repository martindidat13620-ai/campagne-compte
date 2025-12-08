export type UserRole = 'mandataire' | 'comptable' | 'candidat';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  mandataireId?: string;
  nom: string;
  prenom: string;
}

export interface Mandataire {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  circonscription: string;
  typeElection: string;
  plafondDepenses: number;
  dateDebut: string;
  dateFin: string;
  candidatNom?: string;
}

export type OperationType = 'recette' | 'depense';
export type ValidationStatus = 'en_attente' | 'validee' | 'refusee';
export type ModePaiement = 'especes' | 'cheque' | 'virement' | 'carte' | 'prelevement';

export interface Operation {
  id: string;
  mandataireId: string;
  type: OperationType;
  date: string;
  montant: number;
  modePaiement: ModePaiement;
  categorie: string;
  beneficiaire?: string;
  donateurNom?: string;
  donateurAdresse?: string;
  donateurNationalite?: string;
  numeroRecu?: string;
  commentaire?: string;
  pieceJustificativeUrl?: string;
  statutValidation: ValidationStatus;
  commentaireComptable?: string;
  dateCreation: string;
  dateModification: string;
}

export interface PlafondCalcul {
  mandataireId: string;
  totalDepenses: number;
  pourcentagePlafond: number;
  depensesRestantes: number;
  totalRecettes: number;
}

export const CATEGORIES_DEPENSES = [
  'Communication',
  'Réunions publiques',
  'Déplacements',
  'Personnel',
  'Matériel',
  'Impression',
  'Location',
  'Restauration',
  'Téléphonie',
  'Internet/Web',
  'Frais postaux',
  'Autres'
];

export const CATEGORIES_RECETTES = [
  'Don de personne physique',
  'Apport personnel du candidat',
  'Contribution parti politique',
  'Prêt bancaire',
  'Autres'
];

export const MODES_PAIEMENT: { value: ModePaiement; label: string }[] = [
  { value: 'cheque', label: 'Chèque' },
  { value: 'virement', label: 'Virement' },
  { value: 'carte', label: 'Carte bancaire' },
  { value: 'especes', label: 'Espèces' },
  { value: 'prelevement', label: 'Prélèvement' },
];
