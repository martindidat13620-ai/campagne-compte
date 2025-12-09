-- Create helper function to check if a comptable can access a mandataire
CREATE OR REPLACE FUNCTION public.is_comptable_for_mandataire(_user_id uuid, _mandataire_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mandataire_candidats mc
    JOIN public.candidats c ON c.id = mc.candidat_id
    JOIN public.comptable_campaigns cc ON cc.campaign_id = c.campaign_id
    WHERE mc.mandataire_id = _mandataire_id
    AND cc.comptable_id = _user_id
  )
$$;

-- Create helper function to check if a user owns a mandataire
CREATE OR REPLACE FUNCTION public.is_own_mandataire(_user_id uuid, _mandataire_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mandataires
    WHERE id = _mandataire_id
    AND user_id = _user_id
  )
$$;

-- Create helper function to check mandataire_candidat access for mandataire users
CREATE OR REPLACE FUNCTION public.mandataire_owns_link(_user_id uuid, _mandataire_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mandataires m
    WHERE m.id = _mandataire_id
    AND m.user_id = _user_id
  )
$$;

-- Create helper function to check mandataire_candidat access for candidat users
CREATE OR REPLACE FUNCTION public.candidat_owns_link(_user_id uuid, _candidat_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.candidats c
    WHERE c.id = _candidat_id
    AND c.user_id = _user_id
  )
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view mandataires" ON public.mandataires;
DROP POLICY IF EXISTS "Comptables can update mandataires" ON public.mandataires;
DROP POLICY IF EXISTS "Comptables can delete mandataires" ON public.mandataires;
DROP POLICY IF EXISTS "Comptables can view their mandataire_candidats" ON public.mandataire_candidats;

-- Recreate mandataires policies using security definer functions
CREATE POLICY "Users can view mandataires" 
ON public.mandataires 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  is_comptable_for_mandataire(auth.uid(), id)
);

CREATE POLICY "Comptables can update mandataires" 
ON public.mandataires 
FOR UPDATE 
USING (is_comptable_for_mandataire(auth.uid(), id));

CREATE POLICY "Comptables can delete mandataires" 
ON public.mandataires 
FOR DELETE 
USING (is_comptable_for_mandataire(auth.uid(), id));

-- Recreate mandataire_candidats SELECT policy using security definer functions
CREATE POLICY "Comptables can view their mandataire_candidats" 
ON public.mandataire_candidats 
FOR SELECT 
USING (
  is_comptable_for_candidat(auth.uid(), candidat_id) OR 
  mandataire_owns_link(auth.uid(), mandataire_id) OR 
  candidat_owns_link(auth.uid(), candidat_id)
);