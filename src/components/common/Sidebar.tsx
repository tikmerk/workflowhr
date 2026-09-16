import React from "react";
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Building2,
  Layers,
  Clock,
  CalendarDays,
  CalendarCheck,
  CreditCard,
  Banknote,
  Briefcase,
  KanbanSquare,
  Laptop,
  FileCheck2,
  UserMinus,
  MessageSquareQuote,
  ShieldCheck,
  X,
  ChevronRight,
  Settings,
  Sparkles,
  HeartHandshake,
  GraduationCap,
  Presentation,
  KeyRound,
  RotateCcw,
  ScanFace,
} from "lucide-react";
import { Logo } from "./Logo";
import { UserRole, Employee } from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { useCompanyBranding } from "../../context/CompanyBrandingContext";
import { APP_VERSION, APP_BUILD_NAME } from "../../version";

export type NavTabId =
  | "dashboard"
  | "my-portal"
  | "employees"
  | "departments-designations"
  | "branches"
  | "ngo-programs-training"
  | "meetings-conferences"
  | "roles-permissions"
  | "attendance-logs"
  | "face-recognition-kiosk"
  | "shifts-holidays"
  | "leaves"
  | "payroll"
  | "loans"
  | "recruitment"
  | "projects-tasks"
  | "assets"
  | "certificates"
  | "exit-management"
  | "notices-chat"
  | "audit-reports";

interface SidebarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  userRole: UserRole;
  currentEmployee?: Employee;
  unreadCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenOrganizationReset?: () => void;
}

interface NavItemDef {
  id: NavTabId;
  labelEn: string;
  labelBn: string;
  icon: React.ElementType;
  badgeEn?: string;
  badgeBn?: string;
  rolesAllowed?: UserRole[];
}

