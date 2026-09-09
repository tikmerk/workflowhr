import React, { useState } from "react";
import {
  CreditCard,
  Banknote,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Building2,
  Calendar,
  Layers,
  FileText,
  X
} from "lucide-react";
import { Payslip, Employee, Branch } from "../../types";
import { exportToCSV, printPayslipDocument } from "../../utils/exportUtils";

interface PayrollViewProps {
  payslips: Payslip[];
  employees: Employee[];
  branches: Branch[];
  onGeneratePayroll: (month: string) => void;
  onDisburseAll: (month: string) => void;
}

export const PayrollView: React.FC<PayrollViewProps> = ({
  payslips,
  employees,
  branches,
  onGeneratePayroll,
  onDisburseAll,
}) => {
  const [selectedMonth, setSelectedMonth] = useState("August 2026");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [activeSlip, setActiveSlip] = useState<Payslip | null>(null);

  const filteredSlips = payslips.filter((slip) => {
    const matchesMonth = slip.payrollMonth === selectedMonth;
    const matchesBranch = selectedBranch === "ALL" || slip.branchId === selectedBranch;
    return matchesMonth && matchesBranch;
  });

  const totalGross = filteredSlips.reduce((sum, s) => sum + s.grossEarnings, 0);
  const totalDeductions = filteredSlips.reduce((sum, s) => sum + s.totalDeductions, 0);
  const totalNet = filteredSlips.reduce((sum, s) => sum + s.netSalary, 0);

  const handleExportBankAdvice = () => {
    const data = filteredSlips.map((s) => ({
      "Employee ID": s.employeeCode,
      "Employee Name": s.employeeName,
      Branch: s.branchName,
      Department: s.departmentName,
      "Bank Name": s.bankName,
      "Account Number": s.bankAccountNumber,
      "Gross Salary (BDT)": s.grossEarnings,
      "Provident Fund (BDT)": s.providentFundDeduction,
      "Tax (BDT)": s.taxDeduction,
      "Late Deductions (BDT)": s.lateDeductionAmount,
      "Loan EMI (BDT)": s.loanInstallmentDeduction,
      "Net Payable Salary (BDT)": s.netSalary,
      "Payment Status": s.paymentStatus,
    }));
    exportToCSV(`Bank_Salary_Disbursement_${selectedMonth.replace(" ", "_")}`, data);
  };

  return (
    <div id="payroll-management-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-400" />
              <span>Automated Payroll & Salary Processing Engine</span>
            </h2>
            <p className="text-xs text-slate-400">
              One-click calculation including Basic, House Rent, Allowances, PF, Tax, Attendance Deductions & Loan EMIs
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onGeneratePayroll(selectedMonth)}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Run {selectedMonth} Payroll</span>
            </button>

            <button
              onClick={() => onDisburseAll(selectedMonth)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Disburse All</span>
            </button>

            <button
              onClick={handleExportBankAdvice}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Bank Advice</span>
            </button>
          </div>
        </div>

        {/* Filters & Month Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Payroll Cycle Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            >
              <option value="August 2026">August 2026 (Current Cycle)</option>
              <option value="July 2026">July 2026</option>
              <option value="June 2026">June 2026</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Filter by Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            >
              <option value="ALL">All Branch Locations</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Total Gross Earnings</span>
          <span className="text-2xl font-black text-white mt-1 block">
            ৳{(totalGross ?? 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-teal-400 mt-1 block">
            Across {filteredSlips.length} Staff Members
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Total Deductions (PF, Tax, Late)</span>
          <span className="text-2xl font-black text-red-400 mt-1 block">
            -৳{(totalDeductions ?? 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Statutory & company deductions
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-teal-500/30 bg-teal-500/5">
          <span className="text-xs text-teal-300 block font-medium">Net Disbursed Amount</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">
            ৳{(totalNet ?? 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-300 mt-1 block">
            100% Ready for Bank Transfer
          </span>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Branch</th>
                <th className="p-3">Basic Salary</th>
                <th className="p-3">Allowances</th>
                <th className="p-3">Deductions</th>
                <th className="p-3">Net Disbursed</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredSlips.map((slip) => (
                <tr key={slip.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-white">{slip.employeeName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {slip.employeeCode} • {slip.departmentName}
                    </div>
                  </td>

                  <td className="p-3">{(slip.branchName || "Main Office").split("(")[0]}</td>

                  <td className="p-3 font-mono font-semibold">৳{(slip.basicSalary ?? 0).toLocaleString()}</td>

                  <td className="p-3 font-mono text-teal-400">
                    +৳{((slip.grossEarnings || 0) - (slip.basicSalary || 0)).toLocaleString()}
                  </td>

                  <td className="p-3 font-mono text-red-400">
                    -৳{(slip.totalDeductions ?? 0).toLocaleString()}
                  </td>

                  <td className="p-3 font-mono font-bold text-emerald-400">
                    ৳{(slip.netSalary ?? 0).toLocaleString()}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        slip.paymentStatus === "PAID"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {slip.paymentStatus}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    <button
                      onClick={() => setActiveSlip(slip)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                      title="View & Print Official Payslip"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Official Printable Payslip Document */}
      {activeSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl text-slate-100 shadow-2xl space-y-5 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">
                  Official Salary Certificate / Payslip ({activeSlip.payrollMonth})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printPayslipDocument(activeSlip)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setActiveSlip(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Box */}
            <div className="p-6 rounded-2xl bg-white text-slate-900 shadow-xl space-y-4 font-sans text-xs">
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-teal-900 tracking-tight">APEX GLOBAL TECH LTD.</h2>
                  <p className="text-[11px] text-slate-600">
                    {activeSlip.branchName} • Level 12, Gulshan Avenue, Dhaka
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Official Salary Slip for the month of {activeSlip.payrollMonth}
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-black text-xs">
                    {activeSlip.paymentStatus}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">Disbursed on {activeSlip.paymentDate || "Aug 31, 2026"}</p>
                </div>
              </div>

              {/* Employee Particulars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 block font-bold">Employee Name</span>
                  <span className="font-bold text-slate-900">{activeSlip.employeeName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-bold">Employee Code</span>
                  <span className="font-bold text-slate-900 font-mono">{activeSlip.employeeCode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-bold">Designation</span>
                  <span className="font-bold text-slate-900">{activeSlip.designationTitle}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-bold">Bank Account</span>
                  <span className="font-bold text-slate-900 font-mono">{activeSlip.bankAccountNumber}</span>
                </div>
              </div>

              {/* Earnings & Deductions 2-Column Split */}
              <div className="grid grid-cols-2 gap-4">
                {/* Earnings Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 text-[11px]">
                    Earnings Breakdown
                  </div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex justify-between">
                      <span>Basic Pay:</span>
                      <span className="font-mono font-bold">৳{(activeSlip.basicSalary ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>House Rent:</span>
                      <span className="font-mono">৳{(activeSlip.houseRent ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Medical Allowance:</span>
                      <span className="font-mono">৳{(activeSlip.medicalAllowance ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Transport Allowance:</span>
                      <span className="font-mono">৳{(activeSlip.transportAllowance ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Special Allowance:</span>
                      <span className="font-mono">৳{(activeSlip.specialAllowance ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-bold text-slate-900">
                      <span>Gross Earnings:</span>
                      <span className="font-mono">৳{(activeSlip.grossEarnings ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 text-[11px]">
                    Deductions Breakdown
                  </div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Provident Fund (8%):</span>
                      <span className="font-mono text-red-600">
                        ৳{(activeSlip.providentFundDeduction ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Income Tax:</span>
                      <span className="font-mono text-red-600">৳{(activeSlip.taxDeduction ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Late Clock-In Penalty:</span>
                      <span className="font-mono text-red-600">
                        ৳{(activeSlip.lateDeductionAmount ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Loan EMI Repayment:</span>
                      <span className="font-mono text-red-600">
                        ৳{(activeSlip.loanInstallmentDeduction ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-bold text-slate-900">
                      <span>Total Deductions:</span>
                      <span className="font-mono text-red-600">
                        ৳{(activeSlip.totalDeductions ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Disbursed Highlight */}
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-teal-800 font-bold block uppercase tracking-wider">
                    Net Take-Home Disbursed
                  </span>
                  <span className="text-slate-600 text-[10px]">
                    Credited directly to {activeSlip.bankName}
                  </span>
                </div>
                <span className="text-xl font-black text-teal-900 font-mono">
                  ৳{(activeSlip.netSalary ?? 0).toLocaleString()} BDT
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveSlip(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
