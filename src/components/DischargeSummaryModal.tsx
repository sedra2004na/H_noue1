import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  HeartPulse, 
  Stethoscope, 
  Calendar, 
  User, 
  Building2, 
  Pill, 
  Activity, 
  ShieldAlert, 
  Edit3, 
  Plus, 
  Trash2, 
  Save,
  Clock
} from 'lucide-react';
import { Patient, Doctor, DischargeSummary, DischargeMedication } from '../types';
import { HospitalLogo } from './HospitalLogo';

interface DischargeSummaryModalProps {
  patient: Patient;
  doctors: Doctor[];
  existingSummary?: DischargeSummary | null;
  onSaveSummary: (summary: DischargeSummary) => void;
  onClose: () => void;
}

export const DischargeSummaryModal: React.FC<DischargeSummaryModalProps> = ({
  patient,
  doctors,
  existingSummary,
  onSaveSummary,
  onClose
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(!existingSummary);

  const defaultDoctor = doctors[0] || {
    name: 'د. باسل الشامي',
    specialty: 'أمراض القلب والقسطرة',
    department: 'أمراض القلب والشرايين'
  };

  const [formData, setFormData] = useState<DischargeSummary>(() => {
    if (existingSummary) return existingSummary;

    return {
      id: 'dis-' + Date.now(),
      reportNumber: 'DIS-2026-' + Math.floor(1000 + Math.random() * 9000),
      patientId: patient.id,
      patientName: patient.fullName,
      fileNumber: patient.fileNumber,
      nationalId: patient.nationalId,
      age: patient.age,
      gender: patient.gender,
      admissionDate: patient.admissionDate || new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      dischargeDate: new Date().toISOString().split('T')[0],
      department: patient.assignedDoctor ? (doctors.find(d => d.name === patient.assignedDoctor)?.department || 'قسم الباطنية العام') : defaultDoctor.department,
      roomBedNumber: patient.roomNumber || 'سرير رقم 204 - جناح أ',
      attendingDoctor: patient.assignedDoctor || defaultDoctor.name,
      specialty: patient.assignedDoctor ? (doctors.find(d => d.name === patient.assignedDoctor)?.specialty || 'استشاري أمراض باطنية') : defaultDoctor.specialty,
      admissionDiagnosis: patient.medicalHistory && patient.medicalHistory.length > 0 ? patient.medicalHistory[0] : 'ألم صدري حاد مع ارتفاع في ضغط الدم واضطراب نظم',
      dischargeDiagnosis: 'استقرار الحالة السريرية التام، ضبط ضغط الدم، تحسن وظائف القلب والتخطيط الكهربائي الطبيعي ECG',
      hospitalCourse: 'تم قبول المريض في قسم العناية والاستشفاء، وإجراء الفحوصات المخبرية وتخطيط القلب والإيكو القلبي مع إعطاء العلاج الوريدي وضبط الجرعات. استجابت الحالة بشكل ممتاز واستقرت المؤشرات الحيوية دون أي مضاعفات.',
      surgicalProcedures: 'قسطرة تشخيصية وتوسيع شرياني ناجح بدون مضاعفات جراحية.',
      dischargeCondition: 'تحسن سريري ممتاز',
      medications: [
        {
          medicineName: 'كونكور Concor 5mg',
          dosage: '5 ملغ',
          frequency: 'حبة واحدة صباحاً يومياً',
          duration: '30 يوماً',
          instructions: 'تؤخذ مع كوب ماء على الريق'
        },
        {
          medicineName: 'أسبرين أطفال Aspirin Protect 100mg',
          dosage: '100 ملغ',
          frequency: 'حبة واحدة بعد الغداء',
          duration: 'مستمر',
          instructions: 'بعد وجبة طعام رئيسية'
        }
      ],
      dietAndActivityInstructions: 'حمية قليلة الملح والدهون، الإكثار من شرب السوائل الصحية، تجنب الإجهاد البدني العنيف لمدة أسبوعين، والالتزام بتمارين المشي الخفيف اليومي لمدة 20 دقيقة.',
      dangerSigns: 'في حال حدوث ألم صدري مفاجئ ضاغط، ضيق تنفس شديد، دوار شديد مع تعرق بارد، أو خفقان سريع مستمر، يجب مراجعة قسم طوارئ مشفى الرحمة فوراً دون تأخير.',
      followUpDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      followUpClinic: 'عيادة أمراض القلب والباطنية - مبنى العيادات الخارجية عيادة 101',
      doctorNotes: 'المريض متعاون، المؤشرات الحيوية طبيعية عند الخروج (BP: 120/80, HR: 74 bpm, SPO2: 99%).',
      createdAt: new Date().toISOString()
    };
  });

  const [newMed, setNewMed] = useState<DischargeMedication>({
    medicineName: '',
    dosage: '',
    frequency: 'مرة واحدة يومياً',
    duration: '7 أيام',
    instructions: ''
  });

  const handleAddMedication = () => {
    if (!newMed.medicineName.trim()) return;
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, newMed]
    }));
    setNewMed({
      medicineName: '',
      dosage: '',
      frequency: 'مرة واحدة يومياً',
      duration: '7 أيام',
      instructions: ''
    });
  };

  const handleRemoveMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSummary(formData);
    setIsEditing(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Top Bar - Hidden during printing */}
        <div className="print:hidden p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>تقرير خروج طبي رسمي</span>
                <span className="text-xs font-mono font-normal text-sky-400 bg-sky-950/80 px-2.5 py-0.5 rounded-full border border-sky-800">
                  {formData.reportNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                المريض: <strong className="text-slate-200">{patient.fullName}</strong> | ملف رقم: {patient.fileNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>تعديل البيانات</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950 border border-emerald-400/30 cursor-pointer hover:scale-105"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة التقرير (Print / PDF)</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* EDIT FORM VIEW */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-6 text-xs">
              <div className="bg-sky-950/30 border border-sky-800/40 p-4 rounded-2xl text-sky-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-sky-400" />
                  <span>تحرير بيانات وخطة خروج المريض الطبية والتوصيات العلاجية</span>
                </div>
                <span className="text-[11px] text-sky-400 font-mono">رقم التقرير: {formData.reportNumber}</span>
              </div>

              {/* Admission & Discharge Timings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">تاريخ الدخول للمشفى *</label>
                  <input
                    type="date"
                    required
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">تاريخ الخروج المعتمد *</label>
                  <input
                    type="date"
                    required
                    value={formData.dischargeDate}
                    onChange={(e) => setFormData({ ...formData, dischargeDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">القسم الطبي المعالج</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="مثال: قسم القلبية والجراحة"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">رقم الغرفة والسرير</label>
                  <input
                    type="text"
                    value={formData.roomBedNumber}
                    onChange={(e) => setFormData({ ...formData, roomBedNumber: e.target.value })}
                    placeholder="مثال: غرفة 204 - سرير أ"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Doctor and Discharge Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">الطبيب المشرف على التخريج</label>
                  <select
                    value={formData.attendingDoctor}
                    onChange={(e) => {
                      const doc = doctors.find(d => d.name === e.target.value);
                      setFormData({
                        ...formData,
                        attendingDoctor: e.target.value,
                        specialty: doc?.specialty || formData.specialty,
                        department: doc?.department || formData.department
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.name}>{d.name} ({d.specialty})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">الحالة السريرية عند التخريج *</label>
                  <select
                    value={formData.dischargeCondition}
                    onChange={(e) => setFormData({ ...formData, dischargeCondition: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold focus:outline-none focus:border-sky-500"
                  >
                    <option value="شفاء تام">شفاء تام (Full Recovery)</option>
                    <option value="تحسن سريري ممتاز">تحسن سريري ممتاز (Significant Improvement)</option>
                    <option value="استقرار مع متابعة منزلية">استقرار مع متابعة منزلية (Stable - Home Care)</option>
                    <option value="نقل لمشفى آخر">نقل لمشفى آخر (Transferred)</option>
                    <option value="خروج على مسؤولية المريض">خروج على مسؤولية المريض (Against Medical Advice)</option>
                  </select>
                </div>
              </div>

              {/* Diagnoses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">تشخيص الدخول (Admission Diagnosis) *</label>
                  <textarea
                    rows={2}
                    required
                    value={formData.admissionDiagnosis}
                    onChange={(e) => setFormData({ ...formData, admissionDiagnosis: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">تشخيص الخروج النهائي (Final Discharge Diagnosis) *</label>
                  <textarea
                    rows={2}
                    required
                    value={formData.dischargeDiagnosis}
                    onChange={(e) => setFormData({ ...formData, dischargeDiagnosis: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Hospital Course and Procedures */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">ملخص الإجراءات والعلاجات أثناء الإقامة بالمشفى (Hospital Course) *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.hospitalCourse}
                  onChange={(e) => setFormData({ ...formData, hospitalCourse: e.target.value })}
                  placeholder="وصف الفحوصات المخبرية، استجابة المريض للعلاج، الأشعة، والعلاجات الدوائية..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">التداخلات الجراحية / الإجراءات التخصصية المنجزة (إن وجدت)</label>
                <input
                  type="text"
                  value={formData.surgicalProcedures || ''}
                  onChange={(e) => setFormData({ ...formData, surgicalProcedures: e.target.value })}
                  placeholder="مثال: تنظير هضمي علوي / قسطرة قلبية تداخلية..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Discharge Medications */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-emerald-400" />
                    <span>خطة الأدوية الموصوفة للمنزل عند الخروج (Discharge Medications)</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">{formData.medications.length} أصناف مضافة</span>
                </div>

                {/* Medication Items List */}
                <div className="space-y-2">
                  {formData.medications.map((med, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <span className="font-bold text-white">{med.medicineName}</span>
                        <span className="text-emerald-400 font-mono">{med.dosage}</span>
                        <span className="text-sky-300">{med.frequency}</span>
                        <span className="text-slate-400">المدة: {med.duration}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new med row */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800/80">
                  <input
                    type="text"
                    placeholder="اسم الدواء (مثال: أوغمنتين 1g)"
                    value={newMed.medicineName}
                    onChange={(e) => setNewMed({ ...newMed, medicineName: e.target.value })}
                    className="sm:col-span-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <input
                    type="text"
                    placeholder="الجرعة (مثال: 1000mg)"
                    value={newMed.dosage}
                    onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <input
                    type="text"
                    placeholder="التكرار (مثال: مرتين يومياً)"
                    value={newMed.frequency}
                    onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center justify-center gap-1 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة دواء</span>
                  </button>
                </div>
              </div>

              {/* Instructions and Danger Signs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">تعليمات الراحة والنظام الغذائي والحركة *</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.dietAndActivityInstructions}
                    onChange={(e) => setFormData({ ...formData, dietAndActivityInstructions: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-rose-400 font-semibold mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>علامات الخطر والمحاذير (تستوجب العودة للطوارئ) *</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.dangerSigns}
                    onChange={(e) => setFormData({ ...formData, dangerSigns: e.target.value })}
                    className="w-full bg-slate-950 border border-rose-900/60 rounded-xl p-3 text-rose-200 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Follow-up Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">موعد المراجعة القادمة (Follow-up Date)</label>
                  <input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sky-300 font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">العيادة التخصصية المحددة للمراجعة</label>
                  <input
                    type="text"
                    value={formData.followUpClinic}
                    onChange={(e) => setFormData({ ...formData, followUpClinic: e.target.value })}
                    placeholder="مثال: عيادة الباطنية 104"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold shadow-lg shadow-emerald-950 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ وتثبيت تقرير الخروج</span>
                </button>
              </div>
            </form>
          ) : (
            
            /* OFFICIAL PRINTABLE DISCHARGE SUMMARY SHEET */
            <div 
              id="printable-discharge-summary"
              className="bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-xl font-sans border border-slate-200 relative overflow-hidden"
              dir="rtl"
            >
              
              {/* Official Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 mb-6">
                <div className="flex items-center gap-3">
                  <HospitalLogo size="md" />
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">مشفى الرحمة التخصصي</h1>
                    <p className="text-xs text-slate-600 font-medium">Al-Rahma Specialized Hospital</p>
                    <p className="text-[10px] text-slate-500">الجمهورية العربية السورية - وزارة الصحة</p>
                  </div>
                </div>

                <div className="text-left font-mono">
                  <div className="inline-block bg-slate-900 text-white text-xs px-3 py-1 rounded font-bold mb-1">
                    تقرير خروج طبي رسمي
                  </div>
                  <p className="text-[11px] text-slate-700 font-bold">Medical Discharge Summary</p>
                  <p className="text-xs text-slate-900 font-black mt-1">الرقم: {formData.reportNumber}</p>
                  <p className="text-[10px] text-slate-500">التاريخ: {formData.dischargeDate}</p>
                </div>
              </div>

              {/* Patient Basic Demographics Box */}
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">اسم المريض الرباعي:</span>
                  <strong className="text-slate-950 font-bold text-sm">{formData.patientName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">رقم الملف الطبي:</span>
                  <span className="font-mono font-bold text-slate-900">{formData.fileNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">العمر والجنس:</span>
                  <span className="font-bold text-slate-800">{formData.age} سنة / {formData.gender}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">الرقم الوطني / الهوية:</span>
                  <span className="font-mono text-slate-800">{formData.nationalId || '---'}</span>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block text-[11px]">تاريخ الدخول:</span>
                  <span className="font-semibold text-slate-900">{formData.admissionDate}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block text-[11px]">تاريخ التخريج:</span>
                  <span className="font-bold text-emerald-800">{formData.dischargeDate}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block text-[11px]">القسم والجناح:</span>
                  <span className="font-semibold text-slate-800">{formData.department} ({formData.roomBedNumber})</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block text-[11px]">الطبيب المشرف:</span>
                  <span className="font-bold text-slate-900">{formData.attendingDoctor}</span>
                </div>
              </div>

              {/* Clinical Summary Details */}
              <div className="space-y-4 text-xs text-slate-800">
                
                {/* Condition and Status Banner */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="text-emerald-950 font-bold block">الحالة السريرية العامة عند التخريج:</span>
                      <span className="text-xs text-emerald-800 font-semibold">{formData.dischargeCondition}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 bg-white px-2 py-1 rounded border border-emerald-200 font-bold">
                    مستقر سريرياً
                  </span>
                </div>

                {/* Diagnoses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50/50">
                    <span className="font-bold text-slate-900 block text-[11px] text-slate-600 mb-1">
                      تشخيص الدخول (Admission Diagnosis):
                    </span>
                    <p className="text-slate-800 font-medium leading-relaxed">{formData.admissionDiagnosis}</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50/50">
                    <span className="font-bold text-slate-900 block text-[11px] text-slate-600 mb-1">
                      تشخيص الخروج النهائي (Discharge Diagnosis):
                    </span>
                    <p className="text-slate-900 font-bold leading-relaxed">{formData.dischargeDiagnosis}</p>
                  </div>
                </div>

                {/* Hospital Course */}
                <div className="p-3.5 rounded-xl border border-slate-300">
                  <span className="font-bold text-slate-900 block text-[11px] text-slate-600 mb-1">
                    ملخص الإجراءات والعلاجات أثناء الإقامة (Hospital Course & Treatment):
                  </span>
                  <p className="text-slate-700 leading-relaxed">{formData.hospitalCourse}</p>
                  {formData.surgicalProcedures && (
                    <p className="text-slate-900 font-semibold mt-2 pt-2 border-t border-slate-200">
                      التداخلات الجراحية: <span className="font-normal text-slate-700">{formData.surgicalProcedures}</span>
                    </p>
                  )}
                </div>

                {/* Medications Table */}
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-bold text-slate-900 flex items-center justify-between">
                    <span>الوصفة الدوائية عند الخروج (Discharge Medications Plan)</span>
                    <span className="text-[10px] text-slate-500 font-normal">الالتزام بالمواعيد بدقة</span>
                  </div>
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-2.5">اسم الدواء</th>
                        <th className="p-2.5">الجرعة</th>
                        <th className="p-2.5">التكرار وطريقة الاستخدام</th>
                        <th className="p-2.5">المدة العلاجية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {formData.medications.map((m, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{m.medicineName}</td>
                          <td className="p-2.5 font-mono">{m.dosage}</td>
                          <td className="p-2.5">{m.frequency} {m.instructions ? `(${m.instructions})` : ''}</td>
                          <td className="p-2.5 font-medium">{m.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Home Care Instructions & Warnings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="font-bold text-slate-900 block mb-1">تعليمات الغذاء والنشاط اليومي:</span>
                    <p className="text-slate-700 leading-relaxed text-[11px]">{formData.dietAndActivityInstructions}</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-950">
                    <span className="font-bold text-rose-900 flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>علامات الخطر للمراجعة الإسعافية الفورية:</span>
                    </span>
                    <p className="leading-relaxed text-[11px] text-rose-900">{formData.dangerSigns}</p>
                  </div>
                </div>

                {/* Follow up box */}
                <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-sky-950 font-bold block">موعد المراجعة والاستشارة القادمة:</span>
                    <span className="text-sky-900 font-semibold">{formData.followUpClinic}</span>
                  </div>
                  <span className="font-bold text-sky-950 bg-white px-3 py-1.5 rounded-lg border border-sky-300 font-mono text-sm">
                    {formData.followUpDate}
                  </span>
                </div>

              </div>

              {/* Official Stamp and Signatures */}
              <div className="mt-8 pt-6 border-t-2 border-slate-300 grid grid-cols-3 gap-6 text-center text-xs text-slate-800">
                <div>
                  <p className="font-bold text-slate-900 mb-6">توقيع المريض / المرافق</p>
                  <div className="w-32 h-0.5 bg-slate-300 mx-auto"></div>
                  <span className="text-[10px] text-slate-500 block mt-1">تم استلام التوصيات وفهمها</span>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center p-2 text-center text-[10px] text-slate-500 font-serif">
                    ختم مشفى الرحمة المعتمد
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">Official Hospital Seal</span>
                </div>

                <div>
                  <p className="font-bold text-slate-900 mb-1">الطبيب الاستشاري المشرف</p>
                  <p className="text-xs text-slate-700 font-semibold mb-4">{formData.attendingDoctor}</p>
                  <div className="w-32 h-0.5 bg-slate-300 mx-auto"></div>
                  <span className="text-[10px] text-slate-500 block mt-1">{formData.specialty}</span>
                </div>
              </div>

              {/* Watermark / Footer */}
              <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 flex items-center justify-between">
                <span>وثيقة طبية رسمية صادرة إلكترونياً عن نظام مشفى الرحمة الموحد</span>
                <span className="font-mono">{formData.reportNumber} | {new Date().toLocaleDateString('ar-SY')}</span>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
