import React, { forwardRef } from "react";
import {
  ShieldCheck,
  Building2,
  Sparkles,
  Phone,
  Droplet,
  Calendar,
  CreditCard,
  QrCode,
  MapPin,
  CheckCircle2,
  Lock,
  Radio
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Employee } from "../../types";
import { useCompanyBranding } from "../../context/CompanyBrandingContext";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";

interface DigitalIdCardProps {
  employee: Employee;
  cardSide?: "front" | "back";
  cardTheme?: "dark" | "light" | "navy";
}

export const DigitalIdCard = forwardRef<HTMLDivElement, DigitalIdCardProps>(
  ({ employee, cardSide = "front", cardTheme = "dark" }, ref) => {
    const { branding, softwareBranding, getCompanyDisplayName, getCompanyTagline, getCompanyAddress } = useCompanyBranding();
    const { isBangla, t } = useThemeLanguage();

    const companyName = getCompanyDisplayName(isBangla);
    const companyTagline = getCompanyTagline(isBangla);
    const companyAddress = getCompanyAddress(isBangla);

    // QR Code data payload for live verification
    const qrPayload = JSON.stringify({
      code: employee.employeeCode,
      name: employee.fullName,
      role: employee.role,
      branch: employee.branchName,
      dept: employee.departmentName,
      blood: employee.bloodGroup || "O+",
      verified: true,
      issuedBy: companyName,
      securityAuth: "Anti-Spoofing Biometric Enabled v3.2",
    });

    const isLight = cardTheme === "light";
    const isNavy = cardTheme === "navy";

    return (
      <div
        ref={ref}
        id={`digital-id-card-${employee.id}-${cardSide}`}
        style={{
          width: "360px",
          minHeight: "560px",
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        }}
        className={`relative rounded-3xl overflow-hidden shadow-2xl border flex flex-col justify-between select-none transition-all ${
          isLight
            ? "bg-slate-50 text-slate-900 border-slate-300"
            : isNavy
            ? "bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-slate-100 border-indigo-500/30"
            : "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 border-teal-500/30"
        }`}
      >
        {/* Top Decorative Lanyard Slot / Hole Simulation */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-2.5 rounded-full bg-slate-900/60 border border-slate-700/60 shadow-inner z-20" />

        {/* Top Metallic Color Accents */}
        <div className="h-2 w-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600 shrink-0" />

        {cardSide === "front" ? (
          /* FRONT SIDE */
          <div className="p-5 pt-6 flex-1 flex flex-col justify-between relative z-10">
            {/* Background Hologram / Watermark Pattern */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none -z-10">
              <ShieldCheck className="w-80 h-80 text-teal-400" />
            </div>

            {/* Header: Company Logo & Organization Name */}
            <div className="text-center space-y-2 border-b border-slate-700/40 pb-3">
              <div className="flex items-center justify-center gap-2.5">
                {branding.logoUrl ? (
                  <img
                    src={branding.logoUrl}
                    alt={companyName}
                    className="h-10 w-auto max-w-[140px] object-contain rounded-lg p-1 bg-white/10 border border-white/10"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center font-black text-slate-950 text-base shadow-md shadow-teal-500/20">
                    {companyName[0] || "A"}
                  </div>
                )}
                <div className="text-left">
                  <h3
                    className={`font-black text-sm leading-tight tracking-tight max-w-[210px] line-clamp-1 ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {companyName}
                  </h3>
                  <p className="text-[9.5px] text-teal-500 dark:text-teal-400 font-semibold truncate max-w-[210px]">
                    {companyTagline}
                  </p>
                </div>
              </div>

              {/* Official Identity Badge Tag */}
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-[10px] font-extrabold text-teal-400 tracking-wider uppercase">
                <Sparkles className="w-3 h-3 text-teal-400" />
                <span>{isBangla ? "অফিসিয়াল ডিজিটাল আইডি কার্ড" : "Official Digital ID Badge"}</span>
              </div>
            </div>

            {/* Photo & Profile Identity Section */}
            <div className="flex flex-col items-center text-center my-3">
              <div className="relative">
                <div className="w-28 h-28 rounded-2xl overflow-hidden p-1 bg-gradient-to-tr from-teal-500 to-emerald-400 shadow-xl shadow-teal-500/20">
                  <img
                    src={employee.avatarUrl}
                    alt={employee.fullName}
                    className="w-full h-full object-cover rounded-xl bg-slate-800"
                    crossOrigin="anonymous"
                  />
                </div>
                {/* Verified Biometric Badge Overlay */}
                <div className="absolute -bottom-2 -right-2 bg-slate-950 border border-emerald-500/50 p-1.5 rounded-xl shadow-lg flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter">BIO-PASSED</span>
                </div>
              </div>

              {/* Name & Title */}
              <div className="mt-3 space-y-0.5">
                <h2
                  className={`text-lg font-black tracking-tight leading-snug ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  {employee.fullName}
                </h2>
                <p className="text-xs font-bold text-teal-400">
                  {employee.designationTitle}
                </p>
                {employee.additionalDesignations && employee.additionalDesignations.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1 pt-0.5">
                    {employee.additionalDesignations.map((desig) => (
                      <span
                        key={desig}
                        className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40"
                      >
                        + {desig}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 font-semibold text-slate-300">
                    {employee.departmentName}
                  </span>
                  <span>•</span>
                  <span className="text-teal-300 font-semibold">{employee.branchName}</span>
                </div>
              </div>
            </div>

            {/* Employee Details Grid */}
            <div
              className={`rounded-2xl p-3 space-y-1.5 text-[11px] border ${
                isLight
                  ? "bg-slate-100/90 border-slate-200 text-slate-700"
                  : "bg-slate-900/80 border-slate-800 text-slate-300"
              }`}
            >
              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/40">
                <span className="text-slate-400 font-medium">{isBangla ? "আইডি নং / কোড:" : "Employee Code:"}</span>
                <span className="font-mono font-black text-teal-400">{employee.employeeCode}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/40">
                <span className="text-slate-400 font-medium">{isBangla ? "রক্তের গ্রুপ:" : "Blood Group:"}</span>
                <span className="font-bold text-rose-400 flex items-center gap-1">
                  <Droplet className="w-3 h-3 fill-rose-400" />
                  <span>{employee.bloodGroup || "O+"}</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/40">
                <span className="text-slate-400 font-medium">{isBangla ? "যোগদানের তারিখ:" : "Joining Date:"}</span>
                <span className="font-semibold text-slate-200">{employee.joiningDate || "2026-01-01"}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/40">
                <span className="text-slate-400 font-medium">{isBangla ? "জরুরী মোবাইল:" : "Emergency Contact:"}</span>
                <span className="font-mono text-slate-200 font-semibold">{employee.emergencyPhone || employee.phone}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-400 font-medium">{isBangla ? "মেয়াদ উত্তীর্ণ:" : "Valid Thru:"}</span>
                <span className="font-bold text-emerald-400 font-mono">2029-12-31</span>
              </div>
            </div>

            {/* Bottom Card Footer: QR Code & Auth Stamp */}
            <div className="mt-3 pt-2.5 border-t border-slate-700/40 flex items-center justify-between gap-3">
              <div className="p-1.5 bg-white rounded-xl shadow-md shrink-0">
                <QRCodeSVG
                  value={qrPayload}
                  size={58}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <div className="flex-1 text-right space-y-1">
                <div className="text-[8.5px] font-mono text-slate-400 leading-tight">
                  <p>{isBangla ? "অনুমোদিত কর্মকর্তা স্বাক্ষর" : "Authorized Signatory"}</p>
                </div>
                <div className="font-serif italic font-black text-xs text-teal-400 tracking-wider">
                  M. Ibrahim
                </div>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[8px] font-bold text-emerald-400 font-mono">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>SECURE-CHIP-V3</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* BACK SIDE */
          <div className="p-5 pt-6 flex-1 flex flex-col justify-between relative z-10 text-xs">
            {/* Header: Rules & Return Instructions */}
            <div className="text-center space-y-1 border-b border-slate-700/40 pb-3">
              <div className="flex items-center justify-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" />
                <span>{isBangla ? "ব্যবহারের নির্দেশনাবলী ও নিরাপত্তা" : "Terms & Card Security"}</span>
              </div>
              <p className="text-[10px] text-slate-400">
                {isBangla
                  ? "এই কার্ডটি প্রতিষ্ঠানের সম্পত্তি। কার্ডটি হস্তান্তরযোগ্য নয়।"
                  : "This identity card is strictly the property of the issuing organization."}
              </p>
            </div>

            {/* Terms List */}
            <div
              className={`rounded-2xl p-3.5 space-y-2 text-[10.5px] border leading-relaxed ${
                isLight
                  ? "bg-slate-100/90 border-slate-200 text-slate-700"
                  : "bg-slate-900/80 border-slate-800 text-slate-300"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <span>
                  {isBangla
                    ? "অফিস চলাকালীন সময়ে কার্ডটি দৃশ্যমানভাবে ঝুলিয়ে রাখা বাধ্যতামূলক।"
                    : "Card must be visibly worn at all times inside company premises."}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <span>
                  {isBangla
                    ? "স্মার্ট বায়োমেট্রিক উপস্থিতি ও গেটপাস স্ক্যানিংয়ে এটি ব্যবহৃত হবে।"
                    : "Used for AI anti-spoofing attendance & multi-branch access control."}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <span>
                  {isBangla
                    ? "কার্ড হারিয়ে গেলে অবিলম্বে এইচআর অ্যাডমিন শাখাকে অবহিত করুন।"
                    : "If lost, report immediately to the Human Resources department."}
                </span>
              </div>
            </div>

            {/* Return If Found & Company Address */}
            <div
              className={`rounded-2xl p-3 text-[10px] border text-center space-y-1.5 ${
                isLight
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-900"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-200"
              }`}
            >
              <div className="font-bold uppercase tracking-wider text-[9px] text-amber-400">
                {isBangla ? "কার্ডটি পাওয়া গেলে ফেরত পাঠানোর ঠিকানা:" : "If found, please return to:"}
              </div>
              <p className="font-semibold">{companyName}</p>
              <p className="text-[9.5px] opacity-90">{companyAddress || "Tower 71, Road 11, Gulshan-1, Dhaka-1212"}</p>
              <p className="font-mono text-[9.5px] text-teal-400 font-bold">
                {isBangla ? "হেল্পলাইন:" : "Helpline:"} {branding.phone || "+880 1700-112233"}
              </p>
            </div>

            {/* Barcode & Software attribution */}
            <div className="pt-2 border-t border-slate-700/40 text-center space-y-1.5">
              {/* Simulated Enterprise Barcode */}
              <div className="flex justify-center items-center gap-0.5 h-8 px-4 bg-white rounded-lg py-1">
                {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 2, 4, 1, 2, 3, 1, 3, 2].map(
                  (width, idx) => (
                    <div
                      key={idx}
                      className="h-full bg-slate-900"
                      style={{ width: `${width}px`, margin: "0 1px" }}
                    />
                  )
                )}
              </div>
              <div className="font-mono text-[9px] text-slate-400">
                *{employee.employeeCode}-SEC-VERIFIED*
              </div>

              {/* Developer & Software Attribution */}
              <div className="text-[8.5px] text-slate-500 flex items-center justify-center gap-1">
                <span>{softwareBranding.name}</span>
                <span>•</span>
                <span>Powered by {softwareBranding.vendor}</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-500 shrink-0" />
      </div>
    );
  }
);

DigitalIdCard.displayName = "DigitalIdCard";
