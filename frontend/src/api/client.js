import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("access_token");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const url = originalRequest.url || "";

    if (
      status === 401 &&
      !originalRequest._retry &&
      !url.includes("/v1/login") &&
      !url.includes("/v1/register") &&
      !url.includes("/v1/refresh")
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        clearSessionAndRedirect();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/v1/refresh`, {
          refresh_token: refreshToken,
        });
        localStorage.setItem("access_token", data.access_token);
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${data.access_token}`,
        };
        return api(originalRequest);
      } catch (refreshError) {
        clearSessionAndRedirect();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

function clearSessionAndRedirect() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export function getApiMessage(error, fallback = "Something went wrong") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail?.message ||
    error?.response?.data?.detail ||
    error?.message ||
    fallback
  );
}
