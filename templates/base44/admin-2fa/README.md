# Admin 2FA loop fix — integration contract

The loop happens when the email callback returns through a route guarded by the normal login/admin gate before the 2FA token is consumed. The guard sees "2FA not complete", starts a new challenge and sends the user back to login.

## Required route order

1. `/login` — public.
2. `/admin/2fa/callback` — public callback route, but token validation is server-side.
3. `/admin` — authenticated + AdminMfaGate.
4. Catch-all protected routes.

Never wrap `/admin/2fa/callback` inside the admin protected route.

## Backend contract

### POST /api/admin/mfa/request
Authenticated user. Admin/superadmin only.

Request:
```json
{"nonce":"uuid","callbackPath":"/admin/2fa/callback","returnTo":"/admin"}
```

Server:
- creates a cryptographically random one-time token;
- persists only SHA-256(token), user id/email, nonce, expires_at, consumed_at=null;
- TTL 10 minutes;
- sends a link:
  `https://prodpipes.com/admin/2fa/callback?token=<token>&nonce=<nonce>`;
- rate limit resend attempts.

### POST /api/admin/mfa/verify
The callback sends token + nonce.

Server validates atomically:
- matching SHA-256 token;
- same user identity/challenge;
- nonce;
- not expired;
- not consumed.

On success:
- mark token consumed;
- create an MFA session valid for a configured period (for example 30 minutes);
- preferably issue an HttpOnly, Secure, SameSite=Lax signed cookie or a server-side MFA-session id;
- respond `{"ok":true,"verifiedForMs":1800000}`.

The client must then replace the callback URL and navigate directly to `/admin`; it must NOT navigate through `/login`.

## Loop breakers

- Do not request another email when an unexpired MFA challenge already exists.
- Do not execute the admin redirect guard on the callback route.
- Do not clear the authenticated Base44/user session while processing 2FA.
- Preserve `returnTo=/admin` in session state, not by bouncing through login.
- Consumed tokens must fail on replay.
- Callback errors may show "Voltar ao login", but successful callbacks always continue to `/admin`.

## Regression tests

1. authenticated superadmin opens /admin -> one email challenge only;
2. clicking valid email link consumes token -> /admin opens;
3. refresh /admin during MFA session does not send another email;
4. replaying the same link fails without logging the user out;
5. expired token shows an error and allows explicit resend;
6. callback loaded in a new tab still validates if server-side user/challenge binding is valid;
7. unauthenticated user cannot turn an MFA token into an admin session by itself.
