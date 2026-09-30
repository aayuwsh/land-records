-- Private storage for sensitive land-record PDFs. Do not expose this bucket publicly.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('land-records', 'land-records', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf'];

CREATE POLICY "users_upload_own_land_pdfs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'land-records' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "users_read_own_land_pdfs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'land-records' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "users_delete_own_land_pdfs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'land-records' AND (storage.foldername(name))[1] = auth.uid()::text);

-- File contents are intentionally not included in audit events. Retention should be applied
-- with a scheduled privileged job appropriate to the organisation's retention policy.
