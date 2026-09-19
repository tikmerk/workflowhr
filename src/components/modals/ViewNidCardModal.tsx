import React, { useRef } from "react";
import { createPortal } from "react-dom";
import {
  CreditCard,
  Download,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  MapPin,
  Calendar,
  Droplet,
  ExternalLink,
} from "lucide-react";
import { Employee } from "../../types";

interface ViewNidCardModalProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  onOpenEditCV?: () => void;
  isBangla?: boolean;
}

export const ViewNidCardModal: React.FC<ViewNidCardModalProps> = ({
  employee,
  isOpen,
  onClose,
  onOpenEditCV,
  isBangla = true,
}) => {
  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const printAreaRef = useRef<HTMLDivElement | null>(null);

  const frontUrl = employee.nidCardFrontUrl || employee.cvData?.nidCardFrontUrl;
  const backUrl = employee.nidCardBackUrl || employee.cvData?.nidCardBackUrl;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = (url: string | undefined, filename: string) => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isBangla ? "জাতীয় পরিচয়পত্র (এনআইডি ডকুমেন্ট)" : "National ID Card Document"}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-semibold border border-teal-200 dark:border-teal-800">
                  {isBangla ? "সিভি থেকে পৃথক রেকর্ড" : "Separate from CV"}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {employee.fullName} • {isBangla ? "এনআইডি:" : "NID:"} <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{employee.nidNumber || employee.cvData?.nidNumber || "—"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{isBangla ? "প্রিন্ট / PDF" : "Print / PDF"}</span>
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

        {/* Informative Banner */}
        <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200/80 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isBangla
                ? "এনআইডি ডকুমেন্টটি সিভি শিট থেকে সম্পূর্ণরূপে আলাদা রাখা হয়েছে। প্রয়োজন অনুযায়ী এটি এককভাবে প্রিন্ট বা ডাউনলোড করতে পারবেন।"
                : "NID Card Document is managed separately from the CV sheet. You can download or print it independently."}
            </span>
          </div>
          {onOpenEditCV && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenEditCV();
              }}
              className="font-bold underline text-teal-700 dark:text-teal-300 hover:text-teal-900 shrink-0 text-xs cursor-pointer ml-2"
            >
              {isBangla ? "এনআইডি আপডেট করুন" : "Update NID"}
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6" ref={printAreaRef}>
          {/* Quick Summary Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs">
            <div>
              <span className="text-[10.5px] text-slate-400 block font-semibold">{isBangla ? "জাতীয় পরিচয়পত্র নং" : "NID Number"}</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {employee.nidNumber || employee.cvData?.nidNumber || "—"}
              </span>
            </div>
            <div>
              <span className="text-[10.5px] text-slate-400 block font-semibold">{isBangla ? "জন্ম তারিখ" : "Date of Birth"}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {employee.dateOfBirth || employee.cvData?.dateOfBirth || "—"}
              </span>
            </div>
            <div>
              <span className="text-[10.5px] text-slate-400 block font-semibold">{isBangla ? "রক্তের গ্রুপ" : "Blood Group"}</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {employee.bloodGroup || employee.cvData?.bloodGroup || "—"}
              </span>
            </div>
            <div>
              <span className="text-[10.5px] text-slate-400 block font-semibold">{isBangla ? "ডকুমেন্ট স্ট্যাটাস" : "Document Status"}</span>
              <span className={`font-bold flex items-center gap-1 ${frontUrl ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`}>
                {frontUrl ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {frontUrl ? (isBangla ? "আপলোড সম্পন্ন" : "Uploaded") : (isBangla ? "অনুপস্থিত" : "Pending")}
              </span>
            </div>
          </div>

          {/* Side-by-Side NID Cards Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* FRONT SIDE */}
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isBangla ? "এনআইডি কার্ড (সামনের অংশ / Front Side)" : "NID Card (Front Side)"}</span>
                </span>
                {frontUrl && (
                  <button
                    type="button"
                    onClick={() => handleDownloadImage(frontUrl, `${employee.employeeCode}-nid-front.png`)}
                    className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 text-[11px] font-bold border border-teal-200 dark:border-teal-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>{isBangla ? "ডাউনলোড" : "Download"}</span>
                  </button>
                )}
              </div>

              {frontUrl ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-teal-600/40 shadow-lg bg-slate-900 group aspect-[85.6/53.98]">
                  <img
                    src={frontUrl}
                    alt="NID Front Card"
                    className="w-full h-full object-contain bg-slate-950"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={frontUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-900 text-xs font-bold shadow-lg flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{isBangla ? "পূর্ণ রেজ্যুলিউশনে দেখুন" : "View Full Size"}</span>
                    </a>
                  </div>
                </div>
              ) : (
                /* Digital Smart Card Simulation when image is not uploaded */
                <div className="rounded-2xl p-4 border-2 border-dashed border-teal-500/40 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800/80 dark:to-teal-950/30 shadow-md aspect-[85.6/53.98] flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-teal-300 dark:border-teal-800/80 pb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-[8px] text-white font-bold">BD</div>
                      <div>
                        <div className="text-[10px] font-bold text-teal-900 dark:text-teal-200 leading-none">Government of Bangladesh</div>
                        <div className="text-[8px] font-semibold text-slate-600 dark:text-slate-400">জাতীয় পরিচয়পত্র / National ID</div>
                      </div>
                    </div>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-bold border border-teal-200">
                      SMART CARD
                    </span>
                  </div>

                  <div className="flex items-center gap-3 py-1">
                    <div className="w-14 h-16 rounded border border-slate-300 dark:border-slate-700 overflow-hidden bg-white shrink-0">
                      <img
                        src={employee.avatarUrl}
                        alt={employee.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-0.5 text-[10px]">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[8px] font-bold">নাম / Name</span>
                        <span className="font-bold text-slate-900 dark:text-white">{employee.fullName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[8px] font-bold">পিতা / Father</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{employee.fatherName || employee.cvData?.fatherName || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[8px] font-bold">মাতা / Mother</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{employee.motherName || employee.cvData?.motherName || "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-teal-300 dark:border-teal-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] text-slate-500 dark:text-slate-400 block font-bold">NID NO:</span>
                      <span className="font-mono font-black text-[11px] text-teal-900 dark:text-teal-300">
                        {employee.nidNumber || employee.cvData?.nidNumber || "CARD PHOTO PENDING"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-slate-500 dark:text-slate-400 block font-bold">DOB:</span>
                      <span className="font-mono text-[9.5px] font-bold text-slate-800 dark:text-slate-200">
                        {employee.dateOfBirth || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BACK SIDE */}
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isBangla ? "এনআইডি কার্ড (পেছনের অংশ / Back Side)" : "NID Card (Back Side)"}</span>
                </span>
                {backUrl && (
                  <button
                    type="button"
                    onClick={() => handleDownloadImage(backUrl, `${employee.employeeCode}-nid-back.png`)}
                    className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 text-[11px] font-bold border border-teal-200 dark:border-teal-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>{isBangla ? "ডাউনলোড" : "Download"}</span>
                  </button>
                )}
              </div>

              {backUrl ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-teal-600/40 shadow-lg bg-slate-900 group aspect-[85.6/53.98]">
                  <img
                    src={backUrl}
                    alt="NID Back Card"
                    className="w-full h-full object-contain bg-slate-950"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={backUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-900 text-xs font-bold shadow-lg flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{isBangla ? "পূর্ণ রেজ্যুলিউশনে দেখুন" : "View Full Size"}</span>
                    </a>
                  </div>
                </div>
              ) : (
                /* Digital Card Back Simulation */
                <div className="rounded-2xl p-4 border-2 border-dashed border-teal-500/40 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-900/80 shadow-md aspect-[85.6/53.98] flex flex-col justify-between">
                  <div className="space-y-1.5 text-[10px]">
                    <span className="text-[8px] font-bold text-teal-800 dark:text-teal-400 block uppercase tracking-wider">
                      ঠিকানা ও পরিচিতি বিবরণী (Address Particulars)
                    </span>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[8px] font-bold">স্থায়ী ঠিকানা (Permanent Address)</span>
                      <p className="text-[9.5px] text-slate-800 dark:text-slate-200 leading-snug">
                        {employee.permanentAddress || employee.cvData?.permanentAddress || employee.presentAddress || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[8px] font-bold">বর্তমান ঠিকানা (Present Address)</span>
                      <p className="text-[9.5px] text-slate-800 dark:text-slate-200 leading-snug">
                        {employee.presentAddress || employee.cvData?.presentAddress || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-300 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] text-slate-500 dark:text-slate-400 block font-bold">রক্তের গ্রুপ (Blood Group)</span>
                      <span className="font-black text-rose-600 dark:text-rose-400 text-xs">
                        {employee.bloodGroup || "O+"}
                      </span>
                    </div>
                    <div className="text-right font-mono text-[8px] text-slate-400 tracking-widest">
                      ||| | |||| | || ||||| ||| |||
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Quick upload guide */}
          {(!frontUrl || !backUrl) && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {isBangla
                    ? "এনআইডি কার্ডের ফটো কপি এখনো পুরোপুরি আপলোড করা হয়নি। এডিট অপশনে গিয়ে সামনের ও পেছনের কপি আপলোড করতে পারবেন।"
                    : "NID card image copies are not fully uploaded yet. You can upload front and back images from Edit CV."}
                </span>
              </div>
              {onOpenEditCV && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenEditCV();
                  }}
                  className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shrink-0 cursor-pointer shadow-xs ml-2"
                >
                  {isBangla ? "এখনই আপলোড করুন" : "Upload Now"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {isBangla ? "ডকুমেন্ট ভেরিফিকেশন কোড:" : "Verification Code:"} <span className="font-mono font-semibold">{employee.employeeCode}-NID</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
          >
            {isBangla ? "বন্ধ করুন" : "Close"}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
