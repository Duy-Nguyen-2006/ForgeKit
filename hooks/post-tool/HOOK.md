# Post-Tool Hooks

## route-log

**Trigger:** after routing decision (post-orchestrator)
**Type:** Observability / passive logging
**Config:** `hooks/post-tool/route-log.cjs`

### Purpose

Captures routing decisions to a local JSONL log for debugging and continuous improvement. Never blocks or modifies routing — fail-open always.

### Log File

`.forgekit/route-log.jsonl` — one JSON object per line.

### Log Entry Format

```json
{
  "ts": "2025-01-15T10:30:00.000Z",
  "intentHash": "a1b2c3d4e5f6g7h8",
  "intentLength": 35,
  "primary": "fix",
  "secondary": ["ck-debug"],
  "confidence": 0.95,
  "action": "route",
  "gap": 0.25,
  "verb": "sửa",
  "sessionId": "session-xyz"
}
```

### Privacy

- Intent text is **never** stored — only a SHA-256 hash (first 16 chars) and length.
- No file paths, user data, or code content is logged.
- Log file is `.gitignore`-friendly (add `.forgekit/` to gitignore).

### Configuration

| Env Variable | Default | Description |
|---|---|---|
| `FORGEKIT_LOG_DIR` | `.forgekit` | Directory for log files |
| `FORGEKIT_ROUTE_LOG_MAX_SIZE` | `5242880` (5MB) | Max log size before rotation |
| `FORGEKIT_SESSION_ID` | — | Session identifier |

### Log Rotation

When log file exceeds `FORGEKIT_ROUTE_LOG_MAX_SIZE`, it is renamed to `route-log.backup.{timestamp}.jsonl` and a new log is started.