interface NavGroupDef {
  groupTitleEn: string;
  groupTitleBn: string;
  items: NavItemDef[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  userRole,
  currentEmployee,
  unreadCount = 0,
  isOpenMobile = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  onOpenOrganizationReset,
}) => {
  const { t, isBangla } = useThemeLanguage();
  const { branding, setIsBrandingModalOpen, softwareBranding } = useCompanyBranding();

  const isSuperAdmin =
    userRole === "SUPER_ADMIN" ||
    userRole === "COMPANY_ADMIN" ||
    userRole === "CEO" ||
    Boolean(currentEmployee?.isSuperAdmin) ||
    Boolean(currentEmployee?.isCeoOrOwner);

  const navGroups: NavGroupDef[] = [
    {
      groupTitleEn: "Dashboards",
      groupTitleBn: "ড্যাশবোর্ড",
      items: [
        {
          id: "dashboard",
          labelEn: "Executive Analytics",
          labelBn: "এক্সিকিউটিভ ড্যাশবোর্ড",
          icon: LayoutDashboard,
        },
        {
          id: "my-portal",
          labelEn: "Self-Service Portal",
          labelBn: "আমার সেলফ-সার্ভিস পোর্টাল",
          icon: UserCheck,
          badgeEn: "My Account",
          badgeBn: "আমার অ্যাকাউন্ট",
        },
      ],
    },
    {
      groupTitleEn: "Workforce Architecture",
      groupTitleBn: "কর্মীবাহিনী ও ব্রাঞ্চ",
      items: [
        {
          id: "employees",
          labelEn: "Employee Directory",
          labelBn: "কর্মকর্তা-কর্মচারী তালিকা",
          icon: Users,
        },
        {
          id: "departments-designations",
          labelEn: "Depts & Designations",
          labelBn: "বিভাগ ও পদবী ব্যবস্থাপনা",
          icon: Layers,
        },
        {
          id: "branches",
          labelEn: "Branches & Geofencing",
          labelBn: "শাখা ও জিওফেন্সিং সেটিংস",
          icon: Building2,
        },
      ],
    },
    {
      groupTitleEn: "NGO Programs & District Hubs",
      groupTitleBn: "এনজিও কর্মসূচি ও জেলা ট্রেনিং হাব",
      items: [
        {
          id: "ngo-programs-training",
          labelEn: "Programs & Training Centers",
          labelBn: "ত্রাণ কর্মসূচি ও প্রশিক্ষণ কেন্দ্র",
          icon: HeartHandshake,
          badgeEn: "Field Ops",
          badgeBn: "ত্রাণ ও ট্রেনিং",
        },
        {
          id: "meetings-conferences",
          labelEn: "Meetings & Conferences",
          labelBn: "মিটিং, সেমিনার ও সম্মেলন",
          icon: Presentation,
          badgeEn: "Attendance",
          badgeBn: "প্রোগ্রাম হাজিরা",
        },
      ],
    },
    {
      groupTitleEn: "Time & Attendance",
      groupTitleBn: "সময় ও উপস্থিতি",
      items: [
        {
          id: "face-recognition-kiosk",
          labelEn: "Face Recognition Kiosk",
          labelBn: "রিয়েল-টাইম ফেস ডিটেকশন ও রিকগনাইজেশন",
          icon: ScanFace,
          badgeEn: "Live Kiosk",
          badgeBn: "অটো ডিটেকশন",
        },
        {
          id: "attendance-logs",
          labelEn: "Biometric Attendance",
          labelBn: "স্মার্ট বায়োমেট্রিক উপস্থিতি",
          icon: Clock,
        },
        {
          id: "shifts-holidays",
          labelEn: "Shifts & Working Hours",
          labelBn: "শিফট ও কর্মঘণ্টা বিন্যাস",
          icon: CalendarDays,
        },
        {
          id: "leaves",
          labelEn: "Leave Management",
          labelBn: "ছুটি অনুমোদন ও ব্যালেন্স",
          icon: CalendarCheck,
          badgeEn: "Approval",
          badgeBn: "অনুমোদন",
        },
      ],
    },
    {
      groupTitleEn: "Finance & Payroll",
      groupTitleBn: "বেতন ও আর্থিক সুবিধা",
      items: [
        {
          id: "payroll",
          labelEn: "Salary & Payslips",
          labelBn: "মাসিক বেতন ও পে-স্লিপ",
          icon: CreditCard,
        },
        {
          id: "loans",
          labelEn: "Loan & Advances",
          labelBn: "ঋণ ও প্রভিডেন্ট ফান্ড",
          icon: Banknote,
        },
      ],
    },
    {
      groupTitleEn: "Talent & Productivity",
      groupTitleBn: "নিয়োগ ও প্রজেক্ট ম্যানেজমেন্ট",
      items: [
        {
          id: "recruitment",
          labelEn: "Recruitment & ATS",
          labelBn: "নিয়োগ ও জীবনবৃত্তান্ত বাছাই",
          icon: Briefcase,
          badgeEn: "AI Rank",
          badgeBn: "এআই র‍্যাংক",
        },
        {
          id: "projects-tasks",
          labelEn: "Projects & Tasks",
          labelBn: "প্রকল্প ও টাস্ক অগ্রগতি",
          icon: KanbanSquare,
        },
        {
          id: "assets",
          labelEn: "Asset Management",
          labelBn: "কোম্পানি সম্পদ ও হ্যান্ডওভার",
          icon: Laptop,
        },
      ],
    },
    {
      groupTitleEn: "Official Notices & Comms",
      groupTitleBn: "অফিসিয়াল বিজ্ঞপ্তি ও যোগাযোগ",
      items: [
        {
          id: "notices-chat",
          labelEn: "Notice Board & Comms",
          labelBn: "নোটিশ বোর্ড ও সার্কুলার",
          icon: MessageSquareQuote,
          badgeEn: "A4 Letterhead",
          badgeBn: "এ-ফোর নোটিশ",
        },
        {
          id: "certificates",
          labelEn: "Official Letters",
          labelBn: "অফিসিয়াল সনদ ও প্রত্যয়ন",
          icon: FileCheck2,
        },
        {
          id: "exit-management",
          labelEn: "Exit & Resignation",
          labelBn: "পদত্যাগ ও ক্লিয়ারেন্স",
          icon: UserMinus,
        },
        {
          id: "roles-permissions",
          labelEn: "Roles & Permissions",
          labelBn: "সিস্টেম রোল ও পলিসি",
          icon: KeyRound,
          badgeEn: "Super Admin",
          badgeBn: "সুপার অ্যাডমিন",
        },
        {
          id: "audit-reports",
          labelEn: "Audit Logs & Reports",
          labelBn: "অডিট লগ ও সিস্টেম রিপোর্ট",
          icon: ShieldCheck,
        },
      ],
    },
  ];

  const filteredNavGroups = React.useMemo(() => {
    if (isSuperAdmin) return navGroups;
    const allowed = currentEmployee?.allowedTabs;
    if (!allowed || allowed.length === 0) return navGroups;
    return navGroups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (item) =>
            allowed.includes(item.id) ||
            item.id === "dashboard" ||
            item.id === "my-portal"
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [isSuperAdmin, currentEmployee?.allowedTabs, navGroups]);

  const handleItemClick = (id: NavTabId) => {
    onTabChange(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderSidebarContent = (isMobileView = false) => (
    <div className="flex flex-col h-full overflow-y-auto select-none no-scrollbar hide-scrollbars bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      {/* Brand Header (Client Enterprise Identity) */}
      <div
        className={`p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 sticky top-0 z-10 backdrop-blur-md flex items-start ${
          isCollapsed && !isMobileView ? "justify-center" : "justify-between gap-2"
        }`}
      >
        <Logo size="md" isCollapsed={isCollapsed && !isMobileView} className="flex-1 min-w-0" />

        {isMobileView && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 mt-0.5 cursor-pointer"
            aria-label="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Groups - Clean, High-Contrast Sleek Layout */}
      <nav className={`flex-1 overflow-y-auto no-scrollbar hide-scrollbars ${isCollapsed && !isMobileView ? "px-2 py-3 space-y-3" : "px-3 py-3 space-y-4"}`}>
        {filteredNavGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {(!isCollapsed || isMobileView) && (
              <div className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {isBangla ? group.groupTitleBn : group.groupTitleEn}
              </div>
            )}

            <div className="space-y-0.5 mt-1">
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                const IconComponent = item.icon;
                const itemLabel = isBangla ? item.labelBn : item.labelEn;
                const badgeLabel = isBangla ? item.badgeBn : item.badgeEn;

                if (isCollapsed && !isMobileView) {
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      title={itemLabel}
                      className={`w-full h-10 flex items-center justify-center rounded-xl transition-all group relative cursor-pointer ${
                        isActive
                          ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 shadow-xs font-bold"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                      }`}
                    >
                      <IconComponent
                        className={`w-4.5 h-4.5 transition-colors ${
                          isActive ? "text-teal-600 dark:text-teal-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                        }`}
                      />
                    </button>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                      isActive
                        ? "bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold border border-teal-500/25 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconComponent
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? "text-teal-600 dark:text-teal-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                        }`}
                      />
                      <span className="truncate">{itemLabel}</span>
                    </div>

                    {badgeLabel && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          item.id === "notices-chat"
                            ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30"
                            : item.badgeEn === "AI Rank"
                            ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {badgeLabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Super Admin Organization Reset Option */}
      {isSuperAdmin && onOpenOrganizationReset && (
        <div className={isCollapsed && !isMobileView ? "px-2 py-1" : "px-3 py-1"}>
          {isCollapsed && !isMobileView ? (
            <button
              type="button"
              onClick={onOpenOrganizationReset}
              title={isBangla ? "প্রতিষ্ঠান রিসেট (Organization Reset)" : "Reset Organization"}
              className="w-full h-10 flex items-center justify-center rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenOrganizationReset}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/60 transition cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>{isBangla ? "রিসেট প্রতিষ্ঠান (Reset Org)" : "Reset Organization"}</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-300 font-bold uppercase font-mono">
                Super Admin
              </span>
            </button>
          )}
        </div>
      )}

      {/* Super Admin Quick Branding Setup Button in Sidebar */}
      {isSuperAdmin && (!isCollapsed || isMobileView) && (
        <div className="px-3 py-1">
          <button
            type="button"
            onClick={() => setIsBrandingModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{t("কোম্পানি ব্র্যান্ডিং কনফিগ", "Branding Setup")}</span>
            </div>
            <Sparkles className="w-3 h-3 text-purple-500" />
          </button>
        </div>
      )}

      {/* Software Creator & Vendor Branding at Sidebar Bottom */}
      {(!isCollapsed || isMobileView) ? (
        <div className="p-3 m-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-[10.5px] text-slate-600 dark:text-slate-400 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {softwareBranding.labelEn}
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-teal-500/15 text-teal-700 dark:text-teal-300 font-mono font-black text-[10px] border border-teal-500/30">
              {APP_VERSION}
            </span>
          </div>
          <div className="flex items-center justify-between text-[9.5px] pt-0.5">
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
              {t("ক্লাউড এন্টারপ্রাইজ", APP_BUILD_NAME)}
            </span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono font-bold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {t("অনলাইন", "Online")}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-2 flex flex-col items-center justify-center gap-1 text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500" title="Workflow HR Online"></div>
          <span className="text-[8.5px] font-mono font-bold text-teal-600 dark:text-teal-400">{APP_VERSION}</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar with Zero-Visible Scrollbar */}
      <aside
        id="workflow-hr-sidebar"
        className={`hidden lg:flex flex-col shrink-0 h-screen sticky top-0 z-30 transition-all duration-200 border-r border-slate-200 dark:border-slate-800 ${
          isCollapsed ? "w-18" : "w-72"
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile & Tablet Drawer Modal */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Slide-out Drawer */}
          <div className="relative w-80 max-w-[88vw] bg-white dark:bg-slate-900 h-full shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
