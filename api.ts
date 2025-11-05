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
        await keycloak.updateToken(30);
      } catch (error) {
        console.error("Failed to refresh token", error);
        keycloak.login();
      }
    }
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      keycloak.login();
    }
    return Promise.reject(error);
  }
);

export default api;
