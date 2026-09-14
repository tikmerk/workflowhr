import React, { useState, useMemo } from "react";
import {
  Layers,
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  CreditCard,
  Briefcase,
  ChevronRight,
  Sparkles,
  Eye,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  UserCheck,
  Search,
  X,
  TrendingUp,
  Award,
  DollarSign,
  AlertTriangle,
  Landmark,
  PieChart,
} from "lucide-react";
import { Department, Designation, Employee, TreasuryAccount } from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { INITIAL_TREASURY_ACCOUNTS } from "../../data/mockDatabase";
import { BudgetAllocationSection } from "../organization/BudgetAllocationSection";

interface DepartmentsDesignationsViewProps {
  departments: Department[];
  designations: Designation[];
  employees?: Employee[];
  treasuryAccounts?: TreasuryAccount[];
  onAddDepartment: (dept: Department) => void;
  onUpdateDepartment?: (dept: Department) => void;
  onDeleteDepartment?: (id: string) => void;
  onAddDesignation: (desig: Designation) => void;
  onUpdateDesignation?: (desig: Designation) => void;
  onDeleteDesignation?: (id: string) => void;
  onViewEmployee?: (emp: Employee) => void;
  onEditEmployee?: (emp: Employee) => void;
  onUpdateEmployee?: (emp: Employee) => void;
  onUpdateTreasuryAccounts?: (accounts: TreasuryAccount[]) => void;
}

