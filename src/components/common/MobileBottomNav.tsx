import React from "react";
import {
  LayoutDashboard,
  UserCheck,
  ScanFace,
  Users,
  CalendarCheck,
  Menu,
} from "lucide-react";
import { NavTabId } from "./Sidebar";

interface MobileBottomNavProps {
  activeTab: NavTabId;
  isGeneralEmployee?: boolean;
  onTabChange: (tab: NavTabId) => void;
  onOpenAttendance: () => void;
  onOpenMobileMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  isGeneralEmployee = false,
  onTabChange,
  onOpenAttendance,
  onOpenMobileMenu,
}) => {
  return (
    <div
      id="mobile-bottom-navigation-bar"
      className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/90 px-3 py-1.5 flex items-center justify-around shadow-2xl safe-bottom text-slate-600 dark:text-slate-400"
    >
      {/* 1. Dashboard */}
      <button
        type="button"
        onClick={() => onTabChange("dashboard")}
        className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all cursor-pointer ${
          activeTab === "dashboard"
            ? "text-teal-600 dark:text-teal-400 font-bold"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Dashboard</span>
      </button>

      {/* 2. Self Service Portal */}
      <button
        type="button"
        onClick={() => onTabChange("my-portal")}
        className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all cursor-pointer ${
          activeTab === "my-portal" || (activeTab as any) === "self-service"
            ? "text-teal-600 dark:text-teal-400 font-bold"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        }`}
      >
        <UserCheck className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">My Portal</span>
      </button>

      {/* 3. Central Smart Attendance Button */}
      <button
        type="button"
        onClick={onOpenAttendance}
        className="relative -top-3 flex flex-col items-center justify-center cursor-pointer group"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-teal-500/30 border-2 border-white dark:border-slate-900 group-hover:scale-105 transition-transform active:scale-95">
          <ScanFace className="w-6 h-6 animate-pulse" />
        </div>
        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 mt-0.5">Face Clock</span>
      </button>

      {/* 4. Staff Directory OR Leaves for General Employees */}
      {isGeneralEmployee ? (
        <button
          type="button"
          onClick={() => onTabChange("leaves")}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all cursor-pointer ${
            activeTab === "leaves"
              ? "text-teal-600 dark:text-teal-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <CalendarCheck className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Leaves</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onTabChange("employees")}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all cursor-pointer ${
            activeTab === "employees"
              ? "text-teal-600 dark:text-teal-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Directory</span>
        </button>
      )}

      {/* 5. More / Menu Drawer Toggle */}
      <button
        type="button"
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center justify-center p-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Menu</span>
      </button>
    </div>
  );
};
