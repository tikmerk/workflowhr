import React, { useState, useMemo, useEffect } from "react";
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
  DollarSign,
  Clock,
  ShieldCheck,
  HelpCircle,
  History,
  Sliders,
  Search,
  Filter,
  Check,
  RotateCcw,
  FileSpreadsheet,
  UserCheck,
  ChevronRight,
  TrendingDown,
  Info,
  ArrowRight,
  Save,
  Trash2,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  CalendarDays,
  ShieldAlert,
  Home,
  HeartPulse,
  Bus,
  Zap,
  Ban,
  Calculator,
  Settings2,
} from "lucide-react";
import { Payslip, Employee, Branch, CustomBonusConfig, PayrollPolicyConfig } from "../../types";
import { exportToCSV, printPayslipDocument, openPayslipInNewWindow } from "../../utils/exportUtils";
import { normalizeMonthKey } from "../../utils/payrollEngine";
import { useCompanyBranding } from "../../context/CompanyBrandingContext";

interface PayrollViewProps {
  payslips: Payslip[];
  employees: Employee[];
  branches: Branch[];
  currentUser?: Employee;
  payrollPolicy?: PayrollPolicyConfig;
  onUpdatePayrollPolicy?: (newPolicy: PayrollPolicyConfig) => void;
  customBonuses?: CustomBonusConfig[];
  onUpdateCustomBonuses?: (bonuses: CustomBonusConfig[]) => void;
  onGeneratePayroll: (month: string) => void;
  onDisburseAll: (month: string) => void;
  onApproveAll?: (month: string) => void;
  onApprovePayslip?: (slipId: string) => void;
  onDisbursePayslip?: (slipId: string) => void;
  onUpdatePayslip?: (slip: Payslip) => void;
}

export interface BengaliMonthItem {
  key: string;
  nameBn: string;
  nameEn: string;
  festivalBadge?: string;
  isCurrent?: boolean;
}

export const BENGALI_MONTHS: BengaliMonthItem[] = [
  { key: "01", nameBn: "জানুয়ারি", nameEn: "January" },
  { key: "02", nameBn: "ফেব্রুয়ারি", nameEn: "February" },
  { key: "03", nameBn: "মার্চ", nameEn: "March", festivalBadge: "🌙 ঈদ-উল-ফিতর" },
  { key: "04", nameBn: "এপ্রিল", nameEn: "April", festivalBadge: "🌸 বৈশাখী উৎসব" },
  { key: "05", nameBn: "মে", nameEn: "May" },
  { key: "06", nameBn: "জুন", nameEn: "June", festivalBadge: "🕌 ঈদ-উল-আযহা" },
  { key: "07", nameBn: "জুলাই", nameEn: "July" },
  { key: "08", nameBn: "আগস্ট", nameEn: "August" },
  { key: "09", nameBn: "সেপ্টেম্বর", nameEn: "September", isCurrent: true, festivalBadge: "চলতি মাস" },
  { key: "10", nameBn: "অক্টোবর", nameEn: "October", festivalBadge: "🪔 দুর্গাপূজা" },
  { key: "11", nameBn: "নভেম্বর", nameEn: "November" },
  { key: "12", nameBn: "ডিসেম্বর", nameEn: "December", festivalBadge: "বছর সমাপনী" },
];

export const YEARS_LIST = [2026, 2025, 2024, 2027];

const MONTH_OPTIONS = [
  "September 2026",
  "August 2026",
  "July 2026",
  "June 2026",
  "May 2026",
  "April 2026",
  "March 2026",
  "February 2026",
  "January 2026",
];

const DEFAULT_POLICY: PayrollPolicyConfig = {
  latePenaltyEnabled: true,
  latePenaltyType: "STANDARD_3_LATE_1_DAY",
  latePenaltyFixedAmount: 200,
  latePenaltyPercentage: 1,
  lateGracePeriodMinutes: 15,
  exemptFieldStaffFromPenalty: true,
  fixedSalaryStaffNoDeductions: true,

  absenteeismPenaltyEnabled: true,
  absentPenaltyEnabled: true,
  absenteeismPenaltyType: "DAILY_BASIC_1_TO_1",
  absenteeismFixedPenaltyAmount: 1000,

  overtimeEnabled: true,
  overtimeCalculationType: "ONE_POINT_FIVE_BASIC",
  overtimeFixedHourlyRate: 200,
  standardDailyWorkHours: 8,

  houseRentCalculationMode: "PERCENTAGE",
  houseRentAllowanceType: "PERCENTAGE",
  defaultHouseRentPercentage: 40,
  houseRentFixedAmount: 15000,

  medicalCalculationMode: "PERCENTAGE",
  medicalAllowanceType: "PERCENTAGE",
  defaultMedicalPercentage: 10,
  medicalFixedAmount: 5000,

  transportCalculationMode: "PERCENTAGE",
  transportAllowanceType: "PERCENTAGE",
  defaultTransportPercentage: 10,
  transportFixedAmount: 3000,

  specialCalculationMode: "PERCENTAGE",
  specialAllowanceType: "PERCENTAGE",
  defaultSpecialPercentage: 10,
  specialFixedAmount: 2000,

  advanceSalaryRecoveryMonths: 1,
  defaultProvidentFundPercentage: 8,
  defaultTaxPercentage: 5,
  salaryDisbursementPolicy: "BOTH",
};

