-- Ajouter une colonne pour le compte comptable dans la table operations
ALTER TABLE public.operations 
ADD COLUMN IF NOT EXISTS compte_comptable text;