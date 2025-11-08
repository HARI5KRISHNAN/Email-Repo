# Self-Hosted Jitsi with Keycloak Authentication - Setup Guide

## Overview

This guide will help you set up a self-hosted Jitsi Meet server integrated with your Keycloak authentication system. After setup, users will authenticate with their Keycloak credentials and join video meetings without any Google/GitHub login prompts.

## Benefits

✅ **No External Authentication** - Uses your Keycloak users only
✅ **Seamless Integration** - Users already authenticated in your app
✅ **No Login Prompts** - JWT tokens handled automatically
✅ **Full Control** - Self-hosted on your infrastructure
✅ **Privacy** - All data stays within your network

## Prerequisites

- Docker and Docker Compose installed
- Existing Keycloak setup (you already have this)
- Ports available: 8000 (HTTP), 8443 (HTTPS), 10000/UDP (WebRTC)

## Step 1: Environment Configuration

### 1.1 Copy Environment Template

```bash
cp .env.example .env
```

### 1.2 Configure Jitsi Variables in `.env`

Add or update these variables:

```env
# Jitsi JWT Secret - IMPORTANT: Change this to a random string!
JITSI_JWT_SECRET=your-secure-random-secret-here

# Jitsi Domain and Port
JITSI_DOMAIN=localhost
JITSI_PORT=8000
JITSI_SECURE=false

# Jitsi Component Passwords
JVB_AUTH_PASSWORD=jvbpassword123
JICOFO_AUTH_PASSWORD=focuspassword123
JICOFO_COMPONENT_SECRET=componentSecret123
```

**Security Note:** Generate a strong random secret for production:
```bash
openssl rand -base64 32
```

### 1.3 Frontend Environment Variables

Create/update `.env` in the frontend root:

```env
VITE_JITSI_DOMAIN=localhost
VITE_JITSI_PORT=8000
```

## Step 2: Start Jitsi Services

### 2.1 Start Jitsi Containers

```bash
docker compose -f docker-compose.jitsi.yml up -d
```

This will start:
- **jitsi-web** - Web interface (ports 8000, 8443)
- **jitsi-prosody** - XMPP server
- **jitsi-jvb** - Video bridge (port 10000/UDP)
- **jitsi-jicofo** - Conference focus

### 2.2 Verify Services Are Running

```bash
docker compose -f docker-compose.jitsi.yml ps
```

All services should show as "Up" and "healthy".

### 2.3 Check Logs

```bash
# Check all services
docker compose -f docker-compose.jitsi.yml logs

# Check specific service
docker compose -f docker-compose.jitsi.yml logs jitsi-web
```

## Step 3: Rebuild Backend with Jitsi Support

The backend has been updated with Jitsi JWT token generation.

### 3.1 Rebuild Backend Container

```bash
docker compose up -d --build backend
```

### 3.2 Verify Backend Logs

```bash
docker logs --tail 50 pilot180-backend
```

Look for successful startup messages.

## Step 4: Test the Integration

### 4.1 Test JWT Token Generation

```bash
# Get Keycloak token first
TOKEN=$(curl -s -X POST "http://localhost:8080/realms/pilot180/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=bob" \
  -d "password=password" \
  -d "grant_type=password" \
  -d "client_id=ai-email-assistant" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# Get Jitsi token
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8081/api/jitsi/token" | python -m json.tool
```

Expected response:
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "bob",
    "email": "bob@pilot180.local"
  },
  "expiresIn": 7200
}
```

### 4.2 Test Video Call from Frontend

1. Open your email app: `http://localhost:3006`
2. Login with Keycloak (bob/password)
3. Go to "Schedule Meeting"
4. Click "Start & Join Now"
5. **Expected Result**:
   - ✅ No Google/GitHub login prompts
   - ✅ Joins directly as "bob"
   - ✅ Shows "Authenticated with Keycloak" message

## Step 5: Invite Another User

### 5.1 Create Second User in Keycloak

1. Go to Keycloak Admin: `http://localhost:8080`
2. Login (admin/admin)
3. Go to Users → Add User
4. Username: `alice`, Email: `alice@pilot180.local`
5. Set password in Credentials tab

### 5.2 Test Multi-User Meeting

**User 1 (Bob):**
1. Start meeting
2. Click "Copy Link" button
3. Send link to Alice

**User 2 (Alice):**
1. Login to email app as Alice
2. Open the meeting link (or join from calendar)
3. Both users should see each other!

## Troubleshooting

### Issue: Jitsi containers won't start

**Solution:**
```bash
# Check if ports are already in use
netstat -ano | findstr :8000
netstat -ano | findstr :10000

# Stop conflicting services or change ports in docker-compose.jitsi.yml
```

### Issue: "Failed to load Jitsi Meet API"

**Solution:**
1. Verify jitsi-web is running: `docker ps | grep jitsi-web`
2. Check jitsi-web logs: `docker logs jitsi-web`
3. Verify you can access: `http://localhost:8000`

