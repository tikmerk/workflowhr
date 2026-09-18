import React, { useState, useRef } from "react";
import {
  X,
  User,
  KeyRound,
  Camera,
  FileText,
  Save,
  CheckCircle2,
  AlertTriangle,
  ScanFace,
  Eye,
  EyeOff,
  Lock,
  Upload,
  Sparkles,
  Phone,
  Shield,
  Printer,
  ChevronRight,
} from "lucide-react";
import { Employee } from "../../types";

interface ProfileSettingsModalProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  onUpdateEmployee: (updated: Employee) => void;
  onOpenEditCV?: () => void;
  onOpenViewA4Resume?: () => void;
  onOpenFaceEnrollModal?: () => void;
  isBangla?: boolean;
  initialTab?: "profile" | "cv" | "password" | "photo";
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  employee,
  isOpen,
  onClose,
  onUpdateEmployee,
  onOpenEditCV,
  onOpenViewA4Resume,
  onOpenFaceEnrollModal,
  isBangla = true,
  initialTab = "profile",
}) => {
  const [activeTab, setActiveTab] = useState<"profile" | "cv" | "password" | "photo">(initialTab);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // Profile fields
  const [fullName, setFullName] = useState(employee.fullName);
  const [phone, setPhone] = useState(employee.phone);
  const [emergencyPhone, setEmergencyPhone] = useState(employee.emergencyPhone || "");
  const [presentAddress, setPresentAddress] = useState(employee.presentAddress || "");
  const [bloodGroup, setBloodGroup] = useState(employee.bloodGroup || "O+");
  const [designationTitle, setDesignationTitle] = useState(employee.designationTitle);
  const [departmentName, setDepartmentName] = useState(employee.departmentName);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Photo
  const [avatarPreview, setAvatarPreview] = useState(employee.avatarUrl);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  if (!isOpen) return null;

  const isFaceVerified = Boolean(
    employee.faceTemplateRegistered &&
    employee.faceVerified &&
    typeof employee.faceVerificationScore === "number" &&
    employee.faceVerificationScore > 0
  );

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Employee = {
      ...employee,
      fullName: fullName.trim() || employee.fullName,
      phone: phone.trim() || employee.phone,
      emergencyPhone: emergencyPhone.trim() || employee.emergencyPhone,
      presentAddress: presentAddress.trim() || employee.presentAddress,
      bloodGroup: bloodGroup as any,
      designationTitle,
      departmentName,
      avatarUrl: avatarPreview,
    };
    onUpdateEmployee(updated);
    setSaveSuccessMsg(isBangla ? "প্রোফাইল তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!" : "Profile updated successfully!");
    setTimeout(() => setSaveSuccessMsg(""), 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    const actualCurrentPass = employee.password || "123456";
    if (currentPassword !== actualCurrentPass) {
      setPasswordMsg({
        type: "error",
        text: isBangla ? "বর্তমান পাসওয়ার্ডটি সঠিক নয়!" : "Current password is incorrect!",
      });
      return;
    }

    if (newPassword.length < 4) {
      setPasswordMsg({
        type: "error",
        text: isBangla ? "নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।" : "New password must be at least 4 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({
        type: "error",
        text: isBangla ? "নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না!" : "New passwords do not match!",
      });
      return;
    }

    const updated: Employee = {
      ...employee,
      password: newPassword,
      passwordLastChangedAt: new Date().toISOString(),
    };

    onUpdateEmployee(updated);
    setPasswordMsg({
      type: "success",
      text: isBangla ? "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!" : "Password successfully updated!",
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatarPreview(dataUrl);
        const updated: Employee = {
          ...employee,
          avatarUrl: dataUrl,
        };
        onUpdateEmployee(updated);
        setSaveSuccessMsg(isBangla ? "নতুন ছবি সফলভাবে আপডেট হয়েছে!" : "Photo updated successfully!");
        setTimeout(() => setSaveSuccessMsg(""), 3000);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isBangla ? "প্রোফাইল সেটিংস ও নিয়ন্ত্রণ" : "Profile Settings & Account Hub"}
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

        {/* Global Toast Success Message */}
        {saveSuccessMsg && (
          <div className="px-6 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 gap-2 text-xs font-bold shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "profile"
                ? "border-teal-500 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <User className="w-4 h-4" />
            <span>{isBangla ? "এডিট প্রোফাইল" : "Edit Profile"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cv")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "cv"
                ? "border-teal-500 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isBangla ? "এডিট সিভি ও রিজিউমে" : "CV & Resume"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("password")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "password"
                ? "border-teal-500 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>{isBangla ? "পাসওয়ার্ড পরিবর্তন" : "Change Password"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("photo")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "photo"
                ? "border-teal-500 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{isBangla ? "ছবি ও বায়োমেট্রিক" : "Photo & Biometrics"}</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: EDIT PROFILE */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSave} className="space-y-4">
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
                    {isBangla ? "মোবাইল ফোন নম্বর*" : "Phone Number*"}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "জরুরী যোগাযোগ (Emergency Contact)" : "Emergency Phone"}
                  </label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="e.g. 01700000000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "রক্তের গ্রুপ (Blood Group)" : "Blood Group"}
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

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "বর্তমান ঠিকানা (Present Address)*" : "Present Residential Address*"}
                  </label>
                  <textarea
                    rows={2}
                    value={presentAddress}
                    onChange={(e) => setPresentAddress(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-teal-500/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{isBangla ? "প্রোফাইল সংরক্ষণ করুন" : "Save Profile"}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CV & RESUME MANAGEMENT */}
          {activeTab === "cv" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-slate-50 dark:from-teal-950/40 dark:via-emerald-950/20 dark:to-slate-900 border border-teal-500/30">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span>{isBangla ? "কর্মীর অফিসিয়াল সিভি ও রিজিউমে সিস্টেম" : "Official CV & Resume Hub"}</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {isBangla
                        ? "এখানে আপনি আপনার ব্যক্তিগত বিবরণ, শিক্ষাগত যোগ্যতা, পূর্বের কাজের অভিজ্ঞতা, আইটি স্কিল ও ভাষা দক্ষতা আপডেট রাখতে পারবেন। ভিউতে ক্লিক করে তাৎক্ষণিক প্রিন্ট-রেডি A4 রিজিউমে দেখতে বা ডাউনলোড করতে পারবেন।"
                        : "Maintain comprehensive education, past work history, computer skills, and language competencies. Generate an authentic A4 PDF resume anytime."}
                    </p>
                  </div>
                </div>

                {/* Live Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {isBangla ? "শিক্ষাগত ডিগ্রি" : "Degrees"}
                    </span>
                    <span className="text-base font-bold text-teal-600 dark:text-teal-400">
                      {employee.cvData?.educations?.length || 2} টি
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {isBangla ? "কাজের অভিজ্ঞতা" : "Experience"}
                    </span>
                    <span className="text-base font-bold text-teal-600 dark:text-teal-400">
                      {employee.cvData?.experiences?.length || 1} টি
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {isBangla ? "আইটি স্কিলস" : "Skills"}
                    </span>
                    <span className="text-base font-bold text-teal-600 dark:text-teal-400">
                      {employee.cvData?.computerSkills?.length || 5} টি
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {isBangla ? "এনআইডি কপি" : "NID Copy"}
                    </span>
                    <span className={`text-base font-bold ${employee.nidCardFrontUrl ? "text-emerald-500" : "text-amber-500"}`}>
                      {employee.nidCardFrontUrl ? (isBangla ? "যুক্ত" : "Attached") : (isBangla ? "অনুপস্থিত" : "Pending")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Separate Edit CV & View A4 Resume */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenEditCV) onOpenEditCV();
                  }}
                  className="p-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-md shadow-teal-500/20 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/20">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-black">
                        {isBangla ? "সিভি এডিট করুন (Edit CV)" : "Edit Curriculum Vitae"}
                      </div>
                      <div className="text-[10.5px] text-teal-100 font-normal mt-0.5">
                        {isBangla ? "ডিগ্রি, অভিজ্ঞতা ও স্কিলস সংশোধন" : "Update degrees, jobs and skills"}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenViewA4Resume) onOpenViewA4Resume();
                  }}
                  className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-md group border border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-black text-teal-300">
                        {isBangla ? "সিভি দেখুন ও প্রিন্ট (A4 Resume)" : "View & Print A4 Resume"}
                      </div>
                      <div className="text-[10.5px] text-slate-400 font-normal mt-0.5">
                        {isBangla ? "প্রিন্ট ও এ-ফোর PDF কপি ডাউনলোড" : "Instant A4 preview and print"}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-teal-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CHANGE PASSWORD */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passwordMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    passwordMsg.type === "success"
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                      : "bg-rose-500/15 border-rose-500/30 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  {passwordMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "বর্তমান পাসওয়ার্ড*" : "Current Password*"}
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="বর্তমান পাসওয়ার্ড দিন"
                      className="w-full px-3 py-2 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "নতুন পাসওয়ার্ড (কমপক্ষে ৪ অক্ষর)*" : "New Password (min 4 characters)*"}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="নতুন শক্তিশালী পাসওয়ার্ড লিখুন"
                      className="w-full px-3 py-2 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {isBangla ? "নতুন পাসওয়ার্ড নিশ্চিত করুন*" : "Confirm New Password*"}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="নতুন পাসওয়ার্ড পুনরায় লিখুন"
                      className="w-full px-3 py-2 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-teal-500/20"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isBangla ? "পাসওয়ার্ড আপডেট করুন" : "Update Password"}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: PHOTO & BIOMETRICS */}
          {activeTab === "photo" && (
            <div className="space-y-5">
              <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoFile}
                accept="image/*"
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-teal-500 shadow-xl bg-slate-200 dark:bg-slate-800 shrink-0">
                  <img
                    src={avatarPreview}
                    alt={employee.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isBangla ? "প্রোফাইল ছবি পরিবর্তন" : "Change Profile Photo"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {isBangla
                      ? "আপনার স্পষ্ট মুখমণ্ডলের ছবি আপলোড করুন। এই ছবিটি আপনার পরিচয়পত্র এবং স্মার্ট উপস্থিতির জন্য ব্যবহৃত হবে।"
                      : "Upload a clear headshot image. This is utilized for digital ID and biometric verification."}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isBangla ? "ডিভাইস থেকে আপলোড" : "Upload from Device"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Biometric Verification Status */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ScanFace className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {isBangla ? "লাইভ ফেস বায়োমেট্রিক স্ট্যাটাস" : "Live Face Biometric Enrollment"}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isFaceVerified
                          ? isBangla
                            ? `সফলভাবে ভেরিফাইড (${employee.faceVerificationScore}% ম্যাচ স্কোর)`
                            : `Verified (${employee.faceVerificationScore}% match score)`
                          : isBangla
                          ? "উপস্থিতি দিতে লাইভ ক্যামেরা ভেরিফিকেশন প্রয়োজন"
                          : "Live camera check pending"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isFaceVerified
                        ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                        : "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                    }`}
                  >
                    {isFaceVerified ? (isBangla ? "ভেরিফাইড" : "Verified") : (isBangla ? "অপেক্ষমান" : "Pending")}
                  </span>
                </div>

                {onOpenFaceEnrollModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenFaceEnrollModal();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
                  >
                    <ScanFace className="w-4 h-4 text-teal-400" />
                    <span>
                      {isFaceVerified
                        ? isBangla
                          ? "পুনরায় লাইভ ফেস স্ক্যান / ভেরিফাই করুন"
                          : "Re-verify Face with Camera"
                        : isBangla
                        ? "এখনই ক্যামেরা দিয়ে মুখমণ্ডল স্ক্যান করুন"
                        : "Scan Face Now with Camera"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
