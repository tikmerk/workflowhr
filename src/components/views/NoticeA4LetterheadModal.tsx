import React, { useState } from "react";
import {
  X,
  Printer,
  Download,
  Building2,
  Calendar,
  Share2,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  ShieldCheck,
  Languages,
} from "lucide-react";
import { Notice, Branch, Employee } from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { useCompanyBranding } from "../../context/CompanyBrandingContext";

interface NoticeA4LetterheadModalProps {
  isOpen: boolean;
  onClose: () => void;
  notice: Notice | null;
  branches: Branch[];
}

export const formatBanglaDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const banglaDigits: { [key: string]: string } = {
    "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
    "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯",
  };
  const banglaMonths: { [key: string]: string } = {
    "01": "জানুয়ারি", "1": "জানুয়ারি",
    "02": "ফেব্রুয়ারি", "2": "ফেব্রুয়ারি",
    "03": "মার্চ", "3": "মার্চ",
    "04": "এপ্রিল", "4": "এপ্রিল",
    "05": "মে", "5": "মে",
    "06": "জুন", "6": "জুন",
    "07": "জুলাই", "7": "জুলাই",
    "08": "আগস্ট", "8": "আগস্ট",
    "09": "সেপ্টেম্বর", "9": "সেপ্টেম্বর",
    "10": "অক্টোবর",
    "11": "নভেম্বর",
    "12": "ডিসেম্বর",
  };

  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    const bnDay = day.replace(/\d/g, (d) => banglaDigits[d] || d);
    const bnMonth = banglaMonths[month] || month;
    const bnYear = year.replace(/\d/g, (d) => banglaDigits[d] || d);
    return `${bnDay} ${bnMonth} ${bnYear}`;
  }
  return dateStr.replace(/\d/g, (d) => banglaDigits[d] || d);
};

export const toBanglaDigits = (numStr: string | number): string => {
  const banglaDigits: { [key: string]: string } = {
    "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
    "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯",
  };
  return String(numStr).replace(/\d/g, (d) => banglaDigits[d] || d);
};

