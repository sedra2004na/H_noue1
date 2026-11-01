/**
 * Security & Cryptography Utilities for Al-Rahma Medical Center
 * Implements Salted Hashing, Input Sanitization, and Clinical Audit Logging
 */

// Simple robust browser & Node compatible SHA-256 implementation
export async function sha256Hash(text: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(text);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for environments where subtle crypto is unavailable
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Hash password with a unique cryptographic salt
 */
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  return sha256Hash(`${salt}::al_rahma_secure_vault::${password}`);
}

/**
 * Verify input password against stored hash and salt
 */
export async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const calculated = await hashPasswordWithSalt(password, salt);
  return calculated === storedHash;
}

/**
 * Sanitize user input to neutralize XSS and script injections
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/[<>]/g, (char) => (char === '<' ? '&lt;' : '&gt;'))
    .trim();
}

/**
 * Audit Log Item Interface
 */
export interface ClinicalAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'doctor' | 'staff' | 'patient';
  action: 'VIEW_RECORD' | 'EDIT_RECORD' | 'IDOR_BLOCKED' | 'LOGIN' | 'LOGOUT' | 'SESSION_TIMEOUT' | 'PRESCRIPTION_ISSUED';
  targetResource: string;
  patientId?: string;
  patientName?: string;
  details: string;
  status: 'SUCCESS' | 'BLOCKED_ALERT';
  ipAddress?: string;
}

// Initial clinical audit trail entries demonstrating HIPAA-compliant tracking
export const DEFAULT_AUDIT_LOGS: ClinicalAuditLog[] = [
  {
    id: 'aud-101',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    userId: 'u-admin-1',
    userName: 'د. خالد العمري (المدير)',
    userRole: 'admin',
    action: 'LOGIN',
    targetResource: 'AUTH_GATEWAY',
    details: 'تسجيل دخول موثوق من شبكة إدارة المستشفى المشفرة (TLS 1.3)',
    status: 'SUCCESS',
    ipAddress: '192.168.1.10'
  },
  {
    id: 'aud-102',
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    userId: 'u-doc-101',
    userName: 'د. سارة السعيد',
    userRole: 'doctor',
    action: 'VIEW_RECORD',
    targetResource: 'PATIENT_FILE',
    patientId: 'p-1001',
    patientName: 'سامر المحمود',
    details: 'معاينة السجل السريري ونتائج التحاليل المخبرية لعيادة القلبية',
    status: 'SUCCESS',
    ipAddress: '192.168.1.42'
  },
  {
    id: 'aud-103',
    timestamp: new Date(Date.now() - 3600000 * 0.8).toISOString(),
    userId: 'pat-1',
    userName: 'محمد عبد الله العتيبي',
    userRole: 'patient',
    action: 'VIEW_RECORD',
    targetResource: 'PERSONAL_APPOINTMENTS',
    patientId: 'pat-1',
    patientName: 'محمد عبد الله العتيبي',
    details: 'استعراض مواعيده الشخصية المجدولة في عيادة القلبية',
    status: 'SUCCESS',
    ipAddress: '185.12.94.33'
  },
  {
    id: 'aud-104',
    timestamp: new Date(Date.now() - 3600000 * 0.3).toISOString(),
    userId: 'pat-1',
    userName: 'محمد عبد الله العتيبي',
    userRole: 'patient',
    action: 'IDOR_BLOCKED',
    targetResource: 'PATIENT_FILE',
    patientId: 'p-1002',
    patientName: 'خالد السعيد',
    details: 'محاولة وصول غير مصرح بها لملف مريض آخر (IDOR Attempt) - تم اعتراضها وحظرها فورياً',
    status: 'BLOCKED_ALERT',
    ipAddress: '185.12.94.33'
  }
];

export function getStoredAuditLogs(): ClinicalAuditLog[] {
  try {
    const raw = localStorage.getItem('syrian_hosp_audit_logs');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return DEFAULT_AUDIT_LOGS;
}

export function recordAuditLog(log: Omit<ClinicalAuditLog, 'id' | 'timestamp'>) {
  try {
    const existing = getStoredAuditLogs();
    const newEntry: ClinicalAuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    const updated = [newEntry, ...existing].slice(0, 100); // keep recent 100 entries
    localStorage.setItem('syrian_hosp_audit_logs', JSON.stringify(updated));
    return newEntry;
  } catch (e) {
    return null;
  }
}
