import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import toast from "react-hot-toast";
import { removeToken } from "./auth";

let activeRequests = 0;

// 👉 Create instance
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 👉 Request Interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(btoa("token"));

      if (token) {
        config.headers.Authorization = `Bearer ${atob(token)}`;
      }
    }
    activeRequests += 1;
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// 👉 Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    activeRequests -= 1;
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        toast.error("Unauthorized - redirect to login");
        if (typeof window !== "undefined") {
          removeToken();
          window.location.href = '/login'
        }
      }

      if (status === 500) {
        toast.error("Server error");
      }
    } else {
      toast.error("Network error");
    }
    activeRequests -= 1;

    return Promise.reject(error);
  }
);

export default axiosInstance;