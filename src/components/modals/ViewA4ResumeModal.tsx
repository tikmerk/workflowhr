import React, { useRef } from "react";
import {
  X,
  Printer,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  User,
  Shield,
  FileText,
  Heart,
  CheckCircle2,
  Building,
} from "lucide-react";
import { Employee, EmployeeCVData } from "../../types";
import { useCompanyBranding } from "../../context/CompanyBrandingContext";

interface ViewA4ResumeModalProps {
  employee: Employee;
  isOpen?: boolean;
  onClose: () => void;
  onEditCV?: () => void;
  onOpenEdit?: () => void;
  isBangla?: boolean;
}

export const ViewA4ResumeModal: React.FC<ViewA4ResumeModalProps> = ({
  employee,
  isOpen = true,
  onClose,
  onEditCV,
  onOpenEdit,
  isBangla = true,
}) => {
  const { branding } = useCompanyBranding();
  const printContentRef = useRef<HTMLDivElement>(null);
  const handleEdit = onEditCV || onOpenEdit;

  if (isOpen === false) return null;

  const cv: EmployeeCVData = employee.cvData || {
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
    currentOrganization: branding.companyName || "Organization",
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
        organizationName: branding.companyName || "Organization",
        durationYears: `${employee.joiningDate} - Present`,
        responsibilities: "Responsible for operations, workflow coordination and department objectives.",
      },
    ],
    computerSkills: [
      "MS Word & Excel",
      "PowerPoint",
      "Google Workspace",
      "Data Entry & Reporting",
      "Email & Web Communication",
    ],
    languages: [
      { id: "lang-1", language: "Bengali (বাংলা)", proficiency: "EXCELLENT" },
      { id: "lang-2", language: "English (ইংরেজি)", proficiency: "MEDIUM" },
    ],
    summary: `${employee.fullName} is a dedicated professional currently serving as ${employee.designationTitle} at ${branding.companyName || employee.branchName || "Organization"}. Known for strong work ethics, dependability, and structured approach towards organizational excellence.`,
  };

  const handlePrint = () => {
    window.print();
  };

  const getProficiencyLabel = (level: string) => {
    switch (level) {
      case "EXCELLENT":
        return isBangla ? "চমৎকার (Excellent)" : "Excellent";
      case "MEDIUM":
        return isBangla ? "মধ্যম (Medium)" : "Medium";
      case "NOVICE":
        return isBangla ? "প্রাথমিক (Novice)" : "Novice";
      default:
        return level;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      {/* Container with print styles */}
      <div className="relative w-full max-w-4xl bg-slate-100 dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] my-auto border border-slate-300 dark:border-slate-800">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="print:hidden flex items-center justify-between px-5 py-3.5 bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-750 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {isBangla ? "অফিসিয়াল রিজিউমে / সিভি (A4 ফরম্যাট)" : "Official Resume / CV (A4 Format)"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {employee.fullName} • {employee.employeeCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {handleEdit && (
              <button
                type="button"
                onClick={handleEdit}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                {isBangla ? "সিভি এডিট করুন" : "Edit CV"}
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isBangla ? "প্রিন্ট / PDF ডাউনলোড" : "Print / Download PDF"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area with A4 paper frame */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 flex justify-center bg-slate-200/80 dark:bg-slate-950/70">
          <div
            id="printable-a4-resume"
            ref={printContentRef}
            className="w-full max-w-[210mm] bg-white text-slate-900 shadow-2xl rounded-sm p-6 sm:p-10 font-sans leading-normal border border-slate-300 print:border-0 print:shadow-none print:m-0 print:p-8 print:w-full"
            style={{ minHeight: "297mm" }}
          >
            {/* Header: Organization & Identity */}
            <div className="flex items-start justify-between border-b-2 border-teal-700 pb-5 mb-5 gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
                  {cv.fullName || employee.fullName}
                </h1>
                <div className="text-sm sm:text-base font-bold text-teal-800 mt-0.5">
                  {cv.currentDesignation || employee.designationTitle}
                </div>
                <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span>
                    {cv.currentDepartment || employee.departmentName} — {cv.currentOrganization || branding.companyName}
                  </span>
                </div>

                {/* Quick Contacts */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 mt-2.5">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>{cv.mobile || employee.phone}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>{cv.email || employee.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>{cv.presentAddress || employee.presentAddress || "Dhaka, Bangladesh"}</span>
                  </div>
                </div>
              </div>

              {/* Photo & ID Badge */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-lg border-2 border-teal-700 overflow-hidden shadow-xs bg-slate-100">
                  <img
                    src={employee.avatarUrl}
                    alt={employee.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500 mt-1">
                  ID: {employee.employeeCode}
                </span>
              </div>
            </div>

            {/* Profile Summary */}
            {cv.summary && (
              <div className="mb-5">
                <h2 className="text-xs font-black uppercase tracking-wider text-teal-900 border-b border-teal-200 pb-1 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-700" />
                  <span>{isBangla ? "ক্যারিয়ার সারসংক্ষেপ (Summary)" : "Career Summary"}</span>
                </h2>
                <p className="text-xs text-slate-700 leading-relaxed text-justify">
                  {cv.summary}
                </p>
              </div>
            )}

            {/* Two-Column Structured Section: Left (Personal Info) / Right (Professional) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
              {/* Left Column: Personal Information */}
              <div className="md:col-span-1 space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-teal-900 border-b border-teal-300 pb-1 mb-2.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-teal-700" />
                    <span>{isBangla ? "ব্যক্তিগত বিবরণী" : "Personal Details"}</span>
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold">
                        {isBangla ? "পিতার নাম:" : "Father's Name:"}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {cv.fatherName || employee.fatherName || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold">
                        {isBangla ? "মাতার নাম:" : "Mother's Name:"}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {cv.motherName || employee.motherName || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold">
                        {isBangla ? "জন্ম তারিখ:" : "Date of Birth:"}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {cv.dateOfBirth || employee.dateOfBirth || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold">
                        {isBangla ? "উচ্চতা:" : "Height:"}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {cv.height || employee.height || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold">
                        {isBangla ? "রক্তের গ্রুপ:" : "Blood Group:"}
                      </span>
                      <span className="font-bold text-rose-700">
                        {cv.bloodGroup || employee.bloodGroup || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold">
                        {isBangla ? "ধর্ম:" : "Religion:"}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {cv.religion || employee.religion || "Islam"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold">
                        {isBangla ? "বৈবাহিক অবস্থা:" : "Marital Status:"}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {cv.maritalStatus || employee.maritalStatus || "SINGLE"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold">
                        {isBangla ? "এনআইডি নাম্বার:" : "National ID (NID):"}
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {cv.nidNumber || employee.nidNumber || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold">
                        {isBangla ? "যোগদানের তারিখ:" : "Joining Date:"}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {cv.joiningDate || employee.joiningDate}
                      </span>
                    </div>
                    <div className="pt-1 border-t border-slate-200">
                      <span className="text-slate-500 block text-[10px] font-bold">
                        {isBangla ? "বর্তমান ঠিকানা:" : "Present Address:"}
                      </span>
                      <span className="font-normal text-slate-800 leading-tight">
                        {cv.presentAddress || employee.presentAddress || "—"}
                      </span>
                    </div>
                    <div className="pt-1 border-t border-slate-200">
                      <span className="text-slate-500 block text-[10px] font-bold">
                        {isBangla ? "স্থায়ী ঠিকানা:" : "Permanent Address:"}
                      </span>
                      <span className="font-normal text-slate-800 leading-tight">
                        {cv.permanentAddress || employee.permanentAddress || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* NID Card Document Status */}
                {(employee.nidCardFrontUrl || cv.nidCardFrontUrl) && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-teal-800 flex items-center gap-1 mb-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{isBangla ? "এনআইডি কপি সংযুক্ত" : "NID Card Attached"}</span>
                    </span>
                    <div className="w-full h-14 rounded border border-slate-300 overflow-hidden bg-white">
                      <img
                        src={cv.nidCardFrontUrl || employee.nidCardFrontUrl}
                        alt="NID Front"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Work Experience & Education */}
              <div className="md:col-span-2 space-y-5">
                {/* Work Experience */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-teal-900 border-b border-teal-300 pb-1 mb-2.5 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-teal-700" />
                    <span>{isBangla ? "কর্মঅভিজ্ঞতা (Work Experience)" : "Work Experience"}</span>
                  </h3>
                  <div className="space-y-3">
                    {cv.experiences && cv.experiences.length > 0 ? (
                      cv.experiences.map((exp, idx) => (
                        <div key={exp.id || idx} className="border-l-2 border-teal-600 pl-3 py-0.5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900">{exp.designation}</h4>
                            <span className="text-[10.5px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                              {exp.durationYears}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-700">
                            {exp.organizationName}
                          </div>
                          {exp.responsibilities && (
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                              {exp.responsibilities}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 italic">
                        {isBangla ? "কোনো পূর্ব অভিজ্ঞতা যুক্ত করা হয়নি" : "No experience entries recorded"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Educational Qualifications Table */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-teal-900 border-b border-teal-300 pb-1 mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-teal-700" />
                    <span>{isBangla ? "শিক্ষাগত যোগ্যতা (Educational Qualifications)" : "Educational Qualifications"}</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-800">
                          <th className="p-1.5 font-bold">{isBangla ? "ডিগ্রী" : "Degree"}</th>
                          <th className="p-1.5 font-bold">{isBangla ? "বিভাগ / গ্রুপ" : "Subject/Group"}</th>
                          <th className="p-1.5 font-bold">{isBangla ? "প্রতিষ্ঠান" : "Institution"}</th>
                          <th className="p-1.5 font-bold">{isBangla ? "বোর্ড/ভার্সিটি" : "Board/Univ"}</th>
                          <th className="p-1.5 font-bold">{isBangla ? "ফলাফল" : "Result"}</th>
                          <th className="p-1.5 font-bold">{isBangla ? "সাল" : "Year"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {cv.educations && cv.educations.length > 0 ? (
                          cv.educations.map((edu, idx) => (
                            <tr key={edu.id || idx} className="hover:bg-slate-50/80">
                              <td className="p-1.5 font-bold text-slate-900">{edu.degreeName}</td>
                              <td className="p-1.5 text-slate-700">{edu.subjectOrGroup}</td>
                              <td className="p-1.5 text-slate-700">{edu.institution}</td>
                              <td className="p-1.5 text-slate-600">{edu.boardOrUniversity}</td>
                              <td className="p-1.5 font-bold text-teal-800">{edu.result}</td>
                              <td className="p-1.5 font-semibold text-slate-700">{edu.passingYear}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-2 text-center text-slate-400 italic">
                              {isBangla ? "শিক্ষাগত যোগ্যতা যুক্ত করা হয়নি" : "No education data available"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Skills Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Computer Skills */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-teal-900 border-b border-teal-200 pb-1 mb-2 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-teal-700" />
                      <span>{isBangla ? "কম্পিউটার স্কিলস" : "Computer Skills"}</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {cv.computerSkills && cv.computerSkills.length > 0 ? (
                        cv.computerSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 text-[10.5px] font-semibold"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          {isBangla ? "স্কিল যুক্ত করা হয়নি" : "No computer skills specified"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Language Skills */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-teal-900 border-b border-teal-200 pb-1 mb-2 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-teal-700" />
                      <span>{isBangla ? "ভাষা দক্ষতা" : "Language Skills"}</span>
                    </h4>
                    <div className="space-y-1 text-[11px]">
                      {cv.languages && cv.languages.length > 0 ? (
                        cv.languages.map((lang, idx) => (
                          <div key={lang.id || idx} className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{lang.language}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200">
                              {getProficiencyLabel(lang.proficiency)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          {isBangla ? "ভাষা দক্ষতা দেওয়া হয়নি" : "No languages listed"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Declaration & Verification Footer */}
            <div className="mt-6 pt-5 border-t border-slate-300 text-xs">
              <p className="text-[11px] text-slate-600 text-justify leading-snug">
                {isBangla
                  ? "আমি অঙ্গীকার করছি যে উপরে প্রদত্ত সমস্ত বিবরণী ও তথ্য আমার জ্ঞান ও বিশ্বাসমতে সত্য এবং সঠিক।"
                  : "I hereby declare that all the information provided in this curriculum vitae is true and correct to the best of my knowledge and belief."}
              </p>

              <div className="flex items-end justify-between mt-8 pt-2">
                <div className="text-[10.5px] text-slate-500">
                  <span>{isBangla ? "তারিখ:" : "Date:"} </span>
                  <span className="font-semibold text-slate-700">
                    {new Date().toLocaleDateString(isBangla ? "bn-BD" : "en-GB", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div className="text-center">
                  <div className="w-40 border-b border-slate-400 pb-1 mb-1">
                    {employee.savedSignatureUrl ? (
                      <img
                        src={employee.savedSignatureUrl}
                        alt="Signature"
                        className="h-8 mx-auto object-contain"
                      />
                    ) : (
                      <span className="font-serif italic text-slate-700 text-xs">{cv.fullName || employee.fullName}</span>
                    )}
                  </div>
                  <span className="text-[10.5px] font-bold text-slate-700 block">
                    {isBangla ? "আবেদনকারীর স্বাক্ষর" : "Candidate Signature"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
