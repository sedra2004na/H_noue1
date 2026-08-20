import React, { useState } from 'react';
import { Bed, Ward, Patient, Doctor, UserRole, BedStatus } from '../types';
import { 
  Bed as BedIcon, 
  Search, 
  Filter, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  UserPlus, 
  ArrowRightLeft, 
  Wrench, 
  Activity, 
  Wind, 
  ShieldCheck, 
  LogOut, 
  Calendar,
  X,
  Stethoscope,
  Building2,
  Maximize2
} from 'lucide-react';

interface BedsManagementSectionProps {
  userRole?: UserRole;
  beds: Bed[];
  wards: Ward[];
  patients: Patient[];
  doctors: Doctor[];
  onUpdateBed: (bedId: string, updates: Partial<Bed>) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const BedsManagementSection: React.FC<BedsManagementSectionProps> = ({
  userRole = 'admin',
  beds,
  wards,
  patients,
  doctors,
  onUpdateBed,
  onShowToast
}) => {
  const [selectedWardId, setSelectedWardId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [activeModal, setActiveModal] = useState<{
    type: 'assign' | 'transfer' | 'reserve' | 'maintenance' | 'details';
    bed: Bed;
  } | null>(null);

  const [formPatientId, setFormPatientId] = useState('');
  const [formDoctorName, setFormDoctorName] = useState('');
  const [formDiagnosis, setFormDiagnosis] = useState('');
  const [formPriority, setFormPriority] = useState<'critical' | 'stable' | 'observation' | 'urgent'>('stable');
  const [formTargetBedId, setFormTargetBedId] = useState('');
  const [formReservedFor, setFormReservedFor] = useState('');
  const [formReservedUntil, setFormReservedUntil] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Statistics
  const totalBeds = beds.length;
  const occupiedCount = beds.filter(b => b.status === 'occupied').length;
  const availableCount = beds.filter(b => b.status === 'available').length;
  const cleaningCount = beds.filter(b => b.status === 'cleaning').length;
  const reservedCount = beds.filter(b => b.status === 'reserved').length;
  const maintenanceCount = beds.filter(b => b.status === 'maintenance').length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedCount / totalBeds) * 100) : 0;

  // Filtered beds
  const filteredBeds = beds.filter(bed => {
    if (selectedWardId !== 'all' && bed.wardId !== selectedWardId) return false;
    if (statusFilter !== 'all' && bed.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchBed = bed.bedNumber.toLowerCase().includes(q);
      const matchRoom = bed.roomNumber.toLowerCase().includes(q);
      const matchPatient = bed.patientName?.toLowerCase().includes(q);
      const matchWard = bed.wardName.toLowerCase().includes(q);
      const matchDiag = bed.diagnosis?.toLowerCase().includes(q);
      if (!matchBed && !matchRoom && !matchPatient && !matchWard && !matchDiag) return false;
    }
    return true;
  });

