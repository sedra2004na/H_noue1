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
  onOpenDatabaseManager?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole = 'admin',
  onLogout,
  lowStockCount = 0,
  criticalLabCount = 0,
  patientsCount = 0,
  appointmentsCount = 0,
  inventoryAlertsCount = 0,
  availableBedsCount,
  abnormalFlagsCount = 0,
  isMobileOpen = false,
  onCloseMobile,
  onOpenDatabaseManager,
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

  // Dedicated Navigation Groups Per Role with customized terminology
  const getNavigationGroups = () => {
    switch (userRole) {
      case 'patient':
        return [
          {
            groupTitle: 'ملفي الصحي وخدماتي',
            items: [
              {
                id: 'dashboard',
                label: 'بوابتي الطبية ومتابعتي',
                icon: HeartPulse,
                badge: null,
              },
              {
                id: 'appointments',
                label: 'مواعيدي وحجوزاتي الطبية',
                icon: Calendar,
                badge: appointmentsCount > 0 ? `${appointmentsCount} قادم` : null,
                badgeBg: 'bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-500/30',
              },
            ]
          },
          {
            groupTitle: 'السجلات والمدفوعات',
            items: [
              {
                id: 'lab',
                label: 'نتائجي ووصفاتي الدوائية',
                icon: FlaskConical,
                badge: criticalLabCount > 0 ? `${criticalLabCount} جديد` : null,
                badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
              },
              {
                id: 'billing',
                label: 'فواتيري ومدفوعاتي',
                icon: Receipt,
                badge: null,
              },
            ]
          }
        ];

      case 'doctor':
        return [
          {
            groupTitle: 'الرعاية السريرية والمرضى',
            items: [
              {
                id: 'doctor_portal',
                label: 'لوحة الطبيب السريرية',
                icon: Stethoscope,
                badge: abnormalFlagsCount > 0 ? `${abnormalFlagsCount} تنبيه` : null,
                badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
              },
              {
                id: 'patients',
                label: 'ملفات المرضى والمتابعة',
                icon: Users,
                badge: patientsCount ? `${patientsCount} مريض` : null,
              },
              {
                id: 'beds',
                label: 'مرضى الأجنحة والتنويم',
                icon: BedIcon,
                badge: availableBedsCount !== undefined ? `${availableBedsCount} شاغر` : null,
                badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
              },
              {
                id: 'archive',
                label: 'الأرشيف الطبي والسجلات',
                icon: ClipboardList,
                badge: null,
              },
            ]
          },
          {
            groupTitle: 'العيادات والخدمات الطبية',
            items: [
              {
                id: 'appointments',
                label: 'جدول مواعيد العيادة',
                icon: Calendar,
                badge: appointmentsCount > 0 ? `${appointmentsCount} موعد` : null,
              },
              {
                id: 'lab',
                label: 'التحاليل والوصفات الطبية',
                icon: FlaskConical,
                badge: criticalLabCount > 0 ? `${criticalLabCount} حرج` : null,
                badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
              },
              {
                id: 'doctors',
                label: 'جدول الأطباء والمناوبات',
                icon: UserCheck,
                badge: null,
              },
              {
                id: 'dashboard',
                label: 'إحصاءات العيادة العامة',
                icon: LayoutDashboard,
                badge: null,
              },
            ]
          }
        ];

      case 'staff':
        return [
          {
            groupTitle: 'مكتب الاستقبال والتسكين',
            items: [
              {
                id: 'dashboard',
                label: 'لوحة الاستقبال والعمليات',
                icon: LayoutDashboard,
                badge: null,
              },
              {
                id: 'patients',
                label: 'تسجيل وملفات المرضى',
                icon: Users,
                badge: patientsCount ? `${patientsCount} مريض` : null,
              },
              {
                id: 'appointments',
                label: 'جدولة وحجز المواعيد',
                icon: Calendar,
                badge: appointmentsCount > 0 ? `${appointmentsCount} موعد` : null,
              },
              {
                id: 'beds',
                label: 'تسكين وإدخال الأسِرّة',
                icon: BedIcon,
                badge: availableBedsCount !== undefined ? `${availableBedsCount} متاح` : null,
                badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
              },
            ]
          },
          {
            groupTitle: 'المحاسبة والخدمات المساندة',
            items: [
              {
                id: 'billing',
                label: 'فواتير ومحاسبة المرضى',
                icon: Receipt,
                badge: null,
              },
              {
                id: 'inventory',
                label: 'المستلزمات وصرف الأدوية',
                icon: Pill,
                badge: effectiveLowStock > 0 ? `${effectiveLowStock} نقص` : null,
                badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
              },
              {
                id: 'archive',
                label: 'أرشيف خروج المرضى',
                icon: ClipboardList,
                badge: null,
              },
            ]
          }
        ];

      case 'admin':
      default:
        return [
          {
            groupTitle: 'الرقابة السريرية والتشغيلية',
            items: [
              {
                id: 'dashboard',
                label: 'لوحة التحكم والعمليات الشاملة',
                icon: LayoutDashboard,
                badge: null,
              },
              {
                id: 'doctor_portal',
                label: 'المراقبة السريرية والأجنحة',
                icon: Stethoscope,
                badge: abnormalFlagsCount > 0 ? `${abnormalFlagsCount} تنبيه` : null,
                badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
              },
              {
                id: 'beds',
                label: 'إدارة الطاقة الاستيعابية والأسِرّة',
                icon: BedIcon,
                badge: availableBedsCount !== undefined ? `${availableBedsCount} شاغر` : null,
                badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
              },
              {
                id: 'patients',
                label: 'إدارة السجلات الطبية للمرضى',
                icon: Users,
                badge: patientsCount ? `${patientsCount} مريض` : null,
              },
              {
                id: 'archive',
                label: 'الأرشيف المركزي والتخزين البارد',
                icon: ClipboardList,
                badge: null,
              },
            ]
          },
          {
            groupTitle: 'الموارد البشرية والجدولة',
            items: [
              {
                id: 'doctors',
                label: 'الكادر الطبي وجدول المناوبات',
                icon: UserCheck,
                badge: null,
              },
              {
                id: 'appointments',
                label: 'المواعيد والحجوزات المركزية',
                icon: Calendar,
                badge: appointmentsCount > 0 ? `${appointmentsCount} نشط` : null,
              },
            ]
          },
          {
            groupTitle: 'المخزون والمالية',
            items: [
              {
                id: 'inventory',
                label: 'الصيدلية والمستودع المركزي',
                icon: Pill,
                badge: effectiveLowStock > 0 ? `${effectiveLowStock} نقص` : null,
                badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
              },
              {
                id: 'lab',
                label: 'المختبر والوصفات الطبية',
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
    }
  };

  const currentNavigationGroups = getNavigationGroups();

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavContent = () => (
    <>
      {/* Role Banner inside Sidebar */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 flex items-center gap-2.5">
        <div className={`p-2 rounded-xl border ${currentRoleInfo.color} shrink-0`}>
          <currentRoleInfo.icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentRoleInfo.title}</p>
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 mt-0.5">
            {currentRoleInfo.badge}
          </span>
        </div>
      </div>

      <nav className="p-4 space-y-4 flex-1 overflow-y-auto" aria-label="أقسام النظام الرئيسية">
        {currentNavigationGroups.map((group, gIdx) => {
          // Filter items allowed for this role
          const visibleItems = group.items.filter(item => currentRoleInfo.allowedTabs.includes(item.id));
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className="space-y-1">
              <div className="px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-400 tracking-wide flex items-center justify-between">
                <span>{group.groupTitle}</span>
              </div>

              <div className="space-y-1" role="list">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      aria-label={item.label}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 group cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${
                        isActive
                          ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-600/25'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-300 group-hover:text-sky-500'}`} aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md border ${item.badgeBg || 'bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-500/30'}`}>
                            {item.badge}
                          </span>
                        )}
                        <ChevronLeft className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-white' : 'text-slate-400'}`} aria-hidden="true" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer with Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-xs mt-auto">
        {onLogout && (
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
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden lg:flex flex-col w-64 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 self-stretch min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] shrink-0 shadow-sm sticky top-16 sm:top-20 z-20">
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
