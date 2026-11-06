import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Receipt, 
  UserCheck, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Search, 
  Check, 
  Bed, 
  Stethoscope, 
  FlaskConical, 
  Siren, 
  Plus, 
  ChevronLeft,
  Activity,
  BarChart3,
  PhoneCall,
  Ambulance,
  CalendarCheck,
  CalendarDays,
  BellRing,
  XCircle,
  Eye,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Patient, Doctor, Appointment, InventoryItem, Invoice, UserRole, Bed as BedType, LabResult, Prescription, AbnormalLabFlag } from '../types';
import { 
  formatArabicDate, 
  formatArabicTime, 
  formatAppointmentsCount, 
  formatInvoicesCount, 
  formatPatientsCount, 
  formatAvailableDoctorsCount, 
  formatVisitorsCount, 
  formatLabResultsCount, 
  formatPrescriptionsCount, 
  formatBedsCount, 
  formatCriticalAlertsCount 
} from '../utils/arabicFormatters';

interface DashboardProps {
  userRole?: UserRole;
  patients?: Patient[];
  doctors?: Doctor[];
  appointments?: Appointment[];
  inventory?: InventoryItem[];
  invoices?: Invoice[];
  beds?: BedType[];
  labResults?: LabResult[];
  prescriptions?: Prescription[];
  abnormalFlags?: AbnormalLabFlag[];
  onNavigateTab?: (tabId: string) => void;
  onNavigate?: (tabId: string) => void;
  onOpenQuickModal?: (modalType: 'appointment' | 'patient' | 'inventory' | 'invoice') => void;
  onOpenEmergencyModal?: () => void;
  onUpdateAppointmentStatus?: (id: string, status: any) => void;
  onRescheduleAppointment?: (id: string, newDate: string, newTime: string) => void;
  onDeleteAppointment?: (id: string) => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  userRole = 'admin',
  patients = [],
  doctors = [],
  appointments = [],
  inventory = [],
  invoices = [],
  beds = [],
  labResults = [],
  prescriptions = [],
  abnormalFlags = [],
  onNavigateTab,
  onNavigate,
  onOpenQuickModal,
  onOpenEmergencyModal,
  onUpdateAppointmentStatus,
  onRescheduleAppointment,
  onDeleteAppointment,
  onShowToast,
}) => {
  const navigate = onNavigateTab || onNavigate || (() => {});
  const openQuickModal = onOpenQuickModal || ((type) => {
    if (type === 'appointment') navigate('appointments');
    else if (type === 'patient') navigate('patients');
    else if (type === 'inventory') navigate('inventory');
    else if (type === 'invoice') navigate('billing');
  });

  // Role details
  const isPatientRole = userRole === 'patient';
  const isDoctorRole = userRole === 'doctor';
  const isStaffRole = userRole === 'staff';
  const isAdminRole = userRole === 'admin';

  // Local filtering states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [timelineScope, setTimelineScope] = useState<'upcoming' | 'past' | 'all'>(isPatientRole ? 'upcoming' : 'all');

  // Appointment Action Modals State
  const [detailsModalApt, setDetailsModalApt] = useState<Appointment | null>(null);
  const [rescheduleModalApt, setRescheduleModalApt] = useState<Appointment | null>(null);
  const [cancelModalApt, setCancelModalApt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTime, setRescheduleTime] = useState<string>('10:00');
  const [remindedAptIds, setRemindedAptIds] = useState<string[]>([]);
  const [localToast, setLocalToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (onShowToast) {
      onShowToast(msg, type);
    } else {
      setLocalToast({ message: msg, type });
      setTimeout(() => setLocalToast(null), 4000);
    }
  };

  const patientNameTarget = 'محمد عبد الله العتيبي';
  const todayStr = new Date().toISOString().split('T')[0];

  const userAppointments = appointments.filter((apt) => {
    if (isPatientRole) {
      return apt.patientName === patientNameTarget || apt.patientName.includes('محمد') || apt.patientId === 'pat-1';
    }
    if (isDoctorRole) {
      return apt.doctorName.includes('سارة') || apt.doctorName.includes('طبيب') || apt.doctorId === 'doc-1';
    }
    return true;
  });

  const isUpcomingAppointment = (apt: Appointment) => {
    return apt.date >= todayStr && apt.status !== 'ملغى' && apt.status !== 'مكتمل' && apt.status !== 'منتهي';
  };

  const patientUpcomingAppointments = userAppointments.filter(isUpcomingAppointment);
  const patientPastAppointments = userAppointments.filter(apt => !isUpcomingAppointment(apt));

  const filteredAppointments = userAppointments.filter((apt) => {
    if (timelineScope === 'upcoming' && !isUpcomingAppointment(apt)) return false;
    if (timelineScope === 'past' && isUpcomingAppointment(apt)) return false;
    if (statusFilter !== 'all' && apt.status !== statusFilter) return false;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      const matchPatient = apt.patientName.toLowerCase().includes(q);
      const matchDoctor = apt.doctorName.toLowerCase().includes(q);
      const matchSpecialty = apt.specialty.toLowerCase().includes(q);
      if (!matchPatient && !matchDoctor && !matchSpecialty) return false;
    }
    return true;
  });

  // KPI Metrics
  const totalPatients = patients.length;
  const activeDoctors = doctors.filter((d) => d.status === 'active');
  const lowStockItems = inventory.filter((i) => i.status === 'منخفض' || i.quantity <= i.minStockAlert);
  const availableBeds = beds.filter((b) => b.status === 'available');
  const todayAppointments = appointments.filter((a) => a.date === todayStr);

  // Patient Metrics
  const patientLabResults = labResults.filter(l => l.patientName === patientNameTarget || l.patientId === 'pat-1');
  const patientNormalLabCount = patientLabResults.filter(l => l.status === 'طبيعي' || l.status === 'مكتمل').length;
  const patientInvoices = invoices.filter(inv => inv.patientName === patientNameTarget || inv.patientId === 'pat-1');
  const patientPendingInvoices = patientInvoices.filter(inv => inv.status === 'معلق' || inv.status === 'غير مدفوع');
  const patientPendingTotal = patientPendingInvoices.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const primaryFollowedClinic = isPatientRole && patientUpcomingAppointments.length > 0 
    ? patientUpcomingAppointments[0].specialty 
    : 'القلبية والأوعية';

  const availableDoctorsInPatientClinic = (doctors || []).filter(d => {
    if (d.status !== 'active') return false;
    const docSpec = (d.specialty || '').trim();
    const docDept = (d.department || '').trim();
    const clinic = primaryFollowedClinic.trim();

    return (
      docSpec.includes(clinic) ||
      clinic.includes(docSpec) ||
      docDept.includes(clinic) ||
      clinic.includes(docDept) ||
      (clinic.includes('قلب') && (docSpec.includes('قلب') || docDept.includes('قلب'))) ||
      (clinic.includes('عظام') && (docSpec.includes('عظام') || docDept.includes('عظام'))) ||
      (clinic.includes('باطن') && (docSpec.includes('باطن') || docDept.includes('باطن')))
    );
  });

  // Doctor-Specific Metrics
  const doctorTodayAppointments = appointments.filter(a => 
    (a.doctorId === 'doc-101' || a.doctorId === 'doc-1' || a.doctorName.includes('سارة') || a.doctorName.includes('طبيب')) &&
    (a.date === todayStr || a.status === 'مؤكد' || a.status === 'معلق')
  );
  const doctorPrescriptionsList = (prescriptions || []).filter(p => 
    p.doctorId === 'doc-101' || p.doctorId === 'doc-1' || p.doctorName?.includes('سارة') || p.doctorName?.includes('طبيب')
  );
  const criticalLabCount = (abnormalFlags || []).filter(f => !f.acknowledgedByDoctor).length || 
                           (labResults || []).filter(l => l.status === 'حرج').length;

  // Chart data
  const weeklyFlowData = [
    { day: 'السبت', visits: 18, emergency: 4 },
    { day: 'الأحد', visits: 26, emergency: 5 },
    { day: 'الإثنين', visits: 31, emergency: 6 },
    { day: 'الثلاثاء', visits: 24, emergency: 3 },
    { day: 'الأربعاء', visits: 35, emergency: 7 },
    { day: 'الخميس', visits: 40, emergency: 8 },
    { day: 'الجمعة', visits: 17, emergency: 9 },
  ];

  const aptStatusData = [
    { name: 'مؤكد', value: appointments.filter(a => a.status === 'مؤكد').length, color: '#0ea5e9' },
    { name: 'معلق', value: appointments.filter(a => a.status === 'معلق').length, color: '#f59e0b' },
    { name: 'مكتمل', value: appointments.filter(a => a.status === 'مكتمل').length, color: '#10b981' },
  ];

  // Action Handlers for Item 9
  const handleOpenReschedule = (apt: Appointment) => {
    setRescheduleModalApt(apt);
    setRescheduleDate(apt.date >= todayStr ? apt.date : todayStr);
    setRescheduleTime(apt.time || '10:00');
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalApt) return;
    if (onRescheduleAppointment) {
      onRescheduleAppointment(rescheduleModalApt.id, rescheduleDate, rescheduleTime);
    } else if (onUpdateAppointmentStatus) {
      onUpdateAppointmentStatus(rescheduleModalApt.id, 'مؤكد');
    }
    triggerToast(`تمت إعادة جدولة موعد المريض (${rescheduleModalApt.patientName}) بنجاح إلى تاريخ ${formatArabicDate(rescheduleDate)} الساعة ${formatArabicTime(rescheduleTime)}`, 'success');
    setRescheduleModalApt(null);
  };

  const handleOpenCancel = (apt: Appointment) => {
    setCancelModalApt(apt);
  };

  const handleConfirmCancel = () => {
    if (!cancelModalApt) return;
    if (onUpdateAppointmentStatus) {
      onUpdateAppointmentStatus(cancelModalApt.id, 'ملغى');
    }
    triggerToast(`تم إلغاء موعد المريض (${cancelModalApt.patientName}) بنجاح`, 'info');
    setCancelModalApt(null);
  };

  const handleSendReminder = (apt: Appointment) => {
    setRemindedAptIds(prev => [...prev, apt.id]);
    triggerToast(`تم إرسال تذكير الموعد بنجاح للمريض (${apt.patientName}) عبر البريد وSMS: موعدك يوم ${formatArabicDate(apt.date)} الساعة ${formatArabicTime(apt.time)} مع ${apt.doctorName}`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* In-app Toast message if triggered locally */}
      {localToast && (
        <div className="fixed bottom-6 left-6 z-50 p-4 rounded-2xl bg-slate-900 border border-slate-700 text-white shadow-2xl flex items-center gap-3 animate-fade-in max-w-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-bold leading-relaxed">{localToast.message}</p>
        </div>
      )}

      {/* 1. TOP WELCOME BAR WITH ROLE-TAILORED QUICK ACTIONS */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {isPatientRole && 'أهلاً بك في بوابتك الطبية بمشفى الرحمة'}
              {isDoctorRole && 'مرحباً د. سارة السعيد - لوحة متابعة العيادات والمرضى'}
              {isStaffRole && 'قسم الاستقبال والتسجيل وتسكين الأجنحة'}
              {isAdminRole && 'مركز القيادة والعمليات لمشفى الرحمة'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 mt-1.5 max-w-2xl leading-relaxed font-medium">
              {isPatientRole && 'استعرض مواعيدك السريرية، نتائج الفحوصات والتحاليل المخبرية، والوصفات الصيدلانية بكل أمان.'}
              {isDoctorRole && 'متابعة مباشرة للمرضى المراجعين اليوم، الحالات السريرية المعلقة، والتنبيهات المخبرية الحرجة.'}
              {isStaffRole && 'تسجيل المرضى الجدد، تثبيت الحجوزات السريعة، تتبع شواغر الأسِرّة، وإصدار الفواتير الفورية.'}
              {isAdminRole && 'نظرة شاملة على الطاقة الاستيعابية، الأطباء المناوبين، والإشغال السريري لقاعدة البيانات.'}
            </p>
          </div>

          {/* Quick Date / Time badge */}
          <div className="flex items-center gap-2 self-start md:self-auto text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
            <Clock className="w-4 h-4 text-sky-500" />
            <span className="font-bold">
              {formatArabicDate(new Date(), { includeDayName: true })}
            </span>
          </div>
        </div>

        {/* 4 PROMINENT ACTION CARDS (Enhanced size and high contrast) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          
          {/* Action 1 */}
          <button
            onClick={() => {
              if (isDoctorRole) navigate('doctor_portal');
              else if (isPatientRole) navigate('appointments');
              else openQuickModal('patient');
            }}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-sky-500/50 text-start flex items-center gap-3 transition-all group cursor-pointer shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              {isDoctorRole ? <Stethoscope className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate">
                {isDoctorRole ? 'لوحة الفحص السريري' : isPatientRole ? 'حجز موعد كشفية' : 'تسجيل مريض جديد'}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium block truncate mt-0.5">
                {isDoctorRole ? 'معاينة الحالات' : isPatientRole ? 'اختيار العيادة' : 'إضافة ملف طبي'}
              </span>
            </div>
          </button>

          {/* Action 2 */}
          <button
            onClick={() => openQuickModal('appointment')}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-teal-500/50 text-start flex items-center gap-3 transition-all group cursor-pointer shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate">
                {isDoctorRole ? 'مواعيد عيادتي' : 'حجز موعد ذكي'}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium block truncate mt-0.5">
                منع تضارب الأوقات
              </span>
            </div>
          </button>

          {/* Action 3 */}
          <button
            onClick={() => {
              if (isPatientRole) navigate('lab');
              else if (isDoctorRole) navigate('lab');
              else if (isStaffRole) navigate('beds');
              else navigate('beds');
            }}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-amber-500/50 text-start flex items-center gap-3 transition-all group cursor-pointer shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              {isPatientRole || isDoctorRole ? <FlaskConical className="w-5 h-5" /> : <Bed className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate">
                {isPatientRole ? 'نتائج التحاليل والوصفات' : isDoctorRole ? 'طلب فحص ومخبر' : 'شواغر الأسِرّة'}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium block truncate mt-0.5">
                {isPatientRole ? 'الملف الطبي' : isDoctorRole ? 'مختبر المستشفى' : 'إشغال الأجنحة'}
              </span>
            </div>
          </button>

          {/* Action 4: Emergency Hotlines & ER Center */}
          <button
            onClick={() => {
              if (onOpenEmergencyModal) onOpenEmergencyModal();
              else navigate('beds');
            }}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-700/80 hover:border-rose-500/50 text-start flex items-center gap-3 transition-all group cursor-pointer shadow-xs"
            title="فتح مركز الطوارئ وأرقام الإسعاف 110"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 block truncate">
                طوارئ الإسعاف (110)
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium block truncate mt-0.5">
                خطوط ساخنة وغرف إنعاش
              </span>
            </div>
          </button>

        </div>

      </div>

      {/* 2. ROLE-TAILORED 4 KPI CARDS (Strong contrast and clear hierarchy) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI Card 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
              {isPatientRole ? 'مواعيدي القادمة النشطة' : isDoctorRole ? 'مرضاي بالعيادة اليوم' : 'إجمالي المرضى المسجلين'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              {isPatientRole ? <Calendar className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {isPatientRole 
                ? formatAppointmentsCount(patientUpcomingAppointments.length, true) 
                : isDoctorRole 
                  ? formatVisitorsCount(doctorTodayAppointments.length) 
                  : formatPatientsCount(totalPatients)}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> نشط
            </span>
          </div>
          <button 
            onClick={() => navigate(isPatientRole ? 'appointments' : isDoctorRole ? 'doctor_portal' : 'patients')} 
            className="mt-2.5 text-xs text-sky-700 dark:text-sky-300 font-bold hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            {isPatientRole ? `سجل المواعيد (${formatAppointmentsCount(patientPastAppointments.length)} سابقة)` : isDoctorRole ? 'فتح لوحة الفحص السريري' : 'إدارة ملفات المرضى'} &larr;
          </button>
        </div>

        {/* KPI Card 2 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
              {isPatientRole ? 'فحوصاتي والتحاليل' : isDoctorRole ? 'المواعيد السريرية المعلقة' : 'مواعيد اليوم النشطة'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              {isPatientRole ? <FlaskConical className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {isPatientRole 
                ? formatLabResultsCount(patientLabResults.length) 
                : isDoctorRole 
                  ? (userAppointments.filter(a => a.status === 'معلق').length === 0 ? 'لا توجد مواعيد معلقة' : formatAppointmentsCount(userAppointments.filter(a => a.status === 'معلق').length)) 
                  : formatAppointmentsCount(todayAppointments.length)}
            </span>
            <span className="text-xs text-teal-600 dark:text-teal-400 font-bold">
              {isPatientRole ? (patientNormalLabCount === 0 ? 'بانتظار النتائج' : `${patientNormalLabCount} سليمة`) : 'اليوم'}
            </span>
          </div>
          <button 
            onClick={() => navigate(isPatientRole ? 'lab' : 'appointments')} 
            className="mt-2.5 text-xs text-teal-700 dark:text-teal-300 font-bold hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            {isPatientRole ? 'استعراض نتائج التحاليل' : 'جدول المواعيد'} &larr;
          </button>
        </div>

        {/* KPI Card 3 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
              {isPatientRole ? 'الفواتير المستحقة' : isDoctorRole ? 'التنبيهات المخبرية الحرجة' : 'شواغر الأسِرّة الفورية'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              {isPatientRole ? <Receipt className="w-4 h-4" /> : isDoctorRole ? <AlertTriangle className="w-4 h-4" /> : <Bed className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {isPatientRole 
                ? formatInvoicesCount(patientPendingInvoices.length) 
                : isDoctorRole 
                  ? formatCriticalAlertsCount(criticalLabCount) 
                  : formatBedsCount(availableBeds.length)}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
              {isPatientRole 
                ? (patientPendingTotal > 0 ? `${patientPendingTotal.toLocaleString()} ل.س` : 'مسددة بالكامل') 
                : isDoctorRole 
                  ? (criticalLabCount > 0 ? 'تتطلب إقراراً' : 'مستقرة') 
                  : 'جاهزة للتسكين'}
            </span>
          </div>
          <button 
            onClick={() => navigate(isPatientRole ? 'billing' : isDoctorRole ? 'doctor_portal' : 'beds')} 
            className="mt-2.5 text-xs text-amber-700 dark:text-amber-300 font-bold hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            {isPatientRole ? 'سداد ومطالبات' : isDoctorRole ? 'فتح لوحة الطبيب' : 'تتبع أجنحة المستشفى'} &larr;
          </button>
        </div>

        {/* KPI Card 4 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
              {isPatientRole 
                ? 'الأطباء المتاحون في عيادتي اليوم' 
                : isDoctorRole 
                  ? 'الوصفات المصروفة اليوم' 
                  : 'الأطباء المناوبون بالعيادات'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              {isDoctorRole ? <Stethoscope className="w-4 h-4" /> : isPatientRole ? <Stethoscope className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {isPatientRole 
                ? formatAvailableDoctorsCount(availableDoctorsInPatientClinic.length) 
                : isDoctorRole 
                  ? formatPrescriptionsCount(doctorPrescriptionsList.length) 
                  : `${activeDoctors.length} / ${doctors.length} طبيب`}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              {isPatientRole ? primaryFollowedClinic : 'حاضرون'}
            </span>
          </div>
          <button 
            onClick={() => navigate(isPatientRole ? 'appointments' : isDoctorRole ? 'doctor_portal' : 'doctors')} 
            className="mt-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-bold hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            {isPatientRole ? 'حجز موعد بالعيادة' : isDoctorRole ? 'صرف الأدوية' : 'جدول المناوبات'} &larr;
          </button>
        </div>

      </div>

      {/* 3. ANALYTICAL CHARTS (Hidden for patient for focused simplicity) */}
      {!isPatientRole && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Clinical Patient Flow Chart */}
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-500" />
                  <span>معدل تدفق المرضى وحالات الطوارئ الأسبوعي</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">تتبع أعداد المراجعين بين العيادات وقسم الإسعاف</p>
              </div>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-lg border border-sky-200 dark:border-sky-800">
                الأسبوع الحالي
              </span>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorEmerg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff', fontSize: '11px', textAlign: 'right' }}
                  />
                  <Area type="monotone" dataKey="visits" name="مراجعو العيادات" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" />
                  <Area type="monotone" dataKey="emergency" name="حالات الطوارئ" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorEmerg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Appointments Status Donut */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-teal-500" />
                <span>حالات المواعيد المسجلة</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">توزيع الحجوزات الحالية</p>
            </div>

            <div className="h-36 relative my-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aptStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={58}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {aptStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff', fontSize: '11px', textAlign: 'right' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-slate-500 font-semibold">الإجمالي</span>
                <span className="text-base font-black text-slate-900 dark:text-white">{appointments.length}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              {aptStatusData.map((item) => (
                <div key={item.name} className="flex flex-col items-center p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-0.5">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 4. CRITICAL INVENTORY ALERT (Only shown when there are real stock shortages, for staff/admin) */}
      {!isPatientRole && lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-800 dark:text-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300">
                تنبيه نقص في الصيدلية ({lowStockItems.length} أصناف وصلت للحد الحرج)
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5 font-medium">
                الأصناف تشمل: {lowStockItems.map(i => i.itemName).slice(0, 3).join(' ، ')}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('inventory')}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0 self-start sm:self-auto transition-all cursor-pointer"
          >
            إرسال طلب توريد للصيدلية
          </button>
        </div>
      )}

      {/* 5. ACTIVE APPOINTMENTS & SCHEDULING TABLE (Item 9: Reschedule, Cancel, Reminder, Details) */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Table Header Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-sky-500" />
              <span>
                {isPatientRole 
                  ? (timelineScope === 'upcoming' ? 'مواعيدي الطبية القادمة' : timelineScope === 'past' ? 'سجل مواعيدي السابقة' : 'كافة مواعيدي الطبية')
                  : (timelineScope === 'upcoming' ? 'جدول المواعيد القادمة والنشطة' : timelineScope === 'past' ? 'سجل المواعيد السابقة والمنتهية' : 'كافة المواعيد والعيادات')}
              </span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">
              {isPatientRole 
                ? 'مفروزة تلقائياً حسب تاريخ اليوم: المواعيد السارية في القادمة، والمنتهية في السجل السابق'
                : 'متابعة الحالات المؤكدة والمعلقة مع فحص منع التضارب الفوري وإمكانية إعادة الجدولة'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Timeline Filter */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTimelineScope('upcoming')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timelineScope === 'upcoming'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                القادمة ({patientUpcomingAppointments.length})
              </button>
              <button
                type="button"
                onClick={() => setTimelineScope('past')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timelineScope === 'past'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                السابقة ({patientPastAppointments.length})
              </button>
              <button
                type="button"
                onClick={() => setTimelineScope('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timelineScope === 'all'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                الكل ({userAppointments.length})
              </button>
            </div>

            {/* Quick Add Appointment Button */}
            <button
              onClick={() => openQuickModal('appointment')}
              className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>حجز جديد</span>
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200">
              <tr>
                <th className="p-3.5 font-bold">المريض</th>
                <th className="p-3.5 font-bold">الطبيب والعيادة</th>
                <th className="p-3.5 font-bold">التاريخ والتوقيت</th>
                <th className="p-3.5 font-bold">نوع الكشف</th>
                <th className="p-3.5 font-bold">الحالة والنوع</th>
                <th className="p-3.5 font-bold text-center">الإجراءات المتاحة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {timelineScope === 'upcoming' 
                          ? 'لا توجد مواعيد قادمة مجدولة حالياً' 
                          : timelineScope === 'past' 
                            ? 'لا توجد مواعيد سابقة مسجلة' 
                            : 'لا توجد مواعيد مطابقة حالياً'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">يمكنك حجز موعد جديد بالضغط على الزر أدناه</p>
                      <button
                        onClick={() => openQuickModal('appointment')}
                        className="mt-2 px-3.5 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>جدولة موعد جديد</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAppointments.slice(0, 8).map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {apt.patientName.charAt(0)}
                        </div>
                        <span>{apt.patientName}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-900 dark:text-slate-100 font-bold">{apt.doctorName}</div>
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{apt.specialty}</span>
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{formatArabicDate(apt.date)}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-mono flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-sky-500 shrink-0" />
                        <span>{formatArabicTime(apt.time)}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700">
                        {apt.type}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                          apt.status === 'مؤكد' && apt.date >= todayStr
                            ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                            : apt.status === 'معلق' && apt.date >= todayStr
                              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              : apt.status === 'مكتمل'
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : apt.status === 'منتهي' || apt.date < todayStr
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                        }`}>
                          {apt.date < todayStr && (apt.status === 'مؤكد' || apt.status === 'معلق') ? 'منتهي (سابق)' : apt.status}
                        </span>
                        {apt.date < todayStr ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold">
                            سابق
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 font-semibold">
                            قادم
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ACTIONS COLUMN (Item 9: Reschedule, Cancel, Reminder, Details) */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        
                        {/* 1. Quick Confirm if pending */}
                        {onUpdateAppointmentStatus && apt.status === 'معلق' && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateAppointmentStatus(apt.id, 'مؤكد');
                              triggerToast(`تم تأكيد موعد ${apt.patientName} بنجاح`, 'success');
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 transition-all cursor-pointer"
                            title="تأكيد الموعد"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* 2. Reschedule Action */}
                        <button
                          type="button"
                          onClick={() => handleOpenReschedule(apt)}
                          className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:hover:bg-sky-900/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="إعادة جدولة موعد الزيارة"
                        >
                          <CalendarDays className="w-3.5 h-3.5 text-sky-500" />
                          <span>إعادة جدولة</span>
                        </button>

                        {/* 3. Send Reminder Action */}
                        <button
                          type="button"
                          onClick={() => handleSendReminder(apt)}
                          className={`px-2 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            remindedAptIds.includes(apt.id)
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-400'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          }`}
                          title="إرسال تذكير فوري بالموعد للمريض عبر البريد وSMS"
                        >
                          <BellRing className={`w-3.5 h-3.5 ${remindedAptIds.includes(apt.id) ? 'text-emerald-500' : 'text-amber-500'}`} />
                          <span>{remindedAptIds.includes(apt.id) ? 'تم التذكير ✓' : 'تذكير'}</span>
                        </button>

                        {/* 4. Cancel Action */}
                        {apt.status !== 'ملغى' && (
                          <button
                            type="button"
                            onClick={() => handleOpenCancel(apt)}
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="إلغاء هذا الموعد"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            <span>إلغاء</span>
                          </button>
                        )}

                        {/* 5. Details Modal Trigger */}
                        <button
                          type="button"
                          onClick={() => setDetailsModalApt(apt)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="عرض تفاصيل الموعد والملف"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>التفاصيل</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredAppointments.length > 8 && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-950/30">
            <button
              onClick={() => navigate('appointments')}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>عرض كافة المواعيد المتبقية ({filteredAppointments.length - 8})</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

      {/* 6. MODAL 1: APPOINTMENT DETAILS MODAL */}
      {detailsModalApt && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in" 
          dir="rtl"
          onClick={(e) => { if (e.target === e.currentTarget) setDetailsModalApt(null); }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto text-right text-slate-900 dark:text-slate-100">
            
            {/* Sticky Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">تفاصيل الموعد الطبي</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">رقم الموعد: {detailsModalApt.id}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailsModalApt(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="إغلاق النافذة"
                aria-label="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 grid grid-cols-2 gap-3.5">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">اسم المريض:</span>
                  <strong className="text-slate-900 dark:text-white text-sm">{detailsModalApt.patientName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">الطبيب المعالج:</span>
                  <strong className="text-slate-900 dark:text-white text-sm">{detailsModalApt.doctorName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">العيادة التخصصية:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{detailsModalApt.specialty}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">نوع الكشف:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{detailsModalApt.type}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">التاريخ:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{formatArabicDate(detailsModalApt.date)}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">التوقيت:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold font-mono">{formatArabicTime(detailsModalApt.time)}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">الحالة الحالية:</span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold border border-sky-300 dark:border-sky-800">
                    {detailsModalApt.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">رسوم الاستشارة:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{detailsModalApt.fee?.toLocaleString() || '25,000'} ل.س</span>
                </div>
              </div>
            </div>

            {/* Sticky Footer Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const target = detailsModalApt;
                  setDetailsModalApt(null);
                  handleOpenReschedule(target);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CalendarDays className="w-4 h-4" />
                <span>إعادة جدولة</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSendReminder(detailsModalApt);
                }}
                className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BellRing className="w-4 h-4 text-amber-500" />
                <span>إرسال تذكير</span>
              </button>

              {detailsModalApt.status !== 'ملغى' && (
                <button
                  type="button"
                  onClick={() => {
                    const target = detailsModalApt;
                    setDetailsModalApt(null);
                    handleOpenCancel(target);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>إلغاء</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setDetailsModalApt(null)}
                className="py-2.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL 2: RESCHEDULE APPOINTMENT MODAL */}
      {rescheduleModalApt && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in" 
          dir="rtl"
          onClick={(e) => { if (e.target === e.currentTarget) setRescheduleModalApt(null); }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto text-right text-slate-900 dark:text-slate-100">
            
            {/* Sticky Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">إعادة جدولة الموعد الطبي</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">تعديل التاريخ وتوقيت الحضور بالعيادة</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRescheduleModalApt(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="إغلاق النافذة"
                aria-label="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <p>المريض: <strong className="text-slate-900 dark:text-white font-bold">{rescheduleModalApt.patientName}</strong></p>
                <p>الطبيب: <strong className="text-slate-900 dark:text-white font-bold">{rescheduleModalApt.doctorName}</strong> ({rescheduleModalApt.specialty})</p>
                <p className="text-slate-500 dark:text-slate-400">الموعد الحالي: {formatArabicDate(rescheduleModalApt.date)} - {formatArabicTime(rescheduleModalApt.time)}</p>
              </div>

              <form id="dash-reschedule-form" onSubmit={handleConfirmReschedule} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                    اختر التاريخ الجديد للموعد *
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                    اختر التوقيت الجديد المتاح *
                  </label>
                  <select
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="09:00">09:00 صباحاً (الفترة الصباحية الأولى)</option>
                    <option value="10:00">10:00 صباحاً (عيادة كشفية)</option>
                    <option value="11:30">11:30 صباحاً (استشارة متقدمة)</option>
                    <option value="13:00">01:00 ظهراً (فترة منتصف النهار)</option>
                    <option value="15:30">03:30 عصراً (الفترة المسائية)</option>
                    <option value="17:00">05:00 مساءً (عيادة مسائية)</option>
                    <option value="18:30">06:30 مساءً (آخر المواعيد)</option>
                  </select>
                </div>
              </form>
            </div>

            {/* Sticky Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setRescheduleModalApt(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="dash-reschedule-form"
                className="py-2.5 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>تثبيت الموعد الجديد</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL 3: CANCEL APPOINTMENT CONFIRMATION */}
      {cancelModalApt && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in" 
          dir="rtl"
          onClick={(e) => { if (e.target === e.currentTarget) setCancelModalApt(null); }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto p-5 sm:p-6 text-center space-y-4">
            
            <div className="w-12 h-12 mx-auto rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">تأكيد إلغاء الموعد الطبي</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                هل أنت متأكد من رغبتك في إلغاء موعد المريض <strong className="text-slate-900 dark:text-white">({cancelModalApt.patientName})</strong> مع <strong className="text-slate-900 dark:text-white">({cancelModalApt.doctorName})</strong>؟
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-400">
              <span>تاريخ الموعد: {formatArabicDate(cancelModalApt.date)} الساعة {formatArabicTime(cancelModalApt.time)}</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>نعم، تأكيد الإلغاء</span>
              </button>
              <button
                type="button"
                onClick={() => setCancelModalApt(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
              >
                تراجع
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
