import React, { useState } from 'react';
import { UserRole, Doctor, Patient } from '../types';
import { 
  Siren, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  BedDouble, 
  User, 
  Stethoscope, 
  PhoneCall, 
  ShieldAlert,
  Send,
  Radio,
  Ambulance,
  PhoneForwarded,
  Flame,
  ShieldCheck,
  Info
} from 'lucide-react';

export interface ERRoom {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'preparing';
  assignedPatient?: string;
  assignedDoctor?: string;
  equipment: string[];
}

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  doctors: Doctor[];
  patients: Patient[];
  activeSOS: {
    id: string;
    patientName: string;
    condition: string;
    roomName: string;
    time: string;
    status: 'active' | 'responding' | 'resolved';
  } | null;
  onTriggerSOS: (patientName: string, condition: string, roomName: string) => void;
  onResolveSOS: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

// Verified official national and hospital emergency hotlines
const EMERGENCY_PHONE_NUMBERS = [
  {
    id: 'red-crescent',
    name: 'منظومة الإسعاف السريع والطوارئ المركزية',
    subtext: 'الهلال الأحمر والطوارئ الطبية الوطنية (متاح 24/7)',
    number: '110',
    telHref: 'tel:110',
    badge: 'طوارئ مجانية',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    icon: Ambulance,
  },
  {
    id: 'hospital-er',
    name: 'الخط الساخن لقسم إنعاش وطوارئ مشفى الرحمة',
    subtext: 'مكتب التنسيق السريري وغرفة العمليات الإسعافية المباشرة',
    number: '011-9110',
    telHref: 'tel:0119110',
    badge: 'طوارئ المشفى',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    icon: PhoneForwarded,
  },
  {
    id: 'police',
    name: 'شرطة النجدة وحماية المنشآت الطبية',
    subtext: 'طوارئ الأمن والسلامة العامة',
    number: '112',
    telHref: 'tel:112',
    badge: 'الأمن والنجدة',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    icon: ShieldCheck,
  },
  {
    id: 'fire-dept',
    name: 'الدفاع المدني والإطفاء والسلامة',
    subtext: 'عمليات الإنقاذ وحالات الإخلاء الشامل',
    number: '113',
    telHref: 'tel:113',
    badge: 'إنقاذ ودفاع مدني',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: Flame,
  },
];

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  userRole,
  doctors,
  patients,
  activeSOS,
  onTriggerSOS,
  onResolveSOS,
  onShowToast,
}) => {
  const [erRooms, setErRooms] = useState<ERRoom[]>([
    { id: 'er-1', name: 'غرفة طوارئ 1 (إنعاش جراحي)', status: 'available', equipment: ['جهاز صدمات قلب (Defibrillator)', 'مراقبة علامات حيوية'] },
    { id: 'er-2', name: 'غرفة طوارئ 2 (قلبية وحرجة)', status: 'occupied', assignedPatient: 'خالد السعيد', assignedDoctor: 'د. أحمد الخطيب', equipment: ['تخطيط قلب سريع ECG', 'مضخة إنفزيون'] },
    { id: 'er-3', name: 'غرفة طوارئ 3 (إصابات وباطنية)', status: 'available', equipment: ['أكسجين مركز', 'معدات تخثير سريعة'] },
    { id: 'er-4', name: 'غرفة طوارئ 4 (عناية سريعة)', status: 'preparing', equipment: ['تعقيم وتجهيز دوري'] },
  ]);

  const [selectedPatientName, setSelectedPatientName] = useState(
    patients.length > 0 ? patients[0].fullName : 'مريض طوارئ خفوري'
  );
  const [selectedCondition, setSelectedCondition] = useState('أزمة قلبية / آلام صدرية حادة');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('غرفة 304 - (الجناح الثاني)');
  const [selectedRoomId, setSelectedRoomId] = useState('er-1');

  // Confirmation modal state to prevent accidental one-click triggers
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<{
    patientName: string;
    condition: string;
    roomLocation: string;
    roomId: string;
  } | null>(null);

  if (!isOpen) return null;

  // Step 1: Pre-validation and opening confirmation dialog
  const handlePreTriggerSOS = (e: React.FormEvent) => {
    e.preventDefault();
    const targetRoom = erRooms.find(r => r.id === selectedRoomId) || erRooms[0];
    const roomLocation = userRole === 'patient' ? selectedRoomNumber : targetRoom.name;

    setPendingPayload({
      patientName: selectedPatientName,
      condition: selectedCondition,
      roomLocation,
      roomId: targetRoom.id
    });
    setShowConfirmDialog(true);
  };

  // Step 2: Confirmed execution of SOS
  const handleConfirmSOS = () => {
    if (!pendingPayload) return;

    const { patientName, condition, roomLocation, roomId } = pendingPayload;

    // Trigger the real emergency SOS alert
    onTriggerSOS(patientName, condition, roomLocation);

    // Update room status to occupied
    setErRooms(prev => prev.map(r => 
      r.id === roomId 
        ? { ...r, status: 'occupied', assignedPatient: `${patientName} (${roomLocation})` } 
        : r
    ));

    setShowConfirmDialog(false);
    setPendingPayload(null);
    onShowToast(`🚨 تم إطلاق نداء الطوارئ بنجاح وإشعار كادر الإنعاش فوراً للغرفة: ${roomLocation}`, 'error');
  };

  const handleCancelSOSConfirm = () => {
    setShowConfirmDialog(false);
    setPendingPayload(null);
  };

  const handleToggleRoomStatus = (roomId: string, newStatus: 'available' | 'occupied' | 'preparing') => {
    setErRooms(prev => prev.map(r => 
      r.id === roomId 
        ? { ...r, status: newStatus, assignedPatient: newStatus === 'available' ? undefined : r.assignedPatient } 
        : r
    ));
    onShowToast('تم تحديث حالة غرفة الطوارئ بنجاح', 'success');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto" 
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[92vh] my-auto relative">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 border-b border-rose-900/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/40 shrink-0">
              <Siren className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white truncate">
                  مركز الاستجابة للطوارئ والإسعاف السريع
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-rose-600/30 text-rose-300 border border-rose-500/40 text-[10px] font-extrabold font-mono tracking-wider">
                  CODE BLUE / ER
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                أرقام الإسعاف الوطنية 110، بروتوكول التدخل السريع، وحجز غرف الإنعاش
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
            title="إغلاق نافذة الطوارئ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-right text-sm">
          
          {/* Active SOS Banner if active */}
          {activeSOS && (
            <div className="p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-7 h-7 text-rose-400 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm text-rose-200 flex items-center gap-2">
                    <span>🚨 نداء طوارئ سريري قائم حالياً:</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-rose-600 text-white font-black text-xs shadow">
                      {activeSOS.roomName}
                    </span>
                  </h3>
                  <p className="text-xs text-rose-100 font-semibold mt-1">
                    الحالة: <span className="underline">{activeSOS.condition}</span> | المريض صاحب النداء: <span className="underline">{activeSOS.patientName}</span>
                  </p>
                  <p className="text-[11px] text-rose-300 mt-0.5">توقيت الاستغاثة: {activeSOS.time}</p>
                </div>
              </div>

              {(userRole === 'admin' || userRole === 'doctor' || userRole === 'staff') && (
                <button
                  onClick={() => {
                    onResolveSOS();
                    onShowToast('تم إنهاء حالة الطوارئ وتأكيد وصول الطبيب والاستجابة للغرفة', 'success');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer shrink-0 transition-transform hover:scale-105"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد الوصول وإنهاء النداء</span>
                </button>
              )}
            </div>
          )}

          {/* 1. REAL EMERGENCY PHONE NUMBERS (Click-to-Call) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>أرقام الطوارئ والاتصال السريع المباشر (اضغط للاتصال الفوري)</span>
              </h3>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                خطوط مفتوحة 24/7
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EMERGENCY_PHONE_NUMBERS.map((hotline) => {
                const IconComponent = hotline.icon;
                return (
                  <div
                    key={hotline.id}
                    className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-all group shadow-sm"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sky-400 group-hover:text-emerald-400 shrink-0 transition-colors">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-xs text-white truncate">{hotline.name}</span>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${hotline.badgeColor}`}>
                            {hotline.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{hotline.subtext}</p>
                        <p className="text-xs font-mono font-black text-sky-300 mt-1" dir="ltr">
                          {hotline.number}
                        </p>
                      </div>
                    </div>

                    <a
                      href={hotline.telHref}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-md hover:shadow-emerald-600/30 cursor-pointer"
                      title={`اتصال مباشر بالرقم ${hotline.number}`}
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>اتصال</span>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. EXPLANATION: WHAT ACTUALLY HAPPENS ON EMERGENCY DISPATCH */}
          <div className="p-4 rounded-2xl bg-sky-950/20 border border-sky-500/30 text-slate-200 space-y-2.5">
            <div className="flex items-center gap-2 text-sky-300 font-bold text-xs sm:text-sm">
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
              <span>ماذا يحدث فعلياً عند إطلاق نداء الاستغاثة الطبي (SOS / Code Blue)؟</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <p className="font-bold text-rose-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  <span>1. إنذار كادر الإنعاش</span>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  يصل تنبيه صوتي وشاشاتي فوري لجميع أطباء وممرضي الإسعاف المناوبين مع رقم الغرفة والسرير فوراً.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <p className="font-bold text-sky-300 flex items-center gap-1.5">
                  <BedDouble className="w-3.5 h-3.5" />
                  <span>2. حجز سرير مجهز</span>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  يتم حجز أقرب غرفة إنعاش شاغرة وتجهيز جهاز الصدمات الكهربائية وأسطوانات الأكسجين فائق التدفق.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Ambulance className="w-3.5 h-3.5" />
                  <span>3. التنسيق الخارجي</span>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  إذا كانت الحالة خارج المستشفى أو تتطلب نقلاً عاجلاً، يتم ربط النداء فوراً مع إسعاف 110 المركزي.
                </p>
              </div>
            </div>
          </div>

          {/* 3. SOS TRIGGER FORM (With Safe Two-Step Confirmation) */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
            <h3 className="text-sm font-bold text-white flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-rose-400" />
                <span>
                  {userRole === 'patient' 
                    ? 'طلب استغاثة سريرية وإرسال الموقع للإنعاش' 
                    : 'إطلاق نداء طوارئ وتخصيص غرفة إسعاف'}
                </span>
              </div>
              <span className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>يتطلب تأكيداً مسبقاً لمنع الإنذارات الخاطئة</span>
              </span>
            </h3>

            {userRole === 'patient' ? (
              <form onSubmit={handlePreTriggerSOS} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      رقم الغرفة / السرير الحالي الذي تتواجد به
                    </label>
                    <select
                      value={selectedRoomNumber}
                      onChange={(e) => setSelectedRoomNumber(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 font-bold focus:outline-none focus:border-rose-500 cursor-pointer"
                    >
                      <option value="غرفة 304 - (الجناح الثاني)">غرفة 304 - (الجناح الثاني)</option>
                      <option value="غرفة 201 - (جناح النقاهة)">غرفة 201 - (جناح النقاهة)</option>
                      <option value="غرفة 105 - (العناية المتوسطة)">غرفة 105 - (العناية المتوسطة)</option>
                      <option value="غرفة 412 - (الطابق الرابع)">غرفة 412 - (الطابق الرابع)</option>
                      <option value="قسم العيادات الخارجية - سرير 3">قسم العيادات الخارجية - سرير 3</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      نوع الأعراض أو الحالة الطارئة
                    </label>
                    <select
                      value={selectedCondition}
                      onChange={(e) => setSelectedCondition(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-rose-500 cursor-pointer"
                    >
                      <option value="أزمة قلبية / آلام صدرية حادة">أزمة قلبية / آلام صدرية حادة</option>
                      <option value="ضيق تنفس حاد / اختناق">ضيق تنفس حاد / اختناق</option>
                      <option value="نزيف / إصابة طارئة">نزيف / إصابة طارئة</option>
                      <option value="إغماء / هبوط حاد بالمؤشرات">إغماء / هبوط حاد بالمؤشرات</option>
                      <option value="طوارئ أخرى مستعجلة">طوارئ أخرى مستعجلة</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200 text-xs">
                  <span>المريض صاحب الطلب: <strong className="text-white">سامر المحمود (ملف: P-1001)</strong></span>
                  
                  <button
                    type="submit"
                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/40 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                  >
                    <Siren className="w-4 h-4 text-white" />
                    <span>طلب استغاثة كود أحمر (SOS)</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePreTriggerSOS} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">اسم المريض المعني</label>
                    <select
                      value={selectedPatientName}
                      onChange={(e) => setSelectedPatientName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-rose-500 cursor-pointer"
                    >
                      {patients.map(p => (
                        <option key={p.id} value={p.fullName}>{p.fullName} (ملف: {p.fileNumber})</option>
                      ))}
                      <option value="مريض طوارئ جديد / حالة مجهولة">مريض طوارئ جديد / حالة مجهولة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">نوع الحالة الإسعافية</label>
                    <select
                      value={selectedCondition}
                      onChange={(e) => setSelectedCondition(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-rose-500 cursor-pointer"
                    >
                      <option value="أزمة قلبية / آلام صدرية حادة">أزمة قلبية / آلام صدرية حادة</option>
                      <option value="ضيق تنفس حاد / اختناق">ضيق تنفس حاد / اختناق</option>
                      <option value="حادث سير / نزيف وتجميع إصابات">حادث سير / نزيف وتجميع إصابات</option>
                      <option value="غيبوبة / هبوط حاد بالمؤشرات">غيبوبة / هبوط حاد بالمؤشرات</option>
                      <option value="طوارئ جراحية عامة">طوارئ جراحية عامة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">غرفة الإسعاف المستهدفة</label>
                    <select
                      value={selectedRoomId}
                      onChange={(e) => setSelectedRoomId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-rose-500 cursor-pointer"
                    >
                      {erRooms.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.status === 'available' ? 'متاحة' : r.status === 'occupied' ? 'مشغولة' : 'قيد التجهيز'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Siren className="w-4 h-4" />
                    <span>إطلاق إشعار الطوارئ للقسم السريري</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 4. ER ROOMS AVAILABILITY GRID */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-sky-400" />
                <span>جاهزية غرف الإسعاف والإنعاش ({erRooms.filter(r => r.status === 'available').length} متاح حالياً)</span>
              </h3>
              <span className="text-[11px] text-slate-400">تحديث فوري مع أجنحة المشفى</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {erRooms.map((room) => {
                const isAvailable = room.status === 'available';
                const isOccupied = room.status === 'occupied';
                
                return (
                  <div 
                    key={room.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isAvailable 
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' 
                        : isOccupied 
                        ? 'bg-rose-950/20 border-rose-500/30 text-rose-200' 
                        : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-white">{room.name}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                        isAvailable 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                          : isOccupied 
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {isAvailable ? '🟢 متاحة ومجهزة' : isOccupied ? '🔴 مشغولة بحالة' : '🟡 قيد التجهيز'}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-300 mb-3">
                      {isOccupied && room.assignedPatient && (
                        <p className="flex items-center gap-1 text-rose-300 font-semibold">
                          <User className="w-3.5 h-3.5" />
                          <span>المريض: {room.assignedPatient}</span>
                        </p>
                      )}
                      <p className="text-slate-400 text-[10px]">المعدات: {room.equipment.join(' • ')}</p>
                    </div>

                    {/* Quick Action Button for Doctors / Admin / Staff */}
                    {(userRole === 'admin' || userRole === 'doctor' || userRole === 'staff') && (
                      <div className="flex items-center gap-2 text-[10px]">
                        {isAvailable && (
                          <button
                            onClick={() => handleToggleRoomStatus(room.id, 'occupied')}
                            className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-bold transition-all cursor-pointer"
                          >
                            تحديد كـ مشغولة
                          </button>
                        )}
                        {!isAvailable && (
                          <button
                            onClick={() => handleToggleRoomStatus(room.id, 'available')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-bold transition-all cursor-pointer"
                          >
                            تحديد كـ جاهزة ومتاحة
                          </button>
                        )}
                        {room.status !== 'preparing' && (
                          <button
                            onClick={() => handleToggleRoomStatus(room.id, 'preparing')}
                            className="px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 font-bold transition-all cursor-pointer"
                          >
                            تجهيز وتعقيم
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. QUICK ON-CALL DOCTORS LIST */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-400" />
              <span>أطباء المناوبة السريرية المتاحون حالياً بالمركز</span>
            </h4>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {doctors.filter(d => d.status === 'active').map(doc => (
                <div key={doc.id} className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="font-bold">{doc.name}</span>
                  <span className="text-slate-400">({doc.specialty})</span>
                  <a href={`tel:${doc.phone}`} className="text-sky-400 font-mono text-[10px] hover:underline flex items-center gap-1" dir="ltr">
                    <PhoneCall className="w-3 h-3 text-emerald-400" />
                    {doc.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 6. CONFIRMATION DIALOG MODAL OVERLAY (To prevent accidental clicks) */}
        {showConfirmDialog && pendingPayload && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl space-y-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">تأكيد إطلاق نداء الاستغاثة الطبي</h3>
                <p className="text-xs text-rose-200 font-bold mt-1">
                  (Code Blue / SOS Alert)
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-right text-xs space-y-1.5 text-slate-300">
                <p className="flex justify-between">
                  <span className="text-slate-400">الموقع المستهدف:</span>
                  <strong className="text-white font-bold">{pendingPayload.roomLocation}</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">المريض:</span>
                  <strong className="text-white">{pendingPayload.patientName}</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">الحالة:</span>
                  <strong className="text-rose-400">{pendingPayload.condition}</strong>
                </p>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                هل أنت متأكد؟ هذا الإجراء سيقوم بتشغيل أجهزة الإنذار لدى كافة الأطباء والممرضين المناوبين وتوجيه فريق التدخل السريع فوراً.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmSOS}
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/40 flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-105"
                >
                  <Siren className="w-4 h-4 text-white" />
                  <span>نعم، إطلاق النداء الآن</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelSOSConfirm}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  تراجع / إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