export const NoticeA4LetterheadModal: React.FC<NoticeA4LetterheadModalProps> = ({
  isOpen,
  onClose,
  notice,
  branches,
}) => {
  const { t, isBangla } = useThemeLanguage();
  const { branding, softwareBranding, getCompanyDisplayName, getCompanyTagline, getCompanyAddress } = useCompanyBranding();

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copyStatus, setCopyStatus] = useState<boolean>(false);
  
  // Notice language mode (default to notice.language or Bangla if unspecified)
  const isNoticeBangla = notice ? (notice.language === "bn" || (!notice.language && isBangla)) : isBangla;
  const [overrideLang, setOverrideLang] = useState<"bn" | "en" | null>(null);
  
  const currentLang = overrideLang !== null ? overrideLang : (isNoticeBangla ? "bn" : "en");
  const isBanglaMode = currentLang === "bn";

  if (!isOpen || !notice) return null;

  const handlePrint = () => {
    window.print();
  };

  const companyName = isBanglaMode
    ? (branding.companyNameBn || branding.companyName || notice.issuerOrganization || "মুসলিম ওয়েলফেয়ার অর্গানাইজেশন")
    : (branding.companyName || notice.issuerOrganization || "Muslim Welfare Organization");

  const companyTagline = isBanglaMode
    ? (branding.taglineBn || branding.tagline || "সমাজকল্যাণ, মানবিক সহায়তা ও সমাজসেবামূলক সংস্থা")
    : (branding.tagline || "Social Welfare, Humanitarian Relief & Community Development");

  const companyAddress = isBanglaMode
    ? (branding.addressBn || branding.address || notice.companyAddress || "গুলশান করপোরেট এভিনিউ, ঢাকা-১২১২, বাংলাদেশ")
    : (branding.address || notice.companyAddress || "Gulshan Corporate Avenue, Dhaka-1212, Bangladesh");

  const formattedDate = isBanglaMode ? formatBanglaDate(notice.publishedDate) : notice.publishedDate;

  const handleCopyNoticeText = () => {
    const fullText = `
${companyName}
${companyAddress}
--------------------------------------------------------
${isBanglaMode ? "স্মারক নং:" : "Memo No:"} ${notice.memoNumber || "WFHR/HQ/2026/09-082"}
${isBanglaMode ? "তারিখ:" : "Date:"} ${formattedDate}
${isBanglaMode ? "প্রাপক / বিতরণ:" : "Distribution / To:"} ${notice.targetAudience || (isBanglaMode ? "সকল কর্মকর্তা ও কর্মচারী" : "All Staff Members")}

${isBanglaMode ? "বিষয়:" : "Subject:"} ${notice.subject || notice.title}

${notice.content}

${isBanglaMode ? "স্বাক্ষরকারী:" : "Signatory:"}
${notice.issuerName || notice.authorName || (isBanglaMode ? "কর্তৃপক্ষ" : "Authorized Authority")}
${notice.issuerDesignation || (isBanglaMode ? "ব্যবস্থাপনা পরিচালক / শাখা প্রধান" : "Managing Director / Branch Manager")}
${notice.issuerDepartment || (isBanglaMode ? "মানবসম্পদ ও প্রশাসন বিভাগ" : "Human Resources & Administration")}
${notice.issuerBranch || (isBanglaMode ? "প্রধান কার্যালয়" : "Headquarters")}
${companyName}
    `.trim();

    navigator.clipboard.writeText(fullText);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      {/* Container Dialog */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden">
        {/* Top Control Bar (Screen only, hidden on print) */}
        <div className="print:hidden p-3 sm:px-6 bg-slate-850 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{isBanglaMode ? "অফিসিয়াল এ-ফোর (A4) নোটিশ লেটারহেড" : "Official A4 Letterhead Notice"}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono font-normal">
                  {notice.memoNumber || "WFHR/2026"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold">
                  {isBanglaMode ? "বাংলা সংস্করণ" : "English Version"}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isBanglaMode
                  ? "প্রিন্ট ও ডিজিটাল শেয়ারের জন্য স্বয়ংক্রিয় এ-ফোর লেটারহেড ফরম্যাট"
                  : "Standard official letterhead format ready for high-resolution printing & sharing"}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Quick Language Toggle on Modal */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setOverrideLang("bn")}
                className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                  isBanglaMode
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setOverrideLang("en")}
                className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                  !isBanglaMode
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                English
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setZoomLevel((prev) => Math.max(75, prev - 10))}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11px] font-mono text-slate-300">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((prev) => Math.min(130, prev + 10))}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Copy Text */}
            <button
              onClick={handleCopyNoticeText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            >
              {copyStatus ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">{isBanglaMode ? "কপি হয়েছে!" : "Copied!"}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isBanglaMode ? "টেক্সট কপি" : "Copy Text"}</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isBanglaMode ? "প্রিন্ট করুন (A4)" : "Print (A4)"}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/60 flex justify-center items-start no-scrollbar">
          {/* A4 Sheet Container (Responsive display + Print CSS) */}
          <div
            id="a4-printable-notice"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-8 sm:p-14 shadow-2xl rounded-sm border border-slate-300 flex flex-col justify-between transition-transform duration-150 print:shadow-none print:border-none print:m-0 print:p-8 print:w-full print:max-w-none print:transform-none"
          >
            {/* 1. Official Letterhead Header */}
            <div>
              <div className="flex items-start justify-between pb-4 border-b-2 border-teal-800">
                {/* Logo & Corporate Identity */}
                <div className="flex items-center gap-4">
                  {branding.logoUrl ? (
                    <img
                      src={branding.logoUrl}
                      alt={companyName}
                      className="w-14 h-14 rounded-xl object-contain bg-white p-1 border border-slate-300 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-teal-800 text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-teal-600 shrink-0">
                      {(isBanglaMode ? (branding.companyNameBn?.[0] || "এ") : (companyName[0] || "A")).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-serif leading-none">
                      {companyName}
                    </h1>
                    <p className="text-xs sm:text-sm font-semibold text-teal-800 mt-1">
                      {companyTagline}
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {isBanglaMode
                        ? "রেজিস্টার্ড কেন্দ্রীয় করপোরেট প্রশাসন ও এইচআর বিভাগ"
                        : "Registered Corporate Administration & HRM Directorate"}
                    </p>
                  </div>
                </div>

                {/* ISO / Seal Badge */}
                <div className="text-right hidden sm:block">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-300 text-teal-900 text-[10px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                    <span>{isBanglaMode ? "আইএসও ৯০০১:২০১৫ সনদপ্রাপ্ত" : "ISO 9001:2015 CERTIFIED"}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    {isBanglaMode ? "ডকুমেন্ট নং:" : "Doc ID:"} {notice.id.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Contact Information Sub-bar */}
              <div className="flex flex-wrap items-center justify-between text-[10.5px] text-slate-600 py-2 border-b border-slate-300 mb-6 gap-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-teal-700 shrink-0" />
                  <span>{companyAddress}</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-teal-700 shrink-0" />
                    {isBanglaMode ? toBanglaDigits(branding.phone || "+880 2-9887766") : (branding.phone || "+880 2-9887766")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-teal-700 shrink-0" />
                    {branding.email || "info@muslimwelfare.org"}
                  </span>
                </div>
              </div>

              {/* 2. Memo Number & Date Bar (Fully Language Adaptive) */}
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded border border-slate-200 text-xs font-semibold text-slate-800 mb-5">
                <div>
                  <span className="text-slate-500 font-normal">
                    {isBanglaMode ? "স্মারক নং:" : "Memo No:"}{" "}
                  </span>
                  <span className="font-mono font-bold text-teal-900">
                    {notice.memoNumber || `WFHR/HQ/2026/${notice.id.replace("not-", "")}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-normal">
                    {isBanglaMode ? "তারিখ:" : "Date:"}{" "}
                  </span>
                  <span className="font-bold text-slate-900">{formattedDate}</span>
                </div>
              </div>

              {/* 3. Target Audience / Distribution */}
              <div className="mb-4 text-xs">
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-slate-700 shrink-0">
                    {isBanglaMode ? "প্রাপক / বিতরণ:" : "Distribution / To:"}
                  </span>
                  <span className="font-semibold text-slate-900 bg-teal-50/80 px-2 py-0.5 rounded border border-teal-200">
                    {notice.targetAudience || (
                      notice.targetBranchNames && notice.targetBranchNames.length > 0
                        ? notice.targetBranchNames.join(", ")
                        : notice.targetBranchName && notice.targetBranchName !== "ALL"
                        ? `${notice.targetBranchName} ${notice.targetProjectName ? `(প্রজেক্ট: ${notice.targetProjectName})` : ""}`
                        : isBanglaMode
                        ? "সকল শাখা ও বিভাগের সম্মানিত কর্মকর্তা-কর্মচারীবৃন্দ"
                        : "All Staff Across All Branches & Projects"
                    )}
                  </span>
                </div>
              </div>

              {/* 4. Subject Line */}
              <div className="my-5 pb-2 border-b-2 border-slate-800 text-center sm:text-left">
                <div className="text-xs uppercase font-bold text-teal-800 tracking-wider">
                  {isBanglaMode ? "অফিসিয়াল প্রশাসনিক সার্কুলার / বিজ্ঞপ্তি" : "OFFICIAL ADMINISTRATIVE CIRCULAR"}
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-950 mt-1 leading-snug">
                  {isBanglaMode ? "বিষয়:" : "Subject:"} {notice.subject || notice.title}
                </h2>
              </div>

              {/* 5. Notice Body Text */}
              <div className="text-[13px] sm:text-sm text-slate-800 leading-relaxed font-serif space-y-4 my-6 whitespace-pre-line text-justify">
                {notice.content}
              </div>
            </div>

            {/* 6. Footer & Official Clearance / Signature Block */}
            <div className="pt-8 border-t border-slate-300 mt-10">
              <div className="flex flex-col sm:flex-row items-end justify-between gap-6">
                {/* Left: Verification & Seal */}
                <div className="space-y-1.5 text-left text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5 font-semibold text-teal-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>{isBanglaMode ? "ডিজিটালভাবে সত্যায়িত ও অনুমোদিত" : "Digitally Authenticated Circular"}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {isBanglaMode
                      ? "এই নোটিশটি সেন্ট্রাল ক্লাউড সিস্টেমে সংরক্ষিত এবং ডিজিটাল স্বাক্ষরে কার্যকর।"
                      : "This circular is digitally generated and authorized under Enterprise governance."}
                  </p>
                  <p className="text-[9.5px] font-mono text-slate-400">
                    UID: {notice.id} • {isBanglaMode ? "রেফারেন্স:" : "Ref:"} {formattedDate}
                  </p>
                </div>

                {/* Right: Signature & Authority Block */}
                <div className="text-center sm:text-right min-w-[220px]">
                  {/* Signature Image / Digital Seal */}
                  <div className="h-16 flex items-center justify-center sm:justify-end mb-1">
                    {notice.signatureImageUrl ? (
                      <img
                        src={notice.signatureImageUrl}
                        alt="Authorized Signature"
                        className="max-h-16 max-w-[180px] object-contain"
                      />
                    ) : (
                      <div className="border-b-2 border-slate-700 pb-1 px-4 italic font-serif text-teal-950 font-bold text-base">
                        {notice.issuerName || notice.authorName || (isBanglaMode ? "স্বাক্ষরকারী কর্তৃপক্ষ" : "Authorized Signatory")}
                      </div>
                    )}
                  </div>

                  <div className="font-bold text-sm text-slate-900 leading-tight">
                    {notice.issuerName || notice.authorName || (isBanglaMode ? "মোঃ ইব্রাহিম হোসেন" : "Md. Ibrahim Hossain")}
                  </div>
                  <div className="text-xs font-semibold text-teal-900 mt-0.5">
                    {notice.issuerDesignation || (isBanglaMode ? "প্রধান নির্বাহী কর্মকর্তা ও ব্যবস্থাপনা পরিচালক" : "Chief Executive Officer & MD")}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {notice.issuerDepartment || (isBanglaMode ? "মানবসম্পদ ও প্রশাসন বিভাগ" : "Human Resources & Administration")}
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    {notice.issuerBranch || (isBanglaMode ? "প্রধান কার্যালয় (গুলশান হাব)" : "Head Office (Gulshan Hub)")}
                  </div>
                  <div className="text-[11px] font-bold text-slate-800">
                    {companyName}
                  </div>
                </div>
              </div>

              {/* Bottom Copyright Strip */}
              <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 flex items-center justify-between">
                <span>{companyName} © {isBanglaMode ? "২০২৬" : "2026"}</span>
                <span className="font-mono">{isBanglaMode ? "পৃষ্ঠা ১ / ১" : "Page 1 of 1"}</span>
                <span>{softwareBranding.labelEn}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
