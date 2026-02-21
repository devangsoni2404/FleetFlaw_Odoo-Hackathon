import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
          })
          
          localStorage.setItem('accessToken', data.data.accessToken)
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  refresh: () => {
    const refreshToken = localStorage.getItem('refreshToken')
    return axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
      headers: { Authorization: `Bearer ${refreshToken}` }
    })
  },
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) => 
    api.patch('/auth/change-password', { currentPassword, newPassword }),
}

// Dashboard API
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
}

// Vehicles API
export const vehiclesAPI = {
  getAll: (params) => api.get('/vehicles', { params }),
  getAvailable: () => api.get('/vehicles/available'),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  updateStatus: (id, status) => api.patch(`/vehicles/${id}/retire`, { status }),
  delete: (id) => api.delete(`/vehicles/${id}`),
}

// Drivers API
export const driversAPI = {
  getAll: (params) => api.get('/drivers', { params }),
  getAvailable: () => api.get('/drivers/available'),
  getById: (id) => api.get(`/drivers/${id}`),
  getStatusHistory: (id) => api.get(`/drivers/${id}/status-history`),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  updateStatus: (id, status, reason) => api.patch(`/drivers/${id}/status`, { status, reason }),
  delete: (id) => api.delete(`/drivers/${id}`),
}

// Shipments API
export const shipmentsAPI = {
  getAll: (params) => api.get('/shipments', { params }),
  getById: (id) => api.get(`/shipments/${id}`),
  create: (data) => api.post('/shipments', data),
  update: (id, data) => api.put(`/shipments/${id}`, data),
  delete: (id) => api.delete(`/shipments/${id}`),
}

// Trips API
export const tripsAPI = {
  getAll: (params) => api.get('/trips', { params }),
  getById: (id) => api.get(`/trips/${id}`),
  create: (data) => api.post('/trips', data),
  complete: (id, data) => api.patch(`/trips/${id}/complete`, data),
  cancel: (id, reason) => api.patch(`/trips/${id}/cancel`, { cancelled_reason: reason }),
}

// Maintenance API
export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  complete: (id, data) => api.patch(`/maintenance/${id}/complete`, data),
  cancel: (id) => api.patch(`/maintenance/${id}/cancel`),
}

// Fuel API
export const fuelAPI = {
  getAll: (params) => api.get('/fuel', { params }),
  create: (data) => api.post('/fuel', data),
  delete: (id) => api.delete(`/fuel/${id}`),
}

// Expenses API
export const expensesAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  approve: (id) => api.patch(`/expenses/${id}/approve`),
  delete: (id) => api.delete(`/expenses/${id}`),
}

// Analytics API
export const analyticsAPI = {
  get: () => api.get('/dashboard'),
  fuelEfficiency: (params) => api.get('/analytics/fuel-efficiency', { params }),
  vehicleROI: (params) => api.get('/analytics/vehicle-roi', { params }),
  monthlyFinancials: (params) => api.get('/analytics/monthly-financials', { params }),
  driverPerformance: (params) => api.get('/analytics/driver-performance', { params }),
  costPerKm: (params) => api.get('/analytics/cost-per-km', { params }),
  safetyDashboard: () => api.get('/analytics/safety-dashboard'),
  exportCSV: (type) => api.get(`/analytics/export/csv/${type}`, { responseType: 'blob' }),
  exportPDF: (type) => api.get(`/analytics/export/pdf/${type}`, { responseType: 'blob' }),
}

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  toggleActive: (id) => api.patch(`/users/${id}/toggle-active`),
  delete: (id) => api.delete(`/users/${id}`),
}

export default api
