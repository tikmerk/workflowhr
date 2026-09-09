import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
} from "../lib/firebase";
import {
  Employee,
  AttendanceRecord,
  LeaveApplication,
  Payslip,
  EmployeeLoan,
  CompanyAsset,
  AuditLog,
  Notice,
  Branch,
  Department,
  Designation,
  Shift,
  CompanyBranding,
} from "../types";
import {
  INITIAL_EMPLOYEES,
  INITIAL_BRANCHES,
  INITIAL_DEPARTMENTS,
  INITIAL_DESIGNATIONS,
  INITIAL_SHIFTS,
  INITIAL_ATTENDANCE_LOGS,
  INITIAL_LEAVE_APPLICATIONS,
  INITIAL_PAYSLIPS,
  INITIAL_LOANS,
  INITIAL_ASSETS,
  INITIAL_NOTICES,
  INITIAL_AUDIT_LOGS,
} from "../data/mockDatabase";

// Collection Names
const COL_EMPLOYEES = "employees";
const COL_ATTENDANCE = "attendance";
const COL_LEAVES = "leaves";
const COL_PAYROLL = "payroll";
const COL_SETTINGS = "settings";
const COL_LOANS = "loans";
const COL_ASSETS = "assets";
const COL_NOTICES = "notices";
const COL_AUDIT_LOGS = "audit_logs";
const COL_BRANCHES = "branches";
const COL_DEPARTMENTS = "departments";
const COL_DESIGNATIONS = "designations";
const COL_SHIFTS = "shifts";

/**
 * Sanitizes object by removing all undefined keys for Firestore compatibility
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === undefined || data === null) return data;
  return JSON.parse(JSON.stringify(data));
}

/**
 * Check and Seed initial collections if empty
 */
export async function initializeFirestoreDatabase() {
  try {
    const empSnap = await getDocs(collection(db, COL_EMPLOYEES));
    if (empSnap.empty) {
      console.log("Firestore empty: Seeding initial HR records...");

      // Seed Employees
      for (const emp of INITIAL_EMPLOYEES) {
        await setDoc(doc(db, COL_EMPLOYEES, emp.id), cleanForFirestore(emp));
      }

      // Seed Branches
      for (const b of INITIAL_BRANCHES) {
        await setDoc(doc(db, COL_BRANCHES, b.id), cleanForFirestore(b));
      }

      // Seed Departments
      for (const d of INITIAL_DEPARTMENTS) {
        await setDoc(doc(db, COL_DEPARTMENTS, d.id), cleanForFirestore(d));
      }

      // Seed Designations
      for (const des of INITIAL_DESIGNATIONS) {
        await setDoc(doc(db, COL_DESIGNATIONS, des.id), cleanForFirestore(des));
      }

      // Seed Shifts
      for (const s of INITIAL_SHIFTS) {
        await setDoc(doc(db, COL_SHIFTS, s.id), cleanForFirestore(s));
      }

      // Seed Attendance
      for (const att of INITIAL_ATTENDANCE_LOGS) {
        await setDoc(doc(db, COL_ATTENDANCE, att.id), cleanForFirestore(att));
      }

      // Seed Leaves
      for (const lv of INITIAL_LEAVE_APPLICATIONS) {
        await setDoc(doc(db, COL_LEAVES, lv.id), cleanForFirestore(lv));
      }

      // Seed Payslips
      for (const pay of INITIAL_PAYSLIPS) {
        await setDoc(doc(db, COL_PAYROLL, pay.id), cleanForFirestore(pay));
      }

      // Seed Loans
      for (const l of INITIAL_LOANS) {
        await setDoc(doc(db, COL_LOANS, l.id), cleanForFirestore(l));
      }

      // Seed Assets
      for (const ast of INITIAL_ASSETS) {
        await setDoc(doc(db, COL_ASSETS, ast.id), cleanForFirestore(ast));
      }

      // Seed Notices
      for (const n of INITIAL_NOTICES) {
        await setDoc(doc(db, COL_NOTICES, n.id), cleanForFirestore(n));
      }

      // Seed Audit Logs
      for (const log of INITIAL_AUDIT_LOGS) {
        await setDoc(doc(db, COL_AUDIT_LOGS, log.id), cleanForFirestore(log));
      }

      console.log("Firestore initial seeding completed successfully.");
    }
  } catch (err) {
    console.error("Firestore seeding error (will use offline fallback):", err);
  }
}

