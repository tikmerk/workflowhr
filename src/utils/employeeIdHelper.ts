import { Employee, ExitRecord } from "../types";

/**
 * Utility to manage unique sequential Employee IDs and Usernames
 * Format:
 *  - Employee ID: MWO1001, MWO1002, MWO1003... (Prefix + 4-digit number, NO hyphen)
 *  - User ID: mwo1001, mwo1002, mwo1003... (all lowercase)
 * 
 * Rules:
 *  - Starts from 1001.
 *  - If an employee is permanently deleted from the database, that number becomes free and can be filled.
 *  - If an employee exits through Exit Management or is marked EXITED, their ID is permanently occupied & protected.
 *  - Active employees and Recycle Bin (soft-deleted) employees also occupy their ID.
 */

export const DEFAULT_ID_PREFIX = "MWO";
export const STARTING_SERIAL = 1001;

/**
 * Extracts integer numeric part from an employee code string
 * Handles: "MWO1001", "MWO-1001", "WF-1001", "1001", "mwo1001"
 */
export const extractEmployeeNumber = (code?: string): number | null => {
  if (!code) return null;
  const match = code.trim().match(/(\d{4,})/);
  if (match) {
    const parsed = parseInt(match[1], 10);
    if (!isNaN(parsed) && parsed >= 1000) {
      return parsed;
    }
  }
  // Fallback to any trailing digits
  const fallback = code.trim().match(/(\d+)$/);
  if (fallback) {
    const parsed = parseInt(fallback[1], 10);
    if (!isNaN(parsed) && parsed >= 1000) {
      return parsed;
    }
  }
  return null;
};

/**
 * Formats a clean employee code: prefix + number (NO hyphen, e.g. MWO1001)
 */
export const formatEmployeeCode = (num: number, prefix: string = DEFAULT_ID_PREFIX): string => {
  const cleanPrefix = (prefix || DEFAULT_ID_PREFIX).trim().toUpperCase();
  return `${cleanPrefix}${num}`;
};

/**
 * Formats clean user ID: lowercase prefix + number (e.g. mwo1001)
 */
export const formatUserId = (num: number, prefix: string = DEFAULT_ID_PREFIX): string => {
  const cleanPrefix = (prefix || DEFAULT_ID_PREFIX).trim().toLowerCase();
  return `${cleanPrefix}${num}`;
};

/**
 * Returns a Set of all currently occupied employee serial numbers
 */
export const getOccupiedEmployeeNumbers = (
  employees: Employee[] = [],
  deletedEmployees: Employee[] = [],
  exitRecords: ExitRecord[] = []
): Set<number> => {
  const occupied = new Set<number>();

  // 1. Active and existing employees
  employees.forEach((emp) => {
    const num = extractEmployeeNumber(emp.employeeCode);
    if (num !== null) occupied.add(num);
  });

  // 2. Recycle Bin (soft-deleted) employees
  deletedEmployees.forEach((emp) => {
    const num = extractEmployeeNumber(emp.employeeCode);
    if (num !== null) occupied.add(num);
  });

  // 3. Past exited records from exit management
  exitRecords.forEach((rec) => {
    const num = extractEmployeeNumber(rec.employeeCode);
    if (num !== null) occupied.add(num);
  });

  return occupied;
};

/**
 * Finds the first (lowest) available sequence number >= 1001 that is NOT occupied
 */
export const getNextAvailableEmployeeSerial = (
  employees: Employee[] = [],
  deletedEmployees: Employee[] = [],
  exitRecords: ExitRecord[] = []
): number => {
  const occupied = getOccupiedEmployeeNumbers(employees, deletedEmployees, exitRecords);
  let candidate = STARTING_SERIAL;
  while (occupied.has(candidate)) {
    candidate++;
  }
  return candidate;
};

/**
 * Generates the next Employee ID and matching User ID
 */
export const getNextAvailableEmployeeCredentials = (
  prefix: string = DEFAULT_ID_PREFIX,
  employees: Employee[] = [],
  deletedEmployees: Employee[] = [],
  exitRecords: ExitRecord[] = []
): { employeeCode: string; username: string; serialNumber: number } => {
  const serial = getNextAvailableEmployeeSerial(employees, deletedEmployees, exitRecords);
  return {
    serialNumber: serial,
    employeeCode: formatEmployeeCode(serial, prefix),
    username: formatUserId(serial, prefix),
  };
};

/**
 * Validates whether an employee ID is available or why it is taken
 */
