import jwt from 'jsonwebtoken';

/**
 * Generate a JWT token for Jitsi Meet authentication
 * This token allows authenticated Keycloak users to join meetings
 * without any additional login prompts
 *
 * @param {Object} user - User information from Keycloak token
 * @param {string} user.name - User's display name
 * @param {string} user.email - User's email address
 * @param {string} user.sub - User's unique identifier
 * @param {string} roomName - Optional specific room name (default: allow all rooms)
 * @returns {string} JWT token for Jitsi
 */
export function generateJitsiToken(user, roomName = '*') {
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    // JWT standard claims
    aud: 'pilot180-jitsi',
    iss: 'pilot180-jitsi',
    sub: 'meet.pilot180.local',
    iat: now,
    nbf: now,
    exp: now + (60 * 60 * 2), // Token valid for 2 hours

    // Jitsi-specific claims
    room: roomName, // '*' allows access to all rooms
    context: {
      user: {
        id: user.sub || user.id,
        name: user.name || user.preferred_username || 'User',
        email: user.email || '',
        avatar: user.picture || '',
      },
      group: user.groups || [],
    },

    // Moderator privileges for all authenticated users
    // This prevents "waiting for moderator" screens
    moderator: true,

    // Additional features
    features: {
      livestreaming: false,
      recording: false,
      transcription: false,
      'outbound-call': false,
    },
  };

  // Use the same secret as configured in docker-compose.jitsi.yml
  const secret = process.env.JITSI_JWT_SECRET || 'ChangeMeToRandomSecret123!';

  // Sign the token with HS256 algorithm
  const token = jwt.sign(payload, secret, {
    algorithm: 'HS256',
    header: {
      typ: 'JWT',
      alg: 'HS256',
    },
  });

  console.log(`✅ Generated Jitsi token for user: ${payload.context.user.name} (room: ${roomName})`);

  return token;
}

/**
 * Validate a Jitsi JWT token
 * @param {string} token - JWT token to validate
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export function validateJitsiToken(token) {
  try {
    const secret = process.env.JITSI_JWT_SECRET || 'ChangeMeToRandomSecret123!';
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      audience: 'pilot180-jitsi',
      issuer: 'pilot180-jitsi',
    });
    return decoded;
  } catch (error) {
    console.error('❌ Jitsi token validation failed:', error.message);
    return null;
  }
}
