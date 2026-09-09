import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Bell,
  MessageSquare,
  Send,
  Plus,
  Pin,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  Paperclip,
  X,
  FileText,
  Printer,
  Eye,
  Upload,
  Trash2,
  Filter,
  ShieldCheck,
  AlertTriangle,
  FolderKanban,
  UserCheck,
  Tag,
  PenTool,
  Clock,
  Search,
  Languages,
  CheckSquare,
  Square,
  Save,
  Check,
  Users,
  Hash,
  AtSign,
  MessageCircle,
  UserPlus,
  Smile,
  Image as ImageIcon,
  MoreVertical,
  CheckCheck,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  User,
  Shield,
  Briefcase,
  ExternalLink,
  Edit3,
  Pencil,
} from "lucide-react";
import { Notice, ChatMessage, Employee, Branch, Project } from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { useCompanyBranding } from "../../context/CompanyBrandingContext";
import { NoticeA4LetterheadModal, formatBanglaDate, toBanglaDigits } from "./NoticeA4LetterheadModal";

export interface CustomGroup {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

interface NoticesChatViewProps {
  notices: Notice[];
  chatMessages: ChatMessage[];
  currentEmployee: Employee;
  branches: Branch[];
  employees?: Employee[];
  projects?: Project[];
  onAddNotice: (notice: Notice) => void;
  onUpdateNotice?: (notice: Notice) => void;
  onDeleteNotice?: (noticeId: string) => void;
  onSendMessage: (msg: ChatMessage) => void;
}

export const NoticesChatView: React.FC<NoticesChatViewProps> = ({
  notices,
  chatMessages,
  currentEmployee,
  branches,
  employees = [],
  projects = [
    {
      id: "proj-01",
      code: "PRJ-FINTECH-01",
      name: "Fintech Core Banking Architecture Migration",
      description: "Cloud-native microservices infrastructure for digital payments and core ledger.",
      branchId: "branch-01",
      branchName: "Head Office (Gulshan Corporate Hub)",
      managerId: "emp-03",
      managerName: "Tariqul Hasan",
      status: "IN_PROGRESS",
      priority: "HIGH",
      startDate: "2026-06-01",
      deadline: "2026-11-30",
      budget: 8500000,
      spentBudget: 3400000,
      progressPercentage: 58,
      teamMemberIds: ["emp-03", "emp-05"],
      totalTasks: 24,
      completedTasks: 14,
    },
    {
      id: "proj-02",
      code: "PRJ-CTG-DC-02",
      name: "Chittagong Regional Cloud Data Center Migration",
      description: "Disaster recovery data center and distributed edge servers deployment in CTG.",
      branchId: "branch-02",
      branchName: "Chittagong Regional Technology Center",
      managerId: "emp-06",
      managerName: "Rafiqul Islam",
      status: "IN_PROGRESS",
      priority: "HIGH",
      startDate: "2026-07-15",
      deadline: "2026-12-15",
      budget: 5200000,
      spentBudget: 2100000,
      progressPercentage: 42,
      teamMemberIds: ["emp-06", "emp-07"],
      totalTasks: 18,
      completedTasks: 8,
    },
  ],
  onAddNotice,
  onUpdateNotice,
  onDeleteNotice,
  onSendMessage,
}) => {
  const { t, isBangla, theme } = useThemeLanguage();
  const { branding, softwareBranding, getCompanyDisplayName, getCompanyAddress } = useCompanyBranding();

  const [activeTab, setActiveTab] = useState<"NOTICES" | "CHAT">("NOTICES");
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [selectedNoticeForA4, setSelectedNoticeForA4] = useState<Notice | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterScope, setFilterScope] = useState<"ALL" | "ELIGIBLE" | "BRANCH" | "PROJECT" | string>("ELIGIBLE");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterLang, setFilterLang] = useState<"ALL" | "bn" | "en">("ALL");

  // Form State for Creating Notice
  const [noticeLanguage, setNoticeLanguage] = useState<"bn" | "en">(isBangla ? "bn" : "en");
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newMemoNumber, setNewMemoNumber] = useState("");
  const [newCategory, setNewCategory] = useState<string>("GENERAL");
  const [newPriority, setNewPriority] = useState<Notice["priority"]>("NORMAL");
  const [newContent, setNewContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  // Multi-Targeting Form State (Crucial User Requirement: Multi-select branches/projects)
  const [targetScope, setTargetScope] = useState<"ALL_BRANCHES" | "SPECIFIC_BRANCH" | "SPECIFIC_PROJECT">("ALL_BRANCHES");
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState("");

  // Signatory & Issuer Form State
  const [issuerName, setIssuerName] = useState(currentEmployee.fullName);
  const [issuerDesignation, setIssuerDesignation] = useState(currentEmployee.designationTitle || "ব্যবস্থাপনা পরিচালক / শাখা প্রধান");
  const [issuerDepartment, setIssuerDepartment] = useState(currentEmployee.departmentName || "প্রশাসন ও মানবসম্পদ বিভাগ");
  const [issuerBranch, setIssuerBranch] = useState(currentEmployee.branchName || "প্রধান কার্যালয় (গুলশান)");
  const [issuerOrganization, setIssuerOrganization] = useState(branding.companyName || "Apex Global Technologies Ltd.");
  const [signatureImage, setSignatureImage] = useState<string>("");
  const [hasSavedProfile, setHasSavedProfile] = useState(false);
  const [saveProfileSuccess, setSaveProfileSuccess] = useState(false);

  // Edit Notice State
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [showEditNoticeModal, setShowEditNoticeModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editMemoNumber, setEditMemoNumber] = useState("");
  const [editCategory, setEditCategory] = useState<string>("GENERAL");
  const [editPriority, setEditPriority] = useState<Notice["priority"]>("NORMAL");
  const [editContent, setEditContent] = useState("");
  const [editLanguage, setEditLanguage] = useState<"bn" | "en">("bn");
  const [editIsPinned, setEditIsPinned] = useState(false);
  const [editTargetScope, setEditTargetScope] = useState<"ALL_BRANCHES" | "SPECIFIC_BRANCH" | "SPECIFIC_PROJECT">("ALL_BRANCHES");
  const [editSelectedBranchIds, setEditSelectedBranchIds] = useState<string[]>([]);
  const [editSelectedProjectIds, setEditSelectedProjectIds] = useState<string[]>([]);
  const [editTargetAudience, setEditTargetAudience] = useState("");
  const [editIssuerName, setEditIssuerName] = useState("");
  const [editIssuerDesignation, setEditIssuerDesignation] = useState("");
  const [editIssuerDepartment, setEditIssuerDepartment] = useState("");
  const [editIssuerBranch, setEditIssuerBranch] = useState("");
  const [editIssuerOrganization, setEditIssuerOrganization] = useState("");
  const [editSignatureImage, setEditSignatureImage] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Chat Multi-Channel & Direct Messaging State
  const [activeChatType, setActiveChatType] = useState<"CHANNEL" | "DEPARTMENT" | "PROJECT" | "GROUP" | "DIRECT">("CHANNEL");
  const [activeChatId, setActiveChatId] = useState<string>("general-announcements");
  const [chatSearch, setChatSearch] = useState("");
  const [chatAttachmentName, setChatAttachmentName] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupMemberIds, setNewGroupMemberIds] = useState<string[]>([]);
  const [activeCollapsedSections, setActiveCollapsedSections] = useState<Record<string, boolean>>({});

  const [customGroups, setCustomGroups] = useState<CustomGroup[]>([
    {
      id: "grp-dev-leads",
      name: "Engineering & Architecture Guild",
      description: "Sprint architectural reviews, codebase migrations and incident postmortems",
      memberIds: ["emp-01", "emp-02", "emp-03", "emp-06"],
      createdBy: "emp-01",
      createdByName: "Sultan Mahmud",
      createdAt: "2026-08-15",
    },
    {
      id: "grp-safety",
      name: "Workplace Emergency & Safety Squad",
      description: "Branch safety committee, emergency drills and health protocol coordination",
      memberIds: ["emp-01", "emp-04", "emp-05"],
      createdBy: "emp-01",
      createdByName: "Sultan Mahmud",
      createdAt: "2026-08-20",
    },
    {
      id: "grp-ops-expansion",
      name: "Chittagong & Sylhet Regional Expansion",
      description: "Multi-branch facility leasing, hardware setup and regional onboarding",
      memberIds: ["emp-01", "emp-06", "emp-07"],
      createdBy: "emp-01",
      createdByName: "Sultan Mahmud",
      createdAt: "2026-08-25",
    },
  ]);

  // Role Checks
  const isSuperAdmin = currentEmployee.role === "SUPER_ADMIN" || currentEmployee.role === "HR_MANAGER" || currentEmployee.role === "CEO";
  const isBranchManager = currentEmployee.role === "BRANCH_MANAGER" || currentEmployee.role === "DEPARTMENT_HEAD";

  // Load saved profile & signature from localStorage on mount or when currentEmployee changes
  useEffect(() => {
    try {
      const sigKey = `workflow_hr_saved_signature_${currentEmployee.id}`;
      const nameKey = `workflow_hr_signatory_name_${currentEmployee.id}`;
      const desigKey = `workflow_hr_signatory_desig_${currentEmployee.id}`;
      const deptKey = `workflow_hr_signatory_dept_${currentEmployee.id}`;
      const branchKey = `workflow_hr_signatory_branch_${currentEmployee.id}`;
      const orgKey = `workflow_hr_signatory_org_${currentEmployee.id}`;

      const savedSig = localStorage.getItem(sigKey);
      const savedName = localStorage.getItem(nameKey);
      const savedDesig = localStorage.getItem(desigKey);
      const savedDept = localStorage.getItem(deptKey);
      const savedBranch = localStorage.getItem(branchKey);
      const savedOrg = localStorage.getItem(orgKey);

      if (savedSig) {
        setSignatureImage(savedSig);
        setHasSavedProfile(true);
      } else {
        setSignatureImage("");
      }

      setIssuerName(savedName || currentEmployee.fullName);
      setIssuerDesignation(
        savedDesig ||
          currentEmployee.designationTitle ||
          (isSuperAdmin ? (noticeLanguage === "bn" ? "প্রধান নির্বাহী কর্মকর্তা (CEO)" : "Chief Executive Officer (CEO)") : (noticeLanguage === "bn" ? "শাখা প্রধান (Branch Manager)" : "Branch Manager"))
      );
      setIssuerDepartment(savedDept || currentEmployee.departmentName || (noticeLanguage === "bn" ? "মানবসম্পদ ও প্রশাসন বিভাগ" : "HR & Admin Directorate"));
      setIssuerBranch(savedBranch || currentEmployee.branchName || (noticeLanguage === "bn" ? "প্রধান কার্যালয়" : "Corporate Headquarters"));
      setIssuerOrganization(savedOrg || (noticeLanguage === "bn" ? (branding.companyNameBn || branding.companyName) : branding.companyName));

      // Auto generate memo number
      const memoPrefix = isSuperAdmin
        ? "WFHR/HQ"
        : `WFHR/${currentEmployee.branchName ? currentEmployee.branchName.substring(0, 3).toUpperCase() : "BR"}`;
      const randomSeq = Math.floor(100 + Math.random() * 900);
      setNewMemoNumber(`${memoPrefix}/2026/09-${randomSeq}`);

      // If Branch Manager, lock scope default to their branch
      if (isBranchManager && !isSuperAdmin) {
        setTargetScope("SPECIFIC_BRANCH");
        setSelectedBranchIds([currentEmployee.branchId]);
      } else {
        setSelectedBranchIds(branches.map((b) => b.id));
      }
    } catch (e) {
      console.warn("Error accessing localStorage for profile/signature", e);
    }
  }, [currentEmployee.id, currentEmployee.role, noticeLanguage, branding.companyName]);

  // Save current signatory info to profile permanently
  const handleSaveSignatoryProfile = () => {
    try {
      const sigKey = `workflow_hr_saved_signature_${currentEmployee.id}`;
      const nameKey = `workflow_hr_signatory_name_${currentEmployee.id}`;
      const desigKey = `workflow_hr_signatory_desig_${currentEmployee.id}`;
      const deptKey = `workflow_hr_signatory_dept_${currentEmployee.id}`;
      const branchKey = `workflow_hr_signatory_branch_${currentEmployee.id}`;
      const orgKey = `workflow_hr_signatory_org_${currentEmployee.id}`;

      if (signatureImage) localStorage.setItem(sigKey, signatureImage);
      localStorage.setItem(nameKey, issuerName);
      localStorage.setItem(desigKey, issuerDesignation);
      localStorage.setItem(deptKey, issuerDepartment);
      localStorage.setItem(branchKey, issuerBranch);
      localStorage.setItem(orgKey, issuerOrganization);

      setHasSavedProfile(true);
      setSaveProfileSuccess(true);
      setTimeout(() => setSaveProfileSuccess(false), 3000);
    } catch (err) {
      console.warn("Failed saving signatory profile", err);
    }
  };

  // Handle signature upload (PNG, JPG, WebP)
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/image\/(png|jpeg|jpg|webp)/i)) {
        alert(t("দয়া করে পিএনজি, জেপিজি অথবা ওয়েবপি (PNG, JPG, WebP) ফাইল আপলোড করুন।", "Please upload a PNG, JPG, or WebP image."));
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Data = uploadEvent.target?.result as string;
        setSignatureImage(base64Data);
        // Persist to localStorage permanently
        try {
          const storageKey = `workflow_hr_saved_signature_${currentEmployee.id}`;
          localStorage.setItem(storageKey, base64Data);
          setHasSavedProfile(true);
        } catch (err) {
          console.warn("Failed saving signature to localStorage", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearSignature = () => {
    setSignatureImage("");
    try {
      const storageKey = `workflow_hr_saved_signature_${currentEmployee.id}`;
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.warn("Failed removing signature from localStorage", err);
    }
  };

  // Toggle Branch Checkbox for multi-select
  const handleToggleBranch = (branchId: string) => {
    setSelectedBranchIds((prev) => {
      const next = prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId];
      // Update targetAudience preview
      if (next.length === branches.length) {
        setTargetAudience(
          noticeLanguage === "bn"
            ? "সকল আঞ্চলিক শাখা ও বিভাগের সম্মানিত কর্মকর্তা-কর্মচারীবৃন্দ"
            : "All Staff Across All Branches & Divisions"
        );
      } else if (next.length > 0) {
        const names = branches.filter((b) => next.includes(b.id)).map((b) => b.name.split(" ")[0]);
        setTargetAudience(
          noticeLanguage === "bn"
            ? `${names.join(", ")} শাখার সকল কর্মকর্তা ও কর্মচারীবৃন্দ`
            : `All Staff Across ${names.join(", ")} Branches`
        );
      }
      return next;
    });
  };

  // Toggle Project Checkbox for multi-select
  const handleToggleProject = (projectId: string) => {
    setSelectedProjectIds((prev) => {
      const next = prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId];
      if (next.length > 0) {
        const pNames = projects.filter((p) => next.includes(p.id)).map((p) => p.name);
        setTargetAudience(
          noticeLanguage === "bn"
            ? `প্রজেক্ট টিম: ${pNames.join(", ")}`
            : `Project Teams: ${pNames.join(", ")}`
        );
      }
      return next;
    });
  };

  // Quick Templates Selector (Fully Multi-Language Adaptive)
  const handleApplyTemplate = (templateType: string) => {
    const isBn = noticeLanguage === "bn";

    if (templateType === "HOLIDAY_EID") {
      setNewTitle(isBn ? "পবিত্র উৎসব উপলক্ষে অফিস ছুটি ও অগ্রিম বোনাস সংক্রান্ত বিজ্ঞপ্তি" : "Festival Office Holiday Schedule & Advance Bonus Disbursement");
      setNewSubject(isBn ? "উৎসবকালীন সার্বিক ছুটি এবং আগস্ট মাসের পূর্ণাঙ্গ বেতন ও বোনাস বিতরণ সংক্রান্ত" : "Notice regarding office holiday schedule, salary & festival bonus clearance");
      setNewCategory("HOLIDAY");
      setNewPriority("NORMAL");
      setTargetAudience(isBn ? "সকল শাখা ও বিভাগের সম্মানিত কর্মকর্তা-কর্মচারীবৃন্দ" : "All Officers & Staff Across All Branches & Divisions");
      setNewContent(
        isBn
          ? `সকল সম্মানিত কর্মকর্তা ও কর্মচারীদের সদয় অবগতির জন্য জানানো যাচ্ছে যে, পবিত্র উৎসব উপলক্ষে আগামী ০৪ সেপ্টেম্বর হতে ০৮ সেপ্টেম্বর ২০২৬ পর্যন্ত প্রতিষ্ঠানের সকল শাখা ও অফিসের দাপ্তরিক কার্যক্রম বন্ধ থাকবে।\n\nউক্ত উৎসব উপলক্ষে সকল কর্মকর্তা ও কর্মচারীর আগস্ট ২০২৬ মাসের মূল বেতন, চিকিৎসা ও বাড়িভাড়া ভাতা এবং বাৎসরিক উৎসব বোনাস ইতিমধ্যে স্ব-স্ব ব্যাংক অ্যাকাউন্ট ও ডিজিটাল ওয়ালেটে সফলভাবে ট্রান্সফার করা হয়েছে। জরুরি কাস্টমার সাপোর্ট ও সার্ভার মনিটরিং টিম শিফট অনুযায়ী রোটেশনাল দায়িত্বে নিয়োজিত থাকবেন।\n\nসকলকে পরিবারের সাথে সুন্দর ও নিরাপদ ছুটির শুভেচ্ছা।`
          : `This is to inform all respected officers and employees that all branch offices and corporate centers will remain closed from September 4 to September 8, 2026, on the occasion of the holy festival.\n\nIn commemoration of the festival, full monthly salary, allowances, and annual festival bonuses have been successfully credited to respective bank accounts and mobile wallets. Emergency server monitoring and customer support teams will continue rotational shifts as scheduled.\n\nWishing everyone a joyous and safe holiday with family.`
      );
    } else if (templateType === "EMERGENCY_WEATHER") {
      setNewTitle(isBn ? "জরুরি আবহাওয়া সতর্কতা ও ফ্লেক্সিবল ওয়ার্ক আওয়ার্স প্রদান" : "Emergency Weather Advisory & Flexible Remote Work Policy");
      setNewSubject(isBn ? "দুর্যোগপূর্ণ আবহাওয়ার কারণে কর্মীদের সুরক্ষা ও ওয়ার্ক-ফ্রম-হোম (WFH) অনুমোদন" : "Work-from-Home authorization & safety measures due to inclement weather");
      setNewCategory("EMERGENCY");
      setNewPriority("URGENT");
      setTargetAudience(isBn ? "আঞ্চলিক শাখার সকল কর্মকর্তা-কর্মচারী" : "All Regional Branch Team Members");
      setNewContent(
        isBn
          ? `আবহাওয়া অধিদপ্তরের বিশেষ সতর্কতা বিজ্ঞপ্তি অনুযায়ী অত্র অঞ্চলে ভারী বর্ষণ ও জলাবদ্ধতার আশঙ্কা দেখা দেওয়ায় সকল কর্মীর জীবনের নিরাপত্তা ও স্বাস্থ্য সুরক্ষায় আগামী ৪৮ ঘণ্টার জন্য শিফট সময়সূচি নমনীয় করা হলো।\n\nপ্রয়োজনীয় ক্ষেত্রে কর্মীরা বাসা থেকে কাজ (Work From Home) সম্পন্ন করতে পারবেন এবং প্রজেক্টের জরুরি কাজে অনলাইনে সংযুক্ত থাকবেন। যেকোনো জরুরি প্রয়োজনে ব্রাঞ্চ ম্যানেজারের সাথে তাৎক্ষণিক যোগাযোগের অনুরোধ করা হলো।`
          : `In light of the heavy rainfall and waterlogging advisory issued by the Meteorological Department, flexible work timings and Work-From-Home (WFH) permissions are approved for the next 48 hours to prioritize staff safety.\n\nEmployees are advised to coordinate tasks remotely and remain available online. In case of emergency, please reach out directly to your Branch Manager.`
      );
    } else if (templateType === "FACE_ATTENDANCE") {
      setNewTitle(isBn ? "লাইভ ফেস ও জিওফেন্স বায়োমেট্রিক উপস্থিতি বাস্তবায়ন নির্দেশিকা" : "Mandatory Live Face & Geofenced Attendance Policy");
      setNewSubject(isBn ? "সকল শাখা ও প্রজেক্টে স্মার্ট ক্যামেরা ও লোকেশন ভেরিফিকেশন উপস্থিতি সংক্রান্ত" : "Mandatory live camera anti-spoofing and GPS geofenced clock-in directives");
      setNewCategory("OFFICE_TIME");
      setNewPriority("CRITICAL");
      setTargetAudience(isBn ? "সকল কর্মকর্তা ও কর্মচারী" : "All Staff Across All Offices");
      setNewContent(
        isBn
          ? `সকল কর্মকর্তা ও কর্মচারীদের জানানো যাচ্ছে যে, প্রতিষ্ঠানের সেন্ট্রাল এইচআর নীতিমালার অংশ হিসেবে আগামী ০১ সেপ্টেম্বর হতে স্মার্ট উপস্থিতি সিস্টেমে লাইভ ফেস ডিটেকশন ও জিওফেন্স পেরিমিটার বাধ্যতামূলক করা হলো।\n\nপ্রত্যেক কর্মীকে নির্ধারিত শিফট সময়ে নিজ নিজ ব্রাঞ্চের অনুমোদিত এরিয়ার মধ্যে অবস্থান করে পোর্টালে ক্যামেরা অন করে উপস্থিতি নিশ্চিত করতে হবে। কোনো প্রকার প্রক্সি বা ম্যানুয়াল উপস্থিতি গ্রহণযোগ্য হবে না।`
          : `All employees are hereby notified that starting September 1, 2026, live facial anti-spoofing verification and branch GPS geofencing will be strictly enforced for daily check-in.\n\nStaff must clock-in within their designated branch boundaries using the Workflow HR camera scan. Manual proxy attendance will not be permitted under any circumstances.`
      );
    } else if (templateType === "PROJECT_SYNC") {
      setNewTitle(isBn ? "প্রজেক্ট অগ্রগতি পর্যালোচনা ও স্প্রিন্ট অডিট সভা" : "Project Milestone Review & Sprint Audit Meeting");
      setNewSubject(isBn ? "চলতি ত্রৈমাসিক প্রজেক্ট ডেলিভারি ও কোয়ালিটি অ্যাসিউরেন্স সভা সংক্রান্ত" : "Quarterly sprint audit and release readiness meeting");
      setNewCategory("POLICY");
      setNewPriority("HIGH");
      setTargetAudience(isBn ? "প্রজেক্টের সকল ইঞ্জিনিয়ার ও টিম লিডারবৃন্দ" : "All Engineers & Project Team Leads");
      setNewContent(
        isBn
          ? `সংশ্লিষ্ট প্রজেক্টের সকল সফটওয়্যার ইঞ্জিনিয়ার, ডিজাইনার এবং কিউএ টিমের সদস্যদের জানানো যাচ্ছে যে, আগামী বৃহস্পতিবার দুপুর ০৩:০০ ঘটিকায় কনফারেন্স রুমে ত্রৈমাসিক অগ্রগতি ও টাস্ক ডেলিভারি পর্যালোচনা সভা অনুষ্ঠিত হবে।\n\nউক্ত সভায় সকল টিম লিডকে তাদের প্রজেক্ট কানবান বোর্ড, লগড আওয়ার্স ও পেন্ডিং মাইলস্টোন রিপোর্টসহ যথাসময়ে উপস্থিত থাকার নির্দেশ দেওয়া হলো।`
          : `All software engineers, designers, and QA members associated with the project are requested to attend the quarterly sprint review meeting this Thursday at 3:00 PM in the Main Conference Room.\n\nTeam leads must present their updated Kanban milestone status and logged hours reports during the session.`
      );
    }
  };

  // Handle Edit Notice Trigger
  const handleStartEditNotice = (notice: Notice) => {
    setEditingNotice(notice);
    setEditTitle(notice.title || "");
    setEditSubject(notice.subject || notice.title || "");
    setEditMemoNumber(notice.memoNumber || "");
    setEditCategory(notice.category || "GENERAL");
    setEditPriority(notice.priority || "NORMAL");
    setEditContent(notice.content || "");
    setEditLanguage((notice.language as any) || "bn");
    setEditIsPinned(Boolean(notice.isPinned));
    setEditTargetScope(notice.targetScope || (notice.targetBranchId && notice.targetBranchId !== "ALL" ? "SPECIFIC_BRANCH" : "ALL_BRANCHES"));
    setEditSelectedBranchIds(notice.targetBranchIds || (notice.targetBranchId && notice.targetBranchId !== "ALL" ? [notice.targetBranchId] : []));
    setEditSelectedProjectIds(notice.targetProjectIds || (notice.targetProjectId && notice.targetProjectId !== "ALL" ? [notice.targetProjectId] : []));
    setEditTargetAudience(notice.targetAudience || "");
    setEditIssuerName(notice.issuerName || notice.authorName || currentEmployee.fullName);
    setEditIssuerDesignation(notice.issuerDesignation || currentEmployee.designationTitle || "");
    setEditIssuerDepartment(notice.issuerDepartment || currentEmployee.departmentName || "");
    setEditIssuerBranch(notice.issuerBranch || currentEmployee.branchName || "");
    setEditIssuerOrganization(notice.issuerOrganization || branding.companyName || "");
    setEditSignatureImage(notice.signatureImageUrl || "");
    setShowEditNoticeModal(true);
  };

  const handleSaveEditedNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice || !onUpdateNotice) return;
    if (!editTitle.trim() || !editContent.trim()) {
      alert(t("দয়া করে শিরোনাম ও নোটিশের বিবরণ পূরণ করুন।", "Please provide a title and notice content."));
      return;
    }

    const selectedBranchNames = branches
      .filter((b) => editSelectedBranchIds.includes(b.id))
      .map((b) => b.name);

    const selectedProjectNames = projects
      .filter((p) => editSelectedProjectIds.includes(p.id))
      .map((p) => p.name);

    const defaultAudience =
      editTargetScope === "ALL_BRANCHES" || editSelectedBranchIds.length === branches.length
        ? (editLanguage === "bn" ? "সকল শাখা ও বিভাগের সম্মানিত কর্মকর্তা-কর্মচারীবৃন্দ" : "All Staff Across All Branches & Divisions")
        : editTargetScope === "SPECIFIC_BRANCH"
        ? (editLanguage === "bn" ? `${selectedBranchNames.join(", ")} শাখার সকল কর্মকর্তা-কর্মচারী` : `All Staff of ${selectedBranchNames.join(", ")}`)
        : (editLanguage === "bn" ? `প্রজেক্ট: ${selectedProjectNames.join(", ")}` : `Projects: ${selectedProjectNames.join(", ")}`);

    const updated: Notice = {
      ...editingNotice,
      memoNumber: editMemoNumber || editingNotice.memoNumber,
      title: editTitle.trim(),
      subject: editSubject.trim() || editTitle.trim(),
      category: editCategory,
      priority: editPriority,
      content: editContent.trim(),
      language: editLanguage,
      targetAudience: editTargetAudience || defaultAudience,
      targetScope: editTargetScope,
      targetBranchIds: editTargetScope === "ALL_BRANCHES" ? branches.map((b) => b.id) : editSelectedBranchIds,
      targetBranchNames: editTargetScope === "ALL_BRANCHES" ? [t("সকল শাখা", "All Branches")] : selectedBranchNames,
      targetBranchId: editSelectedBranchIds[0] || "ALL",
      targetBranchName: selectedBranchNames.join(", ") || t("সকল শাখা", "All Branches"),
      targetProjectIds: editSelectedProjectIds,
      targetProjectNames: selectedProjectNames,
      targetProjectId: editSelectedProjectIds[0] || "ALL",
      targetProjectName: selectedProjectNames.join(", ") || t("সকল প্রজেক্ট", "All Projects"),
      issuerName: editIssuerName,
      issuerDesignation: editIssuerDesignation,
      issuerDepartment: editIssuerDepartment,
      issuerBranch: editIssuerBranch,
      issuerOrganization: editIssuerOrganization,
      signatureImageUrl: editSignatureImage || undefined,
      isPinned: editIsPinned,
    };

    onUpdateNotice(updated);
    setShowEditNoticeModal(false);
    setEditingNotice(null);
  };

  // Submit Notice
  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert(t("দয়া করে শিরোনাম ও নোটিশের বিবরণ পূরণ করুন।", "Please provide a title and notice content."));
      return;
    }

    const selectedBranchNames = branches
      .filter((b) => selectedBranchIds.includes(b.id))
      .map((b) => b.name);

    const selectedProjectNames = projects
      .filter((p) => selectedProjectIds.includes(p.id))
      .map((p) => p.name);

    const defaultAudience =
      targetScope === "ALL_BRANCHES" || selectedBranchIds.length === branches.length
        ? (noticeLanguage === "bn" ? "সকল শাখা ও বিভাগের সম্মানিত কর্মকর্তা-কর্মচারীবৃন্দ" : "All Staff Across All Branches & Divisions")
        : targetScope === "SPECIFIC_BRANCH"
        ? (noticeLanguage === "bn" ? `${selectedBranchNames.join(", ")} শাখার সকল কর্মকর্তা-কর্মচারী` : `All Staff of ${selectedBranchNames.join(", ")}`)
        : (noticeLanguage === "bn" ? `প্রজেক্ট: ${selectedProjectNames.join(", ")}` : `Projects: ${selectedProjectNames.join(", ")}`);

    const notice: Notice = {
      id: `not-${Date.now()}`,
      memoNumber: newMemoNumber || `WFHR/HQ/2026/09-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle,
      subject: newSubject || newTitle,
      category: newCategory,
      priority: newPriority,
      content: newContent,
      language: noticeLanguage,
      publishedDate: new Date().toISOString().split("T")[0],
      publishedBy: `${issuerName} (${issuerDesignation})`,
      authorName: currentEmployee.fullName,
      authorRole: currentEmployee.role,

      targetAudience: targetAudience || defaultAudience,
      targetScope: targetScope,
      targetBranchIds: targetScope === "ALL_BRANCHES" ? branches.map((b) => b.id) : selectedBranchIds,
      targetBranchNames: targetScope === "ALL_BRANCHES" ? [t("সকল শাখা", "All Branches")] : selectedBranchNames,
      targetBranchId: selectedBranchIds[0] || "ALL",
      targetBranchName: selectedBranchNames.join(", ") || t("সকল শাখা", "All Branches"),
      targetProjectIds: selectedProjectIds,
      targetProjectNames: selectedProjectNames,
      targetProjectId: selectedProjectIds[0] || "ALL",
      targetProjectName: selectedProjectNames.join(", ") || t("সকল প্রজেক্ট", "All Projects"),

      issuerName: issuerName || currentEmployee.fullName,
      issuerDesignation: issuerDesignation,
      issuerDepartment: issuerDepartment,
      issuerBranch: issuerBranch,
      issuerOrganization: issuerOrganization || branding.companyName,
      signatureImageUrl: signatureImage || undefined,

      companyAddress: branding.address || "টাওয়ার ৭১, রোড ১১, ব্লক ডি, গুলশান-১, ঢাকা-১২১২",
      companyPhone: branding.phone || "+৮৮০ ২-৯৮৮৭৭৬৬",
      companyEmail: branding.email || "notice@apexglobal.tech",
      companyWebsite: branding.website || "https://apexglobal.tech",
      isPinned: isPinned,
    };

    onAddNotice(notice);
    setShowNoticeModal(false);

    // Save profile state silently
    handleSaveSignatoryProfile();

    // Reset Form
    setNewTitle("");
    setNewSubject("");
    setNewContent("");
    setIsPinned(false);
  };

  // Channels Definitions
  const companyChannels = useMemo(() => [
    { id: "general-announcements", name: "general-announcements", title: t("সাধারণ ঘোষণা চ্যানেল", "General Announcements"), desc: t("কোম্পানির অফিশিয়াল আপডেট ও সাধারণ বার্তা", "Company-wide official announcements & team updates"), icon: "📢" },
    { id: "hr-policy-helpdesk", name: "hr-policy-helpdesk", title: t("এইচআর পলিসি ও হেল্পডেস্ক", "HR & Policy Helpdesk"), desc: t("ছুটি, শিফট, পলিসি ও বেনিফিট সংক্রান্ত প্রশ্নোত্তর", "Leaves, shift queries, benefits and HR support"), icon: "🛡️" },
    { id: "watercooler-random", name: "watercooler-random", title: t("টিম আড্ডা ও শুভেচ্ছা", "Team Watercooler & Celebrations"), desc: t("অনানুষ্ঠানিক শুভেচ্ছা ও সহকর্মীদের মাঝে শেয়ারিং", "Casual greetings, celebrations and team bonding"), icon: "☕" },
  ], [t]);

  const departmentsList = useMemo(() => [
    { id: "dept-Engineering", name: "Engineering & Technology", code: "ENG", icon: "💻", memberCount: 12 },
    { id: "dept-Human Resources", name: "Human Resources & Talent", code: "HR", icon: "👥", memberCount: 6 },
    { id: "dept-Finance", name: "Finance, Accounts & Audit", code: "FIN", icon: "📊", memberCount: 5 },
    { id: "dept-Operations", name: "Operations & Branch Administration", code: "OPS", icon: "🏢", memberCount: 8 },
    { id: "dept-Marketing", name: "Marketing, Brand & Growth", code: "MKT", icon: "🚀", memberCount: 4 },
  ], []);

  // Filtered employees for 1:1 Direct Messaging
  const colleagueEmployees = useMemo(() => {
    return employees.filter((e) => e.id !== currentEmployee.id);
  }, [employees, currentEmployee.id]);

  // Handle Admin creating a custom group
  const handleCreateCustomGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      alert(t("দয়া করে গ্রুপের নাম লিখুন।", "Please enter a group name."));
      return;
    }
    const newGrp: CustomGroup = {
      id: `grp-${Date.now()}`,
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || t("অভ্যন্তরীণ অ্যাডমিন গ্রুপ", "Internal collaborative group"),
      memberIds: [currentEmployee.id, ...newGroupMemberIds],
      createdBy: currentEmployee.id,
      createdByName: currentEmployee.fullName,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setCustomGroups((prev) => [newGrp, ...prev]);
    setActiveChatType("GROUP");
    setActiveChatId(newGrp.id);
    setShowCreateGroupModal(false);
    setNewGroupName("");
    setNewGroupDesc("");
    setNewGroupMemberIds([]);
  };

  // Toggle collapsed section in channel list
  const toggleSection = (section: string) => {
    setActiveCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Filtered chat messages for the currently selected active conversation/channel
  const currentConversationMessages = useMemo(() => {
    return chatMessages.filter((msg) => {
      if (activeChatType === "DIRECT") {
        return (
          msg.channelType === "DIRECT" &&
          ((msg.senderId === currentEmployee.id && msg.recipientId === activeChatId) ||
           (msg.senderId === activeChatId && (msg.recipientId === currentEmployee.id || !msg.recipientId)))
        );
      }
      if (activeChatType === "DEPARTMENT") {
        return (
          msg.channelType === "DEPARTMENT" &&
          (msg.departmentName === activeChatId || msg.channelName === activeChatId || msg.channel === activeChatId)
        );
      }
      if (activeChatType === "PROJECT") {
        return (
          msg.channelType === "PROJECT" &&
          (msg.projectId === activeChatId || msg.channelName === activeChatId || msg.channel === activeChatId)
        );
      }
      if (activeChatType === "GROUP") {
        return (
          msg.channelType === "GROUP" &&
          (msg.groupId === activeChatId || msg.channelName === activeChatId)
        );
      }
      // General Channel
      return (
        (msg.channelType === "CHANNEL" || !msg.channelType) &&
        (msg.channelName === activeChatId || msg.channel === activeChatId || (!msg.channelName && !msg.recipientId && !msg.groupId && !msg.projectId && activeChatId === "general-announcements"))
      );
    });
  }, [chatMessages, activeChatType, activeChatId, currentEmployee.id]);

  // Active chat header info helper
  const activeChatInfo = useMemo(() => {
    if (activeChatType === "DIRECT") {
      const emp = employees.find((e) => e.id === activeChatId);
      return {
        title: emp?.fullName || t("সহকর্মী", "Colleague"),
        subtitle: `${emp?.designationTitle || t("কর্মকর্তা", "Employee")} • ${emp?.branchName || ""}`,
        avatar: emp?.avatarUrl,
        icon: null,
        isOnline: true,
        typeLabel: t("১:১ ডিরেক্ট মেসেজ", "1:1 Direct Message"),
      };
    }
    if (activeChatType === "DEPARTMENT") {
      const dept = departmentsList.find((d) => d.id === activeChatId);
      return {
        title: dept?.name || activeChatId,
        subtitle: t("বিভাগীয় টিম চ্যানেল", "Department Channel"),
        avatar: null,
        icon: dept?.icon || "🏢",
        isOnline: null,
        typeLabel: t("বিভাগীয় চ্যানেল", "Department Room"),
      };
    }
    if (activeChatType === "PROJECT") {
      const proj = projects.find((p) => p.id === activeChatId);
      return {
        title: proj?.name || activeChatId,
        subtitle: `${proj?.code || "PRJ"} • ${t("প্রজেক্ট টিম চ্যানেল", "Project Workspace")}`,
        avatar: null,
        icon: "🚀",
        isOnline: null,
        typeLabel: t("প্রজেক্ট চ্যানেল", "Project Channel"),
      };
    }
    if (activeChatType === "GROUP") {
      const grp = customGroups.find((g) => g.id === activeChatId);
      return {
        title: grp?.name || t("কাস্টম গ্রুপ", "Custom Group"),
        subtitle: `${grp?.description || ""} (${grp?.memberIds.length || 0} ${t("জন সদস্য", "members")})`,
        avatar: null,
        icon: "👥",
        isOnline: null,
        typeLabel: t("অ্যাডমিন গ্রুপ চ্যাট", "Admin Group Chat"),
      };
    }
    // Company channel
    const chan = companyChannels.find((c) => c.id === activeChatId);
    return {
      title: chan?.title || activeChatId,
      subtitle: chan?.desc || t("সেন্ট্রাল কোম্পানি চ্যানেল", "Central Enterprise Channel"),
      avatar: null,
      icon: chan?.icon || "📢",
      isOnline: null,
      typeLabel: t("পাবলিক চ্যানেল", "Public Channel"),
    };
  }, [activeChatType, activeChatId, employees, departmentsList, projects, customGroups, companyChannels, t]);

  // Send Internal Chat with target tagging
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !chatAttachmentName) return;

    let targetChannelName = activeChatId;
    let targetRecipientId: string | undefined = undefined;
    let targetRecipientName: string | undefined = undefined;
    let targetDeptName: string | undefined = undefined;
    let targetProjectId: string | undefined = undefined;
    let targetGroupId: string | undefined = undefined;
    let targetGroupName: string | undefined = undefined;

    if (activeChatType === "DIRECT") {
      targetRecipientId = activeChatId;
      const targetEmp = employees.find((e) => e.id === activeChatId);
      targetRecipientName = targetEmp?.fullName || "Colleague";
    } else if (activeChatType === "DEPARTMENT") {
      targetDeptName = activeChatId;
    } else if (activeChatType === "PROJECT") {
      targetProjectId = activeChatId;
    } else if (activeChatType === "GROUP") {
      targetGroupId = activeChatId;
      const grp = customGroups.find((g) => g.id === activeChatId);
      targetGroupName = grp?.name;
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentEmployee.id,
      senderName: currentEmployee.fullName,
      senderAvatar: currentEmployee.avatarUrl,
      senderRole: currentEmployee.role,
      channelType: activeChatType,
      channelName: targetChannelName,
      recipientId: targetRecipientId,
      recipientName: targetRecipientName,
      departmentName: targetDeptName,
      projectId: targetProjectId,
      groupId: targetGroupId,
      groupName: targetGroupName,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      message: chatInput,
      content: chatInput,
      attachmentUrl: chatAttachmentName || undefined,
    };

    onSendMessage(newMsg);
    setChatInput("");
    setChatAttachmentName(null);
  };

  // Visibility Logic: Filtering notices based on User Eligibility, Search, Category, and Language
  const filteredNotices = notices.filter((n) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        n.title.toLowerCase().includes(q) ||
        (n.subject && n.subject.toLowerCase().includes(q)) ||
        (n.memoNumber && n.memoNumber.toLowerCase().includes(q)) ||
        n.content.toLowerCase().includes(q) ||
        (n.issuerName && n.issuerName.toLowerCase().includes(q));
      if (!match) return false;
    }

    // 2. Language Filter
    if (filterLang !== "ALL") {
      const nLang = n.language || "bn";
      if (nLang !== filterLang) return false;
    }

    // 3. Category Filter
    if (filterCategory !== "ALL" && n.category !== filterCategory) {
      return false;
    }

    // 4. Scope & Multi-Branch Eligibility Filter
    if (filterScope === "ELIGIBLE") {
      if (isSuperAdmin) return true;

      // Notice target checks
      const isTargetedToAll = !n.targetScope || n.targetScope === "ALL_BRANCHES" || n.targetBranchId === "ALL";
      if (isTargetedToAll) return true;

      // Check if employee branch matches array or single id
      const matchesBranch =
        (n.targetBranchIds && n.targetBranchIds.includes(currentEmployee.branchId)) ||
        n.targetBranchId === currentEmployee.branchId;

      if (matchesBranch) return true;
      if (n.authorName === currentEmployee.fullName) return true;

      return false;
    }

    if (filterScope === "BRANCH") {
      return (n.targetBranchIds && n.targetBranchIds.length > 0) || (n.targetBranchId && n.targetBranchId !== "ALL");
    }

    if (filterScope === "PROJECT") {
      return (n.targetProjectIds && n.targetProjectIds.length > 0) || (n.targetProjectId && n.targetProjectId !== "ALL");
    }

    return true;
  });

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case "HOLIDAY":
        return { label: t("ছুটির নোটিশ", "Holiday Circular"), color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" };
      case "EMERGENCY":
        return { label: t("জরুরি নোটিশ", "Emergency Notice"), color: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30" };
      case "PAYROLL":
        return { label: t("বেতন ও বোনাস", "Payroll & Bonus"), color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" };
      case "OFFICE_TIME":
        return { label: t("অফিস সময়সূচি", "Office Timing"), color: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30" };
      case "POLICY":
        return { label: t("প্রজেক্ট ও নীতি", "Project & Policy"), color: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30" };
      case "TRAINING":
        return { label: t("প্রশিক্ষণ ও কর্মশালা", "Training & Workshop"), color: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30" };
      default:
        return { label: t("সাধারণ বিজ্ঞপ্তি", "General Circular"), color: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30" };
    }
  };

  return (
    <div id="notices-chat-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Header */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Bell className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {t("কোম্পানি নোটিশ বোর্ড ও অফিশিয়াল সার্কুলার", "Enterprise Notice Board & Circulars")}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "বাংলা/ইংরেজি ভাষা নির্বাচন, মাল্টি-ব্রাঞ্চ টার্গেটিং, সংরক্ষিত ডিজিটাল স্বাক্ষর ও অফিশিয়াল এ-ফোর (A4) লেটারহেড প্রিন্ট",
              "Bangla/English language selection, multi-branch targeting, saved digital signatures & printable A4 letterheads"
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Main Switcher: Notices vs Chat */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab("NOTICES")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "NOTICES"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{t("নোটিশ ও সার্কুলার", "Notices & Circulars")}</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-teal-700 text-white">
                {notices.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("CHAT")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "CHAT"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{t("অভ্যন্তরীণ টিম চ্যাট", "Internal Team Chat")}</span>
            </button>
          </div>

          {/* Create Notice Trigger (Admin / Branch Manager) */}
          {(isSuperAdmin || isBranchManager) && (
            <button
              onClick={() => {
                setShowNoticeModal(true);
                setNoticeLanguage(isBangla ? "bn" : "en");
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t("নতুন নোটিশ জারি করুন", "Issue New Notice")}</span>
            </button>
          )}
        </div>
      </div>

      {/* NOTICES TAB */}
      {activeTab === "NOTICES" && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={t("নোটিশ শিরোনাম, স্মারক বা বিষয় অনুসন্ধান...", "Search by title, memo no, subject...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Language Filter */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-950 rounded-xl p-1 border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                <button
                  onClick={() => setFilterLang("ALL")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterLang === "ALL" ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs" : "text-slate-500"
                  }`}
                >
                  {t("সব ভাষা", "All Languages")}
                </button>
                <button
                  onClick={() => setFilterLang("bn")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterLang === "bn" ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs" : "text-slate-500"
                  }`}
                >
                  বাংলা
                </button>
                <button
                  onClick={() => setFilterLang("en")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterLang === "en" ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs" : "text-slate-500"
                  }`}
                >
                  English
                </button>
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">{t("সকল ক্যাটাগরি", "All Categories")}</option>
                <option value="GENERAL">{t("সাধারণ প্রশাসনিক", "General Circular")}</option>
                <option value="HOLIDAY">{t("ছুটি ও উৎসব", "Holiday & Festival")}</option>
                <option value="EMERGENCY">{t("জরুরি নোটিশ", "Emergency Notice")}</option>
                <option value="PAYROLL">{t("বেতন ও বোনাস", "Payroll & Bonus")}</option>
                <option value="OFFICE_TIME">{t("অফিস সময়সূচি", "Office Timing")}</option>
                <option value="POLICY">{t("প্রকল্প ও নীতি", "Project & Policy")}</option>
              </select>

              {/* Scope Filter */}
              <select
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-teal-500"
              >
                <option value="ELIGIBLE">{t("আমার জন্য প্রযোজ্য নোটিশ", "Notices for My Branch/Profile")}</option>
                <option value="ALL">{t("সকল নোটিশ (Global View)", "All Notices (Global View)")}</option>
                <option value="BRANCH">{t("শাখাভিত্তিক নোটিশ", "Branch-Specific Notices")}</option>
                <option value="PROJECT">{t("প্রজেক্টভিত্তিক নোটিশ", "Project-Specific Notices")}</option>
              </select>
            </div>
          </div>

          {/* Notices Grid */}
          {filteredNotices.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {t("কোনো নোটিশ পাওয়া যায়নি", "No notices found")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {t("আপনার দেওয়া ফিল্টার অনুযায়ী কোনো অফিশিয়াল নোটিশ নেই। নতুন নোটিশ জারি করতে পারেন।", "No official circulars match your current search or filter criteria.")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotices.map((notice) => {
                const badge = getCategoryBadge(notice.category);
                const isNoticeBn = notice.language === "bn" || (!notice.language && isBangla);

                return (
                  <div
                    key={notice.id}
                    className={`relative p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all hover:shadow-md flex flex-col justify-between ${
                      notice.isPinned
                        ? "border-teal-500/50 shadow-xs ring-1 ring-teal-500/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {/* Top Badges Bar */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Category Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.color}`}>
                          {badge.label}
                        </span>

                        {/* Language Tag */}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                          {isNoticeBn ? "বাংলা" : "English"}
                        </span>

                        {/* Priority Badge */}
                        {notice.priority === "CRITICAL" && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500 text-white animate-pulse">
                            CRITICAL
                          </span>
                        )}
                        {notice.priority === "URGENT" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            URGENT
                          </span>
                        )}

                        {/* Pinned Tag */}
                        {notice.isPinned && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 flex items-center gap-1">
                            <Pin className="w-3 h-3" />
                            <span>{t("পিন করা", "Pinned")}</span>
                          </span>
                        )}
                      </div>

                      {/* Memo Number */}
                      <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {notice.memoNumber || "WFHR/2026"}
                      </span>
                    </div>

                    {/* Notice Title & Subject */}
                    <div className="space-y-1.5 mb-3">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">
                        {notice.title}
                      </h3>
                      {notice.subject && notice.subject !== notice.title && (
                        <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 line-clamp-1">
                          {t("বিষয়:", "Subject:")} {notice.subject}
                        </p>
                      )}
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-serif line-clamp-3 leading-relaxed">
                        {notice.content}
                      </p>
                    </div>

                    {/* Target Scope & Distribution Info */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/80 mb-4 space-y-1 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="font-semibold">{t("প্রাপক:", "To:")}</span>
                        <span className="truncate">
                          {notice.targetAudience || (
                            notice.targetBranchNames && notice.targetBranchNames.length > 0
                              ? notice.targetBranchNames.join(", ")
                              : notice.targetBranchName || t("সকল শাখা", "All Branches")
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            {isNoticeBn ? formatBanglaDate(notice.publishedDate) : notice.publishedDate}
                          </span>
                        </span>
                        <span className="truncate max-w-[180px]">
                          {notice.issuerName || notice.authorName || "কর্তৃপক্ষ"}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Bar: A4 Letterhead Preview Trigger, Edit Notice & Delete Notice */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {notice.signatureImageUrl && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mr-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t("ডিজিটাল স্বাক্ষরযুক্ত", "Signed")}</span>
                          </span>
                        )}
                        {onUpdateNotice && (isSuperAdmin || currentEmployee.id === notice.issuerEmployeeId || isBranchManager) && (
                          <button
                            onClick={() => handleStartEditNotice(notice)}
                            title={t("নোটিশ এডিট করুন", "Edit Notice")}
                            className="p-1.5 rounded-lg text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteNotice && (isSuperAdmin || currentEmployee.id === notice.issuerEmployeeId || isBranchManager) && (
                          <button
                            onClick={() => {
                              if (confirm(t("আপনি কি নিশ্চিত যে এই সার্কুলার / নোটিশটি মুছে ফেলতে চান?", "Are you sure you want to delete this circular / notice?"))) {
                                onDeleteNotice(notice.id);
                              }
                            }}
                            title={t("নোটিশ মুছুন", "Delete Notice")}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedNoticeForA4(notice)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80 text-xs font-bold transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{t("A4 লেটারহেড ও প্রিন্ট", "A4 Letterhead & Print")}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* INTERNAL CHAT & COLLABORATION WORKSPACE TAB */}
      {activeTab === "CHAT" && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col md:flex-row h-[720px]">
          {/* LEFT COLUMN: Channels, Groups & Direct 1:1 Messages Navigator */}
          <div className="w-full md:w-80 lg:w-88 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/70 dark:bg-slate-950/40">
            {/* Header & Search */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 font-bold">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      {t("ওয়ার্কস্পেস কমিউনিকেশন", "Enterprise Channels")}
                    </h3>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                      {t("১:১ এবং চ্যানেল টিম চ্যাট", "1:1 DMs, Dept & Project Rooms")}
                    </p>
                  </div>
                </div>

                {/* Create Group Button for Admin/Managers */}
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="p-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white shadow-xs text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title={t("নতুন গ্রুপ চ্যাট তৈরি করুন", "Create Custom Group")}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden sm:inline">{t("গ্রুপ", "Group")}</span>
                </button>
              </div>

              {/* Chat Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={t("চ্যানেল, গ্রুপ বা সহকর্মী খুঁজুন...", "Search channel, group, or colleague...")}
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
                {chatSearch && (
                  <button
                    onClick={() => setChatSearch("")}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Navigation Channels List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-4 no-scrollbar">
              {/* SECTION 1: Company Channels */}
              <div className="space-y-1">
                <button
                  onClick={() => toggleSection("company")}
                  className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-800 dark:hover:text-slate-200 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-teal-600" />
                    <span>{t("কোম্পানি চ্যানেল", "Company Channels")}</span>
                  </span>
                  {activeCollapsedSections["company"] ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {!activeCollapsedSections["company"] && (
                  <div className="space-y-0.5 pl-1">
                    {companyChannels
                      .filter(
                        (c) =>
                          !chatSearch ||
                          c.title.toLowerCase().includes(chatSearch.toLowerCase()) ||
                          c.name.toLowerCase().includes(chatSearch.toLowerCase())
                      )
                      .map((chan) => {
                        const isActive = activeChatType === "CHANNEL" && activeChatId === chan.id;
                        return (
                          <button
                            key={chan.id}
                            onClick={() => {
                              setActiveChatType("CHANNEL");
                              setActiveChatId(chan.id);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                              isActive
                                ? "bg-teal-600 text-white font-bold shadow-xs shadow-teal-600/20"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm">{chan.icon}</span>
                              <div className="min-w-0">
                                <p className="text-xs truncate">{chan.title}</p>
                              </div>
                            </div>
                            <span className="text-[10px] opacity-70 font-mono">#pub</span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* SECTION 2: Department Rooms */}
              <div className="space-y-1">
                <button
                  onClick={() => toggleSection("departments")}
                  className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-800 dark:hover:text-slate-200 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t("বিভাগীয় রুম", "Department Rooms")}</span>
                  </span>
                  {activeCollapsedSections["departments"] ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {!activeCollapsedSections["departments"] && (
                  <div className="space-y-0.5 pl-1">
                    {departmentsList
                      .filter(
                        (d) =>
                          !chatSearch ||
                          d.name.toLowerCase().includes(chatSearch.toLowerCase()) ||
                          d.code.toLowerCase().includes(chatSearch.toLowerCase())
                      )
                      .map((dept) => {
                        const isActive = activeChatType === "DEPARTMENT" && activeChatId === dept.id;
                        return (
                          <button
                            key={dept.id}
                            onClick={() => {
                              setActiveChatType("DEPARTMENT");
                              setActiveChatId(dept.id);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                              isActive
                                ? "bg-blue-600 text-white font-bold shadow-xs shadow-blue-600/20"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm">{dept.icon}</span>
                              <div className="min-w-0">
                                <p className="text-xs truncate">{dept.name}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono opacity-80 font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
                              {dept.code}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* SECTION 3: Project Channels */}
              <div className="space-y-1">
                <button
                  onClick={() => toggleSection("projects")}
                  className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-800 dark:hover:text-slate-200 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5 text-purple-600" />
                    <span>{t("প্রজেক্ট চ্যানেল", "Project Workspaces")}</span>
                  </span>
                  {activeCollapsedSections["projects"] ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {!activeCollapsedSections["projects"] && (
                  <div className="space-y-0.5 pl-1">
                    {projects
                      .filter(
                        (p) =>
                          !chatSearch ||
                          p.name.toLowerCase().includes(chatSearch.toLowerCase()) ||
                          p.code.toLowerCase().includes(chatSearch.toLowerCase())
                      )
                      .map((proj) => {
                        const isActive = activeChatType === "PROJECT" && activeChatId === proj.id;
                        return (
                          <button
                            key={proj.id}
                            onClick={() => {
                              setActiveChatType("PROJECT");
                              setActiveChatId(proj.id);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                              isActive
                                ? "bg-purple-600 text-white font-bold shadow-xs shadow-purple-600/20"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs">🚀</span>
                              <div className="min-w-0">
                                <p className="text-xs truncate">{proj.name}</p>
                              </div>
                            </div>
                            <span className="text-[9.5px] font-mono opacity-80 truncate max-w-[60px]">
                              {proj.code}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* SECTION 4: Admin Custom Groups */}
              <div className="space-y-1">
                <button
                  onClick={() => toggleSection("groups")}
                  className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-800 dark:hover:text-slate-200 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t("কাস্টম গ্রুপ চ্যাট", "Admin Group Chats")}</span>
                  </span>
                  {activeCollapsedSections["groups"] ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {!activeCollapsedSections["groups"] && (
                  <div className="space-y-0.5 pl-1">
                    {customGroups
                      .filter(
                        (g) =>
                          !chatSearch ||
                          g.name.toLowerCase().includes(chatSearch.toLowerCase()) ||
                          g.description.toLowerCase().includes(chatSearch.toLowerCase())
                      )
                      .map((grp) => {
                        const isActive = activeChatType === "GROUP" && activeChatId === grp.id;
                        return (
                          <button
                            key={grp.id}
                            onClick={() => {
                              setActiveChatType("GROUP");
                              setActiveChatId(grp.id);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                              isActive
                                ? "bg-amber-600 text-white font-bold shadow-xs shadow-amber-600/20"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs">👥</span>
                              <div className="min-w-0">
                                <p className="text-xs truncate">{grp.name}</p>
                              </div>
                            </div>
                            <span className="text-[10px] opacity-80 font-mono">
                              {grp.memberIds.length}p
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* SECTION 5: 1:1 Direct Messages (Colleagues) */}
              <div className="space-y-1">
                <button
                  onClick={() => toggleSection("direct")}
                  className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-800 dark:hover:text-slate-200 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t("১:১ ডিরেক্ট মেসেজ (সহকর্মী)", "1:1 Direct Messages")}</span>
                  </span>
                  {activeCollapsedSections["direct"] ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {!activeCollapsedSections["direct"] && (
                  <div className="space-y-1 pl-1">
                    {colleagueEmployees
                      .filter(
                        (emp) =>
                          !chatSearch ||
                          emp.fullName.toLowerCase().includes(chatSearch.toLowerCase()) ||
                          (emp.designationTitle && emp.designationTitle.toLowerCase().includes(chatSearch.toLowerCase())) ||
                          (emp.departmentName && emp.departmentName.toLowerCase().includes(chatSearch.toLowerCase()))
                      )
                      .map((emp) => {
                        const isActive = activeChatType === "DIRECT" && activeChatId === emp.id;
                        return (
                          <button
                            key={emp.id}
                            onClick={() => {
                              setActiveChatType("DIRECT");
                              setActiveChatId(emp.id);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                              isActive
                                ? "bg-emerald-600 text-white font-bold shadow-xs shadow-emerald-600/20"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative shrink-0">
                                <img
                                  src={emp.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                                  alt={emp.fullName}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                                />
                                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 absolute bottom-0 right-0"></span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs truncate">{emp.fullName}</p>
                                <p className={`text-[10px] truncate ${isActive ? "text-emerald-100" : "text-slate-400"}`}>
                                  {emp.designationTitle || emp.role}
                                </p>
                              </div>
                            </div>
                            <span className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded ${isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                              {emp.branchName ? emp.branchName.substring(0, 3).toUpperCase() : "HQ"}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Active Chat Room & Messages Stream */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 min-w-0">
            {/* Active Chat Header */}
            <div className="p-3.5 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-950/20 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {activeChatInfo.avatar ? (
                  <div className="relative shrink-0">
                    <img
                      src={activeChatInfo.avatar}
                      alt={activeChatInfo.title}
                      className="w-10 h-10 rounded-full object-cover border-2 border-teal-500/40 shadow-xs"
                    />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 absolute bottom-0 right-0"></span>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 text-lg shrink-0">
                    {activeChatInfo.icon || "💬"}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {activeChatInfo.title}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shrink-0">
                      {activeChatInfo.typeLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {activeChatInfo.subtitle}
                  </p>
                </div>
              </div>

              {/* Status / Message count */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  {currentConversationMessages.length} {t("টি বার্তা", "Messages")}
                </span>
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40 dark:bg-slate-950/30 no-scrollbar">
              {currentConversationMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 text-2xl">
                    {activeChatInfo.icon || "💬"}
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {t("কথোপকথন শুরু করুন", "Start Conversation")}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeChatType === "DIRECT"
                        ? t("আপনার সহকর্মীর সাথে নিরাপদ ১:১ অভ্যন্তরীণ চ্যাট শুরু করুন।", "Send a secure, real-time message directly to your colleague.")
                        : t("এই চ্যানেলে টিমের সাথে বার্তা বা আপডেট শেয়ার করুন।", "Post an update, question or message in this channel workspace.")}
                    </p>
                  </div>
                </div>
              ) : (
                currentConversationMessages.map((msg) => {
                  const isMe = msg.senderId === currentEmployee.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[85%] ${
                        isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      <img
                        src={msg.senderAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                        alt={msg.senderName}
                        className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 border border-teal-500/40 shadow-2xs"
                      />
                      <div className="space-y-1 min-w-0">
                        <div
                          className={`flex items-center gap-2 text-[10px] ${
                            isMe ? "justify-end text-slate-400" : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {isMe ? t("আপনি", "You") : msg.senderName}
                          </span>
                          {msg.senderRole && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-[9px] font-mono">
                              {msg.senderRole}
                            </span>
                          )}
                          <span className="font-mono">{msg.timestamp}</span>
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl text-xs space-y-1.5 leading-relaxed shadow-xs ${
                            isMe
                              ? "bg-teal-600 text-white rounded-tr-none shadow-teal-600/10"
                              : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700/80"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content || msg.message}</p>

                          {/* Attachment preview if present */}
                          {msg.attachmentUrl && (
                            <div className={`mt-2 p-2 rounded-xl flex items-center gap-2 text-[11px] border ${
                              isMe
                                ? "bg-teal-700/60 border-teal-500/40 text-teal-100"
                                : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                            }`}>
                              <Paperclip className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate font-mono">{msg.attachmentUrl}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shrink-0">
              {/* Attachment tag preview if file attached */}
              {chatAttachmentName && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate font-semibold">{chatAttachmentName}</span>
                  </div>
                  <button
                    onClick={() => setChatAttachmentName(null)}
                    className="p-1 hover:text-rose-500 text-slate-400 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Quick Emojis & Actions */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  {["👍", "🚀", "👏", "🔥", "❤️", "🎯"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setChatInput((prev) => prev + " " + emoji)}
                      className="px-1.5 py-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <span className="text-[10.5px] hidden sm:inline text-slate-400">
                  {t("Shift + Enter নতুন লাইনের জন্য", "Press Enter to send")}
                </span>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendChat} className="flex items-center gap-2">
                {/* Mock File Attachment Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    const mockFileName = `document_${Date.now().toString().slice(-4)}.pdf`;
                    setChatAttachmentName(mockFileName);
                  }}
                  className="p-2.5 rounded-xl text-slate-500 hover:text-teal-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                  title={t("ফাইল সংযুক্ত করুন", "Attach File")}
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  placeholder={
                    activeChatType === "DIRECT"
                      ? t(`${activeChatInfo.title}-কে বার্তা পাঠান...`, `Message ${activeChatInfo.title}...`)
                      : t(`${activeChatInfo.title} চ্যানেলে বার্তা লিখুন...`, `Message #${activeChatInfo.title}...`)
                  }
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 transition"
                />

                <button
                  type="submit"
                  disabled={!chatInput.trim() && !chatAttachmentName}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-sm font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t("পাঠান", "Send")}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM GROUP MODAL (Admin & Manager) */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {t("নতুন অভ্যন্তরীণ গ্রুপ তৈরি করুন", "Create New Custom Group")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("বিভিন্ন ব্রাঞ্চ ও ডিপার্টমেন্টের কর্মীদের নিয়ে ক্রস-ফাংশনাল গ্রুপ", "Cross-functional team collaboration")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomGroup} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("গ্রুপের নাম *", "Group Name *")}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t("যেমন: কোয়ার্টারলি অডিট টাস্কফোর্স", "e.g. Quarterly Audit Taskforce")}
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("বিবরণ ও উদ্দেশ্য", "Description & Purpose")}
                </label>
                <textarea
                  rows={2}
                  placeholder={t("গ্রুপের কাজের পরিধি ও আলোচনার বিষয়...", "Scope of discussion...")}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("গ্রুপ সদস্য নির্বাচন করুন", "Select Group Members")}
                </label>
                <div className="max-h-44 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 no-scrollbar">
                  {colleagueEmployees.map((emp) => {
                    const isSelected = newGroupMemberIds.includes(emp.id);
                    return (
                      <label
                        key={emp.id}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition ${
                          isSelected
                            ? "bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-200 font-bold"
                            : "hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewGroupMemberIds((prev) => [...prev, emp.id]);
                              } else {
                                setNewGroupMemberIds((prev) => prev.filter((id) => id !== emp.id));
                              }
                            }}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                          <img
                            src={emp.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                            alt={emp.fullName}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate">{emp.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-normal truncate">
                              {emp.designationTitle || emp.role} • {emp.branchName}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {t("বাতিল", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold text-xs shadow transition cursor-pointer"
                >
                  {t("গ্রুপ তৈরি করুন", "Create Group")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NOTICE MODAL (FULL LANGUAGE + MULTI-BRANCH/PROJECT TARGETING + PERSISTENT SIGNATURE) */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{t("নতুন অফিশিয়াল নোটিশ জারি ও লেটারহেড তৈরি", "Issue Official Circular / Notice")}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t("ভাষা নির্বাচন করুন, একাধিক শাখা নির্বাচন করুন এবং সংরক্ষিত ডিজিটাল স্বাক্ষরে প্রকাশ করুন", "Select language, multi-target branches/projects and publish with saved profile signature")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNoticeModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 0. Primary Language Switcher (Bangla / English) - CRITICAL USER REQUIREMENT */}
            <div className="px-5 py-3 bg-slate-100 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t("নোটিশের ভাষা নির্বাচন (Notice Language):", "Notice Language Selection:")}
                </span>
              </div>
              <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800 shadow-xs">
                <button
                  type="button"
                  onClick={() => setNoticeLanguage("bn")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    noticeLanguage === "bn"
                      ? "bg-teal-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>বাংলা (Bangla)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNoticeLanguage("en")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    noticeLanguage === "en"
                      ? "bg-teal-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>English</span>
                </button>
              </div>
            </div>

            {/* Quick Templates Buttons */}
            <div className="px-5 py-3 bg-teal-50/50 dark:bg-teal-950/20 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{noticeLanguage === "bn" ? "এক ক্লিকে টেমপ্লেট লোড:" : "Load Template:"}</span>
              </span>
              <button
                type="button"
                onClick={() => handleApplyTemplate("HOLIDAY_EID")}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition cursor-pointer"
              >
                🌴 {noticeLanguage === "bn" ? "ছুটি ও বোনাস" : "Holiday & Bonus"}
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate("EMERGENCY_WEATHER")}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition cursor-pointer"
              >
                🚨 {noticeLanguage === "bn" ? "জরুরি আবহাওয়া / WFH" : "Emergency / WFH"}
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate("FACE_ATTENDANCE")}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition cursor-pointer"
              >
                📸 {noticeLanguage === "bn" ? "ফেস উপস্থিতি নীতি" : "Face Attendance"}
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate("PROJECT_SYNC")}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition cursor-pointer"
              >
                🚀 {noticeLanguage === "bn" ? "প্রজেক্ট স্প্রিন্ট সভা" : "Project Sprint Sync"}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateNotice} className="p-5 sm:p-6 space-y-4 max-h-[72vh] overflow-y-auto no-scrollbar">
              {/* 1. Memo Number & Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    {noticeLanguage === "bn" ? "স্মারক নং (Memo No) *" : "Memo / Ref Number *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newMemoNumber}
                    onChange={(e) => setNewMemoNumber(e.target.value)}
                    placeholder="WFHR/HQ/2026/09-082"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    {noticeLanguage === "bn" ? "নোটিশ ক্যাটাগরি" : "Notice Category"}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="GENERAL">{noticeLanguage === "bn" ? "সাধারণ প্রশাসনিক বিজ্ঞপ্তি" : "General Circular"}</option>
                    <option value="HOLIDAY">{noticeLanguage === "bn" ? "ছুটি ও বন্ধের নোটিশ" : "Holiday Notice"}</option>
                    <option value="EMERGENCY">{noticeLanguage === "bn" ? "জরুরি সতর্কবার্তা" : "Emergency Circular"}</option>
                    <option value="PAYROLL">{noticeLanguage === "bn" ? "বেতন, বোনাস ও ভাতা" : "Payroll & Bonus"}</option>
                    <option value="OFFICE_TIME">{noticeLanguage === "bn" ? "অফিস সময়সূচি ও শিফট" : "Office Timing & Shift"}</option>
                    <option value="POLICY">{noticeLanguage === "bn" ? "প্রকল্প নীতিমালা ও মাইলফলক" : "Project Policy & Milestone"}</option>
                    <option value="TRAINING">{noticeLanguage === "bn" ? "প্রশিক্ষণ ও কর্মশালা" : "Training & Workshop"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    {noticeLanguage === "bn" ? "অগ্রাধিকার (Priority)" : "Priority Level"}
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="NORMAL">{noticeLanguage === "bn" ? "স্বাভাবিক (Normal)" : "Normal"}</option>
                    <option value="HIGH">{noticeLanguage === "bn" ? "উচ্চ অগ্রাধিকার (High)" : "High"}</option>
                    <option value="URGENT">{noticeLanguage === "bn" ? "জরুরি (Urgent)" : "Urgent"}</option>
                    <option value="CRITICAL">{noticeLanguage === "bn" ? "অতীব জরুরি (Critical)" : "Critical"}</option>
                  </select>
                </div>
              </div>

              {/* 2. Target Audience & MULTI-BRANCH / MULTI-PROJECT Selection */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    <span>
                      {noticeLanguage === "bn"
                        ? "নোটিশ বিতরণ ও প্রাপক শাখা নির্ধারণ (Multi-Branch Targeting)"
                        : "Target Branch & Multi-Selection Scope"}
                    </span>
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    {isSuperAdmin
                      ? (noticeLanguage === "bn" ? "সুপার অ্যাডমিন: একাধিক শাখা নির্বাচনযোগ্য" : "Super Admin: Multi-branch enabled")
                      : `${currentEmployee.branchName}`}
                  </span>
                </div>

                {/* Scope Radio / Selector */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetScope("ALL_BRANCHES");
                      setSelectedBranchIds(branches.map((b) => b.id));
                      setTargetAudience(
                        noticeLanguage === "bn"
                          ? "সকল আঞ্চলিক শাখা ও বিভাগের সম্মানিত কর্মকর্তা-কর্মচারীবৃন্দ"
                          : "All Officers & Staff Across All Branches"
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      targetScope === "ALL_BRANCHES"
                        ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    🌐 {noticeLanguage === "bn" ? "সকল আঞ্চলিক শাখা (All Branches)" : "All Branches (Global)"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetScope("SPECIFIC_BRANCH")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      targetScope === "SPECIFIC_BRANCH"
                        ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    🏢 {noticeLanguage === "bn" ? "নির্দিষ্ট শাখা নির্বাচন (Multi-Select)" : "Select Branches (Multi)"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetScope("SPECIFIC_PROJECT")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      targetScope === "SPECIFIC_PROJECT"
                        ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    🚀 {noticeLanguage === "bn" ? "প্রজেক্ট টিম নির্বাচন" : "Select Projects"}
                  </button>
                </div>

                {/* Multi-Branch Checkbox List */}
                {targetScope === "SPECIFIC_BRANCH" && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      <span>{noticeLanguage === "bn" ? "প্রাপক শাখাগুলো টিক দিন:" : "Check target branches:"}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedBranchIds(branches.map((b) => b.id))}
                          className="text-teal-600 dark:text-teal-400 hover:underline"
                        >
                          {noticeLanguage === "bn" ? "সবগুলো সিলেক্ট" : "Select All"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedBranchIds([])}
                          className="text-rose-500 hover:underline"
                        >
                          {noticeLanguage === "bn" ? "ক্লিয়ার" : "Clear"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      {branches.map((branch) => {
                        const isChecked = selectedBranchIds.includes(branch.id);
                        return (
                          <button
                            key={branch.id}
                            type="button"
                            onClick={() => handleToggleBranch(branch.id)}
                            className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                              isChecked
                                ? "bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 border border-teal-300 dark:border-teal-800"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div className="truncate">
                              <span className="font-bold truncate">{branch.name}</span>
                              <span className="text-[10px] text-slate-500 ml-1">({branch.city})</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Multi-Project Checkbox List */}
                {targetScope === "SPECIFIC_PROJECT" && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      <span>{noticeLanguage === "bn" ? "প্রজেক্ট নির্ধারণ করুন:" : "Select target projects:"}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedProjectIds(projects.map((p) => p.id))}
                          className="text-teal-600 dark:text-teal-400 hover:underline"
                        >
                          {noticeLanguage === "bn" ? "সবগুলো সিলেক্ট" : "Select All"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedProjectIds([])}
                          className="text-rose-500 hover:underline"
                        >
                          {noticeLanguage === "bn" ? "ক্লিয়ার" : "Clear"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      {projects.map((proj) => {
                        const isChecked = selectedProjectIds.includes(proj.id);
                        return (
                          <button
                            key={proj.id}
                            type="button"
                            onClick={() => handleToggleProject(proj.id)}
                            className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                              isChecked
                                ? "bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 border border-teal-300 dark:border-teal-800"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div className="truncate">
                              <span className="font-bold truncate">{proj.name}</span>
                              <span className="text-[10px] text-slate-500 ml-1">({proj.code})</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom Target Audience Line */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    {noticeLanguage === "bn" ? "প্রাপক / বিতরণ লেবেল (A4 Letterhead Audience Line)" : "Recipient Audience Label"}
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder={noticeLanguage === "bn" ? "যেমন: ঢাকা ও চট্টগ্রাম শাখার সকল কর্মকর্তা-কর্মচারীবৃন্দ" : "e.g. All Staff Across Selected Regional Branches"}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* 3. Title & Subject */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    {noticeLanguage === "bn" ? "নোটিশের শিরোনাম (Notice Title) *" : "Notice Title *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={noticeLanguage === "bn" ? "পবিত্র উৎসব উপলক্ষে অফিস ছুটি ও বোনাস সংক্রান্ত নোটিশ" : "Notice Title..."}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    {noticeLanguage === "bn" ? "নোটিশের বিষয় (Official Subject Line for A4)" : "Official Subject Line for A4"}
                  </label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder={noticeLanguage === "bn" ? "বিষয়: উৎসবকালীন সার্বিক ছুটি এবং আগস্ট মাসের বেতন-বোনাস অনুমোদন" : "Subject: ..."}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* 4. Body Content */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {noticeLanguage === "bn" ? "নোটিশের মূল বক্তব্য / বডি (Notice Content) *" : "Notice Body Text *"}
                </label>
                <textarea
                  required
                  rows={5}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={noticeLanguage === "bn" ? "নোটিশের বিস্তারিত বক্তব্য এখানে লিখুন..." : "Write formal circular body text here..."}
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 font-serif leading-relaxed"
                />
              </div>

              {/* 5. Issuer Details & PERSISTENT SIGNATURE PROFILE (CRITICAL USER REQUIREMENT) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                    <PenTool className="w-4 h-4" />
                    <span>
                      {noticeLanguage === "bn"
                        ? "স্বাক্ষরকারী তথ্য ও সংরক্ষিত ডিজিটাল প্রোফাইল"
                        : "Signatory Profile & Saved Digital Signature"}
                    </span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveSignatoryProfile}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold transition shadow-xs cursor-pointer"
                      title="Save these fields to profile"
                    >
                      {saveProfileSuccess ? (
                        <>
                          <Check className="w-3 h-3 text-white" />
                          <span>{noticeLanguage === "bn" ? "সংরক্ষিত!" : "Saved!"}</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3 text-white" />
                          <span>{noticeLanguage === "bn" ? "প্রোফাইলে সেভ রাখুন" : "Save to Profile"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {noticeLanguage === "bn" ? "স্বাক্ষরকারীর নাম" : "Signatory Name"}
                    </label>
                    <input
                      type="text"
                      value={issuerName}
                      onChange={(e) => setIssuerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {noticeLanguage === "bn" ? "পদবী" : "Designation"}
                    </label>
                    <input
                      type="text"
                      value={issuerDesignation}
                      onChange={(e) => setIssuerDesignation(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {noticeLanguage === "bn" ? "শাখা" : "Branch"}
                    </label>
                    <input
                      type="text"
                      value={issuerBranch}
                      onChange={(e) => setIssuerBranch(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {noticeLanguage === "bn" ? "প্রতিষ্ঠানের নাম" : "Organization"}
                    </label>
                    <input
                      type="text"
                      value={issuerOrganization}
                      onChange={(e) => setIssuerOrganization(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Digital Signature Upload / Preview (PNG, JPG, WebP) */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {noticeLanguage === "bn"
                        ? "ডিজিটাল স্বাক্ষর (PNG, JPG, WebP)"
                        : "Digital Signature Image (PNG, JPG, WebP)"}
                    </div>
                    <p className="text-[10.5px] text-slate-500">
                      {noticeLanguage === "bn"
                        ? "একবার আপলোড করলে প্রোফাইলে আজীবনের জন্য সংরক্ষিত থাকবে এবং প্রতিবার স্বয়ংক্রিয়ভাবে নোটিশে বসবে।"
                        : "Uploaded once and securely preserved on your user profile for all future notices."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {signatureImage ? (
                      <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-teal-500/40 rounded-xl">
                        <img
                          src={signatureImage}
                          alt="Signature Preview"
                          className="h-9 max-w-[120px] object-contain"
                        />
                        <button
                          type="button"
                          onClick={handleClearSignature}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title={noticeLanguage === "bn" ? "স্বাক্ষর মুছুন" : "Clear Signature"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-teal-500" />
                        <span>{noticeLanguage === "bn" ? "স্বাক্ষর ফাইল আপলোড" : "Upload Signature"}</span>
                      </button>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleSignatureUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Pinned Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pin-notice"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-teal-500"
                />
                <label htmlFor="pin-notice" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  {noticeLanguage === "bn" ? "নোটিশটি শীর্ষে পিন করে রাখুন (Pin to top)" : "Pin this circular to top"}
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  {noticeLanguage === "bn" ? "বাতিল" : "Cancel"}
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition cursor-pointer"
                >
                  {noticeLanguage === "bn" ? "নোটিশ প্রকাশ করুন" : "Publish Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Notice Modal */}
      {showEditNoticeModal && editingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-3xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editLanguage === "bn" ? "অফিস সার্কুলার / নোটিশ সম্পাদনা (Edit Circular)" : "Edit Official Circular / Notice"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editLanguage === "bn" ? "শিরোনাম, বিষয়বস্তু, প্রাপক ক্ষেত্র ও স্বাক্ষর আপডেট করুন" : "Update title, content, target distribution and signatory details"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditNoticeModal(false);
                  setEditingNotice(null);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedNotice} className="space-y-4 text-xs">
              {/* Language and Category Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {editLanguage === "bn" ? "নোটিশের ভাষা" : "Notice Language"}
                  </label>
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditLanguage("bn")}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition text-xs ${
                        editLanguage === "bn" ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs" : "text-slate-500"
                      }`}
                    >
                      বাংলা
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditLanguage("en")}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition text-xs ${
                        editLanguage === "en" ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs" : "text-slate-500"
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {editLanguage === "bn" ? "ক্যাটাগরি" : "Notice Category"}
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="GENERAL">{editLanguage === "bn" ? "সাধারণ প্রশাসনিক সার্কুলার" : "General Administrative"}</option>
                    <option value="HOLIDAY">{editLanguage === "bn" ? "ছুটি ও উৎসব সংক্রান্ত" : "Holiday & Festival"}</option>
                    <option value="EMERGENCY">{editLanguage === "bn" ? "জরুরি নির্দেশনা" : "Emergency Directives"}</option>
                    <option value="PAYROLL">{editLanguage === "bn" ? "বেতন, বোনাস ও ইনক্রিমেন্ট" : "Payroll, Bonus & Increment"}</option>
                    <option value="OFFICE_TIME">{editLanguage === "bn" ? "অফিস সময় ও উপস্থিতি নিয়ম" : "Office Hours & Attendance"}</option>
                    <option value="POLICY">{editLanguage === "bn" ? "এইচআর পলিসি ও প্রজেক্ট রুলস" : "HR Policy & Guidelines"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {editLanguage === "bn" ? "অগ্রাধিকার (Priority)" : "Priority"}
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="NORMAL">{editLanguage === "bn" ? "সাধারণ (Normal)" : "Normal"}</option>
                    <option value="URGENT">{editLanguage === "bn" ? "জরুরি (Urgent)" : "Urgent"}</option>
                    <option value="CRITICAL">{editLanguage === "bn" ? "অত্যন্ত জরুরি (Critical)" : "Critical"}</option>
                  </select>
                </div>
              </div>

              {/* Memo Number & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {editLanguage === "bn" ? "স্মারক নম্বর (Memo No)" : "Memo / Ref Number"}
                  </label>
                  <input
                    type="text"
                    value={editMemoNumber}
                    onChange={(e) => setEditMemoNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {editLanguage === "bn" ? "নোটিশের শিরোনাম (Title)" : "Notice Title"}
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {editLanguage === "bn" ? "বিষয় (Subject Line)" : "Official Subject Line"}
                </label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                />
              </div>

              {/* Target Distribution Scope */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <label className="block text-slate-700 dark:text-slate-300 font-bold">
                  {editLanguage === "bn" ? "প্রাপক ও কার্যকর আওতা (Target Audience)" : "Target Distribution Scope"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label
                    onClick={() => setEditTargetScope("ALL_BRANCHES")}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      editTargetScope === "ALL_BRANCHES"
                        ? "bg-teal-500/10 border-teal-500 text-teal-700 dark:text-teal-300 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="editTargetScope"
                      checked={editTargetScope === "ALL_BRANCHES"}
                      onChange={() => setEditTargetScope("ALL_BRANCHES")}
                      className="hidden"
                    />
                    <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{editLanguage === "bn" ? "সকল শাখা (All)" : "All Branches"}</span>
                  </label>

                  <label
                    onClick={() => setEditTargetScope("SPECIFIC_BRANCH")}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      editTargetScope === "SPECIFIC_BRANCH"
                        ? "bg-teal-500/10 border-teal-500 text-teal-700 dark:text-teal-300 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="editTargetScope"
                      checked={editTargetScope === "SPECIFIC_BRANCH"}
                      onChange={() => setEditTargetScope("SPECIFIC_BRANCH")}
                      className="hidden"
                    />
                    <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{editLanguage === "bn" ? "নির্দিষ্ট শাখা (Branches)" : "Specific Branches"}</span>
                  </label>

                  <label
                    onClick={() => setEditTargetScope("SPECIFIC_PROJECT")}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      editTargetScope === "SPECIFIC_PROJECT"
                        ? "bg-teal-500/10 border-teal-500 text-teal-700 dark:text-teal-300 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="editTargetScope"
                      checked={editTargetScope === "SPECIFIC_PROJECT"}
                      onChange={() => setEditTargetScope("SPECIFIC_PROJECT")}
                      className="hidden"
                    />
                    <FolderKanban className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{editLanguage === "bn" ? "প্রজেক্ট টিম (Projects)" : "Project Teams"}</span>
                  </label>
                </div>

                {editTargetScope === "SPECIFIC_BRANCH" && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {branches.map((b) => {
                      const isSel = editSelectedBranchIds.includes(b.id);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setEditSelectedBranchIds((prev) =>
                              prev.includes(b.id) ? prev.filter((id) => id !== b.id) : [...prev, b.id]
                            );
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                            isSel
                              ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {isSel ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                          <span>{b.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Content Body */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {editLanguage === "bn" ? "সার্কুলার / নোটিশের মূল বিবরণ (Main Content Body)" : "Circular Body Content"}
                </label>
                <textarea
                  rows={6}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-serif leading-relaxed text-xs"
                  required
                />
              </div>

              {/* Signatory Info & Pin Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {editLanguage === "bn" ? "স্বাক্ষরকারী কর্মকর্তার নাম" : "Signatory Official Name"}
                  </label>
                  <input
                    type="text"
                    value={editIssuerName}
                    onChange={(e) => setEditIssuerName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {editLanguage === "bn" ? "পদবী ও বিভাগ" : "Designation & Department"}
                  </label>
                  <input
                    type="text"
                    value={editIssuerDesignation}
                    onChange={(e) => setEditIssuerDesignation(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Pin Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-pin-notice"
                  checked={editIsPinned}
                  onChange={(e) => setEditIsPinned(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-teal-500"
                />
                <label htmlFor="edit-pin-notice" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1">
                  <Pin className="w-3.5 h-3.5 text-teal-600" />
                  <span>{editLanguage === "bn" ? "নোটিশটি শীর্ষে পিন করে রাখুন (Pin to top)" : "Pin this circular to top"}</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditNoticeModal(false);
                    setEditingNotice(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  {editLanguage === "bn" ? "বাতিল" : "Cancel"}
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editLanguage === "bn" ? "আপডেট সংরক্ষণ করুন" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {selectedNoticeForA4 && (
        <NoticeA4LetterheadModal
          isOpen={Boolean(selectedNoticeForA4)}
          onClose={() => setSelectedNoticeForA4(null)}
          notice={selectedNoticeForA4}
          branches={branches}
        />
      )}
    </div>
  );
};
