import React, { useState } from "react";
import {
  HeartHandshake,
  GraduationCap,
  Building2,
  Users,
  MapPin,
  Banknote,
  Briefcase,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  Phone,
  Droplets,
  Home,
  Snowflake,
  Utensils,
  BookOpen,
  Award,
  ShieldCheck,
  Edit2,
  X,
} from "lucide-react";
import { Employee, Branch, ReliefProgram, TrainingCenter, MicrofinanceProject } from "../../types";
import {
  INITIAL_RELIEF_PROGRAMS,
  INITIAL_TRAINING_CENTERS,
  INITIAL_MICROFINANCE_PROJECTS,
} from "../../data/mockNgoData";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";

interface NgoProgramsTrainingViewProps {
  employees: Employee[];
  branches: Branch[];
  currentUser?: Employee;
  onViewEmployee?: (emp: Employee) => void;
  onEditEmployee?: (emp: Employee) => void;
}

export const NgoProgramsTrainingView: React.FC<NgoProgramsTrainingViewProps> = ({
  employees,
  branches,
  currentUser,
  onViewEmployee,
  onEditEmployee,
}) => {
  const { isBangla, t } = useThemeLanguage();

  const [activeTab, setActiveTab] = useState<"relief" | "training" | "microfinance" | "multi-role">("relief");
  const [reliefPrograms, setReliefPrograms] = useState<ReliefProgram[]>(INITIAL_RELIEF_PROGRAMS);
  const [trainingCenters, setTrainingCenters] = useState<TrainingCenter[]>(INITIAL_TRAINING_CENTERS);
  const [microfinanceProjects] = useState<MicrofinanceProject[]>(INITIAL_MICROFINANCE_PROJECTS);

  // Filters
  const [selectedReliefCategory, setSelectedReliefCategory] = useState<string>("ALL");
  const [selectedDistrictBranch, setSelectedDistrictBranch] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [showAddCenterModal, setShowAddCenterModal] = useState(false);
  const [selectedProgramDetails, setSelectedProgramDetails] = useState<ReliefProgram | null>(null);

  // New Program Form State
  const [newProgName, setNewProgName] = useState("");
  const [newProgCategory, setNewProgCategory] = useState<ReliefProgram["category"]>("WATER_WELL");
  const [newProgDistricts, setNewProgDistricts] = useState("");
  const [newProgBudget, setNewProgBudget] = useState(3000000);
  const [newProgBeneficiaries, setNewProgBeneficiaries] = useState(10000);
  const [newProgUnits, setNewProgUnits] = useState(100);
  const [newProgUnitLabel, setNewProgUnitLabel] = useState("টি নলকূপ");
  const [newProgManager, setNewProgManager] = useState("Md. Ibrahim Hossain");
  const [newProgFieldLead, setNewProgFieldLead] = useState("Tariqul Hasan");
  const [newProgDescription, setNewProgDescription] = useState("");

  // New Training Center Form State
  const [newCenterName, setNewCenterName] = useState("");
  const [newCenterBranchId, setNewCenterBranchId] = useState(branches[0]?.id || "branch-03");
  const [newCenterDistrict, setNewCenterDistrict] = useState("সিলেট");
  const [newCenterPhone, setNewCenterPhone] = useState("+880 1700-000000");
  const [newCenterAddress, setNewCenterAddress] = useState("");
  const [newCenterLead, setNewCenterLead] = useState("Anika Tabassum");

  // Summary Metrics
  const totalBeneficiaries = reliefPrograms.reduce((acc, p) => acc + (p.servedBeneficiaries || 0), 0);
  const totalBudgetSpent = reliefPrograms.reduce((acc, p) => acc + (p.spentBudget || 0), 0);
  const totalTrainees = trainingCenters.reduce((acc, c) => acc + (c.totalEnrolled || 0), 0);
  const totalJobsPlaced = trainingCenters.reduce((acc, c) => acc + (c.jobsFacilitated || 0), 0);

  // Multi-role employees (employees holding multiple designations or departments)
  const multiRoleStaff = employees.filter(
    (emp) => (emp.additionalDesignations && emp.additionalDesignations.length > 0) || emp.isCeoOrOwner
  );

  const handleCreateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgName.trim()) return;

    const newProg: ReliefProgram = {
      id: `prog-${Date.now()}`,
      name: newProgName,
      nameBn: newProgName,
      category: newProgCategory,
      code: `MWO-${newProgCategory.substring(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
      projectManagerName: newProgManager,
      fieldOperationsManagerName: newProgFieldLead,
      targetDistricts: newProgDistricts.split(",").map((s) => s.trim()).filter(Boolean),
      allocatedBudget: Number(newProgBudget),
      spentBudget: 0,
      targetBeneficiaries: Number(newProgBeneficiaries),
      servedBeneficiaries: 0,
      targetUnits: Number(newProgUnits),
      unitsCompleted: 0,
      unitLabel: newProgUnitLabel,
      startDate: new Date().toISOString().split("T")[0],
      status: "ACTIVE",
      description: newProgDescription || "মুসলিম ওয়েলফেয়ার অর্গানাইজেশনের মানবিক উন্নয়ন কর্মসূচি।",
      fieldStaffNames: ["ফিল্ড সুপারভাইজার", "লোকাল ভলান্টিয়ার টিম"],
    };

    setReliefPrograms([newProg, ...reliefPrograms]);
    setShowAddProgramModal(false);
    setNewProgName("");
    setNewProgDistricts("");
    setNewProgDescription("");
  };

  const handleCreateTrainingCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCenterName.trim()) return;

    const branch = branches.find((b) => b.id === newCenterBranchId) || branches[0];

    const newCenter: TrainingCenter = {
      id: `tc-${Date.now()}`,
      branchId: branch?.id || "branch-new",
      branchName: branch?.name || "District Branch",
      district: newCenterDistrict,
      name: newCenterName,
      nameBn: newCenterName,
      code: `TC-${newCenterDistrict.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      leadInstructorName: newCenterLead,
      status: "ACTIVE",
      totalEnrolled: 40,
      totalGraduated: 0,
      jobsFacilitated: 0,
      contactPhone: newCenterPhone,
      address: newCenterAddress || "জেলা প্রধান কার্যালয়",
      courses: [
        {
          id: `crs-${Date.now()}-1`,
          title: "Computer & Digital Office Skills",
          titleBn: "কম্পিউটার ও ডিজিটাল অফিস অ্যাপ্লিকেশন",
          duration: "৩ মাস",
          capacity: 30,
          currentBatchTrainees: 25,
          instructorName: newCenterLead,
          jobPlacementPartner: "লোকাল আইটি ফার্ম ও দূরবর্তী ফ্রিল্যান্সিং",
        },
      ],
    };

    setTrainingCenters([...trainingCenters, newCenter]);
    setShowAddCenterModal(false);
    setNewCenterName("");
    setNewCenterAddress("");
  };

  const getCategoryIcon = (category: ReliefProgram["category"]) => {
    switch (category) {
      case "WATER_WELL":
        return <Droplets className="w-5 h-5 text-sky-500" />;
      case "WINTER_AID":
        return <Snowflake className="w-5 h-5 text-blue-400" />;
      case "FOOD_DISTRIBUTION":
        return <Utensils className="w-5 h-5 text-amber-500" />;
      case "EDUCATION_SUPPORT":
        return <BookOpen className="w-5 h-5 text-emerald-500" />;
      case "SHELTER_HOUSING":
        return <Home className="w-5 h-5 text-purple-500" />;
      default:
        return <HeartHandshake className="w-5 h-5 text-rose-500" />;
    }
  };

  const filteredReliefPrograms = reliefPrograms.filter((prog) => {
    const matchesCategory = selectedReliefCategory === "ALL" || prog.category === selectedReliefCategory;
    const matchesSearch =
      prog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prog.nameBn.includes(searchTerm) ||
      prog.targetDistricts.some((d) => d.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const filteredTrainingCenters = trainingCenters.filter((center) => {
    const matchesBranch = selectedDistrictBranch === "ALL" || center.branchId === selectedDistrictBranch;
    const matchesSearch =
      center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.branchName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  return (
    <div id="ngo-programs-training-hub" className="space-y-6 animate-in fade-in duration-300">
      {/* Executive Hero Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl border border-teal-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>{isBangla ? "মুসলিম ওয়েলফেয়ার অর্গানাইজেশন" : "Muslim Welfare Organization"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isBangla
                ? "এনজিও কর্মসূচি, জেলা প্রশিক্ষণ কেন্দ্র ও মাল্টি-রোল ব্যবস্থাপনা"
                : "NGO Programs, District Training Hubs & Multi-Role Staff"}
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              {isBangla
                ? "ত্রাণ সহায়তা (টিউবওয়েল, শীতবস্ত্র, জরুরি খাদ্য, শিক্ষা ও আশ্রয় প্রকল্প), জেলাভিত্তিক কারিগরি প্রশিক্ষণ একাডেমি, সুদমুক্ত ক্ষুদ্রঋণ এবং একক বেতনে একাধিক পদে নিয়োজিত কর্মীদের সামগ্রিক নিয়ন্ত্রণ কেন্দ্র।"
                : "Operational dashboard governing humanitarian aid, branch-affiliated vocational skills centers with job placement, Islamic microfinance, and unified multi-portfolio staff allocations."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {activeTab === "relief" && (
              <button
                type="button"
                onClick={() => setShowAddProgramModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isBangla ? "নতুন ত্রাণ কর্মসূচি যোগ করুন" : "Add Relief Program"}</span>
              </button>
            )}
            {activeTab === "training" && (
              <button
                type="button"
                onClick={() => setShowAddCenterModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isBangla ? "নতুন জেলা প্রশিক্ষণ কেন্দ্র" : "Add Training Center"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-teal-500/20">
          <div className="bg-slate-900/40 backdrop-blur-xs border border-white/10 p-3.5 rounded-2xl">
            <span className="text-xs text-slate-400 block font-medium">
              {isBangla ? "মোট উপকৃত সুবিধাভোগী" : "Beneficiaries Served"}
            </span>
            <div className="text-xl sm:text-2xl font-black text-teal-300 mt-1">
              {totalBeneficiaries.toLocaleString()}
            </div>
            <span className="text-[10px] text-teal-400/80 font-bold">{reliefPrograms.length} টি সক্রিয় কর্মসূচি</span>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-xs border border-white/10 p-3.5 rounded-2xl">
            <span className="text-xs text-slate-400 block font-medium">
              {isBangla ? "জেলা প্রশিক্ষণ একাডেমি" : "District Skill Hubs"}
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">
              {trainingCenters.length} টি কেন্দ্র
            </div>
            <span className="text-[10px] text-emerald-400/80 font-bold">{totalTrainees} জন প্রশিক্ষণার্থী</span>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-xs border border-white/10 p-3.5 rounded-2xl">
            <span className="text-xs text-slate-400 block font-medium">
              {isBangla ? "সফল কর্মসংস্থান / চাকরি" : "Jobs Facilitated"}
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
              {totalJobsPlaced} জন
            </div>
            <span className="text-[10px] text-amber-400/80 font-bold">কারিগরি সেল ও পার্টনার</span>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-xs border border-white/10 p-3.5 rounded-2xl">
            <span className="text-xs text-slate-400 block font-medium">
              {isBangla ? "সুদমুক্ত ক্ষুদ্রঋণ বিতরণ" : "Disbursed Qard-e-Hasana"}
            </span>
            <div className="text-xl sm:text-2xl font-black text-sky-300 mt-1">
              ৳{(microfinanceProjects[0]?.totalDisbursedLoan / 100000).toFixed(1)} লাখ
            </div>
            <span className="text-[10px] text-sky-400/80 font-bold">৯৯.৪% স্বনির্ভর আদায় হার</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("relief")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "relief"
              ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>{isBangla ? "১. ত্রাণ ও মানবিক কর্মসূচি" : "1. Relief & Humanitarian Aid"}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-black">
            {reliefPrograms.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("training")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "training"
              ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>{isBangla ? "২. জেলা প্রশিক্ষণ কেন্দ্র ও কর্মসংস্থান" : "2. District Training Centers & Jobs"}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-black">
            {trainingCenters.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("microfinance")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "microfinance"
              ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span>{isBangla ? "৩. ক্ষুদ্রঋণ ও আমানত প্রকল্প" : "3. Microfinance & Savings"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("multi-role")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "multi-role"
              ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{isBangla ? "৪. বহুমুখী পদবী ও স্টাফ ম্যাট্রিক্স" : "4. Multi-Role Staff Matrix"}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black border border-amber-500/30">
            {multiRoleStaff.length} জন
          </span>
        </button>
      </div>

      {/* TAB 1: RELIEF & HUMANITARIAN PROGRAMS */}
      {activeTab === "relief" && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isBangla ? "কর্মসূচির নাম বা জেলা খুঁজুন..." : "Search programs or districts..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-teal-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>ক্যাটাগরি:</span>
              </span>
              {[
                { id: "ALL", label: "সকল কর্মসূচি" },
                { id: "WATER_WELL", label: "ওয়াটার ওয়েল" },
                { id: "WINTER_AID", label: "শীতবস্ত্র" },
                { id: "FOOD_DISTRIBUTION", label: "খাদ্য সহায়তা" },
                { id: "EDUCATION_SUPPORT", label: "শিক্ষা বৃত্তি" },
                { id: "SHELTER_HOUSING", label: "আশ্রয় প্রকল্প" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedReliefCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    selectedReliefCategory === cat.id
                      ? "bg-teal-600 text-white font-bold"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Relief Programs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredReliefPrograms.map((program) => {
              const progressPct =
                program.targetUnits && program.targetUnits > 0
                  ? Math.min(100, Math.round(((program.unitsCompleted || 0) / program.targetUnits) * 100))
                  : 0;

              return (
                <div
                  key={program.id}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {getCategoryIcon(program.category)}
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                            program.status === "ACTIVE"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                              : program.status === "COMPLETED"
                              ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {program.status === "ACTIVE" ? "চলমান" : program.status === "COMPLETED" ? "সম্পন্ন" : "পরিকল্পনা"}
                        </span>
                        <span className="block text-[10px] font-mono text-slate-400 mt-1">{program.code}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                        {isBangla ? program.nameBn : program.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {program.description}
                      </p>
                    </div>

                    {/* Progress Bar of Target Units */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {isBangla ? "বাস্তবায়ন অগ্রগতি:" : "Progress:"}
                        </span>
                        <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">
                          {program.unitsCompleted?.toLocaleString()} / {program.targetUnits?.toLocaleString()}{" "}
                          {program.unitLabel} ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Personnel Assigned */}
                    <div className="rounded-2xl p-3 bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">প্রজেক্ট ম্যানেজার:</span>
                        <strong className="text-slate-900 dark:text-white font-semibold">
                          {program.projectManagerName || "নির্ধারিত নয়"}
                        </strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">ফিল্ড অপারেশন লিড:</span>
                        <strong className="text-teal-600 dark:text-teal-300 font-semibold">
                          {program.fieldOperationsManagerName || "নির্ধারিত নয়"}
                        </strong>
                      </div>
                      {program.fieldStaffNames && program.fieldStaffNames.length > 0 && (
                        <div className="pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>ফিল্ড কর্মী: </span>
                          <span className="text-slate-700 dark:text-slate-200 font-medium">
                            {program.fieldStaffNames.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Districts tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {program.targetDistricts.map((d) => (
                        <span
                          key={d}
                          className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-[10px] font-bold border border-teal-200 dark:border-teal-800 flex items-center gap-1"
                        >
                          <MapPin className="w-2.5 h-2.5" />
                          <span>{d}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Financial Footnote */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">বরাদ্দকৃত বাজেট</span>
                      <strong className="text-slate-900 dark:text-white font-mono">
                        ৳{program.allocatedBudget.toLocaleString()}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">ব্যয়িত বাজেট</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                        ৳{program.spentBudget.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DISTRICT VOCATIONAL TRAINING CENTERS */}
      {activeTab === "training" && (
        <div className="space-y-4">
          {/* Branch Filter & Explanation */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{isBangla ? "শাখার অধীনে জেলাভিত্তিক প্রশিক্ষণ একাডেমি ও কর্মসংস্থান" : "Branch-Affiliated Training Centers"}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBangla
                  ? "প্রতিটি আঞ্চলিক ব্রাঞ্চের অধীনে স্বতন্ত্র প্রশিক্ষণ সেন্টার পরিচালিত হয়, যেখানে যুবসমাজকে দক্ষতা প্রদান ও কর্মসংস্থান নিশ্চিত করা হয়।"
                  : "Each regional branch hosts dedicated vocational labs providing skill certification and private-sector job placement."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">ব্রাঞ্চ ফিল্টার:</span>
              <select
                value={selectedDistrictBranch}
                onChange={(e) => setSelectedDistrictBranch(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium cursor-pointer"
              >
                <option value="ALL">সকল জেলা ব্রাঞ্চ ({trainingCenters.length} টি সেন্টার)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Training Centers List */}
          <div className="space-y-6">
            {filteredTrainingCenters.map((center) => (
              <div
                key={center.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-5"
              >
                {/* Center Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 text-slate-950 font-black flex items-center justify-center text-xl shadow-md shadow-teal-500/20 shrink-0">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                          {center.name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                          {center.code}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          {center.district}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                        <span>শাখা: <strong className="text-slate-800 dark:text-slate-200">{center.branchName}</strong></span>
                        <span>•</span>
                        <span>পরিচালক/ইনস্ট্রাক্টর: <strong className="text-teal-600 dark:text-teal-300">{center.leadInstructorName}</strong></span>
                        <span>•</span>
                        <span>ফোন: <strong className="text-slate-800 dark:text-slate-200">{center.contactPhone}</strong></span>
                      </p>
                    </div>
                  </div>

                  {/* Badges of Success */}
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-center">
                      <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold block">মোট ভর্তি</span>
                      <strong className="text-base font-black text-teal-900 dark:text-teal-100">{center.totalEnrolled} জন</strong>
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center">
                      <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold block">পাসকৃত</span>
                      <strong className="text-base font-black text-blue-900 dark:text-blue-100">{center.totalGraduated} জন</strong>
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">কর্মসংস্থান</span>
                      <strong className="text-base font-black text-emerald-900 dark:text-emerald-100">{center.jobsFacilitated} জন</strong>
                    </div>
                  </div>
                </div>

                {/* Courses & Job Placement Desk */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>চলমান কারিগরি ট্রেড ও চাকরি ব্যবস্থাপনা সেল (Job Placement Desk)</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {center.courses.map((course) => (
                      <div
                        key={course.id}
                        className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                            {isBangla ? course.titleBn : course.title}
                          </h5>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 shrink-0">
                            {course.duration}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">ব্যাচ ক্ষমতা:</span>
                            <span className="font-semibold">{course.capacity} জন (বর্তমান: {course.currentBatchTrainees} জন)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">প্রশিক্ষক:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{course.instructorName}</span>
                          </div>
                        </div>

                        {course.jobPlacementPartner && (
                          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                            <span className="line-clamp-1">
                              <strong>কর্মসংস্থান পার্টনার:</strong> {course.jobPlacementPartner}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MICROFINANCE & SAVINGS (QARD-E-HASANA) */}
      {activeTab === "microfinance" && (
        <div className="space-y-5">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {microfinanceProjects[0]?.nameBn || "হাসানাহ সুদমুক্ত ক্ষুদ্রঋণ ও স্বনির্ভর সঞ্চয় প্রকল্প"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    হেড অফিস ও সংশ্লিষ্ট ব্রাঞ্চের সমন্বয়ে পরিচালিত ইসলামিক ওয়েলফেয়ার ঋণ ও নিয়মিত আমানত কার্যক্রম।
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                সক্রিয় ও নিয়মিত অডিটকৃত
              </span>
            </div>

            {/* Microfinance Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400 font-medium block">মোট সুদমুক্ত ঋণ বিতরণ</span>
                <strong className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
                  ৳{microfinanceProjects[0]?.totalDisbursedLoan.toLocaleString()}
                </strong>
                <span className="text-[11px] text-teal-600 dark:text-teal-400">ক্ষুদ্র উদ্যোক্তা ও কৃষক তহবিল</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400 font-medium block">আমানত ও সদস্য সঞ্চয় স্থিতি</span>
                <strong className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                  ৳{microfinanceProjects[0]?.totalSavingsDeposits.toLocaleString()}
                </strong>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300">নিরাপদ সঞ্চয় তহবিল</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400 font-medium block">সক্রিয় উদ্যোক্তা / ঋণগ্রহীতা</span>
                <strong className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1 block">
                  {microfinanceProjects[0]?.activeBorrowers} জন
                </strong>
                <span className="text-[11px] text-amber-700 dark:text-amber-300">পারিবারিক স্বনির্ভর ইউনিট</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400 font-medium block">আদায় ও কিস্তির স্থায়িত্ব হার</span>
                <strong className="text-xl font-black text-teal-600 dark:text-teal-400 font-mono mt-1 block">
                  {microfinanceProjects[0]?.recoveryRatePercent}%
                </strong>
                <span className="text-[11px] text-slate-500">নিয়মিত সাপ্তাহিক ও মাসিক সভা</span>
              </div>
            </div>

            {/* Management & Field Staff info */}
            <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
                  দায়িত্বপ্রাপ্ত হিসাব ও ঋণ তত্ত্বাবধায়ক (Multi-Role Allocation):
                </span>
                <p className="text-xs text-teal-700 dark:text-teal-300">
                  <strong>Tariqul Hasan</strong> (প্রজেক্ট ম্যানেজার + একাউন্টস সমন্বয়ক) এবং হেড অফিসের একাউন্টস টিম সরাসরি তদারকি করছেন।
                </p>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                বেতন: একক ফিক্সড বেতনের অন্তর্ভুক্ত
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MULTI-ROLE STAFF MATRIX */}
      {activeTab === "multi-role" && (
        <div className="space-y-5">
          {/* Policy & Guidance Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/10 border border-teal-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{isBangla ? "একক ব্যক্তি - বহুমুখী পদবী ও পোর্টফোলিও নীতি" : "Multi-Designation Workforce Policy"}</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                {isBangla
                  ? "এনজিও ও উন্নয়ন সংস্থায় একজন কর্মকর্তা একই সাথে একাধিক বিভাগ বা কর্মসূচির দায়িত্ব পালন করতে পারেন (যেমন: সিইও + হেড অব এইচআর + আইটি ম্যানেজার; অথবা প্রজেক্ট ম্যানেজার + একাউন্টস সমন্বয়ক)। একাধিক পদবী থাকা সত্ত্বেও কর্মীর মূল বেতন ফিক্সড থাকবে এবং প্রোফাইলে নির্ধারিত একক হারেই হিসাব হবে।"
                  : "Employees can hold multiple simultaneous designations and department portfolios. Fixed single salary is maintained."}
              </p>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shrink-0 shadow-sm">
              একক ফিক্সড বেতন নীতি বলবৎ
            </div>
          </div>

          {/* Multi-Role Staff Cards & Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {multiRoleStaff.map((emp) => (
              <div
                key={emp.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:border-teal-500/40 transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatarUrl}
                      alt={emp.fullName}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-500 shadow-md shadow-teal-500/20"
                    />
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{emp.fullName}</span>
                        {emp.isCeoOrOwner && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                            CEO / OWNER
                          </span>
                        )}
                      </h4>
                      <p className="text-xs font-bold text-teal-600 dark:text-teal-400">
                        {emp.designationTitle}
                      </p>
                      <span className="text-[11px] text-slate-400">{emp.branchName}</span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-400">
                    {emp.employeeCode}
                  </span>
                </div>

                {/* Additional Designations Tags */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                    অতিরিক্ত পদবী ও দায়িত্ব (Additional Designations):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {emp.additionalDesignations && emp.additionalDesignations.length > 0 ? (
                      emp.additionalDesignations.map((title) => (
                        <span
                          key={title}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-teal-500/15 text-teal-800 dark:text-teal-200 border border-teal-500/30 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3 h-3 text-teal-600" />
                          <span>{title}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">কোনো অতিরিক্ত পদবী নেই</span>
                    )}
                  </div>
                </div>

                {/* Departments / Portfolios Assigned */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                    সংযুক্ত বিভাগ ও কর্মসূচিসমূহ:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {emp.departmentName} (মূল বিভাগ)
                    </span>
                    {emp.additionalDepartments?.map((dept) => (
                      <span
                        key={dept}
                        className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      >
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Salary & Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">নির্ধারিত মাসিক মোট বেতন (ফিক্সড)</span>
                    <strong className="text-base font-black text-slate-900 dark:text-white font-mono">
                      ৳{emp.salary.grossSalary.toLocaleString()}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {onEditEmployee && (
                      <button
                        type="button"
                        onClick={() => onEditEmployee(emp)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950 text-slate-700 dark:text-slate-200 hover:text-teal-700 dark:hover:text-teal-300 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>পদবী পরিবর্তন</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD RELIEF PROGRAM */}
      {showAddProgramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-2xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-600 flex items-center justify-center font-bold">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    নতুন ত্রাণ ও মানবিক কর্মসূচি প্রণয়ন
                  </h3>
                  <p className="text-xs text-slate-500">ওয়াটার ওয়েল, শীতবস্ত্র, খাদ্য বা আশ্রয় সহায়তা প্রকল্প</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProgramModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  কর্মসূচির শিরোনাম (Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: আর্সেনিকমুক্ত নিরাপদ পানির গভীর নলকূপ প্রকল্প"
                  value={newProgName}
                  onChange={(e) => setNewProgName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ক্যাটাগরি *
                  </label>
                  <select
                    value={newProgCategory}
                    onChange={(e) => setNewProgCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="WATER_WELL">ওয়াটার ওয়েল / নলকূপ স্থাপন</option>
                    <option value="WINTER_AID">শীতবস্ত্র ও কম্বল বিতরণ</option>
                    <option value="FOOD_DISTRIBUTION">জরুরি খাদ্য ও পুষ্টি সহায়তা</option>
                    <option value="EDUCATION_SUPPORT">শিক্ষা ও এতিম সহায়তা</option>
                    <option value="SHELTER_HOUSING">গৃহহীনদের আশ্রয় ও ঘর নির্মাণ</option>
                    <option value="OTHER">অন্যান্য মানবিক সেবা</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    লক্ষ্যমাত্রা জেলাসমূহ (কমা দিয়ে লিখুন)
                  </label>
                  <input
                    type="text"
                    placeholder="সুনামগঞ্জ, কুড়িগ্রাম, কক্সবাজার"
                    value={newProgDistricts}
                    onChange={(e) => setNewProgDistricts(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    বরাদ্দ বাজেট (টাকা)
                  </label>
                  <input
                    type="number"
                    value={newProgBudget}
                    onChange={(e) => setNewProgBudget(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    লক্ষ্যমাত্রা ইউনিট সংখ্যা
                  </label>
                  <input
                    type="number"
                    value={newProgUnits}
                    onChange={(e) => setNewProgUnits(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ইউনিট লেবেল
                  </label>
                  <input
                    type="text"
                    value={newProgUnitLabel}
                    onChange={(e) => setNewProgUnitLabel(e.target.value)}
                    placeholder="টি নলকূপ / পরিবার"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    প্রজেক্ট ম্যানেজার নির্বাচন
                  </label>
                  <select
                    value={newProgManager}
                    onChange={(e) => setNewProgManager(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.fullName}>
                        {emp.fullName} ({emp.designationTitle})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ফিল্ড অপারেশন লিড নির্বাচন
                  </label>
                  <select
                    value={newProgFieldLead}
                    onChange={(e) => setNewProgFieldLead(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.fullName}>
                        {emp.fullName} ({emp.branchName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  কর্মসূচির বিবরণ ও উদ্দেশ্য
                </label>
                <textarea
                  rows={3}
                  value={newProgDescription}
                  onChange={(e) => setNewProgDescription(e.target.value)}
                  placeholder="কর্মসূচির মূল উদ্দেশ্য ও কার্যক্রম সংক্ষেপে লিখুন..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddProgramModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/20 cursor-pointer"
                >
                  কর্মসূচি সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TRAINING CENTER */}
      {showAddCenterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-600 flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    নতুন জেলা প্রশিক্ষণ একাডেমি প্রতিষ্ঠা
                  </h3>
                  <p className="text-xs text-slate-500">ব্রাঞ্চের অধীনে ভোকেশনাল কারিগরি ট্রেনিং সেন্টার</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCenterModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrainingCenter} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  প্রশিক্ষণ কেন্দ্রের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বগুড়া জেলা কারিগরি ও আইটি প্রশিক্ষণ কেন্দ্র"
                  value={newCenterName}
                  onChange={(e) => setNewCenterName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    সংযুক্ত জেলা ব্রাঞ্চ *
                  </label>
                  <select
                    value={newCenterBranchId}
                    onChange={(e) => setNewCenterBranchId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    জেলা / অঞ্চল *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: বগুড়া / কুমিল্লা"
                    value={newCenterDistrict}
                    onChange={(e) => setNewCenterDistrict(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    কেন্দ্র প্রধান / লিড ট্রেইনার
                  </label>
                  <input
                    type="text"
                    placeholder="নাম লিখুন"
                    value={newCenterLead}
                    onChange={(e) => setNewCenterLead(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    যোগাযোগ নম্বর
                  </label>
                  <input
                    type="text"
                    value={newCenterPhone}
                    onChange={(e) => setNewCenterPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ঠিকানা
                </label>
                <input
                  type="text"
                  placeholder="উপজেলা, রোড নং, জেলা"
                  value={newCenterAddress}
                  onChange={(e) => setNewCenterAddress(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCenterModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/20 cursor-pointer"
                >
                  প্রশিক্ষণ কেন্দ্র সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
