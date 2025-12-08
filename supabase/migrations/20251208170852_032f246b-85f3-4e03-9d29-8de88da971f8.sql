-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Mandataires can view their candidats" ON public.candidats;
DROP POLICY IF EXISTS "Candidats can view their mandataires" ON public.mandataires;
DROP POLICY IF EXISTS "Mandataires can view their links" ON public.mandataire_candidats;

-- Create simpler, non-recursive policies for campaigns
CREATE POLICY "Users can view their campaigns" ON public.campaigns
  FOR SELECT USING (
    public.has_role(auth.uid(), 'comptable')
    OR EXISTS (SELECT 1 FROM public.candidats WHERE candidats.user_id = auth.uid() AND candidats.campaign_id = campaigns.id)
  );

-- Simpler policy for candidats - avoid joins to mandataire_candidats
CREATE POLICY "Mandataires can view their candidats" ON public.candidats
  FOR SELECT USING (
    public.has_role(auth.uid(), 'comptable')
    OR candidats.user_id = auth.uid()
  );

-- Simpler policy for mandataires
CREATE POLICY "Candidats can view their mandataires" ON public.mandataires
  FOR SELECT USING (
    public.has_role(auth.uid(), 'comptable')
    OR mandataires.user_id = auth.uid()
  );

-- Simpler policy for mandataire_candidats
CREATE POLICY "Users can view mandataire_candidats links" ON public.mandataire_candidats
  FOR SELECT USING (
    public.has_role(auth.uid(), 'comptable')
  );