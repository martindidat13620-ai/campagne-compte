import { Operation, PlafondCalcul } from '@/types';

// Mock mandataire data for demo (using old structure temporarily)
export interface MockMandataire {
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
  candidatNom: string;
}

export const mockMandataires: MockMandataire[] = [
  {
    id: 'm1',
    nom: 'Dupont',
    prenom: 'Marie',
    email: 'marie.dupont@email.fr',
    telephone: '06 12 34 56 78',
    circonscription: 'Paris 5ème',
    typeElection: 'Législatives 2024',
    plafondDepenses: 38000,
    dateDebut: '2024-05-01',
    dateFin: '2024-07-15',
    candidatNom: 'Pierre Durand'
  },
  {
    id: 'm2',
    nom: 'Bernard',
    prenom: 'Sophie',
    email: 'sophie.bernard@email.fr',
    telephone: '06 98 76 54 32',
    circonscription: 'Lyon 3ème',
    typeElection: 'Législatives 2024',
    plafondDepenses: 42000,
    dateDebut: '2024-05-01',
    dateFin: '2024-07-15',
    candidatNom: 'Marc Lefebvre'
  },
  {
    id: 'm3',
    nom: 'Petit',
    prenom: 'François',
    email: 'francois.petit@email.fr',
    telephone: '06 55 44 33 22',
    circonscription: 'Marseille 1ère',
    typeElection: 'Législatives 2024',
    plafondDepenses: 35000,
    dateDebut: '2024-05-01',
    dateFin: '2024-07-15',
    candidatNom: 'Claire Moreau'
  }
];

