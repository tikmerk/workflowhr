import React, { useState, useMemo, useEffect } from "react";
import {
  MessageSquareHeart,
  ShieldAlert,
  Award,
  Plus,
  Star,
  Lock,
  CheckCircle2,
  BarChart3,
  Send,
  Trash2,
  FileSpreadsheet,
  X,
  Eye,
  Scale,
  Users,
  Calendar,
  UserCheck,
  UserCog,
  Building2,
  Briefcase,
  HeartHandshake,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Employee,
  FeedbackSurvey,
  SurveyResponse,
  AnonymousFeedback,
  TeamMemberRating,
  ManagerRating,
  SurveyCategory,
  SurveyQuestion,
  ProjectTask,
  DailyWorkLog,
  AttendanceRecord,
  SystemNotification,
} from "../../types";
import { DEFAULT_SURVEY_QUESTIONS_TEMPLATE } from "../../services/firestoreService";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { exportMultiSheetExcel } from "../../utils/exportUtils";

interface FeedbackSurveysViewProps {
  employees: Employee[];
  currentUser: Employee;
  surveys: FeedbackSurvey[];
  surveyResponses: SurveyResponse[];
  anonymousFeedback: AnonymousFeedback[];
  teamRatings: TeamMemberRating[];
  managerRatings: ManagerRating[];
  tasks: ProjectTask[];
  workLogs: DailyWorkLog[];
  attendanceLogs: AttendanceRecord[];
  onSaveSurvey: (survey: FeedbackSurvey) => void;
  onDeleteSurvey: (surveyId: string) => void;
  onSubmitSurveyResponse: (response: SurveyResponse) => void;
  onSubmitAnonymousFeedback: (item: AnonymousFeedback) => void;
  onUpdateAnonymousFeedback: (item: AnonymousFeedback) => void;
  onDeleteAnonymousFeedback: (id: string) => void;
  onSaveTeamRating: (rating: TeamMemberRating) => void;
  onDeleteTeamRating: (ratingId: string) => void;
  onSaveManagerRating: (rating: ManagerRating) => void;
  onDeleteManagerRating: (ratingId: string) => void;
  onUpdateEmployee?: (emp: Employee) => void;
  onSendNotification?: (notification: Omit<SystemNotification, "id" | "timestamp" | "read">) => void;
}

type CoreSurveyCategory = "WORKPLACE" | "MANAGER" | "COWORKERS" | "ENVIRONMENT" | "SERVICES";

const CORE_SURVEY_CATEGORIES: CoreSurveyCategory[] = [
  "WORKPLACE",
  "MANAGER",
  "COWORKERS",
  "ENVIRONMENT",
  "SERVICES",
];

const normalizeSurveyCategory = (cat: SurveyCategory): CoreSurveyCategory => {
  if (cat === "WORK") return "WORKPLACE";
  if (cat === "TEAM") return "COWORKERS";
  if (cat === "WORKPLACE" || cat === "MANAGER" || cat === "COWORKERS" || cat === "ENVIRONMENT" || cat === "SERVICES") {
    return cat;
  }
  return "WORKPLACE";
};

const CORE_CATEGORY_META: Record<
  CoreSurveyCategory,
  { en: string; bn: string; descBn: string; descEn: string; colorClass: string }
> = {
  WORKPLACE: {
    en: "Workplace & Role",
    bn: "কর্মক্ষেত্র ও কাজের মান",
    descBn: "কাজের চাপ, দায়িত্বের স্পষ্টতা এবং দক্ষতা বৃদ্ধির সুযোগ",
    descEn: "Workload balance, role clarity, and professional growth",
    colorClass: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30",
  },
  MANAGER: {
    en: "Line Manager & Leadership",
    bn: "লাইন ম্যানেজার ও নেতৃত্ব",
    descBn: "ম্যানেজারের নির্দেশনা, নিরপেক্ষ মূল্যায়ন ও সমস্যা সমাধানে সহযোগিতা",
    descEn: "Manager guidance, fair evaluation, and problem-solving support",
    colorClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30",
  },
  COWORKERS: {
    en: "Co-workers & Teamwork",
    bn: "সহকর্মী ও টিমওয়ার্ক",
    descBn: "সহকর্মীদের সহযোগিতা, পারস্পরিক শ্রদ্ধা এবং আন্তঃবিভাগীয় সমন্বয়",
    descEn: "Peer collaboration, mutual respect, and cross-team coordination",
    colorClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
  },
  ENVIRONMENT: {
    en: "Work Environment & Culture",
    bn: "কাজের পরিবেশ ও সংস্কৃতি",
    descBn: "অফিসের পরিবেশ, মানসিক নিরাপত্তা ও মতামত প্রকাশের স্বাধীনতা",
    descEn: "Physical environment, psychological safety, and open culture",
    colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  },
  SERVICES: {
    en: "Office Services, HR & Benefits",
    bn: "অফিস সার্ভিস, এইচআর ও সুবিধা",
    descBn: "এইচআর/আইটি সাপোর্ট, সময়মতো বেতন-ছুটি এবং অফিস লজিস্টিক সুবিধা",
    descEn: "HR/IT responsiveness, payroll/leave transparency, and facilities",
    colorClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  },
};

const RATING_SCALE_LABELS = [
  { val: 1, bn: "খুবই অসন্তুষ্ট", en: "Very Poor" },
  { val: 2, bn: "অসন্তুষ্ট", en: "Poor" },
  { val: 3, bn: "মোটামুটি", en: "Average" },
  { val: 4, bn: "সন্তুষ্ট", en: "Good" },
  { val: 5, bn: "অত্যন্ত সন্তুষ্ট", en: "Excellent" },
];

const ANON_CATEGORIES: Array<{ value: AnonymousFeedback["category"]; en: string; bn: string }> = [
  { value: "WORK_ENVIRONMENT", en: "Workplace Environment", bn: "কাজের পরিবেশ ও সুবিধা" },
  { value: "MANAGEMENT", en: "Management & Leadership", bn: "ম্যানেজমেন্ট ও নেতৃত্ব" },
  { value: "POLICY", en: "Company Policy & Rules", bn: "প্রতিষ্ঠানের নীতিমালা" },
  { value: "HARASSMENT_SAFETY", en: "Safety / Harassment Concern", bn: "নিরাপত্তা বা হয়রানি অভিযোগ" },
  { value: "PAYROLL_BENEFITS", en: "Salary & Benefits", bn: "বেতন ও সুযোগ-সুবিধা" },
  { value: "SUGGESTION", en: "Improvement Suggestion", bn: "উন্নয়নমূলক পরামর্শ" },
  { value: "OTHER", en: "Other", bn: "অন্যান্য" },
];

