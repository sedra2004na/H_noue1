import React, { useState } from 'react';
import { 
  Patient, 
  Doctor, 
  Bed, 
  AbnormalLabFlag, 
  Appointment, 
  LabResult, 
  Prescription, 
  UserRole 
} from '../types';
import { 
  Stethoscope, 
  AlertOctagon, 
  AlertTriangle, 
  Activity, 
  Heart, 
  Thermometer, 
  Wind, 
  FlaskConical, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  User, 
  Bed as BedIcon, 
  ShieldAlert, 
  Calendar,
  X,
  Send,
  Sparkles,
  ChevronRight,
  Pill,
  Printer
} from 'lucide-react';

interface DoctorClinicalDashboardProps {
  userRole?: UserRole;
  currentDoctorName?: string;
  doctors: Doctor[];
  patients: Patient[];
  beds: Bed[];
  abnormalFlags: AbnormalLabFlag[];
  appointments: Appointment[];
  labResults: LabResult[];
  prescriptions: Prescription[];
  onAddPrescription?: (rx: any) => void;
  onAddLabResult?: (lab: any) => void;
  onUpdateAbnormalFlag?: (flagId: string, acknowledged: boolean, notes?: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onNavigate?: (tab: string) => void;
}

export const DoctorClinicalDashboard: React.FC<DoctorClinicalDashboardProps> = ({
  userRole = 'doctor',
  currentDoctorName = 'د. سارة السعيد',
  doctors,
  patients,
  beds,
  abnormalFlags,
  appointments,
  labResults,
  prescriptions,
  onAddPrescription,
  onAddLabResult,
  onUpdateAbnormalFlag,
  onShowToast,
  onNavigate
}) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(() => {
    const found = doctors.find(d => d.name.includes(currentDoctorName) || d.name === currentDoctorName);
    return found ? found.id : (doctors[0]?.id || 'doc-101');
  });

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'critical' | 'labs' | 'rounds'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [activeModal, setActiveModal] = useState<{
    type: 'note' | 'stat_lab' | 'rx' | 'flag_action';
    patient?: Patient;
    flag?: AbnormalLabFlag;
    bed?: Bed;
  } | null>(null);

  const [clinicalNoteText, setClinicalNoteText] = useState('');
  const [statTestName, setStatTestName] = useState('');
  const [statUrgency, setStatUrgency] = useState<'عاجل جداً (STAT)' | 'خلال ساعتين' | 'روتيني'>('عاجل جداً (STAT)');
  const [rxMedicine, setRxMedicine] = useState('');
  const [rxDose, setRxDose] = useState('');
  const [flagDoctorNote, setFlagDoctorNote] = useState('');

  // Doctor's assigned inpatients in beds
  const doctorBeds = beds.filter(b => b.status === 'occupied' && (b.attendingDoctorName?.includes(selectedDoctor?.name || '') || selectedDoctor?.department === b.department));
  
  // Doctor's today appointments
  const todayDate = new Date().toISOString().split('T')[0];
  const doctorAppointments = appointments.filter(a => a.doctorId === selectedDoctor?.id || a.doctorName?.includes(selectedDoctor?.name || ''));

  // Doctor's relevant abnormal lab flags
  const doctorAbnormalFlags = abnormalFlags.filter(f => 
    f.doctorName?.includes(selectedDoctor?.name || '') || 
    patients.some(p => p.id === f.patientId)
  );

  const unacknowledgedFlagsCount = doctorAbnormalFlags.filter(f => !f.acknowledgedByDoctor).length;
  const criticalFlagsCount = doctorAbnormalFlags.filter(f => f.severity === 'critical').length;
  const criticalInpatientsCount = doctorBeds.filter(b => b.priority === 'critical' || b.priority === 'urgent').length;

  const handleAcknowledgeFlag = (flag: AbnormalLabFlag, notes?: string) => {
    onUpdateAbnormalFlag?.(flag.id, true, notes || flagDoctorNote || 'تم الاطلاع ومتابعة الخطة العلاجية من قبل الطبيب المعالج');
    onShowToast?.(`تم توثيق وتأكيد الاطلاع على النتيجة المخبرية للمريض (${flag.patientName})`, 'success');
    setActiveModal(null);
    setFlagDoctorNote('');
  };

