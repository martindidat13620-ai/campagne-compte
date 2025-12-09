-- Create a security definer function to check if comptable has access to a campaign
CREATE OR REPLACE FUNCTION public.is_comptable_for_campaign(_user_id uuid, _campaign_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.comptable_campaigns
    WHERE comptable_id = _user_id
    AND campaign_id = _campaign_id
  )
$$;

-- Drop existing policies on campaigns
DROP POLICY IF EXISTS "Comptables can manage campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can view campaigns" ON public.campaigns;

-- Create new restrictive policies for campaigns
CREATE POLICY "Comptables can view their campaigns"
ON public.campaigns
FOR SELECT
USING (
  is_comptable_for_campaign(auth.uid(), id)
  OR EXISTS (SELECT 1 FROM candidats WHERE candidats.user_id = auth.uid() AND candidats.campaign_id = campaigns.id)
  OR mandataire_has_campaign_access(auth.uid(), id)
);

CREATE POLICY "Comptables can insert campaigns"
ON public.campaigns
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'comptable'::app_role));

CREATE POLICY "Comptables can update their campaigns"
ON public.campaigns
FOR UPDATE
USING (is_comptable_for_campaign(auth.uid(), id));

CREATE POLICY "Comptables can delete their campaigns"
ON public.campaigns
FOR DELETE
USING (is_comptable_for_campaign(auth.uid(), id));

-- Drop existing policies on candidats
DROP POLICY IF EXISTS "Comptables can manage candidats" ON public.candidats;
DROP POLICY IF EXISTS "Users can view candidats" ON public.candidats;

-- Create new restrictive policies for candidats
CREATE POLICY "Comptables can view their candidats"
ON public.candidats
FOR SELECT
USING (
  is_comptable_for_campaign(auth.uid(), campaign_id)
  OR user_id = auth.uid()
  OR is_mandataire_for_candidat(auth.uid(), id)
);

CREATE POLICY "Comptables can insert candidats"
ON public.candidats
FOR INSERT
WITH CHECK (is_comptable_for_campaign(auth.uid(), campaign_id));

CREATE POLICY "Comptables can update their candidats"
ON public.candidats
FOR UPDATE
USING (is_comptable_for_campaign(auth.uid(), campaign_id));

CREATE POLICY "Comptables can delete their candidats"
ON public.candidats
FOR DELETE
USING (is_comptable_for_campaign(auth.uid(), campaign_id));

-- Helper function to check if comptable has access to a candidat
CREATE OR REPLACE FUNCTION public.is_comptable_for_candidat(_user_id uuid, _candidat_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.candidats c
    JOIN public.comptable_campaigns cc ON cc.campaign_id = c.campaign_id
    WHERE c.id = _candidat_id
    AND cc.comptable_id = _user_id
  )
$$;

-- Drop existing policies on mandataires
DROP POLICY IF EXISTS "Comptables can manage mandataires" ON public.mandataires;
DROP POLICY IF EXISTS "Candidats can view their mandataires" ON public.mandataires;
DROP POLICY IF EXISTS "Mandataires can view themselves" ON public.mandataires;

-- Create new restrictive policies for mandataires
CREATE POLICY "Users can view mandataires"
ON public.mandataires
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM mandataire_candidats mc
    JOIN candidats c ON c.id = mc.candidat_id
    WHERE mc.mandataire_id = mandataires.id
    AND is_comptable_for_campaign(auth.uid(), c.campaign_id)
  )
);

CREATE POLICY "Comptables can insert mandataires"
ON public.mandataires
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'comptable'::app_role));

CREATE POLICY "Comptables can update mandataires"
ON public.mandataires
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM mandataire_candidats mc
    JOIN candidats c ON c.id = mc.candidat_id
    WHERE mc.mandataire_id = mandataires.id
    AND is_comptable_for_campaign(auth.uid(), c.campaign_id)
  )
);

CREATE POLICY "Comptables can delete mandataires"
ON public.mandataires
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM mandataire_candidats mc
    JOIN candidats c ON c.id = mc.candidat_id
    WHERE mc.mandataire_id = mandataires.id
    AND is_comptable_for_campaign(auth.uid(), c.campaign_id)
  )
);

-- Drop existing policies on operations
DROP POLICY IF EXISTS "Comptables can manage all operations" ON public.operations;
DROP POLICY IF EXISTS "Candidats can view their operations" ON public.operations;
DROP POLICY IF EXISTS "Mandataires can view their operations" ON public.operations;
DROP POLICY IF EXISTS "Mandataires can insert operations" ON public.operations;
DROP POLICY IF EXISTS "Mandataires can delete their operations" ON public.operations;

-- Create new restrictive policies for operations
CREATE POLICY "Comptables can view their operations"
ON public.operations
FOR SELECT
USING (is_comptable_for_candidat(auth.uid(), candidat_id));

CREATE POLICY "Comptables can update their operations"
ON public.operations
FOR UPDATE
USING (is_comptable_for_candidat(auth.uid(), candidat_id));

CREATE POLICY "Comptables can delete their operations"
ON public.operations
FOR DELETE
USING (is_comptable_for_candidat(auth.uid(), candidat_id));

CREATE POLICY "Candidats can view their operations"
ON public.operations
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM candidats c WHERE c.id = operations.candidat_id AND c.user_id = auth.uid())
);

CREATE POLICY "Mandataires can view their operations"
ON public.operations
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM mandataires m WHERE m.id = operations.mandataire_id AND m.user_id = auth.uid())
);

CREATE POLICY "Mandataires can insert operations"
ON public.operations
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM mandataires m WHERE m.id = operations.mandataire_id AND m.user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM mandataire_candidats mc WHERE mc.mandataire_id = operations.mandataire_id AND mc.candidat_id = operations.candidat_id)
);

CREATE POLICY "Mandataires can delete their operations"
ON public.operations
FOR DELETE
USING (
  EXISTS (SELECT 1 FROM mandataires m WHERE m.id = operations.mandataire_id AND m.user_id = auth.uid())
);

-- Drop existing policies on mandataire_candidats
DROP POLICY IF EXISTS "Comptables can manage mandataire_candidats" ON public.mandataire_candidats;
DROP POLICY IF EXISTS "Users can view mandataire_candidats" ON public.mandataire_candidats;

-- Create new restrictive policies for mandataire_candidats
CREATE POLICY "Comptables can view their mandataire_candidats"
ON public.mandataire_candidats
FOR SELECT
USING (
  is_comptable_for_candidat(auth.uid(), candidat_id)
  OR EXISTS (SELECT 1 FROM mandataires m WHERE m.id = mandataire_candidats.mandataire_id AND m.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM candidats c WHERE c.id = mandataire_candidats.candidat_id AND c.user_id = auth.uid())
);

CREATE POLICY "Comptables can insert mandataire_candidats"
ON public.mandataire_candidats
FOR INSERT
WITH CHECK (is_comptable_for_candidat(auth.uid(), candidat_id));

CREATE POLICY "Comptables can update mandataire_candidats"
ON public.mandataire_candidats
FOR UPDATE
USING (is_comptable_for_candidat(auth.uid(), candidat_id));

CREATE POLICY "Comptables can delete mandataire_candidats"
ON public.mandataire_candidats
FOR DELETE
USING (is_comptable_for_candidat(auth.uid(), candidat_id));