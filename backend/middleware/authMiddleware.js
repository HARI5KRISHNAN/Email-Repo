import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: `${process.env.KEYCLOAK_URL}realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxAge: 86400000 // 24 hours
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ ok: false, error: 'No token provided' });
  }

  // Use KEYCLOAK_ISSUER if set, otherwise fall back to KEYCLOAK_URL
  const issuerUrl = process.env.KEYCLOAK_ISSUER || process.env.KEYCLOAK_URL;

  jwt.verify(token, getKey, {
    // Don't validate audience for public clients (Keycloak doesn't include it by default)
    // audience: process.env.KEYCLOAK_CLIENT_ID || 'ai-email-assistant',
    issuer: `${issuerUrl}realms/${process.env.KEYCLOAK_REALM}`,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.status(403).json({ ok: false, error: 'Invalid or expired token' });
    }

    // Attach decoded token to request
    req.kauth = {
      grant: {
        access_token: {
          content: decoded
        }
      }
    };

    next();
  });
}
