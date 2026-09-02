# Forgot Password Feature

## Overview

Implemented a secure password reset flow for client users who forget their credentials. The feature uses email-based verification with time-limited reset tokens.

## User Flow

1. **Client forgets password** → Clicks "Forgot password?" link on login page
2. **Enters email** → System sends reset link if account exists
3. **Receives email** → Email contains secure reset link valid for 1 hour
4. **Clicks link** → Redirected to password reset form
5. **Sets new password** → Password is updated, can immediately log in

## Features

✅ **Secure token generation** - 32-byte cryptographically secure random tokens  
✅ **Time-limited tokens** - Automatically expire after 1 hour  
✅ **Email enumeration protection** - Always returns success, even for non-existent emails  
✅ **Single-use tokens** - Tokens are deleted after successful password reset  
✅ **Password validation** - Minimum 8 characters enforced  
✅ **Inactive account protection** - No reset emails sent for deactivated accounts  
✅ **Clear user feedback** - Success/error messages at every step  

## API Endpoints

### POST `/api/forgot-password`

Initiates password reset by sending an email with a reset link.

**Request:**
```json
{
  "email": "client@example.com"
}
```

**Response:** (always 200 OK for security)
```json
{
  "ok": true,
  "message": "If an account exists with this email, you will receive a password reset link shortly."
}
```

**Behavior:**
- Generates secure random token
- Stores token in Redis with 1-hour expiration
- Sends email with reset link (only if account exists and is active)
- Always returns success to prevent email enumeration attacks

---

### POST `/api/reset-password`

Validates reset token and updates the client's password.

**Request:**
```json
{
  "token": "abc123...",
  "newPassword": "newsecurepassword123"
}
```

**Success Response:**
```json
{
  "ok": true,
  "message": "Password has been reset successfully. You can now log in with your new password."
}
```

**Error Response:**
```json
{
  "ok": false,
  "error": "Invalid or expired reset link. Please request a new password reset."
}
```

**Validation:**
- Token must exist and not be expired
- Password must be at least 8 characters
- Client account must exist and be active
- Token is deleted after successful reset

## UI Components

### 1. Login Page Enhancement
- Added "Forgot password?" link below password field
- Links to `/forgot-password` view

### 2. Forgot Password Page
- Email input form
- Success message with instructions
- "Back to login" link

### 3. Reset Password Page
- Automatically loads when URL contains `?reset=TOKEN`
- New password + confirm password fields
- Success message with login redirect
- Clear error messages for invalid/expired tokens

## Email Template

Subject: **Reset your password**

Content includes:
- Personalized greeting with client name
- Clear explanation of the request
- Prominent "Reset Password" button
- Plain-text link as fallback
- 1-hour expiration notice
- Security note (can ignore if didn't request)

## Security Considerations

### Email Enumeration Prevention
Always returns success, even if email doesn't exist. This prevents attackers from discovering which emails have accounts.

### Token Security
- 32-byte cryptographically secure random tokens (256 bits of entropy)
- Stored with 1-hour TTL in Redis
- Single-use only (deleted after successful reset)
- Cannot be guessed or brute-forced

### Rate Limiting
Consider adding rate limiting in production:
- Limit password reset requests per email (e.g., 3 per hour)
- Limit password reset requests per IP (e.g., 10 per hour)

### Password Requirements
- Minimum 8 characters
- Can be enhanced with additional requirements (uppercase, numbers, symbols)

## Redis Data Structure

### Reset Token Storage
```
Key: reset_token:{token}
Value: {
  "email": "client@example.com",
  "createdAt": "2026-09-02T22:00:00.000Z"
}
TTL: 3600 seconds (1 hour)
```

### Client Record Updates
After successful reset, client record is updated:
```javascript
{
  ...existingClientData,
  passwordHash: "new_bcrypt_hash",
  mustChangePassword: false,  // Reset if was true
  passwordLastChanged: "2026-09-02T22:05:00.000Z"
}
```

## Testing

All 16 tests passing ✅ (9 new tests for password reset)

### Test Coverage
- ✅ Send reset email for existing active client
- ✅ Return success for non-existent email (security)
- ✅ Reject missing email parameter
- ✅ Don't send email for inactive clients
- ✅ Reset password with valid token
- ✅ Reject invalid/expired token
- ✅ Reject password < 8 characters
- ✅ Handle missing client account
- ✅ Complete end-to-end flow

### Running Tests
```bash
npm test
```

## Environment Variables

No new environment variables required. Uses existing:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RESEND_API_KEY`
- `BASE_URL` (optional, defaults to https://www.sidequesttech.co.za)

## URL Structure

Reset links follow this format:
```
https://www.sidequesttech.co.za?reset={TOKEN}
```

Example:
```
https://www.sidequesttech.co.za?reset=a1b2c3d4e5f6...
```

## Future Enhancements

### Optional Improvements
1. **Rate limiting** - Prevent abuse by limiting requests per IP/email
2. **Password strength meter** - Visual feedback on password quality
3. **Recent password check** - Prevent reusing last N passwords
4. **2FA integration** - Optional two-factor authentication
5. **Audit logging** - Log all password reset attempts
6. **Admin notifications** - Alert admins of suspicious reset activity

### Analytics to Track
- Password reset request rate
- Token expiration rate (users not clicking links)
- Reset completion rate
- Time between request and completion

## Troubleshooting

### Client Not Receiving Reset Email

**Check:**
1. Email address is correct and matches account
2. Check spam/junk folder
3. Verify Resend API key is valid
4. Check Resend dashboard for delivery status
5. Verify domain is verified in Resend

### Reset Link Not Working

**Common causes:**
- Token expired (> 1 hour old)
- Token already used (single-use only)
- Malformed URL (token truncated in email client)
- Client account deactivated

**Solution:** Request a new password reset

### Password Reset Fails

**Check:**
- New password meets minimum 8 character requirement
- Token is valid and not expired
- Client account exists and is active
- Network connectivity

## Deployment Checklist

- [x] API endpoints created (`/api/forgot-password.js`, `/api/reset-password.js`)
- [x] UI components added to `src/App.jsx`
- [x] Email template configured with Resend
- [x] Tests written and passing (16/16)
- [x] Documentation complete
- [ ] Environment variables set in Vercel
- [ ] Test in staging environment
- [ ] Monitor Resend email delivery
- [ ] Consider rate limiting for production

---

**Last Updated**: 2026-09-02  
**Status**: ✅ Implemented & Tested  
**Tests**: 16/16 passing
