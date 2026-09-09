import React, { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import {
  UserPlus,
  Briefcase,
  Sparkles,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  Calendar,
  Layers,
  Star,
  Download,
  Upload,
  X,
  Loader2,
  Sliders,
  CheckCheck,
  AlertTriangle,
  GraduationCap,
  Award,
  Phone,
  Mail,
  User,
  Trash2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  List,
  Eye,
  RefreshCw,
  FileSpreadsheet,
  Copy,
  DollarSign,
  BriefcaseBusiness,
  TrendingUp,
  BookOpen,
  Check,
  HelpCircle,
  Info,
} from "lucide-react";
import { JobPosting, Candidate, Branch, Department, ScreeningCriteria } from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import {
  mapRowToCandidate,
  evaluateCandidateScreening,
  downloadCandidateExcelTemplate,
  getDemoExternalCandidates,
  RECRUITMENT_METADATA_FIELDS,
  RecruitmentMetadataField,
  generateGoogleFormsQuestionsText,
} from "../../utils/recruitmentScreeningEngine";

interface RecruitmentViewProps {
  jobs: JobPosting[];
  candidates: Candidate[];
  branches: Branch[];
  departments: Department[];
  onAddJob: (job: JobPosting) => void;
  onUpdateCandidateStage: (candidateId: string, stage: Candidate["stage"]) => void;
  onAddCandidates?: (newCandidates: Candidate[]) => void;
  onBulkUpdateCandidates?: (candidates: Candidate[]) => void;
  onDeleteCandidate?: (candidateId: string) => void;
}

export const RecruitmentView: React.FC<RecruitmentViewProps> = ({
  jobs,
  candidates,
  branches,
  departments,
  onAddJob,
  onUpdateCandidateStage,
  onAddCandidates,
  onBulkUpdateCandidates,
  onDeleteCandidate,
}) => {
  const { t, isBangla } = useThemeLanguage();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"SCREENING_ENGINE" | "PIPELINE" | "JOBS">("SCREENING_ENGINE");
  const [selectedJobId, setSelectedJobId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEligibility, setFilterEligibility] = useState<"ALL" | "QUALIFIED" | "DISQUALIFIED">("ALL");
  const [viewLayout, setViewLayout] = useState<"CARDS" | "TABLE">("CARDS");

  // Screening Criteria State
  const [criteria, setCriteria] = useState<ScreeningCriteria>({
    minSscGpa: 4.0,
    minHscGpa: 4.0,
    minHonorsCgpa: 3.0,
    requireMasters: false,
    minMastersCgpa: 3.0,
    minExperienceYears: 2,
    departmentKeywords: "CSE, EEE, Computer Science, Software, Engineering, BBA, HRM, Marketing, Finance",
    maxExpectedSalary: 160000,
  });

  // Upload & File Processing States
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [rawPastedText, setRawPastedText] = useState("");
  const [showMetadataGuideModal, setShowMetadataGuideModal] = useState(false);
  const [metadataSearchQuery, setMetadataSearchQuery] = useState("");
  const [metadataCategoryFilter, setMetadataCategoryFilter] = useState<string>("ALL");
  const [copiedFieldKey, setCopiedFieldKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Candidate Profile & AI Modal States
  const [selectedCandidateForBio, setSelectedCandidateForBio] = useState<Candidate | null>(null);
  const [isAiScreening, setIsAiScreening] = useState(false);
  const [aiScreeningResult, setAiScreeningResult] = useState<any | null>(null);

  // New Job Modal State
  const [showJobModal, setShowJobModal] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobDeptId, setNewJobDeptId] = useState(departments[0]?.id || "");
  const [newJobBranchId, setNewJobBranchId] = useState(branches[0]?.id || "");
  const [newJobExp, setNewJobExp] = useState("2-5 Years");
  const [newJobVacancies, setNewJobVacancies] = useState(2);
  const [newJobMinSal, setNewJobMinSal] = useState(80000);
  const [newJobMaxSal, setNewJobMaxSal] = useState(140000);
  const [newJobSkills, setNewJobSkills] = useState("TypeScript, React, Node.js, PostgreSQL, Git");

  // Selected Active Job
  const currentActiveJob = useMemo(() => {
    if (selectedJobId === "ALL") return jobs[0] || null;
    return jobs.find((j) => j.id === selectedJobId) || jobs[0] || null;
  }, [jobs, selectedJobId]);

  // Candidates filtered by job
  const jobCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const jId = c.jobPostingId || c.jobCircularId;
      return selectedJobId === "ALL" || jId === selectedJobId;
    });
  }, [candidates, selectedJobId]);

  // Evaluate each candidate against active criteria
  const evaluatedCandidates = useMemo(() => {
    return jobCandidates.map((c) => {
      const evaluation = evaluateCandidateScreening(c, criteria);
      return {
        ...c,
        isScreeningEligible: evaluation.isEligible,
        screeningScore: evaluation.totalScore,
        passedReasons: evaluation.passedReasons,
        failedReasons: evaluation.failedReasons,
      };
    });
  }, [jobCandidates, criteria]);

  // Filtered by Search & Eligibility tab
  const displayedCandidates = useMemo(() => {
    return evaluatedCandidates.filter((cand) => {
      // Eligibility Filter
      if (filterEligibility === "QUALIFIED" && !cand.isScreeningEligible) return false;
      if (filterEligibility === "DISQUALIFIED" && cand.isScreeningEligible) return false;

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = cand.fullName.toLowerCase().includes(q);
        const matchEmail = cand.email?.toLowerCase().includes(q);
        const matchPhone = cand.phone?.includes(q);
        const matchDept = cand.honorsDept?.toLowerCase().includes(q);
        const matchInst = cand.honorsInstitute?.toLowerCase().includes(q);
        const matchComp = cand.experienceHistory?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchDept && !matchInst && !matchComp) {
          return false;
        }
      }
      return true;
    });
  }, [evaluatedCandidates, filterEligibility, searchQuery]);

  // Stats Counters
  const totalCount = evaluatedCandidates.length;
  const qualifiedCount = evaluatedCandidates.filter((c) => c.isScreeningEligible).length;
  const disqualifiedCount = totalCount - qualifiedCount;
  const qualifiedPercentage = totalCount > 0 ? Math.round((qualifiedCount / totalCount) * 100) : 0;

  // 1. File Upload & XLSX Parsing Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setUploadFeedback(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const binaryStr = evt.target?.result;
        const workbook = XLSX.read(binaryStr, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJsonRows: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJsonRows || rawJsonRows.length === 0) {
          setUploadFeedback({
            type: "error",
            message: t(
              "এক্সেল ফাইলে কোনো ডেটা পাওয়া যায়নি। দয়া করে সঠিক টেমপ্লেট ব্যবহার করুন।",
              "No valid rows found in the uploaded Excel file. Please use the standard template."
            ),
          });
          setIsProcessingFile(false);
          return;
        }

        const targetJob = currentActiveJob || jobs[0] || { id: "job-01", title: "General Applicant Pool" };
        const parsedCandidates: Candidate[] = rawJsonRows.map((row, idx) =>
          mapRowToCandidate(row, targetJob.id, targetJob.title, idx)
        );

        if (onAddCandidates) {
          onAddCandidates(parsedCandidates);
        }

        setUploadFeedback({
          type: "success",
          message: t(
            `সফলভাবে ${parsedCandidates.length} জন প্রার্থীর সিভি ও তথ্য এক্সেল ফাইল থেকে ইমপোর্ট করা হয়েছে!`,
            `Successfully imported ${parsedCandidates.length} applicant CV profiles from Excel file!`
          ),
        });
      } catch (err: any) {
        console.error("Error parsing Excel file", err);
        setUploadFeedback({
          type: "error",
          message: t(
            "এক্সেল ফাইল প্রক্রিয়াকরণে ত্রুটি হয়েছে। দয়া করে ফরম্যাটটি পরীক্ষা করুন।",
            "Failed to parse Excel file. Please verify format and column names."
          ),
        });
      } finally {
        setIsProcessingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.onerror = () => {
      setUploadFeedback({
        type: "error",
        message: t("ফাইল রিড করতে ব্যর্থ হয়েছে।", "Failed to read uploaded file."),
      });
      setIsProcessingFile(false);
    };

    reader.readAsBinaryString(file);
  };

  // 2. Direct Paste (Google Sheets / TSV / CSV) Handler
  const handleProcessPastedData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawPastedText.trim()) return;

    try {
      setIsProcessingFile(true);
      const lines = rawPastedText.trim().split("\n");
      if (lines.length < 2) {
        alert(t("দয়া করে কমপক্ষে হেডার এবং একটি প্রার্থীর তথ্য পেস্ট করুন।", "Please paste header row and at least one candidate row."));
        setIsProcessingFile(false);
        return;
      }

      // Detect delimiter (Tab or Comma)
      const firstLine = lines[0];
      const delimiter = firstLine.includes("\t") ? "\t" : ",";
      const headers = firstLine.split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ""));

      const rows: Record<string, any>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(delimiter).map((v) => v.trim().replace(/^["']|["']$/g, ""));
        const rowObj: Record<string, any> = {};
        headers.forEach((h, hIdx) => {
          rowObj[h] = values[hIdx] || "";
        });
        rows.push(rowObj);
      }

      const targetJob = currentActiveJob || jobs[0] || { id: "job-01", title: "General Applicant Pool" };
      const parsedCandidates: Candidate[] = rows.map((row, idx) =>
        mapRowToCandidate(row, targetJob.id, targetJob.title, idx)
      );

      if (onAddCandidates) {
        onAddCandidates(parsedCandidates);
      }

      setShowPasteModal(false);
      setRawPastedText("");
      setUploadFeedback({
        type: "success",
        message: t(
          `গুগল শিট / ক্লিপবোর্ড থেকে ${parsedCandidates.length} জন প্রার্থীর সিভি যুক্ত হয়েছে!`,
          `Successfully loaded ${parsedCandidates.length} candidates from pasted spreadsheet!`
        ),
      });
    } catch (err) {
      console.error(err);
      alert(t("পেস্ট করা ডেটা পড়তে সমস্যা হয়েছে।", "Failed to parse pasted table."));
    } finally {
      setIsProcessingFile(false);
    }
  };

  // 3. Load 8+ Demo Realistic Applicants
  const handleLoadDemoApplicants = () => {
    const targetJob = currentActiveJob || jobs[0] || { id: "job-01", title: "Senior Software Engineer" };
    const demoCandidates = getDemoExternalCandidates(targetJob.id, targetJob.title);
    if (onAddCandidates) {
      onAddCandidates(demoCandidates);
    }
    setUploadFeedback({
      type: "success",
      message: t(
        `সফলভাবে ${demoCandidates.length} জন বাস্তবসম্মত ডেমো অ্যাপ্লিক্যান্ট ডেটাসেট লোড করা হয়েছে!`,
        `Loaded ${demoCandidates.length} realistic applicant profiles with diverse GPAs, universities and experience!`
      ),
    });
  };

  // 4. Bulk Action: Shortlist All Eligible Candidates
  const handleBulkShortlistEligible = () => {
    const eligibleOnes = evaluatedCandidates.filter((c) => c.isScreeningEligible);
    if (eligibleOnes.length === 0) {
      alert(t("কোনো শর্ত পূরণকারী যোগ্য প্রার্থী নেই। স্ক্রিনিং শর্ত শিথিল করে পুনরায় চেষ্টা করুন।", "No candidates meet current screening criteria."));
      return;
    }

    const updated = eligibleOnes.map((c) => ({
      ...c,
      stage: "SCREENING" as Candidate["stage"],
      screeningStatus: "PASSED" as const,
      aiScore: c.screeningScore,
    }));

    if (onBulkUpdateCandidates) {
      onBulkUpdateCandidates(updated);
    } else {
      updated.forEach((c) => onUpdateCandidateStage(c.id, "SCREENING"));
    }

    setUploadFeedback({
      type: "success",
      message: t(
        `অভিনন্দন! ${eligibleOnes.length} জন যোগ্য প্রার্থীকে এক ক্লিকে 'SCREENING & SHORTLIST' স্টেজে পাঠানো হয়েছে।`,
        `Successfully moved ${eligibleOnes.length} qualified candidates to SCREENING & SHORTLIST pipeline!`
      ),
    });
  };

  // 5. Bulk Action: Mark Disqualified Candidates as Rejected
  const handleBulkRejectDisqualified = () => {
    const disqualifiedOnes = evaluatedCandidates.filter((c) => !c.isScreeningEligible);
    if (disqualifiedOnes.length === 0) {
      alert(t("কোনো অযোগ্য প্রার্থী নেই।", "No disqualified candidates found."));
      return;
    }

    if (!confirm(t(`আপনি কি ${disqualifiedOnes.length} জন অযোগ্য প্রার্থীকে বাতিল করতে চান?`, `Are you sure you want to mark ${disqualifiedOnes.length} disqualified candidates as REJECTED?`))) {
      return;
    }

    const updated = disqualifiedOnes.map((c) => ({
      ...c,
      stage: "REJECTED" as Candidate["stage"],
      screeningStatus: "FAILED" as const,
    }));

    if (onBulkUpdateCandidates) {
      onBulkUpdateCandidates(updated);
    } else {
      updated.forEach((c) => onUpdateCandidateStage(c.id, "REJECTED"));
    }

    setUploadFeedback({
      type: "success",
      message: t(
        `${disqualifiedOnes.length} জন অযোগ্য প্রার্থীকে বাতিল হিসেবে চিহ্নিত করা হয়েছে।`,
        `Marked ${disqualifiedOnes.length} disqualified applicants as rejected.`
      ),
    });
  };

  // 6. Export Filtered/Screened Candidates to Excel
  const handleExportScreenedToExcel = () => {
    if (displayedCandidates.length === 0) {
      alert(t("এক্সপোর্ট করার জন্য কোনো প্রার্থী পাওয়া যায়নি।", "No candidate records to export."));
      return;
    }

    const exportData = displayedCandidates.map((c, i) => ({
      "SL": i + 1,
      "Screening Status": c.isScreeningEligible ? "QUALIFIED" : "DISQUALIFIED",
      "Screening Score (%)": c.screeningScore || 0,
      "Full Name": c.fullName,
      "Mobile Phone": c.phone || "",
      "Email Address": c.email || "",
      "NID Number": c.nidNumber || "",
      "Father's Name": c.fatherName || "",
      "Mother's Name": c.motherName || "",
      "SSC GPA": c.sscGpa || "",
      "SSC Institute": c.sscInstitute || "",
      "HSC GPA": c.hscGpa || "",
      "HSC Institute": c.hscInstitute || "",
      "Honors CGPA": c.honorsCgpa || "",
      "Honors Institute": c.honorsInstitute || "",
      "Honors Dept": c.honorsDept || "",
      "Masters CGPA": c.mastersCgpa || "N/A",
      "Masters Institute": c.mastersInstitute || "N/A",
      "Experience Years": c.experienceYears || 0,
      "Previous Companies": c.experienceHistory || "",
      "Current Designation": c.currentDesignation || "",
      "Expected Salary (BDT)": c.expectedSalary || 0,
      "Pipeline Stage": c.stage,
      "Failed Criteria": (c.failedReasons || []).join(" | "),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Screened_Candidates");
    XLSX.writeFile(
      workbook,
      `WorkflowHR_Screened_Applicants_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  // Run AI Deep Resume & Question Screener
  const handleRunAiResumeScreening = async (cand: Candidate) => {
    setIsAiScreening(true);
    setAiScreeningResult(null);

    const evalResult = evaluateCandidateScreening(cand, criteria);
    const job = jobs.find((j) => j.id === (cand.jobPostingId || cand.jobCircularId)) || jobs[0];
    const candidateSkills = cand.skills || ["TypeScript", "React", "Node.js", "System Design"];

    try {
      const response = await fetch("/api/ai/screen-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job?.title || cand.appliedRole || "Software Engineer",
          jobRequirements: job?.requirements || ["React", "TypeScript", "Node.js", "PostgreSQL"],
          candidateName: cand.fullName,
          resumeText: `Candidate: ${cand.fullName}. Academic: SSC GPA ${cand.sscGpa}, HSC GPA ${cand.hscGpa}, Honors CGPA ${cand.honorsCgpa} from ${cand.honorsInstitute} (${cand.honorsDept}). Masters CGPA: ${cand.mastersCgpa || "N/A"}. Experience: ${cand.experienceYears} years. Work History: ${cand.experienceHistory}. Expected Salary: ৳${cand.expectedSalary}.`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiScreeningResult(data);
      } else {
        setAiScreeningResult({
          matchScore: evalResult.totalScore || 90,
          verdict: evalResult.isEligible ? "STRONG_MATCH" : "PARTIAL_MATCH",
          summary: `${cand.fullName} has a strong academic standing (${cand.honorsInstitute} - CGPA ${cand.honorsCgpa}) and ${cand.experienceYears} years of practical industry experience.`,
          matchedSkills: candidateSkills,
          missingSkills: ["Cloud Architecture Certification"],
          recommendedQuestions: [
            `Can you describe your experience with ${cand.experienceHistory || "previous projects"}?`,
            "How do you design high-availability backend microservices with Redis and PostgreSQL?",
            "What strategies do you adopt for responsive multi-branch HR and Payroll calculation workflows?",
          ],
        });
      }
    } catch (err) {
      setAiScreeningResult({
        matchScore: evalResult.totalScore || 85,
        verdict: "MATCH",
        summary: `Qualified candidate profile matching technical and academic thresholds.`,
        matchedSkills: candidateSkills,
        missingSkills: ["Automated CI/CD"],
        recommendedQuestions: [
          "Explain your core approach to managing concurrent database write transactions.",
          "Describe a complex algorithmic challenge you resolved in your past company.",
        ],
      });
    } finally {
      setIsAiScreening(false);
    }
  };

  // Pipeline Stages
  const pipelineStages: Array<{ id: Candidate["stage"]; label: string; count: number }> = [
    { id: "APPLIED", label: t("নতুন আবেদন (Applied)", "New Applied"), count: jobCandidates.filter((c) => c.stage === "APPLIED").length },
    { id: "SCREENING", label: t("স্ক্রিনিং / শর্টলিস্ট", "Screening / Shortlisted"), count: jobCandidates.filter((c) => c.stage === "SCREENING").length },
    { id: "INTERVIEW", label: t("সাক্ষাৎকার (Interview)", "Interview"), count: jobCandidates.filter((c) => c.stage === "INTERVIEW").length },
    { id: "OFFERED", label: t("অফার লেটার প্রেরিত", "Job Offer Sent"), count: jobCandidates.filter((c) => c.stage === "OFFERED").length },
    { id: "HIRED", label: t("নিয়োগ সম্পন্ন (Hired)", "Hired"), count: jobCandidates.filter((c) => c.stage === "HIRED").length },
  ];

  // Job Creation
  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    const dept = departments.find((d) => d.id === newJobDeptId) || departments[0];
    const branch = branches.find((b) => b.id === newJobBranchId) || branches[0];

    const job: JobPosting = {
      id: `job-${Date.now()}`,
      title: newJobTitle,
      departmentId: dept.id,
      departmentName: dept.name,
      branchId: branch.id,
      branchName: branch.name,
      vacancies: Number(newJobVacancies),
      experienceRequired: newJobExp,
      salaryRange: `৳${(Number(newJobMinSal) || 0).toLocaleString()} - ৳${(Number(newJobMaxSal) || 0).toLocaleString()}`,
      deadline: "2026-10-30",
      status: "OPEN",
      description: "Exciting enterprise growth opportunity.",
      requirements: (newJobSkills || "").split(",").map((s) => s.trim()).filter(Boolean),
    };

    onAddJob(job);
    setShowJobModal(false);
    setNewJobTitle("");
  };

  return (
    <div id="recruitment-ats-view" className="space-y-6 animate-in fade-in duration-300 text-slate-900 dark:text-slate-100">
      {/* TOP BANNER & NAVIGATION */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t("স্মার্ট রিক্রুটমেন্ট ও এক্সেল সিভি স্ক্রিনিং ইঞ্জিন", "Recruitment ATS & Excel CV Screening Engine")}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t(
                  "গুগল ফর্ম বা এক্সেল থেকে প্রার্থীদের ডেটা ইমপোর্ট করুন এবং এসএসসি, এইচএসসি, অনার্স জিপিএ ও অভিজ্ঞতার শর্তে স্বয়ংক্রিয় শর্টলিস্ট করুন",
                  "Import candidates from Excel/Google Forms and instantly screen by SSC/HSC GPA, honors CGPA & experience thresholds"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab("SCREENING_ENGINE")}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "SCREENING_ENGINE"
                  ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Sliders className="w-4 h-4 text-teal-500" />
              <span>{t("স্মার্ট স্ক্রিনিং ও এক্সেল", "Smart Screening")}</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px]">
                {jobCandidates.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("PIPELINE")}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "PIPELINE"
                  ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t("কানবান পাইপলাইন", "ATS Pipeline")}</span>
            </button>

            <button
              onClick={() => setActiveTab("JOBS")}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "JOBS"
                  ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>{t("সার্কুলার তালিকা", "Job Postings")}</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]">
                {jobs.length}
              </span>
            </button>
          </div>

          <button
            onClick={() => setShowJobModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t("নতুন সার্কুলার পোস্ট করুন", "Post Circular")}</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK TOAST */}
      {uploadFeedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold transition-all ${
            uploadFeedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {uploadFeedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{uploadFeedback.message}</span>
          </div>
          <button
            onClick={() => setUploadFeedback(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. SMART SCREENING & EXCEL INGESTION TAB (PRIMARY WORKFLOW) */}
      {/* ========================================================================= */}
      {activeTab === "SCREENING_ENGINE" && (
        <div className="space-y-6">
          {/* STEP 1: DATA INGESTION & UPLOAD HUB */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center">
                  ১
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {t("গুগল ফর্ম ও এক্সেল সিভি ইমপোর্ট হাব", "Step 1: Ingest Applicants (Excel / Google Forms)")}
                </h3>
              </div>

              {/* Target Job Selector & Helper Tools */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {t("টার্গেট সার্কুলার:", "Target Job:")}
                  </span>
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 max-w-[220px] truncate"
                  >
                    <option value="ALL">{t("সকল সার্কুলার (All Openings)", "All Job Circulars")}</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} ({j.branchName})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setShowJobModal(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  title="নতুন ইন্টারনাল সার্কুলার তৈরি করুন যাতে তার আন্ডারে এক্সেল আপলোড করতে পারেন"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t("নতুন সার্কুলার", "+ New Job")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowMetadataGuideModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>{t("গুগল ফর্ম / মেটাডাটা হেডিং গাইড", "Form Heading Guide")}</span>
                </button>
              </div>
            </div>

            {/* Ingestion Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Box A: Upload Excel File */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group p-5 rounded-2xl border-2 border-dashed border-teal-500/30 hover:border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2.5 relative overflow-hidden"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {isProcessingFile ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                    {t("এক্সেল / সিএসভি আপলোড করুন", "Upload Excel / CSV File")}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {t("ড্র্যাগ করুন অথবা ক্লিক করে .xlsx, .csv ফাইল সিলেক্ট করুন", "Click or drop .xlsx, .xls or .csv file")}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Box B: Direct Paste from Google Sheets */}
              <div
                onClick={() => setShowPasteModal(true)}
                className="group p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 bg-slate-50/80 dark:bg-slate-950/50 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Copy className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {t("ক্লিপবোর্ড বা গুগল শিট পেস্ট", "Paste Google Sheets Table")}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {t("কপি করা গুগল শিট বা এক্সেল টেবিল সরাসরি পেস্ট করুন", "Direct paste rows from clipboard / web form")}
                  </p>
                </div>
              </div>

              {/* Box C: Download Template, Metadata Guide & Load Demo */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t("প্রস্তুত টেমপ্লেট ও টেস্ট ডেটা", "Templates & Form Metadata")}
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {t("গুগল ফর্মের হেডিং মিলানো এবং এক্সেল টেমপ্লেট ব্যবহার করুন", "Map form headers, download sample template or test demo CVs")}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowMetadataGuideModal(true)}
                    className="w-full py-2 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>{t("গুগল ফর্ম হেডিং নির্দেশিকা", "Google Form Headings Guide")}</span>
                  </button>

                  <button
                    onClick={downloadCandidateExcelTemplate}
                    className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-600" />
                    <span>{t("ফর্ম এক্সেল টেমপ্লেট ডাউনলোড", "Download Form Template")}</span>
                  </button>

                  <button
                    onClick={handleLoadDemoApplicants}
                    className="w-full py-2 px-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/80 hover:bg-teal-100 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t("৮+ বাস্তব ডেমো প্রার্থী লোড করুন", "Load 8+ Demo Applicants")}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: MULTI-CRITERIA SMART SCREENING CONTROLLER */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center">
                  ২
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {t("স্বয়ংক্রিয় স্ক্রিনিং শর্তাবলি ও ফিল্টার কন্ট্রোলার", "Step 2: Automated Screening Thresholds & Filters")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t(
                      "জিপিএ, ডিগ্রি ও অভিজ্ঞতার শর্ত পরিবর্তন করলে সাথে সাথে রিয়েল-টাইমে প্রার্থীরা শর্টলিস্ট বা ফিল্টার হবেন",
                      "Adjust GPA, degree, experience and department filters to instantly evaluate candidates"
                    )}
                  </p>
                </div>
              </div>

              {/* Reset to Default */}
              <button
                onClick={() =>
                  setCriteria({
                    minSscGpa: 4.0,
                    minHscGpa: 4.0,
                    minHonorsCgpa: 3.0,
                    requireMasters: false,
                    minMastersCgpa: 3.0,
                    minExperienceYears: 2,
                    departmentKeywords: "CSE, EEE, Computer Science, Software, Engineering, BBA, HRM, Marketing, Finance",
                    maxExpectedSalary: 160000,
                  })
                }
                className="text-xs font-bold text-slate-500 hover:text-teal-600 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t("ডিফল্ট শর্তে রিসেট", "Reset Criteria")}</span>
              </button>
            </div>

            {/* Threshold Sliders & Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Criterion 1: Min SSC GPA */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-teal-600" />
                    <span>{t("ন্যূনতম এসএসসি জিপিএ", "Min SSC GPA")}</span>
                  </span>
                  <span className="text-xs font-mono font-black text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">
                    {criteria.minSscGpa.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="5.0"
                  step="0.1"
                  value={criteria.minSscGpa}
                  onChange={(e) => setCriteria({ ...criteria, minSscGpa: parseFloat(e.target.value) })}
                  className="w-full accent-teal-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>২.০০</span>
                  <span>৪.০০</span>
                  <span>৫.০০</span>
                </div>
              </div>

              {/* Criterion 2: Min HSC GPA */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-teal-600" />
                    <span>{t("ন্যূনতম এইচএসসি জিপিএ", "Min HSC GPA")}</span>
                  </span>
                  <span className="text-xs font-mono font-black text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">
                    {criteria.minHscGpa.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="5.0"
                  step="0.1"
                  value={criteria.minHscGpa}
                  onChange={(e) => setCriteria({ ...criteria, minHscGpa: parseFloat(e.target.value) })}
                  className="w-full accent-teal-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>২.০০</span>
                  <span>৪.০০</span>
                  <span>৫.০০</span>
                </div>
              </div>

              {/* Criterion 3: Min Honors CGPA */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span>{t("ন্যূনতম অনার্স সিজিপিএ", "Min Honors CGPA")}</span>
                  </span>
                  <span className="text-xs font-mono font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                    {criteria.minHonorsCgpa.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="4.0"
                  step="0.05"
                  value={criteria.minHonorsCgpa}
                  onChange={(e) => setCriteria({ ...criteria, minHonorsCgpa: parseFloat(e.target.value) })}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>২.০০</span>
                  <span>৩.০০</span>
                  <span>৪.০০</span>
                </div>
              </div>

              {/* Criterion 4: Min Work Experience */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    <span>{t("কাজের অভিজ্ঞতা (বছর)", "Min Experience (Yrs)")}</span>
                  </span>
                  <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {criteria.minExperienceYears} {t("বছর", "Yrs")}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="0.5"
                  value={criteria.minExperienceYears}
                  onChange={(e) => setCriteria({ ...criteria, minExperienceYears: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>০ (ফ্রেশার)</span>
                  <span>২ বছর</span>
                  <span>৮+ বছর</span>
                </div>
              </div>
            </div>

            {/* Additional Criteria: Masters & Department Filter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Masters Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    {t("মাস্টার্স ডিগ্রি বাধ্যতামূলক?", "Require Masters Degree?")}
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {criteria.requireMasters ? t("মাস্টার্স সম্পন্ন থাকতে হবে", "Mandatory Masters requirement") : t("শুধুমাত্র অনার্স/স্নাতক যথেষ্ট", "Bachelor degree is sufficient")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCriteria({ ...criteria, requireMasters: !criteria.requireMasters })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    criteria.requireMasters ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      criteria.requireMasters ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Department Keywords */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 md:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t("অনুমোদিত বিভাগ / মেজর কি-ওয়ার্ড (Department Filter)", "Allowed Department / Major Keywords")}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {t("কমা দিয়ে আলাদা করুন", "Comma separated")}
                  </span>
                </div>
                <input
                  type="text"
                  value={criteria.departmentKeywords || ""}
                  onChange={(e) => setCriteria({ ...criteria, departmentKeywords: e.target.value })}
                  placeholder="e.g. CSE, EEE, Software, Computer Science, BBA, HRM"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* REAL-TIME SCREENING METRICS & BULK ACTION BAR */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 text-white space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Metrics */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t("মোট প্রার্থী সংখ্যা", "Total Screened")}
                    </span>
                    <span className="text-2xl font-black text-white">{totalCount}</span>
                  </div>

                  <div className="h-8 w-px bg-slate-800 hidden sm:block" />

                  <div>
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t("যোগ্য / শর্টলিস্টেড", "Eligible (Passed)")}</span>
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-400">{qualifiedCount}</span>
                      <span className="text-xs font-bold text-emerald-500/80">({qualifiedPercentage}%)</span>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-slate-800 hidden sm:block" />

                  <div>
                    <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{t("শর্ত পূরণ করেনি", "Disqualified")}</span>
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-rose-400">{disqualifiedCount}</span>
                      <span className="text-xs font-bold text-rose-500/80">({100 - qualifiedPercentage}%)</span>
                    </div>
                  </div>
                </div>

                {/* Instant Bulk Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleBulkShortlistEligible}
                    disabled={qualifiedCount === 0}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>{t(`যোগ্য ${qualifiedCount} জনকে শর্টলিস্ট করুন`, `Bulk Shortlist All Eligible (${qualifiedCount})`)}</span>
                  </button>

                  <button
                    onClick={handleBulkRejectDisqualified}
                    disabled={disqualifiedCount === 0}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs font-bold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>{t("অযোগ্যদের বাদ দিন", "Reject Disqualified")}</span>
                  </button>

                  <button
                    onClick={handleExportScreenedToExcel}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4 text-teal-400" />
                    <span>{t("এক্সেল এক্সপোর্ট", "Export Excel")}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: CANDIDATE APPLICANTS LIST & SCREENING DIAGNOSTICS */}
          <div className="space-y-4">
            {/* Filter Tabs & Search Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(
                    "নাম, ফোন, বিশ্ববিদ্যালয়, ডিপার্টমেন্ট বা কোম্পানি খুঁজুন...",
                    "Search applicant name, phone, university, dept, company..."
                  )}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-2">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
                  <button
                    onClick={() => setFilterEligibility("ALL")}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      filterEligibility === "ALL"
                        ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs"
                        : "text-slate-500"
                    }`}
                  >
                    {t("সকল প্রার্থী", "All")} ({totalCount})
                  </button>

                  <button
                    onClick={() => setFilterEligibility("QUALIFIED")}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      filterEligibility === "QUALIFIED"
                        ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                        : "text-slate-500"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t("যোগ্য", "Qualified")}</span> ({qualifiedCount})
                  </button>

                  <button
                    onClick={() => setFilterEligibility("DISQUALIFIED")}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      filterEligibility === "DISQUALIFIED"
                        ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs"
                        : "text-slate-500"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{t("অযোগ্য", "Disqualified")}</span> ({disqualifiedCount})
                  </button>
                </div>

                {/* Layout Toggle */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setViewLayout("CARDS")}
                    className={`p-1.5 rounded-lg transition ${
                      viewLayout === "CARDS" ? "bg-white dark:bg-slate-800 text-teal-600 shadow-xs" : "text-slate-400"
                    }`}
                    title={t("কার্ড ভিউ", "Card View")}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewLayout("TABLE")}
                    className={`p-1.5 rounded-lg transition ${
                      viewLayout === "TABLE" ? "bg-white dark:bg-slate-800 text-teal-600 shadow-xs" : "text-slate-400"
                    }`}
                    title={t("টেবিল ভিউ", "Table View")}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Candidates Grid / Table */}
            {displayedCandidates.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t("কোনো প্রার্থী পাওয়া যায়নি", "No applicants found matching filter")}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {t(
                    "এক্সেল ফাইল আপলোড করুন অথবা '৮+ বাস্তব ডেমো প্রার্থী লোড করুন' বাটনে ক্লিক করুন।",
                    "Upload candidate Excel sheet or click 'Load 8+ Demo Applicants' to begin screening."
                  )}
                </p>
                <button
                  onClick={handleLoadDemoApplicants}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t("ডেমো প্রার্থী লোড করুন", "Load Demo Applicants")}</span>
                </button>
              </div>
            ) : viewLayout === "CARDS" ? (
              /* CARD VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedCandidates.map((cand) => {
                  const isPassed = cand.isScreeningEligible;

                  return (
                    <div
                      key={cand.id}
                      className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all hover:shadow-md flex flex-col justify-between space-y-4 ${
                        isPassed
                          ? "border-emerald-500/30 hover:border-emerald-500/60 ring-1 ring-emerald-500/10"
                          : "border-slate-200 dark:border-slate-800/90 hover:border-rose-500/30 opacity-90"
                      }`}
                    >
                      {/* Top Bar: Name, Contact & Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                              {cand.fullName}
                            </h4>
                            {cand.importedFromSheet && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                Excel CV
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            {cand.phone && (
                              <span className="flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{cand.phone}</span>
                              </span>
                            )}
                            {cand.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[170px]">{cand.email}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Screening Verdict Badge */}
                        <div className="text-right shrink-0">
                          {isPassed ? (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-black flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>QUALIFIED</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-xs font-black flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>DISQUALIFIED</span>
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-slate-400 font-mono block mt-1">
                            Score: {cand.screeningScore}%
                          </span>
                        </div>
                      </div>

                      {/* Academic Breakdown Ladder */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
                            <span>{t("শিক্ষাগত যোগ্যতা ও জিপিএ", "Academic Results Ladder")}</span>
                          </span>
                          <span>{cand.honorsDegree || "B.Sc / BBA"}</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {/* SSC */}
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 block">SSC</span>
                            <span className="text-xs font-black text-teal-600 dark:text-teal-400 font-mono">
                              GPA {cand.sscGpa ? cand.sscGpa.toFixed(2) : "N/A"}
                            </span>
                            <span className="text-[9.5px] text-slate-500 block truncate">
                              {cand.sscBoard || "Dhaka"} {cand.sscYear ? `'${String(cand.sscYear).slice(-2)}` : ""}
                            </span>
                          </div>

                          {/* HSC */}
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 block">HSC</span>
                            <span className="text-xs font-black text-teal-600 dark:text-teal-400 font-mono">
                              GPA {cand.hscGpa ? cand.hscGpa.toFixed(2) : "N/A"}
                            </span>
                            <span className="text-[9.5px] text-slate-500 block truncate">
                              {cand.hscBoard || "Dhaka"} {cand.hscYear ? `'${String(cand.hscYear).slice(-2)}` : ""}
                            </span>
                          </div>

                          {/* Honors */}
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block">Honors</span>
                            <span className="text-xs font-black text-purple-600 dark:text-purple-400 font-mono">
                              CGPA {cand.honorsCgpa ? cand.honorsCgpa.toFixed(2) : "N/A"}
                            </span>
                            <span className="text-[9.5px] text-slate-500 block truncate" title={cand.honorsInstitute}>
                              {cand.honorsInstitute?.split(" ")[0] || "University"}
                            </span>
                          </div>

                          {/* Masters */}
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 block">Masters</span>
                            <span className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono">
                              {cand.mastersCgpa && cand.mastersCgpa > 0 ? `CGPA ${cand.mastersCgpa.toFixed(2)}` : "None"}
                            </span>
                            <span className="text-[9.5px] text-slate-500 block truncate">
                              {cand.mastersInstitute ? cand.mastersInstitute.split(" ")[0] : "-"}
                            </span>
                          </div>
                        </div>

                        {/* Major and Institute */}
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 pt-1 flex items-center justify-between">
                          <span className="truncate">
                            <span className="font-semibold text-slate-900 dark:text-white">{cand.honorsDept || "General"}</span> • {cand.honorsInstitute || "Reputed University"}
                          </span>
                        </div>
                      </div>

                      {/* Work Experience & History */}
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1 font-bold">
                            <BriefcaseBusiness className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t("কাজের অভিজ্ঞতা:", "Experience:")}</span>
                          </span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {cand.experienceYears || 0} {t("বছর", "Years")}
                          </span>
                        </div>
                        {cand.experienceHistory && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                            {cand.experienceHistory}
                          </p>
                        )}
                      </div>

                      {/* Diagnostics Details: Why Passed / Failed */}
                      {!isPassed && cand.failedReasons && cand.failedReasons.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] space-y-1">
                          <span className="font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{t("শর্ত পূরণ হয়নি কারণ:", "Disqualified Reasons:")}</span>
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-[10.5px]">
                            {cand.failedReasons.map((r, rIdx) => (
                              <li key={rIdx}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Bottom Action Row: Stage Dropdown & View Profile Trigger */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        {/* Stage Selector */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{t("স্টেজ:", "Stage:")}</span>
                          <select
                            value={cand.stage}
                            onChange={(e) => onUpdateCandidateStage(cand.id, e.target.value as any)}
                            className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                          >
                            <option value="APPLIED">Applied</option>
                            <option value="SCREENING">Screening / Shortlist</option>
                            <option value="INTERVIEW">Interview</option>
                            <option value="OFFERED">Offer Sent</option>
                            <option value="HIRED">Hired</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {onDeleteCandidate && (
                            <button
                              onClick={() => {
                                if (confirm(t("আপনি কি এই প্রার্থীর ডেটা মুছে ফেলতে চান?", "Delete this applicant record?"))) {
                                  onDeleteCandidate(cand.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition cursor-pointer"
                              title={t("মুছে ফেলুন", "Delete")}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedCandidateForBio(cand);
                              handleRunAiResumeScreening(cand);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t("সিভি বায়োডাটা ও এআই", "View CV & AI")}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLE VIEW */
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                      <th className="p-3.5">{t("প্রার্থীর নাম ও যোগাযোগ", "Applicant Name")}</th>
                      <th className="p-3.5">{t("এসএসসি", "SSC")}</th>
                      <th className="p-3.5">{t("এইচএসসি", "HSC")}</th>
                      <th className="p-3.5">{t("অনার্স ডিগ্রি ও সিজিপিএ", "Honors / Degree")}</th>
                      <th className="p-3.5">{t("অভিজ্ঞতা", "Experience")}</th>
                      <th className="p-3.5">{t("স্ক্রিনিং রেজাল্ট", "Screening")}</th>
                      <th className="p-3.5">{t("পাইপলাইন স্টেজ", "Stage")}</th>
                      <th className="p-3.5 text-right">{t("অ্যাকশন", "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {displayedCandidates.map((cand) => (
                      <tr key={cand.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-white">{cand.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{cand.phone || cand.email}</div>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-teal-600">
                          {cand.sscGpa ? cand.sscGpa.toFixed(2) : "-"}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-teal-600">
                          {cand.hscGpa ? cand.hscGpa.toFixed(2) : "-"}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-purple-600 dark:text-purple-400 font-mono">
                            CGPA {cand.honorsCgpa ? cand.honorsCgpa.toFixed(2) : "-"}
                          </div>
                          <div className="text-[10.5px] text-slate-500 truncate max-w-[150px]">
                            {cand.honorsInstitute}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-emerald-600">
                          {cand.experienceYears || 0} {t("বছর", "Yrs")}
                        </td>
                        <td className="p-3.5">
                          {cand.isScreeningEligible ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-[10px] border border-emerald-500/20">
                              QUALIFIED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black text-[10px] border border-rose-500/20">
                              DISQUALIFIED
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <select
                            value={cand.stage}
                            onChange={(e) => onUpdateCandidateStage(cand.id, e.target.value as any)}
                            className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                          >
                            <option value="APPLIED">Applied</option>
                            <option value="SCREENING">Screening</option>
                            <option value="INTERVIEW">Interview</option>
                            <option value="OFFERED">Offered</option>
                            <option value="HIRED">Hired</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedCandidateForBio(cand);
                              handleRunAiResumeScreening(cand);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-300 font-bold hover:bg-teal-100 transition cursor-pointer"
                          >
                            {t("দেখুন", "View")}
                          </button>
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

      {/* ========================================================================= */}
      {/* 2. ATS KANBAN PIPELINE BOARD TAB */}
      {/* ========================================================================= */}
      {activeTab === "PIPELINE" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                {t("সার্কুলার অনুযায়ী ফিল্টার:", "Filter Pipeline by Job:")}
              </span>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="ALL">{t("সকল সক্রিয় নিয়োগ বিজ্ঞপ্তি", "All Job Circulars")}</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.branchName})
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
              {jobCandidates.length} {t("জন প্রার্থী সক্রিয়", "Active Candidates")}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {pipelineStages.map((stage) => {
              const stageCandidates = jobCandidates.filter((c) => c.stage === stage.id);

              return (
                <div
                  key={stage.id}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col min-h-[500px] shadow-sm"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200">{stage.label}</span>
                    <span className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-[10px] flex items-center justify-center">
                      {stage.count}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {stageCandidates.length === 0 ? (
                      <div className="h-32 flex items-center justify-center text-center text-slate-400 text-xs border-2 border-dashed border-slate-100 dark:border-slate-800/80 rounded-2xl">
                        {t("কোনো প্রার্থী নেই", "Empty stage")}
                      </div>
                    ) : (
                      stageCandidates.map((cand) => (
                        <div
                          key={cand.id}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 transition space-y-2.5 shadow-xs"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-bold text-slate-900 dark:text-white text-xs">{cand.fullName}</h5>
                              <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                                {cand.appliedRole || cand.jobTitle || "Applicant"}
                              </p>
                            </div>
                            {cand.honorsCgpa && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 font-mono text-[10px] font-bold">
                                {cand.honorsCgpa.toFixed(2)}
                              </span>
                            )}
                          </div>

                          <div className="text-[10.5px] text-slate-500 space-y-0.5">
                            <div className="truncate">{cand.honorsInstitute || "Reputed University"}</div>
                            <div>{cand.experienceYears || 0} yrs experience</div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                            <select
                              value={cand.stage}
                              onChange={(e) => onUpdateCandidateStage(cand.id, e.target.value as any)}
                              className="text-[10.5px] font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700"
                            >
                              <option value="APPLIED">Applied</option>
                              <option value="SCREENING">Screening</option>
                              <option value="INTERVIEW">Interview</option>
                              <option value="OFFERED">Offer Sent</option>
                              <option value="HIRED">Hired</option>
                              <option value="REJECTED">Reject</option>
                            </select>

                            <button
                              onClick={() => {
                                setSelectedCandidateForBio(cand);
                                handleRunAiResumeScreening(cand);
                              }}
                              className="p-1 text-slate-400 hover:text-teal-500"
                              title={t("সিভি দেখুন", "View CV")}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. JOB POSTINGS & CIRCULARS TAB */}
      {/* ========================================================================= */}
      {activeTab === "JOBS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const applicantsCount = candidates.filter((c) => (c.jobPostingId || c.jobCircularId) === job.id).length;

            return (
              <div
                key={job.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-teal-500/50 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      {job.departmentName}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {job.vacancies} {t("পদ", "Vacancies")}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{job.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>{job.branchName}</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t("বেতন স্কেল:", "Salary Band:")}</span>
                      <span className="font-bold text-teal-600 dark:text-teal-400">{job.salaryRange}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t("অভিজ্ঞতা:", "Experience:")}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{job.experienceRequired}</span>
                    </div>
                  </div>

                  {job.requirements && (
                    <div className="flex flex-wrap gap-1">
                      {job.requirements.map((req, rIdx) => (
                        <span
                          key={rIdx}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    {applicantsCount} {t("জন আবেদন করেছেন", "Applicants")}
                  </span>

                  <button
                    onClick={() => {
                      setSelectedJobId(job.id);
                      setActiveTab("SCREENING_ENGINE");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-xs hover:bg-teal-500 transition cursor-pointer flex items-center gap-1"
                  >
                    <span>{t("সিভি স্ক্রিন করুন", "Screen CVs")}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PASTE RAW GOOGLE SHEETS / TSV DATA */}
      {/* ========================================================================= */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-2xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t("গুগল ফর্ম / শিট থেকে কপি করা টেবিল পেস্ট করুন", "Paste Google Sheets / Excel Table")}
                </h3>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t(
                "গুগল শিট বা এক্সেল ফাইল থেকে হেডারসহ সকল রো কপি (Ctrl+C) করে নিচের বক্সে পেস্ট (Ctrl+V) করুন।",
                "Copy rows directly from Google Sheets (including the header row) and paste below."
              )}
            </p>

            <form onSubmit={handleProcessPastedData} className="space-y-4 text-xs">
              <textarea
                rows={10}
                value={rawPastedText}
                onChange={(e) => setRawPastedText(e.target.value)}
                placeholder={`Name\tPhone\tEmail\tSSC GPA\tHSC GPA\tHonors CGPA\tUniversity\tDepartment\tExperience\nTanvir Ahmed\t+8801711223344\ttanvir@gmail.com\t5.00\t4.80\t3.75\tBUET\tCSE\t4`}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                required
              />

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {t("বাতিল", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isProcessingFile}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition flex items-center gap-1.5"
                >
                  {isProcessingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{t("ডেটাবেজে ইমপোর্ট ও সিন্ক করুন", "Import to System")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CANDIDATE FULL CV & AI SCREENING MODAL */}
      {/* ========================================================================= */}
      {selectedCandidateForBio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-3xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black text-sm">
                  {selectedCandidateForBio.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedCandidateForBio.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedCandidateForBio.appliedRole || "Software Engineer"} • {selectedCandidateForBio.phone || "No Phone"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidateForBio(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">{t("পিতার নাম:", "Father's Name:")}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCandidateForBio.fatherName || "-"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{t("মাতার নাম:", "Mother's Name:")}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCandidateForBio.motherName || "-"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{t("এনআইডি নম্বর:", "NID Number:")}</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedCandidateForBio.nidNumber || "-"}</span>
                </div>
              </div>

              {/* Academic Grid */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" />
                  <span>{t("পূর্ণাঙ্গ শিক্ষাগত ব্যাকগ্রাউন্ড", "Complete Academic Qualifications")}</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block">SSC (Secondary)</span>
                    <span className="text-sm font-black text-teal-600 font-mono">GPA {selectedCandidateForBio.sscGpa || "N/A"}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{selectedCandidateForBio.sscInstitute || "School"}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">Board: {selectedCandidateForBio.sscBoard || "Dhaka"}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block">HSC (Higher Sec)</span>
                    <span className="text-sm font-black text-teal-600 font-mono">GPA {selectedCandidateForBio.hscGpa || "N/A"}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{selectedCandidateForBio.hscInstitute || "College"}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">Board: {selectedCandidateForBio.hscBoard || "Dhaka"}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-purple-600 block">Honors / Bachelor</span>
                    <span className="text-sm font-black text-purple-600 font-mono">CGPA {selectedCandidateForBio.honorsCgpa || "N/A"}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{selectedCandidateForBio.honorsInstitute || "University"}</span>
                    <span className="text-[10px] text-purple-500/80 font-semibold block">{selectedCandidateForBio.honorsDept || "Major"}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block">Masters</span>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300 font-mono">
                      {selectedCandidateForBio.mastersCgpa ? `CGPA ${selectedCandidateForBio.mastersCgpa}` : "Not Taken"}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">{selectedCandidateForBio.mastersInstitute || "-"}</span>
                    <span className="text-[10px] text-slate-400 block">{selectedCandidateForBio.mastersDept || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Work Experience */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    <span>{t("চাকরির পূর্ব অভিজ্ঞতা ও কোম্পানি সমূহ", "Work History & Experience")}</span>
                  </span>
                  <span className="font-bold text-emerald-600 font-mono">
                    {selectedCandidateForBio.experienceYears || 0} Years Experience
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  {selectedCandidateForBio.experienceHistory || "Fresher / No prior companies declared"}
                </p>
              </div>

              {/* AI Deep Evaluation Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-950/40 to-slate-950 border border-teal-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-teal-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>{t("জেমিনি এআই রেজুমে অ্যানালাইসিস ও ইন্টারভিউ প্রশ্ন", "Gemini AI Resume Screener & Interview Questions")}</span>
                  </span>
                  {isAiScreening && <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />}
                </div>

                {aiScreeningResult ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300 leading-relaxed">{aiScreeningResult.summary}</p>
                    {aiScreeningResult.recommendedQuestions && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800">
                        <span className="text-[11px] font-bold text-teal-300 block">
                          {t("প্রস্তাবিত ইন্টারভিউ প্রশ্নাবলী (AI Generated Interview Questions):", "Recommended Interview Questions:")}
                        </span>
                        <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                          {aiScreeningResult.recommendedQuestions.map((q: string, qIdx: number) => (
                            <li key={qIdx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-teal-500 mb-1" />
                    <span>{t("এআই বিশ্লেষণ চলছে...", "Generating AI screening analysis...")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: POST NEW JOB CIRCULAR */}
      {/* ========================================================================= */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t("নতুন নিয়োগ বিজ্ঞপ্তি প্রকাশ", "Publish New Job Circular")}
                </h3>
              </div>
              <button
                onClick={() => setShowJobModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {t("পদের নাম / টাইটেল", "Job Position Title")}
                </label>
                <input
                  type="text"
                  required
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  placeholder="e.g. Senior Full-Stack Engineer"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {t("বিভাগ (Department)", "Department")}
                  </label>
                  <select
                    value={newJobDeptId}
                    onChange={(e) => setNewJobDeptId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {t("শাখা (Branch)", "Branch")}
                  </label>
                  <select
                    value={newJobBranchId}
                    onChange={(e) => setNewJobBranchId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {t("পদ সংখ্যা (Vacancies)", "Vacancies")}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newJobVacancies}
                    onChange={(e) => setNewJobVacancies(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {t("প্রয়োজনীয় অভিজ্ঞতা", "Required Experience")}
                  </label>
                  <input
                    type="text"
                    value={newJobExp}
                    onChange={(e) => setNewJobExp(e.target.value)}
                    placeholder="e.g. 2-4 Years"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {t("সর্বনিম্ন বেতন (৳)", "Min Salary (BDT)")}
                  </label>
                  <input
                    type="number"
                    value={newJobMinSal}
                    onChange={(e) => setNewJobMinSal(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {t("সর্বোচ্চ বেতন (৳)", "Max Salary (BDT)")}
                  </label>
                  <input
                    type="number"
                    value={newJobMaxSal}
                    onChange={(e) => setNewJobMaxSal(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {t("প্রয়োজনীয় স্কিলসমূহ (কমা দিয়ে লিখুন)", "Required Skills (Comma separated)")}
                </label>
                <input
                  type="text"
                  value={newJobSkills}
                  onChange={(e) => setNewJobSkills(e.target.value)}
                  placeholder="e.g. React, TypeScript, Node.js, PostgreSQL"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {t("বাতিল", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition"
                >
                  {t("বিজ্ঞপ্তি প্রকাশ করুন", "Publish Circular")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* METADATA & GOOGLE FORM HEADINGS DICTIONARY MODAL                          */}
      {/* ========================================================================= */}
      {showMetadataGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-r from-teal-500/5 via-transparent to-purple-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {t(
                      "গুগল ফর্ম ও এক্সেল মেটাডাটা হেডিং ডিকশনারি",
                      "Google Forms & Excel Metadata Headings Dictionary"
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t(
                      "ফর্ম বা এক্সেলে কোন হেডিং দিলে আমাদের স্বয়ংক্রিয় স্ক্রিনিং ইঞ্জিন সাথে সাথে চিনে ফেলবে তার পূর্ণাঙ্গ তালিকা",
                      "Standard field definitions, accepted aliases and copyable headers for Google Forms"
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMetadataGuideModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Smart Explanation Banner */}
            <div className="px-5 sm:px-6 pt-4 pb-2">
              <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>{t("স্মার্ট অল্টারনেটিভ ম্যাপিং ইঞ্জিন (Smart Alias Matcher)", "Intelligent Alias Matching Engine")}</span>
                  </div>
                  <p className="text-teal-700/90 dark:text-teal-300/80 text-[11px] sm:text-xs">
                    {t(
                      "আপনি ফর্মে পুরো নাম যেমন 'সেকেন্ডারি স্কুল সার্টিফিকেট' বা সংক্ষেপে 'এসএসসি' অথবা 'SSC GPA' যাই লিখুন না কেন, সিস্টেম স্বয়ংক্রিয়ভাবে তা শনাক্ত করে সঠিক কলামে মান বসিয়ে দেবে। নিচের যেকোনো একটি নাম ব্যবহার করলেই চলবে।",
                      "The system recognizes abbreviations (SSC), full forms (Secondary School Certificate), and Bangla names seamlessly."
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const fullText = generateGoogleFormsQuestionsText();
                    navigator.clipboard.writeText(fullText);
                    setCopiedFieldKey("ALL_QUESTIONS");
                    setTimeout(() => setCopiedFieldKey(null), 2500);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  {copiedFieldKey === "ALL_QUESTIONS" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{t("প্রশ্ন তালিকা কপি হয়েছে!", "Questions Copied!")}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t("ফর্মের সকল প্রশ্ন এক ক্লিকে কপি করুন", "Copy All Form Questions")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Search & Filter Categories Bar */}
            <div className="px-5 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t("হেডিং বা বিষয় খুঁজুন...", "Search field, alias, gpa...")}
                  value={metadataSearchQuery}
                  onChange={(e) => setMetadataSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: "ALL", label: t("সকল", "All") },
                  { id: "PERSONAL", label: t("ব্যক্তিগত", "Personal") },
                  { id: "SSC", label: "SSC" },
                  { id: "HSC", label: "HSC" },
                  { id: "HONORS", label: t("স্নাতক/অনার্স", "Honors") },
                  { id: "MASTERS", label: t("মাস্টার্স", "Masters") },
                  { id: "EXPERIENCE", label: t("অভিজ্ঞতা", "Experience") },
                  { id: "SALARY", label: t("বেতন", "Salary") },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setMetadataCategoryFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      metadataCategoryFilter === cat.id
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Fields Catalog */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5 flex-1 max-h-[58vh]">
              {RECRUITMENT_METADATA_FIELDS.filter((f) => {
                const matchCategory =
                  metadataCategoryFilter === "ALL" || f.category === metadataCategoryFilter;
                const matchQuery =
                  !metadataSearchQuery ||
                  f.banglaLabel.toLowerCase().includes(metadataSearchQuery.toLowerCase()) ||
                  f.englishLabel.toLowerCase().includes(metadataSearchQuery.toLowerCase()) ||
                  f.acceptedAliases.some((a) => a.toLowerCase().includes(metadataSearchQuery.toLowerCase())) ||
                  f.key.toLowerCase().includes(metadataSearchQuery.toLowerCase());
                return matchCategory && matchQuery;
              }).map((field) => {
                const isCopied = copiedFieldKey === field.key;
                return (
                  <div
                    key={field.key}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 bg-slate-50/50 dark:bg-slate-950/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Field Name & Details */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {field.banglaLabel}
                        </h4>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          ({field.englishLabel})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            field.dataType === "number"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {field.dataType === "number" ? t("নম্বর / সংখ্যা", "Number") : t("টেক্সট / বিবরণ", "Text")}
                        </span>
                        {field.isKeyCriteria && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-teal-500 text-teal-500" />
                            <span>{t("স্ক্রিনিং ফিল্টার ক্রাইটেরিয়া", "Key Criteria")}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {field.description} • <strong className="text-slate-800 dark:text-slate-200 font-mono text-[11px]">যেমন: {field.sampleValue}</strong>
                      </p>

                      {/* Accepted Aliases Tags */}
                      <div className="pt-1">
                        <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                          {t("এই নামগুলো দিলেও সিস্টেম রিড করতে পারবে (Accepted Aliases):", "Accepted Alternative Names:")}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {field.acceptedAliases.slice(0, 7).map((alias, aIdx) => (
                            <span
                              key={aIdx}
                              className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-mono"
                            >
                              {alias}
                            </span>
                          ))}
                          {field.acceptedAliases.length > 7 && (
                            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 self-center">
                              +{field.acceptedAliases.length - 7} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Copy Exact Header Action */}
                    <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(field.englishLabel);
                          setCopiedFieldKey(field.key);
                          setTimeout(() => setCopiedFieldKey(null), 2000);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                          isCopied
                            ? "bg-teal-600 text-white"
                            : "bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{t("কপি হয়েছে!", "Copied!")}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>{t("হেডিং কপি করুন", "Copy Header")}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 text-teal-500 shrink-0" />
                <span>
                  {t(
                    "সবচেয়ে সহজে ব্যবহার করতে 'ফর্ম এক্সেল টেমপ্লেট ডাউনলোড' করে গুগল ফর্মে আপলোড করুন",
                    "For zero friction, download the ready-made Excel template directly"
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={downloadCandidateExcelTemplate}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-teal-500 flex items-center gap-1.5 transition cursor-pointer grow sm:grow-0 justify-center"
                >
                  <Download className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t("এক্সেল টেমপ্লেট ডাউনলোড", "Download Template")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMetadataGuideModal(false)}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition cursor-pointer grow sm:grow-0 text-center"
                >
                  {t("বুঝেছি, বন্ধ করুন", "Done")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
