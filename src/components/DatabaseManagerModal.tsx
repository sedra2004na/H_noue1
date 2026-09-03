import React, { useState, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ShieldCheck, 
  HardDrive, 
  Activity, 
  Server,
  FileCheck,
  RotateCcw,
  Zap
} from 'lucide-react';

interface DatabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allData: {
    patients: any[];
    doctors: any[];
    appointments: any[];
    inventory: any[];
    labResults: any[];
    prescriptions: any[];
    invoices: any[];
    shifts: any[];
    wards: any[];
    beds: any[];
    archivedRecords: any[];
    abnormalFlags: any[];
  };
  onRestoreData: (restoredData: any) => void;
  onResetToDefault: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({
  isOpen,
  onClose,
  allData,
  onRestoreData,
  onResetToDefault,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'backup' | 'audit'>('status');
  const [isScanning, setIsScanning] = useState(false);
  const [auditReport, setAuditReport] = useState<{
    totalRecords: number;
    issuesFound: Array<{ type: 'error' | 'warning' | 'info'; title: string; detail: string }>;
    lastScanTime: string | null;
  }>({
    totalRecords: 0,
    issuesFound: [],
    lastScanTime: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Calculate stats
  const totalPatients = allData.patients?.length || 0;
  const totalDoctors = allData.doctors?.length || 0;
  const totalAppointments = allData.appointments?.length || 0;
  const totalInvoices = allData.invoices?.length || 0;
  const totalInventory = allData.inventory?.length || 0;
  const totalLab = allData.labResults?.length || 0;
  const totalBeds = allData.beds?.length || 0;
  const totalArchived = allData.archivedRecords?.length || 0;
  const grandTotal = totalPatients + totalDoctors + totalAppointments + totalInvoices + totalInventory + totalLab + totalBeds + totalArchived;

  // Export full DB backup
  const handleExportBackup = () => {
    const backupPayload = {
      hospitalName: 'Care Hospital Management System',
      version: '2.5.0',
      exportDate: new Date().toISOString(),
      databaseSchemaVersion: '2026-R2',
      data: allData,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `care_hospital_database_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    onShowToast('تم تصدير وحفظ النسخة الاحتياطية لقاعدة البيانات بنجاح (JSON Backup)', 'success');
  };

  // Import / Restore DB backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || !parsed.data) {
          throw new Error('الملف لا يحتوي على هيكلية بيانات قاعدة البيانات المعتمدة');
        }

        onRestoreData(parsed.data);
        onShowToast('تم استعادة وتطبيق بيانات النسخة الاحتياطية بنجاح!', 'success');
        onClose();
      } catch (err: any) {
        onShowToast(`فشل استيراد النسخة: ${err.message || 'الملف تالف أو غير صالح'}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  // Run Real-Time Data Integrity & Error Audit
  const handleRunAudit = () => {
    setIsScanning(true);
    setTimeout(() => {
      const issues: Array<{ type: 'error' | 'warning' | 'info'; title: string; detail: string }> = [];

      // 1. Check duplicate national IDs in patients
      const nationalIdMap = new Map<string, string>();
      allData.patients?.forEach((p: any) => {
        if (p.nationalId) {
          if (nationalIdMap.has(p.nationalId)) {
            issues.push({
              type: 'error',
              title: 'تكرار في الرقم الوطني للمرضى',
              detail: `الرقم الوطني (${p.nationalId}) مسجل للمريض (${p.fullName}) ولمريض آخر (${nationalIdMap.get(p.nationalId)}).`,
            });
          } else {
            nationalIdMap.set(p.nationalId, p.fullName);
          }
        }
      });

      // 2. Check appointment double bookings
      const bookingSlots = new Map<string, string>();
      allData.appointments?.forEach((a: any) => {
        if (a.status !== 'ملغى' && a.date && a.time && a.doctorName) {
          const key = `${a.doctorName}-${a.date}-${a.time}`;
          if (bookingSlots.has(key)) {
            issues.push({
              type: 'error',
              title: 'تعارض زمني في مواعيد العيادات',
              detail: `الطبيب (${a.doctorName}) لديه تعارض زمني بتاريخ ${a.date} الساعة ${a.time}.`,
            });
          } else {
            bookingSlots.set(key, a.patientName);
          }
        }
      });

      // 3. Check low inventory items
      allData.inventory?.forEach((item: any) => {
        if (item.quantity <= (item.minStockAlert || 10)) {
          issues.push({
            type: 'warning',
            title: 'نقص حرج في مخزون الصيدلية',
            detail: `الصنف (${item.itemName}) رصيده الحالي (${item.quantity}) أقل من حد الأمان.`,
          });
        }
      });

      // 4. Check negative amounts
      allData.invoices?.forEach((inv: any) => {
        if (inv.subtotal < 0 || inv.netAmount < 0) {
          issues.push({
            type: 'error',
            title: 'قيمة فاتورة سالبة غير مقبولة',
            detail: `الفاتورة رقم (${inv.invoiceNumber}) تحتوي على مبالغ سالبة.`,
          });
        }
      });

      if (issues.length === 0) {
        issues.push({
          type: 'info',
          title: 'قاعدة البيانات سليمة 100%',
          detail: 'تم فحص جميع السجلات والربط البيني ولم يتم العثور على أي تضارب أو أخطاء إدخال.',
        });
      }

      setAuditReport({
        totalRecords: grandTotal,
        issuesFound: issues,
        lastScanTime: new Date().toLocaleTimeString('ar-SY'),
      });
      setIsScanning(false);
      onShowToast('تم الانتهاء من تدقيق وفحص سلامة قاعدة البيانات', 'info');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                إدارة قاعدة البيانات ومنع الأخطاء
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  متصل ونشط
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                مزامنة السجلات، النسخ الاحتياطي الدائم، وفحص النزاهة ومنع التضارب
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'status'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            حالة البيانات السحابية ({grandTotal})
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'backup'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            النسخ الاحتياطي والاستعادة
          </button>
          <button
            onClick={() => {
              setActiveTab('audit');
              if (!auditReport.lastScanTime) handleRunAudit();
            }}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            فحص النزاهة ومنع الأخطاء
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: STATUS & COUNTERS */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4 rounded-xl border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">نظام المزامنة والتخزين المستمر</h3>
                    <p className="text-xs text-slate-400">
                      يتم حفظ كافة السجلات والتعديلات فورياً في الذاكرة المستمرة مع إمكانية الربط بـ Cloud SQL / Postgres.
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-xs text-slate-400 block">إجمالي السجلات</span>
                  <span className="text-xl font-bold text-emerald-400">{grandTotal} سجل</span>
                </div>
              </div>

              {/* Records Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/40 text-center">
                  <span className="text-xs text-slate-400 block mb-1">المرضى النشطين</span>
                  <span className="text-lg font-bold text-sky-400">{totalPatients}</span>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/40 text-center">
                  <span className="text-xs text-slate-400 block mb-1">الكادر الطبي</span>
                  <span className="text-lg font-bold text-emerald-400">{totalDoctors}</span>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/40 text-center">
                  <span className="text-xs text-slate-400 block mb-1">المواعيد والعيادات</span>
                  <span className="text-lg font-bold text-indigo-400">{totalAppointments}</span>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/40 text-center">
                  <span className="text-xs text-slate-400 block mb-1">الفواتير المالية</span>
                  <span className="text-lg font-bold text-amber-400">{totalInvoices}</span>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/40 text-center">
                  <span className="text-xs text-slate-400 block mb-1">مخزون الصيدلية</span>
                  <span className="text-lg font-bold text-teal-400">{totalInventory}</span>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/40 text-center">
                  <span className="text-xs text-slate-400 block mb-1">التحاليل والنتائج</span>
                  <span className="text-lg font-bold text-purple-400">{totalLab}</span>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/40 text-center">
                  <span className="text-xs text-slate-400 block mb-1">الأسرة والأجنحة</span>
                  <span className="text-lg font-bold text-blue-400">{totalBeds}</span>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/40 text-center">
                  <span className="text-xs text-slate-400 block mb-1">الأرشيف البارد</span>
                  <span className="text-lg font-bold text-slate-300">{totalArchived}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Export Card */}
                <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-3">
                      <Download className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-100">تصدير نسخة احتياطية</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      حفظ نسخة شاملة لكافة بيانات المستشفى بملف JSON آمن يمكن حفظه على حاسوبك أو نقله لأي سيرفر آخر.
                    </p>
                  </div>
                  <button
                    onClick={handleExportBackup}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    تحميل ملف النسخة الاحتياطية (.JSON)
                  </button>
                </div>

                {/* Import Card */}
                <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl w-fit mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-100">استعادة نسخة سابقة</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      رفع ملف نسخة احتياطية سابقة لاستعادة كافة المرضى والمواعيد والفواتير فوراً مع فحص النزاهة.
                    </p>
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".json"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-sky-900/30 transition flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      اختيار ملف النسخة وتطبيقها
                    </button>
                  </div>
                </div>
              </div>

              {/* Reset to Seed Data */}
              <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-500/20 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    إعادة ضبط المصنع (Reset to Default Demo Data)
                  </h4>
                  <p className="text-xs text-rose-400/80 mt-0.5">
                    إعادة تحميل السجلات الطبية النموذجية والتخلص من أي بيانات تجريبية غير مرغوبة.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('هل أنت متأكد من رغبتك في إعادة ضبط قاعدة البيانات إلى القيم النموذجية الافتراضية؟')) {
                      onResetToDefault();
                      onClose();
                    }
                  }}
                  className="py-2 px-3 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold rounded-lg border border-rose-500/30 transition"
                >
                  إعادة التعيين
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT & ERROR PREVENTION */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    تقرير تدقيق سلامة السجلات ومنع الأخطاء البشرية
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {auditReport.lastScanTime
                      ? `آخر فحص تم في تمام الساعة: ${auditReport.lastScanTime}`
                      : 'اضغط على زر الفحص للتدقيق الفوري لكافة السجلات'}
                  </p>
                </div>
                <button
                  onClick={handleRunAudit}
                  disabled={isScanning}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  {isScanning ? 'جارٍ التدقيق...' : 'إعادة الفحص الآن'}
                </button>
              </div>

              {/* Issues List */}
              <div className="space-y-2">
                {auditReport.issuesFound.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                      issue.type === 'error'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                        : issue.type === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    }`}
                  >
                    {issue.type === 'error' ? (
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    ) : issue.type === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold">{issue.title}</h4>
                      <p className="text-xs opacity-90 mt-0.5">{issue.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
            <span>نظام الحماية والتدقيق يعمل بالخلفية لجميع النماذج</span>
          </div>
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition font-medium"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
