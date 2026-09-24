ALTER TABLE public.rapprochements_bancaires DROP CONSTRAINT IF EXISTS rapprochements_bancaires_candidat_id_mois_key;
ALTER TABLE public.rapprochements_bancaires ALTER COLUMN mois DROP NOT NULL;
ALTER TABLE public.rapprochements_bancaires ADD COLUMN IF NOT EXISTS date_debut date, ADD COLUMN IF NOT EXISTS date_fin date, ADD COLUMN IF NOT EXISTS numero_releve text;
UPDATE public.rapprochements_bancaires SET date_debut = (mois || '-01')::date, date_fin = ((mois || '-01')::date + interval '1 month - 1 day')::date WHERE date_debut IS NULL AND mois IS NOT NULL;