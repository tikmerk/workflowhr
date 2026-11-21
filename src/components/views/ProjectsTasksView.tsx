import React, { useState, useMemo, useEffect } from "react";
import {
  FolderKanban,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Layers,
  Building2,
  Calendar,
  Trash2,
  UserCheck,
  CheckSquare,
  X,
  Play,
  Send,
  Paperclip,
  Link2,
  MessageSquare,
  RotateCcw,
  ExternalLink,
  Download,
  BarChart3,
  Award,
  AlertTriangle,
  Globe,
  MapPin,
  Briefcase,
  FileSpreadsheet,
  Timer,
} from "lucide-react";
import {
  Project,
  ProjectTask,
  Employee,
  Branch,
  Department,
  SystemNotification,
  TaskAttachment,
  TaskComment,
} from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { exportMultiSheetExcel } from "../../utils/exportUtils";

interface ProjectsTasksViewProps {
  projects: Project[];
  tasks: ProjectTask[];
  employees: Employee[];
  branches?: Branch[];
  departments?: Department[];
  currentUser?: Employee;
  onAddProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onAddTask: (task: ProjectTask) => void;
  onUpdateTask?: (task: ProjectTask) => void;
  onUpdateTaskStatus: (taskId: string, status: ProjectTask["status"]) => void;
  onDeleteTask?: (taskId: string) => void;
  onSendNotification?: (notification: Omit<SystemNotification, "id" | "timestamp" | "read">) => void;
}

const formatDuration = (minutes?: number, isBangla = true): string => {
  if (!minutes || minutes <= 0) return isBangla ? "০ মিনিট" : "0m";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return isBangla ? `${mins} মিনিট` : `${mins}m`;
  if (mins === 0) return isBangla ? `${hrs} ঘণ্টা` : `${hrs}h`;
  return isBangla ? `${hrs} ঘণ্টা ${mins} মি.` : `${hrs}h ${mins}m`;
};

const getDeadlineDateTime = (task: ProjectTask): Date | null => {
  const dateStr = task.dueDate || task.deadline;
  if (!dateStr) return null;
  const timeStr = task.deadlineTime || "23:59";
  const parsed = new Date(`${dateStr}T${timeStr}:00`);
  return isNaN(parsed.getTime()) ? null : parsed;
};

