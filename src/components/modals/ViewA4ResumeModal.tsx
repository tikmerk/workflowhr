import React, { useRef, useState, useEffect } from "react";
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
  CreditCard,
  Droplet,
  ExternalLink,
  PenTool,
  Edit3,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  RotateCcw,
  Upload,
} from "lucide-react";
import { toJpeg, toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Employee, EmployeeCVData } from "../../types";
import { useCompanyBranding } from "../../context/CompanyBrandingContext";
import { getDefaultCareerObjective } from "../../utils/cvDefaults";
import { compressSignatureImage } from "../../utils/imageCompression";
import { saveEmployeeToFirestore } from "../../services/firestoreService";
import { mockDepartments, mockDesignations } from "../../data/mockDatabase";
import { ViewNidCardModal } from "./ViewNidCardModal";

interface ViewA4ResumeModalProps {
  employee: Employee;
  isOpen?: boolean;
  onClose: () => void;
  onEditCV?: () => void;
  onOpenEdit?: () => void;
  onUpdateEmployee?: (updated: Employee) => void;
  isBangla?: boolean;
}

export const ViewA4ResumeModal: React.FC<ViewA4ResumeModalProps> = ({
  employee,
  isOpen = true,
  onClose,
  onEditCV,
  onOpenEdit,
  onUpdateEmployee,
  isBangla = true,
}) => {
  const { branding } = useCompanyBranding();
  const printContentRef = useRef<HTMLDivElement>(null);
  const signatureSectionRef = useRef<HTMLDivElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const signatureFileInputRef = useRef<HTMLInputElement | null>(null);

  // Active employee state for immediate responsiveness upon inline edits
  const [currentEmp, setCurrentEmp] = useState<Employee>(employee);

  // Keep local state in sync when parent employee prop changes
  useEffect(() => {
    setCurrentEmp(employee);
  }, [employee]);

  // Locked Zoom scaling for A4 paper: default 0.76 (fits standard screens perfectly)
  const [zoomLevel, setZoomLevel] = useState<number>(0.76);

  const handleEdit = onEditCV || onOpenEdit;
  const [showNidModal, setShowNidModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Quick Position Edit Modal states
  const [showQuickEditModal, setShowQuickEditModal] = useState(false);
  const [editDesigInput, setEditDesigInput] = useState("");
  const [editDeptInput, setEditDeptInput] = useState("");
  const [editOrgInput, setEditOrgInput] = useState("");
  const [savingPosition, setSavingPosition] = useState(false);

  // Signature Upload / Draw Modal states
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureTab, setSignatureTab] = useState<"upload" | "draw">("upload");
  const [tempSignatureData, setTempSignatureData] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnOnCanvas, setHasDrawnOnCanvas] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);

  if (isOpen === false) return null;

  // Lookup accurate department and designation from database if not set or generic
  const desigFromId = currentEmp.designationId
    ? mockDesignations.find((d) => d.id === currentEmp.designationId)?.title
    : undefined;
  const deptFromId = currentEmp.departmentId
    ? mockDepartments.find((d) => d.id === currentEmp.departmentId)?.name
    : undefined;

  // Fallback or existing CV data
  const cv: EmployeeCVData = currentEmp.cvData || {
    fullName: currentEmp.fullName,
    fatherName: currentEmp.fatherName || "Md. Zakir Hossain",
    motherName: currentEmp.motherName || "Shilpi Akter",
    mobile: currentEmp.phone || "+880 1950-508397",
    email: currentEmp.email || "ibrahimshagor@outlook.com",
    presentAddress:
      currentEmp.presentAddress ||
      "House- 4, Road- 1, Block- D, Mohammadpur Future Town, Mohammadpur, Dhaka- 1207",
    permanentAddress: currentEmp.permanentAddress || "131, Bangshal Road, Dhaka- 1100",
    socialLink:
      currentEmp.socialLink ||
      (currentEmp as any).linkedinUrl ||
      "https://www.linkedin.com/in/ibrahimshagorofficial/",
    linkedinUrl:
      currentEmp.socialLink ||
      (currentEmp as any).linkedinUrl ||
      "https://www.linkedin.com/in/ibrahimshagorofficial/",
    nidNumber: currentEmp.nidNumber || "7807587089",
    bloodGroup: currentEmp.bloodGroup || "AB+",
    dateOfBirth: currentEmp.dateOfBirth || "1998-04-22",
    height: currentEmp.height || "5' 7\"",
    gender: currentEmp.gender || "MALE",
    nationality: currentEmp.nationality || "Bangladeshi",
    maritalStatus: currentEmp.maritalStatus || "MARRIED",
    religion: currentEmp.religion || "Islam",
    joiningDate: currentEmp.joiningDate || "2023-09-01",
    currentDesignation: currentEmp.designationTitle || desigFromId || "Manager- IT & HR",
    currentDepartment: currentEmp.departmentName || deptFromId || "HR, IT & Administration Department",
    currentOrganization: branding.companyName || "Muslim Welfare Organization",
    educations: [
      {
        id: "edu-01",
        degreeName: "Master of Business Administration (MBA)",
        subjectOrGroup: "Human Resource Management",
        institution: "School of Business",
        boardOrUniversity: "Presidency University",
        result: "3.94 / 4.00",
        passingYear: "2026",
      },
      {
        id: "edu-02",
        degreeName: "Bachelor of Business Administration (BBA)",
        subjectOrGroup: "Management",
        institution: "Kabi Nazrul Govt. College",
        boardOrUniversity: "University of Dhaka",
        result: "2.80 / 4.00",
        passingYear: "2022",
      },
      {
        id: "edu-03",
        degreeName: "Higher Secondary Certificate (HSC)",
        subjectOrGroup: "Business Studies",
        institution: "BAF Shaheen College, Kurmitola",
        boardOrUniversity: "Dhaka Board",
        result: "4.58 / 5.00",
        passingYear: "2017",
      },
      {
        id: "edu-04",
        degreeName: "Secondary School Certificate (SSC)",
        subjectOrGroup: "Business Studies",
        institution: "Ahmed Bawani Academy School and College",
        boardOrUniversity: "Dhaka Board",
        result: "4.61 / 5.00",
        passingYear: "2015",
      },
    ],
    experiences: [
      {
        id: "exp-01",
        designation: "Manager- IT & HR",
        organizationName: "Muslim Welfare Organization",
        durationYears: "2023-09-01 - Present",
        responsibilities: "Assigned duties and operations management.",
      },
    ],
    computerSkills: [
      "MS Word",
      "MS Excel",
      "PowerPoint",
      "Google Workspace",
      "Data Entry & Fast Typing",
      "Internet & Email Management",
      "Graphic Design (Photoshop/Canva)",
      "Social Media Management",
      "Basic Hardware & Networking",
      "Wordpress",
      "Web Development",
    ],
    professionalSkills: [
      "Team Leadership & Management",
      "Time Management & Punctuality",
      "Problem Solving & Adaptability",
      "Work Ethics & Patience",
      "Effective Communication",
      "Problem Solving & Critical Thinking",
      "Adaptability & Resilience",
      "Strategic Planning & Execution",
      "Interpersonal & Client Communication",
      "Documentation & Reporting",
    ],
    languages: [
      { id: "lang-01", language: "Bengali (বাংলা)", proficiency: "EXCELLENT" },
      { id: "lang-02", language: "English (ইংরেজি)", proficiency: "EXCELLENT" },
      { id: "lang-03", language: "Hindi", proficiency: "MEDIUM" },
    ],
    summary:
      "A dedicated, results-oriented, and highly motivated professional seeking a responsible role to utilize proven organizational, communication, and operational capabilities in supporting corporate objectives. Committed to upholding strict institutional integrity, workplace ethics, and operational diligence while actively collaborating with cross-functional teams to drive continuous organizational excellence, community impact, and sustainable institutional growth in dynamic work environments.",
    signatureUrl: currentEmp.savedSignatureUrl || currentEmp.signatureUrl,
  };

  // Accurate Designation & Department resolution
  const displayDesignation =
    currentEmp.designationTitle ||
    cv.currentDesignation ||
    desigFromId ||
    "Manager- IT & HR";
  const displayDepartment =
    currentEmp.departmentName ||
    cv.currentDepartment ||
    deptFromId ||
    "HR, IT & Administration Department";
  const displayOrganization =
    cv.currentOrganization &&
    cv.currentOrganization !== "Organization" &&
    !cv.currentOrganization.includes("Baridhara")
      ? cv.currentOrganization
      : (branding.companyName || "Muslim Welfare Organization");

  // Effective Signature Image URL
  const effectiveSignature =
    currentEmp.savedSignatureUrl ||
    currentEmp.signatureUrl ||
    cv.signatureUrl;

  // Ensure summary always has high-quality professional text
  const careerObjective =
    cv.summary && cv.summary.trim().length > 10
      ? cv.summary
      : getDefaultCareerObjective(false);

  const scrollToSignature = () => {
    if (signatureSectionRef.current) {
      signatureSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn("window.print failed, downloading PDF directly:", e);
      handleDownloadPDF();
    }
  };

  const handleDownloadPDF = async () => {
    if (!printContentRef.current || isDownloadingPdf) return;
    try {
      setIsDownloadingPdf(true);
      setDownloadSuccess(false);

      // Brief delay to ensure fonts and layout settle
      await new Promise((resolve) => setTimeout(resolve, 200));

      const element = printContentRef.current;

      let imgData: string;
      try {
        imgData = await toJpeg(element, {
          quality: 0.98,
          pixelRatio: 2.5,
          backgroundColor: "#ffffff",
          cacheBust: true,
          skipFonts: true,
          fontEmbedCSS: "",
          filter: (node) => {
            if (node instanceof HTMLElement && node.classList.contains("print:hidden")) {
              return false;
            }
            return true;
          },
        });
      } catch (jpegErr) {
        console.warn("toJpeg failed, attempting toPng fallback:", jpegErr);
        imgData = await toPng(element, {
          pixelRatio: 2.5,
          backgroundColor: "#ffffff",
          cacheBust: true,
          skipFonts: true,
          fontEmbedCSS: "",
          filter: (node) => {
            if (node instanceof HTMLElement && node.classList.contains("print:hidden")) {
              return false;
            }
            return true;
          },
        });
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      // Exactly 210mm x 297mm (fits 1 single A4 page 100% without margin or cutoff)
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");

      const rawName = cv.fullName || currentEmp.fullName || "Candidate";
      const cleanName = rawName.trim().replace(/[^a-zA-Z0-9_\u0980-\u09FF]/g, "_");
      const filename = `CV_${cleanName}_${currentEmp.employeeCode || "A4"}.pdf`;
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

  // Save quick position updates (designation & department)
  const handleSaveQuickPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingPosition(true);
      const newDesig = editDesigInput.trim() || currentEmp.designationTitle || "Officer";
      const newDept = editDeptInput.trim() || currentEmp.departmentName || "Department";
      const newOrg = editOrgInput.trim() || branding.companyName || "Muslim Welfare Organization";

      const updatedEmp: Employee = {
        ...currentEmp,
        designationTitle: newDesig,
        departmentName: newDept,
        cvData: {
          ...cv,
          currentDesignation: newDesig,
          currentDepartment: newDept,
          currentOrganization: newOrg,
        },
      };

      setCurrentEmp(updatedEmp);
      if (onUpdateEmployee) {
        onUpdateEmployee(updatedEmp);
      }
      await saveEmployeeToFirestore(updatedEmp);
      setShowQuickEditModal(false);
    } catch (err) {
      console.error("Failed to save quick position:", err);
    } finally {
      setSavingPosition(false);
    }
  };

  // Canvas drawing handlers for signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawnOnCanvas(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnOnCanvas(false);
  };

  // File upload handler for signature
  const handleSignatureFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (uploadEvt) => {
      const rawDataUrl = uploadEvt.target?.result as string;
      if (rawDataUrl) {
        try {
          const compressed = await compressSignatureImage(rawDataUrl);
          setTempSignatureData(compressed);
        } catch {
          setTempSignatureData(rawDataUrl);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Save new signature to employee
  const handleSaveSignature = async () => {
    let finalSignatureUrl: string | null = null;

    if (signatureTab === "upload" && tempSignatureData) {
      finalSignatureUrl = tempSignatureData;
    } else if (signatureTab === "draw" && signatureCanvasRef.current && hasDrawnOnCanvas) {
      const canvasData = signatureCanvasRef.current.toDataURL("image/png");
      try {
        finalSignatureUrl = await compressSignatureImage(canvasData);
      } catch {
        finalSignatureUrl = canvasData;
      }
    }

    if (!finalSignatureUrl) return;

    try {
      setSavingSignature(true);
      const updatedEmp: Employee = {
        ...currentEmp,
        savedSignatureUrl: finalSignatureUrl,
        signatureUrl: finalSignatureUrl,
        cvData: {
          ...cv,
          signatureUrl: finalSignatureUrl,
        },
      };

      setCurrentEmp(updatedEmp);
      if (onUpdateEmployee) {
        onUpdateEmployee(updatedEmp);
      }
      await saveEmployeeToFirestore(updatedEmp);
      setShowSignatureModal(false);
      setTempSignatureData(null);
    } catch (err) {
      console.error("Failed to save digital signature:", err);
    } finally {
      setSavingSignature(false);
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs overflow-hidden animate-in fade-in duration-200">
        {/* Modal Container */}
        <div className="relative w-full max-w-5xl bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[94vh] border border-slate-700/80">
          
          {/* Top Control Bar (Hidden when printing) */}
          <div className="print:hidden flex items-center justify-between px-4 sm:px-5 py-2.5 bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-750 shrink-0 gap-2 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="truncate">
                <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {isBangla ? "অফিসিয়াল রিজিউমে / সিভি (১-পেইজ A4)" : "Official Resume / CV (1-Page A4)"}
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                  {currentEmp.fullName} • {currentEmp.employeeCode}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Zoom Controls to Keep A4 Locked & Perfectly Sized */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.08))}
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-teal-600 cursor-pointer rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-all"
                  title={isBangla ? "জুম আউট" : "Zoom Out"}
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(0.76)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    zoomLevel === 0.76
                      ? "bg-teal-600 text-white shadow-xs"
                      : "text-slate-700 dark:text-slate-300 hover:text-teal-600"
                  }`}
                  title={isBangla ? "স্ক্রিনে ফিট করুন (A4 লক ভিউ)" : "Fit A4 to Screen"}
                >
                  {isBangla ? "স্ক্রিন ফিট" : "Fit"}
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1.0)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    zoomLevel === 1.0
                      ? "bg-teal-600 text-white shadow-xs"
                      : "text-slate-700 dark:text-slate-300 hover:text-teal-600"
                  }`}
                  title={isBangla ? "১০০% প্রকৃত A4 সাইজ" : "100% Actual A4 Size"}
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => Math.min(1.3, prev + 0.08))}
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-teal-600 cursor-pointer rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-all"
                  title={isBangla ? "জুম ইন" : "Zoom In"}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Digital Signature Upload/Draw Action */}
              <button
                type="button"
                onClick={() => setShowSignatureModal(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 transition-all cursor-pointer"
                title={isBangla ? "সিগনেচার ছবি আপলোড বা স্ক্রিনে ড্র করুন" : "Upload or draw signature"}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isBangla ? "স্বাক্ষর দিন" : "Signature"}</span>
              </button>

              {/* Separate NID Document View Button */}
              <button
                type="button"
                onClick={() => setShowNidModal(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800 flex items-center gap-1.5 transition-all cursor-pointer"
                title={isBangla ? "এনআইডি কার্ড আলাদা দেখুন ও ডাউনলোড করুন" : "View & Download NID separately"}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{isBangla ? "এনআইডি কার্ড" : "NID Card"}</span>
              </button>

              {handleEdit && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  {isBangla ? "সম্পূর্ণ সিভি এডিট" : "Edit All"}
                </button>
              )}

              {/* High-Resolution A4 PDF Download Button */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isDownloadingPdf}
                className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-75 text-white text-xs font-bold shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                title={isBangla ? "এ৪ সাইজের পিডিএফ ফাইল সরাসরি ডাউনলোড করুন" : "Download high-quality A4 PDF"}
              >
                {isDownloadingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isBangla ? "পিডিএফ..." : "PDF..."}</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>{isBangla ? "ডাউনলোড সম্পন্ন!" : "Done!"}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>{isBangla ? "Download PDF" : "Download PDF"}</span>
                  </>
                )}
              </button>

              {/* Direct Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title={isBangla ? "প্রিন্ট করুন" : "Print directly"}
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isBangla ? "Print" : "Print"}</span>
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

          {/* Locked A4 Sheet Viewport with Clean Background & Centered Paper Canvas */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start bg-slate-950/80">
            
            {/* Wrapper holding the scaled A4 document to preserve bounding box */}
            <div
              style={{
                width: `${210 * zoomLevel}mm`,
                height: `${297 * zoomLevel}mm`,
                minWidth: `${210 * zoomLevel}mm`,
                minHeight: `${297 * zoomLevel}mm`,
                overflow: "hidden",
                transition: "width 0.15s ease-out, height 0.15s ease-out",
              }}
              className="shrink-0 flex items-start justify-start shadow-2xl rounded"
            >
              <div
                id="printable-a4-resume"
                ref={printContentRef}
                style={{
                  width: "210mm",
                  minWidth: "210mm",
                  maxWidth: "210mm",
                  height: "297mm",
                  minHeight: "297mm",
                  maxHeight: "297mm",
                  boxSizing: "border-box",
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "top left",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  padding: "12mm 14mm 10mm 14mm",
                  overflow: "hidden",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
                className="bg-white text-slate-900 flex flex-col justify-between select-text"
              >
                
                {/* Upper Document Content */}
                <div>
                  {/* 1. Header: Organization, Candidate & Passport Photo */}
                  <div className="flex items-start justify-between border-b-2 border-teal-700 pb-2.5 mb-2.5 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10.5px] font-extrabold tracking-[0.2em] text-teal-700 uppercase mb-0.5">
                        CURRICULUM VITAE
                      </div>
                      <h1 className="text-[22px] font-black text-slate-900 tracking-tight uppercase leading-tight truncate">
                        {cv.fullName || currentEmp.fullName}
                      </h1>
                      
                      {/* Position, Department & Organization Display with Quick Edit Action */}
                      <div className="text-[11.5px] font-bold text-teal-800 mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-teal-900">{displayDesignation}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-700 font-semibold">{displayDepartment}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">{displayOrganization}</span>

                        {/* Quick Edit Position Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditDesigInput(displayDesignation);
                            setEditDeptInput(displayDepartment);
                            setEditOrgInput(displayOrganization);
                            setShowQuickEditModal(true);
                          }}
                          className="print:hidden ml-1 px-1.5 py-0.2 rounded bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-[9px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          title={isBangla ? "উপরে প্রদর্শিত পদবী ও বিভাগ সংশোধন করুন" : "Quick edit designation & department"}
                        >
                          <Edit3 className="w-2.5 h-2.5 text-teal-600" />
                          <span>{isBangla ? "Edit" : "Edit"}</span>
                        </button>
                      </div>

                      {/* Horizontal Compact Contact Bar */}
                      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-0.5 text-[10.5px] text-slate-600 mt-1.5 font-medium">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-teal-700 shrink-0" />
                          <span>{cv.mobile || currentEmp.phone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-teal-700 shrink-0" />
                          <span>{cv.email || currentEmp.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-teal-700 shrink-0" />
                          <span>NID: <strong className="text-slate-900">{cv.nidNumber || currentEmp.nidNumber || "—"}</strong></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Droplet className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>Blood: <strong className="text-rose-700 font-bold">{cv.bloodGroup || currentEmp.bloodGroup || "—"}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Candidate Photo with Exact Aspect Ratio Matching Reference */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-[74px] h-[90px] rounded border-2 border-teal-700 overflow-hidden shadow-xs bg-slate-100">
                        <img
                          src={currentEmp.avatarUrl}
                          alt={currentEmp.fullName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[9px] font-mono font-bold text-slate-500 mt-1">
                        ID: {currentEmp.employeeCode}
                      </span>
                    </div>
                  </div>

                  {/* 2. Career Objective */}
                  <div className="mb-2.5">
                    <h2 className="text-[11px] font-black uppercase tracking-wider text-teal-800 border-b border-teal-300 pb-0.5 mb-1 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-teal-700" />
                      <span>CAREER OBJECTIVE</span>
                    </h2>
                    <p className="text-[10px] text-slate-700 leading-normal text-justify font-normal">
                      {careerObjective}
                    </p>
                  </div>

                  {/* 3. Work Experience */}
                  <div className="mb-2.5">
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-teal-800 border-b border-teal-300 pb-0.5 mb-1.5 flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3 text-teal-700" />
                      <span>WORK EXPERIENCE</span>
                    </h3>
                    <div className="space-y-1">
                      {cv.experiences && cv.experiences.length > 0 ? (
                        cv.experiences.map((exp, idx) => (
                          <div key={exp.id || idx} className="border-l-[3px] border-teal-600 pl-2.5 py-0.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <div>
                                <span className="font-bold text-slate-900">{exp.designation}</span>
                                <span className="text-slate-400 mx-1.5">|</span>
                                <span className="font-semibold text-slate-700">{exp.organizationName}</span>
                              </div>
                              <span className="text-[9.5px] font-bold text-teal-800 bg-teal-50 border border-teal-300 px-1.5 py-0.2 rounded">
                                {exp.durationYears}
                              </span>
                            </div>
                            {exp.responsibilities && (
                              <p className="text-[9.5px] text-slate-600 leading-tight mt-0.5">
                                {exp.responsibilities}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-[9.5px] text-slate-400 italic py-0.5">
                          No prior work experience recorded yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. Educational Qualifications Table */}
                  <div className="mb-2.5">
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-teal-800 border-b border-teal-300 pb-0.5 mb-1 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-teal-700" />
                      <span>ACADEMIC QUALIFICATIONS</span>
                    </h3>
                    <div className="w-full overflow-hidden border border-slate-300 rounded">
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-300 text-slate-800">
                            <th className="py-1 px-2 font-bold">Exam / Degree</th>
                            <th className="py-1 px-2 font-bold">Subject / Group</th>
                            <th className="py-1 px-2 font-bold">Institution</th>
                            <th className="py-1 px-2 font-bold">Board / University</th>
                            <th className="py-1 px-2 font-bold text-center">Result</th>
                            <th className="py-1 px-2 font-bold text-center">Year</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {cv.educations && cv.educations.length > 0 ? (
                            cv.educations.map((edu, idx) => (
                              <tr key={edu.id || idx} className="hover:bg-slate-50/70">
                                <td className="py-0.8 px-2 font-bold text-slate-900">{edu.degreeName}</td>
                                <td className="py-0.8 px-2 text-slate-700">{edu.subjectOrGroup}</td>
                                <td className="py-0.8 px-2 text-slate-700">{edu.institution}</td>
                                <td className="py-0.8 px-2 text-slate-600">{edu.boardOrUniversity}</td>
                                <td className="py-0.8 px-2 font-bold text-teal-800 text-center">{edu.result}</td>
                                <td className="py-0.8 px-2 font-semibold text-slate-700 text-center">{edu.passingYear}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-1.5 text-center text-slate-400 italic text-[9.5px]">
                                No educational qualifications recorded yet. Please edit CV to add degree records.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 5. Parallel Structured Section: Personal Details & Skills/Languages */}
                  <div className="grid grid-cols-12 gap-3 mb-2">
                    
                    {/* Left: Personal Particulars (58% width = 7 columns) */}
                    <div className="col-span-7 bg-teal-50/20 p-2.5 rounded-lg border border-teal-200/80">
                      <h4 className="text-[10.5px] font-black uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-0.5 mb-1.5 flex items-center gap-1">
                        <User className="w-3 h-3 text-teal-700" />
                        <span>PERSONAL PARTICULARS</span>
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-x-2.5 gap-y-1 text-[10px]">
                        <div>
                          <span className="text-slate-500 text-[8.5px] block font-bold">Father's Name:</span>
                          <span className="font-semibold text-slate-900 leading-tight block">{cv.fatherName || currentEmp.fatherName || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[8.5px] block font-bold">Mother's Name:</span>
                          <span className="font-semibold text-slate-900 leading-tight block">{cv.motherName || currentEmp.motherName || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[8.5px] block font-bold">Date of Birth:</span>
                          <span className="font-semibold text-slate-900">{cv.dateOfBirth || currentEmp.dateOfBirth || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[8.5px] block font-bold">Gender / Sex:</span>
                          <span className="font-semibold text-slate-900">{cv.gender || currentEmp.gender || "MALE"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[8.5px] block font-bold">Marital Status:</span>
                          <span className="font-semibold text-slate-900">{cv.maritalStatus || currentEmp.maritalStatus || "SINGLE"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[8.5px] block font-bold">Blood Group:</span>
                          <span className="font-bold text-rose-700">{cv.bloodGroup || currentEmp.bloodGroup || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[8.5px] block font-bold">Height (উচ্চতা):</span>
                          <span className="font-semibold text-slate-900">{cv.height || currentEmp.height || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[8.5px] block font-bold">Religion:</span>
                          <span className="font-semibold text-slate-900">{cv.religion || currentEmp.religion || "Islam"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[8.5px] block font-bold">Nationality:</span>
                          <span className="font-semibold text-slate-900">{cv.nationality || currentEmp.nationality || "Bangladeshi"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[8.5px] block font-bold">National ID (NID):</span>
                          <span className="font-mono font-bold text-slate-900">{cv.nidNumber || currentEmp.nidNumber || "—"}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 text-[8.5px] block font-bold">Emergency Contact:</span>
                          <span className="font-mono font-semibold text-slate-800">{currentEmp.emergencyPhone || cv.mobile || currentEmp.phone || "—"}</span>
                        </div>
                        <div className="col-span-2 pt-0.5 border-t border-teal-100">
                          <span className="text-slate-500 text-[8.5px] block font-bold">Present Address:</span>
                          <span className="font-normal text-slate-800 leading-tight block text-[9.5px]">{cv.presentAddress || currentEmp.presentAddress || "—"}</span>
                        </div>
                        <div className="col-span-2 pt-0.5 border-t border-teal-100">
                          <span className="text-slate-500 text-[8.5px] block font-bold">Permanent Address:</span>
                          <span className="font-normal text-slate-800 leading-tight block text-[9.5px]">{cv.permanentAddress || currentEmp.permanentAddress || "—"}</span>
                        </div>
                        {(cv.socialLink || cv.linkedinUrl || currentEmp.socialLink || (currentEmp as any).linkedinUrl) && (
                          <div className="col-span-2 pt-0.5 border-t border-teal-100">
                            <span className="text-slate-500 text-[8.5px] block font-bold">Social / LinkedIn:</span>
                            <a
                              href={
                                (cv.socialLink || cv.linkedinUrl || currentEmp.socialLink || (currentEmp as any).linkedinUrl).startsWith("http")
                                  ? (cv.socialLink || cv.linkedinUrl || currentEmp.socialLink || (currentEmp as any).linkedinUrl)
                                  : `https://${cv.socialLink || cv.linkedinUrl || currentEmp.socialLink || (currentEmp as any).linkedinUrl}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 break-all text-[9.5px] mt-0.5"
                            >
                              <Globe className="w-2.5 h-2.5 text-teal-600 shrink-0" />
                              <span className="truncate max-w-[280px]">
                                {cv.socialLink || cv.linkedinUrl || currentEmp.socialLink || (currentEmp as any).linkedinUrl}
                              </span>
                              <ExternalLink className="w-2 h-2 text-slate-400 shrink-0" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Skills & Languages (42% width = 5 columns) */}
                    <div className="col-span-5 flex flex-col justify-between space-y-1.5">
                      {/* Professional & Management Skills */}
                      <div className="bg-slate-50/90 p-2 rounded-lg border border-slate-200">
                        <h4 className="text-[9.5px] font-black uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-0.5 mb-1 flex items-center gap-1">
                          <Briefcase className="w-2.5 h-2.5 text-teal-700" />
                          <span>MANAGEMENT SKILLS</span>
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {cv.professionalSkills && cv.professionalSkills.length > 0 ? (
                            cv.professionalSkills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.2 rounded bg-white border border-teal-300 text-teal-950 text-[8.5px] font-semibold"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            [
                              "Team Leadership & Management",
                              "Time Management & Punctuality",
                              "Problem Solving & Adaptability",
                              "Effective Communication",
                            ].map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.2 rounded bg-white border border-teal-300 text-teal-950 text-[8.5px] font-semibold"
                              >
                                {skill}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Computer & Technical Skills */}
                      <div className="bg-slate-50/90 p-2 rounded-lg border border-slate-200 flex-1">
                        <h4 className="text-[9.5px] font-black uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-0.5 mb-1 flex items-center gap-1">
                          <Award className="w-2.5 h-2.5 text-teal-700" />
                          <span>TECHNICAL SKILLS</span>
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {cv.computerSkills && cv.computerSkills.length > 0 ? (
                            cv.computerSkills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.2 rounded bg-white border border-slate-300 text-slate-800 text-[8.5px] font-semibold"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-[8.5px] text-slate-400 italic">No specific skills listed</span>
                          )}
                        </div>
                      </div>

                      {/* Language Proficiency */}
                      <div className="bg-slate-50/90 p-2 rounded-lg border border-slate-200">
                        <h4 className="text-[9.5px] font-black uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-0.5 mb-1 flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5 text-teal-700" />
                          <span>LANGUAGES</span>
                        </h4>
                        <div className="space-y-0.5 text-[9.5px]">
                          {cv.languages && cv.languages.length > 0 ? (
                            cv.languages.map((lang, idx) => (
                              <div key={lang.id || idx} className="flex items-center justify-between">
                                <span className="font-semibold text-slate-800">{lang.language}</span>
                                <span className="text-[8.5px] px-1 py-0.2 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200">
                                  {getProficiencyLabel(lang.proficiency)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">Bengali / English</span>
                              <span className="text-[8.5px] px-1 py-0.2 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200">
                                Fluent
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 6. Declaration & Candidate Signature Footer (Guaranteed 1-page in-screen visibility) */}
                <div
                  ref={signatureSectionRef}
                  className="pt-1.5 border-t border-slate-300 shrink-0"
                >
                  <p className="text-[9px] text-slate-500 text-justify leading-tight mb-1.5">
                    I solemnly declare that the particulars and information given above are true, complete and correct to the best of my knowledge and belief.
                  </p>

                  <div className="flex items-end justify-between gap-3 pt-0.5">
                    <div className="text-[10px] text-slate-600 space-y-0.5 text-left">
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
                      <div>
                        <span className="font-semibold">Place: </span>
                        <span>Dhaka, Bangladesh</span>
                      </div>
                    </div>

                    {/* Candidate Signature Block - Matching Reference Layout Exactly */}
                    <div className="text-center flex flex-col items-center shrink-0">
                      <div className="w-48 border-b-2 border-slate-900 pb-0.5 mb-1 flex flex-col items-center justify-end min-h-[40px]">
                        {effectiveSignature ? (
                          <div className="flex flex-col items-center">
                            <img
                              src={effectiveSignature}
                              alt="Candidate Signature"
                              className="h-8 max-h-9 max-w-[150px] object-contain mb-0.5 filter contrast-125"
                            />
                            <span className="text-[9.5px] text-slate-900 font-bold tracking-wide">
                              {cv.fullName || currentEmp.fullName}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center py-0.5">
                            <span className="font-serif italic text-teal-900 text-sm font-bold tracking-wider select-none leading-tight">
                              {cv.fullName || currentEmp.fullName}
                            </span>
                            <span className="text-[8.5px] text-slate-500 font-semibold">
                              (Digital Signature)
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9.5px] font-black uppercase text-slate-900 tracking-wider">
                          CANDIDATE SIGNATURE
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowSignatureModal(true)}
                          className="print:hidden text-[8.5px] px-1.5 py-0.2 rounded bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-300 font-bold cursor-pointer transition-colors shadow-2xs"
                          title={isBangla ? "স্বাক্ষর আপলোড বা পরিবর্তন করুন" : "Upload or update digital signature"}
                        >
                          {effectiveSignature ? (isBangla ? "Change" : "Change") : (isBangla ? "+ Add" : "+ Add")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Quick Edit Designation & Department Modal */}
      {showQuickEditModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-sm">
                <Edit3 className="w-4 h-4" />
                <span>{isBangla ? "সিভিতে পদবী ও বিভাগ সংশোধন করুন" : "Update Designation & Department"}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickEditModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickPosition} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {isBangla ? "বর্তমান পদবী (Designation):" : "Current Designation:"}
                </label>
                <input
                  type="text"
                  value={editDesigInput}
                  onChange={(e) => setEditDesigInput(e.target.value)}
                  placeholder="e.g. Manager- IT & HR"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {isBangla ? "বিভাগ (Department):" : "Current Department:"}
                </label>
                <input
                  type="text"
                  value={editDeptInput}
                  onChange={(e) => setEditDeptInput(e.target.value)}
                  placeholder="e.g. HR, IT & Administration Department"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {isBangla ? "প্রতিষ্ঠানের নাম (Organization):" : "Organization Name:"}
                </label>
                <input
                  type="text"
                  value={editOrgInput}
                  onChange={(e) => setEditOrgInput(e.target.value)}
                  placeholder="e.g. Muslim Welfare Organization"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={savingPosition}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {savingPosition ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isBangla ? "সংরক্ষণ করুন" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signature Upload & Draw Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-sm">
                <PenTool className="w-4 h-4" />
                <span>{isBangla ? "ডিজিটাল স্বাক্ষর যুক্ত বা পরিবর্তন করুন" : "Update Digital Signature"}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSignatureModal(false);
                  setTempSignatureData(null);
                }}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode selection tabs */}
            <div className="flex items-center gap-2 mb-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setSignatureTab("upload")}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  signatureTab === "upload"
                    ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isBangla ? "ছবি আপলোড" : "Upload File"}</span>
              </button>
              <button
                type="button"
                onClick={() => setSignatureTab("draw")}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  signatureTab === "draw"
                    ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>{isBangla ? "স্ক্রিনে স্বাক্ষর আঁকুন" : "Draw Online"}</span>
              </button>
            </div>

            {/* Tab 1: Upload Image */}
            {signatureTab === "upload" && (
              <div className="space-y-4 text-xs">
                <input
                  type="file"
                  ref={signatureFileInputRef}
                  onChange={handleSignatureFileUpload}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />

                <div
                  onClick={() => signatureFileInputRef.current?.click()}
                  className="border-2 border-dashed border-teal-500/50 hover:border-teal-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-850 transition-colors flex flex-col items-center justify-center min-h-[140px]"
                >
                  {tempSignatureData ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={tempSignatureData}
                        alt="Signature Preview"
                        className="max-h-20 max-w-[200px] object-contain filter contrast-125"
                      />
                      <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                        {isBangla ? "ছবি নির্বাচিত হয়েছে (পরিবর্তন করতে ক্লিক করুন)" : "Image selected (Click to change)"}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-teal-600 dark:text-teal-400 mb-2" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {isBangla ? "স্বাক্ষরের স্পষ্ট ছবি নির্বাচন করুন" : "Select signature image"}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1">PNG, JPG বা WEBP ফরম্যাট</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Interactive Draw Pad */}
            {signatureTab === "draw" && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isBangla ? "মাউস বা আঙুল দিয়ে নিচের সাদা বক্সে স্বাক্ষর করুন:" : "Draw your signature below:"}
                  </span>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{isBangla ? "মুছে আবার আঁকুন" : "Clear"}</span>
                  </button>
                </div>

                <div className="border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden bg-white shadow-inner">
                  <canvas
                    ref={signatureCanvasRef}
                    width={380}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[140px] cursor-crosshair touch-none"
                  />
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 mt-4 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowSignatureModal(false);
                  setTempSignatureData(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
              >
                {isBangla ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleSaveSignature}
                disabled={
                  savingSignature ||
                  (signatureTab === "upload" && !tempSignatureData) ||
                  (signatureTab === "draw" && !hasDrawnOnCanvas)
                }
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
              >
                {savingSignature ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{isBangla ? "স্বাক্ষর সংরক্ষণ করুন" : "Save Signature"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone NID Document Modal */}
      {showNidModal && (
        <ViewNidCardModal
          employee={currentEmp}
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
