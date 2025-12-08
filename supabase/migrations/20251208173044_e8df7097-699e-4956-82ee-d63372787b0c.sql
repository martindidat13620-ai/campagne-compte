-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Mandataires can view their candidats" ON public.candidats;

-- Créer une politique qui permet aux mandataires de voir les candidats auxquels ils sont liés
CREATE POLICY "Mandataires can view their linked candidats" ON public.candidats
  FOR SELECT USING (
    public.has_role(auth.uid(), 'comptable')
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.mandataire_candidats mc
      JOIN public.mandataires m ON m.id = mc.mandataire_id
      WHERE mc.candidat_id = candidats.id
      AND m.user_id = auth.uid()
    )
  );