# Telegram Notifications

## Cách lấy bot token

1. Mở Telegram, tìm `@BotFather`.
2. Gửi `/newbot` và làm theo hướng dẫn.
3. Copy bot token vào biến môi trường `TELEGRAM_BOT_TOKEN` hoặc `hooks/config.json`.

## Cách lấy chat_id

1. Nhắn một tin bất kỳ cho bot mới tạo.
2. Gọi Telegram getUpdates theo hướng dẫn của Telegram Bot API.
3. Copy `chat.id` vào `TELEGRAM_CHAT_ID` hoặc `hooks/config.json`.

Nếu không dùng Telegram, bỏ qua file này.
