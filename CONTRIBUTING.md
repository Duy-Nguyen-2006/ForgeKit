# Contributing to ForgeKit

Cảm ơn bạn muốn đóng góp cho ForgeKit. Đây là hướng dẫn ngắn để bắt đầu.

## Nguyên tắc bất biến

Trước khi đóng góp, đọc và tuân thủ 7 nguyên tắc bất biến của ForgeKit. Mọi PR vi phạm sẽ bị từ chối:

1. **Một entrypoint duy nhất: `:ck:auto`.** Không thêm slash command hay entrypoint mới cho user.
2. **Spec-first, một approval gate.** User chỉ tương tác 2 lần: gõ yêu cầu, duyệt Spec.
3. **User không chọn skill, agent, file, test, tool.** Mọi UI/CLI/skill mới phải tuân thủ.
4. **ForgeCode-native first.** Codex/Claude là compatibility layer, không nâng cấp ngang hàng.
5. **Token efficiency là yêu cầu cứng.** Không thêm asset nặng, bloat repo, load mặc định.
6. **Repo cleanliness.** Không thêm media/binary nặng vào repo.
7. **Output Việt ngắn gọn theo mặc định.**

## Quy trình đóng góp

1. **Fork** repo và tạo branch từ `main`.
2. **Implement** thay đổi, đảm bảo pass `npm test` + `npm run lint`.
3. **Tạo PR** dùng template `.github/PULL_REQUEST_TEMPLATE.md`, tick đủ checkbox §0.
4. **CI phải xanh** trước khi review.

## Cấu trúc repo

```text
ForgeKit/
├── forgekit.json        # Manifest gốc
├── commands/            # Command duy nhất: ck:auto.md
├── agents/              # Subagent definitions
├── skills/              # Skill modules (mỗi cái có SKILL.md + references/)
├── hooks/               # Hook scripts (.cjs) + docs (.md)
├── integrations/        # RTK, Serena, recommended-tools
├── communication/       # Output style rules
├── scripts/             # Generators, validators
└── bin/                 # npm installer
```

## Thêm skill mới

1. Tạo `skills/<name>/SKILL.md` ≤150 dòng, có YAML frontmatter:
   ```yaml
   ---
   name: <name>
   triggers: [keyword1, keyword2]
   non_triggers: [keyword3]
   examples:
     - "ví dụ request user"
   ---
   ```
2. Thêm entry vào `skills/registry.md` bảng Domain (nếu chuyên ngành) hoặc bảng phù hợp.
3. Thêm examples vào `skills/orchestrator/references/intent-classifier.md`.
4. Không lộ tên skill ở user-facing surface (README, command docs).
5. Không kéo binary/asset > 50 KB; tham chiếu tool ngoài thay vì nhúng.

## Thêm hook mới

1. Tạo `hooks/<category>/<name>.cjs` — CommonJS, đọc stdin JSON, exit 0 (allow) / 2 (block).
2. Không phụ thuộc npm package bên ngoài.
3. Giữ `.md` tài liệu cạnh hook.
4. Cập nhật `forgekit.json` hooks section.
5. Thêm test trong `skills/auto/scripts/hooks.test.cjs`.

## Chạy test

```bash
npm test          # Chạy tất cả test (adapter + contract + auto)
npm run lint      # Validator pipeline (forgekit.json, registry, SKILL.md)
npm test:installer  # Test installer --help
```

## Câu hỏi?

Mở issue tại https://github.com/Duy-Nguyen-2006/ForgeKit/issues.
