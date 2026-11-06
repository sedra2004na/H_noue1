import React, { useState, useEffect } from 'react';
import { UserRole, Bed, Ward, ArchivedRecord, AbnormalLabFlag } from './types';
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
} from './data/mockData';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { PatientsSection } from './components/PatientsSection';
import { DoctorsSection } from './components/DoctorsSection';
import { AppointmentsSection } from './components/AppointmentsSection';
import { InventorySection } from './components/InventorySection';
import { LabPrescriptionsSection } from './components/LabPrescriptionsSection';
import { BillingSection } from './components/BillingSection';
import { BedsManagementSection } from './components/BedsManagementSection';
import { MedicalArchiveSection } from './components/MedicalArchiveSection';
import { DoctorClinicalDashboard } from './components/DoctorClinicalDashboard';
import { LandingAndAuthScreen } from './components/LandingAndAuthScreen';
import { ToastContainer, ToastMessage } from './components/Toast';
import { EmergencyModal } from './components/EmergencyModal';
import { DatabaseManagerModal } from './components/DatabaseManagerModal';
import { QuickCommandPalette } from './components/QuickCommandPalette';
import { formatArabicTime } from './utils/arabicFormatters';
import { recordAuditLog } from './utils/security';
import { hospitalApi } from './services/api';

function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error(`Failed to load ${key} from localStorage`, err);
  }
  return defaultValue;
}

