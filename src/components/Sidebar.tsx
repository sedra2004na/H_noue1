import React from 'react';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Calendar, 
  Pill, 
  FlaskConical, 
  Receipt, 
  ChevronLeft, 
  LogOut, 
  ShieldCheck, 
  Stethoscope, 
  UserCheck as StaffIcon, 
  UserCircle2, 
  X, 
  Bed as BedIcon, 
  Archive, 
  HeartPulse,
  Activity,
  ClipboardList
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  userRole?: UserRole;
  onLogout?: () => void;
  lowStockCount?: number;
  criticalLabCount?: number;
  patientsCount?: number;
  doctorsCount?: number;
  appointmentsCount?: number;
  inventoryAlertsCount?: number;
  availableBedsCount?: number;
  abnormalFlagsCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole = 'admin',
  onLogout,
  lowStockCount = 0,
  criticalLabCount = 0,
  inventoryAlertsCount = 0,
  availableBedsCount,
  abnormalFlagsCount = 0,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const effectiveLowStock = lowStockCount || inventoryAlertsCount;

  const roleConfig = {
    admin: {
      title: 'مدير النظام (كامل الصلاحيات)',
      badge: 'الإدارة العليا',
      icon: ShieldCheck,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      allowedTabs: ['dashboard', 'doctor_portal', 'beds', 'patients', 'archive', 'doctors', 'appointments', 'inventory', 'lab', 'billing'],
    },
    doctor: {
      title: 'الطبيب المعالج (عيادات وملفات)',
      badge: 'القسم السريري',
      icon: Stethoscope,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      allowedTabs: ['dashboard', 'doctor_portal', 'beds', 'patients', 'archive', 'doctors', 'appointments', 'lab'],
    },
    staff: {
      title: 'موظف استقبال (تسجيل وتسكين)',
      badge: 'الاستقبال والطوارئ',
      icon: StaffIcon,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      allowedTabs: ['dashboard', 'beds', 'patients', 'archive', 'appointments', 'inventory', 'billing'],
    },
    patient: {
      title: 'بوابة المريض المباشرة',
      badge: 'خدماتي الطبية',
      icon: UserCircle2,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      allowedTabs: ['dashboard', 'appointments', 'lab', 'billing'],
    },
  };

  const currentRoleInfo = roleConfig[userRole] || roleConfig.admin;

  // Grouped Navigation Structure
  const navigationGroups = [
    {
      groupTitle: 'الرعاية السريرية والأجنحة',
      items: [
        {
          id: 'dashboard',
          label: 'لوحة التحكم والعمليات',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          id: 'doctor_portal',
          label: 'لوحة الطبيب السريرية',
          icon: Stethoscope,
          badge: abnormalFlagsCount > 0 ? `${abnormalFlagsCount} تنبيه` : null,
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
        {
          id: 'beds',
          label: 'تتبع الأسِرّة والأجنحة',
          icon: BedIcon,
          badge: availableBedsCount !== undefined ? `${availableBedsCount} شاغر` : null,
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        },
        {
          id: 'patients',
          label: 'سجلات وملفات المرضى',
          icon: Users,
          badge: null,
        },
        {
          id: 'archive',
          label: 'أرشيف السجلات (Cold DB)',
          icon: Archive,
          badge: null,
        },
      ]
    },
    {
      groupTitle: 'العيادات والجدولة',
      items: [
        {
          id: 'doctors',
          label: 'الأطباء وجدول المناوبات',
          icon: UserCheck,
          badge: null,
        },
        {
          id: 'appointments',
          label: 'المواعيد والحجوزات الذكية',
          icon: Calendar,
          badge: null,
        },
      ]
    },
    {
      groupTitle: 'الخدمات الطبية والمالية',
      items: [
        {
          id: 'inventory',
          label: 'الصيدلية والمخزن الطبي',
          icon: Pill,
          badge: effectiveLowStock > 0 ? `${effectiveLowStock} نقص` : null,
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        },
        {
          id: 'lab',
          label: 'التحاليل والوصفات الطبية',
          icon: FlaskConical,
          badge: criticalLabCount > 0 ? `${criticalLabCount} حرج` : null,
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
        {
          id: 'billing',
          label: 'الفواتير والإيرادات المالية',
          icon: Receipt,
          badge: null,
        },
      ]
    }
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavContent = () => (
    <>
      <nav className="p-4 space-y-4 flex-1 overflow-y-auto">
        {navigationGroups.map((group, gIdx) => {
          // Filter items allowed for this role
          const visibleItems = group.items.filter(item => currentRoleInfo.allowedTabs.includes(item.id));
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>{group.groupTitle}</span>
              </div>

              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all duration-150 group cursor-pointer ${
                        isActive
                          ? 'bg-sky-600 text-white font-bold shadow-sm shadow-sky-600/20'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-sky-500'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md border ${item.badgeBg || 'bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-500/30'}`}>
                            {item.badge}
                          </span>
                        )}
                        <ChevronLeft className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-white' : 'text-slate-400'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Hospital System Logout Button */}
      {onLogout && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 text-xs mt-auto">
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700/60 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-200 transition-all text-xs font-semibold shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden lg:flex flex-col w-64 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full shrink-0 shadow-sm">
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />

          <aside className="relative flex flex-col w-72 max-w-[85vw] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full z-10 shadow-2xl">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">القائمة الرئيسية</span>
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderNavContent()}
          </aside>
        </div>
      )}
    </>
  );
};
