import React, { useState, useRef } from "react";
import {
  X,
  Save,
  Plus,
  Trash2,
  Upload,
  Camera,
  FileText,
  User,
  GraduationCap,
  Briefcase,
  Award,
  Globe,
  CheckCircle2,
  Building2,
  Calendar,
  Sparkles,
} from "lucide-react";
import {
  Employee,
  EmployeeCVData,
  EducationQualification,
  WorkExperience,
  LanguageSkill,
} from "../../types";

interface EditEmployeeCVModalProps {
  employee: Employee;
  isOpen?: boolean;
  onClose: () => void;
  onSaveCV?: (updatedEmployee: Employee) => void;
  onSaveSuccess?: (updatedEmployee: Employee) => void;
  isBangla?: boolean;
}

const DEFAULT_COMPUTER_SKILLS = [
  "MS Word",
  "MS Excel",
  "PowerPoint",
  "Google Workspace",
  "Data Entry & Fast Typing",
  "Internet & Email Management",
  "Graphic Design (Photoshop/Canva)",
  "Social Media Management",
  "Tally / Accounting Software",
  "Basic Hardware & Networking",
];

export const EditEmployeeCVModal: React.FC<EditEmployeeCVModalProps> = ({
  employee,
  isOpen = true,
  onClose,
  onSaveCV,
  onSaveSuccess,
  isBangla = true,
}) => {
  if (isOpen === false) return null;
  const nidFrontInputRef = useRef<HTMLInputElement | null>(null);
  const nidBackInputRef = useRef<HTMLInputElement | null>(null);

  // Existing or initialized CV data
  const existingCV: EmployeeCVData = employee.cvData || {
    fullName: employee.fullName,
    fatherName: employee.fatherName || "",
    motherName: employee.motherName || "",
    mobile: employee.phone,
    email: employee.email,
    presentAddress: employee.presentAddress || "",
    permanentAddress: employee.permanentAddress || "",
    nidNumber: employee.nidNumber || "",
    bloodGroup: employee.bloodGroup || "O+",
    dateOfBirth: employee.dateOfBirth || "",
    height: employee.height || "",
    maritalStatus: employee.maritalStatus || "SINGLE",
    religion: employee.religion || "Islam",
    joiningDate: employee.joiningDate,
    currentDesignation: employee.designationTitle,
    currentDepartment: employee.departmentName,
    currentOrganization: employee.branchName ? `${employee.branchName} Organization` : "Organization",
    educations: [
      {
        id: "edu-1",
        degreeName: "Bachelor of Science (B.Sc)",
        subjectOrGroup: "Computer Science & Engineering",
        institution: "University of Dhaka",
        boardOrUniversity: "Dhaka University",
        result: "3.75 / 4.00",
        passingYear: "2020",
      },
      {
        id: "edu-2",
        degreeName: "Higher Secondary Certificate (HSC)",
        subjectOrGroup: "Science",
        institution: "Dhaka City College",
        boardOrUniversity: "Dhaka Board",
        result: "GPA 5.00",
        passingYear: "2016",
      },
    ],
    experiences: [
      {
        id: "exp-1",
        designation: employee.designationTitle,
        organizationName: employee.branchName || "Current Organization",
        durationYears: `${employee.joiningDate} - Present`,
        responsibilities: "Assigned duties and operations management.",
      },
    ],
    computerSkills: [
      "MS Word",
      "MS Excel",
      "PowerPoint",
      "Google Workspace",
      "Data Entry & Fast Typing",
    ],
    languages: [
      { id: "lang-1", language: "Bengali (বাংলা)", proficiency: "EXCELLENT" },
      { id: "lang-2", language: "English (ইংরেজি)", proficiency: "MEDIUM" },
    ],
    summary: `${employee.fullName} is an active employee at this organization.`,
  };

  // State management
  const [activeTab, setActiveTab] = useState<"personal" | "education" | "experience" | "skills" | "documents">("personal");

  // Form fields
  const [fullName, setFullName] = useState(existingCV.fullName || employee.fullName);
  const [fatherName, setFatherName] = useState(existingCV.fatherName || employee.fatherName || "");
  const [motherName, setMotherName] = useState(existingCV.motherName || employee.motherName || "");
  const [mobile, setMobile] = useState(existingCV.mobile || employee.phone);
  const [email, setEmail] = useState(existingCV.email || employee.email);
  const [presentAddress, setPresentAddress] = useState(existingCV.presentAddress || employee.presentAddress || "");
  const [permanentAddress, setPermanentAddress] = useState(existingCV.permanentAddress || employee.permanentAddress || "");
  const [nidNumber, setNidNumber] = useState(existingCV.nidNumber || employee.nidNumber || "");
  const [bloodGroup, setBloodGroup] = useState(existingCV.bloodGroup || employee.bloodGroup || "O+");
  const [dateOfBirth, setDateOfBirth] = useState(existingCV.dateOfBirth || employee.dateOfBirth || "");
  const [height, setHeight] = useState(existingCV.height || employee.height || "");
  const [maritalStatus, setMaritalStatus] = useState<"SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED">(
    existingCV.maritalStatus || employee.maritalStatus || "SINGLE"
  );
  const [religion, setReligion] = useState(existingCV.religion || employee.religion || "Islam");
  const [joiningDate, setJoiningDate] = useState(existingCV.joiningDate || employee.joiningDate);
  const [currentDesignation, setCurrentDesignation] = useState(existingCV.currentDesignation || employee.designationTitle);
  const [currentDepartment, setCurrentDepartment] = useState(existingCV.currentDepartment || employee.departmentName);
  const [currentOrganization, setCurrentOrganization] = useState(existingCV.currentOrganization || employee.branchName || "Corporate Head Office");
  const [summary, setSummary] = useState(existingCV.summary || "");

  // Educations array
  const [educations, setEducations] = useState<EducationQualification[]>(
    existingCV.educations && existingCV.educations.length > 0 ? existingCV.educations : []
  );

  // Experiences array
  const [experiences, setExperiences] = useState<WorkExperience[]>(
    existingCV.experiences && existingCV.experiences.length > 0 ? existingCV.experiences : []
  );

  // Skills
  const [computerSkills, setComputerSkills] = useState<string[]>(existingCV.computerSkills || []);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [languages, setLanguages] = useState<LanguageSkill[]>(
    existingCV.languages && existingCV.languages.length > 0
      ? existingCV.languages
      : [
          { id: "lang-1", language: "Bengali (বাংলা)", proficiency: "EXCELLENT" },
          { id: "lang-2", language: "English (ইংরেজি)", proficiency: "MEDIUM" },
        ]
  );

  // NID uploads
  const [nidCardFrontUrl, setNidCardFrontUrl] = useState<string>(
    employee.nidCardFrontUrl || existingCV.nidCardFrontUrl || ""
  );
  const [nidCardBackUrl, setNidCardBackUrl] = useState<string>(
    employee.nidCardBackUrl || existingCV.nidCardBackUrl || ""
  );

  if (!isOpen) return null;

  // Handlers for Educations
  const handleAddEducation = () => {
    const newEdu: EducationQualification = {
      id: `edu-${Date.now()}`,
      degreeName: "",
      subjectOrGroup: "",
      institution: "",
      boardOrUniversity: "",
      result: "",
      passingYear: new Date().getFullYear().toString(),
    };
    setEducations([...educations, newEdu]);
  };

  const handleUpdateEducation = (id: string, field: keyof EducationQualification, value: string) => {
    setEducations(
      educations.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu))
    );
  };

  const handleRemoveEducation = (id: string) => {
    setEducations(educations.filter((edu) => edu.id !== id));
  };

  // Handlers for Experiences
  const handleAddExperience = () => {
    const newExp: WorkExperience = {
      id: `exp-${Date.now()}`,
      designation: "",
      organizationName: "",
      durationYears: "1 Year",
      responsibilities: "",
    };
    setExperiences([...experiences, newExp]);
  };

  const handleUpdateExperience = (id: string, field: keyof WorkExperience, value: string) => {
    setExperiences(
      experiences.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
  };

  const handleRemoveExperience = (id: string) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  // Handlers for Computer Skills
  const toggleComputerSkill = (skill: string) => {
    if (computerSkills.includes(skill)) {
      setComputerSkills(computerSkills.filter((s) => s !== skill));
    } else {
      setComputerSkills([...computerSkills, skill]);
    }
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (trimmed && !computerSkills.includes(trimmed)) {
      setComputerSkills([...computerSkills, trimmed]);
      setCustomSkillInput("");
    }
  };

  // Handlers for Languages
  const handleAddLanguage = () => {
    const newLang: LanguageSkill = {
      id: `lang-${Date.now()}`,
      language: "",
      proficiency: "MEDIUM",
    };
    setLanguages([...languages, newLang]);
  };

  const handleUpdateLanguage = (id: string, field: keyof LanguageSkill, value: any) => {
    setLanguages(
      languages.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const handleRemoveLanguage = (id: string) => {
    setLanguages(languages.filter((l) => l.id !== id));
  };

  // NID Image file handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isFront: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        if (isFront) {
          setNidCardFrontUrl(dataUrl);
        } else {
          setNidCardBackUrl(dataUrl);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Save full CV & sync back to Employee object
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const compiledCVData: EmployeeCVData = {
      fullName,
      fatherName,
      motherName,
      mobile,
      email,
      presentAddress,
      permanentAddress,
      nidNumber,
      nidCardFrontUrl,
      nidCardBackUrl,
      bloodGroup,
      dateOfBirth,
      height,
      maritalStatus,
      religion,
      joiningDate,
      currentDesignation,
      currentDepartment,
      currentOrganization,
      summary,
      educations,
      experiences,
      computerSkills,
      languages,
      lastUpdatedAt: new Date().toISOString(),
    };

    const updatedEmployee: Employee = {
      ...employee,
      fullName: fullName.trim() || employee.fullName,
      fatherName: fatherName.trim() || employee.fatherName,
      motherName: motherName.trim() || employee.motherName,
      phone: mobile.trim() || employee.phone,
      email: email.trim() || employee.email,
      presentAddress: presentAddress.trim() || employee.presentAddress,
      permanentAddress: permanentAddress.trim() || employee.permanentAddress,
      nidNumber: nidNumber.trim() || employee.nidNumber,
      bloodGroup: bloodGroup as any,
      dateOfBirth: dateOfBirth || employee.dateOfBirth,
      height: height.trim() || employee.height,
      maritalStatus,
      religion: religion.trim() || employee.religion,
      joiningDate: joiningDate || employee.joiningDate,
      nidCardFrontUrl,
      nidCardBackUrl,
      cvData: compiledCVData,
    };

    if (onSaveCV) onSaveCV(updatedEmployee);
    if (onSaveSuccess) onSaveSuccess(updatedEmployee);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isBangla ? "সিভি / রিজিউমে আপডেট করুন" : "Update Curriculum Vitae (CV)"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {employee.fullName} • {employee.employeeCode}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 gap-2 overflow-x-auto text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("personal")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "personal"
                ? "border-teal-500 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <User className="w-4 h-4" />
            <span>{isBangla ? "ব্যক্তিগত তথ্য" : "Personal Info"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("education")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "education"
                ? "border-teal-500 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{isBangla ? "শিক্ষাগত যোগ্যতা" : "Education"}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px]">
              {educations.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("experience")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "experience"
                ? "border-teal-500 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>{isBangla ? "কর্মঅভিজ্ঞতা" : "Experience"}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px]">
              {experiences.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("skills")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "skills"
                ? "border-teal-500 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{isBangla ? "দক্ষতা ও ভাষা" : "Skills & Languages"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "documents"
                ? "border-teal-500 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{isBangla ? "এনআইডি কপি আপলোড" : "NID Card Copy"}</span>
            {(nidCardFrontUrl || nidCardBackUrl) && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            )}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === "personal" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs text-teal-900 dark:text-teal-200">
                {isBangla
                  ? "💡 এই তথ্যগুলো আপনার প্রোফাইল থেকে স্বয়ংক্রিয়ভাবে আনা হয়েছে। সিভির জন্য কোনো তথ্য সংশোধন করতে চাইলে এখানে সরাসরি পরিবর্তন করতে পারবেন।"
                  : "💡 These fields are pre-populated from your profile. You can update or refine them specifically for your CV."}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "পূর্ণ নাম (Full Name)*" : "Full Name*"}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "পিতার নাম (Father's Name)" : "Father's Name"}
                  </label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="পিতার নাম লিখুন"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "মাতার নাম (Mother's Name)" : "Mother's Name"}
                  </label>
                  <input
                    type="text"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    placeholder="মাতার নাম লিখুন"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "মোবাইল নাম্বার*" : "Mobile Number*"}
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "ইমেইল এড্রেস" : "Email Address"}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "জাতীয় পরিচয়পত্র (NID) নম্বর*" : "National ID (NID)*"}
                  </label>
                  <input
                    type="text"
                    value={nidNumber}
                    onChange={(e) => setNidNumber(e.target.value)}
                    placeholder="e.g. 1990123456789"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "রক্তের গ্রুপ" : "Blood Group"}
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "জন্ম তারিখ" : "Date of Birth"}
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "উচ্চতা (Height)" : "Height"}
                  </label>
                  <input
                    type="text"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="যেমন: 5' 7'' বা 170 cm"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "বৈবাহিক অবস্থা" : "Marital Status"}
                  </label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="SINGLE">{isBangla ? "অবিবাহিত (Single)" : "Single"}</option>
                    <option value="MARRIED">{isBangla ? "বিবাহিত (Married)" : "Married"}</option>
                    <option value="DIVORCED">{isBangla ? "তালাকপ্রাপ্ত (Divorced)" : "Divorced"}</option>
                    <option value="WIDOWED">{isBangla ? "বিধবা/বিপত্নীক (Widowed)" : "Widowed"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "ধর্ম (Religion)" : "Religion"}
                  </label>
                  <input
                    type="text"
                    value={religion}
                    onChange={(e) => setReligion(e.target.value)}
                    placeholder="e.g. Islam / Hinduism / Christianity"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "প্রতিষ্ঠানে যোগদানের তারিখ" : "Joining Date in Org"}
                  </label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              {/* Current Role in Organization */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>{isBangla ? "প্রতিষ্ঠানে বর্তমান পদবী ও পরিচয় (সিভিতে প্রদর্শিত হবে)" : "Current Position in Organization"}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                      {isBangla ? "পদবী (Designation)" : "Designation"}
                    </label>
                    <input
                      type="text"
                      value={currentDesignation}
                      onChange={(e) => setCurrentDesignation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                      {isBangla ? "বিভাগ (Department)" : "Department"}
                    </label>
                    <input
                      type="text"
                      value={currentDepartment}
                      onChange={(e) => setCurrentDepartment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                      {isBangla ? "প্রতিষ্ঠান (Organization)" : "Organization"}
                    </label>
                    <input
                      type="text"
                      value={currentOrganization}
                      onChange={(e) => setCurrentOrganization(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "বর্তমান ঠিকানা (Present Address)*" : "Present Address*"}
                  </label>
                  <textarea
                    rows={2}
                    value={presentAddress}
                    onChange={(e) => setPresentAddress(e.target.value)}
                    required
                    placeholder="বাড়ি, রাস্তা, থানা, জেলা"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium resize-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "স্থায়ী ঠিকানা (Permanent Address)" : "Permanent Address"}
                  </label>
                  <textarea
                    rows={2}
                    value={permanentAddress}
                    onChange={(e) => setPermanentAddress(e.target.value)}
                    placeholder="গ্রাম, ডাকঘর, থানা, জেলা"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium resize-none"
                  />
                </div>
              </div>

              {/* Career Objective / Summary */}
              <div className="text-xs">
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {isBangla ? "ক্যারিয়ার সারসংক্ষেপ / উদ্দেশ্য (Career Objective / Summary)" : "Career Summary"}
                </label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="আপনার কাজের লক্ষ্য ও অভিজ্ঞতা সম্পর্কে সংক্ষিপ্ত বিবরণ..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: EDUCATIONAL QUALIFICATIONS */}
          {activeTab === "education" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isBangla ? "শিক্ষাগত যোগ্যতার তালিকা" : "Educational Qualifications"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isBangla ? "এসএসসি, এইচএসসি, অনার্স, মাস্টার্স ইত্যাদি যোগ করুন" : "Add your degrees and academic records"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddEducation}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isBangla ? "নতুন ডিগ্রী যোগ করুন" : "Add Education"}</span>
                </button>
              </div>

              {educations.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                  {isBangla ? "এখনো কোনো শিক্ষাগত যোগ্যতা যোগ করা হয়নি। উপরের বাটনে ক্লিক করে যোগ করুন।" : "No education records added yet."}
                </div>
              ) : (
                <div className="space-y-3">
                  {educations.map((edu, idx) => (
                    <div
                      key={edu.id || idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4" />
                          <span>{isBangla ? `ডিগ্রী #${idx + 1}` : `Degree #${idx + 1}`}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEducation(edu.id)}
                          className="text-rose-500 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                            {isBangla ? "ডিগ্রী (Degree)*" : "Degree Name*"}
                          </label>
                          <input
                            type="text"
                            value={edu.degreeName}
                            onChange={(e) => handleUpdateEducation(edu.id, "degreeName", e.target.value)}
                            placeholder="e.g. B.Sc, SSC, HSC"
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                            {isBangla ? "বিভাগ / গ্রুপ (Subject/Group)" : "Subject / Major"}
                          </label>
                          <input
                            type="text"
                            value={edu.subjectOrGroup}
                            onChange={(e) => handleUpdateEducation(edu.id, "subjectOrGroup", e.target.value)}
                            placeholder="e.g. Science / CSE / Arts"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                            {isBangla ? "প্রতিষ্ঠান (Institution)*" : "Institution*"}
                          </label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => handleUpdateEducation(edu.id, "institution", e.target.value)}
                            placeholder="স্কুল / কলেজ / বিশ্ববিদ্যালয়ের নাম"
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                            {isBangla ? "বোর্ড / বিশ্ববিদ্যালয়" : "Board / University"}
                          </label>
                          <input
                            type="text"
                            value={edu.boardOrUniversity}
                            onChange={(e) => handleUpdateEducation(edu.id, "boardOrUniversity", e.target.value)}
                            placeholder="e.g. Dhaka Board / National University"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                            {isBangla ? "ফলাফল (Result)*" : "Result / GPA*"}
                          </label>
                          <input
                            type="text"
                            value={edu.result}
                            onChange={(e) => handleUpdateEducation(edu.id, "result", e.target.value)}
                            placeholder="e.g. GPA 5.00 / 3.75"
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                            {isBangla ? "পাসের সাল (Passing Year)*" : "Passing Year*"}
                          </label>
                          <input
                            type="text"
                            value={edu.passingYear}
                            onChange={(e) => handleUpdateEducation(edu.id, "passingYear", e.target.value)}
                            placeholder="e.g. 2020"
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WORK EXPERIENCE */}
          {activeTab === "experience" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isBangla ? "পূর্ববর্তী ও বর্তমান কাজের অভিজ্ঞতা" : "Work Experience History"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isBangla ? "প্রতিষ্ঠানের নাম, পদবী ও সময়কাল উল্লেখ করুন" : "Add previous or current positions"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isBangla ? "নতুন অভিজ্ঞতা যোগ করুন" : "Add Experience"}</span>
                </button>
              </div>

              {experiences.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                  {isBangla ? "কোনো কাজের অভিজ্ঞতা যোগ করা হয়নি। উপরের বাটনে ক্লিক করে যোগ করতে পারেন।" : "No work experiences recorded."}
                </div>
              ) : (
                <div className="space-y-3">
                  {experiences.map((exp, idx) => (
                    <div
                      key={exp.id || idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4" />
                          <span>{isBangla ? `অভিজ্ঞতা #${idx + 1}` : `Experience #${idx + 1}`}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(exp.id)}
                          className="text-rose-500 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                            {isBangla ? "পদবী (Designation)*" : "Designation*"}
                          </label>
                          <input
                            type="text"
                            value={exp.designation}
                            onChange={(e) => handleUpdateExperience(exp.id, "designation", e.target.value)}
                            placeholder="যেমন: সিনিয়র অফিসার / এক্সিকিউটিভ"
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                            {isBangla ? "প্রতিষ্ঠানের নাম*" : "Organization Name*"}
                          </label>
                          <input
                            type="text"
                            value={exp.organizationName}
                            onChange={(e) => handleUpdateExperience(exp.id, "organizationName", e.target.value)}
                            placeholder="প্রতিষ্ঠানের নাম লিখুন"
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                            {isBangla ? "সময়কাল / বছর*" : "Duration / Years*"}
                          </label>
                          <input
                            type="text"
                            value={exp.durationYears}
                            onChange={(e) => handleUpdateExperience(exp.id, "durationYears", e.target.value)}
                            placeholder="e.g. 2 Years / 2022 - 2024"
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                            {isBangla ? "দায়িত্ব ও কাজের বিবরণ" : "Key Responsibilities"}
                          </label>
                          <input
                            type="text"
                            value={exp.responsibilities || ""}
                            onChange={(e) => handleUpdateExperience(exp.id, "responsibilities", e.target.value)}
                            placeholder="প্রধান প্রধান দায়িত্বসমূহ সংক্ষেপে লিখুন..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SKILLS & LANGUAGES */}
          {activeTab === "skills" && (
            <div className="space-y-6">
              {/* Computer Skills */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span>{isBangla ? "কম্পিউটার ও আইটি দক্ষতা (সিলেক্ট করুন)" : "Computer Skills"}</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isBangla ? "নিচের তালিকা থেকে ক্লিক করে নির্বাচন করুন অথবা নতুন স্কিল লিখুন" : "Select from list or add custom skills"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {DEFAULT_COMPUTER_SKILLS.map((skill) => {
                    const isSelected = computerSkills.includes(skill);
                    return (
                      <button
                        type="button"
                        key={skill}
                        onClick={() => toggleComputerSkill(skill)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-500/50"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {skill}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Skill Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    placeholder={isBangla ? "অন্যান্য কম্পিউটার স্কিল লিখুন (যেমন: ERP, CRM...)" : "Add custom computer skill"}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomSkill(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isBangla ? "যোগ করুন" : "Add"}
                  </button>
                </div>

                {/* Selected Skills Chips */}
                {computerSkills.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10.5px] font-bold text-slate-500 block mb-1.5">
                      {isBangla ? "নির্বাচিত কম্পিউটার স্কিলস:" : "Active Computer Skills:"}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {computerSkills.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-lg bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30 text-xs font-medium flex items-center gap-1"
                        >
                          <span>{s}</span>
                          <button
                            type="button"
                            onClick={() => toggleComputerSkill(s)}
                            className="text-teal-600 hover:text-rose-500 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Language Skills */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span>{isBangla ? "ভাষা দক্ষতা ও পারদর্শিতার মাত্রা" : "Language Proficiency"}</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isBangla ? "ভাষা এবং দক্ষতার লেভেল (চমৎকার/মধ্যম/প্রাথমিক) উল্লেখ করুন" : "Add languages and fluency levels"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddLanguage}
                    className="px-3 py-1 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isBangla ? "ভাষা যোগ" : "Add Language"}</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {languages.map((lang, idx) => (
                    <div
                      key={lang.id || idx}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <input
                        type="text"
                        value={lang.language}
                        onChange={(e) => handleUpdateLanguage(lang.id, "language", e.target.value)}
                        placeholder="ভাষার নাম লিখুন (e.g. বাংলা, English, العربية)"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                      />
                      <select
                        value={lang.proficiency}
                        onChange={(e) => handleUpdateLanguage(lang.id, "proficiency", e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                      >
                        <option value="EXCELLENT">{isBangla ? "চমৎকার (Excellent)" : "Excellent"}</option>
                        <option value="MEDIUM">{isBangla ? "মধ্যম (Medium)" : "Medium"}</option>
                        <option value="NOVICE">{isBangla ? "প্রাথমিক (Novice)" : "Novice"}</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguage(lang.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NID CARD COPY UPLOADS */}
          {activeTab === "documents" && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-xs text-teal-900 dark:text-teal-200">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>{isBangla ? "অফিসিয়াল এনআইডি কার্ড কপি সংরক্ষণ" : "Official NID Document Archiving"}</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed">
                  {isBangla
                    ? "এখানে জাতীয় পরিচয়পত্রের সম্মুখ ও পেছনের কপি আপলোড করে রাখুন। এটি সফটওয়্যারে সংরক্ষিত থাকবে এবং আপনার অফিসিয়াল ডকুমেন্টেশনের সাথে সংযুক্ত থাকবে।"
                    : "Upload clear photo/scan of National ID card front and back. These are securely archived with your employment file."}
                </p>
              </div>

              {/* Hidden file inputs */}
              <input
                type="file"
                ref={nidFrontInputRef}
                onChange={(e) => handleFileUpload(e, true)}
                accept="image/*"
                className="hidden"
              />
              <input
                type="file"
                ref={nidBackInputRef}
                onChange={(e) => handleFileUpload(e, false)}
                accept="image/*"
                className="hidden"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* NID Front */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center space-y-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isBangla ? "এনআইডি কার্ড (সম্মুখভাগ / Front)" : "NID Card (Front Side)"}
                  </span>

                  {nidCardFrontUrl ? (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner group">
                      <img
                        src={nidCardFrontUrl}
                        alt="NID Front"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => nidFrontInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-teal-600 text-white text-xs font-bold cursor-pointer"
                        >
                          {isBangla ? "পরিবর্তন" : "Change"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setNidCardFrontUrl("")}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                        >
                          {isBangla ? "মুছে ফেলুন" : "Remove"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => nidFrontInputRef.current?.click()}
                      className="w-full h-40 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 flex flex-col items-center justify-center cursor-pointer transition-colors p-4"
                    >
                      <Upload className="w-8 h-8 text-teal-600 dark:text-teal-400 mb-1" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isBangla ? "সামনের ছবি আপলোড করুন" : "Upload Front Image"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG or JPEG</span>
                    </div>
                  )}
                </div>

                {/* NID Back */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center space-y-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isBangla ? "এনআইডি কার্ড (পেছনের ভাগ / Back)" : "NID Card (Back Side)"}
                  </span>

                  {nidCardBackUrl ? (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner group">
                      <img
                        src={nidCardBackUrl}
                        alt="NID Back"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => nidBackInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-teal-600 text-white text-xs font-bold cursor-pointer"
                        >
                          {isBangla ? "পরিবর্তন" : "Change"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setNidCardBackUrl("")}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                        >
                          {isBangla ? "মুছে ফেলুন" : "Remove"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => nidBackInputRef.current?.click()}
                      className="w-full h-40 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 flex flex-col items-center justify-center cursor-pointer transition-colors p-4"
                    >
                      <Upload className="w-8 h-8 text-teal-600 dark:text-teal-400 mb-1" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isBangla ? "পেছনের ছবি আপলোড করুন" : "Upload Back Image"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG or JPEG</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              {isBangla ? "বাতিল" : "Cancel"}
            </button>

            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isBangla ? "সিভি সংরক্ষণ করুন" : "Save & Update CV"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
