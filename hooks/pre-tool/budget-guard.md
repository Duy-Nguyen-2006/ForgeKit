# Budget Guard — Detailed Reference

Step-by-step budget guard logic cho pre-tool-call hook. Ngăn agent tiêu quá nhiều token trong một tool call duy nhất.

## 1. Tổng quan

Budget guard interceptor chạy **trước** mỗi tool call liên quan đến đọc dữ liệu (file read, search, LSP query). Nó ước lượng token count, so với ngưỡng, và quyết định downgrade / chunk / warn.

**Các tool bị intercept:**
- `read_file` / `Read` — đọc file nội dung
- `search_files` / `Grep` — tìm kiếm nội dung
- `list_directory` / `LS` — liệt kê thư mục lớn
- Bất kỳ tool nào trả về nội dung text dài

**Các tool KHÔNG bị intercept:**
- `write_file` / `Edit` — ghi file, không trả về nội dung đọc
- `bash` (side-effect only, không output lớn)
- `todo` / task management

## 2. Ước lượng token count

### 2.1 Công thức ước lượng

```
estimated_tokens = char_count / chars_per_token
```

| Ngôn ngữ nội dung | chars_per_token | Ghi chú |
|---|---|---|
| English code / comments | 4 | GPT tokenizer mặc định |
| Vietnamese text | 2 | UTF-8 multi-byte, tokenizer tách từng âm tiết |
| Mixed (code + Vi comments) | 3 | Trung bình |
| JSON / data | 3.5 | Nhiều dấu ngoặc, key lặp |

### 2.2 Ước lượng trước khi gọi tool

**Cho `read_file`:**
- Nếu biết file size (stat): `tokens = file_size / chars_per_token`
- Nếu biết line count: `tokens = lines × avg_line_length / chars_per_token`
- Default assumption: `avg_line_length = 60` chars

**Cho `search_files`:**
- Ước lượng dựa trên pattern specificity và scope
- Narrow pattern + small scope: 500-1000 tokens
- Broad pattern + large scope: 2000-5000 tokens
- Default: assume 1500 tokens nếu không chắc

**Cho `list_directory`:**
- Mỗi entry ≈ 30-50 tokens (path + metadata)
- `tokens = entry_count × 40`

### 2.3 Ví dụ tính toán

```
# File 500 dòng, code English
estimated_tokens = 500 × 60 / 4 = 7,500 tokens
→ Under implement limit (8000), cho phép

# File 1200 dòng, mixed Vi + code
estimated_tokens = 1200 × 60 / 3 = 24,000 tokens
→ Vượt orient (4000), implement (8000), debug (12000)
→ Phải downgrade hoặc chunk
```

## 3. Fallback chain — Khi budget exceeded

Khi `estimated_tokens > threshold`, chạy fallback chain theo thứ tự:

### Step 1: Downgrade sang GitNexus (nếu có)

Nếu GitNexus MCP server available:

```
Thay read_file → GitNexus context
Thay search_files → GitNexus query
```

**GitNexus `context`:**
- Chỉ trả về signature + location, không trả body
- ~50-200 tokens per symbol
- Phù hợp orient phase

**GitNexus `query`:**
- Trả về danh sách tất cả symbols trong file
- ~100-500 tokens per file
- Phù hợp khi cần hiểu cấu trúc file

**Khi nào dùng GitNexus:**
- ✅ Có MCP server GitNexus
- ✅ Chỉ cần hiểu cấu trúc / tìm symbol
- ✅ Không cần đọc implementation chi tiết
- ❌ Cần đọc exact code để edit
- ❌ Cần đọc comments / logic flow

### Step 2: Chunked read

Nếu GitNexus không available hoặc cần đọc actual code:

```
Thay read_file(path, full) → read_file(path, offset, limit)
```

**Chunking strategy:**

```python
chunk_size = threshold_tokens * chars_per_token / avg_line_length
# Ví dụ: 8000 × 4 / 60 ≈ 533 lines per chunk

chunks = [
    (offset=1,    limit=533),   # chunk 1
    (offset=534,  limit=533),   # chunk 2
    (offset=1067, limit=533),   # chunk 3
    # ...
]
```

**Smart chunking:**
1. Nếu file có symbol index (`.forge/cache/symbols.json`), chunk theo symbol boundaries
2. Ưu tiên chunk chứa symbol cần đọc (dựa trên search hit hoặc user request)
3. Skip chunks chỉ chứa imports / boilerplate

**Ví dụ:**
```
# Cần đọc function login() ở dòng 245-280
# File 1200 dòng, threshold = 8000 tokens

Chunk 1: offset=220, limit=100  ← chứa login() + context
# Đọc xong, hỏi: cần đọc thêm phần nào?
```

### Step 3: Warn user

Nếu bắt buộc phải đọc toàn bộ (user yêu cầu, hoặc đang debug cần full context):

