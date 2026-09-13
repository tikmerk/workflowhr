import React, { useState } from "react";
import {
  RotateCcw,
  AlertTriangle,
  Building2,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  X,
  CheckCircle2,
  Lock,
  RefreshCw,
  Crown,
  Users,
  Layers,
} from "lucide-react";
import { Branch, Employee } from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { useCompanyBranding } from "../../context/CompanyBrandingContext";
import {
  resetOrganizationDataInFirestore,
  OrganizationResetOptions,
} from "../../services/firestoreService";

interface OrganizationResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSuperAdmin: Employee;
  branches: Branch[];
  onResetComplete: (options: {
    targetBranchId: string;
    resetDepartments: boolean;
    resetDesignations: boolean;
    newCompanyName?: string;
  }) => void;
}

export const OrganizationResetModal: React.FC<OrganizationResetModalProps> = ({
  isOpen,
  onClose,
  currentSuperAdmin,
  branches,
  onResetComplete,
}) => {
  const { isBangla } = useThemeLanguage();
  const { branding, updateBranding } = useCompanyBranding();

  // Selection
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [newCompanyName, setNewCompanyName] = useState<string>(branding?.companyName || "WorkflowHR Enterprise");
  
  // Options
  const [resetEmployees, setResetEmployees] = useState(true);
  const [resetAttendance, setResetAttendance] = useState(true);
  const [resetLeavesAndLoans, setResetLeavesAndLoans] = useState(true);
  const [resetPayroll, setResetPayroll] = useState(true);
  const [resetRecruitment, setResetRecruitment] = useState(true);
  const [resetDepartments, setResetDepartments] = useState(false);
  const [resetDesignations, setResetDesignations] = useState(false);

  // Safety confirmation
  const [confirmInput, setConfirmInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmed =
    confirmInput.trim().toUpperCase() === "RESET" ||
    confirmInput.trim() === "রিসেট" ||
    confirmInput.trim() === "নিশ্চিত";

  const selectedBranchName =
    selectedBranchId === "ALL"
      ? (isBangla ? "সম্পূর্ণ প্রতিষ্ঠান (সকল শাখা)" : "Entire Organization (All Branches)")
      : branches.find((b) => b.id === selectedBranchId)?.name || selectedBranchId;

  const handleExecuteReset = async () => {
    if (!isConfirmed || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const resetParams: OrganizationResetOptions = {
        branchId: selectedBranchId === "ALL" ? undefined : selectedBranchId,
        branchName: selectedBranchName,
        keepSuperAdminId: currentSuperAdmin.id,
        resetEmployees,
        resetAttendance,
        resetLeavesAndLoans,
        resetPayroll,
        resetRecruitment,
        resetDepartments,
        resetDesignations,
      };

      const result = await resetOrganizationDataInFirestore(resetParams);

      if (result.success) {
        // Update company name if changed
        if (newCompanyName.trim() && newCompanyName !== branding.companyName) {
          updateBranding({ companyName: newCompanyName.trim() });
        }

        onResetComplete({
          targetBranchId: selectedBranchId,
          resetDepartments,
          resetDesignations,
          newCompanyName: newCompanyName.trim(),
        });

        onClose();
      } else {
        setErrorMessage(result.message);
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error("Reset failed:", err);
      setErrorMessage(err?.message || "রিসেট প্রক্রিয়া ব্যর্থ হয়েছে");
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="org-reset-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="org-reset-modal-content"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 my-auto flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>প্রতিষ্ঠান ডাটা রিসেট (Organization Reset)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold border border-rose-500/30">
                  সুপার অ্যাডমিন
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                পুরাতন ডামি তথ্য মুছে নতুন করে নিজের প্রতিষ্ঠানের সেটআপ তৈরি করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Active Super Admin Safety Card */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300/60 dark:border-emerald-800/60 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 flex-1">
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <span>সুপার অ্যাডমিন অ্যাকাউন্ট সম্পূর্ণ সুরক্ষিত (Protected)</span>
                <Crown className="w-3.5 h-3.5 text-amber-500" />
              </h4>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                রিসেটের সময় আপনার সুপার অ্যাডমিন অ্যাকাউন্ট (<strong>{currentSuperAdmin.fullName}</strong>, কোড: {currentSuperAdmin.employeeCode}) ডিলিট হবে না এবং সেশন অক্ষত থাকবে। কেবল অন্যান্য ডামি কর্মকর্তা ও পুরনো হিস্ট্রি রিসেট হবে।
              </p>
            </div>
          </div>

          {/* Target Branch / Scope Selection */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              আপনি কোন প্রতিষ্ঠানের/শাখার জন্য রিসেট করতে চান? *
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">
                🌐 সম্পূর্ণ প্রতিষ্ঠান (All Branches, Staff & Departments)
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  🏢 {b.name} ({b.code}) — {b.city}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              নির্দিষ্ট কোনো ব্রাঞ্চ নির্বাচন করলে শুধুমাত্র ওই ব্রাঞ্চের তথ্য রিসেট হবে। সম্পূর্ণ প্রতিষ্ঠান দিলে সবগুলো শাখার ডাটা ফ্রেশ হবে।
            </p>
          </div>

          {/* Company Name Update */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              প্রতিষ্ঠানের নাম (Company / Organization Name)
            </label>
            <input
              type="text"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="যেমন: গ্রিন ডেল্টা এন্টারপ্রাইজ / ব্র্যাক জেলা হাব"
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
            />
          </div>

          {/* Granular Reset Checklist */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              কি কি তথ্য রিসেট বা পরিষ্কার করতে চান:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-rose-300 transition-colors">
                <input
                  type="checkbox"
                  checked={resetEmployees}
                  onChange={(e) => setResetEmployees(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-rose-500" />
                    <span>কর্মচারী তালিকা পরিষ্কার</span>
                  </div>
                  <p className="text-[10px] text-slate-500">সুপার অ্যাডমিন বাদে অন্য সকল কর্মচারী মুছে ফেলা হবে</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-rose-300 transition-colors">
                <input
                  type="checkbox"
                  checked={resetAttendance}
                  onChange={(e) => setResetAttendance(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">হাজিরা লগ মুছে ফেলুন</div>
                  <p className="text-[10px] text-slate-500">পূর্বের সমস্ত বায়োমেট্রিক ও ম্যানুয়াল হাজিরার ডাটা ক্লিয়ার হবে</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-rose-300 transition-colors">
                <input
                  type="checkbox"
                  checked={resetLeavesAndLoans}
                  onChange={(e) => setResetLeavesAndLoans(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">ছুটি ও ঋণের রেকর্ড ক্লিয়ার</div>
                  <p className="text-[10px] text-slate-500">সকল বিগত আবেদন ও বিতরণকৃত ঋণের রেকর্ড মুছে যাবে</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-rose-300 transition-colors">
                <input
                  type="checkbox"
                  checked={resetPayroll}
                  onChange={(e) => setResetPayroll(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">পে-রোল ও পে-স্লিপ ক্লিয়ার</div>
                  <p className="text-[10px] text-slate-500">পূর্বের মাসের বেতন ও ভাউচার হিস্ট্রি ফ্রেশ হবে</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-rose-300 transition-colors">
                <input
                  type="checkbox"
                  checked={resetDepartments}
                  onChange={(e) => setResetDepartments(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>ডিপার্টমেন্ট ক্লিয়ার (Clean Slate)</span>
                  </div>
                  <p className="text-[10px] text-slate-500">ডিপার্টমেন্ট নতুন করে নিজে যোগ করতে চাইলে টিক দিন</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-rose-300 transition-colors">
                <input
                  type="checkbox"
                  checked={resetDesignations}
                  onChange={(e) => setResetDesignations(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-teal-500" />
                    <span>পদবি তালিকা ক্লিয়ার (Clean Slate)</span>
                  </div>
                  <p className="text-[10px] text-slate-500">পদবিগুলো নতুন করে নিজে যোগ করতে চাইলে টিক দিন</p>
                </div>
              </label>
            </div>
          </div>

          {/* Security Type Confirmation */}
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>নিশ্চিতকরণ নিরাপত্তা যাচাই (Safety Confirmation)</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              রিসেট প্রক্রিয়াটি নিশ্চিত করতে নিচের ইনপুটে <strong>RESET</strong> অথবা <strong>রিসেট</strong> লিখুন:
            </p>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="টাইপ করুন: RESET"
              className="w-full bg-white dark:bg-slate-950 border border-rose-300 dark:border-rose-800 rounded-xl p-2 text-xs font-mono font-bold tracking-wider text-rose-600 dark:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-400 text-xs">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            বাতিল (Cancel)
          </button>

          <button
            type="button"
            onClick={handleExecuteReset}
            disabled={!isConfirmed || isProcessing}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isConfirmed && !isProcessing
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>প্রতিষ্ঠান রিসেট হচ্ছে...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>নিশ্চিতভাবে রিসেট সম্পন্ন করুন</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
