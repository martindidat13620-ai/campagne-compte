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
  compte_comptable?: string | null;
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

// Structure des catégories de recettes avec compte comptable
export interface CategorieRecette {
  value: string;
  label: string;
  compteComptable: string;
  parent?: string; // Pour les sous-catégories
}

export const CATEGORIES_RECETTES: CategorieRecette[] = [
  { value: 'dons', label: 'Dons', compteComptable: '7010' },
  { value: 'versements_personnels', label: 'Versements personnels des candidats au mandataire', compteComptable: '7021' },
  // Emprunts
  { value: 'emprunts_bancaires', label: 'Emprunts bancaires des candidats', compteComptable: '7022', parent: 'Emprunts' },
  { value: 'emprunts_formations_politiques', label: 'Emprunts des candidats auprès des formations politiques', compteComptable: '7023', parent: 'Emprunts' },
  { value: 'emprunts_personnes_physiques', label: 'Emprunts des candidats auprès des personnes physiques', compteComptable: '7025', parent: 'Emprunts' },
  // Versements formations politiques
  { value: 'versements_formations_politiques', label: 'Versements définitifs des formations politiques', compteComptable: '7031' },
  { value: 'depenses_directes_formations', label: 'Dépenses payées directement par les formations politiques', compteComptable: '7032' },
  // Concours en nature
  { value: 'concours_nature_candidats', label: 'Concours en nature fournis par les candidats', compteComptable: '7050', parent: 'Concours en nature' },
  { value: 'concours_nature_formations', label: 'Concours en nature fournis par les formations politiques', compteComptable: '7051', parent: 'Concours en nature' },
  { value: 'concours_nature_personnes', label: 'Concours en nature fournis par les personnes physiques', compteComptable: '7052', parent: 'Concours en nature' },
  // Autres
  { value: 'produits_divers', label: 'Produits divers', compteComptable: '7580' },
  { value: 'produits_financiers', label: 'Produits financiers', compteComptable: '7600' },
];

// Fonction helper pour obtenir le compte comptable d'une catégorie
export function getCompteComptable(categorieValue: string): string | undefined {
  return CATEGORIES_RECETTES.find(cat => cat.value === categorieValue)?.compteComptable;
}

// Fonction helper pour obtenir le label d'une catégorie
export function getCategorieLabel(categorieValue: string): string | undefined {
  return CATEGORIES_RECETTES.find(cat => cat.value === categorieValue)?.label;
}

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
