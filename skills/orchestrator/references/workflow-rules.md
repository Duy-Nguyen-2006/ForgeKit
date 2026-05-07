# Workflow Rules

## Spec Gate (Phase A)
- 1 approval gate duy nhất toàn conversation
- Sau khi approved: không hỏi lại, không spec lại
- Nếu user nói "ok", "đúng", "làm đi", "approved", "go" → coi là approved
- Không implement trước khi có approval

## Execution (Phase B)
- Verify bằng build/test/lint/typecheck trước khi report
- Nếu verify fail: diagnose → fix → rerun — không báo success
- Liệt kê đầy đủ file đã thay đổi trong final report

## Token Rules
- ForgeCode native tools trước shell commands
- `rtk` prefix khi RTK installed
- Serena khi file > 200 lines hoặc cross-file task
- Max 1 primary skill lúc đầu, secondary chỉ khi cần cụ thể
- Không read toàn reference directory

## Non-tech UX
- Spec viết bằng tiếng Việt, ngắn gọn
- Không dùng jargon trong spec — dùng tiếng bình thường
- Final report: chỉ những gì user cần biết để verify
