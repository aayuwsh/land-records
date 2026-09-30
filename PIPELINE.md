# Land Record Extraction Pipeline

The browser validates a PDF signature and 50 MB size limit, then uploads the original PDF to the private `land-records` bucket. It stores only the bucket path in `documents.file_url`; it never stores a public URL.

After registrar approval, `extraction-pipeline` authenticates the caller, reads document metadata from the database, creates a 15-minute signed URL, validates the stored PDF signature, and calls `PADDLEOCR_SERVICE_URL`. The processor must render scanned pages (300 DPI), run PaddleOCR/PaddleOCR-VL, and return:

```json
{"page_count":2,"detected_language":"hi","pages":[{"page_number":1,"text":"...","confidence":0.93,"detected_language":"hi","text_blocks":[{"text":"...","bbox":[0,0,1,1],"confidence":0.93,"type":"text"}],"tables":[{"rows":[["Khasra","Area"],["123/4","2.5"]],"bbox":[0,0,1,1],"confidence":0.9}],"headings":["LAND DETAILS"]}]}
```

The edge function indexes every OCR page, scores each page with multilingual configurable keywords, includes neighbours of high-score pages, then sends only those pages to `VLM_EXTRACTOR_URL` when configured. VLM evidence is accepted only if it quotes source text that actually occurs on its declared selected page. Regex extraction is retained as an evidence-based fallback. Missing required fields trigger a search of retained low-priority pages; conflicts are never automatically resolved.

## Deploy and run

```powershell
npm ci
npm run typecheck
npm run build
supabase db push
supabase secrets set APP_ORIGIN=https://your-app.example PADDLEOCR_SERVICE_URL=https://internal-ocr.example/process PADDLEOCR_SERVICE_TOKEN=... VLM_EXTRACTOR_URL=https://internal-vlm.example/extract VLM_EXTRACTOR_TOKEN=...
supabase functions deploy extraction-pipeline
npm run dev
```

`PADDLEOCR_SERVICE_URL` is required. Keep it on a private network or protect it with the token. Configure `APP_ORIGIN` to the deployed frontend origin. The VLM endpoint is optional; without it the pipeline emits only deterministic, evidence-backed extraction.

## Test matrix

Exercise these fixtures through the OCR service contract and assert the saved final JSON, evidence pages, relevance, and validation: selectable-text record; scanned Hindi record; mixed Hindi/English record; 50+ page record; irrelevant inserts; table continuation; conflicting owners; poor scan; missing required fields; multiple parcels. The expected behavior for missing/conflicting cases is `requires_manual_review: true`, not a guessed value.

## Limitations

The repository does not bundle PaddleOCR or Qwen3-VL. They need a separately deployed, GPU-capable service implementing the documented contract. Page images and table geometry are preserved when that service returns them. Retention/deletion is policy-specific and should be implemented as a privileged scheduled job; storage is private by default.
