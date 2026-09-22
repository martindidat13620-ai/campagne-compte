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
  created_by?: string | null;
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
  // Champs donateur
  donateur_nom?: string | null;
  donateur_prenom?: string | null;
  donateur_adresse?: string | null;
  donateur_code_postal?: string | null;
  donateur_ville?: string | null;
  donateur_pays?: string | null;
  donateur_nationalite?: string | null;
  numero_recu?: string | null;
  numero_releve_bancaire?: string | null;
  numero_cheque?: string | null;
  // Champs collecte
  is_collecte?: boolean;
  collecte_date?: string | null;
  collecte_organisation?: string | null;
  // Champs parti politique
  parti_nom?: string | null;
  parti_adresse?: string | null;
  parti_code_postal?: string | null;
  parti_ville?: string | null;
  parti_siret?: string | null;
  parti_rna?: string | null;
  // Autres
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

// Structure des catégories de dépenses avec compte comptable
export interface CategorieDepense {
  value: string;
  label: string;
  compteComptable: string;
  parent?: string; // Pour les sous-catégories
  piecesJustificatives?: string; // Pièces justificatives attendues
}

export const CATEGORIES_DEPENSES: CategorieDepense[] = [
  { value: 'materiels', label: 'Matériels (valeur d\'utilisation)', compteComptable: '6051', piecesJustificatives: 'Facture, paiement, inventaire, méthode, comparables et revente éventuelle.' },
  { value: 'achats_fournitures', label: 'Achats de fournitures et de marchandises', compteComptable: '6060', piecesJustificatives: 'Facture détaillée, paiement, livraison et preuve d\'utilisation.' },
  // Locations
  { value: 'location_immobiliere', label: 'Location ou mise à disposition immobilière', compteComptable: '6132', parent: 'Location', piecesJustificatives: 'Bail, quittances, paiements, charges et calcul du prorata.' },
  { value: 'location_materiel', label: 'Location ou mise à disposition de matériel', compteComptable: '6135', parent: 'Location', piecesJustificatives: 'Contrat, devis, facture, paiement, inventaire et dates de restitution.' },
  // Personnel
  { value: 'personnel_salarie', label: 'Personnel recruté pour la campagne, y compris charges sociales', compteComptable: '6400', parent: 'Personnel', piecesJustificatives: 'Contrats, DPAE, postes, heures, paie, charges et paiements.' },
  { value: 'personnel_interimaire', label: 'Personnel intérimaire', compteComptable: '6210', parent: 'Personnel', piecesJustificatives: 'Contrat de mise à disposition, heures, tâches, facture et paiement.' },
  { value: 'personnel_mis_disposition', label: 'Personnel mis à disposition', compteComptable: '6211', parent: 'Personnel', piecesJustificatives: 'Convention de mise à disposition, heures, tâches, valorisation et justificatifs correspondants.' },
  // Honoraires
  { value: 'honoraires_communication', label: 'Honoraires et conseils en communication', compteComptable: '6226', parent: 'Honoraires', piecesJustificatives: 'Contrat, devis, cahier des charges, intervenants, temps, livrables, facture et paiement.' },
  { value: 'honoraires_expert_comptable', label: 'Honoraires d\'expert-comptable', compteComptable: '6229', parent: 'Honoraires', piecesJustificatives: 'Lettre de mission, diligences, facture ventilée, avenants et paiement.' },
  // Communication et production
  { value: 'productions_audiovisuelles', label: 'Production audiovisuel', compteComptable: '6230', piecesJustificatives: 'Contrats, factures, paiements, captures datées, URL, statistiques et livrables.' },
  { value: 'publications_impressions', label: 'Publications et impressions hors campagne officielle', compteComptable: '6237', piecesJustificatives: 'Devis, BAT, facture avec format/quantité, paiement, exemplaire et bon de livraison.' },
  { value: 'enquetes_sondages', label: 'Enquêtes et sondages', compteComptable: '6235', piecesJustificatives: 'Contrat, questionnaire, méthode, terrain, échantillon, résultats, facture et paiement.' },
  // Autres charges
  { value: 'transports_deplacements', label: 'Transports et déplacements', compteComptable: '6240', piecesJustificatives: 'État daté (conducteur, véhicule, trajet, km, motif), carte grise, barème et factures.' },
  { value: 'reunions_publiques', label: 'Manifestations, meetings et réunions publiques', compteComptable: '6254', piecesJustificatives: 'Dossier par événement : date, lieu, contrats, factures, paiements, programme et recettes.' },
  { value: 'reception_hebergement', label: 'Réception et hébergement', compteComptable: '6257', piecesJustificatives: 'Facture, paiement, date, objet, participants, coût par personne et justificatif du déplacement.' },
  { value: 'frais_postaux', label: 'Frais postaux et de distribution', compteComptable: '6260', piecesJustificatives: 'Factures, bordereaux, quantités, zones, dates, contrat et preuve du service.' },
  { value: 'telephone_telecommunications', label: 'Téléphone et télécommunications', compteComptable: '6262', piecesJustificatives: 'Contrat, factures, paiement, consommation, période et méthode de prorata.' },
  { value: 'frais_divers', label: 'Frais divers', compteComptable: '6280', piecesJustificatives: 'Facture, paiement, note de classement et preuve du service.' },
  { value: 'frais_financiers', label: 'Frais financiers et intérêts d\'emprunt', compteComptable: '6600', piecesJustificatives: 'Contrat, échéancier, relevés, preuve de paiement et calcul du prorata.' },
  { value: 'frais_financiers_candidat', label: 'Frais financiers payés directement par le candidat', compteComptable: '6613', piecesJustificatives: 'Contrat, échéancier, relevés personnels occultés et attestation bancaire.' },
  { value: 'menues_depenses_candidat', label: 'Menues dépenses payées directement par le candidat', compteComptable: '6789', piecesJustificatives: 'Factures, paiements, relevés personnels occultés et état récapitulatif.' },
];

// Fonction helper pour obtenir les pièces justificatives attendues d'une catégorie de dépense
export function getPiecesJustificativesDepense(categorieValue: string): string | undefined {
  return CATEGORIES_DEPENSES.find(cat => cat.value === categorieValue)?.piecesJustificatives;
}

// Fonction helper pour obtenir le compte comptable d'une catégorie de dépense
export function getCompteComptableDepense(categorieValue: string): string | undefined {
  return CATEGORIES_DEPENSES.find(cat => cat.value === categorieValue)?.compteComptable;
}

// Fonction helper pour obtenir le label d'une catégorie de dépense
export function getCategorieDepenseLabel(categorieValue: string): string | undefined {
  return CATEGORIES_DEPENSES.find(cat => cat.value === categorieValue)?.label;
}

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
