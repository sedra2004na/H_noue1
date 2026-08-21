import React, { useState } from 'react';
import { Appointment, Patient, Doctor, UserRole } from '../types';
import { validateAppointmentForm } from '../utils/validation';
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
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';

interface AppointmentsSectionProps {
  userRole?: UserRole;
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
  onAddAppointment: (apt: Partial<Appointment>) => void;
  onUpdateStatus: (id: string, status: Appointment['status']) => void;
  onDeleteAppointment?: (id: string) => void;
  searchQuery: string;
}

export const AppointmentsSection: React.FC<AppointmentsSectionProps> = ({
  userRole = 'admin',
  appointments,
  patients,
  doctors,
  onAddAppointment,
  onUpdateStatus,
  onDeleteAppointment,
  searchQuery,
}) => {
  const canManageStatus = userRole === 'admin' || userRole === 'staff' || userRole === 'doctor';
  const canDeleteApt = userRole === 'admin' || userRole === 'staff' || userRole === 'doctor';
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedAptId, setExpandedAptId] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Form state & Validation
  const [formData, setFormData] = useState({
    patientName: '',
    doctorName: '',
    date: new Date().toISOString().split('T')[0],
    time: '11:00',
    type: 'كشف' as Appointment['type'],
    notes: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fieldWarnings, setFieldWarnings] = useState<Record<string, string>>({});

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    const query = (searchQuery || '').toLowerCase().trim();
    const matchesSearch = 
      !query ||
      apt.doctorName.toLowerCase().includes(query) ||
      apt.specialty.toLowerCase().includes(query) ||
      (apt.notes && apt.notes.toLowerCase().includes(query)) ||
      (userRole !== 'patient' && apt.patientName.toLowerCase().includes(query));

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
      notes: formData.notes || 'حجز عبر لوحة تحكم المستشفى',
      fee: finalFee,
    });

    // Reset form
    setFormData({
      patientName: '',
      doctorName: '',
      date: new Date().toISOString().split('T')[0],
      time: '11:00',
      type: 'كشف',
      notes: '',
    });
    setBookingError(null);
    setFieldErrors({});
    setFieldWarnings({});
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-bold text-white">جدول المواعيد والحجوزات الطبية</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            متابعة مواعيد الكشوفات، الاستشارات، المتابعات، وحالات الطوارئ
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>حجز موعد جديد</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        
        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
        >
          <option value="all">كافة الحالات (مؤكد، معلق، مكتمل، ملغى)</option>
          <option value="مؤكد">المواعيد المؤكدة</option>
          <option value="معلق">المواعيد المعلقة</option>
          <option value="مكتمل">المواعيد المكتملة</option>
          <option value="ملغى">المواعيد الملغاة</option>
        </select>

        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
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
      </div>      {/* Appointments Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs text-slate-300">
            <thead className="bg-slate-800 text-slate-400 font-bold border-b border-slate-700 whitespace-nowrap">
              <tr>
                <th className="p-4 w-10 text-center">#</th>
                {userRole !== 'patient' && <th className="p-4">المريض المراجع</th>}
                <th className="p-4">الطبيب المعالج</th>
                <th className="p-4">التخصص والعيادة</th>
                <th className="p-4">تاريخ ووقت الحجز</th>
                <th className="p-4">نوع الزيارة</th>
                <th className="p-4">رسوم الكشف</th>
                <th className="p-4">حالة الموعد</th>
                {userRole !== 'patient' && <th className="p-4 text-center">تحديث الحالة</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={userRole === 'patient' ? 7 : 9} className="p-8 text-center text-slate-400 whitespace-nowrap">
                    {userRole === 'patient' 
                      ? 'لا توجد مواعيد حجز جديدة مسجلة باسمك حالياً. يمكنك الضغط على "حجز موعد جديد" لطلب موعد جديد.' 
                      : 'لا توجد مواعيد تطابق شروط التصفية الحالية.'}
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => {
                  const isExpanded = expandedAptId === apt.id;
                  return (
                    <React.Fragment key={apt.id}>
                      <tr 
                        onClick={() => setExpandedAptId(isExpanded ? null : apt.id)}
                        className={`hover:bg-slate-800/60 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-800/40 border-l-4 border-sky-500' : ''}`}
                      >
                        <td className="p-4 text-center text-slate-400">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedAptId(isExpanded ? null : apt.id);
                            }}
                            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-sky-400 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-sky-400" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>

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

                        <td className="p-4 font-mono text-sky-400 whitespace-nowrap">
                          {apt.time} ({apt.date})
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
                          {apt.fee ? Number(apt.fee).toLocaleString('ar-SY') : '25,000'} ل.س
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap inline-block ${
                            apt.status === 'مؤكد' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                            apt.status === 'مكتمل' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            apt.status === 'معلق' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {apt.status}
                          </span>
                        </td>

                        {userRole !== 'patient' && (
                          <td className="p-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              {canManageStatus && apt.status !== 'مكتمل' && (
                                <button
                                  onClick={() => onUpdateStatus(apt.id, 'مكتمل')}
                                  className="px-2.5 py-1 rounded-md bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 font-bold transition-all cursor-pointer"
                                  title="تحديد كمكتمل"
                                >
                                  إكمال
                                </button>
                              )}
                              {canManageStatus && apt.status !== 'مؤكد' && apt.status !== 'مكتمل' && (
                                <button
                                  onClick={() => onUpdateStatus(apt.id, 'مؤكد')}
                                  className="px-2.5 py-1 rounded-md bg-sky-600/20 text-sky-300 hover:bg-sky-600 hover:text-white border border-sky-500/30 font-bold transition-all cursor-pointer"
                                >
                                  تأكيد
                                </button>
                              )}
                              {canManageStatus && apt.status !== 'ملغى' && (
                                <button
                                  onClick={() => onUpdateStatus(apt.id, 'ملغى')}
                                  className="px-2.5 py-1 rounded-md bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/30 font-bold transition-all cursor-pointer"
                                >
                                  إلغاء
                                </button>
                              )}
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
                        )}
                      </tr>

                      {/* Expandable Appointment Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-950/70 border-b-2 border-sky-500/30">
                          <td colSpan={userRole === 'patient' ? 7 : 9} className="p-4">
                            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                              <div className="space-y-1">
                                <span className="font-bold text-sky-400 flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>تفاصيل الموعد والشكوى السريرية:</span>
                                </span>
                                <p className="text-slate-200">
                                  {apt.notes || 'لا توجد ملاحظات إضافية مسجلة لهذا الحجز.'}
                                </p>
                              </div>
                              <div className="text-left font-mono text-[11px] text-slate-400 self-end sm:self-auto">
                                <span>معرف الحجز: {apt.id}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl text-right p-6 space-y-6 text-slate-200">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-400" />
                <span>حجز موعد طبي جديد</span>
              </h3>
              <button onClick={() => { setShowAddModal(false); setBookingError(null); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingError && (
              <div className="p-3.5 bg-rose-950/80 border border-rose-500/80 rounded-2xl text-rose-200 text-xs flex items-start gap-2.5 shadow-lg">
                <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-semibold">{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitNew} className="space-y-4 text-xs">
              
              {/* Patient Selector & Medical Safety Info */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المريض المراجع *</label>
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
                  className={`w-full p-2.5 rounded-xl bg-slate-800 border ${
                    fieldErrors.patientName ? 'border-rose-500 bg-rose-500/5' : 'border-slate-700'
                  } text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium`}
                />
                <datalist id="patients-list">
                  {patients.map((p) => (
                    <option key={p.id} value={p.fullName}>
                      {p.fileNumber} - فصيلة: {p.bloodType}
                    </option>
                  ))}
                </datalist>
                {fieldErrors.patientName && (
                  <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.patientName}</span>
                )}

                {/* Patient Safety Preview Alert */}
                {selectedPatientData && (
                  <div className="mt-2 p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">الملف: <strong className="text-white font-mono">{selectedPatientData.fileNumber}</strong></span>
                      <span className="text-slate-400">فصيلة الدم: <strong className="text-sky-400 font-bold">{selectedPatientData.bloodType}</strong></span>
                    </div>
                    {selectedPatientData.activeAllergies && selectedPatientData.activeAllergies.length > 0 && selectedPatientData.activeAllergies[0] !== 'لا يوجد حساسية معروفة' ? (
                      <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>حساسية: {selectedPatientData.activeAllergies.join(', ')}</span>
                      </div>
                    ) : (
                      <span className="text-emerald-400">لا توجد تحذيرات حساسية</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم الطبيب المعالج *</label>
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
                  className={`w-full p-2.5 rounded-xl bg-slate-800 border ${
                    fieldErrors.doctorName ? 'border-rose-500 bg-rose-500/5' : 'border-slate-700'
                  } text-white placeholder-slate-500 focus:outline-none focus:border-sky-500`}
                />
                <datalist id="doctors-list">
                  {doctors.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.specialty} ({d.consultingFee.toLocaleString()} ل.س)
                    </option>
                  ))}
                </datalist>
                {fieldErrors.doctorName && (
                  <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.doctorName}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">تاريخ الحجز *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => {
                      setFormData({ ...formData, date: e.target.value });
                      if (fieldErrors.date) setFieldErrors({ ...fieldErrors, date: '' });
                    }}
                    className={`w-full p-2.5 rounded-xl bg-slate-800 border ${
                      fieldErrors.date ? 'border-rose-500' : 'border-slate-700'
                    } text-white focus:outline-none focus:border-sky-500 font-mono`}
                  />
                  {fieldErrors.date && (
                    <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.date}</span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">وقت الحجز *</label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => {
                      setFormData({ ...formData, time: e.target.value });
                      if (fieldErrors.time) setFieldErrors({ ...fieldErrors, time: '' });
                    }}
                    className={`w-full p-2.5 rounded-xl bg-slate-800 border ${
                      fieldErrors.time ? 'border-rose-500' : 'border-slate-700'
                    } text-white focus:outline-none focus:border-sky-500 font-mono`}
                  />
                  {fieldErrors.time && (
                    <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.time}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">نوع الموعد *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
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

              <div>
                <label className="block text-slate-300 font-bold mb-1">ملاحظات أو أعراض مبدئية</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="وصف الأعراض الشائعة..."
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 text-white font-bold shadow-lg shadow-sky-600/30"
                >
                  تأكيد وتثبيت الحجز
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