  const handleStatLabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal?.patient || !statTestName) return;

    onAddLabResult?.({
      patientId: activeModal.patient.id,
      patientName: activeModal.patient.fullName,
      doctorId: selectedDoctor?.id || 'doc-101',
      doctorName: selectedDoctor?.name || 'د. سارة السعيد',
      testName: `${statTestName} [طلب فوري ${statUrgency}]`,
      status: 'قيد المعالجة',
      resultValue: 'بانتظار سحب العينة والتحليل المخبري',
      normalRange: '--',
      unit: '',
      notes: `طلب فوري مستعجل من الطبيب المعالج: ${statUrgency}`,
    });

    onShowToast?.(`تم إرسال طلب التحليل الفوري (${statTestName}) للمختبر المركزي بنجاح`, 'info');
    setActiveModal(null);
    setStatTestName('');
  };

  const handleRxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal?.patient || !rxMedicine) return;

    onAddPrescription?.({
      patientId: activeModal.patient.id,
      patientName: activeModal.patient.fullName,
      doctorId: selectedDoctor?.id || 'doc-101',
      doctorName: selectedDoctor?.name || 'د. سارة السعيد',
      specialty: selectedDoctor?.specialty || 'الطب السريري',
      diagnosis: activeModal.bed?.diagnosis || 'متابعة سريرية داخل المشفى',
      medicines: [
        {
          medicineName: rxMedicine,
          dosage: rxDose || 'حسب البروتوكول',
          frequency: 'حسب إرشادات الطبيب',
          duration: 'أثناء الإقامة',
        }
      ],
      doctorInstructions: 'إعطاء الجرعة وريدياً ومراقبة الاستجابة السريرية الحيوية',
    });

    onShowToast?.(`تم إصدار وتوثيق الوصفة الطبية العاجلة للمريض (${activeModal.patient.fullName})`, 'success');
    setActiveModal(null);
    setRxMedicine('');
    setRxDose('');
  };

  const handleSaveClinicalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal?.patient || !clinicalNoteText) return;

    onShowToast?.(`تم حفظ ملاحظة التطور السريري في الملف الطبي للمريض (${activeModal.patient.fullName})`, 'success');
    setActiveModal(null);
    setClinicalNoteText('');
  };

  return (
    <div className="space-y-6">
      {/* Doctor Header & Active Shift Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-950/50 border border-blue-400/30 shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                <span>اللوحة السريرية المتخصصة للطبيب (Clinical Doctor Workspace)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                {selectedDoctor?.name} - {selectedDoctor?.specialty}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {selectedDoctor?.department} • العيادة: {selectedDoctor?.roomNumber} • المناوبة: {selectedDoctor?.shift}
              </p>
            </div>
          </div>

          {/* Doctor Selector Dropdown (to switch clinician perspective) */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">عرض كطبيب:</span>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
            >
              {doctors.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialty})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Doctor Summary KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>المرضى المنومين تحت إشرافي</span>
            </div>
            <div className="text-xl font-mono font-black text-white">
              {doctorBeds.length} <span className="text-xs text-slate-400 font-normal">مرضى</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-rose-500/30 rounded-xl p-3 bg-rose-950/10">
            <div className="flex items-center gap-1.5 text-rose-300 text-xs mb-1 font-bold">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>الحالات الحرجة والإنذار المبكر</span>
            </div>
            <div className="text-xl font-mono font-black text-rose-400">
              {criticalInpatientsCount} <span className="text-xs text-slate-400 font-normal">حالة حرجة</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3 bg-amber-950/10">
            <div className="flex items-center gap-1.5 text-amber-300 text-xs mb-1 font-bold">
              <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
              <span>نتائج مخبرية غير طبيعية (Flags)</span>
            </div>
            <div className="text-xl font-mono font-black text-amber-400">
              {doctorAbnormalFlags.length} <span className="text-xs text-amber-300/80 font-normal">({unacknowledgedFlagsCount} بانتظار التأكيد)</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>مواعيد العيادة اليوم</span>
            </div>
            <div className="text-xl font-mono font-black text-emerald-400">
              {doctorAppointments.length} <span className="text-xs text-slate-400 font-normal">موعد</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TABS & CLINICAL FILTERS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveSubTab('all')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'all'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/50 border border-blue-400/30'
              : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>نظرة سريرية شاملة</span>
        </button>

        <button
          onClick={() => setActiveSubTab('critical')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'critical'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50 border border-rose-400/30'
              : 'bg-slate-900/90 text-slate-400 hover:text-rose-300 border border-slate-800'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          <span>الحالات الحرجة والإنذار المبكر ({criticalInpatientsCount})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('labs')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'labs'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/50 border border-amber-400/30'
              : 'bg-slate-900/90 text-slate-400 hover:text-amber-300 border border-slate-800'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
          <span>النتائج المخبرية غير الطبيعية ({doctorAbnormalFlags.length})</span>
          {unacknowledgedFlagsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {unacknowledgedFlagsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('rounds')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'rounds'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50 border border-indigo-400/30'
              : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BedIcon className="w-3.5 h-3.5" />
          <span>جولة المرضى المنومين ({doctorBeds.length})</span>
        </button>
      </div>

      {/* SECTION 1: CRITICAL ABNORMAL LAB RESULTS ALERT CARDS (ABNORMAL FLAGS) */}
      {(activeSubTab === 'all' || activeSubTab === 'labs') && doctorAbnormalFlags.length > 0 && (
        <div className="bg-slate-900/95 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-amber-400">
              <FlaskConical className="w-5 h-5" />
              <h2 className="font-black text-white text-base">تنبيهات النتائج المخبرية غير الطبيعية (Abnormal Lab Flags)</h2>
            </div>
            <span className="text-xs text-amber-300 font-bold bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30">
              {unacknowledgedFlagsCount} نتائج تحتاج قراراً طبياً عاجلاً
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {doctorAbnormalFlags.map((flag) => {
              const isCritical = flag.severity === 'critical';
              const isWarning = flag.severity === 'warning';

              return (
                <div
                  key={flag.id}
                  className={`bg-slate-950/90 border rounded-xl p-4 transition-all duration-200 flex flex-col justify-between ${
                    isCritical
                      ? 'border-rose-500/40 hover:border-rose-400/60 bg-gradient-to-b from-rose-950/20 to-slate-950/90'
                      : isWarning
                      ? 'border-amber-500/40 hover:border-amber-400/60 bg-gradient-to-b from-amber-950/20 to-slate-950/90'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header with patient and bed */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-sm">{flag.patientName}</span>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>{flag.roomBedNumber || 'العيادة'}</span>
                          <span>• {flag.testDate}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                        isCritical ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' :
                        'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        <AlertTriangle className="w-3 h-3" />
                        <span>{isCritical ? 'حرج للغاية (Critical)' : 'تحذير مخبري (Warning)'}</span>
                      </span>
                    </div>

                    {/* Test & Result Highlight */}
                    <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="text-xs font-bold text-slate-200">{flag.testName}</div>
                      <div className="flex items-baseline justify-between pt-1">
                        <div className="text-base font-mono font-black text-rose-400">
                          القيمة المقاسة: {flag.resultValue}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          المجال الطبيعي: {flag.normalRange}
                        </div>
                      </div>
                    </div>

                    {/* Clinical Flag Description & Suggested Action */}
                    <div className="text-xs space-y-1">
                      <p className="text-rose-300/90 font-medium text-[11px] leading-tight">
                        ⚠ {flag.flagDescription}
                      </p>
                      <div className="text-slate-300 text-[11px] bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                        <span className="text-sky-400 font-bold">التوصية المقترحة: </span>
                        {flag.suggestedAction}
                      </div>
                    </div>

                    {/* Doctor's Previous Note if any */}
                    {flag.acknowledgedByDoctor && flag.doctorNotes && (
                      <div className="text-[11px] text-emerald-300 bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>قرار الطبيب: {flag.doctorNotes}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {!flag.acknowledgedByDoctor ? (
                      <button
                        onClick={() => {
                          const patient = patients.find(p => p.id === flag.patientId) || {
                            id: flag.patientId,
                            fullName: flag.patientName,
                            fileNumber: flag.patientFileNumber || 'MED-2026',
                          } as any;
                          setActiveModal({ type: 'flag_action', flag, patient });
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-950/40"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>اتخاذ إجراء سريري وتأكيد الاطلاع</span>
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between text-emerald-400 text-xs font-bold py-1">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>تم تأكيد الاطلاع من الطبيب المعالج</span>
                        </span>
                        <button
                          onClick={() => {
                            const patient = patients.find(p => p.id === flag.patientId);
                            if (patient) setActiveModal({ type: 'note', patient });
                          }}
                          className="text-slate-400 hover:text-white underline text-[11px] cursor-pointer"
                        >
                          إضافة ملاحظة
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: TODAY'S ASSIGNED PATIENTS & CLINICAL ROUNDS (INPATIENTS & OUTPATIENTS) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-0.5">
              <User className="w-4 h-4" />
              <span>المرضى المخصصون لجولة الطبيب اليوم</span>
            </div>
            <h2 className="text-lg font-black text-white">قائمة المرضى السريريين والحالات النشطة</h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث بالاسم، رقم السرير، التشخيص..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Patients Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {doctorBeds.length === 0 ? (
            <div className="col-span-2 py-10 text-center text-slate-400">
              <User className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <span>لا يوجد مرضى منومين مخصصين حالياً للطبيب المحدد في هذا القسم</span>
            </div>
          ) : (
            doctorBeds
              .filter(b => !searchQuery.trim() || b.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) || b.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) || b.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((bed) => {
                const patientObj = patients.find(p => p.id === bed.patientId) || patients.find(p => p.fullName === bed.patientName);
                const isCritical = bed.priority === 'critical';
                const isUrgent = bed.priority === 'urgent';

                return (
                  <div
                    key={bed.id}
                    className={`bg-slate-950/80 border rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between hover:shadow-xl ${
                      isCritical
                        ? 'border-rose-500/40 bg-rose-950/10'
                        : isUrgent
                        ? 'border-amber-500/40 bg-amber-950/10'
                        : 'border-slate-800 hover:border-blue-500/30'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Row: Bed, Patient Name, Priority Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-sky-400 font-mono font-bold text-xs">
                            {bed.bedNumber}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-sm">{bed.patientName}</h3>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>{bed.wardName}</span>
                              <span>• {bed.roomNumber}</span>
                            </div>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isCritical ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' :
                          isUrgent ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                          'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}>
                          {isCritical ? 'حرج (NEWS2: 8)' : isUrgent ? 'مراقبة حثيثة' : 'مستقر'}
                        </span>
                      </div>

                      {/* Diagnosis & Notes */}
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 space-y-1">
                        <div className="text-[11px] text-slate-400 font-medium">التشخيص الحالي وسبب التنويم:</div>
                        <p className="text-xs font-semibold text-slate-200 leading-relaxed">{bed.diagnosis}</p>
                      </div>

                      {/* Live Vital Signs Panel */}
                      {patientObj?.vitals && (
                        <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">الضغط</span>
                            <span className="font-mono font-bold text-slate-200">{patientObj.vitals.bloodPressure || '120/80'}</span>
                          </div>
                          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">النبض</span>
                            <span className="font-mono font-bold text-sky-400">{patientObj.vitals.heartRate || '78'} bpm</span>
                          </div>
                          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">الحرارة</span>
                            <span className="font-mono font-bold text-amber-400">{patientObj.vitals.temperature || '37.1'} °C</span>
                          </div>
                          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">الأكسجين</span>
                            <span className="font-mono font-bold text-emerald-400">{patientObj.vitals.oxygenSat || '98%'}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Doctor Actions Toolbar */}
                    <div className="pt-3 mt-3 border-t border-slate-800/80 grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => {
                          setActiveModal({
                            type: 'note',
                            patient: patientObj || { id: bed.patientId || 'pat-1', fullName: bed.patientName || '' } as any,
                            bed,
                          });
                        }}
                        className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        title="كتابة ملاحظة سريرية"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>ملاحظة</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveModal({
                            type: 'stat_lab',
                            patient: patientObj || { id: bed.patientId || 'pat-1', fullName: bed.patientName || '' } as any,
                            bed,
                          });
                        }}
                        className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-amber-950/50 text-amber-300 hover:text-amber-200 border border-slate-800 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        title="طلب فحص مخبري فوري STAT"
                      >
                        <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                        <span>تحليل فوري</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveModal({
                            type: 'rx',
                            patient: patientObj || { id: bed.patientId || 'pat-1', fullName: bed.patientName || '' } as any,
                            bed,
                          });
                        }}
                        className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-emerald-950/50 text-emerald-300 hover:text-emerald-200 border border-slate-800 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        title="وصف علاج فوري"
                      >
                        <Pill className="w-3.5 h-3.5 text-emerald-400" />
                        <span>وصفة علاج</span>
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* MODAL: CLINICAL PROGRESS NOTE */}
      {activeModal?.type === 'note' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="font-black text-white text-base">توثيق ملاحظة تطور سريري (Progress Note)</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClinicalNote} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-white text-sm">{activeModal.patient?.fullName}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">الملف الطبي: {activeModal.patient?.fileNumber || 'MED-2026'}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">ملاحظة الطبيب السريرية (SOAP Note) *</label>
                <textarea
                  rows={4}
                  value={clinicalNoteText}
                  onChange={(e) => setClinicalNoteText(e.target.value)}
                  placeholder="مثال: الحالة مستقرة، استجابة جيدة للمضاد الحيوي، علامات حيوية ضمن الطبيعي، يُنصح بالبدء بالمشي الخفيف..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700">
                  إلغاء
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-950/50">
                  حفظ وتوثيق في الملف الطبي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STAT LAB ORDER */}
      {activeModal?.type === 'stat_lab' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-base">طلب تحليل مخبري عاجل (STAT Order)</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStatLabSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-white text-sm">{activeModal.patient?.fullName}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">الملف: {activeModal.patient?.fileNumber || 'MED-2026'}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">اسم الفحص أو التحليل المطلوب *</label>
                <input
                  type="text"
                  value={statTestName}
                  onChange={(e) => setStatTestName(e.target.value)}
                  placeholder="مثال: غازات الدم الشرياني (ABG)، تروبونين قلبي، وظائف كلى وشوارد (K+, Na+)..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">درجة الاستعجال *</label>
                <select
                  value={statUrgency}
                  onChange={(e) => setStatUrgency(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="عاجل جداً (STAT)">عاجل جداً (STAT) - خلال 15 دقيقة</option>
                  <option value="خلال ساعتين">خلال ساعتين (Urgent)</option>
                  <option value="روتيني">روتيني مع جولة الصباح</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700">
                  إلغاء
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-950/50">
                  إرسال الأمر للمختبر فوراً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUICK PRESCRIPTION */}
      {activeModal?.type === 'rx' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-white text-base">إصدار وصفة علاج سريع</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRxSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-white text-sm">{activeModal.patient?.fullName}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">الملف: {activeModal.patient?.fileNumber || 'MED-2026'}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">اسم الدواء *</label>
                <input
                  type="text"
                  value={rxMedicine}
                  onChange={(e) => setRxMedicine(e.target.value)}
                  placeholder="مثال: لازكس (Furosemide IV)، أنسولين نظامي، كبريتات المغنيزيوم..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">الجرعة وطريقة الإعطاء</label>
                <input
                  type="text"
                  value={rxDose}
                  onChange={(e) => setRxDose(e.target.value)}
                  placeholder="مثال: 40 mg وريدياً فوراً مع مراقبة ضغط الدم..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700">
                  إلغاء
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/50">
                  إصدار وإرسال للصيدلية السريرية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ACTION ON ABNORMAL FLAG */}
      {activeModal?.type === 'flag_action' && activeModal.flag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-base">قرار الطبيب بشأن النتيجة المخبرية الحرجة</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-white text-sm">{activeModal.flag.patientName}</div>
                <div className="text-amber-300 font-bold">{activeModal.flag.testName}: <span className="font-mono text-rose-400">{activeModal.flag.resultValue}</span></div>
                <p className="text-[11px] text-slate-400">{activeModal.flag.flagDescription}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">القرار الطبي والإجراء المتخذ *</label>
                <textarea
                  rows={3}
                  value={flagDoctorNote}
                  onChange={(e) => setFlagDoctorNote(e.target.value)}
                  placeholder="اكتب التوجيه الطبي المتخذ، مثال: تم طلب قسطرة قلبية فورية، أو تم تعديل جرعة الأدوية وبدء المحلول الوريدي..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700">
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleAcknowledgeFlag(activeModal.flag!)}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-950/50"
                >
                  تأكيد الاطلاع وتوثيق القرار
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