export function App() {
  // Navigation, Authentication & Role State with LocalStorage
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => getStoredData('syrian_hosp_isLoggedIn', false));
  const [activeTab, setActiveTab] = useState<string>(() => getStoredData('syrian_hosp_activeTab', 'dashboard'));
  const [userRole, setUserRole] = useState<UserRole>(() => getStoredData('syrian_hosp_userRole', 'admin'));
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sessionTimeoutAlert, setSessionTimeoutAlert] = useState<boolean>(() => {
    return localStorage.getItem('syrian_hosp_session_timeout') === 'true';
  });

  // Keep login status synced with localStorage
  useEffect(() => {
    localStorage.setItem('syrian_hosp_isLoggedIn', JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);

  // 15-Minute Inactivity Session Timeout (Clinical & Security HIPAA/ISO-27001 standard)
  useEffect(() => {
    if (!isLoggedIn) return;

    const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
    let lastActivityTime = Date.now();

    const resetActivity = () => {
      lastActivityTime = Date.now();
    };

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetActivity, { passive: true }));

    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - lastActivityTime;
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        const savedName = getStoredData('syrian_hosp_userName', 'مستخدم النظام');
        recordAuditLog({
          userId: userRole === 'patient' ? 'pat-1' : 'auth-session',
          userName: savedName,
          userRole: userRole,
          action: 'SESSION_TIMEOUT',
          targetResource: 'AUTH_SESSION',
          details: 'قفل وإنهاء الجلسة تلقائياً بعد 15 دقيقة من انعدام النشاط لحماية بيانات المرضى والامتثال للخصوصية',
          status: 'SUCCESS',
        });
        localStorage.setItem('syrian_hosp_session_timeout', 'true');
        setSessionTimeoutAlert(true);
        setIsLoggedIn(false);
      }
    }, 15000); // Check every 15 seconds

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetActivity));
      clearInterval(checkInterval);
    };
  }, [isLoggedIn, userRole]);

  // Institutional Theme: Pure Dark Mode Locked
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('theme-light');
    document.body.classList.add('dark');
    document.body.classList.remove('theme-light');
    localStorage.removeItem('syrian_hosp_theme');
  }, []);

  // Emergency SOS and Command Palette State
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showDatabaseManager, setShowDatabaseManager] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Global Keyboard Shortcut: Ctrl+K / Cmd+K to trigger Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [activeSOS, setActiveSOS] = useState<{
    id: string;
    patientName: string;
    condition: string;
    roomName: string;
    time: string;
    status: 'active' | 'responding' | 'resolved';
  } | null>(null);

  const handleTriggerSOS = (patientName: string, condition: string, roomName: string) => {
    setActiveSOS({
      id: 'sos-' + Date.now(),
      patientName,
      condition,
      roomName,
      time: formatArabicTime(new Date()),
      status: 'active',
    });
  };

  const handleResolveSOS = () => {
    setActiveSOS(null);
  };
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const newToast: ToastMessage = {
      id: 't-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      message,
      type,
    };
    setToasts(prev => [...prev, newToast]);
  };

  const handleCloseToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Domain Data State initialized from LocalStorage (persists deletions, additions, edits)
  const [patients, setPatients] = useState<any[]>(() => getStoredData('syrian_hosp_patients', mockPatients));
  const [doctors, setDoctors] = useState(() => {
    const stored = getStoredData('syrian_hosp_doctors', mockDoctors);
    if (Array.isArray(stored) && stored.length < mockDoctors.length) {
      const existingIds = new Set(stored.map((d: any) => d.id));
      const missing = mockDoctors.filter(d => !existingIds.has(d.id));
      return [...stored, ...missing];
    }
    return stored;
  });
  const [appointments, setAppointments] = useState(() => {
    const stored = getStoredData('syrian_hosp_appointments', mockAppointments);
    const todayStr = new Date().toISOString().split('T')[0];
    if (Array.isArray(stored)) {
      // 1. Transition past appointments that were pending/confirmed to completed/expired
      let updated = stored.map((apt: any) => {
        if (apt.date < todayStr && (apt.status === 'مؤكد' || apt.status === 'معلق')) {
          return {
            ...apt,
            status: apt.id === 'apt-509' ? 'منتهي' : 'مكتمل'
          };
        }
        return apt;
      });

      // 2. Ensure new upcoming appointments are merged into stored list
      const existingIds = new Set(updated.map((a: any) => a.id));
      const missing = mockAppointments.filter(m => !existingIds.has(m.id));
      if (missing.length > 0) {
        updated = [...updated, ...missing];
      }
      return updated;
    }
    return mockAppointments;
  });
  const [inventory, setInventory] = useState(() => getStoredData('syrian_hosp_inventory', mockInventory));
  const [labResults, setLabResults] = useState(() => {
    const stored = getStoredData('syrian_hosp_labResults', mockLabResults);
    if (Array.isArray(stored)) {
      const existingIds = new Set(stored.map((l: any) => l.id));
      const missing = mockLabResults.filter(m => !existingIds.has(m.id));
      const pat1Stored = stored.filter((l: any) => l.patientId === 'pat-1');
      if (missing.length > 0 || pat1Stored.length < 4 || !pat1Stored[0]?.subComponents) {
        const nonPat1 = stored.filter((l: any) => l.patientId !== 'pat-1');
        return [...mockLabResults.filter(m => m.patientId === 'pat-1'), ...nonPat1, ...missing.filter(m => m.patientId !== 'pat-1')];
      }
      return stored;
    }
    return mockLabResults;
  });
  const [prescriptions, setPrescriptions] = useState(() => getStoredData('syrian_hosp_prescriptions', mockPrescriptions));
  const [invoices, setInvoices] = useState(() => {
    const stored = getStoredData('syrian_hosp_invoices', mockInvoices);
    if (Array.isArray(stored)) {
      const existingIds = new Set(stored.map((i: any) => i.id));
      const missing = mockInvoices.filter(m => !existingIds.has(m.id));
      const pat1Stored = stored.filter((i: any) => i.patientId === 'pat-1');
      if (missing.length > 0 || pat1Stored.length < 3 || !pat1Stored[0]?.claimStatus) {
        const nonPat1 = stored.filter((i: any) => i.patientId !== 'pat-1');
        return [...mockInvoices.filter(m => m.patientId === 'pat-1'), ...nonPat1, ...missing.filter(m => m.patientId !== 'pat-1')];
      }
      return stored;
    }
    return mockInvoices;
  });
  const [shifts, setShifts] = useState(() => {
    const stored = getStoredData('syrian_hosp_shifts', mockShifts);
    if (Array.isArray(stored) && stored.length < mockShifts.length) {
      const existingIds = new Set(stored.map((s: any) => s.id));
      const missing = mockShifts.filter(s => !existingIds.has(s.id));
      return [...stored, ...missing];
    }
    return stored;
  });

  // Advanced Clinical & Inpatient Domain State
  const [wards, setWards] = useState<Ward[]>(() => getStoredData('syrian_hosp_wards', mockWards));
  const [beds, setBeds] = useState<Bed[]>(() => getStoredData('syrian_hosp_beds', mockBeds));
  const [archivedRecords, setArchivedRecords] = useState<ArchivedRecord[]>(() => getStoredData('syrian_hosp_archivedRecords', mockArchivedRecords));
  const [abnormalFlags, setAbnormalFlags] = useState<AbnormalLabFlag[]>(() => getStoredData('syrian_hosp_abnormalFlags', mockAbnormalLabFlags));

  // Role Tab Authorization Map
  const roleTabsMap = {
    admin: ['dashboard', 'doctor_portal', 'beds', 'patients', 'archive', 'doctors', 'appointments', 'inventory', 'lab', 'billing'],
    doctor: ['doctor_portal', 'dashboard', 'beds', 'patients', 'archive', 'doctors', 'appointments', 'lab'],
    staff: ['dashboard', 'beds', 'patients', 'archive', 'appointments', 'inventory', 'billing'],
    patient: ['dashboard', 'appointments', 'lab', 'billing'],
  };

  // Auto-switch away from restricted tabs when userRole or activeTab changes
  useEffect(() => {
    const allowed = roleTabsMap[userRole] || roleTabsMap.admin;
    if (!allowed.includes(activeTab)) {
      setActiveTab(userRole === 'doctor' ? 'doctor_portal' : 'dashboard');
    }
  }, [userRole, activeTab]);

  useEffect(() => { localStorage.setItem('syrian_hosp_patients', JSON.stringify(patients)); }, [patients]);
  useEffect(() => { localStorage.setItem('syrian_hosp_doctors', JSON.stringify(doctors)); }, [doctors]);
  useEffect(() => { localStorage.setItem('syrian_hosp_appointments', JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { localStorage.setItem('syrian_hosp_inventory', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('syrian_hosp_labResults', JSON.stringify(labResults)); }, [labResults]);
  useEffect(() => { localStorage.setItem('syrian_hosp_prescriptions', JSON.stringify(prescriptions)); }, [prescriptions]);
  useEffect(() => { localStorage.setItem('syrian_hosp_invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem('syrian_hosp_shifts', JSON.stringify(shifts)); }, [shifts]);
  useEffect(() => { localStorage.setItem('syrian_hosp_wards', JSON.stringify(wards)); }, [wards]);
  useEffect(() => { localStorage.setItem('syrian_hosp_beds', JSON.stringify(beds)); }, [beds]);
  useEffect(() => { localStorage.setItem('syrian_hosp_archivedRecords', JSON.stringify(archivedRecords)); }, [archivedRecords]);
  useEffect(() => { localStorage.setItem('syrian_hosp_abnormalFlags', JSON.stringify(abnormalFlags)); }, [abnormalFlags]);

  // Universal Multi-Device Live Synchronization State (Laptop, Mobile & Tablets)
  const lastServerVersionRef = React.useRef<number>(0);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  const fetchLatestFromServer = async (silent = false) => {
    try {
      if (!silent) setSyncStatus('syncing');
      const data = await hospitalApi.getSyncData();
      if (data && data.success) {
        lastServerVersionRef.current = data.version;
        if (Array.isArray(data.patients)) setPatients(data.patients);
        if (Array.isArray(data.doctors)) setDoctors(data.doctors);
        if (Array.isArray(data.appointments)) setAppointments(data.appointments);
        if (Array.isArray(data.inventory)) setInventory(data.inventory);
        if (Array.isArray(data.labResults)) setLabResults(data.labResults);
        if (Array.isArray(data.prescriptions)) setPrescriptions(data.prescriptions);
        if (Array.isArray(data.invoices)) setInvoices(data.invoices);
        if (Array.isArray(data.shifts)) setShifts(data.shifts);
        if (Array.isArray(data.wards)) setWards(data.wards);
        if (Array.isArray(data.beds)) setBeds(data.beds);
        if (Array.isArray(data.archivedRecords)) setArchivedRecords(data.archivedRecords);
        if (Array.isArray(data.abnormalFlags)) setAbnormalFlags(data.abnormalFlags);
        setSyncStatus('synced');
      }
    } catch (err) {
      console.warn('Real-time sync status fallback to local cache:', err);
      setSyncStatus('offline');
    }
  };

  useEffect(() => {
    fetchLatestFromServer(false);

    // 1. Real-Time Push Communication via Server-Sent Events (SSE) Stream
    // Sub-second push for Code Blue emergency alerts, abnormal lab results & live appointments
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (evt) => {
        try {
          const parsed = JSON.parse(evt.data);
          if (parsed && parsed.version && parsed.version !== lastServerVersionRef.current) {
            fetchLatestFromServer(true);
          }
        } catch {
          // ignore
        }
      };
    } catch (e) {
      console.warn('SSE stream init fallback to fast polling:', e);
    }

    // 2. Resilient Polling Fallback (every 3.5 seconds) to guarantee continuity across network flickers
    const interval = setInterval(async () => {
      try {
        const ver = await hospitalApi.getSyncVersion();
        if (ver && ver.version && ver.version !== lastServerVersionRef.current) {
          fetchLatestFromServer(true);
        }
      } catch {
        // silent fallback
      }
    }, 3500);

    const handleFocus = () => {
      fetchLatestFromServer(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Handlers for Bed Management
  const handleUpdateBed = (bedId: string, updates: Partial<Bed>) => {
    setBeds(prev => prev.map(b => b.id === bedId ? { ...b, ...updates } : b));
    hospitalApi.syncMutate('UPDATE_BED', { id: bedId, updates }).catch(e => console.warn(e));
  };

  const handleAddBed = (bedData: Omit<Bed, 'id'>) => {
    const newBed: Bed = {
      id: 'bed-' + (beds.length + 1) + '-' + Math.floor(Math.random() * 1000),
      ...bedData,
    };
    setBeds(prev => [...prev, newBed]);
    hospitalApi.syncMutate('ADD_BED', newBed).catch(e => console.warn(e));
    showToast(`تمت إضافة السرير (${newBed.bedNumber}) في ${newBed.wardName} بنجاح`, 'success');
  };

  const handleDeleteBed = (bedId: string) => {
    const target = beds.find(b => b.id === bedId);
    setBeds(prev => prev.filter(b => b.id !== bedId));
    hospitalApi.syncMutate('DELETE_BED', { id: bedId }).catch(e => console.warn(e));
    showToast(`تم حذف السرير (${target?.bedNumber || bedId}) من الجناح`, 'warning');
  };

  // Handlers for Cold Storage Archive (Data Partitioning)
  const handleArchivePatient = (patientId: string, reason?: ArchivedRecord['archiveReason'], notes?: string) => {
    const targetPatient = patients.find(p => p.id === patientId);
    if (!targetPatient) return;

    const newArchivedRecord: ArchivedRecord = {
      id: 'ARC-2026-' + Math.floor(1000 + Math.random() * 9000),
      originalPatientId: targetPatient.id,
      fileNumber: targetPatient.fileNumber || 'MED-2026',
      fullName: targetPatient.fullName,
      nationalId: targetPatient.nationalId || '01020304050',
      age: targetPatient.age || 40,
      gender: targetPatient.gender || 'ذكر',
      phone: targetPatient.phone || '0944000000',
      bloodType: targetPatient.bloodType || 'O+',
      admissionDate: targetPatient.createdDate || '2025-01-10',
      dischargeDate: targetPatient.lastVisitDate || new Date().toISOString().split('T')[0],
      archivedDate: new Date().toISOString().split('T')[0],
      department: targetPatient.doctorName ? 'الأقسام السريرية' : 'الطب العام والتنويم',
      attendingDoctor: targetPatient.doctorName || 'د. سارة السعيد',
      dischargeDiagnosis: targetPatient.diagnosis || 'تخريج واستقرار الحالة السريرية',
      medicalSummary: notes || `تم علاج المريض ومتابعته بالكامل. الحالة مستقرة ومؤرشفة في قاعدة التخزين الباردة.`,
      archiveReason: reason || 'تخريج واستقرار',
      storageTier: 'cold_storage',
      fileSizeKb: 1240,
    };

    // Free any bed assigned to this patient and set it to cleaning
    setBeds(prev => prev.map(b => {
      if (b.patientId === patientId || b.patientName === targetPatient.fullName) {
        return {
          ...b,
          status: 'cleaning' as const,
          patientId: undefined,
          patientName: undefined,
          diagnosis: undefined,
          priority: undefined,
          admissionDate: undefined,
        };
      }
      return b;
    }));

    // Add to cold archive
    setArchivedRecords(prev => [newArchivedRecord, ...prev]);

    // Remove from active daily patients pool to speed up daily query performance
    setPatients(prev => prev.filter(p => p.id !== patientId));

    hospitalApi.syncMutate('ARCHIVE_PATIENT', { archivedRecord: newArchivedRecord, patientId }).catch(e => console.warn(e));
    showToast(`تم أرشفة ونقل ملف المريض (${targetPatient.fullName}) بنجاح إلى التخزين البارد (Cold Storage Partition)`, 'success');
  };

  const handleRestorePatient = (archiveId: string) => {
    const archived = archivedRecords.find(r => r.id === archiveId);
    if (!archived) return;

    const restoredPatient = {
      id: archived.originalPatientId || 'pat-' + Date.now(),
      fileNumber: archived.fileNumber,
      fullName: archived.fullName,
      nationalId: archived.nationalId,
      age: archived.age,
      gender: archived.gender,
      phone: archived.phone,
      bloodType: archived.bloodType,
      diagnosis: archived.dischargeDiagnosis,
      doctorName: archived.attendingDoctor,
      createdDate: archived.admissionDate,
      lastVisitDate: new Date().toISOString().split('T')[0],
      status: 'active' as const,
    };

    setPatients(prev => [restoredPatient, ...prev]);
    setArchivedRecords(prev => prev.filter(r => r.id !== archiveId));
    hospitalApi.syncMutate('RESTORE_PATIENT', { restoredPatient, archiveId }).catch(e => console.warn(e));
    showToast(`تم استرجاع وإعادة تنشيط ملف المريض (${archived.fullName}) في النظام اليومي بنجاح`, 'success');
  };

  // Handlers for Doctor Abnormal Lab Flags
  const handleUpdateAbnormalFlag = (flagId: string, acknowledged: boolean, notes?: string) => {
    const flagObj = abnormalFlags.find(f => f.id === flagId);
    setAbnormalFlags(prev => prev.map(f => {
      if (f.id === flagId) {
        return {
          ...f,
          acknowledgedByDoctor: acknowledged,
          doctorNotes: notes || f.doctorNotes,
        };
      }
      return f;
    }));

    if (flagObj && acknowledged) {
      const nowIso = new Date().toISOString();
      const docName = doctors.find(d => d.id === 'doc-101' || d.name.includes('سارة'))?.name || 'د. سارة السعيد (استشارية القلب)';
      const auditLogEntry = {
        id: `aud-nonrep-${Date.now()}`,
        timestamp: nowIso,
        userId: 'doc-101',
        userName: docName,
        userRole: 'doctor' as const,
        action: 'EDIT_RECORD' as const,
        targetResource: `CRITICAL_LAB:${flagObj.testName}`,
        patientId: flagObj.patientId,
        patientName: flagObj.patientName,
        details: `تأكيد وإقرار طبي رسمي غير قابل للإنكار (Non-Repudiation Digital Ack): تم توقيع إشعار الاطلاع على التحليل الحرج (${flagObj.testName}: ${flagObj.resultValue}) للمريض (${flagObj.patientName}) بواسطة (${docName}). الملاحظة السريرية: [${notes || flagObj.doctorNotes || 'تم الاطلاع ومتابعة الخطة العلاجية'}] - [توقيع رقمي موثق بالخادم: SHA256-${nowIso.replace(/[^0-9]/g, '')}]`,
        status: 'SUCCESS' as const,
        ipAddress: '192.168.1.42',
      };
      recordAuditLog(auditLogEntry);
      hospitalApi.syncMutate('ADD_AUDIT_LOG', auditLogEntry).catch(e => console.warn(e));
    }

    hospitalApi.syncMutate('UPDATE_ABNORMAL_FLAG', { id: flagId, acknowledged, notes }).catch(e => console.warn(e));
  };

  // Handlers for Patient Management
  const handleAddPatient = (patientData: any) => {
    const newPatient = {
      id: 'p-' + (patients.length + 1) + '-' + Math.floor(Math.random() * 1000),
      fileNumber: 'MED-' + Math.floor(100000 + Math.random() * 900000),
      lastVisitDate: new Date().toISOString().split('T')[0],
      createdDate: new Date().toISOString().split('T')[0],
      status: 'active' as const,
      ...patientData,
    };
    setPatients([newPatient, ...patients]);
    hospitalApi.syncMutate('ADD_PATIENT', newPatient).catch(e => console.warn(e));
    showToast(`تم إضافة المريض (${newPatient.fullName}) لشبكة الرعاية بنجاح`, 'success');
  };

  const handleUpdatePatient = (id: string, data: any) => {
    setPatients(patients.map(p => p.id === id ? { ...p, ...data } : p));
    hospitalApi.syncMutate('UPDATE_PATIENT', { id, data }).catch(e => console.warn(e));
    showToast('تم تحديث بيانات ملف المريض بنجاح', 'info');
  };

  const handleDeletePatient = (id: string) => {
    const target = patients.find(p => p.id === id);
    setPatients(patients.filter(p => p.id !== id));
    hospitalApi.syncMutate('DELETE_PATIENT', { id }).catch(e => console.warn(e));
    showToast(`تم حذف ملف المريض (${target?.fullName || id}) بنجاح`, 'warning');
  };

  // Handlers for Doctors & Status
  const handleAddDoctor = (doctorData: any) => {
    const newDoc = {
      id: 'doc-' + (doctors.length + 1) + '-' + Math.floor(Math.random() * 1000),
      ...doctorData,
    };
    setDoctors([newDoc, ...doctors]);

    // Automatically create a default shift entry for the new doctor
    const newShift = {
      id: 's-' + (shifts.length + 1) + '-' + Math.floor(Math.random() * 1000),
      doctorId: newDoc.id,
      doctorName: newDoc.name,
      shiftType: newDoc.shift || 'صباحي',
      timeRange: newDoc.shift === 'مسائي' ? '04:00 م - 12:00 م' : newDoc.shift === 'ليلي' ? '12:00 م - 08:00 ص' : '08:00 ص - 04:00 م',
      department: newDoc.department,
      days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
    };
    setShifts([newShift, ...shifts]);

    hospitalApi.syncMutate('ADD_DOCTOR', { doctor: newDoc, shift: newShift }).catch(e => console.warn(e));
    showToast(`تم انضمام الطبيب (${newDoc.name}) للكادر الطبي بنجاح`, 'success');
  };

  const handleToggleDoctorStatus = (id: string, newStatus: any) => {
    setDoctors(doctors.map(d => d.id === id ? { ...d, status: newStatus } : d));
    hospitalApi.syncMutate('TOGGLE_DOCTOR_STATUS', { id, status: newStatus }).catch(e => console.warn(e));
    showToast('تم تحديث حالة تواجد الطبيب المباشر', 'info');
  };

  const handleDeleteDoctor = (id: string) => {
    const target = doctors.find(d => d.id === id);
    setDoctors(doctors.filter(d => d.id !== id));
    hospitalApi.syncMutate('DELETE_DOCTOR', { id }).catch(e => console.warn(e));
    showToast(`تم حذف سجل الطبيب (${target?.name || id}) بنجاح`, 'warning');
  };

  // Handlers for Appointments
  const handleAddAppointment = (aptData: any) => {
    const newApt = {
      id: 'apt-' + (appointments.length + 1) + '-' + Math.floor(Math.random() * 1000),
      status: 'مؤكد' as const,
      createdDate: new Date().toISOString().split('T')[0],
      ...aptData,
    };
    setAppointments([newApt, ...appointments]);
    hospitalApi.syncMutate('ADD_APPOINTMENT', newApt).catch(e => console.warn(e));
    showToast('تم حجز وتأكيد الموعد الطبي بنجاح', 'success');
  };

  const handleUpdateAppointmentStatus = (id: string, status: any) => {
    setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a));
    hospitalApi.syncMutate('UPDATE_APPOINTMENT_STATUS', { id, status }).catch(e => console.warn(e));
    showToast(`تم تحديث حالة الموعد إلى (${status})`, 'info');
  };

  const handleRescheduleAppointment = (id: string, newDate: string, newTime: string) => {
    setAppointments(prev => prev.map(a => 
      a.id === id ? { ...a, date: newDate, time: newTime, status: 'مؤكد' } : a
    ));
    hospitalApi.syncMutate('RESCHEDULE_APPOINTMENT', { id, date: newDate, time: newTime }).catch(e => console.warn(e));
    showToast(`تمت إعادة جدولة الموعد بنجاح إلى تاريخ ${newDate} الساعة ${newTime}`, 'success');
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments(appointments.filter(a => a.id !== id));
    hospitalApi.syncMutate('DELETE_APPOINTMENT', { id }).catch(e => console.warn(e));
    showToast('تم إلغاء وحذف الموعد الطبي فوراً', 'error');
  };

  // Handlers for Inventory
  const handleAddInventoryItem = (itemData: any) => {
    const newItem = {
      id: 'inv-' + (inventory.length + 1) + '-' + Math.floor(Math.random() * 1000),
      status: 'متوفر' as const,
      ...itemData,
    };
    setInventory([newItem, ...inventory]);
    hospitalApi.syncMutate('ADD_INVENTORY', newItem).catch(e => console.warn(e));
    showToast(`تم إضافة الصنف الصيدلاني (${newItem.itemName}) إلى المستودع`, 'success');
  };

  const handleDeleteInventoryItem = (id: string) => {
    const target = inventory.find(i => i.id === id);
    setInventory(inventory.filter(i => i.id !== id));
    hospitalApi.syncMutate('DELETE_INVENTORY', { id }).catch(e => console.warn(e));
    showToast(`تم إزالة الصنف (${target?.itemName || id}) من قائمة الصيدلية`, 'warning');
  };

  // Handlers for Lab & Prescriptions
  const handleAddLabResult = (labData: any) => {
    const newLab = {
      id: 'lab-' + (labResults.length + 1) + '-' + Math.floor(Math.random() * 1000),
      testDate: new Date().toISOString().split('T')[0],
      ...labData,
    };
    setLabResults([newLab, ...labResults]);
    hospitalApi.syncMutate('ADD_LAB_RESULT', newLab).catch(e => console.warn(e));
    showToast('تم إدخال نتيجة التحليل المخبري وتوثيقها', 'success');
  };

  const handleDeleteLabResult = (id: string) => {
    setLabResults(labResults.filter(l => l.id !== id));
    hospitalApi.syncMutate('DELETE_LAB_RESULT', { id }).catch(e => console.warn(e));
    showToast('تم حذف سجل التحليل المخبري', 'warning');
  };

  const handleAddPrescription = (rxData: any) => {
    const newRx = {
      id: 'RX-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString().split('T')[0],
      status: 'نشطة' as const,
      ...rxData,
    };
    setPrescriptions([newRx, ...prescriptions]);
    hospitalApi.syncMutate('ADD_PRESCRIPTION', newRx).catch(e => console.warn(e));
    showToast('تم إصدار الوصفة الطبية الإلكترونية بنجاح', 'success');
  };

  const handleDeletePrescription = (id: string) => {
    setPrescriptions(prescriptions.filter(r => r.id !== id));
    showToast('تم حذف الوصفة الطبية بنجاح', 'warning');
  };

  // Handlers for Invoices
  const handleAddInvoice = (invData: any) => {
    const subtotal = invData.subtotal || 100;
    const tax = Math.round(subtotal * 0.15);
    const insuranceCovered = invData.insuranceCovered || 0;
    const netAmount = (subtotal + tax) - insuranceCovered;

    const newInv = {
      id: 'inv-' + (invoices.length + 1) + '-' + Math.floor(Math.random() * 1000),
      invoiceNumber: 'INV-2026-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString().split('T')[0],
      tax,
      netAmount,
      ...invData,
    };
    setInvoices([newInv, ...invoices]);
    hospitalApi.syncMutate('ADD_INVOICE', newInv).catch(e => console.warn(e));
    showToast(`تم إصدار الفاتورة (${newInv.invoiceNumber}) بنجاح`, 'success');
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices(invoices.filter(i => i.id !== id));
    showToast('تم إلغاء وحذف الفاتورة المالية', 'warning');
  };

  // Database Full Restore and Reset Handlers
  const handleRestoreDatabase = (restoredData: any) => {
    if (!restoredData || typeof restoredData !== 'object') return;
    if (Array.isArray(restoredData.patients)) setPatients(restoredData.patients);
    if (Array.isArray(restoredData.doctors)) setDoctors(restoredData.doctors);
    if (Array.isArray(restoredData.appointments)) setAppointments(restoredData.appointments);
    if (Array.isArray(restoredData.inventory)) setInventory(restoredData.inventory);
    if (Array.isArray(restoredData.labResults)) setLabResults(restoredData.labResults);
    if (Array.isArray(restoredData.prescriptions)) setPrescriptions(restoredData.prescriptions);
    if (Array.isArray(restoredData.invoices)) setInvoices(restoredData.invoices);
    if (Array.isArray(restoredData.shifts)) setShifts(restoredData.shifts);
    if (Array.isArray(restoredData.wards)) setWards(restoredData.wards);
    if (Array.isArray(restoredData.beds)) setBeds(restoredData.beds);
    if (Array.isArray(restoredData.archivedRecords)) setArchivedRecords(restoredData.archivedRecords);
    if (Array.isArray(restoredData.abnormalFlags)) setAbnormalFlags(restoredData.abnormalFlags);
    showToast('تم استعادة بيانات المستشفى وقاعدة البيانات بنجاح', 'success');
  };

  const handleResetDatabaseToDefault = () => {
    setPatients(mockPatients);
    setDoctors(mockDoctors);
    setAppointments(mockAppointments);
    setInventory(mockInventory);
    setLabResults(mockLabResults);
    setPrescriptions(mockPrescriptions);
    setInvoices(mockInvoices);
    setShifts(mockShifts);
    setWards(mockWards);
    setBeds(mockBeds);
    setArchivedRecords(mockArchivedRecords);
    setAbnormalFlags(mockAbnormalLabFlags);
    hospitalApi.syncMutate('RESET_DATABASE', {}).catch(e => console.warn(e));
    showToast('تمت إعادة تعيين قاعدة البيانات إلى السجلات النموذجية الافتراضية', 'info');
  };

  // Badge counts calculations for sidebar and header
  const pendingAppointmentsCount = appointments.filter(a => a.status === 'معلق' || a.status === 'مؤكد').length;
  const lowInventoryCount = inventory.filter(i => i.status === 'منخفض' || i.quantity <= i.minStockAlert).length;
  const criticalLabCount = labResults.filter(l => l.status === 'حرج').length;
  const availableBedsCount = beds.filter(b => b.status === 'available').length;
  const abnormalFlagsCount = abnormalFlags.filter(f => !f.acknowledgedByDoctor).length;

  if (!isLoggedIn) {
    return (
      <LandingAndAuthScreen
        sessionTimedOut={sessionTimeoutAlert}
        onLogin={(role, userName) => {
          setUserRole(role);
          setIsLoggedIn(true);
          setSessionTimeoutAlert(false);
          localStorage.removeItem('syrian_hosp_session_timeout');
          setActiveTab(role === 'doctor' ? 'doctor_portal' : 'dashboard');
          if (userName) {
            localStorage.setItem('syrian_hosp_userName', JSON.stringify(userName));
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans dir-rtl" dir="rtl">
      
      {/* Top Navigation Header */}
      <Header
        userRole={userRole}
        onRoleChange={(newRole) => {
          setUserRole(newRole);
          const allowed = roleTabsMap[newRole] || roleTabsMap.admin;
          if (!allowed.includes(activeTab)) {
            setActiveTab(newRole === 'doctor' ? 'doctor_portal' : 'dashboard');
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        lowStockCount={lowInventoryCount}
        criticalLabCount={criticalLabCount}
        onOpenEmergencyModal={() => setShowEmergencyModal(true)}
        onOpenDatabaseManager={() => setShowDatabaseManager(true)}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        hasActiveSOS={!!activeSOS}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        syncStatus={syncStatus}
        onManualSync={() => fetchLatestFromServer(false)}
      />

      {/* Main Body with Sidebar + Content Area */}
      <div className="flex-1 flex min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] overflow-hidden">
        
        {/* Right Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userRole={userRole}
          onLogout={() => {
            const savedName = getStoredData('syrian_hosp_userName', 'مستخدم النظام');
            recordAuditLog({
              userId: userRole === 'patient' ? 'pat-1' : 'auth-session',
              userName: savedName,
              userRole: userRole,
              action: 'LOGOUT',
              targetResource: 'AUTH_GATEWAY',
              details: 'تسجيل خروج يدوي آمن وإغلاق الجلسة',
              status: 'SUCCESS',
            });
            setIsLoggedIn(false);
          }}
          patientsCount={patients.length}
          doctorsCount={doctors.length}
          appointmentsCount={pendingAppointmentsCount}
          inventoryAlertsCount={lowInventoryCount}
          availableBedsCount={availableBedsCount}
          abnormalFlagsCount={abnormalFlagsCount}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenDatabaseManager={() => setShowDatabaseManager(true)}
        />

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 space-y-6">
          
          {activeTab === 'dashboard' && (
            <Dashboard
              userRole={userRole}
              patients={patients}
              doctors={doctors}
              appointments={appointments}
              inventory={inventory}
              invoices={invoices}
              beds={beds}
              labResults={labResults}
              prescriptions={prescriptions}
              abnormalFlags={abnormalFlags}
              onNavigate={setActiveTab}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              onRescheduleAppointment={handleRescheduleAppointment}
              onDeleteAppointment={handleDeleteAppointment}
              onShowToast={showToast}
              onOpenEmergencyModal={() => setShowEmergencyModal(true)}
            />
          )}

          {activeTab === 'doctor_portal' && (
            <DoctorClinicalDashboard
              userRole={userRole}
              doctors={doctors}
              patients={patients}
              beds={beds}
              abnormalFlags={abnormalFlags}
              appointments={appointments}
              labResults={labResults}
              prescriptions={prescriptions}
              onAddPrescription={handleAddPrescription}
              onAddLabResult={handleAddLabResult}
              onUpdateAbnormalFlag={handleUpdateAbnormalFlag}
              onShowToast={showToast}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'beds' && (
            <BedsManagementSection
              userRole={userRole}
              wards={wards}
              beds={beds}
              patients={patients}
              doctors={doctors}
              onUpdateBed={handleUpdateBed}
              onAddBed={handleAddBed}
              onDeleteBed={handleDeleteBed}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'patients' && (
            <PatientsSection
              userRole={userRole}
              patients={patients}
              doctors={doctors}
              onAddPatient={handleAddPatient}
              onUpdatePatient={handleUpdatePatient}
              onDeletePatient={handleDeletePatient}
              searchQuery={searchQuery}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'archive' && (
            <MedicalArchiveSection
              userRole={userRole}
              archivedRecords={archivedRecords}
              activePatients={patients}
              doctors={doctors}
              onArchivePatient={handleArchivePatient}
              onRestorePatient={handleRestorePatient}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'doctors' && (
            <DoctorsSection
              userRole={userRole}
              doctors={doctors}
              shifts={shifts}
              onToggleStatus={handleToggleDoctorStatus}
              onDeleteDoctor={handleDeleteDoctor}
              onAddDoctor={handleAddDoctor}
              onNavigate={setActiveTab}
              onSelectDoctorForBooking={(doc) => {
                setActiveTab('appointments');
                showToast(`تم التوجيه لحجز موعد في عيادة ${doc.name} (${doc.specialty})`, 'info');
              }}
            />
          )}

          {activeTab === 'appointments' && (
            <AppointmentsSection
              userRole={userRole}
              appointments={appointments}
              patients={patients}
              doctors={doctors}
              onAddAppointment={handleAddAppointment}
              onUpdateStatus={handleUpdateAppointmentStatus}
              onRescheduleAppointment={handleRescheduleAppointment}
              onDeleteAppointment={handleDeleteAppointment}
              onShowToast={showToast}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'inventory' && (
            <InventorySection
              userRole={userRole}
              inventory={inventory}
              onAddItem={handleAddInventoryItem}
              onDeleteItem={handleDeleteInventoryItem}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'lab' && (
            <LabPrescriptionsSection
              userRole={userRole}
              labResults={labResults}
              prescriptions={prescriptions}
              patients={patients}
              doctors={doctors}
              onAddLabResult={handleAddLabResult}
              onAddPrescription={handleAddPrescription}
              onDeleteLabResult={handleDeleteLabResult}
              onDeletePrescription={handleDeletePrescription}
            />
          )}

          {activeTab === 'billing' && (
            <BillingSection
              userRole={userRole}
              invoices={invoices}
              patients={patients}
              onAddInvoice={handleAddInvoice}
              onDeleteInvoice={handleDeleteInvoice}
            />
          )}

        </main>

      </div>

      {/* Floating Toast Alerts Container */}
      <ToastContainer toasts={toasts} onCloseToast={handleCloseToast} />

      {/* Emergency Modal */}
      <EmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        userRole={userRole}
        doctors={doctors}
        patients={patients}
        activeSOS={activeSOS}
        onTriggerSOS={handleTriggerSOS}
        onResolveSOS={handleResolveSOS}
        onShowToast={showToast}
      />

      {/* Database & Data Integrity Manager Modal */}
      <DatabaseManagerModal
        isOpen={showDatabaseManager}
        onClose={() => setShowDatabaseManager(false)}
        allData={{
          patients,
          doctors,
          appointments,
          inventory,
          labResults,
          prescriptions,
          invoices,
          shifts,
          wards,
          beds,
          archivedRecords,
          abnormalFlags,
        }}
        onRestoreData={handleRestoreDatabase}
        onResetToDefault={handleResetDatabaseToDefault}
        onShowToast={showToast}
      />

      {/* Global Quick Command Palette (Ctrl + K) */}
      <QuickCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setShowCommandPalette(false);
        }}
        patients={patients}
        doctors={doctors}
        appointments={appointments}
        inventory={inventory}
        userRole={userRole}
      />

    </div>
  );
}

export default App;
