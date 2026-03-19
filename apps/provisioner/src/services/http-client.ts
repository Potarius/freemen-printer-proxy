/**
 * HTTP Client Service
 * Uses Tauri native HTTP when available (bypasses CORS)
 * Falls back to browser fetch for web-only testing
 */

import { invoke } from '@tauri-apps/api/tauri';

// ============================================
// TYPES
// ============================================

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
}

export interface HttpResponse<T = unknown> {
  status: number;
  data: T;
  ok: boolean;
}

export type HttpErrorCategory = 
  | 'network'        // No internet or DNS failure
  | 'connection'     // Server unreachable
  | 'timeout'        // Request timed out
  | 'cors'           // CORS blocked (browser only)
  | 'auth'           // 401/403 errors
  | 'client'         // 4xx errors
  | 'server'         // 5xx errors
  | 'parse'          // JSON parse error
  | 'unknown';       // Unknown error

export class HttpError extends Error {
  public readonly category: HttpErrorCategory;
  public readonly status: number;
  public readonly details?: string;

  constructor(message: string, category: HttpErrorCategory, status = 0, details?: string) {
    super(message);
    this.name = 'HttpError';
    this.category = category;
    this.status = status;
    this.details = details;
  }

  getUserMessage(): string {
    switch (this.category) {
      case 'network':
        return 'No internet connection. Please check your network settings.';
      case 'connection':
        return 'Unable to reach the server. Please try again later.';
      case 'timeout':
        return 'The request timed out. Please try again.';
      case 'cors':
        return 'Request blocked by browser security. Please use the desktop app.';
      case 'auth':
        return 'Authentication failed. Please check your credentials.';
      case 'client':
        return this.message || 'Invalid request. Please check your input.';
      case 'server':
        return 'Server error. Please try again later.';
      case 'parse':
        return 'Invalid response from server.';
      default:
        return this.message || 'An unexpected error occurred.';
    }
  }
}

// ============================================
// TAURI DETECTION
// ============================================

function isTauri(): boolean {
  return typeof window !== 'undefined' && 
         '__TAURI__' in window;
}

// ============================================
// TAURI HTTP REQUEST
// ============================================

interface TauriHttpRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
}

interface TauriHttpResponse {
  status: number;
  body: string;
  error: string | null;
}

async function tauriRequest<T>(
  url: string,
  options: HttpRequestOptions = {}
): Promise<HttpResponse<T>> {
  const method = options.method || 'GET';
  const headers = options.headers || {};
  
  let bodyStr: string | null = null;
  if (options.body) {
    bodyStr = typeof options.body === 'string' 
      ? options.body 
      : JSON.stringify(options.body);
  }

  const request: TauriHttpRequest = {
    url,
    method,
    headers,
    body: bodyStr,
  };

  console.debug('[HTTP] Tauri request:', method, url);

  try {
    const response = await invoke<TauriHttpResponse>('http_request', { request });

    // Check for Tauri-level errors
    if (response.error) {
      console.error('[HTTP] Tauri error:', response.error);
      
      // Categorize the error
      if (response.error.includes('Connection failed')) {
        throw new HttpError(response.error, 'connection', 0, response.error);
      } else if (response.error.includes('timed out')) {
        throw new HttpError(response.error, 'timeout', 0, response.error);
      } else {
        throw new HttpError(response.error, 'network', 0, response.error);
      }
    }

    // Parse the response body
    let data: T;
    try {
      data = response.body ? JSON.parse(response.body) : ({} as T);
    } catch {
      // Return raw string if not JSON
      data = response.body as unknown as T;
    }

    const ok = response.status >= 200 && response.status < 300;
    
    console.debug('[HTTP] Response:', response.status, ok ? 'OK' : 'ERROR');

    return {
      status: response.status,
      data,
      ok,
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    console.error('[HTTP] Invoke error:', error);
    throw new HttpError(
      `Tauri request failed: ${(error as Error).message}`,
      'unknown',
      0,
      (error as Error).message
    );
  }
}

// ============================================
// BROWSER FETCH REQUEST
// ============================================

async function browserRequest<T>(
  url: string,
  options: HttpRequestOptions = {}
): Promise<HttpResponse<T>> {
  const method = options.method || 'GET';
  const headers = options.headers || {};
  
  let body: string | undefined;
  if (options.body) {
    body = typeof options.body === 'string' 
      ? options.body 
      : JSON.stringify(options.body);
  }

  console.debug('[HTTP] Browser fetch:', method, url);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
    });

    // Parse response
    let data: T;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        throw new HttpError('Failed to parse JSON response', 'parse', response.status);
      }
    } else {
      data = await response.text() as unknown as T;
    }

    const ok = response.ok;
    
    console.debug('[HTTP] Response:', response.status, ok ? 'OK' : 'ERROR');

    return {
      status: response.status,
      data,
      ok,
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    const err = error as Error;
    console.error('[HTTP] Fetch error:', err.message);
    
    // Categorize fetch errors
    if (err.name === 'TypeError') {
      // TypeError usually means network error or CORS
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        // Check if it's likely a CORS issue (browser-only)
        if (url.startsWith('https://api.cloudflare.com')) {
          throw new HttpError(
            'Cloudflare API blocked by browser CORS policy. Use the desktop app for full functionality.',
            'cors',
            0,
            err.message
          );
        }
        throw new HttpError(
          'Network error. Check your internet connection.',
          'network',
          0,
          err.message
        );
      }
    }
    
    if (err.name === 'AbortError') {
      throw new HttpError('Request was cancelled', 'timeout', 0, err.message);
    }
    
    throw new HttpError(
      `Request failed: ${err.message}`,
      'unknown',
      0,
      err.message
    );
  }
}

// ============================================
// MAIN HTTP CLIENT
// ============================================

/**
 * Make an HTTP request
 * Uses Tauri native HTTP when available (bypasses CORS)
 * Falls back to browser fetch otherwise
 */
export async function httpRequest<T = unknown>(
  url: string,
  options: HttpRequestOptions = {}
): Promise<HttpResponse<T>> {
  if (isTauri()) {
    return tauriRequest<T>(url, options);
  } else {
    return browserRequest<T>(url, options);
  }
}

/**
 * Convenience method for GET requests
 */
export async function httpGet<T = unknown>(
  url: string,
  headers?: Record<string, string>
): Promise<HttpResponse<T>> {
  return httpRequest<T>(url, { method: 'GET', headers });
}

/**
 * Convenience method for POST requests
 */
export async function httpPost<T = unknown>(
  url: string,
  body: object,
  headers?: Record<string, string>
): Promise<HttpResponse<T>> {
  return httpRequest<T>(url, { method: 'POST', body, headers });
}

/**
 * Convenience method for PUT requests
 */
export async function httpPut<T = unknown>(
  url: string,
  body: object,
  headers?: Record<string, string>
): Promise<HttpResponse<T>> {
  return httpRequest<T>(url, { method: 'PUT', body, headers });
}

/**
 * Convenience method for DELETE requests
 */
export async function httpDelete<T = unknown>(
  url: string,
  headers?: Record<string, string>
): Promise<HttpResponse<T>> {
  return httpRequest<T>(url, { method: 'DELETE', headers });
}

/**
 * Check if running in Tauri environment
 */
export { isTauri };
