import React, { useState } from "react";
import {
  UserMinus,
  CheckCircle2,
  AlertCircle,
  Plus,
  Building2,
  Calendar,
  Layers,
  Banknote,
  FileCheck2,
  X,
  Clock,
  Briefcase,
  ShieldCheck,
  Search,
  ArrowRight,
  Filter,
  Trash2
} from "lucide-react";
import { ExitRecord, Employee } from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";

interface ExitManagementViewProps {
  exitRecords: ExitRecord[];
  employees: Employee[];
  onAddExit: (record: ExitRecord) => void;
  onUpdateClearance: (
    exitId: string,
    dept: "itClearance" | "accountsClearance" | "adminClearance" | "hrClearance"
  ) => void;
  onDeleteExitRecord?: (exitId: string) => void;
}

export const ExitManagementView: React.FC<ExitManagementViewProps> = ({
  exitRecords = [],
  employees = [],
  onAddExit,
  onUpdateClearance,
  onDeleteExitRecord,
}) => {
  const { isBangla, toBanglaDigits } = useThemeLanguage();
  const [showResignModal, setShowResignModal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || "");
  const [noticeDays, setNoticeDays] = useState(30);
  const [lastWorkingDate, setLastWorkingDate] = useState("2026-09-30");
  const [reason, setReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const handleCreateExit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === selectedEmpId) || employees[0];
    if (!emp) return;

    const basic =
      emp.salary?.basic !== undefined && emp.salary?.basic !== null
        ? emp.salary.basic
        : (emp.salary?.grossSalary ?? 0);
    const gratuity = Math.round(basic * 1.5);
    const leaveEncashment = Math.round((basic / 30) * 12);
    const pfRefund = Math.round(basic * 0.5);
    const settlement = basic + gratuity + leaveEncashment + pfRefund;

    const newExit: ExitRecord = {
      id: `exit-${Date.now()}`,
      employeeId: emp.id,
      employeeCode: emp.employeeCode || `WF-${Math.floor(1000 + Math.random() * 9000)}`,
      employeeName: emp.fullName,
      avatarUrl: emp.avatarUrl,
      branchName: emp.branchName,
      departmentName: emp.departmentName,
      designationTitle: emp.designationTitle,
      exitType: "RESIGNATION",
      resignationDate: new Date().toISOString().split("T")[0],
      noticeDate: new Date().toISOString().split("T")[0],
      noticePeriodDays: Number(noticeDays),
      lastWorkingDay: lastWorkingDate,
      reason: reason || (isBangla ? "উচ্চতর ক্যারিয়ার সুযোগ" : "Career advancement"),
      status: "NOTICE_PERIOD",
      assetClearancePassed: false,
      departmentClearancePassed: false,
      accountsClearancePassed: false,
      gratuityAmount: gratuity,
      providentFundRefund: pfRefund,
      unusedLeaveEncashment: leaveEncashment,
      totalSettlementAmount: settlement,
      clearanceStatus: {
        itClearance: false,
        accountsClearance: false,
        adminClearance: false,
        hrClearance: false,
      },
      finalSettlement: {
        pendingSalary: basic,
        gratuityAmount: gratuity,
        leaveEncashment: leaveEncashment,
        providentFundRefund: pfRefund,
        deductions: 0,
        netPayable: settlement,
        settlementStatus: "PENDING_CLEARANCE",
      },
    };

    onAddExit(newExit);
    setShowResignModal(false);
    setReason("");
  };

  // Filter out any records that belong to deleted/non-existent employees
  const validRecords = exitRecords.filter((rec) =>
    employees.some((e) => e.id === rec.employeeId)
  );

  const filteredRecords = validRecords.filter((rec) => {
    const matchesSearch =
      rec.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.employeeCode && rec.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ||
      rec.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics safely based on valid records
  const totalExits = validRecords.length;
  const inNoticePeriod = validRecords.filter((r) => r.status === "NOTICE_PERIOD" || r.status === "CLEARANCE_IN_PROGRESS" || r.status === "INITIATED").length;
  const fullySettled = validRecords.filter((r) => r.status === "SETTLED" || r.status === "COMPLETED").length;

  return (
    <div id="exit-management-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20">
              <UserMinus className="w-5 h-5" />
            </div>
            <span>
              {isBangla
                ? "কর্মচারী প্রস্থান, অফবোর্ডিং ও চূড়ান্ত নিষ্পত্তি"
                : "Employee Exit, Offboarding & Final Settlement"}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {isBangla
              ? "৪-বিভাগীয় হ্যান্ডওভার ক্লিয়ারেন্স (আইটি, অ্যাকাউন্টস, প্রশাসন, এইচআর), নোটিশ পিরিয়ড এবং গ্র্যাচুইটি ও প্রভিডেন্ট ফান্ড সমন্বয়।"
              : "Automate 4-department clearance workflows (IT, Accounts, Admin, HR), notice period handovers & gratuity/PF settlement."}
          </p>
        </div>

        <button
          id="btn-initiate-exit"
          onClick={() => setShowResignModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isBangla ? "নতুন প্রস্থান আবেদন যোগ করুন" : "Initiate Exit Request"}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-500/20">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isBangla ? "মোট অফবোর্ডিং রেকর্ড" : "Total Exit Records"}
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {isBangla ? toBanglaDigits(totalExits) : totalExits}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isBangla ? "নোটিশ পিরিয়ডে চলমান" : "In Notice Period"}
            </div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400">
              {isBangla ? toBanglaDigits(inNoticePeriod) : inNoticePeriod}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isBangla ? "সম্পূর্ণ নিষ্পত্তি সম্পন্ন" : "Fully Settled & Released"}
            </div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {isBangla ? toBanglaDigits(fullySettled) : fullySettled}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isBangla ? "কর্মচারী, পদবি বা শাখা খুঁজুন..." : "Search employee, role, or branch..."}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          >
            <option value="ALL">{isBangla ? "সব স্ট্যাটাস" : "All Status"}</option>
            <option value="NOTICE_PERIOD">{isBangla ? "নোটিশ পিরিয়ড" : "Notice Period"}</option>
            <option value="CLEARANCE_IN_PROGRESS">{isBangla ? "ক্লিয়ারেন্স চলমান" : "Clearance In Progress"}</option>
            <option value="SETTLED">{isBangla ? "নিষ্পত্তি সম্পন্ন" : "Settled"}</option>
          </select>
        </div>
      </div>

      {/* Exit Records List */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
            <UserMinus className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold">
              {isBangla ? "কোনো প্রস্থান রেকর্ড পাওয়া যায়নি" : "No exit records found"}
            </p>
          </div>
        ) : (
          filteredRecords.map((rec) => {
            // Null-safe clearances with fallback
            const clearances = rec.clearanceStatus || {
              itClearance: Boolean(rec.assetClearancePassed),
              accountsClearance: Boolean(rec.accountsClearancePassed),
              adminClearance: Boolean(rec.departmentClearancePassed),
              hrClearance: rec.status === "SETTLED" || rec.status === "COMPLETED",
            };

            const allCleared =
              clearances.itClearance &&
              clearances.accountsClearance &&
              clearances.adminClearance &&
              clearances.hrClearance;

            // Null-safe settlement with fallback
            const settlement = rec.finalSettlement || {
              pendingSalary: 50000,
              gratuityAmount: rec.gratuityAmount || 0,
              leaveEncashment: rec.unusedLeaveEncashment || 0,
              providentFundRefund: rec.providentFundRefund || 0,
              deductions: 0,
              netPayable: rec.totalSettlementAmount || (rec.gratuityAmount || 0) + (rec.providentFundRefund || 0) + (rec.unusedLeaveEncashment || 0) + 50000,
              settlementStatus: rec.status === "SETTLED" ? "SETTLED" : "PENDING_CLEARANCE",
            };

            return (
              <div
                key={rec.id}
                id={`exit-card-${rec.id}`}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Employee Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3.5">
                    {rec.avatarUrl ? (
                      <img
                        src={rec.avatarUrl}
                        alt={rec.employeeName}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center font-black text-base shadow-sm">
                        {rec.employeeName[0] || "E"}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {rec.employeeName}
                        </h3>
                        {rec.employeeCode && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {rec.employeeCode}
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            rec.status === "SETTLED" || rec.status === "COMPLETED"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {rec.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mt-0.5">
                        {rec.branchName} • {rec.departmentName} {rec.designationTitle ? `(${rec.designationTitle})` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 text-left sm:text-right bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div>
                        {isBangla ? "সর্বশেষ কর্মদিবস:" : "Last Working Day:"}{" "}
                        <strong className="text-slate-900 dark:text-white">{rec.lastWorkingDay || "N/A"}</strong>
                      </div>
                      <div className="text-[11px]">
                        {isBangla
                          ? `নোটিশ পিরিয়ড: ${toBanglaDigits(rec.noticePeriodDays || 30)} দিন`
                          : `Notice Period: ${rec.noticePeriodDays || 30} Days`}
                      </div>
                    </div>
                    {onDeleteExitRecord && (
                      <button
                        type="button"
                        onClick={() => onDeleteExitRecord(rec.id)}
                        title={isBangla ? "নোটিশ রেকর্ডটি মুছে ফেলুন" : "Delete exit notice record"}
                        className="p-2.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Reason / Notes */}
                {rec.reason && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {isBangla ? "প্রস্থানের কারণ:" : "Reason:"}{" "}
                    </span>
                    <span>{rec.reason}</span>
                  </div>
                )}

                {/* 4-Department Clearance Checklist */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-teal-500" />
                      <span>{isBangla ? "বিভাগীয় হস্তান্তর ও ছাড়পত্র চেকলিস্ট" : "Departmental Handover & Clearance Checklist"}</span>
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        allCleared
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
                          : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30"
                      }`}
                    >
                      {allCleared
                        ? isBangla ? "✓ সব বিভাগ ছাড়পত্র দিয়েছে" : "✓ All Departments Cleared"
                        : isBangla ? "ক্লিয়ারেন্স বাকি আছে" : "Clearance Incomplete"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* IT Clearance */}
                    <div
                      onClick={() => onUpdateClearance(rec.id, "itClearance")}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        clearances.itClearance
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{isBangla ? "আইটি ও হার্ডওয়্যার" : "IT & Hardware"}</span>
                        {clearances.itClearance ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        ) : (
                          <span className="text-[10px] bg-slate-200 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-400 font-semibold">
                            {isBangla ? "পেন্ডিং" : "Pending"}
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                        {isBangla ? "ল্যাপটপ, অ্যাক্সেস ও ইমেইল প্রত্যাহার" : "Laptops, Access, Email revoked"}
                      </p>
                    </div>

                    {/* Accounts Clearance */}
                    <div
                      onClick={() => onUpdateClearance(rec.id, "accountsClearance")}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        clearances.accountsClearance
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{isBangla ? "অ্যাকাউন্টস ও ঋণ" : "Accounts & Loans"}</span>
                        {clearances.accountsClearance ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        ) : (
                          <span className="text-[10px] bg-slate-200 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-400 font-semibold">
                            {isBangla ? "পেন্ডিং" : "Pending"}
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                        {isBangla ? "ঋণ, অগ্রিম ও বাকি সমন্বয়" : "Loans, advances, dues zeroed"}
                      </p>
                    </div>

                    {/* Admin Clearance */}
                    <div
                      onClick={() => onUpdateClearance(rec.id, "adminClearance")}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        clearances.adminClearance
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{isBangla ? "প্রশাসন ও সুযোগ-সুবিধা" : "Admin & Facility"}</span>
                        {clearances.adminClearance ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        ) : (
                          <span className="text-[10px] bg-slate-200 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-400 font-semibold">
                            {isBangla ? "পেন্ডিং" : "Pending"}
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                        {isBangla ? "আইডি ব্যাজ, চাবি ও লকার হস্তান্তর" : "ID badge, keys, drawer lockers"}
                      </p>
                    </div>

                    {/* HR Clearance */}
                    <div
                      onClick={() => onUpdateClearance(rec.id, "hrClearance")}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        clearances.hrClearance
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{isBangla ? "এইচআর এক্সিট ইন্টারভিউ" : "HR Exit Interview"}</span>
                        {clearances.hrClearance ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        ) : (
                          <span className="text-[10px] bg-slate-200 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-400 font-semibold">
                            {isBangla ? "পেন্ডিং" : "Pending"}
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                        {isBangla ? "এক্সিট জরিপ ও ছাড়পত্র পত্র প্রস্তুত" : "Exit survey, Release letter"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Final Settlement Breakdown */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-extrabold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span>{isBangla ? "চূড়ান্ত আর্থিক নিষ্পত্তির হিসাব" : "Final Financial Settlement Calculation"}</span>
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold text-sm sm:text-base">
                      ৳{isBangla ? toBanglaDigits((settlement.netPayable ?? 0).toLocaleString()) : (settlement.netPayable ?? 0).toLocaleString()} {isBangla ? "নেট প্রদেয়" : "Net Payable"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 dark:text-slate-300 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">
                        {isBangla ? "বকেয়া বেতন:" : "Pending Salary:"}
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        ৳{isBangla ? toBanglaDigits((settlement.pendingSalary ?? 0).toLocaleString()) : (settlement.pendingSalary ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">
                        {isBangla ? "গ্র্যাচুইটি ফান্ড:" : "Gratuity Fund:"}
                      </span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        +৳{isBangla ? toBanglaDigits((settlement.gratuityAmount ?? 0).toLocaleString()) : (settlement.gratuityAmount ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">
                        {isBangla ? "ছুটি নগদায়ন:" : "Leave Encashment:"}
                      </span>
                      <span className="font-extrabold text-teal-600 dark:text-teal-300">
                        +৳{isBangla ? toBanglaDigits((settlement.leaveEncashment ?? 0).toLocaleString()) : (settlement.leaveEncashment ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">
                        {isBangla ? "প্রভিডেন্ট ফান্ড (PF):" : "PF Accumulation:"}
                      </span>
                      <span className="font-extrabold text-blue-600 dark:text-blue-300">
                        +৳{isBangla ? toBanglaDigits((settlement.providentFundRefund ?? 0).toLocaleString()) : (settlement.providentFundRefund ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Initiate Resignation */}
      {showResignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md text-slate-800 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserMinus className="w-5 h-5 text-rose-500" />
                <span>{isBangla ? "কর্মচারী প্রস্থান প্রক্রিয়া শুরু করুন" : "Initiate Employee Offboarding"}</span>
              </h3>
              <button
                onClick={() => setShowResignModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {isBangla ? "প্রস্থানকারী কর্মচারী নির্বাচন করুন" : "Select Resigning Employee"}
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} — {e.designationTitle} ({e.branchName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "নোটিশের মেয়াদ (দিন)" : "Notice Period (Days)"}
                  </label>
                  <input
                    type="number"
                    value={noticeDays}
                    onChange={(e) => setNoticeDays(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "সর্বশেষ কর্মদিবস" : "Last Working Date"}
                  </label>
                  <input
                    type="date"
                    value={lastWorkingDate}
                    onChange={(e) => setLastWorkingDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {isBangla ? "প্রস্থানের কারণ" : "Reason for Resignation"}
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={isBangla ? "যেমন: উচ্চ শিক্ষা / ব্যক্তিগত কারণ..." : "e.g. Higher studies / Relocation..."}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowResignModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
                >
                  {isBangla ? "প্রস্থান আবেদন নিশ্চিত করুন" : "Confirm Offboarding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
