---
title: Prompt Caching — Layout Strategy for Provider-Side Cache Hits
skill: ck:token-efficiency
version: "1.0.0"
source: cline, roo-code, openhands
---

# Prompt Caching — Bố cục prompt tối ưu cache phía provider

> **Core insight**: OpenAI và compatible providers cache **prefix** của prompt.
> Prefix không đổi → token được cache → giá giảm ~50%.
> **Nội dung ổn định lên đầu, nội dung thay đổi xuống cuối.**

---

## 1. Why Prompt Caching Matters / Tại sao cần quan tâm

OpenAI và các provider tương thích (cx/gpt-5.5, Azure OpenAI, etc.) áp dụng
prompt caching theo cơ chế:

- **Prefix-based caching**: Provider lưu prefix của prompt đã xử lý.
- Nếu request tiếp theo có **cùng prefix**, các token đó được lấy từ cache
  thay vì xử lý lại → **giảm ~50% giá** (cached input tokens).
- Prefix bị thay đổi ở **bất kỳ vị trí nào** → cache miss từ điểm thay đổi
  trở đi, kể cả phần sau chưa đổi.

**Hệ quả**: Thứ tự nội dung trong prompt ảnh hưởng trực tiếp đến tỷ lệ cache
hit. Đặt nội dung ổn định ở trên = cache hit cao hơn = tiết kiệm lớn.

---

## 2. Layout Strategy / Chiến lược bố cục 3 tầng

### Tier 1 — Top (most stable, highest cache hit)

Nội dung gần như **không thay đổi** giữa các turn:

| Content | Reason |
|---|---|
| `AGENTS.md` | Project rules, luôn giữ nguyên trong session |
| Selected `SKILL.md` | Đã chọn rồi, không đổi giữa turns |
| Skill reference files | Đã load rồi, cố định cho task hiện tại |
| System-level instructions | Framework rules, tool descriptions |

### Tier 2 — Middle (semi-stable)

Nội dung **thay đổi ít**, chỉ cập nhật khi có file mới hoặc task thay đổi:

| Content | Reason |
|---|---|
| Code context loaded for task | File đang làm việc, thay đổi khi chuyển file |
| Repository map / skeleton | Cập nhật khi codebase thay đổi đáng kể |
| File contents being edited | Đổi khi chuyển sang file khác |

### Tier 3 — Bottom (most volatile, lowest cache hit)

Nội dung **thay đổi mỗi turn**:

| Content | Reason |
|---|---|
| Todo list | Cập nhật sau mỗi bước |
| Git diff / recent changes | Grows/shrinks liên tục |
| Conversation history | Mỗi turn thêm message mới |
| Latest tool outputs | Output mới mỗi lần gọi tool |

### Visual / Minh họa

```
┌─────────────────────────────────────────┐
│  Tier 1 — STABLE (cached longest)       │
│  AGENTS.md                              │
│  SKILL.md (selected)                    │
│  Skill references                       │
│  System instructions                    │
├─────────────────────────────────────────┤
│  Tier 2 — SEMI-STABLE                  │
│  Code context / file contents           │
│  Repo map / skeleton                    │
├─────────────────────────────────────────┤
│  Tier 3 — VOLATILE (cache miss likely)  │
│  Todo list                              │
│  Git diff                               │
│  Conversation history                   │
│  Latest tool outputs                    │
└─────────────────────────────────────────┘
```

---

## 3. Concrete Rules for ForgeKit Orchestrator / Quy tắc cụ thể

Khi build system prompt, **luôn** xếp theo thứ tự:

```
1. AGENTS.md                          ← stable nhất
2. Selected primary SKILL.md          ← stable
3. Selected reference files           ← stable
4. Code context (files, repo map)     ← semi-stable
5. Todo list                          ← volatile
6. Git diff / recent changes          ← volatile nhất
7. Latest tool output                 ← volatile nhất
```

**Nguyên tắc**:
- Không bao giờ chèn volatile content giữa stable content.
- Không đặt AGENTS.md sau todo list hay diff.
- Nếu phải thêm nội dung mới stable → chèn vào **cuối Tier 1**, trước Tier 2.
- Nếu phải thêm nội dung mới volatile → chèn vào **cuối Tier 3**.

### Anti-patterns / Mẫu sai cần tránh

