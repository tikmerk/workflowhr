import React from "react";
import {
  Clock,
  CalendarCheck,
  CreditCard,
  Banknote,
  ScanFace,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Briefcase,
  Laptop,
  ArrowUpRight,
  TrendingUp,
  Calendar,
  Sparkles,
  ShieldCheck,
  Building2,
  ChevronRight,
  Download,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import {
  Employee,
  Branch,
  AttendanceRecord,
  Payslip,
  LeaveApplication,
  Project,
} from "../../types";
import { useCompanyBranding } from "../../context/CompanyBrandingContext";

export interface EmployeeDashboardViewProps {
  currentEmployee: Employee;
  branch?: Branch;
  attendanceLogs?: AttendanceRecord[];
  payslips?: Payslip[];
  leaves?: LeaveApplication[];
  projects?: Project[];
  onOpenAttendanceModal?: () => void;
  onOpenAiAssistant?: () => void;
  onNavigate?: (tab: any) => void;
}

export const EmployeeDashboardView: React.FC<EmployeeDashboardViewProps> = ({
  currentEmployee,
  branch,
  attendanceLogs = [],
  payslips = [],
  leaves = [],
  projects = [],
  onOpenAttendanceModal,
  onOpenAiAssistant,
  onNavigate,
}) => {
  const { branding } = useCompanyBranding();
  const salaryDisbursementPolicy = branding.salaryDisbursementPolicy || "BOTH";

  // Filter records specifically for this employee
  const myAttendance = attendanceLogs.filter(
    (a) => a.employeeId === currentEmployee.id || a.employeeCode === currentEmployee.employeeCode
  );
  const myPayslips = payslips.filter(
    (p) => p.employeeId === currentEmployee.id || p.employeeCode === currentEmployee.employeeCode
  );
  const myLeaves = leaves.filter(
    (l) => l.employeeId === currentEmployee.id || l.employeeCode === currentEmployee.employeeCode
  );

  // Today's date string
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Today's Attendance Record
  const todayRecord = myAttendance.find((a) => a.date === todayStr);

  // Monthly stats (current month)
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthAttendance = myAttendance.filter((a) => a.date && a.date.startsWith(currentMonthKey));

  const presentDays = thisMonthAttendance.filter((a) => a.status === "PRESENT").length;
  const lateDays = thisMonthAttendance.filter((a) => a.status === "LATE").length;
  const absentDays = thisMonthAttendance.filter((a) => a.status === "ABSENT").length;
  const totalWorkedDays = presentDays + lateDays;
  const punctualityRate = totalWorkedDays > 0 ? Math.round((presentDays / totalWorkedDays) * 100) : 100;

  // Total overtime hours this month
  const overtimeHours = Math.round(
    thisMonthAttendance.reduce((acc, curr) => acc + (curr.overtimeMinutes || 0), 0) / 60
  );

  // Leave balance statistics
  const approvedLeavesThisYear = myLeaves.filter(
    (l) => l.status === "APPROVED" && l.startDate && l.startDate.startsWith(String(today.getFullYear()))
  );
  const pendingLeaves = myLeaves.filter((l) => l.status === "PENDING");
  const approvedLeaveDays = approvedLeavesThisYear.reduce((acc, curr) => acc + (curr.totalDays || 1), 0);
  const totalAnnualEntitlement = 24; // Standard annual quota
  const remainingLeaveDays = Math.max(0, totalAnnualEntitlement - approvedLeaveDays);

  // Latest Payslip
  const latestPayslip = myPayslips.length > 0 ? myPayslips[0] : null;

  // Active Projects or Tasks for this employee
  const myProjects = projects.filter((p) => {
    if (!p) return false;
    const team = p.teamMembers || [];
    return (
      team.some((m) => m.id === currentEmployee.id || m.name === currentEmployee.fullName) ||
      (p.teamMemberIds || []).includes(currentEmployee.id) ||
      p.managerId === currentEmployee.id
    );
  });

  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  return (
    <div id="employee-personal-dashboard" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Personalized Staff Welcome & Quick Clock-In */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 text-white p-6 sm:p-8 shadow-lg">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 -mb-16 w-60 h-60 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <img
                src={currentEmployee.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt={currentEmployee.fullName}
                referrerPolicy="no-referrer"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/30 shadow-md"
              />
              {currentEmployee.faceVerified ? (
                <div
                  title="বায়োমেট্রিক ফেস আইডি ভেরিফায়েড"
                  className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white border-2 border-teal-700 text-xs shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div
                  title="ফেস ভেরিফিকেশন অপেক্ষমান"
                  className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-500 text-white border-2 border-teal-700 text-xs shadow-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30">
                  {currentEmployee.employeeCode}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-800/60 text-teal-100">
                  {currentEmployee.branchName || (branch && branch.name) || "হেড অফিস"}
                </span>
                <span className="text-[11px] text-teal-100/90 hidden sm:inline">
                  {today.toLocaleDateString("bn-BD", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                স্বাগতম, {currentEmployee.fullName}
              </h1>

              <p className="text-xs sm:text-sm text-teal-100 font-medium">
                {currentEmployee.designationTitle} • {currentEmployee.departmentName}
              </p>
            </div>
          </div>

          {/* Quick Primary Actions for Employee */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onOpenAttendanceModal && (
              <button
                type="button"
                id="employee-quick-clockin-btn"
                onClick={onOpenAttendanceModal}
                className="px-4 py-2.5 bg-white text-teal-900 hover:bg-teal-50 text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
              >
                <ScanFace className="w-4 h-4 text-teal-600" />
                <span>লাইভ উপস্থিতি দিন (Clock-In)</span>
              </button>
            )}

            <button
              type="button"
              id="employee-apply-leave-btn"
              onClick={() => handleNavigate("self-service")}
              className="px-4 py-2.5 bg-teal-800/70 hover:bg-teal-800 text-white border border-white/20 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 text-emerald-300" />
              <span>ছুটির আবেদন করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Employee Personal Status Metric Cards (Strictly No Executive Financials) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Attendance Punch Status */}
        <div
          onClick={onOpenAttendanceModal}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              আজকের উপস্থিতি (Today)
            </span>
            <div
              className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 ${
                todayRecord
                  ? todayRecord.status === "PRESENT"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400"
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            {todayRecord ? (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {todayRecord.checkInTime || "উপস্থিত"}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      todayRecord.status === "PRESENT"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    {todayRecord.status === "PRESENT" ? "সময়মতো উপস্থিত" : "দেরিতে (Late)"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-teal-600" />
                  <span>
                    আউট: {todayRecord.checkOutTime || "অপেক্ষমান"} • {todayRecord.verificationMethod || "FACE"}
                  </span>
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    এখনো পাঞ্চ করা হয়নি
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  ক্যামেরা বা জিওফেন্স দিয়ে উপস্থিতি নিশ্চিত করুন
                </p>
              </div>
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">অফিস শিফট: ৯:০০ AM - ৫:০০ PM</span>
            <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-0.5">
              পাঞ্চ <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Monthly Attendance Punctuality */}
        <div
          onClick={() => handleNavigate("self-service")}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              চলতি মাসের উপস্থিতি
            </span>
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {presentDays} দিন
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({punctualityRate}% সময়নিষ্ঠ)
            </span>
          </div>

          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-2">
            <span className="text-amber-600 font-semibold">{lateDays} দিন লেট</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold">{overtimeHours} ঘণ্টা ওটি</span>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">লগ হিস্ট্রি</span>
            <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-0.5">
              দেখুন <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Leave Balance */}
        <div
          onClick={() => handleNavigate("self-service")}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              ছুটির ব্যালেন্স (Leave)
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {remainingLeaveDays} দিন
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">অবশিষ্ট আছে</span>
          </div>

          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-2">
            <span>ভোগকৃত: {approvedLeaveDays} দিন</span>
            {pendingLeaves.length > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                {pendingLeaves.length}টি পেন্ডিং
              </span>
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">বাৎসরিক কোটা: ২৪ দিন</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-0.5">
              আবেদন <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Personal Payslip & Payment Method */}
        <div
          onClick={() => handleNavigate("self-service")}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              বেতন ও পেমেন্ট মাধ্যম
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              {currentEmployee.salaryPaymentMethod === "CASH" ? (
                <Banknote className="w-5 h-5" />
              ) : (
                <CreditCard className="w-5 h-5" />
              )}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {latestPayslip ? `৳${(latestPayslip.netSalary || 0).toLocaleString()}` : "৳--"}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                {currentEmployee.salaryPaymentMethod === "CASH" ? "ক্যাশ (Cash)" : "ব্যাংক একাউন্ট"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              {currentEmployee.salaryPaymentMethod === "CASH"
                ? "অফিস থেকে ক্যাশ ভাউচারে পরিশোধ"
                : currentEmployee.bankAccountNumber
                ? `${currentEmployee.bankName || "Bank"} • ${currentEmployee.bankAccountNumber}`
                : "ব্যাংক তথ্য যুক্ত করুন"}
            </p>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">সর্বশেষ পে-স্লিপ</span>
            <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-0.5">
              পে-স্লিপ <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Recent Attendance Activity & Quick Services */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Attendance Activity Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>আমার সাম্প্রতিক উপস্থিতি রেকর্ড (Recent Attendance)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  গত কয়েক কর্মদিবসের পাঞ্চ সময় ও অনুমোদন স্ট্যাটাস
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleNavigate("self-service")}
                className="text-xs font-bold text-teal-600 hover:text-teal-500 flex items-center gap-1 cursor-pointer"
              >
                <span>সম্পূর্ণ হিস্ট্রি</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {myAttendance.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                এখনো কোনো উপস্থিতি রেকর্ড পাওয়া যায়নি। উপরের "লাইভ উপস্থিতি দিন" বাটনে ক্লিক করে উপস্থিতি দিন।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">তারিখ</th>
                      <th className="py-2.5 px-3">ইন টাইম (In)</th>
                      <th className="py-2.5 px-3">আউট টাইম (Out)</th>
                      <th className="py-2.5 px-3">কাজের সময়</th>
                      <th className="py-2.5 px-3">পদ্ধতি</th>
                      <th className="py-2.5 px-3 text-right">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {myAttendance.slice(0, 5).map((log, idx) => (
                      <tr key={log.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                          {log.date}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {log.checkInTime || "--:--"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                          {log.checkOutTime || "--:--"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          {log.totalWorkMinutes ? `${(log.totalWorkMinutes / 60).toFixed(1)} ঘণ্টা` : "৮ ঘণ্টা"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {log.verificationMethod || "FACE_ID"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === "PRESENT"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : log.status === "LATE"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                            }`}
                          >
                            {log.status === "PRESENT" ? "উপস্থিত" : log.status === "LATE" ? "দেরিতে" : "অনুপস্থিত"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Staff Shortcuts & Services Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleNavigate("self-service")}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 shadow-xs text-left cursor-pointer transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 w-fit group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-3">
                আমার সিভি ও প্রোফাইল (CV)
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                ইংরেজি প্রফেশনাল এ৪ সিভি ভিউ ও এডিট করুন
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate("self-service")}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 shadow-xs text-left cursor-pointer transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 w-fit group-hover:scale-110 transition-transform">
                <Banknote className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-3">
                ব্যাংক ও বেতন তথ্য
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                ব্যাংক একাউন্ট নম্বর ও মাধ্যম আপডেট করুন
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate("self-service")}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 shadow-xs text-left cursor-pointer transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 w-fit group-hover:scale-110 transition-transform">
                <Laptop className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-3">
                অফিস সরঞ্জাম ও অ্যাসেট
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                আপনার নামে বরাদ্দকৃত গ্যাজেট ও ল্যাপটপ
              </p>
            </button>
          </div>
        </div>

        {/* Right 1 Column: Profile Snapshot & Notice Board */}
        <div className="space-y-6">
          {/* Profile & Office Identity Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              অফিশিয়াল পরিচয় ও তথ্য
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">পদবি (Designation):</span>
                <span className="font-bold text-slate-900 dark:text-white">{currentEmployee.designationTitle}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">বিভাগ (Department):</span>
                <span className="font-medium text-slate-900 dark:text-white">{currentEmployee.departmentName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">যোগদানের তারিখ:</span>
                <span className="font-medium text-slate-900 dark:text-white">{currentEmployee.joiningDate || "২০২৪"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">মোবাইল নম্বর:</span>
                <span className="font-mono text-slate-900 dark:text-white">{currentEmployee.phone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">বেতন মাধ্যম:</span>
                <span className="font-bold text-teal-600">
                  {currentEmployee.salaryPaymentMethod === "CASH" ? "ক্যাশ (Cash)" : "ব্যাংক একাউন্ট (Bank)"}
                </span>
              </div>
              {currentEmployee.bankAccountNumber && currentEmployee.salaryPaymentMethod !== "CASH" && (
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">ব্যাংক নাম:</span>
                  <span className="font-mono text-slate-900 dark:text-white truncate max-w-[140px]">
                    {currentEmployee.bankName}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleNavigate("self-service")}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>প্রোফাইল সম্পাদন করুন (Edit Profile)</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Announcements & Welfare Notice Box */}
          <div className="bg-gradient-to-br from-teal-50/60 to-emerald-50/40 dark:from-slate-900 dark:to-slate-850 rounded-2xl border border-teal-200/60 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <h4 className="font-bold text-xs">নোটিশ ও মানবকল্যাণ বার্তা</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              মুসলমানদের দ্বীনি কল্যাণ এবং সুবিধাবঞ্চিত মানুষের পাশে দাঁড়াতে সততা ও সময়নিষ্ঠতার সাথে দায়িত্ব পালন করুন।
            </p>
            <div className="pt-2 border-t border-teal-200/40 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>জরুরি হেল্পলাইন: ০৯৬১০০০০০০</span>
              <button
                type="button"
                onClick={() => handleNavigate("notices-chat")}
                className="text-teal-700 dark:text-teal-400 font-bold hover:underline cursor-pointer"
              >
                নোটিশ বোর্ড →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
