import React, { useState, useMemo } from "react";
import {
  FolderKanban,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Filter,
  Layers,
  Sparkles,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Tag,
  Trash2,
  Edit2,
  ChevronRight,
  UserCheck,
  CheckSquare,
  X
} from "lucide-react";
import { Project, ProjectTask, Employee, Branch, Department } from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";

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
  onUpdateTaskStatus: (taskId: string, status: ProjectTask["status"]) => void;
  onDeleteTask?: (taskId: string) => void;
}

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
  onUpdateTaskStatus,
  onDeleteTask,
}) => {
  const { t, isBangla } = useThemeLanguage();

  // Role check: Only Super Admin, CEO, Branch Manager, or Project Lead can create/edit/delete
  const isSuperAdminOrCeo = (user?: Employee) => {
    if (!user) return false;
    return Boolean(
      user.role === "SUPER_ADMIN" ||
      user.isSuperAdmin ||
      user.role === "COMPANY_ADMIN" ||
      user.role === "CEO" ||
      user.isCeoOrOwner ||
      user.designationTitle?.toLowerCase().includes("ceo") ||
      user.designationTitle?.toLowerCase().includes("chief executive officer") ||
      user.designationTitle?.toLowerCase().includes("সিইও")
    );
  };

  const isBranchManager = (user?: Employee) => {
    if (!user) return false;
    return Boolean(
      user.role === "BRANCH_MANAGER" ||
      user.designationTitle?.toLowerCase().includes("branch manager") ||
      user.designationTitle?.toLowerCase().includes("শাখা প্রধান")
    );
  };

  // General employees CANNOT create, edit, or delete projects/tasks. They only view what is assigned to them.
  const canManageProjectsAndTasks = useMemo(() => {
    if (!currentUser) return false;
    if (isSuperAdminOrCeo(currentUser)) return true;
    if (isBranchManager(currentUser)) return true;
    const role = String(currentUser.role || "").toUpperCase();
    const desig = String(currentUser.designationTitle || "").toLowerCase();
    if (role === "HR_MANAGER" || role === "PROJECT_MANAGER" || desig.includes("project manager") || desig.includes("team lead")) {
      return true;
    }
    return false;
  }, [currentUser]);

  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [taskSearchTerm, setTaskSearchTerm] = useState<string>("");

  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);

  // New Project Form State
  const [newProjName, setNewProjName] = useState<string>("");
  const [newProjCode, setNewProjCode] = useState<string>(`PRJ-${Math.floor(Math.random() * 9000 + 1000)}`);
  const [newProjBranchId, setNewProjBranchId] = useState<string>(branches[0]?.id || "");
  const [newProjDeptId, setNewProjDeptId] = useState<string>(departments[0]?.id || "");
  const [newProjManagerId, setNewProjManagerId] = useState<string>(employees[0]?.id || "");
  const [newProjMembers, setNewProjMembers] = useState<string[]>([]);
  const [newProjStartDate, setNewProjStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [newProjDeadline, setNewProjDeadline] = useState<string>("2026-12-31");
  const [newProjPriority, setNewProjPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("HIGH");
  const [newProjBudget, setNewProjBudget] = useState<number>(500000);
  const [newProjDesc, setNewProjDesc] = useState<string>("");

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [newTaskProjId, setNewTaskProjId] = useState<string>(projects[0]?.id || "");
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<string>(employees[0]?.id || "");
  const [newTaskPriority, setNewTaskPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("HIGH");
  const [newTaskEstHours, setNewTaskEstHours] = useState<number>(16);
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>("2026-09-30");
  const [newTaskDesc, setNewTaskDesc] = useState<string>("");

  // Accessible projects: General employees ONLY see projects they are assigned to or part of
  const accessibleProjects = useMemo(() => {
    if (canManageProjectsAndTasks) return projects;
    if (!currentUser) return [];

    return projects.filter((p) => {
      const isTeamMember =
        (p.teamMemberIds && p.teamMemberIds.includes(currentUser.id)) ||
        (p.teamMembers && p.teamMembers.some((m) => m.id === currentUser.id));
      const isManager = p.managerId === currentUser.id;
      const isMyDept = Boolean(currentUser.departmentId && p.departmentId === currentUser.departmentId);
      const hasMyTask = tasks.some(
        (t) =>
          t.projectId === p.id &&
          (t.assignedToEmployeeId === currentUser.id ||
            (t.assignedToName && currentUser.fullName && t.assignedToName.toLowerCase().includes(currentUser.fullName.toLowerCase())))
      );
      return isTeamMember || isManager || isMyDept || hasMyTask;
    });
  }, [projects, tasks, canManageProjectsAndTasks, currentUser]);

  // Filter projects by branch and department
  const filteredProjects = useMemo(() => {
    return accessibleProjects.filter((p) => {
      const matchBranch = selectedBranchId === "ALL" || p.branchId === selectedBranchId;
      const matchDept = selectedDeptId === "ALL" || p.departmentId === selectedDeptId;
      return matchBranch && matchDept;
    });
  }, [accessibleProjects, selectedBranchId, selectedDeptId]);

  // Current active project details
  const activeProject = useMemo(() => {
    if (selectedProjectId === "ALL") return null;
    return accessibleProjects.find((p) => p.id === selectedProjectId) || null;
  }, [accessibleProjects, selectedProjectId]);

  // Filter tasks: General employee ONLY sees tasks assigned to themselves
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!canManageProjectsAndTasks && currentUser) {
        const isMyTask =
          t.assignedToEmployeeId === currentUser.id ||
          (t.assignedToName && currentUser.fullName && t.assignedToName.toLowerCase().includes(currentUser.fullName.toLowerCase()));
        if (!isMyTask) return false;
      }

      const matchProject =
        selectedProjectId === "ALL"
          ? filteredProjects.some((p) => p.id === t.projectId) || filteredProjects.length === 0
          : t.projectId === selectedProjectId;

      const matchSearch =
        taskSearchTerm === "" ||
        t.title.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        (t.assignedToName && t.assignedToName.toLowerCase().includes(taskSearchTerm.toLowerCase())) ||
        t.projectName.toLowerCase().includes(taskSearchTerm.toLowerCase());

      return matchProject && matchSearch;
    });
  }, [tasks, selectedProjectId, filteredProjects, taskSearchTerm, canManageProjectsAndTasks, currentUser]);

  const columns: Array<{ status: ProjectTask["status"]; label: string; labelBn: string; color: string }> = [
    { status: "TODO", label: "To Do", labelBn: "করণীয় কাজ", color: "border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60" },
    { status: "IN_PROGRESS", label: "In Progress", labelBn: "চলমান কাজ", color: "border-teal-500/30 bg-teal-500/5" },
    { status: "REVIEW", label: "In Review", labelBn: "পর্যালোচনা", color: "border-amber-500/30 bg-amber-500/5" },
    { status: "DONE", label: "Completed", labelBn: "সম্পন্ন", color: "border-emerald-500/30 bg-emerald-500/5" },
  ];

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const branch = branches.find((b) => b.id === newProjBranchId) || branches[0];
    const dept = departments.find((d) => d.id === newProjDeptId) || departments[0];
    const manager = employees.find((e) => e.id === newProjManagerId) || employees[0];
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
      departmentName: dept?.name || "Engineering",
      managerId: manager?.id,
      managerName: manager?.fullName,
      startDate: newProjStartDate,
      deadline: newProjDeadline,
      priority: newProjPriority,
      budget: Number(newProjBudget),
      spentBudget: 0,
      progressPercentage: 0,
      status: "ACTIVE",
      teamMembers: selectedTeam.length > 0 ? selectedTeam : [
        { id: manager.id, name: manager.fullName, avatarUrl: manager.avatarUrl, role: manager.designationTitle }
      ],
      teamMemberIds: newProjMembers.length > 0 ? newProjMembers : [manager.id],
      description: newProjDesc || "Enterprise strategic initiative.",
      totalTasks: 0,
      completedTasks: 0,
    };

    if (onAddProject) {
      onAddProject(newProject);
    }
    setShowProjectModal(false);
    setNewProjName("");
    setNewProjDesc("");
    setSelectedProjectId(newProject.id);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === newTaskProjId) || projects[0] || { id: "proj-general", name: "General Project" };
    const assignee = employees.find((e) => e.id === newTaskAssigneeId) || employees[0];

    const task: ProjectTask = {
      id: `task-${Date.now()}`,
      projectId: proj.id,
      projectName: proj.name,
      title: newTaskTitle,
      description: newTaskDesc || "Project deliverable implementation",
      assignedToEmployeeId: assignee?.id || "emp-01",
      assignedToName: assignee?.fullName || "Staff Member",
      assignedToAvatar: assignee?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      priority: newTaskPriority,
      status: "TODO",
      estimatedHours: Number(newTaskEstHours),
      loggedHours: 0,
      dueDate: newTaskDueDate,
    };

    onAddTask(task);
    setShowTaskModal(false);
    setNewTaskTitle("");
    setNewTaskDesc("");
  };

  const toggleMemberSelection = (empId: string) => {
    if (newProjMembers.includes(empId)) {
      setNewProjMembers(newProjMembers.filter((id) => id !== empId));
    } else {
      setNewProjMembers([...newProjMembers, empId]);
    }
  };

  return (
    <div id="projects-tasks-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Hierarchy Controls */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5" />
              <span>{isBangla ? "প্রজেক্ট ও টাস্ক ম্যানেজমেন্ট" : "Projects & Task Management"}</span>
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isBangla ? "ব্রাঞ্চ ➔ ডিপার্টমেন্ট ➔ প্রজেক্ট হায়ারার্কি" : "Branch ➔ Department ➔ Project Hierarchy"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            {isBangla ? "কর্পোরেট প্রজেক্ট ও স্প্রিন্ট কানবান বোর্ড" : "Enterprise Projects & Agile Sprint Board"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isBangla
              ? "ব্রাঞ্চ ও ডিপার্টমেন্ট অনুযায়ী নতুন প্রজেক্ট তৈরি করুন, ডেলিভারেবল এসাইন করুন এবং অগ্রগতি পর্যবেক্ষণ করুন"
              : "Create branch & department aligned projects, assign agile milestones, log billable hours & monitor execution"}
          </p>
        </div>

        {canManageProjectsAndTasks ? (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowProjectModal(true)}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-teal-500/40 text-teal-700 dark:text-teal-300 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isBangla ? "+ নতুন প্রজেক্ট তৈরি" : "+ Create New Project"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTaskModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckSquare className="w-4 h-4" />
              <span>{isBangla ? "+ নতুন টাস্ক যোগ" : "+ Create New Task"}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <UserCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="font-semibold">
              {isBangla ? "আমার অ্যাসাইনকৃত প্রজেক্ট ও স্প্রিন্ট টাস্ক" : "My Assigned Projects & Sprint Tasks"}
            </span>
          </div>
        )}
      </div>

      {/* Dynamic Filter Bar: Branch -> Department -> Project */}
      <div className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 ${canManageProjectsAndTasks ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2"} gap-3 text-xs`}>
        {canManageProjectsAndTasks && (
          <>
            {/* 1. Branch Selector */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{isBangla ? "ব্রাঞ্চ সিলেক্ট করুন:" : "1. Select Branch:"}</span>
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => {
                  setSelectedBranchId(e.target.value);
                  setSelectedProjectId("ALL");
                }}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">{isBangla ? "সকল ব্রাঞ্চ (All Branches)" : "All Branches"}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Department Selector */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{isBangla ? "ডিপার্টমেন্ট সিলেক্ট করুন:" : "2. Select Department:"}</span>
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => {
                  setSelectedDeptId(e.target.value);
                  setSelectedProjectId("ALL");
                }}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">{isBangla ? "সকল ডিপার্টমেন্ট (All Departments)" : "All Departments"}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* 3. Project Selector */}
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1 flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isBangla ? "প্রজেক্ট সিলেক্ট করুন:" : canManageProjectsAndTasks ? "3. Select Project:" : "Select Project:"}</span>
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">
              {isBangla
                ? canManageProjectsAndTasks
                  ? `সকল প্রজেক্ট (${filteredProjects.length} টি)`
                  : `আমার অ্যাসাইনকৃত প্রজেক্ট (${filteredProjects.length} টি)`
                : canManageProjectsAndTasks
                ? `All Active Projects (${filteredProjects.length})`
                : `My Assigned Projects (${filteredProjects.length})`}
            </option>
            {filteredProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.progressPercentage || 0}% Done)
              </option>
            ))}
          </select>
        </div>

        {/* 4. Task Search */}
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{isBangla ? "টাস্ক খুঁজুন:" : canManageProjectsAndTasks ? "4. Search Tasks:" : "Search Tasks:"}</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={taskSearchTerm}
              onChange={(e) => setTaskSearchTerm(e.target.value)}
              placeholder={isBangla ? "টাস্কের নাম দিয়ে খুঁজুন..." : "Task title, keyword..."}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
            {taskSearchTerm && (
              <button
                onClick={() => setTaskSearchTerm("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Empty State for General Employee with no assigned projects */}
      {filteredProjects.length === 0 && !canManageProjectsAndTasks && (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {isBangla ? "বর্তমানে আপনার জন্য কোনো অ্যাসাইনকৃত প্রজেক্ট বা টাস্ক নেই" : "No Projects or Tasks Currently Assigned to You"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {isBangla
              ? "যখন কোনো প্রজেক্ট বা স্প্রিন্ট টাস্কে আপনাকে বা আপনার টিমকে যুক্ত করা হবে, তখন আপনি তা এখানে স্বয়ংক্রিয়ভাবে দেখতে পাবেন।"
              : "When you or your team are assigned to an active project or sprint task, it will appear here automatically."}
          </p>
        </div>
      )}

      {/* Selected Project Overview Card (When a specific project is selected) */}
      {activeProject && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-teal-500/30 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30">
                  {activeProject.code || "PRJ"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {activeProject.branchName || "Branch"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {activeProject.departmentName || "Department"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeProject.priority === "URGENT" || activeProject.priority === "HIGH"
                      ? "bg-red-500/15 text-red-800 dark:text-red-300 border border-red-500/30"
                      : "bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30"
                  }`}
                >
                  {activeProject.priority || "MEDIUM"}
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1.5">{activeProject.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-3xl">{activeProject.description}</p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{isBangla ? "প্রজেক্ট বাজেট" : "Allocated Budget"}</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  ৳{(activeProject.budget || 0).toLocaleString()} BDT
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{isBangla ? "ডেডলাইন" : "Deadline"}</span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {activeProject.deadline || "Ongoing"}
                </span>
              </div>
              {onDeleteProject && canManageProjectsAndTasks && (
                <button
                  onClick={() => {
                    if (confirm(isBangla ? "আপনি কি এই প্রজেক্টটি মুছে ফেলতে চান?" : "Are you sure you want to delete this project?")) {
                      onDeleteProject(activeProject.id);
                      setSelectedProjectId("ALL");
                    }
                  }}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 cursor-pointer"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar & Team Members */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <span>{isBangla ? "প্রজেক্ট অগ্রগতি" : "Sprint Execution Progress"}</span>
                <span className="text-teal-600 dark:text-teal-400 font-mono">{activeProject.progressPercentage || 0}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${activeProject.progressPercentage || 0}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{isBangla ? "প্রজেক্ট ম্যানেজার" : "Project Manager"}</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs">{activeProject.managerName || "HR Lead"}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{isBangla ? "টিম মেম্বার্স" : "Team Members"}</span>
                <div className="flex items-center -space-x-2 mt-0.5">
                  {(activeProject.teamMembers || []).slice(0, 5).map((m, idx) => (
                    <img
                      key={idx}
                      src={m.avatarUrl}
                      alt={m.name}
                      title={m.name}
                      className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                    />
                  ))}
                  {(activeProject.teamMembers || []).length > 5 && (
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 text-[10px] text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center">
                      +{(activeProject.teamMembers || []).length - 5}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.status);
          return (
            <div
              key={col.status}
              className={`p-4 rounded-2xl border ${col.color} flex flex-col min-h-[500px] transition-all`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isBangla ? col.labelBn : col.label}
                </span>
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-teal-700 dark:text-teal-400 font-bold text-[10px] flex items-center justify-center">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                    {isBangla ? "কোনো টাস্ক নেই" : "No tasks in this column"}
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-teal-500/50 transition-all space-y-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-teal-700 dark:text-teal-300 truncate max-w-[140px]">
                          {task.projectName}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            task.priority === "URGENT" || task.priority === "HIGH"
                              ? "bg-red-500/15 text-red-800 dark:text-red-300"
                              : "bg-blue-500/15 text-blue-800 dark:text-blue-300"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-snug">{task.title}</h4>
                      {task.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={task.assignedToAvatar}
                            alt={task.assignedToName || "Assignee"}
                            className="w-5 h-5 rounded-full object-cover border border-teal-500/40"
                          />
                          <span className="text-[10px] text-slate-700 dark:text-slate-300 truncate max-w-[80px]">
                            {(task.assignedToName || "Unassigned").split(" ")[0]}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          <Clock className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          <span>{task.loggedHours || 0}/{task.estimatedHours || 16}h</span>
                        </div>
                      </div>

                      {/* Move Stage Selector & Delete */}
                      <div className="pt-1 flex items-center gap-2">
                        <select
                          value={task.status}
                          onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as any)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] rounded-lg px-2 py-1 focus:border-teal-500"
                        >
                          <option value="TODO">{isBangla ? "মুভ: করণীয়" : "Move: To Do"}</option>
                          <option value="IN_PROGRESS">{isBangla ? "মুভ: চলমান" : "Move: In Progress"}</option>
                          <option value="REVIEW">{isBangla ? "মুভ: রিভিউ" : "Move: Review"}</option>
                          <option value="DONE">{isBangla ? "মুভ: সম্পন্ন" : "Move: Done"}</option>
                        </select>

                        {onDeleteTask && canManageProjectsAndTasks && (
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-500 cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create New Project */}
      {showProjectModal && canManageProjectsAndTasks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>{isBangla ? "নতুন এন্টারপ্রাইজ প্রজেক্ট তৈরি করুন" : "Create New Enterprise Project"}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBangla
                    ? "নির্দিষ্ট ব্রাঞ্চ ও ডিপার্টমেন্টের অধীনে প্রজেক্ট কনফিগার করুন"
                    : "Configure strategic milestone aligned with specific branch & department"}
                </p>
              </div>
              <button
                onClick={() => setShowProjectModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {isBangla ? "প্রজেক্টের নাম *" : "Project Name *"}
                  </label>
                  <input
                    type="text"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    placeholder="e.g. Core ERP Cloud Migration & Mobile App"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {isBangla ? "প্রজেক্ট কোড" : "Project Code"}
                  </label>
                  <input
                    type="text"
                    value={newProjCode}
                    onChange={(e) => setNewProjCode(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* Branch & Department Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {isBangla ? "অধীনস্থ ব্রাঞ্চ *" : "Assigned Branch *"}
                  </label>
                  <select
                    value={newProjBranchId}
                    onChange={(e) => setNewProjBranchId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {isBangla ? "অধীনস্থ ডিপার্টমেন্ট *" : "Assigned Department *"}
                  </label>
                  <select
                    value={newProjDeptId}
                    onChange={(e) => setNewProjDeptId(e.target.value)}
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

              {/* Manager & Priority & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {isBangla ? "প্রজেক্ট ম্যানেজার *" : "Project Manager *"}
                  </label>
                  <select
                    value={newProjManagerId}
                    onChange={(e) => setNewProjManagerId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName} ({e.designationTitle})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {isBangla ? "অগ্রাধিকার (Priority)" : "Priority Level"}
                  </label>
                  <select
                    value={newProjPriority}
                    onChange={(e) => setNewProjPriority(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent / Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {isBangla ? "বাজেট (BDT ৳)" : "Budget (BDT ৳)"}
                  </label>
                  <input
                    type="number"
                    value={newProjBudget}
                    onChange={(e) => setNewProjBudget(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {isBangla ? "শুরুর তারিখ" : "Start Date"}
                  </label>
                  <input
                    type="date"
                    value={newProjStartDate}
                    onChange={(e) => setNewProjStartDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {isBangla ? "ডেডলাইন / সমাপ্তি" : "Target Deadline"}
                  </label>
                  <input
                    type="date"
                    value={newProjDeadline}
                    onChange={(e) => setNewProjDeadline(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Team Members Multi-Select */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1.5">
                  {isBangla ? "টিম মেম্বারদের যুক্ত করুন (মাল্টি-সিলেক্ট):" : "Assign Team Members (Multi-select):"}
                </label>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 max-h-36 overflow-y-auto space-y-1.5">
                  {employees.map((emp) => {
                    const isChecked = newProjMembers.includes(emp.id);
                    return (
                      <label
                        key={emp.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          isChecked ? "bg-teal-500/10 border border-teal-500/30" : "hover:bg-slate-100 dark:hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={emp.avatarUrl}
                            alt={emp.fullName}
                            className="w-6 h-6 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-xs block leading-tight">{emp.fullName}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">{emp.designationTitle} • {emp.departmentName}</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleMemberSelection(emp.id)}
                          className="rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  {isBangla ? "প্রজেক্টের বিবরণ ও লক্ষ্য" : "Project Objectives & Scope"}
                </label>
                <textarea
                  rows={3}
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder={isBangla ? "প্রজেক্টের মূল উদ্দেশ্য ও ডেলিভারেবল সম্পর্কে লিখুন..." : "Outline key deliverables and milestones..."}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  {isBangla ? "প্রজেক্ট তৈরি করুন" : "Publish Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Task */}
      {showTaskModal && canManageProjectsAndTasks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>{isBangla ? "নতুন টাস্ক বা স্প্রিন্ট আইটেম যোগ করুন" : "Create Project Deliverable / Task"}</span>
              </h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  {isBangla ? "টাস্ক টাইটেল *" : "Task Title *"}
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Implement WebRTC Face Verification Algorithm"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {isBangla ? "প্রজেক্ট *" : "Project *"}
                  </label>
                  <select
                    value={newTaskProjId}
                    onChange={(e) => setNewTaskProjId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {isBangla ? "এসাইন করুন *" : "Assignee *"}
                  </label>
                  <select
                    value={newTaskAssigneeId}
                    onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {isBangla ? "অগ্রাধিকার" : "Priority"}
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {isBangla ? "আনুমানিক ঘণ্টা" : "Est. Hours"}
                  </label>
                  <input
                    type="number"
                    value={newTaskEstHours}
                    onChange={(e) => setNewTaskEstHours(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {isBangla ? "জমার তারিখ" : "Due Date"}
                  </label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  {isBangla ? "টাস্ক বিবরণ" : "Task Details & Requirements"}
                </label>
                <textarea
                  rows={2}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Specify task acceptance criteria..."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  {isBangla ? "টাস্ক তৈরি করুন" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
