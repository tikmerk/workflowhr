import React, { useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Users,
  Building2,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sliders,
  UserCheck,
  Award,
  CalendarCheck,
  Sparkles,
  Lock,
  Layers,
  HeartHandshake
} from "lucide-react";
import {
  RolePermissionConfig,
  PayrollPolicyConfig,
  UserRole,
  NavigationTab,
  Employee
} from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";

interface RolesPermissionsViewProps {
  rolePermissions: RolePermissionConfig[];
  onUpdateRolePermissions: (roles: RolePermissionConfig[]) => void;
  payrollPolicy: PayrollPolicyConfig;
  onUpdatePayrollPolicy: (policy: PayrollPolicyConfig) => void;
  employees: Employee[];
  onUpdateEmployee?: (employee: Employee) => void;
}

export const RolesPermissionsView: React.FC<RolesPermissionsViewProps> = ({
  rolePermissions,
  onUpdateRolePermissions,
  payrollPolicy,
  onUpdatePayrollPolicy,
  employees,
  onUpdateEmployee,
}) => {
  const { isBangla } = useThemeLanguage();

  const [activeTab, setActiveTab] = useState<"ROLES_MATRIX" | "POLICY_CONFIG" | "EXEMPT_STAFF">("ROLES_MATRIX");

  // Local state for role permissions
  const [permissionsState, setPermissionsState] = useState<RolePermissionConfig[]>(rolePermissions);
  const [selectedRole, setSelectedRole] = useState<UserRole>("DEPARTMENT_HEAD");

  // Local state for payroll and attendance policy
  const [policyState, setPolicyState] = useState<PayrollPolicyConfig>(payrollPolicy);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Active role config
  const activeRoleConfig = permissionsState.find((r) => r.role === selectedRole) || permissionsState[0];

  // Handle permission toggle
  const handleTogglePermission = (field: keyof RolePermissionConfig) => {
    if (!activeRoleConfig) return;
    const updated = permissionsState.map((r) => {
      if (r.role === selectedRole) {
        return {
          ...r,
          [field]: !r[field],
        };
      }
      return r;
    });
    setPermissionsState(updated);
  };

  // Handle Tab Permission Toggle
  const handleToggleNavTab = (tab: NavigationTab) => {
    if (!activeRoleConfig) return;
    const currentTabs = activeRoleConfig.allowedNavTabs || [];
    const isAllowed = currentTabs.includes(tab);
    const newTabs = isAllowed
      ? currentTabs.filter((t) => t !== tab)
      : [...currentTabs, tab];

    const updated = permissionsState.map((r) => {
      if (r.role === selectedRole) {
        return {
          ...r,
          allowedNavTabs: newTabs,
        };
      }
      return r;
    });
    setPermissionsState(updated);
  };

  // Save Role Permissions
  const handleSaveRolePermissions = () => {
    onUpdateRolePermissions(permissionsState);
    setSavedSuccess(isBangla ? "সিস্টেম রোল ও পারমিশন সফলভাবে সংরক্ষিত হয়েছে!" : "Role permissions saved successfully!");
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  // Save Policy
  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePayrollPolicy(policyState);
    setSavedSuccess(isBangla ? "হাজিরা ও বোনাস পলিসি সফলভাবে সংরক্ষিত হয়েছে!" : "Attendance & Bonus policy updated successfully!");
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  // Toggle staff exemption
  const handleToggleStaffExemption = (emp: Employee) => {
    if (!onUpdateEmployee) return;
    const updated: Employee = {
      ...emp,
      isAttendancePenaltyExempt: !emp.isAttendancePenaltyExempt,
    };
    onUpdateEmployee(updated);
  };

  // Toggle staff fixed salary
  const handleToggleStaffFixedSalary = (emp: Employee) => {
    if (!onUpdateEmployee) return;
    const updated: Employee = {
      ...emp,
      salaryStructureType: emp.salaryStructureType === "FIXED" ? "STANDARD_ALLOWANCES" : "FIXED",
    };
    onUpdateEmployee(updated);
  };

  const allNavTabsList: { id: NavigationTab; labelBn: string; labelEn: string }[] = [
    { id: "dashboard", labelBn: "এক্সিকিউটিভ ড্যাশবোর্ড", labelEn: "Executive Dashboard" },
    { id: "self-service", labelBn: "সেলফ-সার্ভিস পোর্টাল", labelEn: "Self-Service Portal" },
    { id: "employees", labelBn: "কর্মকর্তা-কর্মচারী তালিকা", labelEn: "Employee Directory" },
    { id: "departments-designations", labelBn: "ডিপার্টমেন্ট ও পদবি", labelEn: "Departments & Designations" },
    { id: "branches-geofence", labelBn: "শাখা ও জিওফেন্সিং", labelEn: "Branches & Geofencing" },
    { id: "ngo-programs-training", labelBn: "এনজিও ও রিলিফ প্রোগ্রাম", labelEn: "NGO Programs & Training" },
    { id: "meetings-conferences", labelBn: "মিটিং, সেমিনার ও সম্মেলন", labelEn: "Meetings & Conferences" },
    { id: "attendance-logs", labelBn: "বায়োমেট্রিক উপস্থিতি লগ", labelEn: "Biometric Attendance Logs" },
    { id: "shifts-holidays", labelBn: "শিফট ও কর্মঘণ্টা", labelEn: "Shifts & Holidays" },
    { id: "leaves", labelBn: "ছুটি অনুমোদন ও ব্যালেন্স", labelEn: "Leaves Management" },
    { id: "payroll", labelBn: "বেতন ও পে-স্লিপ", labelEn: "Payroll & Payslips" },
    { id: "loans", labelBn: "ঋণ ও প্রভিডেন্ট ফান্ড", labelEn: "Loans & Advance" },
    { id: "recruitment", labelBn: "নিয়োগ ও এআই বাছাই", labelEn: "Recruitment & ATS" },
    { id: "projects-tasks", labelBn: "প্রকল্প ও টাস্ক অগ্রগতি", labelEn: "Projects & Tasks" },
    { id: "assets", labelBn: "কোম্পানি সম্পদ ও হ্যান্ডওভার", labelEn: "Assets Handover" },
    { id: "certificates", labelBn: "অফিসিয়াল সনদ ও প্রত্যয়ন", labelEn: "Official Certificates" },
    { id: "exit-management", labelBn: "পদত্যাগ ও ক্লিয়ারেন্স", labelEn: "Exit & Resignation" },
    { id: "notices-chat", labelBn: "নোটিশ বোর্ড ও সার্কুলার", labelEn: "Notices & Circulars" },
    { id: "roles-permissions", labelBn: "সিস্টেম রোল ও পারমিশন", labelEn: "Roles & Permissions" },
    { id: "audit-reports", labelBn: "অডিট লগ ও সিস্টেম রিপোর্ট", labelEn: "Audit Logs & Reports" },
  ];

  return (
    <div id="roles-permissions-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isBangla ? "সুপার অ্যাডমিন সিকিউরিটি ও পলিসি" : "Super Admin Governance & RBAC"}</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20">
              {isBangla ? "নীতিমালা ও অনুমতি কনফিগারেশন" : "Role-Based Access"}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            {isBangla ? "সিস্টেম রোল, অ্যাক্সেস কন্ট্রোল ও পলিসি ম্যানেজমেন্ট" : "System Roles, Access Control & Policy Suite"}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {isBangla
              ? "সুপার অ্যাডমিন, সিইও ও ডিপার্টমেন্ট হেডদের ক্ষমতা নির্ধারণ, ফিল্ড কর্মীদের জরিমানা অব্যাহতি এবং ২ ঈদের বোনাস নীতিমালা ফিক্স করুন"
              : "Define roles authority, configure field penalty exemptions, and customize annual two Eids bonus rules"}
          </p>
        </div>

        {savedSuccess && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>{savedSuccess}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("ROLES_MATRIX")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "ROLES_MATRIX"
              ? "bg-teal-600 text-white shadow-xs"
              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>{isBangla ? "সিস্টেম রোল ও পারমিশন ম্যাট্রিক্স" : "Roles & Permissions Matrix"}</span>
        </button>

        <button
          onClick={() => setActiveTab("POLICY_CONFIG")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "POLICY_CONFIG"
              ? "bg-teal-600 text-white shadow-xs"
              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{isBangla ? "এটেন্ডেন্স ও ২ ঈদের বোনাস পলিসি" : "Attendance & Two Eids Bonus Policy"}</span>
        </button>

        <button
          onClick={() => setActiveTab("EXEMPT_STAFF")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "EXEMPT_STAFF"
              ? "bg-teal-600 text-white shadow-xs"
              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>{isBangla ? "ফিল্ড ও ফিক্সড কর্মী তালিকা (অব্যাহতিপ্রাপ্ত)" : "Field & Fixed Staff Status"}</span>
        </button>
      </div>

      {/* TAB 1: ROLES & PERMISSIONS MATRIX */}
      {activeTab === "ROLES_MATRIX" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Role Selection (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isBangla ? "সিস্টেমের রোলসমূহ নির্বাচন করুন" : "Select System Role"}
            </h3>

            <div className="space-y-2">
              {permissionsState.map((r) => {
                const isSelected = selectedRole === r.role;
                return (
                  <div
                    key={r.role}
                    onClick={() => setSelectedRole(r.role)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1 ${
                      isSelected
                        ? "bg-teal-500/10 border-teal-500 shadow-md shadow-teal-500/10 ring-1 ring-teal-500/30"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {isBangla ? r.roleTitleBn : r.roleTitleEn}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {r.role}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {r.descriptionBn}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Permission Details & Action Toggles (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                      {activeRoleConfig?.role}
                    </span>
                    <span className="text-xs text-slate-500">
                      {isBangla ? "অনুমতি ও দায়িত্ব বিন্যাস" : "Access Governance"}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {isBangla ? activeRoleConfig?.roleTitleBn : activeRoleConfig?.roleTitleEn}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeRoleConfig?.descriptionBn}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveRolePermissions}
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>{isBangla ? "পরিবর্তন সংরক্ষণ করুন" : "Save Role Permissions"}</span>
                </button>
              </div>

              {/* Functional Authority Toggles */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {isBangla ? "মৌলিক ক্ষমতা ও অধিকারসমূহ" : "Core System Authorities"}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "canAccessAllBranches", titleBn: "সকল শাখার তথ্য দেখার ক্ষমতা", titleEn: "Access All Branches" },
                    { key: "canEditEmployees", titleBn: "কর্মী তথ্য সম্পাদনা", titleEn: "Edit Employee Data" },
                    { key: "canDeleteEmployees", titleBn: "কর্মী মুছে ফেলা", titleEn: "Delete Employees" },
                    { key: "canManageDepartments", titleBn: "ডিপার্টমেন্ট ও পদবি ব্যবস্থাপনা", titleEn: "Manage Depts & Designations" },
                    { key: "canManageBranches", titleBn: "শাখা ও জিওফেন্স সেটিংস", titleEn: "Manage Branches & Geofencing" },
                    { key: "canApproveLeaves", titleBn: "ছুটি সরাসরি অনুমোদন", titleEn: "Approve Leaves" },
                    { key: "canManagePayroll", titleBn: "বেতন ও পে-স্লিপ পরিচালনা", titleEn: "Manage Payroll & Payslips" },
                    { key: "canConfigurePolicies", titleBn: "সিস্টেম পলিসি কনফিগারেশন", titleEn: "Configure Policies & Bonuses" },
                    { key: "canViewAuditLogs", titleBn: "সিকিউরিটি ও অডিট লগ দেখা", titleEn: "View Audit Logs" },
                  ].map((item) => {
                    const isEnabled = (activeRoleConfig as any)?.[item.key];
                    return (
                      <div
                        key={item.key}
                        onClick={() => handleTogglePermission(item.key as any)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isEnabled
                            ? "bg-teal-500/10 border-teal-500/40 text-teal-900 dark:text-teal-200"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500"
                        }`}
                      >
                        <span className="text-xs font-bold">
                          {isBangla ? item.titleBn : item.titleEn}
                        </span>
                        <div
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                            isEnabled ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-700"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              isEnabled ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Allowed Sidebar Navigation Tabs */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {isBangla ? "সাইডবার মেনু অ্যাক্সেস অনুমতি (Allowed Navigation Tabs)" : "Allowed Navigation Tabs"}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  {allNavTabsList.map((tab) => {
                    const isChecked = activeRoleConfig?.allowedNavTabs?.includes(tab.id);
                    return (
                      <label
                        key={tab.id}
                        className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleNavTab(tab.id)}
                          className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                        <span className={`font-semibold ${isChecked ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>
                          {isBangla ? tab.labelBn : tab.labelEn}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE & TWO EIDS BONUS POLICY CONFIGURATION */}
      {activeTab === "POLICY_CONFIG" && (
        <form onSubmit={handleSavePolicy} className="space-y-6 max-w-4xl">
          {/* Section 1: Festival Bonus Configuration */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isBangla ? "বাৎসরিক ২ ঈদের উৎসব বোনাস নীতিমালা (Two Eids Festival Bonus)" : "Annual 2 Eids Festival Bonus Policy"}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isBangla
                ? "সুপার অ্যাডমিন প্রতি বছর ঈদ-উল-ফিতর এবং ঈদ-উল-আযহার বোনাস ফিক্সড অ্যামাউন্ট অথবা মূল বেতনের শতকরা হারে ফিক্স করতে পারেন।"
                : "Super Admin can configure festival bonuses for Eid-ul-Fitr and Eid-ul-Adha as either a fixed amount or a percentage of Basic Salary annually."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-900 dark:text-white">
                  <input
                    type="radio"
                    name="bonusType"
                    checked={policyState.isBonusFixedAmount}
                    onChange={() => setPolicyState({ ...policyState, isBonusFixedAmount: true })}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>{isBangla ? "ফিক্সড টাকার পরিমাণ (Fixed Amount ৳)" : "Fixed Amount (BDT ৳)"}</span>
                </label>
                <div className="pl-6">
                  <span className="text-[11px] text-slate-500 block mb-1">
                    {isBangla ? "প্রতি ঈদে এককালীন বোনাস টাকা:" : "Per Eid Lump-sum Bonus:"}
                  </span>
                  <input
                    type="number"
                    value={policyState.twoEidsFixedBonusAmount}
                    onChange={(e) => setPolicyState({ ...policyState, twoEidsFixedBonusAmount: Number(e.target.value) })}
                    disabled={!policyState.isBonusFixedAmount}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-teal-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-900 dark:text-white">
                  <input
                    type="radio"
                    name="bonusType"
                    checked={!policyState.isBonusFixedAmount}
                    onChange={() => setPolicyState({ ...policyState, isBonusFixedAmount: false })}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>{isBangla ? "মূল বেতনের শতকরা হার (Percentage of Basic %)" : "Percentage of Basic Salary (%)"}</span>
                </label>
                <div className="pl-6">
                  <span className="text-[11px] text-slate-500 block mb-1">
                    {isBangla ? "শতকরা হার (যেমন ৫০% বা ১০০%):" : "Percentage rate (e.g. 50% or 100%):"}
                  </span>
                  <input
                    type="number"
                    value={policyState.percentageBonusRate}
                    onChange={(e) => setPolicyState({ ...policyState, percentageBonusRate: Number(e.target.value) })}
                    disabled={policyState.isBonusFixedAmount}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-teal-500 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 text-xs font-bold">
                  {isBangla ? "সর্বোচ্চ বোনাস সীমা (Maximum Bonus Cap ৳)" : "Maximum Bonus Cap (৳)"}
                </label>
                <input
                  type="number"
                  value={policyState.bonusMaxCap}
                  onChange={(e) => setPolicyState({ ...policyState, bonusMaxCap: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 text-xs font-bold">
                  {isBangla ? "কার্যকরী বছর (Effective Year)" : "Effective Year"}
                </label>
                <input
                  type="number"
                  value={policyState.effectiveYear}
                  onChange={(e) => setPolicyState({ ...policyState, effectiveYear: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Field Staff Penalty Exemption & Fixed Salary Guarantees */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isBangla ? "মাঠ পর্যায়ের কর্মী ও ফিক্সড স্যালারি সুরক্ষা নীতিমালা" : "Field Staff Tardiness Exemption & Salary Protection"}
              </h3>
            </div>

            <div className="space-y-3">
              {/* Field staff exemption toggle */}
              <div
                onClick={() =>
                  setPolicyState({
                    ...policyState,
                    exemptFieldStaffFromPenalty: !policyState.exemptFieldStaffFromPenalty,
                  })
                }
                className="p-4 rounded-xl border border-teal-500/30 bg-teal-500/10 flex items-center justify-between cursor-pointer"
              >
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>
                      {isBangla
                        ? "ফিল্ড কর্মী ও ভলান্টিয়ারদের ৯টা-৫টার লেট ফাইন সম্পূর্ণ মওকুফ (অব্যাহতি)"
                        : "Exempt Field Staff & Volunteers from Standard 9-5 Tardiness Penalty"}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    {isBangla
                      ? "মোহাম্মদ ইব্রাহিম হোসেন মহোদয়ের নির্দেশ অনুযায়ী: যারা ফিল্ডে বা দূরবর্তী প্রজেক্টে কাজ করেন তাদের জন্য সকাল ৯টা-৫টা বাধ্যতামূলক নয়, কোনো জরিমানা কাটা হবে না।"
                      : "Staff on field operations have flexible schedules and are guaranteed zero tardiness deductions."}
                  </p>
                </div>

                <div
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                    policyState.exemptFieldStaffFromPenalty ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      policyState.exemptFieldStaffFromPenalty ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </div>

              {/* Fixed Salary staff guarantee */}
              <div
                onClick={() =>
                  setPolicyState({
                    ...policyState,
                    fixedSalaryStaffNoDeductions: !policyState.fixedSalaryStaffNoDeductions,
                  })
                }
                className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 flex items-center justify-between cursor-pointer"
              >
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>
                      {isBangla
                        ? "ফিক্সড স্যালারি কর্মীদের বেতন থেকে কোনো কর্তন না করার নীতি"
                        : "Fixed Salary Staff No-Deduction Guarantee"}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    {isBangla
                      ? "ফিক্সড বেতনের কর্মকর্তাদের মাসিক বেতন চুক্তি মোতাবেক অক্ষুণ্ণ থাকবে, কোনো অযাচিত ডিডাকশন হবে না।"
                      : "Personnel on fixed contractual compensation will receive full agreed salary without hourly deductions."}
                  </p>
                </div>

                <div
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                    policyState.fixedSalaryStaffNoDeductions ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      policyState.fixedSalaryStaffNoDeductions ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isBangla ? "নীতিমালা নিশ্চিত করুন ও সেভ করুন" : "Confirm & Save Policies"}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: EXEMPT STAFF CHECKLIST */}
      {activeTab === "EXEMPT_STAFF" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isBangla ? "কর্মকর্তাদের ফিল্ড অব্যাহতি ও ফিক্সড স্যালারি স্ট্যাটাস" : "Staff Penalty Exemption & Salary Type Matrix"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBangla
                ? "এখানে প্রতিটি কর্মীর জন্য এককভাবে জরিমানা অব্যাহতি (Penalty Exemption) এবং ফিক্সড স্যালারি স্ট্যাটাস পরিবর্তন করতে পারবেন।"
                : "Granularly toggle tardiness fine exemption and fixed salary structure per staff member."}
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
            {employees.map((emp) => {
              const isExempt = emp.isAttendancePenaltyExempt;
              const isFixed = emp.salaryStructureType === "FIXED";

              return (
                <div key={emp.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatarUrl}
                      alt={emp.fullName}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{emp.fullName}</span>
                        {emp.isSuperAdmin && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold">
                            সুপার অ্যাডমিন
                          </span>
                        )}
                      </div>
                      <div className="text-teal-700 dark:text-teal-400 text-[11px]">
                        {emp.designationTitle} • {emp.departmentName} ({emp.branchName})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Exemption Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStaffExemption(emp)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        isExempt
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isExempt ? (isBangla ? "জরিমানা অব্যাহতিপ্রাপ্ত" : "Fine Exempt") : (isBangla ? "সাধারণ নিয়ম" : "Standard Rules")}</span>
                    </button>

                    {/* Fixed Salary Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStaffFixedSalary(emp)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        isFixed
                          ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{isFixed ? (isBangla ? "ফিক্সড স্যালারি" : "Fixed Salary") : (isBangla ? "ঘণ্টাভিত্তিক" : "Hourly")}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
