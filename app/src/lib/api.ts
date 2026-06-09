let accessToken: string | null = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getRefreshToken = () => localStorage.getItem('refreshToken');
export const setRefreshToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('refreshToken', token);
  } else {
    localStorage.removeItem('refreshToken');
  }
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005/api/v1';

interface RequestOptions extends RequestInit {
  json?: any;
}

async function request(path: string, options: RequestOptions = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});

  const token = getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.json) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.json);
  }

  options.headers = headers;

  let response = await fetch(url, options);

  if (response.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/refresh')) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.set('Authorization', `Bearer ${getAccessToken()}`);
      response = await fetch(url, options);
    } else {
      setAccessToken(null);
      setRefreshToken(null);
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error?.message || errorMsg;
    } catch (err) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function tryRefresh(): Promise<boolean> {
  const rToken = getRefreshToken();
  if (!rToken) return false;

  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh(() => {
        resolve(true);
      });
    });
  }

  isRefreshing = true;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: rToken }),
    });

    if (!res.ok) {
      isRefreshing = false;
      return false;
    }

    const data = await res.json();
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    isRefreshing = false;
    onRefreshed(data.accessToken);
    return true;
  } catch (err) {
    isRefreshing = false;
    return false;
  }
}

export const api = {
  get: (path: string, options?: RequestOptions) => request(path, { ...options, method: 'GET' }),
  post: (path: string, json?: any, options?: RequestOptions) => request(path, { ...options, method: 'POST', json }),
  patch: (path: string, json?: any, options?: RequestOptions) => request(path, { ...options, method: 'PATCH', json }),
  del: (path: string, options?: RequestOptions) => request(path, { ...options, method: 'DELETE' }),
  
  upload: async (path: string, file: File) => {
    const url = `${BASE_URL}${path}`;
    const formData = new FormData();
    formData.append('file', file);
    
    const headers = new Headers();
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });
    
    if (!response.ok) {
      let errorMsg = 'Upload failed';
      try {
        const errJson = await response.json();
        errorMsg = errJson.error?.message || errorMsg;
      } catch (err) {}
      throw new Error(errorMsg);
    }
    
    return response.json();
  },
  
  sse: (path: string) => {
    const token = getAccessToken() || '';
    return new EventSource(`${BASE_URL}${path}?token=${encodeURIComponent(token)}`);
  }
};
