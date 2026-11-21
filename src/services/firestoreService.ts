import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
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
  JobPosting,
  Candidate,
  PayrollPolicyConfig,
  BiometricKioskSettings,
  Project,
  ProjectTask,
  SystemNotification,
  DailyWorkLog,
  FeedbackSurvey,
  SurveyQuestion,
  SurveyResponse,
  AnonymousFeedback,
  TeamMemberRating,
  ManagerRating,
  RolePermissionConfig,
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
  mockJobPostings,
  mockCandidates,
} from "../data/mockDatabase";
import firebaseConfig from "../../firebase-applet-config.json";
import { compressAndOptimizeImage } from "../utils/imageCompression";
import { invalidateEmployeeFaceCache, extract128DVector } from "../utils/faceRecognitionEngine";
import { getOrGenerateEmployeeDescriptor } from "../data/employeeBiometricVectors";

// Collection Names
const COL_EMPLOYEES = "employees";
const COL_ATTENDANCE = "attendance";
const COL_LEAVES = "leaves";
const COL_PAYROLL = "payroll";
const COL_PAYSLIPS = "payroll";
const COL_SETTINGS = "settings";
const COL_LOANS = "loans";
const COL_ASSETS = "assets";
const COL_NOTICES = "notices";
const COL_AUDIT_LOGS = "audit_logs";
const COL_BRANCHES = "branches";
const COL_DEPARTMENTS = "departments";
const COL_DESIGNATIONS = "designations";
const COL_SHIFTS = "shifts";
const COL_RECRUITMENT_JOBS = "recruitment_jobs";
const COL_RECRUITMENT_CANDIDATES = "recruitment_candidates";
const COL_PROJECTS = "projects";
const COL_TASKS = "tasks";
const COL_NOTIFICATIONS = "notifications";
const COL_WORK_LOGS = "work_logs";
const COL_FEEDBACK_SURVEYS = "feedback_surveys";
const COL_SURVEY_RESPONSES = "survey_responses";
const COL_ANONYMOUS_FEEDBACK = "anonymous_feedback";
const COL_PERFORMANCE_POINTS = "performance_points";
const COL_MANAGER_RATINGS = "manager_ratings";

export const DEFAULT_SURVEY_QUESTIONS_TEMPLATE: SurveyQuestion[] = [
  // 1. WORKPLACE (কর্মক্ষেত্র ও কাজের মান)
  {
    id: "q-wp-1",
    category: "WORKPLACE",
    questionEn: "Are your job responsibilities, expectations, and daily goals clear and realistic?",
    questionBn: "আপনার পদের দায়িত্ব, লক্ষ্য এবং প্রতিদিনের কাজের পরিধি কি স্পষ্ট ও বাস্তবসম্মত?",
    type: "RATING",
  },
  {
    id: "q-wp-2",
    category: "WORKPLACE",
    questionEn: "How satisfied are you with your current workload balance and opportunities to learn and grow?",
    questionBn: "বর্তমান কাজের চাপ, ভারসাম্য এবং পেশাগত দক্ষতা বৃদ্ধির সুযোগ নিয়ে আপনি কতটা সন্তুষ্ট?",
    type: "RATING",
  },
  {
    id: "q-wp-3",
    category: "WORKPLACE",
    questionEn: "Do you feel your work is meaningful and properly recognized by the organization?",
    questionBn: "আপনি কি মনে করেন আপনার কাজ গুরুত্বপূর্ণ এবং প্রতিষ্ঠানে এর সঠিক মূল্যায়ন হচ্ছে?",
    type: "RATING",
  },
  // 2. MANAGER (লাইন ম্যানেজার ও নেতৃত্ব)
  {
    id: "q-mgr-1",
    category: "MANAGER",
    questionEn: "How clearly does your Line Manager communicate tasks, priorities, and deadlines?",
    questionBn: "আপনার লাইন ম্যানেজার কি কাজের নির্দেশনা, অগ্রাধিকার ও ডেডলাইন স্পষ্টভাবে বুঝিয়ে দেন?",
    type: "RATING",
  },
  {
    id: "q-mgr-2",
    category: "MANAGER",
    questionEn: "How fair, unbiased, and respectful is your Line Manager in evaluating your performance?",
    questionBn: "আপনার লাইন ম্যানেজারের আচরণ, মূল্যায়ন এবং সিদ্ধান্ত গ্রহণ কতটা নিরপেক্ষ ও সম্মানজনক?",
    type: "RATING",
  },
  {
    id: "q-mgr-3",
    category: "MANAGER",
    questionEn: "Does your Line Manager provide timely help, constructive feedback, and support when you face blockers?",
    questionBn: "কাজে কোনো সমস্যায় পড়লে আপনার লাইন ম্যানেজার কি সময়মতো সহায়তা ও গঠনমূলক পরামর্শ দেন?",
    type: "RATING",
  },
  // 3. COWORKERS (সহকর্মী ও টিমওয়ার্ক)
  {
    id: "q-cw-1",
    category: "COWORKERS",
    questionEn: "How helpful and cooperative are your co-workers when collaborating on shared deliverables?",
    questionBn: "যৌথ কাজে আপনার সহকর্মীরা একে অপরকে কতটা আন্তরিকভাবে সহযোগিতা করেন?",
    type: "RATING",
  },
  {
    id: "q-cw-2",
    category: "COWORKERS",
    questionEn: "Is communication among your teammates open, respectful, and free of workplace friction?",
    questionBn: "টিমের সহকর্মীদের মধ্যে যোগাযোগ ও সম্পর্ক কি সৌহার্দ্যপূর্ণ ও সম্মানজনক?",
    type: "RATING",
  },
  {
    id: "q-cw-3",
    category: "COWORKERS",
    questionEn: "Do teammates share knowledge and take collective accountability for team goals?",
    questionBn: "টিমের সবাই কি তথ্য শেয়ার করেন এবং সম্মিলিতভাবে টিমের লক্ষ্য অর্জনে দায়িত্বশীল?",
    type: "RATING",
  },
  // 4. ENVIRONMENT (কাজের পরিবেশ ও সংস্কৃতি)
  {
    id: "q-env-1",
    category: "ENVIRONMENT",
    questionEn: "How safe, comfortable, and conducive to focused work is your physical or remote workspace?",
    questionBn: "অফিস বা রিমোট কাজের পরিবেশ কি নিরাপদ, আরামদায়ক এবং মনোযোগ দিয়ে কাজ করার উপযোগী?",
    type: "RATING",
  },
  {
    id: "q-env-2",
    category: "ENVIRONMENT",
    questionEn: "Do you feel psychologically safe to voice ideas, feedback, or concerns openly?",
    questionBn: "আপনি কি নির্ভয়ে আপনার মতামত, পরামর্শ বা কোনো সমস্যা তুলে ধরতে স্বাচ্ছন্দ্যবোধ করেন?",
    type: "RATING",
  },
  {
    id: "q-env-3",
    category: "ENVIRONMENT",
    questionEn: "How well does the workplace culture support healthy work-life balance and mutual respect?",
    questionBn: "প্রতিষ্ঠানের সংস্কৃতি কি স্বাস্থ্যকর কর্ম-জীবন ভারসাম্য ও পারস্পরিক শ্রদ্ধা বজায় রাখে?",
    type: "RATING",
  },
  // 5. SERVICES (অফিস সার্ভিস, এইচআর ও সুবিধা)
  {
    id: "q-srv-1",
    category: "SERVICES",
    questionEn: "How satisfied are you with HR support (attendance, leave approvals, payroll accuracy, and queries)?",
    questionBn: "এইচআর সার্ভিস (হাজিরা, ছুটি অনুমোদন, বেতন-ভাতা ও জিজ্ঞাসার সমাধান) নিয়ে আপনি কতটা সন্তুষ্ট?",
    type: "RATING",
  },
  {
    id: "q-srv-2",
    category: "SERVICES",
    questionEn: "How reliable are office IT tools, internet, software systems, and equipment support?",
    questionBn: "অফিসের আইটি সাপোর্ট, সফটওয়্যার, ইন্টারনেট এবং প্রয়োজনীয় সরঞ্জামের সেবা কেমন?",
    type: "RATING",
  },
  {
    id: "q-srv-3",
    category: "SERVICES",
    questionEn: "How satisfied are you with general admin facilities, logistics, and employee welfare services?",
    questionBn: "অ্যাডমিন সুবিধা, লজিস্টিকস এবং কর্মী কল্যাণমূলক সার্বিক সার্ভিস নিয়ে আপনি কতটা সন্তুষ্ট?",
    type: "RATING",
  },
];