/* ============================================================
   EMPLOYEES FIRESTORE APIS
   ============================================================ */

export async function fetchEmployeesFromFirestore(): Promise<Employee[]> {
  try {
    const snap = await getDocs(collection(db, COL_EMPLOYEES));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as Employee);
    }
  } catch (err) {
    console.warn("Firestore fetch employees error:", err);
  }
  return INITIAL_EMPLOYEES;
}

export function subscribeToEmployees(onUpdate: (employees: Employee[]) => void) {
  try {
    return onSnapshot(
      collection(db, COL_EMPLOYEES),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as Employee);
          onUpdate(list);
        }
      },
      (err) => console.warn("Firestore employees listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export async function saveEmployeeToFirestore(employee: Employee) {
  try {
    await setDoc(doc(db, COL_EMPLOYEES, employee.id), cleanForFirestore(employee), { merge: true });
  } catch (err) {
    console.error("Failed to save employee to Firestore:", err);
  }
}

export async function updateEmployeeFacePhotoInFirestore(
  employeeId: string,
  photoUrl: string
) {
  try {
    const updateData = {
      faceRegisteredPhoto: photoUrl,
      avatarUrl: photoUrl,
      faceTemplateRegistered: true,
      faceRegisteredAt: new Date().toISOString().split("T")[0],
    };
    await updateDoc(doc(db, COL_EMPLOYEES, employeeId), cleanForFirestore(updateData));
  } catch (err) {
    console.error("Failed to update face photo in Firestore:", err);
    // If updateDoc fails because doc doesn't exist, use setDoc with merge
    try {
      await setDoc(
        doc(db, COL_EMPLOYEES, employeeId),
        cleanForFirestore({
          faceRegisteredPhoto: photoUrl,
          avatarUrl: photoUrl,
          faceTemplateRegistered: true,
          faceRegisteredAt: new Date().toISOString().split("T")[0],
        }),
        { merge: true }
      );
    } catch (e) {
      console.error(e);
    }
  }
}

/* ============================================================
   ATTENDANCE FIRESTORE APIS
   ============================================================ */

export async function fetchAttendanceFromFirestore(): Promise<AttendanceRecord[]> {
  try {
    const snap = await getDocs(collection(db, COL_ATTENDANCE));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as AttendanceRecord);
    }
  } catch (err) {
    console.warn("Firestore fetch attendance error:", err);
  }
  return INITIAL_ATTENDANCE_LOGS;
}

export function subscribeToAttendance(onUpdate: (logs: AttendanceRecord[]) => void) {
  try {
    return onSnapshot(
      collection(db, COL_ATTENDANCE),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as AttendanceRecord);
          // sort descending by date / checkIn
          list.sort((a, b) => b.id.localeCompare(a.id));
          onUpdate(list);
        }
      },
      (err) => console.warn("Firestore attendance listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export async function saveAttendanceRecordToFirestore(record: AttendanceRecord) {
  try {
    await setDoc(doc(db, COL_ATTENDANCE, record.id), cleanForFirestore(record), { merge: true });
  } catch (err) {
    console.error("Failed to save attendance record in Firestore:", err);
  }
}

/* ============================================================
   LEAVES FIRESTORE APIS
   ============================================================ */

export async function fetchLeavesFromFirestore(): Promise<LeaveApplication[]> {
  try {
    const snap = await getDocs(collection(db, COL_LEAVES));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as LeaveApplication);
    }
  } catch (err) {
    console.warn("Firestore fetch leaves error:", err);
  }
  return INITIAL_LEAVE_APPLICATIONS;
}

export function subscribeToLeaves(onUpdate: (leaves: LeaveApplication[]) => void) {
  try {
    return onSnapshot(
      collection(db, COL_LEAVES),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as LeaveApplication);
          onUpdate(list);
        }
      },
      (err) => console.warn("Firestore leaves listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export async function saveLeaveApplicationToFirestore(leave: LeaveApplication) {
  try {
    await setDoc(doc(db, COL_LEAVES, leave.id), cleanForFirestore(leave), { merge: true });
  } catch (err) {
    console.error("Failed to save leave application in Firestore:", err);
  }
}

