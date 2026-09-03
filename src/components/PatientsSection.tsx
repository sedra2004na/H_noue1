import React, { useState } from 'react';
import { Patient, UserRole, Doctor, DischargeSummary } from '../types';
import { printAndExportPdf } from '../utils/pdfExport';
import { validatePatientForm, ValidationResult } from '../utils/validation';
import { DischargeSummaryModal } from './DischargeSummaryModal';
import { 
  Users, 
  Search, 
  Plus, 
  Eye, 
  Trash2, 
  FileText, 
  Activity, 
  ShieldAlert, 
  Heart, 
  Phone, 
  MapPin, 
  X,
  Calendar,
  CheckCircle2,
  Stethoscope,
  Upload,
  Image as ImageIcon,
  Download,
  Printer,
  FileUp,
  Maximize2,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Thermometer,
  Weight,
  Archive,
  AlertTriangle
} from 'lucide-react';

export interface MedicalFile {
  id: string;
  name: string;
  date: string;
  size: string;
  type: string;
  url: string;
}

interface PatientsSectionProps {
  userRole?: UserRole;
  patients: Patient[];
  doctors?: Doctor[];
  onAddPatient: (patient: Partial<Patient>) => void;
  onUpdatePatient: (id: string, data: Partial<Patient>) => void;
  onDeletePatient?: (id: string) => void;
  onArchivePatient?: (patientId: string) => void;
  searchQuery: string;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error' | 'download') => void;
}

