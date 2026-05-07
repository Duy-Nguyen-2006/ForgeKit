# Session Context Load

Khi session bắt đầu, nếu `sessionStart.enabled = true`:

1. Chạy `rtk git status --short` nếu RTK installed, nếu không dùng `git status --short`.
2. Đọc `.forge_history` nếu tồn tại, lấy tối đa 5 todos gần nhất.
3. Xác định repo name và branch hiện tại.
4. Tóm tắt thành một dòng:

```text
📂 <repo-name> · branch:<x> · <n> file dirty · last task: <summary>
```

Nếu không có `.forge_history`, dùng `last task: none`.

Không hỏi user và không chặn workflow chính.
