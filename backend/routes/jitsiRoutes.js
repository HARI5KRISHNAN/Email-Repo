import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { generateJitsiToken } from '../services/jitsiService.js';

const router = express.Router();

// Helper to extract user from Keycloak token
function getUser(req) {
  const tokenContent = req.kauth?.grant?.access_token?.content;
  return {
    sub: tokenContent?.sub,
    name: tokenContent?.name || tokenContent?.preferred_username,
    preferred_username: tokenContent?.preferred_username,
    email: tokenContent?.email,
    picture: tokenContent?.picture,
    groups: tokenContent?.groups || [],
  };
}

/**
 * GET /api/jitsi/token
 * Get a JWT token for joining Jitsi meetings
 * Requires Keycloak authentication
 */
router.get('/jitsi/token', authenticateToken, (req, res) => {
  try {
    const user = getUser(req);
    const roomName = req.query.room || '*'; // Optional room name from query param

    if (!user.sub) {
      return res.status(400).json({
        ok: false,
        error: 'User information not found in token',
      });
    }

    // Generate JWT token for Jitsi
    const jitsiToken = generateJitsiToken(user, roomName);

    console.log(`📹 Jitsi token generated for ${user.name || user.preferred_username}`);

    res.json({
      ok: true,
      token: jitsiToken,
      user: {
        id: user.sub,
        name: user.name || user.preferred_username,
        email: user.email,
      },
      expiresIn: 7200, // 2 hours in seconds
    });
  } catch (error) {
    console.error('❌ Error generating Jitsi token:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to generate Jitsi token',
    });
  }
});

/**
 * POST /api/jitsi/token
 * Generate token for a specific room
 * Request body: { roomName: 'abc123' }
 */
router.post('/jitsi/token', authenticateToken, (req, res) => {
  try {
    const user = getUser(req);
    const { roomName } = req.body;

    if (!user.sub) {
      return res.status(400).json({
        ok: false,
        error: 'User information not found in token',
      });
    }

    if (!roomName) {
      return res.status(400).json({
        ok: false,
        error: 'Room name is required',
      });
    }

    // Generate JWT token for specific room
    const jitsiToken = generateJitsiToken(user, roomName);

    console.log(`📹 Jitsi token generated for ${user.name || user.preferred_username} (room: ${roomName})`);

    res.json({
      ok: true,
      token: jitsiToken,
      roomName: roomName,
      user: {
        id: user.sub,
        name: user.name || user.preferred_username,
        email: user.email,
      },
      expiresIn: 7200,
    });
  } catch (error) {
    console.error('❌ Error generating Jitsi token:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to generate Jitsi token',
    });
  }
});

/**
 * GET /api/jitsi/config
 * Get Jitsi configuration (domain, etc.)
 */
router.get('/jitsi/config', (req, res) => {
  res.json({
    ok: true,
    config: {
      domain: process.env.JITSI_DOMAIN || 'localhost',
      secure: process.env.JITSI_SECURE === 'true',
      port: process.env.JITSI_PORT || 8000,
    },
  });
});

export default router;
