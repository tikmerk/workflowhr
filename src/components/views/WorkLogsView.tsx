import React, { useState, useMemo, useEffect } from "react";
import {
  ClipboardList,
  Plus,
  Clock,
  Calendar,
  Building2,
  Home,
  MapPin,
  FileSpreadsheet,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  ExternalLink,
  BarChart3,
  User,
  Users,
  X,
  Briefcase,
  Filter,
  List,
  Layers,
  ChevronRight,
  Eye,
} from "lucide-react";
import {
  DailyWorkLog,
  Employee,
  AttendanceRecord,
  Project,
  ProjectTask,
  Branch,
  Department,
} from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { exportMultiSheetExcel } from "../../utils/exportUtils";

interface WorkLogsViewProps {
  workLogs: DailyWorkLog[];
  employees: Employee[];
  attendanceLogs: AttendanceRecord[];
  projects: Project[];
  tasks: ProjectTask[];
  branches?: Branch[];
  departments?: Department[];
  currentUser: Employee;
  onSaveWorkLog: (log: DailyWorkLog) => void;
  onDeleteWorkLog: (logId: string) => void;
}

const calcDurationMinutes = (start: string, end: string): number => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;
  const diff = eh * 60 + em - (sh * 60 + sm);
  return diff > 0 ? diff : 0;
};

const formatMinsToHrs = (mins: number, isBangla = true): string => {
  if (!mins || mins <= 0) return isBangla ? "০ ঘণ্টা" : "0h";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return isBangla ? `${m} মি.` : `${m}m`;
  if (m === 0) return isBangla ? `${h} ঘণ্টা` : `${h}h`;
  return isBangla ? `${h} ঘ. ${m} মি.` : `${h}h ${m}m`;
};

const parseAttendanceMinutes = (rec: AttendanceRecord): number => {
  if (typeof rec.totalWorkMinutes === "number" && rec.totalWorkMinutes > 0) {
    return rec.totalWorkMinutes;
  }
  if (rec.checkInTime && rec.checkOutTime) {
    const toMins = (t: string): number | null => {
      const m = t.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
      if (!m) return null;
      let hr = Number(m[1]);
      const min = Number(m[2]);
      const mer = m[3]?.toUpperCase();
      if (mer === "PM" && hr < 12) hr += 12;
      if (mer === "AM" && hr === 12) hr = 0;
      return hr * 60 + min;
    };
    const inM = toMins(rec.checkInTime);
    const outM = toMins(rec.checkOutTime);
    if (inM !== null && outM !== null && outM > inM) {
      return outM - inM;
    }
  }
  return rec.checkInTime ? 480 : 0;
};

const WORK_CATEGORIES = [
  "Project Delivery / প্রজেক্ট ডেলিভারি",
  "Client Communication / ক্লায়েন্ট যোগাযোগ",
  "Field Visit & Survey / ফিল্ড ভিজিট ও সার্ভে",
  "Report & Documentation / রিপোর্ট ও ডকুমেন্টেশন",
  "Software / Technical Support / আইটি ও টেকনিক্যাল",
  "Admin & Accounts / অ্যাডমিন ও হিসাব",
  "Training & Meeting / ট্রেনিং ও মিটিং",
  "Other / অন্যান্য",
];

