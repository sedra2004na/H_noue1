import React, { useState } from 'react';
import { LabResult, Prescription, Patient, Doctor, UserRole, LabStatus } from '../types';
import { printAndExportPdf, exportLabResultToPdf } from '../utils/pdfExport';
import { formatArabicDate } from '../utils/arabicFormatters';
import { 
  FlaskConical, 
  FileText, 
  Printer, 
  Download,
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  Building2, 
  Stethoscope, 
  Pill, 
  X, 
  User, 
  Calendar, 
  Trash2,
  ChevronDown,
  ChevronUp,
  Activity,
  LineChart as ChartIcon,
  ShieldAlert,
  Info,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  checkDrugAllergyConflict,
  checkDrugDrugInteractions
} from '../utils/validation';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

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

  // Status Filter & Search
  const [labStatusFilter, setLabStatusFilter] = useState<string>('all');
  const [labSearchQuery, setLabSearchQuery] = useState<string>('');

  // Expanded Sub-components rows (e.g. Lipid panel)
  const [expandedLabIds, setExpandedLabIds] = useState<string[]>(['lab-1']); // Lipid profile open by default

  const toggleExpandLab = (id: string) => {
    setExpandedLabIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Selected test for longitudinal trend chart
  const [selectedChartLabId, setSelectedChartLabId] = useState<string>('lab-1');
  const [showTrendChart, setShowTrendChart] = useState<boolean>(true);

  // Lab Result Form State
  const [labForm, setLabForm] = useState({
    patientName: '',
    doctorName: '',
    testName: 'تحليل السكر التراكمي (HbA1c)',
    resultValue: '7.5 %',
    normalRange: '4.0 - 5.6 %',
    unit: '%',
    status: 'مرتفع' as LabStatus,
    notes: '',
  });

  // Prescription Form State
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

  const handleExportLabPdf = (lab: LabResult) => {
    exportLabResultToPdf(lab);
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
      testDate: new Date().toISOString().split('T')[0],
      issuedDate: new Date().toISOString().split('T')[0],
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

  // Filtered Lab Results
  const filteredLabResults = displayLabResults.filter(lab => {
    if (labStatusFilter !== 'all' && lab.status !== labStatusFilter) {
      if (labStatusFilter === 'مرتفع' && (lab.status === 'تحذير' || lab.status === 'مرتفع')) return true;
      return false;
    }
    if (labSearchQuery.trim()) {
      const q = labSearchQuery.toLowerCase();
      const matchName = lab.testName.toLowerCase().includes(q);
      const matchDoc = lab.doctorName.toLowerCase().includes(q);
      return matchName || matchDoc;
    }
    return true;
  });

  // Helper for unified status badges
  const renderStatusBadge = (status: LabStatus) => {
    switch (status) {
      case 'طبيعي':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>طبيعي</span>
          </span>
        );
      case 'مرتفع':
      case 'تحذير':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>مرتفع</span>
          </span>
        );
      case 'منخفض':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 whitespace-nowrap inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>منخفض</span>
          </span>
        );
      case 'حرج':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 whitespace-nowrap inline-flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>حرج</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  const chartLab = displayLabResults.find(l => l.id === selectedChartLabId) || displayLabResults[0];

  return (
    <div className="space-y-6">
      
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-bold text-white">
              {isPatientRole ? 'نتائجي المخبرية والوصفات الطبية' : 'المختبر الطبي والوصفات الإلكترونية'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isPatientRole 
              ? 'متابعة نتائج الفحوصات الطبية، الرسوم البيانية لتطور المؤشرات، والوصفات الدوائية' 
              : 'متابعة نتائج التحاليل المخبرية والوصفات الدوائية الصادرة'}
          </p>
        </div>

        <div className="flex items-center p-1 bg-slate-800 rounded-xl border border-slate-700 shrink-0">
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'lab' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            نتائج التحاليل المخبرية
          </button>
          <button
            onClick={() => setActiveTab('rx')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rx' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            الوصفات الطبية الإلكترونية
          </button>
        </div>
      </div>

      {/* Reassuring Clinical Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-sky-50/90 dark:bg-gradient-to-r dark:from-sky-950/60 dark:via-slate-900 dark:to-indigo-950/40 border border-sky-200 dark:border-sky-500/30 text-sky-950 dark:text-sky-200 text-xs flex items-start gap-3 shadow-sm dark:shadow-md" role="alert">
        <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30 shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <strong className="text-sky-950 dark:text-white font-black block text-sm">
            تنبيه طبي استرشادي:
          </strong>
          <p className="text-sky-900 dark:text-slate-300 leading-relaxed text-[11px] font-semibold">
            هذه النتائج المخبرية والمعلومات الإرشادية لا تغني بأي حال من الأحوال عن استشارة الطبيب المعالج والتقييم السريري المباشر. يرجى مراجعة عيادة الطبيب المختص لمناقشة الخطة العلاجية والدوائية.
          </p>
        </div>
      </div>

      {activeTab === 'lab' ? (
        /* Lab Results View */
        <div className="space-y-6">
          
          {/* Longitudinal Trend Chart (رسم بياني لتطور القيمة عبر الزمن) */}
          {chartLab && chartLab.historicalPoints && chartLab.historicalPoints.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <ChartIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>رسم بياني لتطور نتائج التحليل عبر الزمن</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-normal">
                        ميزة سريرية تتبعية
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      متابعة تحسن المؤشر الحيوي عبر الفحوصات الدورية
                    </p>
                  </div>
                </div>

                {/* Test Selector for Chart */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">التحليل المعروض:</span>
                  <select
                    value={selectedChartLabId}
                    onChange={(e) => setSelectedChartLabId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    {displayLabResults
                      .filter(l => l.historicalPoints && l.historicalPoints.length > 0)
                      .map(l => (
                        <option key={l.id} value={l.id}>
                          {l.testName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Chart Viewport */}
              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartLab.historicalPoints} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickFormatter={(val) => formatArabicDate(val, { compact: true })}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      domain={['auto', 'auto']}
                      unit={` ${chartLab.unit}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', textAlign: 'right' }}
                      formatter={(val: any) => [`${val} ${chartLab.unit}`, 'النتيجة المقاسة']}
                      labelFormatter={(lbl: any) => `تاريخ الفحص: ${formatArabicDate(lbl)}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#0ea5e9" 
                      strokeWidth={3} 
                      dot={{ fill: '#38bdf8', strokeWidth: 2, r: 5 }} 
                      activeDot={{ r: 7, fill: '#ffffff', stroke: '#0284c7' }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-300">النطاق الطبيعي المرجعي:</span>
                  <bdi dir="ltr" className="font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                    {chartLab.normalRange}
                  </bdi>
                </div>
                <span>النتيجة الأحدث: <strong className="text-white font-mono">{chartLab.resultValue}</strong> بتاريخ {formatArabicDate(chartLab.testDate)}</span>
              </div>
            </div>
          )}

          {/* Controls Bar: Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="بحث باسم التحليل أو الطبيب..."
                value={labSearchQuery}
                onChange={(e) => setLabSearchQuery(e.target.value)}
                className="w-full pr-10 pl-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] text-slate-400 shrink-0 ml-1">الحالة:</span>
              {[
                { id: 'all', label: 'الكل' },
                { id: 'طبيعي', label: 'طبيعي' },
                { id: 'مرتفع', label: 'مرتفع' },
                { id: 'حرج', label: 'حرج' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setLabStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    labStatusFilter === f.id
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {canAddLabResult && (
              <button
                onClick={() => setShowAddLabModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/30 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل نتيجة فحص جديد</span>
              </button>
            )}

          </div>

          {/* Lab Results Table */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs text-slate-300">
                <thead className="bg-slate-800 text-slate-400 font-bold border-b border-slate-700 whitespace-nowrap">
                  <tr>
                    <th className="p-4">اسم الفحص / التحليل</th>
                    {!isPatientRole && <th className="p-4">اسم المريض</th>}
                    <th className="p-4">الطبيب الموجه</th>
                    <th className="p-4">تاريخ سحب العينة</th>
                    <th className="p-4">تاريخ صدور النتيجة</th>
                    <th className="p-4">النتيجة المسجلة</th>
                    <th className="p-4">النطاق الطبيعي المرجعي</th>
                    <th className="p-4">تقييم النتيجة</th>
                    <th className="p-4 text-center">إجراءات التقرير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredLabResults.length === 0 ? (
                    <tr>
                      <td colSpan={isPatientRole ? 8 : 9} className="p-8 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                        <p className="font-bold text-slate-300">لا توجد نتائج تحاليل مطابقة للبحث المحدد</p>
                        <p className="text-[11px] text-slate-500 mt-1">تأكد من كتابة الكلمات بشكل صحيح أو إزالة الفلاتر.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLabResults.map((lab) => {
                      const hasSubComponents = lab.subComponents && lab.subComponents.length > 0;
                      const isExpanded = expandedLabIds.includes(lab.id);

                      return (
                        <React.Fragment key={lab.id}>
                          <tr className={`hover:bg-slate-800/50 transition-colors ${isExpanded ? 'bg-slate-800/30' : ''}`}>
                            <td className="p-4 font-bold text-white whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span>{lab.testName}</span>
                                {hasSubComponents && (
                                  <button
                                    onClick={() => toggleExpandLab(lab.id)}
                                    className="px-2 py-0.5 rounded-md bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                                    title="عرض الفروع والتفاصيل الدقيقة"
                                  >
                                    <span>{hasSubComponents ? `${lab.subComponents?.length} مكونات` : ''}</span>
                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </td>
                            {!isPatientRole && <td className="p-4 text-slate-200 whitespace-nowrap">{lab.patientName}</td>}
                            <td className="p-4 text-slate-400 whitespace-nowrap">{lab.doctorName}</td>
                            <td className="p-4 text-slate-300 whitespace-nowrap font-medium">{formatArabicDate(lab.testDate)}</td>
                            <td className="p-4 text-sky-300 whitespace-nowrap font-medium">{formatArabicDate(lab.issuedDate || lab.testDate)}</td>
                            
                            {/* Result Value with BiDi Safety */}
                            <td className="p-4 font-mono font-bold text-sky-300 whitespace-nowrap">
                              <bdi dir="ltr" className="inline-block font-mono">
                                {lab.resultValue}
                              </bdi>
                            </td>

                            {/* Normal Range with Strict BiDi Safety: < 200 mg/dL */}
                            <td className="p-4 font-mono text-slate-300 whitespace-nowrap">
                              <bdi dir="ltr" className="inline-block font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                                {lab.normalRange}
                              </bdi>
                            </td>

                            {/* Unified Semantic Status Badge */}
                            <td className="p-4 whitespace-nowrap">
                              {renderStatusBadge(lab.status)}
                            </td>

                            {/* Actions: Download PDF (Unified Download Icon and Text) */}
                            <td className="p-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleExportLabPdf(lab)}
                                  className="px-2.5 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 transition-all flex items-center gap-1.5 font-bold text-xs cursor-pointer"
                                  title="تصدير تقرير النتيجة كملف PDF رسمي"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>تصدير PDF</span>
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

                          {/* Expandable Sub-components Drawer (Lipid Panel Breakdown) */}
                          {hasSubComponents && isExpanded && (
                            <tr className="bg-slate-950/70">
                              <td colSpan={isPatientRole ? 8 : 9} className="p-4 border-t border-slate-800">
                                <div className="p-4 rounded-xl bg-slate-900 border border-sky-900/40 space-y-3">
                                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                    <div className="flex items-center gap-2">
                                      <Activity className="w-4 h-4 text-sky-400" />
                                      <h4 className="font-bold text-xs text-white">
                                        التفصيل المخبري لمكونات ({lab.testName}):
                                      </h4>
                                    </div>
                                    <span className="text-[11px] text-slate-400">
                                      تمت المعايرة السريرية في مختبر مشفى الرحمة
                                    </span>
                                  </div>

                                  <div className="overflow-x-auto">
                                    <table className="w-full text-right text-xs">
                                      <thead>
                                        <tr className="text-slate-400 text-[11px] border-b border-slate-800">
                                          <th className="pb-2">المكوّن المخبري</th>
                                          <th className="pb-2">النتيجة المقاسة</th>
                                          <th className="pb-2">النطاق الطبيعي المعتمد</th>
                                          <th className="pb-2">الوحدة</th>
                                          <th className="pb-2">الحالة السريرية</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-800/60 font-mono">
                                        {lab.subComponents?.map(sub => (
                                          <tr key={sub.id} className="hover:bg-slate-800/40">
                                            <td className="py-2.5 font-sans font-bold text-slate-200">
                                              {sub.name}
                                            </td>
                                            <td className="py-2.5 font-bold text-sky-300">
                                              <bdi dir="ltr" className="inline-block">
                                                {sub.resultValue}
                                              </bdi>
                                            </td>
                                            <td className="py-2.5 text-slate-300">
                                              <bdi dir="ltr" className="inline-block px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                                                {sub.normalRange}
                                              </bdi>
                                            </td>
                                            <td className="py-2.5 font-sans text-slate-400">
                                              {sub.unit}
                                            </td>
                                            <td className="py-2.5 font-sans">
                                              {renderStatusBadge(sub.status)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>

                                  {lab.notes && (
                                    <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-200 text-[11px] flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                      <span><strong>ملاحظة الطبيب / المختبر:</strong> {lab.notes}</span>
                                    </div>
                                  )}
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
                  <p><span className="text-slate-400">تاريخ الإصدار:</span> {formatArabicDate(rx.date)}</p>
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
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPrescription(null);
          }}
        >
          <div className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-2xl text-right flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-4 sm:p-5 border-b-2 border-slate-900 flex items-center justify-between shrink-0 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">
                  <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-black text-slate-900">مشفى الرحمة الطبي</h2>
                  <p className="text-[11px] sm:text-xs text-slate-600">Al-Rahma Hospital - الوصفة الطبية المعتمدة</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-left text-[11px] sm:text-xs text-slate-600 font-mono">
                  <p className="font-bold text-slate-900">رقم الوصفة: {selectedPrescription.id}</p>
                  <p>تاريخ الصدور: {formatArabicDate(selectedPrescription.date)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPrescription(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                  aria-label="إغلاق الوصفة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
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

              <div className="text-xs">
                <span className="text-slate-500 font-bold block mb-1">التشخيص الطبي الأولي:</span>
                <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-800">
                  {selectedPrescription.diagnosis}
                </p>
              </div>

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

              <div className="flex justify-between items-end pt-4 border-t border-slate-200 text-xs">
                <div className="max-w-xs">
                  <span className="text-slate-500 font-bold block">إرشادات واستعمال الدواء:</span>
                  <p className="text-slate-700 italic">{selectedPrescription.doctorInstructions}</p>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-dashed border-sky-600 rounded-full flex flex-col items-center justify-center text-[10px] text-sky-800 font-bold p-1">
                    <span>خاتم الطبيب المعالج</span>
                    <span className="text-[9px]">مشفى الرحمة</span>
                    <CheckCircle className="w-4 h-4 text-sky-600 mt-1" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 border-t border-slate-200 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedPrescription(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer transition-colors"
              >
                إغلاق
              </button>

              <button
                type="button"
                onClick={handlePrintPrescription}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
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
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddLabModal(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl text-right flex flex-col max-h-[90vh] overflow-hidden my-auto text-slate-900 dark:text-slate-200 text-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">تسجيل فحص مخبري جديد</h3>
              <button 
                type="button"
                onClick={() => setShowAddLabModal(false)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLabSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">اسم المريض *</label>
                  <input
                    type="text"
                    required
                    list="lab-patients-list"
                    placeholder="اكتب اسم المريض أو اختر من القائمة..."
                    value={labForm.patientName}
                    onChange={(e) => setLabForm({ ...labForm, patientName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
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
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">اسم التحليل المخبري *</label>
                  <input 
                    type="text" 
                    required 
                    value={labForm.testName} 
                    onChange={(e) => setLabForm({...labForm, testName: e.target.value})} 
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">نتيجة الفحص *</label>
                    <input 
                      type="text" 
                      required 
                      value={labForm.resultValue} 
                      onChange={(e) => setLabForm({...labForm, resultValue: e.target.value})} 
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">المعدل الطبيعي</label>
                    <input 
                      type="text" 
                      value={labForm.normalRange} 
                      onChange={(e) => setLabForm({...labForm, normalRange: e.target.value})} 
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 font-mono" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">حالة النتيجة (التقييم)</label>
                  <select 
                    value={labForm.status} 
                    onChange={(e) => setLabForm({...labForm, status: e.target.value as any})} 
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="طبيعي">طبيعي (Normal)</option>
                    <option value="مرتفع">مرتفع (Elevated)</option>
                    <option value="منخفض">منخفض (Low)</option>
                    <option value="حرج">حرج جداً (Critical Alert)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                <button 
                  type="button" 
                  onClick={() => setShowAddLabModal(false)} 
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-md shadow-sky-600/30 cursor-pointer transition-all"
                >
                  حفظ النتيجة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Prescription Modal */}
      {showAddRxModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddRxModal(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl text-right flex flex-col max-h-[90vh] overflow-hidden my-auto text-slate-900 dark:text-slate-200 text-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">إصدار وصفة طبية جديدة</h3>
              <button 
                type="button"
                onClick={() => setShowAddRxModal(false)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRxSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">اسم المريض *</label>
                  <input
                    type="text"
                    required
                    list="rx-patients-list"
                    placeholder="اكتب اسم المريض أو اختر من القائمة..."
                    value={rxForm.patientName}
                    onChange={(e) => setRxForm({ ...rxForm, patientName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
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
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">التشخيص الطبي *</label>
                  <input 
                    type="text" 
                    required 
                    value={rxForm.diagnosis} 
                    onChange={(e) => setRxForm({...rxForm, diagnosis: e.target.value})} 
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500" 
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">الأدوية الموصوفة *</label>
                    <button type="button" onClick={handleAddMedicineRow} className="text-sky-600 dark:text-sky-400 hover:underline text-[11px] font-bold cursor-pointer">+ دواء آخر</button>
                  </div>
                  {rxForm.medicines.map((med, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 mb-2">
                      <input
                        type="text"
                        placeholder="اسم الدواء والجرعة..."
                        value={med.medicineName}
                        onChange={(e) => {
                          const newMeds = [...rxForm.medicines];
                          newMeds[idx].medicineName = e.target.value;
                          setRxForm({ ...rxForm, medicines: newMeds });
                        }}
                        className="w-full p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
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
                          className="w-full p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
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
                          className="w-full p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Real-Time Clinical Safety Warning Box (Drug-Allergy & Drug-Drug Interaction Check) */}
                {(() => {
                  const selectedPatient = patients.find(p => p.fullName.trim() === rxForm.patientName.trim());
                  const activeAllergies = selectedPatient?.allergies || [];
                  const allergyWarnings = rxForm.medicines
                    .map(m => checkDrugAllergyConflict(m.medicineName, activeAllergies))
                    .filter(r => r.hasConflict);
                  const drugDrugCheck = checkDrugDrugInteractions(rxForm.medicines.map(m => m.medicineName));

                  const hasWarnings = allergyWarnings.length > 0 || drugDrugCheck.hasInteraction;

                  if (!hasWarnings) return null;

                  return (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-rose-400 font-bold">
                        <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>تحذير السلامة الدوائية المباشر (Drug Safety Alert)</span>
                      </div>
                      
                      {allergyWarnings.map((w, i) => (
                        <p key={i} className="text-rose-300 text-[11px] leading-relaxed font-semibold">
                          {w.message}
                        </p>
                      ))}

                      {drugDrugCheck.warnings.map((w, i) => (
                        <p key={i} className="text-amber-300 text-[11px] leading-relaxed font-semibold">
                          {w}
                        </p>
                      ))}
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">تعليمات الطبيب</label>
                  <textarea 
                    rows={2} 
                    value={rxForm.doctorInstructions} 
                    onChange={(e) => setRxForm({...rxForm, doctorInstructions: e.target.value})} 
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500" 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                <button 
                  type="button" 
                  onClick={() => setShowAddRxModal(false)} 
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-md shadow-sky-600/30 cursor-pointer transition-all"
                >
                  إصدار الوصفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
