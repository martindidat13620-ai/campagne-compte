CREATE TABLE public.rapprochements_bancaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidat_id uuid NOT NULL REFERENCES public.candidats(id) ON DELETE CASCADE,
  mois text NOT NULL,
  solde_debut numeric NOT NULL DEFAULT 0,
  solde_fin numeric NOT NULL DEFAULT 0,
  operations_pointees uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (candidat_id, mois)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rapprochements_bancaires TO authenticated;
GRANT ALL ON public.rapprochements_bancaires TO service_role;
ALTER TABLE public.rapprochements_bancaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comptables manage rapprochements" ON public.rapprochements_bancaires FOR ALL TO authenticated
USING (public.is_comptable_for_candidat(auth.uid(), candidat_id))
WITH CHECK (public.is_comptable_for_candidat(auth.uid(), candidat_id));
CREATE TRIGGER update_rapprochements_updated_at BEFORE UPDATE ON public.rapprochements_bancaires FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();