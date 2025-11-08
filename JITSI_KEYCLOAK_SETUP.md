# Self-Host Jitsi Meet with Keycloak Authentication

## Overview

To use your own Keycloak user authentication instead of Google/GitHub, you need to self-host Jitsi Meet and configure it to use Keycloak as the authentication provider.

## Why Self-Host?

The public `meet.jit.si` server:
- ❌ Cannot use your Keycloak authentication
- ❌ Shows Google/GitHub login prompts
- ❌ Has moderator requirements you can't fully disable
- ❌ Gives you no control over authentication

Your own Jitsi server:
- ✅ Integrates with your Keycloak server
- ✅ Uses your own user accounts
- ✅ Full control over authentication flow
- ✅ No external login prompts
- ✅ Enterprise-grade security

## Prerequisites

- Docker and Docker Compose installed
- Domain name (e.g., `meet.pilot180.local` or `meet.yourcompany.com`)
- Keycloak server running (you already have this)
- SSL certificate (Let's Encrypt or self-signed for local)

## Quick Start with Docker

### Step 1: Create Jitsi Docker Compose

Create `docker-compose.jitsi.yml`:

```yaml
version: '3.8'

services:
  # Jitsi Web (Frontend)
  jitsi-web:
    image: jitsi/web:latest
    restart: always
    ports:
      - '8443:443'
      - '8000:80'
    environment:
      - ENABLE_AUTH=1
      - ENABLE_GUESTS=1
      - AUTH_TYPE=jwt
      - JWT_APP_ID=pilot180-jitsi
      - JWT_APP_SECRET=your-secret-key-here
      - JWT_ACCEPTED_ISSUERS=pilot180-jitsi
      - JWT_ACCEPTED_AUDIENCES=pilot180-jitsi
      - PUBLIC_URL=https://meet.pilot180.local
      - XMPP_DOMAIN=meet.jitsi
      - XMPP_AUTH_DOMAIN=auth.meet.jitsi
      - XMPP_BOSH_URL_BASE=http://jitsi-prosody:5280
      - XMPP_MUC_DOMAIN=muc.meet.jitsi
      - JVB_TCP_HARVESTER_DISABLED=true
    networks:
      - jitsi-network

  # Jitsi Prosody (XMPP Server)
  jitsi-prosody:
    image: jitsi/prosody:latest
    restart: always
    environment:
      - AUTH_TYPE=jwt
      - ENABLE_AUTH=1
      - ENABLE_GUESTS=1
      - JWT_APP_ID=pilot180-jitsi
      - JWT_APP_SECRET=your-secret-key-here
      - JWT_ACCEPTED_ISSUERS=pilot180-jitsi
      - JWT_ACCEPTED_AUDIENCES=pilot180-jitsi
      - XMPP_DOMAIN=meet.jitsi
      - XMPP_AUTH_DOMAIN=auth.meet.jitsi
      - XMPP_MUC_DOMAIN=muc.meet.jitsi
      - XMPP_INTERNAL_MUC_DOMAIN=internal-muc.meet.jitsi
      - JVB_AUTH_USER=jvb
      - JVB_AUTH_PASSWORD=jvb-password
    networks:
      - jitsi-network
    volumes:
      - jitsi-prosody-config:/config

  # Jitsi JVB (Video Bridge)
  jitsi-jvb:
    image: jitsi/jvb:latest
    restart: always
    ports:
      - '10000:10000/udp'
      - '4443:4443'
    environment:
      - JVB_AUTH_USER=jvb
      - JVB_AUTH_PASSWORD=jvb-password
      - JVB_BREWERY_MUC=jvbbrewery
      - JVB_PORT=10000
      - JVB_TCP_HARVESTER_DISABLED=true
      - JVB_STUN_SERVERS=stun.l.google.com:19302
      - XMPP_AUTH_DOMAIN=auth.meet.jitsi
      - XMPP_INTERNAL_MUC_DOMAIN=internal-muc.meet.jitsi
      - XMPP_SERVER=jitsi-prosody
    networks:
      - jitsi-network

  # Jicofo (Conference Focus)
  jitsi-jicofo:
    image: jitsi/jicofo:latest
    restart: always
    environment:
      - AUTH_TYPE=jwt
      - ENABLE_AUTH=1
      - XMPP_DOMAIN=meet.jitsi
      - XMPP_AUTH_DOMAIN=auth.meet.jitsi
      - XMPP_INTERNAL_MUC_DOMAIN=internal-muc.meet.jitsi
      - XMPP_MUC_DOMAIN=muc.meet.jitsi
      - XMPP_SERVER=jitsi-prosody
      - JICOFO_AUTH_USER=focus
      - JICOFO_AUTH_PASSWORD=focus-password
      - JVB_BREWERY_MUC=jvbbrewery
    networks:
      - jitsi-network

networks:
  jitsi-network:
    driver: bridge

volumes:
  jitsi-prosody-config:
```

### Step 2: Update Your Backend to Generate JWT Tokens

Add JWT token generation to your backend:

```javascript
// backend/services/jitsiService.js
import jwt from 'jsonwebtoken';

export function generateJitsiToken(user) {
  const payload = {
    context: {
      user: {
        name: user.name || user.preferred_username,
        email: user.email,
        id: user.sub
      }
    },
    aud: 'pilot180-jitsi',
    iss: 'pilot180-jitsi',
    sub: 'meet.pilot180.local',
    room: '*',  // Allow all rooms
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
    moderator: true  // Make all authenticated users moderators
  };

  const secret = process.env.JITSI_JWT_SECRET || 'your-secret-key-here';
  return jwt.sign(payload, secret, { algorithm: 'HS256' });
}
```

### Step 3: Add API Endpoint for JWT Tokens

```javascript
// backend/routes/jitsiRoutes.js
import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { generateJitsiToken } from '../services/jitsiService.js';

const router = express.Router();

router.get('/jitsi/token', authenticateToken, (req, res) => {
  const user = req.kauth?.grant?.access_token?.content;

  const jitsiToken = generateJitsiToken({
    name: user.preferred_username || 'Guest',
    email: user.email,
    sub: user.sub
  });

  res.json({ ok: true, token: jitsiToken });
});

export default router;
```

### Step 4: Update Frontend VideoCall Component

```typescript
// Update the VideoCall component to use your self-hosted Jitsi

const domain = 'meet.pilot180.local';  // Your domain
const options = {
  roomName: roomName,
  width: '100%',
  height: '100%',
  parentNode: jitsiContainerRef.current,
  userInfo: {
    displayName: displayName || 'Guest',
    email: userEmail,
  },
  jwt: jitsiToken,  // Token from your backend
  configOverwrite: {
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    prejoinPageEnabled: false,
    // No authentication prompts - using JWT
    requireDisplayName: false,
  },
};
```

### Step 5: Fetch Jitsi Token Before Joining

```typescript
// In your component, fetch token before joining

const [jitsiToken, setJitsiToken] = useState<string | null>(null);

useEffect(() => {
  const fetchToken = async () => {
    try {
      const response = await api.get('/jitsi/token');
      if (response.data.ok) {
        setJitsiToken(response.data.token);
      }
    } catch (err) {
      console.error('Failed to get Jitsi token:', err);
    }
  };

  fetchToken();
}, []);
```

## Benefits of Self-Hosted Solution

1. **Keycloak Integration**: Users authenticate with their Keycloak accounts
2. **No External Logins**: No Google/GitHub prompts
3. **Full Control**: Configure all aspects of Jitsi
4. **Privacy**: All data stays on your infrastructure
5. **Customization**: Brand it as your own
6. **Enterprise Features**: Recording, SIP integration, etc.

## Alternative: Simple Workaround (Current Setup)

If you can't self-host Jitsi right now, update the user guidance:

**User Instructions:**
1. When you see "Sign in with Google/GitHub" - **close that popup**
2. Enter your name (pre-filled from Keycloak)
3. Click "Join Now" or "Join as Guest"
4. You'll join the meeting without logging in

The login prompt is optional - users can always join as guests.

## Recommended Next Steps

1. **Short-term**: Update UI messages to guide users to skip login
2. **Long-term**: Set up self-hosted Jitsi with Keycloak integration

Would you like me to help you set up the self-hosted Jitsi server?
