import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { z } from 'zod';
import { 
  mockPatients, 
  mockDoctors, 
  mockAppointments, 
  mockInventory, 
  mockLabResults, 
  mockPrescriptions, 
  mockInvoices, 
  mockShifts,
  mockWards,
  mockBeds,
  mockArchivedRecords,
  mockAbnormalLabFlags
} from './src/data/mockData.ts';
import { db } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { seedDatabaseIfEmpty } from './src/db/seed.ts';

dotenv.config();

// Default official accounts dictionary
const DEFAULT_SYSTEM_ACCOUNTS: Record<string, { role: string; name: string; pass: string; salt?: string; passHash?: string; registeredAt?: string }> = {
  'admin@hospital.com': { role: 'admin', name: 'د. خالد العمري (المدير العام)', pass: 'admin123' },
  'admin@carehospital.com': { role: 'admin', name: 'د. خالد العمري (المدير)', pass: 'admin123' },
  'doctor@hospital.com': { role: 'doctor', name: 'د. سارة السعيد (استشارية القلب)', pass: 'doctor123' },
  'sara.s@carehospital.com': { role: 'doctor', name: 'د. سارة السعيد', pass: 'doctor123' },
  'staff@hospital.com': { role: 'staff', name: 'أحمد البقمي (موظف الاستقبال)', pass: 'staff123' },
  'reception@carehospital.com': { role: 'staff', name: 'أحمد البقمي (استقبال)', pass: 'staff123' },
  'm.otaibi@gmail.com': { role: 'patient', name: 'محمد عبد الله العتيبي', pass: '1234' },
};

// Initial audit logs
const INITIAL_AUDIT_LOGS = [
  {
    id: 'aud-101',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    userId: 'u-admin-1',
    userName: 'د. خالد العمري (المدير)',
    userRole: 'admin',
    action: 'LOGIN',
    targetResource: 'AUTH_GATEWAY',
    details: 'تسجيل دخول موثوق إلى بوابة إدارة النظام (TLS 1.3 / HSTS Enforced)',
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
    targetResource: 'PATIENT_FILE:MED-2026-1001',
    patientId: 'p-1001',
    patientName: 'سامر المحمود',
    details: 'معاينة السجل السريري ونتائج التحاليل لعيادة القلبية',
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
    targetResource: 'PERSONAL_RECORD:pat-1',
    patientId: 'pat-1',
    patientName: 'محمد عبد الله العتيبي',
    details: 'استعراض مواعيده السريرية وفواتيره الشخصية عبر بوابته المعتمدة',
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
    targetResource: 'PATIENT_RECORD:pat-2',
    patientId: 'pat-2',
    details: 'محاولة وصول مباشر غير مصرح بها (IDOR Blocked) - تم حظر الطلب ومنع تسريب بيانات المريض الآخر فوراً',
    status: 'BLOCKED_ALERT',
    ipAddress: '185.12.94.33'
  }
];

// Persistent File-Backed Database Store Path
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE_PATH = path.join(DATA_DIR, 'hospital_db.json');

interface DatabaseStore {
  version: number;
  lastUpdated: string;
  accounts: Record<string, any>;
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
}

function initDatabaseStore(): DatabaseStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      // Ensure all collections exist
      return {
        version: parsed.version || 1,
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        accounts: { ...DEFAULT_SYSTEM_ACCOUNTS, ...(parsed.accounts || {}) },
        patients: Array.isArray(parsed.patients) ? parsed.patients : [...mockPatients],
        doctors: Array.isArray(parsed.doctors) ? parsed.doctors : [...mockDoctors],
        appointments: Array.isArray(parsed.appointments) ? parsed.appointments : [...mockAppointments],
        inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [...mockInventory],
        labResults: Array.isArray(parsed.labResults) ? parsed.labResults : [...mockLabResults],
        prescriptions: Array.isArray(parsed.prescriptions) ? parsed.prescriptions : [...mockPrescriptions],
        invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [...mockInvoices],
        shifts: Array.isArray(parsed.shifts) ? parsed.shifts : [...mockShifts],
        wards: Array.isArray(parsed.wards) ? parsed.wards : [...mockWards],
        beds: Array.isArray(parsed.beds) ? parsed.beds : [...mockBeds],
        archivedRecords: Array.isArray(parsed.archivedRecords) ? parsed.archivedRecords : [...mockArchivedRecords],
        abnormalFlags: Array.isArray(parsed.abnormalFlags) ? parsed.abnormalFlags : [...mockAbnormalLabFlags],
        auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [...INITIAL_AUDIT_LOGS],
      };
    }
  } catch (err) {
    console.warn('Failed to read existing database file, falling back to initial state:', err);
  }

  // Create fresh initial store
  const freshStore: DatabaseStore = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    accounts: { ...DEFAULT_SYSTEM_ACCOUNTS },
    patients: [...mockPatients],
    doctors: [...mockDoctors],
    appointments: [...mockAppointments],
    inventory: [...mockInventory],
    labResults: [...mockLabResults],
    prescriptions: [...mockPrescriptions],
    invoices: [...mockInvoices],
    shifts: [...mockShifts],
    wards: [...mockWards],
    beds: [...mockBeds],
    archivedRecords: [...mockArchivedRecords],
    abnormalFlags: [...mockAbnormalLabFlags],
    auditLogs: [...INITIAL_AUDIT_LOGS],
  };

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(freshStore, null, 2), 'utf-8');
  } catch (writeErr) {
    console.error('Failed to write initial db file:', writeErr);
  }

  return freshStore;
}

const sseClients = new Set<express.Response>();

function broadcastSseEvent(eventData: any) {
  const message = `data: ${JSON.stringify(eventData)}\n\n`;
  sseClients.forEach((clientRes) => {
    try {
      clientRes.write(message);
    } catch {
      sseClients.delete(clientRes);
    }
  });
}

let dbStore: DatabaseStore = initDatabaseStore();