export const mockOperations: Operation[] = [
  {
    id: 'op1',
    candidat_id: 'c1',
    mandataire_id: 'm1',
    type_operation: 'depense',
    date: '2024-05-15',
    montant: 2500,
    mode_paiement: 'virement',
    categorie: 'Communication',
    beneficiaire: 'Imprimerie Paris',
    commentaire: 'Impression tracts',
    justificatif_url: '/justificatifs/facture_001.pdf',
    statut_validation: 'validee',
    created_at: '2024-05-15T10:00:00',
    updated_at: '2024-05-16T14:30:00'
  },
  {
    id: 'op2',
    candidat_id: 'c1',
    mandataire_id: 'm1',
    type_operation: 'depense',
    date: '2024-05-20',
    montant: 800,
    mode_paiement: 'carte',
    categorie: 'Réunions publiques',
    beneficiaire: 'Salle des fêtes',
    commentaire: 'Location salle meeting',
    justificatif_url: '/justificatifs/facture_002.pdf',
    statut_validation: 'validee',
    created_at: '2024-05-20T09:00:00',
    updated_at: '2024-05-21T11:00:00'
  },
  {
    id: 'op3',
    candidat_id: 'c1',
    mandataire_id: 'm1',
    type_operation: 'depense',
    date: '2024-05-25',
    montant: 1200,
    mode_paiement: 'cheque',
    categorie: 'Déplacements',
    beneficiaire: 'SNCF',
    justificatif_url: '/justificatifs/facture_003.pdf',
    statut_validation: 'en_attente',
    created_at: '2024-05-25T15:00:00',
    updated_at: '2024-05-25T15:00:00'
  },
  {
    id: 'op4',
    candidat_id: 'c1',
    mandataire_id: 'm1',
    type_operation: 'depense',
    date: '2024-06-01',
    montant: 3500,
    mode_paiement: 'virement',
    categorie: 'Communication',
    beneficiaire: 'Agence Web',
    commentaire: 'Site internet campagne',
    statut_validation: 'rejetee',
    commentaire_comptable: 'Justificatif manquant',
    created_at: '2024-06-01T10:00:00',
    updated_at: '2024-06-02T09:00:00'
  },
  {
    id: 'op5',
    candidat_id: 'c1',
    mandataire_id: 'm1',
    type_operation: 'recette',
    date: '2024-05-10',
    montant: 500,
    mode_paiement: 'cheque',
    categorie: 'Don de personne physique',
    donateur_nom: 'Jean Martin',
    donateur_adresse: '12 rue de la Paix, 75001 Paris',
    donateur_nationalite: 'Française',
    numero_recu: 'RC-2024-001',
    justificatif_url: '/justificatifs/recu_001.pdf',
    statut_validation: 'validee',
    created_at: '2024-05-10T14:00:00',
    updated_at: '2024-05-11T10:00:00'
  },
  {
    id: 'op6',
    candidat_id: 'c1',
    mandataire_id: 'm1',
    type_operation: 'recette',
    date: '2024-05-12',
    montant: 5000,
    mode_paiement: 'virement',
    categorie: 'Apport personnel du candidat',
    donateur_nom: 'Pierre Durand',
    numero_recu: 'RC-2024-002',
    justificatif_url: '/justificatifs/recu_002.pdf',
    statut_validation: 'validee',
    created_at: '2024-05-12T11:00:00',
    updated_at: '2024-05-13T09:00:00'
  },
  {
    id: 'op7',
    candidat_id: 'c1',
    mandataire_id: 'm1',
    type_operation: 'depense',
    date: '2024-06-05',
    montant: 450,
    mode_paiement: 'carte',
    categorie: 'Restauration',
    beneficiaire: 'Restaurant Le Parisien',
    commentaire: 'Déjeuner équipe campagne',
    justificatif_url: '/justificatifs/facture_004.pdf',
    statut_validation: 'validee',
    created_at: '2024-06-05T20:00:00',
    updated_at: '2024-06-06T10:00:00'
  },
  {
    id: 'op8',
    candidat_id: 'c1',
    mandataire_id: 'm1',
    type_operation: 'depense',
    date: '2024-06-10',
    montant: 1800,
    mode_paiement: 'virement',
    categorie: 'Personnel',
    beneficiaire: 'Interim Plus',
    commentaire: 'Personnel distribution tracts',
    justificatif_url: '/justificatifs/facture_005.pdf',
    statut_validation: 'en_attente',
    created_at: '2024-06-10T16:00:00',
    updated_at: '2024-06-10T16:00:00'
  },
  {
    id: 'op9',
    candidat_id: 'c2',
    mandataire_id: 'm2',
    type_operation: 'depense',
    date: '2024-05-18',
    montant: 4200,
    mode_paiement: 'virement',
    categorie: 'Communication',
    beneficiaire: 'Print Lyon',
    justificatif_url: '/justificatifs/facture_m2_001.pdf',
    statut_validation: 'validee',
    created_at: '2024-05-18T10:00:00',
    updated_at: '2024-05-19T11:00:00'
  },
  {
    id: 'op10',
    candidat_id: 'c2',
    mandataire_id: 'm2',
    type_operation: 'recette',
    date: '2024-05-08',
    montant: 8000,
    mode_paiement: 'virement',
    categorie: 'Apport personnel du candidat',
    donateur_nom: 'Marc Lefebvre',
    numero_recu: 'RC-M2-001',
    justificatif_url: '/justificatifs/recu_m2_001.pdf',
    statut_validation: 'validee',
    created_at: '2024-05-08T09:00:00',
    updated_at: '2024-05-09T10:00:00'
  },
  {
    id: 'op11',
    candidat_id: 'c3',
    mandataire_id: 'm3',
    type_operation: 'depense',
    date: '2024-05-22',
    montant: 1500,
    mode_paiement: 'cheque',
    categorie: 'Location',
    beneficiaire: 'Mairie Marseille',
    statut_validation: 'en_attente',
    created_at: '2024-05-22T14:00:00',
    updated_at: '2024-05-22T14:00:00'
  }
];

export function calculatePlafond(mandataireId: string): PlafondCalcul {
  const mandataire = mockMandataires.find(m => m.id === mandataireId);
  if (!mandataire) {
    return {
      mandataireId,
      totalDepenses: 0,
      pourcentagePlafond: 0,
      depensesRestantes: 0,
      totalRecettes: 0
    };
  }

  const operations = mockOperations.filter(op => op.mandataire_id === mandataireId);
  const depensesValidees = operations
    .filter(op => op.type_operation === 'depense' && op.statut_validation === 'validee')
    .reduce((sum, op) => sum + op.montant, 0);
  
  const totalRecettes = operations
    .filter(op => op.type_operation === 'recette' && op.statut_validation === 'validee')
    .reduce((sum, op) => sum + op.montant, 0);

  const pourcentage = (depensesValidees / mandataire.plafondDepenses) * 100;

  return {
    mandataireId,
    totalDepenses: depensesValidees,
    pourcentagePlafond: Math.round(pourcentage * 10) / 10,
    depensesRestantes: mandataire.plafondDepenses - depensesValidees,
    totalRecettes
  };
}

export function getOperationsByMandataire(mandataireId: string): Operation[] {
  return mockOperations.filter(op => op.mandataire_id === mandataireId);
}

export function getMandataireById(id: string): MockMandataire | undefined {
  return mockMandataires.find(m => m.id === id);
}
