import test from 'node:test';
import assert from 'node:assert/strict';

function validateOcrResponse(result) {
  assert.ok(Number.isInteger(result.page_count) && result.page_count > 0);
  assert.ok(Array.isArray(result.pages) && result.pages.length > 0);
  for (const page of result.pages) {
    assert.ok(Number.isInteger(page.page_number) && page.page_number >= 1);
    assert.equal(typeof page.text, 'string');
    assert.ok(typeof page.confidence === 'number' && page.confidence >= 0 && page.confidence <= 1);
    if (page.tables) for (const table of page.tables) assert.ok(Array.isArray(table.rows));
  }
}

function page(text, options = {}) {
  return { page_number: 1, text, confidence: 0.9, ...options };
}

const cases = [
  ['selectable-text record', { page_count: 1, pages: [page('Owner: Ramesh Kumar\nSurvey No: 123/4\nArea: 2.5 hectare')] }],
  ['scanned Hindi record', { page_count: 1, detected_language: 'hi', pages: [page('मालिक: राम सिंह\nखसरा नंबर 123/4\nक्षेत्रफल: 2.5 हेक्टेयर')] }],
  ['mixed-language record', { page_count: 1, pages: [page('Village: Rampur\nमालिक: राम सिंह\nSurvey No: 123/4')] }],
  ['large document', { page_count: 55, pages: Array.from({ length: 55 }, (_, index) => page(index === 0 ? 'Survey No: 123/4' : 'administrative notice', { page_number: index + 1 })) }],
  ['irrelevant pages retained', { page_count: 2, pages: [page('Owner: Ramesh Kumar'), page('general revenue department notice', { page_number: 2 })] }],
  ['table record', { page_count: 1, pages: [page('Khasra Area Owner', { tables: [{ rows: [['Khasra', 'Area', 'Owner'], ['123/4', '2.5', 'Ramesh']], confidence: 0.9 }] })] }],
  ['conflicting owners', { page_count: 2, pages: [page('Owner: Ahmed Khan'), page('Owner: Ahmed Ali Khan', { page_number: 2 })] }],
  ['poor scan', { page_count: 1, pages: [page('Survey No: 123/4', { confidence: 0.35 })] }],
  ['missing required fields', { page_count: 1, pages: [page('Village: Rampur')] }],
  ['multiple parcels', { page_count: 1, pages: [page('Khasra Area\n123/4 2.5\n123/5 1.2', { tables: [{ rows: [['Khasra', 'Area'], ['123/4', '2.5'], ['123/5', '1.2']] }] })] }],
];

for (const [name, fixture] of cases) test(`OCR contract: ${name}`, () => validateOcrResponse(fixture));

test('OCR contract rejects a malformed page', () => {
  assert.throws(() => validateOcrResponse({ page_count: 1, pages: [{ page_number: 0, text: null, confidence: 2 }] }));
});
