import { Employee, UserRole } from "../types";

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
  "leaves",
  "payroll",
  "loans",
  "notices-chat",
  "projects-tasks",
  "assets",
  "certificates",
];
