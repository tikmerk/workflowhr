import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Printer,
  Download,
  Loader2,
  CheckCircle2,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  User,
  FileText,
  Building,
  CreditCard,
  Droplet,
  ExternalLink,
} from "lucide-react";
import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import { Employee, EmployeeCVData } from "../../types";
import { useCompanyBranding } from "../../context/CompanyBrandingContext";
import { getDefaultCareerObjective } from "../../utils/cvDefaults";
import { ViewNidCardModal } from "./ViewNidCardModal";

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
  const [showNidModal, setShowNidModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (isOpen === false) return null;

  // Fallback or existing CV data
  const cv: EmployeeCVData = employee.cvData || {
    fullName: employee.fullName,
    fatherName: employee.fatherName || "",
    motherName: employee.motherName || "",
    mobile: employee.phone,
    email: employee.email,
    presentAddress: employee.presentAddress || "",
    permanentAddress: employee.permanentAddress || "",
    socialLink: employee.socialLink || (employee as any).linkedinUrl || "",
    linkedinUrl: employee.socialLink || (employee as any).linkedinUrl || "",
    nidNumber: employee.nidNumber || "",
    bloodGroup: employee.bloodGroup || "O+",
    dateOfBirth: employee.dateOfBirth || "",
    height: employee.height || "",
    gender: employee.gender || "MALE",
    nationality: employee.nationality || "Bangladeshi",
    maritalStatus: employee.maritalStatus || "SINGLE",
    religion: employee.religion || "Islam",
    joiningDate: employee.joiningDate,
    currentDesignation: employee.designationTitle,
    currentDepartment: employee.departmentName,
    currentOrganization: branding.companyName || "Organization",
    educations: [],
    experiences: [],
    computerSkills: [],
    professionalSkills: [
      "Team Leadership & Management",
      "Time Management & Punctuality",
      "Problem Solving & Adaptability",
      "Work Ethics & Patience",
      "Effective Communication"
    ],
    languages: [],
    summary: getDefaultCareerObjective(false),
    signatureUrl: employee.savedSignatureUrl || employee.signatureUrl,
  };

  // Ensure summary always has high-quality professional text
  const careerObjective = cv.summary && cv.summary.trim().length > 10
    ? cv.summary
    : getDefaultCareerObjective(false);

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn("window.print failed, downloading PDF directly:", e);
      handleDownloadPDF();
    }
  };

  const handleDownloadPDF = async () => {
    if (!printContentRef.current) return;
    try {
      setIsDownloadingPdf(true);
      setDownloadSuccess(false);

      // Brief delay to ensure fonts and layout settle
      await new Promise((resolve) => setTimeout(resolve, 150));

      const element = printContentRef.current;

      const imgData = await toJpeg(element, {
        quality: 0.96,
        pixelRatio: 2.5,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = 210;
      const pdfHeight = 297;

      const elWidth = element.offsetWidth || 794;
      const elHeight = element.offsetHeight || 1123;
      const ratio = elHeight / elWidth;
      const calculatedHeight = pdfWidth * ratio;

      if (calculatedHeight <= pdfHeight) {
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, calculatedHeight, undefined, "FAST");
      } else {
        const scale = pdfHeight / calculatedHeight;
        if (scale > 0.82) {
          const fittedWidth = pdfWidth * scale;
          const xOffset = (pdfWidth - fittedWidth) / 2;
          pdf.addImage(imgData, "JPEG", xOffset, 0, fittedWidth, pdfHeight, undefined, "FAST");
        } else {
          let heightLeft = calculatedHeight;
          let position = 0;
          pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, calculatedHeight, undefined, "FAST");
          heightLeft -= pdfHeight;

          while (heightLeft > 0) {
            position = heightLeft - calculatedHeight;
            pdf.addPage();
            pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, calculatedHeight, undefined, "FAST");
            heightLeft -= pdfHeight;
          }
        }
      }

      const rawName = cv.fullName || employee.fullName || "Candidate";
      const cleanName = rawName.trim().replace(/[^a-zA-Z0-9_\u0980-\u09FF]/g, "_");
      const filename = `CV_${cleanName}_${employee.employeeCode || "A4"}.pdf`;
      pdf.save(filename);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error("PDF generation failed:", err);
      try {
        window.print();
      } catch (printErr) {
        console.error("Print fallback also failed:", printErr);
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const getProficiencyLabel = (level: string) => {
    switch (level) {
      case "EXCELLENT":
        return "Fluent";
      case "MEDIUM":
        return "Working";
      case "NOVICE":
        return "Basic";
      default:
        return level;
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
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
              {/* Separate NID Document View Button */}
              <button
                type="button"
                onClick={() => setShowNidModal(true)}
                className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800 flex items-center gap-1.5 transition-all cursor-pointer"
                title={isBangla ? "এনআইডি কার্ড আলাদা দেখুন ও ডাউনলোড করুন" : "View & Download NID separately"}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isBangla ? "এনআইডি কার্ড দেখুন / ডাউনলোড" : "View NID Card"}</span>
              </button>

              {handleEdit && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  {isBangla ? "সিভি এডিট করুন" : "Edit CV"}
                </button>
              )}

              {/* High-Resolution A4 PDF Download Button */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isDownloadingPdf}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-75 text-white text-xs font-bold shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                title={isBangla ? "এ৪ সাইজের পিডিএফ ফাইল সরাসরি ডাউনলোড করুন" : "Download high-quality A4 PDF"}
              >
                {isDownloadingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isBangla ? "পিডিএফ হচ্ছে..." : "Generating..."}</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>{isBangla ? "ডাউনলোড সম্পন্ন!" : "Downloaded!"}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>{isBangla ? "PDF ডাউনলোড" : "Download PDF"}</span>
                  </>
                )}
              </button>

              {/* Direct Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title={isBangla ? "প্রিন্ট করুন" : "Print directly"}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isBangla ? "প্রিন্ট" : "Print"}</span>
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

          {/* Scrollable Preview Area with A4 paper frame - Locked 210mm width */}
          <div className="flex-1 overflow-x-auto overflow-y-auto p-2 sm:p-5 flex justify-start md:justify-center bg-slate-200/80 dark:bg-slate-950/70">
            <div
              id="printable-a4-resume"
              ref={printContentRef}
              className="bg-white text-slate-900 shadow-xl rounded-sm p-6 sm:p-8 font-sans border border-slate-300 print:border-0 print:shadow-none print:m-0 print:p-6"
              style={{
                width: "210mm",
                minWidth: "210mm",
                maxWidth: "210mm",
                minHeight: "297mm",
                boxSizing: "border-box",
              }}
            >
              
              {/* 1. Header: Organization, Candidate & Passport Photo */}
              <div className="flex items-start justify-between border-b-2 border-teal-700 pb-3 mb-3 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold tracking-widest text-teal-700 uppercase mb-0.5">
                    CURRICULUM VITAE
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                    {cv.fullName || employee.fullName}
                  </h1>
                  <div className="text-sm font-bold text-teal-800 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>{cv.currentDesignation || employee.designationTitle}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-700 font-semibold">{cv.currentDepartment || employee.departmentName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">{cv.currentOrganization || branding.companyName}</span>
                  </div>

                  {/* Horizontal Compact Contact Bar (Top present address removed as requested) */}
                  <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] text-slate-600 mt-2 font-medium">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-teal-700 shrink-0" />
                      <span>{cv.mobile || employee.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-teal-700 shrink-0" />
                      <span>{cv.email || employee.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-teal-700 shrink-0" />
                      <span>NID: <strong className="text-slate-800">{cv.nidNumber || employee.nidNumber || "—"}</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Droplet className="w-3 h-3 text-rose-600 shrink-0" />
                      <span>Blood: <strong className="text-slate-800">{cv.bloodGroup || employee.bloodGroup || "—"}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Candidate Photo */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-20 h-24 rounded border-2 border-teal-700 overflow-hidden shadow-xs bg-slate-100">
                    <img
                      src={employee.avatarUrl}
                      alt={employee.fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[9.5px] font-mono font-bold text-slate-500 mt-1">
                    ID: {employee.employeeCode}
                  </span>
                </div>
              </div>

              {/* 2. Career Objective (Expanded & Professional in English) */}
              <div className="mb-3">
                <h2 className="text-[11px] font-black uppercase tracking-wider text-teal-900 border-b border-teal-300 pb-0.5 mb-1 flex items-center gap-1.5">
                  <User className="w-3 h-3 text-teal-700" />
                  <span>Career Objective</span>
                </h2>
                <p className="text-[11px] text-slate-700 leading-snug text-justify font-normal">
                  {careerObjective}
                </p>
              </div>

              {/* 3. Work Experience */}
              <div className="mb-3">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-teal-900 border-b border-teal-300 pb-0.5 mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3 text-teal-700" />
                  <span>Work Experience</span>
                </h3>
                <div className="space-y-1.5">
                  {cv.experiences && cv.experiences.length > 0 ? (
                    cv.experiences.map((exp, idx) => (
                      <div key={exp.id || idx} className="border-l-2 border-teal-600 pl-2.5 py-0.5">
                        <div className="flex items-center justify-between text-[11.5px]">
                          <div>
                            <span className="font-bold text-slate-900">{exp.designation}</span>
                            <span className="text-slate-400 mx-1.5">|</span>
                            <span className="font-semibold text-slate-700">{exp.organizationName}</span>
                          </div>
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded">
                            {exp.durationYears}
                          </span>
                        </div>
                        {exp.responsibilities && (
                          <p className="text-[10.5px] text-slate-600 leading-tight mt-0.5">
                            {exp.responsibilities}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-[10.5px] text-slate-400 italic py-1">
                      No prior work experience recorded yet.
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Educational Qualifications Table */}
              <div className="mb-3">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-teal-900 border-b border-teal-300 pb-0.5 mb-1 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-teal-700" />
                  <span>Academic Qualifications</span>
                </h3>
                <div className="w-full overflow-hidden border border-slate-300 rounded">
                  <table className="w-full text-left border-collapse text-[10.5px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-800">
                        <th className="py-1 px-2 font-bold">Exam / Degree</th>
                        <th className="py-1 px-2 font-bold">Subject / Group</th>
                        <th className="py-1 px-2 font-bold">Institution</th>
                        <th className="py-1 px-2 font-bold">Board / University</th>
                        <th className="py-1 px-2 font-bold text-center">Result</th>
                        <th className="py-1 px-2 font-bold text-center">Passing Year</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {cv.educations && cv.educations.length > 0 ? (
                        cv.educations.map((edu, idx) => (
                          <tr key={edu.id || idx} className="hover:bg-slate-50/70">
                            <td className="py-1 px-2 font-bold text-slate-900">{edu.degreeName}</td>
                            <td className="py-1 px-2 text-slate-700">{edu.subjectOrGroup}</td>
                            <td className="py-1 px-2 text-slate-700">{edu.institution}</td>
                            <td className="py-1 px-2 text-slate-600">{edu.boardOrUniversity}</td>
                            <td className="py-1 px-2 font-bold text-teal-800 text-center">{edu.result}</td>
                            <td className="py-1 px-2 font-semibold text-slate-700 text-center">{edu.passingYear}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-2.5 text-center text-slate-400 italic">
                            No educational qualifications recorded yet. Please edit CV to add your academic degrees.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. Parallel Structured Section: Personal Details & Skills/Languages */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                
                {/* Left: Personal Particulars */}
                <div className="md:col-span-7 bg-slate-50/90 p-2.5 rounded border border-slate-200">
                  <h4 className="text-[10.5px] font-black uppercase tracking-wider text-teal-900 border-b border-teal-200 pb-0.5 mb-1.5 flex items-center gap-1">
                    <User className="w-3 h-3 text-teal-700" />
                    <span>Personal Particulars</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-x-2.5 gap-y-1.5 text-[10.5px]">
                    <div>
                      <span className="text-slate-500 text-[9px] block font-bold">Father's Name:</span>
                      <span className="font-semibold text-slate-900 leading-tight block">{cv.fatherName || employee.fatherName || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[9px] block font-bold">Mother's Name:</span>
                      <span className="font-semibold text-slate-900 leading-tight block">{cv.motherName || employee.motherName || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[9px] block font-bold">Date of Birth:</span>
                      <span className="font-semibold text-slate-900">{cv.dateOfBirth || employee.dateOfBirth || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[9px] block font-bold">Gender / Sex:</span>
                      <span className="font-semibold text-slate-900">{cv.gender || employee.gender || "Male"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[9px] block font-bold">Marital Status:</span>
                      <span className="font-semibold text-slate-900">{cv.maritalStatus || employee.maritalStatus || "SINGLE"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[9px] block font-bold">Blood Group:</span>
                      <span className="font-bold text-rose-700">{cv.bloodGroup || employee.bloodGroup || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[9px] block font-bold">Height (উচ্চতা):</span>
                      <span className="font-semibold text-slate-900">{cv.height || employee.height || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[9px] block font-bold">Religion:</span>
                      <span className="font-semibold text-slate-900">{cv.religion || employee.religion || "Islam"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[9px] block font-bold">Nationality:</span>
                      <span className="font-semibold text-slate-900">{cv.nationality || employee.nationality || "Bangladeshi (By Birth)"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[9px] block font-bold">National ID (NID):</span>
                      <span className="font-mono font-bold text-slate-900">{cv.nidNumber || employee.nidNumber || "—"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 text-[9px] block font-bold">Emergency Contact:</span>
                      <span className="font-mono font-semibold text-slate-800">{employee.emergencyPhone || cv.mobile || employee.phone || "—"}</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-200">
                      <span className="text-slate-500 text-[9px] block font-bold">Present Address:</span>
                      <span className="font-normal text-slate-800 leading-tight block">{cv.presentAddress || employee.presentAddress || "—"}</span>
                    </div>
                    <div className="col-span-2 pt-0.5 border-t border-slate-200">
                      <span className="text-slate-500 text-[9px] block font-bold">Permanent Address:</span>
                      <span className="font-normal text-slate-800 leading-tight block">{cv.permanentAddress || employee.permanentAddress || "—"}</span>
                    </div>
                    {(cv.socialLink || cv.linkedinUrl || employee.socialLink || (employee as any).linkedinUrl) && (
                      <div className="col-span-2 pt-0.5 border-t border-slate-200">
                        <span className="text-slate-500 text-[9px] block font-bold">LinkedIn / Social Profile:</span>
                        <a
                          href={
                            (cv.socialLink || cv.linkedinUrl || employee.socialLink || (employee as any).linkedinUrl).startsWith("http")
                              ? (cv.socialLink || cv.linkedinUrl || employee.socialLink || (employee as any).linkedinUrl)
                              : `https://${cv.socialLink || cv.linkedinUrl || employee.socialLink || (employee as any).linkedinUrl}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1.5 break-all text-[10px] mt-0.5"
                        >
                          <Globe className="w-3 h-3 text-teal-600 shrink-0" />
                          <span className="truncate max-w-[320px]">
                            {cv.socialLink || cv.linkedinUrl || employee.socialLink || (employee as any).linkedinUrl}
                          </span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Professional & Management Skills, Computer Skills & Languages */}
                <div className="md:col-span-5 flex flex-col justify-between space-y-2">
                  {/* Professional & Management Skills (Official Competencies) */}
                  <div className="bg-slate-50/90 p-2 rounded border border-slate-200">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-teal-900 border-b border-teal-200 pb-0.5 mb-1 flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-teal-700" />
                      <span>Professional & Management Skills</span>
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {cv.professionalSkills && cv.professionalSkills.length > 0 ? (
                        cv.professionalSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 rounded bg-white border border-teal-200 text-teal-900 text-[9.5px] font-semibold"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        [
                          "Leadership & Teamwork",
                          "Time Management & Punctuality",
                          "Problem Solving & Adaptability",
                          "Work Ethics & Patience",
                          "Interpersonal Communication",
                        ].map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 rounded bg-white border border-teal-200 text-teal-900 text-[9.5px] font-semibold"
                          >
                            {skill}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Computer & Technical Skills */}
                  <div className="bg-slate-50/90 p-2 rounded border border-slate-200 flex-1">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-teal-900 border-b border-teal-200 pb-0.5 mb-1 flex items-center gap-1">
                      <Award className="w-3 h-3 text-teal-700" />
                      <span>Computer & Technical Skills</span>
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {cv.computerSkills && cv.computerSkills.length > 0 ? (
                        cv.computerSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 rounded bg-white border border-slate-300 text-slate-800 text-[9.5px] font-semibold"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-[9.5px] text-slate-400 italic">No specific skills listed</span>
                      )}
                    </div>
                  </div>

                  {/* Language Proficiency */}
                  <div className="bg-slate-50/90 p-2 rounded border border-slate-200 flex-1">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-teal-900 border-b border-teal-200 pb-0.5 mb-1 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-teal-700" />
                      <span>Language Proficiency</span>
                    </h4>
                    <div className="space-y-0.5 text-[10px]">
                      {cv.languages && cv.languages.length > 0 ? (
                        cv.languages.map((lang, idx) => (
                          <div key={lang.id || idx} className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{lang.language}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200">
                              {getProficiencyLabel(lang.proficiency)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[9.5px] text-slate-400 italic">No language skills recorded</span>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* 6. Declaration & Candidate Signature Footer */}
              <div className="pt-2.5 border-t border-slate-300 mt-2">
                <p className="text-[10px] text-slate-600 text-justify leading-tight">
                  I solemnly declare that the particulars and information given above are true, complete and correct to the best of my knowledge and belief.
                </p>

                <div className="flex items-end justify-between mt-3 pt-1">
                  <div className="text-[10px] text-slate-600 space-y-0.5">
                    <div>
                      <span className="font-semibold">Date: </span>
                      <span>
                        {new Date().toLocaleDateString("en-GB", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="text-center flex flex-col items-center">
                    <div className="w-44 border-b border-slate-400 pb-0.5 mb-1 flex flex-col items-center justify-end min-h-[42px]">
                      {(employee.savedSignatureUrl || employee.signatureUrl || cv.signatureUrl) ? (
                        <>
                          <img
                            src={employee.savedSignatureUrl || employee.signatureUrl || cv.signatureUrl}
                            alt="Candidate Signature"
                            className="h-7 max-h-8 max-w-[140px] object-contain mb-0.5"
                          />
                          <span className="text-[9.5px] text-slate-800 font-semibold tracking-wide">
                            {cv.fullName || employee.fullName}
                          </span>
                        </>
                      ) : (
                        <span className="font-serif italic text-slate-800 text-xs font-semibold pb-0.5">
                          {cv.fullName || employee.fullName}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-800 block">
                      Candidate Signature
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Standalone NID Document Modal */}
      {showNidModal && (
        <ViewNidCardModal
          employee={employee}
          isOpen={showNidModal}
          onClose={() => setShowNidModal(false)}
          onOpenEditCV={handleEdit}
          isBangla={isBangla}
        />
      )}
    </>,
    document.body
  );
};
