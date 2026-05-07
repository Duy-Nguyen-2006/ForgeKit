---
name: ck:context-engineering
description: >
  Load khi task yêu cầu hiểu codebase chưa quen, repo lớn,
  cross-file refactor, hoặc tìm symbol/usage. Không load cho
  task 1-file rõ ràng.
---

# Context Engineering

## Khi nào load skill này

- Repo chưa quen (lần đầu làm việc)
- Task cần tìm function/symbol ở đâu đó không rõ
- Cross-file refactor hoặc rename
- File > 200 lines và không rõ structure
- Orchestrator không route được do thiếu context

## Quy trình (ưu tiên từ trên xuống)

### Nếu Serena MCP có:

1. `mcp_serena__symbol_lookup` tên cần tìm
2. `mcp_serena__find_references` nếu cần cross-file
3. `mcp_serena__workspace_symbols` nếu cần map toàn bộ
4. Đọc chính xác file được trỏ đến — không đọc gì thêm

### Nếu không có Serena:

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