export const DepartmentsDesignationsView: React.FC<DepartmentsDesignationsViewProps> = ({
  departments,
  designations,
  employees = [],
  treasuryAccounts = INITIAL_TREASURY_ACCOUNTS,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  onAddDesignation,
  onUpdateDesignation,
  onDeleteDesignation,
  onViewEmployee,
  onEditEmployee,
  onUpdateEmployee,
  onUpdateTreasuryAccounts,
}) => {
  const { isBangla } = useThemeLanguage();

  const [activeTab, setActiveTab] = useState<"DEPARTMENTS" | "DESIGNATIONS" | "BUDGET_TREASURY">("DEPARTMENTS");
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showDesigModal, setShowDesigModal] = useState(false);

  // Edit Modals
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editingDesig, setEditingDesig] = useState<Designation | null>(null);

  // Department Members Modal
  const [selectedDeptForMembers, setSelectedDeptForMembers] = useState<Department | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");

  // Designation Members Modal
  const [selectedDesigForMembers, setSelectedDesigForMembers] = useState<Designation | null>(null);
  const [desigMemberSearchTerm, setDesigMemberSearchTerm] = useState("");

  // New Department Form
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDeptDesc, setNewDeptDesc] = useState("");
  const [newDeptBudget, setNewDeptBudget] = useState(1500000);
  const [newDeptFundingSourceId, setNewDeptFundingSourceId] = useState(treasuryAccounts[0]?.id || "");

  // Edit Department Form
  const [editDeptName, setEditDeptName] = useState("");
  const [editDeptCode, setEditDeptCode] = useState("");
  const [editDeptDesc, setEditDeptDesc] = useState("");
  const [editDeptBudget, setEditDeptBudget] = useState(1500000);
  const [editDeptFundingSourceId, setEditDeptFundingSourceId] = useState("");

  // New Designation Form
  const [newDesigTitle, setNewDesigTitle] = useState("");
  const [newDesigCode, setNewDesigCode] = useState("");
  const [newDesigDeptId, setNewDesigDeptId] = useState(departments[0]?.id || "");
  const [newDesigLevel, setNewDesigLevel] = useState<any>("SENIOR");
  const [newDesigMinSal, setNewDesigMinSal] = useState(70000);
  const [newDesigMaxSal, setNewDesigMaxSal] = useState(120000);
  const [newDesigDesc, setNewDesigDesc] = useState("");

  // Edit Designation Form
  const [editDesigTitle, setEditDesigTitle] = useState("");
  const [editDesigCode, setEditDesigCode] = useState("");
  const [editDesigDeptId, setEditDesigDeptId] = useState("");
  const [editDesigLevel, setEditDesigLevel] = useState<any>("SENIOR");
  const [editDesigMinSal, setEditDesigMinSal] = useState(70000);
  const [editDesigMaxSal, setEditDesigMaxSal] = useState(120000);
  const [editDesigDesc, setEditDesigDesc] = useState("");

  // In-App Safe Deletion Confirmation states (No window.confirm to avoid iframe blocks)
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [desigToDelete, setDesigToDelete] = useState<Designation | null>(null);

  // Department helper: get members for any department
  const getDeptEmployees = (dept: Department) => {
    return employees.filter((e) => {
      const matchId = e.departmentId === dept.id;
      const matchName =
        Boolean(dept.name && e.departmentName) &&
        e.departmentName.trim().toLowerCase() === dept.name.trim().toLowerCase();
      const matchCode =
        Boolean(dept.code) &&
        ((e.departmentId && e.departmentId.trim().toUpperCase() === dept.code.trim().toUpperCase()) ||
          (e.departmentName && e.departmentName.trim().toUpperCase() === dept.code.trim().toUpperCase()));
      const matchAdditional = Boolean(
        e.additionalDepartments &&
        e.additionalDepartments.some(
          (ad) =>
            ad.trim().toLowerCase() === dept.name.trim().toLowerCase() ||
            (dept.code && ad.trim().toUpperCase() === dept.code.trim().toUpperCase())
        )
      );

      return matchId || matchName || matchCode || matchAdditional;
    });
  };

  // Designation helper: get employees for any designation
  const getDesigEmployees = (desig: Designation) => {
    return employees.filter((e) => {
      const matchId = e.designationId === desig.id;
      const matchTitle =
        Boolean(desig.title && e.designationTitle) &&
        e.designationTitle.trim().toLowerCase() === desig.title.trim().toLowerCase();
      const matchCode =
        Boolean(desig.code) &&
        Boolean(e.designationId && e.designationId.trim().toUpperCase() === desig.code.trim().toUpperCase());
      const matchAdditional = Boolean(
        e.additionalDesignations &&
        e.additionalDesignations.some(
          (ades) =>
            ades.trim().toLowerCase() === desig.title.trim().toLowerCase() ||
            (desig.code && ades.trim().toUpperCase() === desig.code.trim().toUpperCase())
        )
      );

      return matchId || matchTitle || matchCode || matchAdditional;
    });
  };

  // Filtered members in department modal
  const deptMembers = useMemo(() => {
    if (!selectedDeptForMembers) return [];
    const base = getDeptEmployees(selectedDeptForMembers);
    if (!memberSearchTerm) return base;
    return base.filter(
      (e) =>
        e.fullName.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        e.employeeCode.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        e.designationTitle.toLowerCase().includes(memberSearchTerm.toLowerCase())
    );
  }, [selectedDeptForMembers, employees, memberSearchTerm]);

  // Filtered members in designation modal
  const desigMembers = useMemo(() => {
    if (!selectedDesigForMembers) return [];
    const base = getDesigEmployees(selectedDesigForMembers);
    if (!desigMemberSearchTerm) return base;
    return base.filter(
      (e) =>
        e.fullName.toLowerCase().includes(desigMemberSearchTerm.toLowerCase()) ||
        e.employeeCode.toLowerCase().includes(desigMemberSearchTerm.toLowerCase()) ||
        e.departmentName.toLowerCase().includes(desigMemberSearchTerm.toLowerCase()) ||
        e.branchName?.toLowerCase().includes(desigMemberSearchTerm.toLowerCase())
    );
  }, [selectedDesigForMembers, employees, desigMemberSearchTerm]);

  // Overview stats for designations
  const desigStats = useMemo(() => {
    const totalDesigs = designations.length;
    const totalAssignedStaff = employees.filter((e) => Boolean(e.designationTitle || e.designationId)).length;
    const maxSalaryBand = Math.max(...designations.map((d) => d.maxSalary || 0), 0);
    const executiveRoles = designations.filter(
      (d) => d.level === "EXECUTIVE" || d.level === "LEAD"
    ).length;

    return { totalDesigs, totalAssignedStaff, maxSalaryBand, executiveRoles };
  }, [designations, employees]);

  // Handle Add Department
  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fundingAccount = treasuryAccounts.find((a) => a.id === newDeptFundingSourceId) || treasuryAccounts[0];
    onAddDepartment({
      id: `dept-${Date.now()}`,
      name: newDeptName,
      code: newDeptCode.toUpperCase(),
      description: newDeptDesc || "Enterprise operations & governance",
      totalEmployees: 0,
      budgetAllocated: newDeptBudget,
      fundingSourceId: fundingAccount?.id,
      fundingSourceName: fundingAccount ? `${fundingAccount.bankName} (${fundingAccount.accountName})` : undefined,
      lastAllocatedAt: new Date().toISOString().split("T")[0],
      allocatedBy: "Super Admin (Finance Directorate)",
    });
    setShowDeptModal(false);
    setNewDeptName("");
    setNewDeptCode("");
    setNewDeptDesc("");
  };

  // Open Edit Department Modal
  const openEditDeptModal = (dept: Department) => {
    setEditingDept(dept);
    setEditDeptName(dept.name);
    setEditDeptCode(dept.code || "");
    setEditDeptDesc(dept.description || "");
    setEditDeptBudget(dept.budgetAllocated || 1500000);
    setEditDeptFundingSourceId(dept.fundingSourceId || treasuryAccounts[0]?.id || "");
  };

  // Handle Edit Department Submit
  const handleEditDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;

    const fundingAccount = treasuryAccounts.find((a) => a.id === editDeptFundingSourceId) || treasuryAccounts[0];

    const updated: Department = {
      ...editingDept,
      name: editDeptName,
      code: editDeptCode.toUpperCase(),
      description: editDeptDesc,
      budgetAllocated: Number(editDeptBudget),
      fundingSourceId: fundingAccount?.id,
      fundingSourceName: fundingAccount ? `${fundingAccount.bankName} (${fundingAccount.accountName})` : undefined,
      lastAllocatedAt: new Date().toISOString().split("T")[0],
      allocatedBy: editingDept.allocatedBy || "Super Admin (Finance Directorate)",
    };

    if (onUpdateDepartment) {
      onUpdateDepartment(updated);
    }
    setEditingDept(null);
  };

  // Handle Delete Department with in-app confirmation modal
  const handleDeleteDept = (dept: Department) => {
    setDeptToDelete(dept);
  };

  const confirmDeleteDept = () => {
    if (deptToDelete && onDeleteDepartment) {
      onDeleteDepartment(deptToDelete.id);
    }
    setDeptToDelete(null);
  };

  // Handle Add Designation
  const handleDesigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dept = departments.find((d) => d.id === newDesigDeptId) || departments[0];
    onAddDesignation({
      id: `desig-${Date.now()}`,
      title: newDesigTitle,
      code: newDesigCode.toUpperCase(),
      departmentId: dept.id,
      departmentName: dept.name,
      level: newDesigLevel,
      minSalary: newDesigMinSal,
      maxSalary: newDesigMaxSal,
      description: newDesigDesc || "Key role responsibilities",
    });
    setShowDesigModal(false);
    setNewDesigTitle("");
    setNewDesigCode("");
  };

  // Open Edit Designation Modal
  const openEditDesigModal = (desig: Designation) => {
    setEditingDesig(desig);
    setEditDesigTitle(desig.title);
    setEditDesigCode(desig.code || "");
    setEditDesigDeptId(desig.departmentId || departments[0]?.id || "");
    setEditDesigLevel(desig.level || "SENIOR");
    setEditDesigMinSal(desig.minSalary || 70000);
    setEditDesigMaxSal(desig.maxSalary || 120000);
    setEditDesigDesc(desig.description || "");
  };

  // Handle Edit Designation Submit
  const handleEditDesigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDesig) return;

    const dept = departments.find((d) => d.id === editDesigDeptId) || {
      id: editingDesig.departmentId,
      name: editingDesig.departmentName,
    };

    const updated: Designation = {
      ...editingDesig,
      title: editDesigTitle,
      code: editDesigCode.toUpperCase(),
      departmentId: dept.id,
      departmentName: dept.name,
      level: editDesigLevel,
      minSalary: Number(editDesigMinSal),
      maxSalary: Number(editDesigMaxSal),
      description: editDesigDesc,
    };

    if (onUpdateDesignation) {
      onUpdateDesignation(updated);
    }
    setEditingDesig(null);
  };

  // Handle Delete Designation with in-app confirmation modal
  const handleDeleteDesig = (desig: Designation) => {
    setDesigToDelete(desig);
  };

  const confirmDeleteDesig = () => {
    if (desigToDelete && onDeleteDesignation) {
      onDeleteDesignation(desigToDelete.id);
    }
    setDesigToDelete(null);
  };

  return (
    <div id="departments-designations-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Tab Switcher */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>{isBangla ? "সাংগঠনিক কাঠামো ও পদবি" : "Organizational Hierarchy"}</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            {isBangla ? "ডিপার্টমেন্ট, পদবি ও মেম্বার্স ম্যানেজমেন্ট" : "Department Roster & Job Architecture"}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {isBangla
              ? "ডিপার্টমেন্ট ও পদবি অনুযায়ী কর্মরত কর্মীদের তালিকা দেখুন, সম্পাদনা করুন এবং বাজেট ও পে-স্কেল কনফিগার করুন"
              : "Inspect department & designation rosters, edit structure, and calibrate pay scales and budgets"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab("DEPARTMENTS")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "DEPARTMENTS"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {isBangla ? `ডিপার্টমেন্ট (${departments.length})` : `Departments (${departments.length})`}
            </button>
            <button
              onClick={() => setActiveTab("DESIGNATIONS")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "DESIGNATIONS"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {isBangla ? `পদবি ও পে-স্কেল (${designations.length})` : `Designations (${designations.length})`}
            </button>
            <button
              onClick={() => setActiveTab("BUDGET_TREASURY")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "BUDGET_TREASURY"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>{isBangla ? `বাজেট ও অ্যাকাউন্টস (${treasuryAccounts.length})` : `Budget & Accounts (${treasuryAccounts.length})`}</span>
            </button>
          </div>

          {activeTab === "DEPARTMENTS" && (
            <button
              onClick={() => setShowDeptModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isBangla ? "+ ডিপার্টমেন্ট যোগ করুন" : "+ Add Department"}</span>
            </button>
          )}
          {activeTab === "DESIGNATIONS" && (
            <button
              onClick={() => setShowDesigModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isBangla ? "+ পদবি তৈরি করুন" : "+ Add Designation"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Departments Tab Content */}
      {activeTab === "DEPARTMENTS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => {
            const actualStaffList = getDeptEmployees(dept);
            const actualStaffCount = actualStaffList.length;

            return (
              <div
                key={dept.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold font-mono text-teal-700 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                        {dept.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{dept.name}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      {onUpdateDepartment && (
                        <button
                          type="button"
                          onClick={() => openEditDeptModal(dept)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-teal-500/20 dark:bg-slate-800 dark:hover:bg-teal-500/30 text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 transition-colors cursor-pointer"
                          title={isBangla ? "ডিপার্টমেন্ট এডিট করুন" : "Edit Department"}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeleteDepartment && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDept(dept)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-500/20 dark:bg-slate-800 dark:hover:bg-rose-500/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title={isBangla ? "ডিপার্টমেন্ট মুছে ফেলুন" : "Delete Department"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{dept.description}</p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-transparent">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                        {isBangla ? "মোট কর্মরত কর্মী" : "Assigned Staff"}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        <span>{actualStaffCount} {isBangla ? "জন" : "Members"}</span>
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-transparent">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                        {isBangla ? "বাজেট বরাদ্দ" : "Budget Allocated"}
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs font-mono mt-0.5 block">
                        ৳{((dept.budgetAllocated ?? 1500000) / 100000).toFixed(1)}L BDT
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block truncate mt-0.5" title={dept.fundingSourceName || "Central Operating Treasury"}>
                        {dept.fundingSourceName || "Central Operating Treasury"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* View Members Button */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDeptForMembers(dept);
                      setMemberSearchTerm("");
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>{isBangla ? `সদস্যদের তালিকা দেখুন (${actualStaffCount} জন) ➔` : `View Members (${actualStaffCount}) ➔`}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Budget & Treasury Accounts Tab Content */}
      {activeTab === "BUDGET_TREASURY" && (
        <BudgetAllocationSection
          departments={departments}
          treasuryAccounts={treasuryAccounts}
          onUpdateDepartment={onUpdateDepartment}
          onUpdateTreasuryAccounts={onUpdateTreasuryAccounts}
        />
      )}

      {/* Designations Tab Content with Requested Top Dashboard Overview */}
      {activeTab === "DESIGNATIONS" && (
        <div className="space-y-6">
          {/* Top Dashboard Overview Field for Designations */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>{isBangla ? "পদবি ও জনবল কাঠামো ড্যাশবোর্ড ওভারভিউ" : "Designation & Job Architecture Overview"}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBangla
                    ? "কোম্পানির মোট পদবি, কর্মরত জনবল বণ্টন এবং সর্বোচ্চ বেতন সীমার সংক্ষিপ্ত পরিসংখ্যান"
                    : "Executive summary of designations, assigned workforce headcount, and salary tiers"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  {isBangla ? "মোট পদবি সংখ্যা" : "Total Designations"}
                </span>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-teal-600" />
                  <span>{desigStats.totalDesigs}</span>
                  <span className="text-xs text-slate-400 font-normal">{isBangla ? "টি" : "Roles"}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  {isBangla ? "পদবিভুক্ত মোট কর্মী" : "Assigned Employees"}
                </span>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{desigStats.totalAssignedStaff}</span>
                  <span className="text-xs text-slate-400 font-normal">{isBangla ? "জন কর্মরত" : "Staff"}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  {isBangla ? "শীর্ষ পে-স্কেল সর্বোচ্চ বেতন" : "Top Salary Tier Band"}
                </span>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1 flex items-center gap-1">
                  <span className="text-teal-600 text-sm">৳</span>
                  <span>{desigStats.maxSalaryBand.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  {isBangla ? "লিডারশিপ ও এক্সিকিউটিভ রোল" : "Lead & Executive Roles"}
                </span>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>{desigStats.executiveRoles}</span>
                  <span className="text-xs text-slate-400 font-normal">{isBangla ? "টি পদবি" : "Senior Roles"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Designations Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {designations.map((desig) => {
              const actualStaffList = getDesigEmployees(desig);
              const actualStaffCount = actualStaffList.length;

              return (
                <div
                  key={desig.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold font-mono text-blue-700 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                            {desig.code}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {desig.level}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{desig.title}</h3>
                        <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">{desig.departmentName}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {onUpdateDesignation && (
                          <button
                            type="button"
                            onClick={() => openEditDesigModal(desig)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-teal-500/20 dark:bg-slate-800 dark:hover:bg-teal-500/30 text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 transition-colors cursor-pointer"
                            title={isBangla ? "পদবি এডিট করুন" : "Edit Designation"}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteDesignation && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDesig(desig)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-500/20 dark:bg-slate-800 dark:hover:bg-rose-500/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title={isBangla ? "পদবি মুছে ফেলুন" : "Delete Designation"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Active Employee Counter on Designation Card */}
                    <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {isBangla ? "বর্তমানে কর্মরত:" : "Currently Assigned:"}
                      </span>
                      <span className="font-bold text-teal-800 dark:text-teal-300 text-xs flex items-center gap-1 font-mono">
                        <Users className="w-3.5 h-3.5" />
                        <span>{actualStaffCount} {isBangla ? "জন কর্মী" : "Staff"}</span>
                      </span>
                    </div>

                    {/* Salary Band Range */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1 text-xs">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                        {isBangla ? "বেতন কাঠামো রেঞ্জ (Salary Band):" : "Salary Band Range:"}
                      </span>
                      <div className="flex justify-between font-mono font-bold text-slate-900 dark:text-white">
                        <span>৳{(desig.minSalary ?? 0).toLocaleString()}</span>
                        <span className="text-slate-400 dark:text-slate-500">to</span>
                        <span className="text-emerald-600 dark:text-emerald-400">৳{(desig.maxSalary ?? 0).toLocaleString()} BDT</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{desig.description}</p>
                  </div>

                  {/* View Employees holding this designation */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDesigForMembers(desig);
                        setDesigMemberSearchTerm("");
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-teal-500/15 dark:bg-slate-800 dark:hover:bg-teal-500/20 text-slate-800 dark:text-slate-200 hover:text-teal-800 dark:hover:text-teal-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span>
                        {isBangla
                          ? `এই পদবির কর্মীদের তালিকা দেখুন (${actualStaffCount} জন) ➔`
                          : `View Employees in this Role (${actualStaffCount}) ➔`}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: View Department Members Roster */}
      {selectedDeptForMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-3xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                    {selectedDeptForMembers.code}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <span>{selectedDeptForMembers.name} - {isBangla ? "কর্মকর্তা-কর্মচারী তালিকা" : "Staff Roster"}</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBangla
                    ? `এই ডিপার্টমেন্টের অধীনে মোট ${deptMembers.length} জন কর্মচারী কর্মরত আছেন`
                    : `Currently ${deptMembers.length} employees registered under this department`}
                </p>
              </div>

              <button
                onClick={() => setSelectedDeptForMembers(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search within department */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                placeholder={isBangla ? "নাম, পদবি বা এমপ্লয়ি কোড দিয়ে খুঁজুন..." : "Filter by name, designation, or ID..."}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Department Members List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1 max-h-[55vh] pr-1">
              {deptMembers.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Users className="w-10 h-10 mx-auto opacity-30 text-teal-500 mb-2" />
                  <p className="font-bold text-sm text-slate-600 dark:text-slate-400">
                    {isBangla ? "এই ডিপার্টমেন্টে কোনো কর্মী পাওয়া যায়নি" : "No employees found in this department"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {isBangla ? "এমপ্লয়ি ডিরেক্টরি থেকে কর্মীদের ডিপার্টমেন্ট অ্যাসাইন করুন" : "Assign employees from the Employee Directory"}
                  </p>
                </div>
              ) : (
                deptMembers.map((emp) => (
                  <div
                    key={emp.id}
                    className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatarUrl}
                        alt={emp.fullName}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center flex-wrap gap-1.5">
                          <span>{emp.fullName}</span>
                          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                            ({emp.employeeCode})
                          </span>
                          {emp.isSuperAdmin && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300">
                              {isBangla ? "সুপার অ্যাডমিন" : "Super Admin"}
                            </span>
                          )}
                          {emp.isCeoOrOwner && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                              {isBangla ? "সিইও / প্রধান" : "CEO"}
                            </span>
                          )}
                          {emp.hideSalaryFromSelf && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-500/20 text-slate-600 dark:text-slate-400">
                              {isBangla ? "বেতন গোপন" : "Salary Hidden"}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-teal-700 dark:text-teal-400 font-semibold">
                          {emp.designationTitle}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{emp.branchName || "Main Office"}</span>
                          <span>•</span>
                          <span>{emp.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        {emp.status}
                      </span>
                      {onViewEmployee && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDeptForMembers(null);
                            onViewEmployee(emp);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{isBangla ? "প্রোফাইল" : "View"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDeptForMembers(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
              >
                {isBangla ? "বন্ধ করুন" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Designation Members Roster (As requested: see who holds this designation) */}
      {selectedDesigForMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-3xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{selectedDesigForMembers.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded font-mono bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                      {selectedDesigForMembers.code}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isBangla
                      ? `এই পদবিতে কর্মরত মোট কর্মী: ${desigMembers.length} জন | ${selectedDesigForMembers.departmentName}`
                      : `Currently ${desigMembers.length} employees assigned to this role | ${selectedDesigForMembers.departmentName}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDesigForMembers(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search within designation members */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={desigMemberSearchTerm}
                onChange={(e) => setDesigMemberSearchTerm(e.target.value)}
                placeholder={isBangla ? "নাম, ব্রাঞ্চ বা এমপ্লয়ি কোড দিয়ে খুঁজুন..." : "Search by name, branch, or ID..."}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Designation Members List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1 max-h-[55vh] pr-1">
              {desigMembers.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Users className="w-10 h-10 mx-auto opacity-30 text-teal-500 mb-2" />
                  <p className="font-bold text-sm text-slate-600 dark:text-slate-400">
                    {isBangla ? "এই পদবিতে বর্তমানে কোনো কর্মী নিযুক্ত নেই" : "No employees assigned to this designation"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {isBangla ? "এমপ্লয়ি ডিরেক্টরি থেকে নতুন কর্মীকে এই পদবিতে যুক্ত করতে পারেন" : "Assign employees to this designation from Directory"}
                  </p>
                </div>
              ) : (
                desigMembers.map((emp) => (
                  <div
                    key={emp.id}
                    className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatarUrl}
                        alt={emp.fullName}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center flex-wrap gap-1.5">
                          <span>{emp.fullName}</span>
                          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                            ({emp.employeeCode})
                          </span>
                          {emp.isSuperAdmin && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300">
                              {isBangla ? "সুপার অ্যাডমিন" : "Super Admin"}
                            </span>
                          )}
                          {emp.isCeoOrOwner && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                              {isBangla ? "সিইও / প্রধান" : "CEO"}
                            </span>
                          )}
                          {emp.hideSalaryFromSelf && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-500/20 text-slate-600 dark:text-slate-400">
                              {isBangla ? "বেতন গোপন" : "Salary Hidden"}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-teal-700 dark:text-teal-400 font-semibold">
                          {emp.branchName || "Main Campus"} • {emp.departmentName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{emp.phone}</span>
                          <span>•</span>
                          <span>{emp.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        {emp.status}
                      </span>
                      {onViewEmployee && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDesigForMembers(null);
                            onViewEmployee(emp);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{isBangla ? "প্রোফাইল" : "View"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDesigForMembers(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
              >
                {isBangla ? "বন্ধ করুন" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Department */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>{isBangla ? "ডিপার্টমেন্টের তথ্য সম্পাদনা করুন" : "Edit Department"}</span>
              </h3>
              <button
                onClick={() => setEditingDept(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditDeptSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {isBangla ? "ডিপার্টমেন্টের নাম *" : "Department Name *"}
                </label>
                <input
                  type="text"
                  value={editDeptName}
                  onChange={(e) => setEditDeptName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {isBangla ? "ডিপার্টমেন্ট কোড *" : "Department Code *"}
                </label>
                <input
                  type="text"
                  value={editDeptCode}
                  onChange={(e) => setEditDeptCode(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white uppercase font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {isBangla ? "বার্ষিক বাজেট বরাদ্দ (BDT ৳)" : "Allocated Budget (BDT ৳)"}
                </label>
                <input
                  type="number"
                  value={editDeptBudget}
                  onChange={(e) => setEditDeptBudget(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {isBangla ? "তহবিল উৎস ব্যাংক অ্যাকাউন্ট *" : "Funding Treasury Account *"}
                </label>
                <select
                  value={editDeptFundingSourceId}
                  onChange={(e) => setEditDeptFundingSourceId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                >
                  {treasuryAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} - {acc.accountName} (তহবিল: ৳{(acc.totalFund / 100000).toFixed(1)}L)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {isBangla ? "বিবরণ ও দায়িত্ব" : "Description & Scope"}
                </label>
                <textarea
                  rows={3}
                  value={editDeptDesc}
                  onChange={(e) => setEditDeptDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold cursor-pointer shadow-sm"
                >
                  {isBangla ? "আপডেট সংরক্ষণ করুন" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Designation */}
      {editingDesig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>{isBangla ? "পদবির তথ্য ও পে-স্কেল সম্পাদনা" : "Edit Designation & Pay Scale"}</span>
              </h3>
              <button
                onClick={() => setEditingDesig(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditDesigSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {isBangla ? "পদবির নাম *" : "Designation Title *"}
                </label>
                <input
                  type="text"
                  value={editDesigTitle}
                  onChange={(e) => setEditDesigTitle(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "পদবি কোড" : "Role Code"}
                  </label>
                  <input
                    type="text"
                    value={editDesigCode}
                    onChange={(e) => setEditDesigCode(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white uppercase font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "হায়ারার্কি লেভেল" : "Seniority Level"}
                  </label>
                  <select
                    value={editDesigLevel}
                    onChange={(e) => setEditDesigLevel(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="ENTRY">Entry Level</option>
                    <option value="MID">Mid Level</option>
                    <option value="SENIOR">Senior Level</option>
                    <option value="LEAD">Lead / Specialist</option>
                    <option value="EXECUTIVE">Executive / C-Level</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {isBangla ? "ডিপার্টমেন্ট" : "Department"}
                </label>
                <select
                  value={editDesigDeptId}
                  onChange={(e) => setEditDesigDeptId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "সর্বনিম্ন বেতন (৳)" : "Min Salary (৳)"}
                  </label>
                  <input
                    type="number"
                    value={editDesigMinSal}
                    onChange={(e) => setEditDesigMinSal(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "সর্বোচ্চ বেতন (৳)" : "Max Salary (৳)"}
                  </label>
                  <input
                    type="number"
                    value={editDesigMaxSal}
                    onChange={(e) => setEditDesigMaxSal(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {isBangla ? "বিবরণ" : "Description"}
                </label>
                <textarea
                  rows={2}
                  value={editDesigDesc}
                  onChange={(e) => setEditDesigDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDesig(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold cursor-pointer shadow-sm"
                >
                  {isBangla ? "আপডেট সংরক্ষণ করুন" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Department */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>{isBangla ? "নতুন ডিপার্টমেন্ট তৈরি করুন" : "Add Department"}</span>
              </h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeptSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "ডিপার্টমেন্টের নাম *" : "Department Name *"}</label>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence & Data Science"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "ডিপার্টমেন্ট কোড *" : "Department Code *"}</label>
                <input
                  type="text"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  placeholder="e.g. AI-DATA"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white uppercase font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "বার্ষিক বাজেট বরাদ্দ (BDT ৳)" : "Allocated Budget (BDT ৳)"}</label>
                <input
                  type="number"
                  value={newDeptBudget}
                  onChange={(e) => setNewDeptBudget(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "তহবিল উৎস ব্যাংক অ্যাকাউন্ট *" : "Funding Treasury Account *"}</label>
                <select
                  value={newDeptFundingSourceId}
                  onChange={(e) => setNewDeptFundingSourceId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                >
                  {treasuryAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} - {acc.accountName} (তহবিল: ৳{(acc.totalFund / 100000).toFixed(1)}L)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "বিবরণ ও দায়িত্ব" : "Description & Scope"}</label>
                <textarea
                  rows={2}
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  placeholder="Department operational charter..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold cursor-pointer shadow-sm"
                >
                  {isBangla ? "সংরক্ষণ করুন" : "Save Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Designation */}
      {showDesigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>{isBangla ? "নতুন পদবি ও পে-স্কেল তৈরি" : "Add Designation"}</span>
              </h3>
              <button onClick={() => setShowDesigModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDesigSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "পদবির নাম *" : "Designation Title *"}</label>
                <input
                  type="text"
                  value={newDesigTitle}
                  onChange={(e) => setNewDesigTitle(e.target.value)}
                  placeholder="e.g. Lead Machine Learning Engineer"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "পদবি কোড" : "Role Code"}</label>
                  <input
                    type="text"
                    value={newDesigCode}
                    onChange={(e) => setNewDesigCode(e.target.value)}
                    placeholder="e.g. LMLE-01"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white uppercase font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "হায়ারার্কি লেভেল" : "Seniority Level"}</label>
                  <select
                    value={newDesigLevel}
                    onChange={(e) => setNewDesigLevel(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="ENTRY">Entry Level</option>
                    <option value="MID">Mid Level</option>
                    <option value="SENIOR">Senior Level</option>
                    <option value="LEAD">Lead / Specialist</option>
                    <option value="EXECUTIVE">Executive / C-Level</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "ডিপার্টমেন্ট" : "Department"}</label>
                <select
                  value={newDesigDeptId}
                  onChange={(e) => setNewDesigDeptId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "সর্বনিম্ন বেতন (৳)" : "Min Salary (৳)"}</label>
                  <input
                    type="number"
                    value={newDesigMinSal}
                    onChange={(e) => setNewDesigMinSal(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "সর্বোচ্চ বেতন (৳)" : "Max Salary (৳)"}</label>
                  <input
                    type="number"
                    value={newDesigMaxSal}
                    onChange={(e) => setNewDesigMaxSal(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDesigModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold cursor-pointer shadow-sm"
                >
                  {isBangla ? "পদবি যুক্ত করুন" : "Save Designation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Deleting Department */}
      {deptToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isBangla ? "ডিপার্টমেন্ট মুছে ফেলার নিশ্চিতকরণ" : "Delete Department Confirmation"}
              </h3>
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                "{deptToDelete.name}" ({deptToDelete.code})
              </p>
            </div>

            {getDeptEmployees(deptToDelete).length > 0 ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <span>⚠️ সতর্কতা:</span>
                </p>
                <p>
                  {isBangla
                    ? `এই ডিপার্টমেন্টে বর্তমানে ${getDeptEmployees(deptToDelete).length} জন কর্মকর্তা-কর্মচারী নিযুক্ত আছেন। মুছে ফেললে তাদের বিভাগীয় অ্যাসাইনমেন্ট আনঅ্যাসাইনড হয়ে যাবে।`
                    : `Currently ${getDeptEmployees(deptToDelete).length} employee(s) are assigned to this department.`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                {isBangla
                  ? "আপনি কি নিশ্চিত যে আপনি এই ডিপার্টমেন্টটি চিরতরে মুছে ফেলতে চান?"
                  : "Are you sure you want to permanently delete this department?"}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeptToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
              >
                {isBangla ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={confirmDeleteDept}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isBangla ? "হ্যাঁ, মুছে ফেলুন" : "Yes, Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Deleting Designation */}
      {desigToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isBangla ? "পদবি মুছে ফেলার নিশ্চিতকরণ" : "Delete Designation Confirmation"}
              </h3>
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                "{desigToDelete.title}" ({desigToDelete.code})
              </p>
            </div>

            {getDesigEmployees(desigToDelete).length > 0 ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <span>⚠️ সতর্কতা:</span>
                </p>
                <p>
                  {isBangla
                    ? `এই পদবিতে বর্তমানে ${getDesigEmployees(desigToDelete).length} জন কর্মকর্তা নিয়োজিত আছেন। মুছে ফেললে তাদের পদবি মুছে যাবে।`
                    : `Currently ${getDesigEmployees(desigToDelete).length} employee(s) hold this designation.`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                {isBangla
                  ? "আপনি কি নিশ্চিত যে আপনি এই পদবিটি চিরতরে মুছে ফেলতে চান?"
                  : "Are you sure you want to permanently delete this designation?"}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDesigToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
              >
                {isBangla ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={confirmDeleteDesig}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isBangla ? "হ্যাঁ, মুছে ফেলুন" : "Yes, Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
