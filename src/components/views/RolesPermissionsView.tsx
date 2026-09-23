import React, { useState, useEffect } from "react";
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
  HeartHandshake,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Percent,
  X,
  Check,
  Zap,
  Ban,
  ScanFace
} from "lucide-react";
import {
  RolePermissionConfig,
  PayrollPolicyConfig,
  UserRole,
  NavigationTab,
  Employee,
  CustomBonusConfig,
  BiometricKioskSettings,
  BiometricModeConfig
} from "../../types";
import { normalizeTabList, isTabAllowedInList } from "../../utils/permissions";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";

interface RolesPermissionsViewProps {
  rolePermissions: RolePermissionConfig[];
  onUpdateRolePermissions: (roles: RolePermissionConfig[]) => void;
  payrollPolicy: PayrollPolicyConfig;
  onUpdatePayrollPolicy: (policy: PayrollPolicyConfig) => void;
  employees: Employee[];
  onUpdateEmployee?: (employee: Employee) => void;
  biometricSettings?: BiometricKioskSettings;
  onUpdateBiometricSettings?: (settings: BiometricKioskSettings) => void;
}

export const RolesPermissionsView: React.FC<RolesPermissionsViewProps> = ({
  rolePermissions,
  onUpdateRolePermissions,
  payrollPolicy,
  onUpdatePayrollPolicy,
  employees,
  onUpdateEmployee,
  biometricSettings,
  onUpdateBiometricSettings,
}) => {
  const { isBangla } = useThemeLanguage();

  const [activeTab, setActiveTab] = useState<"ROLES_MATRIX" | "POLICY_CONFIG" | "EXEMPT_STAFF" | "BIOMETRIC_KIOSK_SETTINGS">("ROLES_MATRIX");

  // Local state for biometric kiosk mode settings
  const [biometricState, setBiometricState] = useState<BiometricKioskSettings>(() => {
    return biometricSettings || {
      modeAvailability: "BOTH",
      defaultMode: "AUTO_KIOSK",
    };
  });

  useEffect(() => {
    if (biometricSettings) {
      setBiometricState(biometricSettings);
    }
  }, [biometricSettings]);

  // Local state for role permissions
  const [permissionsState, setPermissionsState] = useState<RolePermissionConfig[]>(rolePermissions);
  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    const valid = rolePermissions.find((r) => r.role !== "DEPARTMENT_HEAD" && (r.role as string) !== "DEPT_HEAD");
    return valid?.role || rolePermissions[0]?.role || ("SUPER_ADMIN" as UserRole);
  });

  // Sync when prop changes
  useEffect(() => {
    setPermissionsState(rolePermissions);
    if (!rolePermissions.some((r) => r.role === selectedRole) && rolePermissions[0]) {
      setSelectedRole(rolePermissions[0].role);
    }
  }, [rolePermissions]);

  // Role CRUD Modals & Form States
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<RolePermissionConfig | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<RolePermissionConfig | null>(null);

  // New Role Form
  const [newRoleCode, setNewRoleCode] = useState("");
  const [newRoleTitleBn, setNewRoleTitleBn] = useState("");
  const [newRoleTitleEn, setNewRoleTitleEn] = useState("");
  const [newRoleDescBn, setNewRoleDescBn] = useState("");
  const [newRoleCanAccessAllBranches, setNewRoleCanAccessAllBranches] = useState(false);
  const [newRoleAllowedNavTabs, setNewRoleAllowedNavTabs] = useState<NavigationTab[]>([
    "dashboard",
    "self-service",
    "attendance-logs",
    "leaves",
    "payroll",
    "notices-chat",
  ]);

  // Edit Role Form
  const [editRoleTitleBn, setEditRoleTitleBn] = useState("");
  const [editRoleTitleEn, setEditRoleTitleEn] = useState("");
  const [editRoleDescBn, setEditRoleDescBn] = useState("");

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
    const isAllowed = isTabAllowedInList(tab, currentTabs);
    let newTabs: string[];
    if (isAllowed) {
      newTabs = currentTabs.filter((t) => {
        if (t === tab) return false;
        if (tab === "self-service" && t === "my-portal") return false;
        if (tab === "my-portal" && t === "self-service") return false;
        if (tab === "branches" && t === "branches-geofence") return false;
        if (tab === "branches-geofence" && t === "branches") return false;
        return true;
      });
    } else {
      newTabs = normalizeTabList([...currentTabs, tab]);
    }

    const updated: RolePermissionConfig[] = permissionsState.map((r) => {
      if (r.role === selectedRole) {
        return {
          ...r,
          allowedNavTabs: newTabs as NavigationTab[],
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

  // Create Role Handler
  const handleCreateRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCode = newRoleCode.trim().toUpperCase().replace(/[\s-]+/g, "_");
    if (!formattedCode) {
      alert(isBangla ? "দয়া করে রোলের একটি ইউনিক কোড দিন (যেমন: FIELD_OFFICER)" : "Please enter a unique role code (e.g. FIELD_OFFICER)");
      return;
    }
    if (!newRoleTitleBn.trim()) {
      alert(isBangla ? "দয়া করে রোলের নাম (বাংলায়) লিখুন" : "Please enter the role title");
      return;
    }

    if (permissionsState.some((r) => r.role === formattedCode)) {
      alert(isBangla ? "এই রোলের কোডটি ইতিমধ্যে ব্যবহৃত হচ্ছে! ভিন্ন কোড লিখুন।" : "This role code is already taken. Please choose another.");
      return;
    }

    const newRoleObj: RolePermissionConfig = {
      role: formattedCode as UserRole,
      roleTitleBn: newRoleTitleBn.trim(),
      roleTitleEn: newRoleTitleEn.trim() || newRoleTitleBn.trim(),
      descriptionBn: newRoleDescBn.trim() || `${newRoleTitleBn.trim()} এর জন্য নির্ধারিত ক্ষমতা ও দায়িত্ব।`,
      canAccessAllBranches: newRoleCanAccessAllBranches,
      allowedNavTabs: newRoleAllowedNavTabs,
      canEditEmployees: false,
      canDeleteEmployees: false,
      canManageDepartments: false,
      canManageBranches: false,
      canApproveLeaves: false,
      canManagePayroll: false,
      canConfigurePolicies: false,
      canViewAuditLogs: false,
      isSystemCore: false,
    };

    const updated = [...permissionsState, newRoleObj];
    setPermissionsState(updated);
    onUpdateRolePermissions(updated);
    setSelectedRole(newRoleObj.role);
    setShowCreateRoleModal(false);

    // Reset Form
    setNewRoleCode("");
    setNewRoleTitleBn("");
    setNewRoleTitleEn("");
    setNewRoleDescBn("");
    setNewRoleCanAccessAllBranches(false);
    setSavedSuccess(isBangla ? `নতুন রোল "${newRoleObj.roleTitleBn}" সফলভাবে যুক্ত হয়েছে!` : `Role "${newRoleObj.roleTitleEn}" created successfully!`);
    setTimeout(() => setSavedSuccess(null), 3500);
  };

  // Open Edit Role
  const handleOpenEditRole = (roleConfig: RolePermissionConfig, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRoleToEdit(roleConfig);
    setEditRoleTitleBn(roleConfig.roleTitleBn);
    setEditRoleTitleEn(roleConfig.roleTitleEn);
    setEditRoleDescBn(roleConfig.descriptionBn);
    setShowEditRoleModal(true);
  };

  // Edit Role Submit
  const handleEditRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleToEdit || !editRoleTitleBn.trim()) return;

    const updated = permissionsState.map((r) => {
      if (r.role === roleToEdit.role) {
        return {
          ...r,
          roleTitleBn: editRoleTitleBn.trim(),
          roleTitleEn: editRoleTitleEn.trim() || editRoleTitleBn.trim(),
          descriptionBn: editRoleDescBn.trim(),
        };
      }
      return r;
    });

    setPermissionsState(updated);
    onUpdateRolePermissions(updated);
    setShowEditRoleModal(false);
    setRoleToEdit(null);
    setSavedSuccess(isBangla ? "রোলের তথ্য সফলভাবে আপডেট হয়েছে!" : "Role updated successfully!");
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  // Delete Role Handler
  const handleOpenDeleteRole = (roleConfig: RolePermissionConfig, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (roleConfig.isSystemCore) {
      alert(isBangla ? "এটি সিস্টেমের অপরিহার্য মূল (Core) রোল, এটি ডিলিট করা যাবে না।" : "This is a core system role and cannot be deleted.");
      return;
    }
    setRoleToDelete(roleConfig);
  };

  const handleConfirmDeleteRole = () => {
    if (!roleToDelete) return;
    const roleCode = roleToDelete.role;
    const updated = permissionsState.filter((r) => r.role !== roleCode);
    setPermissionsState(updated);
    onUpdateRolePermissions(updated);

    if (selectedRole === roleCode) {
      setSelectedRole(updated[0]?.role || ("SUPER_ADMIN" as UserRole));
    }

    setRoleToDelete(null);
    setSavedSuccess(isBangla ? `রোল "${roleToDelete.roleTitleBn}" সফলভাবে ডিলিট করা হয়েছে!` : `Role "${roleToDelete.roleTitleEn}" deleted successfully!`);
    setTimeout(() => setSavedSuccess(null), 3500);
  };

  // Save Policy
  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePayrollPolicy(policyState);
    setSavedSuccess(isBangla ? "হাজিরা ও বোনাস পলিসি সফলভাবে সংরক্ষিত হয়েছে!" : "Attendance & Bonus policy updated successfully!");
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  // Custom bonus modal and state
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [editingBonusId, setEditingBonusId] = useState<string | null>(null);
  const [bonusTitle, setBonusTitle] = useState("");
  const [bonusCategory, setBonusCategory] = useState<CustomBonusConfig["category"]>("EID_UL_FITR");
  const [bonusEffectiveMonth, setBonusEffectiveMonth] = useState("2026-04");
  const [bonusEffectiveDate, setBonusEffectiveDate] = useState("2026-04-14");
  const [bonusCalcType, setBonusCalcType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [bonusValue, setBonusValue] = useState<number>(20);
  const [bonusMaxCap, setBonusMaxCap] = useState<number>(25000);
  const [bonusTarget, setBonusTarget] = useState<CustomBonusConfig["targetEligibility"]>("ALL_EMPLOYEES");
  const [bonusDescription, setBonusDescription] = useState("");

  const handleOpenAddBonus = (presetCategory?: CustomBonusConfig["category"]) => {
    setEditingBonusId(null);
    if (presetCategory === "POHELA_BOISHAKH") {
      setBonusTitle("পহেলা বৈশাখী উৎসব ভাতা");
      setBonusCategory("POHELA_BOISHAKH");
      setBonusEffectiveMonth("2026-04");
      setBonusEffectiveDate("2026-04-14");
      setBonusCalcType("PERCENTAGE");
      setBonusValue(20);
      setBonusMaxCap(25000);
      setBonusTarget("ALL_EMPLOYEES");
      setBonusDescription("বাংলা নববর্ষ ১৪৩৩ উপলক্ষে সরকারি ও প্রাতিষ্ঠানিক ২০% বৈশাখী ভাতা");
    } else if (presetCategory === "EID_UL_FITR") {
      setBonusTitle("পবিত্র ঈদ-উল-ফিতর উৎসব বোনাস");
      setBonusCategory("EID_UL_FITR");
      setBonusEffectiveMonth("2026-03");
      setBonusEffectiveDate("2026-03-28");
      setBonusCalcType("PERCENTAGE");
      setBonusValue(50);
      setBonusMaxCap(50000);
      setBonusTarget("ALL_EMPLOYEES");
      setBonusDescription("পবিত্র ঈদ-উল-ফিতর বার্ষিক উৎসব বোনাস");
    } else if (presetCategory === "EID_UL_ADHA") {
      setBonusTitle("পবিত্র ঈদ-উল-আযহা উৎসব বোনাস");
      setBonusCategory("EID_UL_ADHA");
      setBonusEffectiveMonth("2026-06");
      setBonusEffectiveDate("2026-06-05");
      setBonusCalcType("PERCENTAGE");
      setBonusValue(50);
      setBonusMaxCap(50000);
      setBonusTarget("ALL_EMPLOYEES");
      setBonusDescription("পবিত্র ঈদ-উল-আযহা বাৎসরিক কোরবানি ঈদ বোনাস");
    } else if (presetCategory === "DURGA_PUJA") {
      setBonusTitle("শারদীয় দুর্গোৎসব বিশেষ অনুদান ও পূজা বোনাস");
      setBonusCategory("DURGA_PUJA");
      setBonusEffectiveMonth("2026-10");
      setBonusEffectiveDate("2026-10-18");
      setBonusCalcType("FIXED_AMOUNT");
      setBonusValue(15000);
      setBonusMaxCap(20000);
      setBonusTarget("ALL_EMPLOYEES");
      setBonusDescription("সনাতন ধর্মাবলম্বী ও সকল কর্মকর্তা-কর্মচারীদের জন্য শারদীয় দুর্গোৎসব অনুদান");
    } else {
      setBonusTitle("");
      setBonusCategory("EID_UL_FITR");
      setBonusEffectiveMonth("2026-04");
      setBonusEffectiveDate("2026-04-14");
      setBonusCalcType("PERCENTAGE");
      setBonusValue(20);
      setBonusMaxCap(25000);
      setBonusTarget("ALL_EMPLOYEES");
      setBonusDescription("");
    }
    setShowBonusModal(true);
  };

  const handleOpenEditBonus = (bonus: CustomBonusConfig) => {
    setEditingBonusId(bonus.id);
    setBonusTitle(bonus.title);
    setBonusCategory(bonus.category);
    setBonusEffectiveMonth(bonus.effectiveMonth);
    setBonusEffectiveDate(bonus.effectiveDate || `${bonus.effectiveMonth}-15`);
    setBonusCalcType(bonus.calculationType);
    setBonusValue(bonus.calculationType === "PERCENTAGE" ? bonus.percentageRate || 50 : bonus.fixedAmount || 15000);
    setBonusMaxCap(bonus.maxCapAmount || 50000);
    setBonusTarget(bonus.targetEligibility);
    setBonusDescription(bonus.description || "");
    setShowBonusModal(true);
  };

  const handleSaveCustomBonus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusTitle.trim()) return;

    const newOrUpdatedBonus: CustomBonusConfig = {
      id: editingBonusId || `bonus-${Date.now()}`,
      title: bonusTitle.trim(),
      category: bonusCategory,
      effectiveMonth: bonusEffectiveMonth,
      effectiveDate: bonusEffectiveDate,
      calculationType: bonusCalcType,
      percentageRate: bonusCalcType === "PERCENTAGE" ? Number(bonusValue) : undefined,
      fixedAmount: bonusCalcType === "FIXED_AMOUNT" ? Number(bonusValue) : undefined,
      maxCapAmount: bonusMaxCap ? Number(bonusMaxCap) : undefined,
      targetEligibility: bonusTarget,
      status: "ACTIVE",
      description: bonusDescription.trim(),
    };

    const currentList = policyState.customBonuses || [];
    let updatedList: CustomBonusConfig[];
    if (editingBonusId) {
      updatedList = currentList.map((b) => (b.id === editingBonusId ? newOrUpdatedBonus : b));
    } else {
      updatedList = [newOrUpdatedBonus, ...currentList];
    }

    const updatedPolicy: PayrollPolicyConfig = {
      ...policyState,
      customBonuses: updatedList,
    };

    setPolicyState(updatedPolicy);
    onUpdatePayrollPolicy(updatedPolicy);
    setShowBonusModal(false);
    setSavedSuccess(isBangla ? "উৎসব বোনাস সফলভাবে সংরক্ষিত হয়েছে!" : "Custom bonus saved successfully!");
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const handleDeleteCustomBonus = (bonusId: string) => {
    const updatedList = (policyState.customBonuses || []).filter((b) => b.id !== bonusId);
    const updatedPolicy: PayrollPolicyConfig = {
      ...policyState,
      customBonuses: updatedList,
    };
    setPolicyState(updatedPolicy);
    onUpdatePayrollPolicy(updatedPolicy);
    setSavedSuccess(isBangla ? "বোনাসটি তালিকা থেকে মুছে ফেলা হয়েছে" : "Bonus deleted successfully");
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const handleToggleCustomBonusActive = (bonusId: string) => {
    const updatedList = (policyState.customBonuses || []).map((b) => {
      if (b.id === bonusId) {
        return {
          ...b,
          status: (b.status === "ACTIVE" ? "PAUSED" : "ACTIVE") as "ACTIVE" | "PAUSED",
        };
      }
      return b;
    });
    const updatedPolicy: PayrollPolicyConfig = {
      ...policyState,
      customBonuses: updatedList,
    };
    setPolicyState(updatedPolicy);
    onUpdatePayrollPolicy(updatedPolicy);
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

  // Toggle staff flexible hours
  const handleToggleStaffFlexibleHours = (emp: Employee) => {
    if (!onUpdateEmployee) return;
    const updated: Employee = {
      ...emp,
      flexibleHours: !emp.flexibleHours,
    };
    onUpdateEmployee(updated);
  };

  // Toggle staff salary protected
  const handleToggleStaffSalaryProtected = (emp: Employee) => {
    if (!onUpdateEmployee) return;
    const updated: Employee = {
      ...emp,
      salaryProtected: !emp.salaryProtected,
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

        <button
          onClick={() => setActiveTab("BIOMETRIC_KIOSK_SETTINGS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "BIOMETRIC_KIOSK_SETTINGS"
              ? "bg-teal-600 text-white shadow-xs"
              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
          }`}
        >
          <ScanFace className="w-4 h-4" />
          <span>{isBangla ? "বায়োমেট্রিক ও ফেস কিওস্ক সেটিংস" : "Biometric & Face Kiosk Settings"}</span>
        </button>
      </div>

      {/* TAB 1: ROLES & PERMISSIONS MATRIX */}
      {activeTab === "ROLES_MATRIX" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Role Selection & Management (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isBangla ? "সিস্টেমের রোলসমূহ" : "System Roles"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setNewRoleCode("");
                  setNewRoleTitleBn("");
                  setNewRoleTitleEn("");
                  setNewRoleDescBn("");
                  setNewRoleCanAccessAllBranches(false);
                  setNewRoleAllowedNavTabs([
                    "dashboard",
                    "self-service",
                    "attendance-logs",
                    "leaves",
                    "payroll",
                    "notices-chat",
                  ]);
                  setShowCreateRoleModal(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isBangla ? "নতুন রোল তৈরি" : "Create Role"}</span>
              </button>
            </div>

            <div className="space-y-2">
              {permissionsState.map((r) => {
                const isSelected = selectedRole === r.role;
                return (
                  <div
                    key={r.role}
                    onClick={() => setSelectedRole(r.role)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? "bg-teal-500/10 border-teal-500 shadow-md shadow-teal-500/10 ring-1 ring-teal-500/30"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {isBangla ? r.roleTitleBn : r.roleTitleEn}
                          </span>
                          {r.isSystemCore && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" />
                              {isBangla ? "কোর রোল" : "Core"}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mt-1 inline-block">
                          {r.role}
                        </span>
                      </div>

                      {/* Action buttons on card: Edit & Delete */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditRole(r, e)}
                          title={isBangla ? "রোল এডিট করুন" : "Edit Role"}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {!r.isSystemCore ? (
                          <button
                            type="button"
                            onClick={(e) => handleOpenDeleteRole(r, e)}
                            title={isBangla ? "রোল ডিলিট করুন" : "Delete Role"}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                      {activeRoleConfig?.role}
                    </span>
                    {activeRoleConfig?.isSystemCore && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {isBangla ? "অপরিহার্য সিস্টেম কোর" : "Core Protected"}
                      </span>
                    )}
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

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => activeRoleConfig && handleOpenEditRole(activeRoleConfig, e)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isBangla ? "রোল এডিট" : "Edit Role"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveRolePermissions}
                    className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isBangla ? "পরিবর্তন সংরক্ষণ করুন" : "Save Role Permissions"}</span>
                  </button>
                </div>
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
                    const isChecked = isTabAllowedInList(tab.id, activeRoleConfig?.allowedNavTabs);
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
          {/* Section 1: Dynamic Festival & Custom Bonus Configuration */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isBangla ? "উৎসব বোনাস ও বিশেষ ভাতা নীতিমালা (Festival & Custom Bonus Policy)" : "Festival & Custom Bonus Policy"}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {isBangla
                    ? "ঈদ-উল-ফিতর, ঈদ-উল-আযহা, পহেলা বৈশাখী ভাতা (২০%), শারদীয় দুর্গোৎসব বা যেকোনো কাস্টম বোনাস তৈরি করুন। নির্ধারিত মাসের পে-রোলে এটি স্বয়ংক্রিয়ভাবে যোগ হবে।"
                    : "Configure Eid, Pohela Boishakh (20%), Durga Puja, or custom festival allowances. Automatically applied to payroll during the effective cycle."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddBonus()}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isBangla ? "+ নতুন বোনাস/ভাতা তৈরি করুন" : "+ Add Custom Bonus"}</span>
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                {isBangla ? "এক-ক্লিকে প্রি-সেট বোনাস তৈরি করুন (Quick Presets):" : "Quick Preset Bonus Templates:"}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddBonus("POHELA_BOISHAKH")}
                  className="px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>🌸 {isBangla ? "বৈশাখী ভাতা (২০% - এপ্রিল)" : "Boishakhi Allowance (20%)"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddBonus("EID_UL_FITR")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>🌙 {isBangla ? "ঈদ-উল-ফিতর (৫০% - মার্চ)" : "Eid-ul-Fitr (50%)"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddBonus("EID_UL_ADHA")}
                  className="px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>🕌 {isBangla ? "ঈদ-উল-আযহা (৫০% - জুন)" : "Eid-ul-Adha (50%)"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddBonus("DURGA_PUJA")}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>🪔 {isBangla ? "শারদীয় দুর্গোৎসব (ফিক্সড - অক্টোবর)" : "Durga Puja (Fixed)"}</span>
                </button>
              </div>
            </div>

            {/* List of configured bonuses */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>{isBangla ? "কার্যকর বোনাস ও উৎসব ভাতার তালিকা" : "Configured Bonuses & Festival Allowances"}</span>
                <span className="text-[11px] font-normal text-slate-500">
                  {policyState.customBonuses?.length || 0} {isBangla ? "টি বোনাস নির্ধারণ করা আছে" : "configured"}
                </span>
              </h4>

              {(!policyState.customBonuses || policyState.customBonuses.length === 0) ? (
                <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                  {isBangla ? "কোনো কাস্টম বোনাস তৈরি করা নেই। ওপরের বাটনে ক্লিক করে নতুন বোনাস যোগ করুন।" : "No custom bonuses configured. Click above to create one."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {policyState.customBonuses.map((bonus) => {
                    const isActive = bonus.status !== "PAUSED";
                    const isPercentage = bonus.calculationType === "PERCENTAGE";

                    let categoryBadgeColor = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                    if (bonus.category === "POHELA_BOISHAKH") categoryBadgeColor = "bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30";
                    else if (bonus.category === "EID_UL_FITR" || bonus.category === "EID_UL_ADHA") categoryBadgeColor = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30";
                    else if (bonus.category === "DURGA_PUJA") categoryBadgeColor = "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30";
                    else if ((bonus.category as string) === "PERFORMANCE_BONUS" || (bonus.category as string) === "PERFORMANCE") categoryBadgeColor = "bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30";

                    return (
                      <div
                        key={bonus.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isActive
                            ? "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                            : "bg-slate-50/20 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${categoryBadgeColor}`}>
                                {bonus.category.replace(/_/g, " ")}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-emerald-500/20 text-emerald-600" : "bg-amber-500/20 text-amber-600"}`}>
                                {isActive ? (isBangla ? "সক্রিয়" : "Active") : (isBangla ? "স্থগিত" : "Paused")}
                              </span>
                            </div>
                            <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                              {bonus.title}
                            </h5>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleCustomBonusActive(bonus.id)}
                              title={isActive ? "Pause" : "Activate"}
                              className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditBonus(bonus)}
                              title="Edit"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomBonus(bonus.id)}
                              title="Delete"
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block">{isBangla ? "প্রযোজ্য মাস ও তারিখ:" : "Effective Cycle:"}</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                              {bonus.effectiveMonth} ({bonus.effectiveDate || "N/A"})
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block">{isBangla ? "বোনাসের পরিমাণ/হার:" : "Calculation Rate:"}</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                              {isPercentage ? (
                                <>
                                  <Percent className="w-3 h-3 text-amber-500" />
                                  <span>মূল বেতনের {bonus.percentageRate}%</span>
                                </>
                              ) : (
                                <>
                                  <DollarSign className="w-3 h-3 text-emerald-500" />
                                  <span>ফিক্সড ৳{(bonus.fixedAmount || 0).toLocaleString()}</span>
                                </>
                              )}
                            </span>
                          </div>

                          {bonus.maxCapAmount && (
                            <div className="col-span-2 text-[10px] text-slate-500">
                              {isBangla ? "সর্বোচ্চ সীমা:" : "Max Cap:"} ৳{bonus.maxCapAmount.toLocaleString()} •{" "}
                              {isBangla ? "প্রযোজ্য:" : "Target:"} {bonus.targetEligibility}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

          {/* Section 3: Overtime & Absenteeism Deduction Controls */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isBangla ? "ওভারটাইম ও অনুপস্থিতির কর্তন নীতি সুইচ (Overtime & Absenteeism Policy Controls)" : "Overtime & Absenteeism Policy Controls"}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isBangla
                ? "ওভারটাইম হিসাব চালু বা বন্ধ রাখতে এবং অননুমোদিত অনুপস্থিতির জন্য বেতন কর্তন কার্যকর বা মওকুফ করতে নিচের অপশনগুলো ব্যবহার করুন।"
                : "Easily toggle overtime compensation and absenteeism salary deduction on or off for your organization."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Overtime Toggle */}
              <div
                onClick={() =>
                  setPolicyState({
                    ...policyState,
                    overtimeEnabled: policyState.overtimeEnabled === false ? true : false,
                  })
                }
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  policyState.overtimeEnabled !== false
                    ? "border-amber-500/30 bg-amber-500/10"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 opacity-75"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>{isBangla ? "ওভারটাইম গণনা সুবিধা" : "Overtime Compensation"}</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {policyState.overtimeEnabled !== false
                        ? (isBangla ? "সক্রিয় (ON) - অতিরিক্ত কাজের জন্য ওভারটাইম পারিশ্রমিক গণনা করা হবে।" : "Enabled - Overtime pay will be computed.")
                        : (isBangla ? "বন্ধ (OFF) - অতিরিক্ত কাজের কোনো ওভারটাইম গণনা হবে না (৳০)।" : "Disabled - No overtime pay will be computed.")}
                    </p>
                  </div>
                  <div
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                      policyState.overtimeEnabled !== false ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        policyState.overtimeEnabled !== false ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Absenteeism Deduction Toggle */}
              <div
                onClick={() =>
                  setPolicyState({
                    ...policyState,
                    absenteeismPenaltyEnabled: policyState.absenteeismPenaltyEnabled === false ? true : false,
                    absentPenaltyEnabled: policyState.absenteeismPenaltyEnabled === false ? true : false,
                  })
                }
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  policyState.absenteeismPenaltyEnabled !== false
                    ? "border-rose-500/30 bg-rose-500/10"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 opacity-75"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Ban className="w-4 h-4 text-rose-500" />
                      <span>{isBangla ? "অননুমোদিত অনুপস্থিতির বেতন কর্তন" : "Absenteeism Salary Deduction"}</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {policyState.absenteeismPenaltyEnabled !== false
                        ? (isBangla ? "সক্রিয় (ON) - কর্মীর অনুপস্থিতির জন্য নির্ধারিত বেতন কর্তন কার্যকর হবে।" : "Enabled - Absent days will incur salary deduction.")
                        : (isBangla ? "বন্ধ (OFF) - অনুপস্থিতির জন্য বেতন থেকে কোনো কর্তন হবে না (ফুল স্যালারি অক্ষুণ্ণ থাকবে)।" : "Disabled - No deduction for absences.")}
                    </p>
                  </div>
                  <div
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                      policyState.absenteeismPenaltyEnabled !== false ? "bg-rose-500" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        policyState.absenteeismPenaltyEnabled !== false ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
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

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {/* Exemption Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStaffExemption(emp)}
                      title="Toggle Tardiness Fine Exemption"
                      className={`px-2.5 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                        isExempt
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isExempt ? (isBangla ? "জরিমানা অব্যাহতি" : "Fine Exempt") : (isBangla ? "জরিমানা প্রযোজ্য" : "Standard Rules")}</span>
                    </button>

                    {/* Flexible Hours Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStaffFlexibleHours(emp)}
                      title="Toggle Flexible Working Hours (No fixed 9-5 requirement)"
                      className={`px-2.5 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                        emp.flexibleHours
                          ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{emp.flexibleHours ? (isBangla ? "৯-৫ মুক্ত (ফ্লেক্সিবল)" : "Flexible Hours") : (isBangla ? "শিফট বাধ্যবাধক" : "Fixed Shift")}</span>
                    </button>

                    {/* Salary Protection Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStaffSalaryProtected(emp)}
                      title="Toggle Salary Protection (Immune to deductions)"
                      className={`px-2.5 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                        emp.salaryProtected
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{emp.salaryProtected ? (isBangla ? "বেতন সুরক্ষিত (নো পেনাল্টি)" : "Salary Protected") : (isBangla ? "স্বাভাবিক নীতি" : "Standard")}</span>
                    </button>

                    {/* Fixed Salary Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStaffFixedSalary(emp)}
                      title="Toggle Fixed Contractual Salary"
                      className={`px-2.5 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
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

      {/* TAB 4: BIOMETRIC & FACE KIOSK MODE SETTINGS */}
      {activeTab === "BIOMETRIC_KIOSK_SETTINGS" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-2xl text-teal-600 dark:text-teal-400 shrink-0">
                <ScanFace className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {isBangla ? "বায়োমেট্রিক হাজিরা ও ফেস কিওস্ক মোড পলিসি" : "Biometric Attendance & Face Kiosk Policy"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                  {isBangla
                    ? "সুপার অ্যাডমিন হিসেবে প্রতিষ্ঠানজুড়ে মোবাইল, ট্যাবলেট ও পিসিতে ফেস ভেরিফিকেশন কিওস্কের এক্সেস মোড নির্ধারণ করুন।"
                    : "As Super Admin, configure which face verification kiosk modes are accessible across mobile, tablet, and desktop devices."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onUpdateBiometricSettings?.(biometricState);
                setSavedSuccess(isBangla ? "বায়োমেট্রিক কিওস্ক সেটিংস সফলভাবে সংরক্ষিত হয়েছে!" : "Biometric kiosk settings saved successfully!");
                setTimeout(() => setSavedSuccess(null), 3500);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-black shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>{isBangla ? "পলিসি সেভ করুন" : "Save Biometric Policy"}</span>
            </button>
          </div>

          {/* Mode Availability Card Selector */}
          <div className="space-y-4">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isBangla ? "বায়োমেট্রিক্সের ক্ষেত্রে কোন কোন মোড সক্রিয় থাকবে?" : "Which biometric verification modes are active?"}
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: BOTH */}
              <div
                onClick={() => setBiometricState((prev) => ({ ...prev, modeAvailability: "BOTH", defaultMode: "AUTO_KIOSK" }))}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                  biometricState.modeAvailability === "BOTH"
                    ? "bg-teal-500/5 dark:bg-teal-950/20 border-teal-500 shadow-md ring-2 ring-teal-500/20"
                    : "bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-700 dark:text-teal-300">
                      {isBangla ? "উভয় মোড (সুপারিশকৃত)" : "Both Modes (Recommended)"}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      biometricState.modeAvailability === "BOTH" ? "border-teal-500 bg-teal-500 text-white" : "border-slate-300 dark:border-slate-700"
                    }`}>
                      {biometricState.modeAvailability === "BOTH" && <Check className="w-3 h-3" />}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {isBangla ? "অটো কিওস্ক + ১:১ প্রোফাইল (দুইটাই)" : "Auto Kiosk + 1:1 Profile (Both)"}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {isBangla
                        ? "ক্যামেরা ওপেন করলেই ডিফল্ট হিসেবে অটো কিওস্ক চালু হবে। তবে স্ক্রিনে সুইচ অপশন থাকবে, ফলে ব্যবহারকারী প্রয়োজন হলে ১:১ মোডেও ভেরিফাই করতে পারবে।"
                        : "Opens with Auto Kiosk by default. Users have tab switches to toggle between 1:N auto scan and 1:1 single profile verification."}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                  {isBangla ? "✓ ট্যাবলেট, মোবাইল ও পিসিতে ফ্লেক্সিবল" : "✓ Maximum flexibility for all devices"}
                </div>
              </div>

              {/* Option 2: AUTO_KIOSK_ONLY */}
              <div
                onClick={() => setBiometricState((prev) => ({ ...prev, modeAvailability: "AUTO_KIOSK_ONLY", defaultMode: "AUTO_KIOSK" }))}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                  biometricState.modeAvailability === "AUTO_KIOSK_ONLY"
                    ? "bg-teal-500/5 dark:bg-teal-950/20 border-teal-500 shadow-md ring-2 ring-teal-500/20"
                    : "bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      {isBangla ? "ফুল অটোমেটিক" : "Fully Automatic"}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      biometricState.modeAvailability === "AUTO_KIOSK_ONLY" ? "border-teal-500 bg-teal-500 text-white" : "border-slate-300 dark:border-slate-700"
                    }`}>
                      {biometricState.modeAvailability === "AUTO_KIOSK_ONLY" && <Check className="w-3 h-3" />}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {isBangla ? "শুধুমাত্র অটো কিওস্ক (1:N Auto Scan)" : "Auto Kiosk Only (1:N)"}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {isBangla
                        ? "ক্যামেরার সামনে যে কেউ এলেই সিস্টেম কৃত্রিম বুদ্ধিমত্তার মাধ্যমে স্বয়ংক্রিয়ভাবে তার মুখ স্ক্যান ও শনাক্ত করবে। কোনো কর্মী আগে থেকে সিলেক্ট করার অপশন থাকবে না।"
                        : "Any employee approaching camera is automatically identified via AI face vector database. No manual selection required or allowed."}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {isBangla ? "✓ দ্রুততম উপস্থিতি (হ্যান্ডস-ফ্রি)" : "✓ Fast hands-free kiosk check-in"}
                </div>
              </div>

              {/* Option 3: ONE_TO_ONE_ONLY */}
              <div
                onClick={() => setBiometricState((prev) => ({ ...prev, modeAvailability: "ONE_TO_ONE_ONLY", defaultMode: "ONE_TO_ONE" }))}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                  biometricState.modeAvailability === "ONE_TO_ONE_ONLY"
                    ? "bg-teal-500/5 dark:bg-teal-950/20 border-teal-500 shadow-md ring-2 ring-teal-500/20"
                    : "bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                      {isBangla ? "১:১ যাচাই" : "1:1 Verification"}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      biometricState.modeAvailability === "ONE_TO_ONE_ONLY" ? "border-teal-500 bg-teal-500 text-white" : "border-slate-300 dark:border-slate-700"
                    }`}>
                      {biometricState.modeAvailability === "ONE_TO_ONE_ONLY" && <Check className="w-3 h-3" />}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {isBangla ? "শুধুমাত্র ১:১ প্রোফাইল ভেরিফিকেশন" : "1:1 Staff Profile Only"}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {isBangla
                        ? "শুধুমাত্র নির্দিষ্ট প্রোফাইলের লোকটি ওই ক্যামেরার মাধ্যমে খুঁজে পাবে এবং ফেস ম্যাচ করতে পারবে।"
                        : "Camera strictly verifies against the specific selected or logged-in staff member profile."}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                  {isBangla ? "✓ ব্যক্তিগত ডিভাইসের জন্য আদর্শ" : "✓ Dedicated for individual staff devices"}
                </div>
              </div>
            </div>
          </div>

          {/* Current Policy Overview Banner */}
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                {isBangla
                  ? `বর্তমানে সক্রিয় পলিসি: ${
                      biometricState.modeAvailability === "AUTO_KIOSK_ONLY"
                        ? "শুধুমাত্র স্বয়ংক্রিয় কিওস্ক (Auto Kiosk Only)"
                        : biometricState.modeAvailability === "ONE_TO_ONE_ONLY"
                        ? "শুধুমাত্র ১:১ কর্মচারী ভেরিফিকেশন (1:1 Only)"
                        : "উভয় মোড সক্রিয় (Both Auto Kiosk & 1:1 Available)"
                    }`
                  : `Active Policy: ${biometricState.modeAvailability}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onUpdateBiometricSettings?.(biometricState);
                setSavedSuccess(isBangla ? "বায়োমেট্রিক কিওস্ক সেটিংস সফলভাবে সংরক্ষিত হয়েছে!" : "Biometric kiosk settings saved successfully!");
                setTimeout(() => setSavedSuccess(null), 3500);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold cursor-pointer shrink-0"
            >
              {isBangla ? "সেভ করুন" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM BONUS CREATION & EDIT MODAL */}
      {showBonusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {editingBonusId
                    ? (isBangla ? "উৎসব বোনাস সম্পাদনা করুন" : "Edit Festival / Custom Bonus")
                    : (isBangla ? "নতুন উৎসব বোনাস বা বিশেষ ভাতা তৈরি করুন" : "Create New Festival Bonus / Allowance")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBonusModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomBonus} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {isBangla ? "বোনাস বা ভাতার শিরোনাম *" : "Bonus Title *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isBangla ? "যেমন: পহেলা বৈশাখী উৎসব ভাতা" : "e.g., Pohela Boishakh Festival Allowance"}
                  value={bonusTitle}
                  onChange={(e) => setBonusTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "উৎসবের ক্যাটাগরি" : "Bonus Category"}
                  </label>
                  <select
                    value={bonusCategory}
                    onChange={(e) => setBonusCategory(e.target.value as CustomBonusConfig["category"])}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="POHELA_BOISHAKH">🌸 পহেলা বৈশাখী ভাতা (Pohela Boishakh)</option>
                    <option value="EID_UL_FITR">🌙 ঈদ-উল-ফিতর (Eid-ul-Fitr)</option>
                    <option value="EID_UL_ADHA">🕌 ঈদ-উল-আযহা (Eid-ul-Adha)</option>
                    <option value="DURGA_PUJA">🪔 শারদীয় দুর্গোৎসব (Durga Puja)</option>
                    <option value="PERFORMANCE_BONUS">🏆 বাৎসরিক পারফরম্যান্স বোনাস (Performance)</option>
                    <option value="SPECIAL_ALLOWANCE">⭐ বিশেষ ভাতা (Special Allowance)</option>
                    <option value="OTHER">✨ অন্যান্য কাস্টম ভাতা (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "প্রযোজ্য মাস (Effective Month) *" : "Effective Month *"}
                  </label>
                  <input
                    type="month"
                    required
                    value={bonusEffectiveMonth}
                    onChange={(e) => {
                      setBonusEffectiveMonth(e.target.value);
                      if (!bonusEffectiveDate || !bonusEffectiveDate.startsWith(e.target.value)) {
                        setBonusEffectiveDate(`${e.target.value}-15`);
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "উৎসবের সুনির্দিষ্ট তারিখ" : "Specific Date"}
                  </label>
                  <input
                    type="date"
                    value={bonusEffectiveDate}
                    onChange={(e) => setBonusEffectiveDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "প্রযোজ্য কর্মী শ্রেণি" : "Target Eligibility"}
                  </label>
                  <select
                    value={bonusTarget}
                    onChange={(e) => setBonusTarget(e.target.value as CustomBonusConfig["targetEligibility"])}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="ALL_EMPLOYEES">সকল কর্মকর্তা-কর্মচারী (All Staff)</option>
                    <option value="PERMANENT_ONLY">শুধুমাত্র নিশ্চিত/স্থায়ী কর্মী (Permanent)</option>
                    <option value="MUSLIM_EMPLOYEES">শুধুমাত্র মুসলিম কর্মীগণ (Eid)</option>
                    <option value="HINDU_EMPLOYEES">সনাতন ধর্মাবলম্বী কর্মীগণ (Puja)</option>
                  </select>
                </div>
              </div>

              {/* Calculation Method */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 space-y-3">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  {isBangla ? "বোনাস হিসাবের পদ্ধতি (Calculation Method):" : "Calculation Method:"}
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="modalCalcType"
                      checked={bonusCalcType === "PERCENTAGE"}
                      onChange={() => setBonusCalcType("PERCENTAGE")}
                      className="text-amber-500 focus:ring-amber-400"
                    />
                    <span>{isBangla ? "মূল বেতনের শতকরা হার (%)" : "Percentage of Basic (%)"}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="modalCalcType"
                      checked={bonusCalcType === "FIXED_AMOUNT"}
                      onChange={() => setBonusCalcType("FIXED_AMOUNT")}
                      className="text-amber-500 focus:ring-amber-400"
                    />
                    <span>{isBangla ? "নির্দিষ্ট ফিক্সড টাকা (৳)" : "Fixed Amount (৳)"}</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-500 mb-1">
                      {bonusCalcType === "PERCENTAGE"
                        ? (isBangla ? "শতকরা হার (যেমন ২০% বা ৫০%):" : "Percentage Rate (%):")
                        : (isBangla ? "ফিক্সড টাকার পরিমাণ (৳):" : "Fixed Lump-sum Amount (৳):")}
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={bonusValue}
                      onChange={(e) => setBonusValue(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">
                      {isBangla ? "সর্বোচ্চ সীমা (Max Cap ৳ - ঐচ্ছিক):" : "Max Cap (৳ - Optional):"}
                    </label>
                    <input
                      type="number"
                      value={bonusMaxCap}
                      onChange={(e) => setBonusMaxCap(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {isBangla ? "বিবরণ বা প্রাতিষ্ঠানিক অনুমোদন নোট" : "Description / Notes"}
                </label>
                <textarea
                  rows={2}
                  placeholder={isBangla ? "যেমন: সরকারি নীতিমালা ও পরিচালনা পর্ষদের অনুমোদনক্রমে" : "e.g., As approved by Board of Trustees"}
                  value={bonusDescription}
                  onChange={(e) => setBonusDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBonusModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isBangla ? "বোনাস নিশ্চিত করুন ও সেভ করুন" : "Save Bonus"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW ROLE */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-5 my-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {isBangla ? "নতুন সিস্টেম রোল তৈরি করুন" : "Create New System Role"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBangla ? "কাস্টম পদমর্যাদা ও সিস্টেম অনুমতি সংজ্ঞায়িত করুন" : "Define custom role access & authorities"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateRoleModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "রোলের কোড (Role Code) *" : "Role Code (Unique Identifier) *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoleCode}
                    onChange={(e) => setNewRoleCode(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                    placeholder="e.g. FIELD_OFFICER"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono uppercase font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {isBangla ? "ইংরেজি বড় হাতের অক্ষর ও আন্ডারস্কোর (যেমন: HR_EXECUTIVE)" : "Uppercase letters & underscores"}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "রোলের নাম (বাংলায়) *" : "Role Title (Bengali) *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoleTitleBn}
                    onChange={(e) => setNewRoleTitleBn(e.target.value)}
                    placeholder="যেমন: ফিল্ড অফিসার"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "রোলের নাম (ইংরেজিতে)" : "Role Title (English)"}
                  </label>
                  <input
                    type="text"
                    value={newRoleTitleEn}
                    onChange={(e) => setNewRoleTitleEn(e.target.value)}
                    placeholder="e.g. Field Officer"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "শাখা এক্সেস অধিকার" : "Branch Access"}
                  </label>
                  <div
                    onClick={() => setNewRoleCanAccessAllBranches(!newRoleCanAccessAllBranches)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      newRoleCanAccessAllBranches
                        ? "bg-teal-500/10 border-teal-500/40 text-teal-900 dark:text-teal-200"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <span className="font-semibold text-xs">
                      {isBangla ? "সকল শাখার তথ্য দেখার ক্ষমতা" : "Access All Branches"}
                    </span>
                    <div
                      className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${
                        newRoleCanAccessAllBranches ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                          newRoleCanAccessAllBranches ? "translate-x-3.5" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {isBangla ? "রোলের কাজের বিবরণ (দায়িত্ব)" : "Role Description"}
                </label>
                <textarea
                  rows={2}
                  value={newRoleDescBn}
                  onChange={(e) => setNewRoleDescBn(e.target.value)}
                  placeholder={isBangla ? "এই রোলের আওতাধীন প্রধান দায়িত্বসমূহ..." : "Primary responsibilities for this role..."}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white resize-none"
                />
              </div>

              {/* Allowed Navigation Tabs */}
              <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">
                    {isBangla ? "সাইডবার মেনু এক্সেস (Allowed Tabs)" : "Allowed Navigation Tabs"}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewRoleAllowedNavTabs(allNavTabsList.map((t) => t.id))}
                      className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline cursor-pointer font-bold"
                    >
                      {isBangla ? "সব সিলেক্ট" : "Select All"}
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setNewRoleAllowedNavTabs(["dashboard", "self-service"])}
                      className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                    >
                      {isBangla ? "বেসিক" : "Basic Only"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  {allNavTabsList.map((tab) => {
                    const isChecked = newRoleAllowedNavTabs.includes(tab.id);
                    return (
                      <div
                        key={tab.id}
                        onClick={() => {
                          setNewRoleAllowedNavTabs(
                            isChecked
                              ? newRoleAllowedNavTabs.filter((t) => t !== tab.id)
                              : [...newRoleAllowedNavTabs, tab.id]
                          );
                        }}
                        className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex items-center gap-1.5 ${
                          isChecked
                            ? "bg-teal-500/10 border-teal-500/30 text-teal-900 dark:text-teal-200 font-semibold"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white shrink-0 ${
                            isChecked ? "bg-teal-600" : "border border-slate-400"
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span className="text-[11px] truncate">
                          {isBangla ? tab.labelBn : tab.labelEn}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateRoleModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold shadow-md shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isBangla ? "রোল তৈরি করুন" : "Create Role"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ROLE */}
      {showEditRoleModal && roleToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg text-slate-900 dark:text-slate-100 shadow-2xl space-y-5 my-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {isBangla ? "রোলের বিবরণ ও নাম এডিট করুন" : "Edit Role Information"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {roleToEdit.role} {roleToEdit.isSystemCore ? `(${isBangla ? "সিস্টেম কোর রোল" : "System Core"})` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditRoleModal(false);
                  setRoleToEdit(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditRoleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  {isBangla ? "সিস্টেম রোল কোড (অপরিবর্তনীয়)" : "System Role Identifier"}
                </label>
                <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 font-mono font-bold text-slate-700 dark:text-slate-300">
                  {roleToEdit.role}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "রোলের নাম (বাংলায়) *" : "Role Title (Bengali) *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={editRoleTitleBn}
                    onChange={(e) => setEditRoleTitleBn(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "রোলের নাম (ইংরেজিতে)" : "Role Title (English)"}
                  </label>
                  <input
                    type="text"
                    value={editRoleTitleEn}
                    onChange={(e) => setEditRoleTitleEn(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {isBangla ? "রোলের কাজের বিবরণ" : "Role Description"}
                </label>
                <textarea
                  rows={3}
                  value={editRoleDescBn}
                  onChange={(e) => setEditRoleDescBn(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditRoleModal(false);
                    setRoleToEdit(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold shadow-md shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isBangla ? "আপডেট সংরক্ষণ করুন" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE ROLE CONFIRMATION */}
      {roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {isBangla ? "রোল ডিলিট নিশ্চিতকরণ" : "Confirm Role Deletion"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isBangla ? "আপনি কি নিশ্চিতভাবে এই রোলটি মুছে ফেলতে চান?" : "Are you sure you want to delete this role?"}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <div className="font-bold">
                {isBangla ? roleToDelete.roleTitleBn : roleToDelete.roleTitleEn} ({roleToDelete.role})
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">
                {isBangla
                  ? "এই রোলটি মুছে ফেললে সিস্টেম রোল তালিকা থেকে এটি স্থায়ীভাবে অপসারিত হবে।"
                  : "This role will be permanently removed from the system role list."}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRoleToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer text-xs"
              >
                {isBangla ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRole}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isBangla ? "হ্যাঁ, মুছে ফেলুন" : "Yes, Delete Role"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
