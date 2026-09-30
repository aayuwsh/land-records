/*
# Create demo user accounts

## Overview
Creates demo user accounts for each role (admin, operator, verification_officer, gis_officer, senior_officer)
with corresponding profile entries.

## Security
- Uses Supabase auth.users for authentication
- Creates matching profiles rows with role assignments
- All passwords are demo-only
*/

-- Insert demo users into auth.users
-- Using crypt with gen_salt for password hashing
-- Password for all demo accounts: Demo@1234

DO $$
DECLARE
  admin_id uuid := gen_random_uuid();
  operator_id uuid := gen_random_uuid();
  verifier_id uuid := gen_random_uuid();
  gis_id uuid := gen_random_uuid();
  senior_id uuid := gen_random_uuid();
BEGIN
  -- Admin
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (admin_id, '00000000-0000-0000-0000-000000000000', 'admin@landrecord.gov.in', crypt('Demo@1234', gen_salt('bf')), now(), now(), now(), '{"role":"admin"}', '{"full_name":"Arjun Sharma"}', 'authenticated', 'authenticated', '', '', '', '');

  -- Operator
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (operator_id, '00000000-0000-0000-0000-000000000000', 'operator@landrecord.gov.in', crypt('Demo@1234', gen_salt('bf')), now(), now(), now(), '{"role":"operator"}', '{"full_name":"Priya Gupta"}', 'authenticated', 'authenticated', '', '', '', '');

  -- Verification Officer
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (verifier_id, '00000000-0000-0000-0000-000000000000', 'verifier@landrecord.gov.in', crypt('Demo@1234', gen_salt('bf')), now(), now(), now(), '{"role":"verification_officer"}', '{"full_name":"Rajesh Kumar"}', 'authenticated', 'authenticated', '', '', '', '');

  -- GIS Officer
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (gis_id, '00000000-0000-0000-0000-000000000000', 'gis@landrecord.gov.in', crypt('Demo@1234', gen_salt('bf')), now(), now(), now(), '{"role":"gis_officer"}', '{"full_name":"Anita Verma"}', 'authenticated', 'authenticated', '', '', '', '');

  -- Senior Officer
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (senior_id, '00000000-0000-0000-0000-000000000000', 'senior@landrecord.gov.in', crypt('Demo@1234', gen_salt('bf')), now(), now(), now(), '{"role":"senior_officer"}', '{"full_name":"Vikram Singh"}', 'authenticated', 'authenticated', '', '', '', '');

  -- Insert profiles
  INSERT INTO profiles (id, full_name, email, role, department) VALUES
    (admin_id, 'Arjun Sharma', 'admin@landrecord.gov.in', 'admin', 'IT Department'),
    (operator_id, 'Priya Gupta', 'operator@landrecord.gov.in', 'operator', 'Revenue Department'),
    (verifier_id, 'Rajesh Kumar', 'verifier@landrecord.gov.in', 'verification_officer', 'Revenue Department'),
    (gis_id, 'Anita Verma', 'gis@landrecord.gov.in', 'gis_officer', 'Survey & GIS Department'),
    (senior_id, 'Vikram Singh', 'senior@landrecord.gov.in', 'senior_officer', 'Revenue Department')
  ON CONFLICT DO NOTHING;
END $$;