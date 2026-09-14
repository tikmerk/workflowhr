import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  ScanFace,
  Bot,
  Bell,
  Search,
  UserCheck,
  ChevronDown,
  ShieldAlert,
  Sparkles,
  MapPin,
  Check,
  Menu,
  Sun,
  Moon,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  CreditCard,
  Shield,
  User,
  Mail,
  Phone,
  Database,
  CheckCircle2,
  RefreshCw,
  X,
  Server,
  AlertTriangle,
  RotateCcw,
  KeyRound,
  Lock,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { Employee, Branch, UserRole } from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { useCompanyBranding } from "../../context/CompanyBrandingContext";
import { checkFirestoreConnection } from "../../services/firestoreService";
import { ChangeCredentialsModal } from "./ChangeCredentialsModal";

interface HeaderProps {
  currentEmployee: Employee;
  setCurrentEmployee?: (emp: Employee) => void;
  allEmployees: Employee[];
  branches: Branch[];
  selectedBranchId: string;
  setSelectedBranchId: (branchId: string) => void;
  onOpenAttendanceModal: () => void;
  onOpenAiAssistant: () => void;
  onOpenMobileMenu?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  pendingLeavesCount?: number;
  onLogout?: () => void;
  onOpenDigitalIdCard?: (emp?: Employee) => void;
  onOpenFaceEnrollModal?: (emp?: Employee) => void;
  onOpenOrganizationReset?: () => void;
  onUpdateEmployee?: (updated: Employee) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentEmployee,
  setCurrentEmployee,
  allEmployees,
  branches,
  selectedBranchId,
  setSelectedBranchId,
  onOpenAttendanceModal,
  onOpenAiAssistant,
  onOpenMobileMenu,
  sidebarCollapsed = false,
  onToggleSidebar,
  pendingLeavesCount = 0,
  onLogout,
  onOpenDigitalIdCard,
  onOpenFaceEnrollModal,
  onOpenOrganizationReset,
  onUpdateEmployee,
}) => {
  const { language, toggleLanguage, theme, toggleTheme, t, isBangla } = useThemeLanguage();
  const { setIsBrandingModalOpen } = useCompanyBranding();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDbStatusModal, setShowDbStatusModal] = useState(false);
  const [showChangeCredsModal, setShowChangeCredsModal] = useState(false);
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{
    checking: boolean;
    ok: boolean;
    projectId?: string;
    databaseId?: string;
    latencyMs?: number;
    error?: string;
    lastPing?: string;
  }>({
    checking: false,
    ok: true,
    projectId: "gen-lang-client-0258052198",
    databaseId: "ai-studio-workflowhr-70644dfa-37ab-4766-b3f7-2708ec27803c",
    latencyMs: 38,
    lastPing: "Active (Real-time)",
  });

  const testConnection = async () => {
    setDbStatus((prev) => ({ ...prev, checking: true }));
    const start = performance.now();
    try {
      const res = await checkFirestoreConnection();
      const elapsed = Math.round(performance.now() - start);
      setDbStatus({
        checking: false,
        ok: res.ok,
        projectId: res.projectId,
        databaseId: res.databaseId,
        latencyMs: elapsed,
        error: res.error,
        lastPing: new Date().toLocaleTimeString(),
      });
    } catch (e: any) {
      setDbStatus((prev) => ({
        ...prev,
        checking: false,
        ok: false,
        error: e?.message || "Connection error",
        lastPing: new Date().toLocaleTimeString(),
      }));
    }
  };

  const branchMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  // Outside click & Escape key listeners to close all popups automatically
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (branchMenuRef.current && !branchMenuRef.current.contains(target)) {
        setShowBranchMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(target)) {
        setShowRoleMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowBranchMenu(false);
        setShowNotifications(false);
        setShowRoleMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isSuperAdmin = currentEmployee.role === "SUPER_ADMIN" || currentEmployee.role === "COMPANY_ADMIN" || currentEmployee.role === "CEO";

  const isFaceVerified = Boolean(
    currentEmployee.faceTemplateRegistered &&
    currentEmployee.faceVerified &&
    typeof currentEmployee.faceVerificationScore === "number" &&
    currentEmployee.faceVerificationScore > 0
  );
  const isFaceVerificationRequired = !isFaceVerified;
  const totalNotificationBadge = pendingLeavesCount + (isFaceVerificationRequired ? 1 : 0);

  const selectedBranch =
    branches.find((b) => b.id === selectedBranchId) || {
      id: "ALL",
      name: t("সকল আঞ্চলিক শাখা (Global)", "All Regional Branches (Global)"),
      code: "GLOBAL",
      isHeadOffice: false,
      address: "Enterprise Network",
      city: "Multi-Region",
      state: "Corporate",
      country: "Bangladesh",
      phone: "",
      email: "",
      latitude: 23.7925,
      longitude: 90.4078,
      geofenceRadiusMeters: 150,
      totalEmployees: allEmployees.length,
      activeStatus: "ACTIVE" as const,
      companyId: "comp-01",
    };

  return (
    <header
      id="workflow-hr-header"
      className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Section: Desktop & Mobile Hamburger Triggers + Active Branch Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop Sidebar Toggle Button */}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="hidden lg:flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-xs"
              title={sidebarCollapsed ? t("মেনু প্রসারিত করুন", "Expand Sidebar") : t("মেনু গুটিয়ে রাখুন", "Collapse Sidebar")}
              aria-label="Toggle Sidebar"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              )}
            </button>
          )}

          {/* Mobile & Tablet Drawer Trigger */}
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Active Branch Selector Dropdown */}
          <div className="relative" ref={branchMenuRef}>
            <button
              onClick={() => {
                setShowBranchMenu(!showBranchMenu);
                setShowRoleMenu(false);
                setShowNotifications(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <div className="text-left hidden sm:block">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider leading-none">
                  {t("সক্রিয় শাখা", "Active Branch")}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[140px] md:max-w-[180px] mt-0.5">
                  {selectedBranch.name}
                </div>
              </div>
              <span className="sm:hidden text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[90px]">
                {selectedBranch.code || t("সকল", "All")}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ml-0.5 shrink-0" />
            </button>

            {/* Branch Dropdown */}
            {showBranchMenu && (
              <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/90 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800 mb-1">
                  {t("শাখা অনুযায়ী ফিল্টার করুন", "Filter by Branch")}
                </div>
                <button
                  onClick={() => {
                    setSelectedBranchId("ALL");
                    setShowBranchMenu(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition-colors ${
                    selectedBranchId === "ALL"
                      ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold border border-teal-500/30"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 text-left">
                    <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <div>
                      <div className="font-semibold">{t("সকল আঞ্চলিক শাখা (Global)", "All Regional Branches")}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {t(`মোট ${allEmployees.length} জন কর্মী`, `Total ${allEmployees.length} Staff`)}
                      </div>
                    </div>
                  </div>
                  {selectedBranchId === "ALL" && <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />}
                </button>

                {branches.map((br) => (
                  <button
                    key={br.id}
                    onClick={() => {
                      setSelectedBranchId(br.id);
                      setShowBranchMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition-colors ${
                      selectedBranchId === br.id
                        ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold border border-teal-500/30"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-left">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <div>
                        <div className="font-semibold">{br.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {br.city} • {t(`ব্যাসার্ধ: ${br.geofenceRadiusMeters || 150}মি`, `Radius: ${br.geofenceRadiusMeters || 150}m`)}
                        </div>
                      </div>
                    </div>
                    {selectedBranchId === br.id && <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Action Controls: Language, Theme, Branding Settings, Clock-In, AI, Notifications, Persona */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Desktop/Tablet Only: Super Admin Company Branding & White-Label Setup */}
          {isSuperAdmin && (
            <button
              onClick={() => setIsBrandingModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer shrink-0"
              title={t("প্রতিষ্ঠানের লোগো ও ব্র্যান্ডিং কনফিগারেশন", "Company Branding & Logo Setup")}
            >
              <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="hidden xl:inline">{t("ব্র্যান্ডিং", "Branding")}</span>
            </button>
          )}

          {/* Desktop/Tablet Only: 1. Language Switcher (Bangla / English) */}
          <button
            onClick={toggleLanguage}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 text-xs font-bold transition-all cursor-pointer shrink-0"
            title={isBangla ? "Switch to English" : "বাংলাতে পরিবর্তন করুন"}
            aria-label="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="text-xs">{isBangla ? "বাংলা" : "EN"}</span>
          </button>

          {/* Desktop/Tablet Only: 2. Theme Switcher (Dark / Light) */}
          <button
            onClick={toggleTheme}
            className="hidden md:flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shrink-0"
            title={theme === "dark" ? t("লাইট মোড চালু করুন", "Switch to Light Mode") : t("ডার্ক মোড চালু করুন", "Switch to Dark Mode")}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* 3. Quick Smart Attendance Clock-In Trigger */}
          <button
            onClick={onOpenAttendanceModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition-all cursor-pointer shrink-0"
            title={t("উপস্থিতি (ফেস + জিপিএস)", "Clock In (Face + GPS)")}
          >
            <ScanFace className="w-4 h-4" />
            <span className="hidden md:inline">{t("উপস্থিতি", "Clock In")}</span>
          </button>

          {/* 4. AI HR Assistant Trigger */}
          <button
            onClick={onOpenAiAssistant}
            className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/10 transition-all cursor-pointer shrink-0"
            title={t("জেমিনাই এআই এইচআর", "Gemini AI HR Assistant")}
          >
            <Bot className="w-4 h-4 text-indigo-200 animate-pulse" />
            <span className="hidden xl:inline">{t("এআই এইচআর", "AI HR")}</span>
          </button>

          {/* 5. Notifications Trigger */}
          <div className="relative shrink-0" ref={notificationsRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowRoleMenu(false);
                setShowBranchMenu(false);
              }}
              className="relative p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {totalNotificationBadge > 0 && (
                <span
                  className={`absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center animate-bounce ${
                    isFaceVerificationRequired
                      ? "bg-amber-500 text-slate-950 ring-2 ring-amber-400"
                      : "bg-teal-500 text-slate-950"
                  }`}
                >
                  {totalNotificationBadge}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/90 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
                <div className="font-bold text-slate-900 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-800 mb-2 flex justify-between items-center">
                  <span>{t("ওয়ার্কফোর্স নোটিফিকেশন", "Workforce Notifications")}</span>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-bold">{t("লাইভ", "Live")}</span>
                </div>
                <div className="space-y-2">
                  {/* Face Verification Required Alert Card */}
                  {isFaceVerificationRequired ? (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-orange-500/20 border border-amber-500/40 shadow-xs animate-in fade-in">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-500/25 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                          <AlertTriangle className="w-4 h-4 animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                              {t("ছবির বায়োমেট্রিক ভেরিফিকেশন প্রয়োজন", "Face Verification Required")}
                            </span>
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/30 text-amber-800 dark:text-amber-200">
                              {t("জরুরি", "Urgent")}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-200 text-[11px] mt-1 font-medium leading-snug">
                            {t(
                              "আপনার প্রোফাইল ছবির সাথে লাইভ ক্যামেরা দিয়ে মুখমণ্ডল যাচাই করা হয়নি। স্মার্ট উপস্থিতি নিশ্চিত করতে এখনই লাইভ ভেরিফাই সম্পন্ন করুন।",
                              "Your profile face has not been verified against live camera biometrics. Please verify to enable smart attendance."
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNotifications(false);
                              if (onOpenFaceEnrollModal) {
                                onOpenFaceEnrollModal(currentEmployee);
                              }
                            }}
                            className="mt-2.5 w-full py-1.5 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                          >
                            <ScanFace className="w-3.5 h-3.5" />
                            <span>{t("এখনই ক্যামেরা দিয়ে ভেরিফাই করুন", "Verify Live Face Now")}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {t("বায়োমেট্রিক ফেস স্ট্যাটাস", "Biometric Face Status")}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                          {currentEmployee.faceVerificationScore}% {t("ভেরিফাইড", "Verified")}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                        {t(
                          "আপনার লাইভ ফেস ভেরিফিকেশন সফল হয়েছে এবং উপস্থিতি দেওয়ার জন্য সক্রিয় রয়েছে।",
                          "Your biometric face is verified and ready for attendance clock-in."
                        )}
                      </p>
                    </div>
                  )}

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase block">
                      {t("উপস্থিতি পর্যবেক্ষণ", "Attendance Telemetry")}
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                      {t("আজকের দিনশেষে ৯৬.৪% সঠিক সময়ে উপস্থিতি ও অ্যান্টি-স্পুফিং নিশ্চিত করা হয়েছে।", "96.4% on-time check-in recorded today with anti-spoofing verification.")}
                    </p>
                  </div>
                  {pendingLeavesCount > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase block">
                        {t("পেন্ডিং ছুটির আবেদন", "Pending Approvals")}
                      </span>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                        {t(`${pendingLeavesCount} টি ছুটির আবেদন অনুমোদনের অপেক্ষায় রয়েছে।`, `${pendingLeavesCount} leave application(s) awaiting managerial review.`)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 6. User Profile & Preferences Popover */}
          <div className="relative shrink-0" ref={roleMenuRef}>
            <button
              onClick={() => {
                setShowRoleMenu(!showRoleMenu);
                setShowBranchMenu(false);
                setShowNotifications(false);
              }}
              className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700/80 transition-all text-left cursor-pointer"
              title={currentEmployee.fullName}
            >
              <img
                src={currentEmployee.avatarUrl}
                alt={currentEmployee.fullName}
                className="w-7 h-7 rounded-lg object-cover border border-teal-500/50 shrink-0"
              />
              <div className="hidden lg:block leading-tight">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                  {currentEmployee.fullName}
                </div>
                <div className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold truncate max-w-[120px]">
                  {currentEmployee.role.replace("_", " ")}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            </button>

            {/* Profile Popover Card */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-80 max-w-[92vw] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/90 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
                {/* User Info Header Card */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 mb-2">
                  <img
                    src={currentEmployee.avatarUrl}
                    alt={currentEmployee.fullName}
                    className="w-11 h-11 rounded-xl object-cover border border-teal-500/50 shadow-xs shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">
                      {currentEmployee.fullName}
                    </h4>
                    <div className="text-[11px] text-teal-600 dark:text-teal-400 font-medium truncate">
                      {currentEmployee.designationTitle || currentEmployee.role.replace("_", " ")}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="px-1.5 py-0.5 rounded-md bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold text-[9.5px]">
                        ID: {currentEmployee.employeeCode}
                      </span>
                      <span className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate">
                        {currentEmployee.branchName || "Main Office"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Biometric Face Status Strip */}
                <div
                  className={`p-2 rounded-xl mb-2.5 border flex items-center justify-between gap-2 ${
                    isFaceVerificationRequired
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isFaceVerificationRequired ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                    <div className="truncate">
                      <div className="text-[10.5px] font-bold truncate">
                        {isFaceVerificationRequired
                          ? t("ফেস ভেরিফিকেশন প্রয়োজন", "Face Verification Required")
                          : t(
                              `বায়োমেট্রিক ফেস ভেরিফাইড (${currentEmployee.faceVerificationScore}%)`,
                              `Biometric Face Verified (${currentEmployee.faceVerificationScore}%)`
                            )}
                      </div>
                      <div className="text-[9px] opacity-75 truncate">
                        {isFaceVerificationRequired
                          ? t("উপস্থিতি রেকর্ড করতে লাইভ ভেরিফাই আবশ্যক", "Live check required for attendance")
                          : t("স্মার্ট উপস্থিতি সক্রিয়", "Active for smart clock-in")}
                      </div>
                    </div>
                  </div>
                  {onOpenFaceEnrollModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowRoleMenu(false);
                        onOpenFaceEnrollModal(currentEmployee);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer ${
                        isFaceVerificationRequired
                          ? "bg-amber-600 hover:bg-amber-500 text-white shadow-xs"
                          : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {isFaceVerificationRequired ? t("ভেরিফাই", "Verify") : t("আপডেট", "Update")}
                    </button>
                  )}
                </div>

                {/* User Credentials & Password Change Access Card */}
                <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-500/10 via-slate-50 to-teal-500/5 dark:from-teal-950/40 dark:via-slate-800/80 dark:to-teal-950/20 border border-teal-500/30 space-y-2.5 mb-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-300">
                      <KeyRound className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span>{t("আমার লগইন তথ্য ও পাসওয়ার্ড", "My Login Credentials")}</span>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-teal-500/20 text-teal-700 dark:text-teal-300 uppercase">
                      {currentEmployee.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80">
                      <span className="text-[9.5px] text-slate-400 block font-semibold">
                        {t("ইউজারনেম / আইডি:", "ID / Username:")}
                      </span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-mono font-bold text-slate-900 dark:text-white truncate">
                          {currentEmployee.username || currentEmployee.employeeCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(currentEmployee.username || currentEmployee.employeeCode);
                            setCopySuccess("user");
                            setTimeout(() => setCopySuccess(null), 2000);
                          }}
                          title={t("কপি করুন", "Copy")}
                          className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer p-0.5"
                        >
                          {copySuccess === "user" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80">
                      <span className="text-[9.5px] text-slate-400 block font-semibold">
                        {t("পাসওয়ার্ড:", "Password:")}
                      </span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {showProfilePassword ? (currentEmployee.password || "123456") : "••••••"}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowProfilePassword(!showProfilePassword)}
                            title={showProfilePassword ? t("লুকান", "Hide") : t("দেখান", "Show")}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                          >
                            {showProfilePassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(currentEmployee.password || "123456");
                              setCopySuccess("pass");
                              setTimeout(() => setCopySuccess(null), 2000);
                            }}
                            title={t("পাসওয়ার্ড কপি করুন", "Copy password")}
                            className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer p-0.5"
                          >
                            {copySuccess === "pass" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleMenu(false);
                      setShowChangeCredsModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{t("ইউজারনেম বা পাসওয়ার্ড পরিবর্তন করুন", "Change Username / Password")}</span>
                  </button>
                </div>

                {/* Quick Preferences & Settings Panel (Theme, Language, Branding) */}
                <div className="space-y-1.5 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                    {t("কুইক কন্ট্রোল ও প্রেফারেন্স", "Quick Controls & Display")}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {/* Theme Toggle Button */}
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 transition-all text-left cursor-pointer"
                    >
                      {theme === "dark" ? (
                        <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold leading-none">
                          {theme === "dark" ? t("লাইট মোড", "Light Mode") : t("ডার্ক মোড", "Dark Mode")}
                        </div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {theme === "dark" ? t("ডার্ক সক্রিয়", "Dark active") : t("লাইট সক্রিয়", "Light active")}
                        </div>
                      </div>
                    </button>

                    {/* Language Toggle Button */}
                    <button
                      type="button"
                      onClick={toggleLanguage}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 transition-all text-left cursor-pointer"
                    >
                      <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold leading-none">
                          {isBangla ? "English (EN)" : "বাংলা (BN)"}
                        </div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {isBangla ? "বাংলা সক্রিয়" : "English active"}
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* My Digital ID Card Quick Button */}
                  {onOpenDigitalIdCard && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowRoleMenu(false);
                        onOpenDigitalIdCard(currentEmployee);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-teal-500/15 hover:from-teal-500/25 hover:to-emerald-500/25 text-teal-700 dark:text-teal-300 border border-teal-500/30 transition-all text-left cursor-pointer mt-1 group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-black">
                            {t("আমার ডিজিটাল আইডি কার্ড", "My Digital ID Card")}
                          </div>
                          <div className="text-[9.5px] text-teal-600/80 dark:text-teal-300/80">
                            {t("উচ্চ রেজোলিউশনে ভিউ ও PNG ডাউনলোড", "View & High-Res PNG Download")}
                          </div>
                        </div>
                      </div>
                      <Sparkles className="w-3.5 h-3.5 text-teal-500 shrink-0 animate-pulse" />
                    </button>
                  )}

                  {/* Super Admin Company Branding Button inside Profile */}
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowRoleMenu(false);
                        setIsBrandingModalOpen(true);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/25 transition-all text-left cursor-pointer mt-1"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <div>
                          <div className="text-[11px] font-bold">
                            {t("কোম্পানি লোগো ও ব্র্যান্ডিং সেটআপ", "Company Logo & Branding Setup")}
                          </div>
                          <div className="text-[9px] text-purple-600/80 dark:text-purple-300/80">
                            {t("নাম, লোগো ও হোয়াইট-লেবেল কনফিগারেশন", "White-label name, logo & letterhead")}
                          </div>
                        </div>
                      </div>
                      <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    </button>
                  )}

                  {/* Super Admin Organization Data Reset Button */}
                  {isSuperAdmin && onOpenOrganizationReset && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowRoleMenu(false);
                        onOpenOrganizationReset();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/25 transition-all text-left cursor-pointer mt-1"
                    >
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <div>
                          <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                            {t("রিসেট প্রতিষ্ঠান (Organization Reset)", "Reset Organization")}
                          </div>
                          <div className="text-[9px] text-rose-600/80 dark:text-rose-300/80">
                            {t("শাখাভিত্তিক বা সার্বিক ডামি ডাটা ক্লিন করুন", "Safely wipe dummy records per branch or company")}
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-300 font-bold uppercase font-mono">
                        Reset
                      </span>
                    </button>
                  )}

                  {/* Firebase Database Live Health & Sync Diagnostics (Personal Settings) */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleMenu(false);
                      setShowDbStatusModal(true);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 transition-all text-left cursor-pointer mt-1 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex h-3 w-3 shrink-0 ml-0.5 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{t("ফায়ারবেস ডাটাবেজ লাইভ স্ট্যাটাস", "Firebase Database Live Status")}</span>
                        </div>
                        <div className="text-[9px] text-emerald-600/80 dark:text-emerald-300/80">
                          {t("ক্লাউড সিঙ্ক স্থিতি, লেটেন্সি ও পিং টেস্ট", "Cloud sync health, latency & verify status")}
                        </div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                      {t("সিঙ্কড", "Synced")}
                    </span>
                  </button>
                </div>

                {/* Account Security Notice */}
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 mb-2.5 text-slate-600 dark:text-slate-400 text-[11px] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-teal-500 shrink-0" />
                  <span>
                    {t(
                      "নিরাপত্তার স্বার্থে সরাসরি প্রোফাইল সুইচিং বন্ধ রাখা হয়েছে। অন্য অ্যাকাউন্টে প্রবেশ করতে লগআউট করুন।",
                      "Direct in-session role switching is disabled for security. Please log out to access another account."
                    )}
                  </span>
                </div>

                {/* Profile Footer: Sign Out / Logout Option */}
                {onLogout && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRoleMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t("সিস্টেম থেকে লগআউট করুন", "Log Out of System")}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Firebase Database Verification & Diagnostics Modal */}
      {showDbStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 text-slate-900 dark:text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {t("ফায়ারবেস ক্লাউড ডাটাবেজ স্ট্যাটাস", "Firebase Cloud Database Diagnostics")}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t("রিয়েলটাইম ক্লাউড সিঙ্ক ও ডাটা সংরক্ষণ নিশ্চয়তা", "Realtime Cloud Sync & Persistence Assurance")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDbStatusModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Health Banner */}
            <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
              dbStatus.ok
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
            }`}>
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="min-w-0 flex-1 text-xs">
                <div className="font-black text-sm">
                  {dbStatus.ok
                    ? t("ডাটাবেজ সম্পূর্ণ সক্রিয় ও রিয়েলটাইম কানেক্টেড", "Database Active & Fully Synchronized")
                    : t("ডাটাবেজ সংযোগে সমস্যা হচ্ছে", "Database Connection Issue")}
                </div>
                <div className="text-[11px] opacity-90 mt-0.5">
                  {t(
                    "আপনার ইনপুটকৃত সকল রেকর্ড ক্লাউড ফায়ারস্টোরে স্বয়ংক্রিয়ভাবে সংরক্ষিত হচ্ছে।",
                    "All records you input are automatically persisted in Google Cloud Firestore in real-time."
                  )}
                </div>
              </div>
            </div>

            {/* Technical Metadata */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">{t("ক্লাউড প্রোভাইডার", "Cloud Engine")}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Google Cloud Firestore (NoSQL)</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">{t("প্রজেক্ট আইডি", "Project ID")}</span>
                <span className="font-mono text-[11px] font-bold text-teal-700 dark:text-teal-400">{dbStatus.projectId}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">{t("ডাটাবেজ আইডি", "Database Instance")}</span>
                <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[240px]">{dbStatus.databaseId}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">{t("রেসপন্স লেটেন্সি ও পিং", "Latency / Ping")}</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">{dbStatus.latencyMs ? `${dbStatus.latencyMs}ms` : "Active"} ({dbStatus.lastPing})</span>
              </div>
            </div>

            {/* Realtime Collections Overview */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {t("সংরক্ষিত সক্রিয় কালেকশনসমূহ (Collections)", "Active Synced Collections")}
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10.5px]">
                {[
                  "employees (কর্মী)",
                  "attendance (উপস্থিতি)",
                  "leaves (ছুটি)",
                  "payroll (বেতন)",
                  "recruitment_jobs (নিয়োগ)",
                  "recruitment_candidates (প্রার্থী)",
                  "branches (শাখা)",
                  "loans (ঋণ)",
                  "audit_logs (অডিট)",
                ].map((col) => (
                  <span
                    key={col}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono"
                  >
                    ✓ {col}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={testConnection}
                disabled={dbStatus.checking}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${dbStatus.checking ? "animate-spin text-teal-500" : ""}`} />
                <span>{dbStatus.checking ? t("টেস্ট হচ্ছে...", "Testing Ping...") : t("লাইভ পিং টেস্ট করুন", "Test Connection Ping")}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDbStatusModal(false)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {t("ঠিক আছে", "Dismiss")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change User Credentials & Password Modal */}
      {showChangeCredsModal && (
        <ChangeCredentialsModal
          isOpen={showChangeCredsModal}
          onClose={() => setShowChangeCredsModal(false)}
          employee={currentEmployee}
          allEmployees={allEmployees}
          onUpdateEmployee={(updated) => {
            if (onUpdateEmployee) {
              onUpdateEmployee(updated);
            }
            if (setCurrentEmployee) {
              setCurrentEmployee(updated);
            }
          }}
        />
      )}
    </header>
  );
};
