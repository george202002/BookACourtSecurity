import type { NavigateFunction } from "react-router-dom";
import TokenUtils from "./TokenUtils";
import authService from "../services/AuthService";

export interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: string;
  requiresAuth?: boolean;
}

class HttpClient {
  private static baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

  /**
   * Makes an HTTP request with automatic Firebase token handling and 401 response interception
   * @param url - The endpoint URL (relative to base URL)
   * @param navigate - React Router navigate function for redirecting to login
   * @param config - Request configuration
   * @returns Promise<Response>
   */
  static async request(
    url: string,
    navigate: NavigateFunction,
    config: RequestConfig = {},
  ): Promise<Response> {
    const { method = "GET", headers = {}, body, requiresAuth = true } = config;

    // Prepare request headers
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    // Add authorization header if authentication is required
    if (requiresAuth) {
      const token = await TokenUtils.getToken(navigate);
      if (!token) {
        // Token is null, user already redirected to login by TokenUtils.getToken
        throw new Error("Unauthorized: No valid token available");
      }
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    // Make the request
    const response = await fetch(`${this.baseUrl}${url}`, {
      method,
      headers: requestHeaders,
      body,
      credentials: method === "POST" && !requiresAuth ? "include" : undefined,
    });

    // Handle 401 and 403 Unauthorized responses
    if ((response.status === 401 || response.status === 403) && requiresAuth) {
      // Clear Firebase auth and stored user data
      try {
        await authService.logout();
      } catch {
        // Ignore logout errors, just clear local data
        TokenUtils.clearUser();
      }
      // Redirect to login page
      navigate("/");
      throw new Error("Unauthorized: Token expired or invalid");
    }

    return response;
  }

  /**
   * Makes a GET request
   */
  static async get(
    url: string,
    navigate: NavigateFunction,
    requiresAuth = true,
  ): Promise<Response> {
    return this.request(url, navigate, { method: "GET", requiresAuth });
  }

  /**
   * Makes a POST request
   */
  static async post(
    url: string,
    navigate: NavigateFunction,
    data?: unknown,
    requiresAuth = true,
  ): Promise<Response> {
    return this.request(url, navigate, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      requiresAuth,
    });
  }

  /**
   * Makes a PUT request
   */
  static async put(
    url: string,
    navigate: NavigateFunction,
    data?: unknown,
    requiresAuth = true,
  ): Promise<Response> {
    return this.request(url, navigate, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      requiresAuth,
    });
  }

  /**
   * Makes a DELETE request
   */
  static async delete(
    url: string,
    navigate: NavigateFunction,
    requiresAuth = true,
  ): Promise<Response> {
    return this.request(url, navigate, { method: "DELETE", requiresAuth });
  }
}

export default HttpClient;
