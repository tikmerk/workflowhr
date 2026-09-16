export function exportToCSV(filename: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) {
    return;
  }

  const separator = ",";
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    "\n" +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? "" : row[k];
            cell = typeof cell === "object" ? JSON.stringify(cell) : String(cell);
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function printDocumentHtml(title: string, htmlContent: string): void {
  const docTitle = title || "Salary Slip - WorkFlowHR";

  // 1. Mount into host window print container
  let printArea = document.getElementById("workflowhr-print-mount");
  if (!printArea) {
    printArea = document.createElement("div");
    printArea.id = "workflowhr-print-mount";
    document.body.appendChild(printArea);
  }
  printArea.innerHTML = `
    <div class="print-page-wrap" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; max-width: 800px; margin: 0 auto; background: #ffffff;">
      ${htmlContent}
      <div style="margin-top: 24px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px;">
        WorkFlowHR Enterprise Official Record • Developed By: Md. Ibrahim Hossain | Powered By: TIKMERK IT (https://tikmerk.com)
      </div>
    </div>
  `;

  let printStyle = document.getElementById("workflowhr-print-style");
  if (!printStyle) {
    printStyle = document.createElement("style");
    printStyle.id = "workflowhr-print-style";
    document.head.appendChild(printStyle);
  }
  printStyle.textContent = `
    #workflowhr-print-mount {
      display: none;
    }
    @media print {
      body > *:not(#workflowhr-print-mount) {
        display: none !important;
      }
      #workflowhr-print-mount {
        display: block !important;
        position: static !important;
        width: 100% !important;
        background: #ffffff !important;
        color: #0f172a !important;
        padding: 0 !important;
        margin: 0 auto !important;
      }
      @page {
        size: A4;
        margin: 10mm 15mm;
      }
    }
  `;

  // 2. Check if we are running inside an iframe (e.g. AI Studio development preview)
  const isInsideIframe = window.self !== window.top;

  if (isInsideIframe) {
    // In sandboxed iframes, window.print() is often blocked by browser security.
    // Opening a dedicated print popup window guarantees instant, automatic print!
    try {
      const fullHtml = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
  <style>
    @page { size: A4; margin: 10mm 15mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
    .sheet { background: #ffffff; max-width: 820px; margin: 0 auto; padding: 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .action-bar { max-width: 820px; margin: 0 auto 16px auto; display: flex; justify-content: space-between; align-items: center; }
    .btn { background: #0d9488; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; }
    .btn:hover { background: #0f766e; }
    @media print {
      body { background: white; padding: 0; }
      .sheet { box-shadow: none; border: none; padding: 0; max-width: 100%; }
      .action-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <span style="font-size: 12px; color: #64748b; font-weight: 600;">WorkFlowHR Enterprise • Official Document</span>
    <button class="btn" onclick="window.print()">🖨️ প্রিন্ট করুন (Print / Save as PDF)</button>
  </div>
  <div class="sheet">
    ${htmlContent}
    <div style="margin-top: 24px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px;">
      WorkFlowHR Enterprise Official Record • Powered By: TIKMERK IT
    </div>
  </div>
  <script>
    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 250);
    });
  </script>
</body>
</html>`;

      const printWin = window.open("", "_blank");
      if (printWin) {
        printWin.document.open();
        printWin.document.write(fullHtml);
        printWin.document.close();
        printWin.focus();
        return;
      }
    } catch (popupErr) {
      console.warn("Direct popup print fallback notice:", popupErr);
    }
  }

  // 3. Trigger host window print directly
  try {
    window.focus();
    window.print();
  } catch (err) {
    console.warn("Direct window.print call triggered exception:", err);
  }
}

export function openPayslipInNewWindow(slip: any, branding?: any): void {
  if (!slip) return;
  const htmlBody = generatePayslipHtml(slip, branding);
  const fullHtml = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${slip.employeeName || ""} (${slip.payrollMonth || ""})</title>
  <style>
    @page { size: A4; margin: 12mm 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
    .sheet { background: #ffffff; max-width: 820px; margin: 0 auto; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .action-bar { max-width: 820px; margin: 0 auto 16px auto; display: flex; justify-content: space-between; align-items: center; }
    .btn { background: #0d9488; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; }
    .btn:hover { background: #0f766e; }
    @media print {
      body { background: white; padding: 0; }
      .sheet { box-shadow: none; border: none; padding: 0; max-width: 100%; }
      .action-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <span style="font-size: 13px; font-weight: 600; color: #475569;">WorkFlowHR Enterprise Salary Slip & Certificate</span>
    <button class="btn" onclick="window.print()">🖨️ প্রিন্ট করুন (Print Now / Save as PDF)</button>
  </div>
  <div class="sheet">
    ${htmlBody}
  </div>
  <script>
    window.onload = function() {
      // Auto-trigger print when window opens
      setTimeout(function() {
        try { window.print(); } catch(e) {}
      }, 500);
    };
  </script>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8;" });
  const blobUrl = URL.createObjectURL(blob);
  const win = window.open(blobUrl, "_blank");
  if (!win) {
    // If popup was blocked, fallback to iframe print
    printDocumentHtml(`Payslip_${slip.employeeCode || "Slip"}`, htmlBody);
  }
}

export function generatePayslipHtml(
  slip: any,
  branding?: {
    companyName?: string;
    companyNameBn?: string;
    address?: string;
    addressBn?: string;
    phone?: string;
    email?: string;
  }
): string {
  if (!slip) return "";

  const company = branding?.companyName || "Muslim Welfare Organization";
  const companyBn = branding?.companyNameBn || "মুসলিম ওয়েলফেয়ার অর্গানাইজেশন";
  const address = branding?.address || "Gulshan Corporate Avenue, Dhaka-1212, Bangladesh";

  const basic = slip.basicSalary ?? 0;
  const houseRent = slip.houseRentAllowance ?? slip.houseRent ?? 0;
  const medical = slip.medicalAllowance ?? 0;
  const transport = slip.transportAllowance ?? 0;
  const special = slip.specialAllowance ?? 0;
  const overtime = slip.overtimePay ?? 0;
  const bonus = slip.festivalBonus ?? slip.bonusAmount ?? 0;
  const gross = slip.grossEarnings ?? (basic + houseRent + medical + transport + special + overtime + bonus);

  const pf = slip.providentFundDeduction ?? 0;
  const tax = slip.taxDeduction ?? 0;
  const late = slip.latePenaltyDeduction ?? slip.lateDeductionAmount ?? 0;
  const absent = slip.absenteeismDeduction ?? 0;
  const loan = slip.loanInstallmentDeduction ?? slip.loanEmiDeduction ?? slip.advanceSalaryDeduction ?? 0;
  const totalDed = slip.totalDeductions ?? (pf + tax + late + absent + loan);
  const net = slip.netSalary ?? Math.max(0, gross - totalDed);

  return `
    <div style="max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; line-height: 1.5;">
      <!-- Header -->
      <div style="border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #115e59; letter-spacing: -0.5px;">${company}</h1>
          <p style="margin: 2px 0 0 0; font-size: 13px; font-weight: 600; color: #0f766e;">${companyBn}</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">${address}</p>
          <p style="margin: 2px 0 0 0; font-size: 10px; color: #94a3b8;">Phone: ${branding?.phone || "+880 2-9887766"} | Email: ${branding?.email || "info@muslimwelfare.org"}</p>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; padding: 4px 12px; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; border-radius: 9999px; font-size: 11px; font-weight: 700;">
            ${slip.paymentStatus || "PAID"}
          </span>
          <p style="margin: 6px 0 0 0; font-size: 10px; font-family: monospace; color: #64748b;">VOUCHER: ${slip.id || "PS-2026"}</p>
          <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: 700; color: #0f172a;">Month: ${slip.payrollMonth || "Current"}</p>
          <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">Disbursed: ${slip.paymentDate || "Disbursed via Bank Transfer"}</p>
        </div>
      </div>

      <!-- Document Title -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 16px; margin-bottom: 16px; text-align: center;">
        <span style="font-size: 13px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 1px;">
          Official Monthly Salary Slip & Remuneration Certificate
        </span>
      </div>

      <!-- Employee Particulars Grid -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 11px; border: 1px solid #e2e8f0;">
        <div>
          <span style="display: block; color: #64748b; font-size: 10px; font-weight: 600;">EMPLOYEE NAME</span>
          <strong style="color: #0f172a; font-size: 12px;">${slip.employeeName || "N/A"}</strong>
        </div>
        <div>
          <span style="display: block; color: #64748b; font-size: 10px; font-weight: 600;">EMPLOYEE CODE</span>
          <strong style="color: #0f172a; font-size: 12px; font-family: monospace;">${slip.employeeCode || "N/A"}</strong>
        </div>
        <div>
          <span style="display: block; color: #64748b; font-size: 10px; font-weight: 600;">DESIGNATION</span>
          <strong style="color: #0f172a;">${slip.designationTitle || "Officer"}</strong>
        </div>
        <div>
          <span style="display: block; color: #64748b; font-size: 10px; font-weight: 600;">DEPARTMENT</span>
          <strong style="color: #0f172a;">${slip.departmentName || "Operations"}</strong>
        </div>
        <div style="grid-column: span 2;">
          <span style="display: block; color: #64748b; font-size: 10px; font-weight: 600;">BRANCH / WORK LOCATION</span>
          <strong style="color: #0f172a;">${slip.branchName || "Main Office"}</strong>
        </div>
        <div style="grid-column: span 2;">
          <span style="display: block; color: #64748b; font-size: 10px; font-weight: 600;">BANK ACCOUNT NUMBER</span>
          <strong style="color: #0f172a; font-family: monospace;">${slip.bankName || "City Bank"} - ${slip.bankAccountNumber || "Account Verified"}</strong>
        </div>
      </div>

      <!-- Salary Breakdown Table (2 Columns) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
        <!-- Earnings -->
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
          <div style="background: #e2e8f0; padding: 7px 12px; font-size: 11px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #cbd5e1;">
            EARNINGS & ALLOWANCES (আয় ও সুবিধাসমূহ)
          </div>
          <div style="padding: 10px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e2e8f0;">
              <span>Basic Salary (মূল বেতন):</span>
              <strong style="font-family: monospace;">৳${basic.toLocaleString()}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e2e8f0;">
              <span>House Rent (বাড়িভাড়া ভাতা):</span>
              <span style="font-family: monospace;">৳${houseRent.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e2e8f0;">
              <span>Medical Allowance (চিকিৎসা ভাতা):</span>
              <span style="font-family: monospace;">৳${medical.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e2e8f0;">
              <span>Transport Allowance (যাতায়াত ভাতা):</span>
              <span style="font-family: monospace;">৳${transport.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e2e8f0;">
              <span>Special Allowance (বিশেষ ভাতা):</span>
              <span style="font-family: monospace;">৳${special.toLocaleString()}</span>
            </div>
            ${
              bonus > 0
                ? `<div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e2e8f0; color: #b45309; font-weight: 700;">
                    <span>Festival Bonus (উৎসব বোনাস):</span>
                    <span style="font-family: monospace;">+৳${bonus.toLocaleString()}</span>
                  </div>`
                : ""
            }
            ${
              overtime > 0
                ? `<div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e2e8f0; color: #047857;">
                    <span>Overtime Pay (অতিরিক্ত সময়):</span>
                    <span style="font-family: monospace;">+৳${overtime.toLocaleString()}</span>
                  </div>`
                : ""
            }
            <div style="display: flex; justify-content: space-between; padding-top: 6px; margin-top: 4px; border-top: 2px solid #cbd5e1; font-weight: 700; color: #0f172a; font-size: 11px;">
              <span>Total Gross Earnings:</span>
              <strong style="font-family: monospace; color: #0f766e;">৳${gross.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        <!-- Deductions -->
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
          <div style="background: #e2e8f0; padding: 7px 12px; font-size: 11px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #cbd5e1;">
            DEDUCTIONS (কর্তনসমূহ)
          </div>
          <div style="padding: 10px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e2e8f0;">
              <span>Provident Fund (ভবিষ্য তহবিল):</span>
              <span style="font-family: monospace; color: #dc2626;">৳${pf.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e2e8f0;">
              <span>Income Tax (আয়কর):</span>
              <span style="font-family: monospace; color: #dc2626;">৳${tax.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e2e8f0;">
              <span>Late Clock-In Penalty:</span>
              <span style="font-family: monospace; color: #dc2626;">৳${late.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e2e8f0;">
              <span>Absenteeism Deduction:</span>
              <span style="font-family: monospace; color: #dc2626;">৳${absent.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e2e8f0;">
              <span>Loan EMI / Advance Recovery:</span>
              <span style="font-family: monospace; color: #dc2626;">৳${loan.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 6px; margin-top: 4px; border-top: 2px solid #cbd5e1; font-weight: 700; color: #0f172a; font-size: 11px;">
              <span>Total Deductions:</span>
              <strong style="font-family: monospace; color: #dc2626;">-৳${totalDed.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Net Disbursed Highlight Card -->
      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ccfbf1 100%); border: 2px solid #14b8a6; border-radius: 8px; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
        <div>
          <span style="display: block; font-size: 10px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 1px;">NET PAYABLE / DISBURSED SALARY (সর্বমোট প্রদেয় বেতন)</span>
          <span style="font-size: 11px; color: #475569;">Payment Method: ${slip.paymentMethod || "Bank Transfer"} | Account: ${slip.bankAccountNumber || "Verified"}</span>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 20px; font-weight: 900; color: #065f46; font-family: monospace;">৳${net.toLocaleString()} BDT</span>
        </div>
      </div>

      <!-- Signatures Footer -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; margin-top: 30px; padding-top: 15px; font-size: 10px;">
        <div>
          <div style="border-top: 1px solid #94a3b8; width: 75%; margin: 0 auto 6px auto;"></div>
          <strong style="display: block; color: #334155;">Prepared By</strong>
          <span style="color: #64748b; font-size: 9px;">Payroll & Accounts Officer</span>
        </div>
        <div>
          <div style="border-top: 1px solid #94a3b8; width: 75%; margin: 0 auto 6px auto;"></div>
          <strong style="display: block; color: #334155;">Verified By</strong>
          <span style="color: #64748b; font-size: 9px;">Head of HR & Admin</span>
        </div>
        <div>
          <div style="border-top: 1px solid #94a3b8; width: 75%; margin: 0 auto 6px auto;"></div>
          <strong style="display: block; color: #334155;">Approved By</strong>
          <span style="color: #64748b; font-size: 9px;">Executive Director / CEO</span>
        </div>
      </div>
    </div>
  `;
}

export function downloadPayslipDocument(
  slip: any,
  branding?: {
    companyName?: string;
    companyNameBn?: string;
    address?: string;
    addressBn?: string;
    phone?: string;
    email?: string;
  }
): void {
  if (!slip) return;

  const htmlBody = generatePayslipHtml(slip, branding);
  const employeeCode = slip.employeeCode || "Slip";
  const month = (slip.payrollMonth || "salary").replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `Payslip_${employeeCode}_${month}.html`;

  const fullHtml = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip - ${slip.employeeName || ""} (${slip.payrollMonth || ""})</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
    .sheet { background: #ffffff; max-width: 820px; margin: 0 auto; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .action-bar { max-width: 820px; margin: 0 auto 16px auto; display: flex; justify-content: space-between; align-items: center; }
    .btn { background: #0d9488; color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; }
    .btn:hover { background: #0f766e; }
    @media print {
      body { background: white; padding: 0; }
      .sheet { box-shadow: none; border: none; padding: 0; max-width: 100%; }
      .action-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <span style="font-size: 12px; color: #64748b;">WorkFlowHR Enterprise Salary Slip & Certificate</span>
    <button class="btn" onclick="window.print()">🖨️ প্রিন্ট করুন / Save as PDF</button>
  </div>
  <div class="sheet">
    ${htmlBody}
  </div>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printPayslipDirect(
  slip: any,
  branding?: {
    companyName?: string;
    companyNameBn?: string;
    address?: string;
    addressBn?: string;
    phone?: string;
    email?: string;
  }
): void {
  if (!slip) return;
  const html = generatePayslipHtml(slip, branding);
  printDocumentHtml(`Payslip_${slip.employeeCode || "Slip"}_${slip.payrollMonth || ""}`, html);
}

export function printPayslipDocument(idOrSlip: any, branding?: any): void {
  if (!idOrSlip) return;

  if (typeof idOrSlip === "object" && (idOrSlip.employeeName || idOrSlip.basicSalary !== undefined)) {
    printPayslipDirect(idOrSlip, branding);
    return;
  }

  if (typeof idOrSlip === "string") {
    const elem = document.getElementById(idOrSlip);
    if (elem) {
      printDocumentHtml("Official Payslip - WorkFlowHR", elem.outerHTML);
      return;
    }
  }
}

