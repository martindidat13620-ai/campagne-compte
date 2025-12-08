-- Créer le bucket pour les justificatifs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'justificatifs',
  'justificatifs',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
);

-- Politique pour permettre aux utilisateurs authentifiés d'uploader
CREATE POLICY "Users can upload justificatifs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'justificatifs');

-- Politique pour permettre aux utilisateurs de voir leurs propres justificatifs
CREATE POLICY "Users can view justificatifs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'justificatifs');

-- Politique pour permettre aux utilisateurs de supprimer leurs propres justificatifs
CREATE POLICY "Users can delete their justificatifs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'justificatifs');