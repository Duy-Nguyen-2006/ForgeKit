## PR Description

<!-- Mô tả ngắn gọn thay đổi -->

## Section 0 — Non-negotiable Principles Compliance

Mọi PR vào ForgeKit phải xác nhận tuân thủ 7 nguyên tắc bất biến. Tick checkbox tương ứng:

- [ ] **§0.1** Không thêm entrypoint mới ngoài `:ck:auto` (không `/ck:plan`, `/ck:cook`, v.v.)
- [ ] **§0.2** Spec-first, một approval gate — không thêm interaction gate mới
- [ ] **§0.3** User không phải chọn skill, agent, file, test, tool — không thêm UI/CLI choice mới
- [ ] **§0.4** ForgeCode-native first — Codex/Claude chỉ là compatibility layer, không nâng cấp ngang hàng
- [ ] **§0.5** Token efficiency — không thêm asset nặng, bloat, load mặc định không cần thiết
- [ ] **§0.6** Repo cleanliness — không thêm media/binary nặng vào repo
- [ ] **§0.7** Output Việt ngắn gọn theo mặc định

## Type of Change

- [ ] Infrastructure (CI, LICENSE, CHANGELOG, etc.)
- [ ] Hook runtime (`.cjs` hooks, validators)
- [ ] Skill addition (new skill module)
- [ ] Documentation (docs, README, compatibility matrix)
- [ ] Bug fix
- [ ] Other: ___________

## Quality Gates

- [ ] `npm test` passes (all tests including new ones)
- [ ] `npm run lint` passes
- [ ] No new user-facing entrypoint besides `:ck:auto`
- [ ] README does not contain `/ck:` commands (except compatibility section)

## Notes

<!-- Ghi chú thêm nếu cần -->
