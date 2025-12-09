-- Allow comptables to insert operations for their candidates
CREATE POLICY "Comptables can insert operations"
ON public.operations
FOR INSERT
WITH CHECK (is_comptable_for_candidat(auth.uid(), candidat_id));