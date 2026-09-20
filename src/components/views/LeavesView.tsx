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
  X,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  Sparkles
} from "lucide-react";
import { LeaveApplication, Branch, Employee } from "../../types";
import { exportToCSV } from "../../utils/exportUtils";

interface LeavesViewProps {
  leaves: LeaveApplication[];
  branches: Branch[];
  employees?: Employee[];
  currentUser?: Employee;
  onApproveLeave: (leaveId: string, comments?: string) => void;
  onRejectLeave: (leaveId: string, comments?: string) => void;
  onAddLeave?: (leave: LeaveApplication) => void;
  onUpdateLeave?: (leave: LeaveApplication) => void;
  onDeleteLeave?: (leaveId: string) => void;
}

export const LeavesView: React.FC<LeavesViewProps> = ({
  leaves,
  branches,
  employees = [],
  currentUser,
  onApproveLeave,
  onRejectLeave,
  onAddLeave,
  onUpdateLeave,
  onDeleteLeave,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedBranch, setSelectedBranch] = useState("ALL");

  // Modals
  const [reviewingLeave, setReviewingLeave] = useState<LeaveApplication | null>(null);
  const [hrComments, setHrComments] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveApplication | null>(null);
  const [deleteLeaveId, setDeleteLeaveId] = useState<string | null>(null);

  // Form state for creating leave
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || "");
  const [createLeaveType, setCreateLeaveType] = useState<LeaveApplication["leaveType"]>("CASUAL");
  const [createStartDate, setCreateStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [createEndDate, setCreateEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [createTotalDays, setCreateTotalDays] = useState(1);
  const [createReason, setCreateReason] = useState("");
  const [createApprovedDirectly, setCreateApprovedDirectly] = useState(true);

  // Form state for editing leave
  const [editLeaveType, setEditLeaveType] = useState<LeaveApplication["leaveType"]>("CASUAL");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editTotalDays, setEditTotalDays] = useState(1);
  const [editReason, setEditReason] = useState("");
  const [editStatus, setEditStatus] = useState<LeaveApplication["status"]>("APPROVED");
  const [editReviewerComments, setEditReviewerComments] = useState("");

  const calculateDays = (start: string, end: string) => {
    try {
      const s = new Date(start);
      const e = new Date(end);
      const diffTime = Math.abs(e.getTime() - s.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return isNaN(diffDays) || diffDays < 1 ? 1 : diffDays;
    } catch {
      return 1;
    }
  };

  const handleStartDateChange = (val: string) => {
    setCreateStartDate(val);
    if (val > createEndDate) {
      setCreateEndDate(val);
      setCreateTotalDays(1);
    } else {
      setCreateTotalDays(calculateDays(val, createEndDate));
    }
  };

  const handleEndDateChange = (val: string) => {
    setCreateEndDate(val);
    setCreateTotalDays(calculateDays(createStartDate, val));
  };

  const handleEditStartDateChange = (val: string) => {
    setEditStartDate(val);
    if (val > editEndDate) {
      setEditEndDate(val);
      setEditTotalDays(1);
    } else {
      setEditTotalDays(calculateDays(val, editEndDate));
    }
  };

  const handleEditEndDateChange = (val: string) => {
    setEditEndDate(val);
    setEditTotalDays(calculateDays(editStartDate, val));
  };

  const selectableEmployees = employees.filter((emp) => {
    if (!currentUser) return false;
    if (isSuperAdminOrCeo(currentUser)) return true;
    if (isBranchManager(currentUser)) return emp.branchId === currentUser.branchId;
    return emp.id === currentUser.id;
  });

  const openCreateModal = () => {
    const isGeneral = isGeneralEmployee(currentUser);
    if (isGeneral && currentUser) {
      setSelectedEmpId(currentUser.id);
    } else {
      const defaultEmp = selectableEmployees[0] || employees[0];
      if (defaultEmp) {
        setSelectedEmpId(defaultEmp.id);
      }
    }
    const today = new Date().toISOString().split("T")[0];
    setCreateStartDate(today);
    setCreateEndDate(today);
    setCreateTotalDays(1);
    setCreateLeaveType("CASUAL");
    setCreateReason("");
    setCreateApprovedDirectly(false);
    setShowCreateModal(true);
  };

  const openEditModal = (leave: LeaveApplication) => {
    setEditingLeave(leave);
    setEditLeaveType(leave.leaveType);
    setEditStartDate(leave.startDate);
    setEditEndDate(leave.endDate);
    setEditTotalDays(leave.totalDays);
    setEditReason(leave.reason);
    setEditStatus(leave.status);
    setEditReviewerComments(leave.reviewerComments || "");
  };

  const handleSaveCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const isGeneral = isGeneralEmployee(currentUser);
    const emp = isGeneral && currentUser
      ? currentUser
      : (employees.find((x) => x.id === selectedEmpId) || employees[0]);
    if (!emp) return;

    const shouldApproveDirectly = isGeneral ? false : createApprovedDirectly;

    const newLeave: LeaveApplication = {
      id: `leave-${Date.now()}`,
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: emp.fullName,
      avatarUrl: emp.avatarUrl || "https://images.unsplash.com/photo-1534528741775?w=200&h=200&fit=crop&crop=face",
      branchId: emp.branchId || "branch-01",
      branchName: emp.branchName || "Main Office",
      departmentName: emp.departmentName || "General",
      leaveType: createLeaveType,
      startDate: createStartDate,
      endDate: createEndDate,
      totalDays: createTotalDays,
      reason: createReason.trim() || (isGeneral ? "ব্যক্তিগত ছুটির আবেদন" : "অফিসিয়াল অনুমোদনক্রমে ছুটি প্রদান"),
      status: shouldApproveDirectly ? "APPROVED" : "PENDING",
      appliedDate: new Date().toISOString().split("T")[0],
      reviewedBy: shouldApproveDirectly ? "Super Admin" : undefined,
      reviewedAt: shouldApproveDirectly ? new Date().toISOString().split("T")[0] : undefined,
      reviewerComments: shouldApproveDirectly ? "সুপার অ্যাডমিন কর্তৃক সরাসরি ছুটি বরাদ্দ ও অনুমোদিত" : undefined,
    };

    if (onAddLeave) {
      onAddLeave(newLeave);
    }
    setShowCreateModal(false);
  };

  const handleSaveEditLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLeave) return;

    const updated: LeaveApplication = {
      ...editingLeave,
      leaveType: editLeaveType,
      startDate: editStartDate,
      endDate: editEndDate,
      totalDays: editTotalDays,
      reason: editReason.trim(),
      status: editStatus,
      reviewerComments: editReviewerComments.trim(),
      reviewedBy: editStatus === "APPROVED" || editStatus === "REJECTED" ? (editingLeave.reviewedBy || "Super Admin") : undefined,
      reviewedAt: editStatus === "APPROVED" || editStatus === "REJECTED" ? (editingLeave.reviewedAt || new Date().toISOString().split("T")[0]) : undefined,
    };

    if (onUpdateLeave) {
      onUpdateLeave(updated);
    }
    setEditingLeave(null);
  };

  const handleConfirmDelete = () => {
    if (deleteLeaveId && onDeleteLeave) {
      onDeleteLeave(deleteLeaveId);
      setDeleteLeaveId(null);
    }
  };

  const isSuperAdminOrCeo = (user?: Employee) => {
    if (!user) return false;
    return Boolean(
      user.role === "SUPER_ADMIN" ||
      user.isSuperAdmin ||
      user.role === "COMPANY_ADMIN" ||
      user.role === "CEO" ||
      user.isCeoOrOwner ||
      user.designationTitle?.toLowerCase().includes("ceo") ||
      user.designationTitle?.toLowerCase().includes("chief executive officer") ||
      user.designationTitle?.toLowerCase().includes("সিইও")
    );
  };

  const isBranchManager = (user?: Employee) => {
    if (!user) return false;
    return Boolean(
      user.role === "BRANCH_MANAGER" ||
      user.designationTitle?.toLowerCase().includes("branch manager") ||
      user.designationTitle?.toLowerCase().includes("শাখা প্রধান")
    );
  };

  const isGeneralEmployee = (user?: Employee) => {
    if (!user) return false;
    return !isSuperAdminOrCeo(user) && !isBranchManager(user);
  };

  // Scope:
  // - CEO & Super Admin: see all leaves
  // - Branch Manager: see their branch leaves
  // - General Employee: see ONLY their own leaves
  const roleScopedLeaves = leaves.filter((l) => {
    if (!currentUser) return false;
    if (isSuperAdminOrCeo(currentUser)) return true;
    if (isBranchManager(currentUser)) {
      return l.branchId === currentUser.branchId;
    }
    return l.employeeId === currentUser.id;
  });

  const canApproveRejectLeave = (leave: LeaveApplication) => {
    if (!currentUser) return false;
    if (isSuperAdminOrCeo(currentUser)) return true;
    if (isBranchManager(currentUser)) {
      return leave.branchId === currentUser.branchId;
    }
    return false;
  };

  const canEditLeave = (leave: LeaveApplication) => {
    if (!currentUser) return false;
    if (isSuperAdminOrCeo(currentUser)) return true;
    if (isBranchManager(currentUser)) {
      return leave.branchId === currentUser.branchId;
    }
    return false;
  };

  const canDeleteLeave = (leave: LeaveApplication) => {
    if (!currentUser) return false;
    if (isSuperAdminOrCeo(currentUser)) return true;
    if (isBranchManager(currentUser)) {
      return leave.branchId === currentUser.branchId;
    }
    return leave.employeeId === currentUser.id && leave.status === "PENDING";
  };

  const filteredLeaves = roleScopedLeaves.filter((l) => {
    const matchesSearch =
      (l.employeeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.employeeCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.departmentName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.reason || "").toLowerCase().includes(searchTerm.toLowerCase());

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
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>ছুটি ব্যবস্থাপনা ও অনুমোদন (Leave Management & Quota)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              কর্মীদের ছুটির আবেদন পর্যালোচনা, সুপার অ্যাডমিন কর্তৃক ছুটি প্রদান, এডিট এবং নির্ভুল রেকর্ড পরিচালনা
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>এক্সপোর্ট (CSV)</span>
            </button>

            {onAddLeave && (
              <button
                type="button"
                onClick={openCreateModal}
                className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {isGeneralEmployee(currentUser)
                    ? "ছুটির আবেদন করুন (Apply for Leave)"
                    : "কর্মীর জন্য ছুটি বরাদ্দ করুন (Assign Leave)"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className={`grid grid-cols-1 ${isGeneralEmployee(currentUser) ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-3 text-xs`}>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="কর্মী, আইডি বা কারণ দিয়ে খুঁজুন..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {!isGeneralEmployee(currentUser) && (
            <div>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              >
                {!isBranchManager(currentUser) && <option value="ALL">সকল শাখা (All Branches)</option>}
                {branches
                  .filter((b) => !isBranchManager(currentUser) || b.id === currentUser?.branchId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">সকল স্ট্যাটাস (All Statuses)</option>
              <option value="PENDING">অপেক্ষমাণ (Pending Review)</option>
              <option value="APPROVED">অনুমোদিত (Approved)</option>
              <option value="REJECTED">প্রত্যাখ্যাত (Rejected)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leave Applications Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">কর্মী (Employee)</th>
                <th className="p-3">শাখা ও বিভাগ (Branch/Dept)</th>
                <th className="p-3">ছুটির ধরন (Leave Type)</th>
                <th className="p-3">তারিখ ও সময়সীমা (Dates & Duration)</th>
                <th className="p-3">ছুটির কারণ (Reason)</th>
                <th className="p-3">স্ট্যাটাস (Status)</th>
                <th className="p-3 text-right">অ্যাকশন (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    কোনো ছুটির আবেদন বা রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={l.avatarUrl || "https://images.unsplash.com/photo-1534528741775?w=200&h=200&fit=crop&crop=face"}
                          alt={l.employeeName}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{l.employeeName}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{l.employeeCode}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{(l.branchName || "Main Office").split("(")[0]}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{l.departmentName || "সাধারণ"}</div>
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30">
                        {l.leaveType === "CASUAL"
                          ? "নৈমিত্তিক (Casual)"
                          : l.leaveType === "SICK"
                          ? "অসুস্থতাজনিত (Sick)"
                          : l.leaveType === "ANNUAL"
                          ? "বাৎসরিক (Annual)"
                          : l.leaveType === "MATERNITY"
                          ? "মাতৃত্বকালীন (Maternity)"
                          : l.leaveType === "PATERNITY"
                          ? "পিতৃত্বকালীন (Paternity)"
                          : l.leaveType === "UNPAID"
                          ? "অবৈতনিক (Unpaid)"
                          : l.leaveType}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {l.startDate} থেকে {l.endDate}
                      </div>
                      <div className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold">{l.totalDays} দিন</div>
                    </td>

                    <td className="p-3 max-w-[200px] truncate text-slate-600 dark:text-slate-300" title={l.reason}>
                      "{l.reason}"
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          l.status === "APPROVED"
                            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                            : l.status === "PENDING"
                            ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                            : "bg-red-500/15 text-red-800 dark:text-red-300 border border-red-500/30"
                        }`}
                      >
                        {l.status === "APPROVED" ? "অনুমোদিত" : l.status === "PENDING" ? "অপেক্ষমাণ" : "বাতিল/প্রত্যাখ্যাত"}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {l.status === "PENDING" && canApproveRejectLeave(l) && (
                          <button
                            type="button"
                            onClick={() => setReviewingLeave(l)}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer"
                            title="অনুমোদন বা প্রত্যাখ্যান করুন"
                          >
                            রিভিউ
                          </button>
                        )}

                        {onUpdateLeave && canEditLeave(l) && (
                          <button
                            type="button"
                            onClick={() => openEditModal(l)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-teal-500/20 dark:bg-slate-800 dark:hover:bg-teal-500/30 text-slate-700 dark:text-slate-200 hover:text-teal-700 dark:hover:text-teal-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                            title="এডিট করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {onDeleteLeave && canDeleteLeave(l) && (
                          <button
                            type="button"
                            onClick={() => setDeleteLeaveId(l.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/20 cursor-pointer"
                            title={l.employeeId === currentUser?.id ? "আবেদন বাতিল করুন" : "মুছে ফেলুন"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Super Admin Assign / Create Leave */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-lg text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>
                  {isGeneralEmployee(currentUser)
                    ? "ছুটির আবেদন জমা দিন (Submit Leave Application)"
                    : "কর্মীর জন্য ছুটি বরাদ্দ করুন (Assign Leave)"}
                </span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCreateLeave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  {isGeneralEmployee(currentUser) ? "আবেদনকারী কর্মী" : "কর্মী নির্বাচন করুন *"}
                </label>
                {isGeneralEmployee(currentUser) && currentUser ? (
                  <div className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium flex items-center justify-between">
                    <span>{currentUser.fullName} ({currentUser.employeeCode})</span>
                    <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">{currentUser.designationTitle}</span>
                  </div>
                ) : (
                  <select
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    required
                  >
                    {selectableEmployees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName} ({e.employeeCode}) - {e.designationTitle} {e.branchName ? `[${e.branchName}]` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">ছুটির ধরন *</label>
                  <select
                    value={createLeaveType}
                    onChange={(e) => setCreateLeaveType(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="CASUAL">নৈমিত্তিক ছুটি (Casual Leave)</option>
                    <option value="SICK">অসুস্থতাজনিত ছুটি (Sick Leave)</option>
                    <option value="ANNUAL">বাৎসরিক ছুটি (Annual Leave)</option>
                    <option value="MATERNITY">মাতৃত্বকালীন ছুটি (Maternity Leave)</option>
                    <option value="PATERNITY">পিতৃত্বকালীন ছুটি (Paternity Leave)</option>
                    <option value="UNPAID">অবৈতনিক ছুটি (Unpaid Leave)</option>
                    <option value="SPECIAL">বিশেষ ছুটি (Special Leave)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">মোট ছুটির দিন সংখ্যা</label>
                  <input
                    type="number"
                    min={1}
                    value={createTotalDays}
                    onChange={(e) => setCreateTotalDays(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">শুরুর তারিখ *</label>
                  <input
                    type="date"
                    value={createStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">শেষের তারিখ *</label>
                  <input
                    type="date"
                    value={createEndDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">ছুটির কারণ ও মন্তব্য</label>
                <textarea
                  rows={2}
                  value={createReason}
                  onChange={(e) => setCreateReason(e.target.value)}
                  placeholder="যেমন: পারিবারিক জরুরি কাজ, বার্ষিক বরাদ্দ থেকে প্রদত্ত..."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              {isGeneralEmployee(currentUser) ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-[11px] leading-relaxed font-medium">
                    ছুটির আবেদন সাবমিট করার পর অফিস অ্যাডমিন বা এইচআর অনুমোদন (Approve) না করা পর্যন্ত এটি অপেক্ষমাণ (Pending) থাকবে।
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-teal-900 dark:text-teal-200 block text-xs">সরাসরি অনুমোদিত হিসেবে সেভ করুন</span>
                    <span className="text-[11px] text-teal-700 dark:text-teal-400 block">সুপার অ্যাডমিন/ম্যানেজার দ্বারা সাথে সাথে কার্যকর হবে</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={createApprovedDirectly}
                    onChange={(e) => setCreateApprovedDirectly(e.target.checked)}
                    className="w-4 h-4 accent-teal-600 cursor-pointer"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold cursor-pointer shadow-md shadow-teal-500/20"
                >
                  ছুটি নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Leave Application */}
      {editingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-lg text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>ছুটির রেকর্ড সম্পাদনা (Edit Leave)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {editingLeave.employeeName} ({editingLeave.employeeCode})
                </p>
              </div>
              <button
                onClick={() => setEditingLeave(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLeave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">ছুটির ধরন *</label>
                  <select
                    value={editLeaveType}
                    onChange={(e) => setEditLeaveType(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="CASUAL">নৈমিত্তিক ছুটি (Casual Leave)</option>
                    <option value="SICK">অসুস্থতাজনিত ছুটি (Sick Leave)</option>
                    <option value="ANNUAL">বাৎসরিক ছুটি (Annual Leave)</option>
                    <option value="MATERNITY">মাতৃত্বকালীন ছুটি (Maternity Leave)</option>
                    <option value="PATERNITY">পিতৃত্বকালীন ছুটি (Paternity Leave)</option>
                    <option value="UNPAID">অবৈতনিক ছুটি (Unpaid Leave)</option>
                    <option value="SPECIAL">বিশেষ ছুটি (Special Leave)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">স্ট্যাটাস *</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="APPROVED">অনুমোদিত (APPROVED)</option>
                    <option value="PENDING">অপেক্ষমাণ (PENDING)</option>
                    <option value="REJECTED">প্রত্যাখ্যাত (REJECTED)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">শুরুর তারিখ *</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => handleEditStartDateChange(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">শেষের তারিখ *</label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => handleEditEndDateChange(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">মোট দিন</label>
                  <input
                    type="number"
                    min={1}
                    value={editTotalDays}
                    onChange={(e) => setEditTotalDays(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">ছুটির কারণ (Reason)</label>
                <textarea
                  rows={2}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">পর্যালোচনা মন্তব্য (Reviewer Notes)</label>
                <input
                  type="text"
                  value={editReviewerComments}
                  onChange={(e) => setEditReviewerComments(e.target.value)}
                  placeholder="যেমন: সুপার অ্যাডমিন অনুমোদিত..."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLeave(null)}
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

      {/* Modal: Review & Decide Leave */}
      {reviewingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" /> ছুটির আবেদন সিদ্ধান্ত
              </h3>
              <button onClick={() => setReviewingLeave(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">কর্মী:</span>
                <span className="font-bold text-slate-900 dark:text-white">{reviewingLeave.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">ছুটির ধরন:</span>
                <span className="font-bold text-teal-700 dark:text-teal-300">{reviewingLeave.leaveType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">সময়সীমা:</span>
                <span className="text-slate-900 dark:text-white">
                  {reviewingLeave.startDate} থেকে {reviewingLeave.endDate} ({reviewingLeave.totalDays} দিন)
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">আবেদনের কারণ:</span>
                <p className="text-slate-700 dark:text-slate-200 italic font-sans">"{reviewingLeave.reason}"</p>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block text-slate-600 dark:text-slate-400 font-medium">মন্তব্য বা অনুমোদনের নোট (ঐচ্ছিক)</label>
              <textarea
                rows={2}
                value={hrComments}
                onChange={(e) => setHrComments(e.target.value)}
                placeholder="মন্তব্য লিখুন..."
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-800 dark:text-red-300 border border-red-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-4 h-4" /> প্রত্যাখান
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> অনুমোদন করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Leave */}
      {deleteLeaveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-sm text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">ছুটি মুছে ফেলতে চান?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">এই রেকর্ডটি স্থায়ীভাবে মুছে ফেলা হবে।</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteLeaveId(null)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                না, বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
