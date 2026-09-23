import { Employee, UserRole, RolePermissionConfig, NavigationTab } from "../types";

// Master list of all available navigation tabs in the application
export const ALL_APP_NAVIGATION_TABS: NavigationTab[] = [
  "dashboard",
  "my-portal",
  "self-service",
  "employees",
  "departments-designations",
  "branches",
  "branches-geofence",
  "ngo-programs-training",
  "meetings-conferences",
  "face-recognition-kiosk",
  "attendance-logs",
  "shifts-holidays",
  "leaves",
  "payroll",
  "loans",
  "recruitment",
  "projects-tasks",
  "assets",
  "certificates",
  "exit-management",
  "notices-chat",
  "roles-permissions",
  "audit-reports",
];

/**
 * Normalizes tab identifiers between legacy and new schema aliases
 * - Maps 'my-portal' <-> 'self-service'
 * - Maps 'branches' <-> 'branches-geofence'
 */
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

/**
 * Checks if a specific tab is allowed in the tab list, handling aliases
 */
export const isTabAllowedInList = (tabId: string, allowedTabs: string[] = []): boolean => {
  if (!tabId) return false;
  if (allowedTabs.includes(tabId)) return true;
  if (tabId === "my-portal" && allowedTabs.includes("self-service")) return true;
  if (tabId === "self-service" && allowedTabs.includes("my-portal")) return true;
  if (tabId === "branches" && allowedTabs.includes("branches-geofence")) return true;
  if (tabId === "branches-geofence" && allowedTabs.includes("branches")) return true;
  return false;
};

/**
 * Enterprise Role-Based Access Control (RBAC) Permission Utility
 *
 * Specific Role Constraints requested by the organization:
 * - General Employee (EMPLOYEE):
 *   1. Dashboard: Dedicated Self-Service Employee Dashboard only.
 *   2. Self-Service Portal (my-portal): Own account profile, attendance punch & records.
 *   3. Attendance Logs (attendance-logs): ONLY their own attendance history records. NEVER see other employees' logs.
 *   4. Leave Applications (leaves): ONLY submit and view their own leave applications & balance. Cannot approve/reject others.
 *   5. Monthly Salary & Payslips (payroll): ONLY see and download their own payslip & salary history.
 *   6. Loans & Advances (loans): ONLY request and view their own loan/PF records.
 *   7. Official Notices (notices-chat): Read official notices and download A4 notices.
 *   8. Projects & Tasks (projects-tasks): View and update projects/tasks where assigned.
 *   9. Asset Management (assets): View company assets assigned to them.
 *   10. Official Letters (certificates): View and print letters issued to their name.
 *   11. Smart Face Kiosk (face-recognition-kiosk): Auto Kiosk & 1:1 punch for their own attendance.
 *
 * General Employees MUST NOT have access to:
 * - Full workforce directory with all employee records, salary slips, and confidential docs.
 * - System roles, permissions, audit logs, or organization reset.
 * - Global attendance logs of all staff.
 */

export function isSuperAdminUser(user?: Employee | null): boolean {
  if (!user) return false;
  return Boolean(
    user.role === "SUPER_ADMIN" ||
    user.role === "GRAND_ADMIN" ||
    user.role === "COMPANY_ADMIN" ||
    user.role === "CEO" ||
    user.isSuperAdmin ||
    user.isCeoOrOwner ||
    user.designationTitle?.toLowerCase().includes("ceo") ||
    user.designationTitle?.toLowerCase().includes("chief executive officer") ||
    user.designationTitle?.toLowerCase().includes("সিইও")
  );
}

export function isExecutiveOrManagerUser(user?: Employee | null): boolean {
  if (!user) return false;
  if (isSuperAdminUser(user)) return true;

  const role = user.role as string;
  if (
    role === "BRANCH_MANAGER" ||
    role === "HR_MANAGER" ||
    role === "ACCOUNTS_MANAGER" ||
    role === "ACCOUNT_PAYROLL" ||
    role === "PROJECT_MANAGER" ||
    Boolean((user as any).canAccessAllBranches)
  ) {
    return true;
  }

  const desig = (user.designationTitle || "").toLowerCase();
  if (
    desig.includes("director") ||
    desig.includes("manager") ||
    desig.includes("head of") ||
    desig.includes("executive") ||
    desig.includes("accountant") ||
    desig.includes("controller")
  ) {
    return true;
  }

  return false;
}

export function isGeneralEmployeeRole(user?: Employee | null): boolean {
  if (!user) return false;
  return !isSuperAdminUser(user) && !isExecutiveOrManagerUser(user);
}

/**
 * Filter attendance logs based on employee role permissions:
 * - Super Admin / CEO / HR: sees all logs (or branch logs for Branch Manager)
 * - General Employee: strictly sees logs where log.employeeId === user.id
 */
export function filterAttendanceLogsForUser<T extends { employeeId: string; branchId?: string }>(
  logs: T[],
  user?: Employee | null
): T[] {
  if (!user) return logs;
  if (isSuperAdminUser(user)) return logs;

  if (user.role === "BRANCH_MANAGER" && user.branchId) {
    return logs.filter((log) => log.branchId === user.branchId);
  }

  if (isGeneralEmployeeRole(user)) {
    return logs.filter((log) => log.employeeId === user.id);
  }

  return logs;
}

