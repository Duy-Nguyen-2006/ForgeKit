# Auth Implementation Checklist

Chi tiết implementation patterns cho authentication — loaded on demand only.

## JWT Implementation

### Access Token
- Algorithm: RS256 (asymmetric) preferred over HS256
- Payload: `{ sub: userId, role: userRole, iat, exp }`
- Expiry: 15 minutes
- Store: Authorization header (Bearer token)

### Refresh Token
- Expiry: 7 days
- Store: httpOnly cookie + database
- Rotation: new refresh token issued on each use
- Revocation: delete from database on logout

### Middleware Pattern
```typescript
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const payload = verify(token, PUBLIC_KEY);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

## OAuth 2.0 Implementation

### Google OAuth
1. Register app in Google Cloud Console
2. Configure redirect URI
3. Use `google-auth-library` for verification
4. Create/link user in database

### GitHub OAuth
1. Register OAuth App in GitHub Settings
2. Authorization URL: `https://github.com/login/oauth/authorize`
3. Token exchange: `POST https://github.com/login/oauth/access_token`
4. Fetch user profile with token

## Session Implementation

### Express Session
- Store: Redis (production), MemoryStore (dev only)
- Cookie: httpOnly, secure, sameSite=strict
- TTL: 24 hours
- Regenerate session ID on login

## Password Security

### Hashing
- bcrypt with salt rounds ≥ 12
- argon2id preferred (GPU-resistant)
- Never use MD5, SHA1, SHA256 directly

### Password Policy
- Minimum 8 characters
- Check against breached passwords (HaveIBeenPwned API)
- No maximum length limit
- Allow all Unicode characters

## RBAC Implementation

### Role Definition
```typescript
type Role = 'admin' | 'editor' | 'viewer';

const permissions: Record<Role, string[]> = {
  admin: ['read', 'write', 'delete', 'manage'],
  editor: ['read', 'write'],
  viewer: ['read'],
};
```

### Middleware
```typescript
function requirePermission(permission: string) {
  return (req, res, next) => {
    if (!permissions[req.user.role]?.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```
