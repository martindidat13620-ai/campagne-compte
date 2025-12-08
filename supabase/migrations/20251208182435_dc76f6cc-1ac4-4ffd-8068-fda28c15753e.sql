-- Allow mandataires to delete their own operations
CREATE POLICY "Mandataires can delete their operations"
ON public.operations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM mandataires m
    WHERE m.id = operations.mandataire_id
    AND m.user_id = auth.uid()
  )
);