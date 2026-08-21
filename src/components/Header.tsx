import React, { useState, useEffect } from 'react';
import { User, UserRole, InventoryItem, LabResult } from '../types';
import { HospitalLogo } from './HospitalLogo';
import { 
  Building2, 
  Bell, 
  Clock, 
  ShieldCheck, 
  UserCheck, 
  Stethoscope, 
  UserCircle2, 
  AlertTriangle,
  X,
  ChevronDown,
  Volume2,
  CheckCircle2,
  Search,
  CheckCheck,
  Trash2,
  Calendar,
  Siren,
  Menu,
  Sun,
  Moon,
  Database
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'danger' | 'warning' | 'info';
  targetTab: string;
  isRead: boolean;
}

interface HeaderProps {
  currentUser?: User;
  userRole?: UserRole;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onSwitchRole?: (role: UserRole) => void;
  onRoleChange?: (role: UserRole) => void;
  inventoryAlerts?: InventoryItem[];
  labAlerts?: LabResult[];
  lowStockCount?: number;
  criticalLabCount?: number;
  onNavigateTab?: (tabId: string) => void;
  onNavigate?: (tabId: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenEmergencyModal?: () => void;
  onOpenDatabaseManager?: () => void;
  hasActiveSOS?: boolean;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  userRole,
  theme = 'dark',
  onToggleTheme,
  onSwitchRole,
  onRoleChange,
  inventoryAlerts = [],
  labAlerts = [],
  lowStockCount = 0,
  criticalLabCount = 0,
  onNavigateTab,
  onNavigate,
  searchQuery = '',
  onSearchChange,
  onOpenEmergencyModal,
  onOpenDatabaseManager,
  hasActiveSOS = false,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isRinging, setIsRinging] = useState(false);

  // Dynamic notifications state
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([
    {
      id: 'n-1',
      title: 'نقص حاد في المخزون (أنسولين Insulin)',
      message: 'الكمية المتبقية 8 علب فقط. يرجى طلب شحنة جديدة.',
      time: 'منذ 5 دقائق',
      type: 'danger',
      targetTab: 'inventory',
      isRead: false,
    },
    {
      id: 'n-2',
      title: 'نتيجة فحص حَرِجة للمريض (خالد السعيد)',
      message: 'مستوى السكر التراكمي HBA1C وصل إلى 11.2% (مرتفع جداً).',
      time: 'منذ 15 دقيقة',
      type: 'warning',
      targetTab: 'lab',
      isRead: false,
    },
    {
      id: 'n-3',
      title: 'موعد طارئ جديد في انتظار التأكيد',
      message: 'طوارئ باطنية - المريض محمد العلي.',
      time: 'منذ 30 دقيقة',
      type: 'info',
      targetTab: 'appointments',
      isRead: false,
    },
  ]);

  // Live auto-updating clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentRole: UserRole = userRole || currentUser?.role || 'admin';
  const handleRoleChange = onRoleChange || onSwitchRole || (() => {});
  const handleNavigate = onNavigateTab || onNavigate || (() => {});

  // Patient-specific notifications list to prevent administrative / privacy leaks
  const patientNotificationsList: NotificationItem[] = [
    {
      id: 'pn-1',
      title: 'تأكيد موعد العيادة',
      message: 'تم تأكيد موعدك القادم في عيادة القلبية مع د. سارة السعيد.',
      time: 'منذ 10 دقائق',
      type: 'info',
      targetTab: 'appointments',
      isRead: false,
    },
    {
      id: 'pn-2',
      title: 'صدور نتيجة التحليل المخبري',
      message: 'نتائج تحليل السكر التراكمي (HbA1c) جاهزة الآن للاطلاع.',
      time: 'منذ ساعة',
      type: 'info',
      targetTab: 'lab',
      isRead: false,
    },
    {
      id: 'pn-3',
      title: 'تذكير بسداد الفاتورة الطبية',
      message: 'يمكنك سداد مستحقاتك بسهولة عبر شام كاش (Sham Cash).',
      time: 'منذ ساعتين',
      type: 'warning',
      targetTab: 'billing',
      isRead: false,
    },
  ];

  const activeNotifications = currentRole === 'patient' ? patientNotificationsList : notificationsList;
  const unreadNotificationsCount = activeNotifications.filter(n => !n.isRead).length;

  const triggerBellShake = () => {
    setIsRinging(true);
    setTimeout(() => setIsRinging(false), 1200);
  };

