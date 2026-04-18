/**
 * API Service — Centralized HTTP utility for communicating with the Django backend.
 * All API calls go through this file. When the database is connected later,
 * no changes will be needed here — the backend endpoints stay the same.
 */

const API_BASE = '/api';

// Simple in-memory cache to prevent redundant fetches
const apiCache = new Map();

async function request(endpoint, options = {}) {
  const isCacheable = options.method === 'GET' || !options.method;
  const cacheKey = endpoint;

  if (isCacheable && apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  // Invalidate cache on mutations (POST, PUT, DELETE, PATCH)
  if (!isCacheable) {
    apiCache.clear();
  }

  const url = `${API_BASE}${endpoint}`;
  const { headers, ...restOptions } = options;
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...restOptions,
  };

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    let data = null;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // It's HTML or plain text (likely a server-level crash or gateway timeout)
      const text = await response.text();
      console.warn(`[API] Received non-JSON response from ${endpoint}:`, text.substring(0, 100));
      data = { 
        error: 'Backend Communication Error', 
        message: `Server returned ${response.status} (${response.statusText}).`,
        is_html: true 
      };
    }

    const result = { data, ok: response.ok, status: response.status };
    
    // Cache successful GET requests
    if (isCacheable && response.ok) {
      apiCache.set(cacheKey, result);
    }

    return result;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    return { data: null, ok: false, status: 0, error };
  }
}

// ==================== HOME ====================
export const homeAPI = {
  getHero: () => request('/home/hero/'),
  getServices: () => request('/home/services/'),
  getTestimonials: () => request('/home/testimonials/'),
  getPopularPanels: () => request('/home/popular-panels/'),
  getOffers: () => request('/offers/'),
  subscribeNewsletter: (email) =>
    request('/home/newsletter/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

// ==================== CATALOG ====================
export const catalogAPI = {
  getCategories: () => request('/catalog/categories/'),
  getTests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/catalog/tests/${query ? '?' + query : ''}`);
  },
  getTestById: (id) => request(`/catalog/tests/${id}/`),
};

// ==================== OFFERS ====================
export const offersAPI = {
  getOffers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/offers/${query ? '?' + query : ''}`);
  },
  getOfferById: (id) => request(`/offers/${id}/`),
};

// ==================== BOOKINGS ====================
export const bookingsAPI = {
  createBooking: (bookingData) =>
    request('/bookings/', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }),
  getBookableTests: () => request('/bookings/tests/'),
};

// ==================== EMPLOYERS ====================
export const employersAPI = {
  getPlans: () => request('/employers/plans/'),
  getComparison: () => request('/employers/comparison/'),
  signup: (data) => request('/employers/signup/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getStats: (token) => request('/employers/dashboard/stats/', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getEmployees: (token) => request('/employers/employees/', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  addEmployee: (employeeData, token) => request('/employers/employees/', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(employeeData)
  }),
  deleteEmployee: (id, token) => request(`/employers/employees/${id}/`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  }),
  submitOnsiteRequest: (formData, token) => request('/employers/onsite/', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(formData)
  }),
  getBilling: (token) => request('/employers/billing/', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  selectPlan: (planId, token) => request('/employers/select-plan/', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ plan_id: planId })
  }),
  sendInviteEmail: (employeeId, token) => request(`/employers/employees/${employeeId}/send-email/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  }),
  verifyEnrollment: (token) => request(`/employers/enroll/verify/${token}/`),
  completeEnrollment: (token, data) => request(`/employers/enroll/complete/${token}/`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
};

// ==================== RESEARCH ====================
export const researchAPI = {
  getStats: () => request('/research/stats/'),
  getServices: () => request('/research/services/'),
  getBiorepository: () => request('/research/biorepository/'),
  getCollaborations: () => request('/research/collaborations/'),
  submitQuote: (quoteData) =>
    request('/research/quote/', {
      method: 'POST',
      body: JSON.stringify(quoteData),
    }),
  subscribeNewsletter: (email) =>
    request('/research/newsletter/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  submitValidation: (data) =>
    request('/research/validation/submit/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getValidationTracker: () => request('/research/validation/tracker/'),
};

// ==================== DIAGNOSTIC PANEL ====================
export const diagnosticAPI = {
  getTasks: (projectId) => request(`/research/diag/tasks/${projectId ? '?project_id=' + projectId : ''}`),
  createTask: (data) => request('/research/diag/tasks/', { method: 'POST', body: JSON.stringify(data) }),
  
  getMessages: (projectId) => request(`/research/diag/messages/${projectId ? '?project_id=' + projectId : ''}`),
  sendMessage: (data) => request('/research/diag/messages/', { method: 'POST', body: JSON.stringify(data) }),
  
  getDocuments: (projectId) => request(`/research/diag/documents/${projectId ? '?project_id=' + projectId : ''}`),
  uploadDocument: (data) => request('/research/diag/documents/', { method: 'POST', body: JSON.stringify(data) }),
  
  getInvoices: (projectId) => request(`/research/diag/invoices/${projectId ? '?project_id=' + projectId : ''}`),
  createInvoice: (data) => request('/research/diag/invoices/', { method: 'POST', body: JSON.stringify(data) }),
  
  getPipeline: () => request('/research/diag/pipeline/'),
  updatePipeline: (data) => request('/research/diag/pipeline/', { method: 'PATCH', body: JSON.stringify(data) }),
};

// ==================== SUPER ADMIN ====================
export const superAdminAPI = {
  // Catalog Mgt
  getAdminTests: () => request('/superadmin/catalog/tests/'),
  createTest: (data) => request('/superadmin/catalog/tests/create/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateTest: (id, data) => request(`/superadmin/catalog/tests/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteTest: (id) => request(`/superadmin/catalog/tests/${id}/delete/`, {
    method: 'DELETE'
  }),
  toggleTest: (id) => request(`/superadmin/catalog/tests/${id}/toggle/`, {
    method: 'PATCH'
  }),
};
