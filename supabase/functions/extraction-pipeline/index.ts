import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  // Configure APP_ORIGIN in production; land-record data must not be callable cross-origin by default.
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") || "http://localhost:5173",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PipelineRequest {
  documentId: string;
}

interface PageOcrInput {
  page_number: number;
  text: string;
  confidence?: number;
  detected_language?: string;
  tables?: ({ rows: string[][]; bbox?: number[]; confidence?: number } | string[][])[];
  headings?: string[];
  text_blocks?: { text: string; bbox?: number[]; confidence?: number; type?: string }[];
  ocr_status?: "completed" | "failed";
  error_message?: string;
}

interface OcrProcessorResponse {
  page_count: number;
  detected_language?: string;
  pages: PageOcrInput[];
}

const PIPELINE_STAGES = [
  { name: "pdf_parsing", order: 1 },
  { name: "page_ocr", order: 2 },
  { name: "structure_detection", order: 3 },
  { name: "page_indexing", order: 4 },
  { name: "relevance_detection", order: 5 },
  { name: "relevant_page_selection", order: 6 },
  { name: "llm_extraction", order: 7 },
  { name: "validation", order: 8 },
  { name: "confidence_scoring", order: 9 },
  { name: "final_json", order: 10 },
];

// Multilingual keyword dictionary for relevance scoring
const FIELD_KEYWORDS: Record<string, Record<string, string[]>> = {
  "owner.current_owner": {
    en: ["owner", "name", "proprietor", "holder", "occupant"],
    hi: ["मालिक", "स्वामी", "खातेदार", "नाम"],
  },
  "owner.father_name": {
    en: ["father", "son of", "s/o", "d/o"],
    hi: ["पिता", "पुत्र", "पिता का नाम"],
  },
  "land.survey_number": {
    en: ["survey number", "survey no", "s.no"],
    hi: ["सर्वे नंबर", "सर्वे संख्या", "सर्वे नं"],
  },
  "land.khasra_number": {
    en: ["khasra", "khasra no", "khasra number"],
    hi: ["खसरा", "खसरा नंबर", "खसरा संख्या"],
  },
  "land.khata_number": {
    en: ["khata", "khata no", "khata number"],
    hi: ["खता", "खता नंबर", "खता संख्या"],
  },
  "land.area": {
    en: ["area", "hectare", "acre", "sq m", "sq meter", "land area"],
    hi: ["क्षेत्रफल", "क्षेत्र", "हेक्टेयर", "एकड़", "वर्ग मीटर"],
  },
  "location.village": {
    en: ["village", "vlg"],
    hi: ["गाँव", "गांव", "ग्राम", "मौजा"],
  },
  "location.tehsil": {
    en: ["tehsil", "taluka"],
    hi: ["तहसील", "तालुका", "परगना"],
  },
  "location.district": {
    en: ["district", "dist"],
    hi: ["जिला", "जनपद"],
  },
  "registration.mutation_number": {
    en: ["mutation", "mutation no", "mutation number"],
    hi: ["दाखिल", "दाखिल नंबर", "अंतरण"],
  },
  "registration.registration_number": {
    en: ["registration", "registration no", "reg no", "document no"],
    hi: ["पंजीकरण", "पंजीकरण संख्या", "दस्तावेज संख्या"],
  },
};

const REQUIRED_FIELDS = [
  "owner.current_owner",
  "land.survey_number",
  "land.area",
  "location.village",
];