/**
 * Filter payslips based on employee role permissions:
 * - Super Admin / Accounts / HR: sees full payroll register
 * - General Employee: strictly sees payslips where slip.employeeId === user.id
 */
export function filterPayslipsForUser<T extends { employeeId: string; branchId?: string }>(
  slips: T[],
  user?: Employee | null
): T[] {
  if (!user) return slips;
  if (isSuperAdminUser(user)) return slips;

  const role = user.role as string;
  if (role === "ACCOUNT_PAYROLL" || role === "ACCOUNTS_MANAGER" || role === "HR_MANAGER") {
    return slips;
  }

  if (user.role === "BRANCH_MANAGER" && user.branchId) {
    return slips.filter((slip) => slip.branchId === user.branchId);
  }

  // Non-accounts / general staff only see their own payslips
  return slips.filter((slip) => slip.employeeId === user.id);
}

/**
 * Allowed navigation tabs for a role
 */
export const GENERAL_EMPLOYEE_ALLOWED_TABS: string[] = [
  "dashboard",
  "my-portal",
  "face-recognition-kiosk",
  "attendance-logs",
  "shifts-holidays",
  "leaves",
  "payroll",
  "loans",
  "notices-chat",
  "projects-tasks",
  "assets",
  "certificates",
  "meetings-conferences",
];

/**
 * Returns intelligent default navigation tabs based on role and custom role permissions
 */
export const getDefaultTabsForRole = (
  roleKey: string,
  rolePermissionsList?: RolePermissionConfig[]
): string[] => {
  const matchedRole = rolePermissionsList?.find((r) => r.role === roleKey);
  if (matchedRole?.allowedNavTabs && matchedRole.allowedNavTabs.length > 0) {
    return normalizeTabList(matchedRole.allowedNavTabs);
  }

  // Built-in intelligent defaults by role if not customized in role permissions
  if (
    roleKey === "SUPER_ADMIN" ||
    roleKey === "CEO" ||
    roleKey === "GRAND_ADMIN" ||
    roleKey === "COMPANY_ADMIN"
  ) {
    return ALL_APP_NAVIGATION_TABS.map((t) => t);
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
      "meetings-conferences",
      "attendance-logs",
      "shifts-holidays",
      "leaves",
      "payroll",
      "loans",
      "recruitment",
      "projects-tasks",
      "assets",
      "certificates",
      "exit-management",
      "notices-chat",
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
      "certificates",
      "meetings-conferences",
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
      "assets",
      "certificates",
      "meetings-conferences",
    ]);
  }
  if (roleKey === "PROJECT_MANAGER" || roleKey === "TEAM_LEADER") {
    return normalizeTabList([
      "dashboard",
      "self-service",
      "my-portal",
      "projects-tasks",
      "attendance-logs",
      "leaves",
      "shifts-holidays",
      "notices-chat",
      "meetings-conferences",
      "certificates",
      "assets",
    ]);
  }
  if (roleKey === "INTERNAL_AUDITOR" || roleKey === "AUDITOR") {
    return normalizeTabList([
      "dashboard",
      "self-service",
      "my-portal",
      "employees",
      "attendance-logs",
      "payroll",
      "loans",
      "assets",
      "audit-reports",
      "notices-chat",
    ]);
  }

  return normalizeTabList(GENERAL_EMPLOYEE_ALLOWED_TABS);
};

/**
 * Returns the effective accessible navigation tabs for an employee.
 * - Super Admins and CEOs get all tabs.
 * - If employee has manual custom tab overrides (hasCustomTabAccess: true), respects employee.allowedTabs.
 * - Otherwise (default), dynamically inherits the role's configured tabs from rolePermissionsList.
 */
export const getEffectiveTabsForEmployee = (
  employee?: Partial<Employee> | null,
  rolePermissionsList?: RolePermissionConfig[]
): string[] => {
  if (!employee) return normalizeTabList(GENERAL_EMPLOYEE_ALLOWED_TABS);

  // Super Admin / CEO / Grand Admin always has full access
  if (
    employee.isSuperAdmin ||
    employee.isCeoOrOwner ||
    employee.role === "SUPER_ADMIN" ||
    employee.role === "GRAND_ADMIN" ||
    employee.role === "COMPANY_ADMIN" ||
    employee.role === "CEO"
  ) {
    return ALL_APP_NAVIGATION_TABS.map((t) => t);
  }

  // Explicit manual customization override for exceptional users
  if (employee.hasCustomTabAccess === true && employee.allowedTabs && employee.allowedTabs.length > 0) {
    return normalizeTabList(employee.allowedTabs);
  }

  // Strictly and dynamically resolve from the employee's assigned role configuration
  const roleKey = employee.role || "EMPLOYEE";
  const matchedRole = rolePermissionsList?.find((r) => r.role === roleKey);
  if (matchedRole?.allowedNavTabs && matchedRole.allowedNavTabs.length > 0) {
    return normalizeTabList(matchedRole.allowedNavTabs);
  }

  // Fallback to intelligent role defaults
  return getDefaultTabsForRole(roleKey, rolePermissionsList);
};
