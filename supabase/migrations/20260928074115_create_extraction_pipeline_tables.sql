-- ============ PIPELINE TABLES ============
-- Page-level OCR results from PaddleOCR stage
CREATE TABLE IF NOT EXISTS page_ocr_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_number int NOT NULL,
  text text,
  text_blocks jsonb,
  tables jsonb,
  headings jsonb,
  detected_language text,
  ocr_confidence numeric DEFAULT 0,
  ocr_status text DEFAULT 'pending' CHECK (ocr_status IN ('pending','processing','completed','failed')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(document_id, page_number)
);
ALTER TABLE page_ocr_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_page_ocr" ON page_ocr_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_page_ocr" ON page_ocr_results FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_page_ocr" ON page_ocr_results FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_page_ocr_doc ON page_ocr_results(document_id);

-- Page relevance scores from relevant-page detection stage
CREATE TABLE IF NOT EXISTS page_relevance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_number int NOT NULL,
  relevance_score numeric DEFAULT 0,
  priority text DEFAULT 'low' CHECK (priority IN ('high','medium','low')),
  reasons jsonb,
  matched_keywords jsonb,
  sent_to_llm boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id, page_number)
);
ALTER TABLE page_relevance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_page_rel" ON page_relevance FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_page_rel" ON page_relevance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_page_rel" ON page_relevance FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_page_rel_doc ON page_relevance(document_id);

-- Evidence tracking for every extracted field
CREATE TABLE IF NOT EXISTS extraction_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  field_path text NOT NULL,
  field_value text,
  page_number int,
  source_text text,
  confidence numeric DEFAULT 0,
  extraction_method text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE extraction_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_evidence" ON extraction_evidence FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_evidence" ON extraction_evidence FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_evidence" ON extraction_evidence FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_evidence_doc ON extraction_evidence(document_id);

-- Field conflicts detected during validation
CREATE TABLE IF NOT EXISTS field_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  field_path text NOT NULL,
  conflict_values jsonb NOT NULL,
  resolved boolean DEFAULT false,
  resolution text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE field_conflicts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_conflicts" ON field_conflicts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_conflicts" ON field_conflicts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_conflicts" ON field_conflicts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_conflicts_doc ON field_conflicts(document_id);

-- Pipeline stage tracking (replaces processing_jobs for detailed pipeline)
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  stage_name text NOT NULL,
  stage_order int NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed','skipped')),
  progress numeric DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  result_summary jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id, stage_name)
);
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_stages" ON pipeline_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_stages" ON pipeline_stages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_stages" ON pipeline_stages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_stages_doc ON pipeline_stages(document_id);

-- Multilingual keyword dictionary for field detection
CREATE TABLE IF NOT EXISTS multilingual_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_path text NOT NULL,
  language text NOT NULL,
  keywords text[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(field_path, language)
);
ALTER TABLE multilingual_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_keywords" ON multilingual_keywords FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_keywords" ON multilingual_keywords FOR INSERT TO authenticated WITH CHECK (true);

-- Seed multilingual keywords
INSERT INTO multilingual_keywords (field_path, language, keywords) VALUES
  ('owner.current_owner', 'en', ARRAY['owner','name','proprietor','holder','occupant']),
  ('owner.current_owner', 'hi', ARRAY['मालिक','स्वामी','खातेदार','नाम']),
  ('owner.father_name', 'en', ARRAY['father','son of','daughter of','s/o','d/o']),
  ('owner.father_name', 'hi', ARRAY['पिता','पुत्र','पिता का नाम','पुत्री']),
  ('land.survey_number', 'en', ARRAY['survey number','survey no','survey no.','s.no']),
  ('land.survey_number', 'hi', ARRAY['सर्वे नंबर','सर्वे संख्या','सर्वे नं','सर्वे']),
  ('land.khasra_number', 'en', ARRAY['khasra','khasra no','khasra number']),
  ('land.khasra_number', 'hi', ARRAY['खसरा','खसरा नंबर','खसरा संख्या','खसरा नं']),
  ('land.khata_number', 'en', ARRAY['khata','khata no','khata number']),
  ('land.khata_number', 'hi', ARRAY['खता','खता नंबर','खता संख्या','खता नं']),
  ('land.area', 'en', ARRAY['area','hectare','acre','sq m','sq meter','land area']),
  ('land.area', 'hi', ARRAY['क्षेत्रफल','क्षेत्र','हेक्टेयर','एकड़','वर्ग मीटर']),
  ('location.village', 'en', ARRAY['village','vlg']),
  ('location.village', 'hi', ARRAY['गाँव','गांव','ग्राम','मौजा']),
  ('location.tehsil', 'en', ARRAY['tehsil','taluka']),
  ('location.tehsil', 'hi', ARRAY['तहसील','तालुका','परगना']),
  ('location.district', 'en', ARRAY['district','dist']),
  ('location.district', 'hi', ARRAY['जिला','जिला नाम','जनपद']),
  ('registration.mutation_number', 'en', ARRAY['mutation','mutation no','mutation number']),
  ('registration.mutation_number', 'hi', ARRAY['दाखिल','दाखिल नंबर','दाखिल संख्या','अंतरण']),
  ('registration.registration_number', 'en', ARRAY['registration','registration no','reg no','document no']),
  ('registration.registration_number', 'hi', ARRAY['पंजीकरण','पंजीकरण संख्या','पंजीकरण नंबर','दस्तावेज संख्या'])
ON CONFLICT DO NOTHING;

-- Add pipeline_config column to documents for storing extraction JSON
ALTER TABLE documents ADD COLUMN IF NOT EXISTS pipeline_config jsonb;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extraction_json jsonb;
