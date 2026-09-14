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
  X,
  Award,
  Plus,
  Edit3,
  Percent,
  DollarSign
} from "lucide-react";
import { Payslip, Employee, Branch, CustomBonusConfig } from "../../types";
import { exportToCSV, printPayslipDocument } from "../../utils/exportUtils";

interface PayrollViewProps {
  payslips: Payslip[];
  employees: Employee[];
  branches: Branch[];
  customBonuses?: CustomBonusConfig[];
  onUpdateCustomBonuses?: (bonuses: CustomBonusConfig[]) => void;
  onGeneratePayroll: (month: string) => void;
  onDisburseAll: (month: string) => void;
}

const MONTH_OPTIONS = [
  "August 2026",
  "July 2026",
  "June 2026",
  "May 2026",
  "April 2026",
  "March 2026",
  "February 2026",
  "January 2026",
  "September 2026",
  "October 2026",
  "November 2026",
  "December 2026",
];

const MONTH_TO_KEY: Record<string, string> = {
  "January 2026": "2026-01",
  "February 2026": "2026-02",
  "March 2026": "2026-03",
  "April 2026": "2026-04",
  "May 2026": "2026-05",
  "June 2026": "2026-06",
  "July 2026": "2026-07",
  "August 2026": "2026-08",
  "September 2026": "2026-09",
  "October 2026": "2026-10",
  "November 2026": "2026-11",
  "December 2026": "2026-12",
};

