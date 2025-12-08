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
    mandataireId: 'm1',
    type: 'depense',
    date: '2024-05-15',
    montant: 2500,
    modePaiement: 'virement',
    categorie: 'Communication',
    beneficiaire: 'Imprimerie Paris',
    commentaire: 'Impression tracts',
    pieceJustificativeUrl: '/justificatifs/facture_001.pdf',
    statutValidation: 'validee',
    dateCreation: '2024-05-15T10:00:00',
    dateModification: '2024-05-16T14:30:00'
  },
  {
    id: 'op2',
    mandataireId: 'm1',
    type: 'depense',
    date: '2024-05-20',
    montant: 800,
    modePaiement: 'carte',
    categorie: 'Réunions publiques',
    beneficiaire: 'Salle des fêtes',
    commentaire: 'Location salle meeting',
    pieceJustificativeUrl: '/justificatifs/facture_002.pdf',
    statutValidation: 'validee',
    dateCreation: '2024-05-20T09:00:00',
    dateModification: '2024-05-21T11:00:00'
  },
  {
    id: 'op3',
    mandataireId: 'm1',
    type: 'depense',
    date: '2024-05-25',
    montant: 1200,
    modePaiement: 'cheque',
    categorie: 'Déplacements',
    beneficiaire: 'SNCF',
    pieceJustificativeUrl: '/justificatifs/facture_003.pdf',
    statutValidation: 'en_attente',
    dateCreation: '2024-05-25T15:00:00',
    dateModification: '2024-05-25T15:00:00'
  },
  {
    id: 'op4',
    mandataireId: 'm1',
    type: 'depense',
    date: '2024-06-01',
    montant: 3500,
    modePaiement: 'virement',
    categorie: 'Communication',
    beneficiaire: 'Agence Web',
    commentaire: 'Site internet campagne',
    statutValidation: 'refusee',
    commentaireComptable: 'Justificatif manquant',
    dateCreation: '2024-06-01T10:00:00',
    dateModification: '2024-06-02T09:00:00'
  },
  {
    id: 'op5',
    mandataireId: 'm1',
    type: 'recette',
    date: '2024-05-10',
    montant: 500,
    modePaiement: 'cheque',
    categorie: 'Don de personne physique',
    donateurNom: 'Jean Martin',
    donateurAdresse: '12 rue de la Paix, 75001 Paris',
    donateurNationalite: 'Française',
    numeroRecu: 'RC-2024-001',
    pieceJustificativeUrl: '/justificatifs/recu_001.pdf',
    statutValidation: 'validee',
    dateCreation: '2024-05-10T14:00:00',
    dateModification: '2024-05-11T10:00:00'
  },
  {
    id: 'op6',
    mandataireId: 'm1',
    type: 'recette',
    date: '2024-05-12',
    montant: 5000,
    modePaiement: 'virement',
    categorie: 'Apport personnel du candidat',
    donateurNom: 'Pierre Durand',
    numeroRecu: 'RC-2024-002',
    pieceJustificativeUrl: '/justificatifs/recu_002.pdf',
    statutValidation: 'validee',
    dateCreation: '2024-05-12T11:00:00',
    dateModification: '2024-05-13T09:00:00'
  },
  {
    id: 'op7',
    mandataireId: 'm1',
    type: 'depense',
    date: '2024-06-05',
    montant: 450,
    modePaiement: 'carte',
    categorie: 'Restauration',
    beneficiaire: 'Restaurant Le Parisien',
    commentaire: 'Déjeuner équipe campagne',
    pieceJustificativeUrl: '/justificatifs/facture_004.pdf',
    statutValidation: 'validee',
    dateCreation: '2024-06-05T20:00:00',
    dateModification: '2024-06-06T10:00:00'
  },
  {
    id: 'op8',
    mandataireId: 'm1',
    type: 'depense',
    date: '2024-06-10',
    montant: 1800,
    modePaiement: 'virement',
    categorie: 'Personnel',
    beneficiaire: 'Interim Plus',
    commentaire: 'Personnel distribution tracts',
    pieceJustificativeUrl: '/justificatifs/facture_005.pdf',
    statutValidation: 'en_attente',
    dateCreation: '2024-06-10T16:00:00',
    dateModification: '2024-06-10T16:00:00'
  },
  {
    id: 'op9',
    mandataireId: 'm2',
    type: 'depense',
    date: '2024-05-18',
    montant: 4200,
    modePaiement: 'virement',
    categorie: 'Communication',
    beneficiaire: 'Print Lyon',
    pieceJustificativeUrl: '/justificatifs/facture_m2_001.pdf',
    statutValidation: 'validee',
    dateCreation: '2024-05-18T10:00:00',
    dateModification: '2024-05-19T11:00:00'
  },
  {
    id: 'op10',
    mandataireId: 'm2',
    type: 'recette',
    date: '2024-05-08',
    montant: 8000,
    modePaiement: 'virement',
    categorie: 'Apport personnel du candidat',
    donateurNom: 'Marc Lefebvre',
    numeroRecu: 'RC-M2-001',
    pieceJustificativeUrl: '/justificatifs/recu_m2_001.pdf',
    statutValidation: 'validee',
    dateCreation: '2024-05-08T09:00:00',
    dateModification: '2024-05-09T10:00:00'
  },
  {
    id: 'op11',
    mandataireId: 'm3',
    type: 'depense',
    date: '2024-05-22',
    montant: 1500,
    modePaiement: 'cheque',
    categorie: 'Location',
    beneficiaire: 'Mairie Marseille',
    statutValidation: 'en_attente',
    dateCreation: '2024-05-22T14:00:00',
    dateModification: '2024-05-22T14:00:00'
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

  const operations = mockOperations.filter(op => op.mandataireId === mandataireId);
  const depensesValidees = operations
    .filter(op => op.type === 'depense' && op.statutValidation === 'validee')
    .reduce((sum, op) => sum + op.montant, 0);
  
  const totalRecettes = operations
    .filter(op => op.type === 'recette' && op.statutValidation === 'validee')
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
  return mockOperations.filter(op => op.mandataireId === mandataireId);
}

export function getMandataireById(id: string): MockMandataire | undefined {
  return mockMandataires.find(m => m.id === id);
}
