/*
# Extend Roles, Add Registrar Workflow, Admin Hierarchy, Document Versions

## Overview
Extends the existing schema with:
1. New roles on profiles (registrar, auditor, data_entry_operator, citizen, survey_officer, land_record_officer, etc.)
2. New document statuses (pending_registrar_approval, approved_for_processing, correction_required, digitized)
3. Administrative hierarchy table (state→district→sub-locality→post office→police station→village)
4. Document versions table for version history
5. New demo users for each new role
6. Adds rejection_reason and correction_instructions columns to documents

## Safety
- All ALTER TABLE operations use ADD COLUMN / IF NOT EXISTS
- No data is lost
- Existing roles and data preserved
*/

-- ============ EXTEND PROFILES ROLE CONSTRAINT ============
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'admin', 'operator', 'verification_officer', 'gis_officer', 'senior_officer',
    'super_admin', 'central_authority', 'state_administrator', 'district_administrator',
    'tehsil_officer', 'revenue_officer', 'registrar', 'survey_officer',
    'land_record_officer', 'data_entry_operator', 'auditor', 'citizen'
  ));

-- ============ EXTEND DOCUMENTS STATUS CONSTRAINT ============
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_status_check
  CHECK (status IN (
    'uploaded', 'pending_registrar_approval', 'approved_for_processing',
    'correction_required', 'processing', 'extracted', 'validation_pending',
    'review_required', 'under_review', 'verified', 'approved',
    'rejected', 'duplicate', 'conflict', 'error', 'digitized'
  ));

-- ============ ADD REGISTRAR FIELDS TO DOCUMENTS ============
ALTER TABLE documents ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS correction_instructions text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS approved_by uuid;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- ============ ADMINISTRATIVE HIERARCHY ============
CREATE TABLE IF NOT EXISTS administrative_hierarchy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL CHECK (level IN ('state','district','sub_division','post_office','police_station','village')),
  name text NOT NULL,
  parent_id uuid REFERENCES administrative_hierarchy(id) ON DELETE CASCADE,
  state text,
  district text,
  sub_division text,
  post_office text,
  police_station text,
  village text,
  code text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE administrative_hierarchy ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_hierarchy" ON administrative_hierarchy;
CREATE POLICY "auth_select_hierarchy" ON administrative_hierarchy FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_hierarchy" ON administrative_hierarchy;
CREATE POLICY "auth_insert_hierarchy" ON administrative_hierarchy FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_hierarchy" ON administrative_hierarchy;
CREATE POLICY "auth_update_hierarchy" ON administrative_hierarchy FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_hierarchy" ON administrative_hierarchy;
CREATE POLICY "auth_delete_hierarchy" ON administrative_hierarchy FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_hierarchy_parent ON administrative_hierarchy(parent_id);
CREATE INDEX IF NOT EXISTS idx_hierarchy_level ON administrative_hierarchy(level);

-- ============ DOCUMENT VERSIONS ============
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number int NOT NULL DEFAULT 1,
  file_reference text,
  created_by uuid,
  reason text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_versions" ON document_versions;
CREATE POLICY "auth_select_versions" ON document_versions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_versions" ON document_versions;
CREATE POLICY "auth_insert_versions" ON document_versions FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_versions_document ON document_versions(document_id);

-- ============ SEED ADMINISTRATIVE HIERARCHY ============
-- State: Uttar Pradesh
INSERT INTO administrative_hierarchy (id, level, name, state) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'state', 'Uttar Pradesh', 'Uttar Pradesh')
ON CONFLICT DO NOTHING;

-- District: Lucknow (parent: UP)
INSERT INTO administrative_hierarchy (id, level, name, parent_id, state, district) VALUES
  ('d0000000-0000-0000-0000-000000000002', 'district', 'Lucknow', 'd0000000-0000-0000-0000-000000000001', 'Uttar Pradesh', 'Lucknow')
ON CONFLICT DO NOTHING;

-- Sub-Division: Sadar (parent: Lucknow)
INSERT INTO administrative_hierarchy (id, level, name, parent_id, state, district, sub_division) VALUES
  ('d0000000-0000-0000-0000-000000000003', 'sub_division', 'Sadar', 'd0000000-0000-0000-0000-000000000002', 'Uttar Pradesh', 'Lucknow', 'Sadar')
ON CONFLICT DO NOTHING;

