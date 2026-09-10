import React, { useState } from "react";
import {
  UserCheck,
  ScanFace,
  Smartphone,
  CreditCard,
  CalendarCheck,
  Banknote,
  FileCheck2,
  Laptop,
  Clock,
  MapPin,
  Download,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Calendar,
  Camera,
} from "lucide-react";
import {
  Employee,
  AttendanceRecord,
  Payslip,
  LeaveApplication,
  EmployeeLoan,
  CompanyAsset,
  CertificateRecord
} from "../../types";
import { FaceEnrollmentModal } from "../attendance/FaceEnrollmentModal";

interface EmployeeSelfServiceViewProps {
  currentEmployee: Employee;
  myAttendance: AttendanceRecord[];
  myPayslips: Payslip[];
  myLeaves: LeaveApplication[];
  myLoans: EmployeeLoan[];
  myAssets: CompanyAsset[];
  myCertificates: CertificateRecord[];
  onOpenAttendanceModal: () => void;
  onApplyLeave: (leave: Partial<LeaveApplication>) => void;
  onApplyLoan: (loan: Partial<EmployeeLoan>) => void;
  onViewPayslip: (slip: Payslip) => void;
  onUpdateFacePhoto?: (employeeId: string, photoUrl: string) => void;
  onOpenDigitalIdCard?: () => void;
}

