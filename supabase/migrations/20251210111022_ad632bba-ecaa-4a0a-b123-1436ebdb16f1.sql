
-- Add created_by column to mandataires
ALTER TABLE public.mandataires ADD COLUMN IF NOT EXISTS created_by uuid;

-- Update SELECT policy to properly isolate data while allowing viewing of just-created mandataires
DROP POLICY IF EXISTS "Users can view mandataires" ON public.mandataires;

CREATE POLICY "Users can view mandataires" 
ON public.mandataires 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR is_comptable_for_mandataire(auth.uid(), id)
  OR created_by = auth.uid()
);