export async function updateLeaveStatusInFirestore(
  leaveId: string,
  status: "APPROVED" | "REJECTED" | "CANCELLED",
  reviewedBy: string,
  reviewerComments?: string
) {
  try {
    const updateData = {
      status,
      reviewedBy,
      reviewedAt: new Date().toISOString().split("T")[0],
      reviewerComments: reviewerComments || "",
    };
    await setDoc(doc(db, COL_LEAVES, leaveId), cleanForFirestore(updateData), { merge: true });
  } catch (err) {
    console.error("Failed to update leave status in Firestore:", err);
  }
}

/* ============================================================
   BRANDING & SETTINGS FIRESTORE APIS
   ============================================================ */

export async function fetchBrandingSettingsFromFirestore(): Promise<{
  branding: CompanyBranding | null;
  isDemoModeEnabled: boolean | null;
}> {
  try {
    const snap = await getDoc(doc(db, COL_SETTINGS, "company_branding"));
    if (snap.exists()) {
      const data = snap.data();
      return {
        branding: data.branding as CompanyBranding,
        isDemoModeEnabled: data.isDemoModeEnabled ?? null,
      };
    }
  } catch (err) {
    console.warn("Firestore fetch branding error:", err);
  }
  return { branding: null, isDemoModeEnabled: null };
}

export async function saveBrandingSettingsToFirestore(
  branding: CompanyBranding,
  isDemoModeEnabled: boolean
) {
  try {
    await setDoc(
      doc(db, COL_SETTINGS, "company_branding"),
      cleanForFirestore({
        branding,
        isDemoModeEnabled,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.error("Failed to save branding settings to Firestore:", err);
  }
}

export function subscribeToBrandingSettings(
  onUpdate: (branding: CompanyBranding, isDemoModeEnabled: boolean) => void
) {
  try {
    return onSnapshot(
      doc(db, COL_SETTINGS, "company_branding"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.branding) {
            onUpdate(data.branding, data.isDemoModeEnabled ?? true);
          }
        }
      },
      (err) => console.warn("Firestore branding listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

/* ============================================================
   PAYROLL FIRESTORE APIS
   ============================================================ */

export async function savePayslipsToFirestore(slips: Payslip[]) {
  try {
    for (const slip of slips) {
      await setDoc(doc(db, COL_PAYROLL, slip.id), cleanForFirestore(slip), { merge: true });
    }
  } catch (err) {
    console.error("Failed to save payslips in Firestore:", err);
  }
}

export async function saveAuditLogToFirestore(log: AuditLog) {
  try {
    await setDoc(doc(db, COL_AUDIT_LOGS, log.id), cleanForFirestore(log), { merge: true });
  } catch (err) {
    console.error("Failed to save audit log in Firestore:", err);
  }
}

export function subscribeToAuditLogs(onUpdate: (logs: AuditLog[]) => void) {
  try {
    return onSnapshot(
      collection(db, COL_AUDIT_LOGS),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as AuditLog);
          onUpdate(list);
        }
      },
      (err) => console.warn("Firestore audit logs listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export function subscribeToLoans(onUpdate: (loans: EmployeeLoan[]) => void) {
  try {
    return onSnapshot(
      collection(db, COL_LOANS),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as EmployeeLoan);
          onUpdate(list);
        }
      },
      (err) => console.warn("Firestore loans listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export async function saveLoanToFirestore(loan: EmployeeLoan) {
  try {
    await setDoc(doc(db, COL_LOANS, loan.id), cleanForFirestore(loan), { merge: true });
  } catch (err) {
    console.error("Failed to save loan in Firestore:", err);
  }
}

export async function updateLoanStatusInFirestore(loanId: string, status: "ACTIVE" | "REJECTED" | "PAID") {
  try {
    await updateDoc(doc(db, COL_LOANS, loanId), { status });
  } catch (err) {
    console.error("Failed to update loan in Firestore:", err);
  }
}

export function subscribeToBranches(onUpdate: (branches: Branch[]) => void) {
  try {
    return onSnapshot(
      collection(db, COL_BRANCHES),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as Branch);
          onUpdate(list);
        }
      },
      (err) => console.warn("Firestore branches listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export function subscribeToDepartments(onUpdate: (departments: Department[]) => void) {
  try {
    return onSnapshot(
      collection(db, COL_DEPARTMENTS),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as Department);
          onUpdate(list);
        }
      },
      (err) => console.warn("Firestore departments listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export function subscribeToDesignations(onUpdate: (designations: Designation[]) => void) {
  try {
    return onSnapshot(
      collection(db, COL_DESIGNATIONS),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as Designation);
          onUpdate(list);
        }
      },
      (err) => console.warn("Firestore designations listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}
