-- Create role enum
CREATE TYPE public.app_role AS ENUM ('comptable', 'mandataire', 'candidat');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nom TEXT,
  prenom TEXT,
  telephone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  type_election TEXT NOT NULL,
  annee INTEGER NOT NULL,
  date_debut DATE,
  date_fin DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comptable_campaigns junction table
CREATE TABLE public.comptable_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comptable_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (comptable_id, campaign_id)
);

-- Create candidats table
CREATE TABLE public.candidats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  circonscription TEXT,
  plafond_depenses DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mandataires table
CREATE TABLE public.mandataires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mandataire_candidats junction table
CREATE TABLE public.mandataire_candidats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandataire_id UUID REFERENCES public.mandataires(id) ON DELETE CASCADE NOT NULL,
  candidat_id UUID REFERENCES public.candidats(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (mandataire_id, candidat_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comptable_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mandataires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mandataire_candidats ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = profiles.id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = profiles.id);

CREATE POLICY "Comptables can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'comptable'));

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_roles.user_id);

CREATE POLICY "Comptables can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'comptable'));

-- Campaigns policies
CREATE POLICY "Comptables can manage campaigns" ON public.campaigns
  FOR ALL USING (public.has_role(auth.uid(), 'comptable'));

CREATE POLICY "Users can view their campaigns" ON public.campaigns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.comptable_campaigns cc WHERE cc.comptable_id = auth.uid() AND cc.campaign_id = campaigns.id
    ) OR EXISTS (
      SELECT 1 FROM public.candidats cand WHERE cand.user_id = auth.uid() AND cand.campaign_id = campaigns.id
    ) OR EXISTS (
      SELECT 1 FROM public.mandataire_candidats mc
      JOIN public.mandataires m ON m.id = mc.mandataire_id
      JOIN public.candidats c ON c.id = mc.candidat_id
      WHERE m.user_id = auth.uid() AND c.campaign_id = campaigns.id
    )
  );

-- Comptable campaigns policies
CREATE POLICY "Comptables can manage their campaign links" ON public.comptable_campaigns
  FOR ALL USING (public.has_role(auth.uid(), 'comptable'));

-- Candidats policies
CREATE POLICY "Comptables can manage candidats" ON public.candidats
  FOR ALL USING (public.has_role(auth.uid(), 'comptable'));

CREATE POLICY "Candidats can view themselves" ON public.candidats
  FOR SELECT USING (candidats.user_id = auth.uid());

CREATE POLICY "Mandataires can view their candidats" ON public.candidats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mandataire_candidats mc
      JOIN public.mandataires m ON m.id = mc.mandataire_id
      WHERE mc.candidat_id = candidats.id AND m.user_id = auth.uid()
    )
  );

-- Mandataires policies
CREATE POLICY "Comptables can manage mandataires" ON public.mandataires
  FOR ALL USING (public.has_role(auth.uid(), 'comptable'));

CREATE POLICY "Mandataires can view themselves" ON public.mandataires
  FOR SELECT USING (mandataires.user_id = auth.uid());

CREATE POLICY "Candidats can view their mandataires" ON public.mandataires
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mandataire_candidats mc
      JOIN public.candidats c ON c.id = mc.candidat_id
      WHERE mc.mandataire_id = mandataires.id AND c.user_id = auth.uid()
    )
  );

-- Mandataire candidats policies
CREATE POLICY "Comptables can manage mandataire_candidats" ON public.mandataire_candidats
  FOR ALL USING (public.has_role(auth.uid(), 'comptable'));

CREATE POLICY "Mandataires can view their links" ON public.mandataire_candidats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mandataires m WHERE m.id = mandataire_candidats.mandataire_id AND m.user_id = auth.uid()
    )
  );

-- Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, prenom)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'nom',
    NEW.raw_user_meta_data ->> 'prenom'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidats_updated_at BEFORE UPDATE ON public.candidats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mandataires_updated_at BEFORE UPDATE ON public.mandataires
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();