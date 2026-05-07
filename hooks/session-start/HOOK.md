# Session Start Hook

Trigger: `session-start`

Mục tiêu: hiển thị trạng thái project ngắn gọn khi bắt đầu session để user và agent biết đang ở đâu.

## Cách hoạt động

- Chạy một lần đầu mỗi session
- Ưu tiên RTK nếu có, fallback native git
- Không hỏi user
- Không thay đổi file

Chi tiết lệnh và format nằm ở `hooks/session-start/context-load.md`.
