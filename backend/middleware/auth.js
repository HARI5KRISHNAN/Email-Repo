import axios from 'axios';
import jwt from 'jsonwebtoken';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://pilot180-keycloak:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'pilot180';

let publicKey = null;

/**
 * Fetch the Keycloak public key for JWT verification
 */
async function fetchPublicKey() {
  if (publicKey) return publicKey;

  try {
    const certsUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`;
    console.log('📡 Fetching Keycloak public key from:', certsUrl);

    const response = await axios.get(certsUrl);
    const keys = response.data.keys;

    if (!keys || keys.length === 0) {
      throw new Error('No keys found in Keycloak response');
    }

    // Get the first RSA key with x5c certificate
    const key = keys.find(k => k.kty === 'RSA' && k.x5c);
    if (!key) {
      throw new Error('No RSA key with x5c found');
    }

    // Format the certificate
    const cert = `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`;
    publicKey = cert;
    console.log('✅ Keycloak public key fetched successfully');

    return publicKey;
  } catch (error) {
    console.error('❌ Failed to fetch Keycloak public key:', error.message);
    throw error;
  }
}

/**
 * Middleware to verify JWT token from Keycloak
 */
export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.warn('⚠️  No Authorization header provided');
    return res.status(401).json({
      ok: false,
      error: 'No token provided. Please include Authorization header.'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.warn('⚠️  Invalid Authorization header format');
    return res.status(401).json({
      ok: false,
      error: 'Invalid Authorization header format. Use: Bearer <token>'
    });
  }

  const token = parts[1];

  try {
    // Fetch the public key if not already cached
    const cert = await fetchPublicKey();

    // Verify the JWT token
    const decoded = jwt.verify(token, cert, {
      algorithms: ['RS256'],
      issuer: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`
    });

    // Attach user info to request
    req.user = {
      id: decoded.sub,
      username: decoded.preferred_username,
      email: decoded.email,
      name: decoded.name,
      roles: decoded.realm_access?.roles || []
    };

    console.log('✅ Token verified for user:', req.user.username);
    next();
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);

    // Clear cached public key on verification errors (might be rotated)
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      publicKey = null;
    }

    return res.status(403).json({
      ok: false,
      error: 'Invalid or expired token',
      details: err.message
    });
  }
}

/**
 * Optional middleware - only verify token if present
 */
export async function optionalAuth(req, res, next) {
  if (req.headers.authorization) {
    return verifyToken(req, res, next);
  }
  next();
}
