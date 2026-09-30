/*
# Land Record Digitization System - Core Schema

## Overview
Creates the complete database schema for an AI-powered land record digitization,
extraction, validation, verification, GIS integration, and analytics platform.

## New Tables
1. profiles - Extends auth.users with role, name, department
2. documents - Uploaded land record documents with metadata
3. document_pages - Individual pages within documents
4. ocr_results - OCR output per page with confidence and language
5. extracted_fields - Structured field extraction with confidence scores
6. land_records - Main verified/unverified land record entity
7. owners - Owner information linked to land records
8. land_parcels - Parcel details (area, classification, usage)
9. validation_results - Validation engine outcomes per rule
10. duplicate_candidates - Detected duplicate record pairs
11. conflicts - Detected conflicts between records
12. verification_tasks - Human verification workflow tasks
13. audit_logs - Immutable audit trail for all actions
14. map_plots - GIS plot geometries and metadata
15. record_map_links - Associations between land records and map plots
16. feedback_corrections - AI feedback from human corrections
17. processing_jobs - Async processing job tracking
18. notifications - System alerts and notifications

## Security
- RLS enabled on all tables
- All tables accessible to authenticated users (shared department data)
- Role-based access control enforced at application level
- Audit logs are insert-only (no update/delete) for immutability
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'operator' CHECK (role IN ('admin','operator','verification_officer','gis_officer','senior_officer')),
  department text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_profiles" ON profiles;
CREATE POLICY "auth_read_profiles" ON profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_profiles" ON profiles;
CREATE POLICY "auth_insert_profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_profiles" ON profiles;
CREATE POLICY "auth_update_profiles" ON profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============ DOCUMENTS ============
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  page_count int DEFAULT 1,
  file_url text,
  thumbnail_url text,
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','processing','extracted','validation_pending','review_required','under_review','verified','approved','rejected','duplicate','conflict','error')),
  document_type text CHECK (document_type IN ('khasra','khatauni','jamabandi','mutation_record','sale_deed','registration_record','property_register','ownership_certificate','tax_record','cadastral_map','other')),
  detected_language text,
  detected_type text,
  quality_score numeric(5,2),
  quality_details jsonb,
  -- Metadata
  state text,
  district text,
  tehsil text,
  village text,
  ward text,
  record_year int,
  source_department text,
  reference_number text,
  -- Processing
  ocr_text text,
  ocr_confidence numeric(5,2),
  overall_confidence numeric(5,2),
  processing_progress int DEFAULT 0,
  processed_by uuid,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_documents" ON documents; CREATE POLICY "auth_select_documents" ON documents FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_documents" ON documents; CREATE POLICY "auth_insert_documents" ON documents FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_documents" ON documents; CREATE POLICY "auth_update_documents" ON documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_documents" ON documents; CREATE POLICY "auth_delete_documents" ON documents FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_village ON documents(village);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);

-- ============ DOCUMENT PAGES ============
CREATE TABLE IF NOT EXISTS document_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_number int NOT NULL,
  image_url text,
  width int,
  height int,
  quality_score numeric(5,2),
  quality_details jsonb,
  ocr_text text,
  ocr_confidence numeric(5,2),
  regions jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE document_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_doc_pages" ON document_pages; CREATE POLICY "auth_select_doc_pages" ON document_pages FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_doc_pages" ON document_pages; CREATE POLICY "auth_insert_doc_pages" ON document_pages FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_doc_pages" ON document_pages; CREATE POLICY "auth_update_doc_pages" ON document_pages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_doc_pages" ON document_pages; CREATE POLICY "auth_delete_doc_pages" ON document_pages FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_doc_pages_document ON document_pages(document_id);

-- ============ EXTRACTED FIELDS ============
CREATE TABLE IF NOT EXISTS extracted_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  field_value text,
  confidence numeric(5,2) NOT NULL DEFAULT 0,
  source_page int,
  bbox jsonb,
  extraction_method text DEFAULT 'regex_pattern',
  model_version text DEFAULT 'field-extractor-v1',
  is_corrected boolean DEFAULT false,
  corrected_value text,
  corrected_by uuid,
  corrected_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE extracted_fields ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_fields" ON extracted_fields; CREATE POLICY "auth_select_fields" ON extracted_fields FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_fields" ON extracted_fields; CREATE POLICY "auth_insert_fields" ON extracted_fields FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_fields" ON extracted_fields; CREATE POLICY "auth_update_fields" ON extracted_fields FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_fields" ON extracted_fields; CREATE POLICY "auth_delete_fields" ON extracted_fields FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_fields_document ON extracted_fields(document_id);
CREATE INDEX IF NOT EXISTS idx_fields_name ON extracted_fields(field_name);

-- ============ LAND RECORDS ============
CREATE TABLE IF NOT EXISTS land_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  survey_number text,
  khasra_number text,
  khata_number text,
  plot_number text,
  parcel_number text,
  owner_name text,
  father_husband_name text,
  co_owners text,
  ownership_type text,
  area numeric(12,2),
  area_unit text DEFAULT 'hectare',
  land_classification text,
  land_usage text,
  soil_type text,
  state text,
  district text,
  tehsil text,
  village text,
  ward text,
  mutation_number text,
  mutation_date date,
  registration_number text,
  registration_date date,
  transaction_type text,
  remarks text,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending','auto_validated','review_required','under_review','verified','approved','rejected')),
  confidence_score numeric(5,2),
  assigned_to uuid,
  verified_by uuid,
  verified_at timestamptz,
  verification_comment text,
  record_year int,
  source_document_ref text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE land_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_records" ON land_records; CREATE POLICY "auth_select_records" ON land_records FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_records" ON land_records; CREATE POLICY "auth_insert_records" ON land_records FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_records" ON land_records; CREATE POLICY "auth_update_records" ON land_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_records" ON land_records; CREATE POLICY "auth_delete_records" ON land_records FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_records_survey ON land_records(survey_number);
CREATE INDEX IF NOT EXISTS idx_records_village ON land_records(village);
CREATE INDEX IF NOT EXISTS idx_records_owner ON land_records(owner_name);
CREATE INDEX IF NOT EXISTS idx_records_status ON land_records(verification_status);
CREATE INDEX IF NOT EXISTS idx_records_khasra ON land_records(khasra_number);

-- ============ OWNERS ============
CREATE TABLE IF NOT EXISTS owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  land_record_id uuid NOT NULL REFERENCES land_records(id) ON DELETE CASCADE,
  name text NOT NULL,
  father_husband_name text,
  ownership_type text,
  ownership_share text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_owners" ON owners; CREATE POLICY "auth_select_owners" ON owners FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_owners" ON owners; CREATE POLICY "auth_insert_owners" ON owners FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_owners" ON owners; CREATE POLICY "auth_update_owners" ON owners FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_owners" ON owners; CREATE POLICY "auth_delete_owners" ON owners FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_owners_record ON owners(land_record_id);

-- ============ LAND PARCELS ============
CREATE TABLE IF NOT EXISTS land_parcels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  land_record_id uuid NOT NULL REFERENCES land_records(id) ON DELETE CASCADE,
  parcel_number text,
  area numeric(12,2),
  area_unit text DEFAULT 'hectare',
  classification text,
  usage text,
  soil_type text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE land_parcels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_parcels" ON land_parcels; CREATE POLICY "auth_select_parcels" ON land_parcels FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_parcels" ON land_parcels; CREATE POLICY "auth_insert_parcels" ON land_parcels FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_parcels" ON land_parcels; CREATE POLICY "auth_update_parcels" ON land_parcels FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_parcels" ON land_parcels; CREATE POLICY "auth_delete_parcels" ON land_parcels FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_parcels_record ON land_parcels(land_record_id);

-- ============ VALIDATION RESULTS ============
CREATE TABLE IF NOT EXISTS validation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  land_record_id uuid REFERENCES land_records(id) ON DELETE CASCADE,
  rule text NOT NULL,
  status text NOT NULL CHECK (status IN ('pass','fail','warn')),
  severity text CHECK (severity IN ('low','medium','high','critical')),
  message text NOT NULL,
  field_name text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_validation" ON validation_results; CREATE POLICY "auth_select_validation" ON validation_results FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_validation" ON validation_results; CREATE POLICY "auth_insert_validation" ON validation_results FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_validation" ON validation_results; CREATE POLICY "auth_update_validation" ON validation_results FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_validation" ON validation_results; CREATE POLICY "auth_delete_validation" ON validation_results FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_validation_doc ON validation_results(document_id);
CREATE INDEX IF NOT EXISTS idx_validation_record ON validation_results(land_record_id);

-- ============ DUPLICATE CANDIDATES ============
CREATE TABLE IF NOT EXISTS duplicate_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_a_id uuid NOT NULL REFERENCES land_records(id) ON DELETE CASCADE,
  record_b_id uuid NOT NULL REFERENCES land_records(id) ON DELETE CASCADE,
  similarity_score numeric(5,2) NOT NULL,
  match_dimensions jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected','resolved')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE duplicate_candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_dupes" ON duplicate_candidates; CREATE POLICY "auth_select_dupes" ON duplicate_candidates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_dupes" ON duplicate_candidates; CREATE POLICY "auth_insert_dupes" ON duplicate_candidates FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_dupes" ON duplicate_candidates; CREATE POLICY "auth_update_dupes" ON duplicate_candidates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_dupes" ON duplicate_candidates; CREATE POLICY "auth_delete_dupes" ON duplicate_candidates FOR DELETE TO authenticated USING (true);

-- ============ CONFLICTS ============
CREATE TABLE IF NOT EXISTS conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_a_id uuid NOT NULL REFERENCES land_records(id) ON DELETE CASCADE,
  record_b_id uuid NOT NULL REFERENCES land_records(id) ON DELETE CASCADE,
  conflict_type text NOT NULL CHECK (conflict_type IN ('owner_mismatch','area_mismatch','survey_conflict','mutation_inconsistency','date_inconsistency','location_mismatch','map_record_mismatch')),
  field_name text,
  value_a text,
  value_b text,
  severity text CHECK (severity IN ('low','medium','high','critical')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','resolved','escalated')),
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE conflicts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_conflicts" ON conflicts; CREATE POLICY "auth_select_conflicts" ON conflicts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_conflicts" ON conflicts; CREATE POLICY "auth_insert_conflicts" ON conflicts FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_conflicts" ON conflicts; CREATE POLICY "auth_update_conflicts" ON conflicts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_conflicts" ON conflicts; CREATE POLICY "auth_delete_conflicts" ON conflicts FOR DELETE TO authenticated USING (true);

-- ============ VERIFICATION TASKS ============
CREATE TABLE IF NOT EXISTS verification_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  land_record_id uuid REFERENCES land_records(id) ON DELETE CASCADE,
  assigned_to uuid,
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','rejected','reprocessing')),
  comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE verification_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_verify_tasks" ON verification_tasks; CREATE POLICY "auth_select_verify_tasks" ON verification_tasks FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_verify_tasks" ON verification_tasks; CREATE POLICY "auth_insert_verify_tasks" ON verification_tasks FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_verify_tasks" ON verification_tasks; CREATE POLICY "auth_update_verify_tasks" ON verification_tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_verify_tasks" ON verification_tasks; CREATE POLICY "auth_delete_verify_tasks" ON verification_tasks FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_verify_status ON verification_tasks(status);

-- ============ AUDIT LOGS ============
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_name text,
  user_role text,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_audit" ON audit_logs; CREATE POLICY "auth_select_audit" ON audit_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_audit" ON audit_logs; CREATE POLICY "auth_insert_audit" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
-- No UPDATE or DELETE policy: audit logs are immutable from the application
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ============ MAP PLOTS ============
CREATE TABLE IF NOT EXISTS map_plots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_number text NOT NULL,
  survey_number text,
  village text,
  tehsil text,
  district text,
  state text,
  geometry jsonb NOT NULL,
  area numeric(12,2),
  area_unit text DEFAULT 'hectare',
  is_ai_derived boolean DEFAULT false,
  validation_status text DEFAULT 'unverified' CHECK (validation_status IN ('unverified','verified','requires_validation')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE map_plots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_plots" ON map_plots; CREATE POLICY "auth_select_plots" ON map_plots FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_plots" ON map_plots; CREATE POLICY "auth_insert_plots" ON map_plots FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_plots" ON map_plots; CREATE POLICY "auth_update_plots" ON map_plots FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_plots" ON map_plots; CREATE POLICY "auth_delete_plots" ON map_plots FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_plots_village ON map_plots(village);
CREATE INDEX IF NOT EXISTS idx_plots_survey ON map_plots(survey_number);

-- ============ RECORD MAP LINKS ============
CREATE TABLE IF NOT EXISTS record_map_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  land_record_id uuid NOT NULL REFERENCES land_records(id) ON DELETE CASCADE,
  map_plot_id uuid NOT NULL REFERENCES map_plots(id) ON DELETE CASCADE,
  match_confidence numeric(5,2),
  match_status text DEFAULT 'auto_matched' CHECK (match_status IN ('auto_matched','verified','requires_verification','rejected')),
  linked_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE record_map_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_links" ON record_map_links; CREATE POLICY "auth_select_links" ON record_map_links FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_links" ON record_map_links; CREATE POLICY "auth_insert_links" ON record_map_links FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_links" ON record_map_links; CREATE POLICY "auth_update_links" ON record_map_links FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_links" ON record_map_links; CREATE POLICY "auth_delete_links" ON record_map_links FOR DELETE TO authenticated USING (true);

-- ============ FEEDBACK CORRECTIONS ============
CREATE TABLE IF NOT EXISTS feedback_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  land_record_id uuid REFERENCES land_records(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  original_prediction text,
  corrected_value text NOT NULL,
  model_version text,
  corrected_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE feedback_corrections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_corrections" ON feedback_corrections; CREATE POLICY "auth_select_corrections" ON feedback_corrections FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_corrections" ON feedback_corrections; CREATE POLICY "auth_insert_corrections" ON feedback_corrections FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_corrections" ON feedback_corrections; CREATE POLICY "auth_update_corrections" ON feedback_corrections FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_corrections" ON feedback_corrections; CREATE POLICY "auth_delete_corrections" ON feedback_corrections FOR DELETE TO authenticated USING (true);

-- ============ PROCESSING JOBS ============
CREATE TABLE IF NOT EXISTS processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  job_type text NOT NULL DEFAULT 'full_pipeline',
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed')),
  progress int DEFAULT 0,
  current_step text,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_jobs" ON processing_jobs; CREATE POLICY "auth_select_jobs" ON processing_jobs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_jobs" ON processing_jobs; CREATE POLICY "auth_insert_jobs" ON processing_jobs FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_jobs" ON processing_jobs; CREATE POLICY "auth_update_jobs" ON processing_jobs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_jobs" ON processing_jobs; CREATE POLICY "auth_delete_jobs" ON processing_jobs FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_jobs_document ON processing_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON processing_jobs(status);

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  severity text DEFAULT 'info' CHECK (severity IN ('info','warning','error','success')),
  is_read boolean DEFAULT false,
  entity_type text,
  entity_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_notifs" ON notifications; CREATE POLICY "auth_select_notifs" ON notifications FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_notifs" ON notifications; CREATE POLICY "auth_insert_notifs" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_notifs" ON notifications; CREATE POLICY "auth_update_notifs" ON notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_notifs" ON notifications; CREATE POLICY "auth_delete_notifs" ON notifications FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_notifs_user ON notifications(user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_documents_updated ON documents;
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_records_updated ON land_records;
CREATE TRIGGER trg_records_updated BEFORE UPDATE ON land_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_verify_tasks_updated ON verification_tasks;
CREATE TRIGGER trg_verify_tasks_updated BEFORE UPDATE ON verification_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
