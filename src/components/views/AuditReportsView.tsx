import React, { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  ShieldCheck,
  Search,
  Filter,
  Layers,
  Calendar,
  Building2,
  Lock,
  Globe,
  Smartphone,
  Eye
} from "lucide-react";
import { AuditLog, Employee, AttendanceRecord, Payslip } from "../../types";
import { exportToCSV } from "../../utils/exportUtils";

interface AuditReportsViewProps {
  auditLogs: AuditLog[];
  employees: Employee[];
  attendanceLogs: AttendanceRecord[];
  payslips: Payslip[];
}

export const AuditReportsView: React.FC<AuditReportsViewProps> = ({
  auditLogs,
  employees,
  attendanceLogs,
  payslips,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("ALL");

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = selectedModule === "ALL" || log.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  const handleExportAudit = () => {
    const data = filteredLogs.map((l) => ({
      Timestamp: l.timestamp,
      "Actor Name": l.actorName,
      Role: l.actorRole,
      Module: l.module,
      Action: l.action,
      Details: l.details,
      "IP Address": l.ipAddress,
      Device: l.deviceInfo,
      Status: l.status,
    }));
    exportToCSV("Workflow_HR_Security_Audit_Logs", data);
  };

  const handleExportWorkforce = () => {
    const data = employees.map((e) => ({
      "Employee Code": e.employeeCode,
      "Full Name": e.fullName,
      Role: e.role,
      Designation: e.designationTitle,
      Department: e.departmentName,
      Branch: e.branchName,
      Email: e.email,
      Phone: e.phone,
      "Joining Date": e.joiningDate,
      "Gross Salary (BDT)": e.salary?.grossSalary || 0,
      Status: e.status,
    }));
    exportToCSV("Workflow_HR_Master_Workforce_Report", data);
  };

  const handleExportAttendance = () => {
    const data = attendanceLogs.map((a) => ({
      Date: a.date,
      "Employee Code": a.employeeCode,
      "Employee Name": a.employeeName,
      Branch: a.branchName,
      "Check In": a.checkInTime,
      "Check Out": a.checkOutTime || "Active",
      "Distance (m)": a.checkInDistanceMeters,
      "Face Match Score": `${a.checkInFaceMatchScore}%`,
      Status: a.status,
    }));
    exportToCSV("Workflow_HR_Attendance_Summary_Report", data);
  };

  return (
    <div id="audit-reports-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>Immutable Security Audit Logs & Reporting Center</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cryptographically signed operation logs, IP telemetry & one-click export for regulatory compliance
          </p>
        </div>

        <button
          onClick={handleExportAudit}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Export Audit Trail</span>
        </button>
      </div>

      {/* Quick Report Download Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider block">
              WORKFORCE MASTER
            </span>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">Complete Staff Master Report</h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">
              Includes NID, Bank Accounts, Salary breakdown, Biometric status
            </p>
          </div>
          <button
            onClick={handleExportWorkforce}
            className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
              BIOMETRIC ATTENDANCE
            </span>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">GPS & Anti-Spoofing Audit</h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">
              Includes distance from branch beacon, clock-in times, liveness scores
            </p>
          </div>
          <button
            onClick={handleExportAttendance}
            className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              PAYROLL DISBURSEMENT
            </span>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">Bank Advice & Tax Ledger</h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">
              Gross salary, PF deductions, Tax withholdings, Loan EMIs, Net amount
            </p>
          </div>
          <button
            onClick={handleExportAudit}
            className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Security Audit Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
          >
            <option value="ALL">All System Modules</option>
            <option value="ATTENDANCE">Attendance & Biometrics</option>
            <option value="PAYROLL">Payroll & Bank Disbursement</option>
            <option value="EMPLOYEES">Employee Records</option>
            <option value="SECURITY">Security & Access</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">User & Role</th>
                <th className="p-3">Module & Action</th>
                <th className="p-3">Details</th>
                <th className="p-3">IP & Device Signature</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">{log.timestamp}</td>

                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-white">{log.actorName}</div>
                    <div className="text-[10px] text-teal-700 dark:text-teal-400 font-medium">
                      {log.actorRole.replace("_", " ")}
                    </div>
                  </td>

                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                      {log.module}
                    </span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{log.action}</div>
                  </td>

                  <td className="p-3 text-slate-600 dark:text-slate-300 max-w-[280px]">{log.details}</td>

                  <td className="p-3 font-mono text-[11px]">
                    <div className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                      <span>{log.ipAddress}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{log.deviceInfo}</div>
                  </td>

                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                      <ShieldCheck className="w-3 h-3" /> {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
