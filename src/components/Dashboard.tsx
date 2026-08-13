import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Receipt, 
  UserCheck, 
  AlertTriangle, 
  TrendingUp, 
  PlusCircle, 
  Sparkles, 
  ArrowUpRight,
  Pill,
  Clock,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  AreaChart, 
  Area 
} from 'recharts';
import { Patient, Doctor, Appointment, InventoryItem, Invoice, UserRole } from '../types';

interface DashboardProps {
  userRole?: UserRole;
  patients?: Patient[];
  doctors?: Doctor[];
  appointments?: Appointment[];
  inventory?: InventoryItem[];
  invoices?: Invoice[];
  onNavigateTab?: (tabId: string) => void;
  onNavigate?: (tabId: string) => void;
  onOpenQuickModal?: (modalType: 'appointment' | 'patient' | 'inventory' | 'invoice') => void;
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
  onNavigateTab,
  onNavigate,
  onOpenQuickModal,
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

  // Local state for dynamic appointments table
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tableSearch, setTableSearch] = useState<string>('');

  // Filtered appointments dynamically (Patients ONLY see their own appointments)
  const isPatientRole = userRole === 'patient';
  const patientNameTarget = 'محمد عبد الله العتيبي';

  const userAppointments = appointments.filter((apt) => {
    if (isPatientRole) {
      return apt.patientName === patientNameTarget || apt.patientName.includes('محمد') || apt.patientId === 'pat-1';
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
  const pendingInvoices = (invoices || []).filter(i => i?.status === 'معلق');
  const activeDoctors = (doctors || []).filter(d => d?.status === 'active');
  const lowStockItems = (inventory || []).filter(i => i?.status === 'منخفض' || (i?.quantity ?? 0) <= (i?.minStockAlert ?? 0));

  // Patient Specific Metrics
  const patientInvoices = invoices.filter(i => i.patientName === patientNameTarget || i.patientName.includes('محمد'));
  const patientPendingInvoices = patientInvoices.filter(i => i.status === 'معلق');

  const totalRevenue = (invoices || [])
    .filter(i => i?.status === 'مدفوع')
    .reduce((sum, inv) => sum + (inv?.netAmount || 0), 0);

  // Pie Chart Data - Appointment Statuses
  const statusCounts = {
    'مؤكد': appointments.filter(a => a.status === 'مؤكد').length,
    'معلق': appointments.filter(a => a.status === 'معلق').length,
    'مكتمل': appointments.filter(a => a.status === 'مكتمل').length,
    'ملغى': appointments.filter(a => a.status === 'ملغى').length,
  };

  const pieChartData = [
    { name: 'مؤكد', value: statusCounts['مؤكد'] || 3, color: '#0284c7' }, // Sky Blue
    { name: 'معلق', value: statusCounts['معلق'] || 2, color: '#f59e0b' }, // Amber
    { name: 'مكتمل', value: statusCounts['مكتمل'] || 4, color: '#10b981' }, // Emerald
    { name: 'ملغى', value: statusCounts['ملغى'] || 1, color: '#ef4444' }, // Red
  ];

  // Bar Chart Data - Weekly Appointments Trend
  const weeklyData = [
    { day: 'الأحد', appointments: 18, emergency: 3 },
    { day: 'الإثنين', appointments: 24, emergency: 5 },
    { day: 'الثلاثاء', appointments: 20, emergency: 2 },
    { day: 'الأربعاء', appointments: 28, emergency: 6 },
    { day: 'الخميس', appointments: 32, emergency: 8 },
    { day: 'الجمعة', appointments: 12, emergency: 9 },
    { day: 'السبت', appointments: 15, emergency: 4 },
  ];

  // Area Chart Data - Monthly Revenue
  const revenueData = [
    { month: 'يناير', revenue: 142000 },
    { month: 'فبراير', revenue: 165000 },
    { month: 'مارس', revenue: 189000 },
    { month: 'أبريل', revenue: 175000 },
    { month: 'مايو', revenue: 210000 },
    { month: 'يونيو', revenue: 245000 },
    { month: 'يوليو', revenue: 230000 },
    { month: 'أغسطس', revenue: 280000 },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Welcome Bar */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 p-6 sm:p-8 border border-slate-800 text-white shadow-2xl overflow-hidden">
        <div className="absolute left-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
              {userRole === 'patient' ? 'أهلاً بك في بوابتك الطبية بمشفى النور' : 'أهلاً بك في نظام إدارة "مشفى النور"'}
            </h2>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              {userRole === 'patient' 
                ? 'تابع مواعيدك الطبية واستشاراتك ونتائج الفحوصات والفواتير بكل أمان وخصوصية.' 
                : 'تابع جميع العمليات الطبية والمواعيد والحالات الحرجة والمخزون المباشر بأعلى مستويات الكفاءة والأمان.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => openQuickModal('appointment')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>حجز موعد جديد</span>
            </button>

            {userRole !== 'patient' && (
              <button
                onClick={() => openQuickModal('patient')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                <Users className="w-4 h-4 text-sky-400" />
                <span>تسجيل مريض جديد</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Top KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl hover:border-sky-500/50 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">
              {userRole === 'patient' ? 'مواعيدي القادمة' : 'إجمالي المرضى المسجلين'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-110 transition-transform">
              {userRole === 'patient' ? <Calendar className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">
              {userRole === 'patient' ? `${userAppointments.length} موعد` : `${totalPatients} مريض`}
            </span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-0.5">
              {userRole === 'patient' ? 'نشط' : <><TrendingUp className="w-3.5 h-3.5" /> +12% هذا الشهر</>}
            </span>
          </div>
          <button onClick={() => navigate(userRole === 'patient' ? 'appointments' : 'patients')} className="mt-3 text-[11px] text-sky-400 font-medium hover:underline flex items-center gap-1">
            {userRole === 'patient' ? 'استعراض مواعيدي بالكامل &larr;' : 'إدارة الملفات الطبية &larr;'}
          </button>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl hover:border-blue-500/50 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">
              {userRole === 'patient' ? 'فحوصاتي والتحاليل' : 'مواعيد اليوم والنشطة'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Pill className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">
              {userRole === 'patient' ? 'نتائج المخبر والتقارير' : `${todayAppointments.length} موعد`}
            </span>
            <span className="text-xs text-blue-400 font-bold">
              {userRole === 'patient' ? 'حالة مكتملة' : 'عيادات اليوم'}
            </span>
          </div>
          <button onClick={() => navigate(userRole === 'patient' ? 'lab' : 'appointments')} className="mt-3 text-[11px] text-blue-400 font-medium hover:underline flex items-center gap-1">
            {userRole === 'patient' ? 'استعراض نتائج التحاليل &larr;' : 'جدول المواعيد الكامل &larr;'}
          </button>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl hover:border-amber-500/50 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">
              {userRole === 'patient' ? 'فواتيري ومستحقاتي' : 'الفواتير المعلقة للسداد'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">
              {userRole === 'patient' ? `${patientPendingInvoices.length} فاتورة` : `${pendingInvoices.length} فاتورة`}
            </span>
            <span className="text-xs text-amber-400 font-bold">
              {userRole === 'patient' ? 'سداد مباشر عبر شام كاش' : 'بانتظار التحصيل'}
            </span>
          </div>
          <button onClick={() => navigate('billing')} className="mt-3 text-[11px] text-amber-400 font-medium hover:underline flex items-center gap-1">
            {userRole === 'patient' ? 'سداد الفواتير &larr;' : 'إدارة الحسابات والفواتير &larr;'}
          </button>
        </div>

        {/* KPI 4 */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl hover:border-emerald-500/50 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">
              {userRole === 'patient' ? 'الأطباء المتاحون' : 'الأطباء النشطون بالعيادات'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{activeDoctors.length} / {doctors.length} طبيب</span>
            <span className="text-xs text-emerald-400 font-bold">في الدوام اليوم</span>
          </div>
          <button onClick={() => navigate('doctors')} className="mt-3 text-[11px] text-emerald-400 font-medium hover:underline flex items-center gap-1">
            {userRole === 'patient' ? 'استعراض دكتور العيادة &larr;' : 'دليل الأطباء والمناوبات &larr;'}
          </button>
        </div>

      </div>

      {/* Critical Low Inventory Stock Alert Red Section (Hidden for patients) */}
      {userRole !== 'patient' && lowStockItems.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 border-2 border-rose-600/60 text-white shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-rose-200">تنبيهات نقص المستودع والصيدلية (Low Inventory Alert)</h3>
                <p className="text-xs text-rose-300/80">توجد أصناف دوائية وصل مخزونها للحد الأدنى الحرج وتتطلب إعادة طلب فورية</p>
              </div>
            </div>
            <button
              onClick={() => navigate('inventory')}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1"
            >
              <span>إرسال طلب توريد</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            {lowStockItems.map((item) => (
              <div key={item.id} className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-100">{item.itemName}</p>
                  <span className="text-[11px] text-rose-400 font-semibold">
                    المتوقع: {item.quantity} {item.unit} (الحد: {item.minStockAlert})
                  </span>
                </div>
                <span className="px-2 py-1 text-[10px] font-black rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  نقص حرج
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Charts Section (Hidden for Patient Role) */}
      {userRole !== 'patient' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Appointments Distribution (Pie Chart) */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-slate-100">توزيع حالة المواعيد</h3>
                <span className="text-xs text-slate-400">نسبية (%)</span>
              </div>

              <div className="h-56 relative my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {pieChartData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                    <span className="text-slate-300 font-medium">{item.name}:</span>
                    <span className="font-bold text-white mr-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Weekly Appointments Bar Chart */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-100">إحصائيات المواعيد والطوارئ الأسبوعية</h3>
                  <p className="text-xs text-slate-400">مقارنة العيادات الخارجية بحالات الطوارئ المباشرة</p>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  الأسبوع الحالي
                </span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="appointments" name="عيادات خارجية" fill="#0284c7" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="emergency" name="حالات طوارئ" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Chart 3: Monthly Revenue Area Chart */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-100">نمو الإيرادات والتحصيل المالي (بالليرة السورية)</h3>
                <p className="text-xs text-slate-400">شامل المبيعات الدوائية، الاستشارات، والتغطيات التأمينية</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">إجمالي إيرادات الشهر الحالي</span>
                <span className="text-lg font-extrabold text-emerald-400 font-mono">
                  {totalRevenue > 0 ? totalRevenue.toLocaleString('ar-SY') : '280,000'} ل.س
                </span>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`${Number(val).toLocaleString('ar-SY')} ل.س`, 'الإيراد']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Dynamic Activity & Visits Table */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        {/* Table Header & Quick Action */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-100">
                {userRole === 'patient' ? 'جدول مواعيدي الطبية الشخصية' : 'جدول الزيارات الحالية المباشرة بالمستشفى'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                مباشر ({filteredAppointments.length} من {userAppointments.length})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {userRole === 'patient' 
                ? 'متابعة مواعيدك وحجز استشارات طبيبك الخاص بكل سهولة' 
                : 'إدارة تفاعلية ديناميكية لمواعيد اليوم، تعديل الحالات، والتصفية الفورية حسب المريض أو الطبيب'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => openQuickModal('appointment')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>حجز موعد جديد</span>
            </button>
            <button
              onClick={() => navigate('appointments')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>{userRole === 'patient' ? 'عرض كافة مواعيدي' : 'إدارة كافة المواعيد'}</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        </div>

        {/* Dynamic Toolbar: Search & Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'الكل', count: userAppointments.length },
              { id: 'مؤكد', label: 'مؤكد', count: userAppointments.filter(a => a.status === 'مؤكد').length },
              { id: 'معلق', label: 'معلق', count: userAppointments.filter(a => a.status === 'معلق').length },
              { id: 'مكتمل', label: 'مكتمل', count: userAppointments.filter(a => a.status === 'مكتمل').length },
              { id: 'ملغى', label: 'ملغى', count: userAppointments.filter(a => a.status === 'ملغى').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-md ${
                  statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Table Search Input */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder={userRole === 'patient' ? 'تصفية مواعيدي حسب الطبيب أو العيادة...' : 'تصفية حسب المريض أو الطبيب...'}
              className="w-full bg-slate-900 text-slate-200 pl-3 pr-8 py-1.5 rounded-lg text-xs border border-slate-800 focus:outline-none focus:border-sky-500/60 placeholder:text-slate-500"
            />
            {tableSearch && (
              <button
                onClick={() => setTableSearch('')}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Table Body */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-right text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                {userRole !== 'patient' && <th className="p-3">اسم المريض</th>}
                <th className="p-3">الطبيب المعالج</th>
                <th className="p-3">القسم / العيادة</th>
                <th className="p-3">الوقت والتاريخ</th>
                <th className="p-3">النوع</th>
                <th className="p-3">حالة الموعد</th>
                {userRole !== 'patient' && <th className="p-3 text-center">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={userRole === 'patient' ? 5 : 7} className="p-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Calendar className="w-8 h-8 text-slate-600 stroke-[1.5]" />
                      <p className="font-bold text-sm text-slate-300">لا توجد مواعيد مطابقة للتصفية الحالية</p>
                      <p className="text-xs text-slate-500">حاول تغيير التصفية أو البحث باسم الطبيب</p>
                      {(statusFilter !== 'all' || tableSearch !== '') && (
                        <button
                          onClick={() => { setStatusFilter('all'); setTableSearch(''); }}
                          className="mt-2 text-xs text-sky-400 hover:underline font-bold"
                        >
                          إعادة ضبط الفلاتر
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-800/40 transition-colors group">
                    {userRole !== 'patient' && (
                      <td className="p-3">
                        <div className="font-bold text-white group-hover:text-sky-300 transition-colors">
                          {apt.patientName}
                        </div>
                        {apt.notes && (
                          <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">
                            {apt.notes}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="p-3 font-semibold text-slate-200">{apt.doctorName}</td>
                    <td className="p-3 text-slate-400">{apt.specialty}</td>
                    <td className="p-3 text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-400" />
                        <span>{apt.time}</span>
                        <span className="text-slate-500 text-[10px]">({apt.date || todayStr})</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium text-[11px]">
                        {apt.type}
                      </span>
                    </td>
                    <td className="p-3">
                      {userRole === 'patient' ? (
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap inline-block ${
                          apt.status === 'مؤكد' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' :
                          apt.status === 'مكتمل' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                          apt.status === 'معلق' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                          'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {apt.status}
                        </span>
                      ) : (
                        /* Live Dynamic Status Switcher Dropdown */
                        <div className="relative inline-block">
                          <select
                            value={apt.status}
                            onChange={(e) => onUpdateAppointmentStatus && onUpdateAppointmentStatus(apt.id, e.target.value)}
                            className={`appearance-none text-[11px] font-bold px-3 py-1 pr-3 pl-7 rounded-lg border focus:outline-none cursor-pointer transition-all ${
                              apt.status === 'مؤكد'
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30'
                                : apt.status === 'مكتمل'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                : apt.status === 'معلق'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                            }`}
                          >
                            <option value="مؤكد" className="bg-slate-900 text-sky-300">مؤكد</option>
                            <option value="معلق" className="bg-slate-900 text-amber-300">معلق</option>
                            <option value="مكتمل" className="bg-slate-900 text-emerald-300">مكتمل</option>
                            <option value="ملغى" className="bg-slate-900 text-rose-300">ملغى</option>
                          </select>
                          <ChevronDown className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
                        </div>
                      )}
                    </td>
                    {userRole !== 'patient' && (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onDeleteAppointment && onDeleteAppointment(apt.id)}
                          title="إلغاء الموعد"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
