-- Créer la table operations pour stocker dépenses et recettes
CREATE TABLE public.operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidat_id UUID NOT NULL REFERENCES public.candidats(id) ON DELETE CASCADE,
  mandataire_id UUID NOT NULL REFERENCES public.mandataires(id) ON DELETE CASCADE,
  type_operation TEXT NOT NULL CHECK (type_operation IN ('depense', 'recette')),
  date DATE NOT NULL,
  montant NUMERIC(10, 2) NOT NULL CHECK (montant > 0),
  beneficiaire TEXT,
  categorie TEXT NOT NULL,
  mode_paiement TEXT NOT NULL,
  commentaire TEXT,
  -- Champs spécifiques aux recettes (dons)
  donateur_nom TEXT,
  donateur_adresse TEXT,
  donateur_nationalite TEXT,
  numero_recu TEXT,
  -- Justificatif
  justificatif_url TEXT,
  justificatif_nom TEXT,
  -- Validation
  statut_validation TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut_validation IN ('en_attente', 'validee', 'rejetee')),
  commentaire_comptable TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;

-- Trigger pour updated_at
CREATE TRIGGER update_operations_updated_at
BEFORE UPDATE ON public.operations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Politiques RLS

-- Les comptables peuvent tout faire
CREATE POLICY "Comptables can manage all operations" ON public.operations
  FOR ALL USING (public.has_role(auth.uid(), 'comptable'));

-- Les mandataires peuvent voir et créer des opérations pour leurs candidats
CREATE POLICY "Mandataires can view their operations" ON public.operations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mandataires m
      WHERE m.id = operations.mandataire_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Mandataires can insert operations" ON public.operations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mandataires m
      WHERE m.id = operations.mandataire_id
      AND m.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.mandataire_candidats mc
      WHERE mc.mandataire_id = operations.mandataire_id
      AND mc.candidat_id = operations.candidat_id
    )
  );

-- Les candidats peuvent voir les opérations de leur campagne (lecture seule)
CREATE POLICY "Candidats can view their operations" ON public.operations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.candidats c
      WHERE c.id = operations.candidat_id
      AND c.user_id = auth.uid()
    )
  );

-- Index pour améliorer les performances
CREATE INDEX idx_operations_candidat ON public.operations(candidat_id);
CREATE INDEX idx_operations_mandataire ON public.operations(mandataire_id);
CREATE INDEX idx_operations_date ON public.operations(date DESC);
CREATE INDEX idx_operations_statut ON public.operations(statut_validation);