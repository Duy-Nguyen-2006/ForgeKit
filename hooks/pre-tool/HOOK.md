# Pre-Tool Budget Guard Hook

Trigger: `pre-tool-call`

Mục tiêu: ngăn agent đọc quá nhiều token trong một turn. Hard-cap mỗi tool call.

## Rule

Nếu tool call sắp đọc > N tokens (default: 8000), tự động:

1. **Downgrade**: chuyển sang GitNexus `query` / `context` nếu có
2. **Chunking**: chia file thành range nhỏ (read với offset+limit)
3. **Cảnh báo**: nếu vẫn cần đọc toàn bộ, hiện warning và yêu cầu confirm

## Thresholds

| Context | Max tokens/tool |
|---|---|
| Orient phase (đầu task) | 4000 |
| Implement phase | 8000 |
| Debug/deep-dive | 12000 |

## Integration

- Đọc `.forge.toml` `[compact]` section cho threshold
- Nếu `token_threshold` sắp đạt: cảnh báo + gợi ý compact
- Nếu `max_read_lines` sẽ exceed: tự động chunk

## Pattern source

- OpenHands microagents: `budget_guard` pattern
- Cline: token-aware file reading
- Roo Code: auto-chunking on large files
