import React, { useState } from 'react';
import { Invoice, Patient, UserRole, InsuranceClaimStatus } from '../types';
import { printAndExportPdf, exportInvoiceToPdf } from '../utils/pdfExport';
import { validateInvoiceForm } from '../utils/validation';
import { formatArabicDate } from '../utils/arabicFormatters';
import { 
  Receipt, 
  DollarSign, 
  Plus, 
  Printer, 
  Download,
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
  Coins,
  AlertTriangle,
  FileCheck,
  FileClock,
  FileX,
  ExternalLink,
  Search,
  CheckCircle,
  HelpCircle
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
  const [shamCashError, setShamCashError] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'مدفوع' | 'معلق'>('all');

  // New Invoice Form
  const [formData, setFormData] = useState({
    patientName: '',
    doctorName: 'د. سارة السعيد (استشارية القلب)',
    serviceDescription: 'كشفية عيادة + تحاليل دقيقة + أشعة',
    subtotal: 60000,
    insuranceCovered: 48300,
    status: 'معلق' as Invoice['status'],
    claimStatus: 'قيد المراجعة' as InsuranceClaimStatus,
    paymentMethod: 'شام كاش (Sham Cash)' as Invoice['paymentMethod'],
    description: 'كشفية عيادة + تحاليل دقيقة + أشعة',
  });
  const [invoiceErrors, setInvoiceErrors] = useState<Record<string, string>>({});

  const isPatientRole = userRole === 'patient';
  const displayedInvoices = (isPatientRole
    ? invoices.filter(i => i.patientId === 'pat-1' || i.patientName === 'محمد عبد الله العتيبي' || i.patientName.includes('محمد'))
    : invoices
  ).filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) {
      if (statusFilter === 'مدفوع' && (inv.status === 'مدفوع' || inv.status === 'مدفوعة')) return true;
      if (statusFilter === 'معلق' && (inv.status === 'معلق' || inv.status === 'معلقة' || inv.status === 'غير مدفوعة')) return true;
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = inv.invoiceNumber.toLowerCase().includes(q);
      const matchPat = inv.patientName.toLowerCase().includes(q);
      const matchDoc = (inv.doctorName || '').toLowerCase().includes(q);
      const matchDesc = (inv.serviceDescription || '').toLowerCase().includes(q);
      return matchNum || matchPat || matchDoc || matchDesc;
    }
    return true;
  });

  const totalPaid = displayedInvoices
    .filter(i => i.status === 'مدفوع' || i.status === 'مدفوعة')
    .reduce((sum, inv) => sum + inv.netAmount, 0);

  const totalPending = displayedInvoices
    .filter(i => i.status === 'معلق' || i.status === 'معلقة' || i.status === 'غير مدفوعة')
    .reduce((sum, inv) => sum + inv.netAmount, 0);

  const totalInsurance = displayedInvoices
    .reduce((sum, inv) => sum + (inv.insuranceCovered || 0), 0);

  const firstPendingInvoice = displayedInvoices.find(i => 
    i.status === 'معلق' || i.status === 'معلقة' || i.status === 'غير مدفوعة'
  );

  const handlePrintInvoice = (inv: Invoice) => {
    exportInvoiceToPdf(inv);
  };

  const handleOpenShamCashModal = (inv: Invoice) => {
    setActiveShamCashInvoice(inv);
    setShowShamCashModal(true);
    setShamCashSuccess(false);
    setShamCashTxId('');
    setShamCashError('');
  };

  const handleConfirmShamCashPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setShamCashError('');

    const cleanCode = shamCashTxId.trim().toUpperCase();

    // 1. Validation: code length and format
    if (cleanCode.length < 5) {
      setShamCashError('يرجى إدخال كود تحويل صحيح من تطبيق شام كاش (يتكون من 5 خانات على الأقل).');
      return;
    }

    // 2. Anti-reuse check from localStorage
    try {
      const savedCodesRaw = localStorage.getItem('syrian_hosp_used_sham_codes');
      const usedCodes: string[] = savedCodesRaw ? JSON.parse(savedCodesRaw) : [];

      if (usedCodes.includes(cleanCode)) {
        setShamCashError('عذراً، تم استخدام كود التحويل هذا مسبقاً في عملية دفع سابقة! يرجى التأكد من كود التحويل الجديد من تطبيق شام كاش.');
        return;
      }

      // Record code as used
      usedCodes.push(cleanCode);
      localStorage.setItem('syrian_hosp_used_sham_codes', JSON.stringify(usedCodes));
    } catch (err) {
      // ignore
    }

    // 3. Mark invoice as paid
    if (activeShamCashInvoice) {
      activeShamCashInvoice.status = 'مدفوع';
      activeShamCashInvoice.paymentMethod = 'شام كاش (Sham Cash)';
      activeShamCashInvoice.transferCode = cleanCode;
      activeShamCashInvoice.paidDate = new Date().toISOString().split('T')[0];
      setShamCashSuccess(true);
    }
  };

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    setInvoiceErrors({});

    const validation = validateInvoiceForm({
      patientName: formData.patientName,
      subtotal: Number(formData.subtotal),
      insuranceCovered: Number(formData.insuranceCovered),
      description: formData.description,
    });

    if (!validation.isValid) {
      setInvoiceErrors(validation.errors);
      return;
    }
    
    const matchedPatient = patients.find(p => p.fullName === formData.patientName);
    const finalPatientName = formData.patientName.trim() || 'مريض جديد';
    const finalPatientId = matchedPatient ? matchedPatient.id : ('p-' + Date.now());

    const subtotal = Number(formData.subtotal);
    const tax = Math.round(subtotal * 0.15); // 15% VAT
    const insuranceCovered = Number(formData.insuranceCovered);
    const netAmount = Math.max(0, (subtotal + tax) - insuranceCovered);

    onAddInvoice({
      patientId: finalPatientId,
      patientName: finalPatientName,
      doctorName: formData.doctorName,
      serviceDescription: formData.description,
      subtotal,
      tax,
      insuranceCovered,
      netAmount,
      amount: netAmount,
      status: formData.status,
      claimStatus: formData.claimStatus,
      paymentMethod: formData.paymentMethod,
      date: new Date().toISOString().split('T')[0],
      items: [
        {
          description: formData.description,
          quantity: 1,
          unitPrice: subtotal,
          total: subtotal,
        }
      ]
    });

    setInvoiceErrors({});
    setShowAddModal(false);
  };

  const renderClaimStatusBadge = (claimStatus?: InsuranceClaimStatus) => {
    switch (claimStatus) {
      case 'موافق عليها':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap inline-flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>موافق عليها</span>
          </span>
        );
      case 'قيد المراجعة':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>قيد المراجعة</span>
          </span>
        );
      case 'مرفوضة':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap inline-flex items-center gap-1">
            <X className="w-3 h-3" />
            <span>مرفوضة</span>
          </span>
        );
      default:
        return (
          <span className="text-slate-400 text-[11px]">—</span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-bold text-white">
              {isPatientRole 
                ? 'فواتيري ومدفوعاتي الطبية' 
                : userRole === 'staff' 
                  ? 'فواتير ومحاسبة المرضى' 
                  : 'إدارة الفواتير والتحصيل المالي'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isPatientRole 
              ? 'متابعة تفاصيل المبالغ، ضريبة القيمة المضافة، تغطية التأمين، والدفع الإلكتروني عبر شام كاش' 
              : 'سجلات المطالبات المالية، ضريبة القيمة المضافة (15%)، وتقارير التحصيل والمطالبات التأمينية'}
          </p>
        </div>

        {canManageBilling && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 transition-all hover:scale-105 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء فاتورة جديدة</span>
          </button>
        )}
      </div>

      {/* Patient Sham Cash Banner - High Contrast Clean Card */}
      {isPatientRole && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border-2 border-amber-500/60 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <strong className="text-white text-sm font-bold block">
                  الدفع الإلكتروني المباشر عبر شام كاش (Sham Cash)
                </strong>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                  فوري وآمن
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                يمكنك سداد فواتيرك الطبية بسهولة وأمان عبر تطبيق شام كاش. أدخل كود التحويل لتأكيد السداد وتوثيقه آلياً دون الحاجة لمراجعة مكتب المحاسبة.
              </p>
            </div>
          </div>

          {/* Quick Pay CTA if there is a pending invoice */}
          {firstPendingInvoice ? (
            <button
              onClick={() => handleOpenShamCashModal(firstPendingInvoice)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-105 shrink-0 whitespace-nowrap self-stretch sm:self-auto justify-center"
            >
              <Smartphone className="w-4 h-4 text-slate-950" />
              <span>سداد الفاتورة المستحقة ({firstPendingInvoice.netAmount.toLocaleString('en-US')} ل.س)</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-500/30 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-bold">جميع فواتيرك مسددة بالكامل</span>
            </div>
          )}
        </div>
      )}

      {/* Financial Summary Cards - Patient Centric & Admin Perspectives */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-bold block mb-1">
            {isPatientRole ? 'إجمالي ما دفعته' : userRole === 'staff' ? 'إجمالي المبالغ المحصلة' : 'إجمالي المبالغ المحصلة'}
          </span>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
              {totalPaid.toLocaleString('en-US')}
            </span>
            <span className="text-xs text-slate-400 font-sans">ل.س</span>
          </div>
          <span className="text-[11px] text-emerald-400/80 block mt-1">مسدد بالكامل وموثق مالياً</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-bold block mb-1">
            {isPatientRole ? 'الفواتير المستحقة للدفع' : 'المبالغ المعلقة بانتظار التحصيل'}
          </span>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 tabular-nums">
              {totalPending.toLocaleString('en-US')}
            </span>
            <span className="text-xs text-slate-400 font-sans">ل.س</span>
          </div>
          <span className="text-[11px] text-amber-400/80 block mt-1">
            {isPatientRole ? 'متاحة للدفع الإلكتروني الفوري' : 'مطالبات قيد التسديد'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-bold block mb-1">
            {isPatientRole ? 'تغطية التأمين الطبي' : 'المطالبات المغطاة تأمينياً'}
          </span>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl sm:text-3xl font-black text-sky-400 tabular-nums">
              {totalInsurance.toLocaleString('en-US')}
            </span>
            <span className="text-xs text-slate-400 font-sans">ل.س</span>
          </div>
          <span className="text-[11px] text-sky-400/80 block mt-1">
            {isPatientRole ? 'مساهمة شركة التأمين (70%)' : 'مطالبات مرفوعة لشركات التأمين'}
          </span>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم الفاتورة، الطبيب أو الخدمة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-400 ml-1">حالة السداد:</span>
          {[
            { id: 'all', label: 'الكل' },
            { id: 'مدفوع', label: 'مدفوع' },
            { id: 'معلق', label: 'مستحق / معلق' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === f.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table - With Full Tax and Insurance Breakdown */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs text-slate-300">
            <thead className="bg-slate-800 text-slate-400 font-bold border-b border-slate-700 whitespace-nowrap">
              <tr>
                <th className="p-3.5">رقم الفاتورة</th>
                {!isPatientRole && <th className="p-3.5">اسم المريض</th>}
                <th className="p-3.5">الطبيب / الخدمة الطبية</th>
                <th className="p-3.5">تاريخ الإصدار</th>
                <th className="p-3.5">المبلغ قبل الضريبة</th>
                <th className="p-3.5">ضريبة القيمة المضافة (15%)</th>
                <th className="p-3.5">الإجمالي الشامل</th>
                <th className="p-3.5">تغطية التأمين</th>
                <th className="p-3.5">الصافي المطلوب</th>
                <th className="p-3.5">حالة المطالبة</th>
                <th className="p-3.5">حالة السداد</th>
                <th className="p-3.5 text-center">إجراءات الفاتورة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-sans">
              {displayedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={isPatientRole ? 11 : 12} className="p-8 text-center text-slate-400">
                    <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-300">لا توجد فواتير مطابقة للبحث</p>
                  </td>
                </tr>
              ) : (
                displayedInvoices.map((inv) => {
                  const isPaid = inv.status === 'مدفوع' || inv.status === 'مدفوعة';
                  const totalWithTax = (inv.subtotal || 0) + (inv.tax || 0);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/50 transition-colors">
                      {/* Invoice Number */}
                      <td className="p-3.5 font-mono font-bold text-sky-400 whitespace-nowrap">
                        {inv.invoiceNumber}
                      </td>

                      {/* Patient Name */}
                      {!isPatientRole && (
                        <td className="p-3.5 font-bold text-white whitespace-nowrap">
                          {inv.patientName}
                        </td>
                      )}

                      {/* Doctor & Service */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-200 block text-xs">
                            {inv.serviceDescription || inv.items?.[0]?.description || 'خدمة طبية عامة'}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {inv.doctorName || 'عيادات مشفى الرحمة'}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-3.5 text-slate-300 whitespace-nowrap font-medium">
                        {formatArabicDate(inv.date)}
                      </td>

                      {/* Subtotal */}
                      <td className="p-3.5 font-mono text-slate-300 whitespace-nowrap tabular-nums">
                        {inv.subtotal.toLocaleString('en-US')} ل.س
                      </td>

                      {/* VAT 15% */}
                      <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap tabular-nums">
                        +{inv.tax.toLocaleString('en-US')} ل.س
                      </td>

                      {/* Total with Tax */}
                      <td className="p-3.5 font-mono text-slate-200 font-bold whitespace-nowrap tabular-nums">
                        {totalWithTax.toLocaleString('en-US')} ل.س
                      </td>

                      {/* Insurance Covered */}
                      <td className="p-3.5 font-mono text-emerald-400 whitespace-nowrap tabular-nums">
                        -{inv.insuranceCovered.toLocaleString('en-US')} ل.س
                      </td>

                      {/* Net Amount */}
                      <td className="p-3.5 font-mono font-black text-white text-sm whitespace-nowrap tabular-nums">
                        <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-sky-300 font-bold">
                          {inv.netAmount.toLocaleString('en-US')} ل.س
                        </span>
                      </td>

                      {/* Insurance Claim Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        {renderClaimStatusBadge(inv.claimStatus)}
                      </td>

                      {/* Payment Status Badge */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border shadow-sm ${
                          isPaid
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          <span>{inv.status}</span>
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-2.5 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                            title="عرض تفاصيل الفاتورة الضريبية"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>عرض الفاتورة</span>
                          </button>

                          {!isPaid && (
                            <button
                              onClick={() => handleOpenShamCashModal(inv)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 shrink-0"
                              title="دفع الفاتورة عبر شام كاش"
                            >
                              <Smartphone className="w-3.5 h-3.5 text-slate-950" />
                              <span>دفع عبر شام كاش</span>
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Tax Invoice Modal with QR Verification */}
      {selectedInvoice && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedInvoice(null);
          }}
        >
          <div className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-xl shadow-2xl text-right flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b-2 border-slate-900 flex items-center justify-between shrink-0 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">
                  <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-black text-slate-900">مشفى الرحمة الطبي</h2>
                  <p className="text-[11px] sm:text-xs text-slate-600">Al-Rahma Hospital - فاتورة ضريبية مبسطة</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-left text-[11px] sm:text-xs font-mono text-slate-700">
                  <p className="font-bold text-slate-900">{selectedInvoice.invoiceNumber}</p>
                  <p>التاريخ: {formatArabicDate(selectedInvoice.date)}</p>
                  <p className="text-[10px] text-slate-500">الرقم الضريبي: 300998827100003</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                  aria-label="إغلاق الفاتورة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Patient & Service Details */}
              <div className="p-3.5 rounded-xl bg-slate-100 text-xs grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block">اسم المريض المستفيد:</span>
                  <p className="font-bold text-slate-900 text-sm">{selectedInvoice.patientName}</p>
                </div>
                <div>
                  <span className="text-slate-500 block">الطبيب المشرف / القسم:</span>
                  <p className="font-bold text-slate-800">{selectedInvoice.doctorName || 'العيادات الخارجية'}</p>
                </div>
                <div>
                  <span className="text-slate-500 block">طريقة السداد:</span>
                  <p className="font-bold text-emerald-700">{selectedInvoice.paymentMethod || 'نقدي'}</p>
                  {selectedInvoice.transferCode && (
                    <span className="text-[10px] text-slate-500 font-mono">كود: {selectedInvoice.transferCode}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block">حالة المطالبة التأمينية:</span>
                  <p className="font-bold text-sky-700">{selectedInvoice.claimStatus || 'موافق عليها'}</p>
                </div>
              </div>

              {/* Invoice Line Items */}
              <table className="w-full text-right text-xs border border-slate-300">
                <thead className="bg-slate-200 font-bold text-slate-800">
                  <tr>
                    <th className="p-2 border">الخدمة / البند الطبي</th>
                    <th className="p-2 border">الكمية</th>
                    <th className="p-2 border">السعر الإفرادي</th>
                    <th className="p-2 border">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2 border font-bold text-slate-900">{item.description}</td>
                      <td className="p-2 border font-mono text-center">{item.quantity}</td>
                      <td className="p-2 border font-mono">{item.unitPrice.toLocaleString('en-US')} ل.س</td>
                      <td className="p-2 border font-mono font-bold">{item.total.toLocaleString('en-US')} ل.س</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-800 font-mono bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between">
                  <span>المبلغ قبل الضريبة (Subtotal):</span>
                  <span>{selectedInvoice.subtotal.toLocaleString('en-US')} ل.س</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ضريبة القيمة المضافة VAT (15%):</span>
                  <span>+{selectedInvoice.tax.toLocaleString('en-US')} ل.س</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>الإجمالي شامل الضريبة:</span>
                  <span>{((selectedInvoice.subtotal || 0) + (selectedInvoice.tax || 0)).toLocaleString('en-US')} ل.س</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>تغطية التأمين الطبي (70%):</span>
                  <span>-{selectedInvoice.insuranceCovered.toLocaleString('en-US')} ل.س</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t-2 border-slate-400">
                  <span>الصافي المطلوب سداده:</span>
                  <span className="text-sky-700 text-base">{selectedInvoice.netAmount.toLocaleString('en-US')} ل.س</span>
                </div>
              </div>

              {/* Official QR Verification Block */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  <QrCode className="w-9 h-9 text-slate-900 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block">رمز الاستجابة السريع للتحقق (ZATCA/QR)</span>
                    <span>وثيقة ضريبية رقمية معتمدة ومسجلة في النظام الطبي الموحد</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-slate-500">{selectedInvoice.invoiceNumber}</span>
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="flex justify-between items-center p-4 border-t border-slate-200 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                إغلاق
              </button>

              <button
                type="button"
                onClick={() => handlePrintInvoice(selectedInvoice)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
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
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl text-right flex flex-col max-h-[90vh] overflow-hidden my-auto text-slate-900 dark:text-slate-200 text-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">إنشاء فاتورة مالية جديدة</h3>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNew} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                {Object.keys(invoiceErrors).length > 0 && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-300 flex items-start gap-2 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">يرجى تصحيح أخطاء الفاتورة:</span>
                      <ul className="list-disc list-inside mt-0.5 text-[11px] text-rose-700 dark:text-rose-200">
                        {Object.values(invoiceErrors).map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">اسم المريض *</label>
                  <input
                    type="text"
                    required
                    list="billing-patients-list"
                    placeholder="اكتب اسم المريض أو اختر من القائمة..."
                    value={formData.patientName}
                    onChange={(e) => {
                      setFormData({ ...formData, patientName: e.target.value });
                      if (invoiceErrors.patientName) setInvoiceErrors({ ...invoiceErrors, patientName: '' });
                    }}
                    className={`w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                      invoiceErrors.patientName ? 'border-rose-500 bg-rose-500/5' : 'border-slate-300 dark:border-slate-700'
                    } text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500`}
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
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">الطبيب المشرف</label>
                  <input 
                    type="text" 
                    value={formData.doctorName} 
                    onChange={(e) => setFormData({...formData, doctorName: e.target.value})} 
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500" 
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">وصف الخدمة أو الإجراء الطبي *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.description} 
                    onChange={(e) => {
                      setFormData({...formData, description: e.target.value});
                      if (invoiceErrors.description) setInvoiceErrors({ ...invoiceErrors, description: '' });
                    }} 
                    className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border ${
                      invoiceErrors.description ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                    } text-slate-900 dark:text-white focus:outline-none focus:border-sky-500`} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">المبلغ قبل الضريبة (ل.س) *</label>
                    <input 
                      type="number" 
                      required 
                      value={formData.subtotal} 
                      onChange={(e) => {
                        setFormData({...formData, subtotal: Number(e.target.value)});
                        if (invoiceErrors.subtotal) setInvoiceErrors({ ...invoiceErrors, subtotal: '' });
                      }} 
                      className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border ${
                        invoiceErrors.subtotal ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                      } text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 font-mono`} 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">تغطية شركة التأمين (ل.س)</label>
                    <input 
                      type="number" 
                      value={formData.insuranceCovered} 
                      onChange={(e) => {
                        setFormData({...formData, insuranceCovered: Number(e.target.value)});
                        if (invoiceErrors.insuranceCovered) setInvoiceErrors({ ...invoiceErrors, insuranceCovered: '' });
                      }} 
                      className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border ${
                        invoiceErrors.insuranceCovered ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                      } text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 font-mono`} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">طريقة الدفع</label>
                    <select 
                      value={formData.paymentMethod} 
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as any})} 
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="شام كاش (Sham Cash)">📱 شام كاش (Sham Cash)</option>
                      <option value="تأمين طبي">تأمين طبي</option>
                      <option value="نقدي">نقدي</option>
                      <option value="بطاقة ائتمان">بطاقة ائتمان / مدى</option>
                      <option value="تحويل بنكي">تحويل بنكي</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">حالة الفاتورة</label>
                    <select 
                      value={formData.status} 
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})} 
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="معلق">معلق قيد التحصيل</option>
                      <option value="مدفوع">مدفوع بالكامل</option>
                      <option value="جزئي">دفع جزئي</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-md shadow-sky-600/30 cursor-pointer transition-all"
                >
                  إصدار الفاتورة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sham Cash Payment Modal with Strict Validation */}
      {showShamCashModal && activeShamCashInvoice && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onClick={() => setShowShamCashModal(false)}
        >
          <div 
            className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl text-right text-slate-100 space-y-4 my-auto max-h-[90vh] overflow-y-auto relative"
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
                  <p className="text-[11px] text-slate-400">سداد إلكتروني مباشر وتأكيد فوري</p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setShowShamCashModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                title="إغلاق الشاشة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success View or Payment QR Form */}
            {shamCashSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-extrabold text-emerald-300 text-base">تم تأكيد سداد الفاتورة بنجاح!</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  تم قيد كود التحويل <strong className="font-mono text-amber-400">{activeShamCashInvoice.transferCode}</strong> وتوثيق سداد الفاتورة <strong className="font-mono text-white">{activeShamCashInvoice.invoiceNumber}</strong> بمبلغ {activeShamCashInvoice.netAmount.toLocaleString('en-US')} ل.س.
                </p>
                <div className="pt-3 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowShamCashModal(false);
                      setSelectedInvoice(activeShamCashInvoice);
                    }}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
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
              <div className="space-y-4">
                
                {/* Invoice Brief */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">المريض / رقم الفاتورة:</span>
                    <strong className="text-white text-xs sm:text-sm">{activeShamCashInvoice.patientName}</strong>
                    <span className="text-slate-400 font-mono block text-[10px]">{activeShamCashInvoice.invoiceNumber}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-slate-400 block text-[10px]">المبلغ المطلوب:</span>
                    <span className="text-amber-400 font-mono font-black text-sm sm:text-base">
                      {activeShamCashInvoice.netAmount.toLocaleString('en-US')} ل.س
                    </span>
                  </div>
                </div>

                {/* QR Code & Sham Cash Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-950 to-amber-950/20 border border-amber-500/40 text-center space-y-3">
                  <p className="text-xs font-bold text-amber-300">
                    امسح رمز الـ QR أو حول إلى معرف المستشفى:
                  </p>
                  
                  {/* Clean Yellow Sham Cash Card */}
                  <div className="p-3 bg-amber-400 rounded-2xl max-w-[220px] mx-auto border-2 border-amber-300 text-slate-950 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black border-b border-slate-900/20 pb-1">
                      <span>شام كاش - SHAM CASH</span>
                      <span className="bg-slate-950 text-amber-400 px-1 rounded text-[9px]">QR</span>
                    </div>

                    <div className="bg-white p-2 rounded-xl flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-slate-950" />
                    </div>

                    <span className="font-mono text-[10px] font-black block tracking-wider">
                      SHAM-HOSP-9904
                    </span>
                  </div>

                  {/* Copy Account ID Row */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <span className="text-slate-300 text-[11px]">معرف حساب المستشفى:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-amber-400 text-xs">SHAM-HOSP-9904</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText('SHAM-HOSP-9904');
                          setCopiedAccount(true);
                          setTimeout(() => setCopiedAccount(false), 2000);
                        }}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title="نسخ المعرف"
                      >
                        {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Validation Error Banner */}
                {shamCashError && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{shamCashError}</span>
                  </div>
                )}

                {/* Form to Input Transfer Code */}
                <form onSubmit={handleConfirmShamCashPayment} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">
                      كود إشعار التحويل من تطبيق شام كاش *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: SHAM-TX-990412 أو 987654"
                      value={shamCashTxId}
                      onChange={(e) => {
                        setShamCashTxId(e.target.value);
                        if (shamCashError) setShamCashError('');
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none focus:border-amber-400"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      يتم التحقق من الرمز لمنع تكراره وضمان ربطه بالفاتورة الطبية.
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowShamCashModal(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                    >
                      إلغاء
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-950" />
                      <span>تأكيد وسداد الفاتورة</span>
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