export const PayrollView: React.FC<PayrollViewProps> = ({
  payslips,
  employees,
  branches,
  currentUser,
  payrollPolicy = DEFAULT_POLICY,
  onUpdatePayrollPolicy,
  customBonuses = [],
  onUpdateCustomBonuses,
  onGeneratePayroll,
  onDisburseAll,
  onApproveAll,
  onApprovePayslip,
  onDisbursePayslip,
  onUpdatePayslip,
}) => {
  const { branding, updateBranding } = useCompanyBranding();

  // Role-Based Access Control (RBAC) Determination for Payroll Management
  const isPayrollAdmin = useMemo(() => {
    if (!currentUser) return false;
    const role = String(currentUser.role || "").toUpperCase();
    const desig = String(currentUser.designationTitle || "").toLowerCase();
    const dept = String(currentUser.departmentName || "").toLowerCase();

    if (
      role === "SUPER_ADMIN" ||
      role === "COMPANY_ADMIN" ||
      role === "CEO" ||
      role === "HR_MANAGER" ||
      role === "ACCOUNTS_MANAGER" ||
      role === "ACCOUNT_PAYROLL" ||
      role === "GRAND_ADMIN" ||
      currentUser.isSuperAdmin ||
      currentUser.isCeoOrOwner
    ) {
      return true;
    }

    if (
      desig.includes("ceo") ||
      desig.includes("director") ||
      desig.includes("managing director") ||
      desig.includes("accountant") ||
      desig.includes("accounts") ||
      desig.includes("finance") ||
      desig.includes("hr manager") ||
      desig.includes("payroll")
    ) {
      return true;
    }

    if (dept.includes("account") || dept.includes("finance") || dept.includes("human resources")) {
      return true;
    }

    return false;
  }, [currentUser]);

  // General employees can ONLY see their own payslips (Strict Privacy & Separation of Duties)
  const accessiblePayslips = useMemo(() => {
    if (isPayrollAdmin) {
      return payslips;
    }
    if (!currentUser) {
      return [];
    }
    return payslips.filter((slip) => slip.employeeId === currentUser.id);
  }, [payslips, isPayrollAdmin, currentUser]);

  // Active Main Sub-Tab
  const [activeMainTab, setActiveMainTab] = useState<"REGISTER" | "POLICY" | "BONUSES" | "HISTORY">("REGISTER");

  // Enforce tab access: If non-admin attempts to view POLICY or BONUSES tabs, redirect to REGISTER
  useEffect(() => {
    if (!isPayrollAdmin && (activeMainTab === "POLICY" || activeMainTab === "BONUSES")) {
      setActiveMainTab("REGISTER");
    }
  }, [isPayrollAdmin, activeMainTab]);

  // Hierarchical Year and Month Selection
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<string>("09"); // Default September (09)
  const [selectedMonth, setSelectedMonth] = useState("September 2026");
  const [historyYear, setHistoryYear] = useState<number>(2026);

  // Filter States
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "PENDING_APPROVAL" | "APPROVED" | "PAID">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Details
  const [activeSlip, setActiveSlip] = useState<Payslip | null>(null);
  const [showWorkflowExplainer, setShowWorkflowExplainer] = useState(false);

  // Policy Form State
  const [policyDraft, setPolicyDraft] = useState<PayrollPolicyConfig>({
    ...DEFAULT_POLICY,
    ...payrollPolicy,
  });
  const [policySavedToast, setPolicySavedToast] = useState(false);

  useEffect(() => {
    if (payrollPolicy) {
      setPolicyDraft((prev) => ({
        ...DEFAULT_POLICY,
        ...prev,
        ...payrollPolicy,
      }));
    }
  }, [payrollPolicy]);

  // Quick Bonus Modal State inside Payroll (supports both Add & Edit)
  const [showQuickBonusModal, setShowQuickBonusModal] = useState(false);
  const [editingBonusId, setEditingBonusId] = useState<string | null>(null);
  const [qBonusTitle, setQBonusTitle] = useState("");
  const [qBonusCategory, setQBonusCategory] = useState<CustomBonusConfig["category"]>("POHELA_BOISHAKH");
  const [qBonusEffectiveMonth, setQBonusEffectiveMonth] = useState("2026-09");
  const [qBonusEffectiveDate, setQBonusEffectiveDate] = useState("2026-09-15");
  const [qBonusCalcType, setQBonusCalcType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [qBonusValue, setQBonusValue] = useState<number>(20);
  const [qBonusMaxCap, setQBonusMaxCap] = useState<number>(25000);
  const [qBonusTarget, setQBonusTarget] = useState<CustomBonusConfig["targetEligibility"]>("ALL_EMPLOYEES");

  // Selected month normalized key (e.g. "2026-09")
  const currentMonthKey = normalizeMonthKey(selectedMonth);

  // Helper to switch Year & Month seamlessly
  const handleSelectYearMonth = (year: number, monthKey: string) => {
    setSelectedYear(year);
    setSelectedMonthIndex(monthKey);
    const m = BENGALI_MONTHS.find((item) => item.key === monthKey);
    if (m) {
      setSelectedMonth(`${m.nameEn} ${year}`);
    }
  };

  // Applicable bonuses for current selected cycle (excludes deactivated / paused bonuses)
  const applicableBonuses = useMemo(() => {
    return customBonuses.filter(
      (b) => b.status !== "PAUSED" && b.status !== "INACTIVE" && normalizeMonthKey(b.effectiveMonth) === currentMonthKey
    );
  }, [customBonuses, currentMonthKey]);

  // Filtered Payslips with robust month & branch matching scoped to accessiblePayslips
  const filteredSlips = useMemo(() => {
    return accessiblePayslips.filter((slip) => {
      const slipMonthKey = normalizeMonthKey(slip.payrollMonth);
      const matchesMonth = selectedMonth === "ALL" || slipMonthKey === currentMonthKey;
      const matchesBranch = selectedBranch === "ALL" || slip.branchId === selectedBranch;
      const matchesStatus = selectedStatus === "ALL" || slip.paymentStatus === selectedStatus;
      const matchesSearch =
        !searchQuery.trim() ||
        slip.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        slip.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (slip.departmentName || "").toLowerCase().includes(searchQuery.toLowerCase());

      return matchesMonth && matchesBranch && matchesStatus && matchesSearch;
    });
  }, [accessiblePayslips, selectedMonth, currentMonthKey, selectedBranch, selectedStatus, searchQuery]);

  // Summary Metrics
  const totalGross = filteredSlips.reduce((sum, s) => sum + (s.grossEarnings || 0), 0);
  const totalDeductions = filteredSlips.reduce((sum, s) => sum + (s.totalDeductions || 0), 0);
  const totalNet = filteredSlips.reduce((sum, s) => sum + (s.netSalary || 0), 0);
  const totalBonusDisbursed = filteredSlips.reduce((sum, s) => sum + (s.festivalBonus || 0), 0);

  const countPending = filteredSlips.filter((s) => s.paymentStatus === "PENDING_APPROVAL").length;
  const countApproved = filteredSlips.filter((s) => s.paymentStatus === "APPROVED").length;
  const countPaid = filteredSlips.filter((s) => s.paymentStatus === "PAID").length;

  // Handlers for Bonus Modal (supports Add & Edit)
  const handleOpenQuickBonus = (presetCategory?: CustomBonusConfig["category"], bonusToEdit?: CustomBonusConfig) => {
    if (bonusToEdit) {
      setEditingBonusId(bonusToEdit.id);
      setQBonusTitle(bonusToEdit.title);
      setQBonusCategory(bonusToEdit.category);
      setQBonusEffectiveMonth(bonusToEdit.effectiveMonth || currentMonthKey);
      setQBonusEffectiveDate(bonusToEdit.effectiveDate || `${currentMonthKey}-15`);
      setQBonusCalcType(bonusToEdit.calculationType || "PERCENTAGE");
      setQBonusValue(bonusToEdit.amountOrPercentage ?? bonusToEdit.percentageRate ?? bonusToEdit.fixedAmount ?? 20);
      setQBonusMaxCap(bonusToEdit.maxCap || bonusToEdit.maxCapAmount || 25000);
      setQBonusTarget(bonusToEdit.targetEligibility || "ALL_EMPLOYEES");
    } else {
      setEditingBonusId(null);
      setQBonusEffectiveMonth(currentMonthKey);
      setQBonusEffectiveDate(`${currentMonthKey}-15`);
      if (presetCategory === "POHELA_BOISHAKH" || currentMonthKey.endsWith("-04")) {
        setQBonusTitle("পহেলা বৈশাখী উৎসব ভাতা (Pohela Boishakh)");
        setQBonusCategory("POHELA_BOISHAKH");
        setQBonusCalcType("PERCENTAGE");
        setQBonusValue(20);
        setQBonusMaxCap(25000);
      } else if (presetCategory === "EID_UL_FITR" || currentMonthKey.endsWith("-03")) {
        setQBonusTitle("পবিত্র ঈদ-উল-ফিতর উৎসব বোনাস (Eid-ul-Fitr)");
        setQBonusCategory("EID_UL_FITR");
        setQBonusCalcType("PERCENTAGE");
        setQBonusValue(50);
        setQBonusMaxCap(50000);
      } else if (presetCategory === "EID_UL_ADHA" || currentMonthKey.endsWith("-06")) {
        setQBonusTitle("পবিত্র ঈদ-উল-আযহা উৎসব বোনাস (Eid-ul-Adha)");
        setQBonusCategory("EID_UL_ADHA");
        setQBonusCalcType("PERCENTAGE");
        setQBonusValue(50);
        setQBonusMaxCap(50000);
      } else if (presetCategory === "DURGA_PUJA" || currentMonthKey.endsWith("-10")) {
        setQBonusTitle("শারদীয় দুর্গোৎসব অনুদান ও বোনাস");
        setQBonusCategory("DURGA_PUJA");
        setQBonusCalcType("FIXED_AMOUNT");
        setQBonusValue(15000);
        setQBonusMaxCap(20000);
      } else {
        setQBonusTitle(`উৎসব বোনাস / পারফরম্যান্স ইনসেনটিভ (${selectedMonth})`);
        setQBonusCategory("SPECIAL_ALLOWANCE");
        setQBonusCalcType("PERCENTAGE");
        setQBonusValue(25);
        setQBonusMaxCap(30000);
      }
      setQBonusTarget("ALL_EMPLOYEES");
    }
    setShowQuickBonusModal(true);
  };

  const handleSaveQuickBonus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qBonusTitle.trim() || !onUpdateCustomBonuses) return;

    if (editingBonusId) {
      const updated = customBonuses.map((b) => {
        if (b.id === editingBonusId) {
          return {
            ...b,
            title: qBonusTitle.trim(),
            category: qBonusCategory,
            effectiveMonth: qBonusEffectiveMonth,
            effectiveDate: qBonusEffectiveDate,
            calculationType: qBonusCalcType,
            amountOrPercentage: Number(qBonusValue),
            percentageRate: qBonusCalcType === "PERCENTAGE" ? Number(qBonusValue) : undefined,
            fixedAmount: qBonusCalcType === "FIXED_AMOUNT" ? Number(qBonusValue) : undefined,
            maxCap: qBonusMaxCap ? Number(qBonusMaxCap) : undefined,
            maxCapAmount: qBonusMaxCap ? Number(qBonusMaxCap) : undefined,
            targetEligibility: qBonusTarget,
          };
        }
        return b;
      });
      onUpdateCustomBonuses(updated);
    } else {
      const newBonus: CustomBonusConfig = {
        id: `bonus-${Date.now()}`,
        title: qBonusTitle.trim(),
        category: qBonusCategory,
        effectiveMonth: qBonusEffectiveMonth,
        effectiveDate: qBonusEffectiveDate,
        calculationType: qBonusCalcType,
        amountOrPercentage: Number(qBonusValue),
        percentageRate: qBonusCalcType === "PERCENTAGE" ? Number(qBonusValue) : undefined,
        fixedAmount: qBonusCalcType === "FIXED_AMOUNT" ? Number(qBonusValue) : undefined,
        maxCap: qBonusMaxCap ? Number(qBonusMaxCap) : undefined,
        maxCapAmount: qBonusMaxCap ? Number(qBonusMaxCap) : undefined,
        targetEligibility: qBonusTarget,
        status: "ACTIVE",
      };
      onUpdateCustomBonuses([newBonus, ...customBonuses]);
    }
    setShowQuickBonusModal(false);
    setEditingBonusId(null);
  };

  // Toggle bonus between ACTIVE and INACTIVE
  const handleToggleBonusStatus = (bonusId: string) => {
    if (!onUpdateCustomBonuses) return;
    const updated = customBonuses.map((b) => {
      if (b.id === bonusId) {
        const isCurrentlyActive = b.status === "ACTIVE" || !b.status;
        return {
          ...b,
          status: (isCurrentlyActive ? "INACTIVE" : "ACTIVE") as CustomBonusConfig["status"],
        };
      }
      return b;
    });
    onUpdateCustomBonuses(updated);
  };

  const handleDeleteBonus = (bonusId: string) => {
    if (!onUpdateCustomBonuses) return;
    onUpdateCustomBonuses(customBonuses.filter((b) => b.id !== bonusId));
  };

  const handleSavePolicyDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdatePayrollPolicy) {
      onUpdatePayrollPolicy(policyDraft);
    }
    if (updateBranding && policyDraft.salaryDisbursementPolicy) {
      updateBranding({ salaryDisbursementPolicy: policyDraft.salaryDisbursementPolicy });
    }
    setPolicySavedToast(true);
    setTimeout(() => setPolicySavedToast(false), 3500);
  };

  const handleExportBankAdvice = () => {
    const data = filteredSlips.map((s) => ({
      "Employee ID": s.employeeCode,
      "Employee Name": s.employeeName,
      Branch: s.branchName,
      Department: s.departmentName,
      "Bank Name": s.bankName || "City Bank Ltd.",
      "Account Number": s.bankAccountNumber || "Corporate A/C",
      "Basic Salary (BDT)": s.basicSalary || 0,
      "Gross Salary (BDT)": s.grossEarnings || 0,
      "Festival Bonus (BDT)": s.festivalBonus || 0,
      "Provident Fund (BDT)": s.providentFundDeduction || 0,
      "Tax (BDT)": s.taxDeduction || 0,
      "Late Deductions (BDT)": s.lateDeductionAmount || s.latePenaltyDeduction || 0,
      "Loan EMI (BDT)": s.loanInstallmentDeduction || s.loanEmiDeduction || 0,
      "Net Payable Salary (BDT)": s.netSalary || 0,
      "Approval & Payment Status": s.paymentStatus,
      "Disbursement Reference": s.transactionReference || "Pending Bank Batch",
    }));
    exportToCSV(`Bank_Salary_Disbursement_${selectedMonth.replace(" ", "_")}`, data);
  };

  return (
    <div id="payroll-management-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Title */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>পে-রোল, স্যালারি ও বোনাস প্রসেসিং ইঞ্জিন</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    Auto Payroll & Audit
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  মূল বেতন, উৎসব বোনাস, বাড়ি ভাড়া, লেট জরিমানা কর্তন, প্রভিডেন্ট ফান্ড ও লোন কিস্তি সমন্বিত স্বয়ংক্রিয় হিসাব
                </p>
              </div>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isPayrollAdmin ? (
              <>
                <button
                  id="payroll-run-button"
                  onClick={() => onGeneratePayroll(selectedMonth)}
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="এই মাসের সকল উপস্থিত, লেট, বোনাস ও পলিসি অনুযায়ী নতুন পে-রোল ক্যালকুলেট করুন"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>পে-রোল রান ({selectedMonth})</span>
                </button>

                {onApproveAll && (
                  <button
                    id="payroll-approve-all-button"
                    onClick={() => onApproveAll(selectedMonth)}
                    disabled={countPending === 0}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      countPending > 0
                        ? "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                        : "bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800/40 dark:border-slate-800 cursor-not-allowed opacity-60"
                    }`}
                    title="পেন্ডিং পে-স্লিপগুলো এক ক্লিকে অনুমোদন (Approve) করুন"
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>সকল অনুমোদন করুন ({countPending})</span>
                  </button>
                )}

                <button
                  id="payroll-disburse-all-button"
                  onClick={() => onDisburseAll(selectedMonth)}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="অনুমোদিত স্যালারি এক ক্লিকে পেইড/ডিসবার্স করুন"
                >
                  <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>সকল পরিশোধ (Disburse All)</span>
                </button>

                <button
                  id="payroll-bank-advice-button"
                  onClick={handleExportBankAdvice}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="ব্যাংক ট্রান্সফারের জন্য অফিশিয়াল শিট ডাউনলোড করুন"
                >
                  <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>ব্যাংক শিট (CSV)</span>
                </button>
              </>
            ) : (
              <button
                id="payroll-my-slips-export-button"
                onClick={handleExportBankAdvice}
                className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="আপনার বেতন বিবরণী ডাউনলোড করুন"
              >
                <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>আমার পে-স্লিপ ডাউনলোড (CSV)</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs (4 Core Functional Pillars for Admin, 2 for General Employees) */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pt-2 overflow-x-auto">
          <button
            id="payroll-tab-register"
            onClick={() => setActiveMainTab("REGISTER")}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeMainTab === "REGISTER"
                ? "border-teal-600 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isPayrollAdmin ? "পে-রোল রেজিস্টার ও অনুমোদন (Payroll Register)" : "আমার পে-স্লিপ সমূহ (My Payslips)"}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 font-mono">
              {filteredSlips.length}
            </span>
          </button>

          {isPayrollAdmin && (
            <>
              <button
                id="payroll-tab-policy"
                onClick={() => setActiveMainTab("POLICY")}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeMainTab === "POLICY"
                    ? "border-teal-600 text-teal-600 dark:text-teal-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>জরিমানা ও কর্তন নীতিমালা (Late & Deductions Policy)</span>
              </button>

              <button
                id="payroll-tab-bonuses"
                onClick={() => setActiveMainTab("BONUSES")}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeMainTab === "BONUSES"
                    ? "border-teal-600 text-teal-600 dark:text-teal-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Award className="w-4 h-4" />
                <span>বোনাস, ভাতা ও কমিশন (Bonuses & Allowances)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
                  {customBonuses.length}
                </span>
              </button>
            </>
          )}

          <button
            id="payroll-tab-history"
            onClick={() => setActiveMainTab("HISTORY")}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeMainTab === "HISTORY"
                ? "border-teal-600 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <History className="w-4 h-4" />
            <span>{isPayrollAdmin ? "বিগত মাসের রেকর্ড ও বকেয়া (Historical Records & Audit)" : "আমার বেতন ইতিহাস (My Salary History)"}</span>
          </button>
        </div>

        {/* Informative Explanation Banner */}
        {isPayrollAdmin ? (
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-950 dark:text-blue-200">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">পেন্ডিং অ্যাপ্রুভাল (Pending Approval) কেন দেখায়? </span>
                <span className="text-slate-600 dark:text-slate-300">
                  পে-রোল গণনার পর সরাসরি ব্যাংক ট্রান্সফারের আগে এইচআর বা ফাইন্যান্স হেড কর্তৃক অডিট ও অনুমোদনের জন্য স্যালারির স্ট্যাটাস ডিফল্টভাবে "পেন্ডিং অ্যাপ্রুভাল" থাকে। অনুমোদন করতে ডানপাশের নীল <strong>"অনুমোদন (Approve)"</strong> বাটনে বা উপরের <strong>"সকল অনুমোদন করুন"</strong> বাটনে ক্লিক করুন।
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowWorkflowExplainer(true)}
              className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <span>সম্পূর্ণ কাজের ধাপ দেখুন</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between gap-3 text-xs text-teal-950 dark:text-teal-200">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
              <div>
                <span className="font-bold">🔒 সুরক্ষিত কর্মী এক্সেস মোড: </span>
                <span className="text-slate-600 dark:text-slate-300">
                  কোম্পানি পলিসি ও গোপনীয়তা বিধি অনুযায়ী আপনি শুধুমাত্র আপনার নিজের বেতনের পে-স্লিপ ও হিসাব দেখতে পাচ্ছেন।
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-600 text-white shrink-0">
              ব্যক্তিগত প্রোফাইল
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PAYROLL REGISTER & APPROVALS                                       */}
      {/* ========================================================================= */}
      {activeMainTab === "REGISTER" && (
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* HIERARCHICAL YEAR & MONTH NAVIGATOR                                       */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
            {/* Year Selector Tabs and Current Selection Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <CalendarDays className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-white">বছর নির্বাচন (Fiscal Year):</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {YEARS_LIST.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => handleSelectYearMonth(yr, selectedMonthIndex)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                        selectedYear === yr
                          ? "bg-teal-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {yr} {yr === 2026 ? "★ (চলতি)" : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] text-slate-500 block">নির্বাচিত সাইকেল ও বছর:</span>
                <span className="font-bold text-teal-700 dark:text-teal-300 text-xs">
                  {BENGALI_MONTHS.find((m) => m.key === selectedMonthIndex)?.nameBn || ""} {selectedYear} ({selectedMonth})
                </span>
              </div>
            </div>

            {/* 12 Bengali Months Pill Grid for Selected Year */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
              {BENGALI_MONTHS.map((m) => {
                const monthStr = `${m.nameEn} ${selectedYear}`;
                const isSelected = selectedMonth === monthStr;
                const slipsInThisMonth = accessiblePayslips.filter(
                  (s) => normalizeMonthKey(s.payrollMonth) === `${selectedYear}-${m.key}`
                );

                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => handleSelectYearMonth(selectedYear, m.key)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                      isSelected
                        ? "bg-teal-50 dark:bg-teal-950/50 border-teal-500 ring-1 ring-teal-500 text-teal-950 dark:text-teal-200"
                        : "bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{m.nameBn}</span>
                      <span className="text-[10px] font-mono text-slate-400">{m.nameEn.slice(0, 3)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      {m.festivalBadge ? (
                        <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 truncate">
                          {m.festivalBadge}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[9px]">নিয়মিত মাস</span>
                      )}
                      {slipsInThisMonth.length > 0 ? (
                        <span className="px-1.5 py-0.2 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-bold text-[9px]">
                          {slipsInThisMonth.length}
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400">০</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Month, Branch & Status Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">পে-রোল সাইকেল মাস (Month)</label>
              <select
                id="payroll-select-month"
                value={selectedMonth}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedMonth(val);
                  if (val !== "ALL") {
                    const parts = val.split(" ");
                    if (parts.length === 2) {
                      const yr = parseInt(parts[1], 10);
                      if (!isNaN(yr)) setSelectedYear(yr);
                      const m = BENGALI_MONTHS.find((item) => item.nameEn.toLowerCase() === parts[0].toLowerCase());
                      if (m) setSelectedMonthIndex(m.key);
                    }
                  }
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m} {m === "September 2026" ? "(বর্তমান চলতি মাস)" : m === "August 2026" ? "(গত মাস)" : m === "June 2026" ? "🕌 (ঈদ-উল-আযহা বোনাস)" : m === "April 2026" ? "🌸 (বৈশাখী ভাতা)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">ব্রাঞ্চ লোকেশন (Branch)</label>
              <select
                id="payroll-select-branch"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
              >
                <option value="ALL">সকল ব্রাঞ্চ (All Branches)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">অনুমোদন স্ট্যাটাস (Status)</label>
              <select
                id="payroll-select-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
              >
                <option value="ALL">সকল স্ট্যাটাস ({accessiblePayslips.length})</option>
                <option value="PENDING_APPROVAL">অপেক্ষমাণ খসড়া (Pending Approval)</option>
                <option value="APPROVED">অনুমোদিত (Approved / Ready to Pay)</option>
                <option value="PAID">পরিশোধিত (Paid / Disbursed)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">কর্মী খুঁজুন (Search)</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="নাম, কোড বা বিভাগ লিখুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Quick Bonus Notification Pill */}
          {applicableBonuses.length > 0 && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    এই মাসে উৎসব ভাতা কার্যকর রয়েছে ({selectedMonth}):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    {applicableBonuses.map((b) => (
                      <span
                        key={b.id}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30"
                      >
                        {b.title} ({b.calculationType === "PERCENTAGE" ? `${b.percentageRate || b.amountOrPercentage}% মূল বেতন` : `৳${b.fixedAmount || b.amountOrPercentage}`})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveMainTab("BONUSES")}
                className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline shrink-0"
              >
                বোনাস ম্যানেজ করুন →
              </button>
            </div>
          )}

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">মোট গ্রস আয় (Gross Earnings)</span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                ৳{(totalGross ?? 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-teal-700 dark:text-teal-400 mt-1 block font-semibold">
                {filteredSlips.length} জন কর্মীর পে-স্লিপ
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 shadow-xs">
              <span className="text-xs text-amber-800 dark:text-amber-300 block font-medium">উৎসব ভাতা ও ইনসেনটিভ</span>
              <span className="text-xl font-black text-amber-700 dark:text-amber-400 mt-1 block">
                ৳{(totalBonusDisbursed ?? 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-amber-700 dark:text-amber-300 mt-1 block font-semibold">
                {applicableBonuses.length} টি বোনাস কার্যকর
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">কর্তন (PF, Tax, Late Penalty, EMI)</span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
                -৳{(totalDeductions ?? 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block font-semibold">
                নীতিমালা অনুযায়ী কর্তন
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
              <span className="text-xs text-emerald-800 dark:text-teal-300 block font-medium">মোট প্রদেয় বেতন (Net Payable)</span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1 block">
                ৳{(totalNet ?? 0).toLocaleString()}
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                <span className="text-amber-600 font-bold">{countPending} অপেক্ষমাণ</span>
                <span>•</span>
                <span className="text-blue-600 font-bold">{countApproved} অনুমোদিত</span>
                <span>•</span>
                <span className="text-emerald-600 font-bold">{countPaid} পরিশোধিত</span>
              </div>
            </div>
          </div>

          {/* Payslips Table */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>{selectedMonth}-এর কর্মীবৃন্দের পে-স্লিপ তালিকা</span>
                <span className="text-xs font-normal text-slate-500">
                  (মোট {filteredSlips.length} জন)
                </span>
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenQuickBonus()}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ নতুন বোনাস যুক্ত করুন</span>
                </button>
              </div>
            </div>

            {filteredSlips.length === 0 ? (
              <div className="p-10 text-center space-y-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  এই ফিল্টারে কোনো পে-স্লিপ পাওয়া যায়নি
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {selectedMonth} মাসের জন্য পে-রোল এখনো তৈরি করা না হয়ে থাকলে ওপরের <strong>"পে-রোল রান ({selectedMonth})"</strong> বাটনে ক্লিক করে এক ক্লিকে হিসাব তৈরি করুন।
                </p>
                <button
                  onClick={() => onGeneratePayroll(selectedMonth)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>এখনই পে-রোল রান করুন</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">কর্মী ও পদবি (Employee)</th>
                      <th className="p-3">ব্রাঞ্চ (Branch)</th>
                      <th className="p-3">মূল বেতন (Basic)</th>
                      <th className="p-3">ভাতা ও বোনাস</th>
                      <th className="p-3">কর্তন (PF/Late/EMI)</th>
                      <th className="p-3">মোট প্রদেয় (Net)</th>
                      <th className="p-3">অনুমোদন স্ট্যাটাস</th>
                      <th className="p-3 text-right">পদক্ষেপ (Action)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredSlips.map((slip) => {
                      const isPending = slip.paymentStatus === "PENDING_APPROVAL";
                      const isApproved = slip.paymentStatus === "APPROVED";
                      const isPaid = slip.paymentStatus === "PAID";

                      return (
                        <tr key={slip.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{slip.employeeName}</span>
                              {slip.advanceSalaryDeduction && slip.advanceSalaryDeduction > 0 ? (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold">
                                  Advance
                                </span>
                              ) : null}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {slip.employeeCode} • {slip.designationTitle || slip.departmentName}
                            </div>
                          </td>

                          <td className="p-3 text-slate-800 dark:text-slate-300">
                            {(slip.branchName || "Main Office").split("(")[0]}
                          </td>

                          <td className="p-3 font-mono font-semibold text-slate-900 dark:text-slate-200">
                            ৳{(slip.basicSalary ?? 0).toLocaleString()}
                          </td>

                          <td className="p-3 font-mono">
                            <div className="text-teal-700 dark:text-teal-400 font-semibold">
                              +৳{((slip.grossEarnings || 0) - (slip.basicSalary || 0)).toLocaleString()}
                            </div>
                            {(slip.festivalBonus || 0) > 0 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 mt-0.5">
                                🎉 ৳{(slip.festivalBonus || 0).toLocaleString()} বোনাস
                              </span>
                            )}
                          </td>

                          <td className="p-3 font-mono text-rose-600 dark:text-rose-400">
                            <div>-৳{(slip.totalDeductions ?? 0).toLocaleString()}</div>
                            {(slip.lateDeductionAmount || slip.latePenaltyDeduction || 0) > 0 && (
                              <span className="text-[9px] text-rose-500 block font-normal">
                                লেট কর্তন: ৳{slip.lateDeductionAmount || slip.latePenaltyDeduction}
                              </span>
                            )}
                          </td>

                          <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            ৳{(slip.netSalary ?? 0).toLocaleString()}
                          </td>

                          {/* Approval Status Column with Interactive State Change */}
                          <td className="p-3">
                            <div className="flex flex-col items-start gap-1">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                  isPaid
                                    ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                                    : isApproved
                                    ? "bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30"
                                    : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                                }`}
                              >
                                {isPaid ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>পরিশোধিত (PAID)</span>
                                  </>
                                ) : isApproved ? (
                                  <>
                                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                                    <span>অনুমোদিত (APPROVED)</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span>খসড়া (PENDING)</span>
                                  </>
                                )}
                              </span>

                              {slip.paymentDate && isPaid && (
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {slip.paymentDate}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Action Buttons: Change Status or View Slip */}
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPayrollAdmin && isPending && onApprovePayslip && (
                                <button
                                  onClick={() => onApprovePayslip(slip.id)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold cursor-pointer transition-colors"
                                  title="স্যালারি অনুমোদন করুন"
                                >
                                  অনুমোদন (Approve)
                                </button>
                              )}

                              {isPayrollAdmin && isApproved && onDisbursePayslip && (
                                <button
                                  onClick={() => onDisbursePayslip(slip.id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold cursor-pointer transition-colors"
                                  title="পরিশোধ করুন (Pay Bank/Cash)"
                                >
                                  পরিশোধ (Pay)
                                </button>
                              )}

                              <button
                                onClick={() => setActiveSlip(slip)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                                title="পে-স্লিপ দেখুন ও প্রিন্ট করুন"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAYROLL SCALE, ALLOWANCES & DEDUCTIONS POLICY                      */}
      {/* ========================================================================= */}
      {activeMainTab === "POLICY" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>পে-স্কেল কাঠামো, ভাতা ও কর্তন নীতিমালা কনফিগারেশন</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  এখানে আপনি বাড়ি ভাড়া, চিকিৎসা, যাতায়াত ও বিশেষ ভাতা শতকরা হার (%) বা ফিক্সড টাকায় (৳) নির্ধারণ করতে পারবেন অথবা বন্ধ রাখতে পারবেন। এছাড়া লেট জরিমানা ও অনুপস্থিতি কর্তন নিয়ন্ত্রণ করা যাবে।
                </p>
              </div>

              {policySavedToast && (
                <div className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-in fade-in shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>নীতিমালা সফলভাবে সংরক্ষিত হয়েছে!</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSavePolicyDraft} className="space-y-6 text-xs">
              {/* SECTION 1: ALLOWANCES (HOUSE RENT, MEDICAL, TRANSPORT, SPECIAL) */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-5">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    ১. ভাতা ও অতিরিক্ত উপার্জন কাঠামো (Allowances Structure)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500">
                  কর্মীর প্রোফাইলে আলাদা ভাতা না থাকলে এই কেন্দ্রীয় পলিসি স্বয়ংক্রিয়ভাবে পে-স্লিপে কার্যকর হবে। শতকরা হার (%) বা ফিক্সড টাকা (৳) নির্বাচন করুন:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. House Rent Allowance */}
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-teal-600" />
                        <span>বাড়ি ভাড়া ভাতা (House Rent)</span>
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setPolicyDraft({ ...policyDraft, houseRentCalculationMode: "PERCENTAGE" })}
                          className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                            policyDraft.houseRentCalculationMode !== "FIXED_AMOUNT"
                              ? "bg-teal-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          শতকরা (%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPolicyDraft({ ...policyDraft, houseRentCalculationMode: "FIXED_AMOUNT" })}
                          className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                            policyDraft.houseRentCalculationMode === "FIXED_AMOUNT"
                              ? "bg-teal-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          ফিক্সড (৳)
                        </button>
                      </div>
                    </div>

                    {policyDraft.houseRentCalculationMode === "FIXED_AMOUNT" ? (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400">৳</span>
                        <input
                          type="number"
                          min="0"
                          value={policyDraft.houseRentFixedAmount || 15000}
                          onChange={(e) =>
                            setPolicyDraft({ ...policyDraft, houseRentFixedAmount: Number(e.target.value) })
                          }
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-sm"
                          placeholder="ফিক্সড টাকার পরিমাণ"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={policyDraft.defaultHouseRentPercentage ?? 40}
                          onChange={(e) =>
                            setPolicyDraft({ ...policyDraft, defaultHouseRentPercentage: Number(e.target.value) })
                          }
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-sm"
                          placeholder="বেসিকের শতকরা হার"
                        />
                        <span className="font-bold text-slate-400">%</span>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 block">
                      {policyDraft.houseRentCalculationMode === "FIXED_AMOUNT"
                        ? "প্রতি মাসে নির্দিষ্ট ফিক্সড টাকা বাড়ি ভাড়া হিসেবে যোগ হবে।"
                        : "মূল বেতনের (Basic) নির্ধারিত শতাংশ হিসেবে বাড়ি ভাড়া ভাতা গণনা হবে।"}
                    </span>
                  </div>

                  {/* 2. Medical Allowance */}
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                        <span>চিকিৎসা ভাতা (Medical Allowance)</span>
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setPolicyDraft({ ...policyDraft, medicalCalculationMode: "PERCENTAGE" })}
                          className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                            policyDraft.medicalCalculationMode !== "FIXED_AMOUNT"
                              ? "bg-teal-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          শতকরা (%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPolicyDraft({ ...policyDraft, medicalCalculationMode: "FIXED_AMOUNT" })}
                          className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                            policyDraft.medicalCalculationMode === "FIXED_AMOUNT"
                              ? "bg-teal-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          ফিক্সড (৳)
                        </button>
                      </div>
                    </div>

                    {policyDraft.medicalCalculationMode === "FIXED_AMOUNT" ? (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400">৳</span>
                        <input
                          type="number"
                          min="0"
                          value={policyDraft.medicalFixedAmount || 5000}
                          onChange={(e) =>
                            setPolicyDraft({ ...policyDraft, medicalFixedAmount: Number(e.target.value) })
                          }
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-sm"
                          placeholder="ফিক্সড টাকার পরিমাণ"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={policyDraft.defaultMedicalPercentage ?? 10}
                          onChange={(e) =>
                            setPolicyDraft({ ...policyDraft, defaultMedicalPercentage: Number(e.target.value) })
                          }
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-sm"
                          placeholder="বেসিকের শতকরা হার"
                        />
                        <span className="font-bold text-slate-400">%</span>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 block">
                      {policyDraft.medicalCalculationMode === "FIXED_AMOUNT"
                        ? "প্রতি মাসে নির্দিষ্ট ফিক্সড টাকা চিকিৎসা ভাতা হিসেবে যোগ হবে।"
                        : "মূল বেতনের (Basic) নির্ধারিত শতাংশ হিসেবে চিকিৎসা ভাতা গণনা হবে।"}
                    </span>
                  </div>

                  {/* 3. Transport Allowance */}
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Bus className="w-3.5 h-3.5 text-blue-500" />
                        <span>যাতায়াত ভাতা (Transport Allowance)</span>
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setPolicyDraft({ ...policyDraft, transportCalculationMode: "PERCENTAGE" })}
                          className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                            policyDraft.transportCalculationMode !== "FIXED_AMOUNT"
                              ? "bg-teal-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          শতকরা (%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPolicyDraft({ ...policyDraft, transportCalculationMode: "FIXED_AMOUNT" })}
                          className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                            policyDraft.transportCalculationMode === "FIXED_AMOUNT"
                              ? "bg-teal-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          ফিক্সড (৳)
                        </button>
                      </div>
                    </div>

                    {policyDraft.transportCalculationMode === "FIXED_AMOUNT" ? (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400">৳</span>
                        <input
                          type="number"
                          min="0"
                          value={policyDraft.transportFixedAmount || 3000}
                          onChange={(e) =>
                            setPolicyDraft({ ...policyDraft, transportFixedAmount: Number(e.target.value) })
                          }
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-sm"
                          placeholder="ফিক্সড টাকার পরিমাণ"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={policyDraft.defaultTransportPercentage ?? 10}
                          onChange={(e) =>
                            setPolicyDraft({ ...policyDraft, defaultTransportPercentage: Number(e.target.value) })
                          }
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-sm"
                          placeholder="বেসিকের শতকরা হার"
                        />
                        <span className="font-bold text-slate-400">%</span>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 block">
                      যাতায়াত ও ভ্রমণ সুবিধার জন্য মাসিক ভাতা।
                    </span>
                  </div>

                  {/* 4. Special Allowance */}
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>বিশেষ ভাতা (Special Allowance)</span>
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setPolicyDraft({ ...policyDraft, specialCalculationMode: "PERCENTAGE" })}
                          className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                            policyDraft.specialCalculationMode !== "FIXED_AMOUNT"
                              ? "bg-teal-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          শতকরা (%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPolicyDraft({ ...policyDraft, specialCalculationMode: "FIXED_AMOUNT" })}
                          className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                            policyDraft.specialCalculationMode === "FIXED_AMOUNT"
                              ? "bg-teal-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          ফিক্সড (৳)
                        </button>
                      </div>
                    </div>

                    {policyDraft.specialCalculationMode === "FIXED_AMOUNT" ? (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400">৳</span>
                        <input
                          type="number"
                          min="0"
                          value={policyDraft.specialFixedAmount || 2000}
                          onChange={(e) =>
                            setPolicyDraft({ ...policyDraft, specialFixedAmount: Number(e.target.value) })
                          }
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-sm"
                          placeholder="ফিক্সড টাকার পরিমাণ"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={policyDraft.defaultSpecialPercentage ?? 10}
                          onChange={(e) =>
                            setPolicyDraft({ ...policyDraft, defaultSpecialPercentage: Number(e.target.value) })
                          }
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-sm"
                          placeholder="বেসিকের শতকরা হার"
                        />
                        <span className="font-bold text-slate-400">%</span>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 block">
                      কমিশন বা বিশেষ দায়িত্ব পালনের নিয়মিত মাসিক সুবিধা।
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: OVERTIME COMPENSATION */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      ২. ওভারটাইম সুবিধা ও হিসাবের নিয়ম (Overtime Pay Policy)
                    </h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-500 transition-colors w-fit">
                    <input
                      type="checkbox"
                      id="toggle-overtime-policy"
                      checked={policyDraft.overtimeEnabled !== false}
                      onChange={(e) =>
                        setPolicyDraft({ ...policyDraft, overtimeEnabled: e.target.checked })
                      }
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                    />
                    <span className={`text-xs font-bold ${policyDraft.overtimeEnabled !== false ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`}>
                      {policyDraft.overtimeEnabled !== false ? "ওভারটাইম চালু (ON)" : "ওভারটাইম অফ / বন্ধ (OFF)"}
                    </span>
                  </label>
                </div>

                {policyDraft.overtimeEnabled === false ? (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-2.5 text-amber-800 dark:text-amber-200 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      <strong>ওভারটাইম বন্ধ রাখা হয়েছে (Overtime OFF):</strong> প্রতিষ্ঠানে বর্তমানে অতিরিক্ত কাজের জন্য ওভারটাইম পারিশ্রমিক গণনা করা হবে না। কর্মীরা অতিরিক্ত সময় কাজ করলেও পে-রোলে ওভারটাইম বাবদ কোনো টাকা যোগ হবে না (৳০)।
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] text-slate-500">
                      অফিস সময়ের অতিরিক্ত কাজের জন্য প্রতি ঘণ্টার পারিশ্রমিক কীভাবে হিসাব করা হবে তা নির্ধারণ করুন:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          policyDraft.overtimeCalculationType === "ONE_POINT_FIVE_BASIC" || !policyDraft.overtimeCalculationType
                            ? "bg-teal-50 dark:bg-teal-950/30 border-teal-500 ring-1 ring-teal-500 text-teal-900 dark:text-teal-200 font-bold"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="overtimeCalculationType"
                          checked={policyDraft.overtimeCalculationType === "ONE_POINT_FIVE_BASIC" || !policyDraft.overtimeCalculationType}
                          onChange={() =>
                            setPolicyDraft({ ...policyDraft, overtimeCalculationType: "ONE_POINT_FIVE_BASIC" })
                          }
                          className="sr-only"
                        />
                        <div className="font-bold text-xs mb-1">বেসিক ঘণ্টার ১.৫ গুণ (1.5x Basic)</div>
                        <p className="text-[11px] text-slate-500 font-normal">
                          প্রতি ওভারটাইম ঘণ্টায় দৈনিক প্রতি ঘণ্টার বেসিকের দেড় গুণ প্রদান।
                        </p>
                      </label>

                      <label
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          policyDraft.overtimeCalculationType === "DOUBLE_BASIC"
                            ? "bg-teal-50 dark:bg-teal-950/30 border-teal-500 ring-1 ring-teal-500 text-teal-900 dark:text-teal-200 font-bold"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="overtimeCalculationType"
                          checked={policyDraft.overtimeCalculationType === "DOUBLE_BASIC"}
                          onChange={() =>
                            setPolicyDraft({ ...policyDraft, overtimeCalculationType: "DOUBLE_BASIC" })
                          }
                          className="sr-only"
                        />
                        <div className="font-bold text-xs mb-1">বেসিক ঘণ্টার ২ গুণ (2.0x Double)</div>
                        <p className="text-[11px] text-slate-500 font-normal">
                          ছুটির দিন বা রাতে অতিরিক্ত কাজের জন্য দ্বিগুণ ঘণ্টা রেট।
                        </p>
                      </label>

                      <label
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          policyDraft.overtimeCalculationType === "FIXED_RATE"
                            ? "bg-teal-50 dark:bg-teal-950/30 border-teal-500 ring-1 ring-teal-500 text-teal-900 dark:text-teal-200 font-bold"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="overtimeCalculationType"
                          checked={policyDraft.overtimeCalculationType === "FIXED_RATE"}
                          onChange={() =>
                            setPolicyDraft({ ...policyDraft, overtimeCalculationType: "FIXED_RATE" })
                          }
                          className="sr-only"
                        />
                        <div className="font-bold text-xs mb-1">নির্দিষ্ট ফিক্সড রেট (Fixed ৳/Hour)</div>
                        <p className="text-[11px] text-slate-500 font-normal">
                          প্রতি ঘণ্টার জন্য নির্ধারিত ফিক্সড রেট (যেমন ৳২০০/ঘণ্টা)।
                        </p>
                      </label>
                    </div>

                    {policyDraft.overtimeCalculationType === "FIXED_RATE" && (
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 max-w-sm">
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                          প্রতি ঘণ্টা ওভারটাইম ফিক্সড রেট (টাকা ৳):
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-400">৳</span>
                          <input
                            type="number"
                            min="0"
                            value={policyDraft.overtimeFixedHourlyRate || 200}
                            onChange={(e) =>
                              setPolicyDraft({ ...policyDraft, overtimeFixedHourlyRate: Number(e.target.value) })
                            }
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* SECTION 3: LATE ARRIVAL PENALTY RULES */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      ৩. অফিসে দেরিতে আসার জরিমানা নীতি (Late Clock-in Penalty Rule)
                    </h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policyDraft.latePenaltyEnabled !== false}
                      onChange={(e) =>
                        setPolicyDraft({ ...policyDraft, latePenaltyEnabled: e.target.checked })
                      }
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      লেট জরিমানা ব্যবস্থা চালু রাখুন
                    </span>
                  </label>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>কোত্থেকে কাটে ও কীভাবে কাজ করে?</strong> বায়োমেট্রিক ও ফেসিয়াল হাজিরা মেশিন থেকে কর্মীদের ক্লক-ইন সময় রেকর্ড হয়। শিফট শুরুর সময় (যেমন সকাল ৯:০০) এর পর গ্রেস পিরিয়ড (যেমন ১৫ মিনিট) পার হলে স্বয়ংক্রিয়ভাবে লেট হিসেবে গণনা হয় এবং মাসের শেষে পে-রোলে এই নীতি অনুযায়ী জরিমানা কর্তন হয়।
                  </div>
                </div>

                {policyDraft.latePenaltyEnabled !== false ? (
                  <div className="space-y-4 pt-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      জরিমানা গণনার পদ্ধতি নির্বাচন করুন (Calculation Method):
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Option 1: Standard Rule */}
                      <label
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          policyDraft.latePenaltyType === "STANDARD_3_LATE_1_DAY"
                            ? "bg-teal-50 dark:bg-teal-950/30 border-teal-500 ring-1 ring-teal-500 text-teal-900 dark:text-teal-200 font-bold"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="latePenaltyType"
                          checked={policyDraft.latePenaltyType === "STANDARD_3_LATE_1_DAY"}
                          onChange={() =>
                            setPolicyDraft({ ...policyDraft, latePenaltyType: "STANDARD_3_LATE_1_DAY" })
                          }
                          className="sr-only"
                        />
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-3 h-3 rounded-full border border-teal-500 flex items-center justify-center">
                            {policyDraft.latePenaltyType === "STANDARD_3_LATE_1_DAY" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                            )}
                          </span>
                          <span className="font-bold">স্ট্যান্ডার্ড রুল (Standard)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                          প্রতি ৩ দিন দেরিতে উপস্থিতির জন্য ১ দিনের মূল বেতন (1 day basic) কর্তন।
                        </p>
                      </label>

                      {/* Option 2: Fixed Amount per late */}
                      <label
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          policyDraft.latePenaltyType === "FIXED_AMOUNT"
                            ? "bg-teal-50 dark:bg-teal-950/30 border-teal-500 ring-1 ring-teal-500 text-teal-900 dark:text-teal-200 font-bold"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="latePenaltyType"
                          checked={policyDraft.latePenaltyType === "FIXED_AMOUNT"}
                          onChange={() =>
                            setPolicyDraft({ ...policyDraft, latePenaltyType: "FIXED_AMOUNT" })
                          }
                          className="sr-only"
                        />
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-3 h-3 rounded-full border border-teal-500 flex items-center justify-center">
                            {policyDraft.latePenaltyType === "FIXED_AMOUNT" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                            )}
                          </span>
                          <span className="font-bold">ফিক্সড টাকা (Fixed Penalty)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                          প্রতিটি লেটের জন্য নির্দিষ্ট পরিমাণ টাকা (যেমন: ৳২০০/লেট) সরাসরি জরিমানা।
                        </p>
                      </label>

                      {/* Option 3: Percentage of Basic */}
                      <label
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          policyDraft.latePenaltyType === "PERCENTAGE"
                            ? "bg-teal-50 dark:bg-teal-950/30 border-teal-500 ring-1 ring-teal-500 text-teal-900 dark:text-teal-200 font-bold"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="latePenaltyType"
                          checked={policyDraft.latePenaltyType === "PERCENTAGE"}
                          onChange={() =>
                            setPolicyDraft({ ...policyDraft, latePenaltyType: "PERCENTAGE" })
                          }
                          className="sr-only"
                        />
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-3 h-3 rounded-full border border-teal-500 flex items-center justify-center">
                            {policyDraft.latePenaltyType === "PERCENTAGE" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                            )}
                          </span>
                          <span className="font-bold">বেতনের শতকরা হার (%)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                          প্রতি লেটের জন্য মূল বেতনের নির্দিষ্ট শতকরা হার (যেমন: ১% বা ২%) কর্তন।
                        </p>
                      </label>
                    </div>

                    {/* Numeric Parameter Controls based on chosen type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {policyDraft.latePenaltyType === "FIXED_AMOUNT" && (
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                            প্রতি লেটের জন্য নির্দিষ্ট জরিমানা (টাকা ৳):
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-400">৳</span>
                            <input
                              type="number"
                              min="0"
                              value={policyDraft.latePenaltyFixedAmount || 200}
                              onChange={(e) =>
                                setPolicyDraft({
                                  ...policyDraft,
                                  latePenaltyFixedAmount: Number(e.target.value),
                                })
                              }
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {policyDraft.latePenaltyType === "PERCENTAGE" && (
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                            প্রতি লেটের জন্য মূল বেতনের শতকরা হার (%):
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.5"
                              min="0.1"
                              max="50"
                              value={policyDraft.latePenaltyPercentage || 1}
                              onChange={(e) =>
                                setPolicyDraft({
                                  ...policyDraft,
                                  latePenaltyPercentage: Number(e.target.value),
                                })
                              }
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-sm"
                            />
                            <span className="font-bold text-slate-400">%</span>
                          </div>
                        </div>
                      )}

                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                          গ্রেস পিরিয়ড (Grace Period Minutes):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="60"
                            value={policyDraft.lateGracePeriodMinutes ?? 15}
                            onChange={(e) =>
                              setPolicyDraft({
                                ...policyDraft,
                                lateGracePeriodMinutes: Number(e.target.value),
                              })
                            }
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-sm"
                          />
                          <span className="font-bold text-slate-400 text-xs">মিনিট</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          শিফট শুরুর নির্ধারিত সময়ের পর এই মিনিট পর্যন্ত লেট ধরা হবে না।
                        </p>
                      </div>
                    </div>

                    {/* Exceptions Checkboxes */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={policyDraft.exemptFieldStaffFromPenalty !== false}
                          onChange={(e) =>
                            setPolicyDraft({
                              ...policyDraft,
                              exemptFieldStaffFromPenalty: e.target.checked,
                            })
                          }
                          className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <span>
                          ফিল্ড স্টাফ ও ফ্লেক্সিবল ওয়ার্কিং কর্মীদের লেট জরিমানা থেকে মুক্ত (Exempt) রাখুন
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={policyDraft.fixedSalaryStaffNoDeductions !== false}
                          onChange={(e) =>
                            setPolicyDraft({
                              ...policyDraft,
                              fixedSalaryStaffNoDeductions: e.target.checked,
                            })
                          }
                          className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <span>
                          চুক্তিভিত্তিক ও ফিক্সড স্যালারির কর্মীদের কোনো জরিমানা কর্তন করবেন না (Protected Salary)
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 italic pt-1">
                    অফিসে দেরিতে আসার জন্য কোনো বেতন বা জরিমানা কর্তন করা হবে না (Late Penalty Disabled)।
                  </p>
                )}
              </div>

              {/* SECTION 4: ABSENTEEISM DEDUCTION POLICY */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Ban className="w-4 h-4 text-rose-500" />
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      ৪. অফিসে অননুমোদিত অনুপস্থিতির কর্তন নীতি (Absenteeism Deduction Policy)
                    </h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-500 transition-colors w-fit">
                    <input
                      type="checkbox"
                      id="toggle-absenteeism-deduction"
                      checked={policyDraft.absenteeismPenaltyEnabled !== false}
                      onChange={(e) =>
                        setPolicyDraft({
                          ...policyDraft,
                          absenteeismPenaltyEnabled: e.target.checked,
                          absentPenaltyEnabled: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
                    />
                    <span className={`text-xs font-bold ${policyDraft.absenteeismPenaltyEnabled !== false ? "text-rose-600 dark:text-rose-400" : "text-slate-400"}`}>
                      {policyDraft.absenteeismPenaltyEnabled !== false ? "অনুপস্থিতি কর্তন চালু (ON)" : "অনুপস্থিতি কর্তন অফ / বন্ধ (OFF)"}
                    </span>
                  </label>
                </div>

                {policyDraft.absenteeismPenaltyEnabled === false ? (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>
                      <strong>অনুপস্থিতি কর্তন বন্ধ রাখা হয়েছে (Absenteeism Deduction OFF):</strong> কোনো কর্মী অফিসে অনুপস্থিত (Absent) থাকলেও বেতন থেকে কোনো টাকা কর্তন করা হবে না। কর্মকর্তাদের পূর্ণ বেতন অক্ষুণ্ণ থাকবে (ডিডাকশন ৳০)।
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] text-slate-500">
                      ছুটি অনুমোদন ছাড়া কোনো কর্মী অফিসে অনুপস্থিত (Absent) থাকলে বেতন থেকে কীভাবে কর্তন হবে তা নির্ধারণ করুন:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          policyDraft.absenteeismPenaltyType === "DAILY_BASIC_1_TO_1" || !policyDraft.absenteeismPenaltyType
                            ? "bg-teal-50 dark:bg-teal-950/30 border-teal-500 ring-1 ring-teal-500 text-teal-900 dark:text-teal-200 font-bold"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="absenteeismPenaltyType"
                          checked={policyDraft.absenteeismPenaltyType === "DAILY_BASIC_1_TO_1" || !policyDraft.absenteeismPenaltyType}
                          onChange={() =>
                            setPolicyDraft({ ...policyDraft, absenteeismPenaltyType: "DAILY_BASIC_1_TO_1" })
                          }
                          className="sr-only"
                        />
                        <div className="font-bold text-xs mb-1">১:১ দৈনিক মূল বেতন কর্তন (1 Day Basic)</div>
                        <p className="text-[11px] text-slate-500 font-normal">
                          প্রতি অনুপস্থিত দিনের জন্য মূল বেতনের ১ দিনের সমপরিমাণ কর্তন।
                        </p>
                      </label>

                      <label
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          policyDraft.absenteeismPenaltyType === "ONE_POINT_FIVE_BASIC"
                            ? "bg-teal-50 dark:bg-teal-950/30 border-teal-500 ring-1 ring-teal-500 text-teal-900 dark:text-teal-200 font-bold"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="absenteeismPenaltyType"
                          checked={policyDraft.absenteeismPenaltyType === "ONE_POINT_FIVE_BASIC"}
                          onChange={() =>
                            setPolicyDraft({ ...policyDraft, absenteeismPenaltyType: "ONE_POINT_FIVE_BASIC" })
                          }
                          className="sr-only"
                        />
                        <div className="font-bold text-xs mb-1">১.৫ গুণ দৈনিক মূল বেতন কর্তন (1.5x Basic)</div>
                        <p className="text-[11px] text-slate-500 font-normal">
                          অননুমোদিত অনুপস্থিতির জন্য শাস্তিমূলক দেড় গুণ হারে কর্তন।
                        </p>
                      </label>

                      <label
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          policyDraft.absenteeismPenaltyType === "FIXED_AMOUNT"
                            ? "bg-teal-50 dark:bg-teal-950/30 border-teal-500 ring-1 ring-teal-500 text-teal-900 dark:text-teal-200 font-bold"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="absenteeismPenaltyType"
                          checked={policyDraft.absenteeismPenaltyType === "FIXED_AMOUNT"}
                          onChange={() =>
                            setPolicyDraft({ ...policyDraft, absenteeismPenaltyType: "FIXED_AMOUNT" })
                          }
                          className="sr-only"
                        />
                        <div className="font-bold text-xs mb-1">নির্দিষ্ট ফিক্সড টাকা কর্তন (Fixed ৳/Day)</div>
                        <p className="text-[11px] text-slate-500 font-normal">
                          প্রতি অনুপস্থিত দিনের জন্য সরাসরি নির্ধারিত পরিমাণ টাকা কর্তন।
                        </p>
                      </label>
                    </div>

                    {policyDraft.absenteeismPenaltyType === "FIXED_AMOUNT" && (
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 max-w-sm">
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                          প্রতি অনুপস্থিত দিনের জন্য নির্দিষ্ট কর্তন (টাকা ৳):
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-400">৳</span>
                          <input
                            type="number"
                            min="0"
                            value={policyDraft.absenteeismFixedPenaltyAmount || 1000}
                            onChange={(e) =>
                              setPolicyDraft({ ...policyDraft, absenteeismFixedPenaltyAmount: Number(e.target.value) })
                            }
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* SECTION 5: ADVANCE SALARY & LOAN RECOVERY */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    ৫. অগ্রিম বেতন ও লোন কিস্তি কর্তন নীতি (Advance Salary & Loan Policy)
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      অগ্রিম বেতন (Advance Salary) সমন্বয় কিস্তি:
                    </label>
                    <select
                      value={policyDraft.advanceSalaryRecoveryMonths || 1}
                      onChange={(e) =>
                        setPolicyDraft({
                          ...policyDraft,
                          advanceSalaryRecoveryMonths: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="1">১ মাসে ১০০% সম্পূর্ণ কর্তন (Next Month Full Recovery)</option>
                      <option value="2">২ কিস্তিতে ৫০% করে কর্তন (2 Equal Monthly Installments)</option>
                      <option value="3">৩ কিস্তিতে ৩৩.৩% করে কর্তন (3 Equal Monthly Installments)</option>
                    </select>
                    <p className="text-[10px] text-slate-400">
                      কর্মী অগ্রিম বেতন গ্রহণ করলে তা এই নিয়মে মাসিক স্যালারি স্লিপ থেকে সমন্বয় করা হবে।
                    </p>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">
                      কোম্পানি লোন ও কর্মী ধারের নীতি:
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      <li>
                        <strong>কোম্পানি লোন (Company Loan):</strong> অনুমোদিত মাসিক কিস্তি (EMI) বেতন থেকে স্বয়ংক্রিয়ভাবে কাটা হয়।
                      </li>
                      <li>
                        <strong>কর্মী থেকে প্রতিষ্ঠানের ধার (Employee Borrowing):</strong> প্রতিষ্ঠান এটি আলাদা ব্যাংকে পরিশোধ করবে, কর্মীর বেতন থেকে কখনো কাটা হয় না।
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* SECTION 6: STATUTORY DEDUCTIONS (PF & TAX) */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    ৬. প্রভিডেন্ট ফান্ড ও ইনকাম ট্যাক্স কর্তন (PF & Tax Deductions)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      ডিফল্ট প্রভিডেন্ট ফান্ড হার (% of Basic):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="25"
                        value={policyDraft.defaultProvidentFundPercentage ?? 8}
                        onChange={(e) =>
                          setPolicyDraft({
                            ...policyDraft,
                            defaultProvidentFundPercentage: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-sm"
                      />
                      <span className="font-bold text-slate-400">%</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      স্ট্যান্ডার্ড ৮% মূল বেতন থেকে কর্তন হয়।
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      ডিফল্ট উৎস কর / ট্যাক্স হার (% of Gross):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={policyDraft.defaultTaxPercentage ?? 5}
                        onChange={(e) =>
                          setPolicyDraft({
                            ...policyDraft,
                            defaultTaxPercentage: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-sm"
                      />
                      <span className="font-bold text-slate-400">%</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      কর্মীর প্রোফাইলে নির্দিষ্ট ট্যাক্স না থাকলে এটি প্রযোজ্য হবে।
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 7: GLOBAL SALARY DISBURSEMENT POLICY */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>৭. গ্লোবাল বেতন পরিশোধ মাধ্যম পলিসি (Global Salary Disbursement Policy)</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300">
                    সুপার অ্যাডমিন পলিসি
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  প্রতিষ্ঠানব্যাপী বেতন কিভাবে দেওয়া হবে তা এখান থেকে নির্ধারণ করুন। এর ওপর ভিত্তি করে কর্মীদের সেলফ-সার্ভিস প্রোফাইলে ব্যাংক একাউন্ট বা ক্যাশ অপশন প্রদর্শিত হবে।
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setPolicyDraft({
                        ...policyDraft,
                        salaryDisbursementPolicy: "BOTH",
                      })
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      (policyDraft.salaryDisbursementPolicy || "BOTH") === "BOTH"
                        ? "bg-white dark:bg-slate-900 border-teal-500 ring-2 ring-teal-500/20 shadow-xs"
                        : "bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-teal-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-teal-600" />
                        <span>ব্যাংক ও ক্যাশ উভয় (Both)</span>
                      </span>
                      {(policyDraft.salaryDisbursementPolicy || "BOTH") === "BOTH" && (
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      কর্মী তার সুবিধা অনুযায়ী ব্যাংক একাউন্ট অথবা নগদ ক্যাশ নির্বাচন করতে পারবে।
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPolicyDraft({
                        ...policyDraft,
                        salaryDisbursementPolicy: "BANK_ONLY",
                      })
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      policyDraft.salaryDisbursementPolicy === "BANK_ONLY"
                        ? "bg-white dark:bg-slate-900 border-teal-500 ring-2 ring-teal-500/20 shadow-xs"
                        : "bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-teal-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span>শুধুমাত্র ব্যাংক (Bank Only)</span>
                      </span>
                      {policyDraft.salaryDisbursementPolicy === "BANK_ONLY" && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      সকল কর্মীর বেতন ব্যাংক একাউন্টে প্রদান বাধ্যতামূলক। প্রোফাইলে ব্যাংক তথ্য দিতে হবে।
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPolicyDraft({
                        ...policyDraft,
                        salaryDisbursementPolicy: "CASH_ONLY",
                      })
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      policyDraft.salaryDisbursementPolicy === "CASH_ONLY"
                        ? "bg-white dark:bg-slate-900 border-teal-500 ring-2 ring-teal-500/20 shadow-xs"
                        : "bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-teal-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-amber-600" />
                        <span>শুধুমাত্র ক্যাশ (Cash Only)</span>
                      </span>
                      {policyDraft.salaryDisbursementPolicy === "CASH_ONLY" && (
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      সকল কর্মীকে অফিস থেকে সরাসরি ক্যাশে বেতন পরিশোধ করা হবে। ব্যাংক একাউন্ট আবশ্যক নয়।
                    </p>
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>নীতিমালা সংরক্ষণ করুন (Save Policy)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BONUSES, ALLOWANCES & INCENTIVES                                   */}
      {/* ========================================================================= */}
      {activeMainTab === "BONUSES" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span>উৎসব বোনাস, বৈশাখী ভাতা ও ইনসেনটিভ কনফিগারেশন</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  এখানে আপনি নির্ধারিত মাসের জন্য বোনাস শতকরা হার (%) বা ফিক্সড টাকায় (৳) সেট করতে পারেন।
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenQuickBonus()}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ নতুন বোনাস পলিসি যুক্ত করুন</span>
              </button>
            </div>

            {/* Predefined Quick Bangladesh Festival Templates */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                বাংলাদেশের জাতীয় ও ধর্মীয় উৎসবের রেডিমেড টেমপ্লেট:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenQuickBonus("POHELA_BOISHAKH")}
                  className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-left cursor-pointer transition-colors space-y-1"
                >
                  <div className="font-bold text-amber-900 dark:text-amber-200 text-xs flex items-center gap-1.5">
                    <span>🌸 পহেলা বৈশাখী উৎসব ভাতা</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    এপ্রিল মাস • ২০% মূল বেতন • সরকারি নিয়ম অনুযায়ী
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenQuickBonus("EID_UL_FITR")}
                  className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-left cursor-pointer transition-colors space-y-1"
                >
                  <div className="font-bold text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-1.5">
                    <span>🌙 পবিত্র ঈদ-উল-ফিতর বোনাস</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    মার্চ/এপ্রিল মাস • ৫০% মূল বেতন
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenQuickBonus("EID_UL_ADHA")}
                  className="p-3 rounded-xl border border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 text-left cursor-pointer transition-colors space-y-1"
                >
                  <div className="font-bold text-teal-900 dark:text-teal-200 text-xs flex items-center gap-1.5">
                    <span>🕌 পবিত্র ঈদ-উল-আযহা বোনাস</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    জুন মাস • ৫০% মূল বেতন (ক্যাপ ৳৫০,০০০)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenQuickBonus("DURGA_PUJA")}
                  className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-left cursor-pointer transition-colors space-y-1"
                >
                  <div className="font-bold text-purple-900 dark:text-purple-200 text-xs flex items-center gap-1.5">
                    <span>🪔 শারদীয় দুর্গোৎসব অনুদান</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    অক্টোবর মাস • ফিক্সড ৳১৫,০০০
                  </p>
                </button>
              </div>
            </div>

            {/* Existing Custom Bonuses Table */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                বর্তমানে সক্রিয় বোনাস ও ইনসেনটিভ নীতিমালা ({customBonuses.length})
              </h4>

              {customBonuses.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  এখনো কোনো উৎসব বোনাস কনফিগার করা হয়নি। ওপরের বাটনে ক্লিক করে নতুন বোনাস যুক্ত করুন।
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3">বোনাসের নাম (Title)</th>
                        <th className="p-3">প্রযোজ্য মাস</th>
                        <th className="p-3">হিসাবের ধরন (Type)</th>
                        <th className="p-3">পরিমাণ / হার</th>
                        <th className="p-3">প্রযোজ্য কর্মী</th>
                        <th className="p-3">স্ট্যাটাস</th>
                        <th className="p-3 text-right">মুছুন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {customBonuses.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            {b.title}
                          </td>
                          <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                            {b.effectiveMonth}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800">
                              {b.calculationType === "PERCENTAGE" ? "শতকরা হার (%)" : "ফিক্সড টাকা (৳)"}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                            {b.calculationType === "PERCENTAGE"
                              ? `${b.percentageRate || b.amountOrPercentage}% মূল বেতন`
                              : `৳${(b.fixedAmount || b.amountOrPercentage || 0).toLocaleString()}`}
                            {b.maxCap || b.maxCapAmount ? (
                              <span className="text-[10px] text-slate-400 block font-normal">
                                সর্বোচ্চ: ৳{(b.maxCap || b.maxCapAmount || 0).toLocaleString()}
                              </span>
                            ) : null}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            {b.targetEligibility === "ALL_EMPLOYEES"
                              ? "সকল কর্মী"
                              : b.targetEligibility === "PERMANENT_ONLY"
                              ? "স্থায়ী কর্মী"
                              : b.targetEligibility === "MUSLIM_EMPLOYEES"
                              ? "মুসলিম কর্মী (Eid)"
                              : b.targetEligibility === "HINDU_EMPLOYEES"
                              ? "সনাতন ধর্মাবলম্বী কর্মী"
                              : b.targetEligibility}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                              সক্রিয় (Active)
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteBonus(b.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                              title="বোনাস পলিসি ডিলিট করুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: HISTORICAL RECORDS & AUDIT REPORT                                  */}
      {/* ========================================================================= */}
      {activeMainTab === "HISTORY" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>বিগত মাসের পে-রোল ইতিহাস ও বকেয়া নিরীক্ষা (Payroll History & Missing Data Audit)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  এখানে পূর্বে পরিশোধিত (Paid) বা অপেক্ষমাণ সকল পে-স্লিপের হিসাব আর্কাইভ আকারে সংরক্ষিত রয়েছে।
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const allData = accessiblePayslips.map((s) => ({
                      Month: s.payrollMonth,
                      "Employee ID": s.employeeCode,
                      Name: s.employeeName,
                      Branch: s.branchName,
                      "Net Salary": s.netSalary,
                      Status: s.paymentStatus,
                      "Payment Date": s.paymentDate || "N/A",
                      Reference: s.transactionReference || "N/A",
                    }));
                    exportToCSV("Complete_Historical_Payroll_Audit", allData);
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
                  <span>সম্পূর্ণ ইতিহাস এক্সপোর্ট (CSV)</span>
                </button>
              </div>
            </div>

            {/* Historical Cycles Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {MONTH_OPTIONS.map((m) => {
                const mKey = normalizeMonthKey(m);
                const slipsInMonth = accessiblePayslips.filter((s) => normalizeMonthKey(s.payrollMonth) === mKey);
                const totalMonthPaid = slipsInMonth
                  .filter((s) => s.paymentStatus === "PAID")
                  .reduce((sum, s) => sum + (s.netSalary || 0), 0);
                const pendingCount = slipsInMonth.filter((s) => s.paymentStatus === "PENDING_APPROVAL").length;

                return (
                  <div
                    key={m}
                    onClick={() => {
                      setSelectedMonth(m);
                      setActiveMainTab("REGISTER");
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:border-teal-500 ${
                      slipsInMonth.length > 0
                        ? "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800"
                        : "bg-slate-50/40 opacity-60 border-dashed border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>{m}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500">
                      {slipsInMonth.length > 0 ? (
                        <>
                          <div className="text-emerald-600 font-semibold">
                            পরিশোধিত: ৳{totalMonthPaid.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span>{slipsInMonth.length} টি স্লিপ</span>
                            {pendingCount > 0 && (
                              <span className="text-amber-600 font-bold">
                                ({pendingCount} টি অপেক্ষমাণ)
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <span className="italic">কোনো ডাটা নেই (Not Generated)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: OFFICIAL PRINTABLE PAYSLIP DOCUMENT                             */}
      {/* ========================================================================= */}
      {activeSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-2xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-5 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  অফিশিয়াল স্যালারি সার্টিফিকেট / পে-স্লিপ ({activeSlip.payrollMonth})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="print-payslip-button"
                  onClick={() => printPayslipDocument(activeSlip, branding)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট ডকুমেন্ট (Print)</span>
                </button>
                <button
                  onClick={() => setActiveSlip(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="বন্ধ করুন"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Box */}
            <div className="p-6 rounded-2xl bg-white text-slate-900 shadow-xl space-y-4 font-sans text-xs border border-slate-200">
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-teal-900 tracking-tight">
                    {branding.companyName || "Muslim Welfare Organization"}
                  </h2>
                  <p className="text-[11px] text-slate-600">
                    {activeSlip.branchName} • {branding.address || "Gulshan Corporate Avenue, Dhaka-1212, Bangladesh"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Official Salary Slip for the month of {activeSlip.payrollMonth}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2.5 py-1 rounded font-black text-xs ${
                      activeSlip.paymentStatus === "PAID"
                        ? "bg-emerald-100 text-emerald-800"
                        : activeSlip.paymentStatus === "APPROVED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {activeSlip.paymentStatus}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {activeSlip.paymentDate ? `Disbursed: ${activeSlip.paymentDate}` : "Payment Status Pending"}
                  </p>
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
                  <span className="font-bold text-slate-900 font-mono">{activeSlip.bankAccountNumber || "A/C Verified"}</span>
                </div>
              </div>

              {/* Attendance Summary */}
              <div className="grid grid-cols-5 gap-2 bg-slate-50/60 p-2.5 rounded-lg border border-slate-200 text-center text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">মোট দিন</span>
                  <span className="font-bold text-slate-900">{activeSlip.totalDaysInMonth || 30}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">উপস্থিত</span>
                  <span className="font-bold text-emerald-700">{activeSlip.presentDays || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">দেরিতে (Late)</span>
                  <span className="font-bold text-amber-700">{activeSlip.lateDays || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ছুটি (Leave)</span>
                  <span className="font-bold text-blue-700">{activeSlip.leaveDays || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ওভারটাইম</span>
                  <span className="font-bold text-teal-700">{activeSlip.overtimeHours || 0} hrs</span>
                </div>
              </div>

              {/* Earnings & Deductions 2-Column Split */}
              <div className="grid grid-cols-2 gap-4">
                {/* Earnings Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 text-[11px]">
                    বেতন ও উপার্জনের বিবরণ (Earnings)
                  </div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex justify-between">
                      <span>মূল বেতন (Basic):</span>
                      <span className="font-mono font-bold">৳{(activeSlip.basicSalary ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>বাড়ি ভাড়া (House Rent):</span>
                      <span className="font-mono">৳{(activeSlip.houseRentAllowance || activeSlip.houseRent || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>চিকিৎসা ভাতা (Medical):</span>
                      <span className="font-mono">৳{(activeSlip.medicalAllowance ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>যাতায়াত ভাতা (Transport):</span>
                      <span className="font-mono">৳{(activeSlip.transportAllowance ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>বিশেষ ভাতা (Special Allowance):</span>
                      <span className="font-mono">৳{(activeSlip.specialAllowance ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>ওভারটাইম আয় (Overtime):</span>
                      <span className="font-mono">৳{(activeSlip.overtimePay ?? 0).toLocaleString()}</span>
                    </div>
                    {(activeSlip.festivalBonus || 0) > 0 && (
                      <div className="flex justify-between text-amber-800 font-bold bg-amber-50 px-2 py-1 rounded">
                        <span>উৎসব বোনাস / ভাতা (Bonus):</span>
                        <span className="font-mono">+৳{(activeSlip.festivalBonus || 0).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t font-bold text-slate-900">
                      <span>মোট উপার্জন (Gross):</span>
                      <span className="font-mono">৳{(activeSlip.grossEarnings ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 text-[11px]">
                    কর্তনসমূহ (Deductions)
                  </div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>প্রভিডেন্ট ফান্ড (PF):</span>
                      <span className="font-mono text-red-600">
                        ৳{(activeSlip.providentFundDeduction ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>উৎস কর (Tax):</span>
                      <span className="font-mono text-red-600">৳{(activeSlip.taxDeduction ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>দেরিতে আসার জরিমানা (Late):</span>
                      <span className="font-mono text-red-600">
                        ৳{(activeSlip.lateDeductionAmount || activeSlip.latePenaltyDeduction || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>অনুপস্থিতির কর্তন (Absent):</span>
                      <span className="font-mono text-red-600">
                        ৳{(activeSlip.absenteeismDeduction || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>লোন কিস্তি (Loan EMI):</span>
                      <span className="font-mono text-red-600">
                        ৳{(activeSlip.loanInstallmentDeduction || activeSlip.loanEmiDeduction || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>অগ্রিম বেতন কর্তন (Advance):</span>
                      <span className="font-mono text-red-600">
                        ৳{(activeSlip.advanceSalaryDeduction || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-bold text-slate-900">
                      <span>মোট কর্তন (Total Deductions):</span>
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
                    নিট প্রদেয় বেতন (Net Payable Amount)
                  </span>
                  <span className="text-slate-600 text-[10px]">
                    ব্যাংক হিসাব: {activeSlip.bankName || "Authorized Corporate Bank"} • {activeSlip.bankAccountNumber || "Verified"}
                  </span>
                </div>
                <span className="text-xl font-black text-teal-900 font-mono">
                  ৳{(activeSlip.netSalary ?? 0).toLocaleString()} BDT
                </span>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                {isPayrollAdmin && activeSlip.paymentStatus === "PENDING_APPROVAL" && onApprovePayslip && (
                  <button
                    onClick={() => {
                      onApprovePayslip(activeSlip.id);
                      setActiveSlip({ ...activeSlip, paymentStatus: "APPROVED" });
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>অনুমোদন করুন (Approve)</span>
                  </button>
                )}

                {isPayrollAdmin && activeSlip.paymentStatus === "APPROVED" && onDisbursePayslip && (
                  <button
                    onClick={() => {
                      onDisbursePayslip(activeSlip.id);
                      setActiveSlip({
                        ...activeSlip,
                        paymentStatus: "PAID",
                        paymentDate: new Date().toISOString().split("T")[0],
                      });
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>পরিশোধ সম্পন্ন করুন (Mark as Paid)</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setActiveSlip(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                বন্ধ করুন (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: WORKFLOW EXPLAINER MODAL                                         */}
      {/* ========================================================================= */}
      {showWorkflowExplainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    পে-রোল অনুমোদন ও বিতরণ কর্মপ্রবাহ (Payroll Approval Lifecycle)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    স্ট্যাটাস কেন পেন্ডিং থাকে এবং কীভাবে পরিবর্তন করবেন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWorkflowExplainer(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0">
                  ১
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">
                    ধাপ ১: খসড়া গণনা (Pending Approval)
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    "পে-রোল রান" বাটনে ক্লিক করলে সিস্টেম উপস্থিতি, ওভারটাইম, লেট জরিমানা ও উৎসব বোনাস হিসাব করে প্রাথমিক খসড়া তৈরি করে। এই অবস্থায় ভুলত্রুটি আছে কি না তা এইচআর চেক করতে পারে।
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                  ২
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">
                    ধাপ ২: চূড়ান্ত অনুমোদন (Approved)
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    প্রতিটি কর্মীর সারির ডানপাশের <strong>"অনুমোদন (Approve)"</strong> বাটনে অথবা উপরে <strong>"সকল অনুমোদন করুন"</strong> বাটনে ক্লিক করলে স্ট্যাটাস পরিবর্তিত হয়ে <strong>APPROVED</strong> হয়ে যায়। এর মানে হিসাব চূড়ান্ত ও নির্ভুল।
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                  ৩
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">
                    ধাপ ৩: ব্যাংক ট্রান্সফার ও পরিশোধ (Paid / Disbursed)
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    ব্যাংক শিট এক্সপোর্ট করে কর্মীদের একাউন্টে স্যালারি ট্রান্সফার করার পর <strong>"পরিশোধ (Pay)"</strong> বা <strong>"সকল পরিশোধ (Disburse All)"</strong> বাটনে ক্লিক করলে স্ট্যাটাস <strong>PAID</strong> হয় এবং কর্মীর পে-স্লিপে অফিশিয়াল পেমেন্ট রেফারেন্স রেকর্ড হয়।
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowWorkflowExplainer(false)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer"
              >
                বুঝেছি, ধন্যবাদ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: QUICK BONUS MODAL (DIRECT FROM PAYROLL)                          */}
      {/* ========================================================================= */}
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
                    পে-রোলে নতুন উৎসব বোনাস বা ইনসেনটিভ যুক্ত করুন
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
                  placeholder="যেমন: পহেলা বৈশাখী উৎসব ভাতা বা ঈদ বোনাস"
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
                    <option value="SPECIAL_ALLOWANCE">⭐ বিশেষ ভাতা / কমিশন</option>
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
                    সুনির্দিষ্ট উৎসব তারিখ
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
                    প্রযোজ্য কর্মী শ্রেণী
                  </label>
                  <select
                    value={qBonusTarget}
                    onChange={(e) => setQBonusTarget(e.target.value as CustomBonusConfig["targetEligibility"])}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="ALL_EMPLOYEES">সকল কর্মী (All Staff)</option>
                    <option value="PERMANENT_ONLY">স্থায়ী কর্মী (Permanent Staff)</option>
                    <option value="MUSLIM_EMPLOYEES">মুসলিম কর্মী (Eid)</option>
                    <option value="HINDU_EMPLOYEES">সনাতন ধর্মাবলম্বী কর্মী (Puja)</option>
                  </select>
                </div>
              </div>

              {/* Calculation Method: Percentage vs Fixed */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 space-y-3">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  বোনাসের হিসাবের ধরন নির্বাচন করুন:
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
