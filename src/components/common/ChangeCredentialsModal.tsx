import React, { useState } from "react";
import {
  KeyRound,
  Lock,
  User,
  Eye,
  EyeOff,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Save,
} from "lucide-react";
import { Employee } from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";

interface ChangeCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  allEmployees?: Employee[];
  onUpdateEmployee: (updated: Employee) => void;
}

export const ChangeCredentialsModal: React.FC<ChangeCredentialsModalProps> = ({
  isOpen,
  onClose,
  employee,
  allEmployees = [],
  onUpdateEmployee,
}) => {
  const { t } = useThemeLanguage();

  const [username, setUsername] = useState(employee.username || employee.employeeCode || "");
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const actualCurrentPassword = employee.password || "123456";

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setErrorMsg(t("ইউজারনেম খালি রাখা যাবে না।", "Username cannot be empty."));
      return;
    }

    // Check username uniqueness if changed
    const isTaken = allEmployees.some(
      (emp) =>
        emp.id !== employee.id &&
        ((emp.username && emp.username.toLowerCase() === trimmedUsername.toLowerCase()) ||
          emp.employeeCode.toLowerCase() === trimmedUsername.toLowerCase())
    );
    if (isTaken) {
      setErrorMsg(
        t(
          `'${trimmedUsername}' ইউজারনেমটি অন্য একজন কর্মীর রয়েছে। অনুগ্রহ করে ভিন্ন ইউজারনেম দিন।`,
          `'${trimmedUsername}' is already in use by another user. Please choose a different one.`
        )
      );
      return;
    }

    // Password validation (if user entered something in newPassword)
    let finalPassword = actualCurrentPassword;
    if (newPassword.trim()) {
      if (newPassword.length < 4) {
        setErrorMsg(t("পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।", "Password must be at least 4 characters."));
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg(
          t(
            "নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না।",
            "New password and confirm password do not match."
          )
        );
        return;
      }
      finalPassword = newPassword.trim();
    }

    const updatedEmployee: Employee = {
      ...employee,
      username: trimmedUsername,
      password: finalPassword,
    };

    onUpdateEmployee(updatedEmployee);

    setSuccessMsg(
      t(
        "লগইন তথ্য সফলভাবে পরিবর্তিত হয়েছে! পরবর্তী লগইনে আপনার এই নতুন ইউজারনেম ও পাসওয়ার্ড ব্যবহার করবেন।",
        "Credentials updated successfully! Use your new username and password for future logins."
      )
    );

    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 text-slate-900 dark:text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t("আমার লগইন তথ্য ও পাসওয়ার্ড পরিবর্তন", "Change My Login Credentials & Password")}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {employee.fullName} ({employee.employeeCode} - {employee.role})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Credentials Quick Card */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
              {t("বর্তমান লগইন তথ্য (নোট বা কপি করে রাখুন)", "Current Credentials (Keep for your records)")}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              {t("লগআউটের পূর্বে এটি জানা আবশ্যক", "Ensure you know this before logout")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">
                {t("আইডি / ইউজারনেম:", "ID / Username:")}
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono font-bold text-slate-900 dark:text-white truncate">
                  {employee.username || employee.employeeCode}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(employee.username || employee.employeeCode, "current-user")}
                  title={t("কপি করুন", "Copy")}
                  className="p-1 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer"
                >
                  {copiedField === "current-user" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">
                {t("বর্তমান পাসওয়ার্ড:", "Current Password:")}
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {showCurrentPassword ? actualCurrentPassword : "••••••"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(actualCurrentPassword, "current-pass")}
                    title={t("পাসওয়ার্ড কপি করুন", "Copy password")}
                    className="p-1 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer"
                  >
                    {copiedField === "current-pass" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback banners */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-500" />
              <span>{t("নতুন ইউজারনেম (Login Username)", "Login Username")}</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin, ibrahim, or your employee ID"
              className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
            <p className="text-[10.5px] text-slate-500 mt-1">
              {t(
                "আপনি এই ইউজারনেম অথবা আপনার এমপ্লয়ী কোড (" + employee.employeeCode + ") দিয়েও লগইন করতে পারবেন।",
                "You can log in using this username or your employee ID (" + employee.employeeCode + ")."
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-teal-500" />
                <span>{t("নতুন পাসওয়ার্ড", "New Password")}</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("নতুন পাসওয়ার্ড লিখুন", "Enter new password")}
                  className="w-full px-3.5 py-2.5 pr-9 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-teal-500" />
                <span>{t("কনফার্ম পাসওয়ার্ড", "Confirm Password")}</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("পাসওয়ার্ডটি পুনরায় লিখুন", "Retype password")}
                  className="w-full px-3.5 py-2.5 pr-9 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {t("বাতিল", "Cancel")}
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{t("সংরক্ষণ করুন", "Save Credentials")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