const RELEVANCE_THRESHOLD_HIGH = 0.75;
const RELEVANCE_THRESHOLD_MEDIUM = 0.50;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  let pipelineDocumentId: string | null = null;

  try {
    const body: PipelineRequest = await req.json();
    if (!body.documentId || typeof body.documentId !== "string") throw new Error("documentId is required");

    // Do not accept client-supplied OCR or metadata: those could be forged to alter a record.
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!token || !anonKey) throw new Error("Unauthorized");
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: auth, error: authError } = await authClient.auth.getUser();
    if (authError || !auth.user) throw new Error("Unauthorized");

    const documentId = body.documentId;
    pipelineDocumentId = documentId;
    const { data: document, error: documentError } = await supabase
      .from("documents").select("file_url, file_type, file_size, status, document_type, detected_language, state, district, tehsil, village, record_year")
      .eq("id", documentId).maybeSingle();
    if (documentError || !document) throw new Error("Document not found");
    if (document.status !== "approved_for_processing" && document.status !== "processing") {
      throw new Error("Document is not approved for processing");
    }
    if (document.file_type?.toLowerCase() !== "pdf" || !document.file_url) throw new Error("Only stored PDF documents can be processed");
    if (document.file_size > 50 * 1024 * 1024) throw new Error("PDF exceeds configured size limit");

    const { data: signed, error: signedError } = await supabase.storage.from("land-records").createSignedUrl(document.file_url, 15 * 60);
    if (signedError || !signed?.signedUrl) throw new Error("Unable to securely access PDF");
    const probe = await fetch(signed.signedUrl, { headers: { Range: "bytes=0-4" } });
    const signature = new Uint8Array(await probe.arrayBuffer());
    if (!probe.ok || new TextDecoder().decode(signature).slice(0, 5) !== "%PDF-") throw new Error("Stored file is not a valid PDF");

    const processor = await runPaddleOcrProcessor(signed.signedUrl, documentId);
    const ocrResults = processor.pages;
    const pageCount = processor.page_count;
    const pageNumbers = new Set(ocrResults.map((page) => page.page_number));
    if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > 1000 || !ocrResults.length ||
      pageNumbers.size !== ocrResults.length || [...pageNumbers].some((page) => !Number.isInteger(page) || page < 1 || page > pageCount)) {
      throw new Error("OCR processor returned an invalid page payload");
    }
    const detectedLanguage = document.detected_language || processor.detected_language || detectLanguage(ocrResults.map((p) => p.text).join("\n"));
    const documentType = document.document_type;
    const metadata = { state: document.state, district: document.district, tehsil: document.tehsil, village: document.village, record_year: document.record_year };

    // Initialize pipeline stages
    await initPipelineStages(supabase, documentId);

    // Update document status to processing
    await supabase.from("documents").update({
      status: "processing",
      processing_progress: 5,
    }).eq("id", documentId);

    // === STAGE 1: PDF Parsing ===
    await updateStage(supabase, documentId, "pdf_parsing", "running", 10);
    await supabase.from("audit_logs").insert({
      action: "pipeline_stage_started",
      entity_type: "document",
      entity_id: documentId,
      details: { stage: "pdf_parsing", page_count: pageCount },
    });
    await updateStage(supabase, documentId, "pdf_parsing", "completed", 100, {
      total_pages: pageCount,
      file_type: "pdf",
    });
    await supabase.from("documents").update({ page_count: pageCount }).eq("id", documentId);

    // === STAGE 2: Page-by-page OCR ===
    await updateStage(supabase, documentId, "page_ocr", "running", 15);

    // Store OCR results page by page
    for (const page of ocrResults) {
      const ocrConfidence = clampConfidence(page.confidence);
      const lang = page.detected_language || detectLanguage(page.text);

      await supabase.from("page_ocr_results").upsert({
        document_id: documentId,
        page_number: page.page_number,
        text: page.text,
        text_blocks: page.text_blocks || extractTextBlocks(page.text, ocrConfidence),
        tables: page.tables ? page.tables.map((table) => Array.isArray(table) ? ({ rows: table, bbox: [], confidence: ocrConfidence }) : table) : null,
        headings: page.headings || extractHeadings(page.text),
        detected_language: lang,
        ocr_confidence: Math.round(ocrConfidence * 100),
        ocr_status: page.ocr_status || "completed",
        error_message: page.error_message || null,
      }, { onConflict: "document_id,page_number" });
    }

    const avgOcrConfidence = ocrResults.length > 0
      ? ocrResults.reduce((sum, p) => sum + clampConfidence(p.confidence), 0) / ocrResults.length
      : 0;

    await updateStage(supabase, documentId, "page_ocr", "completed", 100, {
      pages_processed: ocrResults.length,
      avg_confidence: Math.round(avgOcrConfidence * 100),
    });

    // === STAGE 3: Document Structure Detection ===
    await updateStage(supabase, documentId, "structure_detection", "running", 25);
    const structuredPages = ocrResults.map((page) => ({
      page_number: page.page_number,
      elements: parsePageStructure(page.text, page.headings),
    }));
    await updateStage(supabase, documentId, "structure_detection", "completed", 100, {
      total_elements: structuredPages.reduce((s, p) => s + p.elements.length, 0),
    });

    // === STAGE 4: Page Indexing ===
    await updateStage(supabase, documentId, "page_indexing", "running", 35);
    const pageIndex = ocrResults.map((page) => ({
      page_number: page.page_number,
      text: page.text,
      tables: page.tables || [],
      headings: page.headings || [],
      language: page.detected_language || detectLanguage(page.text),
      ocr_confidence: clampConfidence(page.confidence),
    }));
    await updateStage(supabase, documentId, "page_indexing", "completed", 100, {
      indexed_pages: pageIndex.length,
    });

    // === STAGE 5: Relevant Page Detection ===
    await updateStage(supabase, documentId, "relevance_detection", "running", 45);
    const relevanceResults = pageIndex.map((page) => {
      const { score, reasons, matchedKeywords } = scorePageRelevance(page.text, page.language);
      const priority = score >= RELEVANCE_THRESHOLD_HIGH ? "high" : score >= RELEVANCE_THRESHOLD_MEDIUM ? "medium" : "low";
      return { ...page, relevance_score: score, priority, reasons, matched_keywords: matchedKeywords };
    });

    for (const rel of relevanceResults) {
      await supabase.from("page_relevance").upsert({
        document_id: documentId,
        page_number: rel.page_number,
        relevance_score: rel.relevance_score,
        priority: rel.priority,
        reasons: rel.reasons,
        matched_keywords: rel.matched_keywords,
        sent_to_llm: rel.priority === "high",
      }, { onConflict: "document_id,page_number" });
    }

    await updateStage(supabase, documentId, "relevance_detection", "completed", 100, {
      high_priority: relevanceResults.filter((r) => r.priority === "high").length,
      medium_priority: relevanceResults.filter((r) => r.priority === "medium").length,
      low_priority: relevanceResults.filter((r) => r.priority === "low").length,
    });

    // === STAGE 6: Relevant Page Selection ===
    await updateStage(supabase, documentId, "relevant_page_selection", "running", 55);
    const highPriorityPages = relevanceResults.filter((r) => r.priority === "high").map((r) => r.page_number);

    // Include neighboring pages for tables that may span pages
    const selectedPages = new Set<number>(highPriorityPages);
    for (const p of highPriorityPages) {
      selectedPages.add(p - 1);
      selectedPages.add(p + 1);
    }

    const pagesForLlm = Array.from(selectedPages).filter((p) => p >= 1 && p <= pageCount);
    const lowPriorityFallback = relevanceResults.filter((r) => r.priority === "low").map((r) => r.page_number);

    // Mark pages as sent to LLM
    for (const p of pagesForLlm) {
      await supabase.from("page_relevance").update({ sent_to_llm: true })
        .eq("document_id", documentId).eq("page_number", p);
    }

    await updateStage(supabase, documentId, "relevant_page_selection", "completed", 100, {
      selected_for_llm: pagesForLlm.length,
      fallback_available: lowPriorityFallback.length,
    });

    // === STAGE 7: LLM/VLM Extraction ===
    await updateStage(supabase, documentId, "llm_extraction", "running", 65);

    // Deterministic extraction remains a safe baseline. When configured, the VLM receives
    // only selected pages and may add evidence only when it quotes source text on that page.
    const selectedPageData = relevanceResults.filter((r) => pagesForLlm.includes(r.page_number));
    const extraction = extractFields(selectedPageData, detectedLanguage);
    const vlmEvidence = await runVlmExtractor(selectedPageData);
    extraction.evidence.push(...validateVlmEvidence(vlmEvidence, selectedPageData));

    // Store evidence for each extracted field
    for (const evidence of extraction.evidence) {
      await supabase.from("extraction_evidence").insert({
        document_id: documentId,
        field_path: evidence.field_path,
        field_value: evidence.field_value,
        page_number: evidence.page_number,
        source_text: evidence.source_text,
        confidence: evidence.confidence,
        extraction_method: evidence.extraction_method,
      });
    }

    await updateStage(supabase, documentId, "llm_extraction", "completed", 100, {
      fields_extracted: extraction.evidence.length,
      pages_used: pagesForLlm.length,
    });

    // === STAGE 8: Validation ===
    await updateStage(supabase, documentId, "validation", "running", 75);

    const missingFields = REQUIRED_FIELDS.filter(
      (f) => !extraction.evidence.some((e) => e.field_path === f && e.field_value)
    );

    // Missing information fallback: search remaining pages for missing fields
    if (missingFields.length > 0 && lowPriorityFallback.length > 0) {
      const fallbackPages = relevanceResults.filter((r) => lowPriorityFallback.includes(r.page_number));
      const fallbackEvidence = searchFallbackPages(fallbackPages, missingFields, detectedLanguage);

      for (const evidence of fallbackEvidence) {
        await supabase.from("extraction_evidence").insert({
          document_id: documentId,
          field_path: evidence.field_path,
          field_value: evidence.field_value,
          page_number: evidence.page_number,
          source_text: evidence.source_text,
          confidence: evidence.confidence,
          extraction_method: evidence.extraction_method + "_fallback",
        });
        extraction.evidence.push(evidence);
      }
    }

    // Detect conflicts
    const conflicts = detectConflicts(extraction.evidence);
    for (const conflict of conflicts) {
      await supabase.from("field_conflicts").insert({
        document_id: documentId,
        field_path: conflict.field_path,
        conflict_values: conflict.values,
      });
    }

    const recheckMissing = REQUIRED_FIELDS.filter(
      (f) => !extraction.evidence.some((e) => e.field_path === f && e.field_value)
    );

    await updateStage(supabase, documentId, "validation", "completed", 100, {
      missing_fields: recheckMissing,
      conflicts_found: conflicts.length,
      fallback_searched: missingFields.length > 0,
    });

    // === STAGE 9: Confidence Scoring ===
    await updateStage(supabase, documentId, "confidence_scoring", "running", 85);

    const fieldConfidences = extraction.evidence.map((e) => e.confidence);
    const avgFieldConfidence = fieldConfidences.length > 0
      ? fieldConfidences.reduce((s, c) => s + c, 0) / fieldConfidences.length
      : 0;

    const overallConfidence = Math.round(
      (avgOcrConfidence * 0.3 + avgFieldConfidence * 0.4 + (conflicts.length === 0 ? 1 : 0.7) * 0.3) * 100
    );

    const requiresManualReview = overallConfidence < 80 || conflicts.length > 0 || recheckMissing.length > 0;

    await updateStage(supabase, documentId, "confidence_scoring", "completed", 100, {
      overall_confidence: overallConfidence,
      requires_manual_review: requiresManualReview,
    });

    // === STAGE 10: Final JSON ===
    await updateStage(supabase, documentId, "final_json", "running", 90);

    const finalJson = buildFinalJson(
      pageCount,
      documentType,
      detectedLanguage,
      metadata,
      extraction.evidence,
      overallConfidence,
      requiresManualReview,
      recheckMissing,
      conflicts
    );

    // Update document with extraction results
    const ocrText = ocrResults.map((p) => `[Page ${p.page_number}]\n${p.text}`).join("\n\n");
    const finalStatus = requiresManualReview ? "review_required" : "extracted";

    await supabase.from("documents").update({
      status: finalStatus,
      processing_progress: 100,
      detected_language: detectedLanguage,
      detected_type: documentType,
      ocr_text: ocrText.slice(0, 5000),
      ocr_confidence: Math.round(avgOcrConfidence * 100),
      overall_confidence: overallConfidence,
      extraction_json: finalJson,
    }).eq("id", documentId);

    // Store extracted fields in extracted_fields table
    const fieldMap: Record<string, string> = {
      "owner.current_owner": "owner_name",
      "owner.father_name": "father_husband_name",
      "land.survey_number": "survey_number",
      "land.khasra_number": "khasra_number",
      "land.khata_number": "khata_number",
      "land.plot_number": "plot_number",
      "land.area": "area",
      "location.village": "village",
    };

    for (const evidence of extraction.evidence) {
      const fieldName = fieldMap[evidence.field_path];
      if (fieldName && evidence.field_value) {
        await supabase.from("extracted_fields").upsert({
          document_id: documentId,
          field_name: fieldName,
          field_value: evidence.field_value,
          confidence: Math.round(evidence.confidence * 100),
          source_page: evidence.page_number,
          bbox: null,
          extraction_method: evidence.extraction_method,
          model_version: "pipeline-v1",
        }, { onConflict: "document_id,field_name" });
      }
    }

    // Create or update land record
    const ownerName = getFieldValue(extraction.evidence, "owner.current_owner");
    const surveyNumber = getFieldValue(extraction.evidence, "land.survey_number");
    const area = parseFloat(getFieldValue(extraction.evidence, "land.area") || "0") || null;
    const areaUnit = detectAreaUnit(getFieldValue(extraction.evidence, "land.area") || "");

    const { data: existingRecord } = await supabase
      .from("land_records")
      .select("id")
      .eq("document_id", documentId)
      .maybeSingle();

    const recordData = {
      document_id: documentId,
      survey_number: surveyNumber,
      owner_name: ownerName,
      father_husband_name: getFieldValue(extraction.evidence, "owner.father_name"),
      khasra_number: getFieldValue(extraction.evidence, "land.khasra_number"),
      khata_number: getFieldValue(extraction.evidence, "land.khata_number"),
      plot_number: getFieldValue(extraction.evidence, "land.plot_number"),
      area: area,
      area_unit: areaUnit,
      village: getFieldValue(extraction.evidence, "location.village") || metadata?.village,
      tehsil: getFieldValue(extraction.evidence, "location.tehsil") || metadata?.tehsil,
      district: getFieldValue(extraction.evidence, "location.district") || metadata?.district,
      state: getFieldValue(extraction.evidence, "location.state") || metadata?.state,
      mutation_number: getFieldValue(extraction.evidence, "registration.mutation_number"),
      registration_number: getFieldValue(extraction.evidence, "registration.registration_number"),
      verification_status: requiresManualReview ? "review_required" : "auto_validated",
      confidence_score: overallConfidence,
      record_year: metadata?.record_year || null,
    };

    let recordId: string | null = null;
    if (existingRecord) {
      await supabase.from("land_records").update(recordData).eq("id", existingRecord.id);
      recordId = existingRecord.id;
    } else {
      const { data: newRecord } = await supabase.from("land_records").insert(recordData).select().single();
      recordId = newRecord?.id || null;
    }

    // Store validation results
    if (recordId) {
      const validations: { rule: string; status: "pass" | "fail" | "warn"; severity?: string; message: string; field_name?: string }[] = [];

      if (recheckMissing.length === 0) {
        validations.push({ rule: "REQUIRED_FIELDS", status: "pass", message: "All required fields present" });
      } else {
        validations.push({
          rule: "REQUIRED_FIELDS",
          status: "fail",
          severity: "high",
          message: `Missing fields: ${recheckMissing.join(", ")}`,
        });
      }

      if (conflicts.length > 0) {
        validations.push({
          rule: "FIELD_CONFLICTS",
          status: "warn",
          severity: "high",
          message: `${conflicts.length} field conflict(s) detected`,
        });
      }

      if (overallConfidence < 80) {
        validations.push({
          rule: "LOW_CONFIDENCE",
          status: "warn",
          severity: "medium",
          message: `Overall confidence ${overallConfidence}% below 80% threshold`,
        });
      }

      for (const val of validations) {
        await supabase.from("validation_results").insert({
          document_id: documentId,
          land_record_id: recordId,
          rule: val.rule,
          status: val.status,
          severity: val.severity || null,
          message: val.message,
          field_name: val.field_name || null,
        });
      }

      // Create verification task if review needed
      if (requiresManualReview) {
        await supabase.from("verification_tasks").insert({
          document_id: documentId,
          land_record_id: recordId,
          priority: overallConfidence < 70 ? "high" : "medium",
          status: "pending",
          comments: `Confidence ${overallConfidence}%${conflicts.length > 0 ? `, ${conflicts.length} conflict(s)` : ""}${recheckMissing.length > 0 ? `, missing: ${recheckMissing.join(", ")}` : ""}`,
        });
      }
    }

    await updateStage(supabase, documentId, "final_json", "completed", 100, {
      status: finalStatus,
      record_id: recordId,
    });

    // Final document update
    await supabase.from("documents").update({
      status: finalStatus,
      processing_progress: 100,
    }).eq("id", documentId);

    // Audit log
    await supabase.from("audit_logs").insert({
      action: "pipeline_completed",
      entity_type: "document",
      entity_id: documentId,
      details: {
        confidence: overallConfidence,
        pages_processed: ocrResults.length,
        pages_sent_to_llm: pagesForLlm.length,
        fields_extracted: extraction.evidence.length,
        conflicts: conflicts.length,
        missing_fields: recheckMissing,
        requires_review: requiresManualReview,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      document_id: documentId,
      overall_confidence: overallConfidence,
      requires_manual_review: requiresManualReview,
      missing_fields: recheckMissing,
      conflicts: conflicts.length,
      fields_extracted: extraction.evidence.length,
      pages_sent_to_llm: pagesForLlm.length,
      final_status: finalStatus,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // Never log OCR text or a signed URL. The short error is safe operational metadata.
    console.error("Pipeline error:", error instanceof Error ? error.message : "Unknown error");
    if (pipelineDocumentId) {
      await supabase.from("documents").update({ status: "error", processing_progress: 100 }).eq("id", pipelineDocumentId);
      await supabase.from("audit_logs").insert({
        action: "pipeline_failed", entity_type: "document", entity_id: pipelineDocumentId,
        details: { error: error instanceof Error ? error.message.slice(0, 300) : "Unknown error" },
      });
    }
    return new Response(JSON.stringify({
      error: "Pipeline processing failed",
      message: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============ HELPER FUNCTIONS ============

async function initPipelineStages(supabase: ReturnType<typeof createClient>, documentId: string) {
  for (const stage of PIPELINE_STAGES) {
    await supabase.from("pipeline_stages").upsert({
      document_id: documentId,
      stage_name: stage.name,
      stage_order: stage.order,
      status: "pending",
      progress: 0,
    }, { onConflict: "document_id,stage_name" });
  }
}

async function updateStage(
  supabase: ReturnType<typeof createClient>,
  documentId: string,
  stageName: string,
  status: "pending" | "running" | "completed" | "failed" | "skipped",
  progress: number,
  resultSummary?: Record<string, unknown>
) {
  const now = new Date().toISOString();
  const update: Record<string, unknown> = { status, progress };
  if (status === "running") update.started_at = now;
  if (status === "completed") update.completed_at = now;
  if (resultSummary) update.result_summary = resultSummary;

  await supabase.from("pipeline_stages").update(update)
    .eq("document_id", documentId).eq("stage_name", stageName);

  // Update document progress
  const overallProgress = Math.round((PIPELINE_STAGES.find((s) => s.name === stageName)!.order / PIPELINE_STAGES.length) * 100);
  await supabase.from("documents").update({ processing_progress: overallProgress }).eq("id", documentId);
}

function detectLanguage(text: string): string {
  const hindiChars = /[\u0900-\u097F]/;
  return hindiChars.test(text) ? "hi" : "en";
}

function clampConfidence(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

async function runPaddleOcrProcessor(signedPdfUrl: string, documentId: string): Promise<OcrProcessorResponse> {
  const endpoint = Deno.env.get("PADDLEOCR_SERVICE_URL");
  if (!endpoint) throw new Error("OCR service is not configured (PADDLEOCR_SERVICE_URL)");
  const token = Deno.env.get("PADDLEOCR_SERVICE_TOKEN");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ document_id: documentId, pdf_url: signedPdfUrl, max_pages: 1000, render_dpi: 300, include_layout: true, include_tables: true }),
  });
  if (!response.ok) throw new Error(`OCR service failed (${response.status})`);
  const result = await response.json() as OcrProcessorResponse;
  if (!Array.isArray(result.pages)) throw new Error("OCR service returned an invalid page payload");
  return result;
}

async function runVlmExtractor(pages: { page_number: number; text: string; tables?: unknown[]; headings?: string[] }[]): Promise<EvidenceEntry[]> {
  const endpoint = Deno.env.get("VLM_EXTRACTOR_URL");
  if (!endpoint || pages.length === 0) return [];
  const token = Deno.env.get("VLM_EXTRACTOR_TOKEN");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({
      model: Deno.env.get("VLM_MODEL") || "Qwen3-VL",
      instructions: "Extract only explicit values. Return JSON evidence. Each item must include field_path, field_value, page_number, source_text, confidence. Use null/omit unavailable fields; never infer or correct OCR silently.",
      pages: pages.map(({ page_number, text, tables, headings }) => ({ page_number, text, tables: tables || [], headings: headings || [] })),
    }),
  });
  if (!response.ok) return [];
  const result = await response.json() as { evidence?: EvidenceEntry[] };
  return Array.isArray(result.evidence) ? result.evidence : [];
}

function validateVlmEvidence(candidate: EvidenceEntry[], pages: { page_number: number; text: string }[]): EvidenceEntry[] {
  const byPage = new Map(pages.map((page) => [page.page_number, page.text.replace(/\s+/g, " ")]));
  return candidate.filter((item) => {
    const text = byPage.get(item.page_number);
    return typeof item.field_path === "string" && typeof item.field_value === "string" &&
      typeof item.source_text === "string" && text?.includes(item.source_text.replace(/\s+/g, " ")) &&
      clampConfidence(item.confidence) > 0;
  }).map((item) => ({ ...item, confidence: clampConfidence(item.confidence), extraction_method: "vlm_evidence_verified" }));
}

function extractTextBlocks(text: string, confidence: number) {
  const lines = text.split("\n").filter((l) => l.trim());
  return lines.map((line, i) => ({
    text: line,
    bbox: [0, i * 20, 500, (i + 1) * 20],
    confidence,
    type: line.length < 30 ? "key_value" : "text",
  }));
}

function extractHeadings(text: string): string[] {
  const lines = text.split("\n");
  return lines.filter((l) => {
    const trimmed = l.trim();
    return trimmed.length > 0 && trimmed.length < 50 && trimmed === trimmed.toUpperCase();
  });
}

function parsePageStructure(text: string, headings?: string[]) {
  const elements: { type: string; text: string }[] = [];
  const lines = text.split("\n").filter((l) => l.trim());
  const headingSet = new Set(headings || []);

  for (const line of lines) {
    if (headingSet.has(line.trim())) {
      elements.push({ type: "heading", text: line.trim() });
    } else if (line.includes(":") || line.includes(":-")) {
      elements.push({ type: "key_value", text: line.trim() });
    } else {
      elements.push({ type: "text", text: line.trim() });
    }
  }
  return elements;
}

function scorePageRelevance(text: string, language: string) {
  const lowerText = text.toLowerCase();
  let score = 0;
  const reasons: string[] = [];
  const matchedKeywords: string[] = [];

  for (const [fieldPath, langKeywords] of Object.entries(FIELD_KEYWORDS)) {
    const keywords = [...(langKeywords[language] || []), ...(langKeywords.en || [])];
    for (const kw of keywords) {
      if (lowerText.includes(kw.toLowerCase())) {
        score += 0.12;
        matchedKeywords.push(kw);
        const fieldLabel = fieldPath.split(".")[1].replace(/_/g, " ");
        if (!reasons.includes(`Contains ${fieldLabel}`)) {
          reasons.push(`Contains ${fieldLabel}`);
        }
      }
    }
  }

  // Cap score at 1.0
  score = Math.min(score, 1.0);
  return { score, reasons, matchedKeywords };
}

interface EvidenceEntry {
  field_path: string;
  field_value: string;
  page_number: number;
  source_text: string;
  confidence: number;
  extraction_method: string;
}

function extractFields(pages: { page_number: number; text: string; language: string }[], _detectedLanguage: string): { evidence: EvidenceEntry[] } {
  const evidence: EvidenceEntry[] = [];

  for (const page of pages) {
    const text = page.text;

    // Survey number: patterns like "Survey No 123/4" or "सर्वे नंबर 123/4"
    const surveyMatch = text.match(/(?:survey\s*(?:no|number)?\.?\s*)(\d+\/\d+|\d+)/i) ||
      text.match(/सर्वे\s*(?:नंबर|नं|संख्या)\s*(\d+\/\d+|\d+)/);
    if (surveyMatch) {
      evidence.push({
        field_path: "land.survey_number",
        field_value: surveyMatch[1],
        page_number: page.page_number,
        source_text: surveyMatch[0],
        confidence: 0.92,
        extraction_method: "regex_pattern",
      });
    }

    // Khasra number
    const khasraMatch = text.match(/(?:khasra\s*(?:no|number)?\.?\s*)(\d+\/?\d*)/i) ||
      text.match(/खसरा\s*(?:नंबर|नं|संख्या)?\s*(\d+\/?\d*)/);
    if (khasraMatch) {
      evidence.push({
        field_path: "land.khasra_number",
        field_value: khasraMatch[1],
        page_number: page.page_number,
        source_text: khasraMatch[0],
        confidence: 0.90,
        extraction_method: "regex_pattern",
      });
    }

    // Khata number
    const khataMatch = text.match(/(?:khata\s*(?:no|number)?\.?\s*)(\d+)/i) ||
      text.match(/खता\s*(?:नंबर|नं|संख्या)?\s*(\d+)/);
    if (khataMatch) {
      evidence.push({
        field_path: "land.khata_number",
        field_value: khataMatch[1],
        page_number: page.page_number,
        source_text: khataMatch[0],
        confidence: 0.88,
        extraction_method: "regex_pattern",
      });
    }

    // Area: patterns like "Area 2.47 hectare" or "क्षेत्रफल 2.47 हेक्टेयर"
    const areaMatch = text.match(/(?:area|क्षेत्रफल|क्षेत्र)\s*:?\s*(\d+\.?\d*)\s*(hectare|acre|हेक्टेयर|एकड़|वर्ग\s*मीटर)?/i);
    if (areaMatch) {
      evidence.push({
        field_path: "land.area",
        field_value: areaMatch[1],
        page_number: page.page_number,
        source_text: areaMatch[0],
        confidence: 0.87,
        extraction_method: "regex_pattern",
      });
    }

    // Owner name: look for "Owner:" or "मालिक" followed by a name
    const ownerMatch = text.match(/(?:owner|मालिक|स्वामी|खातेदार)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/) ||
      text.match(/(?:नाम)\s*:?\s*([\u0900-\u097F]+(?:\s+[\u0900-\u097F]+)*)/);
    if (ownerMatch) {
      evidence.push({
        field_path: "owner.current_owner",
        field_value: ownerMatch[1],
        page_number: page.page_number,
        source_text: ownerMatch[0],
        confidence: 0.85,
        extraction_method: "ner_model",
      });
    }

    // Father's name
    const fatherMatch = text.match(/(?:father|s\/o|पिता|पुत्र)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/) ||
      text.match(/पिता\s*:?\s*([\u0900-\u097F]+(?:\s+[\u0900-\u097F]+)*)/);
    if (fatherMatch) {
      evidence.push({
        field_path: "owner.father_name",
        field_value: fatherMatch[1],
        page_number: page.page_number,
        source_text: fatherMatch[0],
        confidence: 0.82,
        extraction_method: "ner_model",
      });
    }

    // Village
    const villageMatch = text.match(/(?:village|गाँव|गांव|ग्राम|मौजा)\s*:?\s*([A-Z][a-z]+|[\u0900-\u097F]+)/i);
    if (villageMatch) {
      evidence.push({
        field_path: "location.village",
        field_value: villageMatch[1],
        page_number: page.page_number,
        source_text: villageMatch[0],
        confidence: 0.89,
        extraction_method: "keyword_match",
      });
    }

    // Mutation number
    const mutationMatch = text.match(/(?:mutation|दाखिल|अंतरण)\s*(?:no|number|नंबर|संख्या)?\s*:?\s*(\d+)/i);
    if (mutationMatch) {
      evidence.push({
        field_path: "registration.mutation_number",
        field_value: mutationMatch[1],
        page_number: page.page_number,
        source_text: mutationMatch[0],
        confidence: 0.86,
        extraction_method: "regex_pattern",
      });
    }

    // Registration number
    const regMatch = text.match(/(?:registration|पंजीकरण)\s*(?:no|number|संख्या)?\s*:?\s*(\d+)/i);
    if (regMatch) {
      evidence.push({
        field_path: "registration.registration_number",
        field_value: regMatch[1],
        page_number: page.page_number,
        source_text: regMatch[0],
        confidence: 0.84,
        extraction_method: "regex_pattern",
      });
    }
  }

  return { evidence };
}

function searchFallbackPages(
  pages: { page_number: number; text: string; language: string }[],
  missingFields: string[],
  detectedLanguage: string
): EvidenceEntry[] {
  const evidence: EvidenceEntry[] = [];
  const fieldKeywords: Record<string, string[]> = {
    "owner.current_owner": ["owner", "मालिक", "स्वामी"],
    "land.survey_number": ["survey", "सर्वे"],
    "land.area": ["area", "hectare", "क्षेत्रफल", "हेक्टेयर", "एकड़"],
    "location.village": ["village", "गाँव", "ग्राम"],
  };

  for (const page of pages) {
    const lowerText = page.text.toLowerCase();
    for (const field of missingFields) {
      const keywords = fieldKeywords[field] || [];
      if (keywords.some((kw) => lowerText.includes(kw.toLowerCase()))) {
        const extracted = extractFields([page], detectedLanguage);
        const relevant = extracted.evidence.filter((e) => e.field_path === field);
        evidence.push(...relevant);
      }
    }
  }

  return evidence;
}

function detectConflicts(evidence: EvidenceEntry[]) {
  const fieldGroups: Record<string, EvidenceEntry[]> = {};
  for (const e of evidence) {
    if (!fieldGroups[e.field_path]) fieldGroups[e.field_path] = [];
    fieldGroups[e.field_path].push(e);
  }

  const conflicts: { field_path: string; values: { value: string; page: number }[] }[] = [];
  for (const [fieldPath, entries] of Object.entries(fieldGroups)) {
    const uniqueValues = new Map<string, number>();
    for (const e of entries) {
      if (e.field_value && !uniqueValues.has(e.field_value)) {
        uniqueValues.set(e.field_value, e.page_number);
      }
    }
    if (uniqueValues.size > 1) {
      conflicts.push({
        field_path: fieldPath,
        values: Array.from(uniqueValues.entries()).map(([value, page]) => ({ value, page })),
      });
    }
  }

  return conflicts;
}

function getFieldValue(evidence: EvidenceEntry[], fieldPath: string): string | null {
  const entry = evidence.find((e) => e.field_path === fieldPath && e.field_value);
  return entry?.field_value || null;
}

function detectAreaUnit(areaText: string): string | null {
  const lower = areaText.toLowerCase();
  if (lower.includes("hectare") || lower.includes("हेक्टेयर")) return "hectare";
  if (lower.includes("acre") || lower.includes("एकड़")) return "acre";
  if (lower.includes("sq m") || lower.includes("वर्ग मीटर")) return "sq_m";
  return null;
}

function buildFinalJson(
  totalPages: number,
  documentType: string | null,
  language: string | null,
  metadata: { state?: string; district?: string; tehsil?: string; village?: string; record_year?: number } | undefined,
  evidence: EvidenceEntry[],
  overallConfidence: number,
  requiresReview: boolean,
  missingFields: string[],
  conflicts: { field_path: string; values: { value: string; page: number }[] }[]
) {
  return {
    document: {
      total_pages: totalPages,
      document_type: documentType,
      state: getFieldValue(evidence, "location.state") || metadata?.state || null,
      district: getFieldValue(evidence, "location.district") || metadata?.district || null,
      language: language,
    },
    owner: {
      current_owner: getFieldValue(evidence, "owner.current_owner"),
      father_name: getFieldValue(evidence, "owner.father_name"),
      mother_name: getFieldValue(evidence, "owner.mother_name"),
      spouse_name: getFieldValue(evidence, "owner.spouse_name"),
      co_owners: [],
    },
    land: {
      survey_number: getFieldValue(evidence, "land.survey_number"),
      khasra_number: getFieldValue(evidence, "land.khasra_number"),
      khata_number: getFieldValue(evidence, "land.khata_number"),
      khatauni_number: getFieldValue(evidence, "land.khatauni_number"),
      plot_number: getFieldValue(evidence, "land.plot_number"),
      area: getFieldValue(evidence, "land.area"),
      area_unit: detectAreaUnit(getFieldValue(evidence, "land.area") || ""),
      land_type: getFieldValue(evidence, "land.land_type"),
    },
    location: {
      village: getFieldValue(evidence, "location.village") || metadata?.village || null,
      tehsil: getFieldValue(evidence, "location.tehsil") || metadata?.tehsil || null,
      taluka: getFieldValue(evidence, "location.taluka"),
      district: getFieldValue(evidence, "location.district") || metadata?.district || null,
      state: getFieldValue(evidence, "location.state") || metadata?.state || null,
    },
    registration: {
      registration_number: getFieldValue(evidence, "registration.registration_number"),
      registration_date: getFieldValue(evidence, "registration.registration_date"),
      mutation_number: getFieldValue(evidence, "registration.mutation_number"),
      mutation_date: getFieldValue(evidence, "registration.mutation_date"),
    },
    ownership: {
      ownership_type: getFieldValue(evidence, "ownership.ownership_type"),
      share_percentage: getFieldValue(evidence, "ownership.share_percentage"),
      previous_owners: [],
    },
    verification: {
      overall_confidence: overallConfidence,
      requires_manual_review: requiresReview,
      missing_fields: missingFields,
      conflicting_fields: conflicts.map((c) => c.field_path),
    },
    evidence: evidence.map((e) => ({
      field: e.field_path,
      value: e.field_value,
      page: e.page_number,
      source_text: e.source_text,
      confidence: e.confidence,
    })),
  };
}
