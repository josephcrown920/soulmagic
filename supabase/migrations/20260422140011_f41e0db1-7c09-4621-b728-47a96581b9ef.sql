
-- Tighten public-read so listing is not allowed broadly.
-- Direct file fetches by URL still work; LIST queries on storage.objects are restricted to own files.
DROP POLICY IF EXISTS "thumbnails public read" ON storage.objects;
DROP POLICY IF EXISTS "assets public read" ON storage.objects;

-- Owner-only listing/reads via the API
CREATE POLICY "thumbnails read own" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "assets read own" ON storage.objects
  FOR SELECT USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);
