import React, { useState } from 'react';
import { Invoice, Patient, UserRole } from '../types';
import { printAndExportPdf } from '../utils/pdfExport';
import { 
  Receipt, 
  DollarSign, 
  Plus, 
  Printer, 
  Building2, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  X,
  Trash2,
  Smartphone,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  Coins
} from 'lucide-react';

interface BillingSectionProps {
  userRole?: UserRole;
  invoices: Invoice[];
  patients: Patient[];
  onAddInvoice: (invoice: Partial<Invoice>) => void;
  onDeleteInvoice?: (id: string) => void;
}

export const BillingSection: React.FC<BillingSectionProps> = ({
  userRole = 'admin',
  invoices,
  patients,
  onAddInvoice,
  onDeleteInvoice,
}) => {
  const canManageBilling = userRole === 'admin' || userRole === 'staff';
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Sham Cash State
  const [showShamCashModal, setShowShamCashModal] = useState(false);
  const [activeShamCashInvoice, setActiveShamCashInvoice] = useState<Invoice | null>(null);
  const [shamCashTxId, setShamCashTxId] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [shamCashSuccess, setShamCashSuccess] = useState(false);

  // New Invoice Form
  const [formData, setFormData] = useState({
    patientName: '',
    subtotal: 150000,
    insuranceCovered: 100000,
    status: 'مدفوع' as Invoice['status'],
    paymentMethod: 'تأمين طبي' as Invoice['paymentMethod'],
    description: 'كشفية عيادة + تحاليل دقيقة + أشعة',
  });

  const isPatientRole = userRole === 'patient';
  const displayedInvoices = isPatientRole
    ? invoices.filter(i => i.patientId === 'pat-1' || i.patientName === 'محمد عبد الله العتيبي')
    : invoices;

  const totalPaid = displayedInvoices
    .filter(i => i.status === 'مدفوع' || i.status === 'مدفوعة')
    .reduce((sum, inv) => sum + inv.netAmount, 0);

  const totalPending = displayedInvoices
    .filter(i => i.status === 'معلق' || i.status === 'معلقة' || i.status === 'غير مدفوعة')
    .reduce((sum, inv) => sum + inv.netAmount, 0);

  const totalInsurance = displayedInvoices
    .reduce((sum, inv) => sum + inv.insuranceCovered, 0);

  const handlePrintInvoice = (inv: Invoice) => {
    const itemsHtml = `
      <table>
        <thead>
          <tr>
            <th>الخدمة / البند الطبي</th>
            <th>الكمية</th>
            <th>السعر</th>
            <th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${inv.items?.map(item => `
            <tr>
              <td><strong>${item.description}</strong></td>
              <td>${item.quantity}</td>
              <td>${item.unitPrice.toLocaleString('ar-SY')} ل.س</td>
              <td><strong>${item.total.toLocaleString('ar-SY')} ل.س</strong></td>
            </tr>
          `).join('') || ''}
        </tbody>
      </table>

      <div class="totals-box">
        <div class="totals-row">
          <span>المبلغ قبل الضريبة:</span>
          <span>${inv.subtotal.toLocaleString('ar-SY')} ل.س</span>
        </div>
        <div class="totals-row">
          <span>ضريبة القيمة المضافة (15%):</span>
          <span>+${inv.tax.toLocaleString('ar-SY')} ل.س</span>
        </div>
        <div class="totals-row" style="color: #047857;">
          <span>مبلغ التغطية التأمينية:</span>
          <span>-${inv.insuranceCovered.toLocaleString('ar-SY')} ل.س</span>
        </div>
        <div class="totals-row final">
          <span>الصافي المطلوب سداده:</span>
          <span>${inv.netAmount.toLocaleString('ar-SY')} ل.س</span>
        </div>
      </div>
    `;

    printAndExportPdf({
      title: 'فاتورة ضريبية وسند تحصيل مالية',
      documentNumber: inv.invoiceNumber,
      date: inv.date,
      patientName: inv.patientName,
      detailsHtml: itemsHtml,
    });
  };

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    
    const matchedPatient = patients.find(p => p.fullName === formData.patientName);
    const finalPatientName = formData.patientName.trim() || 'مريض جديد';
    const finalPatientId = matchedPatient ? matchedPatient.id : ('p-' + Date.now());

    onAddInvoice({
      patientId: finalPatientId,
      patientName: finalPatientName,
      subtotal: Number(formData.subtotal),
      insuranceCovered: Number(formData.insuranceCovered),
      status: formData.status,
      paymentMethod: formData.paymentMethod,
      items: [
        {
          description: formData.description,
          quantity: 1,
          unitPrice: Number(formData.subtotal),
          total: Number(formData.subtotal),
        }
      ]
    });

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-bold text-white">
              {userRole === 'patient' ? 'الفواتير والمستحقات المالية الخاصة بي' : 'إدارة الفواتير والإيرادات المالية'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {userRole === 'patient' 
              ? 'متابعة سجلات المطالبات الطبية وسداد الفواتير إلكترونياً عبر شام كاش' 
              : 'سجلات المطالبات المالية، ضريبة القيمة المضافة (15%)، ونسب التغطية التأمينية'}
          </p>
        </div>

        {canManageBilling && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 transition-all hover:scale-105 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء فاتورة جديدة</span>
          </button>
        )}
      </div>

      {/* Patient Sham Cash Banner */}
      {userRole === 'patient' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-amber-900/40 to-slate-900 border border-amber-500/50 text-amber-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <Smartphone className="w-7 h-7 text-amber-400 shrink-0" />
            <div>
              <strong className="text-amber-300 text-sm block">💡 الدفع الإلكتروني المباشر عبر شام كاش (Sham Cash)</strong>
              <span>يمكنك الآن سداد كافة مستحقاتك وفواتيرك الطبية بسهولة من هاتفك بمجرد الضغط على زر (دفع عبر شام كاش) وإدخال كود التحويل.</span>
            </div>
          </div>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-bold block mb-1">إجمالي المحصل الصافي (المدفوع)</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">
            {totalPaid.toLocaleString('ar-SY')} ل.س
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">مسدد بالكامل</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-bold block mb-1">المبالغ المعلقة قيد التحصيل</span>
          <span className="text-2xl font-black text-amber-400 font-mono">
            {totalPending.toLocaleString('ar-SY')} ل.س
          </span>
          <span className="text-[11px] text-amber-400/80 block mt-1">بانتظار السداد النقدي/الشبكة</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-bold block mb-1">المطالبات المغطاة تأمينياً</span>
          <span className="text-2xl font-black text-sky-400 font-mono">
            {totalInsurance.toLocaleString('ar-SY')} ل.س
          </span>
          <span className="text-[11px] text-sky-400/80 block mt-1">مرفوعة لشركات التأمين</span>
        </div>

      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs text-slate-300">
            <thead className="bg-slate-800 text-slate-400 font-bold border-b border-slate-700 whitespace-nowrap">
              <tr>
                <th className="p-4">رقم الفاتورة</th>
                {!isPatientRole && <th className="p-4">اسم المريض</th>}
                <th className="p-4">تاريخ الاصدار</th>
                <th className="p-4">المبلغ قبل الضريبة</th>
                <th className="p-4">تغطية التأمين</th>
                <th className="p-4">المبلغ المستحق (الصافي)</th>
                <th className="p-4">حالة السداد</th>
                <th className="p-4 text-center">إجراءات الفاتورة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {displayedInvoices.map((inv) => {
                // Clean payment method string to avoid double parentheses
                const cleanMethod = (inv.paymentMethod || 'نقدي')
                  .replace(/\s*\([^)]*\)/g, ''); // strip extra nested parens if any

                return (
                  <tr key={inv.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-sky-400 whitespace-nowrap">{inv.invoiceNumber}</td>
                    {!isPatientRole && <td className="p-4 font-bold text-white whitespace-nowrap">{inv.patientName}</td>}
                    <td className="p-4 font-mono text-slate-400 whitespace-nowrap">{inv.date}</td>
                    <td className="p-4 font-mono text-slate-300 whitespace-nowrap">{inv.subtotal.toLocaleString('ar-SY')} ل.س</td>
                    <td className="p-4 font-mono text-emerald-400 whitespace-nowrap">{inv.insuranceCovered.toLocaleString('ar-SY')} ل.س</td>
                    <td className="p-4 font-mono font-extrabold text-white whitespace-nowrap">{inv.netAmount.toLocaleString('ar-SY')} ل.س</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap inline-flex items-center gap-1.5 border shadow-sm ${
                        inv.status === 'مدفوع' || inv.status === 'مدفوعة' 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        inv.status === 'معلق' || inv.status === 'معلقة' 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          'bg-sky-500/20 text-sky-300 border-sky-500/30'
                      }`}>
                        <span>{inv.status}</span>
                        <span className="opacity-40">•</span>
                        <span>{cleanMethod}</span>
                      </span>
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>عرض الفاتورة</span>
                        </button>

                        {(inv.status === 'معلق' || inv.status === 'معلقة' || inv.status === 'غير مدفوعة') && (
                          <button
                            onClick={() => {
                              setActiveShamCashInvoice(inv);
                              setShowShamCashModal(true);
                              setShamCashSuccess(false);
                              setShamCashTxId('');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 shrink-0"
                            title="دفع الفاتورة عبر شام كاش"
                          >
                            <Smartphone className="w-3.5 h-3.5 text-slate-950" />
                            <span>دفع عبر شام كاش 📱</span>
                          </button>
                        )}

                        {canManageBilling && onDeleteInvoice && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteInvoice(inv.id);
                            }}
                            className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
                            title="حذف الفاتورة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Tax Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-xl p-8 shadow-2xl text-right space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">مشفى النور الطبي - دمشق</h2>
                  <p className="text-xs text-slate-600">فاتورة ضريبية مبسطة وسند مالية</p>
                </div>
              </div>

              <div className="text-left text-xs font-mono text-slate-700">
                <p className="font-bold text-slate-900">{selectedInvoice.invoiceNumber}</p>
                <p>التاريخ: {selectedInvoice.date}</p>
                <p className="text-[10px] text-slate-500">الرقم الضريبي: 300998827100003</p>
              </div>
            </div>

            {/* Patient Details */}
            <div className="p-3 rounded-xl bg-slate-100 text-xs flex justify-between items-center">
              <div>
                <span className="text-slate-500 block">اسم المريض المستفيد:</span>
                <p className="font-bold text-slate-900 text-sm">{selectedInvoice.patientName}</p>
              </div>
              <div>
                <span className="text-slate-500 block">طريقة السداد:</span>
                <p className="font-bold text-emerald-700">{selectedInvoice.paymentMethod || 'نقدي'}</p>
              </div>
            </div>

            {/* Invoice Line Items */}
            <table className="w-full text-right text-xs border border-slate-300">
              <thead className="bg-slate-200 font-bold text-slate-800">
                <tr>
                  <th className="p-2 border">الخدمة / البند الطبي</th>
                  <th className="p-2 border">الكمية</th>
                  <th className="p-2 border">السعر</th>
                  <th className="p-2 border">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items?.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2 border font-bold text-slate-900">{item.description}</td>
                    <td className="p-2 border font-mono">{item.quantity}</td>
                    <td className="p-2 border font-mono">{item.unitPrice.toLocaleString('ar-SY')} ل.س</td>
                    <td className="p-2 border font-mono font-bold">{item.total.toLocaleString('ar-SY')} ل.س</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Breakdown */}
            <div className="space-y-1 text-xs text-slate-800 font-mono bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span>المبلغ الخاضع للضريبة:</span>
                <span>{selectedInvoice.subtotal.toLocaleString('ar-SY')} ل.س</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ضريبة القيمة المضافة VAT (15%):</span>
                <span>+{selectedInvoice.tax.toLocaleString('ar-SY')} ل.س</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>مبلغ التغطية التأمينية:</span>
                <span>-{selectedInvoice.insuranceCovered.toLocaleString('ar-SY')} ل.س</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-300">
                <span>الصافي المطلوب سداده:</span>
                <span className="text-sky-700">{selectedInvoice.netAmount.toLocaleString('ar-SY')} ل.س</span>
              </div>
            </div>

            {/* Close & Print */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-xl text-xs"
              >
                إغلاق
              </button>

              <button
                onClick={() => handlePrintInvoice(selectedInvoice)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة / تصدير ملف PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add New Invoice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-right space-y-4 text-slate-200 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">إنشاء فاتورة مالية جديدة</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmitNew} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">اسم المريض *</label>
                <input
                  type="text"
                  required
                  list="billing-patients-list"
                  placeholder="اكتب اسم المريض أو اختر من القائمة..."
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <datalist id="billing-patients-list">
                  {patients.map((p) => (
                    <option key={p.id} value={p.fullName}>
                      {p.fileNumber}
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block font-bold mb-1">وصف الخدمة أو الإجراء الطبي *</label>
                <input type="text" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">المبلغ قبل الضريبة (ل.س) *</label>
                  <input type="number" required value={formData.subtotal} onChange={(e) => setFormData({...formData, subtotal: Number(e.target.value)})} className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700 font-mono" />
                </div>
                <div>
                  <label className="block font-bold mb-1">تغطية شركة التأمين (ل.س)</label>
                  <input type="number" value={formData.insuranceCovered} onChange={(e) => setFormData({...formData, insuranceCovered: Number(e.target.value)})} className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700 font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">طريقة الدفع</label>
                  <select value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as any})} className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700">
                    <option value="تأمين طبي">تأمين طبي</option>
                    <option value="نقدي">نقدي</option>
                    <option value="شام كاش (Sham Cash)">📱 شام كاش (Sham Cash)</option>
                    <option value="بطاقة ائتمان">بطاقة ائتمان / مدى</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">حالة الفاتورة</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700">
                    <option value="مدفوع">مدفوع بالكامل</option>
                    <option value="معلق">معلق قيد التحصيل</option>
                    <option value="جزئي">دفع جزئي</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl font-bold">إلغاء</button>
                <button type="submit" className="px-5 py-2 bg-sky-600 text-white font-bold rounded-xl shadow-md">إصدار الفاتورة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sham Cash Payment Modal */}
      {showShamCashModal && activeShamCashInvoice && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in"
          onClick={() => setShowShamCashModal(false)}
        >
          <div 
            className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl w-full max-w-md p-4 sm:p-5 shadow-2xl text-right text-slate-100 space-y-3.5 my-auto max-h-[88vh] overflow-y-auto shadow-amber-500/20 relative"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-amber-900/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                    <span>بوابة الدفع الإلكتروني - شام كاش</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                      Sham Cash
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">سداد إلكتروني مباشر عبر شام كاش</p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setShowShamCashModal(false)}
                className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white transition-all border border-rose-500/40 cursor-pointer"
                title="إغلاق الشاشة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success View or Payment QR Form */}
            {shamCashSuccess ? (
              <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-center space-y-3 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/50 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-extrabold text-amber-300 text-base">تم سداد الفاتورة بنجاح عبر شام كاش! 🟡</h4>
                <p className="text-xs text-slate-300">
                  الفاتورة <span className="font-mono text-amber-400 font-bold">{activeShamCashInvoice.invoiceNumber}</span> أصبحت مسددة بالكامل.
                </p>
                <div className="pt-3 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowShamCashModal(false);
                      setSelectedInvoice(activeShamCashInvoice);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة الإيصال الرسمي</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowShamCashModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer border border-slate-700"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                
                {/* Invoice Brief */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-900/40 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">المريض / الفاتورة:</span>
                    <strong className="text-white text-xs sm:text-sm">{activeShamCashInvoice.patientName}</strong>
                    <span className="text-slate-400 font-mono block text-[10px]">{activeShamCashInvoice.invoiceNumber}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-slate-400 block text-[10px]">المبلغ المطلوب:</span>
                    <span className="text-amber-400 font-mono font-black text-sm sm:text-base">
                      {activeShamCashInvoice.netAmount.toLocaleString('ar-SY')} ل.س
                    </span>
                  </div>
                </div>

                {/* QR Code & Barcode Yellow Box */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/30 border border-amber-500/40 text-center space-y-3">
                  <p className="text-xs font-extrabold text-amber-300 flex items-center justify-center gap-1.5">
                    <span>📱 اقرأ رمز الـ QR أو الباراكود عبر تطبيق شام كاش:</span>
                  </p>
                  
                  {/* Yellow Card with QR & Barcode */}
                  <div className="p-3 bg-gradient-to-b from-yellow-400 via-amber-400 to-amber-500 rounded-2xl w-full max-w-[240px] mx-auto border-2 border-yellow-300 shadow-xl text-slate-950 space-y-2.5 relative overflow-hidden">
                    
                    {/* Card Brand Header */}
                    <div className="flex items-center justify-between border-b border-slate-950/20 pb-1.5 px-1">
                      <div className="flex items-center gap-1 font-black text-[11px] tracking-tight text-slate-950">
                        <Smartphone className="w-3.5 h-3.5 text-slate-950" />
                        <span>شام كاش - SHAM CASH</span>
                      </div>
                      <span className="text-[9px] font-mono font-extrabold bg-slate-950 text-yellow-400 px-1.5 py-0.5 rounded">
                        QR & BARCODE
                      </span>
                    </div>

                    {/* QR Code Box */}
                    <div className="bg-white p-2 rounded-xl border border-amber-600/40 shadow-inner relative flex flex-col items-center justify-center">
                      <QrCode className="w-24 h-24 text-slate-950" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-yellow-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded border border-slate-950 shadow">
                          SHAM CASH
                        </div>
                      </div>
                    </div>

                    {/* Barcode Graphic Box */}
                    <div className="bg-white/95 p-1.5 rounded-xl border border-amber-600/30 text-center space-y-0.5 shadow-inner">
                      <div className="h-7 flex items-center justify-center gap-0.5 overflow-hidden">
                        {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 3].map((w, i) => (
                          <div 
                            key={i} 
                            className="bg-slate-950 h-full rounded-xs" 
                            style={{ width: `${w * 1.3}px` }} 
                          />
                        ))}
                      </div>
                      <span className="font-mono text-[10px] font-black text-slate-900 tracking-widest block">
                        9 6390 1284 7731
                      </span>
                    </div>

                  </div>

                  {/* Account Copy Row */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-amber-900/50 text-xs">
                    <span className="text-slate-300 font-medium text-[11px]">معرف حساب المستشفى:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-amber-400 text-xs sm:text-sm">SHAM-HOSP-9904</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText('SHAM-HOSP-9904');
                          setCopiedAccount(true);
                          setTimeout(() => setCopiedAccount(false), 2000);
                        }}
                        className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 transition-all cursor-pointer"
                        title="نسخ رقم الحساب"
                      >
                        {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Confirm Transaction Form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (activeShamCashInvoice) {
                      activeShamCashInvoice.status = 'مدفوعة';
                      activeShamCashInvoice.paymentMethod = 'شام كاش (Sham Cash)';
                      setShamCashSuccess(true);
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-200 space-y-1">
                    <strong className="block text-amber-300 font-extrabold">خطوات الدفع:</strong>
                    <p>1. افتح تطبيق شام كاش واقرأ رمز الـ QR أو الباراكود أعلاه.</p>
                    <p>2. أدخل رقم/كود إشعار التحويل من تطبيق شام كاش واضغط تأكيد السداد.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      كود / رقم إشعار التحويل من شام كاش (Transaction Code) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="أدخل كود الإشعار الصادر من شام كاش (مثال: TXN-90281)"
                      value={shamCashTxId}
                      onChange={(e) => setShamCashTxId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowShamCashModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer border border-slate-700"
                    >
                      إغلاق ❌
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-950" />
                      <span>تأكيد وسداد الفاتورة 🟡</span>
                    </button>
                  </div>
                </form>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
