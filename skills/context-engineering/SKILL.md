---
name: ck:context-engineering
description: "Cross-file symbol and reference analysis"
auto_load: false
triggers: ["codebase lớn", "symbol", "refactor cross-file", "tìm function", "unfamiliar repo", "cross-file"]
non_triggers: ["single file", "simple edit", "deploy", "create new project"]
examples: ["find where User model is defined", "tìm tất cả chỗ gọi function X", "cross-file rename refactor"]
---

# Context Engineering

## Khi nào load skill này

- Repo chưa quen (lần đầu làm việc)
- Task cần tìm function/symbol ở đâu đó không rõ
- Cross-file refactor hoặc rename
- File > 200 lines và không rõ structure
- Orchestrator không route được do thiếu context

## Quy trình (ưu tiên từ trên xuống)

### Nếu GitNexus MCP có:

1. `context` với symbol name hoặc UID để xem definition/callers/callees
2. `impact` hoặc `context` nếu cần cross-file references
3. `query` nếu cần map overview theo concept/process
4. native `fs_search` nếu cần regex search
5. Đọc chính xác file được trỏ đến — không đọc gì thêm

> **Ghi chú:** Tên tool không bao gồm prefix `mcp__gitnexus__` — runtime tự thêm khi gọi MCP server.

### Nếu không có GitNexus:

1. `fs_search` pattern ở entry points (index, main, app, config)
2. `read` tối đa 5 files để orient
3. Ưu tiên: entry points → config → file trực tiếp liên quan
4. Dừng khi đủ context để implement

## Giới hạn cứng

- Không read toàn repo
- Không read file > 300 lines nếu không cần toàn bộ (đọc range cụ thể)
- Tối đa 5 files để orient, sau đó implement
- Nếu vẫn thiếu context sau 5 files: hỏi user 1 câu cụ thể

## Token budget

- Orient phase: ≤ 3000 tokens
- Sau orient: route sang primary skill theo `registry.md`