-- Post Office: Rampur PO (parent: Sadar)
INSERT INTO administrative_hierarchy (id, level, name, parent_id, state, district, sub_division, post_office) VALUES
  ('d0000000-0000-0000-0000-000000000004', 'post_office', 'Rampur PO', 'd0000000-0000-0000-0000-000000000003', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur PO')
ON CONFLICT DO NOTHING;

-- Police Station: Rampur PS (parent: Rampur PO)
INSERT INTO administrative_hierarchy (id, level, name, parent_id, state, district, sub_division, post_office, police_station) VALUES
  ('d0000000-0000-0000-0000-000000000005', 'police_station', 'Rampur PS', 'd0000000-0000-0000-0000-000000000004', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur PO', 'Rampur PS')
ON CONFLICT DO NOTHING;

-- Village: Rampur (parent: Rampur PS)
INSERT INTO administrative_hierarchy (id, level, name, parent_id, state, district, sub_division, post_office, police_station, village) VALUES
  ('d0000000-0000-0000-0000-000000000006', 'village', 'Rampur', 'd0000000-0000-0000-0000-000000000005', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur PO', 'Rampur PS', 'Rampur')
ON CONFLICT DO NOTHING;

-- Village: Sultanpur (parent: Rampur PS)
INSERT INTO administrative_hierarchy (id, level, name, parent_id, state, district, sub_division, post_office, police_station, village) VALUES
  ('d0000000-0000-0000-0000-000000000007', 'village', 'Sultanpur', 'd0000000-0000-0000-0000-000000000005', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur PO', 'Rampur PS', 'Sultanpur')
ON CONFLICT DO NOTHING;

-- ============ CREATE NEW DEMO USERS ============
DO $$
DECLARE
  registrar_id uuid := gen_random_uuid();
  auditor_id uuid := gen_random_uuid();
  data_entry_id uuid := gen_random_uuid();
  citizen_id uuid := gen_random_uuid();
  survey_id uuid := gen_random_uuid();
  district_admin_id uuid := gen_random_uuid();
BEGIN
  -- Registrar
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (registrar_id, '00000000-0000-0000-0000-000000000000', 'registrar@landrecord.gov.in', crypt('Demo@1234', gen_salt('bf')), now(), now(), now(), '{"role":"registrar"}', '{"full_name":"Suresh Prasad"}', 'authenticated', 'authenticated', '', '', '', '');

  -- Auditor
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (auditor_id, '00000000-0000-0000-0000-000000000000', 'auditor@landrecord.gov.in', crypt('Demo@1234', gen_salt('bf')), now(), now(), now(), '{"role":"auditor"}', '{"full_name":"Meena Iyer"}', 'authenticated', 'authenticated', '', '', '', '');

  -- Data Entry Operator
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (data_entry_id, '00000000-0000-0000-0000-000000000000', 'dataentry@landrecord.gov.in', crypt('Demo@1234', gen_salt('bf')), now(), now(), now(), '{"role":"data_entry_operator"}', '{"full_name":"Kavita Reddy"}', 'authenticated', 'authenticated', '', '', '', '');

  -- Citizen
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (citizen_id, '00000000-0000-0000-0000-000000000000', 'citizen@landrecord.gov.in', crypt('Demo@1234', gen_salt('bf')), now(), now(), now(), '{"role":"citizen"}', '{"full_name":"Rahul Verma"}', 'authenticated', 'authenticated', '', '', '', '');

  -- Survey Officer
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (survey_id, '00000000-0000-0000-0000-000000000000', 'survey@landrecord.gov.in', crypt('Demo@1234', gen_salt('bf')), now(), now(), now(), '{"role":"survey_officer"}', '{"full_name":"Deepak Nair"}', 'authenticated', 'authenticated', '', '', '', '');

  -- District Administrator
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (district_admin_id, '00000000-0000-0000-0000-000000000000', 'districtadmin@landrecord.gov.in', crypt('Demo@1234', gen_salt('bf')), now(), now(), now(), '{"role":"district_administrator"}', '{"full_name":"Priya Desai"}', 'authenticated', 'authenticated', '', '', '', '');

  -- Insert profiles
  INSERT INTO profiles (id, full_name, email, role, department) VALUES
    (registrar_id, 'Suresh Prasad', 'registrar@landrecord.gov.in', 'registrar', 'Registration Department'),
    (auditor_id, 'Meena Iyer', 'auditor@landrecord.gov.in', 'auditor', 'Audit Department'),
    (data_entry_id, 'Kavita Reddy', 'dataentry@landrecord.gov.in', 'data_entry_operator', 'Revenue Department'),
    (citizen_id, 'Rahul Verma', 'citizen@landrecord.gov.in', 'citizen', NULL),
    (survey_id, 'Deepak Nair', 'survey@landrecord.gov.in', 'survey_officer', 'Survey & GIS Department'),
    (district_admin_id, 'Priya Desai', 'districtadmin@landrecord.gov.in', 'district_administrator', 'District Administration')
  ON CONFLICT DO NOTHING;
END $$;

-- ============ UPDATE SOME EXISTING DOCUMENTS TO pending_registrar_approval ============
-- Set the two "uploaded" documents to pending_registrar_approval to demonstrate the workflow
UPDATE documents SET status = 'pending_registrar_approval'
  WHERE id IN ('b1111111-1111-1111-1111-111111111119', 'b1111111-1111-1111-1111-111111111120')
  AND status = 'uploaded';

-- ============ SEED DOCUMENT VERSIONS FOR EXISTING DOCS ============
INSERT INTO document_versions (document_id, version_number, reason)
SELECT id, 1, 'Original upload'
FROM documents
WHERE id NOT IN (SELECT document_id FROM document_versions)
ON CONFLICT DO NOTHING;

-- Add a second version for some processed documents
INSERT INTO document_versions (document_id, version_number, reason)
SELECT id, 2, 'AI-processed version'
FROM documents
WHERE status IN ('verified', 'approved', 'extracted', 'review_required', 'under_review', 'duplicate', 'conflict')
ON CONFLICT DO NOTHING;
