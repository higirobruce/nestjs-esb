# JWT Token "Invalid token" Troubleshooting Guide

## Common Causes and Solutions

### 1. **Environment Variables Not Set**
The most common cause is missing or incorrect JWT secrets.

**Check your `.env` file:**
```bash
# Create .env from template if it doesn't exist
cp .env.example .env

# Verify JWT configuration in .env
cat .env | grep JWT
```

**Required JWT variables:**
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRATION_TIME=3600
JWT_REFRESH_EXPIRATION_TIME=604800
```

### 2. **Application Not Running**
Ensure the NestJS application is running on port 4000.

```bash
# Start the application
npm run start:dev

# Or with debug logging
LOG_LEVEL=debug npm run start:dev
```

### 3. **Token Format Issues**
Ensure you're using the correct Authorization header format:

**Correct:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Incorrect:**
```http
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Missing 'Bearer '
Authorization: bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Lowercase 'bearer'
```

### 4. **Token Expiration**
Tokens expire after the configured time (default: 1 hour).

**Check token expiration:**
```bash
# Run the debug script to see token details
node debug-jwt.js
```

### 5. **Secret Mismatch**
The JWT secret used to sign tokens must match the secret used to verify them.

**Debug steps:**
1. Check server logs for JWT Strategy initialization message
2. Ensure no environment variable conflicts
3. Restart the application after changing .env

### 6. **Database User Issues**
The user in the JWT payload must exist and be active.

**Possible issues:**
- User was deleted after token was issued
- User status is not 'active'
- User account is locked

## Debugging Steps

### Step 1: Verify Application is Running
```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-XX...",
  "service": "NestJS ESB"
}
```

### Step 2: Test Login
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin@123456"}'
```

### Step 3: Use Debug Script
```bash
# Install dependencies if needed
npm install jsonwebtoken axios --no-save

# Run debug script
node debug-jwt.js
```

### Step 4: Check Server Logs
Look for these log messages when the application starts:
```
[JwtStrategy] JWT Strategy initialized with secret: your-super...
[UserSeeder] Default admin user created
```

And when making authenticated requests:
```
[JwtStrategy] Validating JWT payload: {"sub":"...","username":"admin",...}
[JwtStrategy] JWT validation successful for user: admin
```

### Step 5: Test with cURL
```bash
# Replace TOKEN with your actual token
TOKEN="your-jwt-token-here"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/auth/profile
```

## Common Error Messages and Solutions

### "Invalid token"
- Check token format (must include "Bearer " prefix)
- Verify JWT_SECRET matches between sign and verify
- Ensure token hasn't expired

### "Token has expired"
- Get a new token by logging in again
- Check JWT_EXPIRATION_TIME setting

### "User not found"
- User was deleted after token was issued
- Database connection issues

### "Account is not active"
- User status is not 'active'
- Check user record in database

### "Account is locked"
- Too many failed login attempts
- Wait for lockout period to expire or reset manually

## Quick Fix Commands

```bash
# 1. Ensure environment is set up
cp .env.example .env

# 2. Install all dependencies
npm install

# 3. Build the application
npm run build

# 4. Start with debug logging
LOG_LEVEL=debug npm run start:dev

# 5. In another terminal, test the debug script
node debug-jwt.js
```

## Manual Testing with Different Tools

### Using Postman/Insomnia:
1. POST to `http://localhost:4000/auth/login` with admin credentials
2. Copy the `accessToken` from response
3. GET to `http://localhost:4000/auth/profile` with header:
   - Key: `Authorization`
   - Value: `Bearer {paste-token-here}`

### Using Browser DevTools:
```javascript
// In browser console
fetch('http://localhost:4000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'Admin@123456' })
})
.then(r => r.json())
.then(data => {
  console.log('Token:', data.accessToken);
  
  // Test the token
  return fetch('http://localhost:4000/auth/profile', {
    headers: { 'Authorization': `Bearer ${data.accessToken}` }
  });
})
.then(r => r.json())
.then(profile => console.log('Profile:', profile))
.catch(err => console.error('Error:', err));
```

## If All Else Fails

1. **Delete and recreate .env file**
2. **Clear node_modules and reinstall:**
   ```bash
   rm -rf node_modules
   npm install
   ```
3. **Check for port conflicts:**
   ```bash
   lsof -i :4000
   ```
4. **Restart the application completely**
5. **Check application logs for any startup errors**

The enhanced JWT strategy and guards will now provide more detailed error messages to help identify the exact issue.
