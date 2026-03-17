import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("edushare_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const parseApiError = (error, fallback = "Something went wrong") => {
  return error?.response?.data?.message || error?.message || fallback;
};

export default api;
