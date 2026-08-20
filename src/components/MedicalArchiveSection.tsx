import React, { useState } from 'react';
import { ArchivedRecord, Patient, UserRole, Doctor } from '../types';
import { printAndExportPdf } from '../utils/pdfExport';
import { 
  Archive, 
  Search, 
  Filter, 
  Download, 
  RotateCcw, 
  Eye, 
  FileText, 
  HardDrive, 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  Building2, 
  Stethoscope, 
  User, 
  X,
  FileCheck2,
  Lock,
  Layers,
  ArrowDownToLine,
  Printer
} from 'lucide-react';

interface MedicalArchiveSectionProps {
  userRole?: UserRole;
  archivedRecords: ArchivedRecord[];
  activePatients: Patient[];
  doctors: Doctor[];
  onArchivePatient: (patientId: string, reason: ArchivedRecord['archiveReason'], notes?: string) => void;
  onRestorePatient: (archiveId: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const MedicalArchiveSection: React.FC<MedicalArchiveSectionProps> = ({
  userRole = 'admin',
  archivedRecords,
  activePatients,
  doctors,
  onArchivePatient,
  onRestorePatient,
  onShowToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedReason, setSelectedReason] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [viewRecord, setViewRecord] = useState<ArchivedRecord | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  // Archive Form state
  const [formPatientId, setFormPatientId] = useState('');
  const [formReason, setFormReason] = useState<ArchivedRecord['archiveReason']>('تخريج واستقرار');
  const [formNotes, setFormNotes] = useState('');

  // Calculations
  const totalArchived = archivedRecords.length;
  const totalStorageKb = archivedRecords.reduce((acc, r) => acc + (r.fileSizeKb || 1024), 0);
  const totalStorageMb = (totalStorageKb / 1024).toFixed(2);
  const coldStorageCount = archivedRecords.filter(r => r.storageTier === 'cold_storage').length;
  const deepArchiveCount = archivedRecords.filter(r => r.storageTier === 'glacier_deep_archive').length;

  // Filtered records
  const filteredRecords = archivedRecords.filter(record => {
    if (selectedYear !== 'all') {
      const recYear = record.dischargeDate.split('-')[0];
      if (recYear !== selectedYear) return false;
    }
    if (selectedReason !== 'all' && record.archiveReason !== selectedReason) return false;
    if (selectedTier !== 'all' && record.storageTier !== selectedTier) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = record.fullName.toLowerCase().includes(q);
      const matchId = record.nationalId.includes(q);
      const matchFile = record.fileNumber.toLowerCase().includes(q);
      const matchDoc = record.attendingDoctor.toLowerCase().includes(q);
      const matchDiag = record.dischargeDiagnosis.toLowerCase().includes(q);
      const matchDept = record.department.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchFile && !matchDoc && !matchDiag && !matchDept) return false;
    }
    return true;
  });

