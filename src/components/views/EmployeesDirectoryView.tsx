import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  ScanFace,
  Smartphone,
  Edit2,
  Trash2,
  Eye,
  Download,
  Building2,
  Layers,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  X,
  KeyRound,
  Lock,
  EyeOff,
  RotateCcw,
  Shield,
  Crown,
  AlertTriangle,
  Clock,
  CalendarDays,
  CalendarCheck,
  Banknote,
  Briefcase,
  Award,
  Check,
  LayoutDashboard,
  UserCheck,
  Archive,
  Edit3,
} from "lucide-react";
import {
  Employee,
  Branch,
  Department,
  Designation,
  Shift,
  UserRole,
  ExitRecord,
  RolePermissionConfig,
} from "../../types";
import { exportToCSV } from "../../utils/exportUtils";
import { FaceEnrollmentModal } from "../attendance/FaceEnrollmentModal";
import { useCompanyBranding } from "../../context/CompanyBrandingContext";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { ViewA4ResumeModal } from "../modals/ViewA4ResumeModal";
import { EditEmployeeCVModal } from "../modals/EditEmployeeCVModal";
import {
  getNextAvailableEmployeeCredentials,
  validateEmployeeIdAvailability,
  formatEmployeeCode,
  formatUserId,
  extractEmployeeNumber,
  DEFAULT_ID_PREFIX,
} from "../../utils/employeeIdHelper";

export const APP_TAB_OPTIONS = [
  { id: "dashboard", labelBn: "এক্সিকিউটিভ ড্যাশবোর্ড", labelEn: "Executive Dashboard", icon: LayoutDashboard },
  { id: "my-portal", labelBn: "সেলফ-সার্ভিস পোর্টাল", labelEn: "Self-Service Portal", icon: UserCheck },
  { id: "attendance-logs", labelBn: "হাজিরা রেকর্ড", labelEn: "Attendance Logs", icon: Clock },
  { id: "shifts-holidays", labelBn: "শিফট ও ছুটির ক্যালেন্ডার", labelEn: "Shifts & Calendar", icon: CalendarDays },
  { id: "leaves", labelBn: "ছুটির দরখাস্ত ও ব্যালেন্স", labelEn: "Leave Applications", icon: CalendarCheck },
  { id: "payroll", labelBn: "বেতন ও পে-স্লিপ", labelEn: "Payroll & Payslips", icon: CreditCard },
  { id: "loans", labelBn: "ঋণ ও প্রভিডেন্ট ফান্ড", labelEn: "Loans & Provident Fund", icon: Banknote },
  { id: "notices-chat", labelBn: "নোটিশ বোর্ড ও সার্কুলার", labelEn: "Notice Board & Comms", icon: FileText },
  { id: "projects-tasks", labelBn: "প্রকল্প ও টাস্ক অগ্রগতি", labelEn: "Projects & Tasks", icon: Layers },
  { id: "assets", labelBn: "কোম্পানি সম্পদ ও হ্যান্ডওভার", labelEn: "Asset Management", icon: Smartphone },
  { id: "certificates", labelBn: "অফিসিয়াল সনদ ও প্রত্যয়ন", labelEn: "Official Letters", icon: ShieldCheck },
  { id: "recruitment", labelBn: "নিয়োগ ও এআই বাছাই", labelEn: "Recruitment & ATS", icon: Briefcase },
  { id: "ngo-programs-training", labelBn: "প্রশিক্ষণ ও ফিল্ড প্রজেক্ট", labelEn: "Programs & Training", icon: Award },
  { id: "meetings-conferences", labelBn: "মিটিং ও কনফারেন্স", labelEn: "Meetings & Conferences", icon: Users },
  { id: "branches", labelBn: "শাখা ও জিওফেন্স", labelEn: "Branches & Geofence", icon: Building2 },
  { id: "departments-designations", labelBn: "বিভাগ ও পদবি", labelEn: "Departments & Designations", icon: Layers },
  { id: "employees", labelBn: "কর্মী ডিরেক্টরি", labelEn: "Employees Directory", icon: Users },
  { id: "roles-permissions", labelBn: "রোল ও পারমিশন পলিসি", labelEn: "Roles & Permissions", icon: KeyRound },
  { id: "audit-reports", labelBn: "অডিট রিপোর্ট", labelEn: "Audit Reports", icon: Shield },
  { id: "exit-management", labelBn: "পদত্যাগ ও ক্লিয়ারেন্স", labelEn: "Exit & Resignation", icon: Users },
];

export const DEFAULT_EMPLOYEE_ALLOWED_TABS = [
  "dashboard",
  "my-portal",
  "face-recognition-kiosk",
  "attendance-logs",
  "leaves",
  "payroll",
  "loans",
  "notices-chat",
  "projects-tasks",
  "assets",
  "certificates",
];

// Helper to normalize and map navigation tab IDs between schemas
export const normalizeTabList = (tabs: string[] = []): string[] => {
  const set = new Set<string>();
  tabs.forEach((tab) => {
    if (!tab) return;
    set.add(tab);
    if (tab === "self-service") set.add("my-portal");
    if (tab === "my-portal") set.add("self-service");
    if (tab === "branches-geofence") set.add("branches");
    if (tab === "branches") set.add("branches-geofence");
  });
  return Array.from(set);
};

export const isTabAllowedInList = (tabId: string, allowedTabs: string[] = []): boolean => {
  if (allowedTabs.includes(tabId)) return true;
  if (tabId === "my-portal" && allowedTabs.includes("self-service")) return true;
  if (tabId === "self-service" && allowedTabs.includes("my-portal")) return true;
  if (tabId === "branches" && allowedTabs.includes("branches-geofence")) return true;
  if (tabId === "branches-geofence" && allowedTabs.includes("branches")) return true;
  return false;
};

export const getDefaultTabsForRole = (
  roleKey: string,
  rolePermissionsList?: RolePermissionConfig[]
): string[] => {
  const matchedRole = rolePermissionsList?.find((r) => r.role === roleKey);
  if (matchedRole?.allowedNavTabs && matchedRole.allowedNavTabs.length > 0) {
    return normalizeTabList(matchedRole.allowedNavTabs);
  }

  // Built-in intelligent defaults by role if not customized in role permissions
  if (roleKey === "SUPER_ADMIN" || roleKey === "CEO" || roleKey === "COMPANY_ADMIN") {
    return APP_TAB_OPTIONS.map((t) => t.id);
  }
  if (roleKey === "HR_MANAGER") {
    return normalizeTabList([
      "dashboard",
      "self-service",
      "my-portal",
      "employees",
      "departments-designations",
      "branches",
      "branches-geofence",
      "ngo-programs-training",
      "attendance-logs",
      "shifts-holidays",
      "leaves",
      "recruitment",
      "notices-chat",
      "projects-tasks",
      "certificates",
      "meetings-conferences",
      "exit-management",
    ]);
  }
  if (roleKey === "ACCOUNT_PAYROLL" || roleKey === "ACCOUNTS_MANAGER") {
    return normalizeTabList([
      "dashboard",
      "self-service",
      "my-portal",
      "payroll",
      "loans",
      "employees",
      "attendance-logs",
      "leaves",
      "notices-chat",
      "assets",
    ]);
  }
  if (roleKey === "BRANCH_MANAGER") {
    return normalizeTabList([
      "dashboard",
      "self-service",
      "my-portal",
      "employees",
      "branches",
      "branches-geofence",
      "ngo-programs-training",
      "attendance-logs",
      "leaves",
      "shifts-holidays",
      "notices-chat",
      "projects-tasks",
      "meetings-conferences",
    ]);
  }
  if (roleKey === "PROJECT_MANAGER") {
    return normalizeTabList([
      "dashboard",
      "self-service",
      "my-portal",
      "projects-tasks",
      "attendance-logs",
      "leaves",
      "notices-chat",
      "meetings-conferences",
      "certificates",
    ]);
  }
  return normalizeTabList(DEFAULT_EMPLOYEE_ALLOWED_TABS);
};

interface EmployeesDirectoryViewProps {
  employees: Employee[];
  branches: Branch[];
  departments: Department[];
  designations: Designation[];
  shifts: Shift[];
  currentUser?: Employee;
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee?: (empId: string) => void;
  onOpenDigitalIdCard?: (emp: Employee) => void;
  onAddDepartment?: (dept: Department) => void;
  onUpdateDepartment?: (dept: Department) => void;
  onDeleteDepartment?: (id: string) => void;
  onAddDesignation?: (desig: Designation) => void;
  onUpdateDesignation?: (desig: Designation) => void;
  onDeleteDesignation?: (id: string) => void;
  deletedEmployees?: Employee[];
  onRestoreEmployee?: (empId: string) => void;
  onPermanentDeleteEmployee?: (empId: string) => void;
  exitRecords?: ExitRecord[];
  rolePermissions?: RolePermissionConfig[];
}

