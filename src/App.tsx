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
import { AIHrAssistantModal } from "./components/ai/AIHrAssistantModal";
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
  updateEmployeeFacePhotoInFirestore,
  saveAttendanceRecordToFirestore,
  saveLeaveApplicationToFirestore,
  updateLeaveStatusInFirestore,
  saveLoanToFirestore,
  updateLoanStatusInFirestore,
  savePayslipsToFirestore,
  saveAuditLogToFirestore,
} from "./services/firestoreService";

// Views
import { LoginView } from "./components/views/LoginView";
import { DashboardView } from "./components/views/DashboardView";
import { EmployeeSelfServiceView } from "./components/views/EmployeeSelfServiceView";
import { EmployeesDirectoryView } from "./components/views/EmployeesDirectoryView";
import { DepartmentsDesignationsView } from "./components/views/DepartmentsDesignationsView";
import { BranchesGeofenceView } from "./components/views/BranchesGeofenceView";
import { AttendanceLogsView } from "./components/views/AttendanceLogsView";
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
} from "./data/mockDatabase";
import { calculateMonthlyPayroll } from "./utils/payrollEngine";
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
  const [selectedIdCardEmployee, setSelectedIdCardEmployee] = useState<Employee | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Core Data Collections
  const [company] = useState(mockCompany);
  const [branches, setBranches] = useState<Branch[]>(mockBranches);
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [designations, setDesignations] = useState<Designation[]>(mockDesignations);
  const [shifts, setShifts] = useState<Shift[]>(mockShifts);
  const [holidays, setHolidays] = useState<Holiday[]>(mockHolidays);
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
  const [exitRecords, setExitRecords] = useState<ExitRecord[]>(mockExitRecords);
  const [notices, setNotices] = useState<Notice[]>(mockNotices);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);

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
      if (savedEmpId) {
        const found = mockEmployees.find((e) => e.id === savedEmpId);
        if (found) return found;
      }
    } catch (e) {
      console.warn(e);
    }
    return mockEmployees[0];
  });

  // Realtime Firestore Database Subscriptions & Initialization
  useEffect(() => {
    // 1. Initialize Firestore collections if empty
    initializeFirestoreDatabase();

    // 2. Realtime Subscriptions
    const unsubEmployees = subscribeToEmployees((updatedEmps) => {
      setEmployees(updatedEmps);
      setCurrentEmployee((prev) => {
        const matching = updatedEmps.find((e) => e.id === prev.id);
        return matching || prev;
      });
    });

    const unsubAttendance = subscribeToAttendance((updatedAtt) => {
      setAttendanceLogs(updatedAtt);
    });

    const unsubLeaves = subscribeToLeaves((updatedLeaves) => {
      setLeaves(updatedLeaves);
    });

    const unsubLoans = subscribeToLoans((updatedLoans) => {
      setLoans(updatedLoans);
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

    return () => {
      unsubEmployees();
      unsubAttendance();
      unsubLeaves();
      unsubLoans();
      unsubBranches();
      unsubDepartments();
      unsubDesignations();
      unsubAudit();
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

  const handleUpdateFacePhoto = (employeeId: string, photoUrl: string) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === employeeId
          ? {
              ...e,
              faceRegisteredPhoto: photoUrl,
              avatarUrl: photoUrl,
              faceTemplateRegistered: true,
              faceRegisteredAt: new Date().toISOString().split("T")[0],
            }
          : e
      )
    );
    if (currentEmployee.id === employeeId) {
      setCurrentEmployee((prev) => ({
        ...prev,
        faceRegisteredPhoto: photoUrl,
        avatarUrl: photoUrl,
        faceTemplateRegistered: true,
        faceRegisteredAt: new Date().toISOString().split("T")[0],
      }));
    }
    updateEmployeeFacePhotoInFirestore(employeeId, photoUrl);
    notifyAndLog(
      "BIOMETRIC_ENROLLMENT",
      "Biometric reference face photo successfully enrolled & vector template updated in cloud database",
      "ATTENDANCE"
    );
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

  // Handlers for Payroll
  const handleGeneratePayroll = (month: string) => {
    const activeStaff = employees.filter((e) => e.status === "ACTIVE");
    const newSlips = calculateMonthlyPayroll(
      month,
      activeStaff,
      attendanceLogs,
      loans
    );
    // Replace current month's slips or append
    setPayslips((prev) => [
      ...newSlips,
      ...prev.filter((p) => p.payrollMonth !== month),
    ]);
    savePayslipsToFirestore(newSlips);
    notifyAndLog(
      "PAYROLL_CALCULATION",
      `Generated ${month} automated payroll for ${activeStaff.length} active employees`,
      "PAYROLL"
    );
  };

  const handleDisburseAll = (month: string) => {
    setPayslips((prev) =>
      prev.map((p) =>
        p.payrollMonth === month
          ? {
              ...p,
              paymentStatus: "PAID",
              paymentDate: new Date().toISOString().split("T")[0],
            }
          : p
      )
    );
    notifyAndLog(
      "PAYROLL_DISBURSEMENT",
      `Disbursed all salaries for ${month} via automated bank advice transfer`,
      "PAYROLL"
    );
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

  // Handlers for Recruitment
  const handleAddJob = (job: JobPosting) => {
    setJobs((prev) => [job, ...prev]);
    notifyAndLog("JOB_POSTED", `Published job circular: ${job.title}`, "RECRUITMENT");
  };

  const handleUpdateCandidateStage = (candidateId: string, stage: Candidate["stage"]) => {
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
    notifyAndLog(
      "CANDIDATES_SCREENED",
      `Automated multi-criteria screening updated for ${updatedList.length} candidates`,
      "RECRUITMENT"
    );
  };

  const handleDeleteCandidate = (candId: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== candId));
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
            onSwitchEmployee={(emp) => setCurrentEmployee(emp)}
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
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
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
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-32 lg:pb-12 space-y-4 sm:space-y-6">
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
            />
          )}

          {activeTab === "employees" && (
            <EmployeesDirectoryView
              employees={employees}
              branches={branches}
              departments={departments}
              designations={designations}
              shifts={shifts}
              onAddEmployee={(newEmp) => {
                setEmployees((prev) => [newEmp, ...prev]);
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
              }}
              onOpenDigitalIdCard={handleOpenIdCardModal}
            />
          )}

          {activeTab === "departments-designations" && (
            <DepartmentsDesignationsView
              departments={departments}
              designations={designations}
              onAddDepartment={(newDept) => {
                setDepartments((prev) => [newDept, ...prev]);
                notifyAndLog(
                  "DEPARTMENT_CREATED",
                  `Created department: ${newDept.name}`,
                  "HR_OPERATIONS"
                );
              }}
              onAddDesignation={(newDesig) => {
                setDesignations((prev) => [newDesig, ...prev]);
                notifyAndLog(
                  "DESIGNATION_CREATED",
                  `Created designation: ${newDesig.title}`,
                  "HR_OPERATIONS"
                );
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
                setBranches((prev) => prev.filter((b) => b.id !== bId));
                notifyAndLog("BRANCH_DELETED", `Deleted regional branch`, "HR_OPERATIONS");
              }}
              onAddBranch={(newBranch) => {
                setBranches((prev) => [newBranch, ...prev]);
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
                notifyAndLog(
                  "GEOFENCE_UPDATED",
                  `Updated geofence perimeter for ${updated.name} to ${updated.geofenceRadiusMeters}m`,
                  "HR_OPERATIONS"
                );
              }}
            />
          )}

          {activeTab === "attendance-logs" && (
            <AttendanceLogsView
              attendanceLogs={attendanceLogs}
              branches={branches}
              onOpenAttendanceModal={() => setIsAttendanceModalOpen(true)}
            />
          )}

          {activeTab === "shifts-holidays" && (
            <ShiftsHolidaysView
              shifts={shifts}
              holidays={holidays}
              branches={branches}
              onAddShift={(s) => {
                setShifts((prev) => [s, ...prev]);
                notifyAndLog("SHIFT_CREATED", `Added shift roster: ${s.name}`, "HR_OPERATIONS");
              }}
              onAddHoliday={(h) => {
                setHolidays((prev) => [h, ...prev]);
                notifyAndLog("HOLIDAY_CREATED", `Added holiday: ${h.name}`, "HR_OPERATIONS");
              }}
            />
          )}

          {activeTab === "leaves" && (
            <LeavesView
              leaves={leaves}
              branches={branches}
              onApproveLeave={handleApproveLeave}
              onRejectLeave={handleRejectLeave}
            />
          )}

          {activeTab === "payroll" && (
            <PayrollView
              payslips={payslips}
              employees={employees}
              branches={branches}
              onGeneratePayroll={handleGeneratePayroll}
              onDisburseAll={handleDisburseAll}
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
            />
          )}

          {activeTab === "recruitment" && (
            <RecruitmentView
              jobs={jobs}
              candidates={candidates}
              branches={branches}
              departments={departments}
              onAddJob={handleAddJob}
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
          onSwitchEmployee={(emp) => setCurrentEmployee(emp)}
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
      <CompanyBrandingModal />

      {/* Digital ID Card Badge Preview & High-Res PNG Download Modal */}
      <DigitalIdCardModal
        isOpen={isIdCardModalOpen}
        onClose={() => setIsIdCardModalOpen(false)}
        employee={selectedIdCardEmployee || currentEmployee}
        allEmployees={employees}
        onSelectEmployee={(emp) => setSelectedIdCardEmployee(emp)}
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

