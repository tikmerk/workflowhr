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
  Maximize2,
  Minimize2,
  Check,
  RotateCcw,
  Upload,
  Building,
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

  // View scale: "fit" (responsive width, 100% fits screen) vs "actual" (210mm locked)
  const [viewScale, setViewScale] = useState<"fit" | "actual">("fit");

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
    fatherName: currentEmp.fatherName || "",
    motherName: currentEmp.motherName || "",
    mobile: currentEmp.phone,
    email: currentEmp.email,
    presentAddress: currentEmp.presentAddress || "",
    permanentAddress: currentEmp.permanentAddress || "",
    socialLink: currentEmp.socialLink || (currentEmp as any).linkedinUrl || "",
    linkedinUrl: currentEmp.socialLink || (currentEmp as any).linkedinUrl || "",
    nidNumber: currentEmp.nidNumber || "",
    bloodGroup: currentEmp.bloodGroup || "O+",
    dateOfBirth: currentEmp.dateOfBirth || "",
    height: currentEmp.height || "",
    gender: currentEmp.gender || "MALE",
    nationality: currentEmp.nationality || "Bangladeshi",
    maritalStatus: currentEmp.maritalStatus || "SINGLE",
    religion: currentEmp.religion || "Islam",
    joiningDate: currentEmp.joiningDate,
    currentDesignation: currentEmp.designationTitle || desigFromId || "Officer",
    currentDepartment: currentEmp.departmentName || deptFromId || "Department",
    currentOrganization: branding.companyName || "Muslim Welfare Organization",
    educations: [],
    experiences: [],
    computerSkills: [],
    professionalSkills: [
      "Team Leadership & Management",
      "Time Management & Punctuality",
      "Problem Solving & Adaptability",
      "Work Ethics & Patience",
      "Effective Communication",
    ],
    languages: [],
    summary: getDefaultCareerObjective(false),
    signatureUrl: currentEmp.savedSignatureUrl || currentEmp.signatureUrl,
  };

  // Accurate Designation & Department resolution
  const displayDesignation =
    currentEmp.designationTitle ||
    cv.currentDesignation ||
    desigFromId ||
    "Officer";
  const displayDepartment =
    currentEmp.departmentName ||
    cv.currentDepartment ||
    deptFromId ||
    "Department";
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
      await new Promise((resolve) => setTimeout(resolve, 150));

      const element = printContentRef.current;

      let imgData: string;
      try {
        imgData = await toJpeg(element, {
          quality: 0.98,
          pixelRatio: 2.2,
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
          pixelRatio: 2.0,
          backgroundColor: "#ffffff",
          cacheBust: true,
          skipFonts: true,
          fontEmbedCSS: "",
        });
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = 210;
      const pdfHeight = 297;

      const elWidth = element.offsetWidth || 794;
      const elHeight = element.offsetHeight || 1123;
      const ratio = elHeight / elWidth;
      const calculatedHeight = pdfWidth * ratio;

      if (calculatedHeight <= pdfHeight) {
        // Fits perfectly within 1 A4 page
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, calculatedHeight, undefined, "FAST");
      } else {
        // If content is slightly taller, scale proportionally to fit 1 clean page
        const scale = pdfHeight / calculatedHeight;
        if (scale >= 0.75) {
          const fittedWidth = pdfWidth * scale;
          const xOffset = (pdfWidth - fittedWidth) / 2;
          pdf.addImage(imgData, "JPEG", xOffset, 0, fittedWidth, pdfHeight, undefined, "FAST");
        } else {
          // Multi-page fallback if heavily packed
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
        {/* Modal Container */}
        <div className="relative w-full max-w-4xl bg-slate-100 dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] my-auto border border-slate-300 dark:border-slate-800">
          
          {/* Top Control Bar (Hidden when printing) */}
          <div className="print:hidden flex items-center justify-between px-4 sm:px-5 py-2.5 bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-750 shrink-0 gap-2 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="truncate">
                <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {isBangla ? "অফিসিয়াল সিভি (১-পেইজ A4 ফরম্যাট)" : "Official Resume / CV (1-Page A4)"}
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                  {currentEmp.fullName} • {currentEmp.employeeCode}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Quick Jump to Signature Button */}
              <button
                type="button"
                onClick={scrollToSignature}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title={isBangla ? "নিচে সিগনেচার সেকশনে যান" : "Jump down to signature"}
              >
                <PenTool className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span className="hidden sm:inline">{isBangla ? "স্বাক্ষর দেখুন" : "Signature"}</span>
              </button>

              {/* View Scale Toggle */}
              <button
                type="button"
                onClick={() => setViewScale(viewScale === "fit" ? "actual" : "fit")}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                title={viewScale === "fit" ? (isBangla ? "১০০% A4 সাইজে দেখুন" : "View 100% A4 Size") : (isBangla ? "স্ক্রিনে ফিট করুন" : "Fit to Screen Width")}
              >
                {viewScale === "fit" ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{viewScale === "fit" ? (isBangla ? "১০০% সাইজ" : "100% Size") : (isBangla ? "স্ক্রিন ফিট" : "Fit Width")}</span>
              </button>

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
                    <span>{isBangla ? "PDF ডাউনলোড" : "Download PDF"}</span>
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
                <span className="hidden sm:inline">{isBangla ? "প্রিন্ট" : "Print"}</span>
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

          {/* Scrollable Preview Area with Responsive Sizing */}
          <div className="flex-1 overflow-x-auto overflow-y-auto p-2 sm:p-4 md:p-6 flex justify-center bg-slate-200/80 dark:bg-slate-950/70">
            <div
              id="printable-a4-resume"
              ref={printContentRef}
              className={`bg-white text-slate-900 shadow-xl rounded-sm font-sans border border-slate-300 print:border-0 print:shadow-none print:m-0 transition-all flex flex-col justify-between ${
                viewScale === "fit"
                  ? "w-full max-w-[210mm] mx-auto p-4 sm:p-5 md:p-6 min-h-[auto]"
                  : "w-[210mm] min-w-[210mm] max-w-[210mm] min-h-[297mm] p-6"
              }`}
              style={{
                boxSizing: "border-box",
              }}
            >
              
              <div>
                {/* 1. Header: Organization, Candidate & Passport Photo */}
                <div className="flex items-start justify-between border-b-2 border-teal-700 pb-2 mb-2 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] sm:text-[10px] font-bold tracking-widest text-teal-700 uppercase mb-0.5">
                      CURRICULUM VITAE
                    </div>
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase leading-tight truncate">
                      {cv.fullName || currentEmp.fullName}
                    </h1>
                    
                    {/* Position, Department & Organization Display with Quick Edit Action */}
                    <div className="text-[11px] sm:text-xs font-bold text-teal-800 mt-0.5 flex items-center gap-1.5 flex-wrap">
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
                        className="print:hidden ml-1 px-1.5 py-0.2 rounded bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 text-[9.5px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                        title={isBangla ? "উপরে প্রদর্শিত পদবী ও বিভাগ সংশোধন করুন" : "Quick edit designation & department"}
                      >
                        <Edit3 className="w-2.5 h-2.5 text-teal-600 dark:text-teal-400" />
                        <span>{isBangla ? "পরিবর্তন" : "Edit"}</span>
                      </button>
                    </div>

                    {/* Horizontal Compact Contact Bar */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] sm:text-[10.5px] text-slate-600 mt-1 font-medium">
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
                        <span>NID: <strong className="text-slate-800">{cv.nidNumber || currentEmp.nidNumber || "—"}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplet className="w-3 h-3 text-rose-600 shrink-0" />
                        <span>Blood: <strong className="text-slate-800">{cv.bloodGroup || currentEmp.bloodGroup || "—"}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Candidate Photo */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-16 sm:w-18 h-20 sm:h-22 rounded border-2 border-teal-700 overflow-hidden shadow-xs bg-slate-100">
                      <img
                        src={currentEmp.avatarUrl}
                        alt={currentEmp.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[8.5px] sm:text-[9px] font-mono font-bold text-slate-500 mt-0.5">
                      ID: {currentEmp.employeeCode}
                    </span>
                  </div>
                </div>

                {/* 2. Career Objective */}
                <div className="mb-2">
                  <h2 className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-teal-900 border-b border-teal-300 pb-0.5 mb-0.5 flex items-center gap-1">
                    <User className="w-3 h-3 text-teal-700" />
                    <span>Career Objective</span>
                  </h2>
                  <p className="text-[10px] sm:text-[10.5px] text-slate-700 leading-snug text-justify font-normal">
                    {careerObjective}
                  </p>
                </div>

                {/* 3. Work Experience */}
                <div className="mb-2">
                  <h3 className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-teal-900 border-b border-teal-300 pb-0.5 mb-1 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-teal-700" />
                    <span>Work Experience</span>
                  </h3>
                  <div className="space-y-1">
                    {cv.experiences && cv.experiences.length > 0 ? (
                      cv.experiences.map((exp, idx) => (
                        <div key={exp.id || idx} className="border-l-2 border-teal-600 pl-2 py-0.2">
                          <div className="flex items-center justify-between text-[10.5px] sm:text-[11px]">
                            <div>
                              <span className="font-bold text-slate-900">{exp.designation}</span>
                              <span className="text-slate-400 mx-1">|</span>
                              <span className="font-semibold text-slate-700">{exp.organizationName}</span>
                            </div>
                            <span className="text-[9.5px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-1 py-0.1 rounded">
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
                <div className="mb-2">
                  <h3 className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-teal-900 border-b border-teal-300 pb-0.5 mb-0.5 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-teal-700" />
                    <span>Academic Qualifications</span>
                  </h3>
                  <div className="w-full overflow-hidden border border-slate-300 rounded">
                    <table className="w-full text-left border-collapse text-[9.5px] sm:text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-800">
                          <th className="py-0.5 px-1.5 font-bold">Exam / Degree</th>
                          <th className="py-0.5 px-1.5 font-bold">Subject / Group</th>
                          <th className="py-0.5 px-1.5 font-bold">Institution</th>
                          <th className="py-0.5 px-1.5 font-bold">Board / University</th>
                          <th className="py-0.5 px-1.5 font-bold text-center">Result</th>
                          <th className="py-0.5 px-1.5 font-bold text-center">Year</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {cv.educations && cv.educations.length > 0 ? (
                          cv.educations.map((edu, idx) => (
                            <tr key={edu.id || idx} className="hover:bg-slate-50/70">
                              <td className="py-0.5 px-1.5 font-bold text-slate-900">{edu.degreeName}</td>
                              <td className="py-0.5 px-1.5 text-slate-700">{edu.subjectOrGroup}</td>
                              <td className="py-0.5 px-1.5 text-slate-700">{edu.institution}</td>
                              <td className="py-0.5 px-1.5 text-slate-600">{edu.boardOrUniversity}</td>
                              <td className="py-0.5 px-1.5 font-bold text-teal-800 text-center">{edu.result}</td>
                              <td className="py-0.5 px-1.5 font-semibold text-slate-700 text-center">{edu.passingYear}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-1.5 text-center text-slate-400 italic text-[9.5px]">
                              No academic qualifications recorded yet. Please edit CV to add degree records.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Parallel Structured Section: Personal Details & Skills/Languages */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2">
                  
                  {/* Left: Personal Particulars */}
                  <div className="md:col-span-7 bg-slate-50/90 p-2 rounded border border-slate-200">
                    <h4 className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-teal-900 border-b border-teal-200 pb-0.5 mb-1 flex items-center gap-1">
                      <User className="w-2.5 h-2.5 text-teal-700" />
                      <span>Personal Particulars</span>
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9.5px] sm:text-[10px]">
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
                        <span className="font-semibold text-slate-900">{cv.gender || currentEmp.gender || "Male"}</span>
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
                        <span className="font-semibold text-slate-900">{cv.nationality || currentEmp.nationality || "Bangladeshi (By Birth)"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[8.5px] block font-bold">National ID (NID):</span>
                        <span className="font-mono font-bold text-slate-900">{cv.nidNumber || currentEmp.nidNumber || "—"}</span>
                      </div>
                      <div className="col-span-2 pt-0.5 border-t border-slate-200">
                        <span className="text-slate-500 text-[8.5px] block font-bold">Present Address:</span>
                        <span className="font-normal text-slate-800 leading-tight block">{cv.presentAddress || currentEmp.presentAddress || "—"}</span>
                      </div>
                      <div className="col-span-2 pt-0.5 border-t border-slate-200">
                        <span className="text-slate-500 text-[8.5px] block font-bold">Permanent Address:</span>
                        <span className="font-normal text-slate-800 leading-tight block">{cv.permanentAddress || currentEmp.permanentAddress || "—"}</span>
                      </div>
                      {(cv.socialLink || cv.linkedinUrl || currentEmp.socialLink || (currentEmp as any).linkedinUrl) && (
                        <div className="col-span-2 pt-0.5 border-t border-slate-200">
                          <span className="text-slate-500 text-[8.5px] block font-bold">Social / LinkedIn:</span>
                          <a
                            href={
                              (cv.socialLink || cv.linkedinUrl || currentEmp.socialLink || (currentEmp as any).linkedinUrl).startsWith("http")
                                ? (cv.socialLink || cv.linkedinUrl || currentEmp.socialLink || (currentEmp as any).linkedinUrl)
                                : `https://${cv.socialLink || cv.linkedinUrl || currentEmp.socialLink || (currentEmp as any).linkedinUrl}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 break-all text-[9px] mt-0.5"
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

                  {/* Right: Skills & Languages */}
                  <div className="md:col-span-5 flex flex-col justify-between space-y-1.5">
                    {/* Professional & Management Skills */}
                    <div className="bg-slate-50/90 p-1.5 rounded border border-slate-200">
                      <h4 className="text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider text-teal-900 border-b border-teal-200 pb-0.5 mb-1 flex items-center gap-1">
                        <Briefcase className="w-2.5 h-2.5 text-teal-700" />
                        <span>Management Skills</span>
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {cv.professionalSkills && cv.professionalSkills.length > 0 ? (
                          cv.professionalSkills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.1 rounded bg-white border border-teal-200 text-teal-900 text-[9px] font-semibold"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          [
                            "Leadership & Teamwork",
                            "Time Management & Punctuality",
                            "Problem Solving",
                            "Effective Communication",
                          ].map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.1 rounded bg-white border border-teal-200 text-teal-900 text-[9px] font-semibold"
                            >
                              {skill}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Computer & Technical Skills */}
                    <div className="bg-slate-50/90 p-1.5 rounded border border-slate-200 flex-1">
                      <h4 className="text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider text-teal-900 border-b border-teal-200 pb-0.5 mb-1 flex items-center gap-1">
                        <Award className="w-2.5 h-2.5 text-teal-700" />
                        <span>Technical Skills</span>
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {cv.computerSkills && cv.computerSkills.length > 0 ? (
                          cv.computerSkills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.1 rounded bg-white border border-slate-300 text-slate-800 text-[9px] font-semibold"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] text-slate-400 italic">No specific skills listed</span>
                        )}
                      </div>
                    </div>

                    {/* Language Proficiency */}
                    <div className="bg-slate-50/90 p-1.5 rounded border border-slate-200 flex-1">
                      <h4 className="text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider text-teal-900 border-b border-teal-200 pb-0.5 mb-1 flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5 text-teal-700" />
                        <span>Languages</span>
                      </h4>
                      <div className="space-y-0.5 text-[9.5px]">
                        {cv.languages && cv.languages.length > 0 ? (
                          cv.languages.map((lang, idx) => (
                            <div key={lang.id || idx} className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">{lang.language}</span>
                              <span className="text-[8.5px] px-1 py-0.1 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200">
                                {getProficiencyLabel(lang.proficiency)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">Bengali / English</span>
                            <span className="text-[8.5px] px-1 py-0.1 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200">
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
                className="pt-2 border-t border-slate-300 mt-2 shrink-0"
              >
                <p className="text-[9px] text-slate-500 text-justify leading-tight">
                  I solemnly declare that the particulars and information given above are true, complete and correct to the best of my knowledge and belief.
                </p>

                <div className="flex items-end justify-between gap-3 mt-2 pt-1">
                  <div className="text-[9.5px] sm:text-[10px] text-slate-600 space-y-0.5 text-left">
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

                  {/* Candidate Signature Block - Always cleanly bounded & inside viewport */}
                  <div className="text-center flex flex-col items-center shrink-0">
                    <div className="w-44 sm:w-48 border-b-2 border-slate-700 pb-0.5 mb-1 flex flex-col items-center justify-end min-h-[44px]">
                      {effectiveSignature ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={effectiveSignature}
                            alt="Candidate Signature"
                            className="h-8 sm:h-9 max-h-10 max-w-[160px] object-contain mb-0.5 filter contrast-125"
                          />
                          <span className="text-[9px] sm:text-[9.5px] text-slate-900 font-bold tracking-wide">
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
                        Candidate Signature
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSignatureModal(true)}
                        className="print:hidden text-[9px] px-1.5 py-0.2 rounded bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-300 font-bold cursor-pointer transition-colors shadow-2xs"
                        title={isBangla ? "স্বাক্ষর আপলোড বা পরিবর্তন করুন" : "Upload or update digital signature"}
                      >
                        {effectiveSignature ? (isBangla ? "পরিবর্তন" : "Change") : (isBangla ? "+ স্বাক্ষর দিন" : "+ Add")}
                      </button>
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
                  placeholder="e.g. IT & MIS Officer (আইটি ও এমআইএস কর্মকর্তা)"
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
                  placeholder="e.g. আইটি, এমআইএস ও টেকনিক্যাল সাপোর্ট"
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
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={savingPosition}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-teal-500/20 disabled:opacity-50"
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
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
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
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
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
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
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
