import React from "react";
import {
  Users,
  Clock,
  Building2,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ScanFace,
  MapPin,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CalendarCheck,
  Layers,
  FileText
} from "lucide-react";
import {
  Employee,
  Branch,
  AttendanceRecord,
  Payslip,
  LeaveApplication,
  Project
} from "../../types";

export interface DashboardViewProps {
  currentEmployee?: Employee;
  selectedBranch?: Branch;
  selectedBranchId?: string;
  allBranches?: Branch[];
  branches?: Branch[];
  allEmployees?: Employee[];
  employees?: Employee[];
  attendanceLogs?: AttendanceRecord[];
  payslips?: Payslip[];
  leaveApplications?: LeaveApplication[];
  leaves?: LeaveApplication[];
  projects?: Project[];
  onOpenAttendanceModal?: () => void;
  onOpenAiModal?: () => void;
  onOpenAiAssistant?: () => void;
  onNavigateTab?: (tab: any) => void;
  onNavigate?: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentEmployee,
  selectedBranch,
  selectedBranchId = "ALL",
  allBranches = [],
  branches = [],
  allEmployees = [],
  employees = [],
  attendanceLogs = [],
  payslips = [],
  leaveApplications = [],
  leaves = [],
  projects = [],
  onOpenAttendanceModal,
  onOpenAiModal,
  onOpenAiAssistant,
  onNavigateTab,
  onNavigate,
}) => {
  const staffList = allEmployees.length > 0 ? allEmployees : employees;
  const branchList = allBranches.length > 0 ? allBranches : branches;
  const leaveList = leaveApplications.length > 0 ? leaveApplications : leaves;

  const handleOpenAi = onOpenAiModal || onOpenAiAssistant || (() => {});
  const handleOpenAttendance = onOpenAttendanceModal || (() => {});
  const handleNavigation = onNavigateTab || onNavigate || (() => {});

  const activeBranch: Branch =
    selectedBranch ||
    branchList.find((b) => b.id === selectedBranchId) ||
    branchList[0] || {
      id: "ALL",
      companyId: "comp-01",
      name: "All Regional Branches (Global)",
      code: "GLOBAL",
      isHeadOffice: true,
      address: "Gulshan-2 Corporate Avenue",
      city: "Dhaka",
      state: "Dhaka Division",
      country: "Bangladesh",
      phone: "+880 1700-000000",
      email: "corporate@muslimwelfare.org",
      latitude: 23.7925,
      longitude: 90.4078,
      geofenceRadiusMeters: 150,
      totalEmployees: staffList.length || 48,
      activeStatus: "ACTIVE",
      managerName: "Md. Ibrahim Hossain",
    };

  const activeUser: Employee =
    currentEmployee ||
    staffList[0] || ({
      id: "emp-001",
      fullName: "Md. Ibrahim Hossain",
      role: "CEO",
      employeeCode: "MWO-001",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      branchName: "Dhaka HQ",
      departmentName: "Executive Leadership",
      designationTitle: "Chief Executive Officer & Founder",
      joiningDate: "2020-01-01",
      gender: "MALE",
      status: "ACTIVE",
      companyId: "comp-01",
      branchId: "branch-dhaka",
      departmentId: "dept-exec",
      designationId: "desig-ceo",
      email: "ibrahim@muslimwelfare.org",
      phone: "+880 1700-111222",
      salary: {
        basic: 180000,
        houseRent: 80000,
        medicalAllowance: 20000,
        transportAllowance: 20000,
        specialAllowance: 30000,
        providentFundPercentage: 10,
        taxDeductionPercentage: 15,
        grossSalary: 330000,
      },
    } as Employee);

  // Statistics Calculations
  const branchEmployees = (staffList || []).filter(
    (e) => !activeBranch || activeBranch.id === "ALL" || activeBranch.isHeadOffice || e.branchId === activeBranch.id
  );
  const totalStaffCount = branchEmployees.length || staffList.length;

  const todayStr = "2026-08-30";
  const todayAttendance = (attendanceLogs || []).filter((a) => a.date === todayStr);
  const presentCount = todayAttendance.filter((a) => a.status === "PRESENT").length;
  const lateCount = todayAttendance.filter((a) => a.status === "LATE").length;
  const onLeaveCount = (leaveList || []).filter(
    (l) => l.status === "APPROVED" && l.startDate <= todayStr && l.endDate >= todayStr
  ).length;
  const pendingLeaves = (leaveList || []).filter((l) => l.status === "PENDING").length;

  const totalPayrollPayout = (payslips || []).reduce((acc, p) => acc + (p.netSalary || 0), 0);

  const punctualityRate =
    presentCount + lateCount > 0
      ? Math.round((presentCount / (presentCount + lateCount)) * 100)
      : 96;

  return (
    <div id="executive-dashboard-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Greeting & Active Branch Snapshot */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-teal-100 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30">
                {activeBranch.isHeadOffice ? "Headquarters Overview" : "Branch Operations Hub"}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back, <span className="text-teal-600 dark:text-teal-400">{activeUser.fullName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Monitoring workforce operations for{" "}
              <strong className="text-slate-900 dark:text-white">{activeBranch.name}</strong>. Centralized biometric
              attendance, dynamic geofencing, and automated payroll pipelines are active.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleOpenAttendance}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
            >
              <ScanFace className="w-4 h-4" />
              <span>Live Biometric Clock-In</span>
            </button>

            <button
              onClick={handleOpenAi}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-bold rounded-xl shadow flex items-center gap-2 transition-all hover:border-teal-400 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-500 dark:text-teal-400" />
              <span>AI Workforce Insights</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Staff */}
        <div
          onClick={() => handleNavigation("employees")}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Workforce
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalStaffCount}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Employees</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Across Regional Branches</span>
            <span className="text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-0.5">
              Manage <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Today's Attendance & Punctuality */}
        <div
          onClick={() => handleNavigation("attendance-logs")}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Live Attendance
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{presentCount + lateCount}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              ({punctualityRate}% On-Time)
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>
              {lateCount} Late • {onLeaveCount} On Leave
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
              Logs <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Monthly Payroll Budget */}
        <div
          onClick={() => handleNavigation("payroll")}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              August Payroll
            </span>
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">৳</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {(totalPayrollPayout ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Auto-computed with PF & Tax</span>
            <span className="text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-0.5">
              Disburse <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Active Projects & Tasks */}
        <div
          onClick={() => handleNavigation("projects-tasks")}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Project Delivery
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{(projects || []).length}</span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Active Initiatives</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Enterprise Roadmaps</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5">
              Kanban <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid: Left Section (8 cols) & Right Section (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Multi-Branch Status & Realtime Attendance Stream (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Multi-Branch Hierarchy Grid */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Multi-Branch Infrastructure & Geofencing Status
                </h3>
              </div>
              <button
                onClick={() => handleNavigation("branches-geofence")}
                className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                Configure <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(branchList || []).map((br) => (
                <div
                  key={br.id}
                  className={`p-4 rounded-xl border transition-all ${
                    activeBranch.id === br.id
                      ? "bg-teal-50 dark:bg-teal-500/10 border-teal-500/40 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{br.name}</span>
                        {br.isHeadOffice && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                            HQ
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{br.city}, Bangladesh</p>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] pt-2 border-t border-slate-200/80 dark:border-slate-800">
                    <div className="p-1.5 rounded bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-transparent">
                      <span className="text-slate-500 dark:text-slate-400 block">Radius</span>
                      <span className="font-bold text-teal-700 dark:text-teal-300">{br.geofenceRadiusMeters || 100}m</span>
                    </div>
                    <div className="p-1.5 rounded bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-transparent">
                      <span className="text-slate-500 dark:text-slate-400 block">Staff</span>
                      <span className="font-bold text-slate-900 dark:text-white">{br.totalEmployees || 0}</span>
                    </div>
                    <div className="p-1.5 rounded bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-transparent">
                      <span className="text-slate-500 dark:text-slate-400 block">Manager</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 truncate block">
                        {(br.managerName || "HR Lead").split(" ")[0]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Biometric Attendance Live Stream */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScanFace className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Today's Biometric Attendance Feed
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live
                </span>
              </div>
              <button
                onClick={() => handleNavigation("attendance-logs")}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                All Logs <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {(todayAttendance || []).map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={rec.checkInSelfieUrl || rec.avatarUrl}
                        alt={rec.employeeName}
                        className="w-10 h-10 rounded-xl object-cover border-2 border-emerald-500/40"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 border border-slate-200 dark:border-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{rec.employeeName}</span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          ({rec.employeeCode})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-teal-700 dark:text-teal-300 font-medium">{rec.departmentName}</span>
                        <span>•</span>
                        <span>{(rec.branchName || "Headquarters").split("(")[0]}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                    <div>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {rec.checkInTime}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                        <span>{rec.checkInDistanceMeters || 12}m from beacon</span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        rec.status === "PRESENT"
                          ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {rec.status === "PRESENT" ? "On Time" : `Late (${rec.lateMinutes || 15}m)`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Pending Approvals, AI Advisor Card & Quick Tools (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Gemini AI Advisor Highlight Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-teal-50 via-white to-white dark:from-teal-950/40 dark:via-slate-900 dark:to-slate-900 border border-teal-200 dark:border-teal-500/30 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Gemini Workforce Intelligence</h4>
                <p className="text-[10px] text-teal-700 dark:text-teal-400 font-medium">Real-Time Autonomous Analytics</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              "Punctuality rate across all branches is at <strong>96.2%</strong> today. Chittagong
              branch achieved 100% on-time check-in. Recommend reviewing late rules for field logistics."
            </p>

            <button
              onClick={handleOpenAi}
              className="w-full py-2.5 px-4 bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-800 dark:text-teal-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Launch AI HR Advisor</span>
            </button>
          </div>

          {/* Pending Leave Requests */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-amber-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Pending Leave Requests</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300">
                {pendingLeaves} Action Required
              </span>
            </div>

            <div className="space-y-3">
              {(leaveList || [])
                .filter((l) => l.status === "PENDING")
                .slice(0, 3)
                .map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{req.employeeName}</span>
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        {req.leaveType}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">"{req.reason}"</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                      <span>
                        {req.startDate} ({req.totalDays} Day)
                      </span>
                      <button
                        onClick={() => handleNavigation("leaves")}
                        className="text-teal-600 dark:text-teal-400 hover:underline font-semibold cursor-pointer"
                      >
                        Review & Approve
                      </button>
                    </div>
                  </div>
                ))}
              {pendingLeaves === 0 && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-center text-slate-500 dark:text-slate-400 text-xs">
                  No pending leave applications.
                </div>
              )}
            </div>
          </div>

          {/* Quick Access Utility Actions */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Quick HR Operations
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleNavigation("certificates")}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-semibold text-left transition-colors flex flex-col gap-1 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Issue Certificate</span>
              </button>

              <button
                onClick={() => handleNavigation("recruitment")}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-semibold text-left transition-colors flex flex-col gap-1 cursor-pointer"
              >
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Screen Resumes</span>
              </button>

              <button
                onClick={() => handleNavigation("payroll")}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-semibold text-left transition-colors flex flex-col gap-1 cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Process Salary</span>
              </button>

              <button
                onClick={() => handleNavigation("audit-reports")}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-semibold text-left transition-colors flex flex-col gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Audit Logs</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