export const PatientsSection: React.FC<PatientsSectionProps> = ({
  userRole = 'admin',
  patients,
  doctors = [],
  onAddPatient,
  onUpdatePatient,
  onDeletePatient,
  onArchivePatient,
  searchQuery,
  onShowToast
}) => {
  const canAddPatient = userRole === 'admin' || userRole === 'doctor' || userRole === 'staff';
  const canDeletePatient = userRole === 'admin' || userRole === 'staff';
  const [localSearch, setLocalSearch] = useState('');
  const [selectedBlood, setSelectedBlood] = useState<string>('all');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDischargePatient, setSelectedDischargePatient] = useState<Patient | null>(null);
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'info' | 'scans'>('info');

  // Stored Discharge Summaries state
  const [dischargeSummaries, setDischargeSummaries] = useState<Record<string, DischargeSummary>>(() => {
    try {
      const saved = localStorage.getItem('syrian_hosp_discharge_summaries');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleSaveDischargeSummary = (summary: DischargeSummary) => {
    setDischargeSummaries((prev) => {
      const updated = { ...prev, [summary.patientId]: summary };
      try {
        localStorage.setItem('syrian_hosp_discharge_summaries', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save discharge summary in localStorage', e);
      }
      return updated;
    });
    onShowToast?.(`تم حفظ وتثبيت تقرير الخروج الطبي للمريض (${summary.patientName}) بنجاح`, 'success');
  };

  // Medical Scans and files state per patient
  const [patientFiles, setPatientFiles] = useState<Record<string, MedicalFile[]>>({
    'p-1': [
      {
        id: 'f-1',
        name: 'أشعة_سينية_الصدر_XRay.png',
        date: '2026-08-01',
        size: '1.8 MB',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'f-2',
        name: 'تقرير_التحاليل_الشامل_2026.pdf',
        date: '2026-07-28',
        size: '850 KB',
        type: 'pdf',
        url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80'
      }
    ]
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // New Patient Form state & validation
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    fullName: '',
    nationalId: '',
    age: 30,
    gender: 'ذكر' as 'ذكر' | 'أنثى',
    bloodType: 'A+' as Patient['bloodType'],
    phone: '',
    address: '',
    emergencyContact: '',
    insuranceProvider: 'التعاونية للتأمين',
    insuranceNumber: '',
    medicalHistoryInput: '',
    allergiesInput: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const query = (localSearch || searchQuery).toLowerCase();

  const filteredPatients = patients.filter((p) => {
    const matchesSearch = 
      p.fullName.toLowerCase().includes(query) ||
      p.fileNumber.toLowerCase().includes(query) ||
      p.nationalId.includes(query) ||
      p.phone.includes(query);

    const matchesBlood = selectedBlood === 'all' || p.bloodType === selectedBlood;

    return matchesSearch && matchesBlood;
  });

  const handleFileUpload = (patientId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const fileUrl = e.target?.result as string;
      const newFile: MedicalFile = {
        id: 'f-' + Date.now(),
        name: file.name,
        date: new Date().toISOString().split('T')[0],
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        type: file.type.startsWith('image/') ? 'image' : 'document',
        url: fileUrl,
      };

      setPatientFiles((prev) => ({
        ...prev,
        [patientId]: [newFile, ...(prev[patientId] || [])],
      }));

      onShowToast?.(`تم رفع الملف الطبي (${file.name}) بنجاح للمريض`, 'success');
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (patientId: string, fileId: string) => {
    setPatientFiles((prev) => ({
      ...prev,
      [patientId]: (prev[patientId] || []).filter((f) => f.id !== fileId),
    }));
    onShowToast?.('تم حذف الملف الطبي بنجاح', 'info');
  };

  const handleExportPDF = (patient: Patient) => {
    const scans = patientFiles[patient.id] || [];
    const vitals = patient.vitals;

    const detailsHtml = `
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 15px; color: #0369a1; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px;">
          📋 البيانات الشخصية والطبية الأساسية
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: bold; width: 20%;">رقم الملف:</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${patient.fileNumber}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: bold; width: 20%;">الاسم الرباعي:</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">${patient.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: bold;">العمر والجنس:</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${patient.age} سنة (${patient.gender})</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: bold;">فصيلة الدم:</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; color: #e11d48; font-weight: bold;">${patient.bloodType}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: bold;">رقم التواصل:</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${patient.phone}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: bold;">الرقم الوطني:</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${patient.nationalId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: bold;">جهة التأمين:</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${patient.insuranceProvider || 'تأمين عام'}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: bold;">تاريخ آخر زيارة:</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${patient.lastVisitDate}</td>
          </tr>
        </table>
      </div>

      ${vitals ? `
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 15px; color: #0369a1; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px;">
          🩺 المؤشرات الحيوية الأخيرة (Vital Signs)
        </h2>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center;">
          <div style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f0f9ff;">
            <span style="font-size: 11px; color: #64748b; display: block;">ضغط الدم</span>
            <strong style="font-size: 15px; color: #0284c7;">${vitals.bloodPressure}</strong>
          </div>
          <div style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f0f9ff;">
            <span style="font-size: 11px; color: #64748b; display: block;">نبض القلب</span>
            <strong style="font-size: 15px; color: #0284c7;">${vitals.heartRate} bpm</strong>
          </div>
          <div style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f0f9ff;">
            <span style="font-size: 11px; color: #64748b; display: block;">تشبع الأوكسجين</span>
            <strong style="font-size: 15px; color: #0284c7;">${vitals.oxygenSat}</strong>
          </div>
          <div style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f0f9ff;">
            <span style="font-size: 11px; color: #64748b; display: block;">الحرارة / الوزن</span>
            <strong style="font-size: 13px; color: #0284c7;">${vitals.temperature} | ${vitals.weight}</strong>
          </div>
        </div>
      </div>
      ` : ''}

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 15px; color: #0369a1; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px;">
          ⚠️ الحساسية والأمراض المزمنة
        </h2>
        <p style="margin-bottom: 6px; font-size: 13px;"><strong>الحساسية الدوائية/الغذائية:</strong> ${patient.allergies?.join(' ، ') || 'لا يوجد حساسيات مسجلة'}</p>
        <p style="font-size: 13px;"><strong>الأمراض المزمنة والتشخيص:</strong> ${patient.chronicConditions?.join(' ، ') || 'لا يوجد أمراض مزمنة'}</p>
      </div>

      ${patient.medicalHistory && patient.medicalHistory.length > 0 ? `
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 15px; color: #0369a1; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px;">
          📜 السجل الطبي والسيرة المرضية
        </h2>
        <ul style="padding-right: 20px; font-size: 13px;">
          ${patient.medicalHistory.map((h: string) => `<li style="margin-bottom: 6px;">${h}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      ${scans.length > 0 ? `
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 15px; color: #0369a1; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px;">
          📁 الأرشيف والأشعة المرفقة (${scans.length})
        </h2>
        <ul style="padding-right: 20px; font-size: 13px;">
          ${scans.map((s: any) => `<li style="margin-bottom: 4px;">${s.name} - ${s.date} (${s.size})</li>`).join('')}
        </ul>
      </div>
      ` : ''}
    `;

    printAndExportPdf({
      title: `التقرير الطبي الشامل - ${patient.fullName}`,
      documentNumber: patient.fileNumber,
      date: new Date().toISOString().split('T')[0],
      patientName: patient.fullName,
      detailsHtml,
    });

    onShowToast?.(`تم فتح نافذة الطباعة والتصدير صيغة PDF لـ (${patient.fullName})`, 'success');
  };

  const handleSubmitNewPatient = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const validation = validatePatientForm(
      {
        fullName: formData.fullName,
        nationalId: formData.nationalId,
        age: formData.age,
        gender: formData.gender,
        bloodType: formData.bloodType,
        phone: formData.phone,
        insuranceNumber: formData.insuranceNumber,
        allergiesInput: formData.allergiesInput,
      },
      patients
    );

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      onShowToast?.(`تنبيه التحقق من البيانات: ${firstError}`, 'error');
      return;
    }

    onAddPatient({
      fullName: formData.fullName.trim(),
      nationalId: formData.nationalId.trim(),
      age: Number(formData.age),
      gender: formData.gender,
      bloodType: formData.bloodType,
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      emergencyContact: formData.emergencyContact.trim(),
      insuranceProvider: formData.insuranceProvider.trim(),
      insuranceNumber: formData.insuranceNumber.trim(),
      medicalHistory: formData.medicalHistoryInput ? formData.medicalHistoryInput.split(',').map(s => s.trim()).filter(Boolean) : ['لا يوجد تدوين'],
      activeAllergies: formData.allergiesInput ? formData.allergiesInput.split(',').map(s => s.trim()).filter(Boolean) : ['لا يوجد حساسية معروفة'],
      vitals: { bloodPressure: '120/80', heartRate: 75, temperature: 37.0, weight: 70 },
    });

    onShowToast?.(`تم تسجيل المريض (${formData.fullName}) بنجاح والتحقق من سلامة كافة البيانات!`, 'success');

    setShowAddModal(false);
    setFormErrors({});
    setFormData({
      fullName: '',
      nationalId: '',
      age: 30,
      gender: 'ذكر',
      bloodType: 'A+',
      phone: '',
      address: '',
      emergencyContact: '',
      insuranceProvider: 'التعاونية للتأمين',
      insuranceNumber: '',
      medicalHistoryInput: '',
      allergiesInput: '',
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-bold text-white">إدارة المرضى والملفات الطبية</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            إجمالي المرضى المسجلين بالنظام: <span className="font-bold text-sky-400">{patients.length} مريض</span>
          </p>
        </div>

        {canAddPatient && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 transition-all hover:scale-105 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مريض جديد</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        
        {/* Search Input */}
        <div className="relative sm:col-span-2">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث بالاسم، رقم الملف (MED-...)، رقم الهوية، أو الهاتف..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Blood Group Filter */}
        <select
          value={selectedBlood}
          onChange={(e) => setSelectedBlood(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
        >
          <option value="all">كافة فصائل الدم (All Blood Types)</option>
          <option value="A+">فصيلة A+</option>
          <option value="A-">فصيلة A-</option>
          <option value="B+">فصيلة B+</option>
          <option value="B-">فصيلة B-</option>
          <option value="AB+">فصيلة AB+</option>
          <option value="AB-">فصيلة AB-</option>
          <option value="O+">فصيلة O+</option>
          <option value="O-">فصيلة O-</option>
        </select>

      </div>

      {/* Patients Data Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs text-slate-300">
            <thead className="bg-slate-800 text-slate-400 font-bold border-b border-slate-700">
              <tr>
                <th className="p-4 w-10 text-center">#</th>
                <th className="p-4">رقم الملف الطبي</th>
                <th className="p-4">اسم المريض</th>
                <th className="p-4">الهوية / الإقامة</th>
                <th className="p-4">العمر / الجنس</th>
                <th className="p-4">فصيلة الدم</th>
                <th className="p-4">رقم الهاتف</th>
                <th className="p-4">شركة التأمين</th>
                <th className="p-4">آخر زيارة</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    لا يوجد مرضى مطابقين لشرط البحث حالياً.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const isExpanded = expandedPatientId === patient.id;
                  return (
                    <React.Fragment key={patient.id}>
                      <tr 
                        onClick={() => setExpandedPatientId(isExpanded ? null : patient.id)}
                        className={`hover:bg-slate-800/60 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-800/40 border-l-4 border-sky-500' : ''}`}
                      >
                        <td className="p-4 text-center text-slate-400">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedPatientId(isExpanded ? null : patient.id);
                            }}
                            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-sky-400 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-sky-400" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>

                        <td className="p-4 font-mono font-bold text-sky-400">
                          {patient.fileNumber}
                        </td>

                        <td className="p-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sky-300 text-xs">
                              {patient.fullName.charAt(0)}
                            </div>
                            <span>{patient.fullName}</span>
                          </div>
                        </td>

                        <td className="p-4 font-mono text-slate-400">
                          {patient.nationalId}
                        </td>

                        <td className="p-4">
                          {patient.age} سنة ({patient.gender})
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                            {patient.bloodType}
                          </span>
                        </td>

                        <td className="p-4 font-mono text-slate-300">
                          {patient.phone}
                        </td>

                        <td className="p-4 text-slate-300">
                          {patient.insuranceProvider || 'سداد نقدي'}
                        </td>

                        <td className="p-4 text-slate-400">
                          {patient.lastVisitDate}
                        </td>

                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedPatient(patient)}
                              className="px-2.5 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 font-semibold transition-all flex items-center gap-1 text-xs cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>الملف</span>
                            </button>

                            <button
                              onClick={() => setSelectedDischargePatient(patient)}
                              className={`px-2.5 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-1 text-xs cursor-pointer ${
                                dischargeSummaries[patient.id]
                                  ? 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/40'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                              }`}
                              title="تقرير الخروج الطبي (Discharge Summary)"
                            >
                              <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{dischargeSummaries[patient.id] ? 'تقرير ✓' : 'تقرير خروج'}</span>
                            </button>

                            {onArchivePatient && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`هل ترغب في نقل ملف المريض (${patient.fullName}) إلى الأرشيف والتخزين البارد؟`)) {
                                    onArchivePatient(patient.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all cursor-pointer"
                                title="نقل الملف للأرشيف والتخزين البارد (Cold Storage)"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {onDeletePatient && (
                              <button
                                type="button"
                                onClick={() => onDeletePatient(patient.id)}
                                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
                                title="حذف الملف الطبي"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Quick Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-950/70 border-b-2 border-sky-500/30">
                          <td colSpan={10} className="p-4 sm:p-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              
                              {/* Vitals */}
                              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                                <h4 className="font-bold text-sky-400 flex items-center gap-1.5">
                                  <Activity className="w-4 h-4" />
                                  <span>العلامات الحيوية الأخيرة</span>
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-slate-300">
                                  <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[11px]">ضغط الدم:</span>
                                    <strong className="font-mono text-emerald-400">{patient.bloodPressure || '120/80 mmHg'}</strong>
                                  </div>
                                  <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[11px]">النبض:</span>
                                    <strong className="font-mono text-sky-400">{patient.heartRate || '74 bpm'}</strong>
                                  </div>
                                  <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[11px]">الحرارة:</span>
                                    <strong className="font-mono text-amber-400">{patient.temperature || '37.0 °C'}</strong>
                                  </div>
                                  <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[11px]">الوزن والطول:</span>
                                    <strong className="font-mono text-indigo-300">{patient.weight || '72'} كغ / {patient.height || '175'} سم</strong>
                                  </div>
                                </div>
                              </div>

                              {/* Medical Alert & Allergies */}
                              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                                <h4 className="font-bold text-rose-400 flex items-center gap-1.5">
                                  <ShieldAlert className="w-4 h-4" />
                                  <span>الحساسية والأمراض المزمنة</span>
                                </h4>
                                <div className="space-y-1.5">
                                  <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[11px]">الأمراض المزمنة:</span>
                                    <p className="text-slate-200">{patient.chronicDiseases?.join('، ') || 'لا توجد أمراض مزمنة مسجلة'}</p>
                                  </div>
                                  <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                                    <span className="text-slate-400 block text-[11px]">الحساسية الدوائية:</span>
                                    <p className="text-rose-300 font-semibold">{patient.allergies?.join('، ') || 'لا توجد حساسية معروفة'}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Quick Actions & Follow up */}
                              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between">
                                <div>
                                  <h4 className="font-bold text-purple-400 flex items-center gap-1.5 mb-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>الموقع والتواصل العائلي</span>
                                  </h4>
                                  <p className="text-slate-300 text-[11px] mb-1">
                                    <strong className="text-slate-400">العنوان:</strong> {patient.address || 'دمشق - سوريا'}
                                  </p>
                                  <p className="text-slate-300 text-[11px]">
                                    <strong className="text-slate-400">طوارئ الأقارب:</strong> {patient.emergencyContact || '0944112233 (أحد الأقارب)'}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                                  <button
                                    onClick={() => setSelectedPatient(patient)}
                                    className="flex-1 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-center transition-colors cursor-pointer"
                                  >
                                    معاينة السجل الشامل
                                  </button>
                                  <button
                                    onClick={() => setSelectedDischargePatient(patient)}
                                    className="py-1.5 px-3 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 font-bold transition-colors cursor-pointer"
                                  >
                                    تعديل تقرير الخروج
                                  </button>
                                </div>
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

      {/* Comprehensive Patient Medical History Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl text-right p-6 space-y-6 text-slate-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xl">
                  {selectedPatient.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedPatient.fullName}</h3>
                  <p className="text-xs text-sky-400 font-mono">الملف الطبي: {selectedPatient.fileNumber} | الهوية: {selectedPatient.nationalId}</p>
                </div>
              </div>

              <button onClick={() => setSelectedPatient(null)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs & Export Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full sm:w-auto">
                <button
                  onClick={() => setActiveModalTab('info')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeModalTab === 'info'
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  البيانات السريرية والمؤشرات
                </button>
                <button
                  onClick={() => setActiveModalTab('scans')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeModalTab === 'scans'
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileUp className="w-3.5 h-3.5 text-sky-300" />
                  <span>الأشعة والتقارير المرفقة ({(patientFiles[selectedPatient.id] || []).length})</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedDischargePatient(selectedPatient)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  <span>{dischargeSummaries[selectedPatient.id] ? 'تقرير الخروج الطبي (معتمد ✓)' : 'إنشاء تقرير خروج طبي'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportPDF(selectedPatient)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all hover:border-sky-500/50 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير الملف الطبي PDF</span>
                </button>
              </div>
            </div>

            {/* TAB 1: CLINICAL INFO & VITALS */}
            {activeModalTab === 'info' && (
              <div className="space-y-6">
                {/* Patient Vitals Cards */}
                {selectedPatient.vitals && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span>المؤشرات الحيوية الأخيرة (Vital Signs)</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                        <span className="text-slate-400 block mb-1">ضغط الدم (BP)</span>
                        <span className="font-black text-emerald-400 text-base">{selectedPatient.vitals.bloodPressure}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                        <span className="text-slate-400 block mb-1">نبضات القلب (HR)</span>
                        <span className="font-black text-sky-400 text-base">{selectedPatient.vitals.heartRate} bpm</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                        <span className="text-slate-400 block mb-1">الحرارة (Temp)</span>
                        <span className="font-black text-amber-400 text-base">{selectedPatient.vitals.temperature} °C</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                        <span className="text-slate-400 block mb-1">الوزن (Weight)</span>
                        <span className="font-black text-purple-400 text-base">{selectedPatient.vitals.weight} kg</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Medical History & Allergies */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Medical History */}
                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2">
                    <h5 className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-sky-400" />
                      <span>التاريخ المرضي الموثق</span>
                    </h5>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {selectedPatient.medicalHistory.map((hist, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                          <span>{hist}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Active Allergies */}
                  <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-2">
                    <h5 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>الحساسية الدوائية والغذائية المسجلة</span>
                    </h5>
                    <ul className="space-y-1 text-xs text-rose-200">
                      {selectedPatient.activeAllergies.map((alg, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          <span>{alg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Contact & Insurance Info */}
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">العنوان والتواصل:</span>
                    <p className="font-semibold text-slate-200 mt-0.5">{selectedPatient.address}</p>
                    <p className="text-sky-400 font-mono mt-0.5">{selectedPatient.phone}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block">التأمين الطبي:</span>
                    <p className="font-semibold text-emerald-400 mt-0.5">{selectedPatient.insuranceProvider}</p>
                    <p className="text-slate-300 font-mono text-[11px] mt-0.5">رقم البوليصة: {selectedPatient.insuranceNumber}</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MEDICAL SCANS & FILES UPLOAD WITH PREVIEW */}
            {activeModalTab === 'scans' && (
              <div className="space-y-5">
                {/* File Upload Zone */}
                <div className="p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-sky-500/80 bg-slate-950/60 transition-all text-center flex flex-col items-center justify-center gap-3 group">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/30 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-white">إرفاق تقرير طبي أو أشعة سينية / تحاليل جديدة</h5>
                    <p className="text-xs text-slate-400 mt-1">يدعم الصور (PNG, JPG, JPEG) والمستندات الطبية (PDF)</p>
                  </div>
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 transition-all">
                    <span>اختر ملف للرفع والمعاينة</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(selectedPatient.id, e)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Uploaded Files Gallery & List */}
                <div>
                  <h5 className="text-xs font-bold text-slate-300 mb-3">
                    الملفات المرفقة المسجلة للمريض ({ (patientFiles[selectedPatient.id] || []).length })
                  </h5>

                  {(!patientFiles[selectedPatient.id] || patientFiles[selectedPatient.id].length === 0) ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-800/40 rounded-2xl border border-slate-800 text-xs">
                      لا توجد مرفقات أو صور أشعة مرفوعة حتى الآن لهذا المريض.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {patientFiles[selectedPatient.id].map((file) => (
                        <div key={file.id} className="p-3 bg-slate-800/80 border border-slate-700 rounded-2xl flex flex-col justify-between gap-3 group hover:border-sky-500/50 transition-all">
                          {/* File Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden">
                              {file.type === 'image' ? (
                                <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                              )}
                              <span className="text-xs font-bold text-white truncate" title={file.name}>
                                {file.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{file.size}</span>
                          </div>

                          {/* Image Preview Container */}
                          {file.type === 'image' && (
                            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 h-32 flex items-center justify-center group/img">
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setPreviewImage(file.url)}
                                  className="p-2 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center gap-1 shadow-lg"
                                >
                                  <Maximize2 className="w-4 h-4" />
                                  <span>توسيع والمعاينة</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* File Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs">
                            <span className="text-[10px] text-slate-400">تاريخ الرفع: {file.date}</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onShowToast?.(`جاري تحميل الملف (${file.name})...`, 'download')}
                                className="p-1.5 rounded-lg bg-sky-600/20 text-sky-300 hover:bg-sky-600 hover:text-white transition-colors"
                                title="تحميل الملف"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemoveFile(selectedPatient.id, file.id)}
                                className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-600 hover:text-white transition-colors"
                                title="حذف المرفق"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer Close */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                إغلاق الملف
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Fullscreen Image Preview Lightbox */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white shadow-xl"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage}
              alt="معاينة المرفق الطبي"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl border border-slate-700 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Add New Patient Multi-Step Wizard Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-right p-6 space-y-6 text-slate-800 dark:text-slate-100">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-sky-500" />
                  <span>تسجيل ملف مريض جديد (معالج الإدخال المنظم)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  إدخال بيانات المريض عبر 3 خطوات سهلة للتحقق من الدقة الطبية
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setFormStep(1);
                  setFormErrors({});
                }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormStep(1)}
                className={`p-2.5 rounded-xl border text-start transition-all ${
                  formStep === 1
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 font-bold'
                    : formStep > 1
                      ? 'border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    formStep === 1 ? 'bg-sky-500 text-white' : formStep > 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                  }`}>
                    {formStep > 1 ? '✓' : '1'}
                  </span>
                  <span className="text-xs truncate">1. البيانات الشخصية</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (formData.fullName && formData.nationalId && formData.phone) setFormStep(2);
                  else handleSubmitNewPatient({ preventDefault: () => {} } as any);
                }}
                className={`p-2.5 rounded-xl border text-start transition-all ${
                  formStep === 2
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 font-bold'
                    : formStep > 2
                      ? 'border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    formStep === 2 ? 'bg-sky-500 text-white' : formStep > 2 ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                  }`}>
                    {formStep > 2 ? '✓' : '2'}
                  </span>
                  <span className="text-xs truncate">2. السجل الطبي</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (formData.fullName && formData.nationalId && formData.phone) setFormStep(3);
                }}
                className={`p-2.5 rounded-xl border text-start transition-all ${
                  formStep === 3
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    formStep === 3 ? 'bg-sky-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                  }`}>
                    3
                  </span>
                  <span className="text-xs truncate">3. التأمين والمراجعة</span>
                </div>
              </button>
            </div>

            <form onSubmit={handleSubmitNewPatient} className="space-y-4 text-xs">
              
              {/* Validation Warning Alert if Errors exist */}
              {Object.keys(formErrors).length > 0 && (
                <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-xs">يرجى تصحيح الأخطاء التالية للمتابعة:</span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-rose-600 dark:text-rose-200">
                      {Object.values(formErrors).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* STEP 1: Basic Info */}
              {formStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">الاسم الرباعي للمريض *</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: عبد الله خالد العتيبي"
                        value={formData.fullName}
                        onChange={(e) => {
                          setFormData({ ...formData, fullName: e.target.value });
                          if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: '' });
                        }}
                        className={`w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                          formErrors.fullName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                        } text-slate-900 dark:text-white focus:outline-none focus:border-sky-500`}
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">رقم الهوية / الإقامة *</label>
                      <input
                        type="text"
                        required
                        placeholder="10XXXXXXXX"
                        value={formData.nationalId}
                        onChange={(e) => {
                          setFormData({ ...formData, nationalId: e.target.value });
                          if (formErrors.nationalId) setFormErrors({ ...formErrors, nationalId: '' });
                        }}
                        className={`w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                          formErrors.nationalId ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                        } text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 font-mono`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">العمر *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="120"
                        value={formData.age}
                        onChange={(e) => {
                          setFormData({ ...formData, age: Number(e.target.value) });
                          if (formErrors.age) setFormErrors({ ...formErrors, age: '' });
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">الجنس *</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                      >
                        <option value="ذكر">ذكر</option>
                        <option value="أنثى">أنثى</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">رقم الهاتف والتواصل *</label>
                      <input
                        type="text"
                        required
                        placeholder="09XXXXXXXX"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">العنوان السكني</label>
                    <input
                      type="text"
                      placeholder="المدينة، الحي، رقم المبنى..."
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Medical & Allergies */}
              {formStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">فصيلة الدم *</label>
                    <select
                      value={formData.bloodType}
                      onChange={(e) => setFormData({ ...formData, bloodType: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 font-black text-sm focus:outline-none focus:border-sky-500"
                    >
                      <option value="A+">A+ (موجب)</option>
                      <option value="A-">A- (سالب)</option>
                      <option value="B+">B+ (موجب)</option>
                      <option value="B-">B- (سالب)</option>
                      <option value="AB+">AB+ (موجب)</option>
                      <option value="AB-">AB- (سالب)</option>
                      <option value="O+">O+ (موجب)</option>
                      <option value="O-">O- (سالب)</option>
                    </select>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-2">
                    <label className="block text-amber-800 dark:text-amber-300 font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>الحساسية الدوائية والغذائية (تحذير سريري حرج)</span>
                      </span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">يمنع صرف أدوية تتعارض معها</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: بنسلين (Penicillin)، أسبرين، سلفا، مشتقات القمح..."
                      value={formData.allergiesInput}
                      onChange={(e) => setFormData({ ...formData, allergiesInput: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">التاريخ المرضي والعمليات السابقة (مفصولة بفاصلة)</label>
                    <input
                      type="text"
                      placeholder="مثال: ارتفاع ضغط الدم، سكري نوع 2، استئصال زائدة 2021"
                      value={formData.medicalHistoryInput}
                      onChange={(e) => setFormData({ ...formData, medicalHistoryInput: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Insurance, Emergency & Summary Review */}
              {formStep === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">شركة التأمين الطبي</label>
                      <input
                        type="text"
                        placeholder="مثال: التعاونية للتأمين، بوبا، التكافل..."
                        value={formData.insuranceProvider}
                        onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">رقم بطاقة التأمين</label>
                      <input
                        type="text"
                        placeholder="مثال: INS-984210"
                        value={formData.insuranceNumber}
                        onChange={(e) => setFormData({ ...formData, insuranceNumber: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">جهة الاتصال للطوارئ (الاسم ورقم الهاتف)</label>
                    <input
                      type="text"
                      placeholder="مثال: الأخ / خالد العتيبي - 0988776655"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Summary Card Before Submission */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 block uppercase">ملخص المريض قبل الحفظ</span>
                    <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-200">
                      <div><strong>الاسم:</strong> {formData.fullName || '—'}</div>
                      <div><strong>الهوية:</strong> {formData.nationalId || '—'}</div>
                      <div><strong>الهاتف:</strong> {formData.phone || '—'}</div>
                      <div><strong>فصيلة الدم:</strong> {formData.bloodType}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Navigation Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                {formStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setFormStep((prev) => (prev - 1) as any)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                  >
                    السابق
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormStep(1);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                  >
                    إلغاء
                  </button>
                )}

                {formStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (formStep === 1) {
                        if (!formData.fullName.trim() || !formData.nationalId.trim() || !formData.phone.trim()) {
                          handleSubmitNewPatient({ preventDefault: () => {} } as any);
                          return;
                        }
                      }
                      setFormStep((prev) => (prev + 1) as any);
                    }}
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md shadow-sky-600/30 flex items-center gap-1.5"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد وحفظ ملف المريض</span>
                  </button>
                )}
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Discharge Summary Modal */}
      {selectedDischargePatient && (
        <DischargeSummaryModal
          patient={selectedDischargePatient}
          doctors={doctors}
          existingSummary={dischargeSummaries[selectedDischargePatient.id] || null}
          onSaveSummary={handleSaveDischargeSummary}
          onClose={() => setSelectedDischargePatient(null)}
        />
      )}

    </div>
  );
};
