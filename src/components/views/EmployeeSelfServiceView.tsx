import React, { useState } from "react";
import {
  UserCheck,
  ScanFace,
  Smartphone,
  CreditCard,
  CalendarCheck,
  Banknote,
  FileCheck2,
  Laptop,
  Clock,
  MapPin,
  Download,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Calendar,
  Camera,
  AlertTriangle,
  Upload,
  Edit2,
  Layers,
  X,
  Briefcase,
  Shield,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  Printer,
} from "lucide-react";
import {
  Employee,
  AttendanceRecord,
  Payslip,
  LeaveApplication,
  EmployeeLoan,
  CompanyAsset,
  CertificateRecord
} from "../../types";
import { FaceEnrollmentModal } from "../attendance/FaceEnrollmentModal";
import { EditEmployeeCVModal } from "../modals/EditEmployeeCVModal";
import { ViewA4ResumeModal } from "../modals/ViewA4ResumeModal";

interface EmployeeSelfServiceViewProps {
  currentEmployee: Employee;
  myAttendance: AttendanceRecord[];
  myPayslips: Payslip[];
  myLeaves: LeaveApplication[];
  myLoans: EmployeeLoan[];
  myAssets: CompanyAsset[];
  myCertificates: CertificateRecord[];
  onOpenAttendanceModal: () => void;
  onApplyLeave: (leave: Partial<LeaveApplication>) => void;
  onApplyLoan: (loan: Partial<EmployeeLoan>) => void;
  onViewPayslip: (slip: Payslip) => void;
  onUpdateFacePhoto?: (employeeId: string, photoUrl: string, verificationScore?: number, faceDescriptor?: number[]) => void;
  onOpenDigitalIdCard?: () => void;
  onUpdateEmployee?: (emp: Employee) => void;
}

