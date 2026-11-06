import React, { useState } from 'react';
import { Appointment, Patient, Doctor, UserRole } from '../types';
import { validateAppointmentForm } from '../utils/validation';
import { formatArabicDate, formatArabicTime, formatAppointmentsCount, formatArabicPlural } from '../utils/arabicFormatters';
import { 
  Calendar, 
  Clock, 
  Search, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  User, 
  Stethoscope, 
  X,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  BellRing,
  CalendarDays,
  CalendarCheck,
  Sparkles,
  Zap,
  CheckCheck
} from 'lucide-react';
import { 
  suggestSmartAvailableSlots, 
  checkAppointmentCollision, 
  SmartSlotSuggestion 
} from '../utils/smartBooking';

interface AppointmentsSectionProps {
  userRole?: UserRole;
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
  onAddAppointment: (apt: Partial<Appointment>) => void;
  onUpdateStatus: (id: string, status: Appointment['status']) => void;
  onRescheduleAppointment?: (id: string, newDate: string, newTime: string) => void;
  onDeleteAppointment?: (id: string) => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  searchQuery?: string;
}

export const AppointmentsSection: React.FC<AppointmentsSectionProps> = ({
  userRole = 'admin',
  appointments,
  patients,
  doctors,
  onAddAppointment,
  onUpdateStatus,
  onRescheduleAppointment,
  onDeleteAppointment,
  onShowToast,
  searchQuery,
}) => {
  const canManageStatus = userRole === 'admin' || userRole === 'staff' || userRole === 'doctor';
  const canDeleteApt = userRole === 'admin' || userRole === 'staff' || userRole === 'doctor';
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Form state & Validation
  const [formData, setFormData] = useState({
    patientName: '',
    doctorName: '',
    date: new Date().toISOString().split('T')[0],
    time: '11:00',
    type: 'كشف' as Appointment['type'],
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fieldWarnings, setFieldWarnings] = useState<Record<string, string>>({});

  const [timelineScope, setTimelineScope] = useState<'upcoming' | 'past' | 'all'>(userRole === 'patient' ? 'upcoming' : 'all');
  const todayStr = new Date().toISOString().split('T')[0];

  // Reschedule and Reminder states
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTime, setRescheduleTime] = useState<string>('10:00');
  const [remindedAptIds, setRemindedAptIds] = useState<string[]>([]);

  // Smart Booking Engine States
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSlotSuggestion[]>([]);
  const [smartSelectedNotice, setSmartSelectedNotice] = useState<string | null>(null);
  const [rescheduleSuggestions, setRescheduleSuggestions] = useState<SmartSlotSuggestion[]>([]);

  // Real-time live collision detection for new booking form
  const liveCollision = checkAppointmentCollision({
    doctorName: formData.doctorName,
    patientName: formData.patientName,
    date: formData.date,
    time: formData.time,
    existingAppointments: appointments,
    doctors,
  });

  // Real-time live collision detection for reschedule modal
  const rescheduleCollision = rescheduleApt ? checkAppointmentCollision({
    doctorName: rescheduleApt.doctorName,
    patientName: rescheduleApt.patientName,
    date: rescheduleDate,
    time: rescheduleTime,
    existingAppointments: appointments,
    doctors,
    excludeAppointmentId: rescheduleApt.id,
  }) : { hasConflict: false };

  const handleGenerateSmartSuggestions = (docName?: string, dateStr?: string) => {
    const slots = suggestSmartAvailableSlots({
      doctorName: docName || formData.doctorName,
      patientName: formData.patientName,
      startDate: dateStr || formData.date,
      appointments,
      doctors,
      maxSuggestions: 3,
    });
    setSmartSuggestions(slots);
  };

  const handleApplySmartSlot = (slot: SmartSlotSuggestion) => {
    setFormData(prev => ({
      ...prev,
      date: slot.date,
      time: slot.time,
      doctorName: slot.doctorName,
    }));
    setBookingError(null);
    setFieldErrors({});
    setSmartSelectedNotice(`تم اختيار (${slot.doctorName}) في موعد شاغر مؤكد: ${slot.date} الساعة ${slot.time}`);
  };

  const handleOpenSmartBooking = () => {
    setShowAddModal(true);
    setBookingError(null);
    setFieldErrors({});
    setSmartSelectedNotice(null);
    // Pre-calculate nearest slots
    const slots = suggestSmartAvailableSlots({
      doctorName: formData.doctorName,
      patientName: formData.patientName,
      startDate: todayStr,
      appointments,
      doctors,
      maxSuggestions: 3,
    });
    setSmartSuggestions(slots);
  };

  const handleOpenReschedule = (apt: Appointment) => {
    setRescheduleApt(apt);
    const initialDate = apt.date >= todayStr ? apt.date : todayStr;
    setRescheduleDate(initialDate);
    setRescheduleTime(apt.time || '10:00');
    // Compute alternative slots for this doctor
    const slots = suggestSmartAvailableSlots({
      doctorId: apt.doctorId,
      doctorName: apt.doctorName,
      patientId: apt.patientId,
      patientName: apt.patientName,
      startDate: initialDate,
      appointments,
      doctors,
      maxSuggestions: 3,
    });
    setRescheduleSuggestions(slots);
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleApt) return;
    if (onRescheduleAppointment) {
      onRescheduleAppointment(rescheduleApt.id, rescheduleDate, rescheduleTime);
    } else {
      onUpdateStatus(rescheduleApt.id, 'مؤكد');
    }
    if (onShowToast) {
      onShowToast(`تمت إعادة جدولة موعد ${rescheduleApt.patientName} بنجاح إلى ${formatArabicDate(rescheduleDate)} الساعة ${formatArabicTime(rescheduleTime)}`, 'success');
    }
    setRescheduleApt(null);
  };

  const handleSendReminder = (apt: Appointment) => {
    setRemindedAptIds(prev => [...prev, apt.id]);
    if (onShowToast) {
      onShowToast(`تم إرسال تذكير الموعد بنجاح للمريض (${apt.patientName}) عبر البريد وSMS: موعدك يوم ${formatArabicDate(apt.date)} الساعة ${formatArabicTime(apt.time)} مع ${apt.doctorName}`, 'success');
    }
  };

  const isUpcomingAppointment = (apt: Appointment) => {
    return apt.date >= todayStr && apt.status !== 'ملغى' && apt.status !== 'مكتمل' && apt.status !== 'منتهي';
  };

  const isPastAppointment = (apt: Appointment) => {
    return apt.date < todayStr || apt.status === 'مكتمل' || apt.status === 'منتهي' || apt.status === 'لم يحضر' || apt.status === 'ملغى';
  };

  const roleBaseAppointments = appointments.filter((apt) => {
    if (userRole === 'patient') {
      return apt.patientName === 'محمد عبد الله العتيبي' || apt.patientName.includes('محمد') || apt.patientId === 'pat-1';
    }
    if (userRole === 'doctor') {
      return apt.doctorName.includes('سارة') || apt.doctorName.includes('طبيب') || apt.doctorId === 'doc-1';
    }
    return true;
  });

  const upcomingCount = roleBaseAppointments.filter(isUpcomingAppointment).length;
  const pastCount = roleBaseAppointments.filter(isPastAppointment).length;

  // Filter appointments
  const filteredAppointments = roleBaseAppointments.filter((apt) => {
    if (timelineScope === 'upcoming' && !isUpcomingAppointment(apt)) return false;
    if (timelineScope === 'past' && !isPastAppointment(apt)) return false;

    const query = (searchQuery || '').toLowerCase().trim();
    const matchesSearch = 
      !query ||
      apt.doctorName.toLowerCase().includes(query) ||
      apt.specialty.toLowerCase().includes(query) ||
      apt.patientName.toLowerCase().includes(query);

    const matchesStatus = selectedStatus === 'all' || apt.status === selectedStatus;
    const matchesType = selectedType === 'all' || apt.type === selectedType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const selectedPatientData = patients.find(p => p.fullName.trim().toLowerCase() === formData.patientName.trim().toLowerCase());

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    setFieldErrors({});
    setFieldWarnings({});

    const initialPatientName = formData.patientName.trim() || 'مريض مراجع';
    const finalDoctorName = formData.doctorName.trim() || 'د. طبيب ممارس';

    const validation = validateAppointmentForm(
      {
        patientName: initialPatientName,
        doctorName: finalDoctorName,
        date: formData.date,
        time: formData.time,
        type: formData.type,
      },
      appointments
    );

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      if (validation.warnings) setFieldWarnings(validation.warnings);
      setBookingError(Object.values(validation.errors)[0]);
      return;
    }

    const matchedPatient = patients.find(p => p.fullName === initialPatientName);
    const finalPatientName = initialPatientName;
    const finalPatientId = matchedPatient ? matchedPatient.id : ('p-' + Date.now());

    const matchedDoctor = doctors.find(d => d.name === formData.doctorName);
    const finalDoctorId = matchedDoctor ? matchedDoctor.id : ('d-' + Date.now());
    const finalSpecialty = matchedDoctor ? matchedDoctor.specialty : 'طب عام';
    const finalFee = matchedDoctor ? matchedDoctor.consultingFee : 25000;

    onAddAppointment({
      patientId: finalPatientId,
      patientName: finalPatientName,
      doctorId: finalDoctorId,
      doctorName: finalDoctorName,
      specialty: finalSpecialty,
      date: formData.date,
      time: formData.time,
      type: formData.type,
      fee: finalFee,
    });

    // Reset form
    setFormData({
      patientName: '',
      doctorName: '',
      date: new Date().toISOString().split('T')[0],
      time: '11:00',
      type: 'كشف',
    });
    setBookingError(null);
    setFieldErrors({});
    setFieldWarnings({});
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">جدول المواعيد والحجوزات الطبية</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            متابعة مواعيد الكشوفات، الاستشارات، المتابعات السريرية، ومنع تضارب الجداول
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenSmartBooking}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            title="الحجز الذكي: فحص الشواغر تلقائياً ومنع تضارب المواعيد"
          >
            <CalendarCheck className="w-4 h-4 text-white" />
            <span>الحجز الذكي (اقتراح أقرب شاغر)</span>
          </button>

          <button
            onClick={() => {
              setShowAddModal(true);
              setSmartSelectedNotice(null);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>حجز موعد يدوي</span>
          </button>
        </div>
      </div>

      {/* KPI Stats & Scope Switcher Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setTimelineScope('upcoming')}
          className={`p-4 rounded-2xl border text-start transition-all cursor-pointer ${
            timelineScope === 'upcoming'
              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-bold mb-1">
            <span>المواعيد القادمة والنشطة</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{formatAppointmentsCount(upcomingCount, true)}</div>
          <div className="text-[11px] text-sky-700 dark:text-sky-400 font-semibold mt-1">المواعيد السارية من اليوم فصاعداً</div>
        </button>

        <button
          type="button"
          onClick={() => setTimelineScope('past')}
          className={`p-4 rounded-2xl border text-start transition-all cursor-pointer ${
            timelineScope === 'past'
              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-bold mb-1">
            <span>سجل المواعيد السابقة والمنتهية</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatArabicPlural(pastCount, {
              zero: 'لا توجد مواعيد سابقة',
              one: 'موعد سابق واحد',
              two: 'موعدان سابقان',
              few: 'مواعيد سابقة',
              many: 'موعداً سابقاً'
            })}
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-1">مواعيد سابقة مكتملة أو منتهية</div>
        </button>

        <button
          type="button"
          onClick={() => setTimelineScope('all')}
          className={`p-4 rounded-2xl border text-start transition-all cursor-pointer ${
            timelineScope === 'all'
              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-bold mb-1">
            <span>إجمالي المواعيد بالسجل</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{formatAppointmentsCount(roleBaseAppointments.length)}</div>
          <div className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold mt-1">الأرشيف والمستقبل معاً</div>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
        >
          <option value="all">كافة الحالات (مؤكد، معلق، مكتمل، منتهي، ملغى)</option>
          <option value="مؤكد">المواعيد المؤكدة</option>
          <option value="معلق">المواعيد المعلقة</option>
          <option value="مكتمل">المواعيد المكتملة</option>
          <option value="منتهي">المواعيد المنتهية</option>
          <option value="لم يحضر">حالات لم يحضر</option>
          <option value="ملغى">المواعيد الملغاة</option>
        </select>

        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
        >
          <option value="all">كافة أنواع المواعيد والعيادات الخارجية</option>
          <option value="كشف عيادة خارجية">كشف عيادة خارجية</option>
          <option value="استشارة متخصصة">استشارة متخصصة</option>
          <option value="متابعة دورية">متابعة دورية</option>
          <option value="فحص وقائي">فحص وقائي شامل</option>
          <option value="كشف أسنان">كشف طب وجراحة الأسنان</option>
          <option value="عملية جراحية">إجراء وعملية جراحية</option>
          <option value="طوارئ عاجلة">طوارئ وإسعاف عاجل</option>
          <option value="كشف">كشف عادي</option>
          <option value="استشارة">استشارة</option>
          <option value="متابعة">متابعة</option>
          <option value="طوارئ">طوارئ</option>
        </select>
      </div>

      {/* Appointments Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs text-slate-300">
            <thead className="bg-slate-800 text-slate-400 font-bold border-b border-slate-700 whitespace-nowrap">
              <tr>
                {userRole !== 'patient' && <th className="p-4">المريض المراجع</th>}
                <th className="p-4">الطبيب المعالج</th>
                <th className="p-4">التخصص والعيادة</th>
                <th className="p-4">تاريخ ووقت الحجز</th>
                <th className="p-4">نوع الزيارة</th>
                <th className="p-4">رسوم الكشف</th>
                <th className="p-4">حالة الموعد</th>
                <th className="p-4 text-center">الإجراءات المتاحة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={userRole === 'patient' ? 7 : 8} className="p-12 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-xs">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-100">
                        لا توجد مواعيد نشطة حالياً، جميع الجداول منظمة
                      </p>
                      <p className="text-xs text-slate-400">لا توجد حجوزات معلقة أو تتطلب تدخلاً في الوقت الحالي</p>
                      <button
                        onClick={handleOpenSmartBooking}
                        className="mt-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>حجز موعد جديد</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
                  <tr 
                    key={apt.id}
                    className="hover:bg-slate-800/60 transition-colors"
                  >
                    {userRole !== 'patient' && (
                      <td className="p-4 font-bold text-white whitespace-nowrap">
                        {apt.patientName}
                      </td>
                    )}

                    <td className="p-4 text-slate-200 font-medium whitespace-nowrap">
                      {apt.doctorName}
                    </td>

                    <td className="p-4 text-slate-400 whitespace-nowrap">
                      {apt.specialty}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{formatArabicDate(apt.date)}</div>
                      <div className="text-xs text-sky-400 font-mono flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{formatArabicTime(apt.time)}</span>
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md font-bold text-[11px] whitespace-nowrap inline-block ${
                        apt.type === 'طوارئ' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        apt.type === 'استشارة' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {apt.type}
                      </span>
                    </td>

                    <td className="p-4 font-bold text-emerald-400 font-mono whitespace-nowrap">
                      {apt.fee ? Number(apt.fee).toLocaleString('en-US') : '25,000'} ل.س
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap inline-block ${
                          apt.status === 'مؤكد' && apt.date >= todayStr
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : apt.status === 'مكتمل'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : apt.status === 'معلق' && apt.date >= todayStr
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : apt.status === 'منتهي' || apt.date < todayStr
                                  ? 'bg-slate-700/50 text-slate-400 border border-slate-600'
                                  : apt.status === 'لم يحضر'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {apt.date < todayStr && (apt.status === 'مؤكد' || apt.status === 'معلق') ? 'منتهي (سابق)' : apt.status}
                        </span>
                        {apt.date < todayStr ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            سابق
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-400 border border-sky-800">
                            قادم
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* 1. Reschedule Action */}
                        <button
                          type="button"
                          onClick={() => handleOpenReschedule(apt)}
                          className="px-2 py-1 rounded-md bg-sky-600/20 text-sky-300 hover:bg-sky-600 hover:text-white border border-sky-500/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="إعادة جدولة الموعد"
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                          <span>إعادة جدولة</span>
                        </button>

                        {/* 2. Send Reminder Action */}
                        <button
                          type="button"
                          onClick={() => handleSendReminder(apt)}
                          className={`px-2 py-1 rounded-md border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            remindedAptIds.includes(apt.id)
                              ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                              : 'bg-amber-600/20 text-amber-300 hover:bg-amber-600 hover:text-white border border-amber-500/30'
                          }`}
                          title="إرسال تذكير فوري بالموعد للمريض عبر البريد وSMS"
                        >
                          <BellRing className="w-3.5 h-3.5" />
                          <span>{remindedAptIds.includes(apt.id) ? 'تم التذكير ✓' : 'تذكير'}</span>
                        </button>

                        {/* 3. Confirm Action (if pending and allowed) */}
                        {canManageStatus && apt.status === 'معلق' && apt.date >= todayStr && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(apt.id, 'مؤكد')}
                            className="px-2 py-1 rounded-md bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                            title="تأكيد الموعد"
                          >
                            تأكيد
                          </button>
                        )}

                        {/* 4. Complete Action (for staff) */}
                        {canManageStatus && apt.status !== 'مكتمل' && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(apt.id, 'مكتمل')}
                            className="px-2 py-1 rounded-md bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                            title="تحديد كمكتمل"
                          >
                            إكمال
                          </button>
                        )}

                        {/* 5. Cancel Action */}
                        {apt.status !== 'ملغى' && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(apt.id, 'ملغى')}
                            className="px-2 py-1 rounded-md bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                            title="إلغاء الموعد"
                          >
                            إلغاء
                          </button>
                        )}

                        {/* 6. Delete Action (for admin/staff) */}
                        {canDeleteApt && onDeleteAppointment && (
                          <button
                            type="button"
                            onClick={() => onDeleteAppointment(apt.id)}
                            className="p-1 rounded-md bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
                            title="حذف الموعد نهائياً"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Appointment Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAddModal(false); setBookingError(null); } }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto text-right text-slate-900 dark:text-slate-100">
            
            {/* Dedicated Modal Header (Always Visible & Never Cut Off) */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-950">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <span>حجز موعد طبي جديد</span>
              </h3>
              <button 
                type="button"
                onClick={() => { setShowAddModal(false); setBookingError(null); }} 
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="إغلاق النافذة"
                aria-label="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {bookingError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-500/80 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 shadow-xs">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-semibold">{bookingError}</span>
                </div>
              )}

              <form id="new-appointment-form" onSubmit={handleSubmitNew} className="space-y-4 text-xs">
                
                {/* Patient Selector & Medical Safety Info */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">اسم المريض المراجع *</label>
                  <input
                    type="text"
                    required
                    list="patients-list"
                    placeholder="اكتب اسم المريض أو اختر من القائمة..."
                    value={formData.patientName}
                    onChange={(e) => {
                      setFormData({ ...formData, patientName: e.target.value });
                      if (fieldErrors.patientName) setFieldErrors({ ...fieldErrors, patientName: '' });
                    }}
                    className={`w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                      fieldErrors.patientName ? 'border-rose-500 bg-rose-500/5' : 'border-slate-300 dark:border-slate-700'
                    } text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 font-medium`}
                  />
                  <datalist id="patients-list">
                    {patients.map((p) => (
                      <option key={p.id} value={p.fullName}>
                        {p.fileNumber} - فصيلة: {p.bloodType}
                      </option>
                    ))}
                  </datalist>
                  {fieldErrors.patientName && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 block font-medium">{fieldErrors.patientName}</span>
                  )}

                  {/* Patient Safety Preview Alert */}
                  {selectedPatientData && (
                    <div className="mt-2 p-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 dark:text-slate-400">الملف: <strong className="text-slate-900 dark:text-white font-mono">{selectedPatientData.fileNumber}</strong></span>
                        <span className="text-slate-600 dark:text-slate-400">فصيلة الدم: <strong className="text-sky-600 dark:text-sky-400 font-bold">{selectedPatientData.bloodType}</strong></span>
                      </div>
                      {selectedPatientData.activeAllergies && selectedPatientData.activeAllergies.length > 0 && selectedPatientData.activeAllergies[0] !== 'لا يوجد حساسية معروفة' ? (
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-500/30">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>حساسية: {selectedPatientData.activeAllergies.join(', ')}</span>
                        </div>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">لا توجد تحذيرات حساسية</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">اسم الطبيب المعالج *</label>
                  <input
                    type="text"
                    required
                    list="doctors-list"
                    placeholder="اكتب اسم الطبيب أو اختر من القائمة..."
                    value={formData.doctorName}
                    onChange={(e) => {
                      setFormData({ ...formData, doctorName: e.target.value });
                      if (fieldErrors.doctorName) setFieldErrors({ ...fieldErrors, doctorName: '' });
                    }}
                    className={`w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                      fieldErrors.doctorName ? 'border-rose-500 bg-rose-500/5' : 'border-slate-300 dark:border-slate-700'
                    } text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 font-medium`}
                  />
                  <datalist id="doctors-list">
                    {doctors.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.specialty} ({d.consultingFee.toLocaleString()} ل.س)
                      </option>
                    ))}
                  </datalist>
                  {fieldErrors.doctorName && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 block font-medium">{fieldErrors.doctorName}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">تاريخ الحجز *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => {
                        setFormData({ ...formData, date: e.target.value });
                        if (fieldErrors.date) setFieldErrors({ ...fieldErrors, date: '' });
                      }}
                      className={`w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                        fieldErrors.date ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                      } text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 font-mono`}
                    />
                    {fieldErrors.date && (
                      <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 block font-medium">{fieldErrors.date}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">وقت الحجز *</label>
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) => {
                        setFormData({ ...formData, time: e.target.value });
                        if (fieldErrors.time) setFieldErrors({ ...fieldErrors, time: '' });
                      }}
                      className={`w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                        fieldErrors.time ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                      } text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 font-mono`}
                    />
                    {fieldErrors.time && (
                      <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 block font-medium">{fieldErrors.time}</span>
                    )}
                  </div>
                </div>

                {/* SMART SCHEDULING & COLLISION PREVENTION ENGINE */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-sky-300 dark:border-sky-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>محرك الحجز الذكي ومنع التضارب</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGenerateSmartSuggestions()}
                      className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 dark:bg-sky-600/30 dark:hover:bg-sky-600 text-sky-800 dark:text-sky-300 hover:text-sky-900 dark:hover:text-white border border-sky-300 dark:border-sky-500/40 font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>اقتراح أقرب وقت متاح</span>
                    </button>
                  </div>

                  {/* Live Collision Warning Banner if conflict detected */}
                  {liveCollision.hasConflict && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 text-[11px] flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold block">تنبيه تضارب في المواعيد:</span>
                        <p className="mt-0.5">{liveCollision.message}</p>
                      </div>
                    </div>
                  )}

                  {/* Selected Slot Confirmation Badge */}
                  {smartSelectedNotice && !liveCollision.hasConflict && (
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-1.5">
                      <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-medium">{smartSelectedNotice}</span>
                    </div>
                  )}

                  {/* Suggestions Quick-Pick Chips */}
                  {smartSuggestions.length > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1.5 font-bold">
                        الأوقات الشاغرة المقترحة تلقائياً (بدون تضارب):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                        {smartSuggestions.map((slot, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleApplySmartSlot(slot)}
                            className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-950/60 border border-slate-200 dark:border-slate-700 hover:border-sky-400 text-right transition-all group cursor-pointer shadow-xs"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-sky-700 dark:text-sky-300 font-mono">{slot.time}</span>
                              <span className="text-[9px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-500/20 font-bold">
                                شاغر
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-800 dark:text-slate-300 truncate mt-0.5 font-bold">
                              {slot.doctorName}
                            </div>
                            <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                              {slot.reason}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">نوع الموعد *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="كشف عيادة خارجية">كشف عيادة خارجية (معاينة أولية)</option>
                    <option value="استشارة متخصصة">استشارة طبية متخصصة</option>
                    <option value="متابعة دورية">متابعة وفحص دوري</option>
                    <option value="فحص وقائي">فحص وقائي شامل</option>
                    <option value="كشف أسنان">كشف طب وجراحة الأسنان</option>
                    <option value="عملية جراحية">إجراء / عملية جراحية صغرى أو كبرى</option>
                    <option value="طوارئ عاجلة">طوارئ وإسعاف عاجل</option>
                  </select>
                </div>

              </form>
            </div>

            {/* Dedicated Modal Footer (Always Visible at bottom) */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setBookingError(null); }}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold cursor-pointer transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="new-appointment-form"
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-xs cursor-pointer transition-colors"
              >
                تأكيد وتثبيت الحجز
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleApt && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in" 
          dir="rtl"
          onClick={(e) => { if (e.target === e.currentTarget) setRescheduleApt(null); }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto text-right text-slate-900 dark:text-slate-100">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">إعادة جدولة الموعد الطبي</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">تعديل التاريخ وتوقيت الحضور</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleApt(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                title="إغلاق النافذة"
                aria-label="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
                <p>المريض: <strong className="text-slate-900 dark:text-white font-bold">{rescheduleApt.patientName}</strong></p>
                <p>الطبيب: <strong className="text-slate-900 dark:text-white font-bold">{rescheduleApt.doctorName}</strong> ({rescheduleApt.specialty})</p>
                <p className="text-slate-500 dark:text-slate-400">الموعد الحالي: {formatArabicDate(rescheduleApt.date)} - {formatArabicTime(rescheduleApt.time)}</p>
              </div>

              <form id="reschedule-form" onSubmit={handleConfirmReschedule} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">التاريخ الجديد *</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">التوقيت الجديد المتاح *</label>
                  <select
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="09:00">09:00 صباحاً</option>
                    <option value="09:30">09:30 صباحاً</option>
                    <option value="10:00">10:00 صباحاً</option>
                    <option value="10:30">10:30 صباحاً</option>
                    <option value="11:00">11:00 صباحاً</option>
                    <option value="11:30">11:30 صباحاً</option>
                    <option value="12:00">12:00 ظهراً</option>
                    <option value="13:00">01:00 ظهراً</option>
                    <option value="14:00">02:00 ظهراً</option>
                    <option value="15:30">03:30 عصراً</option>
                    <option value="17:00">05:00 مساءً</option>
                    <option value="18:30">06:30 مساءً</option>
                  </select>
                </div>

                {/* Reschedule Collision Warning */}
                {rescheduleCollision.hasConflict && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 text-[11px] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">تعارض في الموعد المختار:</span>
                      <p className="mt-0.5">{rescheduleCollision.message}</p>
                    </div>
                  </div>
                )}

                {/* Alternative Smart Slots Quick Pick */}
                {rescheduleSuggestions.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-sky-300 dark:border-sky-500/30 space-y-2">
                    <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400 font-bold text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>أوقات بديلة مقترحة شاغرة للطبيب:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      {rescheduleSuggestions.map((slot, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setRescheduleDate(slot.date);
                            setRescheduleTime(slot.time);
                          }}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-950/70 border border-slate-200 dark:border-slate-700 hover:border-sky-400 text-right transition-all cursor-pointer shadow-xs"
                        >
                          <div className="font-bold text-sky-700 dark:text-sky-300 text-[11px]">{slot.time}</div>
                          <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{slot.reason}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Sticky Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setRescheduleApt(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="reschedule-form"
                className="py-2.5 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>تثبيت الموعد الجديد</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
