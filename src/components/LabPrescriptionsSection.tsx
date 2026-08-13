import React, { useState } from 'react';
import { LabResult, Prescription, Patient, Doctor, UserRole } from '../types';
import { printAndExportPdf } from '../utils/pdfExport';
import { 
  FlaskConical, 
  FileText, 
  Printer, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  Building2, 
  Stethoscope, 
  Pill, 
  X,
  User,
  Calendar,
  Trash2
} from 'lucide-react';

interface LabPrescriptionsProps {
  userRole?: UserRole;
  labResults: LabResult[];
  prescriptions: Prescription[];
  patients: Patient[];
  doctors: Doctor[];
  onAddLabResult: (lab: Partial<LabResult>) => void;
  onAddPrescription: (rx: Partial<Prescription>) => void;
  onDeleteLabResult?: (id: string) => void;
  onDeletePrescription?: (id: string) => void;
}

export const LabPrescriptionsSection: React.FC<LabPrescriptionsProps> = ({
  userRole = 'admin',
  labResults,
  prescriptions,
  patients,
  doctors,
  onAddLabResult,
  onAddPrescription,
  onDeleteLabResult,
  onDeletePrescription,
}) => {
  const canIssuePrescription = userRole === 'admin' || userRole === 'doctor';
  const canAddLabResult = userRole === 'admin' || userRole === 'doctor' || userRole === 'staff';
  const canDelete = userRole === 'admin' || userRole === 'doctor';

  const isPatientRole = userRole === 'patient';
  const displayLabResults = isPatientRole
    ? labResults.filter(l => l.patientId === 'pat-1' || l.patientName === 'محمد عبد الله العتيبي')
    : labResults;

  const displayPrescriptions = isPatientRole
    ? prescriptions.filter(p => p.patientId === 'pat-1' || p.patientName === 'محمد عبد الله العتيبي')
    : prescriptions;

  const [activeTab, setActiveTab] = useState<'lab' | 'rx'>('lab');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showAddLabModal, setShowAddLabModal] = useState(false);
  const [showAddRxModal, setShowAddRxModal] = useState(false);
  // New Lab Result Form State
  const [labForm, setLabForm] = useState({
    patientName: '',
    doctorName: '',
    testName: 'تحليل السكر التراكمي (HbA1c)',
    resultValue: '7.5 %',
    normalRange: '4.0 - 5.6 %',
    unit: '%',
    status: 'تحذير' as LabResult['status'],
    notes: '',
  });

  // New Prescription Form State
  const [rxForm, setRxForm] = useState({
    patientName: '',
    doctorName: '',
    diagnosis: 'ارتفاع ضغط الدم مع زيادة نسبة الدهون',
    doctorInstructions: 'الالتزام التام بتناول العلاج بعد الوجبات المحددة',
    medicines: [
      { medicineName: 'أملوديبين (Amlodipine 5mg)', dosage: '5mg', frequency: 'مرة واحدة يومياً', duration: '30 يوماً' }
    ],
  });

  const handleAddMedicineRow = () => {
    setRxForm({
      ...rxForm,
      medicines: [
        ...rxForm.medicines,
        { medicineName: 'باراسيتامول 500mg', dosage: '500mg', frequency: 'عند اللزوم', duration: '5 أيام' }
      ]
    });
  };

  const handlePrintPrescription = () => {
    if (!selectedPrescription) return;

    const medTable = `
      <div style="margin-bottom: 15px;">
        <p><strong>التشخيص الطبي الأولي:</strong> ${selectedPrescription.diagnosis}</p>
      </div>
      
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 8px;">الأدوية والجرعات الموصوفة (Rx):</h3>
      <table>
        <thead>
          <tr>
            <th>اسم الدواء</th>
            <th>الجرعة</th>
            <th>تكرار الأخذ</th>
            <th>مدة العلاج</th>
          </tr>
        </thead>
        <tbody>
          ${selectedPrescription.medicines.map(m => `
            <tr>
              <td><strong>${m.medicineName}</strong></td>
              <td>${m.dosage}</td>
              <td>${m.frequency}</td>
              <td>${m.duration}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 20px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <p><strong>إرشادات الطبيب:</strong> ${selectedPrescription.doctorInstructions || 'الالتزام الكامل بالجرعات المحددة.'}</p>
      </div>
    `;

    printAndExportPdf({
      title: 'وصفة طبية إلكترونية معتمدة',
      documentNumber: selectedPrescription.id,
      date: selectedPrescription.date,
      patientName: selectedPrescription.patientName,
      doctorName: selectedPrescription.doctorName,
      specialty: selectedPrescription.specialty,
      detailsHtml: medTable,
    });
  };

  const handlePrintLabResult = (lab: LabResult) => {
    const labHtml = `
      <table>
        <thead>
          <tr>
            <th>الفحص / التحليل الطبي</th>
            <th>النتيجة</th>
            <th>المعدل الطبيعي</th>
            <th>الوحدة</th>
            <th>التقييم</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${lab.testName}</strong></td>
            <td><strong style="font-size: 15px; color: ${lab.status === 'طبيعي' ? '#047857' : '#b91c1c'};">${lab.resultValue}</strong></td>
            <td>${lab.normalRange}</td>
            <td>${lab.unit}</td>
            <td><strong>${lab.status}</strong></td>
          </tr>
        </tbody>
      </table>

      ${lab.notes ? `
        <div style="margin-top: 15px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p><strong>ملاحظات أخصائي المختبر:</strong> ${lab.notes}</p>
        </div>
      ` : ''}
    `;

    printAndExportPdf({
      title: 'تقرير نتائج الفحوصات المخبرية',
      documentNumber: lab.id,
      date: lab.testDate,
      patientName: lab.patientName,
      doctorName: lab.doctorName,
      detailsHtml: labHtml,
    });
  };

  const handleAddLabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.fullName === labForm.patientName);
    const doc = doctors.find(d => d.name === labForm.doctorName);

    const finalPatientName = labForm.patientName.trim() || 'مريض جديد';
    const finalPatientId = pat ? pat.id : ('p-' + Date.now());
    const finalDoctorName = labForm.doctorName.trim() || 'د. طبيب المختبر';
    const finalDoctorId = doc ? doc.id : ('d-' + Date.now());

    onAddLabResult({
      patientId: finalPatientId,
      patientName: finalPatientName,
      doctorId: finalDoctorId,
      doctorName: finalDoctorName,
      testName: labForm.testName,
      status: labForm.status,
      resultValue: labForm.resultValue,
      normalRange: labForm.normalRange,
      unit: labForm.unit,
      notes: labForm.notes,
    });

    setShowAddLabModal(false);
  };

  const handleAddRxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.fullName === rxForm.patientName);
    const doc = doctors.find(d => d.name === rxForm.doctorName);

    const finalPatientName = rxForm.patientName.trim() || 'مريض جديد';
    const finalPatientId = pat ? pat.id : ('p-' + Date.now());
    const finalDoctorName = rxForm.doctorName.trim() || 'د. الطبيب المعالج';
    const finalDoctorId = doc ? doc.id : ('d-' + Date.now());

    onAddPrescription({
      patientId: finalPatientId,
      patientName: finalPatientName,
      doctorId: finalDoctorId,
      doctorName: finalDoctorName,
      specialty: doc ? doc.specialty : 'طب عام',
      diagnosis: rxForm.diagnosis,
      doctorInstructions: rxForm.doctorInstructions,
      medicines: rxForm.medicines,
    });

    setShowAddRxModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-bold text-white">المختبر الطبي والوصفات الإلكترونية</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            متابعة نتائج التحاليل المخبرية والوصفات الدوائية الصادرة
          </p>
        </div>

        <div className="flex items-center p-1 bg-slate-800 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'lab' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            نتائج التحاليل المخبرية
          </button>
          <button
            onClick={() => setActiveTab('rx')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'rx' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            الوصفات الطبية الإلكترونية
          </button>
        </div>
      </div>

      {activeTab === 'lab' ? (
        /* Lab Results View */
        <div className="space-y-4">
          {canAddLabResult && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddLabModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل نتيجة فحص مخبري جديد</span>
              </button>
            </div>
          )}

          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs text-slate-300">
                <thead className="bg-slate-800 text-slate-400 font-bold border-b border-slate-700">
                  <tr>
                    <th className="p-4">اسم الفحص / التحليل</th>
                    {!isPatientRole && <th className="p-4">اسم المريض</th>}
                    <th className="p-4">الطبيب الموجه</th>
                    <th className="p-4">النتيجة المسجلة</th>
                    <th className="p-4">النطاق الطبيعي</th>
                    <th className="p-4">تاريخ الفحص</th>
                    <th className="p-4">مؤشر النتيجة (Status)</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {displayLabResults.map((lab) => (
                    <tr key={lab.id} className="hover:bg-slate-800/50">
                      <td className="p-4 font-bold text-white">{lab.testName}</td>
                      {!isPatientRole && <td className="p-4 text-slate-200">{lab.patientName}</td>}
                      <td className="p-4 text-slate-400">{lab.doctorName}</td>
                      <td className="p-4 font-mono font-bold text-sky-300">{lab.resultValue}</td>
                      <td className="p-4 font-mono text-slate-400">{lab.normalRange}</td>
                      <td className="p-4 font-mono text-slate-400">{lab.testDate}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          lab.status === 'حرج' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' :
                          lab.status === 'تحذير' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {lab.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handlePrintLabResult(lab)}
                            className="p-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 transition-all flex items-center gap-1"
                            title="طباعة / تصدير PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="text-[10px]">تصدير PDF</span>
                          </button>

                          {canDelete && onDeleteLabResult && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteLabResult(lab.id);
                              }}
                              className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
                              title="حذف نتيجة الفحص"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Prescriptions List View */
        <div className="space-y-4">
          {canIssuePrescription && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddRxModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إصدار وصفة طبية جديدة</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {displayPrescriptions.map((rx) => (
              <div key={rx.id} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-sky-400 font-mono font-bold">وصفة رقم: {rx.id}</span>
                    {!isPatientRole && <h3 className="font-bold text-sm text-white">{rx.patientName}</h3>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedPrescription(rx)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>عرض وطباعة</span>
                    </button>

                    {canDelete && onDeletePrescription && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePrescription(rx.id);
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
                        title="حذف الوصفة الطبية"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <p><span className="text-slate-400">الطبيب المعالج:</span> {rx.doctorName} ({rx.specialty})</p>
                  <p><span className="text-slate-400">التشخيص:</span> {rx.diagnosis}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1 text-xs">
                  <span className="text-slate-400 font-bold block mb-1">الأدوية الموصوفة ({rx.medicines.length}):</span>
                  {rx.medicines.map((m, idx) => (
                    <div key={idx} className="flex justify-between text-slate-200">
                      <span>• {m.medicineName}</span>
                      <span className="text-sky-300 font-medium">{m.dosage} - {m.frequency}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Printable Prescription Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-2xl p-8 shadow-2xl text-right space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Printable Prescription Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">مشفى النور الطبي</h2>
                  <p className="text-xs text-slate-600">Al-Noor Hospital - الوصفة الطبية المعتمدة</p>
                </div>
              </div>

              <div className="text-left text-xs text-slate-600 font-mono">
                <p className="font-bold text-slate-900">رقم الوصفة: {selectedPrescription.id}</p>
                <p>تاريخ الصدور: {selectedPrescription.date}</p>
              </div>
            </div>

            {/* Patient & Doctor Details */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-100 text-xs">
              <div>
                <span className="text-slate-500 block">اسم المريض:</span>
                <p className="font-bold text-slate-900 text-sm">{selectedPrescription.patientName}</p>
              </div>
              <div>
                <span className="text-slate-500 block">الطبيب الصادر منه:</span>
                <p className="font-bold text-slate-900 text-sm">{selectedPrescription.doctorName}</p>
                <p className="text-slate-600 text-[11px]">{selectedPrescription.specialty}</p>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="text-xs">
              <span className="text-slate-500 font-bold block mb-1">التشخيص الطبي الأولي:</span>
              <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-800">
                {selectedPrescription.diagnosis}
              </p>
            </div>

            {/* Prescribed Medicines */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">الأدوية والجرعات المقررة (Rx):</h4>
              <table className="w-full text-right text-xs border border-slate-300">
                <thead className="bg-slate-200 font-bold text-slate-800">
                  <tr>
                    <th className="p-2 border">اسم الدواء</th>
                    <th className="p-2 border">الجرعة</th>
                    <th className="p-2 border">تكرار الأخذ</th>
                    <th className="p-2 border">مدة العلاج</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPrescription.medicines.map((m, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2 border font-bold text-slate-900">{m.medicineName}</td>
                      <td className="p-2 border">{m.dosage}</td>
                      <td className="p-2 border">{m.frequency}</td>
                      <td className="p-2 border">{m.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Doctor Instructions & Stamp */}
            <div className="flex justify-between items-end pt-4 border-t border-slate-200 text-xs">
              <div className="max-w-xs">
                <span className="text-slate-500 font-bold block">إرشادات واستعمال الدواء:</span>
                <p className="text-slate-700 italic">{selectedPrescription.doctorInstructions}</p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 border-2 border-dashed border-sky-600 rounded-full flex flex-col items-center justify-center text-[10px] text-sky-800 font-bold p-1">
                  <span>خاتم الطبيب المعالج</span>
                  <span className="text-[9px]">مشفى النور</span>
                  <CheckCircle className="w-4 h-4 text-sky-600 mt-1" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                onClick={() => setSelectedPrescription(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs"
              >
                إغلاق
              </button>

              <button
                onClick={handlePrintPrescription}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الوصفة الطبية</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add New Lab Result Modal */}
      {showAddLabModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-right space-y-4 text-slate-200 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">تسجيل فحص مخبري جديد</h3>
              <button onClick={() => setShowAddLabModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddLabSubmit} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">اسم المريض *</label>
                <input
                  type="text"
                  required
                  list="lab-patients-list"
                  placeholder="اكتب اسم المريض أو اختر من القائمة..."
                  value={labForm.patientName}
                  onChange={(e) => setLabForm({ ...labForm, patientName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <datalist id="lab-patients-list">
                  {patients.map((p) => (
                    <option key={p.id} value={p.fullName}>
                      {p.fileNumber}
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block font-bold mb-1">اسم التحليل المخبري *</label>
                <input type="text" required value={labForm.testName} onChange={(e) => setLabForm({...labForm, testName: e.target.value})} className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">نتيجة الفحص *</label>
                  <input type="text" required value={labForm.resultValue} onChange={(e) => setLabForm({...labForm, resultValue: e.target.value})} className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700 font-mono" />
                </div>
                <div>
                  <label className="block font-bold mb-1">المعدل الطبيعي</label>
                  <input type="text" value={labForm.normalRange} onChange={(e) => setLabForm({...labForm, normalRange: e.target.value})} className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700 font-mono" />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">حالة النتيجة (الخطورة)</label>
                <select value={labForm.status} onChange={(e) => setLabForm({...labForm, status: e.target.value as any})} className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700">
                  <option value="طبيعي">طبيعي (Normal)</option>
                  <option value="تحذير">تحذير (Warning)</option>
                  <option value="حرج">حرج جداً (Critical Alert)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowAddLabModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl font-bold">إلغاء</button>
                <button type="submit" className="px-5 py-2 bg-sky-600 text-white font-bold rounded-xl shadow-md">حفظ النتيجة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Prescription Modal */}
      {showAddRxModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-right space-y-4 text-slate-200 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">إصدار وصفة طبية جديدة</h3>
              <button onClick={() => setShowAddRxModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddRxSubmit} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">اسم المريض *</label>
                <input
                  type="text"
                  required
                  list="rx-patients-list"
                  placeholder="اكتب اسم المريض أو اختر من القائمة..."
                  value={rxForm.patientName}
                  onChange={(e) => setRxForm({ ...rxForm, patientName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <datalist id="rx-patients-list">
                  {patients.map((p) => (
                    <option key={p.id} value={p.fullName}>
                      {p.fileNumber}
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block font-bold mb-1">التشخيص الطبي *</label>
                <input type="text" required value={rxForm.diagnosis} onChange={(e) => setRxForm({...rxForm, diagnosis: e.target.value})} className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold">الأدوية الموصوفة *</label>
                  <button type="button" onClick={handleAddMedicineRow} className="text-sky-400 hover:underline text-[11px] font-bold">+ دواء آخر</button>
                </div>
                {rxForm.medicines.map((med, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2 mb-2">
                    <input
                      type="text"
                      placeholder="اسم الدواء والجرعة..."
                      value={med.medicineName}
                      onChange={(e) => {
                        const newMeds = [...rxForm.medicines];
                        newMeds[idx].medicineName = e.target.value;
                        setRxForm({ ...rxForm, medicines: newMeds });
                      }}
                      className="w-full p-2 bg-slate-900 rounded-lg border border-slate-700"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="التكرار (مثال: 3 مرات)"
                        value={med.frequency}
                        onChange={(e) => {
                          const newMeds = [...rxForm.medicines];
                          newMeds[idx].frequency = e.target.value;
                          setRxForm({ ...rxForm, medicines: newMeds });
                        }}
                        className="w-full p-2 bg-slate-900 rounded-lg border border-slate-700"
                      />
                      <input
                        type="text"
                        placeholder="المدة (مثال: 7 أيام)"
                        value={med.duration}
                        onChange={(e) => {
                          const newMeds = [...rxForm.medicines];
                          newMeds[idx].duration = e.target.value;
                          setRxForm({ ...rxForm, medicines: newMeds });
                        }}
                        className="w-full p-2 bg-slate-900 rounded-lg border border-slate-700"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold mb-1">تعليمات الطبيب</label>
                <textarea rows={2} value={rxForm.doctorInstructions} onChange={(e) => setRxForm({...rxForm, doctorInstructions: e.target.value})} className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700" />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowAddRxModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl font-bold">إلغاء</button>
                <button type="submit" className="px-5 py-2 bg-sky-600 text-white font-bold rounded-xl shadow-md">إصدار الوصفة</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
