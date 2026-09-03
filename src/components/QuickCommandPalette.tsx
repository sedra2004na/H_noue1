import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  Users, 
  Calendar, 
  Stethoscope, 
  Bed, 
  Pill, 
  FlaskConical, 
  Receipt, 
  Archive, 
  LayoutDashboard, 
  ArrowRight, 
  Siren,
  Sparkles,
  Command
} from 'lucide-react';
import { Patient, Doctor, Appointment, Bed as BedType } from '../types';

interface QuickCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  beds: BedType[];
  onOpenQuickModal?: (modalType: 'appointment' | 'patient' | 'inventory' | 'invoice') => void;
  onOpenEmergencyModal?: () => void;
}

export const QuickCommandPalette: React.FC<QuickCommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  patients,
  doctors,
  appointments,
  beds,
  onOpenQuickModal,
  onOpenEmergencyModal,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle palette
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedQuery = query.toLowerCase().trim();

  // Quick Action commands
  const navigationCommands = [
    { id: 'dashboard', title: 'لوحة التحكم العامة', subtitle: 'نظرة عامة والعمليات اليومية', icon: LayoutDashboard, tab: 'dashboard' },
    { id: 'doctor_portal', title: 'لوحة الطبيب السريرية', subtitle: 'متابعة الحالات والتنبيهات', icon: Stethoscope, tab: 'doctor_portal' },
    { id: 'patients', title: 'إدارة المرضى والملفات الطبية', subtitle: 'سجلات المرضى وتاريخهم الطبي', icon: Users, tab: 'patients' },
    { id: 'appointments', title: 'جدول المواعيد والحجوزات', subtitle: 'تتبع العيادات ومنع التعارض', icon: Calendar, tab: 'appointments' },
    { id: 'beds', title: 'تتبع حالات الأسِرّة والأجنحة', subtitle: 'شواغر العناية والطوارئ', icon: Bed, tab: 'beds' },
    { id: 'inventory', title: 'الصيدلية والمستودع الطبي', subtitle: 'مخزون الأدوية وتنبيهات النقص', icon: Pill, tab: 'inventory' },
    { id: 'lab', title: 'التحاليل والوصفات الطبية', subtitle: 'نتائج المختبر وصرف الأدوية', icon: FlaskConical, tab: 'lab' },
    { id: 'billing', title: 'المحاسبة والفوترة والتأمين', subtitle: 'المطالبات المالية والتقارير', icon: Receipt, tab: 'billing' },
    { id: 'archive', title: 'أرشيف السجلات القديمة', subtitle: 'قاعدة بيانات التخزين البارد', icon: Archive, tab: 'archive' },
  ].filter(c => !normalizedQuery || c.title.toLowerCase().includes(normalizedQuery) || c.subtitle.toLowerCase().includes(normalizedQuery));

  // Matching Patients
  const matchingPatients = patients.filter(p => 
    normalizedQuery && (
      p.fullName.toLowerCase().includes(normalizedQuery) ||
      p.nationalId?.includes(normalizedQuery) ||
      p.phone?.includes(normalizedQuery) ||
      p.fileNumber?.toLowerCase().includes(normalizedQuery)
    )
  ).slice(0, 4);

  // Matching Doctors
  const matchingDoctors = doctors.filter(d =>
    normalizedQuery && (
      d.name.toLowerCase().includes(normalizedQuery) ||
      d.specialty.toLowerCase().includes(normalizedQuery) ||
      d.department.toLowerCase().includes(normalizedQuery)
    )
  ).slice(0, 4);

  const handleSelectNav = (tabId: string) => {
    onNavigateTab(tabId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[80vh]">
        
        {/* Search Header Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/40">
          <Search className="w-5 h-5 text-sky-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن مريض، طبيب، قسم، أو اكتب أمراً..."
            className="w-full bg-transparent border-0 text-sm focus:outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
              ESC
            </span>
          )}
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          
          {/* Quick Action Shortcuts */}
          {!normalizedQuery && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                إجراءات سريعة وفورية
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => {
                    onOpenQuickModal?.('patient');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 hover:bg-sky-50 dark:hover:bg-sky-950/30 text-start flex items-center gap-2 transition-all"
                >
                  <Users className="w-4 h-4 text-sky-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">تسجيل مريض</span>
                </button>

                <button
                  onClick={() => {
                    onOpenQuickModal?.('appointment');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 hover:bg-teal-50 dark:hover:bg-teal-950/30 text-start flex items-center gap-2 transition-all"
                >
                  <Calendar className="w-4 h-4 text-teal-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">حجز موعد</span>
                </button>

                <button
                  onClick={() => {
                    onOpenEmergencyModal?.();
                    onClose();
                  }}
                  className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-start flex items-center gap-2 transition-all"
                >
                  <Siren className="w-4 h-4 text-rose-500" />
                  <span className="font-semibold text-rose-600 dark:text-rose-400">نداء طوارئ</span>
                </button>

                <button
                  onClick={() => {
                    onNavigateTab('beds');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-start flex items-center gap-2 transition-all"
                >
                  <Bed className="w-4 h-4 text-indigo-500" />
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">شواغر الأسرة</span>
                </button>
              </div>
            </div>
          )}

          {/* Matched Patients */}
          {matchingPatients.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                سجلات المرضى المطابقة ({matchingPatients.length})
              </div>
              <div className="space-y-1.5">
                {matchingPatients.map(patient => (
                  <button
                    key={patient.id}
                    onClick={() => {
                      onNavigateTab('patients');
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center justify-between text-start transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold">
                        {patient.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">{patient.fullName}</div>
                        <div className="text-[11px] text-slate-400">الهوية: {patient.nationalId} • فصيلة الدم: {patient.bloodType} • الهاتف: {patient.phone}</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 font-semibold">فتح الملف</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Doctors */}
          {matchingDoctors.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                الأطباء المناوبون المطابقون ({matchingDoctors.length})
              </div>
              <div className="space-y-1.5">
                {matchingDoctors.map(doctor => (
                  <button
                    key={doctor.id}
                    onClick={() => {
                      onNavigateTab('doctors');
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center justify-between text-start transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold">
                        {doctor.name.charAt(2) || 'ط'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">{doctor.name}</div>
                        <div className="text-[11px] text-slate-400">{doctor.specialty} • قسم {doctor.department} • العيادة {doctor.roomNumber}</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 font-semibold">الجدول والمواعيد</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sections Navigation */}
          {navigationCommands.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                أقسام ولوحات النظام
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {navigationCommands.map(cmd => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => handleSelectNav(cmd.tab)}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 flex items-center gap-3 text-start transition-all"
                    >
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 dark:text-slate-100 truncate">{cmd.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">{cmd.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {normalizedQuery && matchingPatients.length === 0 && matchingDoctors.length === 0 && navigationCommands.length === 0 && (
            <div className="py-8 text-center text-slate-400">
              <p>لم يتم العثور على نتائج مطابقة لـ "{query}"</p>
              <p className="text-[11px] text-slate-500 mt-1">جرب البحث باسم المريض أو تخصيص الطبيب أو اسم القسم</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 px-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400">
          <span>نظام مشفى الرحمة السريع</span>
          <div className="flex items-center gap-3">
            <span>التنقل السريع</span>
            <span className="font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">ESC للإغلاق</span>
          </div>
        </div>

      </div>
    </div>
  );
};
