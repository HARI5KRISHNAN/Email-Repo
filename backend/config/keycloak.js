import session from 'express-session';
import Keycloak from 'keycloak-connect';
import dotenv from 'dotenv';
dotenv.config();

let keycloak;
const memoryStore = new session.MemoryStore();

export function initKeycloak(app) {
  if (keycloak) return keycloak;

  app.use(session({
    secret: process.env.SESSION_SECRET || 'pilot180-secret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore
  }));

  const config = {
    realm: process.env.KEYCLOAK_REALM || 'pilot180',
    "auth-server-url": process.env.KEYCLOAK_URL || 'http://localhost:8080/',
    "ssl-required": "none",
    resource: process.env.KEYCLOAK_CLIENT_ID || 'ai-email-assistant',
    "bearer-only": true, // Don't redirect, just validate bearer tokens
    "public-client": true, // Frontend is a public client
    "confidential-port": 0
  };

  // Only add credentials if secret is provided (for confidential clients)
  if (process.env.KEYCLOAK_CLIENT_SECRET) {
    config.credentials = { secret: process.env.KEYCLOAK_CLIENT_SECRET };
    config["public-client"] = false;
  }

  keycloak = new Keycloak({ store: memoryStore }, config);

  app.use(keycloak.middleware());

  console.log('Keycloak initialized');
  return keycloak;
}

export { keycloak };