export const PayrollView: React.FC<PayrollViewProps> = ({
  payslips,
  employees,
  branches,
  customBonuses = [],
  onUpdateCustomBonuses,
  onGeneratePayroll,
  onDisburseAll,
}) => {
  const [selectedMonth, setSelectedMonth] = useState("August 2026");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [activeSlip, setActiveSlip] = useState<Payslip | null>(null);

  // Quick Bonus Modal State inside Payroll
  const [showQuickBonusModal, setShowQuickBonusModal] = useState(false);
  const [qBonusTitle, setQBonusTitle] = useState("");
  const [qBonusCategory, setQBonusCategory] = useState<CustomBonusConfig["category"]>("POHELA_BOISHAKH");
  const [qBonusEffectiveMonth, setQBonusEffectiveMonth] = useState("2026-04");
  const [qBonusEffectiveDate, setQBonusEffectiveDate] = useState("2026-04-14");
  const [qBonusCalcType, setQBonusCalcType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [qBonusValue, setQBonusValue] = useState<number>(20);
  const [qBonusMaxCap, setQBonusMaxCap] = useState<number>(25000);
  const [qBonusTarget, setQBonusTarget] = useState<CustomBonusConfig["targetEligibility"]>("ALL_EMPLOYEES");

  const currentMonthKey = MONTH_TO_KEY[selectedMonth] || "2026-08";
  const applicableBonuses = customBonuses.filter(
    (b) => b.status !== "PAUSED" && b.effectiveMonth === currentMonthKey
  );

  const filteredSlips = payslips.filter((slip) => {
    const matchesMonth = slip.payrollMonth === selectedMonth;
    const matchesBranch = selectedBranch === "ALL" || slip.branchId === selectedBranch;
    return matchesMonth && matchesBranch;
  });

  const totalGross = filteredSlips.reduce((sum, s) => sum + s.grossEarnings, 0);
  const totalDeductions = filteredSlips.reduce((sum, s) => sum + s.totalDeductions, 0);
  const totalNet = filteredSlips.reduce((sum, s) => sum + s.netSalary, 0);
  const totalBonusDisbursed = filteredSlips.reduce((sum, s) => sum + (s.festivalBonus || 0), 0);

  const handleOpenQuickBonus = () => {
    setQBonusEffectiveMonth(currentMonthKey);
    setQBonusEffectiveDate(`${currentMonthKey}-15`);
    if (currentMonthKey === "2026-04") {
      setQBonusTitle("পহেলা বৈশাখী উৎসব ভাতা");
      setQBonusCategory("POHELA_BOISHAKH");
      setQBonusCalcType("PERCENTAGE");
      setQBonusValue(20);
      setQBonusMaxCap(25000);
    } else if (currentMonthKey === "2026-03") {
      setQBonusTitle("পবিত্র ঈদ-উল-ফিতর উৎসব বোনাস");
      setQBonusCategory("EID_UL_FITR");
      setQBonusCalcType("PERCENTAGE");
      setQBonusValue(50);
      setQBonusMaxCap(50000);
    } else if (currentMonthKey === "2026-06") {
      setQBonusTitle("পবিত্র ঈদ-উল-আযহা উৎসব বোনাস");
      setQBonusCategory("EID_UL_ADHA");
      setQBonusCalcType("PERCENTAGE");
      setQBonusValue(50);
      setQBonusMaxCap(50000);
    } else if (currentMonthKey === "2026-10") {
      setQBonusTitle("শারদীয় দুর্গোৎসব অনুদান");
      setQBonusCategory("DURGA_PUJA");
      setQBonusCalcType("FIXED_AMOUNT");
      setQBonusValue(15000);
      setQBonusMaxCap(20000);
    } else {
      setQBonusTitle(`উৎসব বোনাস (${selectedMonth})`);
      setQBonusCategory("SPECIAL_ALLOWANCE");
      setQBonusCalcType("PERCENTAGE");
      setQBonusValue(20);
      setQBonusMaxCap(25000);
    }
    setShowQuickBonusModal(true);
  };

  const handleSaveQuickBonus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qBonusTitle.trim() || !onUpdateCustomBonuses) return;
    const newBonus: CustomBonusConfig = {
      id: `bonus-${Date.now()}`,
      title: qBonusTitle.trim(),
      category: qBonusCategory,
      effectiveMonth: qBonusEffectiveMonth,
      effectiveDate: qBonusEffectiveDate,
      calculationType: qBonusCalcType,
      percentageRate: qBonusCalcType === "PERCENTAGE" ? Number(qBonusValue) : undefined,
      fixedAmount: qBonusCalcType === "FIXED_AMOUNT" ? Number(qBonusValue) : undefined,
      maxCapAmount: qBonusMaxCap ? Number(qBonusMaxCap) : undefined,
      targetEligibility: qBonusTarget,
      status: "ACTIVE",
    };
    onUpdateCustomBonuses([newBonus, ...customBonuses]);
    setShowQuickBonusModal(false);
  };

  const handleExportBankAdvice = () => {
    const data = filteredSlips.map((s) => ({
      "Employee ID": s.employeeCode,
      "Employee Name": s.employeeName,
      Branch: s.branchName,
      Department: s.departmentName,
      "Bank Name": s.bankName,
      "Account Number": s.bankAccountNumber,
      "Gross Salary (BDT)": s.grossEarnings,
      "Festival Bonus (BDT)": s.festivalBonus || 0,
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
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Automated Payroll & Salary Processing Engine</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              One-click calculation including Basic, House Rent, Allowances, PF, Tax, Attendance Deductions & Loan EMIs
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onGeneratePayroll(selectedMonth)}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Run {selectedMonth} Payroll</span>
            </button>

            <button
              onClick={() => onDisburseAll(selectedMonth)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Disburse All</span>
            </button>

            <button
              onClick={handleExportBankAdvice}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Bank Advice</span>
            </button>
          </div>
        </div>

        {/* Filters & Month Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Payroll Cycle Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} {m === "August 2026" ? "(Current Cycle)" : m === "April 2026" ? "🌸 (বৈশাখী ভাতা)" : m === "March 2026" ? "🌙 (ঈদ-উল-ফিতর)" : m === "June 2026" ? "🕌 (ঈদ-উল-আযহা)" : m === "October 2026" ? "🪔 (দুর্গোৎসব)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Filter by Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
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

        {/* Dynamic Festival & Custom Bonus Banner for Selected Month */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  {applicableBonuses.length > 0
                    ? `🎉 এই মাসের পে-রোলে উৎসব ভাতা প্রযোজ্য (${selectedMonth}):`
                    : `উৎসব বোনাস ও বিশেষ ভাতা নীতিমালা (${selectedMonth}):`}
                </span>
                {applicableBonuses.map((b) => (
                  <span
                    key={b.id}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1"
                  >
                    <span>{b.title}</span>
                    <span className="opacity-75">
                      ({b.calculationType === "PERCENTAGE" ? `${b.percentageRate}%` : `৳${b.fixedAmount}`})
                    </span>
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                {applicableBonuses.length > 0
                  ? `নির্ধারিত কর্মীদের মূল বেতনের ভিত্তিতে বা ফিক্সড রেটে পে-রোলে বোনাস স্বয়ংক্রিয়ভাবে যোগ হচ্ছে।`
                  : `এই মাসের পে-রোলের জন্য নির্দিষ্ট কোনো উৎসব বা বিশেষ বোনাস এখনও সেট করা হয়নি। আপনি চাইলে নতুন বোনাস যুক্ত করতে পারেন।`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenQuickBonus}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ নতুন বোনাস যুক্ত করুন</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Total Gross Earnings</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            ৳{(totalGross ?? 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-teal-700 dark:text-teal-400 mt-1 block font-semibold">
            Across {filteredSlips.length} Staff Members
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 shadow-xs">
          <span className="text-xs text-amber-800 dark:text-amber-300 block font-medium">Festival & Custom Bonuses</span>
          <span className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1 block">
            ৳{(totalBonusDisbursed ?? 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-amber-700 dark:text-amber-300 mt-1 block font-semibold">
            {applicableBonuses.length} active policy configured
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Total Deductions (PF, Tax, Late)</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            -৳{(totalDeductions ?? 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Statutory & company deductions
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
          <span className="text-xs text-emerald-800 dark:text-teal-300 block font-medium">Net Disbursed Amount</span>
          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1 block">
            ৳{(totalNet ?? 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-1 block font-semibold">
            100% Ready for Bank Transfer
          </span>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Branch</th>
                <th className="p-3">Basic Salary</th>
                <th className="p-3">Bonus / Allowance</th>
                <th className="p-3">Deductions</th>
                <th className="p-3">Net Disbursed</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredSlips.map((slip) => (
                <tr key={slip.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-white">{slip.employeeName}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {slip.employeeCode} • {slip.departmentName}
                    </div>
                  </td>

                  <td className="p-3 text-slate-800 dark:text-slate-300">{(slip.branchName || "Main Office").split("(")[0]}</td>

                  <td className="p-3 font-mono font-semibold text-slate-900 dark:text-slate-200">৳{(slip.basicSalary ?? 0).toLocaleString()}</td>

                  <td className="p-3 font-mono">
                    <div className="text-teal-700 dark:text-teal-400">
                      +৳{((slip.grossEarnings || 0) - (slip.basicSalary || 0)).toLocaleString()}
                    </div>
                    {(slip.festivalBonus || 0) > 0 && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 mt-0.5">
                        🎉 ৳{(slip.festivalBonus || 0).toLocaleString()} বোনাস
                      </span>
                    )}
                  </td>

                  <td className="p-3 font-mono text-rose-600 dark:text-rose-400">
                    -৳{(slip.totalDeductions ?? 0).toLocaleString()}
                  </td>

                  <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    ৳{(slip.netSalary ?? 0).toLocaleString()}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        slip.paymentStatus === "PAID"
                          ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {slip.paymentStatus}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    <button
                      onClick={() => setActiveSlip(slip)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-2xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-5 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Official Salary Certificate / Payslip ({activeSlip.payrollMonth})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printPayslipDocument(activeSlip)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setActiveSlip(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
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
                    {(activeSlip.festivalBonus || 0) > 0 && (
                      <div className="flex justify-between text-amber-800 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded">
                        <span>উৎসব বোনাস / ভাতা (Bonus):</span>
                        <span className="font-mono">+৳{(activeSlip.festivalBonus || 0).toLocaleString()}</span>
                      </div>
                    )}
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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK BONUS MODAL (DIRECT FROM PAYROLL) */}
      {showQuickBonusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    পে-রোলে নতুন উৎসব বোনাস যুক্ত করুন (Add Custom Bonus)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedMonth} পে-রোলে এই বোনাস স্বয়ংক্রিয়ভাবে কার্যকর হবে
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickBonusModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickBonus} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  বোনাসের নাম / শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: পহেলা বৈশাখী উৎসব ভাতা"
                  value={qBonusTitle}
                  onChange={(e) => setQBonusTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    ক্যাটাগরি
                  </label>
                  <select
                    value={qBonusCategory}
                    onChange={(e) => setQBonusCategory(e.target.value as CustomBonusConfig["category"])}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="POHELA_BOISHAKH">🌸 পহেলা বৈশাখী ভাতা</option>
                    <option value="EID_UL_FITR">🌙 ঈদ-উল-ফিতর বোনাস</option>
                    <option value="EID_UL_ADHA">🕌 ঈদ-উল-আযহা বোনাস</option>
                    <option value="DURGA_PUJA">🪔 শারদীয় দুর্গোৎসব</option>
                    <option value="PERFORMANCE_BONUS">🏆 পারফরম্যান্স বোনাস</option>
                    <option value="SPECIAL_ALLOWANCE">⭐ বিশেষ ভাতা</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    প্রযোজ্য পে-রোল মাস *
                  </label>
                  <input
                    type="month"
                    required
                    value={qBonusEffectiveMonth}
                    onChange={(e) => setQBonusEffectiveMonth(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    সুনির্দিষ্ট তারিখ (উৎসব দিন)
                  </label>
                  <input
                    type="date"
                    value={qBonusEffectiveDate}
                    onChange={(e) => setQBonusEffectiveDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    প্রযোজ্য কর্মী
                  </label>
                  <select
                    value={qBonusTarget}
                    onChange={(e) => setQBonusTarget(e.target.value as CustomBonusConfig["targetEligibility"])}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="ALL_EMPLOYEES">সকল কর্মী (All Staff)</option>
                    <option value="PERMANENT_ONLY">স্থায়ী কর্মী (Permanent)</option>
                    <option value="MUSLIM_EMPLOYEES">মুসলিম কর্মী (Eid)</option>
                    <option value="HINDU_EMPLOYEES">সনাতন ধর্মাবলম্বী কর্মী (Puja)</option>
                  </select>
                </div>
              </div>

              {/* Calculation Method */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 space-y-3">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  বোনাসের হিসাবের ধরন:
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="qCalcType"
                      checked={qBonusCalcType === "PERCENTAGE"}
                      onChange={() => setQBonusCalcType("PERCENTAGE")}
                      className="text-amber-500 focus:ring-amber-400"
                    />
                    <span>মূল বেতনের শতকরা হার (%)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="qCalcType"
                      checked={qBonusCalcType === "FIXED_AMOUNT"}
                      onChange={() => setQBonusCalcType("FIXED_AMOUNT")}
                      className="text-amber-500 focus:ring-amber-400"
                    />
                    <span>নির্দিষ্ট ফিক্সড টাকা (৳)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-500 mb-1">
                      {qBonusCalcType === "PERCENTAGE" ? "শতকরা হার (যেমন: ২০% বা ৫০%):" : "ফিক্সড টাকার পরিমাণ (৳):"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={qBonusValue}
                      onChange={(e) => setQBonusValue(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">
                      সর্বোচ্চ ক্যাপ (Max Cap ৳ - ঐচ্ছিক):
                    </label>
                    <input
                      type="number"
                      value={qBonusMaxCap}
                      onChange={(e) => setQBonusMaxCap(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuickBonusModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>বোনাস নিশ্চিত করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