### Issue: "Failed to authenticate with video server"

**Solution:**
1. Check backend can generate tokens:
   ```bash
   docker logs pilot180-backend | grep Jitsi
   ```
2. Verify JITSI_JWT_SECRET matches in:
   - `docker-compose.jitsi.yml`
   - Backend `.env` file

### Issue: Token validation fails

**Solution:**
1. Ensure JWT secret is the same everywhere:
   ```bash
   # In docker-compose.jitsi.yml
   JWT_APP_SECRET=${JITSI_JWT_SECRET:-ChangeMeToRandomSecret123!}

   # In backend .env
   JITSI_JWT_SECRET=ChangeMeToRandomSecret123!
   ```

### Issue: Can't connect to video call

**Solution:**
1. Check firewall allows UDP port 10000
2. Verify JVB is running: `docker logs jitsi-jvb`
3. Try accessing Jitsi directly: `http://localhost:8000/test123`

## Architecture

```
┌─────────────────┐
│   Frontend      │
│  (localhost:    │
│    3006)        │
└────────┬────────┘
         │
         │ 1. Get JWT token
         ▼
┌─────────────────┐
│   Backend       │──── Keycloak Auth
│  (localhost:    │
│    8081)        │
└────────┬────────┘
         │
         │ 2. JWT token
         │    (signed with secret)
         ▼
┌─────────────────┐
│  Jitsi Server   │
│  (localhost:    │
│    8000)        │
│                 │
│  Components:    │
│  - Web UI       │
│  - Prosody      │
│  - JVB          │
│  - Jicofo       │
└─────────────────┘
```

## Security Best Practices

1. **Change JWT Secret** - Use a strong random secret in production
2. **Use HTTPS** - Configure SSL certificates for production
3. **Firewall Rules** - Only expose necessary ports
4. **Token Expiration** - Tokens expire after 2 hours (configurable)
5. **User Validation** - Only authenticated Keycloak users can get tokens

## Advanced Configuration

### Enable HTTPS

1. Get SSL certificates (Let's Encrypt recommended)
2. Update `docker-compose.jitsi.yml`:
   ```yaml
   environment:
     - ENABLE_HTTPS=1
     - ENABLE_LETSENCRYPT=1
     - LETSENCRYPT_DOMAIN=meet.yourdomain.com
     - LETSENCRYPT_EMAIL=admin@yourdomain.com
   ```

### Custom Domain

1. Update DNS: `meet.yourdomain.com` → Your server IP
2. Update environment variables:
   ```env
   JITSI_DOMAIN=meet.yourdomain.com
   PUBLIC_URL=https://meet.yourdomain.com
   ```

### Enable Recording (Optional)

1. Add Jibri service to `docker-compose.jitsi.yml`
2. Configure storage for recordings
3. Update permissions in backend

## Monitoring

### Check Service Health

```bash
# All services status
docker compose -f docker-compose.jitsi.yml ps

# Resource usage
docker stats jitsi-web jitsi-prosody jitsi-jvb jitsi-jicofo

# Logs
docker compose -f docker-compose.jitsi.yml logs -f --tail=100
```

### Performance Metrics

- **CPU Usage**: JVB is most intensive during calls
- **Memory**: ~500MB for all services idle
- **Network**: Depends on participants (typically 1-2 Mbps per participant)

## Maintenance

### Update Jitsi

```bash
# Pull latest images
docker compose -f docker-compose.jitsi.yml pull

# Restart with new images
docker compose -f docker-compose.jitsi.yml up -d
```

### Backup Configuration

```bash
# Backup volumes
docker run --rm -v jitsi-prosody-config:/data -v $(pwd):/backup alpine tar czf /backup/jitsi-config-backup.tar.gz /data
```

### Clean Up

```bash
# Stop all services
docker compose -f docker-compose.jitsi.yml down

# Remove volumes (WARNING: Deletes all data)
docker compose -f docker-compose.jitsi.yml down -v
```

## Success Checklist

- [ ] Jitsi containers running
- [ ] Backend generating JWT tokens
- [ ] Frontend connecting to Jitsi
- [ ] No login prompts appearing
- [ ] Users authenticated with Keycloak
- [ ] Video/audio working
- [ ] Multiple users can join same room
- [ ] Meeting links shareable

## Support

If you encounter issues:
1. Check logs: `docker compose -f docker-compose.jitsi.yml logs`
2. Verify environment variables are set correctly
3. Ensure all services are healthy: `docker ps`
4. Test each component individually

## Next Steps

1. Configure HTTPS for production
2. Set up custom domain
3. Enable recording if needed
4. Configure firewall rules
5. Monitor performance
6. Set up backups

Congratulations! You now have a fully integrated self-hosted Jitsi Meet server with Keycloak authentication! 🎉