  const handleMarkAllAsRead = () => {
    setNotificationsList(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClearAllNotifications = () => {
    setNotificationsList([]);
  };

  const handleDismissNotification = (id: string) => {
    setNotificationsList(prev => prev.filter(n => n.id !== id));
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'مدير النظام (Admin)';
      case 'doctor': return 'طبيب معالج (Doctor)';
      case 'staff': return 'إداري / استقبال (Staff)';
      case 'patient': return 'مريض (Patient)';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-sky-950/60 text-sky-200 border-sky-700/50';
      case 'doctor': return 'bg-teal-950/60 text-teal-200 border-teal-700/50';
      case 'staff': return 'bg-slate-800/80 text-slate-200 border-slate-700/60';
      case 'patient': return 'bg-slate-800/80 text-slate-200 border-slate-700/60';
    }
  };

  const formattedDate = new Intl.DateTimeFormat('ar-SY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(currentTime);

  const formattedTime = new Intl.DateTimeFormat('ar-SY', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(currentTime);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/90 text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="القائمة"
              title="القائمة الرئيسية"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-rose-400" /> : <Menu className="w-5 h-5 text-sky-400" />}
            </button>
          )}

          <HospitalLogo size="md" />
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-xl font-black text-white tracking-wide">مشفى الرحمة</h1>
              <span className="hidden xs:inline-block px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Al-Rahma Hospital
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Al-Rahma Medical Center - المركز الطبي التخصصي الموحد</p>
          </div>
        </div>

        {/* Global Instant Search Bar */}
        {onSearchChange && (
          <div className="hidden lg:flex items-center relative max-w-xs w-full">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="بحث شامل في النظام..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-all"
            />
          </div>
        )}

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* Live Dynamic Date & Ticking Clock Display */}
          <div className="hidden sm:flex flex-col items-end px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 shadow-inner">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
              <Clock className="w-3.5 h-3.5 text-sky-400 animate-spin" style={{ animationDuration: '10s' }} />
              <span className="font-mono tracking-wider">{formattedTime}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">{formattedDate}</span>
          </div>

          {/* Theme Toggle (Light / Dark Mode) */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-300 hover:text-amber-200 transition-all shadow-inner cursor-pointer group"
              title={theme === 'dark' ? 'التحويل إلى النمط الفاتح (Clinical Light)' : 'التحويل إلى النمط الليلي (Dark Luxury)'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400 group-hover:rotate-90 transition-transform duration-300" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-400 group-hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>
          )}

          {/* Database Health & Validation Manager Button */}
          {onOpenDatabaseManager && (userRole === 'admin' || userRole === 'staff') && (
            <button
              type="button"
              onClick={onOpenDatabaseManager}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 hover:text-white transition-all shadow-md text-xs font-bold cursor-pointer"
              title="فحص وتدقيق سلامة قاعدة البيانات والنسخ الاحتياطي"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline">إدارة وتدقيق البيانات</span>
            </button>
          )}

          {/* Emergency SOS Quick Button */}
          {onOpenEmergencyModal && (
            <button
              onClick={onOpenEmergencyModal}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-extrabold transition-all shadow-lg cursor-pointer ${
                hasActiveSOS 
                  ? 'bg-rose-600 text-white animate-bounce ring-4 ring-rose-500/50 shadow-rose-600/50' 
                  : 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 shadow-rose-950/40'
              }`}
              title="نظام طوارئ وغرف الإسعاف"
            >
              <Siren className={`w-4 h-4 text-rose-400 ${hasActiveSOS ? 'animate-spin text-white' : ''}`} />
              <span className="hidden md:inline">طوارئ (SOS)</span>
              {hasActiveSOS && <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>}
            </button>
          )}

          {/* Interactive Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                triggerBellShake();
              }}
              onMouseEnter={triggerBellShake}
              className={`relative p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all shadow-inner ${
                isRinging || unreadNotificationsCount > 0 ? 'ring-2 ring-rose-500/40' : ''
              }`}
              title="التنبيهات العاجلة"
            >
              <Bell className={`w-5 h-5 transition-transform ${isRinging ? 'animate-[bounce_0.5s_infinite] text-amber-400' : ''}`} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-rose-600 text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-slate-900 animate-pulse shadow-md">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Interactive Notifications Drawer */}
            {showNotifications && (
              <div className="absolute left-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden text-right">
                <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" />
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <span>مركز التنبيهات الحية</span>
                        {unreadNotificationsCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px]">
                            {unreadNotificationsCount} غير مقروء
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] text-slate-400">إشعارات النظام، الصيدلية والمستودع</p>
                    </div>
                  </div>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Actions Toolbar */}
                {activeNotifications.length > 0 && (
                  <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-[11px]">
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sky-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>تحديد الكل كمقروء</span>
                    </button>
                    <button
                      onClick={handleClearAllNotifications}
                      className="text-rose-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>مسح جميع التنبيهات</span>
                    </button>
                  </div>
                )}

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                  {activeNotifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      <p className="font-bold text-slate-200">لا توجد تنبيهات جديدة حالياً</p>
                      <p className="text-slate-400 text-[11px]">جميع أقسام المستشفى والخدمات تعمل بشكل متكامل.</p>
                    </div>
                  ) : (
                    activeNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3.5 hover:bg-slate-800/60 transition-colors flex items-start justify-between gap-3 ${
                          !notif.isRead ? 'bg-sky-950/20 border-r-2 border-sky-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                              notif.type === 'danger'
                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                : notif.type === 'warning'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                            }`}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-xs">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-slate-100">{notif.title}</p>
                              <span className="text-[10px] text-slate-400 font-mono">{notif.time}</span>
                            </div>
                            <p className="text-slate-300 mt-0.5">{notif.message}</p>
                            <button
                              onClick={() => {
                                handleNavigate(notif.targetTab);
                                setShowNotifications(false);
                              }}
                              className="mt-1 text-sky-400 hover:underline font-semibold text-[11px] block"
                            >
                              عرض القسم للتعامل مع التنبيه &larr;
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDismissNotification(notif.id)}
                          className="p-1 text-slate-500 hover:text-slate-300"
                          title="إخفاء التنبيه"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Authenticated Role Badge */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${getRoleColor(currentRole)} shadow-inner`}>
            <ShieldCheck className="w-4 h-4" />
            <div className="text-right">
              <span className="block font-bold">{getRoleLabel(currentRole)}</span>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};

