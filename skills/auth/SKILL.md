---
name: ck:auth
description: "Auth patterns: JWT, OAuth, session, RBAC"
auto_load: false
triggers:
  - login
  - signup
  - jwt
  - session
  - oauth
  - đăng nhập
  - đăng ký
  - authentication
  - authorization
  - rbac
non_triggers:
  - deploy
  - database schema only
  - ui design only
examples:
  - "thêm đăng nhập bằng JWT cho API"
  - "implement OAuth2 Google login"
  - "setup session management cho web app"
metadata:
  author: forgekit
  version: "1.0.0"
---

# Auth

Authentication & authorization patterns cho web apps. Không bundle SDK — chỉ hướng dẫn pattern + checklist.

## Khi nào load

- User yêu cầu login/signup/session/OAuth
- Backend cần auth middleware
- Cần RBAC hoặc permission system
- Cần review auth flow bảo mật

## Không dùng khi

- Chỉ cần UI form (→ frontend-development)
- Chỉ cần DB schema cho user table (→ databases)
- Cần deploy auth service (→ deploy)

## Core Patterns

### JWT Flow
1. User gửi credentials → server validate
2. Server tạo JWT (access + refresh token)
3. Access token: short-lived (15 min), trong header
4. Refresh token: long-lived (7 days), httpOnly cookie
5. Middleware verify JWT trên mỗi request

### Session-based
1. User gửi credentials → server validate
2. Server tạo session, lưu trong DB/Redis
3. Set session ID trong httpOnly cookie
4. Middleware check session trên mỗi request

### OAuth 2.0
1. Redirect → provider (Google/GitHub/Facebook)
2. Callback → exchange code for token
3. Create/link user account
4. Issue session/JWT

## OWASP-Light Checklist

- [ ] Password: bcrypt/argon2 hash, min 8 chars
- [ ] Rate limit: login endpoint (5 attempts/min)
- [ ] CSRF token cho session-based auth
- [ ] httpOnly + Secure + SameSite cookie flags
- [ ] JWT secret từ env var, không hardcode
- [ ] Refresh token rotation
- [ ] Logout: invalidate session + clear cookie
- [ ] Không expose internal user IDs

## Integration

- Hợp tác với `security-scan` cho audit
- Hợp tác với `backend-development` cho API endpoint
- Hợp tác với `databases` cho user schema

## References

See `references/auth-checklist.md` for detailed implementation patterns (loaded on demand only).
