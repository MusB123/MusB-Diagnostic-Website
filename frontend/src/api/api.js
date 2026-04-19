import axios from 'axios';

/**
 * Bulletproof API instance for MusB Diagnostic.
 * Handles both Netlify Proxy (/api) and Direct Render URL (via env var).
 */
const getBaseURL = () => {
  // Use the Netlify environment variable (prefixed for React)
  let url = process.env.REACT_APP_API_URL || '';
  
  // Strip trailing slashes to avoid //api/... double-slashing
  return url.replace(/\/$/, '');
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000, // 60 second timeout for Render cold boots
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for production debugging & Automatic Token Injection
api.interceptors.request.use((config) => {
  // 1. Skip token injection for login/signup endpoints
  const isAuthEndpoint = config.url.endsWith('/login/') || config.url.endsWith('/signup/');
  
  if (!isAuthEndpoint) {
    // Check for various portal tokens
    const phlebToken = localStorage.getItem('phleb_token');
    const employerToken = localStorage.getItem('token');
    const researchToken = localStorage.getItem('research_token');
    const superAdminToken = localStorage.getItem('super_admin_token') || localStorage.getItem('admin_token');
    const hubToken = localStorage.getItem('hub_token');
    const reqUrl = config.url || '';
    let token = null;

    // Endpoint-aware token routing prevents wrong-role tokens from being sent.
    if (reqUrl.includes('/api/superadmin/')) {
      token = superAdminToken;
    } else if (reqUrl.includes('/api/phleb/hubs/')) {
      token = hubToken;
    } else if (reqUrl.includes('/api/phleb/')) {
      token = phlebToken;
    } else if (reqUrl.includes('/api/employers/')) {
      token = employerToken;
    } else if (reqUrl.includes('/api/research/')) {
      token = researchToken;
    } else {
      token = superAdminToken || phlebToken || employerToken || researchToken || hubToken;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  console.log(`🌐 [API Request] ${config.method.toUpperCase()} ${config.url}`);
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.message;
    console.error('❌ [API Error]', {
      url: error.config?.url,
      status: error.response?.status,
      message: errorMsg,
      data: error.response?.data // Professional detail exposure
    });
    return Promise.reject(error);
  }
);

export default api;
