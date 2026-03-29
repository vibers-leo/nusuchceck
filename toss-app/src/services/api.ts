/**
 * API 클라이언트 — 토스 미니앱용
 * JWT 인증 기반, 타임아웃/재시도 포함
 */

import { API_URL, CONFIG } from '../constants/config';

// --- 토큰 관리 ---
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

// --- 타임아웃 ---
const fetchWithTimeout = (url: string, options: RequestInit, timeout: number): Promise<Response> => {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ]);
};

// --- 재시도 ---
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  timeout: number,
  retryCount: number = CONFIG.API_RETRY_COUNT,
  retryDelay: number = CONFIG.API_RETRY_DELAY
): Promise<Response> => {
  let lastError: Error | null = null;

  for (let i = 0; i <= retryCount; i++) {
    try {
      const response = await fetchWithTimeout(url, options, timeout);

      // 5xx 서버 오류는 재시도
      if (response.status >= 500 && i < retryCount) {
        lastError = new Error(`Server error: ${response.status}`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (i + 1)));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      if (i < retryCount && (error as Error).message.includes('Network')) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (i + 1)));
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error('Request failed after retries');
};

// --- API 클라이언트 옵션 ---
interface ApiClientOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retry?: boolean;
}

// --- 기본 API 클라이언트 ---
const apiClient = async <T = any>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> => {
  const {
    method = 'GET',
    body,
    headers = {},
    timeout = CONFIG.API_TIMEOUT,
    retry = true,
  } = options;

  const url = `${API_URL}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // JWT 토큰이 있으면 자동 첨부
  if (authToken) {
    requestHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = retry
      ? await fetchWithRetry(url, requestOptions, timeout)
      : await fetchWithTimeout(url, requestOptions, timeout);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
    throw error;
  }
};

// --- HTTP 메서드별 편의 함수 ---
const api = {
  get: <T = any>(endpoint: string, options?: Omit<ApiClientOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: Omit<ApiClientOptions, 'method'>) =>
    apiClient<T>(endpoint, { ...options, body, method: 'POST' }),

  patch: <T = any>(endpoint: string, body?: any, options?: Omit<ApiClientOptions, 'method'>) =>
    apiClient<T>(endpoint, { ...options, body, method: 'PATCH' }),

  put: <T = any>(endpoint: string, body?: any, options?: Omit<ApiClientOptions, 'method'>) =>
    apiClient<T>(endpoint, { ...options, body, method: 'PUT' }),

  delete: <T = any>(endpoint: string, options?: Omit<ApiClientOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
