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
