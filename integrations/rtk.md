# RTK Integration

Status: recommended when installed.

Use RTK to reduce noisy shell output token cost.

Use for:

```bash
rtk git status
rtk diff
rtk pytest -q
rtk npm test
rtk npm run build
```

Rules:

- Native file/search/edit tools first.
- RTK only for shell/log/diff/test/build output.
- Do not use RTK for file edits.
- If RTK unavailable, fall back to normal ForgeCode shell.

Health check:

```bash
rtk gain
forge-rtk-shell -c 'git status'
```

## Setup cho ForgeCode

1. Cài RTK:
   ```sh
   curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/master/install.sh | sh
   ```
2. Init (chọn agent phù hợp — ForgeCode chưa có flag riêng, dùng fallback AGENTS.md):
   ```sh
   rtk init -g --codex   # dùng AGENTS.md injection mode
   ```
3. Kiểm tra: `rtk gain`

Nếu chưa cài RTK: agent dùng native tools bình thường, không break.
