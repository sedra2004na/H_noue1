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
  UserCircle2
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole = 'admin',
  onLogout,
  lowStockCount = 0,
  criticalLabCount = 0,
  inventoryAlertsCount = 0,
}) => {
  const effectiveLowStock = lowStockCount || inventoryAlertsCount;

  const roleConfig = {
    admin: {
      title: 'مدير النظام (كامل الصلاحيات)',
      icon: ShieldCheck,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      allowedTabs: ['dashboard', 'patients', 'doctors', 'appointments', 'inventory', 'lab', 'billing'],
    },
    doctor: {
      title: 'الطبيب المعالج (ملفات وعيادات)',
      icon: Stethoscope,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      allowedTabs: ['dashboard', 'patients', 'doctors', 'appointments', 'lab'],
    },
    staff: {
      title: 'موظف استقبال (تسجيل وفواتير)',
      icon: StaffIcon,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      allowedTabs: ['dashboard', 'patients', 'appointments', 'inventory', 'billing'],
    },
    patient: {
      title: 'بوابة الخدمة المباشرة للمريض',
      icon: UserCircle2,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      allowedTabs: ['dashboard', 'appointments', 'lab', 'billing'],
    },
  };

  const currentRoleInfo = roleConfig[userRole] || roleConfig.admin;

  const allNavItems = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم الرئيسية',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'patients',
      label: 'إدارة المرضى والملفات الطبية',
      icon: Users,
      badge: null,
    },
    {
      id: 'doctors',
      label: 'الأطباء وجدول المناوبات',
      icon: UserCheck,
      badge: null,
    },
    {
      id: 'appointments',
      label: 'جدول المواعيد والحجوزات',
      icon: Calendar,
      badge: null,
    },
    {
      id: 'inventory',
      label: 'الصيدلية والمستودع الطبي',
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
  ];

  // Filter navigation items by allowed tabs for current userRole
  const navItems = allNavItems.filter(item => currentRoleInfo.allowedTabs.includes(item.id));

  const RoleIcon = currentRoleInfo.icon;

  return (
    <aside className="w-72 bg-slate-900/95 border-l border-slate-800 shrink-0 text-slate-300 flex flex-col min-h-[calc(100vh-5rem)]">
      
      {/* Navigation List */}
      <nav className="p-4 space-y-1.5 flex-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          أقسام النظام المتاحة ({navItems.length})
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-xs transition-all duration-200 group cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white shadow-lg shadow-sky-950/50 font-bold border border-sky-400/30'
                  : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${item.badgeBg || 'bg-sky-500/20 text-sky-300 border-sky-500/30'}`}>
                    {item.badge}
                  </span>
                )}
                <ChevronLeft className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-white' : 'text-slate-400'}`} />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Hospital System Logout Button */}
      {onLogout && (
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-700/60 text-slate-300 hover:text-rose-200 transition-all text-xs font-semibold shadow-inner cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      )}

    </aside>
  );
};
