import React, { useState, useRef } from "react";
import {
  Building2,
  Upload,
  Trash2,
  CheckCircle2,
  X,
  Sparkles,
  RotateCcw,
  Globe,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Eye,
  FileText,
  Users,
  ToggleLeft,
  ToggleRight,
  Lock,
  Shield,
  KeyRound,
} from "lucide-react";
import { Employee } from "../../types";
import { useCompanyBranding } from "../../context/CompanyBrandingContext";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";

interface CompanyBrandingModalProps {
  currentUser?: Employee;
}

export const CompanyBrandingModal: React.FC<CompanyBrandingModalProps> = ({ currentUser }) => {
  const {
    branding,
    updateBranding,
    resetBranding,
    isBrandingModalOpen,
    setIsBrandingModalOpen,
    softwareBranding,
    isDemoModeEnabled,
    setIsDemoModeEnabled,
  } = useCompanyBranding();
  const { t, isBangla } = useThemeLanguage();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local edit states
  const [companyName, setCompanyName] = useState(branding.companyName);
  const [companyNameBn, setCompanyNameBn] = useState(branding.companyNameBn);
  const [tagline, setTagline] = useState(branding.tagline);
  const [taglineBn, setTaglineBn] = useState(branding.taglineBn);
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl || "");
  const [address, setAddress] = useState(branding.address);
  const [addressBn, setAddressBn] = useState(branding.addressBn || "");
  const [phone, setPhone] = useState(branding.phone);
  const [email, setEmail] = useState(branding.email);
  const [website, setWebsite] = useState(branding.website);
  const [regNo, setRegNo] = useState(branding.registrationNumber || "");
  const [employeeIdPrefix, setEmployeeIdPrefix] = useState(branding.employeeIdPrefix || "MWO");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Role check: Only core Platform Super Admin can toggle Demo Mode
  // CEO/Owner is restricted from toggling Demo Mode
  const isCeoOrOwner = Boolean(
    currentUser?.isCeoOrOwner ||
    currentUser?.role === "CEO" ||
    currentUser?.designationTitle?.toLowerCase().includes("ceo") ||
    currentUser?.designationTitle?.toLowerCase().includes("chief executive")
  );

  const canToggleDemoMode = Boolean(
    (currentUser?.role === "SUPER_ADMIN" || currentUser?.isSuperAdmin) && !isCeoOrOwner
  );

  // Sync if modal opens with fresh data
  React.useEffect(() => {
    if (isBrandingModalOpen) {
      setCompanyName(branding.companyName);
      setCompanyNameBn(branding.companyNameBn);
      setTagline(branding.tagline);
      setTaglineBn(branding.taglineBn);
      setLogoUrl(branding.logoUrl || "");
      setAddress(branding.address);
      setAddressBn(branding.addressBn || "");
      setPhone(branding.phone);
      setEmail(branding.email);
      setWebsite(branding.website);
      setRegNo(branding.registrationNumber || "");
      setEmployeeIdPrefix(branding.employeeIdPrefix || "MWO");
      setSavedSuccess(false);
    }
  }, [isBrandingModalOpen, branding]);

  if (!isBrandingModalOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert(t("ছবির সাইজ সর্বোচ্চ ২ মেগাবাইট হতে পারে।", "Logo size must be under 2MB."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBranding({
      companyName,
      companyNameBn,
      tagline,
      taglineBn,
      logoUrl,
      address,
      addressBn,
      phone,
      email,
      website,
      registrationNumber: regNo,
      employeeIdPrefix: employeeIdPrefix.trim().toUpperCase() || "MWO",
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsBrandingModalOpen(false);
    }, 1200);
  };

  const handleReset = () => {
    if (window.confirm(t("আপনি কি ডিফল্ট ব্র্যান্ডিংয়ে ফিরে যেতে চান?", "Reset all branding to system default?"))) {
      resetBranding();
      setIsBrandingModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {t("প্রতিষ্ঠানের লোগো ও ব্র্যান্ডিং কনফিগারেশন", "Client Enterprise Branding & White-Label Settings")}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  {t("সুপার অ্যাডমিন", "Super Admin")}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t(
                  "ক্রেতা প্রতিষ্ঠানের নিজস্ব নাম, লোগো ও ট্যাগলাইন সেট করুন যা হেডার ও অফিশিয়াল নোটিশে প্রদর্শিত হবে।",
                  "Configure client company logo, name, tagline and address visible in Header, Sidebar and Notice Letterheads."
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsBrandingModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto no-scrollbar">
          {/* 1. Live Visual Preview */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-teal-50/40 dark:from-slate-950 dark:to-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-teal-500" />
                <span>{t("হেডার ও লেটারহেডে লাইভ প্রিভিউ", "Real-Time Header & Letterhead Preview")}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {isBangla ? "বাংলা মোড" : "English Mode"}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
              {/* Logo Preview */}
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Company Logo Preview"
                  className="w-12 h-12 rounded-xl object-contain bg-slate-50 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-black text-xl shadow shrink-0">
                  {(isBangla ? (companyNameBn?.[0] || "এ") : (companyName?.[0] || "A")).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-0.5">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white break-words text-wrap leading-snug">
                  {isBangla ? (companyNameBn || companyName) : (companyName || companyNameBn)}
                </h4>
                <p className="text-xs text-teal-600 dark:text-teal-400 font-medium break-words text-wrap leading-tight">
                  {isBangla ? (taglineBn || tagline) : (tagline || taglineBn)}
                </p>
                <div className="text-[10px] text-slate-500 break-words text-wrap leading-tight mt-0.5">
                  {isBangla ? (addressBn || address) : (address || addressBn)}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Logo Upload Section */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-teal-500" />
                  <span>{t("প্রতিষ্ঠানের অফিসিয়াল লোগো আপলোড", "Upload Company Official Logo (PNG/JPG/SVG/WebP)")}</span>
                </h4>
                <p className="text-[10.5px] text-slate-500">
                  {t(
                    "লোগো ফাইল নির্বাচন করলে স্বয়ংক্রিয়ভাবে সফটওয়্যারের উপরে ও নোটিশ বোর্ডে এই লোগো চলে আসবে।",
                    "Uploaded logo will immediately replace default icon on Header, Sidebar, and A4 Letterheads."
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {logoUrl ? (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t("লোগো মুছুন", "Remove Logo")}</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{logoUrl ? t("লোগো পরিবর্তন করুন", "Change Logo") : t("লোগো নির্বাচন করুন", "Select Logo File")}</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* 3. Company Names & Taglines (English & Bangla) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                {t("প্রতিষ্ঠানের নাম (English)", "Company Name (English)")} *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Global Technologies Ltd."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                {t("প্রতিষ্ঠানের নাম (বাংলা)", "Company Name (Bangla)")} *
              </label>
              <input
                type="text"
                required
                value={companyNameBn}
                onChange={(e) => setCompanyNameBn(e.target.value)}
                placeholder="যেমন: এপেক্স গ্লোবাল টেকনোলজিস লিমিটেড"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                {t("প্রতিষ্ঠানের ট্যাগলাইন / স্লোগান (English)", "Company Tagline / Subtitle (English)")}
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Enterprise Workforce & Multi-Branch Operations"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                {t("প্রতিষ্ঠানের ট্যাগলাইন / স্লোগান (বাংলা)", "Company Tagline / Subtitle (Bangla)")}
              </label>
              <input
                type="text"
                value={taglineBn}
                onChange={(e) => setTaglineBn(e.target.value)}
                placeholder="যেমন: মাল্টি-ব্রাঞ্চ কর্মীবাহিনী ও স্মার্ট এইচআরএম সমাধান"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* 4. Corporate Address, Phone, Email & Web */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-500" />
                <span>{t("করপোরেট ঠিকানা (English)", "Corporate Address (English)")}</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Tower 71, Road 11, Gulshan-1, Dhaka-1212"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-500" />
                <span>{t("করপোরেট ঠিকানা (বাংলা)", "Corporate Address (Bangla)")}</span>
              </label>
              <input
                type="text"
                value={addressBn}
                onChange={(e) => setAddressBn(e.target.value)}
                placeholder="টাওয়ার ৭১, রোড ১১, গুলশান-১, ঢাকা-১২১২"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-teal-500" />
                <span>{t("অফিসিয়াল ফোন নম্বর", "Official Contact Numbers")}</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 2-9887766, +880 1700-000000"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-teal-500" />
                <span>{t("অফিসিয়াল ইমেইল", "Official Email Address")}</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@apexglobal.tech"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-teal-500" />
                <span>{t("অফিসিয়াল ওয়েবসাইট", "Official Website URL")}</span>
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://apexglobal.tech"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                <span>{t("কোম্পানি রেজিস্ট্রেশন / TIN / BIN", "Registration / Trade License / Tax ID")}</span>
              </label>
              <input
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="REG-BD-2026-90812"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Employee ID Prefix Configuration */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>{t("কর্মচারী আইডি প্রিফিক্স (Employee ID Prefix)", "Employee ID Prefix (e.g. MWO)")}</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={employeeIdPrefix}
                  onChange={(e) => setEmployeeIdPrefix(e.target.value.toUpperCase())}
                  placeholder="MWO"
                  maxLength={10}
                  className="w-32 px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl bg-slate-50 dark:bg-slate-950 border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 focus:outline-none focus:border-purple-500"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t(
                    `নতুন কর্মীর আইডি হবে: ${employeeIdPrefix || "MWO"}-1001, ${employeeIdPrefix || "MWO"}-1002`,
                    `New staff will get IDs: ${employeeIdPrefix || "MWO"}-1001, ${employeeIdPrefix || "MWO"}-1002...`
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Interactive Demo Mode Toggle (Super Admin Control Only) */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl mt-0.5 ${isDemoModeEnabled ? "bg-teal-500/20 text-teal-400" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>{t("লগইন পেজে ডেমো মোড ও এক-ক্লিক টেস্ট এক্সেস", "Interactive Demo Mode on Login Page")}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${isDemoModeEnabled ? "bg-teal-500/20 text-teal-600 dark:text-teal-400" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>
                    {isDemoModeEnabled ? "ACTIVE" : "DISABLED"}
                  </span>
                  {!canToggleDemoMode && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      {t("সুপার অ্যাডমিন লক", "Super Admin Locked")}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {t(
                    "চালু থাকলে লগইন পেজে সরাসরি সিইও, এইচআর, অ্যাকাউন্টস বা স্টাফ রোল ঘুরে দেখার বাটন থাকবে। বন্ধ থাকলে সরাসরি আইডি ও পাসওয়ার্ড লাগবে।",
                    "When ON, login page shows 1-click role presets for CEO, HR, Accounts and Staff to explore. When OFF, standard credentials required."
                  )}
                </div>
                {!canToggleDemoMode && (
                  <div className="mt-1.5 text-[10.5px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span>
                      {t(
                        "ডেমো মোড নিয়ন্ত্রণ শুধুমাত্র মূল প্ল্যাটফর্ম সুপার অ্যাডমিনের জন্য সংরক্ষিত। সিইও/মালিক বা অন্য কোনো রোল থেকে এটি অন/অফ করা যাবে না।",
                        "Demo Mode control is strictly reserved for the Platform Super Admin. CEO/Owner or other roles cannot toggle this setting."
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {canToggleDemoMode ? (
              <button
                type="button"
                onClick={() => setIsDemoModeEnabled(!isDemoModeEnabled)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                {isDemoModeEnabled ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-teal-500" />
                    <span className="text-teal-600 dark:text-teal-400">{t("চালু", "ON")}</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-slate-500" />
                    <span className="text-slate-500">{t("বন্ধ", "OFF")}</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-xs font-bold cursor-not-allowed shrink-0 select-none">
                <Lock className="w-3.5 h-3.5" />
                <span>{isDemoModeEnabled ? t("চালু (লকড)", "ON (Locked)") : t("বন্ধ (লকড)", "OFF (Locked)")}</span>
              </div>
            )}
          </div>

          {/* 6. Software Attribution Notice (White-Label Clarity) */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              <span>
                {t("সফটওয়্যার প্ল্যাটফর্ম:", "Software Platform:")}{" "}
                <strong className="text-slate-900 dark:text-white">{softwareBranding.labelEn}</strong>
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              {t("ফুটার ও সিস্টেমে স্থায়ী ক্রেডিট সংরক্ষিত থাকবে", "Permanent attribution preserved in footer")}
            </span>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t("ডিফল্টে রিসেট করুন", "Reset to Default")}</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsBrandingModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {t("বাতিল", "Cancel")}
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>{t("সংরক্ষিত হয়েছে!", "Saved Successfully!")}</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    <span>{t("ব্র্যান্ডিং সংরক্ষণ করুন", "Save Branding")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
