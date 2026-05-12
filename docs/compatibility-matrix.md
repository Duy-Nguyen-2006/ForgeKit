# ForgeKit Compatibility Matrix

Bảng hỗ trợ các runtime khác nhau. ForgeCode là primary; Codex và Claude là compatibility layer.

## Runtime Support

| Feature | ForgeCode (native) | Codex | Claude |
|---|---|---|---|
| Command syntax | `:ck:auto` | `/ck:auto` | `/ck:auto` |
| Spec gate | ✅ Full | ✅ Full | ✅ Full |
| Orchestrator | ✅ Full | ✅ Full | ✅ Full |
| Skill loading | ✅ Native | ✅ Via export | ✅ Via export |
| Token efficiency | ✅ Full | ✅ Full | ✅ Full |
| Intent classifier | ✅ Full | ✅ Full | ✅ Full |
| Privacy hook | ✅ Runtime .cjs | ❌ Not supported | ❌ Not supported |
| Budget guard hook | ✅ Runtime .cjs | ❌ Not supported | ❌ Not supported |
| Session init hook | ✅ Runtime .cjs | ❌ Not supported | ❌ Not supported |
| Notifications hook | ✅ Runtime .cjs | ❌ Not supported | ❌ Not supported |
| GitNexus MCP | ✅ Recommended | ❌ Not available | ❌ Not available |
| RTK integration | ✅ Recommended | ❌ Not available | ❌ Not available |
| Repo map / Diff context | ✅ Full | ✅ Via skill | ✅ Via skill |
| Domain skills (6) | ✅ Full | ✅ Via skill | ✅ Via skill |
| Vietnamese output | ✅ Default | ✅ Default | ✅ Default |

## Export Format

| Runtime | Generator | Output Dir | Top-level Instruction |
|---|---|---|---|
| ForgeCode | `generate-forgecode.py` | `.forge/` | `AGENTS.md` |
| Codex | `generate-codex.py` | `.codex/` | `codex.json` + `AGENTS.md` |
| Claude | `generate-claude.py` | `.claude/` | `CLAUDE.md` |

## Feature Priority

1. **ForgeCode-native first**: every feature works in ForgeCode first.
2. **Codex/Claude**: compatibility exports provide core workflow (`:ck:auto` → spec → orchestrator → skills → verify → report).
3. **Hooks**: runtime hooks (`.cjs`) are ForgeCode-only. Codex/Claude don't support hook execution.
4. **MCP integrations** (GitNexus, RTK): require runtime support, available in ForgeCode only.

## Skill Availability

All 33 skills are available across all runtimes via skill loading. The difference is in execution context:

| Skill Category | Count | ForgeCode | Codex | Claude |
|---|---|---|---|---|
| Core | 4 | ✅ | ✅ | ✅ |
| Development | 5 | ✅ | ✅ | ✅ |
| Operations | 4 | ✅ | ✅ | ✅ |
| Quality | 4 | ✅ | ✅ | ✅ |
| Project | 10 | ✅ | ✅ | ✅ |
| Domain | 6 | ✅ | ✅ | ✅ |
| **Total** | **33** | — | — | — |

## Setup Methods

| Method | ForgeCode | Codex | Claude |
|---|---|---|---|
| `npx lgmmo-forgekit-installer` | ✅ `.forge/` | — | — |
| `npx lgmmo-codex-installer` | — | ✅ `.codex/` | — |
| `generate-forgecode.py` | ✅ | — | — |
| `generate-codex.py` | — | ✅ | — |
| `generate-claude.py` | — | — | ✅ |
| Direct clone | ✅ `~/ForgeKit` | — | — |

## Not Supported (By Design)

- `/ck:plan`, `/ck:cook`, `/ck:fix`, `/ck:test`, `/ck:review`, `/ck:watzup` — single entrypoint only
- Statusline/dashboard UI — not needed for non-tech UX
- Semantic-release — tag-driven release is simpler
- Media/binary assets in repo — violates repo cleanliness
- Plugin marketplace — out of scope
