-- Add columns for political party information on operations table
ALTER TABLE public.operations
ADD COLUMN IF NOT EXISTS parti_nom TEXT,
ADD COLUMN IF NOT EXISTS parti_adresse TEXT,
ADD COLUMN IF NOT EXISTS parti_code_postal TEXT,
ADD COLUMN IF NOT EXISTS parti_ville TEXT,
ADD COLUMN IF NOT EXISTS parti_siret TEXT,
ADD COLUMN IF NOT EXISTS parti_rna TEXT;