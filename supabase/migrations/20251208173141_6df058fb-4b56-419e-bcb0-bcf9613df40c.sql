-- Créer des fonctions security definer pour éviter la récursion

-- Fonction pour vérifier si un utilisateur est un mandataire lié à un candidat
CREATE OR REPLACE FUNCTION public.is_mandataire_for_candidat(_user_id uuid, _candidat_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mandataire_candidats mc
    JOIN public.mandataires m ON m.id = mc.mandataire_id
    WHERE mc.candidat_id = _candidat_id
    AND m.user_id = _user_id
  )
$$;

-- Fonction pour vérifier si un mandataire a accès à une campagne
CREATE OR REPLACE FUNCTION public.mandataire_has_campaign_access(_user_id uuid, _campaign_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mandataire_candidats mc
    JOIN public.mandataires m ON m.id = mc.mandataire_id
    JOIN public.candidats c ON c.id = mc.candidat_id
    WHERE m.user_id = _user_id
    AND c.campaign_id = _campaign_id
  )
$$;

-- Supprimer les politiques problématiques
DROP POLICY IF EXISTS "Mandataires can view their linked candidats" ON public.candidats;
DROP POLICY IF EXISTS "Users can view their campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can view their mandataire_candidats links" ON public.mandataire_candidats;
DROP POLICY IF EXISTS "Candidats can view themselves" ON public.candidats;

-- Recréer les politiques avec les fonctions security definer
CREATE POLICY "Users can view candidats" ON public.candidats
  FOR SELECT USING (
    public.has_role(auth.uid(), 'comptable')
    OR user_id = auth.uid()
    OR public.is_mandataire_for_candidat(auth.uid(), id)
  );

CREATE POLICY "Users can view campaigns" ON public.campaigns
  FOR SELECT USING (
    public.has_role(auth.uid(), 'comptable')
    OR EXISTS (SELECT 1 FROM public.candidats WHERE candidats.user_id = auth.uid() AND candidats.campaign_id = campaigns.id)
    OR public.mandataire_has_campaign_access(auth.uid(), id)
  );

CREATE POLICY "Users can view mandataire_candidats" ON public.mandataire_candidats
  FOR SELECT USING (
    public.has_role(auth.uid(), 'comptable')
    OR EXISTS (SELECT 1 FROM public.mandataires WHERE mandataires.id = mandataire_candidats.mandataire_id AND mandataires.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.candidats WHERE candidats.id = mandataire_candidats.candidat_id AND candidats.user_id = auth.uid())
  );