export const EmployeeSelfServiceView: React.FC<EmployeeSelfServiceViewProps> = ({
  currentEmployee,
  myAttendance,
  myPayslips,
  myLeaves,
  myLoans,
  myAssets,
  myCertificates,
  onOpenAttendanceModal,
  onApplyLeave,
  onApplyLoan,
  onViewPayslip,
  onUpdateFacePhoto,
  onOpenDigitalIdCard,
  onUpdateEmployee,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "attendance" | "payslips" | "leaves" | "loans" | "assets" | "security"
  >("overview");
  const [showFaceEnrollModal, setShowFaceEnrollModal] = useState<boolean>(false);
  const [candidateUploadedPhoto, setCandidateUploadedPhoto] = useState<string | null>(null);
  const [showEditCVModal, setShowEditCVModal] = useState<boolean>(false);
  const [showViewA4ResumeModal, setShowViewA4ResumeModal] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Self-service password change state
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const isFaceVerified = Boolean(
    currentEmployee.faceTemplateRegistered &&
    currentEmployee.faceVerified &&
    typeof currentEmployee.faceVerificationScore === "number" &&
    currentEmployee.faceVerificationScore > 0
  );

  const handleDirectPhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      // Mark verification as pending immediately
      if (onUpdateFacePhoto) {
        onUpdateFacePhoto(currentEmployee.id, dataUrl, undefined);
      }
      setCandidateUploadedPhoto(dataUrl);
      setShowFaceEnrollModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Apply Leave Modal State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState<"CASUAL" | "SICK" | "ANNUAL" | "MATERNITY">("CASUAL");
  const [leaveStartDate, setLeaveStartDate] = useState("2026-09-02");
  const [leaveEndDate, setLeaveEndDate] = useState("2026-09-03");
  const [leaveReason, setLeaveReason] = useState("");

  // Apply Loan Modal State
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanCategory, setLoanCategory] = useState<"ADVANCE_SALARY" | "COMPANY_LOAN">("ADVANCE_SALARY");
  const [loanAmount, setLoanAmount] = useState(30000);
  const [loanAdvanceMonths, setLoanAdvanceMonths] = useState(1);
  const [loanMonths, setLoanMonths] = useState(6);
  const [loanRepaymentType, setLoanRepaymentType] = useState<"LUMP_SUM" | "MONTHLY_INSTALLMENT">("MONTHLY_INSTALLMENT");
  const [loanReason, setLoanReason] = useState("");

  // Profile & Designation Edit Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editFullName, setEditFullName] = useState(currentEmployee.fullName);
  const [editDesignationTitle, setEditDesignationTitle] = useState(currentEmployee.designationTitle);
  const [editDepartmentName, setEditDepartmentName] = useState(currentEmployee.departmentName);
  const [editPhone, setEditPhone] = useState(currentEmployee.phone);
  const [editEmergencyPhone, setEditEmergencyPhone] = useState(currentEmployee.emergencyPhone || "");
  const [editPresentAddress, setEditPresentAddress] = useState(currentEmployee.presentAddress || "");
  const [editBloodGroup, setEditBloodGroup] = useState(currentEmployee.bloodGroup || "O+");
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentEmployee.avatarUrl);

  const isCeoOrAdmin = Boolean(
    currentEmployee.isCeoOrOwner ||
    currentEmployee.role === "SUPER_ADMIN" ||
    currentEmployee.role === "COMPANY_ADMIN" ||
    currentEmployee.role === "BRANCH_MANAGER" ||
    currentEmployee.designationTitle.toLowerCase().includes("ceo") ||
    currentEmployee.designationTitle.toLowerCase().includes("executive officer") ||
    currentEmployee.designationTitle.toLowerCase().includes("director") ||
    currentEmployee.designationTitle.toLowerCase().includes("founder") ||
    currentEmployee.designationTitle.toLowerCase().includes("head") ||
    currentEmployee.designationTitle.toLowerCase().includes("manager")
  );

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Employee = {
      ...currentEmployee,
      fullName: editFullName,
      designationTitle: isCeoOrAdmin ? editDesignationTitle : currentEmployee.designationTitle,
      departmentName: isCeoOrAdmin ? editDepartmentName : currentEmployee.departmentName,
      phone: editPhone,
      emergencyPhone: editEmergencyPhone,
      presentAddress: editPresentAddress,
      bloodGroup: editBloodGroup as any,
      avatarUrl: editAvatarUrl,
      additionalDesignations: [],
      additionalDepartments: [],
    };
    if (onUpdateEmployee) {
      onUpdateEmployee(updated);
    }
    setShowEditProfileModal(false);
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(leaveStartDate);
    const end = new Date(leaveEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    onApplyLeave({
      employeeId: currentEmployee.id,
      employeeCode: currentEmployee.employeeCode,
      employeeName: currentEmployee.fullName,
      avatarUrl: currentEmployee.avatarUrl,
      branchId: currentEmployee.branchId,
      branchName: currentEmployee.branchName,
      departmentName: currentEmployee.departmentName,
      leaveType,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      totalDays: diffDays,
      reason: leaveReason || "Personal leave request",
      status: "PENDING",
      appliedDate: new Date().toISOString().split("T")[0],
    });

    setShowLeaveModal(false);
    setLeaveReason("");
  };

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let installments = 1;
    let monthlyEmi = loanAmount;

    if (loanCategory === "ADVANCE_SALARY") {
      installments = Math.max(1, loanAdvanceMonths);
      monthlyEmi = Math.round(loanAmount / installments);
    } else {
      if (loanRepaymentType === "MONTHLY_INSTALLMENT") {
        installments = Math.max(1, loanMonths);
        monthlyEmi = Math.round(loanAmount / installments);
      } else {
        installments = 1;
        monthlyEmi = loanAmount;
      }
    }

    onApplyLoan({
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.fullName,
      branchName: currentEmployee.branchName,
      category: loanCategory,
      advanceDurationMonths: loanCategory === "ADVANCE_SALARY" ? loanAdvanceMonths : undefined,
      repaymentType: loanCategory === "COMPANY_LOAN" ? loanRepaymentType : undefined,
      amount: loanAmount,
      monthlyEmi,
      totalInstallments: installments,
      paidInstallments: 0,
      remainingAmount: loanAmount,
      reason: loanReason || (loanCategory === "ADVANCE_SALARY" ? "অগ্রিম বেতন প্রয়োজন" : "ব্যক্তিগত জরুরি ঋণ"),
      applicationDate: new Date().toISOString().split("T")[0],
      status: "PENDING_APPROVAL",
    });

    setShowLoanModal(false);
    setLoanReason("");
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError(null);
    setPasswordChangeSuccess(null);

    const actualCurrentPassword = currentEmployee.password || "123456";
    if (currentPasswordInput !== actualCurrentPassword) {
      setPasswordChangeError("বর্তমান পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন। (ডিফল্ট: 123456)");
      return;
    }

    if (newPasswordInput.length < 4) {
      setPasswordChangeError("নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।");
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeError("নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না!");
      return;
    }

    if (newPasswordInput === actualCurrentPassword) {
      setPasswordChangeError("নতুন পাসওয়ার্ডটি আপনার বর্তমান পাসওয়ার্ড থেকে আলাদা হতে হবে।");
      return;
    }

    setIsChangingPassword(true);
    setTimeout(() => {
      if (onUpdateEmployee) {
        onUpdateEmployee({
          ...currentEmployee,
          password: newPasswordInput,
          passwordLastChangedAt: new Date().toISOString(),
        });
      }
      setIsChangingPassword(false);
      setPasswordChangeSuccess("আপনার পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে! পরবর্তী লগইনে এই নতুন পাসওয়ার্ডটি ব্যবহার করুন।");
      setCurrentPasswordInput("");
      setNewPasswordInput("");
      setConfirmPasswordInput("");
    }, 400);
  };

  return (
    <div id="employee-self-service-portal" className="space-y-6 animate-in fade-in duration-300">
      {/* Hidden File Input for direct photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleDirectPhotoFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Profile Header Banner - Optimized for Tablet, Mobile & Desktop */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row items-center xl:items-center justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left w-full xl:w-auto">
          <div className="relative shrink-0 group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-teal-500 shadow-xl shadow-teal-500/20 bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
              <img
                src={candidateUploadedPhoto || currentEmployee.avatarUrl}
                alt={currentEmployee.fullName}
                className="w-full h-full object-cover aspect-square"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-950/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
                title="নতুন ছবি আপলোড করুন"
              >
                <Upload className="w-5 h-5 text-teal-300 mb-0.5" />
                <span className="text-[10px] font-bold">ছবি আপলোড</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-teal-950 border border-slate-200 dark:border-slate-700 p-1.5 rounded-xl shadow-lg cursor-pointer transition-colors"
              title="নতুন ছবি আপলোড করুন"
            >
              <Camera className="w-4 h-4 text-teal-600 dark:text-emerald-400" />
            </button>
          </div>

          <div className="space-y-1 w-full sm:w-auto">
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {currentEmployee.fullName}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                {currentEmployee.role.replace("_", " ")}
              </span>

              {/* Biometric Face Verification Status Badge */}
              {isFaceVerified ? (
                <button
                  type="button"
                  onClick={() => setShowFaceEnrollModal(true)}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                  title="বায়োমেট্রিক ফেস ভেরিফাইড (পুনরায় ভেরিফাই বা ছবি পরিবর্তন করতে ক্লিক করুন)"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>বায়োমেট্রিক ফেস ভেরিফাইড ({currentEmployee.faceVerificationScore}%)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowFaceEnrollModal(true)}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/40 flex items-center gap-1 hover:bg-amber-500/30 transition-colors cursor-pointer animate-pulse"
                  title="বায়োমেট্রিক ফেস ভেরিফিকেশন প্রয়োজন (যাচাই করতে ক্লিক করুন)"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span>ভেরিফিকেশন প্রয়োজন</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 justify-center sm:justify-start">
              <p className="text-xs sm:text-sm font-bold text-teal-600 dark:text-teal-400">
                {currentEmployee.designationTitle}
              </p>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {currentEmployee.departmentName}
              </span>
            </div>



            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 dark:text-slate-400 justify-center sm:justify-start mt-1">
              <span>Employee Code: <strong className="text-slate-900 dark:text-white">{currentEmployee.employeeCode}</strong></span>
              <span className="hidden sm:inline">•</span>
              <span>Branch: <strong className="text-slate-900 dark:text-white">{currentEmployee.branchName}</strong></span>
              <span className="hidden sm:inline">•</span>
              <span>Shift: <strong className="text-teal-600 dark:text-teal-300">{currentEmployee.shiftName}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar - Tablet & Mobile Resilient */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start xl:justify-end gap-2.5 w-full xl:w-auto pt-2 xl:pt-0 border-t border-slate-100 dark:border-slate-800/80 xl:border-t-0">
          {onOpenDigitalIdCard && (
            <button
              type="button"
              id="ess-digital-id-btn"
              onClick={onOpenDigitalIdCard}
              className="px-3.5 py-2.5 bg-gradient-to-r from-teal-500/15 via-emerald-500/15 to-teal-500/15 hover:from-teal-500/25 hover:to-emerald-500/25 border border-teal-500/40 text-teal-700 dark:text-teal-300 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer grow sm:grow-0 justify-center"
            >
              <CreditCard className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="whitespace-nowrap">ডিজিটাল আইডি কার্ড</span>
            </button>
          )}

          {/* Edit My Profile & Portfolios Button */}
          {onUpdateEmployee && (
            <button
              type="button"
              id="ess-edit-profile-btn"
              onClick={() => {
                setEditFullName(currentEmployee.fullName);
                setEditDesignationTitle(currentEmployee.designationTitle);
                setEditDepartmentName(currentEmployee.departmentName);
                setEditPhone(currentEmployee.phone);
                setEditEmergencyPhone(currentEmployee.emergencyPhone || "");
                setEditPresentAddress(currentEmployee.presentAddress || "");
                setEditBloodGroup(currentEmployee.bloodGroup || "O+");
                setEditAvatarUrl(currentEmployee.avatarUrl);
                setShowEditProfileModal(true);
              }}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-teal-500/20 dark:bg-slate-800 dark:hover:bg-teal-500/30 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer grow sm:grow-0 justify-center"
              title="নিজের প্রোফাইল ও পদবী এডিট করুন"
            >
              <Edit2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="whitespace-nowrap">এডিট প্রোফাইল</span>
            </button>
          )}

          {/* Dedicated Separate Edit CV Button */}
          <button
            type="button"
            id="ess-edit-cv-btn"
            onClick={() => setShowEditCVModal(true)}
            className="px-3.5 py-2.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 border border-teal-500/40 text-teal-800 dark:text-teal-200 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer grow sm:grow-0 justify-center"
            title="সিভি, শিক্ষাগত যোগ্যতা, কাজের অভিজ্ঞতা ও স্কিলস এডিট করুন"
          >
            <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="whitespace-nowrap">এডিট সিভি</span>
          </button>

          {/* Dedicated View/Print A4 Resume Button */}
          <button
            type="button"
            id="ess-view-a4-resume-btn"
            onClick={() => setShowViewA4ResumeModal(true)}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-700 text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer grow sm:grow-0 justify-center"
            title="প্রিন্ট-রেডি A4 সাইজের অফিসিয়াল রিজিউমে দেখুন ও প্রিন্ট করুন"
          >
            <Printer className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="whitespace-nowrap">সিভি দেখুন (A4)</span>
          </button>

          <button
            type="button"
            id="ess-clock-in-out-btn"
            onClick={onOpenAttendanceModal}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer grow sm:grow-0 justify-center"
          >
            <ScanFace className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Clock In / Out</span>
          </button>
          <button
            type="button"
            id="ess-apply-leave-btn"
            onClick={() => setShowLeaveModal(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer grow sm:grow-0 justify-center"
          >
            <CalendarCheck className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="whitespace-nowrap">Apply Leave</span>
          </button>
        </div>
      </div>

      {/* Verification Required Alert Banner if face is not verified */}
      {!isFaceVerified && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15 border border-amber-500/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  ছবির বায়োমেট্রিক ফেস ভেরিফিকেশন প্রয়োজন (অপেক্ষমান)
                </h4>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/25 text-amber-800 dark:text-amber-200">
                  জরুরি
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                আপনার আপলোডকৃত ছবির সাথে লাইভ ক্যামেরা ফেস এখনো যাচাই করা হয়নি। স্মার্ট উপস্থিতি দেওয়ার জন্য লাইভ ফেস ভেরিফিকেশন সম্পন্ন করুন।
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>ছবি পরিবর্তন</span>
            </button>
            <button
              type="button"
              onClick={() => setShowFaceEnrollModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shrink-0 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ScanFace className="w-3.5 h-3.5" />
              <span>ক্যামেরা দিয়ে ভেরিফাই করুন</span>
            </button>
          </div>
        </div>
      )}

      {/* Sub-Tab Navigation Bar - Tablet scroll-friendly */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-bold scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        {[
          { id: "overview", label: "Profile & Hardware Security", icon: UserCheck },
          { id: "attendance", label: "My Attendance Logs", icon: Clock },
          { id: "payslips", label: "বেতন ও পে-স্লিপ (Payslips)", icon: CreditCard },
          { id: "leaves", label: "Leave Requests & Balance", icon: CalendarCheck },
          ...(!currentEmployee.hideSalaryFromSelf
            ? [{ id: "loans", label: "Loans & Advance Salary", icon: Banknote }]
            : []),
          { id: "assets", label: "Assigned Assets", icon: Laptop },
          { id: "security", label: "পাসওয়ার্ড ও নিরাপত্তা", icon: KeyRound },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isActive
                  ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/40 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Hardware Security */}
      {activeSubTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hardware & Biometric Security Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <ScanFace className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Biometric Face & Device Binding</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-200">Face Vector Template</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {currentEmployee.faceTemplateRegistered
                      ? "Enrolled for live anti-spoofing"
                      : "No face registered - Clock-in blocked"}
                  </p>
                </div>
                {currentEmployee.faceTemplateRegistered ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Enrolled & Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Not Enrolled (ছবি নেই)
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowFaceEnrollModal(true)}
                className="w-full py-2.5 px-3 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <ScanFace className="w-4 h-4" />
                <span>
                  {currentEmployee.faceTemplateRegistered
                    ? "Update Biometric Face Photo (ছবি পরিবর্তন)"
                    : "Enroll Face Biometrics Now (নতুন ছবি নিবন্ধন করুন)"}
                </span>
              </button>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-200">Bound Work Device</p>
                  <p className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                    {currentEmployee.boundDeviceId || "DEV-MAC-PRO-M3-99"}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> Verified
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-200">Geofence Compliance</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Within allowed branch perimeter</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Passed
                </span>
              </div>

              {/* Quick Password Management Link */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50/40 dark:from-slate-800/80 dark:to-teal-950/30 border border-teal-200/80 dark:border-teal-800/40 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>অ্যাকাউন্ট পাসওয়ার্ড নিরাপত্তা</span>
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {currentEmployee.passwordLastChangedAt
                      ? "নিজস্ব পাসওয়ার্ড কার্যকর রয়েছে"
                      : "প্রাথমিক পাসওয়ার্ড সেট করা রয়েছে"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("security")}
                  className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] shadow-xs cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>পাসওয়ার্ড পরিবর্তন</span>
                </button>
              </div>
            </div>
          </div>

          {/* Personal Information & Official Details (2 cols) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Employee Personal & Corporate Record</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Official Email</span>
                <span className="font-bold text-slate-900 dark:text-slate-200">{currentEmployee.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Contact Phone</span>
                <span className="font-bold text-slate-900 dark:text-slate-200">{currentEmployee.phone}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Date of Joining</span>
                <span className="font-bold text-slate-900 dark:text-slate-200">{currentEmployee.joiningDate}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">National ID (NID)</span>
                <span className="font-bold text-slate-900 dark:text-slate-200">
                  {currentEmployee.nidNumber && currentEmployee.nidNumber.trim() !== ""
                    ? currentEmployee.nidNumber
                    : "তথ্য দেওয়া হয়নি (Not provided)"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Blood Group</span>
                <span className="font-bold text-red-500 dark:text-red-400">{currentEmployee.bloodGroup}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Bank Account</span>
                <span className="font-bold text-slate-900 dark:text-slate-200">
                  {currentEmployee.bankName} - {currentEmployee.bankAccountNumber}
                </span>
              </div>
              <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Present Residential Address</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {currentEmployee.presentAddress && currentEmployee.presentAddress.trim() !== ""
                    ? currentEmployee.presentAddress
                    : "তথ্য দেওয়া হয়নি (Not provided)"}
                </span>
              </div>
            </div>

            {/* Digital ID Card Action Banner */}
            {onOpenDigitalIdCard && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50 via-emerald-50/50 to-teal-50 dark:from-teal-950/60 dark:via-slate-850 dark:to-slate-900 border border-teal-200 dark:border-teal-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>অফিসিয়াল ডিজিটাল আইডি কার্ড (Digital ID Badge)</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        VERIFIED
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      লম্বালম্বি ফরম্যাটে অফিসিয়াল লোগো, ছবি, কিউআর কোড ও হাই-রেজোলিউশন পিএনজি ডাউনলোড করুন
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenDigitalIdCard}
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>আইডি কার্ড ভিউ ও ডাউনলোড</span>
                </button>
              </div>
            )}

            {/* Official Curriculum Vitae (CV) & NID Documents Action Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 via-teal-50/40 to-slate-50 dark:from-slate-850 dark:via-teal-950/30 dark:to-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>অফিসিয়াল সিভি ও এনআইডি ডকুমেন্টেশন (Curriculum Vitae & NID)</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                      A4 RESUME
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    শিক্ষাগত যোগ্যতা, কাজের অভিজ্ঞতা ও এনআইডি কপি আপডেট রাখুন। স্বয়ংক্রিয়ভাবে প্রিন্ট-রেডি A4 সাইজের রিজিউমে তৈরি হয়।
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>ডিগ্রি: <strong className="text-teal-600 dark:text-teal-300">{currentEmployee.cvData?.educations?.length || 2} টি</strong></span>
                    <span>•</span>
                    <span>অভিজ্ঞতা: <strong className="text-teal-600 dark:text-teal-300">{currentEmployee.cvData?.experiences?.length || 1} টি</strong></span>
                    <span>•</span>
                    <span>এনআইডি কপি: <strong className={currentEmployee.nidCardFrontUrl ? "text-emerald-500" : "text-amber-500"}>{currentEmployee.nidCardFrontUrl ? "যুক্ত আছে" : "যুক্ত করা হয়নি"}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowEditCVModal(true)}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>সিভি আপডেট করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowViewA4ResumeModal(true)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>A4 রিজিউমে প্রিন্ট</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: My Attendance Logs */}
      {activeSubTab === "attendance" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Biometric & GPS Attendance Logs</h3>
            <button
              onClick={onOpenAttendanceModal}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5"
            >
              <ScanFace className="w-4 h-4" />
              <span>Biometric Clock In</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Check-In</th>
                  <th className="p-3">Check-Out</th>
                  <th className="p-3">Working Hours</th>
                  <th className="p-3">Distance & GPS Location</th>
                  <th className="p-3">Biometric Match</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {myAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{rec.date}</td>
                    <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{rec.checkInTime}</td>
                    <td className="p-3 font-mono text-blue-600 dark:text-blue-400">{rec.checkOutTime || "Active"}</td>
                    <td className="p-3">
                      {Math.floor((rec.totalWorkMinutes || 0) / 60)}h {(rec.totalWorkMinutes || 0) % 60}m
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                        <MapPin className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span className="truncate max-w-[200px]">
                          {rec.checkInDistanceMeters || 0}m ({(rec.branchName || "Main Office").split("(")[0]})
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        {rec.checkInFaceMatchScore || 98.2}% Liveness
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === "PRESENT"
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Salary & Payslips */}
      {activeSubTab === "payslips" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                মাসিক পে-স্লিপ ও বিতরণ বিবরণী (My Monthly Payslips)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                সকল মাসের প্রাপ্ত বেতনের পে-স্লিপ দেখুন এবং সরাসরি ডাউনলোড বা প্রিন্ট করুন
              </p>
            </div>
            {!currentEmployee.hideSalaryFromSelf ? (
              <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
                Gross Monthly Salary: ৳{(currentEmployee.salary?.grossSalary ?? 0).toLocaleString()}
              </span>
            ) : (
              <span className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>পে-স্লিপ ডাউনলোড সার্ভিস সক্রিয়</span>
              </span>
            )}
          </div>

          {currentEmployee.hideSalaryFromSelf && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                প্রতিষ্ঠানের পলিসি অনুযায়ী মূল বেতন কাঠামো গোপন রাখা হলেও আপনি আপনার সকল মাসের পরিশোধিত পে-স্লিপ দেখতে এবং ডাউনলোড করতে পারবেন।
              </span>
            </div>
          )}

          {myPayslips.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              এখনও কোনো পে-স্লিপ তৈরি করা হয়নি। পে-রোল প্রক্রিয়াকরণ সম্পন্ন হলে আপনার পে-স্লিপ এখানে পাওয়া যাবে।
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {myPayslips.map((slip) => (
                <div
                  key={slip.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{slip.payrollMonth} Payslip</span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{slip.paymentDate || "Processed"}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      {slip.paymentStatus}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span>Gross Earnings:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">৳{(slip.grossEarnings ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Total Deductions:</span>
                      <span className="text-red-500 dark:text-red-400">-৳{(slip.totalDeductions ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 dark:text-slate-200 font-bold pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span>Net Disbursed:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm">৳{(slip.netSalary ?? 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onViewPayslip(slip)}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>পে-স্লিপ দেখুন ও ডাউনলোড করুন (Download)</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Leave Requests */}
      {activeSubTab === "leaves" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Leave Requests & Balance</h3>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Apply Leave</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Casual Leave Balance</span>
              <span className="text-lg font-black text-teal-600 dark:text-teal-400">10 / 14 Days</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Sick Leave Balance</span>
              <span className="text-lg font-black text-blue-600 dark:text-blue-400">12 / 14 Days</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Annual Earned Leave</span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400">15 Days</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Special Leave</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">Allowed</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">My Leave Application History</h4>
            {myLeaves.map((l) => (
              <div
                key={l.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{l.leaveType} Leave</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      ({l.startDate} to {l.endDate} • {l.totalDays} Days)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 italic">"{l.reason}"</p>
                  {l.reviewerComments && (
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">
                      HR Note: {l.reviewerComments}
                    </p>
                  )}
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    l.status === "APPROVED"
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                      : l.status === "PENDING"
                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                      : "bg-red-500/20 text-red-700 dark:text-red-300"
                  }`}
                >
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Loans & Advances */}
      {activeSubTab === "loans" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Active Loans & EMI Schedule</h3>
            <button
              onClick={() => setShowLoanModal(true)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Apply Loan / Advance</span>
            </button>
          </div>

          <div className="space-y-3">
            {myLoans.map((loan) => (
              <div
                key={loan.id}
                className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">৳{(loan.amount ?? 0).toLocaleString()} Loan</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{loan.reason}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    {loan.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-transparent">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Monthly EMI</span>
                    <span className="font-bold text-slate-900 dark:text-white">৳{(loan.monthlyEmi ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-transparent">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Paid Installments</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {loan.paidInstallments} / {loan.totalInstallments}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-transparent">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Remaining Balance</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      ৳{(loan.remainingAmount ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Assigned Assets */}
      {activeSubTab === "assets" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Company Assets Assigned To Me</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myAssets.map((ast) => (
              <div
                key={ast.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                      {ast.category} • {ast.assetCode}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{ast.name}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300">
                    {ast.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Serial Number:</span>
                    <span className="font-mono text-slate-900 dark:text-slate-200">{ast.serialNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Assigned Date:</span>
                    <span>{ast.assignmentDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Condition:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{ast.condition}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Password & Security (Self-Service) */}
      {activeSubTab === "security" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Left Column: Account Credentials Overview */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    লগইন অ্যাকাউন্ট তথ্য (Account Identity)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    আপনার ডিজিটাল কর্মস্থল অ্যাক্সেস প্রোফাইল
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
                    লগইন ইউজার আইডি (Login Username)
                  </span>
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400 text-sm">
                    {currentEmployee.username || currentEmployee.email.split("@")[0]}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    লগইনের সময় এই আইডি অথবা আপনার অফিসিয়াল ইমেইল দিতে পারেন।
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
                    অফিসিয়াল ইমেইল (Official Email)
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">
                    {currentEmployee.email}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
                    এমপ্লয়ি কোড ও শাখা
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-bold text-slate-900 dark:text-white">{currentEmployee.employeeCode}</span>
                    <span className="text-slate-500">{currentEmployee.branchName}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
                    পাসওয়ার্ড স্ট্যাটাস (Password Status)
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {currentEmployee.passwordLastChangedAt ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> নিজস্ব পাসওয়ার্ড সক্রিয়
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> প্রাথমিক পাসওয়ার্ড (123456)
                      </span>
                    )}
                  </div>
                  {currentEmployee.passwordLastChangedAt && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      সর্বশেষ আপডেট: {new Date(currentEmployee.passwordLastChangedAt).toLocaleDateString("bn-BD")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Privacy & Admin Control Notice */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                <Lock className="w-4 h-4" />
                <span>নিরাপত্তা পরামর্শ</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                আপনার পাসওয়ার্ড কখনোই অন্য কারো সাথে শেয়ার করবেন না। পাসওয়ার্ড ভুলে গেলে আপনার প্রতিষ্ঠানের সুপার অ্যাডমিন যেকোনো সময় পাসওয়ার্ড রিসেট করে দিতে পারেন।
              </p>
            </div>
          </div>

          {/* Right Column: Change Password Form (2 cols wide on desktop) */}
          <div className="lg:col-span-2 p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    পাসওয়ার্ড পরিবর্তন করুন (Change My Password)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করতে নিয়মিত নতুন পাসওয়ার্ড সেট করুন
                  </p>
                </div>
              </div>
            </div>

            {/* Success Alert */}
            {passwordChangeSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{passwordChangeSuccess}</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                    আপনার নতুন পাসওয়ার্ডটি এখনই কার্যকর হয়েছে। আপনি নিশ্চিন্তে কাজ চালিয়ে যেতে পারেন।
                  </p>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {passwordChangeError && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">ত্রুটি: পাসওয়ার্ড পরিবর্তন করা যায়নি</p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                    {passwordChangeError}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 text-xs">
              {/* Current Password Field */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  বর্তমান পাসওয়ার্ড (Current Password)
                </label>
                <div className="relative max-w-md">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    placeholder="বর্তমান পাসওয়ার্ড লিখুন... (প্রাথমিক: 123456)"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pr-10 text-slate-900 dark:text-white font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  আপনি যদি আগে কখনো পাসওয়ার্ড পরিবর্তন না করে থাকেন, তবে ডিফল্ট পাসওয়ার্ড হলো <strong>123456</strong>
                </span>
              </div>

              {/* New Password Field */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  নতুন পাসওয়ার্ড (New Password)
                </label>
                <div className="relative max-w-md">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="কমপক্ষে ৪ বা তার বেশি অক্ষরের শক্তিশালী পাসওয়ার্ড"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pr-10 text-slate-900 dark:text-white font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password Field */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  নতুন পাসওয়ার্ড নিশ্চিত করুন (Confirm New Password)
                </label>
                <div className="relative max-w-md">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="নতুন পাসওয়ার্ডটি পুনরায় লিখুন"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pr-10 text-slate-900 dark:text-white font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPasswordInput && confirmPasswordInput && (
                  <span className={`text-[11px] font-semibold mt-1.5 flex items-center gap-1 ${
                    newPasswordInput === confirmPasswordInput ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                  }`}>
                    {newPasswordInput === confirmPasswordInput ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> পাসওয়ার্ড দুটি মিলেছে
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" /> নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড এক নয়
                      </>
                    )}
                  </span>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-md shadow-teal-500/20 cursor-pointer flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isChangingPassword ? "সংরক্ষণ করা হচ্ছে..." : "পাসওয়ার্ড আপডেট করুন"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Apply Leave */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4 text-slate-900 dark:text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Apply For Leave
            </h3>

            <form onSubmit={handleLeaveSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="CASUAL">Casual Leave (নৈমিত্তিক ছুটি)</option>
                  <option value="SICK">Sick Leave (অসুস্থতাজনিত ছুটি)</option>
                  <option value="ANNUAL">Annual Earned Leave (বাৎসরিক অর্জিত ছুটি)</option>
                  <option value="MATERNITY">Maternity Leave (মাতৃত্বকালীন ছুটি)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Reason for Leave</label>
                <textarea
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Specify brief reason..."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-bold cursor-pointer"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Apply Loan */}
      {showLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4 text-slate-900 dark:text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Banknote className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Apply For Employee Loan / Advance
            </h3>

            <form onSubmit={handleLoanSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">আবেদনের ধরন (Category) *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLoanCategory("ADVANCE_SALARY")}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      loanCategory === "ADVANCE_SALARY"
                        ? "bg-teal-500/15 border-teal-500 text-teal-900 dark:text-teal-200 font-bold ring-1 ring-teal-500"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="text-xs">অ্যাডভান্স বেতন</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                      পরবর্তী মাসের বেতন থেকে সমন্বয়
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoanCategory("COMPANY_LOAN")}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      loanCategory === "COMPANY_LOAN"
                        ? "bg-blue-500/15 border-blue-500 text-blue-900 dark:text-blue-200 font-bold ring-1 ring-blue-500"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="text-xs">বসের / কোম্পানি লোন</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                      বেতনের বাইরে সরাসরি ফেরত
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  {loanCategory === "ADVANCE_SALARY" ? "অগ্রিম বেতনের পরিমাণ (৳ BDT)" : "ঋণের পরিমাণ (৳ BDT)"}
                </label>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  step={1000}
                  min={1000}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              {loanCategory === "ADVANCE_SALARY" ? (
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    কত মাসে বেতন থেকে কর্তন হবে? (Advance Duration)
                  </label>
                  <select
                    value={loanAdvanceMonths}
                    onChange={(e) => setLoanAdvanceMonths(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-teal-500"
                  >
                    <option value={1}>১ মাস (পরের মাসের বেতনে এককালীন ৳{loanAmount.toLocaleString()} কর্তন)</option>
                    <option value={2}>২ মাস (প্রতি মাসে ৳{Math.round(loanAmount / 2).toLocaleString()} করে কর্তন)</option>
                    <option value={3}>৩ মাস (প্রতি মাসে ৳{Math.round(loanAmount / 3).toLocaleString()} করে কর্তন)</option>
                    <option value={6}>৬ মাস (প্রতি মাসে ৳{Math.round(loanAmount / 6).toLocaleString()} করে কর্তন)</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                      পরিশোধের ধরন (Repayment Method)
                    </label>
                    <select
                      value={loanRepaymentType}
                      onChange={(e) => setLoanRepaymentType(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-500"
                    >
                      <option value="LUMP_SUM">এককালীন সরাসরি বসের কাছে ফেরত (বেতনের বাইরে)</option>
                      <option value="MONTHLY_INSTALLMENT">মাসিক কিস্তিতে অফিসকে ফেরত</option>
                    </select>
                  </div>

                  {loanRepaymentType === "MONTHLY_INSTALLMENT" && (
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">কিস্তির মেয়াদ (মাস)</label>
                      <select
                        value={loanMonths}
                        onChange={(e) => setLoanMonths(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-500"
                      >
                        <option value={3}>৩ মাস (কিস্তি: ৳{Math.round(loanAmount / 3).toLocaleString()})</option>
                        <option value={6}>৬ মাস (কিস্তি: ৳{Math.round(loanAmount / 6).toLocaleString()})</option>
                        <option value={10}>১০ মাস (কিস্তি: ৳{Math.round(loanAmount / 10).toLocaleString()})</option>
                        <option value={12}>১২ মাস (কিস্তি: ৳{Math.round(loanAmount / 12).toLocaleString()})</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">আবেদনের কারণ বা উদ্দেশ্য</label>
                <textarea
                  rows={2}
                  value={loanReason}
                  onChange={(e) => setLoanReason(e.target.value)}
                  placeholder={
                    loanCategory === "ADVANCE_SALARY"
                      ? "অগ্রিম বেতনের কারণ লিখুন (যেমন: বাড়ি ভাড়া, পারিবারিক খরচ)..."
                      : "ব্যক্তিগত লোনের কারণ লিখুন..."
                  }
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoanModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-bold cursor-pointer"
                >
                  Submit Loan Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile & Designation / Multi-Portfolios Edit Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-2xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    প্রোফাইল ও পদবী হালনাগাদ (Edit Profile & Portfolios)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {currentEmployee.fullName} • {currentEmployee.employeeCode}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isCeoOrAdmin ? (
              <div className="p-3 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 text-xs text-teal-950 dark:text-teal-200 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">এক্সিকিউটিভ ও সিইও সুবিধা:</strong>
                  <p className="text-[11px] mt-0.5 text-teal-800 dark:text-teal-300 leading-relaxed">
                    সংস্থার প্রধান / সিইও হিসেবে আপনি নিজের নাম, মূল পদবী এবং মূল বিভাগ এখানে সরাসরি সম্পাদনা ও আপডেট করতে পারেন।
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">ব্যক্তিগত প্রোফাইল এডিট:</strong>
                  <p className="text-[11px] mt-0.5 text-amber-800 dark:text-amber-300">
                    আপনি আপনার নাম, মোবাইল নম্বর, বর্তমান ঠিকানা এবং ছবি পরিবর্তন করতে পারবেন। পদবী ও বিভাগের পরিবর্তনের জন্য সিইও বা এইচআর ম্যানেজারের সাথে যোগাযোগ করুন।
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    পূর্ণ নাম (Full Name) *
                  </label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    মোবাইল নম্বর (Phone) *
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    জরুরি যোগাযোগের নম্বর (Emergency Phone)
                  </label>
                  <input
                    type="tel"
                    value={editEmergencyPhone}
                    onChange={(e) => setEditEmergencyPhone(e.target.value)}
                    placeholder="+880 17XX-XXXXXX"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    রক্তের গ্রুপ (Blood Group)
                  </label>
                  <select
                    value={editBloodGroup}
                    onChange={(e) => setEditBloodGroup(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-teal-500"
                  >
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Present Address */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  বর্তমান ঠিকানা (Present Address)
                </label>
                <input
                  type="text"
                  value={editPresentAddress}
                  onChange={(e) => setEditPresentAddress(e.target.value)}
                  placeholder="বাড়ি/রোড নং, এলাকা, থানা, জেলা"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Avatar URL */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  প্রোফাইল ছবির লিংক (Photo URL)
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={editAvatarUrl}
                    alt="Preview"
                    className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <input
                    type="url"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Primary Designation & Department Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal-600" />
                  <span>মূল পদবী ও বিভাগ (Primary Designation & Department)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      মূল পদবী (Designation Title)
                    </label>
                    {isCeoOrAdmin ? (
                      <input
                        type="text"
                        value={editDesignationTitle}
                        onChange={(e) => setEditDesignationTitle(e.target.value)}
                        placeholder="যেমন: Chief Executive Officer / IT Manager"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-teal-500"
                        required
                      />
                    ) : (
                      <div className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-500 font-medium">
                        {currentEmployee.designationTitle}
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-normal mt-0.5">
                          🔒 শুধুমাত্র সিইও দ্বারা পরিবর্তনযোগ্য
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      মূল বিভাগ (Primary Department)
                    </label>
                    {isCeoOrAdmin ? (
                      <input
                        type="text"
                        value={editDepartmentName}
                        onChange={(e) => setEditDepartmentName(e.target.value)}
                        placeholder="যেমন: Executive Management / IT & Systems"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-teal-500"
                        required
                      />
                    ) : (
                      <div className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-500 font-medium">
                        {currentEmployee.departmentName}
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-normal mt-0.5">
                          🔒 শুধুমাত্র সিইও দ্বারা পরিবর্তনযোগ্য
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>তথ্য সংরক্ষণ করুন (Save)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Biometric Face Photo Enrollment Modal */}
      {showFaceEnrollModal && (
        <FaceEnrollmentModal
          isOpen={showFaceEnrollModal}
          onClose={() => setShowFaceEnrollModal(false)}
          employee={
            candidateUploadedPhoto
              ? {
                  ...currentEmployee,
                  faceRegisteredPhoto: candidateUploadedPhoto,
                  avatarUrl: candidateUploadedPhoto,
                  faceTemplateRegistered: false,
                  faceVerified: false,
                  faceVerificationScore: undefined,
                }
              : currentEmployee
          }
          isSuperAdmin={currentEmployee.role === "SUPER_ADMIN"}
          onSaveFacePhoto={(empId, photoUrl, verificationScore, faceDescriptor) => {
            if (onUpdateFacePhoto) {
              onUpdateFacePhoto(empId, photoUrl, verificationScore, faceDescriptor);
            }
            setCandidateUploadedPhoto(null);
            setShowFaceEnrollModal(false);
          }}
        />
      )}

      {/* Edit Employee CV & Qualifications Modal */}
      {showEditCVModal && (
        <EditEmployeeCVModal
          isOpen={showEditCVModal}
          onClose={() => setShowEditCVModal(false)}
          employee={currentEmployee}
          isBangla={true}
          onSaveCV={(updated) => {
            if (onUpdateEmployee) {
              onUpdateEmployee(updated);
            }
          }}
        />
      )}

      {/* View & Print A4 Resume Modal */}
      {showViewA4ResumeModal && (
        <ViewA4ResumeModal
          isOpen={showViewA4ResumeModal}
          onClose={() => setShowViewA4ResumeModal(false)}
          employee={currentEmployee}
          isBangla={true}
          onOpenEdit={() => {
            setShowViewA4ResumeModal(false);
            setShowEditCVModal(true);
          }}
        />
      )}
    </div>
  );
};
