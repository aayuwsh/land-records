/*
# Seed Demo Data for Land Record System

## Overview
Inserts realistic synthetic demo data for the land record digitization system.
All data is synthetic - no real person's land records are used.

## Data Inserted
1. Map plots with SVG polygon geometries for a fictional village
2. Sample land records spanning different verification statuses
3. Owners and land parcels
4. Extracted fields with confidence scores
5. Validation results (pass/fail/warn)
6. Duplicate candidates
7. Conflicts between records
8. Verification tasks
9. Audit logs
10. Notifications
*/

-- ============ MAP PLOTS ============
-- Fictional village "Rampur" with cadastral plots
INSERT INTO map_plots (id, plot_number, survey_number, village, tehsil, district, state, geometry, area, area_unit, is_ai_derived, validation_status)
VALUES
  ('a1111111-1111-1111-1111-111111111101', 'P-101', '124/1', 'Rampur', 'Sadar', 'Lucknow', 'Uttar Pradesh', '{"type":"polygon","coordinates":[[100,100],[220,100],[220,200],[100,200],[100,100]]}', 2.15, 'hectare', false, 'verified'),
  ('a1111111-1111-1111-1111-111111111102', 'P-102', '124/2', 'Rampur', 'Sadar', 'Lucknow', 'Uttar Pradesh', '{"type":"polygon","coordinates":[[220,100],[340,100],[340,200],[220,200],[220,100]]}', 1.80, 'hectare', false, 'verified'),
  ('a1111111-1111-1111-1111-111111111103', 'P-103', '124/3', 'Rampur', 'Sadar', 'Lucknow', 'Uttar Pradesh', '{"type":"polygon","coordinates":[[340,100],[460,100],[460,200],[340,200],[340,100]]}', 2.47, 'hectare', false, 'verified'),
  ('a1111111-1111-1111-1111-111111111104', 'P-104', '125/1', 'Rampur', 'Sadar', 'Lucknow', 'Uttar Pradesh', '{"type":"polygon","coordinates":[[100,200],[220,200],[220,320],[100,320],[100,200]]}', 3.10, 'hectare', true, 'requires_validation'),
  ('a1111111-1111-1111-1111-111111111105', 'P-105', '125/2', 'Rampur', 'Sadar', 'Lucknow', 'Uttar Pradesh', '{"type":"polygon","coordinates":[[220,200],[340,200],[340,320],[220,320],[220,200]]}', 1.95, 'hectare', true, 'requires_validation'),
  ('a1111111-1111-1111-1111-111111111106', 'P-106', '126/1', 'Rampur', 'Sadar', 'Lucknow', 'Uttar Pradesh', '{"type":"polygon","coordinates":[[340,200],[460,200],[460,320],[340,320],[340,200]]}', 4.20, 'hectare', false, 'verified'),
  ('a1111111-1111-1111-1111-111111111107', 'P-107', '126/2', 'Rampur', 'Sadar', 'Lucknow', 'Uttar Pradesh', '{"type":"polygon","coordinates":[[100,320],[220,320],[220,440],[100,440],[100,320]]}', 2.80, 'hectare', false, 'verified'),
  ('a1111111-1111-1111-1111-111111111108', 'P-108', '127/1', 'Rampur', 'Sadar', 'Lucknow', 'Uttar Pradesh', '{"type":"polygon","coordinates":[[220,320],[340,320],[340,440],[220,440],[220,320]]}', 1.50, 'hectare', true, 'unverified'),
  ('a1111111-1111-1111-1111-111111111109', 'P-109', '127/2', 'Rampur', 'Sadar', 'Lucknow', 'Uttar Pradesh', '{"type":"polygon","coordinates":[[340,320],[460,320],[460,440],[340,440],[340,320]]}', 3.75, 'hectare', false, 'verified'),
  ('a1111111-1111-1111-1111-111111111110', 'P-110', '128/1', 'Rampur', 'Sadar', 'Lucknow', 'Uttar Pradesh', '{"type":"polygon","coordinates":[[100,440],[280,440],[280,540],[100,540],[100,440]]}', 5.60, 'hectare', false, 'verified'),
  ('a1111111-1111-1111-1111-111111111111', 'P-111', '128/2', 'Rampur', 'Sadar', 'Lucknow', 'Uttar Pradesh', '{"type":"polygon","coordinates":[[280,440],[460,440],[460,540],[280,540],[280,440]]}', 2.30, 'hectare', true, 'requires_validation'),
  ('a1111111-1111-1111-1111-111111111112', 'P-201', '200/1', 'Sultanpur', 'Sadar', 'Lucknow', 'Uttar Pradesh', '{"type":"polygon","coordinates":[[100,100],[200,100],[200,180],[100,180],[100,100]]}', 1.20, 'hectare', false, 'verified'),
  ('a1111111-1111-1111-1111-111111111113', 'P-202', '200/2', 'Sultanpur', 'Sadar', 'Lucknow', 'Uttar Pradesh', '{"type":"polygon","coordinates":[[200,100],[300,100],[300,180],[200,180],[200,100]]}', 2.50, 'hectare', false, 'verified'),
  ('a1111111-1111-1111-1111-111111111114', 'P-203', '201/1', 'Sultanpur', 'Sadar', 'Lucknow', 'Uttar Pradesh', '{"type":"polygon","coordinates":[[300,100],[400,100],[400,180],[300,180],[300,100]]}', 3.40, 'hectare', true, 'unverified')
ON CONFLICT DO NOTHING;

