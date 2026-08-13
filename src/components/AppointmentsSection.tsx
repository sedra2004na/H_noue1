import React, { useState } from 'react';
import { Appointment, Patient, Doctor, UserRole } from '../types';
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
  Trash2
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

  // Form state
  const [formData, setFormData] = useState({
    patientName: '',
    doctorName: '',
    date: '2026-08-09',
    time: '11:00',
    type: 'كشف' as Appointment['type'],
    notes: '',
  });

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

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    
    const initialPatientName = formData.patientName.trim() || 'مريض مراجع';
    const matchedPatient = patients.find(p => p.fullName === initialPatientName);
    const finalPatientName = initialPatientName;
    const finalPatientId = matchedPatient ? matchedPatient.id : ('p-' + Date.now());

    const matchedDoctor = doctors.find(d => d.name === formData.doctorName);
    const finalDoctorName = formData.doctorName.trim() || 'د. طبيب ممارس';
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
      date: '2026-08-09',
      time: '11:00',
      type: 'كشف',
      notes: '',
    });
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
          <option value="all">كافة أنواع المواعيد (كشف، استشارة...)</option>
          <option value="كشف">كشف جديد</option>
          <option value="استشارة">استشارة دقيقة</option>
          <option value="متابعة">متابعة دورية</option>
          <option value="طوارئ">طوارئ عاجلة</option>
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
                {userRole !== 'patient' && <th className="p-4 text-center">تحديث الحالة</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={userRole === 'patient' ? 6 : 8} className="p-8 text-center text-slate-400 whitespace-nowrap">
                    {userRole === 'patient' 
                      ? 'لا توجد مواعيد حجز جديدة مسجلة باسمك حالياً. يمكنك الضغط على "حجز موعد جديد" لطلب موعد جديد.' 
                      : 'لا توجد مواعيد تطابق شروط التصفية الحالية.'}
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-800/50 transition-colors">
                    
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
                      <td className="p-4 text-center whitespace-nowrap">
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
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteAppointment(apt.id);
                              }}
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
                ))
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
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNew} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المريض المراجع *</label>
                <input
                  type="text"
                  required
                  list="patients-list"
                  placeholder="اكتب اسم المريض الثلاثي/الرباعي هنا..."
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
                />
                <datalist id="patients-list">
                  {patients.map((p) => (
                    <option key={p.id} value={p.fullName}>
                      {p.fileNumber}
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم الطبيب المعالج *</label>
                <input
                  type="text"
                  required
                  list="doctors-list"
                  placeholder="اكتب اسم الطبيب أو اختر من القائمة..."
                  value={formData.doctorName}
                  onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <datalist id="doctors-list">
                  {doctors.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.specialty}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">تاريخ الحجز *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">وقت الحجز *</label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">نوع الموعد *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="كشف">كشف جديد</option>
                  <option value="استشارة">استشارة دقيقة</option>
                  <option value="متابعة">متابعة دورية</option>
                  <option value="طوارئ">طوارئ عاجلة</option>
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