export const ProjectsTasksView: React.FC<ProjectsTasksViewProps> = ({
  projects,
  tasks,
  employees,
  branches = [],
  departments = [],
  currentUser,
  onAddProject,
  onDeleteProject,
  onAddTask,
  onUpdateTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onSendNotification,
}) => {
  const { isBangla } = useThemeLanguage();

  // Role & Line Manager Detection
  const isSuperAdminOrCeo = (user?: Employee) => {
    if (!user) return false;
    return Boolean(
      user.role === "SUPER_ADMIN" ||
        user.role === "GRAND_ADMIN" ||
        user.isSuperAdmin ||
        user.role === "COMPANY_ADMIN" ||
        user.role === "CEO" ||
        user.isCeoOrOwner ||
        user.designationTitle?.toLowerCase().includes("ceo") ||
        user.designationTitle?.toLowerCase().includes("chief executive") ||
        user.designationTitle?.toLowerCase().includes("সিইও")
    );
  };

  const directReports = useMemo(() => {
    if (!currentUser) return [];
    return employees.filter((e) => e.reportingManagerId === currentUser.id && e.id !== currentUser.id);
  }, [employees, currentUser]);

  const canAssignTasks = useMemo(() => {
    if (!currentUser) return false;
    if (isSuperAdminOrCeo(currentUser)) return true;
    const role = String(currentUser.role || "").toUpperCase();
    const desig = String(currentUser.designationTitle || "").toLowerCase();
    if (
      role === "BRANCH_MANAGER" ||
      role === "HR_MANAGER" ||
      role === "PROJECT_MANAGER" ||
      role === "TEAM_LEADER" ||
      role === "ACCOUNTS_MANAGER" ||
      desig.includes("manager") ||
      desig.includes("lead") ||
      desig.includes("head") ||
      desig.includes("coordinator") ||
      desig.includes("ম্যানেজার") ||
      desig.includes("প্রধান")
    ) {
      return true;
    }
    return directReports.length > 0;
  }, [currentUser, directReports]);

  // Active sub-tab: board vs monthly analytics
  const [activeSubTab, setActiveSubTab] = useState<"BOARD" | "ANALYTICS">("BOARD");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [taskScopeFilter, setTaskScopeFilter] = useState<"ALL" | "MY_TASKS" | "ASSIGNED_BY_ME">("ALL");
  const [taskSearchTerm, setTaskSearchTerm] = useState<string>("");
  const [analyticsMonth, setAnalyticsMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  // Modals
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Active Status Tab for spacious non-cramped task view
  const [activeStatusTab, setActiveStatusTab] = useState<
    "ALL" | "TODO" | "IN_PROGRESS" | "REVIEW" | "REVISION_REQUESTED" | "DONE"
  >("ALL");

  // Submission & Revision Dialog states inside Task Workspace Modal
  const [showSubmitDialog, setShowSubmitDialog] = useState<boolean>(false);
  const [submissionComment, setSubmissionComment] = useState<string>("");
  const [submissionLink, setSubmissionLink] = useState<string>("");
  const [submissionFile, setSubmissionFile] = useState<{ name: string; url: string } | null>(null);
  const [submissionBanner, setSubmissionBanner] = useState<{
    type: "ON_TIME" | "LATE";
    message: string;
  } | null>(null);

  const [showRevisionBox, setShowRevisionBox] = useState<boolean>(false);
  const [revisionComment, setRevisionComment] = useState<string>("");
  const [newCommentText, setNewCommentText] = useState<string>("");

  // Live clock tick for active checked-in tasks (updates every 30s)
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  // New Project Form State
  const [newProjName, setNewProjName] = useState<string>("");
  const [newProjCode, setNewProjCode] = useState<string>(`PRJ-${Math.floor(Math.random() * 9000 + 1000)}`);
  const [newProjBranchId, setNewProjBranchId] = useState<string>(branches[0]?.id || "");
  const [newProjDeptId, setNewProjDeptId] = useState<string>(departments[0]?.id || "");
  const [newProjManagerId, setNewProjManagerId] = useState<string>(currentUser?.id || employees[0]?.id || "");
  const [newProjMembers, setNewProjMembers] = useState<string[]>([]);
  const [newProjStartDate, setNewProjStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [newProjDeadline, setNewProjDeadline] = useState<string>(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [newProjPriority, setNewProjPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("HIGH");
  const [newProjBudget, setNewProjBudget] = useState<number>(250000);
  const [newProjDesc, setNewProjDesc] = useState<string>("");

  // New Task Form State (Multi-Assignee + Attachments + Online/Physical)
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [newTaskType, setNewTaskType] = useState<"ONLINE" | "PHYSICAL" | "HYBRID">("ONLINE");
  const [newTaskProjId, setNewTaskProjId] = useState<string>("STANDALONE");
  const [newTaskAssigneeIds, setNewTaskAssigneeIds] = useState<string[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState<string>("");
  const [newTaskPriority, setNewTaskPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("HIGH");
  const [newTaskEstHours, setNewTaskEstHours] = useState<number>(4);
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [newTaskDueTime, setNewTaskDueTime] = useState<string>("17:00");
  const [newTaskDesc, setNewTaskDesc] = useState<string>("");
  const [newTaskAttachments, setNewTaskAttachments] = useState<TaskAttachment[]>([]);
  const [linkTitleInput, setLinkTitleInput] = useState<string>("");
  const [linkUrlInput, setLinkUrlInput] = useState<string>("");
  const [attachError, setAttachError] = useState<string | null>(null);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find((t) => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  // Sort employees for assignment picker: direct reports first, then same branch/dept, then others
  const assignableEmployees = useMemo(() => {
    const active = employees.filter((e) => !e.isExited && e.status !== "EXITED" && e.status !== "TERMINATED");
    const q = assigneeSearch.trim().toLowerCase();
    const filtered = active.filter((e) => {
      if (!q) return true;
      return (
        e.fullName.toLowerCase().includes(q) ||
        (e.employeeCode || "").toLowerCase().includes(q) ||
        (e.designationTitle || "").toLowerCase().includes(q) ||
        (e.departmentName || "").toLowerCase().includes(q)
      );
    });
    return filtered.sort((a, b) => {
      const aDirect = a.reportingManagerId === currentUser?.id ? 1 : 0;
      const bDirect = b.reportingManagerId === currentUser?.id ? 1 : 0;
      if (aDirect !== bDirect) return bDirect - aDirect;
      return a.fullName.localeCompare(b.fullName);
    });
  }, [employees, assigneeSearch, currentUser]);

  // Accessible projects
  const accessibleProjects = useMemo(() => {
    if (canAssignTasks) return projects;
    if (!currentUser) return [];
    return projects.filter((p) => {
      const isTeamMember =
        (p.teamMemberIds && p.teamMemberIds.includes(currentUser.id)) ||
        (p.teamMembers && p.teamMembers.some((m) => m.id === currentUser.id));
      const isManager = p.managerId === currentUser.id;
      const hasMyTask = tasks.some((t) => t.projectId === p.id && t.assignedToEmployeeId === currentUser.id);
      return isTeamMember || isManager || hasMyTask;
    });
  }, [projects, tasks, canAssignTasks, currentUser]);

  const filteredProjects = useMemo(() => {
    return accessibleProjects.filter((p) => {
      const matchBranch = selectedBranchId === "ALL" || p.branchId === selectedBranchId;
      const matchDept = selectedDeptId === "ALL" || p.departmentId === selectedDeptId;
      return matchBranch && matchDept;
    });
  }, [accessibleProjects, selectedBranchId, selectedDeptId]);

  // Filter tasks based on permissions & UI filters
  const visibleTasks = useMemo(() => {
    const isAdmin = isSuperAdminOrCeo(currentUser);
    return tasks.filter((t) => {
      if (currentUser && !isAdmin) {
        const isMyTask = t.assignedToEmployeeId === currentUser.id;
        const isAssignedByMe = t.assignedByEmployeeId === currentUser.id;
        const isMyDirectReport = directReports.some((r) => r.id === t.assignedToEmployeeId);
        const isBranchManagerOfTask =
          currentUser.role === "BRANCH_MANAGER" &&
          employees.find((e) => e.id === t.assignedToEmployeeId)?.branchId === currentUser.branchId;
        const isHr = currentUser.role === "HR_MANAGER";

        if (!isMyTask && !isAssignedByMe && !isMyDirectReport && !isBranchManagerOfTask && !isHr) {
          return false;
        }
      }

      if (taskScopeFilter === "MY_TASKS" && currentUser && t.assignedToEmployeeId !== currentUser.id) {
        return false;
      }
      if (taskScopeFilter === "ASSIGNED_BY_ME" && currentUser && t.assignedByEmployeeId !== currentUser.id) {
        return false;
      }

      if (selectedProjectId !== "ALL") {
        if (selectedProjectId === "STANDALONE") {
          if (t.projectId && t.projectId !== "STANDALONE" && t.projectId !== "proj-general") return false;
        } else if (t.projectId !== selectedProjectId) {
          return false;
        }
      }

      if (taskSearchTerm.trim()) {
        const q = taskSearchTerm.trim().toLowerCase();
        const match =
          t.title.toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          (t.assignedToName || "").toLowerCase().includes(q) ||
          (t.assignedByName || "").toLowerCase().includes(q) ||
          (t.projectName || "").toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [tasks, currentUser, directReports, employees, taskScopeFilter, selectedProjectId, taskSearchTerm]);

  // Summary counts
  const taskStats = useMemo(() => {
    const total = visibleTasks.length;
    const todo = visibleTasks.filter((t) => t.status === "TODO").length;
    const inProgress = visibleTasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "REVISION_REQUESTED").length;
    const inReview = visibleTasks.filter((t) => t.status === "REVIEW").length;
    const completed = visibleTasks.filter((t) => t.status === "DONE" || t.status === "COMPLETED").length;
    const late = visibleTasks.filter((t) => t.isLateSubmission).length;
    return { total, todo, inProgress, inReview, completed, late };
  }, [visibleTasks]);

  // Monthly Analytics Breakdown
  const monthlyAnalytics = useMemo(() => {
    const monthTasks = visibleTasks.filter((t) => {
      const refDate = t.completedAt || t.submittedAt || t.dueDate || t.createdAt || "";
      return refDate.slice(0, 7) === analyticsMonth;
    });

    const completed = monthTasks.filter((t) => t.status === "DONE" || t.status === "COMPLETED");
    const submittedOrDone = monthTasks.filter(
      (t) => t.status === "REVIEW" || t.status === "DONE" || t.status === "COMPLETED"
    );
    const lateCount = submittedOrDone.filter((t) => t.isLateSubmission).length;
    const onTimeCount = submittedOrDone.filter((t) => !t.isLateSubmission).length;
    const onTimeRate =
      submittedOrDone.length > 0 ? Math.round((onTimeCount / submittedOrDone.length) * 100) : 100;

    // Group by employee
    const byEmployeeMap = new Map<
      string,
      {
        employeeId: string;
        employeeName: string;
        employeeCode: string;
        departmentName: string;
        assigned: number;
        inProgress: number;
        inReview: number;
        completed: number;
        onTime: number;
        late: number;
        totalMinutes: number;
      }
    >();

    monthTasks.forEach((t) => {
      const emp = employees.find((e) => e.id === t.assignedToEmployeeId);
      const key = t.assignedToEmployeeId || "unknown";
      const existing = byEmployeeMap.get(key) || {
        employeeId: key,
        employeeName: emp?.fullName || t.assignedToName || "Staff",
        employeeCode: emp?.employeeCode || "—",
        departmentName: emp?.departmentName || "—",
        assigned: 0,
        inProgress: 0,
        inReview: 0,
        completed: 0,
        onTime: 0,
        late: 0,
        totalMinutes: 0,
      };
      existing.assigned += 1;
      if (t.status === "IN_PROGRESS" || t.status === "REVISION_REQUESTED") existing.inProgress += 1;
      if (t.status === "REVIEW") existing.inReview += 1;
      if (t.status === "DONE" || t.status === "COMPLETED") existing.completed += 1;
      if (t.status === "REVIEW" || t.status === "DONE" || t.status === "COMPLETED") {
        if (t.isLateSubmission) existing.late += 1;
        else existing.onTime += 1;
      }
      existing.totalMinutes += t.timeSpentMinutes || 0;
      byEmployeeMap.set(key, existing);
    });

    const rows = Array.from(byEmployeeMap.values()).sort((a, b) => b.completed - a.completed || b.assigned - a.assigned);

    return {
      total: monthTasks.length,
      completedCount: completed.length,
      inReviewCount: monthTasks.filter((t) => t.status === "REVIEW").length,
      lateCount,
      onTimeRate,
      rows,
      monthTasks,
    };
  }, [visibleTasks, analyticsMonth, employees]);

  const handleExportMonthlyTasksExcel = () => {
    const summaryRows = monthlyAnalytics.rows.map((r) => ({
      "Employee Code": r.employeeCode,
      "Employee Name": r.employeeName,
      Department: r.departmentName,
      Month: analyticsMonth,
      "Total Assigned": r.assigned,
      Completed: r.completed,
      "In Review": r.inReview,
      "In Progress": r.inProgress,
      "On-Time Submissions": r.onTime,
      "Late Submissions": r.late,
      "On-Time Rate (%)": r.onTime + r.late > 0 ? Math.round((r.onTime / (r.onTime + r.late)) * 100) : 100,
      "Total Logged Time (Hours)": Number((r.totalMinutes / 60).toFixed(2)),
    }));

    const detailRows = monthlyAnalytics.monthTasks.map((t) => ({
      "Task ID": t.id,
      Title: t.title,
      Type: t.taskType || "ONLINE",
      Project: t.projectName,
      "Assigned To": t.assignedToName || "",
      "Assigned By": t.assignedByName || "",
      Priority: t.priority,
      Status: t.status,
      Deadline: `${t.dueDate || t.deadline || ""} ${t.deadlineTime || ""}`.trim(),
      "Started At": t.startedAt ? new Date(t.startedAt).toLocaleString() : "—",
      "Submitted At": t.submittedAt ? new Date(t.submittedAt).toLocaleString() : "—",
      "Time Spent (Mins)": t.timeSpentMinutes || 0,
      "Late Submission": t.isLateSubmission ? "YES (Late)" : "On Time",
      "Submission Link": t.submissionLink || "",
    }));

    exportMultiSheetExcel(`Monthly_Tasks_Report_${analyticsMonth}`, [
      { name: "Employee Summary", rows: summaryRows },
      { name: "All Tasks Detail", rows: detailRows },
    ]);
  };

  // File Attachment Upload Helper (max 350KB for Firestore safety)
  const handleTaskFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "NEW_TASK" | "SUBMISSION"
  ) => {
    setAttachError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 350 * 1024) {
      setAttachError(
        isBangla
          ? "ফাইল সাইজ ৩৫০ KB এর বেশি। বড় ফাইলের জন্য গুগল ড্রাইভ/অনলাইন লিংক যুক্ত করুন।"
          : "File exceeds 350KB limit. For larger files, please attach a cloud link URL."
      );
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (target === "NEW_TASK") {
        setNewTaskAttachments((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            url: dataUrl,
            type: "FILE",
            uploadedBy: currentUser?.fullName || "Manager",
            uploadedAt: new Date().toISOString(),
          },
        ]);
      } else {
        setSubmissionFile({ name: file.name, url: dataUrl });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAddLinkAttachment = () => {
    if (!linkUrlInput.trim()) return;
    const normalizedUrl =
      linkUrlInput.trim().startsWith("http://") || linkUrlInput.trim().startsWith("https://")
        ? linkUrlInput.trim()
        : `https://${linkUrlInput.trim()}`;
    setNewTaskAttachments((prev) => [
      ...prev,
      {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: linkTitleInput.trim() || normalizedUrl,
        url: normalizedUrl,
        type: "LINK",
        uploadedBy: currentUser?.fullName || "Manager",
        uploadedAt: new Date().toISOString(),
      },
    ]);
    setLinkTitleInput("");
    setLinkUrlInput("");
  };

  // Create Project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const branch = branches.find((b) => b.id === newProjBranchId) || branches[0];
    const dept = departments.find((d) => d.id === newProjDeptId) || departments[0];
    const manager = employees.find((e) => e.id === newProjManagerId) || currentUser || employees[0];
    const selectedTeam = employees
      .filter((e) => newProjMembers.includes(e.id))
      .map((e) => ({
        id: e.id,
        name: e.fullName,
        avatarUrl: e.avatarUrl,
        role: e.designationTitle,
      }));

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      code: newProjCode,
      name: newProjName,
      branchId: branch?.id || "branch-dhaka",
      branchName: branch?.name || "Main Branch",
      departmentId: dept?.id || "dept-eng",
      departmentName: dept?.name || "Operations",
      managerId: manager?.id,
      managerName: manager?.fullName,
      startDate: newProjStartDate,
      deadline: newProjDeadline,
      priority: newProjPriority,
      budget: Number(newProjBudget),
      spentBudget: 0,
      progressPercentage: 0,
      status: "ACTIVE",
      teamMembers:
        selectedTeam.length > 0
          ? selectedTeam
          : manager
          ? [{ id: manager.id, name: manager.fullName, avatarUrl: manager.avatarUrl, role: manager.designationTitle }]
          : [],
      teamMemberIds: newProjMembers.length > 0 ? newProjMembers : manager ? [manager.id] : [],
      description: newProjDesc || "Enterprise strategic initiative.",
      totalTasks: 0,
      completedTasks: 0,
    };

    if (onAddProject) onAddProject(newProject);
    setShowProjectModal(false);
    setNewProjName("");
    setNewProjDesc("");
    setNewProjMembers([]);
    setSelectedProjectId(newProject.id);
  };

  // Assign Task (Single or Multiple Employees)
  const handleAssignTasks = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || newTaskAssigneeIds.length === 0) return;

    const proj =
      newTaskProjId === "STANDALONE"
        ? { id: "STANDALONE", name: isBangla ? "সরাসরি টাস্ক (Direct Task)" : "Direct Task" }
        : projects.find((p) => p.id === newTaskProjId) || { id: "STANDALONE", name: "Direct Task" };

    const batchGroupId = newTaskAssigneeIds.length > 1 ? `batch-${Date.now()}` : undefined;
    const nowIso = new Date().toISOString();

    newTaskAssigneeIds.forEach((empId, idx) => {
      const assignee = employees.find((emp) => emp.id === empId);
      if (!assignee) return;

      const task: ProjectTask = {
        id: `task-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
        projectId: proj.id,
        projectName: proj.name,
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        taskType: newTaskType,
        assignedToEmployeeId: assignee.id,
        assignedToName: assignee.fullName,
        assignedToAvatar: assignee.avatarUrl || "",
        assignedByEmployeeId: currentUser?.id,
        assignedByName: currentUser?.fullName || "Line Manager",
        assignedByRole: currentUser?.designationTitle || currentUser?.role,
        batchGroupId,
        priority: newTaskPriority,
        status: "TODO",
        estimatedHours: Number(newTaskEstHours) || 2,
        loggedHours: 0,
        dueDate: newTaskDueDate,
        deadline: newTaskDueDate,
        deadlineTime: newTaskDueTime || "17:00",
        attachments: newTaskAttachments,
        revisionCount: 0,
        comments: [
          {
            id: `cmt-${Date.now()}-${idx}`,
            authorId: currentUser?.id || "system",
            authorName: currentUser?.fullName || "Line Manager",
            authorRole: currentUser?.designationTitle || currentUser?.role,
            authorAvatar: currentUser?.avatarUrl,
            message: isBangla
              ? `টাস্কটি অ্যাসাইন করা হয়েছে (ডেডলাইন: ${newTaskDueDate} ${newTaskDueTime})`
              : `Task assigned (Deadline: ${newTaskDueDate} ${newTaskDueTime})`,
            timestamp: nowIso,
            type: "SYSTEM",
          },
        ],
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      onAddTask(task);

      if (onSendNotification) {
        onSendNotification({
          title: isBangla ? "নতুন টাস্ক অ্যাসাইন করা হয়েছে" : "New Task Assigned",
          message: isBangla
            ? `${currentUser?.fullName || "ম্যানেজার"} আপনাকে "${task.title}" কাজটি অ্যাসাইন করেছেন। ডেডলাইন: ${newTaskDueDate} (${newTaskDueTime})`
            : `${currentUser?.fullName || "Manager"} assigned "${task.title}" to you. Deadline: ${newTaskDueDate} (${newTaskDueTime})`,
          type: "INFO",
          module: "projects-tasks",
          targetEmployeeId: assignee.id,
          link: "projects-tasks",
        });
      }
    });

    setShowTaskModal(false);
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskAssigneeIds([]);
    setNewTaskAttachments([]);
    setAssigneeSearch("");
    setAttachError(null);
  };

  // Helper to persist task updates
  const commitTaskUpdate = (updatedTask: ProjectTask) => {
    if (onUpdateTask) {
      onUpdateTask({ ...updatedTask, updatedAt: new Date().toISOString() });
    } else {
      onUpdateTaskStatus(updatedTask.id, updatedTask.status);
    }
  };

  // Action: Employee Check-In / Start Task
  const handleStartTaskCheckIn = (task: ProjectTask) => {
    const nowIso = new Date().toISOString();
    const checkInComment: TaskComment = {
      id: `cmt-${Date.now()}`,
      authorId: currentUser?.id || task.assignedToEmployeeId,
      authorName: currentUser?.fullName || task.assignedToName || "Employee",
      authorRole: currentUser?.designationTitle,
      authorAvatar: currentUser?.avatarUrl,
      message: isBangla
        ? "কাজ শুরু করা হয়েছে (Task Check-In সম্পন্ন)"
        : "Task started (Check-In recorded)",
      timestamp: nowIso,
      type: "SYSTEM",
    };

    const updated: ProjectTask = {
      ...task,
      status: "IN_PROGRESS",
      startedAt: task.startedAt || nowIso,
      comments: [...(task.comments || []), checkInComment],
    };
    commitTaskUpdate(updated);
  };

  // Action: Employee Submit for Review
  const handleSubmitForReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const now = new Date();
    const nowIso = now.toISOString();
    const startRef = selectedTask.startedAt || selectedTask.createdAt || nowIso;
    const elapsedMinutes = Math.max(1, Math.round((now.getTime() - new Date(startRef).getTime()) / 60000));
    const totalMinutes = (selectedTask.timeSpentMinutes || 0) + elapsedMinutes;

    const deadlineDt = getDeadlineDateTime(selectedTask);
    const isLate = Boolean(deadlineDt && now.getTime() > deadlineDt.getTime());
    const lateByMinutes =
      isLate && deadlineDt ? Math.max(1, Math.round((now.getTime() - deadlineDt.getTime()) / 60000)) : 0;

    const submitComment: TaskComment = {
      id: `cmt-${Date.now()}`,
      authorId: currentUser?.id || selectedTask.assignedToEmployeeId,
      authorName: currentUser?.fullName || selectedTask.assignedToName || "Employee",
      authorRole: currentUser?.designationTitle,
      authorAvatar: currentUser?.avatarUrl,
      message:
        submissionComment.trim() ||
        (isBangla ? "কাজ সম্পন্ন করে রিভিউর জন্য জমা দেওয়া হয়েছে।" : "Work completed and submitted for review."),
      timestamp: nowIso,
      type: "SUBMISSION",
    };

    const updated: ProjectTask = {
      ...selectedTask,
      status: "REVIEW",
      startedAt: selectedTask.startedAt || startRef,
      submittedAt: nowIso,
      timeSpentMinutes: totalMinutes,
      loggedHours: Number((totalMinutes / 60).toFixed(2)),
      isLateSubmission: isLate,
      lateByMinutes,
      submissionComment: submissionComment.trim(),
      submissionLink: submissionLink.trim() || undefined,
      submissionAttachmentName: submissionFile?.name,
      submissionAttachmentUrl: submissionFile?.url,
      comments: [...(selectedTask.comments || []), submitComment],
    };

    commitTaskUpdate(updated);

    // Show immediate appreciative or late notice to employee
    if (isLate) {
      setSubmissionBanner({
        type: "LATE",
        message: isBangla
          ? `আপনার কাজটি ডেডলাইনের ${formatDuration(lateByMinutes, true)} পর (দেরিতে) জমা হয়েছে। আপনার লাইন ম্যানেজারকে এটি লেট সাবমিশন হিসেবে নোটিফাই করা হয়েছে।`
          : `Submitted ${formatDuration(lateByMinutes, false)} past the deadline. Your Line Manager has been notified with a Late Submission flag.`,
      });
    } else {
      setSubmissionBanner({
        type: "ON_TIME",
        message: isBangla
          ? `অভিনন্দন! আপনি নির্ধারিত সময়ের আগেই (মোট সময়: ${formatDuration(totalMinutes, true)}) কাজটি সফলভাবে রিভিউর জন্য জমা দিয়েছেন।`
          : `Great job! Submitted on time (Total time: ${formatDuration(totalMinutes, false)}) for your Line Manager's review.`,
      });
    }

    // Notify assigning Line Manager
    if (onSendNotification && selectedTask.assignedByEmployeeId) {
      onSendNotification({
        title: isLate
          ? isBangla
            ? "টাস্ক রিভিউর জন্য জমা (লেট সাবমিশন)"
            : "Task Submitted for Review (LATE)"
          : isBangla
          ? "টাস্ক রিভিউর জন্য জমা হয়েছে"
          : "Task Submitted for Review",
        message: isBangla
          ? `${currentUser?.fullName || selectedTask.assignedToName} "${selectedTask.title}" কাজটি জমা দিয়েছেন (${
              isLate ? "ডেডলাইন অতিক্রান্ত" : "সময়মতো"
            }, সময় লেগেছে: ${formatDuration(totalMinutes, true)})।`
          : `${currentUser?.fullName || selectedTask.assignedToName} submitted "${selectedTask.title}" (${
              isLate ? "Late" : "On Time"
            }, duration: ${formatDuration(totalMinutes, false)}).`,
        type: isLate ? "WARNING" : "SUCCESS",
        module: "projects-tasks",
        targetEmployeeId: selectedTask.assignedByEmployeeId,
        link: "projects-tasks",
      });
    }

    setShowSubmitDialog(false);
    setSubmissionComment("");
    setSubmissionLink("");
    setSubmissionFile(null);
  };

  // Action: Line Manager Approve & Complete
  const handleApproveTask = (task: ProjectTask) => {
    const nowIso = new Date().toISOString();
    const approveComment: TaskComment = {
      id: `cmt-${Date.now()}`,
      authorId: currentUser?.id || "manager",
      authorName: currentUser?.fullName || "Line Manager",
      authorRole: currentUser?.designationTitle || currentUser?.role,
      authorAvatar: currentUser?.avatarUrl,
      message: isBangla
        ? "কাজটি পর্যালোচনা করে অনুমোদন ও সম্পন্ন ঘোষণা করা হলো। ধন্যবাদ!"
        : "Task reviewed, approved, and marked as completed.",
      timestamp: nowIso,
      type: "APPROVAL",
    };

    commitTaskUpdate({
      ...task,
      status: "DONE",
      completedAt: nowIso,
      comments: [...(task.comments || []), approveComment],
    });

    if (onSendNotification) {
      onSendNotification({
        title: isBangla ? "টাস্ক অনুমোদিত ও সম্পন্ন হয়েছে" : "Task Approved & Completed",
        message: isBangla
          ? `${currentUser?.fullName || "লাইন ম্যানেজার"} আপনার "${task.title}" কাজটি অনুমোদন করে সম্পন্ন করেছেন।`
          : `${currentUser?.fullName || "Line Manager"} approved and completed your task "${task.title}".`,
        type: "SUCCESS",
        module: "projects-tasks",
        targetEmployeeId: task.assignedToEmployeeId,
        link: "projects-tasks",
      });
    }
  };

  // Action: Line Manager Request Revision
  const handleRequestRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !revisionComment.trim()) return;

    const nowIso = new Date().toISOString();
    const revComment: TaskComment = {
      id: `cmt-${Date.now()}`,
      authorId: currentUser?.id || "manager",
      authorName: currentUser?.fullName || "Line Manager",
      authorRole: currentUser?.designationTitle || currentUser?.role,
      authorAvatar: currentUser?.avatarUrl,
      message: revisionComment.trim(),
      timestamp: nowIso,
      type: "REVISION_REQUEST",
    };

    commitTaskUpdate({
      ...selectedTask,
      status: "REVISION_REQUESTED",
      revisionCount: (selectedTask.revisionCount || 0) + 1,
      lastManagerFeedback: revisionComment.trim(),
      startedAt: nowIso, // reset timer segment for revision work
      comments: [...(selectedTask.comments || []), revComment],
    });

    if (onSendNotification) {
      onSendNotification({
        title: isBangla ? "টাস্ক রিভিশনের জন্য ফেরত পাঠানো হয়েছে" : "Revision Requested on Task",
        message: isBangla
          ? `${currentUser?.fullName || "লাইন ম্যানেজার"} "${selectedTask.title}" কাজে সংশোধন চেয়েছেন: "${revisionComment.trim()}"`
          : `${currentUser?.fullName || "Line Manager"} requested revision on "${selectedTask.title}": "${revisionComment.trim()}"`,
        type: "WARNING",
        module: "projects-tasks",
        targetEmployeeId: selectedTask.assignedToEmployeeId,
        link: "projects-tasks",
      });
    }

    setRevisionComment("");
    setShowRevisionBox(false);
  };

  // Action: Post Comment in Task Thread
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newCommentText.trim()) return;

    const nowIso = new Date().toISOString();
    const comment: TaskComment = {
      id: `cmt-${Date.now()}`,
      authorId: currentUser?.id || "user",
      authorName: currentUser?.fullName || "Staff",
      authorRole: currentUser?.designationTitle || currentUser?.role,
      authorAvatar: currentUser?.avatarUrl,
      message: newCommentText.trim(),
      timestamp: nowIso,
      type: "COMMENT",
    };

    commitTaskUpdate({
      ...selectedTask,
      comments: [...(selectedTask.comments || []), comment],
    });

    // Notify counterpart (if employee comments -> notify manager; if manager comments -> notify employee)
    if (onSendNotification && currentUser) {
      const targetId =
        currentUser.id === selectedTask.assignedToEmployeeId
          ? selectedTask.assignedByEmployeeId
          : selectedTask.assignedToEmployeeId;

      if (targetId && targetId !== currentUser.id) {
        onSendNotification({
          title: isBangla ? "টাস্কে নতুন কমেন্ট এসেছে" : "New Comment on Task",
          message: `${currentUser.fullName} (${selectedTask.title}): ${newCommentText.trim().slice(0, 120)}`,
          type: "INFO",
          module: "projects-tasks",
          targetEmployeeId: targetId,
          link: "projects-tasks",
        });
      }
    }

    setNewCommentText("");
  };

  const statusTabs: Array<{
    key: "ALL" | "TODO" | "IN_PROGRESS" | "REVIEW" | "REVISION_REQUESTED" | "DONE";
    statuses: ProjectTask["status"][];
    labelEn: string;
    labelBn: string;
    activeClass: string;
    badgeClass: string;
  }> = [
    {
      key: "ALL",
      statuses: ["TODO", "IN_PROGRESS", "REVIEW", "REVISION_REQUESTED", "DONE", "COMPLETED"],
      labelEn: "All Tasks",
      labelBn: "সকল টাস্ক",
      activeClass: "border-teal-600 text-teal-700 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/30",
      badgeClass: "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    },
    {
      key: "TODO",
      statuses: ["TODO"],
      labelEn: "Assigned",
      labelBn: "অ্যাসাইনকৃত",
      activeClass: "border-slate-700 dark:border-slate-300 text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/70",
      badgeClass: "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200",
    },
    {
      key: "IN_PROGRESS",
      statuses: ["IN_PROGRESS"],
      labelEn: "In Progress",
      labelBn: "চলমান (In Progress)",
      activeClass: "border-teal-600 text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40",
      badgeClass: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
    },
    {
      key: "REVIEW",
      statuses: ["REVIEW"],
      labelEn: "Submitted for Review",
      labelBn: "রিভিউর জন্য জমা",
      activeClass: "border-amber-500 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40",
      badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    },
    {
      key: "REVISION_REQUESTED",
      statuses: ["REVISION_REQUESTED"],
      labelEn: "Revision Requested",
      labelBn: "রিভিশন প্রয়োজন",
      activeClass: "border-rose-500 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40",
      badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    },
    {
      key: "DONE",
      statuses: ["DONE", "COMPLETED"],
      labelEn: "Completed",
      labelBn: "সম্পন্ন (Completed)",
      activeClass: "border-emerald-600 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40",
      badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    },
  ];

  const activeStatusTasks = useMemo(() => {
    const tabDef = statusTabs.find((s) => s.key === activeStatusTab) || statusTabs[0];
    return visibleTasks.filter((t) => tabDef.statuses.includes(t.status));
  }, [visibleTasks, activeStatusTab]);

  const isTaskReviewer = (task: ProjectTask) => {
    if (!currentUser) return false;
    if (isSuperAdminOrCeo(currentUser)) return true;
    if (task.assignedByEmployeeId && task.assignedByEmployeeId === currentUser.id) return true;
    const assignee = employees.find((e) => e.id === task.assignedToEmployeeId);
    if (assignee?.reportingManagerId === currentUser.id) return true;
    return false;
  };

  const isTaskAssignee = (task: ProjectTask) => {
    if (!currentUser) return false;
    return task.assignedToEmployeeId === currentUser.id;
  };

  return (
    <div id="projects-tasks-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {isBangla ? "প্রজেক্ট, টাস্ক অ্যাসাইনমেন্ট ও রিভিউ ওয়ার্কফ্লো" : "Projects, Task Assignment & Review Workflow"}
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            {isBangla ? "টাস্ক ম্যানেজমেন্ট ও টিম ডেলিভারি হাব" : "Task Assignment & Team Delivery Hub"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {isBangla
              ? "অনলাইন বা ফিজিক্যাল টাস্ক একাধিক কর্মীকে অ্যাসাইন করুন, চেক-ইন ও সময় ট্র্যাক করুন, রিভিউ সাবমিশন এবং কমেন্টের মাধ্যমে কাজ সম্পন্ন করুন।"
              : "Assign online or physical tasks to one or multiple staff, track check-in to submission time, review deliverables, and monitor monthly on-time delivery."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Segmented Sub-Tab Switch */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveSubTab("BOARD")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "BOARD"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>{isBangla ? "টাস্ক বোর্ড" : "Task Board"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("ANALYTICS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "ANALYTICS"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isBangla ? "মাসিক রিপোর্ট" : "Monthly Report"}</span>
            </button>
          </div>

          {canAssignTasks && (
            <>
              <button
                type="button"
                onClick={() => setShowProjectModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{isBangla ? "নতুন প্রজেক্ট" : "New Project"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowTaskModal(true)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
              >
                <CheckSquare className="w-4 h-4" />
                <span>{isBangla ? "টাস্ক অ্যাসাইন করুন" : "Assign Task"}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Summary Strip (clickable quick status filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("BOARD");
            setActiveStatusTab("ALL");
          }}
          className="text-left p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 transition-colors cursor-pointer"
        >
          <div className="text-xs text-slate-500 dark:text-slate-400">{isBangla ? "মোট টাস্ক" : "Total Tasks"}</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">{taskStats.total}</div>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("BOARD");
            setActiveStatusTab("IN_PROGRESS");
          }}
          className="text-left p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 transition-colors cursor-pointer"
        >
          <div className="text-xs text-slate-500 dark:text-slate-400">{isBangla ? "চলমান / রিভিশন" : "In Progress"}</div>
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 tabular-nums mt-1">{taskStats.inProgress}</div>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("BOARD");
            setActiveStatusTab("REVIEW");
          }}
          className="text-left p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-colors cursor-pointer"
        >
          <div className="text-xs text-slate-500 dark:text-slate-400">{isBangla ? "রিভিউ অপেক্ষমান" : "Pending Review"}</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-1">{taskStats.inReview}</div>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("BOARD");
            setActiveStatusTab("DONE");
          }}
          className="text-left p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-colors cursor-pointer"
        >
          <div className="text-xs text-slate-500 dark:text-slate-400">{isBangla ? "সম্পন্ন টাস্ক" : "Completed"}</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">{taskStats.completed}</div>
        </button>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">{isBangla ? "লেট সাবমিশন" : "Late Submissions"}</div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-1">{taskStats.late}</div>
        </div>
      </div>

      {activeSubTab === "BOARD" ? (
        <>
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Scope Filter */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                {isBangla ? "ভিউ ফিল্টার" : "Task View Scope"}
              </label>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTaskScopeFilter("ALL")}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    taskScopeFilter === "ALL"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {isBangla ? "সব" : "All"}
                </button>
                <button
                  type="button"
                  onClick={() => setTaskScopeFilter("MY_TASKS")}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    taskScopeFilter === "MY_TASKS"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {isBangla ? "আমার টাস্ক" : "My Tasks"}
                </button>
                {canAssignTasks && (
                  <button
                    type="button"
                    onClick={() => setTaskScopeFilter("ASSIGNED_BY_ME")}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      taskScopeFilter === "ASSIGNED_BY_ME"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {isBangla ? "আমি দিয়েছি" : "Assigned"}
                  </button>
                )}
              </div>
            </div>

            {/* Project Filter */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                {isBangla ? "প্রজেক্ট নির্বাচন" : "Project"}
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">{isBangla ? "সকল প্রজেক্ট ও টাস্ক" : "All Projects & Direct Tasks"}</option>
                <option value="STANDALONE">{isBangla ? "সরাসরি অ্যাসাইনকৃত টাস্ক (Standalone)" : "Direct / Standalone Tasks"}</option>
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Filter (for managers) */}
            {canAssignTasks ? (
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  {isBangla ? "শাখা (Branch)" : "Branch"}
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">{isBangla ? "সকল শাখা" : "All Branches"}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  {isBangla ? "বিভাগ (Department)" : "Department"}
                </label>
                <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 truncate">
                  {currentUser?.departmentName || "—"}
                </div>
              </div>
            )}

            {/* Search */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                {isBangla ? "টাস্ক খুঁজুন" : "Search Tasks"}
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={taskSearchTerm}
                  onChange={(e) => setTaskSearchTerm(e.target.value)}
                  placeholder={isBangla ? "টাস্ক বা কর্মীর নাম..." : "Task title or staff name..."}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-8 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
                {taskSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setTaskSearchTerm("")}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Spacious Status Tabs Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center gap-1.5 overflow-x-auto p-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
              {statusTabs.map((tab) => {
                const count = visibleTasks.filter((t) => tab.statuses.includes(t.status)).length;
                const isActive = activeStatusTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveStatusTab(tab.key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer shrink-0 ${
                      isActive
                        ? tab.activeClass + " shadow-2xs"
                        : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>{isBangla ? tab.labelBn : tab.labelEn}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold tabular-nums ${
                        isActive ? tab.badgeClass : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Spacious 2-Column Task Cards Grid */}
            <div className="p-4 sm:p-5">
              {activeStatusTasks.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isBangla ? "এই ট্যাবে বর্তমানে কোনো টাস্ক নেই" : "No tasks found in this status tab"}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isBangla
                      ? "অন্য ট্যাব নির্বাচন করুন অথবা নতুন টাস্ক অ্যাসাইন করুন।"
                      : "Switch to another status tab or assign a new task."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {activeStatusTasks.map((task) => {
                    const deadlineDt = getDeadlineDateTime(task);
                    const isOverdueActive =
                      Boolean(deadlineDt && nowTick > deadlineDt.getTime()) &&
                      task.status !== "DONE" &&
                      task.status !== "COMPLETED" &&
                      task.status !== "REVIEW";

                    const runningMinutes =
                      task.status === "IN_PROGRESS" && task.startedAt
                        ? (task.timeSpentMinutes || 0) +
                          Math.max(1, Math.round((nowTick - new Date(task.startedAt).getTime()) / 60000))
                        : task.timeSpentMinutes || 0;

                    const assigneeEmp = employees.find((e) => e.id === task.assignedToEmployeeId);

                    const statusLabel =
                      task.status === "TODO"
                        ? isBangla
                          ? "অ্যাসাইনকৃত"
                          : "Assigned"
                        : task.status === "IN_PROGRESS"
                        ? isBangla
                          ? "চলমান"
                          : "In Progress"
                        : task.status === "REVIEW"
                        ? isBangla
                          ? "রিভিউ অপেক্ষমান"
                          : "Submitted for Review"
                        : task.status === "REVISION_REQUESTED"
                        ? isBangla
                          ? "রিভিশন প্রয়োজন"
                          : "Revision Requested"
                        : isBangla
                        ? "সম্পন্ন"
                        : "Completed";

                    const statusStyle =
                      task.status === "DONE" || task.status === "COMPLETED"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
                        : task.status === "REVIEW"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25"
                        : task.status === "REVISION_REQUESTED"
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/25"
                        : task.status === "IN_PROGRESS"
                        ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/25"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";

                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          setSelectedTaskId(task.id);
                          setSubmissionBanner(null);
                          setShowSubmitDialog(false);
                          setShowRevisionBox(false);
                        }}
                        className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/60 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-3">
                          {/* Top Metadata Row */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 text-xs text-slate-500 dark:text-slate-400">
                              <span className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold shrink-0 ${statusStyle}`}>
                                {statusLabel}
                              </span>
                              <span className="truncate">
                                {task.taskType === "PHYSICAL"
                                  ? isBangla
                                    ? "ফিজিক্যাল"
                                    : "Physical"
                                  : task.taskType === "HYBRID"
                                  ? isBangla
                                    ? "হাইব্রিড"
                                    : "Hybrid"
                                  : isBangla
                                  ? "অনলাইন"
                                  : "Online"}
                                {" · "}
                                {task.projectName || (isBangla ? "সরাসরি টাস্ক" : "Direct Task")}
                              </span>
                            </div>

                            <span
                              className={`text-[11px] font-bold uppercase tracking-wide shrink-0 ${
                                task.priority === "URGENT" || task.priority === "HIGH"
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          {/* Task Title & Description */}
                          <div>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Status Alerts */}
                          {task.status === "REVISION_REQUESTED" && (
                            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                              <RotateCcw className="w-4 h-4 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">{isBangla ? "রিভিশন মন্তব্য: " : "Revision note: "}</span>
                                <span>{task.lastManagerFeedback || ""}</span>
                              </div>
                            </div>
                          )}

                          {task.isLateSubmission && (
                            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <span>
                                {isBangla
                                  ? `লেট সাবমিশন — ডেডলাইনের ${formatDuration(task.lateByMinutes, true)} পর জমা হয়েছে`
                                  : `Late Submission — ${formatDuration(task.lateByMinutes, false)} past deadline`}
                              </span>
                            </div>
                          )}

                          {!task.isLateSubmission && isOverdueActive && (
                            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{isBangla ? "ডেডলাইন অতিক্রান্ত হয়েছে!" : "Deadline has passed"}</span>
                            </div>
                          )}
                        </div>

                        {/* Bottom Metadata, Assignee & Actions */}
                        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {assigneeEmp?.avatarUrl || task.assignedToAvatar ? (
                                <img
                                  src={assigneeEmp?.avatarUrl || task.assignedToAvatar}
                                  alt={task.assignedToName || "Staff"}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-teal-600/15 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center justify-center shrink-0">
                                  {(task.assignedToName || "S").slice(0, 1)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {task.assignedToName || "Unassigned"}
                                </div>
                                {task.assignedByName && (
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                    {isBangla ? "দায়িত্বদাতা: " : "Assigned by: "}
                                    {task.assignedByName}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                              <span className="flex items-center gap-1 font-medium">
                                <Calendar className="w-3.5 h-3.5" />
                                {task.dueDate || task.deadline || "—"}
                                {task.deadlineTime ? ` · ${task.deadlineTime}` : ""}
                              </span>
                              <span className="flex items-center gap-1 font-mono font-semibold text-slate-700 dark:text-slate-200">
                                <Timer className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                {formatDuration(runningMinutes, isBangla)}
                              </span>
                              {(task.attachments?.length || 0) > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <Paperclip className="w-3.5 h-3.5" />
                                  {task.attachments?.length}
                                </span>
                              )}
                              {(task.comments?.length || 0) > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  {task.comments?.length}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Spacious Action Row */}
                          <div className="flex flex-wrap items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                            {isTaskAssignee(task) && task.status === "TODO" && (
                              <button
                                type="button"
                                onClick={() => handleStartTaskCheckIn(task)}
                                className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>{isBangla ? "কাজ শুরু করুন (চেক-ইন)" : "Start Task (Check-In)"}</span>
                              </button>
                            )}

                            {isTaskAssignee(task) &&
                              (task.status === "IN_PROGRESS" || task.status === "REVISION_REQUESTED") && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTaskId(task.id);
                                    setSubmissionBanner(null);
                                    setShowSubmitDialog(true);
                                  }}
                                  className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>{isBangla ? "রিভিউর জন্য জমা দিন" : "Submit for Review"}</span>
                                </button>
                              )}

                            {isTaskReviewer(task) && task.status === "REVIEW" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApproveTask(task)}
                                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{isBangla ? "অনুমোদন ও সম্পন্ন" : "Approve & Complete"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTaskId(task.id);
                                    setSubmissionBanner(null);
                                    setShowRevisionBox(true);
                                  }}
                                  className="py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>{isBangla ? "রিভিশন" : "Revision"}</span>
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTaskId(task.id);
                                setSubmissionBanner(null);
                                setShowSubmitDialog(false);
                              }}
                              className="py-2 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                            >
                              {isBangla ? "বিস্তারিত ও কমেন্ট" : "Details & Comments"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Monthly Task Analytics View */
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {isBangla ? "মাস নির্বাচন করুন:" : "Select Month:"}
              </label>
              <input
                type="month"
                value={analyticsMonth}
                onChange={(e) => setAnalyticsMonth(e.target.value)}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={handleExportMonthlyTasksExcel}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isBangla ? "মাসিক টাস্ক এক্সেল ডাউনলোড (.xlsx)" : "Download Monthly Tasks Excel (.xlsx)"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isBangla ? "এই মাসে অ্যাসাইনকৃত" : "Assigned This Month"}
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                {monthlyAnalytics.total}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isBangla ? "সম্পন্ন টাস্ক" : "Completed Tasks"}
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                {monthlyAnalytics.completedCount}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isBangla ? "সময়মতো জমার হার" : "On-Time Delivery Rate"}
              </div>
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 tabular-nums mt-1">
                {monthlyAnalytics.onTimeRate}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isBangla ? "লেট সাবমিশন সংখ্যা" : "Late Submissions"}
              </div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-1">
                {monthlyAnalytics.lateCount}
              </div>
            </div>
          </div>

          {/* Employee-Wise Monthly Breakdown Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isBangla
                  ? `কর্মীভিত্তিক মাসিক টাস্ক পারফরম্যান্স (${analyticsMonth})`
                  : `Employee Monthly Task Performance (${analyticsMonth})`}
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {monthlyAnalytics.rows.length} {isBangla ? "জন কর্মী" : "staff"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4 font-semibold">{isBangla ? "কর্মীর নাম ও আইডি" : "Employee"}</th>
                    <th className="py-3 px-4 font-semibold">{isBangla ? "বিভাগ" : "Department"}</th>
                    <th className="py-3 px-4 font-semibold text-right">{isBangla ? "মোট অ্যাসাইন" : "Assigned"}</th>
                    <th className="py-3 px-4 font-semibold text-right">{isBangla ? "সম্পন্ন" : "Completed"}</th>
                    <th className="py-3 px-4 font-semibold text-right">{isBangla ? "সময়মতো" : "On-Time"}</th>
                    <th className="py-3 px-4 font-semibold text-right">{isBangla ? "দেরিতে" : "Late"}</th>
                    <th className="py-3 px-4 font-semibold text-right">{isBangla ? "মোট সময়" : "Time Logged"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {monthlyAnalytics.rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        {isBangla
                          ? "এই মাসে কোনো টাস্ক রেকর্ড পাওয়া যায়নি।"
                          : "No task records found for this month."}
                      </td>
                    </tr>
                  ) : (
                    monthlyAnalytics.rows.map((row) => (
                      <tr key={row.employeeId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {row.employeeName}{" "}
                          <span className="text-slate-400 font-mono font-normal">({row.employeeCode})</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{row.departmentName}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                          {row.assigned}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                          {row.completed}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-teal-600 dark:text-teal-400">
                          {row.onTime}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-600 dark:text-rose-400">
                          {row.late}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                          {formatDuration(row.totalMinutes, isBangla)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 1: ASSIGN NEW TASK (MULTI-EMPLOYEE + ATTACHMENTS)
         ============================================================ */}
      {showTaskModal && canAssignTasks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-2xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isBangla ? "নতুন টাস্ক অ্যাসাইন করুন" : "Assign New Task"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBangla
                    ? "একজন বা একাধিক কর্মীকে সিলেক্ট করুন — তাদের পোর্টালে স্বয়ংক্রিয়ভাবে নোটিফিকেশন চলে যাবে।"
                    : "Select one or multiple employees — each assignee receives an instant portal notification."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTasks} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isBangla ? "টাস্কের নাম / শিরোনাম *" : "Task Title *"}
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder={
                    isBangla
                      ? "যেমন: ক্লায়েন্ট ওয়েবসাইট ল্যান্ডিং পেজ ডিজাইন / জেলা ব্রাঞ্চ ফিল্ড ভিজিট রিপোর্ট"
                      : "e.g. Monthly Field Audit Report / Client Website Landing Page"
                  }
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "কাজের ধরন" : "Task Type"}
                  </label>
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="ONLINE">{isBangla ? "অনলাইন / রিমোট কাজ" : "Online / Remote"}</option>
                    <option value="PHYSICAL">{isBangla ? "ফিজিক্যাল / মাঠ পর্যায়" : "Physical / Field Work"}</option>
                    <option value="HYBRID">{isBangla ? "হাইব্রিড (উভয়)" : "Hybrid"}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "প্রজেক্ট (ঐচ্ছিক)" : "Project (Optional)"}
                  </label>
                  <select
                    value={newTaskProjId}
                    onChange={(e) => setNewTaskProjId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="STANDALONE">{isBangla ? "সরাসরি টাস্ক (কোনো প্রজেক্ট ছাড়া)" : "Standalone / Direct Task"}</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "অগ্রাধিকার (Priority)" : "Priority"}
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "ডেডলাইন তারিখ *" : "Deadline Date *"}
                  </label>
                  <input
                    type="date"
                    required
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "ডেডলাইন সময়" : "Deadline Time"}
                  </label>
                  <input
                    type="time"
                    value={newTaskDueTime}
                    onChange={(e) => setNewTaskDueTime(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "আনুমানিক ঘণ্টা" : "Est. Hours"}
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={newTaskEstHours}
                    onChange={(e) => setNewTaskEstHours(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Task Details */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isBangla ? "টাস্কের বিস্তারিত বিবরণ ও নির্দেশনা *" : "Task Details & Instructions *"}
                </label>
                <textarea
                  rows={3}
                  required
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder={
                    isBangla
                      ? "কাজটি কীভাবে সম্পন্ন করতে হবে, কী কী ডেলিভারেবল লাগবে তা বিস্তারিত লিখুন..."
                      : "Write clear instructions, expectations, and required deliverables..."
                  }
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Searchable Multi-Employee Picker */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    {isBangla
                      ? `যাদেরকে অ্যাসাইন করবেন (সার্চ করে এক বা একাধিক সিলেক্ট করুন) *`
                      : `Assign To Employees (Search & Multi-Select) *`}
                  </label>
                  <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400 font-semibold">
                    {newTaskAssigneeIds.length} {isBangla ? "জন নির্বাচিত" : "selected"}
                  </span>
                </div>

                {/* Selected employees list */}
                {newTaskAssigneeIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {newTaskAssigneeIds.map((id) => {
                      const emp = employees.find((e) => e.id === id);
                      if (!emp) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-[11px] font-semibold"
                        >
                          <span>{emp.fullName}</span>
                          <button
                            type="button"
                            onClick={() => setNewTaskAssigneeIds((prev) => prev.filter((x) => x !== id))}
                            className="hover:text-rose-500 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                    placeholder={
                      isBangla ? "নাম, আইডি বা পদবি লিখে সার্চ করুন..." : "Search by name, code, or designation..."
                    }
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 divide-y divide-slate-200/70 dark:divide-slate-800">
                  {assignableEmployees.map((emp) => {
                    const checked = newTaskAssigneeIds.includes(emp.id);
                    const isMyTeam = emp.reportingManagerId === currentUser?.id;
                    return (
                      <label
                        key={emp.id}
                        className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
                          checked ? "bg-teal-500/10" : "hover:bg-slate-100 dark:hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setNewTaskAssigneeIds((prev) =>
                                prev.includes(emp.id) ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
                              );
                            }}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {emp.fullName}{" "}
                              <span className="text-slate-400 font-mono font-normal">({emp.employeeCode})</span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {emp.designationTitle} · {emp.departmentName}
                            </div>
                          </div>
                        </div>
                        {isMyTeam && (
                          <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-300 shrink-0 ml-2">
                            {isBangla ? "আমার টিম" : "My Team"}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Attachments (File Upload + External Link) */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>{isBangla ? "অ্যাটাচমেন্ট বা রেফারেন্স লিংক (ঐচ্ছিক)" : "Attachments or Reference Links (Optional)"}</span>
                  </span>
                  <label className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer hover:border-teal-500 transition-colors">
                    <span>{isBangla ? "+ ফাইল আপলোড (≤350KB)" : "+ Upload File (≤350KB)"}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleTaskFileUpload(e, "NEW_TASK")}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <input
                    type="text"
                    value={linkTitleInput}
                    onChange={(e) => setLinkTitleInput(e.target.value)}
                    placeholder={isBangla ? "লিংকের নাম (যেমন: ব্রিফ ডক)" : "Link label (e.g. Brief Doc)"}
                    className="sm:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={linkUrlInput}
                    onChange={(e) => setLinkUrlInput(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="sm:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddLinkAttachment}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white font-semibold cursor-pointer"
                  >
                    {isBangla ? "যুক্ত করুন" : "Add Link"}
                  </button>
                </div>

                {attachError && <p className="text-[11px] text-rose-600 dark:text-rose-400">{attachError}</p>}

                {newTaskAttachments.length > 0 && (
                  <div className="space-y-1.5">
                    {newTaskAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {att.type === "LINK" ? (
                            <Link2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          ) : (
                            <Paperclip className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          )}
                          <span className="truncate text-slate-700 dark:text-slate-200">{att.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewTaskAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                          className="text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={newTaskAssigneeIds.length === 0 || !newTaskTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold cursor-pointer transition-colors"
                >
                  {isBangla
                    ? `টাস্ক অ্যাসাইন করুন (${newTaskAssigneeIds.length} জন)`
                    : `Assign Task (${newTaskAssigneeIds.length})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 2: TASK WORKSPACE (CHECK-IN, SUBMIT, REVIEW, COMMENTS)
         ============================================================ */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-3xl text-slate-900 dark:text-slate-100 shadow-2xl my-8 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    {selectedTask.taskType === "PHYSICAL"
                      ? isBangla
                        ? "ফিজিক্যাল / মাঠ কাজ"
                        : "Physical / Field"
                      : selectedTask.taskType === "HYBRID"
                      ? isBangla
                        ? "হাইব্রিড"
                        : "Hybrid"
                      : isBangla
                      ? "অনলাইন কাজ"
                      : "Online Task"}
                  </span>
                  <span>·</span>
                  <span>{selectedTask.projectName}</span>
                  <span>·</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {selectedTask.status.replace("_", " ")}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedTask.title}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {onDeleteTask && canAssignTasks && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteTask(selectedTask.id);
                      setSelectedTaskId(null);
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    title={isBangla ? "টাস্ক মুছুন" : "Delete Task"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedTaskId(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
              {/* Immediate Post-Submission Appreciation / Late Notice */}
              {submissionBanner && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                    submissionBanner.type === "ON_TIME"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                  }`}
                >
                  {submissionBanner.type === "ON_TIME" ? (
                    <Award className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
                  )}
                  <p className="font-semibold leading-relaxed">{submissionBanner.message}</p>
                </div>
              )}

              {/* Key Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-500 block">{isBangla ? "দায়িত্বপ্রাপ্ত কর্মী" : "Assigned To"}</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {selectedTask.assignedToName || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">{isBangla ? "লাইন ম্যানেজার" : "Assigned By"}</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {selectedTask.assignedByName || "Line Manager"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">{isBangla ? "ডেডলাইন" : "Deadline"}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 block tabular-nums">
                    {selectedTask.dueDate || selectedTask.deadline || "—"}{" "}
                    {selectedTask.deadlineTime ? selectedTask.deadlineTime : ""}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">{isBangla ? "ব্যয়িত সময়" : "Tracked Time"}</span>
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400 mt-0.5 block tabular-nums">
                    {selectedTask.status === "IN_PROGRESS" && selectedTask.startedAt
                      ? formatDuration(
                          (selectedTask.timeSpentMinutes || 0) +
                            Math.max(1, Math.round((nowTick - new Date(selectedTask.startedAt).getTime()) / 60000)),
                          isBangla
                        )
                      : formatDuration(selectedTask.timeSpentMinutes, isBangla)}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  {isBangla ? "টাস্কের বিস্তারিত বিবরণ" : "Task Description"}
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedTask.description || (isBangla ? "কোনো অতিরিক্ত বিবরণ দেওয়া হয়নি।" : "No additional description.")}
                </p>
              </div>

              {/* Manager-Provided Attachments */}
              {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                    {isBangla ? "সংযুক্ত ফাইল ও লিংক" : "Attachments & Resources"}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.url}
                        target={att.type === "LINK" ? "_blank" : undefined}
                        rel={att.type === "LINK" ? "noopener noreferrer" : undefined}
                        download={att.type === "FILE" ? att.name : undefined}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        {att.type === "LINK" ? (
                          <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-teal-600" />
                        )}
                        <span className="truncate max-w-[240px]">{att.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Employee Submission Summary (visible once submitted or completed) */}
              {(selectedTask.submittedAt || selectedTask.submissionComment || selectedTask.submissionLink) && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      {isBangla ? "কর্মীর সাবমিশন ও ডেলিভারেবল" : "Employee Submission & Deliverable"}
                    </h4>
                    {selectedTask.isLateSubmission ? (
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {isBangla
                          ? `দেরিতে জমা (${formatDuration(selectedTask.lateByMinutes, true)} লেট)`
                          : `Late Submission (+${formatDuration(selectedTask.lateByMinutes, false)})`}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isBangla ? "সময়মতো জমা (On-Time)" : "Submitted On Time"}
                      </span>
                    )}
                  </div>

                  {selectedTask.submissionComment && (
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedTask.submissionComment}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {selectedTask.submissionLink && (
                      <a
                        href={
                          selectedTask.submissionLink.startsWith("http")
                            ? selectedTask.submissionLink
                            : `https://${selectedTask.submissionLink}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{selectedTask.submissionLink}</span>
                      </a>
                    )}
                    {selectedTask.submissionAttachmentUrl && (
                      <a
                        href={selectedTask.submissionAttachmentUrl}
                        download={selectedTask.submissionAttachmentName || "deliverable"}
                        className="inline-flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{selectedTask.submissionAttachmentName || "Download Attachment"}</span>
                      </a>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 tabular-nums pt-1">
                    {selectedTask.startedAt && (
                      <span>
                        {isBangla ? "চেক-ইন: " : "Checked in: "}
                        {new Date(selectedTask.startedAt).toLocaleString()} ·{" "}
                      </span>
                    )}
                    {selectedTask.submittedAt && (
                      <span>
                        {isBangla ? "জমার সময়: " : "Submitted: "}
                        {new Date(selectedTask.submittedAt).toLocaleString()} ·{" "}
                      </span>
                    )}
                    <span>
                      {isBangla ? "মোট ব্যয়িত সময়: " : "Total duration: "}
                      <strong>{formatDuration(selectedTask.timeSpentMinutes, isBangla)}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Action Controls for Employee & Line Manager */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                {isTaskAssignee(selectedTask) && selectedTask.status === "TODO" && (
                  <button
                    type="button"
                    onClick={() => handleStartTaskCheckIn(selectedTask)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>{isBangla ? "কাজ শুরু করুন (Check-In)" : "Start Task (Check-In)"}</span>
                  </button>
                )}

                {isTaskAssignee(selectedTask) &&
                  (selectedTask.status === "IN_PROGRESS" || selectedTask.status === "REVISION_REQUESTED") && (
                    <button
                      type="button"
                      onClick={() => setShowSubmitDialog(!showSubmitDialog)}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isBangla ? "রিভিউর জন্য জমা দিন (Submit for Review)" : "Submit for Review"}</span>
                    </button>
                  )}

                {isTaskReviewer(selectedTask) && selectedTask.status === "REVIEW" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleApproveTask(selectedTask)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isBangla ? "অনুমোদন ও সম্পন্ন করুন" : "Approve & Complete"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRevisionBox(!showRevisionBox)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{isBangla ? "পুনরায় সাবমিট করতে বলুন (Revision)" : "Request Revision"}</span>
                    </button>
                  </>
                )}
              </div>

              {/* Inline Submission Dialog */}
              {showSubmitDialog && (
                <form
                  onSubmit={handleSubmitForReview}
                  className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3"
                >
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {isBangla ? "রিভিউর জন্য সাবমিশন তথ্য দিন" : "Submit Work for Review"}
                  </h4>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isBangla ? "আপডেট / কমেন্ট *" : "Work Update / Submission Notes *"}
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={submissionComment}
                      onChange={(e) => setSubmissionComment(e.target.value)}
                      placeholder={
                        isBangla
                          ? "আপনি কাজটি কীভাবে সম্পন্ন করেছেন তা সংক্ষেপে লিখুন..."
                          : "Summarize your completed work or field update..."
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isBangla ? "অনলাইন ডেলিভারি লিংক (ঐচ্ছিক)" : "Online Deliverable Link (Optional)"}
                      </label>
                      <input
                        type="text"
                        value={submissionLink}
                        onChange={(e) => setSubmissionLink(e.target.value)}
                        placeholder="https://docs.google.com/..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isBangla ? "ফাইল অ্যাটাচমেন্ট (≤350KB)" : "Attachment File (≤350KB)"}
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer font-semibold text-slate-700 dark:text-slate-200">
                          <span>{submissionFile ? submissionFile.name : isBangla ? "ফাইল বেছে নিন" : "Choose File"}</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleTaskFileUpload(e, "SUBMISSION")}
                          />
                        </label>
                        {submissionFile && (
                          <button
                            type="button"
                            onClick={() => setSubmissionFile(null)}
                            className="text-rose-500 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {attachError && <p className="text-[11px] text-rose-600">{attachError}</p>}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSubmitDialog(false)}
                      className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer"
                    >
                      {isBangla ? "বাতিল" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer"
                    >
                      {isBangla ? "সাবমিট করুন" : "Confirm Submit"}
                    </button>
                  </div>
                </form>
              )}

              {/* Inline Revision Request Box for Line Manager */}
              {showRevisionBox && (
                <form
                  onSubmit={handleRequestRevision}
                  className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-3"
                >
                  <h4 className="font-bold text-rose-800 dark:text-rose-300">
                    {isBangla ? "সংশোধনের নির্দেশনা লিখুন (Revision Comment)" : "Revision Instructions"}
                  </h4>
                  <textarea
                    rows={2}
                    required
                    value={revisionComment}
                    onChange={(e) => setRevisionComment(e.target.value)}
                    placeholder={
                      isBangla
                        ? "কী কী পরিবর্তন বা সংশোধন করে পুনরায় জমা দিতে হবে তা স্পষ্ট করে লিখুন..."
                        : "Explain what needs to be updated before resubmitting..."
                    }
                    className="w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRevisionBox(false)}
                      className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer"
                    >
                      {isBangla ? "বাতিল" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer"
                    >
                      {isBangla ? "রিভিশনে ফেরত পাঠান" : "Send Back for Revision"}
                    </button>
                  </div>
                </form>
              )}

              {/* Bidirectional Comment / Discussion Thread */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>
                    {isBangla ? "আলোচনা ও কমেন্ট থ্রেড" : "Discussion & Activity Thread"} (
                    {selectedTask.comments?.length || 0})
                  </span>
                </h4>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {(selectedTask.comments || []).length === 0 ? (
                    <p className="text-slate-400 text-xs">
                      {isBangla
                        ? "কোনো প্রশ্ন বা আপডেট থাকলে নিচে কমেন্ট লিখুন।"
                        : "Post any questions or updates below."}
                    </p>
                  ) : (
                    (selectedTask.comments || []).map((c) => (
                      <div
                        key={c.id}
                        className={`p-3 rounded-xl border ${
                          c.type === "REVISION_REQUEST"
                            ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
                            : c.type === "APPROVAL"
                            ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                            : c.type === "SUBMISSION"
                            ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {c.authorName}{" "}
                            {c.authorRole && (
                              <span className="font-normal text-slate-500">· {c.authorRole}</span>
                            )}
                          </span>
                          <span className="text-slate-400 font-mono tabular-nums">
                            {new Date(c.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{c.message}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* New Comment Form */}
                <form onSubmit={handlePostComment} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder={
                      isBangla
                        ? "টাস্ক নিয়ে কোনো প্রশ্ন বা মন্তব্য লিখুন..."
                        : "Write a question, clarification, or feedback..."
                    }
                    className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold cursor-pointer transition-colors"
                  >
                    {isBangla ? "পাঠান" : "Send"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 3: CREATE NEW PROJECT
         ============================================================ */}
      {showProjectModal && canAssignTasks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isBangla ? "নতুন প্রজেক্ট তৈরি করুন" : "Create New Project"}
              </h3>
              <button
                type="button"
                onClick={() => setShowProjectModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "প্রজেক্টের নাম *" : "Project Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "প্রজেক্ট কোড" : "Project Code"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjCode}
                    onChange={(e) => setNewProjCode(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "শাখা" : "Branch"}
                  </label>
                  <select
                    value={newProjBranchId}
                    onChange={(e) => setNewProjBranchId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "বিভাগ" : "Department"}
                  </label>
                  <select
                    value={newProjDeptId}
                    onChange={(e) => setNewProjDeptId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "শুরুর তারিখ" : "Start Date"}
                  </label>
                  <input
                    type="date"
                    value={newProjStartDate}
                    onChange={(e) => setNewProjStartDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "ডেডলাইন" : "Deadline"}
                  </label>
                  <input
                    type="date"
                    value={newProjDeadline}
                    onChange={(e) => setNewProjDeadline(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isBangla ? "বিবরণ" : "Description"}
                </label>
                <textarea
                  rows={2}
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold cursor-pointer"
                >
                  {isBangla ? "প্রজেক্ট সংরক্ষণ করুন" : "Save Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
