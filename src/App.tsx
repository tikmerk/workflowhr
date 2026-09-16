import React, { useState, useEffect } from "react";
import {
  Sidebar,
  Header,
  Footer,
  CompanyBrandingModal,
  DigitalIdCardModal,
} from "./components/common";
import { MobileBottomNav } from "./components/common/MobileBottomNav";
import { SmartAttendanceModal } from "./components/attendance/SmartAttendanceModal";
import { FaceEnrollmentModal } from "./components/attendance/FaceEnrollmentModal";
import { AIHrAssistantModal } from "./components/ai/AIHrAssistantModal";
import { OrganizationResetModal } from "./components/modals/OrganizationResetModal";
import { ThemeLanguageProvider, useThemeLanguage } from "./context/ThemeLanguageContext";
import { CompanyBrandingProvider } from "./context/CompanyBrandingContext";

// Firestore Realtime Service
import {
  initializeFirestoreDatabase,
  subscribeToEmployees,
  subscribeToAttendance,
  subscribeToLeaves,
  subscribeToLoans,
  subscribeToBranches,
  subscribeToDepartments,
  subscribeToDesignations,
  subscribeToAuditLogs,
  subscribeToJobs,
  saveJobToFirestore,
  deleteJobFromFirestore,
  subscribeToCandidates,
  saveCandidateToFirestore,
  saveBulkCandidatesToFirestore,
  deleteCandidateFromFirestore,
  updateEmployeeFacePhotoInFirestore,
  updateEmployeePhotoPendingVerificationInFirestore,
  saveEmployeeToFirestore,
  deleteEmployeeFromFirestore,
  saveBranchToFirestore,
  deleteBranchFromFirestore,
  saveDepartmentToFirestore,
  deleteDepartmentFromFirestore,
  saveDesignationToFirestore,
  deleteDesignationFromFirestore,
  saveAttendanceRecordToFirestore,
  saveLeaveApplicationToFirestore,
  updateLeaveStatusInFirestore,
  deleteLeaveFromFirestore,
  saveLoanToFirestore,
  updateLoanStatusInFirestore,
  deleteLoanFromFirestore,
  savePayslipsToFirestore,
  saveAuditLogToFirestore,
  savePayrollPolicyToFirestore,
  subscribeToPayrollPolicy,
  saveDeletedEmployeesToFirestore,
  subscribeToDeletedEmployees,
} from "./services/firestoreService";
import { compressAndOptimizeImage } from "./utils/imageCompression";

// Views
import { LoginView } from "./components/views/LoginView";
import { DashboardView } from "./components/views/DashboardView";
import { EmployeeSelfServiceView } from "./components/views/EmployeeSelfServiceView";
import { EmployeesDirectoryView } from "./components/views/EmployeesDirectoryView";
import { DepartmentsDesignationsView } from "./components/views/DepartmentsDesignationsView";
import { BranchesGeofenceView } from "./components/views/BranchesGeofenceView";
import { NgoProgramsTrainingView } from "./components/views/NgoProgramsTrainingView";
import { AttendanceLogsView } from "./components/views/AttendanceLogsView";
import { RealtimeFaceRecognitionView } from "./components/views/RealtimeFaceRecognitionView";
import { ShiftsHolidaysView } from "./components/views/ShiftsHolidaysView";
import { LeavesView } from "./components/views/LeavesView";
import { PayrollView } from "./components/views/PayrollView";
import { LoansView } from "./components/views/LoansView";
import { RecruitmentView } from "./components/views/RecruitmentView";
import { ProjectsTasksView } from "./components/views/ProjectsTasksView";
import { AssetsView } from "./components/views/AssetsView";
import { CertificatesView } from "./components/views/CertificatesView";
import { ExitManagementView } from "./components/views/ExitManagementView";
import { NoticesChatView } from "./components/views/NoticesChatView";
import { AuditReportsView } from "./components/views/AuditReportsView";
import { MeetingsConferencesView } from "./components/views/MeetingsConferencesView";
import { RolesPermissionsView } from "./components/views/RolesPermissionsView";

// Initial Mock Dataset & Engines
import {
  mockCompany,
  mockBranches,
  mockDepartments,
  mockDesignations,
  mockShifts,
  mockHolidays,
  mockEmployees,
  mockAttendanceRecords,
  mockLeaves,
  mockPayslips,
  mockLoans,
  mockJobPostings,
  mockCandidates,
  mockProjects,
  mockTasks,
  mockAssets,
  mockCertificates,
  mockExitRecords,
  mockNotices,
  mockChatMessages,
  mockAuditLogs,
  INITIAL_MEETINGS_CONFERENCES,
  INITIAL_ROLE_PERMISSIONS,
  INITIAL_PAYROLL_POLICY,
  INITIAL_TREASURY_ACCOUNTS,
} from "./data/mockDatabase";
import { calculateMonthlyPayroll, normalizeMonthKey } from "./utils/payrollEngine";
import {
  NavigationTab,
  Employee,
  Branch,
  Department,
  Designation,
  Shift,
  Holiday,
  AttendanceRecord,
  LeaveApplication,
  Payslip,
  EmployeeLoan,
  JobPosting,
  Candidate,
  Project,
  ProjectTask,
  CompanyAsset,
  CertificateRecord,
  ExitRecord,
  Notice,
  ChatMessage,
  AuditLog,
  MeetingConference,
  RolePermissionConfig,
  PayrollPolicyConfig,
  TreasuryAccount,
} from "./types";
import { CheckCircle2, Info, X } from "lucide-react";

