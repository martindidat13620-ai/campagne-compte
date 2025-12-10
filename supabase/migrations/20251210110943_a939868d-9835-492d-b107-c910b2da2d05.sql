
-- Update SELECT policy for mandataires to allow comptables to view mandataires they can manage
DROP POLICY IF EXISTS "Users can view mandataires" ON public.mandataires;

CREATE POLICY "Users can view mandataires" 
ON public.mandataires 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR is_comptable_for_mandataire(auth.uid(), id)
  OR has_role(auth.uid(), 'comptable'::app_role)
);
