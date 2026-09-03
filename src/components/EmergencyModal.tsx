import React, { useState } from 'react';
import { UserRole, Doctor, Patient } from '../types';
import { 
  Siren, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  BedDouble, 
  Activity, 
  User, 
  Stethoscope, 
  PhoneCall, 
  ShieldAlert,
  Send
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
    { id: 'er-1', name: 'غرفة طوارئ 1 (إنعاش جراحي)', status: 'available', equipment: ['جهاز صدمات قلب', 'مراقبة علامات حيوية'] },
    { id: 'er-2', name: 'غرفة طوارئ 2 (قلبية وحرجة)', status: 'occupied', assignedPatient: 'خالد السعيد', assignedDoctor: 'د. أحمد الخطيب', equipment: ['تخطيط قلب سريع', 'مضخة إنفزيون'] },
    { id: 'er-3', name: 'غرفة طوارئ 3 (إصابات وباطنية)', status: 'available', equipment: ['أكسجين مركز', 'معدات تخثير سريعة'] },
    { id: 'er-4', name: 'غرفة طوارئ 4 (عناية سريعة)', status: 'preparing', equipment: ['تعقيم وتجهيز دوري'] },
  ]);

  const [selectedPatientName, setSelectedPatientName] = useState(
    patients.length > 0 ? patients[0].fullName : 'مريض طوارئ خفوري'
  );
  const [selectedCondition, setSelectedCondition] = useState('أزمة قلبية / آلام صدرية');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('غرفة 304 (الجناح الثاني)');
  const [selectedRoomId, setSelectedRoomId] = useState('er-1');

  if (!isOpen) return null;

  const handleSendSOS = (e: React.FormEvent) => {
    e.preventDefault();
    const targetRoom = erRooms.find(r => r.id === selectedRoomId) || erRooms[0];
    const roomLocation = userRole === 'patient' ? selectedRoomNumber : targetRoom.name;
    
    // Trigger the SOS alert with Room Number prominently
    onTriggerSOS(selectedPatientName, selectedCondition, roomLocation);

    // Update room status to occupied
    setErRooms(prev => prev.map(r => r.id === targetRoom.id ? { ...r, status: 'occupied', assignedPatient: `${selectedPatientName} (${roomLocation})` } : r));
    
    onShowToast(`🚨 تم إشعار الطوارئ فوراً لاستجابة الكادر الطبي للغرفة: ${roomLocation}`, 'error');
  };

  const handleToggleRoomStatus = (roomId: string, newStatus: 'available' | 'occupied' | 'preparing') => {
    setErRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus, assignedPatient: newStatus === 'available' ? undefined : r.assignedPatient } : r));
    onShowToast('تم تحديث حالة غرفة الطوارئ بنجاح', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-2 border-rose-600/60 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="p-5 bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 border-b border-rose-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 animate-pulse">
              <Siren className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>نظام استجابة الطوارئ والغرف الإسعافية</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black tracking-wider">
                  Code Red SOS
                </span>
              </h2>
              <p className="text-xs text-slate-400">إرسال نداءات استغاثة فورية وتتبع جاهزية الأسرة وغرف الطوارئ</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-right">
          
          {/* Active SOS Banner if active */}
          {activeSOS && (
            <div className="p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-rose-400 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm text-rose-200 flex items-center gap-2">
                    <span>🚨 نداء طوارئ عاجل من:</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-rose-600 text-white font-black text-xs shadow">
                      {activeSOS.roomName}
                    </span>
                  </h3>
                  <p className="text-xs text-rose-100 font-semibold mt-1">
                    الحالة الطارئة: <span className="underline">{activeSOS.condition}</span> | المريض صاحب النداء: <span className="underline">{activeSOS.patientName}</span>
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد الوصول والاستجابة للغرفة</span>
                </button>
              )}
            </div>
          )}

          {/* SOS Trigger Form */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Send className="w-4 h-4 text-rose-400" />
              <span>
                {userRole === 'patient' 
                  ? 'طلب استغاثة عاجل وتحديد رقم الغرفة/السرير' 
                  : 'إرسال إشعار طوارئ وتخصيص غرفة إسعاف'}
              </span>
            </h3>

            {userRole === 'patient' ? (
              <form onSubmit={handleSendSOS} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">رقم الغرفة / السرير الحالي</label>
                    <select
                      value={selectedRoomNumber}
                      onChange={(e) => setSelectedRoomNumber(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 font-bold focus:outline-none focus:border-rose-500"
                    >
                      <option value="غرفة 304 - (الجناح الثاني)">غرفة 304 - (الجناح الثاني)</option>
                      <option value="غرفة 201 - (جناح النقاهة)">غرفة 201 - (جناح النقاهة)</option>
                      <option value="غرفة 105 - (العناية المتوسطة)">غرفة 105 - (العناية المتوسطة)</option>
                      <option value="غرفة 412 - (الطابق الرابع)">غرفة 412 - (الطابق الرابع)</option>
                      <option value="قسم العيادات الخارجية - سرير 3">قسم العيادات الخارجية - سرير 3</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">نوع الأعراض / الحالة الطارئة</label>
                    <select
                      value={selectedCondition}
                      onChange={(e) => setSelectedCondition(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                    >
                      <option value="أزمة قلبية / آلام صدرية حادة">أزمة قلبية / آلام صدرية حادة</option>
                      <option value="ضيق تنفس حاد / اختناق">ضيق تنفس حاد / اختناق</option>
                      <option value="نزيف / إصابة طارئة">نزيف / إصابة طارئة</option>
                      <option value="إغماء / هبوط حاد بالمؤشرات">إغماء / هبوط حاد بالمؤشرات</option>
                      <option value="طوارئ أخرى مستعجلة">طوارئ أخرى مستعجلة</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200 text-xs">
                  <span>المريض صاحب الطلب: <strong className="text-white">سامر المحمود (ملف: P-1001)</strong></span>
                  
                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/50 flex items-center gap-2 transition-all cursor-pointer animate-pulse shrink-0"
                  >
                    <Siren className="w-4 h-4 text-white" />
                    <span>إرسال استغاثة فورية للغرفة 🚨</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSendSOS} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">اسم المريض المعني</label>
                  <select
                    value={selectedPatientName}
                    onChange={(e) => setSelectedPatientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="أزمة قلبية / آلام صدرية">أزمة قلبية / آلام صدرية</option>
                    <option value="ضيق تنفس حاد / اختناق">ضيق تنفس حاد / اختناق</option>
                    <option value="حادث سير / نزيف وتجميع إصابات">حادث سير / نزيف وتجميع إصابات</option>
                    <option value="غيبوبة / هبوط حاد بالمؤشرات">غيبوبة / هبوط حاد بالمؤشرات</option>
                    <option value="طوارئ جراحية عامة">طوارئ جراحية عامة</option>
                  </select>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Siren className="w-4 h-4 animate-bounce" />
                    <span>إطلاق إشعار الطوارئ 🚨</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ER Rooms Availability Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-sky-400" />
                <span>جاهزية غرف الإسعاف والطوارئ ({erRooms.filter(r => r.status === 'available').length} متاحة)</span>
              </h3>
              <span className="text-[11px] text-slate-400">تحديث تلقائي مستمر</span>
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
                            تعديل لـ مشغولة
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

          {/* Quick On-Call Doctors list */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-400" />
              <span>أطباء المناوبة والإسعاف المتاحين فوراً</span>
            </h4>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {doctors.filter(d => d.status === 'active').map(doc => (
                <div key={doc.id} className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="font-bold">{doc.name}</span>
                  <span className="text-slate-400">({doc.specialty})</span>
                  <span className="text-sky-400 font-mono text-[10px]">{doc.phone}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
