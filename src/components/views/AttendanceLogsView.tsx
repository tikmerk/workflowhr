import React, { useState, useMemo } from "react";
import {
  Clock,
  ScanFace,
  MapPin,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Calendar,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Building2,
  X,
  Smartphone,
  CheckCircle,
  FileSpreadsheet,
  ArrowUpDown,
  UserCheck
} from "lucide-react";
import { AttendanceRecord, Branch, Employee } from "../../types";
import { exportToCSV } from "../../utils/exportUtils";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { filterAttendanceLogsForUser, isGeneralEmployeeRole } from "../../utils/permissions";

interface AttendanceLogsViewProps {
  attendanceLogs: AttendanceRecord[];
  branches: Branch[];
  employees?: Employee[];
  currentUser?: Employee;
  onOpenAttendanceModal: () => void;
}

export const AttendanceLogsView: React.FC<AttendanceLogsViewProps> = ({
  attendanceLogs,
  branches,
  employees = [],
  currentUser,
  onOpenAttendanceModal,
}) => {
  const { t, isBangla } = useThemeLanguage();

  // Strict role-based log scoping: General employees ONLY see their own logs
  const accessibleLogs = useMemo(() => {
    return filterAttendanceLogsForUser(attendanceLogs, currentUser);
  }, [attendanceLogs, currentUser]);

  const isRestrictedToOwnLogs = isGeneralEmployeeRole(currentUser);

  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Quick Date Presets
  const setQuickPreset = (preset: "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "ALL") => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (preset === "ALL") {
      setStartDate("");
      setEndDate("");
      return;
    }

    if (preset === "TODAY") {
      setStartDate(todayStr);
      setEndDate(todayStr);
      return;
    }

    if (preset === "YESTERDAY") {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      const yestStr = yest.toISOString().split("T")[0];
      setStartDate(yestStr);
      setEndDate(yestStr);
      return;
    }

    if (preset === "THIS_WEEK") {
      const firstDay = new Date(today);
      firstDay.setDate(today.getDate() - today.getDay());
      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(todayStr);
      return;
    }

    if (preset === "THIS_MONTH") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(todayStr);
      return;
    }
  };

  const filteredLogs = useMemo(() => {
    return accessibleLogs.filter((log) => {
      if (employees.length > 0 && !employees.some((e) => e.id === log.employeeId)) {
        return false;
      }

      const matchesSearch =
        log.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.departmentName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBranch = selectedBranch === "ALL" || log.branchId === selectedBranch;
      const matchesStatus = selectedStatus === "ALL" || log.status === selectedStatus;

      let matchesDate = true;
      if (startDate && log.date < startDate) {
        matchesDate = false;
      }
      if (endDate && log.date > endDate) {
        matchesDate = false;
      }

      return matchesSearch && matchesBranch && matchesStatus && matchesDate;
    });
  }, [accessibleLogs, employees, searchTerm, selectedBranch, selectedStatus, startDate, endDate]);

  const handleExportCSV = () => {
    const data = filteredLogs.map((log) => ({
      Date: log.date,
      "Employee ID": log.employeeCode,
      "Employee Name": log.employeeName,
      Branch: log.branchName,
      Department: log.departmentName,
      "Check In Time": log.checkInTime || "N/A",
      "Check Out Time": log.checkOutTime || "N/A",
      "Work Minutes": log.totalWorkMinutes,
      "Geofence Distance (m)": log.checkInDistanceMeters,
      "Geofence Passed": log.checkInGeofencePassed ? "Yes" : "No",
      "Biometric Match Score": `${log.checkInFaceMatchScore}%`,
      "Anti-Spoofing Passed": log.checkInAntiSpoofingPassed ? "Yes" : "No",
      Status: log.status,
      "Late Minutes": log.lateMinutes,
    }));
    exportToCSV("Workflow_HR_Attendance_Logs", data);
  };

  return (
    <div id="attendance-logs-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Quick Action Bar */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{isBangla ? "উপস্থিতি ও বায়োমেট্রিক লগ" : "Biometric Audit Trail"}</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
              {isRestrictedToOwnLogs
                ? isBangla
                  ? "আমার ব্যক্তিগত উপস্থিতি ও বায়োমেট্রিক রেকর্ড"
                  : "My Personal Attendance & Biometric History"
                : isBangla
                ? "স্মার্ট অ্যাটেনডেন্স ও জিওফেন্স লগ অডিট"
                : "Attendance Records & Geofence Logs"}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {isRestrictedToOwnLogs
                ? isBangla
                  ? "আপনার নিজস্ব দৈনিক হাজিরা, চেক-ইন/আউট সময়, কর্মঘণ্টা ও স্ট্যাটাস রিপোর্ট"
                  : "Your personal clock-in/out timestamps, hours worked, late penalties and attendance status"
                : isBangla
                ? "নির্দিষ্ট তারিখ বা সময়সীমা সিলেক্ট করে উপস্থিতি ফিল্টার করুন, এক্সেল/CSV ডাউনলোড করুন"
                : "Filter records by custom date ranges, branches, verify GPS coordinates and export reports"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isBangla ? "CSV রিপোর্ট ডাউনলোড" : "Export CSV Report"}</span>
            </button>

            <button
              onClick={onOpenAttendanceModal}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <ScanFace className="w-4 h-4" />
              <span>{isBangla ? "বায়োমেট্রিক ক্লক-ইন" : "Biometric Clock In"}</span>
            </button>
          </div>
        </div>

        {/* Date Filter & Preset Controls */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-300 font-bold">
              <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isBangla ? "তারিখ অনুযায়ী ফিল্টার করুন:" : "Date Range Filtering:"}</span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setQuickPreset("TODAY")}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors"
              >
                {isBangla ? "আজকে" : "Today"}
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset("YESTERDAY")}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors"
              >
                {isBangla ? "গতকাল" : "Yesterday"}
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset("THIS_WEEK")}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors"
              >
                {isBangla ? "এই সপ্তাহ" : "This Week"}
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset("THIS_MONTH")}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors"
              >
                {isBangla ? "এই মাস" : "This Month"}
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset("ALL")}
                className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-500/30 text-[11px] font-bold transition-colors"
              >
                {isBangla ? "সকল সময় (All)" : "All Time"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200 dark:border-slate-900">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">{isBangla ? "শুরুর তারিখ:" : "From Date:"}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">{isBangla ? "শেষের তারিখ:" : "To Date:"}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">{isBangla ? "ব্রাঞ্চ সিলেক্ট করুন:" : "Branch:"}</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:border-teal-500"
              >
                <option value="ALL">{isBangla ? "সকল ব্রাঞ্চ" : "All Branches"}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">{isBangla ? "স্ট্যাটাস ফিল্টার:" : "Status Filter:"}</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:border-teal-500"
              >
                <option value="ALL">{isBangla ? "সকল স্ট্যাটাস" : "All Status"}</option>
                <option value="PRESENT">{isBangla ? "উপস্থিত (Present)" : "Present"}</option>
                <option value="LATE">{isBangla ? "দেরি (Late)" : "Late"}</option>
                <option value="HALF_DAY">{isBangla ? "হাফ-ডে (Half Day)" : "Half Day"}</option>
                <option value="ON_LEAVE">{isBangla ? "ছুটিতে (On Leave)" : "On Leave"}</option>
                <option value="ABSENT">{isBangla ? "অনুপস্থিত (Absent)" : "Absent"}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Bar & Result Summary */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isBangla ? "নাম, আইডি বা ডিপার্টমেন্ট দিয়ে খুঁজুন..." : "Search by name, ID or department..."}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">
            {isBangla
              ? `ফিল্টার অনুযায়ী প্রাপ্ত লগ: ${filteredLogs.length} টি`
              : `Showing ${filteredLogs.length} attendance records`}
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">{isBangla ? "তারিখ" : "Date"}</th>
                <th className="py-3.5 px-4">{isBangla ? "কর্মকর্তা / কর্মী" : "Staff Member"}</th>
                <th className="py-3.5 px-4">{isBangla ? "ব্রাঞ্চ ও ডিপার্টমেন্ট" : "Branch / Dept"}</th>
                <th className="py-3.5 px-4">{isBangla ? "ইন / আউট সময়" : "In / Out Time"}</th>
                <th className="py-3.5 px-4">{isBangla ? "কাজের ঘণ্টা" : "Work Hours"}</th>
                <th className="py-3.5 px-4">{isBangla ? "জিওফেন্স ও ফেস ম্যাচ" : "GPS & Face"}</th>
                <th className="py-3.5 px-4">{isBangla ? "স্ট্যাটাস" : "Status"}</th>
                <th className="py-3.5 px-4 text-right">{isBangla ? "অ্যাকশন" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    {isBangla ? "কোনো উপস্থিতি লগ পাওয়া যায়নি" : "No attendance logs matching your filters"}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isPresent = log.status === "PRESENT";
                  const isLate = log.status === "LATE";
                  const isHalfDay = log.status === "HALF_DAY";
                  const isOnLeave = log.status === "ON_LEAVE";

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {log.date}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {log.checkInSnapshotUrl ? (
                            <img
                              src={log.checkInSnapshotUrl}
                              alt={log.employeeName}
                              className="w-8 h-8 rounded-lg object-cover border border-teal-500/40"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-slate-800 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold text-xs">
                              {log.employeeName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{log.employeeName}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{log.employeeCode}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-slate-800 dark:text-slate-300 block font-medium">{log.branchName}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{log.departmentName}</span>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                          <span>IN: {log.checkInTime || "--:--"}</span>
                        </div>
                        {log.checkOutTime && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            OUT: {log.checkOutTime}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {(log.totalWorkMinutes / 60).toFixed(1)}h
                        </span>
                        {log.lateMinutes > 0 && (
                          <span className="text-[10px] text-rose-600 dark:text-red-400 block">
                            +{log.lateMinutes}m Late
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                            <span className={log.checkInGeofencePassed ? "text-slate-700 dark:text-slate-300 font-mono" : "text-amber-600 dark:text-amber-400 font-mono"}>
                              {log.checkInDistanceMeters || 0}m
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Match: {log.checkInFaceMatchScore}%</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            isPresent
                              ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                              : isLate
                              ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                              : isHalfDay
                              ? "bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30"
                              : isOnLeave
                              ? "bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30"
                              : "bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedRecord(log)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isBangla ? "অডিট" : "Audit"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Biometric Snapshot Audit Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-lg text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>{isBangla ? "বায়োমেট্রিক উপস্থিতি অডিট রেকর্ড" : "Biometric Verification Audit Log"}</span>
              </h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold uppercase">{isBangla ? "ক্লক-ইন স্ন্যাপশট" : "Clock-In Snapshot"}</span>
                {selectedRecord.checkInSnapshotUrl ? (
                  <img
                    src={selectedRecord.checkInSnapshotUrl}
                    alt="Check in photo"
                    className="w-full h-36 object-cover rounded-lg border border-teal-500/40"
                  />
                ) : (
                  <div className="w-full h-36 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                    No Snapshot
                  </div>
                )}
                <span className="text-[10px] text-teal-700 dark:text-teal-400 font-mono block">
                  Time: {selectedRecord.checkInTime || "N/A"}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold uppercase">{isBangla ? "ক্লক-আউট স্ন্যাপশট" : "Clock-Out Snapshot"}</span>
                {selectedRecord.checkOutSnapshotUrl ? (
                  <img
                    src={selectedRecord.checkOutSnapshotUrl}
                    alt="Check out photo"
                    className="w-full h-36 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-full h-36 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                    {selectedRecord.checkOutTime ? "No photo logged" : "Not Checked Out"}
                  </div>
                )}
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
                  Time: {selectedRecord.checkOutTime || "Pending"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{isBangla ? "কর্মচারীর নাম:" : "Employee:"}</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedRecord.employeeName} ({selectedRecord.employeeCode})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{isBangla ? "তারিখ:" : "Date:"}</span>
                <span className="font-mono text-slate-800 dark:text-white">{selectedRecord.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{isBangla ? "ব্রাঞ্চ ও লোকেশন:" : "Branch & City:"}</span>
                <span className="text-teal-700 dark:text-teal-300 font-semibold">{selectedRecord.branchName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{isBangla ? "বায়োমেট্রিক কনফিডেন্স স্কোর:" : "Biometric Match Confidence:"}</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedRecord.checkInFaceMatchScore}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{isBangla ? "অ্যান্টি-স্পুফিং ভেরিফিকেশন:" : "Anti-Spoofing Liveness:"}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{selectedRecord.checkInAntiSpoofingPassed ? "PASSED (Live Human)" : "UNVERIFIED"}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{isBangla ? "জিওফেন্স দূরত্ব (মিটার):" : "Geofence Center Distance:"}</span>
                <span className="font-mono text-slate-800 dark:text-white">{selectedRecord.checkInDistanceMeters} meters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{isBangla ? "জিপিএস স্থানাঙ্ক (GPS Coordinates):" : "GPS Lat/Lng:"}</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                  {selectedRecord.checkInLat?.toFixed(5)}, {selectedRecord.checkInLng?.toFixed(5)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-bold text-xs cursor-pointer transition-colors"
              >
                {isBangla ? "বন্ধ করুন" : "Close Audit View"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
