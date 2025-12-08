-- Supprimer l'ancienne politique restrictive
DROP POLICY IF EXISTS "Users can view mandataire_candidats links" ON public.mandataire_candidats;

-- Créer une nouvelle politique qui permet aux mandataires de voir leurs propres liens
CREATE POLICY "Users can view their mandataire_candidats links" ON public.mandataire_candidats
  FOR SELECT USING (
    public.has_role(auth.uid(), 'comptable')
    OR EXISTS (
      SELECT 1 FROM public.mandataires 
      WHERE mandataires.id = mandataire_candidats.mandataire_id 
      AND mandataires.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.candidats 
      WHERE candidats.id = mandataire_candidats.candidat_id 
      AND candidats.user_id = auth.uid()
    )
  );