  const getStatusBadge = (status: BedStatus) => {
    switch (status) {
      case 'available':
        return {
          label: 'شاغر ومتاح',
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      case 'occupied':
        return {
          label: 'مشغول بمريض',
          bg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
          dot: 'bg-sky-400',
        };
      case 'cleaning':
        return {
          label: 'قيد التعقيم',
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400 animate-pulse',
        };
      case 'reserved':
        return {
          label: 'محجوز لعملية/إجراء',
          bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          dot: 'bg-purple-400',
        };
      case 'maintenance':
        return {
          label: 'صيانة وتجهيز',
          bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-400',
        };
      default:
        return {
          label: 'غير معروف',
          bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
          dot: 'bg-slate-400',
        };
    }
  };

  // Quick Action Handlers
  const handleStartCleaning = (bed: Bed) => {
    onUpdateBed(bed.id, {
      status: 'cleaning',
      cleaningStartedAt: new Date().toISOString(),
      patientId: undefined,
      patientName: undefined,
      diagnosis: undefined,
      attendingDoctorName: undefined,
      priority: undefined,
    });
    onShowToast?.(`تم بدء دورة التعقيم والتطهير للسرير (${bed.bedNumber})`, 'warning');
  };

  const handleFinishCleaning = (bed: Bed) => {
    onUpdateBed(bed.id, {
      status: 'available',
      cleaningStartedAt: undefined,
      notes: 'تم إنهاء التعقيم والتطهير الكامل - جاهز للاستخدام الفوري',
    });
    onShowToast?.(`تم اكتمال التعقيم وأصبح السرير (${bed.bedNumber}) شاغراً ومتاحاً`, 'success');
  };

  const handleDischargePatient = (bed: Bed) => {
    const pName = bed.patientName || 'المريض';
    if (confirm(`هل أنت متأكد من تخريج (${pName}) من السرير (${bed.bedNumber}) والبدء بتعقيم السرير؟`)) {
      onUpdateBed(bed.id, {
        status: 'cleaning',
        cleaningStartedAt: new Date().toISOString(),
        patientId: undefined,
        patientName: undefined,
        diagnosis: undefined,
        attendingDoctorName: undefined,
        priority: undefined,
        notes: `تم تخريج ${pName} بتاريخ ${new Date().toLocaleDateString('ar-SY')}`
      });
      onShowToast?.(`تم تخريج ${pName} وتحويل السرير (${bed.bedNumber}) لدورة التعقيم`, 'info');
    }
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal?.bed) return;
    const selectedPatient = patients.find(p => p.id === formPatientId);
    if (!selectedPatient && !formPatientId) {
      alert('يرجى اختيار المريض');
      return;
    }

    const patientName = selectedPatient ? selectedPatient.fullName : formPatientId;
    onUpdateBed(activeModal.bed.id, {
      status: 'occupied',
      patientId: selectedPatient?.id || 'temp-' + Date.now(),
      patientName,
      admissionDate: new Date().toISOString().split('T')[0],
      attendingDoctorName: formDoctorName || 'د. سارة السعيد',
      diagnosis: formDiagnosis || 'حالة تحت التقييم السريري',
      priority: formPriority,
      notes: formNotes,
    });

    onShowToast?.(`تم تسكين المريض (${patientName}) بالسرير (${activeModal.bed.bedNumber}) بنجاح`, 'success');
    setActiveModal(null);
    setFormPatientId('');
    setFormDiagnosis('');
    setFormNotes('');
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal?.bed || !formTargetBedId) return;

    const sourceBed = activeModal.bed;
    const targetBed = beds.find(b => b.id === formTargetBedId);

    if (!targetBed) return;

    // Move patient to target bed
    onUpdateBed(targetBed.id, {
      status: 'occupied',
      patientId: sourceBed.patientId,
      patientName: sourceBed.patientName,
      admissionDate: sourceBed.admissionDate,
      attendingDoctorName: sourceBed.attendingDoctorName,
      diagnosis: sourceBed.diagnosis,
      priority: sourceBed.priority,
      notes: `تم النقل من سرير (${sourceBed.bedNumber}) - ${formNotes}`,
    });

    // Make source bed cleaning
    onUpdateBed(sourceBed.id, {
      status: 'cleaning',
      cleaningStartedAt: new Date().toISOString(),
      patientId: undefined,
      patientName: undefined,
      diagnosis: undefined,
      attendingDoctorName: undefined,
      priority: undefined,
      notes: `تم نقل المريض إلى (${targetBed.bedNumber})`,
    });

