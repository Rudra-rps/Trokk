import { API_MODE, apiUrl } from "./config";
import * as mock from "./mock";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiResponse<T> {
  data: T;
  status: number;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  if (API_MODE === "mock") {
    return mock.handleRequest<T>(method, path, body);
  }

  const res = await fetch(apiUrl(path), {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(text || res.statusText, res.status);
  }

  const data = await res.json();
  return { data, status: res.status };
}

export function get<T>(path: string) {
  return request<T>("GET", path);
}

export function post<T>(path: string, body?: unknown) {
  return request<T>("POST", path, body);
}

export function put<T>(path: string, body?: unknown) {
  return request<T>("PUT", path, body);
}

export function patch<T>(path: string, body?: unknown) {
  return request<T>("PATCH", path, body);
}

export function del<T>(path: string) {
  return request<T>("DELETE", path);
}

export { ApiError };
