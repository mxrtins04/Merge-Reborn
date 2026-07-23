const BASE_URL = '/api/v1';

/**
 * Custom error class for API response errors.
 */
export class ApiError extends Error {
  constructor(status, statusText, data) {
    // RFC 7807 ProblemDetail: prefer `detail`, fall back to `title`, then statusText
    const message =
      (typeof data === 'object' ? data?.detail || data?.title : null) ||
      statusText ||
      `Server error (${status})`;
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

/**
 * In-flight refresh promise. Ensures multiple concurrent 401s only trigger
 * one refresh call, not one per failed request.
 */
let refreshPromise = null;

/**
 * Attempts to refresh the access token using the HttpOnly refresh_token cookie.
 * Returns the new access token on success, or throws if the refresh fails.
 */
async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include', // send the HttpOnly refresh_token cookie
  }).then(async (res) => {
    if (!res.ok) {
      // Refresh token expired or revoked — clear session
      localStorage.removeItem('merge_jwt');
      localStorage.removeItem('merge_student');
      throw new Error('Session expired. Please log in again.');
    }
    const data = await res.json();
    localStorage.setItem('merge_jwt', data.accessToken);
    return data.accessToken;
  }).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * Core fetch wrapper. Attaches the Bearer token, parses the response, and
 * throws an ApiError for non-2xx responses.
 *
 * @param {string} endpoint - The relative endpoint path (e.g. '/auth/login')
 * @param {object} options  - Fetch options (method, body, headers, etc.)
 * @param {boolean} _isRetry - Internal flag; prevents infinite refresh loops.
 * @returns {Promise<any>}
 */
export async function apiCall(endpoint, options = {}, _isRetry = false) {
  const token = localStorage.getItem('merge_jwt');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  const config = {
    ...options,
    headers,
    credentials: 'include', // always include cookies (needed for refresh flow)
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }

  if (response.status === 204) {
    return null;
  }

  // -----------------------------------------------------------------------
  // Silent token refresh: on 401, attempt one refresh and retry the request.
  // Skip refresh for auth endpoints themselves to avoid loops.
  // -----------------------------------------------------------------------
  if (response.status === 401 && !_isRetry && !endpoint.includes('/auth/')) {
    try {
      await refreshAccessToken();
      // Retry the original request with the new token
      return apiCall(endpoint, options, true);
    } catch {
      // Refresh failed — session is gone, propagate the 401
      throw new ApiError(401, 'Unauthorized', { detail: 'Session expired. Please log in again.' });
    }
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && (contentType.includes('application/json') || contentType.includes('application/problem+json'))) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    if (response.status === 401) {
      // If we still get 401 after a retry, clear session
      localStorage.removeItem('merge_jwt');
      localStorage.removeItem('merge_student');
    }
    throw new ApiError(response.status, response.statusText, data);
  }

  return data;
}

export const api = {
  get: (endpoint, options = {}) => apiCall(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiCall(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => apiCall(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) => apiCall(endpoint, { ...options, method: 'DELETE' }),
};
