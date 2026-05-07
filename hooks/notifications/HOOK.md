# Notifications Hook

Trigger: `task-complete`, `task-failed`

Notifications mặc định tắt. Hook chỉ gửi thông báo khi user tự tạo `hooks/config.json` từ `hooks/config.example.json` và điền webhook/token.

## Config

Hook đọc `hooks/config.json`:

```json
{
  "telegram": { "bot_token": "${TELEGRAM_BOT_TOKEN}", "chat_id": "${TELEGRAM_CHAT_ID}" },
  "discord":  { "webhook_url": "${DISCORD_WEBHOOK_URL}" },
  "slack":    { "webhook_url": "${SLACK_WEBHOOK_URL}" }
}
```

Không commit `hooks/config.json`.

## Message format

Task hoàn tất:

```text
✅ ForgeKit task hoàn tất
Spec: <tên Spec>
File thay đổi: <số file>
Verification: PASS
```

Task lỗi:

```text
❌ ForgeKit task lỗi
Lý do: <error tóm tắt>
```