export const WorkLogsView: React.FC<WorkLogsViewProps> = ({
  workLogs,
  employees,
  attendanceLogs,
  projects,
  tasks,
  branches = [],
  departments = [],
  currentUser,
  onSaveWorkLog,
  onDeleteWorkLog,
}) => {
  const { isBangla } = useThemeLanguage();

  const todayIso = new Date().toISOString().split("T")[0];
  const currentMonthStr = todayIso.slice(0, 7);

  // ==========================================================
  // STRICT HIERARCHICAL VISIBILITY ENGINE
  // Rules:
  // 1. General Employees: ONLY their own daily logs (never anyone else's).
  // 2. Managers / Team Leads: ONLY their own logs + subordinates beneath them
  //    (direct & indirect downline). NEVER superiors, ancestors, or equal/higher ranks.
  // 3. Branch Manager: Own logs + subordinates + strictly lower-ranked staff in own branch.
  // 4. HR Manager: Own logs + staff strictly below HR rank (never CEO/Super Admin).
  // 5. Super Admin / CEO: Full departmental inspection (CEO never sees higher rank).
  // ==========================================================
  const getAuthorityRank = (emp: Employee): number => {
    const r = String(emp.role || "").toUpperCase();
    const d = String(emp.designationTitle || "").toLowerCase();
    if (emp.isSuperAdmin || ["SUPER_ADMIN", "GRAND_ADMIN", "COMPANY_ADMIN"].includes(r)) return 100;
    if (
      emp.isCeoOrOwner ||
      r === "CEO" ||
      d.includes("ceo") ||
      d.includes("chief executive") ||
      d.includes("managing director") ||
      d.includes("chairman") ||
      d.includes("সিইও")
    ) {
      return 90;
    }
    if (["HR_MANAGER", "HR_ADMIN"].includes(r) || d.includes("director") || d.includes("hr manager")) return 75;
    if (["BRANCH_MANAGER", "ACCOUNTS_MANAGER", "ACCOUNT_PAYROLL", "PROJECT_MANAGER", "DEPARTMENT_HEAD"].includes(r)) {
      return 60;
    }
    if (
      ["TEAM_LEADER", "SUPERVISOR"].includes(r) ||
      d.includes("manager") ||
      d.includes("head of") ||
      d.includes("team lead") ||
      d.includes("supervisor")
    ) {
      return 45;
    }
    return 10;
  };

  const roleStr = String(currentUser.role || "").toUpperCase();
  const myAuthorityRank = useMemo(() => getAuthorityRank(currentUser), [currentUser]);
  const isSuperAdminViewer = myAuthorityRank >= 100;
  const isCeoViewer = myAuthorityRank === 90;
  const isHrViewer = !isSuperAdminViewer && !isCeoViewer && roleStr === "HR_MANAGER";
  const isGlobalViewer = isSuperAdminViewer || isCeoViewer || isHrViewer;
  const isBranchManager = !isGlobalViewer && roleStr === "BRANCH_MANAGER";

  // Walk UP reportingManagerId chain to collect all superiors/ancestors (strictly forbidden to view!)
  const ancestorIds = useMemo(() => {
    const ancestors = new Set<string>();
    const empById = new Map(employees.map((e) => [e.id, e]));
    let cursor = currentUser.reportingManagerId;
    let guard = 0;
    while (cursor && guard < 25) {
      if (cursor === currentUser.id || ancestors.has(cursor)) break;
      ancestors.add(cursor);
      cursor = empById.get(cursor)?.reportingManagerId;
      guard++;
    }
    return ancestors;
  }, [employees, currentUser.id, currentUser.reportingManagerId]);

  // Walk DOWN reportingManagerId tree recursively to collect all direct & indirect subordinates
  const subordinateIds = useMemo(() => {
    const active = employees.filter((e) => e.status !== "TERMINATED" && e.status !== "RESIGNED");
    const subs = new Set<string>();
    const queue: string[] = [currentUser.id];
    let guard = 0;
    while (queue.length > 0 && guard < 500) {
      const managerId = queue.shift()!;
      for (const emp of active) {
        if (
          emp.id !== currentUser.id &&
          emp.reportingManagerId === managerId &&
          !subs.has(emp.id) &&
          !ancestorIds.has(emp.id)
        ) {
          // Never treat a higher-ranked officer as a subordinate even if misconfigured
          if (isSuperAdminViewer || getAuthorityRank(emp) <= myAuthorityRank) {
            subs.add(emp.id);
            queue.push(emp.id);
          }
        }
      }
      guard++;
    }
    return subs;
  }, [employees, currentUser.id, ancestorIds, isSuperAdminViewer, myAuthorityRank]);

  const isTeamManager = useMemo(() => {
    if (isGlobalViewer || isBranchManager) return false;
    return subordinateIds.size > 0 || myAuthorityRank >= 45;
  }, [isGlobalViewer, isBranchManager, subordinateIds.size, myAuthorityRank]);

  // Strictly scoped list of OTHER employees whose daily logs currentUser is legally allowed to inspect
  const viewableSubordinates = useMemo(() => {
    const active = employees.filter(
      (e) => e.status !== "TERMINATED" && e.status !== "RESIGNED" && e.id !== currentUser.id
    );

    // 1. Super Admin sees 100% of active staff across all departments
    if (isSuperAdminViewer) return active;

    // 2. CEO sees everyone except Super Admin / ancestors
    if (isCeoViewer) {
      return active.filter((e) => !ancestorIds.has(e.id) && getAuthorityRank(e) <= myAuthorityRank);
    }

    // 3. HR Manager sees all departments strictly below HR rank (never CEO / Super Admin / own superior)
    if (isHrViewer) {
      return active.filter(
        (e) =>
          !ancestorIds.has(e.id) &&
          (subordinateIds.has(e.id) || getAuthorityRank(e) < myAuthorityRank)
      );
    }

    // 4. Branch Manager sees recursive subordinates + strictly lower-ranked staff in own branch (never superiors/peers)
    if (isBranchManager) {
      return active.filter(
        (e) =>
          !ancestorIds.has(e.id) &&
          (subordinateIds.has(e.id) ||
            (e.branchId === currentUser.branchId && getAuthorityRank(e) < myAuthorityRank))
      );
    }

    // 5. Line Manager / Team Leader / Accounts Manager / Project Manager:
    //    Strictly ONLY their direct & indirect subordinates (downline).
    //    If a manager role has no explicit reportingManagerId links yet, ONLY strictly lower-ranked general staff in their department.
    if (isTeamManager) {
      if (subordinateIds.size > 0) {
        return active.filter((e) => subordinateIds.has(e.id) && !ancestorIds.has(e.id));
      }
      return active.filter(
        (e) =>
          !ancestorIds.has(e.id) &&
          Boolean(currentUser.departmentName) &&
          e.departmentName === currentUser.departmentName &&
          getAuthorityRank(e) < myAuthorityRank
      );
    }

    // 6. General Employee: ZERO other employees!
    return [];
  }, [
    employees,
    currentUser,
    isSuperAdminViewer,
    isCeoViewer,
    isHrViewer,
    isBranchManager,
    isTeamManager,
    ancestorIds,
    subordinateIds,
    myAuthorityRank,
  ]);

  const canViewTeamLogs = viewableSubordinates.length > 0 || isGlobalViewer;

  // For Reports tab: includes self + allowed subordinates (for General Employee: strictly ONLY self)
  const selectableEmployees = useMemo(() => {
    const activeSelf = employees.find((e) => e.id === currentUser.id) || currentUser;
    if (!canViewTeamLogs) return [activeSelf];
    const byId = new Map<string, Employee>();
    byId.set(activeSelf.id, activeSelf);
    viewableSubordinates.forEach((e) => byId.set(e.id, e));
    return Array.from(byId.values());
  }, [employees, currentUser, canViewTeamLogs, viewableSubordinates]);

  // For Team Logs tab: strictly ONLY subordinates/viewable staff (for Super Admin includes all active staff)
  const teamDirectoryEmployees = useMemo(() => {
    if (isSuperAdminViewer) return selectableEmployees;
    return viewableSubordinates;
  }, [isSuperAdminViewer, selectableEmployees, viewableSubordinates]);

  const selectableEmployeeIds = useMemo(
    () => new Set(selectableEmployees.map((e) => e.id)),
    [selectableEmployees]
  );

  // Unique departments list derived from visible subordinates/departments
  const availableDepartments = useMemo(() => {
    const deptSet = new Set<string>();
    if (isGlobalViewer) {
      departments.forEach((d) => {
        if (d.name) deptSet.add(d.name);
      });
    }
    teamDirectoryEmployees.forEach((e) => {
      if (e.departmentName) deptSet.add(e.departmentName);
    });
    return Array.from(deptSet).sort((a, b) => a.localeCompare(b));
  }, [departments, teamDirectoryEmployees, isGlobalViewer]);

  // Unique branches list for global viewers
  const availableBranches = useMemo(() => {
    if (branches.length > 0) return branches;
    const map = new Map<string, string>();
    teamDirectoryEmployees.forEach((e) => {
      if (e.branchId) map.set(e.branchId, e.branchName || e.branchId);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [branches, teamDirectoryEmployees]);

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<"MY_LOG" | "TEAM_LOGS" | "REPORTS">(
    canViewTeamLogs ? "TEAM_LOGS" : "MY_LOG"
  );

  // ==========================================================
  // TAB 1: MY DAILY LOG FORM & HISTORY STATE
  // ==========================================================
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [logDate, setLogDate] = useState<string>(todayIso);
  const [workMode, setWorkMode] = useState<"OFFICE" | "WORK_FROM_HOME" | "FIELD">("OFFICE");
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("17:00");
  const [taskCategory, setTaskCategory] = useState<string>(WORK_CATEGORIES[0]);
  const [projectId, setProjectId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [deliverableLink, setDeliverableLink] = useState<string>("");
  const [status, setStatus] = useState<"COMPLETED" | "IN_PROGRESS" | "BLOCKED">("COMPLETED");
  const [myMonthFilter, setMyMonthFilter] = useState<string>(currentMonthStr);
  const [mySearchQuery, setMySearchQuery] = useState<string>("");

  // ==========================================================
  // TAB 2: TEAM & DEPARTMENT LOGS STATE
  // ==========================================================
  const [teamDeptFilter, setTeamDeptFilter] = useState<string>("ALL");
  const [teamBranchFilter, setTeamBranchFilter] = useState<string>("ALL");
  const [teamDateMode, setTeamDateMode] = useState<"MONTH" | "DAY" | "ALL">("MONTH");
  const [teamMonthFilter, setTeamMonthFilter] = useState<string>(currentMonthStr);
  const [teamSpecificDate, setTeamSpecificDate] = useState<string>(todayIso);
  const [teamWorkModeFilter, setTeamWorkModeFilter] = useState<"ALL" | "OFFICE" | "WORK_FROM_HOME" | "FIELD">("ALL");
  const [teamSearchQuery, setTeamSearchQuery] = useState<string>("");
  const [teamViewStyle, setTeamViewStyle] = useState<"BY_EMPLOYEE" | "FEED">("BY_EMPLOYEE");
  const [inspectedEmployeeId, setInspectedEmployeeId] = useState<string>("");

  // ==========================================================
  // TAB 3: REPORTS & EXCEL EXPORT STATE
  // ==========================================================
  const [reportPeriod, setReportPeriod] = useState<"MONTHLY" | "SEMI_ANNUAL" | "ANNUAL" | "CUSTOM">("MONTHLY");
  const [reportMonth, setReportMonth] = useState<string>(currentMonthStr);
  const [reportYear, setReportYear] = useState<string>(todayIso.slice(0, 4));
  const [reportCustomStart, setReportCustomStart] = useState<string>(`${currentMonthStr}-01`);
  const [reportCustomEnd, setReportCustomEnd] = useState<string>(todayIso);
  const [reportDeptFilter, setReportDeptFilter] = useState<string>("ALL");
  const [reportEmployeeId, setReportEmployeeId] = useState<string>(currentUser.id);

  // ==========================================================
  // COMPUTED: MY LOGS & ATTENDANCE
  // ==========================================================
  const todayAttendance = useMemo(() => {
    return attendanceLogs.find((a) => a.employeeId === currentUser.id && a.date === todayIso);
  }, [attendanceLogs, currentUser.id, todayIso]);

  const myFilteredLogs = useMemo(() => {
    const q = mySearchQuery.trim().toLowerCase();
    return workLogs
      .filter((l) => l.employeeId === currentUser.id)
      .filter((l) => (!myMonthFilter ? true : (l.date || "").startsWith(myMonthFilter)))
      .filter((l) => {
        if (!q) return true;
        return (
          (l.title || "").toLowerCase().includes(q) ||
          (l.description || "").toLowerCase().includes(q) ||
          (l.taskCategory || "").toLowerCase().includes(q) ||
          (l.projectName || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [workLogs, currentUser.id, myMonthFilter, mySearchQuery]);

  const myMonthlyStats = useMemo(() => {
    const monthLogs = workLogs.filter(
      (l) => l.employeeId === currentUser.id && (l.date || "").startsWith(myMonthFilter)
    );
    const totalMinutes = monthLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
    const uniqueDays = new Set(monthLogs.map((l) => l.date)).size;
    const officeDays = new Set(monthLogs.filter((l) => l.workMode === "OFFICE").map((l) => l.date)).size;
    const wfhDays = new Set(monthLogs.filter((l) => l.workMode === "WORK_FROM_HOME").map((l) => l.date)).size;
    const fieldDays = new Set(monthLogs.filter((l) => l.workMode === "FIELD").map((l) => l.date)).size;
    return { count: monthLogs.length, totalMinutes, uniqueDays, officeDays, wfhDays, fieldDays };
  }, [workLogs, currentUser.id, myMonthFilter]);

  const resetForm = () => {
    setEditingLogId(null);
    setLogDate(todayIso);
    setWorkMode("OFFICE");
    setStartTime("09:00");
    setEndTime("17:00");
    setTaskCategory(WORK_CATEGORIES[0]);
    setProjectId("");
    setTitle("");
    setDescription("");
    setDeliverableLink("");
    setStatus("COMPLETED");
  };

  const handleEditLog = (log: DailyWorkLog) => {
    setEditingLogId(log.id);
    setLogDate(log.date);
    setWorkMode(log.workMode);
    setStartTime(log.startTime || "09:00");
    setEndTime(log.endTime || "17:00");
    setTaskCategory(log.taskCategory || WORK_CATEGORIES[0]);
    setProjectId(log.projectId || "");
    setTitle(log.title);
    setDescription(log.description);
    setDeliverableLink(log.deliverableLink || "");
    setStatus(log.status || "COMPLETED");
    setActiveSubTab("MY_LOG");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const matchedProject = projects.find((p) => p.id === projectId);
    const durationMinutes = calcDurationMinutes(startTime, endTime);
    const nowIso = new Date().toISOString();
    const logPayload: DailyWorkLog = {
      id: editingLogId || `wlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      employeeId: currentUser.id,
      employeeCode: currentUser.employeeCode || "",
      employeeName: currentUser.fullName,
      avatarUrl: currentUser.avatarUrl,
      branchId: currentUser.branchId || "",
      branchName: currentUser.branchName || "",
      departmentName: currentUser.departmentName || "",
      date: logDate,
      workMode,
      startTime,
      endTime,
      durationMinutes,
      taskCategory,
      projectId: matchedProject?.id || undefined,
      projectName: matchedProject?.name || undefined,
      title: title.trim(),
      description: description.trim(),
      deliverableLink: deliverableLink.trim() || undefined,
      status,
      createdAt: editingLogId
        ? workLogs.find((l) => l.id === editingLogId)?.createdAt || nowIso
        : nowIso,
      updatedAt: nowIso,
    };
    onSaveWorkLog(logPayload);
    resetForm();
  };

  // Guard: General employees can NEVER remain on TEAM_LOGS
  useEffect(() => {
    if (!canViewTeamLogs && activeSubTab === "TEAM_LOGS") {
      setActiveSubTab("MY_LOG");
    }
  }, [canViewTeamLogs, activeSubTab]);

  // ==========================================================
  // COMPUTED: TEAM & DEPARTMENT LOGS (TAB 2)
  // ==========================================================
  const teamFilteredEmployees = useMemo(() => {
    const q = teamSearchQuery.trim().toLowerCase();
    return teamDirectoryEmployees.filter((emp) => {
      if (teamDeptFilter !== "ALL" && emp.departmentName !== teamDeptFilter) return false;
      if (teamBranchFilter !== "ALL" && emp.branchId !== teamBranchFilter) return false;
      if (q) {
        const matchEmp =
          (emp.fullName || "").toLowerCase().includes(q) ||
          (emp.employeeCode || "").toLowerCase().includes(q) ||
          (emp.departmentName || "").toLowerCase().includes(q) ||
          (emp.designationTitle || "").toLowerCase().includes(q);
        if (!matchEmp) return false;
      }
      return true;
    });
  }, [teamDirectoryEmployees, teamDeptFilter, teamBranchFilter, teamSearchQuery]);

  const teamPeriodFilteredLogs = useMemo(() => {
    const empIdSet = new Set(teamFilteredEmployees.map((e) => e.id));
    return workLogs
      .filter((l) => selectableEmployeeIds.has(l.employeeId) && empIdSet.has(l.employeeId))
      .filter((l) => {
        if (teamDateMode === "MONTH") return (l.date || "").startsWith(teamMonthFilter);
        if (teamDateMode === "DAY") return l.date === teamSpecificDate;
        return true;
      })
      .filter((l) => (teamWorkModeFilter === "ALL" ? true : l.workMode === teamWorkModeFilter))
      .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [
    workLogs,
    teamFilteredEmployees,
    selectableEmployeeIds,
    teamDateMode,
    teamMonthFilter,
    teamSpecificDate,
    teamWorkModeFilter,
  ]);

  // Per-employee stats for the left directory in Tab 2
  const employeeLogSummaries = useMemo(() => {
    const map = new Map<
      string,
      { count: number; totalMinutes: number; lastDate: string; uniqueDays: number; logs: DailyWorkLog[] }
    >();
    teamFilteredEmployees.forEach((emp) => {
      map.set(emp.id, { count: 0, totalMinutes: 0, lastDate: "", uniqueDays: 0, logs: [] });
    });
    teamPeriodFilteredLogs.forEach((log) => {
      const entry = map.get(log.employeeId);
      if (entry) {
        entry.count += 1;
        entry.totalMinutes += log.durationMinutes || 0;
        if (!entry.lastDate || log.date > entry.lastDate) entry.lastDate = log.date;
        entry.logs.push(log);
      }
    });
    map.forEach((val) => {
      val.uniqueDays = new Set(val.logs.map((l) => l.date)).size;
    });
    return map;
  }, [teamFilteredEmployees, teamPeriodFilteredLogs]);

  // Sort employee list: those with logs in period first, then alphabetically
  const sortedTeamEmployees = useMemo(() => {
    return [...teamFilteredEmployees].sort((a, b) => {
      const sa = employeeLogSummaries.get(a.id)?.count || 0;
      const sb = employeeLogSummaries.get(b.id)?.count || 0;
      if (sb !== sa) return sb - sa;
      return (a.fullName || "").localeCompare(b.fullName || "");
    });
  }, [teamFilteredEmployees, employeeLogSummaries]);

  // Ensure inspectedEmployeeId stays valid when filters change
  useEffect(() => {
    if (sortedTeamEmployees.length === 0) {
      setInspectedEmployeeId("");
    } else if (!sortedTeamEmployees.some((e) => e.id === inspectedEmployeeId)) {
      setInspectedEmployeeId(sortedTeamEmployees[0].id);
    }
  }, [sortedTeamEmployees, inspectedEmployeeId]);

  const inspectedEmployee = useMemo(
    () => sortedTeamEmployees.find((e) => e.id === inspectedEmployeeId) || null,
    [sortedTeamEmployees, inspectedEmployeeId]
  );

  const inspectedEmployeeSummary = inspectedEmployee
    ? employeeLogSummaries.get(inspectedEmployee.id) || {
        count: 0,
        totalMinutes: 0,
        lastDate: "",
        uniqueDays: 0,
        logs: [],
      }
    : null;

  // Attendance lookup helper (employeeId + date -> AttendanceRecord)
  const attendanceMap = useMemo(() => {
    const m = new Map<string, AttendanceRecord>();
    attendanceLogs.forEach((a) => {
      if (a.employeeId && a.date) m.set(`${a.employeeId}_${a.date}`, a);
    });
    return m;
  }, [attendanceLogs]);

  // ==========================================================
  // COMPUTED: REPORTS & EXCEL EXPORT (TAB 3)
  // ==========================================================
  const reportDateRange = useMemo(() => {
    if (reportPeriod === "MONTHLY") {
      const [y, m] = reportMonth.split("-").map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      return {
        start: `${reportMonth}-01`,
        end: `${reportMonth}-${String(lastDay).padStart(2, "0")}`,
        label: reportMonth,
      };
    }
    if (reportPeriod === "SEMI_ANNUAL") {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 5);
      startDate.setDate(1);
      return {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
        label: isBangla ? "বিগত ৬ মাস" : "Last 6 Months",
      };
    }
    if (reportPeriod === "ANNUAL") {
      return {
        start: `${reportYear}-01-01`,
        end: `${reportYear}-12-31`,
        label: reportYear,
      };
    }
    return {
      start: reportCustomStart,
      end: reportCustomEnd,
      label: `${reportCustomStart} to ${reportCustomEnd}`,
    };
  }, [reportPeriod, reportMonth, reportYear, reportCustomStart, reportCustomEnd, isBangla]);

  const reportDepartmentEmployees = useMemo(() => {
    if (!canViewTeamLogs) return selectableEmployees;
    if (reportDeptFilter === "ALL") return selectableEmployees;
    return selectableEmployees.filter((e) => e.departmentName === reportDeptFilter);
  }, [selectableEmployees, canViewTeamLogs, reportDeptFilter]);

  useEffect(() => {
    if (reportDepartmentEmployees.length > 0 && !reportDepartmentEmployees.some((e) => e.id === reportEmployeeId)) {
      setReportEmployeeId(reportDepartmentEmployees[0].id);
    }
  }, [reportDepartmentEmployees, reportEmployeeId]);

  const computeEmployeePeriodReport = (emp: Employee) => {
    const { start, end } = reportDateRange;
    const empLogs = workLogs.filter(
      (l) => l.employeeId === emp.id && l.date >= start && l.date <= end
    );
    const empAtt = attendanceLogs.filter(
      (a) => a.employeeId === emp.id && a.date >= start && a.date <= end
    );
    const empCompletedTasks = tasks.filter(
      (t) =>
        t.assignedToEmployeeId === emp.id &&
        (t.status === "COMPLETED" || t.status === "DONE") &&
        ((t.completedAt || t.submittedAt || t.updatedAt || "").slice(0, 10) >= start &&
          (t.completedAt || t.submittedAt || t.updatedAt || "").slice(0, 10) <= end)
    );

    const daySet = new Set<string>();
    empLogs.forEach((l) => daySet.add(l.date));
    empAtt.forEach((a) => daySet.add(a.date));

    let officeDays = 0;
    let wfhDays = 0;
    let fieldDays = 0;
    let totalAttMinutes = 0;
    let totalLogMinutes = 0;

    const timeline = Array.from(daySet)
      .sort((a, b) => b.localeCompare(a))
      .map((date) => {
        const att = empAtt.find((a) => a.date === date);
        const dayLogs = empLogs.filter((l) => l.date === date);
        const attMins = att ? parseAttendanceMinutes(att) : 0;
        const logMins = dayLogs.reduce((s, l) => s + (l.durationMinutes || 0), 0);
        totalAttMinutes += attMins;
        totalLogMinutes += logMins;

        const modes = new Set(dayLogs.map((l) => l.workMode));
        let modeLabel: "OFFICE" | "WORK_FROM_HOME" | "FIELD" | "ATTENDANCE_ONLY" = "ATTENDANCE_ONLY";
        if (modes.has("FIELD")) {
          fieldDays += 1;
          modeLabel = "FIELD";
        } else if (modes.has("WORK_FROM_HOME")) {
          wfhDays += 1;
          modeLabel = "WORK_FROM_HOME";
        } else if (modes.has("OFFICE") || att) {
          officeDays += 1;
          modeLabel = modes.has("OFFICE") ? "OFFICE" : "ATTENDANCE_ONLY";
        }

        return {
          date,
          attendance: att,
          logs: dayLogs,
          attMinutes: attMins,
          logMinutes: logMins,
          primaryMode: modeLabel,
        };
      });

    return {
      employee: emp,
      activeDays: daySet.size,
      officeDays,
      wfhDays,
      fieldDays,
      totalAttMinutes,
      totalLogMinutes,
      logEntriesCount: empLogs.length,
      completedTasksCount: empCompletedTasks.length,
      completedTasks: empCompletedTasks,
      timeline,
      rawLogs: empLogs,
    };
  };

  // Multi-employee comparison summary for Managers / Super Admin
  const multiEmployeeReports = useMemo(() => {
    if (!canViewTeamLogs) return [];
    return reportDepartmentEmployees
      .map((emp) => computeEmployeePeriodReport(emp))
      .sort((a, b) => b.totalLogMinutes - a.totalLogMinutes || b.activeDays - a.activeDays);
  }, [reportDepartmentEmployees, canViewTeamLogs, workLogs, attendanceLogs, tasks, reportDateRange]);

  const selectedReportEmployee = useMemo(() => {
    return (
      reportDepartmentEmployees.find((e) => e.id === reportEmployeeId) ||
      selectableEmployees.find((e) => e.id === reportEmployeeId) ||
      currentUser
    );
  }, [reportDepartmentEmployees, selectableEmployees, reportEmployeeId, currentUser]);

  const selectedEmployeeReport = useMemo(() => {
    return computeEmployeePeriodReport(selectedReportEmployee);
  }, [selectedReportEmployee, workLogs, attendanceLogs, tasks, reportDateRange]);

  // ==========================================================
  // EXCEL EXPORT HANDLERS
  // ==========================================================
  const handleExportIndividualExcel = (targetEmp: Employee) => {
    const rep = computeEmployeePeriodReport(targetEmp);
    const summaryRows = [
      {
        "Employee Code": targetEmp.employeeCode,
        "Employee Name": targetEmp.fullName,
        Department: targetEmp.departmentName || "",
        Branch: targetEmp.branchName || "",
        Period: reportDateRange.label,
        "Active Days": rep.activeDays,
        "Office Days": rep.officeDays,
        "WFH Days": rep.wfhDays,
        "Field Days": rep.fieldDays,
        "Attendance Hours": Number((rep.totalAttMinutes / 60).toFixed(2)),
        "Logged Work Hours": Number((rep.totalLogMinutes / 60).toFixed(2)),
        "Work Log Entries": rep.logEntriesCount,
        "Tasks Completed": rep.completedTasksCount,
      },
    ];

    const timelineRows = rep.timeline.map((row) => ({
      Date: row.date,
      "Attendance Status": row.attendance?.status || "NO_PUNCH",
      "Check-In": row.attendance?.checkInTime || "-",
      "Check-Out": row.attendance?.checkOutTime || "-",
      "Attendance Hours": Number((row.attMinutes / 60).toFixed(2)),
      "Work Mode": row.primaryMode,
      "Log Entries": row.logs.length,
      "Logged Hours": Number((row.logMinutes / 60).toFixed(2)),
      "Work Summary": row.logs.map((l) => `[${l.startTime}-${l.endTime}] ${l.title}`).join(" | "),
    }));

    const detailRows = rep.rawLogs.map((l) => ({
      Date: l.date,
      "Start Time": l.startTime,
      "End Time": l.endTime,
      "Duration (Hrs)": Number(((l.durationMinutes || 0) / 60).toFixed(2)),
      "Work Mode": l.workMode,
      Category: l.taskCategory,
      Project: l.projectName || "-",
      Title: l.title,
      Description: l.description,
      Status: l.status,
      "Deliverable Link": l.deliverableLink || "",
    }));

    exportMultiSheetExcel(
      `WorkLog_Report_${targetEmp.employeeCode || targetEmp.fullName}_${reportDateRange.start}_${reportDateRange.end}`,
      [
        { name: "Summary", rows: summaryRows },
        { name: "Daily_Timeline", rows: timelineRows.length ? timelineRows : [{ Info: "No entries in selected period" }] },
        { name: "Work_Log_Details", rows: detailRows.length ? detailRows : [{ Info: "No log entries in selected period" }] },
      ]
    );
  };

  const handleExportTeamSummaryExcel = () => {
    const comparisonRows = multiEmployeeReports.map((r) => ({
      "Employee Code": r.employee.employeeCode,
      "Employee Name": r.employee.fullName,
      Department: r.employee.departmentName || "",
      Branch: r.employee.branchName || "",
      "Active Days": r.activeDays,
      "Office Days": r.officeDays,
      "WFH Days": r.wfhDays,
      "Field Days": r.fieldDays,
      "Attendance Hours": Number((r.totalAttMinutes / 60).toFixed(2)),
      "Logged Hours": Number((r.totalLogMinutes / 60).toFixed(2)),
      "Log Entries": r.logEntriesCount,
      "Completed Tasks": r.completedTasksCount,
    }));

    const allDetailRows = multiEmployeeReports.flatMap((r) =>
      r.rawLogs.map((l) => ({
        "Employee Code": r.employee.employeeCode,
        "Employee Name": r.employee.fullName,
        Department: r.employee.departmentName || "",
        Date: l.date,
        "Time Range": `${l.startTime} - ${l.endTime}`,
        "Duration (Hrs)": Number(((l.durationMinutes || 0) / 60).toFixed(2)),
        "Work Mode": l.workMode,
        Category: l.taskCategory,
        Title: l.title,
        Description: l.description,
        Status: l.status,
      }))
    );

    const deptTag = reportDeptFilter === "ALL" ? "All_Departments" : reportDeptFilter.replace(/\s+/g, "_").slice(0, 24);
    exportMultiSheetExcel(
      `Department_WorkLog_Report_${deptTag}_${reportDateRange.start}_${reportDateRange.end}`,
      [
        { name: "Staff_Summary", rows: comparisonRows.length ? comparisonRows : [{ Info: "No staff records" }] },
        { name: "All_Work_Logs", rows: allDetailRows.length ? allDetailRows : [{ Info: "No work logs in period" }] },
      ]
    );
  };

  // ==========================================================
  // UI HELPERS
  // ==========================================================
  const renderWorkModeBadge = (mode: DailyWorkLog["workMode"]) => {
    if (mode === "WORK_FROM_HOME") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-500/30">
          <Home className="w-3 h-3" />
          {isBangla ? "হোম অফিস (WFH)" : "WFH"}
        </span>
      );
    }
    if (mode === "FIELD") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/30">
          <MapPin className="w-3 h-3" />
          {isBangla ? "ফিল্ড ওয়ার্ক" : "Field"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/30">
        <Building2 className="w-3 h-3" />
        {isBangla ? "অফিস" : "Office"}
      </span>
    );
  };

  const renderStatusBadge = (st: DailyWorkLog["status"]) => {
    if (st === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          <CheckCircle2 className="w-3 h-3" />
          {isBangla ? "সম্পন্ন" : "Completed"}
        </span>
      );
    }
    if (st === "BLOCKED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
          {isBangla ? "আটকে আছে" : "Blocked"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
        {isBangla ? "চলমান" : "In Progress"}
      </span>
    );
  };

  const getManagerName = (managerId?: string) => {
    if (!managerId) return null;
    const mgr = employees.find((e) => e.id === managerId);
    return mgr ? mgr.fullName : null;
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Top Sub-Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-600/10 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isBangla ? "দৈনিক কাজের লগ ও ডিপার্টমেন্ট রিপোর্ট" : "Daily Work Logs & Department Reports"}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {isSuperAdminViewer
                  ? isBangla
                    ? "সুপার অ্যাডমিন ভিউ — সকল ডিপার্টমেন্টের প্রত্যেক কর্মীর দৈনিক লগ ও রিপোর্ট পর্যবেক্ষণ করুন"
                    : "Super Admin View — Inspect every department and individual employee daily logs & reports"
                  : isGlobalViewer
                  ? isBangla
                    ? "সিইও / এইচআর ভিউ — আপনার অধীনস্থ সকল ডিপার্টমেন্টের কর্মীদের দৈনিক লগ ও রিপোর্ট পর্যবেক্ষণ করুন (ঊর্ধ্বতন কর্মকর্তাদের লগ সুরক্ষিত)"
                    : "Executive / HR View — Inspect subordinate departmental daily logs & reports (superiors remain private)"
                  : isBranchManager
                  ? isBangla
                    ? "ব্রাঞ্চ ম্যানেজার ভিউ — শুধুমাত্র আপনার শাখার অধীনস্থ কর্মীদের দৈনিক লগ দেখুন (ঊর্ধ্বতন কর্মকর্তাদের লগ সুরক্ষিত)"
                    : "Branch Manager View — View only subordinate staff daily logs in your branch (superiors hidden)"
                  : isTeamManager
                  ? isBangla
                    ? "টিম ম্যানেজার ভিউ — শুধুমাত্র আপনার অধীনস্থ টিম মেম্বারদের দৈনিক লগ দেখুন (ঊর্ধ্বতন বা অন্য টিমের লগ দেখা যাবে না)"
                    : "Team Manager View — View strictly your direct & indirect subordinates' logs (never superiors or other teams)"
                  : isBangla
                  ? "আপনার নিজস্ব দৈনিক কাজের বিবরণ সংরক্ষণ ও রিপোর্ট ডাউনলোড করুন (অন্য কারো ডেইলি লগ দেখার অনুমতি নেই)"
                  : "Record your own daily work activities and export personal reports (strictly private)"}
              </p>
            </div>
          </div>

          {/* Spacious Segmented Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveSubTab("MY_LOG")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeSubTab === "MY_LOG"
                  ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <User className="w-4 h-4" />
              <span>{isBangla ? "আমার দৈনিক লগ" : "My Daily Log"}</span>
            </button>

            {canViewTeamLogs && (
              <button
                type="button"
                onClick={() => setActiveSubTab("TEAM_LOGS")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeSubTab === "TEAM_LOGS"
                    ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>
                  {isGlobalViewer
                    ? isBangla
                      ? "ডিপার্টমেন্ট ও কর্মীদের লগ"
                      : "Department & Staff Logs"
                    : isBangla
                    ? "অধীনস্থ টিমের লগ"
                    : "Subordinates' Logs"}
                </span>
                <span className="ml-0.5 px-1.5 py-0.5 text-xs rounded-md bg-teal-600/10 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 tabular-nums">
                  {teamDirectoryEmployees.length}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveSubTab("REPORTS")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeSubTab === "REPORTS"
                  ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{isBangla ? "রিপোর্ট ও এক্সেল" : "Reports & Excel"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: MY DAILY LOG                                                   */}
      {/* ===================================================================== */}
      {activeSubTab === "MY_LOG" && (
        <div className="space-y-6">
          {/* Today's Biometric Attendance Banner + Monthly KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isBangla ? "আজকের বায়োমেট্রিক হাজিরা" : "Today's Attendance"}
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                  {todayAttendance?.checkInTime
                    ? `${todayAttendance.checkInTime}${todayAttendance.checkOutTime ? ` → ${todayAttendance.checkOutTime}` : ""}`
                    : isBangla
                    ? "এখনো পাঞ্চ নেই"
                    : "Not punched"}
                </span>
                <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isBangla ? "এই মাসে মোট লগ এন্ট্রি" : "Monthly Log Entries"}
              </div>
              <div className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {myMonthlyStats.count}
                <span className="text-xs font-normal text-slate-500 ml-2">
                  ({myMonthlyStats.uniqueDays} {isBangla ? "দিন" : "days"})
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isBangla ? "মাসিক লগকৃত কর্মঘণ্টা" : "Monthly Logged Hours"}
              </div>
              <div className="mt-1.5 text-2xl font-bold text-teal-600 dark:text-teal-400 tabular-nums">
                {formatMinsToHrs(myMonthlyStats.totalMinutes, isBangla)}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isBangla ? "অফিস / WFH / ফিল্ড বিভাজন" : "Office / WFH / Field"}
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-sm font-bold tabular-nums">
                <span className="text-emerald-600 dark:text-emerald-400">
                  {myMonthlyStats.officeDays} {isBangla ? "অফিস" : "Off"}
                </span>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {myMonthlyStats.wfhDays} WFH
                </span>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {myMonthlyStats.fieldDays} {isBangla ? "ফিল্ড" : "Fld"}
                </span>
              </div>
            </div>
          </div>

          {/* Entry Form + Personal History Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form */}
            <form
              onSubmit={handleSubmitLog}
              className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 h-fit"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-teal-600" />
                  {editingLogId
                    ? isBangla
                      ? "ডেইলি লগ এডিট করুন"
                      : "Edit Daily Log"
                    : isBangla
                    ? "নতুন দৈনিক কাজের লগ লিখুন"
                    : "Add Daily Work Log"}
                </h2>
                {editingLogId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    {isBangla ? "বাতিল" : "Cancel"}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "তারিখ" : "Date"}
                  </label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "কাজের ধরন (Work Mode)" : "Work Mode"}
                  </label>
                  <select
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value as DailyWorkLog["workMode"])}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="OFFICE">{isBangla ? "অফিস (In-Office)" : "In-Office"}</option>
                    <option value="WORK_FROM_HOME">{isBangla ? "হোম অফিস (WFH)" : "Work From Home"}</option>
                    <option value="FIELD">{isBangla ? "ফিল্ড / বাইরের কাজ" : "Field Work"}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "শুরু" : "Start"}
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "শেষ" : "End"}
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div className="rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200/70 dark:border-teal-500/30 px-3 py-2 text-center">
                  <div className="text-[11px] text-teal-700 dark:text-teal-300">
                    {isBangla ? "মোট সময়" : "Duration"}
                  </div>
                  <div className="text-sm font-bold text-teal-800 dark:text-teal-200 tabular-nums">
                    {formatMinsToHrs(calcDurationMinutes(startTime, endTime), isBangla)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "ক্যাটাগরি" : "Category"}
                  </label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    {WORK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "প্রজেক্ট (ঐচ্ছিক)" : "Project (Optional)"}
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="">{isBangla ? "— সাধারণ কাজ —" : "— General Work —"}</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isBangla ? "কাজের শিরোনাম *" : "Work Title *"}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isBangla ? "আজ কী কাজ সম্পন্ন করেছেন..." : "What did you work on today..."}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isBangla ? "বিস্তারিত বিবরণ" : "Detailed Description"}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isBangla ? "কাজের ফলাফল, অগ্রগতি বা কোনো নোট লিখুন..." : "Outcome, progress notes, or blockers..."}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "অবস্থা (Status)" : "Status"}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DailyWorkLog["status"])}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="COMPLETED">{isBangla ? "সম্পন্ন (Completed)" : "Completed"}</option>
                    <option value="IN_PROGRESS">{isBangla ? "চলমান (In Progress)" : "In Progress"}</option>
                    <option value="BLOCKED">{isBangla ? "আটকে আছে (Blocked)" : "Blocked"}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "কাজের লিংক (ঐচ্ছিক)" : "Deliverable URL (Optional)"}
                  </label>
                  <input
                    type="url"
                    value={deliverableLink}
                    onChange={(e) => setDeliverableLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {editingLogId
                  ? isBangla
                    ? "পরিবর্তন সংরক্ষণ করুন"
                    : "Save Changes"
                  : isBangla
                  ? "ডেইলি লগ সাবমিট করুন"
                  : "Submit Daily Log"}
              </button>
            </form>

            {/* Personal History List */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {isBangla ? "আমার সংরক্ষিত ডেইলি লগসমূহ" : "My Recorded Work Logs"}
                  <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 tabular-nums">
                    {myFilteredLogs.length}
                  </span>
                </h2>
                <div className="flex items-center gap-2">
                  <input
                    type="month"
                    value={myMonthFilter}
                    onChange={(e) => setMyMonthFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={mySearchQuery}
                      onChange={(e) => setMySearchQuery(e.target.value)}
                      placeholder={isBangla ? "খুঁজুন..." : "Search..."}
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white w-40"
                    />
                  </div>
                </div>
              </div>

              {myFilteredLogs.length === 0 ? (
                <div className="py-12 text-center">
                  <ClipboardList className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {isBangla ? "এই মাসে আপনার কোনো ডেইলি লগ পাওয়া যায়নি।" : "No work logs recorded for this month."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
                  {myFilteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-teal-300 dark:hover:border-teal-700 transition-colors"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                              {log.date}
                            </span>
                            <span>•</span>
                            <span className="tabular-nums">
                              {log.startTime} - {log.endTime} ({formatMinsToHrs(log.durationMinutes, isBangla)})
                            </span>
                            {renderWorkModeBadge(log.workMode)}
                            {renderStatusBadge(log.status)}
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{log.title}</h3>
                          {log.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                              {log.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700/60">
                              {log.taskCategory}
                            </span>
                            {log.projectName && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300">
                                <Briefcase className="w-3 h-3" />
                                {log.projectName}
                              </span>
                            )}
                            {log.deliverableLink && (
                              <a
                                href={log.deliverableLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline font-medium"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {isBangla ? "ডেলিভারেবল লিংক" : "Deliverable"}
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditLog(log)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-white dark:hover:bg-slate-800"
                            title={isBangla ? "এডিট" : "Edit"}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteWorkLog(log.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800"
                            title={isBangla ? "মুছে ফেলুন" : "Delete"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: TEAM & DEPARTMENT EMPLOYEE DAILY LOGS                          */}
      {/* ===================================================================== */}
      {activeSubTab === "TEAM_LOGS" && canViewTeamLogs && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                <Filter className="w-4 h-4 text-teal-600" />
                {isGlobalViewer
                  ? isBangla
                    ? "ডিপার্টমেন্ট ও কর্মী ফিল্টার (সুপার অ্যাডমিন / এইচআর)"
                    : "Department & Employee Filter (Super Admin / HR)"
                  : isBangla
                  ? "আমার টিম ও ডিপার্টমেন্ট ফিল্টার"
                  : "My Team & Department Filter"}
              </div>

              {/* View Style Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTeamViewStyle("BY_EMPLOYEE")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    teamViewStyle === "BY_EMPLOYEE"
                      ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  {isBangla ? "কর্মীভিত্তিক (আলাদা আলাদা)" : "By Employee"}
                </button>
                <button
                  type="button"
                  onClick={() => setTeamViewStyle("FEED")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    teamViewStyle === "FEED"
                      ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  {isBangla ? "সকল লগ ফিড" : "All Logs Feed"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Department Selector */}
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {isBangla ? "ডিপার্টমেন্ট" : "Department"}
                </label>
                <select
                  value={teamDeptFilter}
                  onChange={(e) => setTeamDeptFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
                >
                  <option value="ALL">
                    {isBangla
                      ? `সকল ডিপার্টমেন্ট (${availableDepartments.length})`
                      : `All Departments (${availableDepartments.length})`}
                  </option>
                  {availableDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Selector (Global viewers) */}
              {isGlobalViewer && availableBranches.length > 1 && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {isBangla ? "শাখা (Branch)" : "Branch"}
                  </label>
                  <select
                    value={teamBranchFilter}
                    onChange={(e) => setTeamBranchFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value="ALL">{isBangla ? "সকল শাখা" : "All Branches"}</option>
                    {availableBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Time Scope */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {isBangla ? "সময়কাল" : "Time Scope"}
                </label>
                <select
                  value={teamDateMode}
                  onChange={(e) => setTeamDateMode(e.target.value as "MONTH" | "DAY" | "ALL")}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
                >
                  <option value="MONTH">{isBangla ? "মাসভিত্তিক" : "By Month"}</option>
                  <option value="DAY">{isBangla ? "নির্দিষ্ট তারিখ" : "Specific Date"}</option>
                  <option value="ALL">{isBangla ? "সকল তারিখ" : "All Time"}</option>
                </select>
              </div>

              {/* Month or Date Picker */}
              {teamDateMode !== "ALL" && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {teamDateMode === "MONTH"
                      ? isBangla
                        ? "মাস নির্বাচন"
                        : "Select Month"
                      : isBangla
                      ? "তারিখ নির্বাচন"
                      : "Select Date"}
                  </label>
                  {teamDateMode === "MONTH" ? (
                    <input
                      type="month"
                      value={teamMonthFilter}
                      onChange={(e) => setTeamMonthFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
                    />
                  ) : (
                    <input
                      type="date"
                      value={teamSpecificDate}
                      onChange={(e) => setTeamSpecificDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
                    />
                  )}
                </div>
              )}

              {/* Search Employee */}
              <div className={isGlobalViewer && availableBranches.length > 1 ? "" : "lg:col-span-2"}>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {isBangla ? "কর্মী খুঁজুন" : "Search Employee"}
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={teamSearchQuery}
                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                    placeholder={isBangla ? "নাম, কোড বা পদবী..." : "Name, code, role..."}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Quick Work Mode Chips + Summary Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5">
                {(["ALL", "OFFICE", "WORK_FROM_HOME", "FIELD"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTeamWorkModeFilter(m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      teamWorkModeFilter === m
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {m === "ALL"
                      ? isBangla
                        ? "সব মোড"
                        : "All Modes"
                      : m === "OFFICE"
                      ? isBangla
                        ? "অফিস"
                        : "Office"
                      : m === "WORK_FROM_HOME"
                      ? "WFH"
                      : isBangla
                      ? "ফিল্ড"
                      : "Field"}
                  </button>
                ))}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {isBangla ? "মোট কর্মী:" : "Staff:"}{" "}
                <strong className="text-slate-900 dark:text-white">{sortedTeamEmployees.length}</strong> •{" "}
                {isBangla ? "মোট লগ এন্ট্রি:" : "Log Entries:"}{" "}
                <strong className="text-teal-700 dark:text-teal-400">{teamPeriodFilteredLogs.length}</strong>
              </div>
            </div>
          </div>

          {/* VIEW STYLE 1: BY EMPLOYEE (SPLIT MASTER-DETAIL) */}
          {teamViewStyle === "BY_EMPLOYEE" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Panel: Employee Directory */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[760px]">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                    {isBangla ? "কর্মীদের তালিকা (ক্লিক করুন)" : "Employees Directory (Click to Inspect)"}
                  </span>
                  <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 tabular-nums">
                    {sortedTeamEmployees.length}
                  </span>
                </div>

                {sortedTeamEmployees.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    {isBangla ? "কোনো কর্মী পাওয়া যায়নি।" : "No employees match current filters."}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1">
                    {sortedTeamEmployees.map((emp) => {
                      const sum = employeeLogSummaries.get(emp.id) || {
                        count: 0,
                        totalMinutes: 0,
                        lastDate: "",
                        uniqueDays: 0,
                        logs: [],
                      };
                      const isSelected = emp.id === inspectedEmployeeId;
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => setInspectedEmployeeId(emp.id)}
                          className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between gap-3 ${
                            isSelected
                              ? "bg-teal-50/90 dark:bg-teal-500/15 border-l-4 border-teal-600"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {emp.avatarUrl ? (
                              <img
                                src={emp.avatarUrl}
                                alt={emp.fullName}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-teal-600/15 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
                                {(emp.fullName || "?").slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {emp.fullName}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {emp.employeeCode} • {emp.departmentName || (isBangla ? "ডিপার্টমেন্ট নেই" : "No Dept")}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-[11px] tabular-nums">
                                <span
                                  className={`px-1.5 py-0.5 rounded font-semibold ${
                                    sum.count > 0
                                      ? "bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300"
                                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                  }`}
                                >
                                  {sum.count} {isBangla ? "লগ" : "logs"}
                                </span>
                                {sum.totalMinutes > 0 && (
                                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                                    {formatMinsToHrs(sum.totalMinutes, isBangla)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? "text-teal-600 dark:text-teal-400" : "text-slate-300 dark:text-slate-600"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Panel: Selected Employee's Individual Daily Work Logs */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5">
                {!inspectedEmployee || !inspectedEmployeeSummary ? (
                  <div className="py-16 text-center text-slate-500 dark:text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">
                      {isBangla ? "বাম পাশ থেকে যেকোনো কর্মী নির্বাচন করুন।" : "Select an employee from the left to inspect their daily logs."}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Employee Profile & Action Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3.5">
                        {inspectedEmployee.avatarUrl ? (
                          <img
                            src={inspectedEmployee.avatarUrl}
                            alt={inspectedEmployee.fullName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-teal-500/30"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-teal-600/15 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-base">
                            {(inspectedEmployee.fullName || "?").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                              {inspectedEmployee.fullName}
                            </h2>
                            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {inspectedEmployee.employeeCode}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {inspectedEmployee.designationTitle} • {inspectedEmployee.departmentName}
                            {inspectedEmployee.branchName ? ` • ${inspectedEmployee.branchName}` : ""}
                          </div>
                          {getManagerName(inspectedEmployee.reportingManagerId) && (
                            <div className="text-[11px] text-teal-700 dark:text-teal-400 mt-0.5 font-medium">
                              {isBangla ? "রিপোর্টিং ম্যানেজার:" : "Reporting Manager:"}{" "}
                              {getManagerName(inspectedEmployee.reportingManagerId)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReportEmployeeId(inspectedEmployee.id);
                            if (teamDateMode === "MONTH") {
                              setReportPeriod("MONTHLY");
                              setReportMonth(teamMonthFilter);
                            }
                            setActiveSubTab("REPORTS");
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          {isBangla ? "পূর্ণাঙ্গ রিপোর্ট দেখুন" : "View Full Report"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportIndividualExcel(inspectedEmployee)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold transition-colors"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          {isBangla ? "এক্সেল (.xlsx)" : "Excel (.xlsx)"}
                        </button>
                      </div>
                    </div>

                    {/* Quick KPI Strip for Inspected Employee */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 p-3">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isBangla ? "লগ এন্ট্রি সংখ্যা" : "Log Entries"}
                        </div>
                        <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                          {inspectedEmployeeSummary.count}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 p-3">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isBangla ? "মোট কর্মঘণ্টা" : "Total Logged Hours"}
                        </div>
                        <div className="text-xl font-bold text-teal-600 dark:text-teal-400 tabular-nums mt-0.5">
                          {formatMinsToHrs(inspectedEmployeeSummary.totalMinutes, isBangla)}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 p-3">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isBangla ? "লগকৃত দিন" : "Active Log Days"}
                        </div>
                        <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                          {inspectedEmployeeSummary.uniqueDays}
                        </div>
                      </div>
                    </div>

                    {/* Individual Employee's Logs List */}
                    {inspectedEmployeeSummary.logs.length === 0 ? (
                      <div className="py-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        <Calendar className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                          {isBangla
                            ? "নির্বাচিত সময়কালে এই কর্মীর কোনো ডেইলি লগ জমা হয়নি।"
                            : "No daily work logs submitted by this employee in the selected period."}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                        {inspectedEmployeeSummary.logs.map((log) => {
                          const att = attendanceMap.get(`${log.employeeId}_${log.date}`);
                          return (
                            <div
                              key={log.id}
                              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                                    {log.date}
                                  </span>
                                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                                    {log.startTime} – {log.endTime} ({formatMinsToHrs(log.durationMinutes, isBangla)})
                                  </span>
                                  {renderWorkModeBadge(log.workMode)}
                                  {renderStatusBadge(log.status)}
                                </div>

                                {att && (
                                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 tabular-nums">
                                    {isBangla ? "হাজিরা:" : "Punch:"} {att.checkInTime || "-"}
                                    {att.checkOutTime ? ` → ${att.checkOutTime}` : ""}
                                  </span>
                                )}
                              </div>

                              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{log.title}</h3>
                              {log.description && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                                  {log.description}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                                <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                                  {log.taskCategory}
                                </span>
                                {log.projectName && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300">
                                    <Briefcase className="w-3 h-3" />
                                    {log.projectName}
                                  </span>
                                )}
                                {log.deliverableLink && (
                                  <a
                                    href={log.deliverableLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline font-medium"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    {isBangla ? "ডেলিভারেবল দেখুন" : "View Deliverable"}
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            /* VIEW STYLE 2: CHRONOLOGICAL FEED ACROSS FILTERED STAFF */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              {teamPeriodFilteredLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">
                    {isBangla ? "নির্বাচিত ফিল্টারে কোনো ডেইলি লগ পাওয়া যায়নি।" : "No work logs found for the selected filters."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamPeriodFilteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {log.employeeName}
                          </span>
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {log.employeeCode}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {log.departmentName}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                            • {log.date} ({log.startTime}-{log.endTime}, {formatMinsToHrs(log.durationMinutes, isBangla)})
                          </span>
                          {renderWorkModeBadge(log.workMode)}
                          {renderStatusBadge(log.status)}
                        </div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {log.title}
                        </div>
                        {log.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">
                            {log.description}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setInspectedEmployeeId(log.employeeId);
                          setTeamViewStyle("BY_EMPLOYEE");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-500 text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5 text-teal-600" />
                        {isBangla ? "এই কর্মীর সব লগ" : "Inspect Employee"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: REPORTS & EXCEL EXPORT                                         */}
      {/* ===================================================================== */}
      {activeSubTab === "REPORTS" && (
        <div className="space-y-6">
          {/* Report Controls Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-teal-600" />
                  {isBangla ? "সমন্বিত ডেইলি লগ ও হাজিরা রিপোর্ট" : "Combined Work Log & Attendance Report"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBangla
                    ? `রিপোর্টের সময়কাল: ${reportDateRange.start} থেকে ${reportDateRange.end}`
                    : `Report Range: ${reportDateRange.start} to ${reportDateRange.end}`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportIndividualExcel(selectedReportEmployee)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {isBangla ? "নির্বাচিত কর্মীর এক্সেল (.xlsx)" : "Individual Excel (.xlsx)"}
                </button>
                {canViewTeamLogs && (
                  <button
                    type="button"
                    onClick={handleExportTeamSummaryExcel}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    {isBangla ? "ডিপার্টমেন্ট / টিম সামারি এক্সেল (.xlsx)" : "Dept / Team Summary Excel (.xlsx)"}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Period Type */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {isBangla ? "রিপোর্টের ধরন" : "Report Period"}
                </label>
                <select
                  value={reportPeriod}
                  onChange={(e) =>
                    setReportPeriod(e.target.value as "MONTHLY" | "SEMI_ANNUAL" | "ANNUAL" | "CUSTOM")
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
                >
                  <option value="MONTHLY">{isBangla ? "মাসিক (Monthly)" : "Monthly"}</option>
                  <option value="SEMI_ANNUAL">{isBangla ? "বিগত ৬ মাস (6-Month)" : "Last 6 Months"}</option>
                  <option value="ANNUAL">{isBangla ? "বাৎসরিক (Annual)" : "Annual"}</option>
                  <option value="CUSTOM">{isBangla ? "কাস্টম তারিখ" : "Custom Date Range"}</option>
                </select>
              </div>

              {/* Dynamic Date Picker */}
              {reportPeriod === "MONTHLY" && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {isBangla ? "মাস" : "Month"}
                  </label>
                  <input
                    type="month"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {reportPeriod === "ANNUAL" && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {isBangla ? "বছর" : "Year"}
                  </label>
                  <input
                    type="number"
                    min={2020}
                    max={2035}
                    value={reportYear}
                    onChange={(e) => setReportYear(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {reportPeriod === "CUSTOM" && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      {isBangla ? "শুরুর তারিখ" : "Start Date"}
                    </label>
                    <input
                      type="date"
                      value={reportCustomStart}
                      onChange={(e) => setReportCustomStart(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      {isBangla ? "শেষের তারিখ" : "End Date"}
                    </label>
                    <input
                      type="date"
                      value={reportCustomEnd}
                      onChange={(e) => setReportCustomEnd(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              {canViewTeamLogs && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {isBangla ? "ডিপার্টমেন্ট ফিল্টার" : "Department Filter"}
                  </label>
                  <select
                    value={reportDeptFilter}
                    onChange={(e) => setReportDeptFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value="ALL">{isBangla ? "সকল ডিপার্টমেন্ট" : "All Departments"}</option>
                    {availableDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {canViewTeamLogs && (
                <div className={reportPeriod === "CUSTOM" ? "sm:col-span-2 lg:col-span-1" : "lg:col-span-2"}>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {isBangla ? "বিস্তারিত রিপোর্টের জন্য কর্মী নির্বাচন" : "Select Employee for Detailed Report"}
                  </label>
                  <select
                    value={reportEmployeeId}
                    onChange={(e) => setReportEmployeeId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    {reportDepartmentEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.employeeCode}) — {emp.departmentName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* DEPARTMENT / TEAM SUMMARY TABLE (FOR MANAGERS & SUPER ADMIN) */}
          {canViewTeamLogs && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isBangla
                      ? "ডিপার্টমেন্ট / টিম সামারি তুলনামূলক রিপোর্ট (কর্মীর উপর ক্লিক করে বিস্তারিত দেখুন)"
                      : "Department / Team Comparison Report (Click any employee row to view detailed timeline)"}
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                  {multiEmployeeReports.length} {isBangla ? "জন কর্মী" : "employees"}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3">{isBangla ? "কর্মী" : "Employee"}</th>
                      <th className="px-4 py-3">{isBangla ? "ডিপার্টমেন্ট" : "Department"}</th>
                      <th className="px-3 py-3 text-right">{isBangla ? "সক্রিয় দিন" : "Active Days"}</th>
                      <th className="px-3 py-3 text-center">{isBangla ? "অফিস / WFH / ফিল্ড" : "Off / WFH / Fld"}</th>
                      <th className="px-3 py-3 text-right">{isBangla ? "হাজিরা ঘণ্টা" : "Att. Hrs"}</th>
                      <th className="px-3 py-3 text-right">{isBangla ? "লগকৃত ঘণ্টা" : "Logged Hrs"}</th>
                      <th className="px-3 py-3 text-right">{isBangla ? "লগ এন্ট্রি" : "Entries"}</th>
                      <th className="px-3 py-3 text-right">{isBangla ? "সম্পন্ন টাস্ক" : "Tasks Done"}</th>
                      <th className="px-4 py-3 text-right">{isBangla ? "অ্যাকশন" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {multiEmployeeReports.map((row) => {
                      const isActiveRow = row.employee.id === selectedReportEmployee.id;
                      return (
                        <tr
                          key={row.employee.id}
                          onClick={() => setReportEmployeeId(row.employee.id)}
                          className={`cursor-pointer transition-colors ${
                            isActiveRow
                              ? "bg-teal-50/80 dark:bg-teal-500/15"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          }`}
                        >
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            <div>{row.employee.fullName}</div>
                            <div className="text-[11px] font-mono font-normal text-slate-500">
                              {row.employee.employeeCode}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                            {row.employee.departmentName || "-"}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                            {row.activeDays}
                          </td>
                          <td className="px-3 py-3 text-center tabular-nums">
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{row.officeDays}</span>
                            {" / "}
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{row.wfhDays}</span>
                            {" / "}
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">{row.fieldDays}</span>
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                            {formatMinsToHrs(row.totalAttMinutes, isBangla)}
                          </td>
                          <td className="px-3 py-3 text-right font-bold tabular-nums text-teal-700 dark:text-teal-400">
                            {formatMinsToHrs(row.totalLogMinutes, isBangla)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums font-semibold">
                            {row.logEntriesCount}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                            {row.completedTasksCount}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportEmployeeId(row.employee.id);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                                isActiveRow
                                  ? "bg-teal-600 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-teal-600 hover:text-white"
                              }`}
                            >
                              {isBangla ? "বিস্তারিত" : "Inspect"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SELECTED EMPLOYEE KPI CARDS */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isBangla ? "নির্বাচিত কর্মীর বিস্তারিত রিপোর্ট:" : "Detailed Report For:"}{" "}
                <span className="text-teal-700 dark:text-teal-400">
                  {selectedReportEmployee.fullName} ({selectedReportEmployee.employeeCode})
                </span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {selectedReportEmployee.departmentName}
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {isBangla ? "সক্রিয় কর্মদিবস" : "Active Days"}
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                  {selectedEmployeeReport.activeDays}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {isBangla ? "অফিস / WFH / ফিল্ড" : "Office / WFH / Field"}
                </div>
                <div className="text-lg font-bold tabular-nums mt-1.5">
                  <span className="text-emerald-600 dark:text-emerald-400">{selectedEmployeeReport.officeDays}</span>
                  {" / "}
                  <span className="text-indigo-600 dark:text-indigo-400">{selectedEmployeeReport.wfhDays}</span>
                  {" / "}
                  <span className="text-amber-600 dark:text-amber-400">{selectedEmployeeReport.fieldDays}</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {isBangla ? "মোট হাজিরা ঘণ্টা" : "Attendance Hours"}
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                  {formatMinsToHrs(selectedEmployeeReport.totalAttMinutes, isBangla)}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {isBangla ? "মোট লগকৃত ঘণ্টা" : "Logged Work Hours"}
                </div>
                <div className="text-xl font-bold text-teal-600 dark:text-teal-400 tabular-nums mt-1">
                  {formatMinsToHrs(selectedEmployeeReport.totalLogMinutes, isBangla)}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {isBangla ? "সম্পন্নকৃত টাস্ক" : "Tasks Completed"}
                </div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                  {selectedEmployeeReport.completedTasksCount}
                </div>
              </div>
            </div>
          </div>

          {/* DAY-BY-DAY COMBINED TIMELINE TABLE */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isBangla ? "দিনভিত্তিক সমন্বিত হাজিরা ও ডেইলি লগ টাইমলাইন" : "Day-by-Day Combined Attendance & Work Log Timeline"}
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {selectedEmployeeReport.timeline.length} {isBangla ? "দিন" : "days"}
              </span>
            </div>

            {selectedEmployeeReport.timeline.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                {isBangla
                  ? "নির্বাচিত সময়কালে এই কর্মীর কোনো হাজিরা বা ডেইলি লগ রেকর্ড পাওয়া যায়নি।"
                  : "No attendance or work log records found for this employee in the selected period."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3">{isBangla ? "তারিখ" : "Date"}</th>
                      <th className="px-4 py-3">{isBangla ? "হাজিরা (In → Out)" : "Attendance"}</th>
                      <th className="px-3 py-3 text-right">{isBangla ? "হাজিরা সময়" : "Att. Hrs"}</th>
                      <th className="px-4 py-3">{isBangla ? "কাজের মোড" : "Work Mode"}</th>
                      <th className="px-4 py-3">{isBangla ? "দৈনিক কাজের বিবরণ" : "Daily Work Log Entries"}</th>
                      <th className="px-3 py-3 text-right">{isBangla ? "লগ সময়" : "Logged Hrs"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {selectedEmployeeReport.timeline.map((day) => (
                      <tr key={day.date} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                          {day.date}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {day.attendance ? (
                            <div className="space-y-0.5">
                              <span className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                                {day.attendance.checkInTime || "-"}
                                {day.attendance.checkOutTime ? ` → ${day.attendance.checkOutTime}` : ""}
                              </span>
                              <div className="text-[10px] text-slate-500">{day.attendance.status}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400">{isBangla ? "পাঞ্চ নেই" : "No punch"}</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {formatMinsToHrs(day.attMinutes, isBangla)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {day.primaryMode === "ATTENDANCE_ONLY" ? (
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px]">
                              {isBangla ? "শুধু হাজিরা" : "Attendance Only"}
                            </span>
                          ) : (
                            renderWorkModeBadge(day.primaryMode)
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {day.logs.length === 0 ? (
                            <span className="text-slate-400 italic">
                              {isBangla ? "কোনো লগ জমা দেওয়া হয়নি" : "No log submitted"}
                            </span>
                          ) : (
                            <div className="space-y-1.5">
                              {day.logs.map((l) => (
                                <div key={l.id} className="leading-snug">
                                  <span className="font-semibold text-slate-900 dark:text-white">
                                    {l.title}
                                  </span>{" "}
                                  <span className="text-slate-500 tabular-nums">
                                    ({l.startTime}-{l.endTime})
                                  </span>
                                  {l.description && (
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                      {l.description}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-bold tabular-nums text-teal-700 dark:text-teal-400 whitespace-nowrap">
                          {formatMinsToHrs(day.logMinutes, isBangla)}
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
    </div>
  );
};
