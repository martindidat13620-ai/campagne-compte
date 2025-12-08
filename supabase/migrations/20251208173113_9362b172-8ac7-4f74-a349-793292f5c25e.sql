-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Users can view their campaigns" ON public.campaigns;

-- Créer une politique qui permet aux mandataires de voir les campagnes de leurs candidats
CREATE POLICY "Users can view their campaigns" ON public.campaigns
  FOR SELECT USING (
    public.has_role(auth.uid(), 'comptable')
    OR EXISTS (
      SELECT 1 FROM public.candidats 
      WHERE candidats.user_id = auth.uid() 
      AND candidats.campaign_id = campaigns.id
    )
    OR EXISTS (
      SELECT 1 FROM public.mandataire_candidats mc
      JOIN public.mandataires m ON m.id = mc.mandataire_id
      JOIN public.candidats c ON c.id = mc.candidat_id
      WHERE m.user_id = auth.uid()
      AND c.campaign_id = campaigns.id
    )
  );