```
⚠️ BUDGET WARNING: Tool call sắp đọc ~{N} tokens (limit: {threshold})
   File: {path} ({lines} dòng)

   Gợi ý:
   - Dùng GitNexus context nếu chỉ cần tìm symbol
   - Dùng chunked read để đọc từng phần
   - Confirm để đọc toàn bộ (sẽ tốn {N} tokens)

   [Y] Đọc toàn bộ  [S] GitNexus  [C] Chunked read
```

**Warn chỉ hiện khi:**
- `estimated_tokens > threshold × 1.5` (significant overshoot)
- Hoặc đang ở orient phase và `estimated_tokens > 4000`

## 4. Phase detection

Phase hiện tại được xác định bởi:

| Signal | Phase |
|---|---|
| Đầu session, chưa có task plan | Orient (4000) |
| Đã có plan, đang implement | Implement (8000) |
| Bug report, error trace, investigating | Debug (12000) |
| User set explicitly trong `.forge.toml` | Custom |

**Auto-detection heuristic:**

```
if "task" not in session and lines_read < 100:
    phase = "orient"
elif session.get("active_task") and not session.get("debug_mode"):
    phase = "implement"
elif session.get("debug_mode") or "error" in last_tool_output.lower():
    phase = "debug"
else:
    phase = "implement"  # default
```

## 5. Integration với .forge.toml

```toml
[compact]
# Token threshold cho budget guard
token_threshold_orient = 4000
token_threshold_implement = 8000
token_threshold_debug = 12000

# Max lines cho một read_file call (0 = unlimited)
max_read_lines = 500

# Có tự động chunk hay warn
auto_chunk = true

# Có dùng GitNexus downgrade
gitnexus_downgrade = true
```

**Nếu `.forge.toml` không có section `[compact]`, dùng default values.**

**Nếu `token_threshold` (tổng) sắp đạt:**

```
⚠️ CONTEXT BUDGET: Đã dùng ~{used}/{total} tokens
   Gợi ý: chạy /compact để tóm tắt context
   Hoặc: đóng bớt file không cần thiết
```

## 6. Example scenarios

### Scenario 1: Orient phase, đọc file lớn

```
Agent muốn: Read("src/api/handlers.ts") — 800 dòng
Estimated: 800 × 60 / 4 = 12,000 tokens
Threshold: 4,000 (orient)

→ ACTION: Downgrade
  - GitNexus query("src/api/handlers.ts")
  - Trả về: 15 symbols, ~300 tokens ✅
  - Agent thấy cần handler cụ thể → context("createUser")
  - Trả về: signature + location, ~100 tokens ✅
```

### Scenario 2: Implement phase, cần đọc implementation

```
Agent muốn: Read("src/auth/service.ts") — 450 dòng
Estimated: 450 × 60 / 4 = 6,750 tokens
Threshold: 8,000 (implement)

→ ACTION: Allow (under threshold)
  - Đọc toàn bộ file, 6,750 tokens ✅
```

### Scenario 3: Debug, cần đọc file rất lớn

```
Agent muốn: Read("src/generated/schema.ts") — 3000 dòng
Estimated: 3000 × 60 / 4 = 45,000 tokens
Threshold: 12,000 (debug)

→ ACTION: Chunked read
  - Check symbol index: schema.ts có UserSchema ở dòng 1200-1350
  - Agent cần debug UserSchema validation
  - Chunk: offset=1150, limit=250 ← chứa UserSchema + context
  - 250 × 60 / 4 = 3,750 tokens ✅
  - Hỏi agent: cần đọc thêm phần nào?
```

### Scenario 4: Vietnamese markdown file

```
Agent muốn: Read("docs/huong-dan.md") — 200 dòng tiếng Việt
Estimated: 200 × 80 / 2 = 8,000 tokens  (Vi text, dài hơn + chars_per_token thấp hơn)
Threshold: 8,000 (implement)

→ ACTION: Borderline, allow with info
  - Đọc toàn bộ, 8,000 tokens ✅
  - Hiện info: "Đọc 200 dòng Vi, ~8000 tokens"
```

## 7. Pattern source

### OpenHands microagents — `budget_guard`

OpenHands implement budget guard như một microagent interceptor:
- Chạy trước mỗi tool call
- Ước lượng token cost dựa trên tool type + params
- Nếu exceed budget: suggest alternative hoặc block
- Config per-conversation: `max_tokens_per_tool_call`

### Cline — Token-aware file reading

Cline (VS Code extension) tự động:
- Track token usage per conversation
- Hiện token count trên UI
- Khi sắp đạt limit, suggest compact
- File reading: auto-limit lines, suggest line ranges

### Roo Code — Auto-chunking on large files

Roo Code implement:
- Auto-detect file size trước khi read
- Nếu file > threshold: tự động chunk
- Hiện chunk info: "Reading lines 1-200 of 1500"
- User có thể navigate giữa các chunks
- Cache chunks đã đọc để tránh re-read
