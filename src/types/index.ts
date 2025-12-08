export type UserRole = 'mandataire' | 'comptable' | 'candidat';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  nom: string;
  prenom: string;
}

export interface Profile {
  id: string;
  email: string;
  nom: string | null;
  prenom: string | null;
  telephone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  nom: string;
  type_election: string;
  annee: number;
  date_debut: string | null;
  date_fin: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Candidat {
  id: string;
  user_id: string | null;
  campaign_id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  circonscription: string | null;
  plafond_depenses: number;
  created_at: string;
  updated_at: string;
}

export interface Mandataire {
  id: string;
  user_id: string | null;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  created_at: string;
  updated_at: string;
}

export type OperationType = 'recette' | 'depense';
export type ValidationStatus = 'en_attente' | 'validee' | 'rejetee';
export type ModePaiement = 'especes' | 'cheque' | 'virement' | 'carte' | 'prelevement';

export interface Operation {
  id: string;
  candidat_id: string;
  mandataire_id: string;
  type_operation: OperationType;
  date: string;
  montant: number;
  mode_paiement: string;
  categorie: string;
  beneficiaire?: string | null;
  donateur_nom?: string | null;
  donateur_adresse?: string | null;
  donateur_nationalite?: string | null;
  numero_recu?: string | null;
  commentaire?: string | null;
  justificatif_url?: string | null;
  justificatif_nom?: string | null;
  statut_validation: ValidationStatus;
  commentaire_comptable?: string | null;
  created_at: string;
  updated_at: string;
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

export const TYPES_ELECTION = [
  'Élections législatives',
  'Élections municipales',
  'Élections régionales',
  'Élections départementales',
  'Élections européennes',
  'Élection présidentielle',
];
