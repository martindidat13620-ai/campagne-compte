-- Drop constraints that were partially added
ALTER TABLE public.operations DROP CONSTRAINT IF EXISTS operations_montant_positive;
ALTER TABLE public.operations DROP CONSTRAINT IF EXISTS operations_type_operation_valid;
ALTER TABLE public.operations DROP CONSTRAINT IF EXISTS operations_statut_validation_valid;
ALTER TABLE public.operations DROP CONSTRAINT IF EXISTS operations_mode_paiement_valid;

-- Re-add CHECK constraints with correct values
ALTER TABLE public.operations 
ADD CONSTRAINT operations_montant_positive CHECK (montant > 0);

ALTER TABLE public.operations 
ADD CONSTRAINT operations_type_operation_valid CHECK (type_operation IN ('depense', 'recette'));

ALTER TABLE public.operations 
ADD CONSTRAINT operations_statut_validation_valid CHECK (statut_validation IN ('en_attente', 'validee', 'rejete'));

ALTER TABLE public.operations 
ADD CONSTRAINT operations_mode_paiement_valid CHECK (mode_paiement IN ('carte_bancaire', 'cheque', 'especes', 'virement', 'prelevement'));

-- Create table to track invitation rate limiting
CREATE TABLE IF NOT EXISTS public.invitation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comptable_id UUID NOT NULL,
  invited_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invitation_logs
ALTER TABLE public.invitation_logs ENABLE ROW LEVEL SECURITY;

-- Only allow service role access (used by edge function)
CREATE POLICY "Service role only" ON public.invitation_logs
FOR ALL USING (false);

-- Create index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_invitation_logs_comptable_created 
ON public.invitation_logs (comptable_id, created_at DESC);