-- ============ DOCUMENTS ============
INSERT INTO documents (id, filename, original_filename, file_type, file_size, page_count, status, document_type, detected_language, detected_type, quality_score, quality_details, state, district, tehsil, village, record_year, source_department, reference_number, ocr_text, ocr_confidence, overall_confidence, processing_progress, created_at)
VALUES
  ('b1111111-1111-1111-1111-111111111101', 'khasra_rampur_001.pdf', 'khasra_rampur_001.pdf', 'pdf', 2456789, 3, 'approved', 'khasra', 'en', 'khasra', 88.50, '{"blur":"low","contrast":"good","rotation":0.5,"resolution":"300dpi","noise":"low"}', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 2024, 'Revenue Department', 'REF-2024-001', 'Survey No 124/3 Owner Ramesh Kumar Father Suresh Kumar Area 2.47 hectare Village Rampur', 94.0, 92.5, 100, '2026-09-20T08:30:00Z'),
  ('b1111111-1111-1111-1111-111111111102', 'khatauni_rampur_002.pdf', 'khatauni_rampur_002.pdf', 'pdf', 1876543, 2, 'verified', 'khatauni', 'hi', 'khatauni', 82.00, '{"blur":"medium","contrast":"fair","rotation":1.2,"resolution":"200dpi","noise":"medium"}', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 2024, 'Revenue Department', 'REF-2024-002', 'Khatauni Number 45 Survey 125/1 Owner Suresh Singh Area 3.10 hectare', 89.0, 87.0, 100, '2026-09-20T09:15:00Z'),
  ('b1111111-1111-1111-1111-111111111103', 'jamabandi_rampur_003.pdf', 'jamabandi_rampur_003.pdf', 'pdf', 3214567, 4, 'verified', 'jamabandi', 'en', 'jamabandi', 91.00, '{"blur":"low","contrast":"good","rotation":0.0,"resolution":"300dpi","noise":"low"}', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 2023, 'Revenue Department', 'REF-2023-003', 'Jamabandi Survey 126/1 Owner Mahesh Yadav Area 4.20 hectare Village Rampur', 96.0, 94.0, 100, '2026-09-21T10:00:00Z'),
  ('b1111111-1111-1111-1111-111111111104', 'mutation_rampur_004.pdf', 'mutation_rampur_004.pdf', 'pdf', 1567890, 1, 'under_review', 'mutation_record', 'hi', 'mutation_record', 65.00, '{"blur":"high","contrast":"poor","rotation":2.4,"resolution":"150dpi","noise":"high"}', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 2024, 'Tehsil Office', 'REF-2024-004', 'Mutation No 78/2024 Survey 124/3 New Owner Suresh Kumar Area 2.47', 72.0, 61.0, 100, '2026-09-22T11:30:00Z'),
  ('b1111111-1111-1111-1111-111111111105', 'sale_deed_lucknow_005.pdf', 'sale_deed_lucknow_005.pdf', 'pdf', 4234567, 5, 'verified', 'sale_deed', 'en', 'sale_deed', 85.00, '{"blur":"low","contrast":"good","rotation":0.8,"resolution":"300dpi","noise":"low"}', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Sultanpur', 2023, 'Registration Department', 'REF-2023-005', 'Sale Deed No 145/2023 Survey 200/1 Owner Anil Kumar Area 1.20 hectare', 91.0, 89.0, 100, '2026-09-21T14:00:00Z'),
  ('b1111111-1111-1111-1111-111111111106', 'khasra_rampur_006.pdf', 'khasra_rampur_006.pdf', 'pdf', 2098765, 2, 'review_required', 'khasra', 'hi', 'khasra', 72.00, '{"blur":"medium","contrast":"fair","rotation":1.5,"resolution":"200dpi","noise":"medium"}', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 2024, 'Revenue Department', 'REF-2024-006', 'Survey 125/2 Owner Kamla Devi Area 1.95 hectare Village Rampur', 78.0, 74.0, 100, '2026-09-23T09:00:00Z'),
  ('b1111111-1111-1111-1111-111111111107', 'khasra_rampur_007.pdf', 'khasra_rampur_007.pdf', 'pdf', 1987654, 2, 'verified', 'khasra', 'en', 'khasra', 86.00, '{"blur":"low","contrast":"good","rotation":0.3,"resolution":"300dpi","noise":"low"}', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 2023, 'Revenue Department', 'REF-2023-007', 'Survey 126/2 Owner Phool Singh Area 2.80 hectare Village Rampur', 93.0, 91.0, 100, '2026-09-22T08:00:00Z'),
  ('b1111111-1111-1111-1111-111111111108', 'khasra_rampur_008.pdf', 'khasra_rampur_008.pdf', 'pdf', 1678901, 1, 'conflict', 'khasra', 'en', 'khasra', 83.00, '{"blur":"low","contrast":"good","rotation":1.0,"resolution":"300dpi","noise":"low"}', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 2024, 'Revenue Department', 'REF-2024-008', 'Survey 124/3 Owner Suresh Kumar Area 2.47 hectare Village Rampur', 90.0, 88.0, 100, '2026-09-23T10:30:00Z'),
  ('b1111111-1111-1111-1111-111111111109', 'jamabandi_sultanpur_009.pdf', 'jamabandi_sultanpur_009.pdf', 'pdf', 2890654, 3, 'verified', 'jamabandi', 'en', 'jamabandi', 89.00, '{"blur":"low","contrast":"good","rotation":0.2,"resolution":"300dpi","noise":"low"}', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Sultanpur', 2023, 'Revenue Department', 'REF-2023-009', 'Jamabandi Survey 200/2 Owner Rekha Sharma Area 2.50 hectare', 92.0, 90.0, 100, '2026-09-21T13:00:00Z'),
  ('b1111111-1111-1111-1111-111111111110', 'khasra_rampur_010.pdf', 'khasra_rampur_010.pdf', 'pdf', 1345678, 1, 'review_required', 'khasra', 'hi', 'khasra', 68.00, '{"blur":"high","contrast":"poor","rotation":3.0,"resolution":"150dpi","noise":"high"}', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 2024, 'Revenue Department', 'REF-2024-010', 'Survey 127/1 Owner Ram Prasad Area 1.50 hectare Village Rampur', 71.0, 67.0, 100, '2026-09-23T15:00:00Z'),
  ('b1111111-1111-1111-1111-111111111111', 'khasra_rampur_011.pdf', 'khasra_rampur_011.pdf', 'pdf', 1876543, 2, 'verified', 'khasra', 'en', 'khasra', 87.00, '{"blur":"low","contrast":"good","rotation":0.5,"resolution":"300dpi","noise":"low"}', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 2023, 'Revenue Department', 'REF-2023-011', 'Survey 127/2 Owner Shyam Lal Area 3.75 hectare Village Rampur', 94.0, 92.0, 100, '2026-09-22T16:00:00Z'),
  ('b1111111-1111-1111-1111-111111111112', 'khasra_rampur_012.pdf', 'khasra_rampur_012.pdf', 'pdf', 2234567, 2, 'duplicate', 'khasra', 'en', 'khasra', 85.00, '{"blur":"low","contrast":"good","rotation":0.0,"resolution":"300dpi","noise":"low"}', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 2024, 'Revenue Department', 'REF-2024-012', 'Survey 124/3 Owner Ramesh Kumar Area 2.47 hectare Village Rampur', 93.0, 91.0, 100, '2026-09-23T11:00:00Z'),
  ('b1111111-1111-1111-1111-111111111113', 'property_reg_lucknow_013.pdf', 'property_reg_lucknow_013.pdf', 'pdf', 3567890, 4, 'verified', 'property_register', 'en', 'property_register', 90.00, '{"blur":"low","contrast":"good","rotation":0.0,"resolution":"300dpi","noise":"low"}', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Sultanpur', 2023, 'Municipal Office', 'REF-2023-013', 'Property Register Survey 201/1 Owner Sunil Kumar Area 3.40 hectare', 95.0, 93.0, 100, '2026-09-21T11:30:00Z'),
  ('b1111111-1111-1111-1111-111111111114', 'khasra_rampur_014.pdf', 'khasra_rampur_014.pdf', 'pdf', 1678901, 1, 'processing', 'khasra', NULL, NULL, NULL, NULL, 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 2024, 'Revenue Department', 'REF-2024-014', NULL, NULL, NULL, 35, '2026-09-27T08:00:00Z'),
  ('b1111111-1111-1111-1111-111111111115', 'khasra_rampur_015.pdf', 'khasra_rampur_015.pdf', 'pdf', 2098765, 2, 'processing', 'khasra', NULL, NULL, NULL, NULL, 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 2024, 'Revenue Department', 'REF-2024-015', NULL, NULL, NULL, 10, '2026-09-27T08:05:00Z'),
  ('b1111111-1111-1111-1111-111111111116', 'khasra_rampur_016.pdf', 'khasra_rampur_016.pdf', 'pdf', 1876543, 2, 'extracted', 'khasra', 'hi', 'khasra', 79.00, '{"blur":"medium","contrast":"fair","rotation":1.0,"resolution":"200dpi","noise":"medium"}', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 2024, 'Revenue Department', 'REF-2024-016', 'Survey 128/1 Owner Ganga Prasad Area 5.60 hectare Village Rampur', 85.0, 82.0, 100, '2026-09-26T10:00:00Z'),
  ('b1111111-1111-1111-1111-111111111117', 'khasra_rampur_017.pdf', 'khasra_rampur_017.pdf', 'pdf', 1678901, 1, 'extracted', 'khasra', 'hi', 'khasra', 76.00, '{"blur":"medium","contrast":"fair","rotation":1.8,"resolution":"200dpi","noise":"medium"}', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 2024, 'Revenue Department', 'REF-2024-017', 'Survey 128/2 Owner Kaushalya Devi Area 2.30 hectare Village Rampur', 82.0, 79.0, 100, '2026-09-26T11:00:00Z'),
  ('b1111111-1111-1111-1111-111111111118', 'tax_record_rampur_018.pdf', 'tax_record_rampur_018.pdf', 'pdf', 1234567, 1, 'verified', 'tax_record', 'en', 'tax_record', 84.00, '{"blur":"low","contrast":"good","rotation":0.5,"resolution":"300dpi","noise":"low"}', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 2023, 'Tax Department', 'REF-2023-018', 'Tax Record Survey 124/1 Owner Ramesh Kumar Area 2.15 hectare', 91.0, 89.0, 100, '2026-09-21T12:00:00Z'),
  ('b1111111-1111-1111-1111-111111111119', 'khasra_rampur_019.pdf', 'khasra_rampur_019.pdf', 'pdf', 1678901, 1, 'uploaded', NULL, NULL, NULL, NULL, NULL, 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 2024, 'Revenue Department', 'REF-2024-019', NULL, NULL, NULL, 0, '2026-09-27T07:55:00Z'),
  ('b1111111-1111-1111-1111-111111111120', 'khasra_rampur_020.pdf', 'khasra_rampur_020.pdf', 'pdf', 1876543, 2, 'uploaded', NULL, NULL, NULL, NULL, NULL, 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 2024, 'Revenue Department', 'REF-2024-020', NULL, NULL, NULL, 0, '2026-09-27T07:50:00Z')
ON CONFLICT DO NOTHING;

-- ============ LAND RECORDS ============
INSERT INTO land_records (id, document_id, survey_number, khasra_number, khata_number, plot_number, owner_name, father_husband_name, ownership_type, area, area_unit, land_classification, land_usage, state, district, tehsil, village, mutation_number, mutation_date, registration_number, registration_date, transaction_type, verification_status, confidence_score, record_year, source_document_ref, created_at)
VALUES
  ('c1111111-1111-1111-1111-111111111101', 'b1111111-1111-1111-1111-111111111101', '124/3', 'K-45', 'KH-12', 'P-103', 'Ramesh Kumar', 'Suresh Kumar', 'single', 2.47, 'hectare', 'Agricultural', 'Cultivation', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 'M-45/2021', '2021-04-15', 'REG-2021-456', '2021-04-20', 'inheritance', 'approved', 92.50, 2024, 'REF-2024-001', '2026-09-20T08:35:00Z'),
  ('c1111111-1111-1111-1111-111111111102', 'b1111111-1111-1111-1111-111111111102', '125/1', 'K-46', 'KH-12', 'P-104', 'Suresh Singh', 'Ram Singh', 'single', 3.10, 'hectare', 'Agricultural', 'Cultivation', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 'M-46/2020', '2020-03-10', NULL, NULL, 'purchase', 'verified', 87.00, 2024, 'REF-2024-002', '2026-09-20T09:20:00Z'),
  ('c1111111-1111-1111-1111-111111111103', 'b1111111-1111-1111-1111-111111111103', '126/1', 'K-47', 'KH-13', 'P-106', 'Mahesh Yadav', 'Lal Singh Yadav', 'single', 4.20, 'hectare', 'Agricultural', 'Cultivation', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 'M-47/2019', '2019-08-22', NULL, NULL, 'inheritance', 'verified', 94.00, 2023, 'REF-2023-003', '2026-09-21T10:05:00Z'),
  ('c1111111-1111-1111-1111-111111111104', 'b1111111-1111-1111-1111-111111111104', '124/3', 'K-45', 'KH-12', 'P-103', 'Suresh Kumar', 'Ramesh Kumar', 'single', 2.47, 'hectare', 'Agricultural', 'Cultivation', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 'M-78/2024', '2024-06-01', NULL, NULL, 'mutation', 'under_review', 61.00, 2024, 'REF-2024-004', '2026-09-22T11:35:00Z'),
  ('c1111111-1111-1111-1111-111111111105', 'b1111111-1111-1111-1111-111111111105', '200/1', 'K-55', 'KH-20', 'P-201', 'Anil Kumar', 'Brij Kumar', 'single', 1.20, 'hectare', 'Residential', 'Residential', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Sultanpur', 'M-55/2023', '2023-01-15', 'REG-2023-145', '2023-01-20', 'purchase', 'verified', 89.00, 2023, 'REF-2023-005', '2026-09-21T14:05:00Z'),
  ('c1111111-1111-1111-1111-111111111106', 'b1111111-1111-1111-1111-111111111106', '125/2', 'K-48', 'KH-13', 'P-105', 'Kamla Devi', 'Ram Prasad', 'single', 1.95, 'hectare', 'Agricultural', 'Fallow', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 'M-48/2022', '2022-11-05', NULL, NULL, 'inheritance', 'review_required', 74.00, 2024, 'REF-2024-006', '2026-09-23T09:05:00Z'),
  ('c1111111-1111-1111-1111-111111111107', 'b1111111-1111-1111-1111-111111111107', '126/2', 'K-49', 'KH-14', 'P-107', 'Phool Singh', 'Dharam Singh', 'single', 2.80, 'hectare', 'Agricultural', 'Cultivation', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 'M-49/2021', '2021-07-12', NULL, NULL, 'purchase', 'verified', 91.00, 2023, 'REF-2023-007', '2026-09-22T08:05:00Z'),
  ('c1111111-1111-1111-1111-111111111108', 'b1111111-1111-1111-1111-111111111108', '124/3', 'K-45', 'KH-12', 'P-103', 'Suresh Kumar', 'Ramesh Kumar', 'single', 2.47, 'hectare', 'Agricultural', 'Cultivation', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 'M-78/2024', '2024-06-01', NULL, NULL, 'mutation', 'pending', 88.00, 2024, 'REF-2024-008', '2026-09-23T10:35:00Z'),
  ('c1111111-1111-1111-1111-111111111109', 'b1111111-1111-1111-1111-111111111109', '200/2', 'K-56', 'KH-20', 'P-202', 'Rekha Sharma', 'Mohan Sharma', 'joint', 2.50, 'hectare', 'Agricultural', 'Cultivation', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Sultanpur', 'M-56/2022', '2022-05-18', NULL, NULL, 'inheritance', 'verified', 90.00, 2023, 'REF-2023-009', '2026-09-21T13:05:00Z'),
  ('c1111111-1111-1111-1111-111111111110', 'b1111111-1111-1111-1111-111111111110', '127/1', 'K-50', 'KH-15', 'P-108', 'Ram Prasad', 'Hari Prasad', 'single', 1.50, 'hectare', 'Agricultural', 'Fallow', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 'M-50/2023', '2023-12-01', NULL, NULL, 'inheritance', 'review_required', 67.00, 2024, 'REF-2024-010', '2026-09-23T15:05:00Z'),
  ('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '127/2', 'K-51', 'KH-15', 'P-109', 'Shyam Lal', 'Ganga Lal', 'single', 3.75, 'hectare', 'Agricultural', 'Cultivation', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 'M-51/2020', '2020-09-14', NULL, NULL, 'purchase', 'verified', 92.00, 2023, 'REF-2023-011', '2026-09-22T16:05:00Z'),
  ('c1111111-1111-1111-1111-111111111112', 'b1111111-1111-1111-1111-111111111112', '124/3', 'K-45', 'KH-12', 'P-103', 'Ramesh Kumar', 'Suresh Kumar', 'single', 2.47, 'hectare', 'Agricultural', 'Cultivation', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 'M-45/2021', '2021-04-15', 'REG-2021-456', '2021-04-20', 'inheritance', 'pending', 91.00, 2024, 'REF-2024-012', '2026-09-23T11:05:00Z'),
  ('c1111111-1111-1111-1111-111111111113', 'b1111111-1111-1111-1111-111111111113', '201/1', 'K-57', 'KH-21', 'P-203', 'Sunil Kumar', 'Vinod Kumar', 'single', 3.40, 'hectare', 'Mixed', 'Cultivation', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Sultanpur', 'M-57/2023', '2023-03-20', 'REG-2023-200', '2023-03-25', 'purchase', 'verified', 93.00, 2023, 'REF-2023-013', '2026-09-21T11:35:00Z'),
  ('c1111111-1111-1111-1111-111111111116', 'b1111111-1111-1111-1111-111111111116', '128/1', 'K-52', 'KH-16', 'P-110', 'Ganga Prasad', 'Ram Prasad', 'joint', 5.60, 'hectare', 'Agricultural', 'Cultivation', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 'M-52/2019', '2019-02-10', NULL, NULL, 'inheritance', 'pending', 82.00, 2024, 'REF-2024-016', '2026-09-26T10:05:00Z'),
  ('c1111111-1111-1111-1111-111111111117', 'b1111111-1111-1111-1111-111111111117', '128/2', 'K-53', 'KH-16', 'P-111', 'Kaushalya Devi', 'Ganga Prasad', 'single', 2.30, 'hectare', 'Agricultural', 'Fallow', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 'M-53/2022', '2022-08-03', NULL, NULL, 'inheritance', 'pending', 79.00, 2024, 'REF-2024-017', '2026-09-26T11:05:00Z'),
  ('c1111111-1111-1111-1111-111111111118', 'b1111111-1111-1111-1111-111111111118', '124/1', 'K-44', 'KH-11', 'P-101', 'Ramesh Kumar', 'Suresh Kumar', 'single', 2.15, 'hectare', 'Agricultural', 'Cultivation', 'Uttar Pradesh', 'Lucknow', 'Sadar', 'Rampur', 'M-44/2021', '2021-04-15', NULL, NULL, 'inheritance', 'verified', 89.00, 2023, 'REF-2023-018', '2026-09-21T12:05:00Z')
ON CONFLICT DO NOTHING;

-- ============ OWNERS ============
INSERT INTO owners (land_record_id, name, father_husband_name, ownership_type, ownership_share, is_primary)
VALUES
  ('c1111111-1111-1111-1111-111111111101', 'Ramesh Kumar', 'Suresh Kumar', 'single', '100%', true),
  ('c1111111-1111-1111-1111-111111111102', 'Suresh Singh', 'Ram Singh', 'single', '100%', true),
  ('c1111111-1111-1111-1111-111111111103', 'Mahesh Yadav', 'Lal Singh Yadav', 'single', '100%', true),
  ('c1111111-1111-1111-1111-111111111104', 'Suresh Kumar', 'Ramesh Kumar', 'single', '100%', true),
  ('c1111111-1111-1111-1111-111111111105', 'Anil Kumar', 'Brij Kumar', 'single', '100%', true),
  ('c1111111-1111-1111-1111-111111111106', 'Kamla Devi', 'Ram Prasad', 'single', '100%', true),
  ('c1111111-1111-1111-1111-111111111107', 'Phool Singh', 'Dharam Singh', 'single', '100%', true),
  ('c1111111-1111-1111-1111-111111111108', 'Suresh Kumar', 'Ramesh Kumar', 'single', '100%', true),
  ('c1111111-1111-1111-1111-111111111109', 'Rekha Sharma', 'Mohan Sharma', 'joint', '50%', true),
  ('c1111111-1111-1111-1111-111111111109', 'Rajesh Sharma', 'Mohan Sharma', 'joint', '50%', false),
  ('c1111111-1111-1111-1111-111111111110', 'Ram Prasad', 'Hari Prasad', 'single', '100%', true),
  ('c1111111-1111-1111-1111-111111111111', 'Shyam Lal', 'Ganga Lal', 'single', '100%', true),
  ('c1111111-1111-1111-1111-111111111112', 'Ramesh Kumar', 'Suresh Kumar', 'single', '100%', true),
  ('c1111111-1111-1111-1111-111111111113', 'Sunil Kumar', 'Vinod Kumar', 'single', '100%', true),
  ('c1111111-1111-1111-1111-111111111116', 'Ganga Prasad', 'Ram Prasad', 'joint', '60%', true),
  ('c1111111-1111-1111-1111-111111111116', 'Kaushalya Devi', 'Ganga Prasad', 'joint', '40%', false),
  ('c1111111-1111-1111-1111-111111111117', 'Kaushalya Devi', 'Ganga Prasad', 'single', '100%', true),
  ('c1111111-1111-1111-1111-111111111118', 'Ramesh Kumar', 'Suresh Kumar', 'single', '100%', true)
ON CONFLICT DO NOTHING;

-- ============ EXTRACTED FIELDS ============
INSERT INTO extracted_fields (document_id, field_name, field_value, confidence, source_page, bbox, extraction_method, model_version)
VALUES
  ('b1111111-1111-1111-1111-111111111101', 'survey_number', '124/3', 96, 1, '[120, 80, 220, 100]', 'regex_pattern', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111101', 'owner_name', 'Ramesh Kumar', 98, 1, '[120, 110, 280, 130]', 'ner_model', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111101', 'father_husband_name', 'Suresh Kumar', 95, 1, '[120, 140, 280, 160]', 'ner_model', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111101', 'area', '2.47', 94, 1, '[120, 170, 200, 190]', 'regex_pattern', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111101', 'village', 'Rampur', 97, 1, '[120, 200, 200, 220]', 'ner_model', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111101', 'khasra_number', 'K-45', 93, 1, '[120, 50, 200, 70]', 'regex_pattern', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111104', 'survey_number', '124/3', 78, 1, '[100, 80, 200, 100]', 'regex_pattern', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111104', 'owner_name', 'Suresh Kumar', 72, 1, '[100, 110, 260, 130]', 'ner_model', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111104', 'area', '2.47', 61, 1, '[100, 170, 180, 190]', 'regex_pattern', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111104', 'mutation_number', '78/2024', 85, 1, '[100, 50, 220, 70]', 'regex_pattern', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111106', 'survey_number', '125/2', 81, 1, '[100, 80, 200, 100]', 'regex_pattern', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111106', 'owner_name', 'Kamla Devi', 76, 1, '[100, 110, 240, 130]', 'ner_model', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111106', 'area', '1.95', 68, 1, '[100, 170, 180, 190]', 'regex_pattern', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111110', 'survey_number', '127/1', 73, 1, '[100, 80, 200, 100]', 'regex_pattern', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111110', 'owner_name', 'Ram Prasad', 69, 1, '[100, 110, 240, 130]', 'ner_model', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111110', 'area', '1.50', 65, 1, '[100, 170, 180, 190]', 'regex_pattern', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111116', 'survey_number', '128/1', 87, 1, '[100, 80, 200, 100]', 'regex_pattern', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111116', 'owner_name', 'Ganga Prasad', 84, 1, '[100, 110, 260, 130]', 'ner_model', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111116', 'area', '5.60', 80, 1, '[100, 170, 180, 190]', 'regex_pattern', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111117', 'survey_number', '128/2', 84, 1, '[100, 80, 200, 100]', 'regex_pattern', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111117', 'owner_name', 'Kaushalya Devi', 79, 1, '[100, 110, 260, 130]', 'ner_model', 'field-extractor-v1'),
  ('b1111111-1111-1111-1111-111111111117', 'area', '2.30', 75, 1, '[100, 170, 180, 190]', 'regex_pattern', 'field-extractor-v1')
ON CONFLICT DO NOTHING;

-- ============ VALIDATION RESULTS ============
INSERT INTO validation_results (document_id, land_record_id, rule, status, severity, message, field_name)
VALUES
  ('b1111111-1111-1111-1111-111111111101', 'c1111111-1111-1111-1111-111111111101', 'REQUIRED_FIELDS', 'pass', NULL, 'All required fields present', NULL),
  ('b1111111-1111-1111-1111-111111111101', 'c1111111-1111-1111-1111-111111111101', 'SURVEY_NUMBER_FORMAT', 'pass', NULL, 'Survey number format valid', 'survey_number'),
  ('b1111111-1111-1111-1111-111111111101', 'c1111111-1111-1111-1111-111111111101', 'AREA_POSITIVE', 'pass', NULL, 'Area value is positive', 'area'),
  ('b1111111-1111-1111-1111-111111111101', 'c1111111-1111-1111-1111-111111111101', 'GEOGRAPHIC_HIERARCHY', 'pass', NULL, 'Geographic hierarchy valid', NULL),
  ('b1111111-1111-1111-1111-111111111104', 'c1111111-1111-1111-1111-111111111104', 'REQUIRED_FIELDS', 'pass', NULL, 'All required fields present', NULL),
  ('b1111111-1111-1111-1111-111111111104', 'c1111111-1111-1111-1111-111111111104', 'AREA_CONFIDENCE', 'fail', 'high', 'Area confidence below threshold (61% < 70%)', 'area'),
  ('b1111111-1111-1111-1111-111111111104', 'c1111111-1111-1111-1111-111111111104', 'OWNER_MATCH', 'warn', 'medium', 'Owner differs from previous record on same survey', 'owner_name'),
  ('b1111111-1111-1111-1111-111111111104', 'c1111111-1111-1111-1111-111111111104', 'SURVEY_NUMBER_FORMAT', 'pass', NULL, 'Survey number format valid', 'survey_number'),
  ('b1111111-1111-1111-1111-111111111106', 'c1111111-1111-1111-1111-111111111106', 'AREA_CONFIDENCE', 'warn', 'medium', 'Area confidence below recommended threshold (68% < 70%)', 'area'),
  ('b1111111-1111-1111-1111-111111111106', 'c1111111-1111-1111-1111-111111111106', 'OWNER_CONFIDENCE', 'warn', 'medium', 'Owner name confidence below threshold (76% < 80%)', 'owner_name'),
  ('b1111111-1111-1111-1111-111111111106', 'c1111111-1111-1111-1111-111111111106', 'SURVEY_NUMBER_FORMAT', 'pass', NULL, 'Survey number format valid', 'survey_number'),
  ('b1111111-1111-1111-1111-111111111110', 'c1111111-1111-1111-1111-111111111110', 'AREA_CONFIDENCE', 'fail', 'high', 'Area confidence below threshold (65% < 70%)', 'area'),
  ('b1111111-1111-1111-1111-111111111110', 'c1111111-1111-1111-1111-111111111110', 'OWNER_CONFIDENCE', 'fail', 'high', 'Owner name confidence below threshold (69% < 70%)', 'owner_name'),
  ('b1111111-1111-1111-1111-111111111110', 'c1111111-1111-1111-1111-111111111110', 'SURVEY_NUMBER_FORMAT', 'pass', NULL, 'Survey number format valid', 'survey_number'),
  ('b1111111-1111-1111-1111-111111111110', 'c1111111-1111-1111-1111-111111111110', 'SURVEY_CONFIDENCE', 'warn', 'medium', 'Survey number confidence below recommended threshold (73% < 80%)', 'survey_number')
ON CONFLICT DO NOTHING;

-- ============ DUPLICATE CANDIDATES ============
INSERT INTO duplicate_candidates (record_a_id, record_b_id, similarity_score, match_dimensions, status)
VALUES
  ('c1111111-1111-1111-1111-111111111101', 'c1111111-1111-1111-1111-111111111112', 96.00, '{"dimensions":["survey_number","owner_name","village","area"],"method":"fuzzy_match"}', 'pending')
ON CONFLICT DO NOTHING;

-- ============ CONFLICTS ============
INSERT INTO conflicts (record_a_id, record_b_id, conflict_type, field_name, value_a, value_b, severity, status)
VALUES
  ('c1111111-1111-1111-1111-111111111101', 'c1111111-1111-1111-1111-111111111104', 'owner_mismatch', 'owner_name', 'Ramesh Kumar', 'Suresh Kumar', 'high', 'pending'),
  ('c1111111-1111-1111-1111-111111111101', 'c1111111-1111-1111-1111-111111111108', 'owner_mismatch', 'owner_name', 'Ramesh Kumar', 'Suresh Kumar', 'high', 'pending')
ON CONFLICT DO NOTHING;

-- ============ VERIFICATION TASKS ============
INSERT INTO verification_tasks (document_id, land_record_id, priority, status, comments, created_at)
VALUES
  ('b1111111-1111-1111-1111-111111111104', 'c1111111-1111-1111-1111-111111111104', 'high', 'in_progress', 'Low confidence area extraction - needs manual verification', '2026-09-22T11:40:00Z'),
  ('b1111111-1111-1111-1111-111111111106', 'c1111111-1111-1111-1111-111111111106', 'medium', 'pending', 'Multiple fields below confidence threshold', '2026-09-23T09:10:00Z'),
  ('b1111111-1111-1111-1111-111111111110', 'c1111111-1111-1111-1111-111111111110', 'high', 'pending', 'Low confidence on owner and area fields', '2026-09-23T15:10:00Z'),
  ('b1111111-1111-1111-1111-111111111108', 'c1111111-1111-1111-1111-111111111108', 'urgent', 'pending', 'Ownership conflict detected on survey 124/3', '2026-09-23T10:40:00Z'),
  ('b1111111-1111-1111-1111-111111111112', 'c1111111-1111-1111-1111-111111111112', 'medium', 'pending', 'Possible duplicate - needs confirmation', '2026-09-23T11:10:00Z'),
  ('b1111111-1111-1111-1111-111111111116', 'c1111111-1111-1111-1111-111111111116', 'low', 'pending', 'Newly extracted - pending validation review', '2026-09-26T10:10:00Z'),
  ('b1111111-1111-1111-1111-111111111117', 'c1111111-1111-1111-1111-111111111117', 'low', 'pending', 'Newly extracted - pending validation review', '2026-09-26T11:10:00Z')
ON CONFLICT DO NOTHING;

-- ============ RECORD MAP LINKS ============
INSERT INTO record_map_links (land_record_id, map_plot_id, match_confidence, match_status)
VALUES
  ('c1111111-1111-1111-1111-111111111101', 'a1111111-1111-1111-1111-111111111103', 98.00, 'verified'),
  ('c1111111-1111-1111-1111-111111111102', 'a1111111-1111-1111-1111-111111111104', 85.00, 'auto_matched'),
  ('c1111111-1111-1111-1111-111111111103', 'a1111111-1111-1111-1111-111111111106', 96.00, 'verified'),
  ('c1111111-1111-1111-1111-111111111105', 'a1111111-1111-1111-1111-111111111112', 97.00, 'verified'),
  ('c1111111-1111-1111-1111-111111111106', 'a1111111-1111-1111-1111-111111111105', 82.00, 'auto_matched'),
  ('c1111111-1111-1111-1111-111111111107', 'a1111111-1111-1111-1111-111111111107', 95.00, 'verified'),
  ('c1111111-1111-1111-1111-111111111109', 'a1111111-1111-1111-1111-111111111113', 94.00, 'verified'),
  ('c1111111-1111-1111-1111-111111111110', 'a1111111-1111-1111-1111-111111111108', 78.00, 'requires_verification'),
  ('c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111109', 97.00, 'verified'),
  ('c1111111-1111-1111-1111-111111111113', 'a1111111-1111-1111-1111-111111111114', 93.00, 'verified'),
  ('c1111111-1111-1111-1111-111111111116', 'a1111111-1111-1111-1111-111111111110', 88.00, 'auto_matched'),
  ('c1111111-1111-1111-1111-111111111117', 'a1111111-1111-1111-1111-111111111111', 85.00, 'auto_matched'),
  ('c1111111-1111-1111-1111-111111111118', 'a1111111-1111-1111-1111-111111111101', 96.00, 'verified')
ON CONFLICT DO NOTHING;

-- ============ AUDIT LOGS ============
INSERT INTO audit_logs (user_name, user_role, action, entity_type, entity_id, details, created_at)
VALUES
  ('Demo Operator', 'operator', 'document_uploaded', 'document', 'b1111111-1111-1111-1111-111111111101', '{"filename":"khasra_rampur_001.pdf","village":"Rampur"}', '2026-09-20T08:30:00Z'),
  ('System', 'system', 'processing_started', 'document', 'b1111111-1111-1111-1111-111111111101', '{"step":"ocr"}', '2026-09-20T08:31:00Z'),
  ('System', 'system', 'ocr_completed', 'document', 'b1111111-1111-1111-1111-111111111101', '{"confidence":94.0,"language":"en"}', '2026-09-20T08:32:00Z'),
  ('System', 'system', 'extraction_completed', 'document', 'b1111111-1111-1111-1111-111111111101', '{"fields":6,"overall_confidence":92.5}', '2026-09-20T08:33:00Z'),
  ('System', 'system', 'validation_completed', 'document', 'b1111111-1111-1111-1111-111111111101', '{"passed":4,"failed":0,"warnings":0}', '2026-09-20T08:34:00Z'),
  ('Demo Operator', 'operator', 'document_uploaded', 'document', 'b1111111-1111-1111-1111-111111111104', '{"filename":"mutation_rampur_004.pdf","village":"Rampur"}', '2026-09-22T11:30:00Z'),
  ('System', 'system', 'ocr_completed', 'document', 'b1111111-1111-1111-1111-111111111104', '{"confidence":72.0,"language":"hi"}', '2026-09-22T11:32:00Z'),
  ('System', 'system', 'validation_completed', 'document', 'b1111111-1111-1111-1111-111111111104', '{"passed":2,"failed":1,"warnings":1}', '2026-09-22T11:33:00Z'),
  ('System', 'system', 'conflict_detected', 'land_record', 'c1111111-1111-1111-1111-111111111104', '{"conflict_type":"owner_mismatch","survey":"124/3"}', '2026-09-22T11:34:00Z'),
  ('Demo Verification Officer', 'verification_officer', 'verification_started', 'land_record', 'c1111111-1111-1111-1111-111111111104', '{"assigned_to":"verification_officer"}', '2026-09-22T12:00:00Z'),
  ('Demo Verification Officer', 'verification_officer', 'field_corrected', 'land_record', 'c1111111-1111-1111-1111-111111111101', '{"field":"area","from":"2.47","to":"2.47","note":"confirmed"}', '2026-09-20T14:00:00Z'),
  ('Demo Verification Officer', 'verification_officer', 'record_approved', 'land_record', 'c1111111-1111-1111-1111-111111111101', '{"confidence":92.5}', '2026-09-20T14:05:00Z'),
  ('System', 'system', 'duplicate_detected', 'land_record', 'c1111111-1111-1111-1111-111111111112', '{"matched_with":"c1111111-1111-1111-1111-111111111101","similarity":96}', '2026-09-23T11:15:00Z'),
  ('Demo Operator', 'operator', 'document_uploaded', 'document', 'b1111111-1111-1111-1111-111111111114', '{"filename":"khasra_rampur_014.pdf","village":"Rampur"}', '2026-09-27T08:00:00Z'),
  ('System', 'system', 'processing_started', 'document', 'b1111111-1111-1111-1111-111111111114', '{"step":"quality_analysis"}', '2026-09-27T08:01:00Z')
ON CONFLICT DO NOTHING;

-- ============ NOTIFICATIONS ============
INSERT INTO notifications (type, title, message, severity, is_read)
VALUES
  ('conflict', 'Ownership conflict detected', 'Survey 124/3 has conflicting owners: Ramesh Kumar vs Suresh Kumar', 'error', false),
  ('duplicate', 'Possible duplicate found', 'Record REF-2024-012 is 96% similar to REF-2024-001', 'warning', false),
  ('low_confidence', '42 records require verification', 'Multiple records have confidence scores below threshold', 'warning', false),
  ('processing', '2 documents currently processing', 'Documents are in the OCR extraction pipeline', 'info', false),
  ('backlog', 'Verification backlog growing', '5 records pending verification for over 48 hours', 'warning', false),
  ('success', '15 records auto-validated', '15 records passed all validation checks automatically', 'success', true)
ON CONFLICT DO NOTHING;

-- ============ PROCESSING JOBS ============
INSERT INTO processing_jobs (document_id, job_type, status, progress, current_step, started_at)
VALUES
  ('b1111111-1111-1111-1111-111111111114', 'full_pipeline', 'running', 35, 'ocr_extraction', '2026-09-27T08:01:00Z'),
  ('b1111111-1111-1111-1111-111111111115', 'full_pipeline', 'running', 10, 'quality_analysis', '2026-09-27T08:06:00Z'),
  ('b1111111-1111-1111-1111-111111111119', 'full_pipeline', 'queued', 0, NULL, NULL),
  ('b1111111-1111-1111-1111-111111111120', 'full_pipeline', 'queued', 0, NULL, NULL)
ON CONFLICT DO NOTHING;