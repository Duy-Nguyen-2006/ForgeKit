---
name: ck:document-processing
description: "Document parsing: PDF, DOCX, XLSX, PPTX"
auto_load: false
triggers:
  - pdf
  - docx
  - xlsx
  - pptx
  - parse document
  - extract text
  - generate report
  - document processing
non_triggers:
  - deploy only
  - auth only
  - ui only
examples:
  - "parse PDF và extract text"
  - "generate Excel report từ data"
  - "đọc DOCX template và fill data"
metadata:
  author: forgekit
  version: "1.0.0"
---

# Document Processing

Document processing patterns — PDF, DOCX, XLSX, PPTX. Hướng dẫn theo loại file, không bundle binary.

## Khi nào load

- User yêu cầu parse/generate PDF/DOCX/XLSX/PPTX
- Extract text/data từ document
- Generate report từ template
- Convert giữa formats

## Không dùng khi

- Chỉ cần lưu file (→ backend-development)
- Chỉ cần display PDF (→ frontend-development)

## PDF

### Parse (pdfjs-dist)
```bash
npm install pdfjs-dist
```
- Load document → iterate pages → extract text
- Table extraction: positional analysis
- Form fields: AcroForm parsing

### Generate (pdfkit / jsPDF)
- pdfkit: Node.js, stream-based, efficient
- jsPDF: Client-side, simple API
- Pattern: data → template → PDF buffer → response

## DOCX

### Parse (mammoth)
```bash
npm install mammoth
```
- DOCX → HTML hoặc plain text
- Limited formatting preservation

### Generate (docx)
```bash
npm install docx
```
- Programmatic document creation
- Tables, headers, footers, styling
- Template: define structure → fill data → export

## XLSX

### Parse & Generate (exceljs / xlsx)
```bash
npm install exceljs
```
- Read: workbook → worksheet → rows → data
- Write: data → worksheet → workbook → buffer
- Streaming: large files, row-by-row
- Charts: limited, consider export to image

## PPTX

### Generate (pptxgenjs)
```bash
npm install pptxgenjs
```
- Define slides programmatically
- Text, images, charts, shapes
- Master slides for templates

## Common Patterns

1. **Parse & Extract**: file → library parse → structured data
2. **Template Fill**: template + data → filled document
3. **Batch Convert**: multiple files → loop → output format
4. **Report Generation**: query data → format → document

## Error Handling

- File not found → check path, suggest alternative
- Corrupt file → try repair or skip
- Large file → streaming approach, chunk processing
- Missing dependency → suggest `npm install <package>`
