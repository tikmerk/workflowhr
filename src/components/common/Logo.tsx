import React from "react";
import { useCompanyBranding } from "../../context/CompanyBrandingContext";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  variant?: "adaptive" | "light" | "dark" | "full";
  className?: string;
  isCollapsed?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showTagline = true,
  variant = "adaptive",
  className = "",
  isCollapsed = false,
}) => {
  const { branding, getCompanyDisplayName, getCompanyTagline } = useCompanyBranding();
  const { isBangla } = useThemeLanguage();

  const companyName = getCompanyDisplayName(isBangla);
  const companyTagline = getCompanyTagline(isBangla);

  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-9 h-9 sm:w-10 sm:h-10",
    lg: "w-11 h-11 sm:w-12 sm:h-12",
    xl: "w-14 h-14 sm:w-16 sm:h-16",
  };

  const textSizes = {
    sm: "text-xs sm:text-sm",
    md: "text-xs sm:text-sm font-black",
    lg: "text-sm sm:text-base font-black",
    xl: "text-lg sm:text-xl font-black",
  };

  const initialLetter = (isBangla ? (branding.companyNameBn?.[0] || companyName[0] || "এ") : (companyName[0] || "A")).toUpperCase();

  const nameColorClass =
    variant === "dark"
      ? "text-slate-900"
      : variant === "light"
      ? "text-white"
      : "text-slate-900 dark:text-white";

  const taglineColorClass =
    variant === "dark"
      ? "text-slate-500"
      : variant === "light"
      ? "text-teal-400/90"
      : "text-teal-600 dark:text-teal-400/90";

  return (
    <div id="company-corporate-header-logo" className={`flex items-start gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Client Company Official Logo or High-End Monogram */}
      <div className={`relative flex items-center justify-center shrink-0 mt-0.5 ${iconSizes[size]}`}>
        {branding.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt={companyName}
            className="w-full h-full rounded-xl object-contain bg-white dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-800 shadow-sm"
          />
        ) : (
          <div className="w-full h-full rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-500 text-white flex items-center justify-center font-black text-base sm:text-lg shadow-md border border-teal-400/30">
            {initialLetter}
          </div>
        )}

        {/* Live Active Status Indicator */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-slate-900"></span>
        </span>
      </div>

      {!isCollapsed && (
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h1
            className={`font-black tracking-tight break-words text-wrap leading-snug sm:leading-tight ${textSizes[size]} ${nameColorClass}`}
            title={companyName}
          >
            {companyName}
          </h1>
          {showTagline && companyTagline && (
            <p
              className={`text-[10px] sm:text-[11px] font-medium break-words text-wrap leading-tight mt-0.5 line-clamp-2 ${taglineColorClass}`}
              title={companyTagline}
            >
              {companyTagline}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
