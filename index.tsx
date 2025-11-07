
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import keycloak from './keycloak';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Initialize Keycloak before mounting the app
keycloak.init({
  onLoad: "check-sso", // Check login status but don't force login
  checkLoginIframe: false, // Disable iframe for better compatibility
  pkceMethod: 'S256'
}).then((authenticated) => {
  if (authenticated) {
    console.log("Authenticated as:", keycloak.tokenParsed?.preferred_username);
    console.log("User email:", keycloak.tokenParsed?.email);

    // Setup token refresh - refresh token every 60 seconds if needed
    setInterval(() => {
      keycloak.updateToken(70).then((refreshed) => {
        if (refreshed) {
          console.log('Token refreshed');
        }
      }).catch(() => {
        console.error('Failed to refresh token');
        // Don't force login on refresh failure
        console.log('Token refresh failed - user will need to re-login for email features');
      });
    }, 60000);
  } else {
    console.log("Not authenticated - limited features available (video calls work)");
  }

  // Mount app regardless of authentication status
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App keycloak={keycloak} />
    </React.StrictMode>
  );
}).catch((err) => {
  console.error("Keycloak init failed", err);
  // Mount app anyway for video calls
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App keycloak={keycloak} />
    </React.StrictMode>
  );
});
