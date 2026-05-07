---
name: ck:repomix
description: >
  Tạo codebase summary để dùng với watzup hoặc context-engineering.
  Chỉ chạy khi user yêu cầu rõ hoặc khi watzup không tìm thấy summary.
---

# Repomix

Trigger: "tóm tắt codebase", "repomix", "codebase summary", "map project"

## Làm gì
1. Chạy: `npx repomix --output docs/codebase-summary.md`
2. Nếu repomix chưa cài: `npm i -g repomix` trước
3. Không tự động chạy — chỉ khi được gọi rõ ràng

Token rule: không inject toàn bộ output vào context. Chỉ đọc section cần thiết.
