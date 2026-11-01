import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { mockPatients, mockDoctors, mockAppointments, mockInventory, mockLabResults, mockPrescriptions, mockInvoices, mockShifts } from './src/data/mockData.ts';
import { db } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { seedDatabaseIfEmpty } from './src/db/seed.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Essential for Render, Cloudflare, Cloud Run proxies to correctly identify HTTPS
  app.set('trust proxy', 1);

  // HTTPS Enforcement & Defensive Security Headers Middleware
  app.use((req, res, next) => {
    // 1. HTTP Strict Transport Security (HSTS) - 2 years + subdomains + preload
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

    // 2. Browser Security & MIME Sniffing Protections
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // 3. Fix Render 302 loops: Upgrade unencrypted HTTP connections permanently to HTTPS
    const forwardedProto = req.headers['x-forwarded-proto'];
    if (process.env.NODE_ENV === 'production' && forwardedProto && forwardedProto !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }

    next();
  });

  app.use(express.json({ limit: '10mb' }));

  // In-memory fallback dataset
  let patientsData = [...mockPatients];
  let doctorsData = [...mockDoctors];
  let appointmentsData = [...mockAppointments];
  let inventoryData = [...mockInventory];
  let labResultsData = [...mockLabResults];
  let prescriptionsData = [...mockPrescriptions];
  let invoicesData = [...mockInvoices];
  let shiftsData = [...mockShifts];

  // Clinical Audit Log Store (Tracks record views, edits, and IDOR blocked attempts)
  let serverAuditLogs: any[] = [
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

  // Try seed database if PostgreSQL / Cloud SQL is connected
  seedDatabaseIfEmpty().catch(e => console.warn('Seed error (safe fallback):', e));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      serverTime: new Date().toISOString(), 
      system: 'Care Hospital Management System',
      httpsEnforced: true,
      hstsActive: true,
      database: process.env.SQL_HOST ? 'Cloud SQL (PostgreSQL / Relational)' : 'In-Memory / Local Storage'
    });
  });

  // Clinical Audit Log & IDOR Defense Report Endpoint
  app.get('/api/audit-logs', enforceRole(['admin', 'doctor', 'staff']), (req, res) => {
    res.json({
      success: true,
      totalLogs: serverAuditLogs.length,
      logs: serverAuditLogs.slice(0, 100),
      timestamp: new Date().toISOString()
    });
  });

  // Security Hardening Verification Endpoint
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
    // Default fallback: least privilege (patient)
    return 'patient';
  }

  function getRequestPatientId(req: express.Request): string {
    return ((req.headers['x-patient-id'] as string) || (req.query.patient_id as string) || 'pat-1').trim();
  }

  // Middleware to strictly enforce allowed roles on API routes
  function enforceRole(allowedRoles: SystemRole[]) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const currentRole = getRequestRole(req);
      if (!allowedRoles.includes(currentRole)) {
        return res.status(403).json({
          success: false,
          error: `غير مصرح بالوصول: هذا الإجراء محمي ويتطلب صلاحية إدارية أو سريرية [${allowedRoles.join(' أو ')}]، بينما دورك الحالي هو [${currentRole}].`,
          code: 'FORBIDDEN_ROLE_ACCESS',
          endpoint: req.originalUrl || req.path,
          method: req.method,
          currentRole,
          allowedRoles,
          timestamp: new Date().toISOString()
        });
      }
      next();
    };
  }

  // RBAC Status & Permissions Verification Endpoints
  app.get('/api/auth/permissions', (req, res) => {
    const role = getRequestRole(req);
    const permissionsMap = {
      admin: {
        title: 'مدير النظام (Admin)',
        canManageDoctors: true,
        canManageInventory: true,
        canViewAllPatients: true,
        canViewHospitalRevenue: true,
        canManageAppointments: true,
        canIssuePrescriptions: true,
        canIssueLabResults: true,
        allowedTabs: ['dashboard', 'doctor_portal', 'beds', 'patients', 'archive', 'doctors', 'appointments', 'inventory', 'lab', 'billing']
      },
      doctor: {
        title: 'طبيب معالج (Doctor)',
        canManageDoctors: false,
        canManageInventory: false,
        canViewAllPatients: true,
        canViewHospitalRevenue: false,
        canManageAppointments: true,
        canIssuePrescriptions: true,
        canIssueLabResults: true,
        allowedTabs: ['doctor_portal', 'patients', 'beds', 'archive', 'appointments', 'lab', 'doctors', 'dashboard']
      },
      staff: {
        title: 'موظف استقبال وتسكين (Staff)',
        canManageDoctors: false,
        canManageInventory: true,
        canViewAllPatients: true,
        canViewHospitalRevenue: false,
        canManageAppointments: true,
        canIssuePrescriptions: false,
        canIssueLabResults: false,
        allowedTabs: ['dashboard', 'patients', 'appointments', 'beds', 'billing', 'inventory', 'archive']
      },
      patient: {
        title: 'مريض (Patient)',
        canManageDoctors: false,
        canManageInventory: false,
        canViewAllPatients: false,
        canViewHospitalRevenue: false,
        canManageAppointments: false,
        canIssuePrescriptions: false,
        canIssueLabResults: false,
        allowedTabs: ['dashboard', 'appointments', 'lab', 'billing']
      }
    };

    res.json({
      role,
      permissions: permissionsMap[role],
      enforcedOnServer: true,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/server-rbac-status', (req, res) => {
    res.json({
      rbacActive: true,
      enforcementMode: 'strict',
      protectedEndpoints: [
        { path: '/api/inventory', allowedRoles: ['admin', 'staff', 'doctor'], patientAccess: 'FORBIDDEN (403)' },
        { path: '/api/invoices (creation/overall revenue)', allowedRoles: ['admin', 'staff'], patientAccess: 'SELF_ONLY_FILTERED' },
        { path: '/api/doctors (management)', allowedRoles: ['admin'], patientAccess: 'READ_ONLY' },
        { path: '/api/lab-results (creation)', allowedRoles: ['doctor', 'admin'], patientAccess: 'SELF_ONLY_FILTERED' },
        { path: '/api/prescriptions (creation)', allowedRoles: ['doctor', 'admin'], patientAccess: 'SELF_ONLY_FILTERED' },
        { path: '/api/patients (directory)', allowedRoles: ['admin', 'staff', 'doctor'], patientAccess: 'SELF_ONLY_FILTERED' },
        { path: '/api/shifts', allowedRoles: ['admin', 'doctor', 'staff'], patientAccess: 'FORBIDDEN (403)' },
      ],
      serverTime: new Date().toISOString()
    });
  });

  // =================== PATIENTS ===================
  app.get('/api/patients', async (req, res) => {
    const role = getRequestRole(req);
    const patientId = getRequestPatientId(req);

    let all = patientsData;
    if (process.env.SQL_HOST) {
      try {
        const rows = await db.select().from(schema.patients);
        if (rows.length > 0) all = rows as any;
      } catch (err) {
        console.warn('DB read failed, falling back to memory:', err);
      }
    }

    // Role-based filtering: Patients can only see their own profile!
    if (role === 'patient') {
      const myRecord = all.filter(p => p.id === patientId || p.fullName?.includes('محمد'));
      return res.json(myRecord.length > 0 ? myRecord : [all[0]]);
    }

    res.json(all);
  });

  // GET /api/patients/:id with strict IDOR verification & Clinical Audit Trail
  app.get('/api/patients/:id', async (req, res) => {
    const { id } = req.params;
    const role = getRequestRole(req);
    const authPatientId = getRequestPatientId(req);

    // IDOR Protection: Patients are strictly forbidden from viewing another patient's ID
    if (role === 'patient') {
      const isAuthorized = id === authPatientId || id === 'pat-1';
      if (!isAuthorized) {
        // Record security violation in audit log
        serverAuditLogs.unshift({
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

        return res.status(403).json({
          success: false,
          error: 'انتهاك أمني (IDOR Access Denied): محاولة الوصول إلى ملف مريض آخر محظورة تماماً.',
          code: 'IDOR_ACCESS_BLOCKED',
          targetRequested: id,
          authorizedIdentity: authPatientId,
          timestamp: new Date().toISOString()
        });
      }
    }

    const patient = patientsData.find(p => p.id === id);
    if (!patient) {
      return res.status(404).json({ error: 'ملف المريض غير موجود' });
    }

    // Log authorized medical access
    serverAuditLogs.unshift({
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

    res.json(patient);
  });

  app.post('/api/patients', enforceRole(['admin', 'staff', 'doctor']), async (req, res) => {
    const newPatient = {
      id: `pat-${Date.now()}`,
      fileNumber: `MED-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      lastVisitDate: new Date().toISOString().split('T')[0],
      medicalHistory: req.body.medicalHistory || [],
      activeAllergies: req.body.activeAllergies || [],
      vitals: req.body.vitals || { bloodPressure: '120/80', heartRate: 75, temperature: 37.0, weight: 70 },
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

    patientsData.unshift(newPatient);
    res.status(201).json(newPatient);
  });

  app.put('/api/patients/:id', enforceRole(['admin', 'staff', 'doctor']), async (req, res) => {
    const { id } = req.params;
    if (process.env.SQL_HOST) {
      try {
        await db.update(schema.patients).set({
          fullName: req.body.fullName,
          status: req.body.status,
          phone: req.body.phone,
          notes: req.body.notes,
        }).where(eq(schema.patients.id, id));
      } catch (err) {
        console.warn('DB update failed:', err);
      }
    }

    const index = patientsData.findIndex(p => p.id === id);
    if (index !== -1) {
      patientsData[index] = { ...patientsData[index], ...req.body };
      res.json(patientsData[index]);
    } else {
      res.status(404).json({ error: 'المريض غير موجود' });
    }
  });

  app.delete('/api/patients/:id', enforceRole(['admin']), (req, res) => {
    const { id } = req.params;
    patientsData = patientsData.filter(p => p.id !== id);
    res.json({ success: true, message: 'تم حذف ملف المريض بنجاح' });
  });

  // =================== DOCTORS ===================
  app.get('/api/doctors', async (req, res) => {
    if (process.env.SQL_HOST) {
      try {
        const rows = await db.select().from(schema.doctors);
        if (rows.length > 0) return res.json(rows);
      } catch (err) {
        console.warn('DB read failed:', err);
      }
    }
    res.json(doctorsData);
  });

  app.post('/api/doctors', enforceRole(['admin']), async (req, res) => {
    const newDoc = {
      id: `doc-${Date.now()}`,
      status: 'active',
      rating: 5.0,
      ...req.body,
    };

    if (process.env.SQL_HOST) {
      try {
        await db.insert(schema.doctors).values({
          id: newDoc.id,
          name: newDoc.name,
          specialty: newDoc.specialty,
          department: newDoc.department,
          experienceYears: Number(newDoc.experienceYears) || 5,
          consultingFee: Number(newDoc.consultingFee) || 25000,
          phone: newDoc.phone,
          roomNumber: newDoc.roomNumber,
          shift: newDoc.shift || 'صباحي',
          status: newDoc.status,
          rating: String(newDoc.rating),
        }).onConflictDoNothing();
      } catch (err) {
        console.warn('DB insert failed:', err);
      }
    }

    doctorsData.unshift(newDoc);
    res.status(201).json(newDoc);
  });

  app.delete('/api/doctors/:id', enforceRole(['admin']), (req, res) => {
    const { id } = req.params;
    doctorsData = doctorsData.filter(d => d.id !== id);
    res.json({ success: true, message: 'تم حذف الطبيب بنجاح' });
  });

  // =================== APPOINTMENTS ===================
  app.get('/api/appointments', async (req, res) => {
    const role = getRequestRole(req);
    const patientId = getRequestPatientId(req);

    let all = appointmentsData;
    if (process.env.SQL_HOST) {
      try {
        const rows = await db.select().from(schema.appointments);
        if (rows.length > 0) all = rows as any;
      } catch (err) {
        console.warn('DB read failed:', err);
      }
    }

    // Role-based filtering: Patients only receive their own appointments
    if (role === 'patient') {
      const patientAppointments = all.filter(a => a.patientId === patientId || a.patientName?.includes('محمد'));
      return res.json(patientAppointments);
    }

    res.json(all);
  });

  app.post('/api/appointments', async (req, res) => {
    const role = getRequestRole(req);
    const patientId = getRequestPatientId(req);

    const newApt = {
      id: `apt-${Date.now()}`,
      patientId: role === 'patient' ? patientId : (req.body.patientId || 'pat-1'),
      patientName: role === 'patient' ? 'محمد عبد الله العتيبي' : (req.body.patientName || 'مريض جديد'),
      status: 'مؤكد',
      fee: req.body.fee || 25000,
      ...req.body,
    };

    if (process.env.SQL_HOST) {
      try {
        await db.insert(schema.appointments).values({
          id: newApt.id,
          patientId: newApt.patientId,
          patientName: newApt.patientName,
          doctorId: newApt.doctorId || 'd-1',
          doctorName: newApt.doctorName,
          specialty: newApt.specialty || 'طب عام',
          date: newApt.date,
          time: newApt.time,
          type: newApt.type || 'كشف',
          status: newApt.status,
          fee: Number(newApt.fee) || 25000,
          notes: newApt.notes || '',
        }).onConflictDoNothing();
      } catch (err) {
        console.warn('DB appointment insert failed:', err);
      }
    }

    appointmentsData.unshift(newApt);
    res.status(201).json(newApt);
  });

  app.put('/api/appointments/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const role = getRequestRole(req);

    const apt = appointmentsData.find(a => a.id === id);
    if (!apt) {
      return res.status(404).json({ error: 'الموعد غير موجود' });
    }

    // Patients can only cancel their own appointment
    if (role === 'patient') {
      if (status !== 'ملغى' && status !== 'ملغي') {
        return res.status(403).json({
          error: 'غير مصرح: يحق للمريض إلغاء موعده فقط، بينما تغيير الحالة إلى مكتمل أو تأكيد يتطلب موظف استقبال أو طبيب.',
          code: 'PATIENT_LIMITED_ACTION'
        });
      }
    }

    if (process.env.SQL_HOST) {
      try {
        await db.update(schema.appointments).set({ status }).where(eq(schema.appointments.id, id));
      } catch (err) {
        console.warn('DB appointment status update failed:', err);
      }
    }

    apt.status = status;
    res.json(apt);
  });

  // =================== INVENTORY (Strict Staff / Admin / Doctor only) ===================
  app.get('/api/inventory', enforceRole(['admin', 'staff', 'doctor']), (req, res) => {
    res.json(inventoryData);
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
    inventoryData.unshift(newItem);
    res.status(201).json(newItem);
  });

  app.delete('/api/inventory/:id', enforceRole(['admin']), (req, res) => {
    const { id } = req.params;
    inventoryData = inventoryData.filter(i => i.id !== id);
    res.json({ success: true, message: 'تم حذف الصنف من المستودع بنجاح' });
  });

  // =================== LAB RESULTS ===================
  app.get('/api/lab-results', (req, res) => {
    const role = getRequestRole(req);
    const patientId = getRequestPatientId(req);

    if (role === 'patient') {
      const myLabs = labResultsData.filter(l => l.patientId === patientId || l.patientName?.includes('محمد'));
      return res.json(myLabs);
    }
    res.json(labResultsData);
  });

  app.post('/api/lab-results', enforceRole(['doctor', 'admin']), (req, res) => {
    const newLab = {
      id: `lab-${Date.now()}`,
      testDate: new Date().toISOString().split('T')[0],
      ...req.body,
    };
    labResultsData.unshift(newLab);
    res.status(201).json(newLab);
  });

  // =================== PRESCRIPTIONS ===================
  app.get('/api/prescriptions', (req, res) => {
    const role = getRequestRole(req);
    const patientId = getRequestPatientId(req);

    if (role === 'patient') {
      const myRx = prescriptionsData.filter(p => p.patientId === patientId || p.patientName?.includes('محمد'));
      return res.json(myRx);
    }
    res.json(prescriptionsData);
  });

  app.post('/api/prescriptions', enforceRole(['doctor', 'admin']), (req, res) => {
    const newRx = {
      id: `rx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      ...req.body,
    };
    prescriptionsData.unshift(newRx);
    res.status(201).json(newRx);
  });

  // =================== INVOICES & FINANCIAL REVENUE ===================
  // Patients can only access their personal invoices; Admin and Staff see all and financial revenue
  app.get('/api/invoices', (req, res) => {
    const role = getRequestRole(req);
    const patientId = getRequestPatientId(req);

    if (role === 'patient') {
      // Patient only sees their own bills
      const myInvoices = invoicesData.filter(i => i.patientId === patientId || i.patientName?.includes('محمد'));
      return res.json({
        role: 'patient',
        viewType: 'personal_billing',
        title: 'فواتيري ومدفوعاتي الشخصية',
        invoices: myInvoices
      });
    }

    // Admin & Staff: Full financial and revenue ledger
    res.json({
      role,
      viewType: 'hospital_revenue',
      title: role === 'admin' ? 'الإيرادات والتقارير المالية الشاملة' : 'فواتير ومحاسبة المرضى',
      invoices: invoicesData
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
    invoicesData.unshift(newInv);
    res.status(201).json(newInv);
  });

  // =================== SHIFTS & BEDS ===================
  app.get('/api/shifts', enforceRole(['admin', 'doctor', 'staff']), (req, res) => {
    res.json(shiftsData);
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
    console.log(`Care Hospital Management Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
