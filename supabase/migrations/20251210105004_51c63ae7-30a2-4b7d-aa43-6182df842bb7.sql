-- Ajout des champs pour les dons avec informations détaillées
ALTER TABLE public.operations
ADD COLUMN IF NOT EXISTS donateur_prenom text,
ADD COLUMN IF NOT EXISTS donateur_code_postal text,
ADD COLUMN IF NOT EXISTS donateur_ville text,
ADD COLUMN IF NOT EXISTS donateur_pays text DEFAULT 'France',
ADD COLUMN IF NOT EXISTS numero_releve_bancaire text,
ADD COLUMN IF NOT EXISTS is_collecte boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS collecte_date date,
ADD COLUMN IF NOT EXISTS collecte_organisation text;