| Anti-pattern | Vấn đề |
|---|---|
| Đặt todo list trước SKILL.md | Cache miss toàn bộ SKILL.md mỗi turn |
| Đặt git diff giữa AGENTS.md và code context | Phá vỡ prefix ổn định |
| Đặt conversation history lên đầu | Mỗi turn → toàn bộ cache miss |
| Random ordering | ~10-20% cache hit thay vì 50-70% |

---

## 4. Estimated Savings / Ước tính tiết kiệm

| Scenario | Cache hit rate | Tiết kiệm token |
|---|---|---|
| **Proper layout** (3-tier) | 50-70% | Hàng nghìn token/turn |
| **Random ordering** | ~10-20% | Rất ít |
| **No caching** (non-support provider) | 0% | Không |

### Ví dụ cụ thể với cx/gpt-5.5 (200K context)

```
Giả sử: AGENTS.md = 2K tokens, SKILL.md = 3K, references = 5K
        Code context = 10K, Todo = 500, Diff = 2K, History = 8K
        Total ≈ 30.5K tokens

Turn 2 (proper layout):
  Cached prefix: AGENTS.md + SKILL.md + references = 10K tokens
  Cache hit: 10K / 30.5K ≈ 33% → tiết kiệm ~5K tokens (50% discount)

Turn 5 (proper layout, history grew to 20K):
  Cached prefix: vẫn 10K stable tokens
  Cache hit: 10K / 42.5K ≈ 24% → tiết kiệm ~5K tokens

Without layout (todo/diff at top, breaking cache):
  Cache hit ≈ 0-10% mỗi turn → tiết kiệm gần như không có
```

**Tổng kết**: Với context window lớn (200K), proper layout tiết kiệm
**5K-15K tokens/turn** ở 50% discount, cộng dồn thành tiết kiệm rất đáng kể
qua nhiều turns.

---

## 5. Integration with ForgeKit / Tích hợp

### Orchestrator

- Build prompt theo thứ tự 3-tier ở Section 3.
- Instruct model load stable context **trước** khi request volatile content.
- Khi thêm tool output mới, **append** vào cuối thay vì chèn giữa.

### token-efficiency skill

- Kiểm tra và enforce ordering khi review prompt layout.
- Flag anti-patterns (volatile content trước stable content).
- Đề xuất reorder nếu phát hiện vi phạm.

### `.forge.toml`

- **Không cần thay đổi** — đây là prompt engineering technique, không phải
  configuration.
- Caching behavior phụ thuộc vào provider, không cần config phía client.

### Workflow tích hợp

```
Orchestrator build prompt:
  1. Read AGENTS.md → prepend
  2. Load selected SKILL.md → append
  3. Load selected references → append
  4. Load code context / repo map → append
  5. Generate todo section → append
  6. Collect git diff → append
  7. Add conversation turn → append

token-efficiency review:
  - Verify ordering matches 3-tier layout
  - Warn if volatile content breaks stable prefix
  - Suggest fix if needed
```

---

## 6. Pattern Source / Nguồn tham khảo

| Project | Technique | Key insight |
|---|---|---|
| **Cline** | Stable prefix caching | System prompt + rules luôn ở đầu, user message ở cuối |
| **Roo Code** | System prompt ordering | Tool descriptions và rules trước, context và diff sau |
| **OpenHands** | Context window management | Phân tầng context theo volatility, compact cũ trước khi thêm mới |

### Links

- Cline: [github.com/cline/cline](https://github.com/cline/cline) — prompt
  caching implementation
- Roo Code: [github.com/RooVetGit/roo-code](https://github.com/RooVetGit/roo-code) —
  system prompt construction
- OpenHands: [github.com/All-Hands-AI/OpenHands](https://github.com/All-Hands-AI/OpenHands) —
  context management
- OpenAI docs: [platform.openai.com/docs/guides/prompt-caching](https://platform.openai.com/docs/guides/prompt-caching)

---

## Quick Reference / Tham khảo nhanh

```
# Quy tắc vàng: STABLE lên đầu, VOLATILE xuống cuối
#
# Thứ tự bắt buộc:
#   1. AGENTS.md
#   2. SKILL.md
#   3. References
#   4. Code context
#   5. Todo list
#   6. Git diff
#   7. Tool outputs
#
# Kết quả: 50-70% cache hit, tiết kiệm ~50% giá token cached
```
