export type UserRole =
  | 'admin' | 'operator' | 'verification_officer' | 'gis_officer' | 'senior_officer'
  | 'super_admin' | 'central_authority' | 'state_administrator' | 'district_administrator'
  | 'tehsil_officer' | 'revenue_officer' | 'registrar' | 'survey_officer'
  | 'land_record_officer' | 'data_entry_operator' | 'auditor' | 'citizen';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export type DocumentStatus =
  | 'uploaded' | 'pending_registrar_approval' | 'approved_for_processing'
  | 'correction_required' | 'processing' | 'extracted' | 'validation_pending'
  | 'review_required' | 'under_review' | 'verified' | 'approved'
  | 'rejected' | 'duplicate' | 'conflict' | 'error' | 'digitized';

export type DocumentType =
  | 'khasra' | 'khatauni' | 'jamabandi' | 'mutation_record'
  | 'sale_deed' | 'registration_record' | 'property_register'
  | 'ownership_certificate' | 'tax_record' | 'cadastral_map' | 'other';

export interface LandDocument {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  page_count: number;
  file_url: string | null;
  thumbnail_url: string | null;
  status: DocumentStatus;
  document_type: DocumentType | null;
  detected_language: string | null;
  detected_type: string | null;
  quality_score: number | null;
  quality_details: Record<string, string> | null;
  state: string | null;
  district: string | null;
  tehsil: string | null;
  village: string | null;
  ward: string | null;
  record_year: number | null;
  source_department: string | null;
  reference_number: string | null;
  ocr_text: string | null;
  ocr_confidence: number | null;
  overall_confidence: number | null;
  extraction_json: ExtractionResult | null;
  processing_progress: number;
  rejection_reason: string | null;
  correction_instructions: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedField {
  id: string;
  document_id: string;
  field_name: string;
  field_value: string | null;
  confidence: number;
  source_page: number | null;
  bbox: number[] | null;
  extraction_method: string;
  model_version: string;
  is_corrected: boolean;
  corrected_value: string | null;
  corrected_by: string | null;
  corrected_at: string | null;
  created_at: string;
}

export type VerificationStatus =
  | 'pending' | 'auto_validated' | 'review_required'
  | 'under_review' | 'verified' | 'approved' | 'rejected';

export interface LandRecord {
  id: string;
  document_id: string | null;
  survey_number: string | null;
  khasra_number: string | null;
  khata_number: string | null;
  plot_number: string | null;
  owner_name: string | null;
  father_husband_name: string | null;
  co_owners: string | null;
  ownership_type: string | null;
  area: number | null;
  area_unit: string | null;
  land_classification: string | null;
  land_usage: string | null;
  soil_type: string | null;
  state: string | null;
  district: string | null;
  tehsil: string | null;
  village: string | null;
  ward: string | null;
  mutation_number: string | null;
  mutation_date: string | null;
  registration_number: string | null;
  registration_date: string | null;
  transaction_type: string | null;
  remarks: string | null;
  verification_status: VerificationStatus;
  confidence_score: number | null;
  assigned_to: string | null;
  verified_by: string | null;
  verified_at: string | null;
  verification_comment: string | null;
  record_year: number | null;
  source_document_ref: string | null;
  created_at: string;
  updated_at: string;
}

export interface Owner {
  id: string;
  land_record_id: string;
  name: string;
  father_husband_name: string | null;
  ownership_type: string | null;
  ownership_share: string | null;
  is_primary: boolean;
}

export interface ValidationResult {
  id: string;
  document_id: string | null;
  land_record_id: string | null;
  rule: string;
  status: 'pass' | 'fail' | 'warn';
  severity: 'low' | 'medium' | 'high' | 'critical' | null;
  message: string;
  field_name: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface DuplicateCandidate {
  id: string;
  record_a_id: string;
  record_b_id: string;
  similarity_score: number;
  match_dimensions: Record<string, unknown> | null;
  status: 'pending' | 'confirmed' | 'rejected' | 'resolved';
  created_at: string;
}

export interface Conflict {
  id: string;
  record_a_id: string;
  record_b_id: string;
  conflict_type: string;
  field_name: string | null;
  value_a: string | null;
  value_b: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical' | null;
  status: 'pending' | 'resolved' | 'escalated';
  created_at: string;
}

export interface VerificationTask {
  id: string;
  document_id: string | null;
  land_record_id: string | null;
  assigned_to: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'reprocessing';
  comments: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface MapPlot {
  id: string;
  plot_number: string;
  survey_number: string | null;
  village: string | null;
  tehsil: string | null;
  district: string | null;
  state: string | null;
  geometry: { type: string; coordinates: number[][] };
  area: number | null;
  area_unit: string | null;
  is_ai_derived: boolean;
  validation_status: 'unverified' | 'verified' | 'requires_validation';
}

export interface RecordMapLink {
  id: string;
  land_record_id: string;
  map_plot_id: string;
  match_confidence: number | null;
  match_status: 'auto_matched' | 'verified' | 'requires_verification' | 'rejected';
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  severity: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  created_at: string;
}

export interface ProcessingJob {
  id: string;
  document_id: string;
  job_type: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  current_step: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_reference: string | null;
  created_by: string | null;
  reason: string | null;
  created_at: string;
}

export interface AdministrativeHierarchy {
  id: string;
  level: 'state' | 'district' | 'sub_division' | 'post_office' | 'police_station' | 'village';
  name: string;
  parent_id: string | null;
  state: string | null;
  district: string | null;
  sub_division: string | null;
  post_office: string | null;
  police_station: string | null;
  village: string | null;
  code: string | null;
  created_at: string;
}

export interface PageOcrResult {
  id: string;
  document_id: string;
  page_number: number;
  text: string | null;
  text_blocks: TextBlock[] | null;
  tables: TableData[] | null;
  headings: string[] | null;
  detected_language: string | null;
  ocr_confidence: number;
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface TextBlock {
  text: string;
  bbox: number[];
  confidence: number;
  type: 'text' | 'heading' | 'key_value' | 'paragraph';
}

export interface TableData {
  rows: string[][];
  bbox: number[];
  confidence: number;
}

export interface PageRelevance {
  id: string;
  document_id: string;
  page_number: number;
  relevance_score: number;
  priority: 'high' | 'medium' | 'low';
  reasons: string[];
  matched_keywords: string[];
  sent_to_llm: boolean;
  created_at: string;
}

export interface ExtractionEvidence {
  id: string;
  document_id: string;
  field_path: string;
  field_value: string | null;
  page_number: number | null;
  source_text: string | null;
  confidence: number;
  extraction_method: string | null;
  created_at: string;
}

export interface FieldConflict {
  id: string;
  document_id: string;
  field_path: string;
  conflict_values: { value: string; page: number }[];
  resolved: boolean;
  resolution: string | null;
  created_at: string;
}

export interface PipelineStage {
  id: string;
  document_id: string;
  stage_name: string;
  stage_order: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  progress: number;
  started_at: string | null;
  completed_at: string | null;
  result_summary: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
}

export interface MultilingualKeyword {
  id: string;
  field_path: string;
  language: string;
  keywords: string[];
  created_at: string;
}

export interface ExtractionResult {
  document: {
    total_pages: number;
    document_type: string | null;
    state: string | null;
    district: string | null;
    language: string | null;
  };
  owner: {
    current_owner: string | null;
    father_name: string | null;
    mother_name: string | null;
    spouse_name: string | null;
    co_owners: string[];
  };
  land: {
    survey_number: string | null;
    khasra_number: string | null;
    khata_number: string | null;
    khatauni_number: string | null;
    plot_number: string | null;
    area: string | null;
    area_unit: string | null;
    land_type: string | null;
  };
  location: {
    village: string | null;
    tehsil: string | null;
    taluka: string | null;
    district: string | null;
    state: string | null;
  };
  registration: {
    registration_number: string | null;
    registration_date: string | null;
    mutation_number: string | null;
    mutation_date: string | null;
  };
  ownership: {
    ownership_type: string | null;
    share_percentage: string | null;
    previous_owners: string[];
  };
  verification: {
    overall_confidence: number;
    requires_manual_review: boolean;
    missing_fields: string[];
    conflicting_fields: string[];
  };
  evidence: ExtractionEvidence[];
}
