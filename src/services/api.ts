import axios from 'axios';

// Set API Backend Base URL (defaults to Express server /api routes)
const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor: Attach Active User Role and Patient ID for Server-Side RBAC Enforcement
apiClient.interceptors.request.use(
  (config) => {
    let currentRole = 'patient';
    try {
      const stored = localStorage.getItem('syrian_hosp_userRole');
      if (stored) {
        currentRole = JSON.parse(stored);
      }
    } catch {
      currentRole = 'patient';
    }

    config.headers['x-user-role'] = currentRole;
    config.headers['x-patient-id'] = 'pat-1';

    const token = localStorage.getItem('care_hospital_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('care_hospital_token');
      localStorage.removeItem('care_hospital_user');
      // Redirect to login if needed
    }
    return Promise.reject(error);
  }
);

// High-level API Methods for Care Hospital System
export const hospitalApi = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    apiClient.post('/login', credentials),
  logout: () => apiClient.post('/logout'),
  getCurrentUser: () => apiClient.get('/me'),

  // Dashboard Stats
  getDashboardStats: () => apiClient.get('/dashboard/stats'),

  // Patients
  getPatients: (search?: string) => apiClient.get('/patients', { params: { search } }),
  getPatientById: (id: string) => apiClient.get(`/patients/${id}`),
  createPatient: (data: any) => apiClient.post('/patients', data),
  updatePatient: (id: string, data: any) => apiClient.put(`/patients/${id}`, data),
  deletePatient: (id: string) => apiClient.delete(`/patients/${id}`),
  uploadPatientScan: (id: string, formData: FormData) =>
    apiClient.post(`/patients/${id}/scans`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Doctors
  getDoctors: () => apiClient.get('/doctors'),
  updateDoctorStatus: (id: string, status: string) =>
    apiClient.patch(`/doctors/${id}/status`, { status }),

  // Appointments
  getAppointments: () => apiClient.get('/appointments'),
  createAppointment: (data: any) => apiClient.post('/appointments', data),
  updateAppointmentStatus: (id: string, status: string) =>
    apiClient.patch(`/appointments/${id}/status`, { status }),

  // Inventory & Pharmacy
  getInventory: () => apiClient.get('/inventory'),
  addInventoryItem: (data: any) => apiClient.post('/inventory', data),
  deleteInventoryItem: (id: string) => apiClient.delete(`/inventory/${id}`),

  // Lab & Prescriptions
  getLabResults: () => apiClient.get('/lab-results'),
  getPrescriptions: () => apiClient.get('/prescriptions'),

  // Billing & Invoices
  getInvoices: () => apiClient.get('/invoices'),
  createInvoice: (data: any) => apiClient.post('/invoices', data),

  // Server RBAC & Permissions Enforcement
  verifyPermissions: () => apiClient.get('/auth/permissions'),
  getServerRbacStatus: () => apiClient.get('/server-rbac-status'),
};
