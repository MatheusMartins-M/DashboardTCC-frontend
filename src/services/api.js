import axios from "axios";
import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  saveAccessToken,
} from "./authStorage";

const baseURL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL,
});

let refreshPromise = null;

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error("Refresh token ausente.");
  }

  const response = await axios.post(`${baseURL}/auth/refresh/`, { refresh });
  const access = response.data?.access;
  if (!access) {
    throw new Error("Resposta de refresh inválida.");
  }

  saveAccessToken(access);
  return access;
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isUnauthorized = error.response?.status === 401;
    const canRetry = originalRequest && !originalRequest._retry;
    const hasRefresh = Boolean(getRefreshToken());
    const isAuthEndpoint = originalRequest?.url?.includes("/auth/login/")
      || originalRequest?.url?.includes("/auth/refresh/")
      || originalRequest?.url?.includes("/auth/mfa/verificar/");

    if (!isUnauthorized || !canRetry || !hasRefresh || isAuthEndpoint) {
      throw error;
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const access = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${access}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearAuth();
      throw refreshError;
    }
  },
);