export const validateEmployeeIdAvailability = (
  codeToCheck: string,
  employees: Employee[] = [],
  deletedEmployees: Employee[] = [],
  exitRecords: ExitRecord[] = [],
  currentEmployeeId?: string
): { available: boolean; reason?: string } => {
  const trimmed = codeToCheck.trim();
  if (!trimmed) {
    return { available: false, reason: "এমপ্লয়ী আইডি ফাঁকা রাখা যাবে না।" };
  }

  const num = extractEmployeeNumber(trimmed);
  const normalized = trimmed.toUpperCase().replace(/-/g, "");

  // If editing an existing employee and they are retaining their current ID, allow immediately
  if (currentEmployeeId) {
    const currentEmp = employees.find((e) => e.id === currentEmployeeId);
    if (currentEmp?.employeeCode) {
      const currentNorm = currentEmp.employeeCode.toUpperCase().replace(/-/g, "");
      if (currentNorm === normalized) {
        return { available: true };
      }
    }
  }

  // Check past exited employees first (permanent preservation) - strictly skip current employee
  const isExitedInRecords = exitRecords.some((r) => {
    if (currentEmployeeId && (r.employeeId === currentEmployeeId || (r as any).id === currentEmployeeId)) {
      return false;
    }
    if (r.employeeCode) {
      const recNorm = r.employeeCode.toUpperCase().replace(/-/g, "");
      if (recNorm === normalized) return true;
      if (num !== null && extractEmployeeNumber(r.employeeCode) === num) return true;
    }
    return false;
  });

  const isExitedInEmployees = employees.some((e) => {
    if (e.id === currentEmployeeId) return false;
    const isEx = e.status === "EXITED" || (e as any).isExited;
    if (!isEx) return false;
    const empNorm = (e.employeeCode || "").toUpperCase().replace(/-/g, "");
    if (empNorm === normalized) return true;
    if (num !== null && extractEmployeeNumber(e.employeeCode) === num) return true;
    return false;
  });

  if (isExitedInRecords || isExitedInEmployees) {
    return {
      available: false,
      reason: `এমপ্লয়ী আইডি ${trimmed} প্রতিষ্ঠান থেকে নিয়মমাফিক এক্সিট নেওয়া একজন প্রাক্তন কর্মীর জন্য চিরস্থায়ীভাবে সংরক্ষিত। এটি পুনরায় ব্যবহার করা যাবে না।`,
    };
  }

  // Check active employees
  const activeConflict = employees.find((e) => {
    if (e.id === currentEmployeeId) return false;
    if (e.status === "EXITED" || (e as any).isExited) return false;
    const empNorm = (e.employeeCode || "").toUpperCase().replace(/-/g, "");
    if (empNorm === normalized) return true;
    if (num !== null && extractEmployeeNumber(e.employeeCode) === num) return true;
    return false;
  });

  if (activeConflict) {
    return {
      available: false,
      reason: `এমপ্লয়ী আইডি ${trimmed} ইতিমধ্যেই সক্রিয় কর্মী "${activeConflict.fullName}"-এর জন্য ব্যবহৃত হচ্ছে।`,
    };
  }

  // Check recycle bin
  const recycleConflict = deletedEmployees.find((e) => {
    if (e.id === currentEmployeeId) return false;
    const empNorm = (e.employeeCode || "").toUpperCase().replace(/-/g, "");
    if (empNorm === normalized) return true;
    if (num !== null && extractEmployeeNumber(e.employeeCode) === num) return true;
    return false;
  });

  if (recycleConflict) {
    return {
      available: false,
      reason: `এমপ্লয়ী আইডি ${trimmed} বর্তমানে রিসাইকেল বিনে রয়েছে ("${recycleConflict.fullName}")। প্রয়োজন হলে রিস্টোর করুন অথবা স্থায়ীভাবে ডিলিট করে নম্বরটি খালি করুন।`,
    };
  }

  return { available: true };
};

/**
 * Synchronizes and fixes all existing employees so their serials are
 * non-colliding and sequential starting from MWO1001, with matching lowercase username.
 */
export const fixExistingEmployeesSequence = (
  employees: Employee[],
  prefix: string = DEFAULT_ID_PREFIX
): { updatedEmployees: Employee[]; hasChanges: boolean } => {
  const cleanPrefix = (prefix || DEFAULT_ID_PREFIX).trim().toUpperCase();
  let hasChanges = false;
  const usedNumbers = new Set<number>();

  // Determine an orderly sequence:
  // Give CEO / Owner first (1001), then Super Admins, then other employees by joining date / id
  const sorted = [...employees].sort((a, b) => {
    if (a.isCeoOrOwner && !b.isCeoOrOwner) return -1;
    if (!a.isCeoOrOwner && b.isCeoOrOwner) return 1;
    if (a.isSuperAdmin && !b.isSuperAdmin) return -1;
    if (!a.isSuperAdmin && b.isSuperAdmin) return 1;
    // Prefer earlier extracted numbers if valid
    const numA = extractEmployeeNumber(a.employeeCode) || 99999;
    const numB = extractEmployeeNumber(b.employeeCode) || 99999;
    if (numA !== numB) return numA - numB;
    return a.id.localeCompare(b.id);
  });

  let currentSerial = STARTING_SERIAL;

  const updatedEmployees = sorted.map((emp) => {
    const existingNum = extractEmployeeNumber(emp.employeeCode);
    let targetNum: number;

    // If existing code is already MWOxxxx and not yet used in this pass, we can preserve it if >= 1001
    const alreadyValid =
      existingNum !== null &&
      existingNum >= STARTING_SERIAL &&
      !usedNumbers.has(existingNum) &&
      emp.employeeCode.toUpperCase().startsWith(cleanPrefix);

    if (alreadyValid && existingNum !== null) {
      targetNum = existingNum;
    } else {
      while (usedNumbers.has(currentSerial)) {
        currentSerial++;
      }
      targetNum = currentSerial;
      currentSerial++;
    }

    usedNumbers.add(targetNum);

    const expectedCode = formatEmployeeCode(targetNum, cleanPrefix);
    const expectedUsername = formatUserId(targetNum, cleanPrefix);

    const codeChanged = emp.employeeCode !== expectedCode;
    const usernameChanged = !emp.username || emp.username.startsWith("WF-") || emp.username.startsWith("wf-") || emp.username !== expectedUsername;

    if (codeChanged || usernameChanged) {
      hasChanges = true;
      return {
        ...emp,
        employeeCode: expectedCode,
        username: expectedUsername,
      };
    }

    return emp;
  });

  return { updatedEmployees, hasChanges };
};