    onShowToast?.(`تم نقل المريض إلى السرير (${targetBed.bedNumber}) وتحويل السرير السابق للتعقيم`, 'success');
    setActiveModal(null);
    setFormTargetBedId('');
    setFormNotes('');
  };

  const handleReserveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal?.bed) return;

    onUpdateBed(activeModal.bed.id, {
      status: 'reserved',
      reservedFor: formReservedFor || 'عملية جراحية مجدولة',
      reservedUntil: formReservedUntil || 'اليوم',
      notes: formNotes,
    });

    onShowToast?.(`تم حجز السرير (${activeModal.bed.bedNumber}) بنجاح للإجراء الطبي`, 'info');
    setActiveModal(null);
    setFormReservedFor('');
    setFormReservedUntil('');
    setFormNotes('');
  };

  const handleToggleMaintenance = (bed: Bed) => {
    if (bed.status === 'maintenance') {
      onUpdateBed(bed.id, {
        status: 'available',
        notes: 'تمت أعمال الصيانة بنجاح والسرير جاهز للخدمة',
      });
      onShowToast?.(`تم إنهاء صيانة السرير (${bed.bedNumber}) وإعادته للخدمة`, 'success');
    } else {
      if (bed.status === 'occupied') {
        alert('لا يمكن تحويل السرير للصيانة وهو مشغول بمريض. يرجى نقل المريض أولاً.');
        return;
      }
      onUpdateBed(bed.id, {
        status: 'maintenance',
        notes: 'قيد الصيانة الفنية والتجهيز',
      });
      onShowToast?.(`تم إدخال السرير (${bed.bedNumber}) في وضع الصيانة`, 'warning');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
              <BedIcon className="w-4 h-4" />
              <span>نظام التتبع اللحظي للأسِرّة والأجنحة السريرية</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">إدارة حالات الأسِرّة والأجنحة</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              متابعة دقيقة للأسرّة الشاغرة، المشغولة، دورات التعقيم الفورية، والحجوزات الجراحية في كافة أقسام المشفى
            </p>
          </div>

          {/* Quick Bed Status Summary Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-xs text-slate-300 font-medium">شاغر:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{availableCount}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
              <span className="text-xs text-slate-300 font-medium">مشغول:</span>
              <span className="font-mono font-bold text-sky-400 text-sm">{occupiedCount}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-xs text-slate-300 font-medium">تعقيم:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">{cleaningCount}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
              <span className="text-xs text-slate-300 font-medium">محجوز:</span>
              <span className="font-mono font-bold text-purple-400 text-sm">{reservedCount}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              <span className="text-xs text-slate-300 font-medium">صيانة:</span>
              <span className="font-mono font-bold text-rose-400 text-sm">{maintenanceCount}</span>
            </div>
          </div>
        </div>

        {/* Global Occupancy Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              معدل الإشغال السريري العام للمشفى:
            </span>
            <span className="font-mono font-bold text-sky-300">{occupancyRate}% ({occupiedCount} من {totalBeds} سرير)</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
            <div 
              className="bg-sky-500 transition-all duration-500" 
              style={{ width: `${(occupiedCount / totalBeds) * 100}%` }}
              title={`مشغول: ${occupiedCount}`}
            />
            <div 
              className="bg-amber-500 transition-all duration-500" 
              style={{ width: `${(cleaningCount / totalBeds) * 100}%` }}
              title={`تعقيم: ${cleaningCount}`}
            />
            <div 
              className="bg-purple-500 transition-all duration-500" 
              style={{ width: `${(reservedCount / totalBeds) * 100}%` }}
              title={`محجوز: ${reservedCount}`}
            />
            <div 
              className="bg-rose-500 transition-all duration-500" 
              style={{ width: `${(maintenanceCount / totalBeds) * 100}%` }}
              title={`صيانة: ${maintenanceCount}`}
            />
            <div 
              className="bg-emerald-500/60 transition-all duration-500" 
              style={{ width: `${(availableCount / totalBeds) * 100}%` }}
              title={`شاغر: ${availableCount}`}
            />
          </div>
        </div>
      </div>

      {/* Ward Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedWardId('all')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
            selectedWardId === 'all'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/50 border border-sky-400/30'
              : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>كافة الأجنحة والأقسام</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-[10px] text-slate-300 font-mono">{beds.length}</span>
        </button>

        {wards.map((ward) => {
          const wardBeds = beds.filter(b => b.wardId === ward.id);
          const wardOccupied = wardBeds.filter(b => b.status === 'occupied').length;
          const isSelected = selectedWardId === ward.id;

          return (
            <button
              key={ward.id}
              onClick={() => setSelectedWardId(ward.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-950/50 border border-sky-400/30'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{ward.name}</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-sky-300 font-mono">
                {wardOccupied}/{wardBeds.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Status Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث برقم السرير، الغرفة، المريض، الجناح..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium ml-1">تصفية الحالة:</span>
          {[
            { id: 'all', label: 'الكل' },
            { id: 'available', label: 'شاغر' },
            { id: 'occupied', label: 'مشغول' },
            { id: 'cleaning', label: 'تعقيم' },
            { id: 'reserved', label: 'محجوز' },
            { id: 'maintenance', label: 'صيانة' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === item.id
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Beds Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBeds.map((bed) => {
          const statusInfo = getStatusBadge(bed.status);
          const isOccupied = bed.status === 'occupied';
          const isCleaning = bed.status === 'cleaning';
          const isAvailable = bed.status === 'available';
          const isReserved = bed.status === 'reserved';
          const isMaintenance = bed.status === 'maintenance';

          return (
            <div
              key={bed.id}
              className={`bg-slate-900/90 border rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between hover:shadow-xl relative overflow-hidden group ${
                isOccupied
                  ? 'border-sky-500/30 hover:border-sky-400/50'
                  : isCleaning
                  ? 'border-amber-500/30 hover:border-amber-400/50 bg-amber-950/10'
                  : isReserved
                  ? 'border-purple-500/30 hover:border-purple-400/50 bg-purple-950/10'
                  : isMaintenance
                  ? 'border-rose-500/30 hover:border-rose-400/50 bg-rose-950/10'
                  : 'border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              <div>
                {/* Header: Bed Number & Status Badge */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl border ${
                      isOccupied ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' :
                      isCleaning ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      isReserved ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                      isMaintenance ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      <BedIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-mono font-black text-base text-white">{bed.bedNumber}</h3>
                      <p className="text-[11px] text-slate-400">{bed.roomNumber} - {bed.wardName}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${statusInfo.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                    <span>{statusInfo.label}</span>
                  </span>
                </div>

                {/* Bed Equipment Tags */}
                <div className="flex items-center gap-1.5 mt-2.5">
                  {bed.oxygenEquipped && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-sky-400 flex items-center gap-1" title="مجهز بمأخذ أكسجين مركزي">
                      <Wind className="w-3 h-3" />
                      <span>أكسجين</span>
                    </span>
                  )}
                  {bed.ventilatorEquipped && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-purple-400 flex items-center gap-1" title="مجهز بجهاز تنفس اصطناعي">
                      <Activity className="w-3 h-3" />
                      <span>تنفس صناعي</span>
                    </span>
                  )}
                </div>

                {/* Center Content depending on status */}
                <div className="my-3 space-y-2">
                  {isOccupied && (
                    <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{bed.patientName}</span>
                        {bed.priority && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            bed.priority === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            bed.priority === 'urgent' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {bed.priority === 'critical' ? 'حالة حرجة' : bed.priority === 'urgent' ? 'عاجل' : 'مستقر'}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-[11px] leading-tight line-clamp-2">{bed.diagnosis}</p>
                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-800/60">
                        <span>الطبيب: {bed.attendingDoctorName}</span>
                        <span className="font-mono">{bed.admissionDate}</span>
                      </div>
                    </div>
                  )}

                  {isCleaning && (
                    <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-3 text-center space-y-1.5">
                      <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold">
                        <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                        <span>دورة التعقيم والتطهير جارية</span>
                      </div>
                      <p className="text-[11px] text-amber-200/80">تعقيم بالأشعة فوق البنفسجية وتبديل الأغطية والمستهلكات</p>
                      {bed.cleaningStartedAt && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          بدء التعقيم: {new Date(bed.cleaningStartedAt).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  )}

                  {isReserved && (
                    <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-3 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>محجوز لإجراء:</span>
                      </div>
                      <p className="text-slate-200 text-xs">{bed.reservedFor}</p>
                      {bed.reservedUntil && (
                        <p className="text-[10px] text-purple-300 font-mono">الموعد: {bed.reservedUntil}</p>
                      )}
                    </div>
                  )}

                  {isMaintenance && (
                    <div className="bg-rose-950/30 border border-rose-500/20 rounded-xl p-3 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>خارج الخدمة للصيانة</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{bed.notes || 'أعمال صيانة وتجهيز دورية'}</p>
                    </div>
                  )}

                  {isAvailable && (
                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>السرير معقم وجاهز للاستقبال</span>
                      </div>
                      <p className="text-[11px] text-slate-400">يمكن تسكين مريض طوارئ أو تحويل مباشر فوراً</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                {isAvailable && (
                  <>
                    <button
                      onClick={() => {
                        setActiveModal({ type: 'assign', bed });
                        setFormPatientId('');
                      }}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>تسكين مريض</span>
                    </button>
                    <button
                      onClick={() => setActiveModal({ type: 'reserve', bed })}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-purple-950/60 hover:text-purple-300 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      title="حجز مسبق لعملية"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>حجز</span>
                    </button>
                  </>
                )}

                {isOccupied && (
                  <>
                    <button
                      onClick={() => {
                        setActiveModal({ type: 'transfer', bed });
                        setFormTargetBedId('');
                      }}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-sky-600 hover:text-white border border-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>نقل سرير</span>
                    </button>
                    <button
                      onClick={() => handleDischargePatient(bed)}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-amber-600 hover:text-white border border-slate-700 text-amber-300 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                      title="تخريج المريض وبدء التعقيم"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>تخريج</span>
                    </button>
                  </>
                )}

                {isCleaning && (
                  <button
                    onClick={() => handleFinishCleaning(bed)}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-950/40"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اكتمال التعقيم وجعل السرير شاغراً</span>
                  </button>
                )}

                {isReserved && (
                  <div className="w-full flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setActiveModal({ type: 'assign', bed });
                        setFormPatientId('');
                      }}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>استقبال المريض الآن</span>
                    </button>
                    <button
                      onClick={() => onUpdateBed(bed.id, { status: 'available', reservedFor: undefined, reservedUntil: undefined })}
                      className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                      title="إلغاء الحجز"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {isMaintenance && (
                  <button
                    onClick={() => handleToggleMaintenance(bed)}
                    className="w-full py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5 text-rose-400" />
                    <span>إنهاء الصيانة وإعادة التفعيل</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Dialogs */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2">
                <BedIcon className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-black text-white text-base">
                    {activeModal.type === 'assign' && `تسكين مريض في السرير (${activeModal.bed.bedNumber})`}
                    {activeModal.type === 'transfer' && `نقل المريض من السرير (${activeModal.bed.bedNumber})`}
                    {activeModal.type === 'reserve' && `حجز مسبق للسرير (${activeModal.bed.bedNumber})`}
                  </h3>
                  <p className="text-xs text-slate-400">{activeModal.bed.wardName} - {activeModal.bed.roomNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* ASSIGN PATIENT FORM */}
              {activeModal.type === 'assign' && (
                <form onSubmit={handleAssignSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">اختر المريض المراد تسكينه *</label>
                    <select
                      value={formPatientId}
                      onChange={(e) => setFormPatientId(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      <option value="">-- اختر من قائمة المرضى --</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.fullName} ({p.fileNumber}) - {p.gender} {p.age} سنة</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">الطبيب المعالج والمشرف</label>
                    <select
                      value={formDoctorName}
                      onChange={(e) => setFormDoctorName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      <option value="">-- اختر الطبيب المعالج --</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.name}>{d.name} ({d.specialty})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">درجة الأولوية السريرية</label>
                      <select
                        value={formPriority}
                        onChange={(e) => setFormPriority(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                      >
                        <option value="stable">مستقر (عناية عادية)</option>
                        <option value="observation">تحت الملاحظة</option>
                        <option value="urgent">عاجل</option>
                        <option value="critical">حرج (عناية حثيثة)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">تاريخ الدخول</label>
                      <input
                        type="date"
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">تشخيص الدخول والسبب الطبي *</label>
                    <textarea
                      rows={2}
                      value={formDiagnosis}
                      onChange={(e) => setFormDiagnosis(e.target.value)}
                      placeholder="مثال: مراقبة بعد عملية استئصال المرارة، أو احتشاء عضلة قلبية حاد..."
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50"
                    >
                      تأكيد التسكين في السرير
                    </button>
                  </div>
                </form>
              )}

              {/* TRANSFER BED FORM */}
              {activeModal.type === 'transfer' && (
                <form onSubmit={handleTransferSubmit} className="space-y-4">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="text-slate-400 font-medium">المريض الحالي المنقول:</div>
                    <div className="text-sm font-bold text-white">{activeModal.bed.patientName}</div>
                    <div className="text-slate-400 text-[11px]">التشخيص: {activeModal.bed.diagnosis}</div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">اختر السرير الشاغر الجديد للتحويل إليه *</label>
                    <select
                      value={formTargetBedId}
                      onChange={(e) => setFormTargetBedId(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      <option value="">-- اختر السرير الشاغر --</option>
                      {beds.filter(b => b.status === 'available' && b.id !== activeModal.bed.id).map(b => (
                        <option key={b.id} value={b.id}>
                          {b.bedNumber} ({b.wardName} - {b.roomNumber}) {b.oxygenEquipped ? '★ مجهز أكسجين' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">سبب التحويل أو ملاحظات النقل السريري</label>
                    <input
                      type="text"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="مثال: استقرار الحالة والتحويل من العناية للجناح العام..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-950/50"
                    >
                      إتمام نقل المريض وبدء تعقيم السرير القديم
                    </button>
                  </div>
                </form>
              )}

              {/* RESERVE BED FORM */}
              {activeModal.type === 'reserve' && (
                <form onSubmit={handleReserveSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">سبب الحجز أو اسم العملية المجدولة *</label>
                    <input
                      type="text"
                      value={formReservedFor}
                      onChange={(e) => setFormReservedFor(e.target.value)}
                      placeholder="مثال: عملية استبدال صمام تاجي مجدولة، استقبال مريض قسطرة..."
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">الموعد المتوقع للاستقبال *</label>
                    <input
                      type="text"
                      value={formReservedUntil}
                      onChange={(e) => setFormReservedUntil(e.target.value)}
                      placeholder="مثال: الساعة 12:00 ظهراً، غداً صباحاً..."
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">ملاحظات التجهيز الخاص</label>
                    <input
                      type="text"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="مثال: تجهيز جهاز مراقبة دقيق ومضخة تسريب..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-950/50"
                    >
                      تثبيت حجز السرير
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
