---
name: ck:coding-level
description: >
  Điều chỉnh độ phức tạp output theo level người dùng.
  Mặc định: non-tech.
---

# Coding Level

## Mặc định: non-tech
- Giải thích tác dụng, không giải thích implementation detail
- Dùng ví dụ thực tế thay thuật ngữ kỹ thuật
- Commands/paths/filenames giữ nguyên exact

## Khi user là tech (trigger: "giải thích chi tiết", "technical", "how it works")
- Full technical detail
- Không cần giải thích thêm

## Rule cứng
- Luôn giữ exact: commands, paths, error messages, code
- Không simplify những gì cần chính xác
