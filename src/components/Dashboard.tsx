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
  BarChart3
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
import { Patient, Doctor, Appointment, InventoryItem, Invoice, UserRole, Bed as BedType } from '../types';

interface DashboardProps {
  userRole?: UserRole;
  patients?: Patient[];
  doctors?: Doctor[];
  appointments?: Appointment[];
  inventory?: InventoryItem[];
  invoices?: Invoice[];
  beds?: BedType[];
  onNavigateTab?: (tabId: string) => void;
  onNavigate?: (tabId: string) => void;
  onOpenQuickModal?: (modalType: 'appointment' | 'patient' | 'inventory' | 'invoice') => void;
  onOpenEmergencyModal?: () => void;
  onUpdateAppointmentStatus?: (id: string, status: any) => void;
  onDeleteAppointment?: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  userRole = 'admin',
  patients = [],
  doctors = [],
  appointments = [],
  inventory = [],
  invoices = [],
  beds = [],
  onNavigateTab,
  onNavigate,
  onOpenQuickModal,
  onOpenEmergencyModal,
  onUpdateAppointmentStatus,
  onDeleteAppointment,
}) => {
  const navigate = onNavigateTab || onNavigate || (() => {});
  const openQuickModal = onOpenQuickModal || ((type) => {
    if (type === 'appointment') navigate('appointments');
    else if (type === 'patient') navigate('patients');
    else if (type === 'inventory') navigate('inventory');
    else if (type === 'invoice') navigate('billing');
  });

  // Local states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tableSearch, setTableSearch] = useState<string>('');

  // Role details
  const isPatientRole = userRole === 'patient';
  const isDoctorRole = userRole === 'doctor';
  const isStaffRole = userRole === 'staff';
  const isAdminRole = userRole === 'admin';

  const patientNameTarget = 'محمد عبد الله العتيبي';

  const userAppointments = appointments.filter((apt) => {
    if (isPatientRole) {
      return apt.patientName === patientNameTarget || apt.patientName.includes('محمد') || apt.patientId === 'pat-1';
    }
    if (isDoctorRole) {
      return apt.doctorName.includes('سارة') || apt.doctorName.includes('طبيب') || apt.doctorId === 'doc-1';
    }
    return true;
  });

  const filteredAppointments = userAppointments.filter((apt) => {
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    const matchesSearch = 
      tableSearch.trim() === '' ||
      apt.patientName.toLowerCase().includes(tableSearch.toLowerCase()) ||
      apt.doctorName.toLowerCase().includes(tableSearch.toLowerCase()) ||
      apt.specialty.toLowerCase().includes(tableSearch.toLowerCase()) ||
      apt.type.toLowerCase().includes(tableSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculated Metrics
  const totalPatients = (patients || []).length;
  const todayAppointments = (appointments || []).filter(a => a?.date === todayStr || a?.status === 'مؤكد' || a?.status === 'معلق');
  const activeDoctors = (doctors || []).filter(d => d?.status === 'active');
  const lowStockItems = (inventory || []).filter(i => i?.status === 'منخفض' || (i?.quantity ?? 0) <= (i?.minStockAlert ?? 0));
  const availableBeds = (beds || []).filter(b => b.status === 'available');

  // Patient Specific Metrics
  const patientInvoices = invoices.filter(i => i.patientName === patientNameTarget || i.patientName.includes('محمد'));
  const patientPendingInvoices = patientInvoices.filter(i => i.status === 'معلق');

  // Simple Clean Weekly Flow Data
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
    { name: 'مؤكد', value: appointments.filter(a => a.status === 'مؤكد').length || 4, color: '#0ea5e9' },
    { name: 'معلق', value: appointments.filter(a => a.status === 'معلق').length || 2, color: '#f59e0b' },
    { name: 'مكتمل', value: appointments.filter(a => a.status === 'مكتمل').length || 5, color: '#10b981' },
  ];

  return (
    <div className="space-y-6">
      
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {isPatientRole && 'استعرض مواعيدك السريرية، نتائج الفحوصات والتحاليل المخبرية، والوصفات الصيدلانية بكل أمان.'}
              {isDoctorRole && 'متابعة مباشرة للمرضى المراجعين اليوم، الحالات السريرية المعلقة، والتنبيهات المخبرية الحرجة.'}
              {isStaffRole && 'تسجيل المرضى الجدد، تثبيت الحجوزات السريعة، تتبع شواغر الأسِرّة، وإصدار الفواتير الفورية.'}
              {isAdminRole && 'نظرة شاملة على الطاقة الاستيعابية، الأطباء المناوبين، والإشغال السريري لقاعدة البيانات.'}
            </p>
          </div>

          {/* Quick Date / Time badge */}
          <div className="flex items-center gap-2 self-start md:self-auto text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50">
            <Clock className="w-3.5 h-3.5 text-sky-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {new Date().toLocaleDateString('ar-SY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* 4 PROMINENT ACTION CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          
          {/* Action 1 */}
          <button
            onClick={() => {
              if (isDoctorRole) navigate('doctor_portal');
              else if (isPatientRole) navigate('appointments');
              else openQuickModal('patient');
            }}
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-sky-500/50 text-start flex items-center gap-3 transition-all group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              {isDoctorRole ? <Stethoscope className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">
                {isDoctorRole ? 'لوحة الفحص السريري' : isPatientRole ? 'حجز موعد كشفية' : 'تسجيل مريض جديد'}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {isDoctorRole ? 'معاينة الحالات' : isPatientRole ? 'اختيار العيادة' : 'إضافة ملف طبي'}
              </span>
            </div>
          </button>

          {/* Action 2 */}
          <button
            onClick={() => openQuickModal('appointment')}
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-teal-500/50 text-start flex items-center gap-3 transition-all group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">
                {isDoctorRole ? 'مواعيد عيادتي' : 'حجز موعد ذكي'}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
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
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-amber-500/50 text-start flex items-center gap-3 transition-all group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              {isPatientRole || isDoctorRole ? <FlaskConical className="w-5 h-5" /> : <Bed className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">
                {isPatientRole ? 'نتائج التحاليل والوصفات' : isDoctorRole ? 'طلب فحص ومخبر' : 'شواغر الأسِرّة'}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {isPatientRole ? 'الملف الطبي' : isDoctorRole ? 'مختبر المستشفى' : 'إشغال الأجنحة'}
              </span>
            </div>
          </button>

          {/* Action 4: Emergency SOS */}
          <button
            onClick={() => {
              if (onOpenEmergencyModal) onOpenEmergencyModal();
              else navigate('beds');
            }}
            className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 hover:border-rose-500 text-start flex items-center gap-3 transition-all group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Siren className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400 block truncate">
                نداء طوارئ (SOS)
              </span>
              <span className="text-[10px] text-rose-500/80 block truncate">
                استجابة فورية
              </span>
            </div>
          </button>

        </div>

      </div>

      {/* 2. ROLE-TAILORED 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI Card 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isPatientRole ? 'مواعيدي القادمة' : isDoctorRole ? 'مرضاي بالعيادة اليوم' : 'إجمالي المرضى المسجلين'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              {isPatientRole ? <Calendar className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {isPatientRole ? `${userAppointments.length} موعد` : isDoctorRole ? `8 مراجعين` : `${totalPatients} مريض`}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> نشط
            </span>
          </div>
          <button onClick={() => navigate(isPatientRole ? 'appointments' : 'patients')} className="mt-2 text-[11px] text-sky-600 dark:text-sky-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer">
            {isPatientRole ? 'عرض مواعيدي الكاملة' : 'إدارة ملفات المرضى'} &larr;
          </button>
        </div>

        {/* KPI Card 2 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isPatientRole ? 'فحوصاتي والتحاليل' : isDoctorRole ? 'المواعيد السريرية المعلقة' : 'مواعيد اليوم النشطة'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {isPatientRole ? '4 نتائج جاهزة' : isDoctorRole ? `${userAppointments.filter(a => a.status === 'معلق').length} معلق` : `${todayAppointments.length} موعد`}
            </span>
            <span className="text-[11px] text-teal-600 dark:text-teal-400 font-bold">
              {isPatientRole ? 'مكتملة' : 'اليوم'}
            </span>
          </div>
          <button onClick={() => navigate(isPatientRole ? 'lab' : 'appointments')} className="mt-2 text-[11px] text-teal-600 dark:text-teal-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer">
            {isPatientRole ? 'استعراض نتائج التحاليل' : 'جدول المواعيد'} &larr;
          </button>
        </div>

        {/* KPI Card 3 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isPatientRole ? 'الفواتير المستحقة' : isDoctorRole ? 'التنبيهات المخبرية الحرجة' : 'شواغر الأسِرّة الفورية'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              {isPatientRole ? <Receipt className="w-4 h-4" /> : isDoctorRole ? <FlaskConical className="w-4 h-4" /> : <Bed className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {isPatientRole ? `${patientPendingInvoices.length} فواتير` : isDoctorRole ? '1 تنبيه حرج' : `${availableBeds.length} سرير شاغر`}
            </span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
              {isPatientRole ? 'سداد إلكتروني' : isDoctorRole ? 'تتطلب إقراراً' : 'جاهزة للتسكين'}
            </span>
          </div>
          <button onClick={() => navigate(isPatientRole ? 'billing' : isDoctorRole ? 'doctor_portal' : 'beds')} className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer">
            {isPatientRole ? 'سداد ومطالبات' : isDoctorRole ? 'فتح لوحة الطبيب' : 'تتبع أجنحة المستشفى'} &larr;
          </button>
        </div>

        {/* KPI Card 4 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isPatientRole ? 'الأطباء المناوبون' : isDoctorRole ? 'الوصفات المصروفة اليوم' : 'الأطباء المناوبون بالعيادات'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              {isDoctorRole ? <Stethoscope className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {isDoctorRole ? '12 وصفة' : `${activeDoctors.length} / ${doctors.length} طبيب`}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              على رأس العمل
            </span>
          </div>
          <button onClick={() => navigate(isDoctorRole ? 'lab' : 'doctors')} className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer">
            {isDoctorRole ? 'أرشيف الوصفات' : 'دليل الأطباء والمناوبات'} &larr;
          </button>
        </div>

      </div>

      {/* 3. SIMPLE & CLEAN CHARTS SECTION */}
      {!isPatientRole && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Main Area Flow Chart */}
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-500" />
                  <span>مخطط تدفق المراجعين الأسبوعي</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">مقارنة بين مراجعي العيادات وحالات الطوارئ</p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                  العيادات
                </span>
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  الطوارئ
                </span>
              </div>
            </div>

            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyFlowData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
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
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
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
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-teal-500" />
                <span>حالات المواعيد المسجلة</span>
              </h3>
              <p className="text-[11px] text-slate-400">توزيع الحجوزات الحالية</p>
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
                <span className="text-[10px] text-slate-400 font-medium">الإجمالي</span>
                <span className="text-base font-black text-slate-800 dark:text-white">{appointments.length}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800">
              {aptStatusData.map((item) => (
                <div key={item.name} className="flex flex-col items-center p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-500 text-[10px] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white mt-0.5">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 4. CRITICAL INVENTORY ALERT (Only shown when there are real stock shortages, for staff/admin) */}
      {!isPatientRole && lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-800 dark:text-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300">
                تنبيه نقص في الصيدلية ({lowStockItems.length} أصناف وصلت للحد الحرج)
              </h4>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">
                الأصناف تشمل: {lowStockItems.map(i => i.itemName).slice(0, 3).join(' ، ')}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('inventory')}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0 self-start sm:self-auto transition-all cursor-pointer"
          >
            إرسال طلب توريد للصيدلية
          </button>
        </div>
      )}

      {/* 4. ACTIVE APPOINTMENTS & SCHEDULING TABLE */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Table Header Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-500" />
              <span>{isPatientRole ? 'مواعيدي الطبية القادمة' : 'جدول المواعيد والعيادات اليومية'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              متابعة الحالات المؤكدة والمعلقة مع فحص منع التضارب الفوري
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث بالمريض أو الطبيب..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-44 sm:w-56 pl-3 pr-8 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
            >
              <option value="all">كافة الحالات</option>
              <option value="مؤكد">مؤكد</option>
              <option value="معلق">معلق</option>
              <option value="مكتمل">مكتمل</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3.5">المريض</th>
                <th className="p-3.5">الطبيب والاختصاص</th>
                <th className="p-3.5">التاريخ والوقت</th>
                <th className="p-3.5">نوع الكشفية</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">لا توجد مواعيد مطابقة حالياً</p>
                      <p className="text-[11px] text-slate-400">يمكنك حجز موعد جديد بالضغط على الزر أدناه</p>
                      <button
                        onClick={() => openQuickModal('appointment')}
                        className="mt-2 px-3 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>جدولة موعد جديد</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAppointments.slice(0, 6).map((apt) => (
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
                      <div className="text-slate-800 dark:text-slate-200 font-medium">{apt.doctorName}</div>
                      <span className="text-[10px] text-slate-400">{apt.specialty}</span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                      {apt.date} • {apt.time}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]">
                        {apt.type}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                        apt.status === 'مؤكد'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : apt.status === 'معلق'
                            ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onUpdateAppointmentStatus && apt.status === 'معلق' && (
                          <button
                            onClick={() => onUpdateAppointmentStatus(apt.id, 'مؤكد')}
                            className="p-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60"
                            title="تأكيد الموعد"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => navigate('appointments')}
                          className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                        >
                          التفاصيل
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredAppointments.length > 6 && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-950/30">
            <button
              onClick={() => navigate('appointments')}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
            >
              <span>عرض كافة المواعيد المتبقية ({filteredAppointments.length - 6})</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

    </div>
  );
};


