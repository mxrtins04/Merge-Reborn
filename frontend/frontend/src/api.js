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
 * Standard API call helper.
 * @param {string} endpoint - The relative endpoint path (e.g. '/auth/login')
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<any>}
 */
export async function apiCall(endpoint, options = {}) {
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

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid, clear session
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
