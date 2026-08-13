/**
 * Utility for Printing and Exporting Medical Documents as PDF
 */

import { AL_NOOR_LOGO_SVG_STRING } from '../components/HospitalLogo';

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
  const printWindow = window.open('', '_blank', 'width=900,height=1000');

  if (!printWindow) {
    // Fallback if popup blocked
    window.print();
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>${docData.title} - ${docData.patientName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Tajawal', Arial, sans-serif;
        }

        body {
          background-color: #ffffff;
          color: #0f172a;
          padding: 40px;
          direction: rtl;
          font-size: 14px;
          line-height: 1.6;
        }

        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #0284c7;
          padding-bottom: 20px;
          margin-bottom: 25px;
        }

        .hospital-brand {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .logo-box {
          width: 65px;
          height: 65px;
          background-color: #0f172a;
          border: 2px solid #0284c7;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
        }

        .hospital-info h1 {
          font-size: 22px;
          font-weight: 900;
          color: #0369a1;
        }

        .hospital-info p {
          font-size: 12px;
          color: #64748b;
        }

        .doc-meta {
          text-align: left;
          font-size: 12px;
          color: #334155;
        }

        .doc-meta .doc-num {
          font-weight: 800;
          font-size: 14px;
          color: #0f172a;
        }

        .patient-card {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 25px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .patient-card div {
          display: flex;
          flex-direction: column;
        }

        .patient-card label {
          font-size: 11px;
          color: #64748b;
          font-weight: bold;
        }

        .patient-card span {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }

        .content-area {
          margin-bottom: 35px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          margin-bottom: 20px;
        }

        th {
          background-color: #f1f5f9;
          color: #1e293b;
          font-weight: 800;
          text-align: right;
          padding: 12px;
          border: 1px solid #cbd5e1;
          font-size: 13px;
        }

        td {
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          font-size: 13px;
          color: #334155;
        }

        tr:nth-child(even) {
          background-color: #f8fafc;
        }

        .totals-box {
          background-color: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 15px;
          margin-top: 20px;
          width: 320px;
          margin-right: auto;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 13px;
        }

        .totals-row.final {
          border-top: 2px solid #0284c7;
          margin-top: 8px;
          padding-top: 8px;
          font-weight: 900;
          font-size: 16px;
          color: #0284c7;
        }

        .footer-signatures {
          margin-top: 60px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-top: 20px;
          border-top: 1px dashed #cbd5e1;
        }

        .sig-box {
          text-align: center;
          width: 200px;
        }

        .sig-line {
          border-bottom: 2px solid #94a3b8;
          height: 45px;
          margin-bottom: 8px;
        }

        .stamp-box {
          width: 125px;
          height: 125px;
          border: 3px double #0284c7;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #0284c7;
          font-weight: 900;
          font-size: 10px;
          transform: rotate(-8deg);
          opacity: 0.92;
          margin: 0 auto;
          padding: 8px;
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
          padding: 12px;
          display: flex;
          justify-content: center;
          gap: 15px;
          z-index: 9999;
        }

        .btn-print {
          background-color: #0284c7;
          color: white;
          border: none;
          padding: 8px 24px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-print:hover {
          background-color: #0369a1;
        }

        @media print {
          .no-print-bar {
            display: none !important;
          }
          body {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <button class="btn-print" onclick="window.print();">🖨️ طباعة أو حفظ كملف PDF</button>
        <button class="btn-print" style="background-color: #475569;" onclick="window.close();">إغلاق</button>
      </div>

      <div style="margin-top: 40px;">
        <!-- Hospital Header -->
        <div class="header-container">
          <div class="hospital-brand">
            <div class="logo-box">
              ${AL_NOOR_LOGO_SVG_STRING}
            </div>
            <div class="hospital-info">
              <h1>مشفى النور الطبي - Al-Noor Hospital</h1>
              <p>الجمهورية العربية السورية - دمشق | هاتف: +963 11 234 5678</p>
            </div>
          </div>
          <div class="doc-meta">
            <div class="doc-num">${docData.title}</div>
            ${docData.documentNumber ? `<div>رقم المستند: <strong>${docData.documentNumber}</strong></div>` : ''}
            <div>تاريخ الإصدار: <strong>${docData.date || new Date().toLocaleDateString('ar-SY')}</strong></div>
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
            <label>الطبيب المعالج / المشرف:</label>
            <span>${docData.doctorName} ${docData.specialty ? `(${docData.specialty})` : ''}</span>
          </div>
          ` : ''}
        </div>

        <!-- Body Content -->
        <div class="content-area">
          ${docData.detailsHtml}
        </div>

        <!-- Footer Signatures -->
        <div class="footer-signatures">
          <div class="sig-box">
            <div class="sig-line"></div>
            <p style="font-weight: bold; font-size: 12px;">توقيع الطبيب / المسجل</p>
          </div>

          <div>
            <div class="stamp-box">
              <div style="width: 50px; height: 22px; margin: 0 auto 2px auto;">
                ${AL_NOOR_LOGO_SVG_STRING}
              </div>
              <span style="font-size: 11px; font-weight: 900; letter-spacing: 0.5px; color: #0284c7;">مشفى النور</span>
              <span style="font-size: 8px; font-weight: 800; color: #0369a1; text-transform: uppercase;">AL-NOOR HOSPITAL</span>
              <span style="font-size: 8px; color: #0284c7; margin-top: 2px;">★ الختم الرسمي ★</span>
            </div>
          </div>

          <div class="sig-box">
            <div class="sig-line"></div>
            <p style="font-weight: bold; font-size: 12px;">اعتماد القسم المالي والمختبر</p>
          </div>
        </div>
      </div>

      <script>
        // Auto trigger print when page opens
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
