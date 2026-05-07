# Privacy Hook

Trigger: `before-output`

Mục tiêu: che thông tin nhạy cảm trước khi agent gửi final report hoặc error output.

## Cách hoạt động

- Đọc patterns từ `hooks/privacy/patterns.json`
- Chạy local, không gọi API ngoài
- Thay chuỗi match bằng `[REDACTED]`
- Áp dụng cho final report và error output

## Không dùng cho

- Không sửa nội dung file code
- Không rewrite git diff
- Không gửi dữ liệu ra ngoài
