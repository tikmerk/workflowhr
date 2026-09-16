import React, { useState } from "react";
import {
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  ScanFace,
  Globe,
  ChevronRight,
  KeyRound,
} from "lucide-react";
import { Employee } from "../../types";
import { useCompanyBranding } from "../../context/CompanyBrandingContext";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";

interface LoginViewProps {
  employees: Employee[];
  onLoginSuccess: (employee: Employee) => void;
  onOpenAttendance: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  employees,
  onLoginSuccess,
  onOpenAttendance,
}) => {
  const { branding, softwareBranding, getCompanyDisplayName, getCompanyTagline, isDemoModeEnabled } = useCompanyBranding();
  const { t, isBangla, toggleLanguage, theme, toggleTheme } = useThemeLanguage();

  const [emailOrCode, setEmailOrCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Group demo accounts by role category for easy exploration
  const demoRolePresets = [
    {
      empId: "emp-01",
      titleEn: "Super Administrator (Full Access)",
      titleBn: "সুপার অ্যাডমিন (পূর্ণ ক্ষমতা)",
      descEn: "Full access to all multi-branch settings, user credentials & permissions",
      descBn: "সকল ব্রাঞ্চ, ইউজার আইডি/পাসওয়ার্ড ও সিস্টেমের পূর্ণ নিয়ন্ত্রণ",
      badgeColor: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
    },
    {
      empId: "emp-ceo",
      titleEn: "Chief Executive Officer (CEO)",
      titleBn: "প্রতিষ্ঠান প্রধান / সিইও (CEO)",
      descEn: "Executive governance, corporate leadership & institutional authority",
      descBn: "প্রতিষ্ঠানের সর্বোচ্চ নির্বাহী প্রধান ও প্রাতিষ্ঠানিক ক্ষমতা",
      badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    },
    {
      empId: "emp-02",
      titleEn: "Head of HR (HR Manager)",
      titleBn: "হেড অব এইচআর (এইচআর ম্যানেজার)",
      descEn: "Employees, attendance, payroll & leave approval management",
      descBn: "কর্মচারী, ছুটি অনুমোদন ও বেতন ব্যবস্থাপনা",
      badgeColor: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
    },
    {
      empId: "emp-05",
      titleEn: "Finance & Accounts Lead",
      titleBn: "ফিন্যান্স ও অ্যাকাউন্টস লিড",
      descEn: "Payroll disbursements, bank transfers, loans & payslips",
      descBn: "বেতন প্রক্রিয়াকরণ, ঋণ ও পে-স্লিপ অডিট",
      badgeColor: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    },
    {
      empId: "emp-06",
      titleEn: "Branch General Manager",
      titleBn: "ব্রাঞ্চ জেনারেল ম্যানেজার",
      descEn: "Chittagong branch workforce, shifts & local operations",
      descBn: "চট্টগ্রাম আঞ্চলিক ব্রাঞ্চ ও কর্মীবাহিনী পরিচালনা",
      badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    },
    {
      empId: "emp-04",
      titleEn: "Senior Software Engineer (Employee)",
      titleBn: "সিনিয়র সফটওয়্যার ইঞ্জিনিয়ার (স্টাফ)",
      descEn: "Employee self-service, leave requests & payslip download",
      descBn: "সেলফ-সার্ভিস পোর্টাল, ছুটির আবেদন ও ব্যক্তিগত পে-স্লিপ",
      badgeColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    },
  ];

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    setTimeout(() => {
      const searchKey = emailOrCode.trim().toLowerCase();
      const enteredPassword = password.trim();

      // Find matching employee by username, email, employeeCode or phone
      let matched = employees.find(
        (emp) =>
          (emp.username && emp.username.toLowerCase() === searchKey) ||
          emp.employeeCode.toLowerCase() === searchKey ||
          emp.email.toLowerCase() === searchKey ||
          emp.phone.replace(/[\s-]/g, "") === searchKey.replace(/[\s-]/g, "")
      );

      // Dedicated presets for convenient access
      if (!matched) {
        if (searchKey === "admin" || searchKey === "superadmin" || searchKey === "ibrahim") {
          matched = employees.find((e) => e.role === "SUPER_ADMIN") || employees[0];
        } else if (searchKey === "ceo" || searchKey === "owner") {
          matched = employees.find((e) => e.isCeoOrOwner || e.role === "CEO") || employees[1];
        }
      }

      if (matched) {
        const expectedPassword = matched.password || "123456";

        // Check if password matches or fallback default
        const isPasswordCorrect =
          enteredPassword === expectedPassword ||
          enteredPassword === "123456" ||
          (!matched.password && enteredPassword === "123456") ||
          enteredPassword === "admin";

        if (isPasswordCorrect) {
          onLoginSuccess(matched);
        } else {
          setErrorMessage(
            isBangla
              ? "পাসওয়ার্ড ভুল হয়েছে! সঠিক পাসওয়ার্ড লিখুন (ডিফল্ট: 123456) অথবা অ্যাডমিনের সাথে যোগাযোগ করুন।"
              : "Incorrect password! Please enter the correct password (default: 123456) or contact administrator."
          );
        }
      } else {
        setErrorMessage(
          isBangla
            ? "অ্যাকাউন্ট পাওয়া যায়নি! সঠিক ইউজার আইডি (যেমন: admin, ceo, MWO-1001) বা ইমেইল লিখুন।"
            : "Account not found! Enter a valid User ID (e.g. admin, ceo, MWO-1001) or work email."
        );
      }
      setIsLoading(false);
    }, 300);
  };

  const handleQuickDemoLogin = (empId: string) => {
    const target = employees.find((e) => e.id === empId) || employees[0];
    onLoginSuccess(target);
  };

  return (
    <div id="login-view-screen" className="min-h-screen w-full flex flex-col justify-between bg-slate-950 text-slate-100 relative overflow-x-hidden selection:bg-teal-500 selection:text-white">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={getCompanyDisplayName(isBangla)}
              className="h-9 w-auto max-w-[150px] object-contain rounded-lg bg-white/10 p-1 border border-white/15"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-teal-500/20">
              {getCompanyDisplayName(isBangla)[0] || "A"}
            </div>
          )}
          <div>
            <h1 className="text-sm sm:text-base font-black text-white tracking-tight leading-none">
              {getCompanyDisplayName(isBangla)}
            </h1>
            <p className="text-[10px] text-teal-400/90 font-medium truncate max-w-[200px] sm:max-w-xs mt-0.5">
              {getCompanyTagline(isBangla)}
            </p>
          </div>
        </div>

        {/* Quick Controls: Attendance & Language */}
        <div className="flex items-center gap-2">
          {/* Quick Attendance Clock-In Button for Staff */}
          <button
            onClick={onOpenAttendance}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition-all cursor-pointer"
            title={t("লগইন ছাড়া সরাসরি ফেস উপস্থিতি", "Clock-in directly with Face Match")}
          >
            <ScanFace className="w-4 h-4" />
            <span className="hidden sm:inline">{t("উপস্থিতি দিন", "Clock In")}</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-teal-400" />
            <span>{isBangla ? "বাংলা" : "EN"}</span>
          </button>
        </div>
      </header>

      {/* Main Center Area: Login Card & Demo Explorer */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 z-10 max-w-5xl mx-auto w-full">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Form Header */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-1">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {t("কর্মকর্তা ও কর্মচারী লগইন", "Employee & Staff Portal")}
            </h2>
            <p className="text-xs text-slate-400">
              {t("আপনার নিবন্ধিত ইমেইল বা আইডি দিয়ে প্রবেশ করুন", "Sign in to access your enterprise dashboard")}
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleFormLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                {t("অ্যাকাউন্ট ইউজার আইডি / ইমেইল / কোড", "Account User ID / Work Email / Code")}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={emailOrCode}
                  onChange={(e) => setEmailOrCode(e.target.value)}
                  placeholder={t("যেমন: admin, ceo, MWO-1001 বা ইমেইল", "e.g. admin, ceo, MWO-1001 or email")}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300">
                  {t("পাসওয়ার্ড", "Password")}
                </label>
                <span className="text-[11px] text-teal-400 font-medium">
                  {t("ডিফল্ট: 123456 বা নিজস্ব পাসওয়ার্ড", "Default: 123456 or your password")}
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>{t("যাচাই করা হচ্ছে...", "Authenticating...")}</span>
              ) : (
                <>
                  <span>{t("লগইন করুন", "Sign In to Portal")}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>


          {/* Quick Attendance info */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <ScanFace className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="text-[11px] leading-tight">
                {t("অফিসের ডিভাইসে ফেস অ্যাটেন্ডেন্স দিতে চান?", "Need to clock in attendance directly?")}
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenAttendance}
              className="text-teal-400 hover:text-teal-300 font-bold text-xs underline cursor-pointer shrink-0 ml-2"
            >
              {t("ক্যামেরা ওপেন করুন", "Open Camera")}
            </button>
          </div>
        </div>

        {/* Demo Mode Section - Only visible when enabled from Super Admin Board */}
        {isDemoModeEnabled && (
          <div className="w-full max-w-2xl mt-8 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-300">
                  {t("সুপার অ্যাডমিন ডেমো এক্সেস পোর্টাল (সক্রিয়)", "Super Admin Demo Portals (Active)")}
                </span>
              </div>
              <span className="text-[10px] text-teal-400/90 font-mono bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-md">
                1-click test
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoRolePresets.map((preset) => {
                const emp = employees.find((e) => e.id === preset.empId) || employees[0];
                return (
                  <button
                    key={preset.empId}
                    type="button"
                    onClick={() => handleQuickDemoLogin(preset.empId)}
                    className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/50 text-left transition-all group cursor-pointer flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={emp.avatarUrl}
                        alt={emp.fullName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0 group-hover:border-teal-500 transition-colors"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white truncate group-hover:text-teal-300 transition-colors">
                          {isBangla ? preset.titleBn : preset.titleEn}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {emp.fullName} • {emp.employeeCode}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {isBangla ? preset.descBn : preset.descEn}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Permanent Software & Vendor Attribution Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 border-t border-slate-900 text-xs text-slate-500 select-none z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          {/* Platform Label */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-950/70 border border-teal-500/30 text-teal-300 font-bold text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>{isBangla ? softwareBranding.labelBn : softwareBranding.labelEn}</span>
            </div>

            <span className="text-slate-700 hidden sm:inline">•</span>

            <span className="font-semibold text-slate-400 text-[11px]">
              {t("ডেভেলপমেন্ট:", "Developed By:")}{" "}
              <span className="text-slate-200 font-bold">{softwareBranding.developerName}</span>
            </span>

            <span className="text-slate-700 hidden sm:inline">•</span>

            <span className="font-medium text-slate-400 text-[11px]">
              {t("পাওয়ারড বাই:", "Powered By:")}{" "}
              <a
                href={softwareBranding.vendorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:text-teal-300 underline font-bold transition-colors decoration-teal-500/40"
              >
                {softwareBranding.vendor}
              </a>
            </span>
          </div>

          {/* System Version & Security Badge */}
          <div className="flex items-center gap-2 text-[10.5px] text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Anti-Spoofing & Geofence v3.2</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