function AppContent() {
  const { theme, isBangla, t } = useThemeLanguage();

  // Navigation & Hierarchy State
  const [activeTab, setActiveTab] = useState<NavigationTab>("dashboard");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isAiAssistantModalOpen, setIsAiAssistantModalOpen] = useState(false);
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
  const [isResetOrgModalOpen, setIsResetOrgModalOpen] = useState(false);
  const [selectedIdCardEmployee, setSelectedIdCardEmployee] = useState<Employee | null>(null);
  const [faceEnrollTargetEmployee, setFaceEnrollTargetEmployee] = useState<Employee | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenFaceEnrollModal = (emp?: Employee) => {
    setFaceEnrollTargetEmployee(emp || currentEmployee);
  };

  // Core Data Collections
  const [company] = useState(mockCompany);
  const [branches, setBranches] = useState<Branch[]>(mockBranches);
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [designations, setDesignations] = useState<Designation[]>(mockDesignations);
  const [shifts, setShifts] = useState<Shift[]>(() => {
    try {
      const local = localStorage.getItem("wf_shifts");
      return local ? JSON.parse(local) : mockShifts;
    } catch {
      return mockShifts;
    }
  });
  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    try {
      const local = localStorage.getItem("wf_holidays");
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((h: Holiday) => ({
            ...h,
            name: (h.name || "").replace(/Apex Global/gi, "Muslim Welfare"),
            description: (h.description || "").replace(/Apex Global/gi, "Muslim Welfare"),
          }));
        }
      }
    } catch {
      // fallback
    }
    return mockHolidays.map((h: Holiday) => ({
      ...h,
      name: (h.name || "").replace(/Apex Global/gi, "Muslim Welfare"),
      description: (h.description || "").replace(/Apex Global/gi, "Muslim Welfare"),
    }));
  });
  const [orgWeekendDays, setOrgWeekendDays] = useState<number[]>(() => {
    try {
      const local = localStorage.getItem("wf_org_weekend_days");
      return local ? JSON.parse(local) : [5, 6]; // Friday & Saturday by default
    } catch {
      return [5, 6];
    }
  });
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>(mockAttendanceRecords);
  const [leaves, setLeaves] = useState<LeaveApplication[]>(mockLeaves);
  const [payslips, setPayslips] = useState<Payslip[]>(mockPayslips);
  const [loans, setLoans] = useState<EmployeeLoan[]>(mockLoans);
  const [jobs, setJobs] = useState<JobPosting[]>(mockJobPostings);
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [tasks, setTasks] = useState<ProjectTask[]>(mockTasks);
  const [assets, setAssets] = useState<CompanyAsset[]>(mockAssets);
  const [certificates, setCertificates] = useState<CertificateRecord[]>(mockCertificates);
  const [exitRecords, setExitRecords] = useState<ExitRecord[]>(() => {
    return mockExitRecords.filter(
      (r) => !["MWO1010", "MWO1011"].includes((r.employeeCode || "").toUpperCase().replace(/-/g, ""))
    );
  });
  const [notices, setNotices] = useState<Notice[]>(mockNotices);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [meetings, setMeetings] = useState<MeetingConference[]>(() => {
    try {
      const local = localStorage.getItem("wf_meetings_conferences");
      return local ? JSON.parse(local) : INITIAL_MEETINGS_CONFERENCES;
    } catch {
      return INITIAL_MEETINGS_CONFERENCES;
    }
  });
  const [rolePermissions, setRolePermissions] = useState<RolePermissionConfig[]>(() => {
    try {
      const local = localStorage.getItem("wf_role_permissions");
      if (local) {
        const parsed = JSON.parse(local);
        return parsed.filter((r: RolePermissionConfig) => r.role !== "DEPARTMENT_HEAD" && r.role !== "DEPT_HEAD");
      }
      return INITIAL_ROLE_PERMISSIONS;
    } catch {
      return INITIAL_ROLE_PERMISSIONS;
    }
  });
  const [payrollPolicy, setPayrollPolicy] = useState<PayrollPolicyConfig>(() => {
    try {
      const local = localStorage.getItem("wf_payroll_policy");
      if (local) {
        const parsed = JSON.parse(local);
        return {
          ...INITIAL_PAYROLL_POLICY,
          ...parsed,
          customBonuses: parsed.customBonuses?.length ? parsed.customBonuses : INITIAL_PAYROLL_POLICY.customBonuses,
        };
      }
      return INITIAL_PAYROLL_POLICY;
    } catch {
      return INITIAL_PAYROLL_POLICY;
    }
  });
  const [deletedEmployees, setDeletedEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem("wf_deleted_employees");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });
  const [treasuryAccounts, setTreasuryAccounts] = useState<TreasuryAccount[]>(() => {
    try {
      const local = localStorage.getItem("wf_treasury_accounts");
      return local ? JSON.parse(local) : INITIAL_TREASURY_ACCOUNTS;
    } catch {
      return INITIAL_TREASURY_ACCOUNTS;
    }
  });

  useEffect(() => {
    localStorage.setItem("wf_meetings_conferences", JSON.stringify(meetings));
  }, [meetings]);

  useEffect(() => {
    localStorage.setItem("wf_role_permissions", JSON.stringify(rolePermissions));
  }, [rolePermissions]);

  useEffect(() => {
    localStorage.setItem("wf_payroll_policy", JSON.stringify(payrollPolicy));
  }, [payrollPolicy]);

  useEffect(() => {
    localStorage.setItem("wf_deleted_employees", JSON.stringify(deletedEmployees));
  }, [deletedEmployees]);

  useEffect(() => {
    localStorage.setItem("wf_treasury_accounts", JSON.stringify(treasuryAccounts));
  }, [treasuryAccounts]);

  useEffect(() => {
    localStorage.setItem("wf_shifts", JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem("wf_holidays", JSON.stringify(holidays));
  }, [holidays]);

  useEffect(() => {
    localStorage.setItem("wf_org_weekend_days", JSON.stringify(orgWeekendDays));
  }, [orgWeekendDays]);

  // Active Logged-in Persona & Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem("workflow_hr_auth_status");
      return savedAuth === "true";
    } catch {
      return false;
    }
  });

  const [currentEmployee, setCurrentEmployee] = useState<Employee>(() => {
    try {
      const savedEmpId = localStorage.getItem("workflow_hr_logged_user_id");
      const targetEmp = (savedEmpId && mockEmployees.find((e) => e.id === savedEmpId)) || mockEmployees[0];
      const cachedAvatar = localStorage.getItem(`workflow_hr_cached_avatar_${targetEmp.id}`);
      const cachedScore = localStorage.getItem(`workflow_hr_cached_score_${targetEmp.id}`);
      const cachedVerified = localStorage.getItem(`workflow_hr_cached_verified_${targetEmp.id}`);
      const isVerified =
        targetEmp.id === "emp-01"
          ? true
          : Boolean(
              cachedVerified !== "false" &&
              targetEmp.faceVerified &&
              targetEmp.faceTemplateRegistered &&
              typeof targetEmp.faceVerificationScore === "number" &&
              targetEmp.faceVerificationScore > 0
            );
      const score = (typeof targetEmp.faceVerificationScore === "number" && targetEmp.faceVerificationScore > 0)
        ? targetEmp.faceVerificationScore
        : (cachedScore ? Number(cachedScore) : undefined);

      if (cachedAvatar) {
        return {
          ...targetEmp,
          avatarUrl: cachedAvatar,
          faceRegisteredPhoto: cachedAvatar,
          faceTemplateRegistered: isVerified,
          faceVerified: isVerified,
          faceVerificationRequired: !isVerified,
          faceVerificationScore: isVerified ? score : undefined,
        };
      }
      return {
        ...targetEmp,
        faceTemplateRegistered: isVerified,
        faceVerified: isVerified,
        faceVerificationRequired: !isVerified,
        faceVerificationScore: isVerified ? score : undefined,
      };
    } catch (e) {
      console.warn(e);
      return mockEmployees[0];
    }
  });

  // Realtime Firestore Database Subscriptions & Initialization
  useEffect(() => {
    // 1. Initialize Firestore collections if empty
    initializeFirestoreDatabase().catch((err) => {
      console.warn("Firestore database initialization notice:", err);
    });

    // 2. Realtime Subscriptions
    const unsubEmployees = subscribeToEmployees((updatedEmps) => {
      // Merge cached avatars for persistence across sessions
      const hydrated = updatedEmps.map((emp) => {
        try {
          const cached = localStorage.getItem(`workflow_hr_cached_avatar_${emp.id}`);
          const cachedScore = localStorage.getItem(`workflow_hr_cached_score_${emp.id}`);
          const cachedVerified = localStorage.getItem(`workflow_hr_cached_verified_${emp.id}`);
          const isVerified =
            emp.id === "emp-01"
              ? true
              : Boolean(
                  cachedVerified !== "false" &&
                  emp.faceVerified &&
                  emp.faceTemplateRegistered &&
                  typeof emp.faceVerificationScore === "number" &&
                  emp.faceVerificationScore > 0
                );
          const score =
            typeof emp.faceVerificationScore === "number" && emp.faceVerificationScore > 0
              ? emp.faceVerificationScore
              : cachedScore
              ? Number(cachedScore)
              : undefined;

          const isFixed = Boolean(emp.isFixedSalary || emp.isFixedContractSalary);
          const normalizedSalary =
            isFixed && emp.salary
              ? {
                  ...emp.salary,
                  basic: emp.salary.basic !== undefined ? emp.salary.basic : (emp.salary.grossSalary ?? 0),
                  grossSalary: emp.salary.basic !== undefined ? emp.salary.basic : (emp.salary.grossSalary ?? 0),
                  houseRent: 0,
                  medicalAllowance: 0,
                  transportAllowance: 0,
                  specialAllowance: 0,
                }
              : emp.salary;

          if (cached && (!emp.avatarUrl || emp.avatarUrl.includes("unsplash"))) {
            return {
              ...emp,
              salary: normalizedSalary,
              avatarUrl: cached,
              faceRegisteredPhoto: cached,
              faceTemplateRegistered: isVerified,
              faceVerified: isVerified,
              faceVerificationRequired: !isVerified,
              faceVerificationScore: isVerified ? score : undefined,
            };
          }
          return {
            ...emp,
            salary: normalizedSalary,
            faceTemplateRegistered: isVerified,
            faceVerified: isVerified,
            faceVerificationRequired: !isVerified,
            faceVerificationScore: isVerified ? score : undefined,
          };
        } catch (e) {
          // ignore
        }
        return emp;
      });

      setEmployees(hydrated);
      setCurrentEmployee((prev) => {
        const matching = hydrated.find((e) => e.id === prev.id);
        return matching || prev;
      });
    });

    const unsubAttendance = subscribeToAttendance((updatedAtt) => {
      setAttendanceLogs(updatedAtt);
    });

    const unsubLeaves = subscribeToLeaves((updatedLeaves) => {
      const demoNames = ["tariqul", "nafis imtiaz", "anika tabassum"];
      const cleaned = updatedLeaves.filter((l) => {
        const isDemo =
          demoNames.some((dn) => (l.employeeName || "").toLowerCase().includes(dn)) ||
          ["leave-01", "leave-02", "leave-03"].includes(l.id);
        if (isDemo) {
          deleteLeaveFromFirestore(l.id).catch(() => {});
          return false;
        }
        return true;
      });
      setLeaves(cleaned);
    });

    const unsubLoans = subscribeToLoans((updatedLoans) => {
      const cleaned = updatedLoans.filter((l) => {
        const isDemo =
          (l.employeeName || "").toLowerCase().includes("nafis imtiaz") ||
          ["loan-01"].includes(l.id);
        if (isDemo) {
          deleteLoanFromFirestore(l.id).catch(() => {});
          return false;
        }
        return true;
      });
      setLoans(cleaned);
    });

    const unsubBranches = subscribeToBranches((updatedBranches) => {
      setBranches(updatedBranches);
    });

    const unsubDepartments = subscribeToDepartments((updatedDepts) => {
      setDepartments(updatedDepts);
    });

    const unsubDesignations = subscribeToDesignations((updatedDesigs) => {
      setDesignations(updatedDesigs);
    });

    const unsubAudit = subscribeToAuditLogs((updatedLogs) => {
      setAuditLogs(updatedLogs);
    });

    const unsubJobs = subscribeToJobs((updatedJobs) => {
      setJobs(updatedJobs);
    });

    const unsubCandidates = subscribeToCandidates((updatedCandidates) => {
      setCandidates(updatedCandidates);
    });

    const unsubPayrollPolicy = subscribeToPayrollPolicy((updatedPolicy) => {
      setPayrollPolicy((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(updatedPolicy)) return prev;
        return {
          ...prev,
          ...updatedPolicy,
          customBonuses: updatedPolicy.customBonuses || prev.customBonuses || [],
        };
      });
    });

    const unsubDeletedEmployees = subscribeToDeletedEmployees((updatedDeleted) => {
      if (Array.isArray(updatedDeleted)) {
        setDeletedEmployees((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(updatedDeleted)) return prev;
          return updatedDeleted;
        });
      }
    });

    return () => {
      unsubEmployees();
      unsubAttendance();
      unsubLeaves();
      unsubLoans();
      unsubBranches();
      unsubDepartments();
      unsubDesignations();
      unsubAudit();
      unsubJobs();
      unsubCandidates();
      unsubPayrollPolicy();
      unsubDeletedEmployees();
    };
  }, []);

  const handleLoginSuccess = (emp: Employee) => {
    setCurrentEmployee(emp);
    setIsAuthenticated(true);
    try {
      localStorage.setItem("workflow_hr_auth_status", "true");
      localStorage.setItem("workflow_hr_logged_user_id", emp.id);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem("workflow_hr_auth_status");
      localStorage.removeItem("workflow_hr_logged_user_id");
    } catch (e) {
      console.warn(e);
    }
  };

  const handleOpenIdCardModal = (emp?: Employee) => {
    setSelectedIdCardEmployee(emp || currentEmployee);
    setIsIdCardModalOpen(true);
  };

  const handleOrganizationResetComplete = (options: {
    targetBranchId: string;
    resetDepartments: boolean;
    resetDesignations: boolean;
    newCompanyName?: string;
  }) => {
    if (options.targetBranchId === "ALL") {
      setEmployees((prev) => prev.filter((e) => e.id === currentEmployee.id));
      setAttendanceLogs((prev) => prev.filter((a) => a.employeeId === currentEmployee.id));
      setLeaves((prev) => prev.filter((l) => l.employeeId === currentEmployee.id));
      setLoans((prev) => prev.filter((ln) => ln.employeeId === currentEmployee.id));
      setPayslips((prev) => prev.filter((p) => p.employeeId === currentEmployee.id));
      setJobs([]);
      setCandidates([]);
    } else {
      setEmployees((prev) =>
        prev.filter((e) => e.branchId !== options.targetBranchId || e.id === currentEmployee.id)
      );
      setAttendanceLogs((prev) =>
        prev.filter((a) => {
          const emp = employees.find((e) => e.id === a.employeeId);
          return emp?.branchId !== options.targetBranchId || a.employeeId === currentEmployee.id;
        })
      );
      setLeaves((prev) =>
        prev.filter((l) => {
          const emp = employees.find((e) => e.id === l.employeeId);
          return emp?.branchId !== options.targetBranchId || l.employeeId === currentEmployee.id;
        })
      );
    }

    if (options.resetDepartments) {
      setDepartments((prev) => prev.slice(0, 1));
    }
    if (options.resetDesignations) {
      setDesignations((prev) => prev.slice(0, 1));
    }

    setToastMessage(
      isBangla
        ? "প্রতিষ্ঠানের সমস্ত পুরানো তথ্য ও রেকর্ড সফলভাবে রিসেট করা হয়েছে!"
        : "Organization data has been successfully reset!"
    );
    notifyAndLog(
      "ORGANIZATION_RESET",
      `Super Admin reset organizational data for ${
        options.targetBranchId === "ALL" ? "Entire Organization" : options.targetBranchId
      }`,
      "ADMIN"
    );
  };

  // Helper for audit trail & toast notification
  const notifyAndLog = (action: string, details: string, module: AuditLog["module"]) => {
    setToastMessage(details);
    setTimeout(() => setToastMessage(null), 4000);

    const log: AuditLog = {
      id: `audit-${Date.now()}`,
      actorId: currentEmployee.id,
      actorName: currentEmployee.fullName,
      actorRole: currentEmployee.role,
      module,
      action,
      details,
      timestamp: new Date().toLocaleTimeString() + ", " + new Date().toISOString().split("T")[0],
      ipAddress: "103.145.12.88",
      deviceInfo: "Chrome Browser / MacOS 14",
      status: "SUCCESS",
    };
    setAuditLogs((prev) => [log, ...prev]);
    saveAuditLogToFirestore(log);
  };

  // Handlers for Attendance & Biometrics
  const handleAttendanceSuccess = (record: AttendanceRecord) => {
    setAttendanceLogs((prev) => [record, ...prev]);
    saveAttendanceRecordToFirestore(record);
    notifyAndLog(
      "BIOMETRIC_CLOCK_IN",
      `Successfully clocked in with ${record.checkInFaceMatchScore}% face match at ${record.branchName}`,
      "ATTENDANCE"
    );
  };

  const handleUpdateFacePhoto = async (employeeId: string, photoUrl: string, verificationScore?: number) => {
    // 1. Immediately compress & downscale photo (<50KB) to ensure full Firestore limit compliance
    let optimized = photoUrl;
    try {
      optimized = await compressAndOptimizeImage(photoUrl, 480, 480, 0.85);
    } catch (err) {
      console.warn("Photo optimization notice:", err);
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const isLiveVerified = typeof verificationScore === "number" && verificationScore > 0;

    setEmployees((prev) =>
      prev.map((e) =>
        e.id === employeeId
          ? {
              ...e,
              faceRegisteredPhoto: optimized,
              avatarUrl: optimized,
              faceTemplateRegistered: isLiveVerified,
              faceVerified: isLiveVerified,
              faceVerificationRequired: !isLiveVerified,
              faceRegisteredAt: todayStr,
              faceVerifiedAt: isLiveVerified ? new Date().toISOString() : undefined,
              faceVerificationScore: isLiveVerified ? verificationScore : undefined,
            }
          : e
      )
    );

    if (currentEmployee.id === employeeId) {
      setCurrentEmployee((prev) => ({
        ...prev,
        faceRegisteredPhoto: optimized,
        avatarUrl: optimized,
        faceTemplateRegistered: isLiveVerified,
        faceVerified: isLiveVerified,
        faceVerificationRequired: !isLiveVerified,
        faceRegisteredAt: todayStr,
        faceVerifiedAt: isLiveVerified ? new Date().toISOString() : undefined,
        faceVerificationScore: isLiveVerified ? verificationScore : undefined,
      }));
    }

    if (selectedIdCardEmployee && selectedIdCardEmployee.id === employeeId) {
      setSelectedIdCardEmployee((prev) =>
        prev
          ? {
              ...prev,
              faceRegisteredPhoto: optimized,
              avatarUrl: optimized,
              faceTemplateRegistered: isLiveVerified,
              faceVerified: isLiveVerified,
              faceVerificationRequired: !isLiveVerified,
              faceRegisteredAt: todayStr,
              faceVerifiedAt: isLiveVerified ? new Date().toISOString() : undefined,
              faceVerificationScore: isLiveVerified ? verificationScore : undefined,
            }
          : null
      );
    }

    try {
      localStorage.setItem(`workflow_hr_cached_avatar_${employeeId}`, optimized);
      localStorage.setItem(`workflow_hr_cached_verified_${employeeId}`, isLiveVerified ? "true" : "false");
      if (isLiveVerified && verificationScore) {
        localStorage.setItem(`workflow_hr_cached_score_${employeeId}`, String(verificationScore));
      } else {
        localStorage.removeItem(`workflow_hr_cached_score_${employeeId}`);
      }
    } catch (e) {
      console.warn("Local storage update notice:", e);
    }

    // 2. Persist to Firestore cloud database & local fallback
    if (isLiveVerified) {
      const result = await updateEmployeeFacePhotoInFirestore(employeeId, optimized, verificationScore);
      if (result.success) {
        setToastMessage(`বায়োমেট্রিক ফেস সফলভাবে ভেরিফাই ও হালনাগাদ করা হয়েছে (${verificationScore}%)!`);
      } else {
        setToastMessage(`ছবিটি সংরক্ষিত হয়েছে (অফলাইন ভেরিফাইড ${verificationScore}%)`);
      }

      notifyAndLog(
        "বায়োমেট্রিক ফেস ভেরিফিকেশন সফল",
        `Employee ${employeeId} face photo updated & biometric verified with score ${verificationScore}%`,
        "ATTENDANCE"
      );
    } else {
      const result = await updateEmployeePhotoPendingVerificationInFirestore(employeeId, optimized);
      setToastMessage(
        "নতুন ছবি যুক্ত হয়েছে! কিন্তু লাইভ ফেস ভেরিফিকেশন অপেক্ষমান। হাজিরা দিতে ক্যামেরা দিয়ে ভেরিফাই করুন।"
      );

      notifyAndLog(
        "নতুন ছবি আপলোড (ভেরিফিকেশন অপেক্ষমান)",
        `Employee ${employeeId} uploaded a new face photo. Biometric live verification is required.`,
        "ATTENDANCE"
      );
    }
  };

  // Handlers for Leaves
  const handleApplyLeave = (leave: Partial<LeaveApplication>) => {
    const fullLeave: LeaveApplication = {
      id: `leave-${Date.now()}`,
      employeeId: leave.employeeId || currentEmployee.id,
      employeeCode: leave.employeeCode || currentEmployee.employeeCode,
      employeeName: leave.employeeName || currentEmployee.fullName,
      avatarUrl: leave.avatarUrl || currentEmployee.avatarUrl,
      branchId: leave.branchId || currentEmployee.branchId,
      branchName: leave.branchName || currentEmployee.branchName,
      departmentName: leave.departmentName || currentEmployee.departmentName,
      leaveType: leave.leaveType || "CASUAL",
      startDate: leave.startDate || "2026-09-01",
      endDate: leave.endDate || "2026-09-02",
      totalDays: leave.totalDays || 2,
      reason: leave.reason || "Leave request",
      status: "PENDING",
      appliedDate: new Date().toISOString().split("T")[0],
    };
    setLeaves((prev) => [fullLeave, ...prev]);
    saveLeaveApplicationToFirestore(fullLeave);
    notifyAndLog(
      "LEAVE_APPLICATION",
      `Applied for ${fullLeave.totalDays} day(s) ${fullLeave.leaveType} leave`,
      "LEAVES"
    );
  };

  const handleApproveLeave = (leaveId: string, comments?: string) => {
    setLeaves((prev) =>
      prev.map((l) =>
        l.id === leaveId
          ? {
              ...l,
              status: "APPROVED",
              reviewedBy: currentEmployee.fullName,
              reviewedAt: new Date().toISOString().split("T")[0],
              reviewerComments: comments || "Approved by HR management",
            }
          : l
      )
    );
    updateLeaveStatusInFirestore(leaveId, "APPROVED", currentEmployee.fullName, comments);
    notifyAndLog("LEAVE_APPROVAL", "Leave application approved", "LEAVES");
  };

  const handleRejectLeave = (leaveId: string, comments?: string) => {
    setLeaves((prev) =>
      prev.map((l) =>
        l.id === leaveId
          ? {
              ...l,
              status: "REJECTED",
              reviewedBy: currentEmployee.fullName,
              reviewedAt: new Date().toISOString().split("T")[0],
              reviewerComments: comments || "Declined",
            }
          : l
      )
    );
    updateLeaveStatusInFirestore(leaveId, "REJECTED", currentEmployee.fullName, comments);
    notifyAndLog("LEAVE_REJECTION", "Leave application declined", "LEAVES");
  };

  const handleCreateLeaveByAdmin = (newLeave: LeaveApplication) => {
    setLeaves((prev) => [newLeave, ...prev]);
    saveLeaveApplicationToFirestore(newLeave);
    notifyAndLog(
      "LEAVE_ASSIGNED",
      `Assigned ${newLeave.totalDays} day(s) leave for ${newLeave.employeeName}`,
      "LEAVES"
    );
  };

  const handleUpdateLeave = (updatedLeave: LeaveApplication) => {
    setLeaves((prev) =>
      prev.map((l) => (l.id === updatedLeave.id ? updatedLeave : l))
    );
    saveLeaveApplicationToFirestore(updatedLeave);
    notifyAndLog("LEAVE_UPDATED", `Updated leave record for ${updatedLeave.employeeName}`, "LEAVES");
  };

  const handleDeleteLeave = (leaveId: string) => {
    setLeaves((prev) => prev.filter((l) => l.id !== leaveId));
    deleteLeaveFromFirestore(leaveId);
    notifyAndLog("LEAVE_DELETED", "Leave application deleted", "LEAVES");
  };

  // Handlers for Payroll
  const handleGeneratePayroll = (month: string) => {
    const activeStaff = employees.filter((e) => e.status !== "EXITED" && !e.deletedAt);
    const newSlips = calculateMonthlyPayroll(
      month,
      activeStaff,
      attendanceLogs,
      loans,
      payrollPolicy.customBonuses || [],
      payrollPolicy
    );
    const monthKey = normalizeMonthKey(month);
    setPayslips((prev) => [
      ...newSlips,
      ...prev.filter((p) => normalizeMonthKey(p.payrollMonth) !== monthKey),
    ]);
    savePayslipsToFirestore(newSlips);
    setToastMessage(`${month}-এর পে-রোল সফলভাবে রান ও জেনারেট হয়েছে`);
    notifyAndLog(
      "PAYROLL_CALCULATION",
      `Generated ${month} automated payroll with policies & bonuses for ${activeStaff.length} active employees`,
      "PAYROLL"
    );
  };

  const handleApprovePayslip = (slipId: string) => {
    setPayslips((prev) =>
      prev.map((p) =>
        p.id === slipId ? { ...p, paymentStatus: "APPROVED" } : p
      )
    );
    setToastMessage("পে-স্লিপ সফলভাবে অনুমোদিত (Approved) হয়েছে");
    notifyAndLog("PAYSLIP_APPROVED", `Approved payslip ${slipId}`, "PAYROLL");
  };

  const handleDisbursePayslip = (slipId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const ref = `FT-${today.replace(/-/g, "")}-DISB-${Math.floor(10000 + Math.random() * 90000)}`;
    setPayslips((prev) =>
      prev.map((p) =>
        p.id === slipId
          ? {
              ...p,
              paymentStatus: "PAID",
              paymentDate: today,
              transactionReference: p.transactionReference || ref,
            }
          : p
      )
    );
    setToastMessage("স্যালারি সফলভাবে পরিশোধ (Paid / Disbursed) করা হয়েছে");
    notifyAndLog("PAYSLIP_PAID", `Paid salary for payslip ${slipId}`, "PAYROLL");
  };

  const handleApproveAllPayroll = (month: string) => {
    const targetKey = normalizeMonthKey(month);
    setPayslips((prev) =>
      prev.map((p) =>
        targetKey === "ALL" || normalizeMonthKey(p.payrollMonth) === targetKey
          ? { ...p, paymentStatus: "APPROVED" }
          : p
      )
    );
    setToastMessage(`${month}-এর সকল পে-স্লিপ সফলভাবে অনুমোদিত হয়েছে`);
    notifyAndLog("PAYROLL_APPROVED_ALL", `Approved all payroll records for ${month}`, "PAYROLL");
  };

  const handleDisburseAll = (month: string) => {
    const today = new Date().toISOString().split("T")[0];
    const targetKey = normalizeMonthKey(month);
    setPayslips((prev) =>
      prev.map((p) =>
        targetKey === "ALL" || normalizeMonthKey(p.payrollMonth) === targetKey
          ? {
              ...p,
              paymentStatus: "PAID",
              paymentDate: today,
              transactionReference:
                p.transactionReference ||
                `FT-${today.replace(/-/g, "")}-BATCH-${Math.floor(10000 + Math.random() * 90000)}`,
            }
          : p
      )
    );
    setToastMessage(`${month}-এর সকল স্যালারি পরিশোধ সম্পন্ন হয়েছে`);
    notifyAndLog(
      "PAYROLL_DISBURSEMENT",
      `Disbursed all salaries for ${month} via automated bank advice transfer`,
      "PAYROLL"
    );
  };

  const handleUpdatePayslip = (updatedSlip: Payslip) => {
    setPayslips((prev) =>
      prev.map((p) => (p.id === updatedSlip.id ? updatedSlip : p))
    );
    setToastMessage("পে-স্লিপ তথ্য সফলভাবে আপডেট হয়েছে");
  };

  // Handlers for Loans
  const handleAddLoan = (loan: EmployeeLoan) => {
    setLoans((prev) => [loan, ...prev]);
    saveLoanToFirestore(loan);
    notifyAndLog(
      "LOAN_APPLICATION",
      `Loan request of ৳${(loan.amount ?? 0).toLocaleString()} submitted`,
      "FINANCE"
    );
  };

  const handleApproveLoan = (loanId: string) => {
    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, status: "ACTIVE" } : l))
    );
    updateLoanStatusInFirestore(loanId, "ACTIVE");
    notifyAndLog("LOAN_APPROVAL", "Employee loan advance approved", "FINANCE");
  };

  const handleRejectLoan = (loanId: string) => {
    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, status: "REJECTED" } : l))
    );
    updateLoanStatusInFirestore(loanId, "REJECTED");
    notifyAndLog("LOAN_REJECTION", "Employee loan request rejected", "FINANCE");
  };

  const handleUpdateLoan = (updatedLoan: EmployeeLoan) => {
    setLoans((prev) =>
      prev.map((l) => (l.id === updatedLoan.id ? updatedLoan : l))
    );
    saveLoanToFirestore(updatedLoan);
    notifyAndLog(
      "LOAN_UPDATED",
      `Updated loan/advance record of ৳${(updatedLoan.amount ?? 0).toLocaleString()} for ${updatedLoan.employeeName}`,
      "FINANCE"
    );
  };

  const handleDeleteLoan = (loanId: string) => {
    setLoans((prev) => prev.filter((l) => l.id !== loanId));
    deleteLoanFromFirestore(loanId);
    notifyAndLog("LOAN_DELETED", "Loan/advance record deleted", "FINANCE");
  };

  const handleRepayLoan = (loanId: string, returnAmount: number, notes?: string) => {
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id === loanId) {
          const currentRem = l.remainingAmount !== undefined ? l.remainingAmount : l.amount;
          const newRemaining = Math.max(0, currentRem - returnAmount);
          const isClosed = newRemaining === 0;
          const updated: EmployeeLoan = {
            ...l,
            remainingAmount: newRemaining,
            paidInstallments: (l.paidInstallments || 0) + 1,
            status: isClosed ? "CLOSED" : l.status,
            notes: notes ? (l.notes ? `${l.notes} | ${notes}` : notes) : l.notes,
            returnDate: isClosed ? new Date().toISOString().split("T")[0] : l.returnDate,
          };
          saveLoanToFirestore(updated);
          return updated;
        }
        return l;
      })
    );
    notifyAndLog(
      "LOAN_REPAID",
      `Recorded return/repayment of ৳${returnAmount.toLocaleString()}`,
      "FINANCE"
    );
  };

  // Handlers for Recruitment
  const handleAddJob = (job: JobPosting) => {
    setJobs((prev) => [job, ...prev]);
    saveJobToFirestore(job);
    notifyAndLog("JOB_POSTED", `Published job circular: ${job.title}`, "RECRUITMENT");
  };

  const handleDeleteJob = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    deleteJobFromFirestore(jobId);
    notifyAndLog("JOB_DELETED", `Removed job circular`, "RECRUITMENT");
  };

  const handleUpdateCandidateStage = (candidateId: string, stage: Candidate["stage"]) => {
    const target = candidates.find((c) => c.id === candidateId);
    if (target) {
      saveCandidateToFirestore({ ...target, stage });
    }
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, stage } : c))
    );
    notifyAndLog(
      "ATS_STAGE_UPDATE",
      `Candidate moved to pipeline stage: ${stage}`,
      "RECRUITMENT"
    );
  };

  const handleAddCandidates = (newCandidates: Candidate[]) => {
    setCandidates((prev) => [...newCandidates, ...prev]);
    saveBulkCandidatesToFirestore(newCandidates);
    notifyAndLog(
      "CANDIDATES_IMPORTED",
      `Imported ${newCandidates.length} candidate CV profiles from spreadsheet`,
      "RECRUITMENT"
    );
  };

  const handleBulkUpdateCandidates = (updatedList: Candidate[]) => {
    setCandidates((prev) => {
      const updatedMap = new Map(updatedList.map((c) => [c.id, c]));
      return prev.map((c) => updatedMap.get(c.id) || c);
    });
    saveBulkCandidatesToFirestore(updatedList);
    notifyAndLog(
      "CANDIDATES_SCREENED",
      `Automated multi-criteria screening updated for ${updatedList.length} candidates`,
      "RECRUITMENT"
    );
  };

  const handleDeleteCandidate = (candId: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== candId));
    deleteCandidateFromFirestore(candId);
    notifyAndLog("CANDIDATE_REMOVED", `Removed candidate application record`, "RECRUITMENT");
  };

  // Handlers for Projects & Tasks
  const handleAddTask = (task: ProjectTask) => {
    setTasks((prev) => [task, ...prev]);
    notifyAndLog("TASK_CREATED", `Created deliverable: ${task.title}`, "PROJECTS");
  };

  const handleUpdateTaskStatus = (taskId: string, status: ProjectTask["status"]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
  };

  // Handlers for Exit Clearance
  const handleAddExit = (rec: ExitRecord) => {
    setExitRecords((prev) => [rec, ...prev]);
    notifyAndLog(
      "EXIT_INITIATED",
      `Resignation initiated for ${rec.employeeName}`,
      "HR_OPERATIONS"
    );
  };

  const handleUpdateClearance = (
    exitId: string,
    dept: "itClearance" | "accountsClearance" | "adminClearance" | "hrClearance"
  ) => {
    setExitRecords((prev) =>
      prev.map((r) => {
        if (r.id === exitId) {
          const currentClearances = r.clearanceStatus || {
            itClearance: false,
            accountsClearance: false,
            adminClearance: false,
            hrClearance: false,
          };
          const updated = {
            ...currentClearances,
            [dept]: !currentClearances[dept],
          };
          return { ...r, clearanceStatus: updated };
        }
        return r;
      })
    );
    notifyAndLog("CLEARANCE_CHECK", `Updated departmental handover status`, "HR_OPERATIONS");
  };

  // Count pending items for notifications
  const pendingLeavesCount = leaves.filter((l) => l.status === "PENDING").length;

  // If user is not logged in, render the Login View
  if (!isAuthenticated) {
    return (
      <div className={theme === "dark" ? "dark" : ""}>
        <LoginView
          employees={employees}
          onLoginSuccess={handleLoginSuccess}
          onOpenAttendance={() => setIsAttendanceModalOpen(true)}
        />

        {/* Live Anti-Spoofing & Geofencing Biometric Attendance Camera Modal accessible directly from Login */}
        {isAttendanceModalOpen && (
          <SmartAttendanceModal
            isOpen={isAttendanceModalOpen}
            onClose={() => setIsAttendanceModalOpen(false)}
            isLoggedIn={false}
            currentEmployee={null}
            allEmployees={employees}
            employees={employees}
            selectedBranch={
              branches.find((b) => b.id === selectedBranchId) ||
              branches[0]
            }
            allBranches={branches}
            branches={branches}
            onAttendanceSuccess={handleAttendanceSuccess}
            onUpdateFacePhoto={handleUpdateFacePhoto}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen ${
        theme === "dark" ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      } font-sans overflow-hidden transition-colors`}
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-75"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab as any}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        userRole={currentEmployee.role}
        currentEmployee={currentEmployee}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenOrganizationReset={() => setIsResetOrgModalOpen(true)}
      />

      {/* Main Content View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          currentEmployee={currentEmployee}
          setCurrentEmployee={setCurrentEmployee}
          allEmployees={employees}
          branches={branches}
          selectedBranchId={selectedBranchId}
          setSelectedBranchId={setSelectedBranchId}
          onOpenAttendanceModal={() => setIsAttendanceModalOpen(true)}
          onOpenAiAssistant={() => setIsAiAssistantModalOpen(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          pendingLeavesCount={pendingLeavesCount}
          onLogout={handleLogout}
          onOpenDigitalIdCard={handleOpenIdCardModal}
          onOpenFaceEnrollModal={handleOpenFaceEnrollModal}
          onOpenOrganizationReset={() => setIsResetOrgModalOpen(true)}
          onUpdateEmployee={(updatedEmp) => {
            setEmployees((prev) =>
              prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e))
            );
            if (currentEmployee.id === updatedEmp.id) {
              setCurrentEmployee(updatedEmp);
            }
            saveEmployeeToFirestore(updatedEmp);
            try {
              localStorage.setItem("workflow_hr_current_user", JSON.stringify(updatedEmp));
            } catch (e) {
              console.warn(e);
            }
            setToastMessage("আপনার লগইন তথ্য ও পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে!");
            notifyAndLog(
              "CREDENTIALS_UPDATED",
              `Credentials updated for ${updatedEmp.fullName} (${updatedEmp.employeeCode})`,
              "SECURITY"
            );
          }}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-40 sm:pb-44 lg:pb-12 space-y-4 sm:space-y-6">
          {/* Global Face Verification Notice Banner if Current User Face is unverified */}
          {!currentEmployee.faceVerified && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15 border border-amber-500/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 text-base">
                  ⚠️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      ছবির বায়োমেট্রিক ফেস ভেরিফিকেশন প্রয়োজন
                    </h4>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/25 text-amber-800 dark:text-amber-200">
                      অপেক্ষমান
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    আপনার প্রোফাইল ছবির সাথে লাইভ ক্যামেরা চেহারা যাচাই করা হয়নি। স্মার্ট উপস্থিতি নিশ্চিত করতে এখনই লাইভ ভেরিফাই সম্পন্ন করুন।
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenFaceEnrollModal(currentEmployee)}
                className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shrink-0 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>ক্যামেরা দিয়ে ভেরিফাই করুন</span>
              </button>
            </div>
          )}
          {/* View Router */}
          {activeTab === "dashboard" && (
            <DashboardView
              currentEmployee={currentEmployee}
              employees={employees}
              allEmployees={employees}
              attendanceLogs={attendanceLogs}
              branches={branches}
              allBranches={branches}
              payslips={payslips}
              leaves={leaves}
              leaveApplications={leaves}
              projects={projects}
              selectedBranchId={selectedBranchId}
              onOpenAttendanceModal={() => setIsAttendanceModalOpen(true)}
              onOpenAiAssistant={() => setIsAiAssistantModalOpen(true)}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {(activeTab === "self-service" || activeTab === "my-portal") && (
            <EmployeeSelfServiceView
              currentEmployee={currentEmployee}
              myAttendance={attendanceLogs.filter(
                (a) => a.employeeId === currentEmployee.id
              )}
              myPayslips={payslips.filter(
                (p) => p.employeeId === currentEmployee.id
              )}
              myLeaves={leaves.filter(
                (l) => l.employeeId === currentEmployee.id
              )}
              myLoans={loans.filter((l) => l.employeeId === currentEmployee.id)}
              myAssets={assets.filter(
                (ast) => ast.assignedToEmployeeId === currentEmployee.id
              )}
              myCertificates={certificates.filter(
                (c) => c.employeeId === currentEmployee.id
              )}
              onOpenAttendanceModal={() => setIsAttendanceModalOpen(true)}
              onApplyLeave={handleApplyLeave}
              onApplyLoan={handleAddLoan}
              onViewPayslip={() => {
                setActiveTab("payroll");
              }}
              onUpdateFacePhoto={handleUpdateFacePhoto}
              onOpenDigitalIdCard={() => handleOpenIdCardModal(currentEmployee)}
              onUpdateEmployee={(updatedEmp) => {
                setEmployees((prev) =>
                  prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e))
                );
                if (currentEmployee.id === updatedEmp.id) {
                  setCurrentEmployee(updatedEmp);
                }
                saveEmployeeToFirestore(updatedEmp);
                setToastMessage("আপনার প্রোফাইল ও পদবী সফলভাবে হালনাগাদ করা হয়েছে!");
                notifyAndLog(
                  "PROFILE_UPDATED",
                  `Profile updated: ${updatedEmp.fullName} (${updatedEmp.designationTitle})`,
                  "EMPLOYEES"
                );
              }}
            />
          )}

          {activeTab === "employees" && (
            <EmployeesDirectoryView
              employees={employees}
              branches={branches}
              departments={departments}
              designations={designations}
              shifts={shifts}
              currentUser={currentEmployee}
              rolePermissions={rolePermissions}
              exitRecords={exitRecords}
              onAddEmployee={(newEmp) => {
                setEmployees((prev) => [newEmp, ...prev]);
                saveEmployeeToFirestore(newEmp);
                notifyAndLog(
                  "EMPLOYEE_ENROLLMENT",
                  `Enrolled new staff member: ${newEmp.fullName} (${newEmp.employeeCode})`,
                  "EMPLOYEES"
                );
              }}
              onUpdateEmployee={(updatedEmp) => {
                setEmployees((prev) =>
                  prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e))
                );
                if (currentEmployee.id === updatedEmp.id) {
                  setCurrentEmployee(updatedEmp);
                }
                saveEmployeeToFirestore(updatedEmp);
              }}
              onOpenDigitalIdCard={handleOpenIdCardModal}
              deletedEmployees={deletedEmployees}
              onRestoreEmployee={(empId) => {
                const target = deletedEmployees.find((e) => e.id === empId);
                if (!target) return;
                const restoredEmp: Employee = {
                  ...target,
                  status: "ACTIVE",
                  isExited: false,
                  deletedAt: undefined,
                  deletedBy: undefined,
                };
                const updatedDeleted = deletedEmployees.filter((e) => e.id !== empId);
                setDeletedEmployees(updatedDeleted);
                saveDeletedEmployeesToFirestore(updatedDeleted);
                setEmployees((prev) => [restoredEmp, ...prev]);
                saveEmployeeToFirestore(restoredEmp);
                setToastMessage(`কর্মী ${restoredEmp.fullName} সফলভাবে সক্রিয় ডিরেক্টরিতে ফিরিয়ে আনা হয়েছে`);
                notifyAndLog(
                  "EMPLOYEE_RESTORED",
                  `Restored employee: ${restoredEmp.fullName} (${restoredEmp.employeeCode})`,
                  "EMPLOYEES"
                );
              }}
              onPermanentDeleteEmployee={(empId) => {
                const target = deletedEmployees.find((e) => e.id === empId);
                const updatedDeleted = deletedEmployees.filter((e) => e.id !== empId);
                setDeletedEmployees(updatedDeleted);
                saveDeletedEmployeesToFirestore(updatedDeleted);
                deleteEmployeeFromFirestore(empId);
                setToastMessage(`কর্মী ${target?.fullName || empId} স্থায়ীভাবে মুছে ফেলা হয়েছে`);
                notifyAndLog(
                  "EMPLOYEE_PERMANENTLY_PURGED",
                  `Permanently deleted employee: ${target?.fullName || empId}`,
                  "EMPLOYEES"
                );
              }}
              onDeleteEmployee={(empId) => {
                const target = employees.find((e) => e.id === empId);
                if (!target) return;
                const archivedEmp: Employee = {
                  ...target,
                  status: "EXITED",
                  isExited: true,
                  exitDate: target.exitDate || new Date().toISOString().split("T")[0],
                  deletedAt: new Date().toISOString(),
                  deletedBy: currentEmployee.fullName,
                };
                // Remove from active list and add to recycle bin
                const updatedDeleted = [archivedEmp, ...deletedEmployees.filter((d) => d.id !== empId)];
                setEmployees((prev) => prev.filter((e) => e.id !== empId));
                setDeletedEmployees(updatedDeleted);
                saveDeletedEmployeesToFirestore(updatedDeleted);
                // Clean up orphan exit records, attendance records, leaves & loans for deleted employee
                setExitRecords((prev) => prev.filter((r) => r.employeeId !== empId));
                setAttendanceLogs((prev) => prev.filter((a) => a.employeeId !== empId));
                setLeaves((prev) => prev.filter((l) => l.employeeId !== empId));
                setLoans((prev) => prev.filter((ln) => ln.employeeId !== empId));
                deleteEmployeeFromFirestore(empId);
                setToastMessage(`কর্মী ${target.fullName} ডিলিট করা হয়েছে (রিসাইকেল বিন বা এডিট লগ থেকে রিস্টোর করতে পারবেন)`);
                notifyAndLog(
                  "EMPLOYEE_DELETED",
                  `Deleted staff record moved to recycle bin: ${target.fullName} (${target.employeeCode})`,
                  "EMPLOYEES"
                );
              }}
              onAddDepartment={(newDept) => {
                setDepartments((prev) => [newDept, ...prev]);
                saveDepartmentToFirestore(newDept);
                notifyAndLog(
                  "DEPARTMENT_CREATED",
                  `Created department: ${newDept.name}`,
                  "HR_OPERATIONS"
                );
              }}
              onUpdateDepartment={(updatedDept) => {
                setDepartments((prev) =>
                  prev.map((d) => (d.id === updatedDept.id ? updatedDept : d))
                );
                saveDepartmentToFirestore(updatedDept);
                notifyAndLog(
                  "DEPARTMENT_UPDATED",
                  `Updated department: ${updatedDept.name}`,
                  "HR_OPERATIONS"
                );
              }}
              onDeleteDepartment={(deptId) => {
                const target = departments.find((d) => d.id === deptId);
                setDepartments((prev) => prev.filter((d) => d.id !== deptId));
                deleteDepartmentFromFirestore(deptId);
                setToastMessage(`ডিপার্টমেন্ট ${target?.name || ""} মুছে ফেলা হয়েছে`);
                notifyAndLog(
                  "DEPARTMENT_DELETED",
                  `Deleted department: ${target?.name || deptId}`,
                  "HR_OPERATIONS"
                );
              }}
              onAddDesignation={(newDesig) => {
                setDesignations((prev) => [newDesig, ...prev]);
                saveDesignationToFirestore(newDesig);
                notifyAndLog(
                  "DESIGNATION_CREATED",
                  `Created designation: ${newDesig.title}`,
                  "HR_OPERATIONS"
                );
              }}
              onUpdateDesignation={(updatedDesig) => {
                setDesignations((prev) =>
                  prev.map((d) => (d.id === updatedDesig.id ? updatedDesig : d))
                );
                saveDesignationToFirestore(updatedDesig);
                notifyAndLog(
                  "DESIGNATION_UPDATED",
                  `Updated designation: ${updatedDesig.title}`,
                  "HR_OPERATIONS"
                );
              }}
              onDeleteDesignation={(desigId) => {
                const target = designations.find((d) => d.id === desigId);
                setDesignations((prev) => prev.filter((d) => d.id !== desigId));
                deleteDesignationFromFirestore(desigId);
                setToastMessage(`পদবি ${target?.title || ""} মুছে ফেলা হয়েছে`);
                notifyAndLog(
                  "DESIGNATION_DELETED",
                  `Deleted designation: ${target?.title || desigId}`,
                  "HR_OPERATIONS"
                );
              }}
            />
          )}

          {activeTab === "departments-designations" && (
            <DepartmentsDesignationsView
              departments={departments}
              designations={designations}
              employees={employees}
              treasuryAccounts={treasuryAccounts}
              onUpdateTreasuryAccounts={setTreasuryAccounts}
              onAddDepartment={(newDept) => {
                setDepartments((prev) => [newDept, ...prev]);
                saveDepartmentToFirestore(newDept);
                notifyAndLog(
                  "DEPARTMENT_CREATED",
                  `Created department: ${newDept.name}`,
                  "HR_OPERATIONS"
                );
              }}
              onUpdateDepartment={(updatedDept) => {
                setDepartments((prev) =>
                  prev.map((d) => (d.id === updatedDept.id ? updatedDept : d))
                );
                saveDepartmentToFirestore(updatedDept);
                notifyAndLog(
                  "DEPARTMENT_UPDATED",
                  `Updated department: ${updatedDept.name}`,
                  "HR_OPERATIONS"
                );
              }}
              onDeleteDepartment={(deptId) => {
                const target = departments.find((d) => d.id === deptId);
                setDepartments((prev) => prev.filter((d) => d.id !== deptId));
                deleteDepartmentFromFirestore(deptId);
                setToastMessage(`ডিপার্টমেন্ট ${target?.name || ""} মুছে ফেলা হয়েছে`);
                notifyAndLog(
                  "DEPARTMENT_DELETED",
                  `Deleted department: ${target?.name || deptId}`,
                  "HR_OPERATIONS"
                );
              }}
              onAddDesignation={(newDesig) => {
                setDesignations((prev) => [newDesig, ...prev]);
                saveDesignationToFirestore(newDesig);
                notifyAndLog(
                  "DESIGNATION_CREATED",
                  `Created designation: ${newDesig.title}`,
                  "HR_OPERATIONS"
                );
              }}
              onUpdateDesignation={(updatedDesig) => {
                setDesignations((prev) =>
                  prev.map((d) => (d.id === updatedDesig.id ? updatedDesig : d))
                );
                saveDesignationToFirestore(updatedDesig);
                notifyAndLog(
                  "DESIGNATION_UPDATED",
                  `Updated designation: ${updatedDesig.title}`,
                  "HR_OPERATIONS"
                );
              }}
              onDeleteDesignation={(desigId) => {
                const target = designations.find((d) => d.id === desigId);
                setDesignations((prev) => prev.filter((d) => d.id !== desigId));
                deleteDesignationFromFirestore(desigId);
                setToastMessage(`পদবি ${target?.title || ""} মুছে ফেলা হয়েছে`);
                notifyAndLog(
                  "DESIGNATION_DELETED",
                  `Deleted designation: ${target?.title || desigId}`,
                  "HR_OPERATIONS"
                );
              }}
              onViewEmployee={(emp) => {
                setActiveTab("employees");
              }}
              onEditEmployee={(emp) => {
                setActiveTab("employees");
              }}
              onUpdateEmployee={(updatedEmp) => {
                setEmployees((prev) =>
                  prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e))
                );
                if (currentEmployee.id === updatedEmp.id) {
                  setCurrentEmployee(updatedEmp);
                }
                saveEmployeeToFirestore(updatedEmp);
              }}
            />
          )}

          {(activeTab === "branches" || activeTab === "branches-geofence") && (
            <BranchesGeofenceView
              branches={branches}
              allEmployees={employees}
              departments={departments}
              onViewEmployee={(emp) => {
                setActiveTab("employees");
              }}
              onDeleteBranch={(bId) => {
                const target = branches.find((b) => b.id === bId);
                setBranches((prev) => prev.filter((b) => b.id !== bId));
                deleteBranchFromFirestore(bId);
                setToastMessage(`ব্রাঞ্চ ${target?.name || ""} মুছে ফেলা হয়েছে`);
                notifyAndLog("BRANCH_DELETED", `Deleted regional branch: ${target?.name || bId}`, "HR_OPERATIONS");
              }}
              onAddBranch={(newBranch) => {
                setBranches((prev) => [newBranch, ...prev]);
                saveBranchToFirestore(newBranch);
                notifyAndLog(
                  "BRANCH_CREATED",
                  `Configured new regional branch: ${newBranch.name}`,
                  "HR_OPERATIONS"
                );
              }}
              onUpdateBranch={(updated) => {
                setBranches((prev) =>
                  prev.map((b) => (b.id === updated.id ? updated : b))
                );
                saveBranchToFirestore(updated);
                notifyAndLog(
                  "BRANCH_UPDATED",
                  `Updated branch details & geofence for ${updated.name}`,
                  "HR_OPERATIONS"
                );
              }}
            />
          )}

          {(activeTab === "ngo-programs-training" || (activeTab as string) === "ngo-programs") && (
            <NgoProgramsTrainingView
              employees={employees}
              branches={branches}
              currentUser={currentEmployee}
              onViewEmployee={(emp) => {
                setActiveTab("employees");
              }}
              onEditEmployee={(emp) => {
                setActiveTab("employees");
              }}
            />
          )}

          {activeTab === "meetings-conferences" && (
            <MeetingsConferencesView
              meetings={meetings}
              employees={employees}
              departments={departments}
              branches={branches}
              onAddMeeting={(newMeeting) => {
                setMeetings((prev) => [newMeeting, ...prev]);
                notifyAndLog(
                  "MEETING_CREATED",
                  `Configured conference/event: ${newMeeting.title}`,
                  "GENERAL"
                );
              }}
              onUpdateMeeting={(updatedMeeting) => {
                setMeetings((prev) =>
                  prev.map((m) => (m.id === updatedMeeting.id ? updatedMeeting : m))
                );
                notifyAndLog(
                  "MEETING_UPDATED",
                  `Updated conference schedule: ${updatedMeeting.title}`,
                  "GENERAL"
                );
              }}
              onDeleteMeeting={(mId) => {
                const target = meetings.find((m) => m.id === mId);
                setMeetings((prev) => prev.filter((m) => m.id !== mId));
                setToastMessage(`প্রোগ্রাম ${target?.title || ""} মুছে ফেলা হয়েছে`);
                notifyAndLog("MEETING_DELETED", `Deleted event schedule`, "GENERAL");
              }}
            />
          )}

          {activeTab === "face-recognition-kiosk" && (
            <RealtimeFaceRecognitionView
              employees={employees}
              branches={branches}
              attendanceLogs={attendanceLogs}
              currentEmployee={currentEmployee}
              onLogAttendance={handleAttendanceSuccess}
              onOpenEnrollmentModal={handleOpenFaceEnrollModal}
            />
          )}

          {activeTab === "attendance-logs" && (
            <AttendanceLogsView
              attendanceLogs={attendanceLogs}
              branches={branches}
              employees={employees}
              onOpenAttendanceModal={() => setIsAttendanceModalOpen(true)}
            />
          )}

          {activeTab === "shifts-holidays" && (
            <ShiftsHolidaysView
              shifts={shifts}
              holidays={holidays}
              branches={branches}
              weekendDays={orgWeekendDays}
              onUpdateWeekendDays={(days) => {
                setOrgWeekendDays(days);
                notifyAndLog("WEEKEND_RULES_UPDATED", `Updated company weekend rules`, "HR_OPERATIONS");
              }}
              onAddShift={(s) => {
                setShifts((prev) => [s, ...prev]);
                notifyAndLog("SHIFT_CREATED", `Added shift roster: ${s.name}`, "HR_OPERATIONS");
              }}
              onUpdateShift={(updated) => {
                setShifts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
                notifyAndLog("SHIFT_UPDATED", `Updated shift roster: ${updated.name}`, "HR_OPERATIONS");
              }}
              onDeleteShift={(shiftId) => {
                setShifts((prev) => prev.filter((s) => s.id !== shiftId));
                notifyAndLog("SHIFT_DELETED", `Deleted shift roster`, "HR_OPERATIONS");
              }}
              onAddHoliday={(h) => {
                setHolidays((prev) => [h, ...prev]);
                notifyAndLog("HOLIDAY_CREATED", `Added holiday: ${h.name}`, "HR_OPERATIONS");
              }}
              onUpdateHoliday={(updated) => {
                setHolidays((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
                notifyAndLog("HOLIDAY_UPDATED", `Updated holiday: ${updated.name}`, "HR_OPERATIONS");
              }}
              onDeleteHoliday={(holidayId) => {
                setHolidays((prev) => prev.filter((h) => h.id !== holidayId));
                notifyAndLog("HOLIDAY_DELETED", `Deleted holiday from calendar`, "HR_OPERATIONS");
              }}
            />
          )}

          {activeTab === "leaves" && (
            <LeavesView
              leaves={leaves}
              branches={branches}
              employees={employees}
              onApproveLeave={handleApproveLeave}
              onRejectLeave={handleRejectLeave}
              onAddLeave={handleCreateLeaveByAdmin}
              onUpdateLeave={handleUpdateLeave}
              onDeleteLeave={handleDeleteLeave}
            />
          )}

          {activeTab === "payroll" && (
            <PayrollView
              payslips={payslips}
              employees={employees}
              branches={branches}
              payrollPolicy={payrollPolicy}
              onUpdatePayrollPolicy={(newPolicy) => {
                setPayrollPolicy(newPolicy);
                savePayrollPolicyToFirestore(newPolicy);
                setToastMessage("পে-রোল নীতিমালা ও কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে");
                notifyAndLog(
                  "PAYROLL_POLICY_UPDATED",
                  "Updated global payroll policy and calculation rules",
                  "PAYROLL"
                );
              }}
              customBonuses={payrollPolicy.customBonuses || []}
              onUpdateCustomBonuses={(updatedBonuses) => {
                const nextPolicy = {
                  ...payrollPolicy,
                  customBonuses: updatedBonuses,
                };
                setPayrollPolicy(nextPolicy);
                savePayrollPolicyToFirestore(nextPolicy);
                notifyAndLog(
                  "BONUS_CONFIG_UPDATED",
                  `Updated festival & custom bonus configuration`,
                  "PAYROLL"
                );
                setToastMessage("উৎসব বোনাস তালিকা সফলভাবে আপডেট হয়েছে");
              }}
              onGeneratePayroll={handleGeneratePayroll}
              onDisburseAll={handleDisburseAll}
              onApproveAll={handleApproveAllPayroll}
              onApprovePayslip={handleApprovePayslip}
              onDisbursePayslip={handleDisbursePayslip}
              onUpdatePayslip={handleUpdatePayslip}
            />
          )}

          {activeTab === "loans" && (
            <LoansView
              loans={loans}
              employees={employees}
              branches={branches}
              onApproveLoan={handleApproveLoan}
              onRejectLoan={handleRejectLoan}
              onAddLoan={handleAddLoan}
              onUpdateLoan={handleUpdateLoan}
              onDeleteLoan={handleDeleteLoan}
              onRepayLoan={handleRepayLoan}
            />
          )}

          {activeTab === "recruitment" && (
            <RecruitmentView
              jobs={jobs}
              candidates={candidates}
              branches={branches}
              departments={departments}
              onAddJob={handleAddJob}
              onDeleteJob={handleDeleteJob}
              onUpdateCandidateStage={handleUpdateCandidateStage}
              onAddCandidates={handleAddCandidates}
              onBulkUpdateCandidates={handleBulkUpdateCandidates}
              onDeleteCandidate={handleDeleteCandidate}
            />
          )}

          {activeTab === "projects-tasks" && (
            <ProjectsTasksView
              projects={projects}
              tasks={tasks}
              employees={employees}
              onAddTask={handleAddTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
            />
          )}

          {activeTab === "assets" && (
            <AssetsView
              assets={assets}
              employees={employees}
              branches={branches}
              onAddAsset={(ast) => {
                setAssets((prev) => [ast, ...prev]);
                notifyAndLog("ASSET_REGISTERED", `Added asset: ${ast.name}`, "ASSETS");
              }}
              onAssignAsset={(assetId, empId) => {
                const emp = employees.find((e) => e.id === empId);
                setAssets((prev) =>
                  prev.map((a) =>
                    a.id === assetId
                      ? {
                          ...a,
                          assignedToEmployeeId: emp?.id,
                          assignedToEmployeeName: emp?.fullName,
                          status: emp ? "ASSIGNED" : "AVAILABLE",
                        }
                      : a
                  )
                );
              }}
              onWithdrawAsset={(assetId, conditionOnReturn, note) => {
                setAssets((prev) =>
                  prev.map((a) =>
                    a.id === assetId
                      ? {
                          ...a,
                          assignedToEmployeeId: undefined,
                          assignedToEmployeeName: undefined,
                          status: "AVAILABLE",
                          condition: conditionOnReturn as any,
                        }
                      : a
                  )
                );
                notifyAndLog("ASSET_WITHDRAWN", `Withdrawn asset back to inventory pool: ${note}`, "ASSETS");
              }}
              onUpdateAssetCondition={(assetId, cond) => {
                setAssets((prev) =>
                  prev.map((a) => (a.id === assetId ? { ...a, condition: cond } : a))
                );
              }}
              onDeleteAsset={(assetId) => {
                setAssets((prev) => prev.filter((a) => a.id !== assetId));
                notifyAndLog("ASSET_DELETED", `Deleted asset from inventory`, "ASSETS");
              }}
            />
          )}

          {activeTab === "certificates" && (
            <CertificatesView
              certificates={certificates}
              employees={employees}
              branches={branches}
              onGenerateCertificate={(cert) => {
                setCertificates((prev) => [cert, ...prev]);
                notifyAndLog(
                  "CERTIFICATE_ISSUED",
                  `Issued certificate: ${cert.title} for ${cert.employeeName}`,
                  "HR_OPERATIONS"
                );
              }}
            />
          )}

          {activeTab === "exit-management" && (
            <ExitManagementView
              exitRecords={exitRecords}
              employees={employees}
              onAddExit={handleAddExit}
              onUpdateClearance={handleUpdateClearance}
              onDeleteExitRecord={(exitId) => {
                setExitRecords((prev) => prev.filter((r) => r.id !== exitId));
                setToastMessage("এক্সিট নোটিশ সফলভাবে মুছে ফেলা হয়েছে");
                notifyAndLog(
                  "EXIT_NOTICE_DELETED",
                  `Deleted exit clearance notice record`,
                  "HR_OPERATIONS"
                );
              }}
            />
          )}

          {activeTab === "notices-chat" && (
            <NoticesChatView
              notices={notices}
              chatMessages={chatMessages}
              currentEmployee={currentEmployee}
              branches={branches}
              employees={employees}
              projects={projects}
              onAddNotice={(n) => {
                setNotices((prev) => [n, ...prev]);
                notifyAndLog("NOTICE_POSTED", `Published notice: ${n.title}`, "GENERAL");
              }}
              onUpdateNotice={(updatedNotice) => {
                setNotices((prev) => prev.map((n) => (n.id === updatedNotice.id ? updatedNotice : n)));
                notifyAndLog("NOTICE_UPDATED", `Updated notice: ${updatedNotice.title}`, "GENERAL");
              }}
              onDeleteNotice={(nId) => {
                setNotices((prev) => prev.filter((n) => n.id !== nId));
                notifyAndLog("NOTICE_DELETED", `Deleted notice circular`, "GENERAL");
              }}
              onSendMessage={(msg) => {
                setChatMessages((prev) => [...prev, msg]);
              }}
            />
          )}

          {activeTab === "roles-permissions" && (
            <RolesPermissionsView
              rolePermissions={rolePermissions}
              onUpdateRolePermissions={(updatedRoles) => {
                setRolePermissions(updatedRoles);
                try {
                  localStorage.setItem("wf_role_permissions", JSON.stringify(updatedRoles));
                } catch (e) {
                  console.error(e);
                }
                notifyAndLog(
                  "ROLE_PERMISSIONS_UPDATED",
                  `Updated role permissions and access matrix`,
                  "SECURITY"
                );
              }}
              payrollPolicy={payrollPolicy}
              onUpdatePayrollPolicy={(updatedPolicy) => {
                setPayrollPolicy(updatedPolicy);
                savePayrollPolicyToFirestore(updatedPolicy);
                notifyAndLog(
                  "POLICY_UPDATED",
                  `Updated tardiness exemption & festival bonus policy`,
                  "PAYROLL"
                );
              }}
              employees={employees}
              onUpdateEmployee={(updatedEmp) => {
                setEmployees((prev) =>
                  prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e))
                );
                saveEmployeeToFirestore(updatedEmp);
                notifyAndLog(
                  "EMPLOYEE_UPDATED",
                  `Updated policy configuration for ${updatedEmp.fullName}`,
                  "HR_OPERATIONS"
                );
              }}
            />
          )}

          {activeTab === "audit-reports" && (
            <AuditReportsView
              auditLogs={auditLogs}
              employees={employees}
              attendanceLogs={attendanceLogs}
              payslips={payslips}
            />
          )}

          {/* Footer Component with Mandatory Branding */}
          <Footer />
        </main>
      </div>

      {/* Live Anti-Spoofing & Geofencing Biometric Attendance Camera Modal */}
      {isAttendanceModalOpen && (
        <SmartAttendanceModal
          isOpen={isAttendanceModalOpen}
          onClose={() => setIsAttendanceModalOpen(false)}
          isLoggedIn={true}
          currentEmployee={currentEmployee}
          allEmployees={employees}
          employees={employees}
          selectedBranch={
            branches.find((b) => b.id === selectedBranchId) ||
            branches.find((b) => b.id === currentEmployee.branchId) ||
            branches[0]
          }
          allBranches={branches}
          branches={branches}
          onAttendanceSuccess={handleAttendanceSuccess}
          onUpdateFacePhoto={handleUpdateFacePhoto}
        />
      )}

      {/* Google Gemini AI HR Assistant Chatbot Modal */}
      {isAiAssistantModalOpen && (
        <AIHrAssistantModal
          isOpen={isAiAssistantModalOpen}
          onClose={() => setIsAiAssistantModalOpen(false)}
          selectedBranch={
            branches.find((b) => b.id === selectedBranchId) ||
            branches.find((b) => b.id === currentEmployee.branchId) ||
            branches[0]
          }
          allBranches={branches}
          branches={branches}
          companyContext={{
            totalStaff: employees.length,
            branches: branches.map((b) => b.name),
            departments: departments.map((d) => d.name),
            openJobVacancies: jobs.reduce((s, j) => s + j.vacancies, 0),
          }}
        />
      )}
      {/* Mobile Bottom Navigation Bar (Phones & Tablets) */}
      <MobileBottomNav
        activeTab={activeTab as any}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        onOpenAttendance={() => setIsAttendanceModalOpen(true)}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Enterprise Company Branding & White-Label Modal */}
      <CompanyBrandingModal currentUser={currentEmployee} />

      {/* Digital ID Card Badge Preview & High-Res PNG Download Modal */}
      <DigitalIdCardModal
        isOpen={isIdCardModalOpen}
        onClose={() => setIsIdCardModalOpen(false)}
        employee={selectedIdCardEmployee || currentEmployee}
        allEmployees={employees}
        onSelectEmployee={(emp) => setSelectedIdCardEmployee(emp)}
        onUpdateFacePhoto={handleUpdateFacePhoto}
        isSuperAdmin={currentEmployee.role === "SUPER_ADMIN"}
      />

      {/* Global Live Biometric Face Verification & Enrollment Modal */}
      {faceEnrollTargetEmployee && (
        <FaceEnrollmentModal
          isOpen={Boolean(faceEnrollTargetEmployee)}
          onClose={() => setFaceEnrollTargetEmployee(null)}
          employee={faceEnrollTargetEmployee}
          isSuperAdmin={currentEmployee.role === "SUPER_ADMIN"}
          onSaveFacePhoto={(empId, photoUrl, verificationScore) => {
            handleUpdateFacePhoto(empId, photoUrl, verificationScore);
            setFaceEnrollTargetEmployee(null);
          }}
        />
      )}

      {/* Super Admin Organization Data Reset Modal */}
      <OrganizationResetModal
        isOpen={isResetOrgModalOpen}
        onClose={() => setIsResetOrgModalOpen(false)}
        currentSuperAdmin={currentEmployee}
        branches={branches}
        onResetComplete={handleOrganizationResetComplete}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeLanguageProvider>
      <CompanyBrandingProvider>
        <AppContent />
      </CompanyBrandingProvider>
    </ThemeLanguageProvider>
  );
}