  const handleArchiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientId) return;

    const patient = activePatients.find(p => p.id === formPatientId);
    if (!patient) return;

    onArchivePatient(formPatientId, formReason, formNotes);
    setShowArchiveModal(false);
    setFormPatientId('');
    setFormNotes('');
  };

  const handlePrintRecord = (record: ArchivedRecord) => {
    const detailsHtml = `
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #0f172a; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">البيانات التعريفية للمريض</h3>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px; font-weight: bold; width: 25%;">اسم المريض:</td>
            <td style="padding: 6px;">${record.fullName}</td>
            <td style="padding: 6px; font-weight: bold; width: 25%;">الرقم الوطني:</td>
            <td style="padding: 6px;">${record.nationalId}</td>
          </tr>
          <tr>
            <td style="padding: 6px; font-weight: bold;">العمر / الجنس:</td>
            <td style="padding: 6px;">${record.age} سنة / ${record.gender}</td>
            <td style="padding: 6px; font-weight: bold;">زمرة الدم:</td>
            <td style="padding: 6px;">${record.bloodType}</td>
          </tr>
          <tr>
            <td style="padding: 6px; font-weight: bold;">فترة الإقامة:</td>
            <td style="padding: 6px;">من ${record.admissionDate} إلى ${record.dischargeDate}</td>
            <td style="padding: 6px; font-weight: bold;">القسم المعالج:</td>
            <td style="padding: 6px;">${record.department}</td>
          </tr>
          <tr>
            <td style="padding: 6px; font-weight: bold;">الطبيب المشرف:</td>
            <td style="padding: 6px;">${record.attendingDoctor}</td>
            <td style="padding: 6px; font-weight: bold;">سبب الأرشفة:</td>
            <td style="padding: 6px;">${record.archiveReason}</td>
          </tr>
        </table>
      </div>

      <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #0f172a; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">التشخيص السريري عند الخروج</h3>
        <p style="font-size: 13px; line-height: 1.6; margin: 5px 0;">${record.dischargeDiagnosis}</p>
        
        <h3 style="margin-top: 15px; color: #0f172a; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">ملخص المسار العلاجي والإقامة</h3>
        <p style="font-size: 13px; line-height: 1.6; margin: 5px 0;">${record.medicalSummary}</p>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-top: 20px; border-top: 1px solid #cbd5e1; padding-top: 10px;">
        <span>تاريخ النقل للأرشيف: ${record.archivedDate}</span>
        <span>فئة التخزين: ${record.storageTier === 'cold_storage' ? 'تخزين بارد فوري' : 'أرشيف جليدي عميق'}</span>
        <span>سعة التخزين: ${(record.fileSizeKb / 1024).toFixed(1)} MB</span>
      </div>
    `;

    printAndExportPdf({
      title: 'سجل الأرشيف الطبي السريري (Cold Storage Medical Archive)',
      documentNumber: record.id,
      date: record.archivedDate,
      patientName: record.fullName,
      doctorName: record.attendingDoctor,
      specialty: record.department,
      detailsHtml,
    });

    onShowToast?.(`تم تصدير وطباعة الملف الأرشيفي للمريض (${record.fullName})`, 'download');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Archive className="w-4 h-4" />
              <span>مساحة التخزين الباردة والأرشفة الطبية (Cold Storage & Data Partitioning)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">أرشيف السجلات الطبية القديمة</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              عزل وأرشفة إقامات وسجلات المرضى المنتهية في مساحة تخزين سريعة وآمنة لتسريع أداء النظام والاستعلامات اليومية
            </p>
          </div>

          {/* Action to Archive New Patient */}
          {(userRole === 'admin' || userRole === 'staff' || userRole === 'doctor') && (
            <button
              onClick={() => setShowArchiveModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <Archive className="w-4 h-4" />
              <span>أرشفة سجل مريض حالي</span>
            </button>
          )}
        </div>

        {/* Statistical KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>إجمالي السجلات المؤرشفة</span>
            </div>
            <div className="text-xl font-mono font-black text-white">{totalArchived} <span className="text-xs text-slate-400 font-normal">سجل</span></div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <HardDrive className="w-3.5 h-3.5 text-sky-400" />
              <span>حجم البيانات بالأرشيف</span>
            </div>
            <div className="text-xl font-mono font-black text-sky-300">{totalStorageMb} <span className="text-xs text-slate-400 font-normal">MB</span></div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>تخزين بارد نشط (Cold)</span>
            </div>
            <div className="text-xl font-mono font-black text-emerald-400">{coldStorageCount} <span className="text-xs text-slate-400 font-normal">سجل</span></div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>أرشيف عميق (Deep Glacier)</span>
            </div>
            <div className="text-xl font-mono font-black text-purple-400">{deepArchiveCount} <span className="text-xs text-slate-400 font-normal">سجل</span></div>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالاسم، الرقم الوطني، رقم الملف، الطبيب، التشخيص..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Year Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400">السنة:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">كافة السنوات</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>

          {/* Reason Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400">السبب:</span>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">جميع الأسباب</option>
              <option value="تخريج واستقرار">تخريج واستقرار</option>
              <option value="نقل لمشفى آخر">نقل لمشفى آخر</option>
              <option value="أرشفة دورية قديمة">أرشفة دورية قديمة</option>
            </select>
          </div>

          {/* Storage Tier */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400">الفئة:</span>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">كافة الفئات</option>
              <option value="cold_storage">تخزين بارد (Cold)</option>
              <option value="glacier_deep_archive">أرشيف عميق (Deep)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Archive Records Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">رقم السجل / الملف</th>
                <th className="py-3.5 px-4">المريض</th>
                <th className="py-3.5 px-4">فترة الإقامة</th>
                <th className="py-3.5 px-4">القسم والطبيب</th>
                <th className="py-3.5 px-4">سبب الأرشفة والتشخيص</th>
                <th className="py-3.5 px-4">فئة التخزين</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Archive className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <span>لا توجد سجلات مؤرشفة مطابقة لمعايير البحث الحالية</span>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Record / File Numbers */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-indigo-400">{record.id}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{record.fileNumber}</div>
                    </td>

                    {/* Patient Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{record.fullName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{record.age} سنة • {record.gender}</span>
                        <span className="font-mono text-sky-400 font-semibold">({record.bloodType})</span>
                      </div>
                    </td>

                    {/* Stay Period */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-slate-200">{record.admissionDate}</div>
                      <div className="text-[11px] text-slate-400 font-mono">إلى {record.dischargeDate}</div>
                    </td>

                    {/* Department & Doctor */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">{record.department}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Stethoscope className="w-3 h-3 text-sky-400" />
                        <span>{record.attendingDoctor}</span>
                      </div>
                    </td>

                    {/* Diagnosis & Archive Reason */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-200 truncate" title={record.dischargeDiagnosis}>
                        {record.dischargeDiagnosis}
                      </div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {record.archiveReason}
                      </span>
                    </td>

                    {/* Storage Tier */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${record.storageTier === 'cold_storage' ? 'bg-emerald-400' : 'bg-purple-400'}`} />
                        <span className="font-medium text-[11px]">
                          {record.storageTier === 'cold_storage' ? 'Cold Storage' : 'Deep Archive'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{(record.fileSizeKb / 1024).toFixed(1)} MB</div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewRecord(record)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="عرض التفاصيل الأرشيفية الكاملة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintRecord(record)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-sky-600 text-sky-400 hover:text-white transition-colors cursor-pointer"
                          title="طباعة وتصدير الملف الطبي الأرشيفي (PDF)"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {(userRole === 'admin' || userRole === 'staff') && (
                          <button
                            onClick={() => {
                              if (confirm(`هل ترغب في استرجاع وإعادة تنشيط ملف المريض (${record.fullName}) إلى النظام النشط؟`)) {
                                onRestorePatient(record.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-colors cursor-pointer"
                            title="استرجاع السجل وإعادة الدخول للنظام اليومي (Re-admit)"
                          >
                            <RotateCcw className="w-4 h-4" />
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

      {/* VIEW ARCHIVE RECORD DETAIL MODAL */}
      {viewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <Archive className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-black text-white text-base">الملف الطبي الأرشيفي: {viewRecord.fullName}</h3>
                  <p className="text-xs text-slate-400 font-mono">رقم السجل: {viewRecord.id} | الملف: {viewRecord.fileNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setViewRecord(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Patient Basic Info Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">الرقم الوطني:</span>
                  <p className="font-mono font-bold text-white mt-0.5">{viewRecord.nationalId}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">العمر / الجنس:</span>
                  <p className="font-bold text-white mt-0.5">{viewRecord.age} سنة ({viewRecord.gender})</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">زمرة الدم:</span>
                  <p className="font-mono font-bold text-sky-400 mt-0.5">{viewRecord.bloodType}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">رقم الهاتف:</span>
                  <p className="font-mono text-slate-300 mt-0.5">{viewRecord.phone}</p>
                </div>
              </div>

              {/* Admission and Stay Details */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-white">{viewRecord.department}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Stethoscope className="w-3.5 h-3.5 text-indigo-400" />
                    <span>الطبيب المشرف: {viewRecord.attendingDoctor}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                  <div>تاريخ الدخول: <span className="font-mono text-slate-200 font-bold">{viewRecord.admissionDate}</span></div>
                  <div>تاريخ الخروج: <span className="font-mono text-slate-200 font-bold">{viewRecord.dischargeDate}</span></div>
                  <div>تاريخ الأرشفة: <span className="font-mono text-slate-200">{viewRecord.archivedDate}</span></div>
                  <div>سبب الأرشفة: <span className="text-indigo-300 font-bold">{viewRecord.archiveReason}</span></div>
                </div>
              </div>

              {/* Clinical Diagnoses & Medical Summary */}
              <div className="space-y-3 text-xs">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-indigo-300 block mb-1">التشخيص النهائي عند الخروج:</span>
                  <p className="text-slate-200 leading-relaxed">{viewRecord.dischargeDiagnosis}</p>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-sky-300 block mb-1">ملخص المسار العلاجي والإجراءات الجراحية السابقة:</span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{viewRecord.medicalSummary}</p>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintRecord(viewRecord)}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-sky-950/40 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة التقرير الأرشيفي</span>
                  </button>
                  {(userRole === 'admin' || userRole === 'staff') && (
                    <button
                      onClick={() => {
                        onRestorePatient(viewRecord.id);
                        setViewRecord(null);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>إعادة التنشيط (Re-admission)</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setViewRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  إغلاق
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ARCHIVE CURRENT PATIENT MODAL */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black text-white text-base">نقل ملف مريض إلى التخزين البارد الأرشيفي</h3>
              </div>
              <button
                onClick={() => setShowArchiveModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleArchiveSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">اختر المريض المراد أرشفة ملفه *</label>
                <select
                  value={formPatientId}
                  onChange={(e) => setFormPatientId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- اختر المريض --</option>
                  {activePatients.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.fileNumber}) - آخر زيارة: {p.lastVisitDate}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">سبب الأرشفة *</label>
                <select
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="تخريج واستقرار">تخريج واستقرار الحالة السريرية</option>
                  <option value="نقل لمشفى آخر">نقل المريض لمشفى أو مركز آخر</option>
                  <option value="أرشفة دورية قديمة">أرشفة دورية لمرور أكثر من سنة على آخر زيارة</option>
                  <option value="وفاة">وفاة (رحمه الله)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">ملخص الخروج وملاحظات الأرشفة</label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="اكتب ملخصاً موجزاً عن الحالة والمسار العلاجي وتوصيات المتابعة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-[11px] text-indigo-200 leading-relaxed">
                ملاحظة: سيتم نقل هذا السجل بالكامل إلى مساحة التخزين الباردة (Cold Storage Partition)، مما يحافظ على السجل الطبي مع إبقائه متاحاً للاسترجاع الفوري في أي وقت عند إعادة دخول المريض.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowArchiveModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/50"
                >
                  تأكيد الأرشفة والنقل للتخزين البارد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
