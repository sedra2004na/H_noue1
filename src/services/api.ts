import axios from 'axios';
import { UserRole } from '../types';

// Set API Backend Base URL (defaults to Express server /api routes)
const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach Active User Role and Patient ID for Server-Side RBAC Enforcement
apiClient.interceptors.request.use(
  (config) => {
    let currentRole = 'patient';
    let currentPatientId = 'pat-1';
    try {
      const stored = localStorage.getItem('syrian_hosp_userRole');
      if (stored) {
        currentRole = JSON.parse(stored);
      }
      const storedPatientId = localStorage.getItem('syrian_hosp_patientId');
      if (storedPatientId) {
        currentPatientId = storedPatientId;
      }
    } catch {
      currentRole = 'patient';
    }

    config.headers['x-user-role'] = currentRole;
    config.headers['x-patient-id'] = currentPatientId;

    const token = localStorage.getItem('care_hospital_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('care_hospital_token');
    }
    return Promise.reject(error);
  }
);

export interface SyncDataResponse {
  success: boolean;
  version: number;
  lastUpdated: string;
  patients: any[];
  doctors: any[];
  appointments: any[];
  inventory: any[];
  labResults: any[];
  prescriptions: any[];
  invoices: any[];
  shifts: any[];
  wards: any[];
  beds: any[];
  archivedRecords: any[];
  abnormalFlags: any[];
  auditLogs: any[];
  accounts: Record<string, { role: UserRole; name: string; pass?: string; salt?: string; passHash?: string }>;
}

// High-level API Methods for Care Hospital System
export const hospitalApi = {
  // 1. Universal Real-Time Database Synchronization across Mobile and Laptop
  getSyncData: async (): Promise<SyncDataResponse> => {
    const res = await apiClient.get<SyncDataResponse>('/sync');
    return res.data;
  },

  getSyncVersion: async (): Promise<{ version: number; lastUpdated: string }> => {
    const res = await apiClient.get<{ version: number; lastUpdated: string }>('/sync/version');
    return res.data;
  },

  syncMutate: async (action: string, payload: any): Promise<{ success: boolean; version: number; lastUpdated: string }> => {
    const res = await apiClient.post('/sync/mutate', { action, payload });
    return res.data;
  },

  // 2. Authentication & Multi-Device Accounts
  getAccounts: async () => {
    const res = await apiClient.get('/auth/accounts');
    return res.data;
  },

  login: async (credentials: { email: string; pass: string }) => {
    const res = await apiClient.post('/auth/login', {
      email: credentials.email.trim().toLowerCase(),
      pass: credentials.pass.trim(),
      password: credentials.pass.trim(),
    });
    return res.data;
  },

  register: async (accountData: { email: string; pass: string; fullName: string; role?: UserRole; phone?: string; nationalId?: string; salt?: string; passHash?: string }) => {
    const res = await apiClient.post('/auth/register', {
      ...accountData,
      email: accountData.email.trim().toLowerCase(),
      pass: accountData.pass.trim(),
      password: accountData.pass.trim(),
      fullName: accountData.fullName.trim(),
      role: 'patient',
    });
    return res.data;
  },

  // 3. Health & Diagnostic
  getHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },

  // 4. REST Domain Endpoints
  getPatients: (search?: string) => apiClient.get('/patients', { params: { search } }),
  getPatientById: (id: string) => apiClient.get(`/patients/${id}`),
  createPatient: (data: any) => apiClient.post('/patients', data),
  updatePatient: (id: string, data: any) => apiClient.put(`/patients/${id}`, data),
  deletePatient: (id: string) => apiClient.delete(`/patients/${id}`),
  verifyPatientReception: (id: string, data: { nationalId?: string; officialFileNumber?: string; bloodType?: string; verifiedBy?: string }) =>
    apiClient.put(`/patients/${id}/verify-reception`, data),

  getDoctors: () => apiClient.get('/doctors'),
  createDoctor: (data: any) => apiClient.post('/doctors', data),
  deleteDoctor: (id: string) => apiClient.delete(`/doctors/${id}`),
  provisionStaff: (data: { name: string; email: string; password: string; role: UserRole; department?: string; phone?: string }) =>
    apiClient.post('/staff', data),

  getAppointments: () => apiClient.get('/appointments'),
  createAppointment: (data: any) => apiClient.post('/appointments', data),
  updateAppointmentStatus: (id: string, status: string) => apiClient.put(`/appointments/${id}/status`, { status }),

  getInventory: () => apiClient.get('/inventory'),
  addInventoryItem: (data: any) => apiClient.post('/inventory', data),
  deleteInventoryItem: (id: string) => apiClient.delete(`/inventory/${id}`),

  getLabResults: () => apiClient.get('/lab-results'),
  createLabResult: (data: any) => apiClient.post('/lab-results', data),

  getPrescriptions: () => apiClient.get('/prescriptions'),
  createPrescription: (data: any) => apiClient.post('/prescriptions', data),

  getInvoices: () => apiClient.get('/invoices'),
  createInvoice: (data: any) => apiClient.post('/invoices', data),

  getShifts: () => apiClient.get('/shifts'),
  getAuditLogs: () => apiClient.get('/audit-logs'),
  getSecurityStatus: () => apiClient.get('/security-status'),
};
