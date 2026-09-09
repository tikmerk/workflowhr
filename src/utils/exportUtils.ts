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
  const printFrame = document.createElement("iframe");
  printFrame.style.position = "fixed";
  printFrame.style.right = "0";
  printFrame.style.bottom = "0";
  printFrame.style.width = "0";
  printFrame.style.height = "0";
  printFrame.style.border = "0";
  document.body.appendChild(printFrame);

  const doc = printFrame.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Plus Jakarta Sans', sans-serif; color: #0f172a; }
          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body class="p-8 bg-white text-slate-900">
        ${htmlContent}
        <div class="mt-8 text-center text-[10px] text-slate-400 border-t pt-4">
          Generated via WorkFlowHR Enterprise • Developed By: Md. Ibrahim Hossain | Powered By: TIKMERK IT (https://tikmerk.com)
        </div>
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    printFrame.contentWindow?.focus();
    printFrame.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(printFrame);
    }, 1000);
  }, 500);
}

export function printPayslipDocument(payslipId: string): void {
  const elem = document.getElementById(payslipId);
  if (!elem) return;
  printDocumentHtml("Payslip - WorkFlowHR", elem.outerHTML);
}