export const FeedbackSurveysView: React.FC<FeedbackSurveysViewProps> = ({
  employees,
  currentUser,
  surveys,
  surveyResponses,
  anonymousFeedback,
  teamRatings,
  managerRatings,
  tasks,
  workLogs,
  attendanceLogs,
  onSaveSurvey,
  onDeleteSurvey,
  onSubmitSurveyResponse,
  onSubmitAnonymousFeedback,
  onUpdateAnonymousFeedback,
  onDeleteAnonymousFeedback,
  onSaveTeamRating,
  onDeleteTeamRating,
  onSaveManagerRating,
  onDeleteManagerRating,
  onUpdateEmployee,
  onSendNotification,
}) => {
  const { isBangla } = useThemeLanguage();

  const todayIso = new Date().toISOString().split("T")[0];
  const currentMonthStr = todayIso.slice(0, 7);

  const isAdminOrHr = useMemo(() => {
    const role = String(currentUser.role || "").toUpperCase();
    return Boolean(
      currentUser.isSuperAdmin ||
        currentUser.isCeoOrOwner ||
        ["SUPER_ADMIN", "GRAND_ADMIN", "COMPANY_ADMIN", "CEO", "HR_MANAGER"].includes(role)
    );
  }, [currentUser]);

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status !== "TERMINATED" && e.status !== "RESIGNED"),
    [employees]
  );

  // Strict Direct Team Members (employees whose reportingManagerId === currentUser.id)
  const myDirectTeam = useMemo(
    () => activeEmployees.filter((e) => e.reportingManagerId === currentUser.id && e.id !== currentUser.id),
    [activeEmployees, currentUser.id]
  );

  // Employees who belong to ANY team (have a reportingManagerId)
  const allTeamAssignedEmployees = useMemo(
    () => activeEmployees.filter((e) => Boolean(e.reportingManagerId) && e.id !== currentUser.id),
    [activeEmployees, currentUser.id]
  );

  // Employees who are NOT assigned to any team/manager (excluding top executives)
  const unassignedEmployees = useMemo(
    () =>
      activeEmployees.filter(
        (e) =>
          !e.reportingManagerId &&
          !e.isSuperAdmin &&
          !e.isCeoOrOwner &&
          e.role !== "SUPER_ADMIN" &&
          e.role !== "CEO"
      ),
    [activeEmployees]
  );

  // Strict Own Reporting Manager for Employee -> Manager rating
  const myReportingManager = useMemo(() => {
    if (!currentUser.reportingManagerId || currentUser.reportingManagerId === currentUser.id) return null;
    return activeEmployees.find((e) => e.id === currentUser.reportingManagerId) || null;
  }, [activeEmployees, currentUser]);

  // Who can rate team members: Admins/HR (for oversight/assigned staff) OR Managers who have direct team members
  const isTeamManager = useMemo(() => {
    if (isAdminOrHr) return true;
    const role = String(currentUser.role || "").toUpperCase();
    const desig = String(currentUser.designationTitle || "").toLowerCase();
    return Boolean(
      myDirectTeam.length > 0 ||
        ["BRANCH_MANAGER", "PROJECT_MANAGER", "TEAM_LEADER", "ACCOUNTS_MANAGER"].includes(role) ||
        desig.includes("manager") ||
        desig.includes("lead") ||
        desig.includes("head")
    );
  }, [isAdminOrHr, currentUser, myDirectTeam.length]);

  const rateableTeamMembers = useMemo(() => {
    if (isAdminOrHr) return allTeamAssignedEmployees;
    return myDirectTeam;
  }, [isAdminOrHr, allTeamAssignedEmployees, myDirectTeam]);

  const [activeSubTab, setActiveSubTab] = useState<"SURVEYS" | "ANONYMOUS" | "TEAM_POINTS" | "MANAGER_RATING">(
    "SURVEYS"
  );

  // ==========================================================
  // TAB 1: DETAILED 5-CATEGORY SURVEYS STATE
  // ==========================================================
  const [takingSurvey, setTakingSurvey] = useState<FeedbackSurvey | null>(null);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, { rating: number; comment: string }>>({});
  const [surveyGeneralComment, setSurveyGeneralComment] = useState<string>("");
  const [analyticsSurveyId, setAnalyticsSurveyId] = useState<string | null>(null);

  // Create Survey Modal State (with customizable 5-category questions)
  const [showCreateSurveyModal, setShowCreateSurveyModal] = useState<boolean>(false);
  const [newSurveyTitleEn, setNewSurveyTitleEn] = useState<string>("");
  const [newSurveyTitleBn, setNewSurveyTitleBn] = useState<string>("");
  const [newSurveyCycle, setNewSurveyCycle] = useState<FeedbackSurvey["cycleType"]>("MONTHLY");
  const [newSurveyPeriod, setNewSurveyPeriod] = useState<string>(currentMonthStr);
  const [newSurveyStart, setNewSurveyStart] = useState<string>(todayIso);
  const [newSurveyEnd, setNewSurveyEnd] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [newSurveyDesc, setNewSurveyDesc] = useState<string>("");
  const [newSurveyQuestions, setNewSurveyQuestions] = useState<SurveyQuestion[]>(() =>
    DEFAULT_SURVEY_QUESTIONS_TEMPLATE.map((q) => ({ ...q }))
  );
  const [customQCategory, setCustomQCategory] = useState<CoreSurveyCategory>("WORKPLACE");
  const [customQBn, setCustomQBn] = useState<string>("");
  const [customQEn, setCustomQEn] = useState<string>("");

  const openTakeSurvey = (survey: FeedbackSurvey) => {
    setTakingSurvey(survey);
    const initial: Record<string, { rating: number; comment: string }> = {};
    survey.questions.forEach((q) => {
      initial[q.id] = { rating: 0, comment: "" };
    });
    setSurveyAnswers(initial);
    setSurveyGeneralComment("");
  };

  const handleSubmitSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!takingSurvey) return;
    const answersList = takingSurvey.questions.map((q) => ({
      questionId: q.id,
      category: normalizeSurveyCategory(q.category),
      rating: surveyAnswers[q.id]?.rating || 3,
      comment: surveyAnswers[q.id]?.comment?.trim() || undefined,
    }));
    const validRatings = answersList.map((a) => a.rating || 0).filter((r) => r > 0);
    const overallScore = validRatings.length
      ? Number((validRatings.reduce((s, r) => s + r, 0) / validRatings.length).toFixed(2))
      : 0;

    const response: SurveyResponse = {
      id: `sresp-${takingSurvey.id}-${currentUser.id}-${Date.now()}`,
      surveyId: takingSurvey.id,
      employeeId: currentUser.id,
      employeeName: currentUser.fullName,
      employeeCode: currentUser.employeeCode || "",
      departmentName: currentUser.departmentName || "",
      branchName: currentUser.branchName || "",
      reportingManagerId: currentUser.reportingManagerId || undefined,
      submittedAt: new Date().toISOString(),
      answers: answersList,
      overallScore,
      generalComment: surveyGeneralComment.trim() || undefined,
    };

    onSubmitSurveyResponse(response);
    setTakingSurvey(null);
  };

  const handleAddCustomQuestion = () => {
    if (!customQBn.trim() && !customQEn.trim()) return;
    const newQ: SurveyQuestion = {
      id: `q-custom-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      category: customQCategory,
      questionBn: customQBn.trim() || customQEn.trim(),
      questionEn: customQEn.trim() || customQBn.trim(),
      type: "RATING",
    };
    setNewSurveyQuestions((prev) => [...prev, newQ]);
    setCustomQBn("");
    setCustomQEn("");
  };

  const handleCreateSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurveyTitleBn.trim() && !newSurveyTitleEn.trim()) return;
    if (newSurveyQuestions.length === 0) return;
    const payload: FeedbackSurvey = {
      id: `survey-${Date.now()}`,
      title: newSurveyTitleEn.trim() || newSurveyTitleBn.trim(),
      titleBn: newSurveyTitleBn.trim() || newSurveyTitleEn.trim(),
      cycleType: newSurveyCycle,
      periodLabel: newSurveyPeriod || currentMonthStr,
      startDate: newSurveyStart,
      endDate: newSurveyEnd,
      isActive: true,
      createdBy: currentUser.fullName,
      createdAt: new Date().toISOString(),
      description: newSurveyDesc.trim() || undefined,
      questions: newSurveyQuestions,
    };
    onSaveSurvey(payload);
    if (onSendNotification) {
      onSendNotification({
        title: isBangla ? "নতুন এমপ্লয়ি সার্ভে চালু হয়েছে" : "New Employee Survey Launched",
        message: `${payload.titleBn || payload.title} (${payload.periodLabel})`,
        type: "INFO",
        module: "FEEDBACK_SURVEYS",
      });
    }
    setShowCreateSurveyModal(false);
    setNewSurveyTitleEn("");
    setNewSurveyTitleBn("");
    setNewSurveyDesc("");
    setNewSurveyQuestions(DEFAULT_SURVEY_QUESTIONS_TEMPLATE.map((q) => ({ ...q })));
  };

  const computeSurveyAnalytics = (survey: FeedbackSurvey) => {
    const resps = surveyResponses.filter((r) => r.surveyId === survey.id);
    const overallAvg = resps.length
      ? Number((resps.reduce((s, r) => s + (r.overallScore || 0), 0) / resps.length).toFixed(2))
      : 0;

    const categoryStats: Record<CoreSurveyCategory, { sum: number; count: number; avg: number }> = {
      WORKPLACE: { sum: 0, count: 0, avg: 0 },
      MANAGER: { sum: 0, count: 0, avg: 0 },
      COWORKERS: { sum: 0, count: 0, avg: 0 },
      ENVIRONMENT: { sum: 0, count: 0, avg: 0 },
      SERVICES: { sum: 0, count: 0, avg: 0 },
    };

    const questionStats = new Map<string, { sum: number; count: number; comments: string[] }>();
    survey.questions.forEach((q) => questionStats.set(q.id, { sum: 0, count: 0, comments: [] }));

    resps.forEach((resp) => {
      (resp.answers || []).forEach((ans) => {
        const normCat = normalizeSurveyCategory(ans.category);
        if (ans.rating && ans.rating > 0) {
          categoryStats[normCat].sum += ans.rating;
          categoryStats[normCat].count += 1;
          const qs = questionStats.get(ans.questionId);
          if (qs) {
            qs.sum += ans.rating;
            qs.count += 1;
            if (ans.comment) qs.comments.push(ans.comment);
          }
        }
      });
    });

    CORE_SURVEY_CATEGORIES.forEach((c) => {
      categoryStats[c].avg = categoryStats[c].count
        ? Number((categoryStats[c].sum / categoryStats[c].count).toFixed(2))
        : 0;
    });

    return { responses: resps, overallAvg, categoryStats, questionStats };
  };

  const handleExportSurveyExcel = (survey: FeedbackSurvey) => {
    const stats = computeSurveyAnalytics(survey);
    const catRows = CORE_SURVEY_CATEGORIES.map((c) => ({
      Category: `${CORE_CATEGORY_META[c].en} (${CORE_CATEGORY_META[c].bn})`,
      "Average Score (out of 5)": stats.categoryStats[c].avg,
      "Total Ratings": stats.categoryStats[c].count,
    }));
    const qRows = survey.questions.map((q, idx) => {
      const qs = stats.questionStats.get(q.id);
      const avg = qs && qs.count ? Number((qs.sum / qs.count).toFixed(2)) : 0;
      const c = normalizeSurveyCategory(q.category);
      return {
        "#": idx + 1,
        Category: CORE_CATEGORY_META[c].en,
        "Question (EN)": q.questionEn,
        "Question (BN)": q.questionBn,
        "Avg Rating (/5)": avg,
        "Responses": qs?.count || 0,
      };
    });
    const respRows = stats.responses.map((r) => {
      const catScores: Record<string, number> = {};
      CORE_SURVEY_CATEGORIES.forEach((c) => {
        const matching = (r.answers || []).filter((a) => normalizeSurveyCategory(a.category) === c && a.rating);
        catScores[CORE_CATEGORY_META[c].en] = matching.length
          ? Number((matching.reduce((s, a) => s + (a.rating || 0), 0) / matching.length).toFixed(2))
          : 0;
      });
      return {
        "Employee Code": r.employeeCode,
        "Employee Name": r.employeeName,
        Department: r.departmentName,
        "Submitted At": r.submittedAt.slice(0, 10),
        "Overall (/5)": r.overallScore,
        ...catScores,
        "General Comment": r.generalComment || "",
      };
    });

    exportMultiSheetExcel(`Survey_Analytics_${survey.periodLabel || survey.id}`, [
      { name: "Category_Summary", rows: catRows },
      { name: "Question_Breakdown", rows: qRows },
      { name: "Individual_Responses", rows: respRows.length ? respRows : [{ Info: "No responses yet" }] },
    ]);
  };

  // ==========================================================
  // TAB 2: 100% ANONYMOUS FEEDBACK STATE (ZERO PII)
  // ==========================================================
  const [anonCategory, setAnonCategory] = useState<AnonymousFeedback["category"]>("WORK_ENVIRONMENT");
  const [anonUrgency, setAnonUrgency] = useState<AnonymousFeedback["urgency"]>("MEDIUM");
  const [anonSubject, setAnonSubject] = useState<string>("");
  const [anonMessage, setAnonMessage] = useState<string>("");
  const [anonSentSuccess, setAnonSentSuccess] = useState<boolean>(false);
  const [anonStatusFilter, setAnonStatusFilter] = useState<"ALL" | AnonymousFeedback["status"]>("ALL");
  const [actionNoteDrafts, setActionNoteDrafts] = useState<Record<string, string>>({});

  const handleSubmitAnon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!anonSubject.trim() || !anonMessage.trim()) return;
    // STRICT ZERO-PII PAYLOAD
    const item: AnonymousFeedback = {
      id: `anon-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      category: anonCategory,
      subject: anonSubject.trim(),
      message: anonMessage.trim(),
      urgency: anonUrgency,
      submittedAt: new Date().toISOString(),
      status: "NEW",
    };
    onSubmitAnonymousFeedback(item);
    setAnonSubject("");
    setAnonMessage("");
    setAnonUrgency("MEDIUM");
    setAnonSentSuccess(true);
    setTimeout(() => setAnonSentSuccess(false), 5000);
  };

  // ==========================================================
  // TAB 3: TEAM MEMBER POINTS (MANAGER -> OWN TEAM ONLY)
  // ==========================================================
  const [ratingMonth, setRatingMonth] = useState<string>(currentMonthStr);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string>("");
  const [showTeamAssignmentPanel, setShowTeamAssignmentPanel] = useState<boolean>(false);
  const [criteria, setCriteria] = useState({
    taskDelivery: 16,
    workQuality: 16,
    teamwork: 16,
    initiative: 16,
    punctuality: 16,
  });
  const [ratingRemarks, setRatingRemarks] = useState<string>("");

  useEffect(() => {
    if (rateableTeamMembers.length > 0 && !rateableTeamMembers.some((e) => e.id === selectedTeamMemberId)) {
      setSelectedTeamMemberId(rateableTeamMembers[0].id);
    } else if (rateableTeamMembers.length === 0) {
      setSelectedTeamMemberId("");
    }
  }, [rateableTeamMembers, selectedTeamMemberId]);

  const selectedTeamMember = useMemo(
    () => rateableTeamMembers.find((e) => e.id === selectedTeamMemberId) || null,
    [rateableTeamMembers, selectedTeamMemberId]
  );

  // Pre-fill existing rating for selected member & month if manager already rated them
  useEffect(() => {
    if (!selectedTeamMember) return;
    const existing = teamRatings.find(
      (r) =>
        r.employeeId === selectedTeamMember.id &&
        r.month === ratingMonth &&
        r.ratedByEmployeeId === currentUser.id
    );
    if (existing) {
      setCriteria(existing.criteria);
      setRatingRemarks(existing.remarks || "");
    } else {
      setCriteria({ taskDelivery: 16, workQuality: 16, teamwork: 16, initiative: 16, punctuality: 16 });
      setRatingRemarks("");
    }
  }, [selectedTeamMember, ratingMonth, teamRatings, currentUser.id]);

  // Objective Anti-Bias Evidence Snapshot for any employee & month
  const getObjectiveSnapshot = (empId: string, monthStr: string) => {
    const empTasks = tasks.filter(
      (t) =>
        t.assignedToEmployeeId === empId &&
        (t.status === "COMPLETED" || t.status === "DONE") &&
        (t.completedAt || t.submittedAt || t.updatedAt || "").startsWith(monthStr)
    );
    const onTimeTasks = empTasks.filter((t) => !t.isLateSubmission).length;
    const onTimeRate = empTasks.length ? Math.round((onTimeTasks / empTasks.length) * 100) : 100;
    const empLogs = workLogs.filter((l) => l.employeeId === empId && (l.date || "").startsWith(monthStr));
    const loggedWorkHours = Number(
      (empLogs.reduce((s, l) => s + (l.durationMinutes || 0), 0) / 60).toFixed(1)
    );
    const attendanceDays = new Set(
      attendanceLogs
        .filter((a) => a.employeeId === empId && (a.date || "").startsWith(monthStr) && a.checkInTime)
        .map((a) => a.date)
    ).size;

    return {
      tasksCompleted: empTasks.length,
      onTimeRate,
      loggedWorkHours,
      attendanceDays,
    };
  };

  const selectedMemberEvidence = useMemo(() => {
    if (!selectedTeamMember) return null;
    return getObjectiveSnapshot(selectedTeamMember.id, ratingMonth);
  }, [selectedTeamMember, ratingMonth, tasks, workLogs, attendanceLogs]);

  const handleSubmitTeamRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamMember) return;
    // Double-guard: strictly require reportingManagerId
    if (!selectedTeamMember.reportingManagerId) return;
    const totalPoints =
      criteria.taskDelivery +
      criteria.workQuality +
      criteria.teamwork +
      criteria.initiative +
      criteria.punctuality;

    const existing = teamRatings.find(
      (r) =>
        r.employeeId === selectedTeamMember.id &&
        r.month === ratingMonth &&
        r.ratedByEmployeeId === currentUser.id
    );
    const nowIso = new Date().toISOString();
    const payload: TeamMemberRating = {
      id: existing?.id || `trate-${selectedTeamMember.id}-${currentUser.id}-${ratingMonth}`,
      employeeId: selectedTeamMember.id,
      employeeCode: selectedTeamMember.employeeCode || "",
      employeeName: selectedTeamMember.fullName,
      avatarUrl: selectedTeamMember.avatarUrl,
      departmentName: selectedTeamMember.departmentName || "",
      branchName: selectedTeamMember.branchName || "",
      ratedByEmployeeId: currentUser.id,
      ratedByName: currentUser.fullName,
      ratedByRole: currentUser.designationTitle || String(currentUser.role),
      month: ratingMonth,
      criteria: { ...criteria },
      totalPoints,
      remarks: ratingRemarks.trim(),
      objectiveSnapshot: selectedMemberEvidence || undefined,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
    };
    onSaveTeamRating(payload);
    if (onSendNotification) {
      onSendNotification({
        title: isBangla ? "মাসিক টিম পারফরম্যান্স পয়েন্ট আপডেট" : "Monthly Team Points Updated",
        message: isBangla
          ? `${currentUser.fullName} আপনাকে ${ratingMonth} মাসের জন্য ${totalPoints}/১০০ পয়েন্ট দিয়েছেন।`
          : `${currentUser.fullName} rated you ${totalPoints}/100 for ${ratingMonth}.`,
        type: "SUCCESS",
        module: "FEEDBACK_SURVEYS",
        targetEmployeeId: selectedTeamMember.id,
      });
    }
  };

  // Visible Team Member Ratings
  const visibleTeamRatings = useMemo(() => {
    const monthFiltered = teamRatings.filter((r) => r.month === ratingMonth);
    if (isAdminOrHr) return monthFiltered.sort((a, b) => b.totalPoints - a.totalPoints);
    const myTeamIds = new Set(myDirectTeam.map((e) => e.id));
    myTeamIds.add(currentUser.id);
    return monthFiltered
      .filter((r) => myTeamIds.has(r.employeeId) || r.ratedByEmployeeId === currentUser.id)
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }, [teamRatings, ratingMonth, isAdminOrHr, myDirectTeam, currentUser.id]);

  // Admin Fairness Audit (average points given per manager)
  const managerFairnessAudit = useMemo(() => {
    if (!isAdminOrHr) return [];
    const map = new Map<
      string,
      { managerId: string; managerName: string; count: number; totalPts: number; min: number; max: number }
    >();
    teamRatings
      .filter((r) => r.month === ratingMonth)
      .forEach((r) => {
        const curr = map.get(r.ratedByEmployeeId) || {
          managerId: r.ratedByEmployeeId,
          managerName: r.ratedByName,
          count: 0,
          totalPts: 0,
          min: 100,
          max: 0,
        };
        curr.count += 1;
        curr.totalPts += r.totalPoints;
        curr.min = Math.min(curr.min, r.totalPoints);
        curr.max = Math.max(curr.max, r.totalPoints);
        map.set(r.ratedByEmployeeId, curr);
      });
    return Array.from(map.values()).map((m) => ({
      ...m,
      avg: m.count ? Number((m.totalPts / m.count).toFixed(1)) : 0,
    }));
  }, [teamRatings, ratingMonth, isAdminOrHr]);

  // ==========================================================
  // TAB 4: EMPLOYEE -> OWN REPORTING MANAGER RATING ONLY
  // ==========================================================
  const [mgrRatingMonth, setMgrRatingMonth] = useState<string>(currentMonthStr);
  const [mgrCriteria, setMgrCriteria] = useState({
    leadershipClarity: 16,
    fairnessNonBias: 16,
    supportMentoring: 16,
    communication: 16,
    taskManagement: 16,
  });
  const [mgrRemarks, setMgrRemarks] = useState<string>("");
  const [hideIdentityFromManager, setHideIdentityFromManager] = useState<boolean>(true);

  // Pre-fill existing manager rating for this employee & month
  useEffect(() => {
    if (!myReportingManager) return;
    const existing = managerRatings.find(
      (r) =>
        r.managerId === myReportingManager.id &&
        r.ratedByEmployeeId === currentUser.id &&
        r.month === mgrRatingMonth
    );
    if (existing) {
      setMgrCriteria(existing.criteria);
      setMgrRemarks(existing.remarks || "");
      setHideIdentityFromManager(existing.isIdentityHiddenFromManager !== false);
    } else {
      setMgrCriteria({
        leadershipClarity: 16,
        fairnessNonBias: 16,
        supportMentoring: 16,
        communication: 16,
        taskManagement: 16,
      });
      setMgrRemarks("");
      setHideIdentityFromManager(true);
    }
  }, [myReportingManager, mgrRatingMonth, managerRatings, currentUser.id]);

  const handleSubmitManagerRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myReportingManager) return;
    const totalScore =
      mgrCriteria.leadershipClarity +
      mgrCriteria.fairnessNonBias +
      mgrCriteria.supportMentoring +
      mgrCriteria.communication +
      mgrCriteria.taskManagement;

    const existing = managerRatings.find(
      (r) =>
        r.managerId === myReportingManager.id &&
        r.ratedByEmployeeId === currentUser.id &&
        r.month === mgrRatingMonth
    );
    const nowIso = new Date().toISOString();
    const payload: ManagerRating = {
      id: existing?.id || `mrate-${myReportingManager.id}-${currentUser.id}-${mgrRatingMonth}`,
      managerId: myReportingManager.id,
      managerCode: myReportingManager.employeeCode || "",
      managerName: myReportingManager.fullName,
      managerAvatarUrl: myReportingManager.avatarUrl,
      managerDepartmentName: myReportingManager.departmentName || "",
      managerBranchName: myReportingManager.branchName || "",
      ratedByEmployeeId: currentUser.id,
      ratedByEmployeeName: currentUser.fullName,
      ratedByEmployeeCode: currentUser.employeeCode || "",
      ratedByDepartmentName: currentUser.departmentName || "",
      isIdentityHiddenFromManager: hideIdentityFromManager,
      month: mgrRatingMonth,
      criteria: { ...mgrCriteria },
      totalScore,
      remarks: mgrRemarks.trim(),
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
    };
    onSaveManagerRating(payload);
  };

  // Ratings received by currentUser (if they are a manager)
  const ratingsReceivedByMeAsManager = useMemo(() => {
    return managerRatings.filter((r) => r.managerId === currentUser.id && r.month === mgrRatingMonth);
  }, [managerRatings, currentUser.id, mgrRatingMonth]);

  // Admin/HR Aggregated Manager Leaderboard
  const managerLeaderboard = useMemo(() => {
    const monthRatings = managerRatings.filter((r) => r.month === mgrRatingMonth);
    const map = new Map<
      string,
      {
        managerId: string;
        managerName: string;
        managerCode: string;
        department: string;
        count: number;
        totalSum: number;
        c1: number;
        c2: number;
        c3: number;
        c4: number;
        c5: number;
        entries: ManagerRating[];
      }
    >();
    monthRatings.forEach((r) => {
      const curr = map.get(r.managerId) || {
        managerId: r.managerId,
        managerName: r.managerName,
        managerCode: r.managerCode,
        department: r.managerDepartmentName,
        count: 0,
        totalSum: 0,
        c1: 0,
        c2: 0,
        c3: 0,
        c4: 0,
        c5: 0,
        entries: [],
      };
      curr.count += 1;
      curr.totalSum += r.totalScore;
      curr.c1 += r.criteria.leadershipClarity;
      curr.c2 += r.criteria.fairnessNonBias;
      curr.c3 += r.criteria.supportMentoring;
      curr.c4 += r.criteria.communication;
      curr.c5 += r.criteria.taskManagement;
      curr.entries.push(r);
      map.set(r.managerId, curr);
    });
    return Array.from(map.values())
      .map((m) => ({
        ...m,
        avgTotal: Number((m.totalSum / m.count).toFixed(1)),
        avgLeadership: Number((m.c1 / m.count).toFixed(1)),
        avgFairness: Number((m.c2 / m.count).toFixed(1)),
        avgSupport: Number((m.c3 / m.count).toFixed(1)),
        avgComm: Number((m.c4 / m.count).toFixed(1)),
        avgTaskMgmt: Number((m.c5 / m.count).toFixed(1)),
      }))
      .sort((a, b) => b.avgTotal - a.avgTotal);
  }, [managerRatings, mgrRatingMonth]);

  // Dual Excel Export for Super Admin / HR (Both Manager Ratings & Team Member Points)
  const handleExportBidirectionalRatingsExcel = () => {
    const empRows = teamRatings
      .filter((r) => r.month === ratingMonth)
      .map((r) => ({
        Month: r.month,
        "Employee Code": r.employeeCode,
        "Employee Name": r.employeeName,
        Department: r.departmentName,
        "Rated By (Manager)": r.ratedByName,
        "Task Delivery (/20)": r.criteria.taskDelivery,
        "Work Quality (/20)": r.criteria.workQuality,
        "Teamwork (/20)": r.criteria.teamwork,
        "Initiative (/20)": r.criteria.initiative,
        "Punctuality (/20)": r.criteria.punctuality,
        "Total Points (/100)": r.totalPoints,
        "Tasks Done": r.objectiveSnapshot?.tasksCompleted ?? "-",
        "On-Time %": r.objectiveSnapshot?.onTimeRate ?? "-",
        "Logged Hrs": r.objectiveSnapshot?.loggedWorkHours ?? "-",
        Remarks: r.remarks,
      }));

    const mgrRows = managerRatings
      .filter((r) => r.month === mgrRatingMonth)
      .map((r) => ({
        Month: r.month,
        "Manager Code": r.managerCode,
        "Manager Name": r.managerName,
        Department: r.managerDepartmentName,
        "Rated By (Team Member)": r.isIdentityHiddenFromManager && !isAdminOrHr ? "Confidential" : r.ratedByEmployeeName,
        "Leadership & Clarity (/20)": r.criteria.leadershipClarity,
        "Fairness & Non-Bias (/20)": r.criteria.fairnessNonBias,
        "Support & Mentoring (/20)": r.criteria.supportMentoring,
        "Communication (/20)": r.criteria.communication,
        "Task Management (/20)": r.criteria.taskManagement,
        "Total Score (/100)": r.totalScore,
        Remarks: r.remarks,
      }));

    exportMultiSheetExcel(`Bidirectional_Ratings_${ratingMonth}`, [
      { name: "Team_Member_Points", rows: empRows.length ? empRows : [{ Info: "No team member ratings in month" }] },
      { name: "Manager_Ratings", rows: mgrRows.length ? mgrRows : [{ Info: "No manager ratings in month" }] },
    ]);
  };

  const getManagerNameById = (id?: string) => {
    if (!id) return null;
    const found = employees.find((e) => e.id === id);
    return found ? `${found.fullName} (${found.employeeCode})` : null;
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header & 4 Spacious Sub-Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-600/10 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <MessageSquareHeart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isBangla
                  ? "বিস্তারিত সার্ভে, গোপন ফিডব্যাক ও দ্বিমুখী টিম রেটিং"
                  : "Detailed Surveys, Anonymous Box & Bidirectional Team Ratings"}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {isBangla
                  ? "৫ ক্যাটাগরির বিস্তারিত সার্ভে, ১০০% গোপন অভিযোগ/পরামর্শ বক্স, ম্যানেজার→টিম পয়েন্ট এবং কর্মী→নিজ ম্যানেজার রেটিং"
                  : "5-category surveys, 100% anonymous box, Manager→Team points, and Employee→Own Manager ratings"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveSubTab("SURVEYS")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeSubTab === "SURVEYS"
                  ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{isBangla ? "বিস্তারিত সার্ভে" : "Detailed Surveys"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("ANONYMOUS")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeSubTab === "ANONYMOUS"
                  ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>{isBangla ? "গোপন ফিডব্যাক বক্স" : "Anonymous Box"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("TEAM_POINTS")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeSubTab === "TEAM_POINTS"
                  ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>{isBangla ? "টিম মেম্বার পয়েন্ট" : "Team Member Points"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("MANAGER_RATING")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeSubTab === "MANAGER_RATING"
                  ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{isBangla ? "ম্যানেজার রেটিং" : "Rate My Manager"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: DETAILED 5-CATEGORY SURVEYS                                    */}
      {/* ===================================================================== */}
      {activeSubTab === "SURVEYS" && (
        <div className="space-y-6">
          {/* 5 Core Survey Pillar Overview Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {CORE_SURVEY_CATEGORIES.map((cat) => (
              <div
                key={cat}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5"
              >
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${CORE_CATEGORY_META[cat].colorClass}`}>
                  {isBangla ? CORE_CATEGORY_META[cat].bn : CORE_CATEGORY_META[cat].en}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                  {isBangla ? CORE_CATEGORY_META[cat].descBn : CORE_CATEGORY_META[cat].descEn}
                </p>
              </div>
            ))}
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isBangla ? "সক্রিয় ও পূর্ববর্তী সার্ভেসমূহ" : "Active & Past Surveys"}
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 tabular-nums">
                {surveys.length}
              </span>
            </h2>
            {isAdminOrHr && (
              <button
                type="button"
                onClick={() => setShowCreateSurveyModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                {isBangla ? "নতুন সার্ভে তৈরি করুন" : "Create New Survey"}
              </button>
            )}
          </div>

          {/* Survey Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {surveys.map((survey) => {
              const alreadySubmitted = surveyResponses.some(
                (r) => r.surveyId === survey.id && r.employeeId === currentUser.id
              );
              const stats = computeSurveyAnalytics(survey);
              const isShowingAnalytics = analyticsSurveyId === survey.id;

              return (
                <div
                  key={survey.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                            {survey.cycleType}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                            {survey.periodLabel} ({survey.startDate} → {survey.endDate})
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {survey.titleBn || survey.title}
                        </h3>
                        {survey.title && survey.titleBn && survey.title !== survey.titleBn && (
                          <p className="text-xs font-medium text-teal-700 dark:text-teal-400 mt-0.5">
                            {survey.title}
                          </p>
                        )}
                        {survey.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{survey.description}</p>
                        )}
                      </div>

                      {isAdminOrHr && (
                        <button
                          type="button"
                          onClick={() => onDeleteSurvey(survey.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          title={isBangla ? "সার্ভে মুছুন" : "Delete Survey"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Question count per category badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {CORE_SURVEY_CATEGORIES.map((cat) => {
                        const cnt = survey.questions.filter((q) => normalizeSurveyCategory(q.category) === cat).length;
                        if (cnt === 0) return null;
                        return (
                          <span
                            key={cat}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border ${CORE_CATEGORY_META[cat].colorClass}`}
                          >
                            {isBangla ? CORE_CATEGORY_META[cat].bn : CORE_CATEGORY_META[cat].en}: {cnt}
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300 pt-1">
                      <span className="font-semibold tabular-nums">
                        {survey.questions.length} {isBangla ? "টি প্রশ্ন" : "Questions"}
                      </span>
                      <span className="tabular-nums">
                        {stats.responses.length} {isBangla ? "টি উত্তর জমা" : "Responses"}
                      </span>
                      {isAdminOrHr && stats.responses.length > 0 && (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {stats.overallAvg} / 5.0
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {alreadySubmitted ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        {isBangla ? "আপনি এই সার্ভেতে অংশগ্রহণ করেছেন" : "Survey Submitted"}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openTakeSurvey(survey)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {isBangla ? "সার্ভে পূরণ করুন" : "Take Survey"}
                      </button>
                    )}

                    {isAdminOrHr && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAnalyticsSurveyId(isShowingAnalytics ? null : survey.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-teal-500"
                        >
                          <Eye className="w-3.5 h-3.5 text-teal-600" />
                          {isShowingAnalytics
                            ? isBangla
                              ? "বিশ্লেষণ লুকান"
                              : "Hide Analytics"
                            : isBangla
                            ? "৫-ক্যাটাগরি বিশ্লেষণ"
                            : "5-Category Analytics"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportSurveyExcel(survey)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          .xlsx
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded 5-Category + Question-by-Question Analytics (Admin/HR) */}
                  {isAdminOrHr && isShowingAnalytics && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {CORE_SURVEY_CATEGORIES.map((c) => (
                          <div
                            key={c}
                            className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 p-2.5 text-center"
                          >
                            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                              {isBangla ? CORE_CATEGORY_META[c].bn : CORE_CATEGORY_META[c].en}
                            </div>
                            <div className="text-base font-bold text-teal-700 dark:text-teal-400 tabular-nums mt-0.5">
                              {stats.categoryStats[c].avg || "—"}
                              <span className="text-[10px] font-normal text-slate-400">/5</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Question-by-question breakdown */}
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {survey.questions.map((q, idx) => {
                          const qs = stats.questionStats.get(q.id);
                          const avg = qs && qs.count ? Number((qs.sum / qs.count).toFixed(2)) : 0;
                          const pct = Math.min(100, Math.round((avg / 5) * 100));
                          const cat = normalizeSurveyCategory(q.category);
                          return (
                            <div
                              key={q.id}
                              className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1"
                            >
                              <div className="flex items-start justify-between gap-2 text-xs">
                                <div className="space-y-0.5">
                                  <div className="text-slate-900 dark:text-slate-100 font-semibold">
                                    <span className="text-slate-400 mr-1.5">{idx + 1}.</span>
                                    {q.questionBn || q.questionEn}
                                  </div>
                                  {q.questionEn && q.questionBn && q.questionEn !== q.questionBn && (
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-4">
                                      {q.questionEn}
                                    </div>
                                  )}
                                </div>
                                <span className="font-bold text-teal-700 dark:text-teal-400 tabular-nums shrink-0">
                                  {avg || "0.0"}/5
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 shrink-0">
                                  {CORE_CATEGORY_META[cat].bn} / {CORE_CATEGORY_META[cat].en}
                                </span>
                                <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                  <div
                                    className="h-full bg-teal-600 rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Recent Comments */}
                      {stats.responses.some((r) => r.generalComment) && (
                        <div className="space-y-1.5">
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {isBangla ? "কর্মীদের সার্বিক মন্তব্য:" : "General Comments:"}
                          </div>
                          {stats.responses
                            .filter((r) => r.generalComment)
                            .slice(0, 6)
                            .map((r) => (
                              <div
                                key={r.id}
                                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300"
                              >
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {r.employeeName} ({r.departmentName}):
                                </span>{" "}
                                {r.generalComment}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: 100% ANONYMOUS FEEDBACK BOX (ZERO PII)                         */}
      {/* ===================================================================== */}
      {activeSubTab === "ANONYMOUS" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Submission Form (All Employees) */}
          <form
            onSubmit={handleSubmitAnon}
            className={`${
              isAdminOrHr ? "lg:col-span-5" : "lg:col-span-8 lg:col-start-3"
            } bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 h-fit`}
          >
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-3.5 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                <strong className="block mb-0.5">
                  {isBangla ? "১০০% পরিচয়-গোপন নিশ্চয়তা (Zero-PII)" : "100% Identity Protection Guarantee"}
                </strong>
                {isBangla
                  ? "এই বক্সে পাঠানো কোনো অভিযোগ বা পরামর্শের সাথে আপনার নাম, আইডি, ইমেইল বা ডিপার্টমেন্ট ডাটাবেজে সংরক্ষিত হয় না। সুপার অ্যাডমিনও জানতে পারবেন না কে পাঠিয়েছেন।"
                  : "Zero personal information (no name, ID, email, or department) is ever stored with submissions here. Even Super Admins cannot see who submitted it."}
              </div>
            </div>

            {anonSentSuccess && (
              <div className="rounded-xl bg-teal-50 dark:bg-teal-500/15 border border-teal-200 dark:border-teal-500/30 p-3 text-xs font-semibold text-teal-800 dark:text-teal-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {isBangla
                  ? "আপনার গোপন মতামত সফলভাবে পাঠানো হয়েছে। আপনার পরিচয় সম্পূর্ণ গোপন রয়েছে।"
                  : "Your anonymous feedback has been submitted securely."}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isBangla ? "বিষয়ের ক্যাটাগরি" : "Category"}
                </label>
                <select
                  value={anonCategory}
                  onChange={(e) => setAnonCategory(e.target.value as AnonymousFeedback["category"])}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  {ANON_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {isBangla ? c.bn : c.en}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isBangla ? "গুরুত্ব (Urgency)" : "Urgency"}
                </label>
                <select
                  value={anonUrgency}
                  onChange={(e) => setAnonUrgency(e.target.value as AnonymousFeedback["urgency"])}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="LOW">{isBangla ? "সাধারণ (Low)" : "Low"}</option>
                  <option value="MEDIUM">{isBangla ? "গুরুত্বপূর্ণ (Medium)" : "Medium"}</option>
                  <option value="HIGH">{isBangla ? "অতি জরুরি (High)" : "High / Urgent"}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isBangla ? "শিরোনাম *" : "Subject *"}
              </label>
              <input
                type="text"
                required
                value={anonSubject}
                onChange={(e) => setAnonSubject(e.target.value)}
                placeholder={isBangla ? "সংক্ষেপে বিষয়টি লিখুন..." : "Brief subject..."}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isBangla ? "বিস্তারিত মতামত বা অভিযোগ *" : "Detailed Message *"}
              </label>
              <textarea
                rows={5}
                required
                value={anonMessage}
                onChange={(e) => setAnonMessage(e.target.value)}
                placeholder={
                  isBangla
                    ? "নিঃসংকোচে আপনার মতামত, সমস্যা বা উন্নয়নমূলক পরামর্শ লিখুন..."
                    : "Share your concern, feedback, or suggestion freely..."
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <Lock className="w-4 h-4" />
              {isBangla ? "সম্পূর্ণ গোপনে পাঠান" : "Submit 100% Anonymously"}
            </button>
          </form>

          {/* Admin / HR Anonymous Inbox */}
          {isAdminOrHr && (
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  {isBangla ? "অ্যাডমিন / এইচআর গোপন ইনবক্স" : "Admin / HR Anonymous Inbox"}
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs tabular-nums">
                    {anonymousFeedback.length}
                  </span>
                </h2>
                <div className="flex items-center gap-1">
                  {(["ALL", "NEW", "REVIEWING", "ACTION_TAKEN"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setAnonStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        anonStatusFilter === st
                          ? "bg-teal-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {st === "ALL"
                        ? isBangla
                          ? "সব"
                          : "All"
                        : st === "NEW"
                        ? isBangla
                          ? "নতুন"
                          : "New"
                        : st === "REVIEWING"
                        ? isBangla
                          ? "পর্যালোচনা"
                          : "Reviewing"
                        : isBangla
                        ? "সমাধানকৃত"
                        : "Action Taken"}
                    </button>
                  ))}
                </div>
              </div>

              {anonymousFeedback.filter((a) => anonStatusFilter === "ALL" || a.status === anonStatusFilter).length ===
              0 ? (
                <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  {isBangla ? "কোনো গোপন ফিডব্যাক পাওয়া যায়নি।" : "No anonymous feedback messages in this filter."}
                </div>
              ) : (
                <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
                  {anonymousFeedback
                    .filter((a) => anonStatusFilter === "ALL" || a.status === anonStatusFilter)
                    .map((item) => {
                      const catMeta = ANON_CATEGORIES.find((c) => c.value === item.category);
                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 font-semibold text-slate-800 dark:text-slate-200">
                                {catMeta ? (isBangla ? catMeta.bn : catMeta.en) : item.category}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded font-bold ${
                                  item.urgency === "HIGH"
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                                    : item.urgency === "MEDIUM"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {item.urgency}
                              </span>
                              <span className="text-slate-400 tabular-nums">
                                {item.submittedAt.slice(0, 10)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => onDeleteAnonymousFeedback(item.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.subject}</h3>
                          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                            {item.message}
                          </p>

                          {/* Status & Action Note */}
                          <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex flex-col sm:flex-row gap-2">
                            <select
                              value={item.status}
                              onChange={(e) =>
                                onUpdateAnonymousFeedback({
                                  ...item,
                                  status: e.target.value as AnonymousFeedback["status"],
                                  updatedAt: new Date().toISOString(),
                                })
                              }
                              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-white"
                            >
                              <option value="NEW">{isBangla ? "নতুন (New)" : "New"}</option>
                              <option value="REVIEWING">{isBangla ? "পর্যালোচনাধীন" : "Reviewing"}</option>
                              <option value="ACTION_TAKEN">{isBangla ? "ব্যবস্থা নেওয়া হয়েছে" : "Action Taken"}</option>
                            </select>
                            <div className="flex-1 flex gap-1.5">
                              <input
                                type="text"
                                value={actionNoteDrafts[item.id] ?? item.adminActionNote ?? ""}
                                onChange={(e) =>
                                  setActionNoteDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                                }
                                placeholder={isBangla ? "অভ্যন্তরীণ অ্যাকশন নোট..." : "Internal action note..."}
                                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateAnonymousFeedback({
                                    ...item,
                                    adminActionNote: actionNoteDrafts[item.id] ?? item.adminActionNote ?? "",
                                    updatedAt: new Date().toISOString(),
                                  })
                                }
                                className="px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-teal-600 text-white text-xs font-semibold"
                              >
                                {isBangla ? "সেভ" : "Save"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: TEAM MEMBER POINTS (MANAGER -> OWN TEAM ONLY)                  */}
      {/* ===================================================================== */}
      {activeSubTab === "TEAM_POINTS" && (
        <div className="space-y-6">
          {/* Top Policy Banner + Month Picker + Admin Team Assignment Helper */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isBangla
                    ? "টিমভিত্তিক পারফরম্যান্স পয়েন্ট (শুধুমাত্র নিজ টিমের কর্মীদের জন্য)"
                    : "Strict Team-Based Performance Points (Manager → Direct Team Only)"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBangla
                    ? "প্রত্যেক ম্যানেজার শুধুমাত্র তাঁর নিজস্ব টিমের কর্মীদের (Reporting Manager নির্ধারিত) পয়েন্ট দিতে পারবেন। কোনো টিমে যুক্ত না থাকা কর্মীর রেটিং প্রযোজ্য নয়।"
                    : "Managers can strictly rate ONLY their direct team members. Employees not assigned to a team/manager are marked N/A."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <input
                type="month"
                value={ratingMonth}
                onChange={(e) => setRatingMonth(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
              />
              {isAdminOrHr && onUpdateEmployee && (
                <button
                  type="button"
                  onClick={() => setShowTeamAssignmentPanel((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-xs font-semibold"
                >
                  <UserCog className="w-4 h-4" />
                  {isBangla ? "টিম / ম্যানেজার অ্যাসাইন" : "Assign Teams"}
                  {showTeamAssignmentPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
              {isAdminOrHr && (
                <button
                  type="button"
                  onClick={handleExportBidirectionalRatingsExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {isBangla ? "এক্সেল (.xlsx)" : "Excel (.xlsx)"}
                </button>
              )}
            </div>
          </div>

          {/* Admin / HR Quick Inline Team & Reporting Manager Assignment Panel */}
          {isAdminOrHr && onUpdateEmployee && showTeamAssignmentPanel && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isBangla
                      ? "কর্মীদের টিম ও রিপোর্টিং লাইন ম্যানেজার নির্ধারণ করুন"
                      : "Assign Employee Reporting Line Managers"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isBangla
                      ? "এখানে রিপোর্টিং ম্যানেজার সেট করলে সাথে সাথে ওই ম্যানেজার তাঁর টিমের কর্মীকে পয়েন্ট দিতে পারবেন এবং ওই কর্মীও তাঁর ম্যানেজারকে রেটিং দিতে পারবেন।"
                      : "Setting a reporting manager immediately enables bidirectional rating between that manager and team member."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTeamAssignmentPanel(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                {activeEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {emp.fullName} <span className="font-mono text-slate-400">({emp.employeeCode})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{emp.departmentName}</div>
                    <select
                      value={emp.reportingManagerId || ""}
                      onChange={(e) => {
                        const newMgrId = e.target.value || undefined;
                        onUpdateEmployee({ ...emp, reportingManagerId: newMgrId });
                      }}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-800 dark:text-white"
                    >
                      <option value="">
                        {isBangla ? "— কোনো টিম/ম্যানেজার নেই (N/A) —" : "— Not in any team (N/A) —"}
                      </option>
                      {activeEmployees
                        .filter((m) => m.id !== emp.id)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.fullName} ({m.employeeCode})
                          </option>
                        ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Grid: Left = Rate Direct Team Member Form, Right = Monthly Team Points Table & Fairness Audit */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Rating Form (Only for Team Managers / HR) */}
            {isTeamManager && (
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 h-fit">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Award className="w-5 h-5 text-teal-600" />
                  {isBangla ? "টিম মেম্বারকে পয়েন্ট দিন (১০০-এর মধ্যে)" : "Award Team Member Points (/100)"}
                </h3>

                {rateableTeamMembers.length === 0 ? (
                  <div className="p-5 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-500/10 text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto" />
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 leading-relaxed">
                      {isAdminOrHr
                        ? isBangla
                          ? "এখনো কোনো কর্মীর প্রোফাইলে রিপোর্টিং ম্যানেজার (টিম) নির্ধারিত নেই। উপরের 'টিম / ম্যানেজার অ্যাসাইন' বাটনে ক্লিক করে টিম সেট করুন।"
                          : "No employees have a reporting manager assigned yet. Click 'Assign Teams' above to set up teams."
                        : isBangla
                        ? "আপনার অধীনে কোনো টিম মেম্বার নির্ধারিত নেই (Reporting Manager সেট করা হয়নি)। সুপার অ্যাডমিন বা HR টিম অ্যাসাইন করলে আপনি শুধুমাত্র আপনার টিমের কর্মীদের পয়েন্ট দিতে পারবেন।"
                        : "You have no direct team members assigned under you yet. Once HR/Super Admin assigns your team, they will appear here."}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitTeamRating} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isAdminOrHr
                          ? isBangla
                            ? "টিমভুক্ত কর্মী নির্বাচন করুন"
                            : "Select Team-Assigned Employee"
                          : isBangla
                          ? "আপনার টিমের কর্মী নির্বাচন করুন"
                          : "Select Your Direct Team Member"}
                      </label>
                      <select
                        value={selectedTeamMemberId}
                        onChange={(e) => setSelectedTeamMemberId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                      >
                        {rateableTeamMembers.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.fullName} ({emp.employeeCode}) — {emp.departmentName}
                          </option>
                        ))}
                      </select>
                      {selectedTeamMember && (
                        <div className="text-[11px] text-slate-500 mt-1">
                          {isBangla ? "রিপোর্টিং ম্যানেজার:" : "Reporting Manager:"}{" "}
                          <span className="font-semibold text-teal-700 dark:text-teal-400">
                            {getManagerNameById(selectedTeamMember.reportingManagerId)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Anti-Bias Objective Evidence Panel */}
                    {selectedMemberEvidence && (
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 p-3 space-y-2">
                        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-teal-600" />
                          {isBangla
                            ? `নিরপেক্ষ প্রমাণ ডাটা (${ratingMonth}) — পক্ষপাত প্রতিরোধে`
                            : `Objective Evidence (${ratingMonth}) — Anti-Bias Snapshot`}
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-slate-100 dark:border-slate-800">
                            <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                              {selectedMemberEvidence.tasksCompleted}
                            </div>
                            <div className="text-[10px] text-slate-500">{isBangla ? "টাস্ক" : "Tasks"}</div>
                          </div>
                          <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-slate-100 dark:border-slate-800">
                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              {selectedMemberEvidence.onTimeRate}%
                            </div>
                            <div className="text-[10px] text-slate-500">{isBangla ? "সময়মতো" : "On-Time"}</div>
                          </div>
                          <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-slate-100 dark:border-slate-800">
                            <div className="text-sm font-bold text-teal-600 dark:text-teal-400 tabular-nums">
                              {selectedMemberEvidence.loggedWorkHours}h
                            </div>
                            <div className="text-[10px] text-slate-500">{isBangla ? "লগ ঘণ্টা" : "Logged"}</div>
                          </div>
                          <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-slate-100 dark:border-slate-800">
                            <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                              {selectedMemberEvidence.attendanceDays}d
                            </div>
                            <div className="text-[10px] text-slate-500">{isBangla ? "হাজিরা" : "Attend."}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5 Criteria Sliders */}
                    <div className="space-y-3">
                      {(
                        [
                          { key: "taskDelivery", bn: "টাস্ক ডেলিভারি ও ডেডলাইন", en: "Task Delivery & Deadlines" },
                          { key: "workQuality", bn: "কাজের মান ও নির্ভুলতা", en: "Work Quality & Accuracy" },
                          { key: "teamwork", bn: "টিমওয়ার্ক ও সহযোগিতা", en: "Teamwork & Collaboration" },
                          { key: "initiative", bn: "উদ্যোগ ও সমস্যা সমাধান", en: "Initiative & Problem Solving" },
                          { key: "punctuality", bn: "সময়ানুবর্তিতা ও ডেইলি লগ", en: "Punctuality & Daily Logs" },
                        ] as const
                      ).map((c) => (
                        <div key={c.key} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {isBangla ? c.bn : c.en}
                            </span>
                            <span className="font-bold text-teal-700 dark:text-teal-400 tabular-nums">
                              {criteria[c.key]} / 20
                            </span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={20}
                            value={criteria[c.key]}
                            onChange={(e) =>
                              setCriteria((prev) => ({ ...prev, [c.key]: Number(e.target.value) }))
                            }
                            className="w-full accent-teal-600"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-teal-50 dark:bg-teal-500/15 border border-teal-200 dark:border-teal-500/30 px-4 py-2.5">
                      <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
                        {isBangla ? "সর্বমোট অর্জিত পয়েন্ট" : "Total Performance Score"}
                      </span>
                      <span className="text-xl font-extrabold text-teal-700 dark:text-teal-300 tabular-nums">
                        {criteria.taskDelivery +
                          criteria.workQuality +
                          criteria.teamwork +
                          criteria.initiative +
                          criteria.punctuality}{" "}
                        / 100
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isBangla ? "মূল্যায়ন মন্তব্য ও পরামর্শ *" : "Evaluation Remarks *"}
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={ratingRemarks}
                        onChange={(e) => setRatingRemarks(e.target.value)}
                        placeholder={
                          isBangla
                            ? "ভালো দিক ও উন্নতির জায়গাগুলো উল্লেখ করুন..."
                            : "Highlight strengths and areas for growth..."
                        }
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm"
                    >
                      {isBangla ? "পারফরম্যান্স পয়েন্ট সংরক্ষণ করুন" : "Save Team Member Points"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Right Column: Leaderboard + Unassigned N/A Notice + Fairness Audit */}
            <div className={`${isTeamManager ? "lg:col-span-7" : "lg:col-span-12"} space-y-5`}>
              {/* Team Points Records */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isBangla ? `টিম পারফরম্যান্স পয়েন্ট তালিকা (${ratingMonth})` : `Team Performance Points (${ratingMonth})`}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500 tabular-nums">
                    {visibleTeamRatings.length} {isBangla ? "টি রেকর্ড" : "records"}
                  </span>
                </div>

                {visibleTeamRatings.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    {!currentUser.reportingManagerId && !isTeamManager
                      ? isBangla
                        ? "আপনি বর্তমানে কোনো টিমে যুক্ত নন, তাই টিম মেম্বার রেটিং প্রযোজ্য নয়।"
                        : "You are not assigned to a team, so team ratings are N/A."
                      : isBangla
                      ? "এই মাসে এখনো কোনো টিম পয়েন্ট রেকর্ড জমা হয়নি।"
                      : "No team performance points recorded for this month yet."}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleTeamRatings.map((r) => (
                      <div
                        key={r.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                              {r.employeeName}{" "}
                              <span className="text-xs font-mono font-normal text-slate-500">
                                ({r.employeeCode})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {r.departmentName} • {isBangla ? "মূল্যায়নকারী:" : "Rated by:"}{" "}
                              <strong className="text-slate-700 dark:text-slate-300">{r.ratedByName}</strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-xl bg-teal-600/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-base font-extrabold tabular-nums">
                              {r.totalPoints} / 100
                            </span>
                            {(isAdminOrHr || r.ratedByEmployeeId === currentUser.id) && (
                              <button
                                type="button"
                                onClick={() => onDeleteTeamRating(r.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 dark:text-slate-300 tabular-nums">
                          <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                            {isBangla ? "ডেলিভারি:" : "Delivery:"} {r.criteria.taskDelivery}/20
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                            {isBangla ? "মান:" : "Quality:"} {r.criteria.workQuality}/20
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                            {isBangla ? "টিমওয়ার্ক:" : "Teamwork:"} {r.criteria.teamwork}/20
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                            {isBangla ? "উদ্যোগ:" : "Initiative:"} {r.criteria.initiative}/20
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                            {isBangla ? "সময়ানুবর্তিতা:" : "Punctuality:"} {r.criteria.punctuality}/20
                          </span>
                        </div>

                        {r.remarks && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 italic">“{r.remarks}”</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Unassigned Employees Notice (Explicitly Not Rateable) */}
              {isAdminOrHr && unassignedEmployees.length > 0 && (
                <div className="bg-amber-50/70 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-700/60 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      {isBangla
                        ? `কোনো টিমে যুক্ত নন (${unassignedEmployees.length} জন) — টিম রেটিং প্রযোজ্য নয়`
                        : `Not Assigned to Any Team (${unassignedEmployees.length}) — Rating N/A`}
                    </div>
                    {onUpdateEmployee && (
                      <button
                        type="button"
                        onClick={() => setShowTeamAssignmentPanel(true)}
                        className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:underline"
                      >
                        {isBangla ? "ম্যানেজার সেট করুন" : "Assign Manager"}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {unassignedEmployees.map((u) => (
                      <span
                        key={u.id}
                        className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/60 border border-amber-200/80 dark:border-amber-700/50 text-[11px] text-slate-700 dark:text-slate-300"
                      >
                        {u.fullName} ({u.employeeCode})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin / HR Manager Fairness Audit */}
              {isAdminOrHr && managerFairnessAudit.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    {isBangla
                      ? "ম্যানেজার মূল্যায়ন নিরপেক্ষতা অডিট (সুপার অ্যাডমিন / HR)"
                      : "Manager Grading Fairness Audit (Super Admin / HR)"}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {managerFairnessAudit.map((m) => (
                      <div
                        key={m.managerId}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{m.managerName}</div>
                          <div className="text-[11px] text-slate-500 tabular-nums">
                            {m.count} {isBangla ? "জনকে মূল্যায়ন" : "rated"} • Min {m.min} / Max {m.max}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                            {m.avg}
                          </div>
                          <div className="text-[10px] text-slate-400">{isBangla ? "গড় পয়েন্ট" : "Avg Pts"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: RATE MY MANAGER (EMPLOYEE -> OWN REPORTING MANAGER ONLY)       */}
      {/* ===================================================================== */}
      {activeSubTab === "MANAGER_RATING" && (
        <div className="space-y-6">
          {/* Top Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-600" />
                {isBangla
                  ? "লাইন ম্যানেজার মূল্যায়ন (কর্মী → শুধুমাত্র নিজ রিপোর্টিং ম্যানেজার)"
                  : "Line Manager Rating (Employee → Own Reporting Manager Only)"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isBangla
                  ? "টিমের কর্মীরা শুধুমাত্র তাঁদের নিজস্ব রিপোর্টিং লাইন ম্যানেজারকে নেতৃত্ব, নিরপেক্ষতা ও সহযোগিতার ভিত্তিতে রেটিং দিতে পারবেন।"
                  : "Team members can strictly rate ONLY their direct reporting manager on leadership, fairness, support, and communication."}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="month"
                value={mgrRatingMonth}
                onChange={(e) => setMgrRatingMonth(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
              />
              {isAdminOrHr && (
                <button
                  type="button"
                  onClick={handleExportBidirectionalRatingsExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {isBangla ? "এক্সেল (.xlsx)" : "Excel (.xlsx)"}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT: Rate My Own Direct Reporting Manager */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 h-fit">
              <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                {isBangla ? "আমার লাইন ম্যানেজারকে রেটিং দিন" : "Rate My Line Manager"}
              </h3>

              {!myReportingManager ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 text-center space-y-2">
                  <Users className="w-9 h-9 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {isBangla ? "ম্যানেজার রেটিং প্রযোজ্য নয়" : "Manager Rating Not Applicable"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {isBangla
                      ? "আপনার প্রোফাইলে কোনো লাইন ম্যানেজার নির্ধারিত নেই (আপনি কোনো টিমের অধীনে নন), তাই আপনি এখানে কোনো ম্যানেজারকে রেটিং দিতে পারবেন না।"
                      : "You do not have an assigned reporting line manager (you are not under a team), so manager rating is not applicable."}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitManagerRating} className="space-y-4">
                  {/* Locked Manager Card */}
                  <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-500/10 border border-teal-200/80 dark:border-teal-500/30 flex items-center gap-3">
                    {myReportingManager.avatarUrl ? (
                      <img
                        src={myReportingManager.avatarUrl}
                        alt={myReportingManager.fullName}
                        className="w-11 h-11 rounded-full object-cover border border-teal-300"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
                        {myReportingManager.fullName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                        {isBangla ? "আপনার নির্ধারিত লাইন ম্যানেজার" : "Your Assigned Line Manager"}
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {myReportingManager.fullName} ({myReportingManager.employeeCode})
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {myReportingManager.designationTitle} • {myReportingManager.departmentName}
                      </div>
                    </div>
                  </div>

                  {/* 5 Manager Rating Criteria */}
                  <div className="space-y-3">
                    {(
                      [
                        {
                          key: "leadershipClarity",
                          bn: "নেতৃত্ব ও কাজের স্পষ্ট দিকনির্দেশনা",
                          en: "Leadership & Work Clarity",
                        },
                        {
                          key: "fairnessNonBias",
                          bn: "নিরপেক্ষতা ও পক্ষপাতহীন আচরণ",
                          en: "Fairness & Non-Bias",
                        },
                        {
                          key: "supportMentoring",
                          bn: "সহযোগিতা ও দক্ষতা উন্নয়নে সহায়তা",
                          en: "Support & Mentoring",
                        },
                        {
                          key: "communication",
                          bn: "যোগাযোগ ও কর্মীদের মতামতের মূল্যায়ন",
                          en: "Communication & Listening",
                        },
                        {
                          key: "taskManagement",
                          bn: "টাস্ক বণ্টন ও ডেডলাইন ব্যবস্থাপনা",
                          en: "Task & Deadline Management",
                        },
                      ] as const
                    ).map((c) => (
                      <div key={c.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {isBangla ? c.bn : c.en}
                          </span>
                          <span className="font-bold text-teal-700 dark:text-teal-400 tabular-nums">
                            {mgrCriteria[c.key]} / 20
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={20}
                          value={mgrCriteria[c.key]}
                          onChange={(e) =>
                            setMgrCriteria((prev) => ({ ...prev, [c.key]: Number(e.target.value) }))
                          }
                          className="w-full accent-teal-600"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 px-4 py-2.5">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      {isBangla ? "ম্যানেজার মোট স্কোর" : "Manager Total Score"}
                    </span>
                    <span className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300 tabular-nums">
                      {mgrCriteria.leadershipClarity +
                        mgrCriteria.fairnessNonBias +
                        mgrCriteria.supportMentoring +
                        mgrCriteria.communication +
                        mgrCriteria.taskManagement}{" "}
                      / 100
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isBangla ? "ম্যানেজারের জন্য গঠনমূলক মতামত (ঐচ্ছিক)" : "Constructive Feedback (Optional)"}
                    </label>
                    <textarea
                      rows={3}
                      value={mgrRemarks}
                      onChange={(e) => setMgrRemarks(e.target.value)}
                      placeholder={
                        isBangla
                          ? "ম্যানেজারের কোন দিকটি ভালো লেগেছে বা কোথায় উন্নতি করা যেতে পারে..."
                          : "What works well and what could be improved..."
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideIdentityFromManager}
                      onChange={(e) => setHideIdentityFromManager(e.target.checked)}
                      className="mt-0.5 rounded accent-teal-600"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                      {isBangla
                        ? "ম্যানেজারের কাছে আমার নাম গোপন রাখুন (ম্যানেজার শুধু গড় স্কোর ও গোপন মন্তব্য দেখবেন; শুধুমাত্র সুপার অ্যাডমিন / HR অডিট করতে পারবেন)"
                        : "Hide my name from my manager (manager only sees score & anonymous remarks; only Super Admin / HR can audit)"}
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm"
                  >
                    {isBangla ? "ম্যানেজার রেটিং সাবমিট করুন" : "Submit Manager Rating"}
                  </button>
                </form>
              )}
            </div>

            {/* RIGHT: Manager Received Summary + Super Admin / HR Manager Leaderboard */}
            <div className="lg:col-span-7 space-y-5">
              {/* If currentUser received ratings from their direct team */}
              {ratingsReceivedByMeAsManager.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {isBangla
                        ? `আমার টিম থেকে প্রাপ্ত ম্যানেজার রেটিং (${mgrRatingMonth})`
                        : `Ratings Received From My Team (${mgrRatingMonth})`}
                    </h3>
                    <span className="px-3 py-1 rounded-xl bg-teal-600/10 text-teal-700 dark:text-teal-300 text-sm font-extrabold tabular-nums">
                      {isBangla ? "গড়:" : "Avg:"}{" "}
                      {Number(
                        (
                          ratingsReceivedByMeAsManager.reduce((s, r) => s + r.totalScore, 0) /
                          ratingsReceivedByMeAsManager.length
                        ).toFixed(1)
                      )}{" "}
                      / 100
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {ratingsReceivedByMeAsManager.map((r) => (
                      <div
                        key={r.id}
                        className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {r.isIdentityHiddenFromManager && !isAdminOrHr
                              ? isBangla
                                ? "গোপন টিম মেম্বার (পরিচয় সুরক্ষিত)"
                                : "Confidential Team Member"
                              : `${r.ratedByEmployeeName} (${r.ratedByEmployeeCode})`}
                          </span>
                          <span className="font-extrabold text-teal-700 dark:text-teal-400 tabular-nums">
                            {r.totalScore} / 100
                          </span>
                        </div>
                        {r.remarks && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 italic">“{r.remarks}”</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Super Admin / HR / CEO Full Manager Leaderboard */}
              {isAdminOrHr ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {isBangla
                          ? `সকল ম্যানেজারদের রেটিং লিডারবোর্ড (${mgrRatingMonth})`
                          : `All Managers Rating Leaderboard (${mgrRatingMonth})`}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isBangla
                          ? "সুপার অ্যাডমিন / এইচআর ভিউ — কর্মীরা তাঁদের ম্যানেজারদের কেমন রেটিং দিচ্ছেন তার পূর্ণাঙ্গ বিশ্লেষণ"
                          : "Super Admin / HR View — Full analysis of how teams are rating their line managers"}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 tabular-nums">
                      {managerLeaderboard.length} {isBangla ? "জন ম্যানেজার" : "managers"}
                    </span>
                  </div>

                  {managerLeaderboard.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                      {isBangla
                        ? "এই মাসে এখনো কোনো কর্মী ম্যানেজার রেটিং সাবমিট করেননি।"
                        : "No manager ratings submitted for this month yet."}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {managerLeaderboard.map((mgr, idx) => (
                        <div
                          key={mgr.managerId}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold tabular-nums">
                                #{idx + 1}
                              </span>
                              <div>
                                <div className="text-sm font-bold text-slate-900 dark:text-white">
                                  {mgr.managerName}{" "}
                                  <span className="text-xs font-mono font-normal text-slate-500">
                                    ({mgr.managerCode})
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {mgr.department} • {mgr.count}{" "}
                                  {isBangla ? "জন টিম মেম্বার রেটিং দিয়েছেন" : "team responses"}
                                </div>
                              </div>
                            </div>
                            <span className="px-3 py-1 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-base font-extrabold tabular-nums">
                              {mgr.avgTotal} / 100
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px] tabular-nums">
                            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                              <div className="font-bold text-slate-900 dark:text-white">{mgr.avgLeadership}/20</div>
                              <div className="text-[10px] text-slate-500">{isBangla ? "নেতৃত্ব" : "Leadership"}</div>
                            </div>
                            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                              <div className="font-bold text-slate-900 dark:text-white">{mgr.avgFairness}/20</div>
                              <div className="text-[10px] text-slate-500">{isBangla ? "নিরপেক্ষতা" : "Fairness"}</div>
                            </div>
                            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                              <div className="font-bold text-slate-900 dark:text-white">{mgr.avgSupport}/20</div>
                              <div className="text-[10px] text-slate-500">{isBangla ? "সহযোগিতা" : "Support"}</div>
                            </div>
                            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                              <div className="font-bold text-slate-900 dark:text-white">{mgr.avgComm}/20</div>
                              <div className="text-[10px] text-slate-500">{isBangla ? "যোগাযোগ" : "Comm."}</div>
                            </div>
                            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                              <div className="font-bold text-slate-900 dark:text-white">{mgr.avgTaskMgmt}/20</div>
                              <div className="text-[10px] text-slate-500">{isBangla ? "টাস্ক ম্যানেজ" : "Task Mgmt"}</div>
                            </div>
                          </div>

                          {/* Individual entries audit */}
                          <div className="space-y-1.5 pt-1">
                            {mgr.entries.map((entry) => (
                              <div
                                key={entry.id}
                                className="flex items-start justify-between gap-2 text-xs p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                      {entry.ratedByEmployeeName} ({entry.ratedByEmployeeCode})
                                    </span>
                                    {entry.isIdentityHiddenFromManager && (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                                        {isBangla ? "ম্যানেজারের কাছে গোপন" : "Hidden from Mgr"}
                                      </span>
                                    )}
                                    <span className="font-bold text-teal-700 dark:text-teal-400 tabular-nums">
                                      {entry.totalScore}/100
                                    </span>
                                  </div>
                                  {entry.remarks && (
                                    <p className="text-slate-600 dark:text-slate-400 italic">“{entry.remarks}”</p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onDeleteManagerRating(entry.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Non-admin info card explaining privacy */
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                    {isBangla ? "স্বচ্ছ ও দ্বিমুখী মূল্যায়ন নীতিমালা" : "Fair Bidirectional Rating Policy"}
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed list-disc pl-5">
                    <li>
                      {isBangla
                        ? "আপনি শুধুমাত্র আপনার সরাসরি রিপোর্টিং লাইন ম্যানেজারকে মাসে একবার রেটিং দিতে বা আপডেট করতে পারবেন।"
                        : "You can submit or update a rating strictly for your direct reporting line manager once per month."}
                    </li>
                    <li>
                      {isBangla
                        ? "'ম্যানেজারের কাছে আমার নাম গোপন রাখুন' চালু রাখলে আপনার ম্যানেজার কখনোই আপনার নাম দেখতে পারবেন না।"
                        : "When identity protection is enabled, your manager will never see your name on the rating."}
                    </li>
                    <li>
                      {isBangla
                        ? "সুপার অ্যাডমিন ও এইচআর উভয় দিকের (ম্যানেজার→কর্মী এবং কর্মী→ম্যানেজার) রেটিং পর্যবেক্ষণ করে নিরপেক্ষ কর্মপরিবেশ নিশ্চিত করেন।"
                        : "Super Admin and HR review both directions to maintain a fair and accountable workplace."}
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: TAKE 5-CATEGORY DETAILED SURVEY                                */}
      {/* ===================================================================== */}
      {takingSurvey && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSubmitSurvey}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {takingSurvey.titleBn || takingSurvey.title}
                </h3>
                {takingSurvey.title && takingSurvey.titleBn && takingSurvey.title !== takingSurvey.titleBn && (
                  <p className="text-xs font-medium text-teal-700 dark:text-teal-400 mt-0.5">
                    {takingSurvey.title}
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  প্রতিটি বিভাগে ১ (খুবই অসন্তুষ্ট) থেকে ৫ (অত্যন্ত সন্তুষ্ট) স্কেলে মতামত দিন • Rate 1 (Very Poor) to 5 (Excellent)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTakingSurvey(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {CORE_SURVEY_CATEGORIES.map((cat) => {
                const catQuestions = takingSurvey.questions.filter(
                  (q) => normalizeSurveyCategory(q.category) === cat
                );
                if (catQuestions.length === 0) return null;
                const answeredInCat = catQuestions.filter((q) => (surveyAnswers[q.id]?.rating || 0) > 0).length;

                return (
                  <div
                    key={cat}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold border ${CORE_CATEGORY_META[cat].colorClass}`}
                        >
                          {CORE_CATEGORY_META[cat].bn} ({CORE_CATEGORY_META[cat].en})
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {CORE_CATEGORY_META[cat].descBn} • {CORE_CATEGORY_META[cat].descEn}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
                        {answeredInCat} / {catQuestions.length}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {catQuestions.map((q, qIdx) => {
                        const currentVal = surveyAnswers[q.id]?.rating || 0;
                        return (
                          <div key={q.id} className="p-4 space-y-3">
                            <div className="space-y-1">
                              <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                <span className="text-teal-600 mr-1.5">{qIdx + 1}.</span>
                                {q.questionBn || q.questionEn}
                              </div>
                              {q.questionEn && q.questionBn && q.questionEn !== q.questionBn && (
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 pl-5 leading-snug">
                                  {q.questionEn}
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-5 gap-2">
                              {RATING_SCALE_LABELS.map((item) => (
                                <button
                                  key={item.val}
                                  type="button"
                                  onClick={() =>
                                    setSurveyAnswers((prev) => ({
                                      ...prev,
                                      [q.id]: { rating: item.val, comment: prev[q.id]?.comment || "" },
                                    }))
                                  }
                                  className={`py-2 px-1 rounded-xl border text-center transition-all ${
                                    currentVal === item.val
                                      ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-400"
                                  }`}
                                >
                                  <div className="text-sm font-bold tabular-nums">{item.val}</div>
                                  <div className="text-[10px] font-semibold truncate">{item.bn}</div>
                                  <div className="text-[9px] opacity-80 truncate">{item.en}</div>
                                </button>
                              ))}
                            </div>

                            <input
                              type="text"
                              value={surveyAnswers[q.id]?.comment || ""}
                              onChange={(e) =>
                                setSurveyAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: { rating: prev[q.id]?.rating || 0, comment: e.target.value },
                                }))
                              }
                              placeholder={
                                isBangla ? "এই বিষয়ে কোনো মন্তব্য থাকলে লিখুন (ঐচ্ছিক)..." : "Optional remark for this question..."
                              }
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Overall General Comment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isBangla ? "সার্বিক পরামর্শ বা মন্তব্য (ঐচ্ছিক)" : "Overall Comments & Suggestions (Optional)"}
                </label>
                <textarea
                  rows={3}
                  value={surveyGeneralComment}
                  onChange={(e) => setSurveyGeneralComment(e.target.value)}
                  placeholder={
                    isBangla
                      ? "প্রতিষ্ঠান, টিম বা কাজের পরিবেশ উন্নয়নে আপনার যেকোনো পরামর্শ লিখুন..."
                      : "Share any overall suggestions to improve the workplace..."
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {Object.values(surveyAnswers).filter((a) => a.rating > 0).length} / {takingSurvey.questions.length}{" "}
                {isBangla ? "টি প্রশ্নের উত্তর দেওয়া হয়েছে" : "questions answered"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTakingSurvey(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm"
                >
                  {isBangla ? "সার্ভে সাবমিট করুন" : "Submit Survey"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CREATE CUSTOM 5-CATEGORY SURVEY (ADMIN / HR)                   */}
      {/* ===================================================================== */}
      {showCreateSurveyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateSurvey}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isBangla ? "নতুন ৫-ক্যাটাগরি বিস্তারিত সার্ভে তৈরি করুন" : "Create New 5-Category Detailed Survey"}
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateSurveyModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "সার্ভের শিরোনাম (বাংলা) *" : "Survey Title (Bangla) *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newSurveyTitleBn}
                    onChange={(e) => setNewSurveyTitleBn(e.target.value)}
                    placeholder="যেমন: অর্ধবার্ষিক কর্মপরিবেশ ও নেতৃত্ব সার্ভে"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "সার্ভের শিরোনাম (English)" : "Survey Title (English)"}
                  </label>
                  <input
                    type="text"
                    value={newSurveyTitleEn}
                    onChange={(e) => setNewSurveyTitleEn(e.target.value)}
                    placeholder="e.g. Semi-Annual Workplace & Leadership Survey"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "চক্র (Cycle)" : "Cycle"}
                  </label>
                  <select
                    value={newSurveyCycle}
                    onChange={(e) => setNewSurveyCycle(e.target.value as FeedbackSurvey["cycleType"])}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="SEMI_ANNUAL">6-Month</option>
                    <option value="ANNUAL">Annual</option>
                    <option value="SPECIAL">Special</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "পিরিয়ড লেবেল" : "Period"}
                  </label>
                  <input
                    type="text"
                    value={newSurveyPeriod}
                    onChange={(e) => setNewSurveyPeriod(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "শুরু" : "Start"}
                  </label>
                  <input
                    type="date"
                    value={newSurveyStart}
                    onChange={(e) => setNewSurveyStart(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isBangla ? "শেষ" : "End"}
                  </label>
                  <input
                    type="date"
                    value={newSurveyEnd}
                    onChange={(e) => setNewSurveyEnd(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Add Custom Question Builder */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isBangla ? "নতুন প্রশ্ন যোগ করুন (যেকোনো ক্যাটাগরিতে)" : "Add Custom Question (Any Category)"}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={customQCategory}
                    onChange={(e) => setCustomQCategory(e.target.value as CoreSurveyCategory)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                  >
                    {CORE_SURVEY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {isBangla ? CORE_CATEGORY_META[c].bn : CORE_CATEGORY_META[c].en}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={customQBn}
                    onChange={(e) => setCustomQBn(e.target.value)}
                    placeholder={isBangla ? "বাংলায় প্রশ্ন লিখুন..." : "Question in Bangla..."}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={customQEn}
                      onChange={(e) => setCustomQEn(e.target.value)}
                      placeholder="Question in English..."
                      className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomQuestion}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold shrink-0"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Current Questions List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isBangla
                    ? `অন্তর্ভুক্ত প্রশ্নসমূহ (${newSurveyQuestions.length} টি)`
                    : `Included Questions (${newSurveyQuestions.length})`}
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {newSurveyQuestions.map((q, idx) => {
                    const cat = normalizeSurveyCategory(q.category);
                    return (
                      <div
                        key={q.id}
                        className="flex items-start justify-between gap-2 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div>
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border mr-2 ${CORE_CATEGORY_META[cat].colorClass}`}
                            >
                              {CORE_CATEGORY_META[cat].bn} / {CORE_CATEGORY_META[cat].en}
                            </span>
                            <span className="text-slate-900 dark:text-slate-100 font-semibold">
                              {idx + 1}. {q.questionBn || q.questionEn}
                            </span>
                          </div>
                          {q.questionEn && q.questionBn && q.questionEn !== q.questionBn && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-1">
                              {q.questionEn}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setNewSurveyQuestions((prev) => prev.filter((item) => item.id !== q.id))
                          }
                          className="text-slate-400 hover:text-rose-600 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateSurveyModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {isBangla ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
              >
                {isBangla ? "সার্ভে পাবলিশ করুন" : "Publish Survey"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
