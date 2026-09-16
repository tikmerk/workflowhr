import React, { useState } from "react";
import {
  Banknote,
  Plus,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Download,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  X,
  Edit2,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  RotateCcw,
  Check,
  UserCheck,
  Briefcase,
  Info
} from "lucide-react";
import { EmployeeLoan, Employee, Branch, LoanAdvanceCategory } from "../../types";
import { exportToCSV } from "../../utils/exportUtils";

interface LoansViewProps {
  loans: EmployeeLoan[];
  employees: Employee[];
  branches: Branch[];
  onApproveLoan: (loanId: string) => void;
  onRejectLoan: (loanId: string) => void;
  onAddLoan: (loan: EmployeeLoan) => void;
  onUpdateLoan?: (loan: EmployeeLoan) => void;
  onDeleteLoan?: (loanId: string) => void;
  onRepayLoan?: (loanId: string, returnAmount: number, notes?: string) => void;
}

export const LoansView: React.FC<LoansViewProps> = ({
  loans,
  employees,
  branches,
  onApproveLoan,
  onRejectLoan,
  onAddLoan,
  onUpdateLoan,
  onDeleteLoan,
  onRepayLoan,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<"ALL" | LoanAdvanceCategory>("ALL");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState<EmployeeLoan | null>(null);
  const [deleteLoanId, setDeleteLoanId] = useState<string | null>(null);
  const [repayingLoan, setRepayingLoan] = useState<EmployeeLoan | null>(null);

  // Repayment modal state
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayNotes, setRepayNotes] = useState<string>("");

  // Create Form State
  const [newCategory, setNewCategory] = useState<LoanAdvanceCategory>("ADVANCE_SALARY");
  const [newEmpId, setNewEmpId] = useState(employees[0]?.id || "");
  const [newAmount, setNewAmount] = useState(10000);
  const [newAdvanceMonths, setNewAdvanceMonths] = useState<number>(1);
  const [newTenorMonths, setNewTenorMonths] = useState<number>(6);
  const [newDisbursedDate, setNewDisbursedDate] = useState(new Date().toISOString().split("T")[0]);
  const [newExpectedReturnDate, setNewExpectedReturnDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [newRepaymentType, setNewRepaymentType] = useState<"LUMP_SUM" | "MONTHLY_INSTALLMENT">("MONTHLY_INSTALLMENT");
  const [newReason, setNewReason] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newDirectActive, setNewDirectActive] = useState(true);

  // Edit Form State
  const [editCategory, setEditCategory] = useState<LoanAdvanceCategory>("ADVANCE_SALARY");
  const [editEmpId, setEditEmpId] = useState("");
  const [editAmount, setEditAmount] = useState(0);
  const [editRemainingAmount, setEditRemainingAmount] = useState(0);
  const [editAdvanceMonths, setEditAdvanceMonths] = useState<number>(1);
  const [editRepaymentType, setEditRepaymentType] = useState<"LUMP_SUM" | "MONTHLY_INSTALLMENT">("MONTHLY_INSTALLMENT");
  const [editTotalInstallments, setEditTotalInstallments] = useState(1);
  const [editPaidInstallments, setEditPaidInstallments] = useState(0);
  const [editDisbursedDate, setEditDisbursedDate] = useState("");
  const [editExpectedReturnDate, setEditExpectedReturnDate] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<EmployeeLoan["status"]>("ACTIVE");

  const openAddModal = (presetCategory: LoanAdvanceCategory = "ADVANCE_SALARY") => {
    setNewCategory(presetCategory);
    setNewEmpId(employees[0]?.id || "");
    setNewAmount(presetCategory === "ADVANCE_SALARY" ? 15000 : 5000);
    setNewAdvanceMonths(1);
    setNewTenorMonths(6);
    const today = new Date().toISOString().split("T")[0];
    setNewDisbursedDate(today);
    setNewExpectedReturnDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setNewRepaymentType(presetCategory === "ADVANCE_SALARY" ? "MONTHLY_INSTALLMENT" : "LUMP_SUM");
    setNewReason("");
    setNewNotes("");
    setNewDirectActive(true);
    setShowAddModal(true);
  };

  const openEditModal = (loan: EmployeeLoan) => {
    setEditingLoan(loan);
    const cat = loan.category || "ADVANCE_SALARY";
    setEditCategory(cat);
    setEditEmpId(loan.employeeId);
    setEditAmount(loan.amount);
    setEditRemainingAmount(loan.remainingAmount);
    const advMonths = loan.advanceDurationMonths || loan.totalInstallments || 1;
    setEditAdvanceMonths(advMonths);
    setEditRepaymentType(loan.repaymentType || (cat === "COMPANY_LOAN" ? "LUMP_SUM" : "MONTHLY_INSTALLMENT"));
    setEditTotalInstallments(loan.totalInstallments || 1);
    setEditPaidInstallments(loan.paidInstallments || 0);
    setEditDisbursedDate(loan.disbursedDate || loan.applicationDate);
    setEditExpectedReturnDate(loan.expectedReturnDate || "");
    setEditReason(loan.reason);
    setEditNotes(loan.notes || "");
    setEditStatus(loan.status);
  };

  const openRepayModal = (loan: EmployeeLoan) => {
    setRepayingLoan(loan);
    setRepayAmount(loan.remainingAmount);
    setRepayNotes("");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === newEmpId) || employees[0];
    if (!emp) return;

    let totalInstallments = 1;
    let emi = newAmount;

    if (newCategory === "ADVANCE_SALARY") {
      totalInstallments = Math.max(1, newAdvanceMonths);
      emi = Math.round(newAmount / totalInstallments);
    } else if (newCategory === "COMPANY_LOAN") {
      if (newRepaymentType === "MONTHLY_INSTALLMENT") {
        totalInstallments = Math.max(1, newTenorMonths);
        emi = Math.round(newAmount / totalInstallments);
      } else {
        totalInstallments = 1;
        emi = newAmount;
      }
    } else {
      // EMPLOYEE_BORROWING ( ধার নেওয়া )
      totalInstallments = 1;
      emi = newAmount;
    }

    const newLoan: EmployeeLoan = {
      id: `loan-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      branchName: emp.branchName || "Main Office",
      category: newCategory,
      amount: newAmount,
      monthlyEmi: emi,
      totalInstallments: totalInstallments,
      paidInstallments: 0,
      remainingAmount: newAmount,
      reason: newReason.trim() || (newCategory === "EMPLOYEE_BORROWING" ? "প্রজেক্ট পারচেজের জন্য তাৎক্ষণিক ধার" : "স্টাফ অগ্রিম"),
      applicationDate: new Date().toISOString().split("T")[0],
      disbursedDate: newDisbursedDate,
      expectedReturnDate: newExpectedReturnDate || undefined,
      advanceDurationMonths: newCategory === "ADVANCE_SALARY" ? newAdvanceMonths : undefined,
      repaymentType: newRepaymentType,
      notes: newNotes.trim() || undefined,
      status: newDirectActive ? "ACTIVE" : "PENDING_APPROVAL",
    };

    onAddLoan(newLoan);
    setShowAddModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoan) return;

    const emp = employees.find((x) => x.id === editEmpId) || employees[0];
    let installments = 1;
    let emi = editAmount;

    if (editCategory === "ADVANCE_SALARY") {
      installments = Math.max(1, editAdvanceMonths);
      emi = Math.round(editAmount / installments);
    } else if (editCategory === "COMPANY_LOAN") {
      if (editRepaymentType === "MONTHLY_INSTALLMENT") {
        installments = Math.max(1, editTotalInstallments);
        emi = Math.round(editAmount / installments);
      } else {
        installments = 1;
        emi = editAmount;
      }
    } else {
      installments = 1;
      emi = editAmount;
    }

    const updated: EmployeeLoan = {
      ...editingLoan,
      employeeId: emp.id,
      employeeName: emp.fullName,
      branchName: emp.branchName || editingLoan.branchName,
      category: editCategory,
      amount: editAmount,
      monthlyEmi: emi,
      totalInstallments: installments,
      paidInstallments: editPaidInstallments,
      remainingAmount: editRemainingAmount,
      disbursedDate: editDisbursedDate,
      expectedReturnDate: editExpectedReturnDate || undefined,
      advanceDurationMonths: editCategory === "ADVANCE_SALARY" ? editAdvanceMonths : undefined,
      repaymentType: editRepaymentType,
      reason: editReason.trim(),
      notes: editNotes.trim(),
      status: editStatus,
    };

    if (onUpdateLoan) {
      onUpdateLoan(updated);
    }
    setEditingLoan(null);
  };

  const handleConfirmRepay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayingLoan) return;

    if (repayAmount <= 0) return;

    if (onRepayLoan) {
      onRepayLoan(repayingLoan.id, repayAmount, repayNotes.trim());
    } else if (onUpdateLoan) {
      const newRemaining = Math.max(0, repayingLoan.remainingAmount - repayAmount);
      const isClosed = newRemaining === 0;
      const updated: EmployeeLoan = {
        ...repayingLoan,
        remainingAmount: newRemaining,
        paidInstallments: (repayingLoan.paidInstallments || 0) + 1,
        status: isClosed ? "CLOSED" : repayingLoan.status,
        notes: repayNotes ? `${repayingLoan.notes || ""} | ফেরত: ৳${repayAmount} (${repayNotes})` : repayingLoan.notes,
        returnDate: isClosed ? new Date().toISOString().split("T")[0] : repayingLoan.returnDate,
      };
      onUpdateLoan(updated);
    }
    setRepayingLoan(null);
  };

  const handleConfirmDelete = () => {
    if (deleteLoanId && onDeleteLoan) {
      onDeleteLoan(deleteLoanId);
      setDeleteLoanId(null);
    }
  };

  // Filter logic
  const filteredLoans = loans.filter((loan) => {
    const cat = loan.category || "ADVANCE_SALARY";
    const matchesCategory = selectedCategoryTab === "ALL" || cat === selectedCategoryTab;

    const matchesSearch =
      (loan.employeeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loan.reason || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loan.notes || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "ALL" ||
      (selectedStatus === "ACTIVE" && (loan.status === "ACTIVE" || loan.status === "APPROVED")) ||
      loan.status === selectedStatus;

    return matchesCategory && matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalAdvancesActive = loans
    .filter((l) => (l.category === "ADVANCE_SALARY" || !l.category) && (l.status === "ACTIVE" || l.status === "APPROVED"))
    .reduce((sum, l) => sum + (l.remainingAmount ?? 0), 0);

  const totalStaffLoansActive = loans
    .filter((l) => l.category === "COMPANY_LOAN" && (l.status === "ACTIVE" || l.status === "APPROVED"))
    .reduce((sum, l) => sum + (l.remainingAmount ?? 0), 0);

  const totalEmployeeBorrowing = loans
    .filter((l) => l.category === "EMPLOYEE_BORROWING" && (l.status === "ACTIVE" || l.status === "APPROVED"))
    .reduce((sum, l) => sum + (l.remainingAmount ?? 0), 0);

  const totalClosedRepaid = loans
    .filter((l) => l.status === "CLOSED" || l.status === "COMPLETED")
    .reduce((sum, l) => sum + (l.amount ?? 0), 0);

  const handleExportCSV = () => {
    const data = filteredLoans.map((l) => ({
      "Record ID": l.id,
      Category:
        l.category === "ADVANCE_SALARY"
          ? "Advance Salary"
          : l.category === "COMPANY_LOAN"
          ? "Company Loan"
          : "Borrowed from Staff",
      "Employee Name": l.employeeName,
      Branch: l.branchName,
      "Principal Amount (BDT)": l.amount,
      "Remaining Balance (BDT)": l.remainingAmount,
      "Duration / Installments": l.totalInstallments,
      "Disbursement Date": l.disbursedDate || l.applicationDate,
      "Target Return Date": l.expectedReturnDate || "N/A",
      Status: l.status,
      Reason: l.reason,
      Notes: l.notes || "",
    }));
    exportToCSV("Workflow_HR_Loans_Advances_Ledger", data);
  };

  return (
    <div id="loans-management-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Banknote className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>লোন, অ্যাডভান্স ও প্রজেক্ট ধার ব্যবস্থাপনা (Loans & Advances Ledger)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              বেতনের অ্যাডভান্স (১ বা ২ মাস ভিত্তিক), আলাদা কোম্পানি লোন এবং প্রজেক্টের জন্য কর্মী থেকে নেওয়া ধারের পৃথক হিসাব ও স্বয়ংক্রিয় সমন্বয়
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>লেজার এক্সপোর্ট (CSV)</span>
            </button>

            <button
              onClick={() => openAddModal("ADVANCE_SALARY")}
              className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>অ্যাডভান্স বেতন প্রদান</span>
            </button>

            <button
              onClick={() => openAddModal("COMPANY_LOAN")}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>কোম্পানি লোন</span>
            </button>

            <button
              onClick={() => openAddModal("EMPLOYEE_BORROWING")}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              title="প্রজেক্ট বা অফিস কেনাকাটায় কর্মীর থেকে ধার নেওয়া"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>কর্মী থেকে ধার গ্রহণ</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedCategoryTab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategoryTab === "ALL"
                ? "bg-teal-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            সকল লেজার ({loans.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategoryTab("ADVANCE_SALARY")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategoryTab === "ADVANCE_SALARY"
                ? "bg-teal-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-teal-400" />
            <span>অ্যাডভান্স বেতন (Advance Salary)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategoryTab("COMPANY_LOAN")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategoryTab === "COMPANY_LOAN"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-400" />
            <span>কোম্পানি / বসের লোন (Staff Loan)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategoryTab("EMPLOYEE_BORROWING")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategoryTab === "EMPLOYEE_BORROWING"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>কর্মী থেকে ধার (Borrowed from Staff)</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="কর্মীর নাম, কারণ বা ভাউচার দিয়ে খুঁজুন..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">সকল স্ট্যাটাস (All Statuses)</option>
              <option value="ACTIVE">চলমান বা বকেয়া (Active / Outstanding)</option>
              <option value="PENDING_APPROVAL">অনুমোদন অপেক্ষমাণ (Pending Review)</option>
              <option value="CLOSED">সম্পূর্ণ পরিশোধিত (Closed / Repaid)</option>
              <option value="REJECTED">প্রত্যাখ্যাত (Rejected)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top Guidance Banner: Advance Salary vs Boss / Company Loan */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-amber-500/10 border border-teal-500/20 dark:border-teal-500/30 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>লোন ও অ্যাডভান্সের পার্থক্য এবং হিসাব পদ্ধতি:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-700 dark:text-slate-300">
          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-teal-500/20">
            <span className="font-bold text-teal-800 dark:text-teal-300 block mb-1">১. অ্যাডভান্স বেতন (Advance Salary):</span>
            বেতনের বিপরীতে নেওয়া অগ্রিম। এটি পে-রোল চালুর সময় নির্বাচিত সময়সীমা (যেমন ১ মাস বা ২ মাস) অনুযায়ী স্বয়ংক্রিয়ভাবে বেতন থেকে সমন্বয় বা কর্তন করা হবে।
          </div>
          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-blue-500/20">
            <span className="font-bold text-blue-800 dark:text-blue-300 block mb-1">২. বসের / কোম্পানি লোন (Personal/Staff Loan):</span>
            বসের থেকে বা প্রতিষ্ঠান থেকে নেওয়া ব্যক্তিগত ঋণ (বেতনের জন্য নয়)। এটি বেতনের বাইরে নির্ধারিত তারিখে সরাসরি বসের কাছে বা অফিসে ফেরতযোগ্য (এককালীন বা কিস্তিতে)।
          </div>
          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-amber-500/20">
            <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">৩. কর্মী থেকে ধার (Borrowed from Staff):</span>
            অফিস বা সাইটের জরুরি মালামাল কেনার জন্য কর্মীর থেকে সাময়িক ধার গ্রহণ। কোম্পানি নির্দিষ্ট তারিখে কর্মীকে এই টাকা ফেরত প্রদান করবে।
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">অ্যাডভান্স বেতন বকেয়া</span>
          <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block font-mono">
            ৳{totalAdvancesActive.toLocaleString()}
          </span>
          <span className="text-[10px] text-teal-700 dark:text-teal-400 mt-1 block">পরবর্তী পে-রোলে সমন্বয়যোগ্য</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">কর্মীদের কোম্পানি লোন</span>
          <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 block font-mono">
            ৳{totalStaffLoansActive.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">নির্ধারিত তারিখে বা কিস্তিতে আদায়</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/30 bg-amber-500/5 shadow-xs">
          <span className="text-[11px] text-amber-800 dark:text-amber-300 block font-medium">কর্মী থেকে ধার (কোম্পানির দায়)</span>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block font-mono">
            ৳{totalEmployeeBorrowing.toLocaleString()}
          </span>
          <span className="text-[10px] text-amber-700 dark:text-amber-300 mt-1 block">প্রজেক্ট পারচেজ ফেরতযোগ্য</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 bg-emerald-500/5 shadow-xs">
          <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block font-medium">সম্পূর্ণ পরিশোধিত / খালাস</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block font-mono">
            ৳{totalClosedRepaid.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-1 block">সম্পূর্ণ সেটেলড রেকর্ডসমূহ</span>
        </div>
      </div>

      {/* Loans & Advances Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">কর্মী ও ধরন (Employee & Type)</th>
                <th className="p-3">পরিমাণ (Amount)</th>
                <th className="p-3">সময়সীমা / কিস্তি (Tenor)</th>
                <th className="p-3">নেওয়া ও ফেরতের তারিখ (Dates)</th>
                <th className="p-3">অবশিষ্ট বকেয়া (Balance)</th>
                <th className="p-3">স্ট্যাটাস (Status)</th>
                <th className="p-3 text-right">অ্যাকশন (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    কোনো লোন বা অ্যাডভান্সের রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => {
                  const cat = loan.category || "ADVANCE_SALARY";
                  const isBorrowing = cat === "EMPLOYEE_BORROWING";
                  const isAdvance = cat === "ADVANCE_SALARY";

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-2 rounded-xl text-xs font-bold ${
                              cat === "ADVANCE_SALARY"
                                ? "bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30"
                                : cat === "COMPANY_LOAN"
                                ? "bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30"
                                : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {cat === "ADVANCE_SALARY" ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : cat === "COMPANY_LOAN" ? (
                              <Briefcase className="w-4 h-4" />
                            ) : (
                              <ArrowDownLeft className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{loan.employeeName}</span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                  cat === "ADVANCE_SALARY"
                                    ? "bg-teal-500/15 text-teal-800 dark:text-teal-300"
                                    : cat === "COMPANY_LOAN"
                                    ? "bg-blue-500/15 text-blue-800 dark:text-blue-300"
                                    : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                                }`}
                              >
                                {cat === "ADVANCE_SALARY"
                                  ? "অ্যাডভান্স বেতন"
                                  : cat === "COMPANY_LOAN"
                                  ? "কোম্পানি লোন"
                                  : "কর্মী থেকে ধার"}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={loan.reason}>
                              {loan.reason}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-mono">
                        <div className="font-bold text-slate-900 dark:text-white">
                          ৳{(loan.amount ?? 0).toLocaleString()}
                        </div>
                        {isAdvance && (
                          <div className="text-[10px] text-teal-700 dark:text-teal-400 font-sans">
                            মাসিক কর্তন: ৳{(loan.monthlyEmi ?? 0).toLocaleString()}
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        {isAdvance ? (
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {loan.advanceDurationMonths || loan.totalInstallments} মাসের অ্যাডভান্স
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              {loan.paidInstallments} / {loan.totalInstallments} মাস সমন্বিত
                            </span>
                          </div>
                        ) : isBorrowing ? (
                          <div>
                            <span className="font-semibold text-amber-700 dark:text-amber-300">প্রজেক্ট ধার</span>
                            <span className="block text-[10px] text-slate-500">এককালীন ফেরতযোগ্য</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {loan.totalInstallments} মাস কিস্তি
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              {loan.paidInstallments} / {loan.totalInstallments} কিস্তি পরিশোধ
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-[11px]">
                        <div>
                          <span className="text-slate-400">প্রদান/গ্রহণ: </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {loan.disbursedDate || loan.applicationDate}
                          </span>
                        </div>
                        {loan.expectedReturnDate && (
                          <div>
                            <span className="text-slate-400">ফেরত দেওয়ার তারিখ: </span>
                            <span className="font-semibold text-teal-700 dark:text-teal-400">
                              {loan.expectedReturnDate}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="p-3 font-mono">
                        <div
                          className={`font-bold ${
                            loan.remainingAmount > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          ৳{(loan.remainingAmount ?? 0).toLocaleString()}
                        </div>
                        {loan.remainingAmount === 0 && (
                          <span className="text-[9px] font-bold text-emerald-600">পরিশোধ সম্পন্ন</span>
                        )}
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            loan.status === "ACTIVE" || loan.status === "APPROVED"
                              ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                              : loan.status === "PENDING_APPROVAL" || loan.status === "REQUESTED"
                              ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                              : loan.status === "CLOSED" || loan.status === "COMPLETED"
                              ? "bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30"
                              : "bg-red-500/15 text-red-800 dark:text-red-300 border border-red-500/30"
                          }`}
                        >
                          {loan.status === "ACTIVE" || loan.status === "APPROVED"
                            ? "চলমান"
                            : loan.status === "PENDING_APPROVAL" || loan.status === "REQUESTED"
                            ? "অপেক্ষমাণ"
                            : loan.status === "CLOSED" || loan.status === "COMPLETED"
                            ? "পরিশোধিত"
                            : "বাতিল"}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {loan.status === "PENDING_APPROVAL" && (
                            <>
                              <button
                                onClick={() => onApproveLoan(loan.id)}
                                className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white cursor-pointer font-bold flex items-center gap-1 text-[11px]"
                                title="অনুমোদন করুন"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>অনুমোদন</span>
                              </button>
                              <button
                                onClick={() => onRejectLoan(loan.id)}
                                className="px-2 py-1 rounded-lg bg-red-500/15 text-red-700 dark:text-red-300 hover:bg-red-600 hover:text-white cursor-pointer font-bold flex items-center gap-1 text-[11px]"
                                title="প্রত্যাখ্যান করুন"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>বাতিল</span>
                              </button>
                            </>
                          )}

                          {loan.remainingAmount > 0 && (
                            <button
                              type="button"
                              onClick={() => openRepayModal(loan)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1 transition-all"
                              title="টাকা ফেরত বা কিস্তি জমা দিন"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>ফেরত দিন</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openEditModal(loan)}
                            className="px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold border border-teal-500/20 cursor-pointer flex items-center gap-1 text-xs transition-all"
                            title="তথ্য এডিট বা সংশোধন করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                            <span>এডিট</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteLoanId(loan.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 font-bold border border-red-500/20 cursor-pointer flex items-center gap-1 text-xs transition-all"
                            title="রেকর্ডটি মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                            <span>মুছুন</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Responsive Mobile / Tablet Card View (guarantees edit/delete are never hidden by table overflow) */}
        <div className="block lg:hidden space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            কার্ড ভিউ ({filteredLoans.length})
          </div>
          {filteredLoans.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              কোনো রেকর্ড পাওয়া যায়নি।
            </div>
          ) : (
            filteredLoans.map((loan) => {
              const cat = loan.category || "ADVANCE_SALARY";
              const isAdvance = cat === "ADVANCE_SALARY";
              const isBorrowing = cat === "EMPLOYEE_BORROWING";

              return (
                <div
                  key={`card-${loan.id}`}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {loan.employeeName}
                      </div>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                          cat === "ADVANCE_SALARY"
                            ? "bg-teal-500/15 text-teal-800 dark:text-teal-300"
                            : cat === "COMPANY_LOAN"
                            ? "bg-blue-500/15 text-blue-800 dark:text-blue-300"
                            : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                        }`}
                      >
                        {cat === "ADVANCE_SALARY"
                          ? `অ্যাডভান্স বেতন (${loan.advanceDurationMonths || loan.totalInstallments} মাস)`
                          : cat === "COMPANY_LOAN"
                          ? loan.repaymentType === "LUMP_SUM"
                            ? "কোম্পানি লোন (এককালীন ফেরত)"
                            : `কোম্পানি লোন (${loan.totalInstallments} মাস কিস্তি)`
                          : "কর্মী থেকে ধার"}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        loan.status === "ACTIVE" || loan.status === "APPROVED"
                          ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                          : loan.status === "PENDING_APPROVAL" || loan.status === "REQUESTED"
                          ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                          : loan.status === "CLOSED" || loan.status === "COMPLETED"
                          ? "bg-blue-500/15 text-blue-800 dark:text-blue-300"
                          : "bg-red-500/15 text-red-800 dark:text-red-300"
                      }`}
                    >
                      {loan.status === "ACTIVE" || loan.status === "APPROVED"
                        ? "চলমান"
                        : loan.status === "PENDING_APPROVAL" || loan.status === "REQUESTED"
                        ? "অপেক্ষমাণ"
                        : loan.status === "CLOSED" || loan.status === "COMPLETED"
                        ? "পরিশোধিত"
                        : "বাতিল"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <span className="text-slate-400 block text-[10px]">মোট পরিমাণ:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ৳{(loan.amount ?? 0).toLocaleString()}
                      </span>
                      {isAdvance && (
                        <span className="block text-[10px] text-teal-700 dark:text-teal-400 font-medium">
                          মাসিক: ৳{(loan.monthlyEmi ?? 0).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">অবশিষ্ট বকেয়া:</span>
                      <span
                        className={`font-mono font-bold ${
                          loan.remainingAmount > 0
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        ৳{(loan.remainingAmount ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {loan.reason && (
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-slate-400">কারণ: </span>
                      {loan.reason}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                    {loan.remainingAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => openRepayModal(loan)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>ফেরত দিন</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditModal(loan)}
                      className="px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold border border-teal-500/20 cursor-pointer flex items-center gap-1 text-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>এডিট</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteLoanId(loan.id)}
                      className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 font-bold border border-red-500/20 cursor-pointer flex items-center gap-1 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>মুছুন</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Grant New Loan / Advance / Borrowing */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-lg text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>
                    {newCategory === "ADVANCE_SALARY"
                      ? "নতুন অ্যাডভান্স বেতন প্রদান"
                      : newCategory === "COMPANY_LOAN"
                      ? "নতুন কোম্পানি / বসের লোন"
                      : "কর্মী থেকে ধার গ্রহণ (প্রজেক্ট পারচেজ)"}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  নির্ধারিত ক্যাটাগরি অনুসারে তথ্য ও পরিশোধের তারিখ সংরক্ষণ করুন
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Switcher in Form */}
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setNewCategory("ADVANCE_SALARY");
                  setNewRepaymentType("MONTHLY_INSTALLMENT");
                }}
                className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${
                  newCategory === "ADVANCE_SALARY"
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-teal-600"
                }`}
              >
                অ্যাডভান্স বেতন
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewCategory("COMPANY_LOAN");
                  setNewRepaymentType("LUMP_SUM");
                }}
                className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${
                  newCategory === "COMPANY_LOAN"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-blue-600"
                }`}
              >
                কোম্পানি লোন
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewCategory("EMPLOYEE_BORROWING");
                  setNewRepaymentType("LUMP_SUM");
                }}
                className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${
                  newCategory === "EMPLOYEE_BORROWING"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-amber-600"
                }`}
              >
                কর্মী থেকে ধার
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  {newCategory === "EMPLOYEE_BORROWING" ? "যার থেকে ধার নেওয়া হচ্ছে (কর্মী) *" : "কর্মী নির্বাচন করুন *"}
                </label>
                <select
                  value={newEmpId}
                  onChange={(e) => setNewEmpId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  required
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.employeeCode}) - {e.designationTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">টাকার পরিমাণ (৳ BDT) *</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    step={500}
                    min={500}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono font-bold"
                    required
                  />
                </div>

                {newCategory === "ADVANCE_SALARY" ? (
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                      কত মাসের অ্যাডভান্স? *
                    </label>
                    <select
                      value={newAdvanceMonths}
                      onChange={(e) => setNewAdvanceMonths(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold"
                    >
                      <option value={1}>১ মাসের অ্যাডভান্স (পরের মাসের বেতনে সমন্বয়)</option>
                      <option value={2}>২ মাসের অ্যাডভান্স (২ মাসের সমান কিস্তিতে কর্তন)</option>
                      <option value={3}>৩ মাসের অ্যাডভান্স (৩ মাসের সমান কিস্তিতে কর্তন)</option>
                      <option value={4}>৪ মাসের অ্যাডভান্স</option>
                      <option value={6}>৬ মাসের অ্যাডভান্স</option>
                    </select>
                  </div>
                ) : newCategory === "COMPANY_LOAN" ? (
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">পরিশোধ পদ্ধতি *</label>
                    <select
                      value={newRepaymentType}
                      onChange={(e) => setNewRepaymentType(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="LUMP_SUM">এককালীন ফেরত (Lump Sum Return)</option>
                      <option value="MONTHLY_INSTALLMENT">মাসিক কিস্তিতে (Monthly Installment)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">প্রজেক্ট / খরচের খাত</label>
                    <input
                      type="text"
                      value={newReason}
                      onChange={(e) => setNewReason(e.target.value)}
                      placeholder="যেমন: জরুরি সাইট ভিজিট পারচেজ..."
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                )}
              </div>

              {newCategory === "COMPANY_LOAN" && newRepaymentType === "MONTHLY_INSTALLMENT" && (
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">কিস্তির মাস সংখ্যা</label>
                  <select
                    value={newTenorMonths}
                    onChange={(e) => setNewTenorMonths(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                  >
                    <option value={3}>৩ মাস (মাসিক EMI: ৳{Math.round(newAmount / 3)})</option>
                    <option value={6}>৬ মাস (মাসিক EMI: ৳{Math.round(newAmount / 6)})</option>
                    <option value={10}>১০ মাস (মাসিক EMI: ৳{Math.round(newAmount / 10)})</option>
                    <option value={12}>১২ মাস (মাসিক EMI: ৳{Math.round(newAmount / 12)})</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {newCategory === "EMPLOYEE_BORROWING" ? "ধার নেওয়ার তারিখ *" : "প্রদানের তারিখ *"}
                  </label>
                  <input
                    type="date"
                    value={newDisbursedDate}
                    onChange={(e) => setNewDisbursedDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {newCategory === "EMPLOYEE_BORROWING"
                      ? "কর্মীকে ফেরত দেওয়ার সম্ভাব্য তারিখ *"
                      : "ফেরত / সমন্বয়ের তারিখ"}
                  </label>
                  <input
                    type="date"
                    value={newExpectedReturnDate}
                    onChange={(e) => setNewExpectedReturnDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    required={newCategory === "EMPLOYEE_BORROWING"}
                  />
                </div>
              </div>

              {newCategory !== "EMPLOYEE_BORROWING" && (
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">কারণ বা উদ্দেশ্য *</label>
                  <input
                    type="text"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    placeholder={
                      newCategory === "ADVANCE_SALARY"
                        ? "যেমন: পারিবারিক জরুরি খরচ, বাড়ি ভাড়া..."
                        : "যেমন: ব্যক্তিগত বিশেষ লোন (বেতনের বাইরে)..."
                    }
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">অতিরিক্ত নোট বা ভাউচার রেফারেন্স</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="যেমন: ক্যাশ ভাউচার #৮৮২, বস কর্তৃক অনুমোদিত..."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 flex items-center justify-between">
                <div>
                  <span className="font-bold text-teal-900 dark:text-teal-200 block text-xs">সরাসরি কার্যকর (Active) হিসেবে যুক্ত করুন</span>
                  <span className="text-[11px] text-teal-700 dark:text-teal-400 block">আনচেক করলে অনুমোদন অপেক্ষমাণ থাকবে</span>
                </div>
                <input
                  type="checkbox"
                  checked={newDirectActive}
                  onChange={(e) => setNewDirectActive(e.target.checked)}
                  className="w-4 h-4 accent-teal-600 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold cursor-pointer shadow-md shadow-teal-500/20"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Loan/Advance/Borrowing */}
      {editingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-lg text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>রেকর্ড সম্পাদনা (Edit Record)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {editingLoan.employeeName} • ID: {editingLoan.id}
                </p>
              </div>
              <button
                onClick={() => setEditingLoan(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">ক্যাটাগরি *</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="ADVANCE_SALARY">অ্যাডভান্স বেতন (Advance Salary)</option>
                    <option value="COMPANY_LOAN">কোম্পানি লোন (Staff Loan)</option>
                    <option value="EMPLOYEE_BORROWING">কর্মী থেকে ধার (Borrowed from Staff)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">কর্মী *</label>
                  <select
                    value={editEmpId}
                    onChange={(e) => setEditEmpId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName} ({e.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">মোট পরিমাণ (৳ BDT) *</label>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">অবশিষ্ট বকেয়া (৳ BDT) *</label>
                  <input
                    type="number"
                    value={editRemainingAmount}
                    onChange={(e) => setEditRemainingAmount(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono font-bold text-amber-600"
                    required
                  />
                </div>
              </div>

              {editCategory === "ADVANCE_SALARY" ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                        অগ্রিম বেতনের সময়কাল (কত মাসের অ্যাডভান্স?) *
                      </label>
                      <select
                        value={editAdvanceMonths}
                        onChange={(e) => {
                          const months = Number(e.target.value);
                          setEditAdvanceMonths(months);
                          setEditTotalInstallments(months);
                        }}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold"
                      >
                        <option value={1}>১ মাসের অ্যাডভান্স (পরের মাসের বেতনে এককালীন সমন্বয়)</option>
                        <option value={2}>২ মাসের অ্যাডভান্স (২ মাসের সমান কিস্তিতে কর্তন)</option>
                        <option value={3}>৩ মাসের অ্যাডভান্স (৩ মাসের সমান কিস্তিতে কর্তন)</option>
                        <option value={4}>৪ মাসের অ্যাডভান্স</option>
                        <option value={6}>৬ মাসের অ্যাডভান্স</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                        ইতোমধ্যে সমন্বিত / পরিশোধিত মাস
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={editAdvanceMonths}
                        value={editPaidInstallments}
                        onChange={(e) => setEditPaidInstallments(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-800 dark:text-teal-200 flex items-center justify-between">
                    <span>
                      মাসিক পে-রোল কর্তন: <strong>৳{Math.round(editAmount / Math.max(1, editAdvanceMonths)).toLocaleString()}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const paid = editPaidInstallments;
                        const emi = Math.round(editAmount / Math.max(1, editAdvanceMonths));
                        const calculatedRemaining = Math.max(0, editAmount - (paid * emi));
                        setEditRemainingAmount(calculatedRemaining);
                      }}
                      className="text-[10px] text-teal-600 dark:text-teal-400 underline hover:text-teal-700 cursor-pointer font-bold"
                    >
                      বকেয়া পুনর্গণনা করুন
                    </button>
                  </div>
                </div>
              ) : editCategory === "COMPANY_LOAN" ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                        পরিশোধ পদ্ধতি (Repayment Type) *
                      </label>
                      <select
                        value={editRepaymentType}
                        onChange={(e) => setEditRepaymentType(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold"
                      >
                        <option value="LUMP_SUM">এককালীন সরাসরি ফেরত (বেতনের বাইরে)</option>
                        <option value="MONTHLY_INSTALLMENT">মাসিক কিস্তিতে (Monthly Installments)</option>
                      </select>
                    </div>

                    {editRepaymentType === "MONTHLY_INSTALLMENT" ? (
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                          মোট কিস্তি সংখ্যা
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={editTotalInstallments}
                          onChange={(e) => setEditTotalInstallments(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                          required
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                          পরিশোধের ধরন
                        </label>
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs">
                          বসের/অফিসে সরাসরি এককালীন ফেরত
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                        পরিশোধিত কিস্তি সংখ্যা
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={editPaidInstallments}
                        onChange={(e) => setEditPaidInstallments(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                        required
                      />
                    </div>
                    {editRepaymentType === "MONTHLY_INSTALLMENT" && (
                      <div className="flex items-end pb-1 text-xs text-blue-600 dark:text-blue-400 font-bold">
                        মাসিক কিস্তি: ৳{Math.round(editAmount / Math.max(1, editTotalInstallments)).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">মোট কিস্তি/সংখ্যা</label>
                    <input
                      type="number"
                      min={1}
                      value={editTotalInstallments}
                      onChange={(e) => setEditTotalInstallments(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">পরিশোধিত কিস্তি সংখ্যা</label>
                    <input
                      type="number"
                      min={0}
                      value={editPaidInstallments}
                      onChange={(e) => setEditPaidInstallments(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">প্রদান/গ্রহণের তারিখ</label>
                  <input
                    type="date"
                    value={editDisbursedDate}
                    onChange={(e) => setEditDisbursedDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">ফেরতের তারিখ</label>
                  <input
                    type="date"
                    value={editExpectedReturnDate}
                    onChange={(e) => setEditExpectedReturnDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">কারণ / উদ্দেশ্য</label>
                  <input
                    type="text"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">স্ট্যাটাস</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="ACTIVE">চলমান (ACTIVE)</option>
                    <option value="PENDING_APPROVAL">অপেক্ষমাণ (PENDING_APPROVAL)</option>
                    <option value="CLOSED">পরিশোধিত (CLOSED)</option>
                    <option value="REJECTED">প্রত্যাখ্যাত (REJECTED)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">নোট বা মন্তব্য</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLoan(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold cursor-pointer shadow-md"
                >
                  আপডেট সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Repayment / Return Payment */}
      {repayingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>টাকা ফেরত / পরিশোধ সমন্বয়</span>
              </h3>
              <button
                onClick={() => setRepayingLoan(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">কর্মী:</span>
                <span className="font-bold text-slate-900 dark:text-white">{repayingLoan.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ক্যাটাগরি:</span>
                <span className="font-bold text-teal-700 dark:text-teal-300">
                  {repayingLoan.category === "EMPLOYEE_BORROWING"
                    ? "কর্মী থেকে ধার (কোম্পানি ফেরত দিচ্ছে)"
                    : repayingLoan.category === "COMPANY_LOAN"
                    ? "কোম্পানি লোন (কর্মী ফেরত দিচ্ছে)"
                    : "অ্যাডভান্স বেতন সমন্বয়"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">বর্তমান অবশিষ্ট বকেয়া:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                  ৳{(repayingLoan.remainingAmount ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmRepay} className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold">
                    জমা / ফেরতের পরিমাণ (৳ BDT) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setRepayAmount(repayingLoan.remainingAmount)}
                    className="text-[11px] text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                  >
                    সম্পূর্ণ বকেয়া (৳{repayingLoan.remainingAmount})
                  </button>
                </div>
                <input
                  type="number"
                  min={1}
                  max={repayingLoan.remainingAmount}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono font-bold text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  ফেরতের বিবরণ বা নোট (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  placeholder="যেমন: ক্যাশ ফেরত, বিকাশ ট্রান্সফার, ইত্যাদি..."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              {repayingLoan.remainingAmount - repayAmount === 0 && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-1.5 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>সম্পূর্ণ টাকা পরিশোধ হওয়ায় স্ট্যাটাস স্বয়ংক্রিয়ভাবে "CLOSED" হবে।</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRepayingLoan(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold cursor-pointer shadow-md"
                >
                  ফেরত সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Record */}
      {deleteLoanId && (() => {
        const loanToDelete = loans.find((l) => l.id === deleteLoanId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">রেকর্ড মুছে ফেলতে চান?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    এই লোন বা অ্যাডভান্স এন্ট্রিটি লেজার থেকে স্থায়ীভাবে মুছে যাবে।
                  </p>
                </div>
              </div>

              {loanToDelete && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">কর্মী:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{loanToDelete.employeeName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">ধরন:</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">
                      {loanToDelete.category === "ADVANCE_SALARY"
                        ? `অ্যাডভান্স বেতন (${loanToDelete.advanceDurationMonths || loanToDelete.totalInstallments} মাস)`
                        : loanToDelete.category === "COMPANY_LOAN"
                        ? loanToDelete.repaymentType === "LUMP_SUM"
                          ? "কোম্পানি লোন (এককালীন ফেরত)"
                          : "কোম্পানি লোন (কিস্তি)"
                        : "কর্মী থেকে ধার"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">মূল পরিমাণ:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">৳{(loanToDelete.amount ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">অবশিষ্ট বকেয়া:</span>
                    <span className="font-mono font-bold text-amber-600">৳{(loanToDelete.remainingAmount ?? 0).toLocaleString()}</span>
                  </div>
                  {loanToDelete.reason && (
                    <div className="flex justify-between items-start gap-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-500 shrink-0">উদ্দেশ্য/কারণ:</span>
                      <span className="text-slate-700 dark:text-slate-300 text-right">{loanToDelete.reason}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteLoanId(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  না, বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>হ্যাঁ, মুছে ফেলুন</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