export const EmployeeSelfServiceView: React.FC<EmployeeSelfServiceViewProps> = ({
  currentEmployee,
  myAttendance,
  myPayslips,
  myLeaves,
  myLoans,
  myAssets,
  myCertificates,
  onOpenAttendanceModal,
  onApplyLeave,
  onApplyLoan,
  onViewPayslip,
  onUpdateFacePhoto,
  onOpenDigitalIdCard,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "attendance" | "payslips" | "leaves" | "loans" | "assets"
  >("overview");
  const [showFaceEnrollModal, setShowFaceEnrollModal] = useState<boolean>(false);

  // Apply Leave Modal State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState<"CASUAL" | "SICK" | "ANNUAL" | "MATERNITY">("CASUAL");
  const [leaveStartDate, setLeaveStartDate] = useState("2026-09-02");
  const [leaveEndDate, setLeaveEndDate] = useState("2026-09-03");
  const [leaveReason, setLeaveReason] = useState("");

  // Apply Loan Modal State
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanAmount, setLoanAmount] = useState(30000);
  const [loanMonths, setLoanMonths] = useState(6);
  const [loanReason, setLoanReason] = useState("");

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(leaveStartDate);
    const end = new Date(leaveEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    onApplyLeave({
      employeeId: currentEmployee.id,
      employeeCode: currentEmployee.employeeCode,
      employeeName: currentEmployee.fullName,
      avatarUrl: currentEmployee.avatarUrl,
      branchId: currentEmployee.branchId,
      branchName: currentEmployee.branchName,
      departmentName: currentEmployee.departmentName,
      leaveType,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      totalDays: diffDays,
      reason: leaveReason || "Personal leave request",
      status: "PENDING",
      appliedDate: new Date().toISOString().split("T")[0],
    });

    setShowLeaveModal(false);
    setLeaveReason("");
  };

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const monthlyEmi = Math.round(loanAmount / loanMonths);

    onApplyLoan({
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.fullName,
      branchName: currentEmployee.branchName,
      amount: loanAmount,
      monthlyEmi,
      totalInstallments: loanMonths,
      paidInstallments: 0,
      remainingAmount: loanAmount,
      reason: loanReason || "Personal employee advance",
      applicationDate: new Date().toISOString().split("T")[0],
      status: "PENDING_APPROVAL",
    });

    setShowLoanModal(false);
    setLoanReason("");
  };

  return (
    <div id="employee-self-service-portal" className="space-y-6 animate-in fade-in duration-300">
      {/* Profile Header Banner - Optimized for Tablet, Mobile & Desktop */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row items-center xl:items-center justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left w-full xl:w-auto">
          <div className="relative shrink-0 group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-teal-500 shadow-xl shadow-teal-500/20 bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
              <img
                src={currentEmployee.avatarUrl}
                alt={currentEmployee.fullName}
                className="w-full h-full object-cover aspect-square"
              />
              <button
                type="button"
                onClick={() => setShowFaceEnrollModal(true)}
                className="absolute inset-0 bg-slate-950/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
                title="বায়োমেট্রিক ফেস ও প্রোফাইল ছবি পরিবর্তন করুন"
              >
                <Camera className="w-5 h-5 text-teal-300 mb-0.5" />
                <span className="text-[10px] font-bold">ছবি পরিবর্তন</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowFaceEnrollModal(true)}
              className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-teal-950 border border-slate-200 dark:border-slate-700 p-1.5 rounded-xl shadow-lg cursor-pointer transition-colors"
              title="বায়োমেট্রিক ফেস ও আইডি ছবি পরিবর্তন"
            >
              <Camera className="w-4 h-4 text-teal-600 dark:text-emerald-400" />
            </button>
          </div>

          <div className="space-y-1 w-full sm:w-auto">
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {currentEmployee.fullName}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                {currentEmployee.role.replace("_", " ")}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-teal-600 dark:text-teal-400">
              {currentEmployee.designationTitle} • {currentEmployee.departmentName}
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 dark:text-slate-400 justify-center sm:justify-start mt-1">
              <span>Employee Code: <strong className="text-slate-900 dark:text-white">{currentEmployee.employeeCode}</strong></span>
              <span className="hidden sm:inline">•</span>
              <span>Branch: <strong className="text-slate-900 dark:text-white">{currentEmployee.branchName}</strong></span>
              <span className="hidden sm:inline">•</span>
              <span>Shift: <strong className="text-teal-600 dark:text-teal-300">{currentEmployee.shiftName}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar - Tablet & Mobile Resilient */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start xl:justify-end gap-2.5 w-full xl:w-auto pt-2 xl:pt-0 border-t border-slate-100 dark:border-slate-800/80 xl:border-t-0">
          {onOpenDigitalIdCard && (
            <button
              type="button"
              id="ess-digital-id-btn"
              onClick={onOpenDigitalIdCard}
              className="px-3.5 py-2.5 bg-gradient-to-r from-teal-500/15 via-emerald-500/15 to-teal-500/15 hover:from-teal-500/25 hover:to-emerald-500/25 border border-teal-500/40 text-teal-700 dark:text-teal-300 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer grow sm:grow-0 justify-center"
            >
              <CreditCard className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="whitespace-nowrap">ডিজিটাল আইডি কার্ড</span>
            </button>
          )}
          <button
            type="button"
            id="ess-clock-in-out-btn"
            onClick={onOpenAttendanceModal}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer grow sm:grow-0 justify-center"
          >
            <ScanFace className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Clock In / Out</span>
          </button>
          <button
            type="button"
            id="ess-apply-leave-btn"
            onClick={() => setShowLeaveModal(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer grow sm:grow-0 justify-center"
          >
            <CalendarCheck className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="whitespace-nowrap">Apply Leave</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar - Tablet scroll-friendly */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-bold scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        {[
          { id: "overview", label: "Profile & Hardware Security", icon: UserCheck },
          { id: "attendance", label: "My Attendance Logs", icon: Clock },
          { id: "payslips", label: "Salary & Payslips", icon: CreditCard },
          { id: "leaves", label: "Leave Requests & Balance", icon: CalendarCheck },
          { id: "loans", label: "Loans & Advance Salary", icon: Banknote },
          { id: "assets", label: "Assigned Assets", icon: Laptop },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isActive
                  ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/40 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Hardware Security */}
      {activeSubTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hardware & Biometric Security Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <ScanFace className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Biometric Face & Device Binding</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-200">Face Vector Template</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {currentEmployee.faceTemplateRegistered
                      ? "Enrolled for live anti-spoofing"
                      : "No face registered - Clock-in blocked"}
                  </p>
                </div>
                {currentEmployee.faceTemplateRegistered ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Enrolled & Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Not Enrolled (ছবি নেই)
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowFaceEnrollModal(true)}
                className="w-full py-2.5 px-3 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <ScanFace className="w-4 h-4" />
                <span>
                  {currentEmployee.faceTemplateRegistered
                    ? "Update Biometric Face Photo (ছবি পরিবর্তন)"
                    : "Enroll Face Biometrics Now (নতুন ছবি নিবন্ধন করুন)"}
                </span>
              </button>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-200">Bound Work Device</p>
                  <p className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                    {currentEmployee.boundDeviceId || "DEV-MAC-PRO-M3-99"}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> Verified
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-200">Geofence Compliance</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Within allowed branch perimeter</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Passed
                </span>
              </div>
            </div>
          </div>

          {/* Personal Information & Official Details (2 cols) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Employee Personal & Corporate Record</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Official Email</span>
                <span className="font-bold text-slate-900 dark:text-slate-200">{currentEmployee.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Contact Phone</span>
                <span className="font-bold text-slate-900 dark:text-slate-200">{currentEmployee.phone}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Date of Joining</span>
                <span className="font-bold text-slate-900 dark:text-slate-200">{currentEmployee.joiningDate}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">National ID (NID)</span>
                <span className="font-bold text-slate-900 dark:text-slate-200">{currentEmployee.nidNumber}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Blood Group</span>
                <span className="font-bold text-red-500 dark:text-red-400">{currentEmployee.bloodGroup}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Bank Account</span>
                <span className="font-bold text-slate-900 dark:text-slate-200">
                  {currentEmployee.bankName} - {currentEmployee.bankAccountNumber}
                </span>
              </div>
              <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Present Residential Address</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{currentEmployee.presentAddress}</span>
              </div>
            </div>

            {/* Digital ID Card Action Banner */}
            {onOpenDigitalIdCard && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50 via-emerald-50/50 to-teal-50 dark:from-teal-950/60 dark:via-slate-850 dark:to-slate-900 border border-teal-200 dark:border-teal-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>অফিসিয়াল ডিজিটাল আইডি কার্ড (Digital ID Badge)</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        VERIFIED
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      লম্বালম্বি ফরম্যাটে অফিসিয়াল লোগো, ছবি, কিউআর কোড ও হাই-রেজোলিউশন পিএনজি ডাউনলোড করুন
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenDigitalIdCard}
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>আইডি কার্ড ভিউ ও ডাউনলোড</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: My Attendance Logs */}
      {activeSubTab === "attendance" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Biometric & GPS Attendance Logs</h3>
            <button
              onClick={onOpenAttendanceModal}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5"
            >
              <ScanFace className="w-4 h-4" />
              <span>Biometric Clock In</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Check-In</th>
                  <th className="p-3">Check-Out</th>
                  <th className="p-3">Working Hours</th>
                  <th className="p-3">Distance & GPS Location</th>
                  <th className="p-3">Biometric Match</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {myAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{rec.date}</td>
                    <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{rec.checkInTime}</td>
                    <td className="p-3 font-mono text-blue-600 dark:text-blue-400">{rec.checkOutTime || "Active"}</td>
                    <td className="p-3">
                      {Math.floor((rec.totalWorkMinutes || 0) / 60)}h {(rec.totalWorkMinutes || 0) % 60}m
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                        <MapPin className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span className="truncate max-w-[200px]">
                          {rec.checkInDistanceMeters || 0}m ({(rec.branchName || "Main Office").split("(")[0]})
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        {rec.checkInFaceMatchScore || 98.2}% Liveness
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === "PRESENT"
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Salary & Payslips */}
      {activeSubTab === "payslips" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Monthly Payslips & Breakdown</h3>
            <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">
              Gross Monthly Salary: ৳{(currentEmployee.salary?.grossSalary ?? 0).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {myPayslips.map((slip) => (
              <div
                key={slip.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{slip.payrollMonth} Payslip</span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{slip.paymentDate || "Processed"}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    {slip.paymentStatus}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>Gross Earnings:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">৳{(slip.grossEarnings ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Total Deductions (PF, Tax, Late):</span>
                    <span className="text-red-500 dark:text-red-400">-৳{(slip.totalDeductions ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 dark:text-slate-200 font-bold pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Net Disbursed Salary:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-sm">৳{(slip.netSalary ?? 0).toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => onViewPayslip(slip)}
                  className="w-full py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>View & Print Payslip</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Leave Requests */}
      {activeSubTab === "leaves" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Leave Requests & Balance</h3>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Apply Leave</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Casual Leave Balance</span>
              <span className="text-lg font-black text-teal-600 dark:text-teal-400">10 / 14 Days</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Sick Leave Balance</span>
              <span className="text-lg font-black text-blue-600 dark:text-blue-400">12 / 14 Days</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Annual Earned Leave</span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400">15 Days</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Special Leave</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">Allowed</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">My Leave Application History</h4>
            {myLeaves.map((l) => (
              <div
                key={l.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{l.leaveType} Leave</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      ({l.startDate} to {l.endDate} • {l.totalDays} Days)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 italic">"{l.reason}"</p>
                  {l.reviewerComments && (
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">
                      HR Note: {l.reviewerComments}
                    </p>
                  )}
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    l.status === "APPROVED"
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                      : l.status === "PENDING"
                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                      : "bg-red-500/20 text-red-700 dark:text-red-300"
                  }`}
                >
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Loans & Advances */}
      {activeSubTab === "loans" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Active Loans & EMI Schedule</h3>
            <button
              onClick={() => setShowLoanModal(true)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Apply Loan / Advance</span>
            </button>
          </div>

          <div className="space-y-3">
            {myLoans.map((loan) => (
              <div
                key={loan.id}
                className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">৳{(loan.amount ?? 0).toLocaleString()} Loan</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{loan.reason}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    {loan.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-transparent">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Monthly EMI</span>
                    <span className="font-bold text-slate-900 dark:text-white">৳{(loan.monthlyEmi ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-transparent">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Paid Installments</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {loan.paidInstallments} / {loan.totalInstallments}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-transparent">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Remaining Balance</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      ৳{(loan.remainingAmount ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Assigned Assets */}
      {activeSubTab === "assets" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Company Assets Assigned To Me</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myAssets.map((ast) => (
              <div
                key={ast.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                      {ast.category} • {ast.assetCode}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{ast.name}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300">
                    {ast.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Serial Number:</span>
                    <span className="font-mono text-slate-900 dark:text-slate-200">{ast.serialNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Assigned Date:</span>
                    <span>{ast.assignmentDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Condition:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{ast.condition}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Apply Leave */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4 text-slate-900 dark:text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Apply For Leave
            </h3>

            <form onSubmit={handleLeaveSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="CASUAL">Casual Leave (নৈমিত্তিক ছুটি)</option>
                  <option value="SICK">Sick Leave (অসুস্থতাজনিত ছুটি)</option>
                  <option value="ANNUAL">Annual Earned Leave (বাৎসরিক অর্জিত ছুটি)</option>
                  <option value="MATERNITY">Maternity Leave (মাতৃত্বকালীন ছুটি)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Reason for Leave</label>
                <textarea
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Specify brief reason..."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-bold cursor-pointer"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Apply Loan */}
      {showLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4 text-slate-900 dark:text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Banknote className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Apply For Employee Loan / Advance
            </h3>

            <form onSubmit={handleLoanSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Loan Amount (৳ BDT)</label>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  step={5000}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Repayment Tenor (Months)</label>
                <select
                  value={loanMonths}
                  onChange={(e) => setLoanMonths(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                >
                  <option value={3}>3 Months (EMI: ৳{Math.round(loanAmount / 3)})</option>
                  <option value={6}>6 Months (EMI: ৳{Math.round(loanAmount / 6)})</option>
                  <option value={10}>10 Months (EMI: ৳{Math.round(loanAmount / 10)})</option>
                  <option value={12}>12 Months (EMI: ৳{Math.round(loanAmount / 12)})</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Reason for Loan Request</label>
                <textarea
                  rows={3}
                  value={loanReason}
                  onChange={(e) => setLoanReason(e.target.value)}
                  placeholder="Specify purpose of loan..."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoanModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-bold cursor-pointer"
                >
                  Submit Loan Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Biometric Face Photo Enrollment Modal */}
      {showFaceEnrollModal && (
        <FaceEnrollmentModal
          isOpen={showFaceEnrollModal}
          onClose={() => setShowFaceEnrollModal(false)}
          employee={currentEmployee}
          onSaveFacePhoto={(empId, photoUrl) => {
            if (onUpdateFacePhoto) {
              onUpdateFacePhoto(empId, photoUrl);
            }
            setShowFaceEnrollModal(false);
          }}
        />
      )}
    </div>
  );
};
