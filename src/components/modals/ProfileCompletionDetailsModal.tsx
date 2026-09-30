import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  FileText,
  Edit2,
  UserCheck,
  AlertTriangle,
  Award,
  Sparkles,
} from "lucide-react";
import { Employee } from "../../types";
import {
  calculateEmployeeProfileCompletion,
  generateEmployeeProfileReminderMessage,
  ProfileCompletionReport,
} from "../../utils/profileCompletion";

interface ProfileCompletionDetailsModalProps {
  employee: Employee;
  isOpen: boolean;
  isBangla?: boolean;
  onClose: () => void;
  onOpenEditCV?: (emp: Employee) => void;
  onOpenEditProfile?: (emp: Employee) => void;
}

export const ProfileCompletionDetailsModal: React.FC<ProfileCompletionDetailsModalProps> = ({
  employee,
  isOpen,
  isBangla = true,
  onClose,
  onOpenEditCV,
  onOpenEditProfile,
}) => {
  const [copied, setCopied] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "missing" | "completed">("missing");

  if (!isOpen) return null;

  const report: ProfileCompletionReport = calculateEmployeeProfileCompletion(employee);

  const handleCopyReminder = () => {
    const text = generateEmployeeProfileReminderMessage(employee, report, isBangla);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const displayedItems =
    filterTab === "missing"
      ? report.missingItems
      : filterTab === "completed"
      ? report.completedItems
      : report.items;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto border border-slate-200 dark:border-slate-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isBangla ? "প্রোফাইল ও সিভি কমপ্লিশন রিপোর্ট" : "Profile & CV Completion Audit"}
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${report.badgeBg} ${report.badgeText} ${report.badgeBorder}`}
                >
                  {isBangla ? report.statusTextBn : report.statusTextEn}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBangla
                  ? "সুপার অ্যাডমিন অডিট ও তথ্য হালনাগাদ নিরীক্ষা"
                  : "Super Admin audit & profile data completeness check"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto grow">
          {/* Employee Card Overview */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={employee.avatarUrl}
                alt={employee.fullName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-500 shrink-0"
              />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {employee.fullName}
                </h4>
                <p className="text-xs text-teal-700 dark:text-teal-400 font-medium">
                  {employee.designationTitle}
                </p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                  <span>ID: {employee.employeeCode}</span>
                  <span>•</span>
                  <span>{employee.branchName?.split("(")[0]}</span>
                </div>
              </div>
            </div>

            {/* Score Ring / Block */}
            <div className="flex flex-col items-center sm:items-end justify-center px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 min-w-[120px]">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {isBangla ? "মোট পূরণকৃত" : "Completed Score"}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {report.percentage}%
                </span>
                <span className="text-[11px] text-slate-400 font-mono">/ 100</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5 border border-slate-200 dark:border-slate-700">
                <div
                  className={`h-full ${report.barColor} transition-all duration-500`}
                  style={{ width: `${report.percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Category Progress Bars */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>{isBangla ? "ক্যাটাগরি ভিত্তিক পূরণ হার" : "Category Breakdown"}</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {report.categories.map((cat) => (
                <div
                  key={cat.category}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                      {isBangla ? cat.titleBn : cat.titleEn}
                    </span>
                    <span className="font-bold font-mono text-[11px] text-teal-700 dark:text-teal-400">
                      {cat.score}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        cat.score >= 80
                          ? "bg-emerald-500"
                          : cat.score >= 50
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>
                      {isBangla
                        ? `${cat.completedItems}/${cat.totalItems} পূরণকৃত`
                        : `${cat.completedItems}/${cat.totalItems} items`}
                    </span>
                    <span>{cat.earnedWeight} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Alert Notice if incomplete */}
          {report.missingItems.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/50 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h6 className="font-bold text-amber-900 dark:text-amber-200">
                  {isBangla
                    ? `${report.missingItems.length} টি গুরুত্বপূর্ণ তথ্য এখনও অপূরণ রয়েছে`
                    : `${report.missingItems.length} required fields are still missing`}
                </h6>
                <p className="text-amber-800 dark:text-amber-300/90 text-[11px]">
                  {isBangla
                    ? "সুপার অ্যাডমিন হিসেবে আপনি নিচে থেকে সতর্কবার্তা কপি করে কর্মীকে চাপ দিতে পারেন অথবা নিজেই 'সিভি এডিট' ও 'তথ্য এডিট' থেকে পূরণ করে দিতে পারেন।"
                    : "You can copy the HR reminder notice below to instruct the employee or update their information directly."}
                </p>
              </div>
            </div>
          )}

          {/* Items Filter & Checklist */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFilterTab("missing")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    filterTab === "missing"
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>
                    {isBangla ? "অসম্পূর্ণ তথ্য" : "Missing"} ({report.missingItems.length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("completed")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    filterTab === "completed"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {isBangla ? "পূরণকৃত তথ্য" : "Completed"} ({report.completedItems.length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    filterTab === "all"
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {isBangla ? "সব তথ্য" : "All Fields"} ({report.items.length})
                </button>
              </div>

              {/* Copy HR Reminder button */}
              <button
                type="button"
                onClick={handleCopyReminder}
                className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 border border-teal-500/40 text-teal-800 dark:text-teal-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ml-auto"
                title={
                  isBangla
                    ? "কর্মীকে পাঠানোর জন্য রিমাইন্ডার মেসেজ কপি করুন"
                    : "Copy HR reminder message to clipboard"
                }
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isBangla ? "কপি হয়েছে!" : "Copied!"}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isBangla ? "নোটিশ/রিমাইন্ডার কপি করুন" : "Copy HR Notice"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Checklist items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {displayedItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-2.5 transition-all ${
                    item.isCompleted
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40"
                      : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {item.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold ${
                            item.isCompleted
                              ? "text-slate-900 dark:text-white"
                              : "text-rose-900 dark:text-rose-200"
                          }`}
                        >
                          {isBangla ? item.labelBn : item.labelEn}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono text-slate-500 bg-slate-200/60 dark:bg-slate-800">
                          {item.weight} pts
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.isCompleted
                          ? item.valueSummary || (isBangla ? "সফলভাবে সংরক্ষিত" : "Verified")
                          : isBangla
                          ? item.hintBn
                          : "Missing info"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer / Direct Quick Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {onOpenEditCV && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEditCV(employee);
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>{isBangla ? "সিভি এডিট করুন (Edit CV)" : "Edit CV Details"}</span>
              </button>
            )}

            {onOpenEditProfile && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEditProfile(employee);
                }}
                className="px-3.5 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-800 dark:text-teal-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
                <span>{isBangla ? "প্রোফাইল তথ্য এডিট" : "Edit Profile Info"}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer ml-auto"
          >
            {isBangla ? "বন্ধ করুন" : "Close"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
