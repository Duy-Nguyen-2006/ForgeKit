---
name: ck:watzup
description: >
  Báo cáo nhanh trạng thái project hiện tại. Trigger: "watzup", "status",
  "project status", "đang làm gì".
triggers: ["watzup", "status", "project status", "đang làm gì", "tiến độ", "what's up", "progress"]
non_triggers: ["fix", "implement", "create feature", "deploy"]
examples: ["watzup", "project status", "đang làm gì rồi"]
---

# Watzup

## Làm gì
1. `rtk git log -n 5` (hoặc native nếu không có RTK)
2. Đọc `docs/codebase-summary.md` nếu tồn tại
3. Đọc todos đang mở nếu có
4. Output: trạng thái hiện tại + việc còn lại — tối đa 10 dòng
