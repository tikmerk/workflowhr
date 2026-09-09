import React from "react";
import { ShieldCheck, Server, Globe2, Sparkles, Building2 } from "lucide-react";
import { useCompanyBranding } from "../../context/CompanyBrandingContext";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";

export const Footer: React.FC = () => {
  const { softwareBranding, branding, setIsBrandingModalOpen } = useCompanyBranding();
  const { t, isBangla } = useThemeLanguage();

  return (
    <footer
      id="workflow-hr-permanent-footer"
      className="w-full bg-slate-950/95 border border-slate-800/80 rounded-2xl backdrop-blur-md px-4 sm:px-6 py-4 mt-auto transition-all text-xs text-slate-400 select-none z-30 shadow-md"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Software Identity & Creator Attributions */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-center md:text-left">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-950/70 border border-teal-500/30 text-teal-300 font-bold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>{isBangla ? softwareBranding.labelBn : softwareBranding.labelEn}</span>
          </div>

          <span className="text-slate-600 hidden sm:inline">•</span>

          <span className="font-semibold text-slate-300 text-[11px]">
            {t("ডেভেলপমেন্ট:", "Developed By:")}{" "}
            <span className="text-white font-bold">{softwareBranding.developerName}</span>
          </span>

          <span className="text-slate-600 hidden sm:inline">•</span>

          <span className="font-medium text-slate-300 text-[11px]">
            {t("পাওয়ারড বাই:", "Powered By:")}{" "}
            <a
              href={softwareBranding.vendorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 underline font-bold transition-colors decoration-teal-500/40 hover:decoration-teal-400"
            >
              {softwareBranding.vendor}
            </a>{" "}
            <span className="text-slate-500 text-[10px]">({softwareBranding.vendorUrl})</span>
          </span>
        </div>

        {/* System Badges & Security */}
        <div className="flex items-center gap-2.5 text-[10.5px] text-slate-400 flex-wrap justify-center">
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-full text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Anti-Spoofing & Geofence v3.2</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-full text-slate-300">
            <Server className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Multi-Branch Isolated</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
