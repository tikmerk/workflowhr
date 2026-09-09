import React, { useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Building2,
  Calendar,
  AlertCircle,
  X
} from "lucide-react";
import { LeaveApplication, Branch } from "../../types";
import { exportToCSV } from "../../utils/exportUtils";

interface LeavesViewProps {
  leaves: LeaveApplication[];
  branches: Branch[];
  onApproveLeave: (leaveId: string, comments?: string) => void;
  onRejectLeave: (leaveId: string, comments?: string) => void;
}

export const LeavesView: React.FC<LeavesViewProps> = ({
  leaves,
  branches,
  onApproveLeave,
  onRejectLeave,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedBranch, setSelectedBranch] = useState("ALL");

  const [reviewingLeave, setReviewingLeave] = useState<LeaveApplication | null>(null);
  const [hrComments, setHrComments] = useState("");

  const filteredLeaves = leaves.filter((l) => {
    const matchesSearch =
      l.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.departmentName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === "ALL" || l.status === selectedStatus;
    const matchesBranch = selectedBranch === "ALL" || l.branchId === selectedBranch;

    return matchesSearch && matchesStatus && matchesBranch;
  });

  const handleApprove = () => {
    if (reviewingLeave) {
      onApproveLeave(reviewingLeave.id, hrComments || "Approved by HR Management");
      setReviewingLeave(null);
      setHrComments("");
    }
  };

  const handleReject = () => {
    if (reviewingLeave) {
      onRejectLeave(reviewingLeave.id, hrComments || "Declined due to schedule conflict");
      setReviewingLeave(null);
      setHrComments("");
    }
  };

  const handleExportCSV = () => {
    const data = filteredLeaves.map((l) => ({
      "Employee ID": l.employeeCode,
      "Employee Name": l.employeeName,
      Branch: l.branchName,
      Department: l.departmentName,
      "Leave Type": l.leaveType,
      "Start Date": l.startDate,
      "End Date": l.endDate,
      "Total Days": l.totalDays,
      Reason: l.reason,
      Status: l.status,
      "Applied Date": l.appliedDate,
    }));
    exportToCSV("Workflow_HR_Leave_Applications", data);
  };

  return (
    <div id="leaves-management-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-teal-400" />
              <span>Leave Management & Approval Workflow</span>
            </h2>
            <p className="text-xs text-slate-400">
              Review workforce leave applications, track yearly quotas, and process instant multi-level approvals
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl shadow flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Export Leave Data</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by employee, code, department..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Branch Offices</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Application Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leave Applications Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Branch & Dept</th>
                <th className="p-3">Leave Type</th>
                <th className="p-3">Dates & Duration</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredLeaves.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={l.avatarUrl}
                        alt={l.employeeName}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                      />
                      <div>
                        <div className="font-bold text-white">{l.employeeName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{l.employeeCode}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="font-medium text-slate-200">{(l.branchName || "Main Office").split("(")[0]}</div>
                    <div className="text-[10px] text-slate-400">{l.departmentName}</div>
                  </td>

                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-500/20 text-teal-300">
                      {l.leaveType}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="font-bold text-white">
                      {l.startDate} to {l.endDate}
                    </div>
                    <div className="text-[10px] text-teal-400 font-semibold">{l.totalDays} Total Days</div>
                  </td>

                  <td className="p-3 max-w-[220px] truncate text-slate-300" title={l.reason}>
                    "{l.reason}"
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        l.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : l.status === "PENDING"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    {l.status === "PENDING" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setReviewingLeave(l);
                          }}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-[11px] font-bold shadow"
                        >
                          Review
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-mono">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Review & Decide Leave */}
      {reviewingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-teal-400" /> Review Leave Application
              </h3>
              <button onClick={() => setReviewingLeave(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Employee:</span>
                <span className="font-bold text-white">{reviewingLeave.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Leave Type:</span>
                <span className="font-bold text-teal-300">{reviewingLeave.leaveType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duration:</span>
                <span className="text-white">
                  {reviewingLeave.startDate} to {reviewingLeave.endDate} ({reviewingLeave.totalDays} Days)
                </span>
              </div>
              <div className="pt-2 border-t border-slate-700">
                <span className="text-slate-400 block mb-0.5">Applicant Reason:</span>
                <p className="text-slate-200 italic font-sans">"{reviewingLeave.reason}"</p>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block text-slate-400">HR Remarks / Approval Notes</label>
              <textarea
                rows={2}
                value={hrComments}
                onChange={(e) => setHrComments(e.target.value)}
                placeholder="Optional decision comments..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Reject Leave
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
