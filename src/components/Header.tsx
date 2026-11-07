import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, InventoryItem, LabResult } from '../types';
import { HospitalLogo } from './HospitalLogo';
import { formatArabicClock } from '../utils/arabicFormatters';
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
  Database,
  Wifi,
  RefreshCw,
  Sun,
  Moon
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
  onOpenCommandPalette?: () => void;
  hasActiveSOS?: boolean;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  syncStatus?: 'synced' | 'syncing' | 'offline';
  onManualSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  userRole,
  onSwitchRole,
  onRoleChange,
  inventoryAlerts = [],
  labAlerts = [],
  lowStockCount = 0,
  syncStatus = 'synced',
  onManualSync,
  criticalLabCount = 0,
  onNavigateTab,
  onNavigate,
  searchQuery = '',
  onSearchChange,
  onOpenEmergencyModal,
  onOpenDatabaseManager,
  onOpenCommandPalette,
  hasActiveSOS = false,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isRinging, setIsRinging] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Theme Mode (Dark / Light) State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('care_hospital_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return document.documentElement.classList.contains('dark');
    } catch {
      return true;
    }
  });

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    try {
      if (nextMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('care_hospital_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('care_hospital_theme', 'light');
      }
    } catch (e) {
      console.warn('Theme storage note:', e);
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

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
      case 'admin': return 'مدير النظام';
      case 'doctor': return 'طبيب معالج';
      case 'staff': return 'إداري واستقبال';
      case 'patient': return 'بوابة المريض';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-700/50';
      case 'doctor': return 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border-teal-300 dark:border-teal-700/50';
      case 'staff': return 'bg-emerald-50 dark:bg-slate-800/80 text-emerald-800 dark:text-slate-200 border-emerald-300 dark:border-slate-700/60';
      case 'patient': return 'bg-sky-50 dark:bg-slate-800/80 text-sky-800 dark:text-slate-200 border-sky-300 dark:border-slate-700/60';
    }
  };

  const { dateText: formattedDate, timeDigits, period } = formatArabicClock(currentTime);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/90 text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-1.5 sm:gap-4">
        
        {/* Brand & Mobile Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="القائمة"
              title="القائمة الرئيسية"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-rose-500 dark:text-rose-400" /> : <Menu className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
            </button>
          )}

          <div className="shrink-0">
            <HospitalLogo size="sm" className="sm:hidden" />
            <HospitalLogo size="md" className="hidden sm:flex" />
          </div>
          <div className="min-w-0" dir="rtl">
            <div className="flex items-center gap-1 sm:gap-2">
              <h1 className="text-sm sm:text-lg lg:text-xl font-black text-white tracking-wide whitespace-nowrap">
                <bdi>مشفى الرحمة</bdi>
              </h1>
              <span dir="ltr" className="hidden md:inline-block px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 whitespace-nowrap font-sans">
                Al-Rahma Hospital
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden lg:flex items-center gap-1.5 truncate" dir="rtl">
              <bdi className="font-semibold text-slate-300">المركز الطبي التخصصي الموحد</bdi>
              <span className="text-slate-600 font-sans select-none" aria-hidden="true">-</span>
              <bdi dir="ltr" className="font-sans text-[11px] text-slate-400 tracking-wide font-normal">
                Al-Rahma Medical Center
              </bdi>
            </p>
          </div>
        </div>

        {/* Global Instant Search Bar & Command Palette Trigger */}
        <div className="hidden lg:flex items-center gap-2 max-w-xs w-full">
          {onOpenCommandPalette ? (
            <button
              onClick={onOpenCommandPalette}
              aria-label="فتح لوحة الأوامر والبحث السريع (اختصار Ctrl+K)"
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs text-slate-600 dark:text-slate-400 transition-all text-start focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                <span className="text-slate-600 dark:text-slate-400">بحث سريع أو أمر...</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
                Ctrl K
              </span>
            </button>
          ) : onSearchChange && (
            <div className="relative w-full">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                placeholder="بحث شامل في النظام..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="حقل البحث الشامل في النظام"
                className="w-full pl-4 pr-10 py-2 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-all"
              />
            </div>
          )}
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3 shrink-0">
          
          {/* Live Dynamic Date & Ticking Clock Display (Visible on lg+) */}
          <div className="hidden lg:flex flex-col items-end px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 shadow-inner" aria-live="polite">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
              <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" aria-hidden="true" />
              <div className="flex items-center gap-1 font-mono tracking-wider" dir="rtl">
                <span dir="ltr">{timeDigits}</span>
                <span className="font-sans text-xs text-sky-600 dark:text-sky-300">{period}</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{formattedDate}</span>
          </div>

          {/* Live Server Sync Icon Indicator (Laptop & Mobile Sync) */}
          <button
            type="button"
            onClick={onManualSync}
            aria-label="حالة اتصال ومزامنة السيرفر"
            title={
              syncStatus === 'syncing' 
                ? 'جارِ مزامنة البيانات مع الخادم...' 
                : syncStatus === 'offline' 
                  ? 'السيرفر غير متصل حالياً (اضغط لإعادة المحاولة)' 
                  : 'متصل بالسيرفر بنجاح (اضغط للمزامنة الفورية)'
            }
            className={`hidden md:flex items-center justify-center p-2 rounded-xl border transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-500 shadow-xs ${
              syncStatus === 'syncing'
                ? 'bg-amber-950/60 border-amber-600/50 text-amber-400'
                : syncStatus === 'offline'
                  ? 'bg-rose-950/60 border-rose-600/50 text-rose-400'
                  : 'bg-emerald-950/50 border-emerald-600/40 text-emerald-400 hover:bg-emerald-900/60'
            }`}
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" aria-hidden="true" />
            ) : (
              <div className="relative flex items-center justify-center">
                <Wifi className={`w-4 h-4 ${syncStatus === 'offline' ? 'text-rose-400 opacity-60' : 'text-emerald-400'}`} aria-hidden="true" />
                <span 
                  className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                    syncStatus === 'offline' 
                      ? 'bg-rose-500 ring-2 ring-slate-900' 
                      : 'bg-emerald-400 ring-2 ring-slate-900 animate-pulse'
                  }`} 
                  aria-hidden="true"
                />
              </div>
            )}
          </button>

          {/* Database Health & Validation Manager Button - visible on sm+ screens */}
          {onOpenDatabaseManager && (userRole === 'admin' || userRole === 'staff') && (
            <button
              type="button"
              onClick={onOpenDatabaseManager}
              aria-label="إدارة وفحص قاعدة البيانات والنسخ الاحتياطي"
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-600/50 text-emerald-800 dark:text-emerald-300 transition-all shadow-xs text-xs font-bold cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
              title="فحص وتدقيق سلامة قاعدة البيانات والنسخ الاحتياطي"
            >
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span className="hidden lg:inline">إدارة البيانات</span>
            </button>
          )}

          {/* Emergency SOS Quick Button */}
          {onOpenEmergencyModal && (
            <button
              onClick={onOpenEmergencyModal}
              aria-label="نداء الطوارئ والإسعاف السريع (110)"
              className={`flex items-center gap-1 sm:gap-2 p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none ${
                hasActiveSOS 
                  ? 'bg-rose-600 text-white ring-2 ring-rose-500/50' 
                  : 'bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-700/60'
              }`}
              title="مركز الطوارئ والإسعاف السريع (أرقام 110 وحجز غرف الإنعاش)"
            >
              <Siren className="w-4 h-4 text-rose-500 shrink-0" aria-hidden="true" />
              <span className="hidden md:inline">طوارئ (110)</span>
              {hasActiveSOS && <span className="w-2 h-2 rounded-full bg-rose-400"></span>}
            </button>
          )}

          {/* Theme Mode Switcher Icon (Light / Dark Mode) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'التحويل إلى الوضع الفاتح (Light Mode)' : 'التحويل إلى الوضع الليلي المظلم (Dark Mode)'}
            title={isDarkMode ? 'التبديل إلى المظهر الفاتح (Light Mode)' : 'التبديل إلى المظهر الليلي (Dark Mode)'}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-amber-400 hover:text-slate-900 dark:hover:text-amber-300 transition-all cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none shadow-xs"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-in fade-in zoom-in-75 duration-200" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 animate-in fade-in zoom-in-75 duration-200" aria-hidden="true" />
            )}
          </button>

          {/* Interactive Notification Bell */}
          <div className="relative shrink-0" ref={notificationsRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                triggerBellShake();
              }}
              aria-label="مركز التنبيهات والإشعارات"
              aria-expanded={showNotifications}
              className={`relative p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${
                unreadNotificationsCount > 0 ? 'ring-2 ring-rose-500/30' : ''
              }`}
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 min-w-4 h-4 sm:min-w-5 sm:h-5 px-1 bg-rose-600 text-white text-[9px] sm:text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Interactive Notifications Drawer */}
            {showNotifications && (
              <>
                {/* Mobile Backdrop to click outside easily on small devices */}
                <div
                  className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs sm:hidden"
                  onClick={() => setShowNotifications(false)}
                />

                <div className="fixed inset-x-3 top-20 sm:top-auto sm:inset-auto sm:absolute sm:top-full sm:left-0 sm:mt-2.5 w-auto sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xl z-50 overflow-hidden text-right">
                  <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                          <span>مركز التنبيهات الحية</span>
                          {unreadNotificationsCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                              {unreadNotificationsCount} جديد
                            </span>
                          )}
                        </h3>
                        <p className="text-[10px] text-slate-400">إشعارات النظام، المواعيد والتحاليل</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowNotifications(false)} 
                      className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="إغلاق التنبيهات"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Actions Toolbar */}
                  {activeNotifications.length > 0 && (
                    <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-[11px]">
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>تحديد الكل كمقروء</span>
                      </button>
                      <button
                        onClick={handleClearAllNotifications}
                        className="text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>مسح جميع التنبيهات</span>
                      </button>
                    </div>
                  )}

                  <div className="max-h-80 sm:max-h-96 overflow-y-auto divide-y divide-slate-800">
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
                          <div className="flex items-start gap-3 flex-1 min-w-0">
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
                            <div className="flex-1 min-w-0 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-bold text-slate-100 truncate">{notif.title}</p>
                                <span className="text-[10px] text-slate-400 font-mono shrink-0">{notif.time}</span>
                              </div>
                              <p className="text-slate-300 mt-0.5 leading-relaxed">{notif.message}</p>
                              <button
                                onClick={() => {
                                  handleNavigate(notif.targetTab);
                                  setShowNotifications(false);
                                }}
                                className="mt-1.5 text-sky-400 hover:text-sky-300 hover:underline font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <span>عرض القسم للتعامل مع التنبيه</span>
                                <span className="text-xs">&larr;</span>
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDismissNotification(notif.id)}
                            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                            title="إخفاء التنبيه"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Authenticated Role Badge (Hidden on mobile for clean breathing space, shown on sm+) */}
          <div 
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold ${getRoleColor(currentRole)} shadow-inner shrink-0`}
            title={getRoleLabel(currentRole)}
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <div className="text-right">
              <span className="font-bold whitespace-nowrap">{getRoleLabel(currentRole)}</span>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};

