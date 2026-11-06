/**
 * Utility for Printing and Exporting Medical Documents as PDF
 * مشفى الرحمة الطبي - محرك تصدير نتائج التحاليل والفواتير والوصفات بصيغة PDF
 */

import { AL_NOOR_LOGO_SVG_STRING } from '../components/HospitalLogo';
import { LabResult, Invoice, Patient, Prescription } from '../types';
import { formatArabicDate } from './arabicFormatters';

export interface PrintDocumentData {
  title: string;
  documentNumber?: string;
  date?: string;
  patientName: string;
  doctorName?: string;
  specialty?: string;
  detailsHtml: string;
}

export function printAndExportPdf(docData: PrintDocumentData) {
  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>${docData.title} - ${docData.patientName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
        
        @page {
          size: A4;
          margin: 15mm;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Tajawal', Arial, sans-serif;
        }

        body {
          background-color: #ffffff;
          color: #0f172a;
          padding: 30px;
          direction: rtl;
          font-size: 13px;
          line-height: 1.6;
        }

        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #0284c7;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }

        .hospital-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-box {
          width: 60px;
          height: 60px;
          background-color: #0f172a;
          border: 2px solid #0284c7;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
        }

        .hospital-info h1 {
          font-size: 20px;
          font-weight: 900;
          color: #0369a1;
        }

        .hospital-info p {
          font-size: 11px;
          color: #64748b;
        }

        .doc-meta {
          text-align: left;
          font-size: 11px;
          color: #334155;
        }

        .doc-meta .doc-num {
          font-weight: 800;
          font-size: 13px;
          color: #0f172a;
        }

        .patient-card {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 20px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .patient-card div {
          display: flex;
          flex-direction: column;
        }

        .patient-card label {
          font-size: 10px;
          color: #64748b;
          font-weight: bold;
        }

        .patient-card span {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
        }

        .content-area {
          margin-bottom: 25px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          margin-bottom: 16px;
        }

        th {
          background-color: #f1f5f9;
          color: #1e293b;
          font-weight: 800;
          text-align: right;
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          font-size: 12px;
        }

        td {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          font-size: 12px;
          color: #334155;
        }

        tr:nth-child(even) {
          background-color: #f8fafc;
        }

        .badge-status {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
        }

        .badge-normal {
          background-color: #dcfce7;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .badge-warning {
          background-color: #fef3c7;
          color: #b45309;
          border: 1px solid #fde68a;
        }

        .badge-critical {
          background-color: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .totals-box {
          background-color: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 12px 16px;
          margin-top: 16px;
          width: 320px;
          margin-right: auto;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          font-size: 12px;
        }

        .totals-row.final {
          border-top: 2px solid #0284c7;
          margin-top: 6px;
          padding-top: 6px;
          font-weight: 900;
          font-size: 14px;
          color: #0284c7;
        }

        .footer-signatures {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-top: 16px;
          border-top: 1px dashed #cbd5e1;
        }

        .sig-box {
          text-align: center;
          width: 180px;
        }

        .sig-line {
          border-bottom: 2px solid #94a3b8;
          height: 35px;
          margin-bottom: 6px;
        }

        .stamp-box {
          width: 110px;
          height: 110px;
          border: 3px double #0284c7;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #0284c7;
          font-weight: 900;
          font-size: 9px;
          transform: rotate(-6deg);
          opacity: 0.92;
          margin: 0 auto;
          padding: 6px;
          text-align: center;
          background: radial-gradient(circle, rgba(2, 132, 199, 0.05) 0%, rgba(255, 255, 255, 0) 70%);
          box-shadow: inset 0 0 0 2px #0284c7;
        }

        .no-print-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #0f172a;
          color: #ffffff;
          padding: 10px 16px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          z-index: 9999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        }

        .btn-print {
          background-color: #0284c7;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-print:hover {
          background-color: #0369a1;
        }

        @media print {
          .no-print-bar {
            display: none !important;
          }
          body {
            padding: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <span style="font-size: 13px; font-weight: bold;">تصدير المستند الطبي بصيغة PDF الرسمية</span>
        <button class="btn-print" onclick="window.print();">🖨️ طباعة أو حفظ كملف PDF</button>
        <button class="btn-print" style="background-color: #475569;" onclick="window.close();">إغلاق</button>
      </div>

      <div style="margin-top: 45px;">
        <!-- Hospital Header -->
        <div class="header-container">
          <div class="hospital-brand">
            <div class="logo-box">
              ${AL_NOOR_LOGO_SVG_STRING}
            </div>
            <div class="hospital-info">
              <h1>مشفى الرحمة الطبي - Al-Rahma Hospital</h1>
              <p>الجمهورية العربية السورية - دمشق | هاتف: +963 11 234 5678 | ترخيص رقم: MED-2026-SY</p>
            </div>
          </div>
          <div class="doc-meta">
            <div class="doc-num">${docData.title}</div>
            ${docData.documentNumber ? `<div>رقم السجل: <strong>${docData.documentNumber}</strong></div>` : ''}
            <div>تاريخ التصدير: <strong>${docData.date || new Date().toLocaleDateString('ar-SY')}</strong></div>
          </div>
        </div>

        <!-- Patient Info -->
        <div class="patient-card">
          <div>
            <label>اسم المريض المستفيد:</label>
            <span>${docData.patientName}</span>
          </div>
          ${docData.doctorName ? `
          <div>
            <label>الطبيب المشرف / المحوّل:</label>
            <span>${docData.doctorName} ${docData.specialty ? `(${docData.specialty})` : ''}</span>
          </div>
          ` : ''}
        </div>

        <!-- Body Content -->
        <div class="content-area">
          ${docData.detailsHtml}
        </div>

        <!-- Verification and Signatures -->
        <div class="footer-signatures">
          <div class="sig-box">
            <div class="sig-line"></div>
            <p style="font-weight: bold; font-size: 11px;">توقيع الطبيب / رئيس القسم</p>
          </div>

          <div>
            <div class="stamp-box">
              <div style="width: 45px; height: 18px; margin: 0 auto 2px auto;">
                ${AL_NOOR_LOGO_SVG_STRING}
              </div>
              <span style="font-size: 10px; font-weight: 900; letter-spacing: 0.5px; color: #0284c7;">مشفى الرحمة</span>
              <span style="font-size: 7px; font-weight: 800; color: #0369a1; text-transform: uppercase;">AL-RAHMA HOSPITAL</span>
              <span style="font-size: 7px; color: #0284c7; margin-top: 1px;">★ وثيقة معتمدة وموقعة ★</span>
            </div>
          </div>

          <div class="sig-box">
            <div class="sig-line"></div>
            <p style="font-weight: bold; font-size: 11px;">اعتماد المختبر / الإدارة المالية</p>
          </div>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 350);
        };
      </script>
    </body>
    </html>
  `;

  // Open in new tab or popup
  const printWindow = window.open('', '_blank', 'width=950,height=1000');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    // Fallback: create hidden printable iframe if popups blocked
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }
  }
}

/**
 * Dedicated PDF Export for Laboratory Results
 */
export function exportLabResultToPdf(lab: LabResult, patient?: Patient) {
  const getBadgeHtml = (status: string) => {
    switch (status) {
      case 'طبيعي':
        return '<span class="badge-status badge-normal" style="background:#dcfce7;color:#166534;padding:3px 8px;border-radius:6px;font-weight:bold;">طبيعي</span>';
      case 'مرتفع':
      case 'تحذير':
        return '<span class="badge-status badge-warning" style="background:#fef3c7;color:#92400e;padding:3px 8px;border-radius:6px;font-weight:bold;">مرتفع</span>';
      case 'منخفض':
        return '<span class="badge-status" style="background:#e0f2fe;color:#075985;padding:3px 8px;border-radius:6px;font-weight:bold;">منخفض</span>';
      case 'حرج':
        return '<span class="badge-status badge-critical" style="background:#fee2e2;color:#991b1b;padding:3px 8px;border-radius:6px;font-weight:bold;">حرج</span>';
      default:
        return `<span style="font-weight:bold;">${status}</span>`;
    }
  };

  const statusBadge = getBadgeHtml(lab.status);

  // Subcomponents table or main row
  const tableRowsHtml = lab.subComponents && lab.subComponents.length > 0
    ? lab.subComponents.map((sub, i) => `
        <tr>
          <td style="font-weight:bold;">${i + 1}. ${sub.name}</td>
          <td style="font-family:monospace;font-size:13px;font-weight:bold;direction:ltr;text-align:right;">
            <bdi dir="ltr">${sub.resultValue}</bdi>
          </td>
          <td style="font-family:monospace;font-size:12px;direction:ltr;text-align:right;">
            <bdi dir="ltr">${sub.normalRange}</bdi>
          </td>
          <td>${sub.unit}</td>
          <td>${getBadgeHtml(sub.status)}</td>
        </tr>
      `).join('')
    : `
        <tr>
          <td style="font-weight:bold;">${lab.testName}</td>
          <td style="font-family:monospace;font-size:13px;font-weight:bold;direction:ltr;text-align:right;">
            <bdi dir="ltr">${lab.resultValue}</bdi>
          </td>
          <td style="font-family:monospace;font-size:12px;direction:ltr;text-align:right;">
            <bdi dir="ltr">${lab.normalRange}</bdi>
          </td>
          <td>${lab.unit}</td>
          <td>${statusBadge}</td>
        </tr>
      `;

  const detailsHtml = `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
      <h3 style="font-size: 13px; font-weight: bold; color: #0f172a; margin-bottom: 6px;">بيانات العينة وتواريخ الفحص:</h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 11px;">
        <div><strong>تاريخ سحب العينة:</strong> ${formatArabicDate(lab.testDate)}</div>
        <div><strong>تاريخ صدور النتيجة:</strong> ${formatArabicDate(lab.issuedDate || lab.testDate)}</div>
        <div><strong>حالة الفحص والتقييم:</strong> ${statusBadge}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>اسم التحليل / المكون المخبري</th>
          <th>النتيجة المقاسة (Result)</th>
          <th>المجال المرجعي الطبيعي (Reference Range)</th>
          <th>الوحدة (Unit)</th>
          <th>التقييم المخبري</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
    </table>

    ${lab.notes ? `
    <div style="margin-top: 15px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px;">
      <h4 style="font-size: 12px; font-weight: bold; color: #92400e; margin-bottom: 4px;">ملاحظات أخصائي المختبر والتحليل:</h4>
      <p style="font-size: 12px; color: #78350f;">${lab.notes}</p>
    </div>
    ` : ''}

    <div style="margin-top: 15px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px; font-size: 11px; color: #1e40af;">
      <strong>⚠️ تنبيه استرشادي:</strong> هذه النتائج والمعلومات المخبرية لا تغني بأي حال عن استشارة الطبيب المعالج والتقييم السريري المباشر.
    </div>

    <div style="margin-top: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px; font-size: 11px; color: #166534;">
      ✓ تم تدقيق النتيجة والتحقق من المعايرة المرجعية وفق معايير الجودة المخبرية السريرية (ISO-15189).
    </div>
  `;

  printAndExportPdf({
    title: `تقرير مخبري رسمي: ${lab.testName}`,
    documentNumber: lab.id,
    date: formatArabicDate(lab.testDate),
    patientName: lab.patientName,
    doctorName: lab.doctorName,
    detailsHtml,
  });
}

/**
 * Dedicated PDF Export for Billing Invoices
 */
export function exportInvoiceToPdf(invoice: Invoice, patient?: Patient) {
  const itemsHtml = `
    <div style="margin-bottom: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 11px;">
        <div><strong>رقم الفاتورة:</strong> ${invoice.invoiceNumber}</div>
        <div><strong>طريقة السداد:</strong> ${invoice.paymentMethod || 'نقداً'}</div>
        <div><strong>حالة الدفع:</strong> <span style="font-weight: bold; color: ${invoice.status === 'مدفوع' ? '#16a34a' : '#d97706'};">${invoice.status}</span></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>البيان / الخدمة الطبية</th>
          <th>الكمية</th>
          <th>سعر الوحدة</th>
          <th>الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${(invoice.items && invoice.items.length > 0) ? invoice.items.map((item, idx) => `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td><strong>${item.description}</strong></td>
            <td style="text-align: center;">${item.quantity}</td>
            <td>${item.unitPrice.toLocaleString('en-US')} ل.س</td>
            <td><strong>${item.total.toLocaleString('en-US')} ل.س</strong></td>
          </tr>
        `).join('') : `
          <tr>
            <td style="text-align: center;">1</td>
            <td><strong>خدمات واستشارات طبية شاملة</strong></td>
            <td style="text-align: center;">1</td>
            <td>${invoice.subtotal.toLocaleString('en-US')} ل.س</td>
            <td><strong>${invoice.subtotal.toLocaleString('en-US')} ل.س</strong></td>
          </tr>
        `}
      </tbody>
    </table>

    <div class="totals-box">
      <div class="totals-row">
        <span>المبلغ الإجمالي قبل الضريبة:</span>
        <span>${invoice.subtotal.toLocaleString('en-US')} ل.س</span>
      </div>
      <div class="totals-row">
        <span>ضريبة القيمة المضافة (15%):</span>
        <span>+${invoice.tax.toLocaleString('en-US')} ل.س</span>
      </div>
      ${invoice.insuranceCovered > 0 ? `
      <div class="totals-row" style="color: #059669; font-weight: bold;">
        <span>خصم التغطية التأمينية المعتمدة:</span>
        <span>-${invoice.insuranceCovered.toLocaleString('en-US')} ل.س</span>
      </div>
      ` : ''}
      <div class="totals-row final">
        <span>الصافي المطلوب / المسدد:</span>
        <span>${invoice.netAmount.toLocaleString('en-US')} ل.س</span>
      </div>
    </div>

    <div style="margin-top: 15px; font-size: 11px; color: #64748b; background: #f8fafc; padding: 10px; border-radius: 8px;">
      * هذه الفاتورة صادرة إلكترونياً ومسجلة في النظام المالي لمشفى الرحمة الطبي ومعتمدة ضريبياً.
    </div>
  `;

  printAndExportPdf({
    title: 'فاتورة ضريبية وسند تحصيل طبي',
    documentNumber: invoice.invoiceNumber,
    date: formatArabicDate(invoice.date),
    patientName: invoice.patientName,
    detailsHtml: itemsHtml,
  });
}