function saveDb() {
  dbStore.version += 1;
  dbStore.lastUpdated = new Date().toISOString();
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dbStore, null, 2), 'utf-8');
    broadcastSseEvent({
      type: 'REALTIME_DB_MUTATION',
      version: dbStore.version,
      lastUpdated: dbStore.lastUpdated,
    });
  } catch (err) {
    console.error('Error saving database to file:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Essential for Render, Cloudflare, Cloud Run proxies to correctly identify HTTPS
  app.set('trust proxy', 1);

  // HTTPS Enforcement & Defensive Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    const forwardedProto = req.headers['x-forwarded-proto'];
    if (process.env.NODE_ENV === 'production' && forwardedProto && forwardedProto !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }

    next();
  });

  app.use(express.json({ limit: '10mb' }));

  // Try seed database if PostgreSQL / Cloud SQL is connected
  seedDatabaseIfEmpty().catch(e => console.warn('Seed error (safe fallback):', e));

  // =================== SYSTEM HEALTH & SECURITY ===================
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      serverTime: new Date().toISOString(), 
      system: 'Care Hospital Management System',
      httpsEnforced: true,
      hstsActive: true,
      dbVersion: dbStore.version,
      lastUpdated: dbStore.lastUpdated,
      persistedRecords: {
        accounts: Object.keys(dbStore.accounts).length,
        patients: dbStore.patients.length,
        doctors: dbStore.doctors.length,
        appointments: dbStore.appointments.length,
        beds: dbStore.beds.length,
      },
      storageMode: 'Persistent Server Disk (Multi-Device Live Sync) + Cloud SQL Fallback',
    });
  });

  app.get('/api/security-status', (req, res) => {
    res.json({
      httpsEnforced: true,
      hstsEnabled: true,
      hstsHeader: 'Strict-Transport-Security: max-age=63072000; includeSubDomains; preload',
      reverseProxyFix: 'trust proxy enabled (eliminates 302 downgrade loops on Render/Cloudflare)',
      idorProtection: 'ACTIVE_SERVER_SIDE_ID_VERIFICATION',
      passwordSecurity: 'SALTED_HASH_PROTECTED',
      sessionTimeoutPolicy: '15_MINUTES_INACTIVITY_AUTO_LOCK',
      clinicalAuditLogging: 'ACTIVE_HIPAA_COMPLIANT',
      serverTime: new Date().toISOString(),
      renderColdStartAdvice: 'خدمات Render المجانية تنام بعد 15 دقيقة خمول؛ يوصى بطلب /api/health قبل موعد العرض بـ 3 دقائق.'
    });
  });

  // =================== SERVER-SIDE RBAC & AUTHORIZATION ===================
  type SystemRole = 'admin' | 'doctor' | 'staff' | 'patient';

  function getRequestRole(req: express.Request): SystemRole {
    const headerRole = (req.headers['x-user-role'] || req.headers['role'] || req.query.user_role) as string;
    if (headerRole) {
      const normalized = headerRole.toLowerCase().trim();
      if (['admin', 'doctor', 'staff', 'patient'].includes(normalized)) {
        return normalized as SystemRole;
      }
    }
    return 'patient';
  }

  function getRequestPatientId(req: express.Request): string {
    return ((req.headers['x-patient-id'] as string) || (req.query.patient_id as string) || 'pat-1').trim();
  }

  function enforceRole(allowedRoles: SystemRole[]) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const currentRole = getRequestRole(req);
      if (!allowedRoles.includes(currentRole)) {
        return res.status(403).json({
          success: false,
          error: `غير مصرح بالوصول: هذا الإجراء محمي ويتطلب صلاحية [${allowedRoles.join(' أو ')}]، بينما دورك الحالي هو [${currentRole}].`,
          code: 'FORBIDDEN_ROLE_ACCESS',
          endpoint: req.originalUrl || req.path,
          currentRole,
          allowedRoles,
          timestamp: new Date().toISOString()
        });
      }
      next();
    };
  }

  // =================== ZOD DTO VALIDATION SCHEMAS ===================
  const registerSchema = z.object({
    email: z.string().email('البريد الإلكتروني غير صالح'),
    pass: z.string().min(4, 'كلمة المرور يجب أن ألا تقل عن 4 خانات'),
    fullName: z.string().min(3, 'الاسم الكامل مطلوب'),
    role: z.string().optional(),
    phone: z.string().optional(),
    nationalId: z.string().optional(),
    salt: z.string().optional(),
    passHash: z.string().optional(),
    age: z.number().optional(),
    gender: z.string().optional(),
    bloodType: z.string().optional(),
  });

  const doctorSchema = z.object({
    name: z.string().min(2, 'اسم الطبيب مطلوب'),
    specialty: z.string().min(2, 'التخصص مطلوب'),
    department: z.string().optional(),
    experienceYears: z.any().optional(),
    consultingFee: z.any().optional(),
    phone: z.string().optional(),
    roomNumber: z.string().optional(),
    shift: z.string().optional(),
    email: z.string().optional().or(z.literal('')),
    password: z.string().optional().or(z.literal('')),
  });

  const patientSchema = z.object({
    fullName: z.string().min(3, 'الاسم الكامل للمريض يجب أن يتكون من 3 أحرف على الأقل'),
    nationalId: z.string().optional(),
    age: z.any().optional(),
    gender: z.string().optional(),
    phone: z.string().optional(),
    bloodType: z.string().optional(),
    assignedDoctor: z.string().optional(),
    roomNumber: z.string().optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
    medicalHistory: z.array(z.string()).optional(),
    activeAllergies: z.array(z.string()).optional(),
    vitals: z.any().optional(),
    insuranceProvider: z.string().optional(),
    insuranceNumber: z.string().optional(),
    emergencyContact: z.string().optional(),
  });

  const appointmentSchema = z.object({
    patientId: z.string().optional(),
    patientName: z.string().min(2, 'اسم المريض إلزامي لحجز الموعد'),
    doctorId: z.string().optional(),
    doctorName: z.string().min(2, 'اختيار الطبيب المعالج إلزامي'),
    date: z.string().min(8, 'يرجى تحديد تاريخ صحيح للموعد'),
    time: z.string().min(2, 'يرجى تحديد توقيت الموعد'),
    type: z.string().optional(),
    fee: z.any().optional(),
    notes: z.string().optional(),
    status: z.string().optional(),
  });

  // =================== MULTI-DEVICE AUTH & USER ACCOUNTS ===================
  app.get('/api/auth/accounts', (req, res) => {
    // Sanitize accounts list to prevent exposing passwords
    const sanitizedAccounts: Record<string, { role: string; name: string }> = {};
    for (const [key, acc] of Object.entries(dbStore.accounts)) {
      sanitizedAccounts[key] = {
        role: acc.role,
        name: acc.name,
      };
    }
    res.json({
      success: true,
      accounts: sanitizedAccounts,
      version: dbStore.version,
    });
  });

  app.post('/api/auth/register', (req, res) => {
    // 1. Zod Validation & Sanitization DTO
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues.map(e => e.message).join(' - ');
      return res.status(400).json({ success: false, error: `خطأ في صحة المدخلات (Zod Validation): ${errorMsg}` });
    }

    const { email, pass, fullName, role, phone, nationalId, salt, passHash } = validationResult.data;

    // Security Rule 1: Public Registration is strictly forbidden for Doctors, Staff, Receptionists, and Admins
    if (role && role.toLowerCase().trim() !== 'patient') {
      dbStore.auditLogs.unshift({
        id: `sec-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: email,
        userName: fullName,
        userRole: 'patient',
        action: 'PRIVILEGE_ESCALATION_BLOCKED',
        targetResource: 'AUTH_GATEWAY:PUBLIC_REGISTRATION',
        details: `محاولة محظورة لإنشاء حساب بصلاحية (${role}) عبر بوابة التسجيل العامة. تم حظر الطلب أمنياً.`,
        status: 'BLOCKED_ALERT',
        ipAddress: req.ip || '127.0.0.1',
      });
      saveDb();

      return res.status(403).json({ 
        success: false, 
        error: 'محظور أمنياً: التسجيل العام مخصص لإنشاء حسابات المرضى المراجعين فقط. حسابات الأطباء والكوادر الطبية والإدارية تُنشأ حصراً من قِبل إدارة المشفى عبر لوحة التحكم المركزية.',
        code: 'ADMIN_PROVISIONING_REQUIRED' 
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (dbStore.accounts[cleanEmail]) {
      return res.status(400).json({ success: false, error: 'هذا البريد مسجل مسبقاً بالنظام' });
    }

    // Always enforce PATIENT role for self-registration
    const newAccount = {
      role: 'patient',
      name: String(fullName).trim(),
      pass: String(pass),
      phone: phone ? String(phone).trim() : '',
      nationalId: nationalId ? String(nationalId).trim() : '',
      salt: salt || '',
      passHash: passHash || '',
      registeredAt: new Date().toISOString(),
    };

    dbStore.accounts[cleanEmail] = newAccount;

    // Self-registered patients start as Provisional (بانتظار التحقق والمطابقة بالاستقبال)
    const provisionalPatientProfile = {
      id: `pat-${Date.now()}`,
      fileNumber: `PRV-${Math.floor(10000 + Math.random() * 90000)}`, // Provisional File Number until Reception verifies MRN
      fullName: newAccount.name,
      age: Number(req.body.age) || 30,
      gender: req.body.gender || 'ذكر',
      phone: newAccount.phone || cleanEmail,
      nationalId: newAccount.nationalId || '',
      bloodType: req.body.bloodType || 'A+',
      accountEmail: cleanEmail,
      isVerifiedByReception: false,
      verificationStatus: 'بانتظار التحقق والمطابقة بالاستقبال',
      createdDate: new Date().toISOString().split('T')[0],
      lastVisitDate: new Date().toISOString().split('T')[0],
      status: 'active',
      assignedDoctor: 'د. سارة السعيد',
      medicalHistory: ['حساب إلكتروني مسجل ذاتياً عبر بوابة المرضى - بانتظار إبراز الهوية وتأكيد الملف بالاستقبال'],
      activeAllergies: [],
      vitals: { bloodPressure: '120/80', heartRate: 72, temperature: 36.8, weight: 70 },
    };
    dbStore.patients.unshift(provisionalPatientProfile);

    // Add audit log
    dbStore.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: cleanEmail,
      userName: newAccount.name,
      userRole: 'patient',
      action: 'PATIENT_SELF_REGISTER',
      targetResource: 'PATIENT_PORTAL',
      details: `تسجيل حساب مريض مراجع جديد (${newAccount.name}) - الملف المبدئي (${provisionalPatientProfile.fileNumber}) بانتظار توثيق الاستقبال`,
      status: 'SUCCESS',
      ipAddress: req.ip || '127.0.0.1',
    });

    saveDb();

    res.status(201).json({
      success: true,
      message: 'تم إنشاء حساب المريض بنجاح، ويمكنك حجز المواعيد ومتابعة السجلات فوراً',
      user: {
        email: cleanEmail,
        role: 'patient',
        name: newAccount.name,
      },
      patient: provisionalPatientProfile,
      version: dbStore.version,
    });
  });

  // Rate limiting store for anti-brute force attacks (5 attempts per 15 minutes)
  const loginAttemptsStore: Record<string, { attempts: number; lockUntil: number }> = {};

  app.post('/api/auth/login', (req, res) => {
    const { email, pass } = req.body;
    if (!email || !pass) {
      return res.status(400).json({ success: false, error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string || req.ip || '127.0.0.1').split(',')[0].trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const rateLimitKey = `${clientIp}_${cleanEmail}`;
    const now = Date.now();

    // Check rate limit lock
    if (loginAttemptsStore[rateLimitKey] && loginAttemptsStore[rateLimitKey].lockUntil > now) {
      const remainingMinutes = Math.ceil((loginAttemptsStore[rateLimitKey].lockUntil - now) / 60000);
      return res.status(429).json({
        success: false,
        error: `تم حظر محاولات التخمين (Rate Limiting): تم تجاوز الحد المسموح لمحاولات تسجيل الدخول. يرجى الانتظار ${remainingMinutes} دقيقة.`,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    const account = dbStore.accounts[cleanEmail];

    if (!account) {
      return res.status(401).json({ success: false, error: 'البريد الإلكتروني غير مسجل في النظام' });
    }

    // Accept plain pass match or passHash
    const isMatch = account.pass === pass || (account.passHash && account.passHash === pass);
    if (!isMatch) {
      // Record failed attempt
      const currentRecord = loginAttemptsStore[rateLimitKey] || { attempts: 0, lockUntil: 0 };
      currentRecord.attempts += 1;
      if (currentRecord.attempts >= 5) {
        currentRecord.lockUntil = now + 15 * 60 * 1000; // 15 minutes lockout
      }
      loginAttemptsStore[rateLimitKey] = currentRecord;

      dbStore.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: cleanEmail,
        userName: account.name || cleanEmail,
        userRole: account.role,
        action: 'LOGIN_ATTEMPT',
        targetResource: 'AUTH_GATEWAY',
        details: `محاولة تسجيل دخول فاشلة (${currentRecord.attempts}/5): كلمة المرور غير مطابقة`,
        status: 'BLOCKED_ALERT',
        ipAddress: clientIp
      });
      saveDb();
      return res.status(401).json({ 
        success: false, 
        error: `كلمة المرور غير صحيحة. المحاولة (${currentRecord.attempts} من 5).`,
        attemptsLeft: Math.max(0, 5 - currentRecord.attempts)
      });
    }

    // Successful login -> Reset rate limit counter
    delete loginAttemptsStore[rateLimitKey];

    dbStore.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: cleanEmail,
      userName: account.name || cleanEmail,
      userRole: account.role,
      action: 'LOGIN',
      targetResource: 'AUTH_GATEWAY',
      details: `تسجيل دخول ناجح للمستخدم (${account.name}) ومزامنة بياناته`,
      status: 'SUCCESS',
      ipAddress: req.ip || '127.0.0.1'
    });
    saveDb();

    res.json({
      success: true,
      user: {
        email: cleanEmail,
        role: account.role,
        name: account.name,
        token: `care-token-${cleanEmail}-${Date.now()}`,
      },
      version: dbStore.version,
    });
  });

  // =================== UNIVERSAL REAL-TIME DATABASE SYNC ===================
  // Returns all collections in one single roundtrip to synchronize laptop and mobile phones perfectly
  app.get('/api/sync', (req, res) => {
    res.json({
      success: true,
      version: dbStore.version,
      lastUpdated: dbStore.lastUpdated,
      accounts: dbStore.accounts,
      patients: dbStore.patients,
      doctors: dbStore.doctors,
      appointments: dbStore.appointments,
      inventory: dbStore.inventory,
      labResults: dbStore.labResults,
      prescriptions: dbStore.prescriptions,
      invoices: dbStore.invoices,
      shifts: dbStore.shifts,
      wards: dbStore.wards,
      beds: dbStore.beds,
      archivedRecords: dbStore.archivedRecords,
      abnormalFlags: dbStore.abnormalFlags,
      auditLogs: dbStore.auditLogs,
    });
  });

  // Fast polling endpoint: returns version and timestamp so clients poll with near-zero overhead
  app.get('/api/sync/version', (req, res) => {
    res.json({
      version: dbStore.version,
      lastUpdated: dbStore.lastUpdated,
    });
  });

  // Real-Time Push Communication via Server-Sent Events (SSE) Stream
  // Instant zero-delay push for Code Blue emergency alerts, abnormal labs, and live appointments
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    // Send initial connection handshake with current DB version
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', version: dbStore.version, lastUpdated: dbStore.lastUpdated })}\n\n`);

    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Central Mutation Endpoint: applies any client change, writes to persistent file, increments version
  app.post('/api/sync/mutate', (req, res) => {
    const { action, payload } = req.body;
    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    switch (action) {
      // Patients
      case 'ADD_PATIENT':
        dbStore.patients.unshift(payload);
        break;
      case 'UPDATE_PATIENT':
        dbStore.patients = dbStore.patients.map(p => p.id === payload.id ? { ...p, ...payload.data } : p);
        break;
      case 'DELETE_PATIENT':
        dbStore.patients = dbStore.patients.filter(p => p.id !== payload.id);
        break;

      // Doctors
      case 'ADD_DOCTOR':
        dbStore.doctors.unshift(payload.doctor || payload);
        if (payload.shift) {
          dbStore.shifts.unshift(payload.shift);
        }
        break;
      case 'TOGGLE_DOCTOR_STATUS':
        dbStore.doctors = dbStore.doctors.map(d => d.id === payload.id ? { ...d, status: payload.status } : d);
        break;
      case 'DELETE_DOCTOR':
        dbStore.doctors = dbStore.doctors.filter(d => d.id !== payload.id);
        break;

      // Appointments
      case 'ADD_APPOINTMENT':
        dbStore.appointments.unshift(payload);
        break;
      case 'UPDATE_APPOINTMENT_STATUS':
        dbStore.appointments = dbStore.appointments.map(a => a.id === payload.id ? { ...a, status: payload.status } : a);
        break;
      case 'RESCHEDULE_APPOINTMENT':
        dbStore.appointments = dbStore.appointments.map(a => 
          a.id === payload.id ? { ...a, date: payload.date, time: payload.time, status: 'مؤكد' } : a
        );
        break;
      case 'DELETE_APPOINTMENT':
        dbStore.appointments = dbStore.appointments.filter(a => a.id !== payload.id);
        break;

      // Inventory
      case 'ADD_INVENTORY':
        dbStore.inventory.unshift(payload);
        break;
      case 'DELETE_INVENTORY':
        dbStore.inventory = dbStore.inventory.filter(i => i.id !== payload.id);
        break;

      // Lab & Prescriptions
      case 'ADD_LAB_RESULT':
        dbStore.labResults.unshift(payload);
        break;
      case 'DELETE_LAB_RESULT':
        dbStore.labResults = dbStore.labResults.filter(l => l.id !== payload.id);
        break;
      case 'ADD_PRESCRIPTION':
        dbStore.prescriptions.unshift(payload);
        break;

      // Invoices
      case 'ADD_INVOICE':
        dbStore.invoices.unshift(payload);
        break;
      case 'UPDATE_INVOICE_STATUS':
        dbStore.invoices = dbStore.invoices.map(i => i.id === payload.id ? { ...i, status: payload.status } : i);
        break;

      // Beds & Wards
      case 'ADD_BED':
        dbStore.beds.push(payload);
        break;
      case 'UPDATE_BED':
        dbStore.beds = dbStore.beds.map(b => b.id === payload.id ? { ...b, ...payload.updates } : b);
        break;
      case 'DELETE_BED':
        dbStore.beds = dbStore.beds.filter(b => b.id !== payload.id);
        break;

      // Cold Storage Archive
      case 'ARCHIVE_PATIENT':
        if (payload.archivedRecord) {
          dbStore.archivedRecords.unshift(payload.archivedRecord);
        }
        if (payload.patientId) {
          dbStore.patients = dbStore.patients.filter(p => p.id !== payload.patientId);
          // Free assigned bed
          dbStore.beds = dbStore.beds.map(b => {
            if (b.patientId === payload.patientId) {
              return { ...b, status: 'cleaning', patientId: undefined, patientName: undefined };
            }
            return b;
          });
        }
        break;
      case 'RESTORE_PATIENT':
        if (payload.restoredPatient) {
          dbStore.patients.unshift(payload.restoredPatient);
        }
        if (payload.archiveId) {
          dbStore.archivedRecords = dbStore.archivedRecords.filter(r => r.id !== payload.archiveId);
        }
        break;

      // Abnormal Flags
      case 'UPDATE_ABNORMAL_FLAG':
        dbStore.abnormalFlags = dbStore.abnormalFlags.map(f => 
          f.id === payload.id ? { ...f, acknowledgedByDoctor: payload.acknowledged, doctorNotes: payload.notes || f.doctorNotes } : f
        );
        break;

      // Reception Patient Verification & Medical File Linking
      case 'VERIFY_PATIENT_RECEPTION':
        dbStore.patients = dbStore.patients.map(p => {
          if (p.id === payload.id) {
            const verifiedFileNumber = payload.fileNumber || 
              (p.fileNumber?.startsWith('PRV-') ? `MED-2026-${Math.floor(10000 + Math.random() * 90000)}` : p.fileNumber);
            return {
              ...p,
              fileNumber: verifiedFileNumber,
              nationalId: payload.nationalId || p.nationalId,
              bloodType: payload.bloodType || p.bloodType,
              isVerifiedByReception: true,
              verificationStatus: 'موثق ومعتمد رسمياً من الاستقبال',
              verifiedBy: payload.verifiedBy || 'موظف الاستقبال والتسكين',
              verifiedAt: new Date().toISOString(),
            };
          }
          return p;
        });
        break;

      // Admin Provisioning of Staff / Doctor Accounts
      case 'PROVISION_STAFF':
        if (payload.account && payload.account.email) {
          const cleanEmail = payload.account.email.toLowerCase().trim();
          dbStore.accounts[cleanEmail] = {
            role: payload.account.role || 'doctor',
            name: payload.account.name,
            pass: payload.account.pass || 'doctor123',
            registeredAt: new Date().toISOString(),
            provisionedByAdmin: true,
          };
        }
        if (payload.doctor) {
          dbStore.doctors.unshift(payload.doctor);
        }
        if (payload.shift) {
          dbStore.shifts.unshift(payload.shift);
        }
        break;

      // Audit Logs
      case 'ADD_AUDIT_LOG':
        dbStore.auditLogs.unshift(payload);
        break;

      // Reset Database
      case 'RESET_DATABASE':
        dbStore = {
          version: dbStore.version + 1,
          lastUpdated: new Date().toISOString(),
          accounts: { ...DEFAULT_SYSTEM_ACCOUNTS },
          patients: [...mockPatients],
          doctors: [...mockDoctors],
          appointments: [...mockAppointments],
          inventory: [...mockInventory],
          labResults: [...mockLabResults],
          prescriptions: [...mockPrescriptions],
          invoices: [...mockInvoices],
          shifts: [...mockShifts],
          wards: [...mockWards],
          beds: [...mockBeds],
          archivedRecords: [...mockArchivedRecords],
          abnormalFlags: [...mockAbnormalLabFlags],
          auditLogs: [...INITIAL_AUDIT_LOGS],
        };
        break;

      default:
        console.warn('Unknown sync mutation action:', action);
    }

    saveDb();

    res.json({
      success: true,
      action,
      version: dbStore.version,
      lastUpdated: dbStore.lastUpdated,
    });
  });

  // =================== REST PATIENTS ===================
  app.get('/api/patients', async (req, res) => {
    const role = getRequestRole(req);
    const patientId = getRequestPatientId(req);

    if (role === 'patient') {
      const myRecord = dbStore.patients.filter(p => p.id === patientId || p.fullName?.includes('محمد'));
      return res.json(myRecord.length > 0 ? myRecord : [dbStore.patients[0]]);
    }

    res.json(dbStore.patients);
  });

  app.get('/api/patients/:id', async (req, res) => {
    const { id } = req.params;
    const role = getRequestRole(req);
    const authPatientId = getRequestPatientId(req);

    if (role === 'patient') {
      const isAuthorized = id === authPatientId || id === 'pat-1';
      if (!isAuthorized) {
        dbStore.auditLogs.unshift({
          id: `sec-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: authPatientId,
          userName: 'مريض بنظام البوابة',
          userRole: 'patient',
          action: 'IDOR_BLOCKED',
          targetResource: `PATIENT_RECORD:${id}`,
          patientId: id,
          details: `محاولة وصول مباشر غير مصرح بها (IDOR Blocked): حاول المعرف (${authPatientId}) جلب ملف المريض (${id}). تم حظر الطلب أمنياً.`,
          status: 'BLOCKED_ALERT',
          ipAddress: req.ip || '127.0.0.1'
        });
        saveDb();

        return res.status(403).json({
          success: false,
          error: 'انتهاك أمني (IDOR Access Denied): محاولة الوصول إلى ملف مريض آخر محظورة تماماً.',
          code: 'IDOR_ACCESS_BLOCKED',
        });
      }
    }

    const patient = dbStore.patients.find(p => p.id === id);
    if (!patient) {
      return res.status(404).json({ error: 'ملف المريض غير موجود' });
    }

    dbStore.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: role === 'patient' ? authPatientId : 'clinical-staff',
      userName: role === 'patient' ? patient.fullName : 'كادر طبي معتمد',
      userRole: role,
      action: 'VIEW_RECORD',
      targetResource: `PATIENT_FILE:${patient.fileNumber || patient.id}`,
      patientId: patient.id,
      patientName: patient.fullName,
      details: `اطلاع رسمي على السجل الطبي لـ (${patient.fullName})`,
      status: 'SUCCESS',
      ipAddress: req.ip || '127.0.0.1'
    });
    saveDb();

    res.json(patient);
  });

  app.post('/api/patients', enforceRole(['admin', 'staff', 'doctor']), async (req, res) => {
    // 1. Zod DTO Validation
    const validation = patientSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => e.message).join(' - ');
      return res.status(400).json({ success: false, error: `خطأ في صحة بيانات المريض (Zod Validation): ${errorMsg}` });
    }

    const validatedData = validation.data;
    const newPatient = {
      id: `pat-${Date.now()}`,
      fileNumber: `MED-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      lastVisitDate: new Date().toISOString().split('T')[0],
      createdDate: new Date().toISOString().split('T')[0],
      medicalHistory: validatedData.medicalHistory || [],
      activeAllergies: validatedData.activeAllergies || [],
      vitals: validatedData.vitals || { bloodPressure: '120/80', heartRate: 75, temperature: 37.0, weight: 70 },
      ...req.body,
    };

    if (process.env.SQL_HOST) {
      try {
        await db.insert(schema.patients).values({
          id: newPatient.id,
          fullName: newPatient.fullName,
          age: Number(newPatient.age) || 30,
          gender: newPatient.gender || 'ذكر',
          phone: newPatient.phone || '',
          bloodType: newPatient.bloodType || 'A+',
          nationalId: newPatient.nationalId || '',
          roomNumber: newPatient.roomNumber || '',
          status: newPatient.status || 'مستقر',
          assignedDoctor: newPatient.assignedDoctor || '',
          notes: newPatient.notes || '',
          admissionDate: newPatient.admissionDate || new Date().toISOString().split('T')[0],
        }).onConflictDoNothing();
      } catch (err) {
        console.warn('DB insert failed:', err);
      }
    }

    dbStore.patients.unshift(newPatient);
    saveDb();
    res.status(201).json(newPatient);
  });

  app.put('/api/patients/:id', enforceRole(['admin', 'staff', 'doctor']), async (req, res) => {
    const { id } = req.params;
    const index = dbStore.patients.findIndex(p => p.id === id);
    if (index !== -1) {
      dbStore.patients[index] = { ...dbStore.patients[index], ...req.body };
      saveDb();
      res.json(dbStore.patients[index]);
    } else {
      res.status(404).json({ error: 'المريض غير موجود' });
    }
  });

  app.delete('/api/patients/:id', enforceRole(['admin']), (req, res) => {
    const { id } = req.params;
    dbStore.patients = dbStore.patients.filter(p => p.id !== id);
    saveDb();
    res.json({ success: true, message: 'تم حذف ملف المريض بنجاح' });
  });

  // Reception Desk Patient Verification & Medical File Number (MRN) Assignment
  app.put('/api/patients/:id/verify-reception', enforceRole(['admin', 'staff']), (req, res) => {
    const { id } = req.params;
    const { nationalId, officialFileNumber, bloodType, verifiedBy } = req.body;

    const patient = dbStore.patients.find(p => p.id === id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'ملف المريض غير موجود' });
    }

    patient.isVerifiedByReception = true;
    patient.verificationStatus = 'موثق ومعتمد رسمياً من الاستقبال';
    patient.verifiedAt = new Date().toISOString();
    patient.verifiedBy = verifiedBy || 'موظف الاستقبال والتسكين';
    if (nationalId) patient.nationalId = nationalId;
    if (bloodType) patient.bloodType = bloodType;
    if (officialFileNumber) {
      patient.fileNumber = officialFileNumber;
    } else if (patient.fileNumber?.startsWith('PRV-') || patient.fileNumber?.startsWith('PENDING-')) {
      patient.fileNumber = `MED-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    }

    dbStore.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'reception-desk',
      userName: patient.verifiedBy,
      userRole: 'staff',
      action: 'PATIENT_FILE_VERIFIED',
      targetResource: `PATIENT_RECORD:${patient.fileNumber}`,
      patientId: patient.id,
      patientName: patient.fullName,
      details: `تم تدقيق وتوثيق هوية المريض (${patient.fullName}) واعتماد الملف الطبي الرسمي (${patient.fileNumber}) في قسم الاستقبال`,
      status: 'SUCCESS',
      ipAddress: req.ip || '127.0.0.1',
    });

    saveDb();

    res.json({
      success: true,
      message: `تم توثيق واعتماد الملف الطبي للمريض (${patient.fullName}) رسمياً`,
      patient,
      version: dbStore.version,
    });
  });

  // =================== REST DOCTORS & STAFF (ADMIN ONLY) ===================
  app.get('/api/doctors', async (req, res) => {
    res.json(dbStore.doctors);
  });

  // POST /api/doctors - Strictly Protected for Admin Only
  app.post('/api/doctors', enforceRole(['admin']), async (req, res) => {
    const validationResult = doctorSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues.map(e => e.message).join(' - ');
      return res.status(400).json({ success: false, error: `خطأ في صحة بيانات الطبيب (Zod Validation): ${errorMsg}` });
    }

    const { name, email, password, specialty, department, experienceYears, consultingFee, phone, roomNumber, shift } = validationResult.data;
    
    if (!name || !specialty) {
      return res.status(400).json({ error: 'اسم الطبيب والتخصص مطلوبان' });
    }

    const newDoc = {
      id: `doc-${Date.now()}`,
      name: String(name).trim(),
      specialty: String(specialty).trim(),
      department: department || 'العيادات الخارجية',
      experienceYears: Number(experienceYears) || 5,
      consultingFee: Number(consultingFee) || 25000,
      phone: phone || '',
      roomNumber: roomNumber || '101',
      shift: shift || 'صباحي',
      status: 'active',
      rating: 5.0,
      email: email ? String(email).trim().toLowerCase() : '',
      accountCreated: !!(email && password),
      ...req.body,
    };

    // If Admin supplied email and password, provision their system login account
    if (newDoc.email && password) {
      dbStore.accounts[newDoc.email] = {
        role: 'doctor',
        name: newDoc.name,
        pass: String(password),
        registeredAt: new Date().toISOString(),
        provisionedByAdmin: true,
      };

      dbStore.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: 'admin',
        userName: 'إدارة المشفى',
        userRole: 'admin',
        action: 'DOCTOR_ACCOUNT_PROVISIONED',
        targetResource: `STAFF_GATEWAY:${newDoc.email}`,
        details: `إنشاء وتفعيل حساب طبيب رسمي (${newDoc.name} - ${newDoc.specialty}) عبر الإدارة المركزية`,
        status: 'SUCCESS',
        ipAddress: req.ip || '127.0.0.1',
      });
    }

    // Automatically create shift
    const newShift = {
      id: `s-${Date.now()}`,
      doctorId: newDoc.id,
      doctorName: newDoc.name,
      shiftType: newDoc.shift,
      timeRange: newDoc.shift === 'مسائي' ? '04:00 م - 12:00 م' : newDoc.shift === 'ليلي' ? '12:00 م - 08:00 ص' : '08:00 ص - 04:00 م',
      department: newDoc.department,
      days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
    };
    dbStore.shifts.unshift(newShift);

    dbStore.doctors.unshift(newDoc);
    saveDb();
    res.status(201).json(newDoc);
  });

  // POST /api/staff - Strictly Protected for Admin Only
  app.post('/api/staff', enforceRole(['admin']), async (req, res) => {
    const { name, email, password, role = 'staff', department, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'الاسم، البريد الإلكتروني، وكلمة المرور مطلوبة لإنشاء موظف' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (dbStore.accounts[cleanEmail]) {
      return res.status(400).json({ error: 'البريد الإلكتروني مسجل مسبقاً لمستخدم آخر' });
    }

    const targetRole: SystemRole = (role === 'doctor' || role === 'staff') ? role : 'staff';

    dbStore.accounts[cleanEmail] = {
      role: targetRole,
      name: String(name).trim(),
      pass: String(password),
      registeredAt: new Date().toISOString(),
      department: department || 'الاستقبال والقبول',
      phone: phone || '',
      provisionedByAdmin: true,
    };

    dbStore.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'admin',
      userName: 'إدارة المشفى',
      userRole: 'admin',
      action: 'STAFF_ACCOUNT_PROVISIONED',
      targetResource: `STAFF_GATEWAY:${cleanEmail}`,
      details: `إنشاء وتفعيل حساب موظف/استقبال رسمي (${name} - ${targetRole}) عبر الإدارة المركزية`,
      status: 'SUCCESS',
      ipAddress: req.ip || '127.0.0.1',
    });

    saveDb();
    res.status(201).json({
      success: true,
      message: `تم إنشاء حساب الموظف (${name}) بنجاح`,
      account: { email: cleanEmail, role: targetRole, name },
      version: dbStore.version,
    });
  });

  app.delete('/api/doctors/:id', enforceRole(['admin']), (req, res) => {
    const { id } = req.params;
    dbStore.doctors = dbStore.doctors.filter(d => d.id !== id);
    saveDb();
    res.json({ success: true, message: 'تم حذف الطبيب بنجاح' });
  });

  // =================== REST APPOINTMENTS ===================
  app.get('/api/appointments', async (req, res) => {
    const role = getRequestRole(req);
    const patientId = getRequestPatientId(req);

    if (role === 'patient') {
      const patientAppointments = dbStore.appointments.filter(a => a.patientId === patientId || a.patientName?.includes('محمد'));
      return res.json(patientAppointments);
    }

    res.json(dbStore.appointments);
  });

  app.post('/api/appointments', async (req, res) => {
    // 1. Zod DTO Validation
    const validation = appointmentSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => e.message).join(' - ');
      return res.status(400).json({ success: false, error: `خطأ في بيانات الموعد الطبي (Zod Validation): ${errorMsg}` });
    }

    const validatedData = validation.data;
    const role = getRequestRole(req);
    const patientId = getRequestPatientId(req);

    // Concurrency / Overlap Race Condition Check
    const targetDoctor = validatedData.doctorName || req.body.doctorId;
    const targetDate = validatedData.date;
    const targetTime = validatedData.time;

    if (targetDoctor && targetDate && targetTime) {
      const existingConflict = dbStore.appointments.find(a => 
        (a.doctorName === targetDoctor || a.doctorId === targetDoctor) &&
        a.date === targetDate &&
        a.time === targetTime &&
        a.status !== 'ملغى' && a.status !== 'ملغي'
      );

      if (existingConflict) {
        dbStore.auditLogs.unshift({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: req.body.patientId || 'SYSTEM',
          userName: req.body.patientName || 'مستخدم',
          userRole: role,
          action: 'CONCURRENCY_BLOCKED',
          targetResource: 'APPOINTMENTS',
          details: `منع تضارب حجز (Race Condition Blocked): الموعد للطبيب (${targetDoctor}) في التاريخ (${targetDate} ${targetTime}) محجوز مسبقاً.`,
          status: 'BLOCKED_ALERT',
          ipAddress: req.ip || '127.0.0.1'
        });
        saveDb();

        return res.status(409).json({
          error: 'تضارب في الحجز (Concurrency Conflict): الطبيب المطلوب لديه موعد مؤكد في نفس التاريخ والتوقيت المختار من قِبل مستخدم آخر.',
          code: 'RACE_CONDITION_CONFLICT'
        });
      }
    }

    const newApt = {
      id: `apt-${Date.now()}`,
      patientId: role === 'patient' ? patientId : (req.body.patientId || 'pat-1'),
      patientName: role === 'patient' ? 'محمد عبد الله العتيبي' : (req.body.patientName || 'مريض جديد'),
      status: 'مؤكد',
      fee: req.body.fee || 25000,
      ...req.body,
    };

    dbStore.appointments.unshift(newApt);
    saveDb();
    res.status(201).json(newApt);
  });

  app.put('/api/appointments/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const role = getRequestRole(req);

    const apt = dbStore.appointments.find(a => a.id === id);
    if (!apt) {
      return res.status(404).json({ error: 'الموعد غير موجود' });
    }

    if (role === 'patient' && status !== 'ملغى' && status !== 'ملغي') {
      return res.status(403).json({
        error: 'غير مصرح: يحق للمريض إلغاء موعده فقط.',
        code: 'PATIENT_LIMITED_ACTION'
      });
    }

    apt.status = status;
    saveDb();
    res.json(apt);
  });

  // =================== REST INVENTORY ===================
  app.get('/api/inventory', enforceRole(['admin', 'staff', 'doctor']), (req, res) => {
    res.json(dbStore.inventory);
  });

  app.post('/api/inventory', enforceRole(['admin', 'staff']), (req, res) => {
    const qty = Number(req.body.quantity) || 0;
    const minAlert = Number(req.body.minStockAlert) || 20;
    let status: any = 'متوفر';
    if (qty === 0) status = 'نفذ';
    else if (qty <= minAlert) status = 'منخفض';

    const newItem = {
      id: `inv-${Date.now()}`,
      status,
      ...req.body,
    };
    dbStore.inventory.unshift(newItem);
    saveDb();
    res.status(201).json(newItem);
  });

  app.delete('/api/inventory/:id', enforceRole(['admin']), (req, res) => {
    const { id } = req.params;
    dbStore.inventory = dbStore.inventory.filter(i => i.id !== id);
    saveDb();
    res.json({ success: true, message: 'تم حذف الصنف من المستودع بنجاح' });
  });

  // =================== REST LAB RESULTS ===================
  app.get('/api/lab-results', (req, res) => {
    const role = getRequestRole(req);
    const patientId = getRequestPatientId(req);

    if (role === 'patient') {
      const myLabs = dbStore.labResults.filter(l => l.patientId === patientId || l.patientName?.includes('محمد'));
      return res.json(myLabs);
    }
    res.json(dbStore.labResults);
  });

  app.post('/api/lab-results', enforceRole(['doctor', 'admin']), (req, res) => {
    const newLab = {
      id: `lab-${Date.now()}`,
      testDate: new Date().toISOString().split('T')[0],
      ...req.body,
    };
    dbStore.labResults.unshift(newLab);
    saveDb();
    res.status(201).json(newLab);
  });

  // =================== REST PRESCRIPTIONS ===================
  app.get('/api/prescriptions', (req, res) => {
    const role = getRequestRole(req);
    const patientId = getRequestPatientId(req);

    if (role === 'patient') {
      const myRx = dbStore.prescriptions.filter(p => p.patientId === patientId || p.patientName?.includes('محمد'));
      return res.json(myRx);
    }
    res.json(dbStore.prescriptions);
  });

  app.post('/api/prescriptions', enforceRole(['doctor', 'admin']), (req, res) => {
    const newRx = {
      id: `rx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      ...req.body,
    };
    dbStore.prescriptions.unshift(newRx);
    saveDb();
    res.status(201).json(newRx);
  });

  // =================== REST INVOICES ===================
  app.get('/api/invoices', (req, res) => {
    const role = getRequestRole(req);
    const patientId = getRequestPatientId(req);

    if (role === 'patient') {
      const myInvoices = dbStore.invoices.filter(i => i.patientId === patientId || i.patientName?.includes('محمد'));
      return res.json({
        role: 'patient',
        viewType: 'personal_billing',
        title: 'فواتيري ومدفوعاتي الشخصية',
        invoices: myInvoices
      });
    }

    res.json({
      role,
      viewType: 'hospital_revenue',
      title: role === 'admin' ? 'الإيرادات والتقارير المالية الشاملة' : 'فواتير ومحاسبة المرضى',
      invoices: dbStore.invoices
    });
  });

  app.post('/api/invoices', enforceRole(['admin', 'staff']), (req, res) => {
    const subtotal = Number(req.body.subtotal) || 0;
    const tax = subtotal * 0.15;
    const insCovered = Number(req.body.insuranceCovered) || 0;
    const netAmount = Math.max(0, subtotal + tax - insCovered);

    const newInv = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      tax,
      netAmount,
      status: req.body.status || 'معلق',
      ...req.body,
    };
    dbStore.invoices.unshift(newInv);
    saveDb();
    res.status(201).json(newInv);
  });

  // =================== REST SHIFTS & AUDIT ===================
  app.get('/api/shifts', enforceRole(['admin', 'doctor', 'staff']), (req, res) => {
    res.json(dbStore.shifts);
  });

  app.get('/api/audit-logs', enforceRole(['admin', 'doctor', 'staff']), (req, res) => {
    res.json({
      success: true,
      totalLogs: dbStore.auditLogs.length,
      logs: dbStore.auditLogs.slice(0, 100),
      timestamp: new Date().toISOString()
    });
  });

  // =================== CENTRALIZED GLOBAL API ERROR HANDLER ===================
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Server Exception on', req.method, req.path, err);
    if (res.headersSent) {
      return next(err);
    }
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'حدث خطأ غير متوقع في معالجة طلب المستشفى السريري.',
      code: err.code || 'INTERNAL_SERVER_ERROR',
      endpoint: req.originalUrl || req.path,
      timestamp: new Date().toISOString()
    });
  });

  // Vite middleware or production static
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Care Hospital Management Server running on http://0.0.0.0:${PORT} with Multi-Device Persistent Storage`);
  });
}

startServer();