export const DEFAULT_FEEDBACK_SURVEYS: FeedbackSurvey[] = [
  {
    id: "survey-default-monthly",
    title: "Comprehensive Workplace, Manager, Co-workers, Environment & Services Survey",
    titleBn: "কর্মক্ষেত্র, ম্যানেজার, সহকর্মী, পরিবেশ ও অফিস সার্ভিস মূল্যায়ন সার্ভে",
    cycleType: "MONTHLY",
    periodLabel: new Date().toISOString().slice(0, 7),
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    isActive: true,
    createdBy: "HR & Super Admin",
    createdAt: new Date().toISOString(),
    description:
      "কর্মক্ষেত্র, লাইন ম্যানেজার, সহকর্মী, কাজের পরিবেশ ও অফিস সার্ভিস—এই ৫টি বিষয়ে বিস্তারিত সার্ভে | Multi-question structured survey across 5 core areas: Workplace, Line Manager, Co-workers, Work Environment, and Office/HR Services.",
    questions: DEFAULT_SURVEY_QUESTIONS_TEMPLATE,
  },
];

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

      // Seed Recruitment Jobs
      for (const job of mockJobPostings) {
        await setDoc(doc(db, COL_RECRUITMENT_JOBS, job.id), cleanForFirestore(job));
      }

      // Seed Recruitment Candidates
      for (const cand of mockCandidates) {
        await setDoc(doc(db, COL_RECRUITMENT_CANDIDATES, cand.id), cleanForFirestore(cand));
      }

      console.log("Firestore initial seeding completed successfully.");
    } else {
      // Also ensure recruitment collections are seeded if they were added later
      const jobSnap = await getDocs(collection(db, COL_RECRUITMENT_JOBS));
      if (jobSnap.empty) {
        for (const job of mockJobPostings) {
          await setDoc(doc(db, COL_RECRUITMENT_JOBS, job.id), cleanForFirestore(job));
        }
      }
      const candSnap = await getDocs(collection(db, COL_RECRUITMENT_CANDIDATES));
      if (candSnap.empty) {
        for (const cand of mockCandidates) {
          await setDoc(doc(db, COL_RECRUITMENT_CANDIDATES, cand.id), cleanForFirestore(cand));
        }
      }
    }

    // Ensure the default 5-category bilingual feedback survey is seeded in Firestore
    try {
      const surveySnap = await getDocs(collection(db, COL_FEEDBACK_SURVEYS));
      if (surveySnap.empty) {
        for (const survey of DEFAULT_FEEDBACK_SURVEYS) {
          await setDoc(doc(db, COL_FEEDBACK_SURVEYS, survey.id), cleanForFirestore(survey));
        }
      }
    } catch (surveySeedErr) {
      console.warn("Firestore feedback survey seed notice:", surveySeedErr);
    }
  } catch (err) {
    console.error("Firestore seeding error (will use offline fallback):", err);
  }
}

/* ============================================================
   EMPLOYEES FIRESTORE APIS
   ============================================================ */

const DEMO_EMPLOYEE_IDS = new Set([
  "emp-ceo",
  "emp-02",
  "emp-03",
  "emp-04",
  "emp-05",
  "emp-06",
  "emp-07",
  "emp-08",
  "emp-ex-01",
  "emp-ex-02",
]);

