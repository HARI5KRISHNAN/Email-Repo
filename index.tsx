
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
  onLoad: "login-required",
  checkLoginIframe: false, // Disable iframe for better compatibility
  pkceMethod: 'S256'
}).then((authenticated) => {
  if (!authenticated) {
    console.warn("Not authenticated!");
    keycloak.login();
  } else {
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
        keycloak.login();
      });
    }, 60000);

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App keycloak={keycloak} />
      </React.StrictMode>
    );
  }
}).catch((err) => {
  console.error("Keycloak init failed", err);
});
