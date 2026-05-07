# ForgeKit Hooks

Hooks là phần mở rộng tùy chọn cho ForgeKit. Nếu không cần thông báo hoặc setup thêm, bạn có thể bỏ qua file này — `:ck:auto` vẫn chạy bình thường.

## Privacy

Privacy hook bật mặc định. Nó chạy local và che các chuỗi nhạy cảm trong final report hoặc error output, ví dụ token, password, IP, đường dẫn home.

Bạn không cần cấu hình gì thêm.

## Notifications

Notifications mặc định tắt.

Nếu muốn nhận thông báo Telegram/Discord/Slack:

1. Copy config mẫu:
   ```sh
   cp hooks/config.example.json hooks/config.json
   ```
2. Điền webhook hoặc biến môi trường cần dùng.
3. Restart ForgeCode nếu runtime yêu cầu.

Nếu không cần thông báo, bỏ qua phần này.

## Session start

Session-start hook bật mặc định. Khi mở session, nó hiển thị trạng thái repo ngắn gọn: tên repo, branch, số file đang thay đổi, task gần nhất nếu có.

Không cần cấu hình gì thêm.