export async function fetchEmployeesFromFirestore(): Promise<Employee[]> {
  try {
    const snap = await getDocs(collection(db, COL_EMPLOYEES));
    if (!snap.empty) {
      return snap.docs
        .map((d) => d.data() as Employee)
        .filter((emp) => !DEMO_EMPLOYEE_IDS.has(emp.id))
        .map((emp) => ({
          ...emp,
          faceDescriptor:
            Array.isArray(emp.faceDescriptor) && emp.faceDescriptor.length === 128
              ? emp.faceDescriptor
              : getOrGenerateEmployeeDescriptor(emp.id, emp.employeeCode),
        }));
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
          const list = snap.docs
            .map((d) => d.data() as Employee)
            .filter((emp) => !DEMO_EMPLOYEE_IDS.has(emp.id))
            .map((emp) => ({
              ...emp,
              faceDescriptor:
                Array.isArray(emp.faceDescriptor) && emp.faceDescriptor.length === 128
                  ? emp.faceDescriptor
                  : getOrGenerateEmployeeDescriptor(emp.id, emp.employeeCode),
            }));
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
    let empToSave = { ...employee };
    // Block saving demo accounts
    if (DEMO_EMPLOYEE_IDS.has(empToSave.id)) {
      console.warn(`Prevented saving legacy demo account: ${empToSave.id}`);
      return false;
    }

    // Safeguard master super admin account from accidental credential change
    if (empToSave.id === "emp-01") {
      empToSave.employeeCode = "MWO1001";
      empToSave.username = "mwo1001";
      empToSave.isSuperAdmin = true;
      empToSave.isCeoOrOwner = true;
      if (!empToSave.fullName || empToSave.fullName.trim() === "") {
        empToSave.fullName = "Md. Ibrahim Hossain";
      }
    }

    // Optimize avatar and face photo if base64 to avoid Firestore document 1MB limit
    if (empToSave.avatarUrl && empToSave.avatarUrl.startsWith("data:")) {
      empToSave.avatarUrl = await compressAndOptimizeImage(empToSave.avatarUrl);
    }
    if (empToSave.faceRegisteredPhoto && empToSave.faceRegisteredPhoto.startsWith("data:")) {
      empToSave.faceRegisteredPhoto = await compressAndOptimizeImage(empToSave.faceRegisteredPhoto);
    }

    await setDoc(doc(db, COL_EMPLOYEES, empToSave.id), cleanForFirestore(empToSave), { merge: true });

    if (empToSave.avatarUrl) {
      try {
        localStorage.setItem(`workflow_hr_cached_avatar_${empToSave.id}`, empToSave.avatarUrl);
      } catch (e) {
        console.warn("Local storage avatar cache notice:", e);
      }
    }
    console.log(`Employee ${empToSave.id} saved to Firestore successfully.`);
    return true;
  } catch (err) {
    console.error("Failed to save employee to Firestore:", err);
    return false;
  }
}

export async function deleteEmployeeFromFirestore(employeeId: string): Promise<boolean> {
  try {
    // Never allow deletion of master Super Admin account
    if (employeeId === "emp-01") {
      console.warn("Master Super Admin account emp-01 cannot be deleted.");
      return false;
    }

    await deleteDoc(doc(db, COL_EMPLOYEES, employeeId));
    try {
      localStorage.removeItem(`workflow_hr_cached_avatar_${employeeId}`);
    } catch (e) {
      // ignore
    }
    console.log(`Employee ${employeeId} deleted from Firestore successfully.`);
    return true;
  } catch (err) {
    console.error("Failed to delete employee from Firestore:", err);
    return false;
  }
}

export async function updateEmployeeFacePhotoInFirestore(
  employeeId: string,
  photoUrl: string,
  verificationScore?: number,
  faceDescriptor?: number[]
): Promise<{ success: boolean; optimizedUrl: string; faceDescriptor?: number[] }> {
  try {
    // Compress and downscale photo to max 480x480 JPEG (~30KB-50KB) to ensure it is always
    // vastly below Firestore's 1MB limit and saves instantaneously
    const optimizedPhoto = await compressAndOptimizeImage(photoUrl, 480, 480, 0.82);

    // Extract 128D face descriptor vector if not already supplied
    let finalDescriptor = faceDescriptor;
    if (!finalDescriptor || finalDescriptor.length !== 128) {
      try {
        const extracted = await extract128DVector(optimizedPhoto);
        if (extracted && extracted.length === 128) {
          finalDescriptor = extracted;
        }
      } catch (descErr) {
        console.warn("Auto face descriptor extraction fallback:", descErr);
      }
    }

    const now = new Date();
    const updateData: Record<string, any> = {
      faceRegisteredPhoto: optimizedPhoto,
      avatarUrl: optimizedPhoto,
      faceTemplateRegistered: true,
      faceVerified: true,
      faceVerificationRequired: false,
      faceRegisteredAt: now.toISOString().split("T")[0],
      faceVerifiedAt: now.toISOString(),
    };

    if (finalDescriptor && finalDescriptor.length === 128) {
      updateData.faceDescriptor = finalDescriptor;
    }

    if (typeof verificationScore === "number") {
      updateData.faceVerificationScore = verificationScore;
    }

    // Use setDoc with merge: true for atomic, resilient update
    await setDoc(doc(db, COL_EMPLOYEES, employeeId), cleanForFirestore(updateData), { merge: true });

    // Invalidate local in-memory 128D biometric vector cache so the new photo is immediately processed
    invalidateEmployeeFaceCache(employeeId);

    // Also cache in localStorage for instant offline resilience & instant load upon reload
    try {
      localStorage.setItem(`workflow_hr_cached_avatar_${employeeId}`, optimizedPhoto);
      localStorage.setItem(`workflow_hr_cached_verified_${employeeId}`, "true");
      if (finalDescriptor) {
        localStorage.setItem(`workflow_hr_cached_descriptor_${employeeId}`, JSON.stringify(finalDescriptor));
      }
      if (typeof verificationScore === "number") {
        localStorage.setItem(`workflow_hr_cached_score_${employeeId}`, String(verificationScore));
      }
    } catch (e) {
      console.warn("Local storage avatar cache notice:", e);
    }

    return { success: true, optimizedUrl: optimizedPhoto, faceDescriptor: finalDescriptor };
  } catch (err) {
    console.error("Failed to update face photo in Firestore:", err);
    return { success: false, optimizedUrl: photoUrl };
  }
}

/**
 * When a user uploads a new photo before live face verification,
 * save the photo but mark biometric verification as PENDING / REQUIRED.
 */
export async function updateEmployeePhotoPendingVerificationInFirestore(
  employeeId: string,
  photoUrl: string
): Promise<{ success: boolean; optimizedUrl: string }> {
  try {
    const optimizedPhoto = await compressAndOptimizeImage(photoUrl, 480, 480, 0.82);

    const updateData: Record<string, any> = {
      faceRegisteredPhoto: optimizedPhoto,
      avatarUrl: optimizedPhoto,
      faceTemplateRegistered: false,
      faceVerified: false,
      faceVerificationRequired: true,
      faceVerificationScore: null,
      faceVerifiedAt: null,
    };

    await setDoc(doc(db, COL_EMPLOYEES, employeeId), cleanForFirestore(updateData), { merge: true });
    invalidateEmployeeFaceCache(employeeId);

    try {
      localStorage.setItem(`workflow_hr_cached_avatar_${employeeId}`, optimizedPhoto);
      localStorage.setItem(`workflow_hr_cached_verified_${employeeId}`, "false");
      localStorage.removeItem(`workflow_hr_cached_score_${employeeId}`);
    } catch (e) {
      console.warn("Local storage cache notice:", e);
    }

    return { success: true, optimizedUrl: optimizedPhoto };
  } catch (err) {
    console.error("Failed to save pending photo in Firestore:", err);
    return { success: false, optimizedUrl: photoUrl };
  }
}

/**
 * Super Admin Manual Verification Override:
 * Allows Super Admin to manually approve and verify an employee's face photo
 * without requiring live camera test (e.g. for CEO, Chairman, or VIP staff).
 */
export async function manualVerifyEmployeeFaceInFirestore(
  employeeId: string,
  verifiedByAdminName: string = "Super Admin",
  isAttendanceExempt: boolean = false
): Promise<{ success: boolean; message: string }> {
  try {
    const now = new Date();
    const updateData: Record<string, any> = {
      faceTemplateRegistered: true,
      faceVerified: true,
      faceVerificationRequired: false,
      faceVerificationScore: 100,
      faceVerifiedAt: now.toISOString(),
      manuallyVerifiedByAdmin: true,
      verifiedByAdminName,
      isAttendanceExempt,
    };

    await setDoc(doc(db, COL_EMPLOYEES, employeeId), cleanForFirestore(updateData), { merge: true });
    invalidateEmployeeFaceCache(employeeId);

    try {
      localStorage.setItem(`workflow_hr_cached_verified_${employeeId}`, "true");
      localStorage.setItem(`workflow_hr_cached_score_${employeeId}`, "100");
    } catch (e) {
      console.warn("Local storage cache notice:", e);
    }

    return {
      success: true,
      message: `Employee ${employeeId} manually verified by ${verifiedByAdminName}`,
    };
  } catch (err: any) {
    console.error("Manual verification failed in Firestore:", err);
    return {
      success: false,
      message: err?.message || "Failed to update manual verification",
    };
  }
}

/* ============================================================
   ATTENDANCE FIRESTORE APIS
   ============================================================ */

const FORBIDDEN_DEMO_NAMES = [
  "sharmin",
  "tariqul",
  "tareq",
  "kamrun",
  "nafis",
  "rafiqul",
  "anika",
  "tanvir",
  "nusrat",
  "shafiullah",
  "demo",
];

function isDemoAttendanceRecord(data: AttendanceRecord): boolean {
  if (!data) return true;
  if (data.employeeId && DEMO_EMPLOYEE_IDS.has(data.employeeId)) return true;
  const name = (data.employeeName || "").toLowerCase();
  const code = (data.employeeCode || "").toLowerCase();
  const id = (data.id || "").toLowerCase();
  if (FORBIDDEN_DEMO_NAMES.some((dn) => name.includes(dn) || code.includes(dn) || id.includes(dn))) {
    return true;
  }
  return false;
}

export async function fetchAttendanceFromFirestore(): Promise<AttendanceRecord[]> {
  try {
    const snap = await getDocs(collection(db, COL_ATTENDANCE));
    if (!snap.empty) {
      return snap.docs
        .map((d) => d.data() as AttendanceRecord)
        .filter((rec) => !isDemoAttendanceRecord(rec));
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
          const list: AttendanceRecord[] = [];
          for (const d of snap.docs) {
            const data = d.data() as AttendanceRecord;
            if (isDemoAttendanceRecord(data)) {
              deleteDoc(doc(db, COL_ATTENDANCE, d.id)).catch(() => {});
            } else {
              list.push(data);
            }
          }
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
    if (isDemoAttendanceRecord(record)) return;
    await setDoc(doc(db, COL_ATTENDANCE, record.id), cleanForFirestore(record), { merge: true });
  } catch (err) {
    console.error("Failed to save attendance record in Firestore:", err);
  }
}

export async function deleteAttendanceRecordFromFirestore(attendanceId: string) {
  try {
    await deleteDoc(doc(db, COL_ATTENDANCE, attendanceId));
  } catch (err) {
    console.error("Failed to delete attendance record from Firestore:", err);
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

export async function deleteLeaveFromFirestore(leaveId: string) {
  try {
    await deleteDoc(doc(db, COL_LEAVES, leaveId));
  } catch (err) {
    console.error("Failed to delete leave from Firestore:", err);
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

export async function savePayrollPolicyToFirestore(policy: PayrollPolicyConfig) {
  try {
    await setDoc(
      doc(db, COL_SETTINGS, "payroll_policy"),
      cleanForFirestore({
        policy,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.error("Failed to save payroll policy to Firestore:", err);
  }
}

export function subscribeToPayrollPolicy(onUpdate: (policy: PayrollPolicyConfig) => void) {
  try {
    return onSnapshot(
      doc(db, COL_SETTINGS, "payroll_policy"),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (data.policy) {
            onUpdate(data.policy as PayrollPolicyConfig);
          }
        }
      },
      (err) => console.warn("Firestore payroll policy listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export async function saveBiometricSettingsToFirestore(settings: BiometricKioskSettings) {
  try {
    await setDoc(
      doc(db, COL_SETTINGS, "biometric_kiosk"),
      cleanForFirestore({
        settings,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.error("Failed to save biometric settings to Firestore:", err);
  }
}

export function subscribeToBiometricSettings(onUpdate: (settings: BiometricKioskSettings) => void) {
  try {
    return onSnapshot(
      doc(db, COL_SETTINGS, "biometric_kiosk"),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (data.settings) {
            onUpdate(data.settings as BiometricKioskSettings);
          }
        }
      },
      (err) => console.warn("Firestore biometric settings listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export async function saveDeletedEmployeesToFirestore(deletedList: Employee[]) {
  try {
    const sanitized = deletedList.map((emp) => {
      const copy = { ...emp };
      if (copy.avatarUrl && copy.avatarUrl.length > 50000) {
        copy.avatarUrl = "";
      }
      if (copy.faceRegisteredPhoto && copy.faceRegisteredPhoto.length > 50000) {
        copy.faceRegisteredPhoto = "";
      }
      return copy;
    });
    await setDoc(
      doc(db, COL_SETTINGS, "deleted_employees"),
      cleanForFirestore({
        employees: sanitized,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.error("Failed to save deleted employees to Firestore:", err);
  }
}

export function subscribeToDeletedEmployees(onUpdate: (employees: Employee[]) => void) {
  try {
    return onSnapshot(
      doc(db, COL_SETTINGS, "deleted_employees"),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.employees)) {
            onUpdate(data.employees as Employee[]);
          }
        }
      },
      (err) => console.warn("Firestore deleted employees listener error:", err)
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

export async function updateLoanStatusInFirestore(loanId: string, status: "ACTIVE" | "REJECTED" | "PAID" | "CLOSED") {
  try {
    await updateDoc(doc(db, COL_LOANS, loanId), { status });
  } catch (err) {
    console.error("Failed to update loan in Firestore:", err);
  }
}

export async function deleteLoanFromFirestore(loanId: string) {
  try {
    await deleteDoc(doc(db, COL_LOANS, loanId));
  } catch (err) {
    console.error("Failed to delete loan in Firestore:", err);
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

export async function saveBranchToFirestore(branch: Branch): Promise<boolean> {
  try {
    const docRef = doc(db, COL_BRANCHES, branch.id);
    await setDoc(docRef, cleanForFirestore(branch), { merge: true });
    return true;
  } catch (e) {
    console.warn("Error saving branch to Firestore:", e);
    return false;
  }
}

export async function deleteBranchFromFirestore(branchId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COL_BRANCHES, branchId));
    return true;
  } catch (e) {
    console.warn("Error deleting branch from Firestore:", e);
    return false;
  }
}

export async function saveDepartmentToFirestore(department: Department): Promise<boolean> {
  try {
    const docRef = doc(db, COL_DEPARTMENTS, department.id);
    await setDoc(docRef, cleanForFirestore(department), { merge: true });
    return true;
  } catch (e) {
    console.warn("Error saving department to Firestore:", e);
    return false;
  }
}

export async function deleteDepartmentFromFirestore(departmentId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COL_DEPARTMENTS, departmentId));
    return true;
  } catch (e) {
    console.warn("Error deleting department from Firestore:", e);
    return false;
  }
}

export async function saveDesignationToFirestore(designation: Designation): Promise<boolean> {
  try {
    const docRef = doc(db, COL_DESIGNATIONS, designation.id);
    await setDoc(docRef, cleanForFirestore(designation), { merge: true });
    return true;
  } catch (e) {
    console.warn("Error saving designation to Firestore:", e);
    return false;
  }
}

export async function deleteDesignationFromFirestore(designationId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COL_DESIGNATIONS, designationId));
    return true;
  } catch (e) {
    console.warn("Error deleting designation from Firestore:", e);
    return false;
  }
}

/* ============================================================
   RECRUITMENT (JOBS & CANDIDATES) FIRESTORE APIS
   ============================================================ */

export async function fetchJobsFromFirestore(): Promise<JobPosting[]> {
  try {
    const snap = await getDocs(collection(db, COL_RECRUITMENT_JOBS));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as JobPosting);
    }
  } catch (err) {
    console.warn("Firestore fetch jobs error:", err);
  }
  return mockJobPostings;
}

export function subscribeToJobs(onUpdate: (jobs: JobPosting[]) => void) {
  try {
    return onSnapshot(
      collection(db, COL_RECRUITMENT_JOBS),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as JobPosting);
          onUpdate(list);
        }
      },
      (err) => console.warn("Firestore jobs listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export async function saveJobToFirestore(job: JobPosting) {
  try {
    await setDoc(doc(db, COL_RECRUITMENT_JOBS, job.id), cleanForFirestore(job), { merge: true });
  } catch (err) {
    console.error("Failed to save job to Firestore:", err);
  }
}

export async function deleteJobFromFirestore(jobId: string) {
  try {
    await deleteDoc(doc(db, COL_RECRUITMENT_JOBS, jobId));
  } catch (err) {
    console.error("Failed to delete job from Firestore:", err);
  }
}

export async function fetchCandidatesFromFirestore(): Promise<Candidate[]> {
  try {
    const snap = await getDocs(collection(db, COL_RECRUITMENT_CANDIDATES));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as Candidate);
    }
  } catch (err) {
    console.warn("Firestore fetch candidates error:", err);
  }
  return mockCandidates;
}

export function subscribeToCandidates(onUpdate: (candidates: Candidate[]) => void) {
  try {
    return onSnapshot(
      collection(db, COL_RECRUITMENT_CANDIDATES),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as Candidate);
          onUpdate(list);
        }
      },
      (err) => console.warn("Firestore candidates listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export async function saveCandidateToFirestore(candidate: Candidate) {
  try {
    await setDoc(doc(db, COL_RECRUITMENT_CANDIDATES, candidate.id), cleanForFirestore(candidate), { merge: true });
  } catch (err) {
    console.error("Failed to save candidate to Firestore:", err);
  }
}

export async function saveBulkCandidatesToFirestore(candidates: Candidate[]) {
  try {
    // Save in batches or parallel setDocs
    for (const cand of candidates) {
      await setDoc(doc(db, COL_RECRUITMENT_CANDIDATES, cand.id), cleanForFirestore(cand), { merge: true });
    }
  } catch (err) {
    console.error("Failed to bulk save candidates to Firestore:", err);
  }
}

export async function deleteCandidateFromFirestore(candidateId: string) {
  try {
    await deleteDoc(doc(db, COL_RECRUITMENT_CANDIDATES, candidateId));
  } catch (err) {
    console.error("Failed to delete candidate from Firestore:", err);
  }
}

/* ============================================================
   ORGANIZATION & BRANCH RESET ENGINE (SUPER ADMIN EXCLUSIVE)
   ============================================================ */

export interface OrganizationResetOptions {
  branchId?: string; // If specified, only reset this branch; otherwise all branches in org
  branchName?: string;
  keepSuperAdminId: string; // The logged-in Super Admin who is NEVER deleted
  resetEmployees?: boolean; // Default true: delete all employees except Super Admin
  resetAttendance?: boolean; // Delete attendance punch records
  resetLeavesAndLoans?: boolean; // Delete leave requests & loan records
  resetPayroll?: boolean; // Delete payslips
  resetRecruitment?: boolean; // Delete candidate ATS & job postings
  resetDepartments?: boolean; // Reset departments
  resetDesignations?: boolean; // Reset designations
  cleanSlateTemplates?: boolean; // Keep clean minimum departments/designations or wipe
}

export async function resetOrganizationDataInFirestore(
  options: OrganizationResetOptions
): Promise<{
  success: boolean;
  deletedEmployeesCount: number;
  message: string;
}> {
  try {
    const {
      branchId,
      branchName,
      keepSuperAdminId,
      resetEmployees = true,
      resetAttendance = true,
      resetLeavesAndLoans = true,
      resetPayroll = true,
      resetRecruitment = true,
      resetDepartments = false,
      resetDesignations = false,
    } = options;

    let deletedEmployees = 0;

    // 1. Delete target employees (EXCLUDING the current Super Admin!)
    if (resetEmployees) {
      const empSnap = await getDocs(collection(db, COL_EMPLOYEES));
      for (const d of empSnap.docs) {
        const empData = d.data() as Employee;
        const empId = d.id;

        // CRITICAL PROTECTION: Never delete the active Super Admin!
        if (empId === keepSuperAdminId) {
          continue;
        }

        // Filter by branch if specific branch is requested
        if (branchId && branchId !== "ALL" && empData.branchId && empData.branchId !== branchId) {
          continue;
        }

        try {
          await deleteDoc(doc(db, COL_EMPLOYEES, empId));
          deletedEmployees++;
          // Clean cache
          try {
            localStorage.removeItem(`workflow_hr_cached_avatar_${empId}`);
            localStorage.removeItem(`workflow_hr_cached_score_${empId}`);
            localStorage.removeItem(`workflow_hr_cached_verified_${empId}`);
          } catch {
            // ignore
          }
        } catch (e) {
          console.warn(`Could not delete employee ${empId}:`, e);
        }
      }
    }

    // 2. Delete attendance records
    if (resetAttendance) {
      const attSnap = await getDocs(collection(db, COL_ATTENDANCE));
      for (const d of attSnap.docs) {
        const data = d.data() as AttendanceRecord;
        if (branchId && branchId !== "ALL" && data.branchId && data.branchId !== branchId) {
          continue;
        }
        await deleteDoc(doc(db, COL_ATTENDANCE, d.id)).catch(() => {});
      }
    }

    // 3. Delete leaves
    if (resetLeavesAndLoans) {
      const leaveSnap = await getDocs(collection(db, COL_LEAVES));
      for (const d of leaveSnap.docs) {
        const data = d.data() as LeaveApplication;
        if (data.employeeId === keepSuperAdminId) continue;
        await deleteDoc(doc(db, COL_LEAVES, d.id)).catch(() => {});
      }

      const loanSnap = await getDocs(collection(db, COL_LOANS));
      for (const d of loanSnap.docs) {
        const data = d.data() as EmployeeLoan;
        if (data.employeeId === keepSuperAdminId) continue;
        await deleteDoc(doc(db, COL_LOANS, d.id)).catch(() => {});
      }
    }

    // 4. Delete payroll payslips
    if (resetPayroll) {
      const paySnap = await getDocs(collection(db, COL_PAYSLIPS));
      for (const d of paySnap.docs) {
        const data = d.data() as Payslip;
        if (data.employeeId === keepSuperAdminId) continue;
        await deleteDoc(doc(db, COL_PAYSLIPS, d.id)).catch(() => {});
      }
    }

    // 5. Delete recruitment data
    if (resetRecruitment) {
      const candSnap = await getDocs(collection(db, COL_RECRUITMENT_CANDIDATES));
      for (const d of candSnap.docs) {
        await deleteDoc(doc(db, COL_RECRUITMENT_CANDIDATES, d.id)).catch(() => {});
      }
      const jobSnap = await getDocs(collection(db, COL_RECRUITMENT_JOBS));
      for (const d of jobSnap.docs) {
        await deleteDoc(doc(db, COL_RECRUITMENT_JOBS, d.id)).catch(() => {});
      }
    }

    // 6. Reset departments if requested
    if (resetDepartments) {
      const deptSnap = await getDocs(collection(db, COL_DEPARTMENTS));
      for (const d of deptSnap.docs) {
        await deleteDoc(doc(db, COL_DEPARTMENTS, d.id)).catch(() => {});
      }
    }

    // 7. Reset designations if requested
    if (resetDesignations) {
      const desSnap = await getDocs(collection(db, COL_DESIGNATIONS));
      for (const d of desSnap.docs) {
        await deleteDoc(doc(db, COL_DESIGNATIONS, d.id)).catch(() => {});
      }
    }

    const scopeName = branchName || (branchId && branchId !== "ALL" ? `শাখা ${branchId}` : "সম্পূর্ণ প্রতিষ্ঠান");
    return {
      success: true,
      deletedEmployeesCount: deletedEmployees,
      message: `${scopeName}-এর সমস্ত পুরনো তথ্য সফলভাবে রিসেট করা হয়েছে। আপনার সুপার অ্যাডমিন অ্যাকাউন্ট নিরাপদ রয়েছে।`,
    };
  } catch (err: any) {
    console.error("Organization reset error:", err);
    return {
      success: false,
      deletedEmployeesCount: 0,
      message: err?.message || "রিসেট প্রক্রিয়া সম্পন্ন করতে সমস্যা হয়েছে",
    };
  }
}

/* ============================================================
   PROJECTS, TASKS & NOTIFICATIONS FIRESTORE APIS
   ============================================================ */

export function subscribeToProjects(onUpdate: (projects: Project[]) => void) {
  try {
    return onSnapshot(
      collection(db, COL_PROJECTS),
      (snap) => {
        if (!snap.empty) {
          onUpdate(snap.docs.map((d) => d.data() as Project));
        }
      },
      (err) => console.warn("Firestore projects listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export async function saveProjectToFirestore(project: Project) {
  try {
    await setDoc(doc(db, COL_PROJECTS, project.id), cleanForFirestore(project), { merge: true });
  } catch (err) {
    console.error("Failed to save project in Firestore:", err);
  }
}

export async function deleteProjectFromFirestore(projectId: string) {
  try {
    await deleteDoc(doc(db, COL_PROJECTS, projectId));
  } catch (err) {
    console.error("Failed to delete project from Firestore:", err);
  }
}

export function subscribeToTasks(onUpdate: (tasks: ProjectTask[]) => void) {
  try {
    return onSnapshot(
      collection(db, COL_TASKS),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as ProjectTask);
          list.sort((a, b) => (b.createdAt || b.id).localeCompare(a.createdAt || a.id));
          onUpdate(list);
        }
      },
      (err) => console.warn("Firestore tasks listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export async function saveTaskToFirestore(task: ProjectTask) {
  try {
    await setDoc(doc(db, COL_TASKS, task.id), cleanForFirestore(task), { merge: true });
  } catch (err) {
    console.error("Failed to save task in Firestore:", err);
  }
}

export async function deleteTaskFromFirestore(taskId: string) {
  try {
    await deleteDoc(doc(db, COL_TASKS, taskId));
  } catch (err) {
    console.error("Failed to delete task from Firestore:", err);
  }
}

export function subscribeToNotifications(onUpdate: (items: SystemNotification[]) => void) {
  try {
    return onSnapshot(
      collection(db, COL_NOTIFICATIONS),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as SystemNotification);
        list.sort((a, b) => (b.timestamp || b.id).localeCompare(a.timestamp || a.id));
        onUpdate(list);
      },
      (err) => console.warn("Firestore notifications listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export async function saveNotificationToFirestore(notification: SystemNotification) {
  try {
    await setDoc(doc(db, COL_NOTIFICATIONS, notification.id), cleanForFirestore(notification), { merge: true });
  } catch (err) {
    console.error("Failed to save notification in Firestore:", err);
  }
}

export async function markNotificationReadInFirestore(notificationId: string) {
  try {
    await setDoc(doc(db, COL_NOTIFICATIONS, notificationId), { read: true }, { merge: true });
  } catch (err) {
    console.error("Failed to mark notification read in Firestore:", err);
  }
}

/* ============================================================
   DAILY WORK LOGS FIRESTORE APIS
   ============================================================ */

export function subscribeToWorkLogs(onUpdate: (logs: DailyWorkLog[]) => void) {
  try {
    return onSnapshot(
      collection(db, COL_WORK_LOGS),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as DailyWorkLog);
        list.sort((a, b) =>
          ((b.date || "") + (b.startTime || "")).localeCompare((a.date || "") + (a.startTime || ""))
        );
        onUpdate(list);
      },
      (err) => console.warn("Firestore work logs listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export async function saveWorkLogToFirestore(log: DailyWorkLog) {
  try {
    await setDoc(doc(db, COL_WORK_LOGS, log.id), cleanForFirestore(log), { merge: true });
  } catch (err) {
    console.error("Failed to save work log in Firestore:", err);
  }
}

export async function deleteWorkLogFromFirestore(logId: string) {
  try {
    await deleteDoc(doc(db, COL_WORK_LOGS, logId));
  } catch (err) {
    console.error("Failed to delete work log from Firestore:", err);
  }
}

/* ============================================================
   FEEDBACK SURVEYS, ANONYMOUS BOX & PERFORMANCE POINTS APIS
   ============================================================ */

export function subscribeToFeedbackSurveys(onUpdate: (surveys: FeedbackSurvey[]) => void) {
  try {
    return onSnapshot(
      collection(db, COL_FEEDBACK_SURVEYS),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as FeedbackSurvey);
          list.sort((a, b) => (b.createdAt || b.id).localeCompare(a.createdAt || a.id));
          onUpdate(list);
        }
      },
      (err) => console.warn("Firestore feedback surveys listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export async function saveFeedbackSurveyToFirestore(survey: FeedbackSurvey) {
  try {
    await setDoc(doc(db, COL_FEEDBACK_SURVEYS, survey.id), cleanForFirestore(survey), { merge: true });
  } catch (err) {
    console.error("Failed to save feedback survey in Firestore:", err);
  }
}

export async function deleteFeedbackSurveyFromFirestore(surveyId: string) {
  try {
    await deleteDoc(doc(db, COL_FEEDBACK_SURVEYS, surveyId));
  } catch (err) {
    console.error("Failed to delete feedback survey from Firestore:", err);
  }
}

export function subscribeToSurveyResponses(onUpdate: (responses: SurveyResponse[]) => void) {
  try {
    return onSnapshot(
      collection(db, COL_SURVEY_RESPONSES),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as SurveyResponse);
        list.sort((a, b) => (b.submittedAt || b.id).localeCompare(a.submittedAt || a.id));
        onUpdate(list);
      },
      (err) => console.warn("Firestore survey responses listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export async function saveSurveyResponseToFirestore(response: SurveyResponse) {
  try {
    await setDoc(doc(db, COL_SURVEY_RESPONSES, response.id), cleanForFirestore(response), { merge: true });
  } catch (err) {
    console.error("Failed to save survey response in Firestore:", err);
  }
}

export function subscribeToAnonymousFeedback(onUpdate: (items: AnonymousFeedback[]) => void) {
  try {
    return onSnapshot(
      collection(db, COL_ANONYMOUS_FEEDBACK),
      (snap) => {
        const list = snap.docs.map((d) => {
          const raw = d.data() as Record<string, any>;
          // Guarantee zero-PII shape when reading as well
          return {
            id: raw.id || d.id,
            category: raw.category || "OTHER",
            subject: raw.subject || "",
            message: raw.message || "",
            urgency: raw.urgency || "MEDIUM",
            submittedAt: raw.submittedAt || "",
            status: raw.status || "NEW",
            adminActionNote: raw.adminActionNote,
            updatedAt: raw.updatedAt,
          } as AnonymousFeedback;
        });
        list.sort((a, b) => (b.submittedAt || b.id).localeCompare(a.submittedAt || a.id));
        onUpdate(list);
      },
      (err) => console.warn("Firestore anonymous feedback listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export async function saveAnonymousFeedbackToFirestore(item: AnonymousFeedback) {
  try {
    // Strictly allowlist ONLY non-identifying fields so zero PII is ever persisted
    const strictZeroPiiDoc: AnonymousFeedback = {
      id: item.id,
      category: item.category,
      subject: item.subject,
      message: item.message,
      urgency: item.urgency,
      submittedAt: item.submittedAt,
      status: item.status,
      ...(item.adminActionNote !== undefined ? { adminActionNote: item.adminActionNote } : {}),
      ...(item.updatedAt !== undefined ? { updatedAt: item.updatedAt } : {}),
    };
    await setDoc(doc(db, COL_ANONYMOUS_FEEDBACK, strictZeroPiiDoc.id), cleanForFirestore(strictZeroPiiDoc), {
      merge: true,
    });
  } catch (err) {
    console.error("Failed to save anonymous feedback in Firestore:", err);
  }
}

export async function deleteAnonymousFeedbackFromFirestore(feedbackId: string) {
  try {
    await deleteDoc(doc(db, COL_ANONYMOUS_FEEDBACK, feedbackId));
  } catch (err) {
    console.error("Failed to delete anonymous feedback from Firestore:", err);
  }
}

export function subscribeToTeamRatings(onUpdate: (ratings: TeamMemberRating[]) => void) {
  try {
    return onSnapshot(
      collection(db, COL_PERFORMANCE_POINTS),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as TeamMemberRating);
        list.sort((a, b) => (b.month + b.createdAt).localeCompare(a.month + a.createdAt));
        onUpdate(list);
      },
      (err) => console.warn("Firestore team ratings listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export async function saveTeamRatingToFirestore(rating: TeamMemberRating) {
  try {
    await setDoc(doc(db, COL_PERFORMANCE_POINTS, rating.id), cleanForFirestore(rating), { merge: true });
  } catch (err) {
    console.error("Failed to save team rating in Firestore:", err);
  }
}

export async function deleteTeamRatingFromFirestore(ratingId: string) {
  try {
    await deleteDoc(doc(db, COL_PERFORMANCE_POINTS, ratingId));
  } catch (err) {
    console.error("Failed to delete team rating from Firestore:", err);
  }
}

export function subscribeToManagerRatings(onUpdate: (ratings: ManagerRating[]) => void) {
  try {
    return onSnapshot(
      collection(db, COL_MANAGER_RATINGS),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as ManagerRating);
        list.sort((a, b) => (b.month + b.createdAt).localeCompare(a.month + a.createdAt));
        onUpdate(list);
      },
      (err) => console.warn("Firestore manager ratings listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

export async function saveManagerRatingToFirestore(rating: ManagerRating) {
  try {
    await setDoc(doc(db, COL_MANAGER_RATINGS, rating.id), cleanForFirestore(rating), { merge: true });
  } catch (err) {
    console.error("Failed to save manager rating in Firestore:", err);
  }
}

export async function deleteManagerRatingFromFirestore(ratingId: string) {
  try {
    await deleteDoc(doc(db, COL_MANAGER_RATINGS, ratingId));
  } catch (err) {
    console.error("Failed to delete manager rating from Firestore:", err);
  }
}

export async function saveRolePermissionsToFirestore(rolePermissions: RolePermissionConfig[]) {
  try {
    await setDoc(
      doc(db, COL_SETTINGS, "role_permissions"),
      cleanForFirestore({
        rolePermissions,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.error("Failed to save role permissions in Firestore:", err);
  }
}

export function subscribeToRolePermissions(onUpdate: (roles: RolePermissionConfig[]) => void) {
  try {
    return onSnapshot(
      doc(db, COL_SETTINGS, "role_permissions"),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.rolePermissions) && data.rolePermissions.length > 0) {
            onUpdate(data.rolePermissions as RolePermissionConfig[]);
          }
        }
      },
      (err) => console.warn("Firestore role permissions listener error:", err)
    );
  } catch (e) {
    console.warn(e);
    return () => {};
  }
}

/* ============================================================
   FIRESTORE HEALTH & STATUS CHECK
   ============================================================ */
export async function checkFirestoreConnection(): Promise<{
  ok: boolean;
  databaseId: string;
  projectId: string;
  error?: string;
}> {
  try {
    // Quick probe to test live server read
    await getDocs(collection(db, COL_SETTINGS));
    return {
      ok: true,
      databaseId: firebaseConfig.firestoreDatabaseId || "default",
      projectId: firebaseConfig.projectId,
    };
  } catch (err: any) {
    console.warn("Firestore connection check:", err);
    return {
      ok: false,
      databaseId: firebaseConfig.firestoreDatabaseId || "default",
      projectId: firebaseConfig.projectId,
      error: err?.message || String(err),
    };
  }
}


