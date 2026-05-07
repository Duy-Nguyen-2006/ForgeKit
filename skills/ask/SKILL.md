---
name: ck:ask
description: >
  Dùng khi request thiếu thông tin quan trọng và không thể assume an toàn.
  Không load cho task rõ ràng.
---

# Ask

Load khi: request mơ hồ, thiếu thông tin cốt lõi, không thể assume reasonable default.

Không load khi: task đủ rõ để spec.

## Quy tắc
- Tối đa 2 câu hỏi một lần
- Ưu tiên dạng multiple choice khi có thể
- Không hỏi những gì có thể assume an toàn
- Sau khi có trả lời: quay về Phase A của ck:auto để viết Spec