export const EmployeesDirectoryView: React.FC<EmployeesDirectoryViewProps> = ({
  employees,
  branches,
  departments,
  designations,
  shifts,
  currentUser,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onOpenDigitalIdCard,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  onAddDesignation,
  onUpdateDesignation,
  onDeleteDesignation,
  deletedEmployees = [],
  onRestoreEmployee,
  onPermanentDeleteEmployee,
  exitRecords = [],
  rolePermissions = [],
}) => {
  const { getEmployeeIdPrefix } = useCompanyBranding();
  const { isBangla } = useThemeLanguage();

  // Generate next unique serial ID based on existing employees, recycle bin, exit records, and prefix
  const generateNextEmployeeCode = (prefix: string, list: Employee[]): string => {
    const creds = getNextAvailableEmployeeCredentials(
      prefix || getEmployeeIdPrefix(),
      list,
      deletedEmployees,
      exitRecords
    );
    return creds.employeeCode;
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [filterBranch, setFilterBranch] = useState("ALL");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [enrollingEmployee, setEnrollingEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingResumeEmployee, setViewingResumeEmployee] = useState<Employee | null>(null);
  const [editingCvEmployee, setEditingCvEmployee] = useState<Employee | null>(null);

  // Edit Employee Form State
  const [editEmpCode, setEditEmpCode] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBranchId, setEditBranchId] = useState("");
  const [editDeptId, setEditDeptId] = useState("");
  const [editDesigId, setEditDesigId] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("EMPLOYEE");
  const [editShiftId, setEditShiftId] = useState("");
  const [editStatus, setEditStatus] = useState<any>("ACTIVE");
  const [editJoiningDate, setEditJoiningDate] = useState("");
  const [editBasicSalary, setEditBasicSalary] = useState(60000);
  const [editNid, setEditNid] = useState("");
  const [editBloodGroup, setEditBloodGroup] = useState<any>("O+");
  const [editAddress, setEditAddress] = useState("");
  const [editEmergencyPhone, setEditEmergencyPhone] = useState("");
  const [editAdditionalDesignations, setEditAdditionalDesignations] = useState<string[]>([]);
  const [editAdditionalDepartments, setEditAdditionalDepartments] = useState<string[]>([]);
  const [newDesigInput, setNewDesigInput] = useState("");
  const [newDeptInput, setNewDeptInput] = useState("");
  const [customDesignationTitle, setCustomDesignationTitle] = useState("");

  // User Credential, Super Admin & Privacy Edit States
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editIsSuperAdmin, setEditIsSuperAdmin] = useState(false);
  const [editIsCeoOrOwner, setEditIsCeoOrOwner] = useState(false);
  const [editHideSalaryFromSelf, setEditHideSalaryFromSelf] = useState(false);
  const [editIsAttendanceExempt, setEditIsAttendanceExempt] = useState(false);
  const [editFaceVerified, setEditFaceVerified] = useState(false);
  const [editAllowedTabs, setEditAllowedTabs] = useState<string[]>(DEFAULT_EMPLOYEE_ALLOWED_TABS);
  const [editHasCustomTabAccess, setEditHasCustomTabAccess] = useState(false);
  const [editFlexibleHours, setEditFlexibleHours] = useState(false);
  const [editSalaryProtected, setEditSalaryProtected] = useState(false);
  const [editFixedContractSalary, setEditFixedContractSalary] = useState(false);

  // Directory View Mode (Active vs Recycle Bin)
  const [activeDirectoryTab, setActiveDirectoryTab] = useState<"active" | "recycle_bin">("active");
  const [recycleSearchTerm, setRecycleSearchTerm] = useState("");
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<Employee | null>(null);

  // Quick Account Reset Modal State (Super Admin power to reset user ID & password)
  const [quickResetEmployee, setQuickResetEmployee] = useState<Employee | null>(null);
  const [quickResetUsername, setQuickResetUsername] = useState("");
  const [quickResetPassword, setQuickResetPassword] = useState("");
  const [showQuickResetPassword, setShowQuickResetPassword] = useState(false);
  const [quickResetIsSuperAdmin, setQuickResetIsSuperAdmin] = useState(false);
  const [quickResetIsCeoOrOwner, setQuickResetIsCeoOrOwner] = useState(false);
  const [quickResetHideSalary, setQuickResetHideSalary] = useState(false);
  const [quickResetSuccessMsg, setQuickResetSuccessMsg] = useState("");

  // Inline Department & Designation Management Modal States
  const [inlineDeptModal, setInlineDeptModal] = useState<{ mode: "add" | "edit"; dept?: Department } | null>(null);
  const [inlineDeptName, setInlineDeptName] = useState("");
  const [inlineDeptCode, setInlineDeptCode] = useState("");
  const [inlineDeptBudget, setInlineDeptBudget] = useState(1500000);

  const [inlineDesigModal, setInlineDesigModal] = useState<{ mode: "add" | "edit"; desig?: Designation } | null>(null);
  const [inlineDesigTitle, setInlineDesigTitle] = useState("");
  const [inlineDesigCode, setInlineDesigCode] = useState("");
  const [inlineDesigMinSal, setInlineDesigMinSal] = useState(50000);
  const [inlineDesigMaxSal, setInlineDesigMaxSal] = useState(100000);

  const [inlineDeleteDeptTarget, setInlineDeleteDeptTarget] = useState<Department | null>(null);
  const [inlineDeleteDesigTarget, setInlineDeleteDesigTarget] = useState<Designation | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // Role-based permission verification
  const isSuperAdminUser = (user?: Employee) => {
    if (!user) return false;
    return Boolean(
      user.role === "SUPER_ADMIN" ||
      user.isSuperAdmin ||
      user.role === "COMPANY_ADMIN"
    );
  };

  const isCeoUser = (user?: Employee) => {
    if (!user) return false;
    return Boolean(
      user.role === "CEO" ||
      user.isCeoOrOwner ||
      user.designationTitle?.toLowerCase().includes("ceo") ||
      user.designationTitle?.toLowerCase().includes("chief executive officer") ||
      user.designationTitle?.toLowerCase().includes("সিইও")
    );
  };

  const isTargetSuperAdmin = (target?: Employee) => {
    if (!target) return false;
    return Boolean(
      target.isSuperAdmin ||
      target.role === "SUPER_ADMIN" ||
      target.designationTitle?.toLowerCase().includes("super admin")
    );
  };

  // Only Super Admin and CEO have access to confidential employee attributes (Salary, Biometrics status, ID card download, Face enrollment, Password reset)
  const canAccessConfidentialEmployeeData = (user?: Employee) => {
    if (!user) return false;
    return isSuperAdminUser(user) || isCeoUser(user);
  };

  const isBranchManagerOf = (user?: Employee, targetBranchId?: string) => {
    if (!user) return false;
    const isManagerRole =
      user.role === "BRANCH_MANAGER" ||
      user.designationTitle.toLowerCase().includes("branch manager") ||
      user.designationTitle.toLowerCase().includes("শাখা প্রধান") ||
      user.designationTitle.toLowerCase().includes("manager");
    return isManagerRole && user.branchId === targetBranchId;
  };

  // CRITICAL: CEO can NEVER edit Super Admin!
  const canEditEmployeeProfile = (targetEmp: Employee) => {
    if (!currentUser) return false;
    if (isTargetSuperAdmin(targetEmp)) {
      return isSuperAdminUser(currentUser);
    }
    if (isSuperAdminUser(currentUser) || isCeoUser(currentUser)) {
      return true;
    }
    if (currentUser.role === "HR_MANAGER" && !isTargetSuperAdmin(targetEmp) && !isCeoUser(targetEmp)) {
      return true;
    }
    if (isBranchManagerOf(currentUser, targetEmp.branchId) && !isTargetSuperAdmin(targetEmp) && !isCeoUser(targetEmp)) {
      return true;
    }
    return false;
  };

  // CRITICAL: Super Admin can NEVER be deleted by anyone! CEO cannot delete Super Admin!
  const canDeleteEmployeeProfile = (targetEmp: Employee) => {
    if (!currentUser) return false;
    if (isTargetSuperAdmin(targetEmp)) {
      return false;
    }
    if (isSuperAdminUser(currentUser) || isCeoUser(currentUser)) {
      return true;
    }
    return false;
  };

  const canResetEmployeeCredentials = (targetEmp: Employee) => {
    if (!currentUser) return false;
    if (!canAccessConfidentialEmployeeData(currentUser)) return false;
    if (isTargetSuperAdmin(targetEmp)) {
      return isSuperAdminUser(currentUser);
    }
    return true;
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditEmpCode(emp.employeeCode);
    setEditFullName(emp.fullName);
    setEditEmail(emp.email);
    setEditPhone(emp.phone);
    setEditBranchId(emp.branchId || branches[0]?.id || "");
    setEditDeptId(emp.departmentId || departments[0]?.id || "");
    setEditDesigId(emp.designationId || designations[0]?.id || "");
    setCustomDesignationTitle(emp.designationTitle || "");
    setEditAdditionalDesignations(emp.additionalDesignations || []);
    setEditAdditionalDepartments(emp.additionalDepartments || []);
    setEditRole(emp.role || "EMPLOYEE");
    setEditShiftId(emp.shiftId || shifts[0]?.id || "");
    setEditStatus(emp.status || "ACTIVE");
    setEditJoiningDate(emp.joiningDate || "2026-09-01");
    const rawBasic = emp.salary?.basic;
    setEditBasicSalary(
      typeof rawBasic === "number" && !isNaN(rawBasic)
        ? rawBasic
        : rawBasic !== undefined && rawBasic !== null
        ? Number(rawBasic)
        : (emp.salary?.grossSalary ?? 0)
    );
    setEditNid(emp.nidNumber || "");
    setEditBloodGroup((emp.bloodGroup as any) || "O+");
    setEditAddress(emp.presentAddress || "");
    setEditEmergencyPhone(emp.emergencyPhone || "");

    // Credentials & Administrative Roles
    setEditUsername(emp.username || emp.email.split("@")[0] || emp.employeeCode.toLowerCase());
    setEditPassword(""); // Blank by default so browser does not trigger password save prompt on normal edits
    setIsEditingPassword(false);
    setShowEditPassword(false);
    setEditIsSuperAdmin(Boolean(emp.isSuperAdmin || emp.role === "SUPER_ADMIN"));
    setEditIsCeoOrOwner(Boolean(emp.isCeoOrOwner));
    setEditHideSalaryFromSelf(Boolean(emp.hideSalaryFromSelf));
    setEditIsAttendanceExempt(Boolean(emp.isAttendanceExempt));
    setEditFaceVerified(Boolean(emp.faceVerified));
    const isCustom = Boolean(emp.hasCustomTabAccess);
    setEditHasCustomTabAccess(isCustom);
    setEditAllowedTabs(
      isCustom && emp.allowedTabs && emp.allowedTabs.length > 0
        ? normalizeTabList(emp.allowedTabs)
        : getDefaultTabsForRole(emp.role || "EMPLOYEE", rolePermissions)
    );
    setEditFlexibleHours(Boolean(emp.flexibleHours));
    setEditSalaryProtected(Boolean(emp.salaryProtected));
    setEditFixedContractSalary(Boolean(emp.isFixedSalary || emp.isFixedContractSalary));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const availability = validateEmployeeIdAvailability(
      editEmpCode,
      employees,
      deletedEmployees,
      exitRecords,
      editingEmployee.id
    );
    if (!availability.available) {
      alert(`আইডি ত্রুটি: ${availability.reason}`);
      return;
    }

    const branch = branches.find((b) => b.id === editBranchId) || branches[0];
    const dept = departments.find((d) => d.id === editDeptId) || departments[0];
    const desig = designations.find((d) => d.id === editDesigId) || designations[0];
    const shift = shifts.find((s) => s.id === editShiftId) || shifts[0];

    const basic = Number(editBasicSalary ?? 0);
    const isFixed = Boolean(editFixedContractSalary);
    const gross = isFixed ? basic : Math.round(basic * 1.77);

    const newPwd = editPassword.trim();
    const isPasswordChanged = newPwd.length > 0 && newPwd !== (editingEmployee.password || "123456");
    const finalPassword = isPasswordChanged ? newPwd : (editingEmployee.password || "123456");

    const updatedEmp: Employee = {
      ...editingEmployee,
      employeeCode: editEmpCode,
      fullName: editFullName,
      email: editEmail,
      phone: editPhone,
      branchId: branch?.id || editingEmployee.branchId,
      branchName: branch?.name || editingEmployee.branchName,
      departmentId: dept?.id || editingEmployee.departmentId,
      departmentName: dept?.name || editingEmployee.departmentName,
      designationId: desig?.id || editingEmployee.designationId,
      designationTitle: customDesignationTitle.trim() || desig?.title || editingEmployee.designationTitle,
      additionalDesignations: [],
      additionalDepartments: [],
      role: editRole,
      shiftId: shift?.id || editingEmployee.shiftId,
      shiftName: shift?.name || editingEmployee.shiftName,
      status: editStatus,
      joiningDate: editJoiningDate,
      nidNumber: editNid.trim(),
      bloodGroup: editBloodGroup,
      presentAddress: editAddress.trim(),
      emergencyPhone: editEmergencyPhone.trim(),
      // Field Staff, Flexible Hours & Salary Protection Flags
      flexibleHours: editFlexibleHours,
      salaryProtected: editSalaryProtected,
      isFixedSalary: editFixedContractSalary,
      isFixedContractSalary: editFixedContractSalary,
      isAttendancePenaltyExempt: editSalaryProtected || editFlexibleHours || isFixed,
      // Credentials & Super Admin Flags
      username:
        currentUser?.role === "SUPER_ADMIN"
          ? editUsername.trim() || editingEmployee.username || editingEmployee.email.split("@")[0]
          : editingEmployee.username || editingEmployee.employeeCode,
      password: finalPassword,
      isSuperAdmin: editIsSuperAdmin || editRole === "SUPER_ADMIN",
      isCeoOrOwner: editIsCeoOrOwner,
      hideSalaryFromSelf: editHideSalaryFromSelf,
      isAttendanceExempt: editIsAttendanceExempt,
      faceVerified: editFaceVerified,
      hasCustomTabAccess: editHasCustomTabAccess,
      allowedTabs: editHasCustomTabAccess
        ? normalizeTabList(editAllowedTabs)
        : getDefaultTabsForRole(editRole, rolePermissions),
      passwordLastChangedAt: isPasswordChanged ? new Date().toISOString() : editingEmployee.passwordLastChangedAt,
      salary: {
        ...editingEmployee.salary,
        basic: basic,
        houseRent: isFixed ? 0 : Math.round(basic * 0.4),
        medicalAllowance: isFixed ? 0 : Math.round(basic * 0.12),
        transportAllowance: isFixed ? 0 : Math.round(basic * 0.12),
        specialAllowance: isFixed ? 0 : Math.round(basic * 0.13),
        providentFundPercentage: isFixed ? 0 : (editingEmployee.salary?.providentFundPercentage || 8),
        taxDeductionPercentage: isFixed ? 0 : (editingEmployee.salary?.taxDeductionPercentage || 6),
        grossSalary: gross,
      },
    };

    onUpdateEmployee(updatedEmp);
    if (selectedEmployee?.id === updatedEmp.id) {
      setSelectedEmployee(updatedEmp);
    }
    setEditingEmployee(null);
  };

    // Quick Account Reset Handlers (Super Admin & CEO power to reset credentials; CEO cannot reset Super Admin)
  const openQuickResetModal = (emp: Employee) => {
    if (!canResetEmployeeCredentials(emp)) {
      alert("নিরাপত্তা সতর্কতা: আপনি এই অ্যাকাউন্টের ক্রিডেনশিয়াল রিসেট করতে পারবেন না। সিইও সুপার অ্যাডমিনের পাসওয়ার্ড রিসেট করতে পারেন না।");
      return;
    }
    setQuickResetEmployee(emp);
    setQuickResetUsername(emp.username || emp.email.split("@")[0] || emp.employeeCode.toLowerCase());
    setQuickResetPassword(emp.password || "123456");
    setShowQuickResetPassword(false);
    setQuickResetIsSuperAdmin(Boolean(emp.isSuperAdmin || emp.role === "SUPER_ADMIN"));
    setQuickResetIsCeoOrOwner(Boolean(emp.isCeoOrOwner));
    setQuickResetHideSalary(Boolean(emp.hideSalaryFromSelf));
    setQuickResetSuccessMsg("");
  };

  const handleQuickResetSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickResetEmployee) return;

    if (isTargetSuperAdmin(quickResetEmployee) && !isSuperAdminUser(currentUser)) {
      alert("নিরাপত্তা নীতি লঙ্ঘন: সিইও বা অন্যান্য অ্যাডমিন সুপার অ্যাডমিনের অ্যাকাউন্ট রিসেট করতে পারবেন না।");
      return;
    }

    const updated: Employee = {
      ...quickResetEmployee,
      username:
        currentUser?.role === "SUPER_ADMIN"
          ? quickResetUsername.trim() || quickResetEmployee.username || quickResetEmployee.email.split("@")[0]
          : quickResetEmployee.username || quickResetEmployee.employeeCode,
      password: quickResetPassword.trim() || "123456",
      isSuperAdmin: quickResetIsSuperAdmin,
      isCeoOrOwner: quickResetIsCeoOrOwner,
      hideSalaryFromSelf: quickResetHideSalary,
      passwordLastChangedAt: new Date().toISOString(),
    };

    onUpdateEmployee(updated);
    setQuickResetSuccessMsg("অ্যাকাউন্ট ইউজার আইডি ও পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!");
    setTimeout(() => {
      setQuickResetEmployee(null);
      setQuickResetSuccessMsg("");
    }, 1200);
  };

  const handleDeleteEmployee = (emp: Employee) => {
    if (isTargetSuperAdmin(emp)) {
      alert("নিরাপত্তা নীতি: সুপার অ্যাডমিন অ্যাকাউন্ট কোনোভাবেই মোছা যাবে না।");
      return;
    }
    if (!canDeleteEmployeeProfile(emp)) {
      alert("অনুমতি নেই: সিইও সুপার অ্যাডমিন মুছতে পারবেন না এবং সাধারণ কর্মী কর্মী মুছতে পারবেন না।");
      return;
    }
    setEmployeeToDelete(emp);
  };

  const confirmDeleteEmployee = () => {
    if (employeeToDelete) {
      if (isTargetSuperAdmin(employeeToDelete)) {
        alert("নিরাপত্তা নীতি: সুপার অ্যাডমিন অ্যাকাউন্ট মোছা সম্পূর্ণ নিষিদ্ধ।");
        setEmployeeToDelete(null);
        return;
      }
      if (onDeleteEmployee) {
        onDeleteEmployee(employeeToDelete.id);
        if (selectedEmployee?.id === employeeToDelete.id) {
          setSelectedEmployee(null);
        }
      }
    }
    setEmployeeToDelete(null);
  };

  // Inline Dept/Desig handlers
  const handleOpenAddDeptModal = () => {
    setInlineDeptModal({ mode: "add" });
    setInlineDeptName("");
    setInlineDeptCode(`D${departments.length + 1}`);
    setInlineDeptBudget(1500000);
  };

  const handleOpenEditDeptModal = (deptId: string) => {
    const d = departments.find((item) => item.id === deptId);
    if (!d) return;
    setInlineDeptModal({ mode: "edit", dept: d });
    setInlineDeptName(d.name);
    setInlineDeptCode(d.code);
    setInlineDeptBudget(d.budgetAllocated || 1500000);
  };

  const handleSaveInlineDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineDeptName.trim()) return;
    if (inlineDeptModal?.mode === "add") {
      const newD: Department = {
        id: `dept-${Date.now()}`,
        name: inlineDeptName.trim(),
        code: inlineDeptCode.trim().toUpperCase() || `D${departments.length + 1}`,
        description: "",
        totalEmployees: 0,
        budgetAllocated: Number(inlineDeptBudget) || 1500000,
      };
      if (onAddDepartment) onAddDepartment(newD);
      if (editingEmployee) setEditDeptId(newD.id);
      else setNewDeptId(newD.id);
    } else if (inlineDeptModal?.mode === "edit" && inlineDeptModal.dept) {
      const updatedD: Department = {
        ...inlineDeptModal.dept,
        name: inlineDeptName.trim(),
        code: inlineDeptCode.trim().toUpperCase() || inlineDeptModal.dept.code,
        budgetAllocated: Number(inlineDeptBudget) || inlineDeptModal.dept.budgetAllocated,
      };
      if (onUpdateDepartment) onUpdateDepartment(updatedD);
    }
    setInlineDeptModal(null);
  };

  const handleOpenAddDesigModal = () => {
    setInlineDesigModal({ mode: "add" });
    setInlineDesigTitle("");
    setInlineDesigCode(`DSG-${designations.length + 1}`);
    setInlineDesigMinSal(50000);
    setInlineDesigMaxSal(100000);
  };

  const handleOpenEditDesigModal = (desigId: string) => {
    const d = designations.find((item) => item.id === desigId);
    if (!d) return;
    setInlineDesigModal({ mode: "edit", desig: d });
    setInlineDesigTitle(d.title);
    setInlineDesigCode(d.code);
    setInlineDesigMinSal(d.minSalary || 50000);
    setInlineDesigMaxSal(d.maxSalary || 100000);
  };

  const handleSaveInlineDesig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineDesigTitle.trim()) return;
    if (inlineDesigModal?.mode === "add") {
      const currentDeptId = editingEmployee ? editDeptId : newDeptId;
      const currentDept = departments.find((d) => d.id === currentDeptId) || departments[0];
      const newD: Designation = {
        id: `desig-${Date.now()}`,
        title: inlineDesigTitle.trim(),
        code: inlineDesigCode.trim().toUpperCase() || `DSG-${designations.length + 1}`,
        departmentId: currentDept?.id || "",
        departmentName: currentDept?.name || "General",
        level: "MID",
        minSalary: Number(inlineDesigMinSal) || 50000,
        maxSalary: Number(inlineDesigMaxSal) || 100000,
        description: "",
      };
      if (onAddDesignation) onAddDesignation(newD);
      if (editingEmployee) {
        setEditDesigId(newD.id);
        setCustomDesignationTitle(newD.title);
      } else {
        setNewDesigId(newD.id);
      }
    } else if (inlineDesigModal?.mode === "edit" && inlineDesigModal.desig) {
      const updatedD: Designation = {
        ...inlineDesigModal.desig,
        title: inlineDesigTitle.trim(),
        code: inlineDesigCode.trim().toUpperCase() || inlineDesigModal.desig.code,
        minSalary: Number(inlineDesigMinSal) || inlineDesigModal.desig.minSalary,
        maxSalary: Number(inlineDesigMaxSal) || inlineDesigModal.desig.maxSalary,
      };
      if (onUpdateDesignation) onUpdateDesignation(updatedD);
      if (editingEmployee && editDesigId === updatedD.id) {
        setCustomDesignationTitle(updatedD.title);
      }
    }
    setInlineDesigModal(null);
  };

  const confirmDeleteInlineDept = () => {
    if (inlineDeleteDeptTarget && onDeleteDepartment) {
      onDeleteDepartment(inlineDeleteDeptTarget.id);
      if (editDeptId === inlineDeleteDeptTarget.id) {
        setEditDeptId(departments.find((d) => d.id !== inlineDeleteDeptTarget.id)?.id || "");
      }
      if (newDeptId === inlineDeleteDeptTarget.id) {
        setNewDeptId(departments.find((d) => d.id !== inlineDeleteDeptTarget.id)?.id || "");
      }
    }
    setInlineDeleteDeptTarget(null);
  };

  const confirmDeleteInlineDesig = () => {
    if (inlineDeleteDesigTarget && onDeleteDesignation) {
      onDeleteDesignation(inlineDeleteDesigTarget.id);
      if (editDesigId === inlineDeleteDesigTarget.id) {
        setEditDesigId(designations.find((d) => d.id !== inlineDeleteDesigTarget.id)?.id || "");
      }
      if (newDesigId === inlineDeleteDesigTarget.id) {
        setNewDesigId(designations.find((d) => d.id !== inlineDeleteDesigTarget.id)?.id || "");
      }
    }
    setInlineDeleteDesigTarget(null);
  };

  // New Employee Form State (Comprehensive 30+ Enterprise Fields)
  const initialNewCreds = getNextAvailableEmployeeCredentials(
    getEmployeeIdPrefix(),
    employees,
    deletedEmployees,
    exitRecords
  );
  const [newEmpCode, setNewEmpCode] = useState(initialNewCreds.employeeCode);
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("+880 1");
  const [newBranchId, setNewBranchId] = useState(branches[0]?.id || "");
  const [newDeptId, setNewDeptId] = useState(departments[0]?.id || "");
  const [newDesigId, setNewDesigId] = useState(designations[0]?.id || "");
  const [newRole, setNewRole] = useState<UserRole>("EMPLOYEE");
  const [newShiftId, setNewShiftId] = useState(shifts[0]?.id || "");
  const [newJoiningDate, setNewJoiningDate] = useState("2026-09-01");
  const [newBasicSalary, setNewBasicSalary] = useState(60000);
  const [newNid, setNewNid] = useState("");
  const [newBloodGroup, setNewBloodGroup] = useState<any>("O+");
  const [newAddress, setNewAddress] = useState("");
  const [newEmergencyPhone, setNewEmergencyPhone] = useState("");

  // New Employee Account & Permissions
  const [newUsername, setNewUsername] = useState(initialNewCreds.username);
  const [newPassword, setNewPassword] = useState("123456");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newIsSuperAdmin, setNewIsSuperAdmin] = useState(false);
  const [newIsCeoOrOwner, setNewIsCeoOrOwner] = useState(false);
  const [newHideSalaryFromSelf, setNewHideSalaryFromSelf] = useState(false);
  const [newIsAttendanceExempt, setNewIsAttendanceExempt] = useState(false);
  const [newFaceVerified, setNewFaceVerified] = useState(false);
  const [newAllowedTabs, setNewAllowedTabs] = useState<string[]>(DEFAULT_EMPLOYEE_ALLOWED_TABS);
  const [newHasCustomTabAccess, setNewHasCustomTabAccess] = useState(false);
  const [newFlexibleHours, setNewFlexibleHours] = useState(false);
  const [newSalaryProtected, setNewSalaryProtected] = useState(false);
  const [newFixedContractSalary, setNewFixedContractSalary] = useState(false);

  const handleOpenAddModal = () => {
    const creds = getNextAvailableEmployeeCredentials(
      getEmployeeIdPrefix(),
      employees,
      deletedEmployees,
      exitRecords
    );
    setNewEmpCode(creds.employeeCode);
    setNewUsername(creds.username);
    setNewFullName("");
    setNewEmail("");
    setNewPhone("+880 1");
    setNewNid("");
    setNewAddress("");
    setNewEmergencyPhone("");
    setNewPassword("123456");
    setShowAddModal(true);
  };

  const handleAutoAssignId = () => {
    const creds = getNextAvailableEmployeeCredentials(
      getEmployeeIdPrefix(),
      employees,
      deletedEmployees,
      exitRecords
    );
    setNewEmpCode(creds.employeeCode);
    setNewUsername(creds.username);
  };

  const addIdValidation = validateEmployeeIdAvailability(
    newEmpCode,
    employees,
    deletedEmployees,
    exitRecords
  );

  const editIdValidation = editingEmployee
    ? validateEmployeeIdAvailability(
        editEmpCode,
        employees,
        deletedEmployees,
        exitRecords,
        editingEmployee.id
      )
    : { available: true };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designationTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBranch = filterBranch === "ALL" || emp.branchId === filterBranch;
    const matchesDept = filterDept === "ALL" || emp.departmentId === filterDept;
    const matchesStatus = filterStatus === "ALL" || emp.status === filterStatus;

    return matchesSearch && matchesBranch && matchesDept && matchesStatus;
  });

  const filteredDeletedEmployees = deletedEmployees.filter((emp) => {
    const term = recycleSearchTerm.toLowerCase();
    return (
      emp.fullName.toLowerCase().includes(term) ||
      emp.employeeCode.toLowerCase().includes(term) ||
      emp.email.toLowerCase().includes(term) ||
      (emp.designationTitle && emp.designationTitle.toLowerCase().includes(term)) ||
      (emp.branchName && emp.branchName.toLowerCase().includes(term))
    );
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const availability = validateEmployeeIdAvailability(
      newEmpCode,
      employees,
      deletedEmployees,
      exitRecords
    );
    if (!availability.available) {
      alert(`আইডি সংক্রান্ত সমস্যা: ${availability.reason}`);
      return;
    }

    const branch = branches.find((b) => b.id === newBranchId) || branches[0];
    const dept = departments.find((d) => d.id === newDeptId) || departments[0];
    const desig = designations.find((d) => d.id === newDesigId) || designations[0];
    const shift = shifts.find((s) => s.id === newShiftId) || shifts[0];

    const basic = Number(newBasicSalary ?? 0);
    const isFixed = Boolean(newFixedContractSalary);
    const gross = isFixed ? basic : Math.round(basic * 1.77);

    const cleanNum = extractEmployeeNumber(newEmpCode);
    const defaultGeneratedUsername = cleanNum ? formatUserId(cleanNum, getEmployeeIdPrefix()) : newEmpCode.trim().toLowerCase();
    const finalUsername = newUsername.trim() || defaultGeneratedUsername;

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      employeeCode: newEmpCode.trim().toUpperCase(),
      companyId: "comp-01",
      branchId: branch.id,
      branchName: branch.name,
      departmentId: dept.id,
      departmentName: dept.name,
      designationId: desig.id,
      designationTitle: desig.title,
      role: newRole,
      fullName: newFullName,
      email: newEmail,
      phone: newPhone,
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + employees.length}?w=200&h=200&fit=crop&crop=face`,
      dateOfBirth: "1994-05-15",
      gender: "MALE",
      bloodGroup: newBloodGroup,
      maritalStatus: "SINGLE",
      nidNumber: newNid.trim(),
      presentAddress: newAddress.trim(),
      permanentAddress: "",
      emergencyPhone: newEmergencyPhone.trim(),
      additionalDesignations: [],
      additionalDepartments: [],
      joiningDate: newJoiningDate,
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      shiftId: shift.id,
      shiftName: shift.name,
      // Field Staff, Flexible Hours & Salary Protection Flags
      flexibleHours: newFlexibleHours,
      salaryProtected: newSalaryProtected,
      isFixedSalary: newFixedContractSalary,
      isFixedContractSalary: newFixedContractSalary,
      isAttendancePenaltyExempt: newSalaryProtected || newFlexibleHours || isFixed,
      // Account credentials & role flags
      username: finalUsername,
      password: newPassword.trim() || "123456",
      isSuperAdmin: newIsSuperAdmin || newRole === "SUPER_ADMIN",
      isCeoOrOwner: newIsCeoOrOwner,
      hideSalaryFromSelf: newHideSalaryFromSelf,
      isAttendanceExempt: newIsAttendanceExempt,
      faceVerified: newFaceVerified,
      hasCustomTabAccess: newHasCustomTabAccess,
      allowedTabs: newHasCustomTabAccess
        ? normalizeTabList(newAllowedTabs)
        : getDefaultTabsForRole(newRole, rolePermissions),
      salary: {
        basic: basic,
        houseRent: isFixed ? 0 : Math.round(basic * 0.4),
        medicalAllowance: isFixed ? 0 : Math.round(basic * 0.12),
        transportAllowance: isFixed ? 0 : Math.round(basic * 0.12),
        specialAllowance: isFixed ? 0 : Math.round(basic * 0.13),
        providentFundPercentage: isFixed ? 0 : 8,
        taxDeductionPercentage: isFixed ? 0 : 6,
        grossSalary: gross,
      },
      bankName: "City Bank Ltd.",
      bankAccountNumber: `11029837${Math.floor(Math.random() * 9000 + 1000)}`,
      faceTemplateRegistered: Boolean(newFaceVerified),
      deviceBindingEnabled: true,
      boundDeviceId: `DEV-${newEmpCode}`,
      documents: [],
    };

    onAddEmployee(newEmp);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNewFullName("");
    setNewEmail("");
    setNewPhone("+880 1");
    setNewNid("");
    setNewAddress("");
    setNewEmergencyPhone("");
    setNewBasicSalary(60000);
    setNewUsername("");
    setNewPassword("123456");
    setShowNewPassword(false);
    setNewIsSuperAdmin(false);
    setNewIsCeoOrOwner(false);
    setNewHideSalaryFromSelf(false);
    setNewIsAttendanceExempt(false);
    setNewFaceVerified(false);
    setNewHasCustomTabAccess(false);
    setNewAllowedTabs(getDefaultTabsForRole("EMPLOYEE", rolePermissions));
    setNewFlexibleHours(false);
    setNewSalaryProtected(false);
    setNewFixedContractSalary(false);
  };

  const handleExportCSV = () => {
    const isConfidential = canAccessConfidentialEmployeeData(currentUser);
    const data = filteredEmployees.map((e) => {
      const isSelf = currentUser?.id === e.id;
      const canSeeConfidential = isConfidential || isSelf;

      return {
        "Employee ID": e.employeeCode,
        "Full Name": e.fullName,
        Role: e.role,
        Designation: e.designationTitle,
        Department: e.departmentName,
        Branch: e.branchName,
        Email: e.email,
        Phone: e.phone,
        "NID Number": canSeeConfidential ? (e.nidNumber || "N/A") : "•••• •••• •••• (Confidential)",
        "Gross Salary (BDT)": canSeeConfidential ? (e.salary?.grossSalary || 0) : "CONFIDENTIAL",
        "Face Template Enrolled": canSeeConfidential ? (e.faceTemplateRegistered ? "Yes" : "No") : "CONFIDENTIAL",
        "Bound Device ID": canSeeConfidential ? (e.boundDeviceId || "N/A") : "CONFIDENTIAL",
        Status: e.status,
      };
    });
    exportToCSV("Workflow_HR_Workforce_Directory", data);
  };

  return (
    <div id="employees-directory-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Workforce Mode Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveDirectoryTab("active")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeDirectoryTab === "active"
                ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>সক্রিয় কর্মী ডাটাবেজ (Active Workforce)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeDirectoryTab === "active"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              {employees.length}
            </span>
          </button>

          {canAccessConfidentialEmployeeData(currentUser) && (
            <button
              type="button"
              onClick={() => setActiveDirectoryTab("recycle_bin")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeDirectoryTab === "recycle_bin"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>রিসাইকেল বিন / আর্কাইভড কর্মী</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeDirectoryTab === "recycle_bin"
                    ? "bg-white/20 text-white"
                    : deletedEmployees.length > 0
                    ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                }`}
              >
                {deletedEmployees.length}
              </span>
            </button>
          )}
        </div>

        {activeDirectoryTab === "active" && canAccessConfidentialEmployeeData(currentUser) && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Employee</span>
            </button>
          </div>
        )}
      </div>

      {/* Top Action & Search Bar */}
      {activeDirectoryTab === "active" && (
        <>
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Workforce & Employee Database</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage complete employee lifecycle, biometric face templates, hardware binding & salary structures
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canAccessConfidentialEmployeeData(currentUser) && (
              <>
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Employee</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, email, role..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Branch Locations</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Employees</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="PROBATION">Probation Period</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table List / Mobile Card Layout */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Showing {filteredEmployees.length} of {employees.length} Employees</span>
        </div>

        {/* Mobile View: Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={emp.avatarUrl}
                    alt={emp.fullName}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">{emp.fullName}</h4>
                      {Boolean(emp.isSuperAdmin || emp.role === "SUPER_ADMIN") && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                          Super Admin
                        </span>
                      )}
                      {Boolean(emp.isCeoOrOwner) && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          CEO
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{emp.employeeCode}</p>
                    <p className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold mt-0.5">
                      {emp.designationTitle}
                    </p>
                  </div>
                </div>

                {canAccessConfidentialEmployeeData(currentUser) && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      emp.status === "ACTIVE"
                        ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {emp.status}
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-200/80 dark:border-slate-700/50">
                <div className="flex justify-between">
                  <span>Branch / Dept:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {(emp.branchName || "Main Office").split("(")[0]} • {emp.departmentName || "General"}
                  </span>
                </div>

                {canAccessConfidentialEmployeeData(currentUser) && (
                  <>
                    <div className="flex justify-between">
                      <span>Biometrics:</span>
                      {emp.faceTemplateRegistered ? (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <ScanFace className="w-3 h-3" /> Enrolled
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
                          <ScanFace className="w-3 h-3" /> No Photo
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{emp.isFixedSalary || emp.isFixedContractSalary ? (isBangla ? "ফিক্সড বেতন:" : "Fixed Salary:") : "Gross Salary:"}</span>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-slate-900 dark:text-white font-mono font-bold">
                            ৳{(emp.salary?.grossSalary ?? 0).toLocaleString()}
                          </span>
                          {(emp.isFixedSalary || emp.isFixedContractSalary) && (
                            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                              ফিক্সড
                            </span>
                          )}
                        </div>
                        {emp.hideSalaryFromSelf && (
                          <span className="block text-[8px] font-bold text-amber-600 dark:text-amber-400">
                            (কর্মী থেকে গোপন)
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-700/50">
                {canAccessConfidentialEmployeeData(currentUser) ? (
                  <>
                    {onOpenDigitalIdCard && (
                      <button
                        type="button"
                        onClick={() => onOpenDigitalIdCard(emp)}
                        className="p-2 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-800 dark:text-teal-300 border border-teal-500/30 transition-colors cursor-pointer"
                        title="Digital ID Card (ডিজিটাল আইডি কার্ড)"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEnrollingEmployee(emp)}
                      className="flex-1 py-2 px-2.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-800 dark:text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ScanFace className="w-3.5 h-3.5" />
                      <span>{emp.faceTemplateRegistered ? "Photo" : "Face"}</span>
                    </button>
                    {canResetEmployeeCredentials(emp) && (
                      <button
                        type="button"
                        onClick={() => openQuickResetModal(emp)}
                        className="p-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                        title="লগইন আইডি ও পাসওয়ার্ড রিসেট করুন"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                    )}
                    {canEditEmployeeProfile(emp) ? (
                      <button
                        type="button"
                        onClick={() => openEditModal(emp)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-teal-500/20 dark:bg-slate-800 dark:hover:bg-teal-500/30 text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 transition-colors cursor-pointer"
                        title="Edit Employee (তথ্য এডিট করুন)"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50"
                        title="সম্পাদনা করার অনুমতি নেই"
                      >
                        <Edit2 className="w-4 h-4" />
                      </span>
                    )}
                    {onDeleteEmployee && canDeleteEmployeeProfile(emp) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteEmployee(emp)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-rose-500/20 dark:bg-slate-800 dark:hover:bg-rose-500/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Employee (মুছে ফেলুন)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedEmployee(emp)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="View Profile"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedEmployee(emp)}
                    className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>প্রোফাইল দেখুন (View Profile)</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Full Data Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Role & Designation</th>
                <th className="p-3">Branch & Dept</th>
                {canAccessConfidentialEmployeeData(currentUser) && (
                  <>
                    <th className="p-3">Biometrics & Device</th>
                    <th className="p-3">Gross Salary</th>
                    <th className="p-3">Status</th>
                  </>
                )}
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatarUrl}
                        alt={emp.fullName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                          <span>{emp.fullName}</span>
                          {Boolean(emp.isSuperAdmin || emp.role === "SUPER_ADMIN") && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                              Super Admin
                            </span>
                          )}
                          {Boolean(emp.isCeoOrOwner) && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              CEO
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
                          <span>{emp.employeeCode}</span>
                          <span>•</span>
                          <span className="text-teal-600 dark:text-teal-400 font-bold" title="লগইন ইউজারনেম">@{emp.username || emp.email.split("@")[0]}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-200">{emp.designationTitle}</div>
                    {emp.additionalDesignations && emp.additionalDesignations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {emp.additionalDesignations.map((d) => (
                          <span
                            key={d}
                            className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30"
                          >
                            + {d}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-[10px] text-teal-700 dark:text-teal-400 font-medium mt-0.5">
                      {emp.role.replace("_", " ")}
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="font-medium text-slate-900 dark:text-slate-200">{(emp.branchName || "Main Office").split("(")[0]}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{emp.departmentName}</div>
                  </td>

                  {canAccessConfidentialEmployeeData(currentUser) && (
                    <>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          {emp.faceTemplateRegistered ? (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                              title="Biometric Face Enrolled"
                            >
                              <ScanFace className="w-3 h-3" /> Enrolled
                            </span>
                          ) : (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30"
                              title="No Face Photo Enrolled"
                            >
                              <ScanFace className="w-3 h-3" /> No Photo
                            </span>
                          )}
                          {emp.boundDeviceId && (
                            <span
                              className="p-1 rounded bg-blue-500/15 text-blue-800 dark:text-blue-300 text-[10px] font-bold"
                              title={`Bound to ${emp.boundDeviceId}`}
                            >
                              <Smartphone className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 font-mono">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                          <span>৳{(emp.salary?.grossSalary ?? 0).toLocaleString()}</span>
                          {(emp.isFixedSalary || emp.isFixedContractSalary) && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                              ফিক্সড
                            </span>
                          )}
                        </div>
                        {emp.hideSalaryFromSelf && (
                          <span
                            className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 mt-0.5"
                            title="এই কর্মী তার নিজের সেলফ সার্ভিস অ্যাকাউন্টে বেতন দেখতে পারবেন না"
                          >
                            <Shield className="w-2.5 h-2.5" /> কর্মী থেকে গোপন
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            emp.status === "ACTIVE"
                              ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                    </>
                  )}

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {canAccessConfidentialEmployeeData(currentUser) ? (
                        <>
                          {onOpenDigitalIdCard && (
                            <button
                              onClick={() => onOpenDigitalIdCard(emp)}
                              className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/25 text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 border border-teal-500/30 transition-colors cursor-pointer"
                              title="View & Download Digital ID Card (ডিজিটাল আইডি কার্ড)"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setEnrollingEmployee(emp)}
                            className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 border border-teal-500/30 transition-colors cursor-pointer"
                            title="Enroll / Update Biometric Face Photo"
                          >
                            <ScanFace className="w-4 h-4" />
                          </button>
                          {canResetEmployeeCredentials(emp) && (
                            <button
                              type="button"
                              onClick={() => openQuickResetModal(emp)}
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/30 transition-colors cursor-pointer"
                              title="আইডি ও পাসওয়ার্ড রিসেট করুন (Reset Credentials)"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                          )}
                          {canEditEmployeeProfile(emp) ? (
                            <button
                              onClick={() => openEditModal(emp)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-teal-500/20 dark:bg-slate-800 dark:hover:bg-teal-500/30 text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 transition-colors cursor-pointer"
                              title="Edit Employee (তথ্য এডিট করুন)"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50"
                              title="সম্পাদনা করার অনুমতি নেই"
                            >
                              <Edit2 className="w-4 h-4" />
                            </span>
                          )}
                          {onDeleteEmployee && canDeleteEmployeeProfile(emp) && (
                            <button
                              onClick={() => handleDeleteEmployee(emp)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-500/20 dark:bg-slate-800 dark:hover:bg-rose-500/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete Employee (মুছে ফেলুন)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedEmployee(emp)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                            title="View Full Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setSelectedEmployee(emp)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-500/20 dark:bg-slate-800 dark:hover:bg-teal-500/30 text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>দেখুন</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Recycle Bin & Archive View */}
      {activeDirectoryTab === "recycle_bin" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Policy & Safety Notice */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold">কর্মী রিসাইকেল বিন ও নিরাপদ পুনরুদ্ধার সিস্টেম</h3>
                <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed max-w-3xl">
                  ভুলবশত কাউকে মুছে ফেলা হলে আপনি <strong>"পুনরুদ্ধার (Restore)"</strong> বাটনে ক্লিক করে তার পদবী, বেতন ও শাখাসহ পুনরায় সক্রিয় তালিকায় ফিরিয়ে আনতে পারবেন। আর কোনো কর্মীকে যদি <strong>"স্থায়ীভাবে মুছুন (Permanent Delete)"</strong> করেন, তবে ডাটাবেজ থেকে তার সমস্ত তথ্য চিরতরে মুছে যাবে এবং সিস্টেমের অন্য কোথাও আর পাওয়া যাবে না।
                </p>
              </div>
            </div>
            <div className="text-xs font-mono font-bold bg-amber-500/20 text-amber-900 dark:text-amber-200 px-3 py-1.5 rounded-xl shrink-0">
              মোট আর্কাইভড: {deletedEmployees.length} জন
            </div>
          </div>

          {/* Search & Filter for Deleted Employees */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={recycleSearchTerm}
                  onChange={(e) => setRecycleSearchTerm(e.target.value)}
                  placeholder="মুছে ফেলা কর্মীর নাম, আইডি, পদবী বা শাখা দিয়ে খুঁজুন..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
                />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                দেখাচ্ছে {filteredDeletedEmployees.length} / {deletedEmployees.length} জন রেকর্ড
              </span>
            </div>

            {filteredDeletedEmployees.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Archive className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">রিসাইকেল বিন খালি</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  বর্তমানে কোনো মুছে ফেলা বা আর্কাইভড কর্মীর রেকর্ড নেই। কোনো কর্মীকে সাময়িকভাবে ডিলিট করা হলে তা এখানে জমা থাকবে।
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-semibold">
                    <tr>
                      <th className="py-3 px-4">কর্মী পরিচিতি</th>
                      <th className="py-3 px-4">পদবী ও বিভাগ</th>
                      <th className="py-3 px-4">শাখা</th>
                      <th className="py-3 px-4">মুছে ফেলার বিবরণ</th>
                      <th className="py-3 px-4 text-right">কার্যক্রম (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredDeletedEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={emp.avatarUrl}
                              alt={emp.fullName}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 grayscale opacity-80"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{emp.fullName}</span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  আর্কাইভড
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{emp.employeeCode}</span>
                              <span className="text-[10px] text-slate-400 block">{emp.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{emp.designationTitle}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{emp.departmentName}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{emp.branchName}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                            {emp.deletedAt
                              ? new Date(emp.deletedAt).toLocaleString("bn-BD", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "তারিখ সংরক্ষিত নেই"}
                          </div>
                          <div className="text-[10px] text-slate-500">মুছেছেন: {emp.deletedBy || "অ্যাডমিন"}</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onRestoreEmployee?.(emp.id)}
                              className="px-3 py-1.5 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                              title="সক্রিয় তালিকায় ফিরিয়ে আনুন"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>রিস্টোর করুন</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPermanentDeleteTarget(emp)}
                              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                              title="স্থায়ীভাবে মুছে ফেলুন (ডাটাবেজ থেকে সম্পূর্ণ অপসারণ)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>স্থায়ীভাবে মুছুন</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: View Full Employee Profile Details */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-2xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={selectedEmployee.avatarUrl}
                  alt={selectedEmployee.fullName}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-500"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedEmployee.fullName}</h3>
                  <p className="text-xs text-teal-700 dark:text-teal-400">
                    {selectedEmployee.designationTitle} • {selectedEmployee.employeeCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Official Role</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedEmployee.role.replace("_", " ")}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Assigned Branch</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedEmployee.branchName}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Department</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedEmployee.departmentName}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Work Shift</span>
                <span className="font-bold text-teal-700 dark:text-teal-300">{selectedEmployee.shiftName}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">National ID (NID)</span>
                  {!(canAccessConfidentialEmployeeData(currentUser) || currentUser?.id === selectedEmployee.id) && (
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> {isBangla ? "গোপনীয়" : "Confidential"}
                    </span>
                  )}
                </div>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {canAccessConfidentialEmployeeData(currentUser) || currentUser?.id === selectedEmployee.id
                    ? selectedEmployee.nidNumber && selectedEmployee.nidNumber.trim() !== ""
                      ? selectedEmployee.nidNumber
                      : (isBangla ? "তথ্য দেওয়া হয়নি" : "Not provided")
                    : "•••• •••• •••• (সুরক্ষিত)"}
                </span>
              </div>
              {canAccessConfidentialEmployeeData(currentUser) && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Gross Salary</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    ৳{(selectedEmployee.salary?.grossSalary ?? 0).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                  {isBangla ? "জরুরী যোগাযোগ" : "Emergency Contact"}
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {selectedEmployee.emergencyPhone && selectedEmployee.emergencyPhone.trim() !== ""
                    ? selectedEmployee.emergencyPhone
                    : (isBangla ? "তথ্য দেওয়া হয়নি" : "Not provided")}
                </span>
              </div>
              <div className="sm:col-span-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                  {isBangla ? "বর্তমান ঠিকানা (Present Address)" : "Present Residential Address"}
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {selectedEmployee.presentAddress && selectedEmployee.presentAddress.trim() !== ""
                    ? selectedEmployee.presentAddress
                    : (isBangla ? "তথ্য দেওয়া হয়নি" : "Not provided")}
                </span>
              </div>
            </div>

            {canAccessConfidentialEmployeeData(currentUser) && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-slate-200">Biometric & Device Binding Status</h4>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>Face Vector Recognition:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    {selectedEmployee.faceTemplateRegistered ? "Enrolled (98%+ Match Precision)" : "Not Enrolled"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>Hardware Signature:</span>
                  <span className="font-mono text-teal-700 dark:text-teal-300">
                    {selectedEmployee.boundDeviceId || "DEV-NOT-BOUND"}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
              <div className="flex items-center gap-2">
                {canAccessConfidentialEmployeeData(currentUser) && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEnrollingEmployee(selectedEmployee);
                        setSelectedEmployee(null);
                      }}
                      className="px-3.5 py-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-800 dark:text-teal-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ScanFace className="w-4 h-4" />
                      <span>Re-Enroll Face</span>
                    </button>

                    {onOpenDigitalIdCard && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenDigitalIdCard(selectedEmployee);
                        }}
                        className="px-3.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>ডিজিটাল আইডি কার্ড (Digital ID)</span>
                      </button>
                    )}

                    {(canAccessConfidentialEmployeeData(currentUser) || currentUser?.id === selectedEmployee.id) && (
                      <>
                        <button
                          type="button"
                          onClick={() => setViewingResumeEmployee(selectedEmployee)}
                          className="px-3.5 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-800 dark:text-purple-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          title="এ ফোর সাইজ রিজিউমে ও এনআইডি ডকুমেন্ট ভিউ করুন"
                        >
                          <FileText className="w-4 h-4" />
                          <span>{isBangla ? "রিজিউমে ও এনআইডি (A4 Resume)" : "A4 Resume & NID"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingCvEmployee(selectedEmployee)}
                          className="px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-800 dark:text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          title="সিভি ও ডকুমেন্টস তথ্য এডিট করুন"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>{isBangla ? "সিভি এডিট (Edit CV)" : "Edit CV"}</span>
                        </button>
                      </>
                    )}

                    {canEditEmployeeProfile(selectedEmployee) && (
                      <button
                        type="button"
                        onClick={() => {
                          openEditModal(selectedEmployee);
                        }}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-teal-500/20 dark:bg-slate-800 dark:hover:bg-teal-500/30 text-slate-700 dark:text-slate-200 hover:text-teal-700 dark:hover:text-teal-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>তথ্য এডিট করুন (Edit)</span>
                      </button>
                    )}

                    {onDeleteEmployee && canDeleteEmployeeProfile(selectedEmployee) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteEmployee(selectedEmployee)}
                        className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-rose-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>মুছে ফেলুন (Delete)</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                বন্ধ করুন (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Biometric Face Enrollment Modal */}
      {enrollingEmployee && (
        <FaceEnrollmentModal
          isOpen={Boolean(enrollingEmployee)}
          onClose={() => setEnrollingEmployee(null)}
          employee={enrollingEmployee}
          isSuperAdmin={currentUser?.role === "SUPER_ADMIN"}
          onSaveFacePhoto={(empId, photoUrl, verificationScore, faceDescriptor) => {
            const isVerified = typeof verificationScore === "number" && verificationScore > 0;
            const updated = {
              ...enrollingEmployee,
              faceRegisteredPhoto: photoUrl,
              avatarUrl: photoUrl,
              faceTemplateRegistered: isVerified,
              faceVerified: isVerified,
              faceVerificationRequired: !isVerified,
              faceRegisteredAt: new Date().toISOString().split("T")[0],
              faceVerifiedAt: isVerified ? new Date().toISOString() : undefined,
              faceVerificationScore: isVerified ? verificationScore : undefined,
              faceDescriptor: faceDescriptor || enrollingEmployee.faceDescriptor,
            };
            onUpdateEmployee(updated);
            setEnrollingEmployee(null);
          }}
        />
      )}

      {/* Modal: Add New Employee (30+ Fields) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-3xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Enroll New Employee Record</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold">
                      Employee Code / ID (ইউনিক আইডি) *
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoAssignId}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                    >
                      অটো সিরিয়াল নিন
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newEmpCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setNewEmpCode(val);
                      const num = extractEmployeeNumber(val);
                      if (num !== null) {
                        setNewUsername(formatUserId(num, getEmployeeIdPrefix()));
                      }
                    }}
                    placeholder="e.g. MWO1001"
                    className={`w-full bg-white dark:bg-slate-950 border rounded-xl p-2.5 text-slate-900 dark:text-white font-mono font-bold tracking-wide ${
                      addIdValidation.available
                        ? "border-emerald-300 dark:border-emerald-700/60 focus:ring-emerald-500"
                        : "border-rose-400 dark:border-rose-700 focus:ring-rose-500"
                    }`}
                    required
                  />
                  <div className="mt-1">
                    {addIdValidation.available ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> ইউনিক ও ব্যবহারযোগ্য আইডি ({newEmpCode})
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {addIdValidation.reason}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Mohammad Rahim / John Doe"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="example@xyz.com"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. +880 1712-345678"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Branch Office</label>
                  <select
                    value={newBranchId}
                    onChange={(e) => setNewBranchId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold">Department *</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleOpenAddDeptModal}
                        className="text-[11px] text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> নতুন বিভাগ
                      </button>
                      {newDeptId && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditDeptModal(newDeptId)}
                            className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <Edit2 className="w-2.5 h-2.5" /> এডিট
                          </button>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <button
                            type="button"
                            onClick={() => setInlineDeleteDeptTarget(departments.find((d) => d.id === newDeptId) || null)}
                            className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <Trash2 className="w-2.5 h-2.5" /> মুছুন
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <select
                    value={newDeptId}
                    onChange={(e) => setNewDeptId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold">Designation *</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleOpenAddDesigModal}
                        className="text-[11px] text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> নতুন পদবি
                      </button>
                      {newDesigId && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditDesigModal(newDesigId)}
                            className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <Edit2 className="w-2.5 h-2.5" /> এডিট
                          </button>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <button
                            type="button"
                            onClick={() => setInlineDeleteDesigTarget(designations.find((d) => d.id === newDesigId) || null)}
                            className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <Trash2 className="w-2.5 h-2.5" /> মুছুন
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <select
                    value={newDesigId}
                    onChange={(e) => {
                      const selVal = e.target.value;
                      setNewDesigId(selVal);
                      const found = designations.find((d) => d.id === selVal);
                      if (found && found.departmentId) {
                        setNewDeptId(found.departmentId);
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "সিস্টেমের রোল (System Role)" : "System Role (RBAC)"}
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => {
                      const selRole = e.target.value;
                      setNewRole(selRole as any);
                      const autoTabs = getDefaultTabsForRole(selRole, rolePermissions);
                      setNewAllowedTabs(autoTabs);
                      setNewHasCustomTabAccess(false);
                      if (selRole === "SUPER_ADMIN") {
                        setNewIsSuperAdmin(true);
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    {rolePermissions && rolePermissions.length > 0 ? (
                      rolePermissions.map((rp) => (
                        <option key={rp.role} value={rp.role}>
                          {isBangla ? rp.roleTitleBn : rp.roleTitleEn} ({rp.role})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="EMPLOYEE">Employee (General Staff)</option>
                        <option value="PROJECT_MANAGER">Project Manager / Team Lead</option>
                        <option value="BRANCH_MANAGER">Branch Manager</option>
                        <option value="HR_MANAGER">HR Manager</option>
                        <option value="ACCOUNTS_MANAGER">Accounts Manager</option>
                        <option value="COMPANY_ADMIN">Company Admin</option>
                        <option value="SUPER_ADMIN">Super Admin (Full Access)</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Assigned Shift</label>
                  <select
                    value={newShiftId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      setNewShiftId(selId);
                      const selShift = shifts.find((s) => s.id === selId);
                      if (selShift?.isFlexible || selShift?.name.toLowerCase().includes("flexible") || selShift?.name.includes("ফ্লেক্সিবল")) {
                        setNewFlexibleHours(true);
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {newFixedContractSalary ? (isBangla ? "ফিক্সড মাসিক বেতন (Fixed Salary ৳)" : "Fixed Monthly Salary (BDT ৳)") : "Basic Monthly Salary (৳ BDT)"}
                  </label>
                  <input
                    type="number"
                    value={newBasicSalary}
                    onChange={(e) => setNewBasicSalary(e.target.value === "" ? 0 : Number(e.target.value))}
                    step={2000}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {newFixedContractSalary ? (
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        গ্রস স্যালারি: ৳{(Number(newBasicSalary) || 0).toLocaleString()} (ফিক্সড - কোনো মাসিক অতিরিক্ত সুবিধা যোগ হবে না)
                      </span>
                    ) : (
                      <span>
                        গ্রস স্যালারি: ৳{Math.round((Number(newBasicSalary) || 0) * 1.77).toLocaleString()} (বেসিক + ৭৭% বাড়িভাড়া ও সুবিধা)
                      </span>
                    )}
                  </span>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "জাতীয় পরিচয়পত্র নম্বর (NID)" : "National ID (NID)"}
                  </label>
                  <input
                    type="text"
                    name="emp_new_nid"
                    id="emp_new_nid_field"
                    autoComplete="off"
                    data-lpignore="true"
                    value={newNid}
                    onChange={(e) => setNewNid(e.target.value)}
                    placeholder={isBangla ? "তথ্য না থাকলে সম্পূর্ণ খালি রাখুন" : "Leave completely blank if not available"}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Blood Group</label>
                  <select
                    value={newBloodGroup}
                    onChange={(e) => setNewBloodGroup(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {isBangla ? "বর্তমান ঠিকানা (Present Address)" : "Present Residential Address"}
                  </label>
                  <input
                    type="text"
                    name="emp_new_address"
                    id="emp_new_address_field"
                    autoComplete="off"
                    data-lpignore="true"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder={isBangla ? "তথ্য না থাকলে সম্পূর্ণ খালি রাখুন" : "Leave completely blank if not available"}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {isBangla ? "জরুরি যোগাযোগের ফোন নম্বর" : "Emergency Contact Phone"}
                  </label>
                  <input
                    type="tel"
                    name="emp_new_emergency_phone"
                    id="emp_new_emergency_phone_field"
                    autoComplete="off"
                    data-lpignore="true"
                    value={newEmergencyPhone}
                    onChange={(e) => setNewEmergencyPhone(e.target.value)}
                    placeholder={isBangla ? "তথ্য না থাকলে সম্পূর্ণ খালি রাখুন" : "Leave completely blank if not available"}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Login Account & Privacy Configuration (Super Admin Control) */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold">
                  <KeyRound className="w-4 h-4" />
                  <span>লগইন অ্যাকাউন্ট ও নিরাপত্তা কন্ট্রোল (Login Account & Security)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                      ইউজার আইডি / ইউজারনেম (User ID / Username)
                    </label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                      placeholder={newEmpCode ? formatUserId(extractEmployeeNumber(newEmpCode) || 1001, getEmployeeIdPrefix()) : "mwo1001"}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white font-mono lowercase"
                    />
                    <span className="text-[10px] text-slate-400">ছোট হাতের অক্ষরে আইডি (যেমন: {formatUserId(extractEmployeeNumber(newEmpCode) || 1001, getEmployeeIdPrefix())}), কোনো হাইফেন নেই</span>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                      প্রাথমিক পাসওয়ার্ড (Initial Password)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="123456"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 pr-10 text-slate-900 dark:text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400">কর্মী তার একাউন্টে ঢুকে এই পাসওয়ার্ড পরিবর্তন করতে পারবেন</span>
                  </div>
                </div>

                {/* Role & Salary Privacy Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <label className="flex items-start gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-purple-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={newIsSuperAdmin}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setNewIsSuperAdmin(checked);
                        if (checked) {
                          setNewAllowedTabs(APP_TAB_OPTIONS.map((t) => t.id));
                        }
                      }}
                      className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-purple-600" />
                        <span>সুপার অ্যাডমিন</span>
                      </div>
                      <p className="text-[10px] text-slate-500">সব ক্ষমতা ও রিসেট সুবিধা</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-amber-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={newIsCeoOrOwner}
                      onChange={(e) => setNewIsCeoOrOwner(e.target.checked)}
                      className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                        <span>প্রতিষ্ঠান প্রধান / CEO</span>
                      </div>
                      <p className="text-[10px] text-slate-500">নির্বাহী প্রধানের মর্যাদা</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-teal-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={newHideSalaryFromSelf}
                      onChange={(e) => setNewHideSalaryFromSelf(e.target.checked)}
                      className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-rose-500" />
                        <span>বেতন গোপন রাখুন</span>
                      </div>
                      <p className="text-[10px] text-slate-500">কর্মী বেতন দেখতে পাবে না</p>
                    </div>
                  </label>
                </div>

                {/* Biometric & Attendance Exceptions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <label className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-teal-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={newIsAttendanceExempt}
                      onChange={(e) => setNewIsAttendanceExempt(e.target.checked)}
                      className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span>হাজিরা অব্যাহতি (Exempt from Attendance)</span>
                      </div>
                      <p className="text-[10px] text-slate-500">দেরি বা অনুপস্থিতির জরিমানা প্রযোজ্য হবে না (CEO/পরিচালক)</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={newFaceVerified}
                      onChange={(e) => setNewFaceVerified(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <ScanFace className="w-3.5 h-3.5 text-blue-600" />
                        <span>বায়োমেট্রিক ফেস ভেরিফায়েড</span>
                      </div>
                      <p className="text-[10px] text-slate-500">ফেস ডাটা আগেই অনুমোদিত বলে গণ্য হবে</p>
                    </div>
                  </label>
                </div>

                {/* Field Staff, Flexible Hours & Salary Protection Toggles */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>ফিল্ড স্টাফ, কাজের সময় স্বাধীনতা ও বেতন সুরক্ষা নীতি</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <label className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-amber-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={newFlexibleHours}
                        onChange={(e) => {
                          const isFlex = e.target.checked;
                          setNewFlexibleHours(isFlex);
                          if (isFlex) {
                            const flexShift = shifts.find(
                              (s) => s.isFlexible || s.name.toLowerCase().includes("flexible") || s.name.includes("ফ্লেক্সিবল")
                            );
                            if (flexShift) setNewShiftId(flexShift.id);
                          } else {
                            const currentShift = shifts.find((s) => s.id === newShiftId);
                            if (currentShift?.isFlexible || currentShift?.name.toLowerCase().includes("flexible") || currentShift?.name.includes("ফ্লেক্সিবল")) {
                              const regShift = shifts.find((s) => !s.isFlexible && !s.name.toLowerCase().includes("flexible")) || shifts[0];
                              if (regShift) setNewShiftId(regShift.id);
                            }
                          }
                        }}
                        className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>ফ্লেক্সিবল শিফট</span>
                        </div>
                        <p className="text-[10px] text-slate-500">যখন খুশি কাজ করতে পারবেন, কোনো নির্দিষ্ট অফিস টাইম বাধা নেই</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-emerald-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={newSalaryProtected}
                        onChange={(e) => setNewSalaryProtected(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>বেতন সুরক্ষা (Protected)</span>
                        </div>
                        <p className="text-[10px] text-slate-500">দেরি বা অনুপস্থিতিতে কোনো বেতন কর্তন হবে না</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={newFixedContractSalary}
                        onChange={(e) => setNewFixedContractSalary(e.target.checked)}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <Banknote className="w-3.5 h-3.5 text-blue-600" />
                          <span>চুক্তিভিত্তিক ফিক্সড পে</span>
                        </div>
                        <p className="text-[10px] text-slate-500">কাজের দিন কম-বেশি হলেও শতভাগ অপরিবর্তিত ফিক্সড বেতন</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Allowed Tabs & Navigation Permissions */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        <LayoutDashboard className="w-3.5 h-3.5 text-teal-600" />
                        {isBangla ? "দৃশ্যমান মেনু ও অ্যাক্সেস কন্ট্রোল (Allowed Navigation Tabs)" : "Allowed Navigation Tabs"}
                      </span>
                      <p className="text-[10px] text-slate-500">
                        {!newHasCustomTabAccess
                          ? (isBangla ? "✓ রোলের ডিফল্ট মোড সক্রিয়: নির্বাচিত রোলের সব অনুমোদিত মেনু স্বয়ংক্রিয়ভাবে পাবে।" : "✓ Role Default active: automatically inherits all menus allowed for this role.")
                          : (isBangla ? "⚠️ কাস্টম মোড সক্রিয়: এই কর্মীর জন্য মেনু ম্যানুয়ালি ওভাররাইড করা হয়েছে।" : "⚠️ Custom Override active: navigation tabs customized for this staff member.")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setNewAllowedTabs(getDefaultTabsForRole(newRole, rolePermissions));
                          setNewHasCustomTabAccess(false);
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 flex items-center gap-1 cursor-pointer"
                        title="নির্বাচিত রোলের ডিফল্ট মেনু রিস্টোর করুন"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        {isBangla ? "রোলের ডিফল্ট রিসেট" : "Reset to Role"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewAllowedTabs(APP_TAB_OPTIONS.map((t) => t.id));
                          setNewHasCustomTabAccess(true);
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        {isBangla ? "সব মেনু" : "All Tabs"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewAllowedTabs(normalizeTabList(DEFAULT_EMPLOYEE_ALLOWED_TABS));
                          setNewHasCustomTabAccess(true);
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        {isBangla ? "সাধারণ কর্মী" : "Standard"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-44 overflow-y-auto p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    {APP_TAB_OPTIONS.map((tab) => {
                      const isChecked = isTabAllowedInList(tab.id, newAllowedTabs);
                      return (
                        <label
                          key={tab.id}
                          className={`flex items-center gap-1.5 p-1.5 rounded text-[11px] cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 font-medium"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              setNewHasCustomTabAccess(true);
                              if (e.target.checked) {
                                setNewAllowedTabs(normalizeTabList([...newAllowedTabs, tab.id]));
                              } else {
                                setNewAllowedTabs(
                                  newAllowedTabs.filter((id) => {
                                    if (id === tab.id) return false;
                                    if (tab.id === "my-portal" && id === "self-service") return false;
                                    if (tab.id === "self-service" && id === "my-portal") return false;
                                    if (tab.id === "branches" && id === "branches-geofence") return false;
                                    if (tab.id === "branches-geofence" && id === "branches") return false;
                                    return true;
                                  })
                                );
                              }
                            }}
                            className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className="truncate">{isBangla ? tab.labelBn : tab.labelEn}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  Save & Enroll Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Employee */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-3xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-8 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    কর্মকর্তা/কর্মচারীর তথ্য সম্পাদনা (Edit Employee)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingEmployee.fullName} ({editingEmployee.employeeCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              {/* Basic Identifiers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    Employee Code / ID *
                  </label>
                  <input
                    type="text"
                    value={editEmpCode}
                    onChange={(e) => setEditEmpCode(e.target.value.toUpperCase())}
                    className={`w-full bg-white dark:bg-slate-950 border rounded-xl p-2.5 text-slate-900 dark:text-white font-mono font-bold ${
                      editIdValidation.available
                        ? "border-slate-200 dark:border-slate-700"
                        : "border-rose-400 dark:border-rose-700 focus:ring-rose-500"
                    }`}
                    required
                  />
                  {!editIdValidation.available && (
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium mt-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {editIdValidation.reason}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    Account Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE (সক্রিয়)</option>
                    <option value="ON_LEAVE">ON LEAVE (ছুটিতে)</option>
                    <option value="PROBATION">PROBATION (প্রবেশন)</option>
                    <option value="TERMINATED">TERMINATED (স্থগিত)</option>
                  </select>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* Organizational Structure */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    Assigned Branch *
                  </label>
                  <select
                    value={editBranchId}
                    onChange={(e) => setEditBranchId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold">
                      Department *
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleOpenAddDeptModal}
                        className="text-[11px] text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> নতুন বিভাগ
                      </button>
                      {editDeptId && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditDeptModal(editDeptId)}
                            className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <Edit2 className="w-2.5 h-2.5" /> এডিট
                          </button>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <button
                            type="button"
                            onClick={() => setInlineDeleteDeptTarget(departments.find((d) => d.id === editDeptId) || null)}
                            className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <Trash2 className="w-2.5 h-2.5" /> মুছুন
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <select
                    value={editDeptId}
                    onChange={(e) => setEditDeptId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold">
                      Designation (মূল পদবী) *
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleOpenAddDesigModal}
                        className="text-[11px] text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> নতুন পদবি
                      </button>
                      {editDesigId && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditDesigModal(editDesigId)}
                            className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <Edit2 className="w-2.5 h-2.5" /> এডিট
                          </button>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <button
                            type="button"
                            onClick={() => setInlineDeleteDesigTarget(designations.find((d) => d.id === editDesigId) || null)}
                            className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <Trash2 className="w-2.5 h-2.5" /> মুছুন
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <select
                      value={editDesigId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditDesigId(val);
                        const found = designations.find((d) => d.id === val);
                        if (found) {
                          setCustomDesignationTitle(found.title);
                          if (found.departmentId) {
                            setEditDeptId(found.departmentId);
                          }
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    >
                      {designations.map((des) => (
                        <option key={des.id} value={des.id}>
                          {des.title} ({des.code})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="বা কাস্টম মূল পদবী লিখুন (যেমন: Chief Executive Officer)"
                      value={customDesignationTitle}
                      onChange={(e) => setCustomDesignationTitle(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Role & Work Shift */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {isBangla ? "সিস্টেমের রোল (System Role)" : "System Security Role"}
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => {
                      const selectedRoleKey = e.target.value;
                      setEditRole(selectedRoleKey as any);
                      const autoTabs = getDefaultTabsForRole(selectedRoleKey, rolePermissions);
                      setEditAllowedTabs(autoTabs);
                      setEditHasCustomTabAccess(false);
                      if (selectedRoleKey === "SUPER_ADMIN") {
                        setEditIsSuperAdmin(true);
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    {rolePermissions && rolePermissions.length > 0 ? (
                      rolePermissions.map((rp) => (
                        <option key={rp.role} value={rp.role}>
                          {isBangla ? rp.roleTitleBn : rp.roleTitleEn} ({rp.role})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="EMPLOYEE">Standard Employee</option>
                        <option value="HR_MANAGER">HR Manager</option>
                        <option value="SUPER_ADMIN">Super Administrator</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    Work Shift Schedule
                  </label>
                  <select
                    value={editShiftId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      setEditShiftId(selId);
                      const selShift = shifts.find((s) => s.id === selId);
                      if (selShift?.isFlexible || selShift?.name.toLowerCase().includes("flexible") || selShift?.name.includes("ফ্লেক্সিবল")) {
                        setEditFlexibleHours(true);
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={editJoiningDate}
                    onChange={(e) => setEditJoiningDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Salary & Legal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {editFixedContractSalary ? (isBangla ? "ফিক্সড মাসিক বেতন (Fixed Salary BDT ৳)" : "Fixed Monthly Salary (BDT ৳)") : "Basic Salary (BDT ৳)"}
                  </label>
                  <input
                    type="number"
                    value={editBasicSalary}
                    onChange={(e) => setEditBasicSalary(e.target.value === "" ? 0 : Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {editFixedContractSalary ? (
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        গ্রস স্যালারি: ৳{(Number(editBasicSalary) || 0).toLocaleString()} (ফিক্সড - কোনো মাসিক অতিরিক্ত সুবিধা যোগ হবে না)
                      </span>
                    ) : (
                      <span>
                        গ্রস স্যালারি: ৳{Math.round((Number(editBasicSalary) || 0) * 1.77).toLocaleString()} (বেসিক + ৭৭% বাড়িভাড়া, চিকিৎসা, যাতায়াত ভাতা)
                      </span>
                    )}
                  </span>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {isBangla ? "জাতীয় পরিচয়পত্র নম্বর (NID)" : "National ID (NID)"}
                  </label>
                  <input
                    type="text"
                    value={editNid}
                    onChange={(e) => setEditNid(e.target.value)}
                    placeholder={isBangla ? "এনআইডি কার্ড নম্বর (ঐচ্ছিক)" : "NID number (optional)"}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {isBangla ? "রক্তের গ্রুপ (Blood Group)" : "Blood Group"}
                  </label>
                  <select
                    value={editBloodGroup}
                    onChange={(e) => setEditBloodGroup(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              {/* Address & Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {isBangla ? "বর্তমান ঠিকানা (Present Address)" : "Present Residential Address"}
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder={isBangla ? "বর্তমান ঠিকানা লিখুন (ঐচ্ছিক)" : "Enter present address (optional)"}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {isBangla ? "জরুরি যোগাযোগের ফোন নম্বর" : "Emergency Contact Phone"}
                  </label>
                  <input
                    type="tel"
                    value={editEmergencyPhone}
                    onChange={(e) => setEditEmergencyPhone(e.target.value)}
                    placeholder={isBangla ? "জরুরি যোগাযোগের নম্বর (ঐচ্ছিক)" : "Emergency phone (optional)"}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Account Credentials, Role Flags & Salary Visibility (Super Admin Control) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold">
                    <KeyRound className="w-4 h-4" />
                    <span>লগইন অ্যাকাউন্ট ও নিরাপত্তা কন্ট্রোল (Super Admin Credential & Access Control)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                    সুপার অ্যাডমিন কর্তৃত্ব
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold flex items-center justify-between">
                      <span>ইউজার আইডি / ইউজারনেম (Login User ID / Username)</span>
                      {currentUser?.role !== "SUPER_ADMIN" && (
                        <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> শুধুমাত্র সুপার অ্যাডমিন
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      disabled={currentUser?.role !== "SUPER_ADMIN"}
                      placeholder="username"
                      className={`w-full border rounded-xl p-2 text-slate-900 dark:text-white font-mono ${
                        currentUser?.role !== "SUPER_ADMIN"
                          ? "bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 cursor-not-allowed opacity-75"
                          : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                      }`}
                    />
                    <span className="text-[10px] text-slate-400">
                      {currentUser?.role === "SUPER_ADMIN"
                        ? "সুপার অ্যাডমিন হিসেবে আপনি কর্মীর ইউজার আইডি পরিবর্তন করতে পারবেন।"
                        : "🔒 ইউজার আইডি পরিবর্তন করার ক্ষমতা শুধুমাত্র সুপার অ্যাডমিনের রয়েছে।"}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        {isBangla ? "অ্যাকাউন্ট পাসওয়ার্ড ব্যবস্থাপনা" : "Account Password Management"}
                      </label>
                      {isEditingPassword && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingPassword(false);
                            setEditPassword("");
                          }}
                          className="text-[10px] text-rose-600 hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> {isBangla ? "বাতিল (অপরিবর্তিত রাখুন)" : "Cancel (Keep Unchanged)"}
                        </button>
                      )}
                    </div>
                    {!isEditingPassword ? (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <span className="text-xs">🔒 {isBangla ? "বর্তমান পাসওয়ার্ড সক্রিয় ও অপরিবর্তিত রয়েছে" : "Current password is unchanged"}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingPassword(true)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white cursor-pointer transition-colors shadow-sm"
                        >
                          {isBangla ? "নতুন পাসওয়ার্ড সেট করুন" : "Change Password"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="relative">
                          <input
                            type={showEditPassword ? "text" : "password"}
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            autoComplete="new-password"
                            placeholder={isBangla ? "নতুন পাসওয়ার্ড লিখুন..." : "Enter new password..."}
                            className="w-full bg-white dark:bg-slate-950 border border-teal-500 rounded-xl p-2 pr-10 text-slate-900 dark:text-white font-mono text-xs focus:ring-1 focus:ring-teal-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowEditPassword(!showEditPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-medium">
                          {isBangla ? "⚠️ নতুন পাসওয়ার্ড দেওয়া হলে সেভ করার সাথে সাথে কর্মীর নতুন পাসওয়ার্ড সক্রিয় হবে।" : "⚠️ A new password will be applied upon saving."}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Role & Salary Privacy Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-purple-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={editIsSuperAdmin}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setEditIsSuperAdmin(checked);
                        if (checked) {
                          setEditAllowedTabs(APP_TAB_OPTIONS.map((t) => t.id));
                        }
                      }}
                      className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-purple-600" />
                        <span>সুপার অ্যাডমিন</span>
                      </div>
                      <p className="text-[10px] text-slate-500">সকল মেনু, তথ্য ও পাসওয়ার্ড রিসেটের সর্বোচ্চ ক্ষমতা</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-amber-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={editIsCeoOrOwner}
                      onChange={(e) => setEditIsCeoOrOwner(e.target.checked)}
                      className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                        <span>প্রতিষ্ঠান প্রধান / CEO</span>
                      </div>
                      <p className="text-[10px] text-slate-500">প্রতিষ্ঠানের প্রশাসনিক ও নির্বাহী প্রধান মর্যাদা</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-rose-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={editHideSalaryFromSelf}
                      onChange={(e) => setEditHideSalaryFromSelf(e.target.checked)}
                      className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-rose-500" />
                        <span>বেতন গোপন রাখুন</span>
                      </div>
                      <p className="text-[10px] text-slate-500">কর্মী নিজের একাউন্টে নিজের বেতন ও পে-স্লিপ দেখতে পাবেন না</p>
                    </div>
                  </label>
                </div>

                {/* Biometric & Attendance Exceptions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <label className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-teal-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={editIsAttendanceExempt}
                      onChange={(e) => setEditIsAttendanceExempt(e.target.checked)}
                      className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span>হাজিরা অব্যাহতি (Exempt from Attendance)</span>
                      </div>
                      <p className="text-[10px] text-slate-500">দেরি বা অনুপস্থিতির জরিমানা প্রযোজ্য হবে না (CEO/পরিচালক)</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={editFaceVerified}
                      onChange={(e) => setEditFaceVerified(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <ScanFace className="w-3.5 h-3.5 text-blue-600" />
                        <span>বায়োমেট্রিক ফেস ভেরিফায়েড</span>
                      </div>
                      <p className="text-[10px] text-slate-500">ফেস ডাটা আগেই অনুমোদিত বলে গণ্য হবে</p>
                    </div>
                  </label>
                </div>

                {/* Field Staff, Flexible Hours & Salary Protection Toggles */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>ফিল্ড স্টাফ, কাজের সময় স্বাধীনতা ও বেতন সুরক্ষা নীতি</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <label className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-amber-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={editFlexibleHours}
                        onChange={(e) => {
                          const isFlex = e.target.checked;
                          setEditFlexibleHours(isFlex);
                          if (isFlex) {
                            const flexShift = shifts.find(
                              (s) => s.isFlexible || s.name.toLowerCase().includes("flexible") || s.name.includes("ফ্লেক্সিবল")
                            );
                            if (flexShift) setEditShiftId(flexShift.id);
                          } else {
                            const currentShift = shifts.find((s) => s.id === editShiftId);
                            if (currentShift?.isFlexible || currentShift?.name.toLowerCase().includes("flexible") || currentShift?.name.includes("ফ্লেক্সিবল")) {
                              const regShift = shifts.find((s) => !s.isFlexible && !s.name.toLowerCase().includes("flexible")) || shifts[0];
                              if (regShift) setEditShiftId(regShift.id);
                            }
                          }
                        }}
                        className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>ফ্লেক্সিবল শিফট</span>
                        </div>
                        <p className="text-[10px] text-slate-500">যখন খুশি কাজ করতে পারবেন, কোনো নির্দিষ্ট অফিস টাইম বাধা নেই</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-emerald-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={editSalaryProtected}
                        onChange={(e) => setEditSalaryProtected(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>বেতন সুরক্ষা (Protected)</span>
                        </div>
                        <p className="text-[10px] text-slate-500">দেরি বা অনুপস্থিতিতে কোনো বেতন কর্তন হবে না</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={editFixedContractSalary}
                        onChange={(e) => setEditFixedContractSalary(e.target.checked)}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <Banknote className="w-3.5 h-3.5 text-blue-600" />
                          <span>চুক্তিভিত্তিক ফিক্সড পে</span>
                        </div>
                        <p className="text-[10px] text-slate-500">কাজের দিন কম-বেশি হলেও শতভাগ অপরিবর্তিত ফিক্সড বেতন</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Allowed Tabs & Navigation Permissions */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        <LayoutDashboard className="w-3.5 h-3.5 text-teal-600" />
                        {isBangla ? "দৃশ্যমান মেনু ও অ্যাক্সেস কন্ট্রোল (Allowed Navigation Tabs)" : "Allowed Navigation Tabs"}
                      </span>
                      <p className="text-[10px] text-slate-500">
                        {!editHasCustomTabAccess
                          ? (isBangla ? "✓ রোলের ডিফল্ট মোড সক্রিয়: নির্বাচিত রোলের সব অনুমোদিত মেনু ড্যাশবোর্ডে স্বয়ংক্রিয়ভাবে পাবে।" : "✓ Role Default active: automatically inherits all menus allowed for this role.")
                          : (isBangla ? "⚠️ কাস্টম মোড সক্রিয়: এই কর্মীর জন্য মেনু ম্যানুয়ালি ওভাররাইড করা হয়েছে।" : "⚠️ Custom Override active: navigation tabs customized for this staff member.")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setEditAllowedTabs(getDefaultTabsForRole(editRole, rolePermissions));
                          setEditHasCustomTabAccess(false);
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 flex items-center gap-1 cursor-pointer"
                        title="নির্বাচিত রোলের ডিফল্ট মেনু রিস্টোর করুন"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        {isBangla ? "রোলের ডিফল্ট রিসেট" : "Reset to Role"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditAllowedTabs(APP_TAB_OPTIONS.map((t) => t.id));
                          setEditHasCustomTabAccess(true);
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        {isBangla ? "সব মেনু" : "All Tabs"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditAllowedTabs(normalizeTabList(DEFAULT_EMPLOYEE_ALLOWED_TABS));
                          setEditHasCustomTabAccess(true);
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        {isBangla ? "সাধারণ কর্মী" : "Standard"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    {APP_TAB_OPTIONS.map((tab) => {
                      const isChecked = isTabAllowedInList(tab.id, editAllowedTabs);
                      return (
                        <label
                          key={tab.id}
                          className={`flex items-center gap-1.5 p-1.5 rounded text-[11px] cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 font-medium"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              setEditHasCustomTabAccess(true);
                              if (e.target.checked) {
                                setEditAllowedTabs(normalizeTabList([...editAllowedTabs, tab.id]));
                              } else {
                                setEditAllowedTabs(
                                  editAllowedTabs.filter((id) => {
                                    if (id === tab.id) return false;
                                    if (tab.id === "my-portal" && id === "self-service") return false;
                                    if (tab.id === "self-service" && id === "my-portal") return false;
                                    if (tab.id === "branches" && id === "branches-geofence") return false;
                                    if (tab.id === "branches-geofence" && id === "branches") return false;
                                    return true;
                                  })
                                );
                              }
                            }}
                            className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className="truncate">{isBangla ? tab.labelBn : tab.labelEn}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  Save Employee Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Super Admin Quick Reset & Permissions */}
      {quickResetEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-lg text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    আইডি, পাসওয়ার্ড ও অ্যাক্সেস নিয়ন্ত্রণ
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {quickResetEmployee.fullName} ({quickResetEmployee.employeeCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickResetEmployee(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> সুপার অ্যাডমিন কন্ট্রোল প্যানেল
                </p>
                <p className="text-[11px] leading-relaxed">
                  সুপার অ্যাডমিন হিসেবে আপনি যেকোনো কর্মীর ইউজার আইডি, পাসওয়ার্ড এবং অ্যাক্সেস পারমিশন অবিলম্বে পরিবর্তন বা রিসেট করতে পারেন।
                </p>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold flex items-center justify-between">
                  <span>ইউজার আইডি / ইউজারনেম (Login User ID)</span>
                  {currentUser?.role !== "SUPER_ADMIN" && (
                    <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> শুধুমাত্র সুপার অ্যাডমিন
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={quickResetUsername}
                  onChange={(e) => setQuickResetUsername(e.target.value)}
                  disabled={currentUser?.role !== "SUPER_ADMIN"}
                  placeholder="username"
                  className={`w-full border rounded-xl p-2.5 text-slate-900 dark:text-white font-mono ${
                    currentUser?.role !== "SUPER_ADMIN"
                      ? "bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 cursor-not-allowed opacity-75"
                      : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                  }`}
                />
                {currentUser?.role !== "SUPER_ADMIN" && (
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    🔒 ইউজার আইডি পরিবর্তনের ক্ষমতা শুধুমাত্র সুপার অ্যাডমিনের রয়েছে।
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 dark:text-slate-400 font-semibold">
                    নতুন পাসওয়ার্ড (Account Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuickResetPassword("123456")}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> ডিফল্ট (123456) এ রিসেট
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showQuickResetPassword ? "text" : "password"}
                    value={quickResetPassword}
                    onChange={(e) => setQuickResetPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড লিখুন..."
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pr-10 text-slate-900 dark:text-white font-mono font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowQuickResetPassword(!showQuickResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showQuickResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  কর্মী তার নিজের প্রোফাইল থেকে পরবর্তীতে এই পাসওয়ার্ড পরিবর্তন করতে পারবেন।
                </p>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">সুপার অ্যাডমিন ক্ষমতা (Super Admin)</div>
                      <div className="text-[10px] text-slate-500">প্রতিষ্ঠানের সকল ডেটা ও সিস্টেমের পূর্ণ নিয়ন্ত্রণ</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={quickResetIsSuperAdmin}
                    onChange={(e) => setQuickResetIsSuperAdmin(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">প্রতিষ্ঠান প্রধান / CEO (Executive Head)</div>
                      <div className="text-[10px] text-slate-500">প্রতিষ্ঠানের প্রধান হিসেবে পরিচিতি ও ক্ষমতা</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={quickResetIsCeoOrOwner}
                    onChange={(e) => setQuickResetIsCeoOrOwner(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-500" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">বেতন বিবরণ কর্মীর থেকে গোপন রাখুন</div>
                      <div className="text-[10px] text-slate-500">কর্মী তার সেলফ সার্ভিসে কোনো বেতন বা পে-স্লিপ দেখতে পাবেন না</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={quickResetHideSalary}
                    onChange={(e) => setQuickResetHideSalary(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer w-4 h-4"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setQuickResetEmployee(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer transition-colors text-xs"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleQuickResetSave}
                className="px-5 py-2 bg-gradient-to-r from-amber-600 to-teal-600 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 cursor-pointer text-xs transition-opacity hover:opacity-95"
              >
                পরিবর্তন সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Inline Add / Edit Department */}
      {inlineDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {inlineDeptModal.mode === "add" ? "নতুন বিভাগ যুক্ত করুন" : "বিভাগ সম্পাদনা করুন"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInlineDeptModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInlineDept} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  বিভাগের নাম (Department Name) *
                </label>
                <input
                  type="text"
                  value={inlineDeptName}
                  onChange={(e) => setInlineDeptName(e.target.value)}
                  placeholder="যেমন: Human Resources & Culture"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs font-medium"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  বিভাগ কোড (Department Code) *
                </label>
                <input
                  type="text"
                  value={inlineDeptCode}
                  onChange={(e) => setInlineDeptCode(e.target.value)}
                  placeholder="D1"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs font-mono uppercase"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  বার্ষিক বাজেট (Allocated Budget ৳)
                </label>
                <input
                  type="number"
                  value={inlineDeptBudget}
                  onChange={(e) => setInlineDeptBudget(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setInlineDeptModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 cursor-pointer text-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Inline Add / Edit Designation */}
      {inlineDesigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {inlineDesigModal.mode === "add" ? "নতুন পদবি যুক্ত করুন" : "পদবি সম্পাদনা করুন"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInlineDesigModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInlineDesig} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  পদবির নাম / টাইটেল (Designation Title) *
                </label>
                <input
                  type="text"
                  value={inlineDesigTitle}
                  onChange={(e) => setInlineDesigTitle(e.target.value)}
                  placeholder="যেমন: Senior Software Engineer"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs font-medium"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  পদবি কোড (Designation Code) *
                </label>
                <input
                  type="text"
                  value={inlineDesigCode}
                  onChange={(e) => setInlineDesigCode(e.target.value)}
                  placeholder="DSG-1"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs font-mono uppercase"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    সর্বনিম্ন বেতন (৳)
                  </label>
                  <input
                    type="number"
                    value={inlineDesigMinSal}
                    onChange={(e) => setInlineDesigMinSal(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    সর্বোচ্চ বেতন (৳)
                  </label>
                  <input
                    type="number"
                    value={inlineDesigMaxSal}
                    onChange={(e) => setInlineDesigMaxSal(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setInlineDesigModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 cursor-pointer text-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Department Confirmation */}
      {inlineDeleteDeptTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">বিভাগ মুছে ফেলার নিশ্চিতকরণ</h3>
                <p className="text-xs text-slate-500">এই অ্যাকশনটি স্থায়ী</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              আপনি কি নিশ্চিত যে <strong>"{inlineDeleteDeptTarget.name}" ({inlineDeleteDeptTarget.code})</strong> বিভাগটি মুছে ফেলতে চান?
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInlineDeleteDeptTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer text-xs"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={confirmDeleteInlineDept}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-600/20 cursor-pointer text-xs"
              >
                মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Designation Confirmation */}
      {inlineDeleteDesigTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">পদবি মুছে ফেলার নিশ্চিতকরণ</h3>
                <p className="text-xs text-slate-500">এই অ্যাকশনটি স্থায়ী</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              আপনি কি নিশ্চিত যে <strong>"{inlineDeleteDesigTarget.title}" ({inlineDeleteDesigTarget.code})</strong> পদবিটি মুছে ফেলতে চান?
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInlineDeleteDesigTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer text-xs"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={confirmDeleteInlineDesig}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-600/20 cursor-pointer text-xs"
              >
                মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Employee Confirmation (Moves to Recycle Bin) */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900">
                <Archive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">কর্মী অপসারণ (Move to Recycle Bin)</h3>
                <p className="text-xs text-slate-500">সক্রিয় তালিকা থেকে সরিয়ে রিসাইকেল বিনে স্থানান্তর</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              আপনি কি নিশ্চিত যে কর্মী <strong>"{employeeToDelete.fullName}" ({employeeToDelete.employeeCode})</strong>-কে সক্রিয় তালিকা থেকে মুছে ফেলতে চান?
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50">
              মুছে ফেলা কর্মী রিসাইকেল বিনে জমা থাকবে। ভুলবশত মুছে ফেললে আপনি যেকোনো সময় রিসাইকেল বিন থেকে তাকে পুনরায় <strong>পুনরুদ্ধার (Restore)</strong> করতে পারবেন।
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer text-xs"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={confirmDeleteEmployee}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-600/20 cursor-pointer text-xs"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Permanent Delete Confirmation (Permanent Purge) */}
      {permanentDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">স্থায়ীভাবে মুছে ফেলা নিশ্চিতকরণ</h3>
                <p className="text-xs text-rose-500 font-semibold">সতর্কতা: এটি চিরতরে মুছে যাবে, আর ফেরত আনা যাবে না</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              আপনি কি নিশ্চিত যে কর্মী <strong>"{permanentDeleteTarget.fullName}" ({permanentDeleteTarget.employeeCode})</strong>-এর রেকর্ড ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলতে চান?
            </p>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
              স্থায়ীভাবে ডিলিট করলে এই কর্মীর সমস্ত ব্যক্তিগত তথ্য ও হিস্ট্রি ডাটাবেজ থেকে সম্পূর্ণ মুছে ফেলা হবে এবং সিস্টেমের অন্য কোথাও আর পাওয়া যাবে না।
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPermanentDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer text-xs"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  if (permanentDeleteTarget && onPermanentDeleteEmployee) {
                    onPermanentDeleteEmployee(permanentDeleteTarget.id);
                  }
                  setPermanentDeleteTarget(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-600/20 cursor-pointer text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>হ্যাঁ, চিরতরে মুছে ফেলুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* A4 Resume Modal */}
      {viewingResumeEmployee && (
        <ViewA4ResumeModal
          employee={viewingResumeEmployee}
          isBangla={isBangla}
          onClose={() => setViewingResumeEmployee(null)}
          onEditCV={() => {
            const emp = viewingResumeEmployee;
            setViewingResumeEmployee(null);
            setEditingCvEmployee(emp);
          }}
        />
      )}

      {/* Edit CV Modal */}
      {editingCvEmployee && (
        <EditEmployeeCVModal
          employee={editingCvEmployee}
          isBangla={isBangla}
          onClose={() => setEditingCvEmployee(null)}
          onSaveCV={(updatedEmp) => {
            onUpdateEmployee(updatedEmp);
            if (selectedEmployee?.id === updatedEmp.id) {
              setSelectedEmployee(updatedEmp);
            }
            setEditingCvEmployee(null);
          }}
        />
      )}
    </div>
  );
};
