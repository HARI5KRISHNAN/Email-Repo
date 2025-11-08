import axios from "axios";
import keycloak from "./keycloak";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8081/api",
});

// Add authentication interceptor
api.interceptors.request.use(async (config) => {
  if (keycloak && keycloak.token) {
    // Refresh token if it's about to expire
    if (keycloak.isTokenExpired()) {
      try {
        console.log('🔄 Refreshing expired Keycloak token...');
        await keycloak.updateToken(30);
        console.log('✅ Token refreshed successfully');
      } catch (error) {
        console.error("❌ Failed to refresh token", error);
        keycloak.login();
      }
    }
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  } else {
    console.warn('⚠️ No Keycloak token available for request:', config.url);
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - log message but don't force redirect
      console.log('Authentication required for this feature. Please login to access email features.');
      // Optionally, you could show a toast notification here instead of forcing login
    }
    return Promise.reject(error);
  }
);

export default api;
