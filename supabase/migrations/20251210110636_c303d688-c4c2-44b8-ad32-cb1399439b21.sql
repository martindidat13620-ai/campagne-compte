
-- Update SELECT policy to also allow viewing campaigns created by the user
DROP POLICY IF EXISTS "Comptables can view their campaigns" ON public.campaigns;

CREATE POLICY "Comptables can view their campaigns" 
ON public.campaigns 
FOR SELECT 
USING (
  is_comptable_for_campaign(id, auth.uid()) 
  OR created_by = auth.uid()
  OR (EXISTS ( SELECT 1
   FROM candidats
  WHERE ((candidats.user_id = auth.uid()) AND (candidats.campaign_id = campaigns.id)))) 
  OR mandataire_has_campaign_access(id, auth.uid())
);
