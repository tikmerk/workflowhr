import React, { useState, useMemo, useRef } from "react";
import {
  Building2,
  MapPin,
  Wifi,
  ShieldCheck,
  Plus,
  Edit2,
  Users,
  CheckCircle2,
  Sliders,
  Sparkles,
  Globe,
  Trash2,
  Phone,
  Mail,
  UserCheck,
  Filter,
  Search,
  Eye,
  X,
  Compass,
  ArrowRight,
  ChevronRight,
  AlertTriangle,
  AlertCircle
} from "lucide-react";
import { Branch, Employee, Department } from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";

interface BranchesGeofenceViewProps {
  branches?: Branch[];
  allEmployees?: Employee[];
  employees?: Employee[];
  departments?: Department[];
  onAddBranch: (branch: Branch) => void;
  onUpdateBranch: (branch: Branch) => void;
  onDeleteBranch?: (branchId: string) => void;
  onViewEmployee?: (emp: Employee) => void;
}

const DEFAULT_BRANCH_RECORD: Branch = {
  id: "branch-dhaka",
  companyId: "comp-01",
  name: "Dhaka Principal Campus (HQ)",
  code: "DHK-HQ",
  isHeadOffice: true,
  address: "Gulshan-2 Corporate Avenue, Dhaka",
  city: "Dhaka",
  state: "Dhaka Division",
  country: "Bangladesh",
  phone: "+880 1700-112233",
  email: "dhaka.hq@apexglobal.tech",
  latitude: 23.7925,
  longitude: 90.4078,
  geofenceRadiusMeters: 150,
  wifiSSIDWhitelist: ["APEX_CORP_5G", "APEX_GUEST_SECURE"],
  totalEmployees: 48,
  activeStatus: "ACTIVE",
};

export const BranchesGeofenceView: React.FC<BranchesGeofenceViewProps> = ({
  branches = [],
  allEmployees = [],
  employees = [],
  departments = [],
  onAddBranch,
  onUpdateBranch,
  onDeleteBranch,
  onViewEmployee,
}) => {
  const { isBangla } = useThemeLanguage();

  const staffList = allEmployees.length > 0 ? allEmployees : employees;
  const initialBranch = branches[0] || DEFAULT_BRANCH_RECORD;
  const [selectedBranch, setSelectedBranch] = useState<Branch>(initialBranch);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [showBranchStaffModal, setShowBranchStaffModal] = useState<Branch | null>(null);
  const [staffModalSearch, setStaffModalSearch] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("ALL");
  const [staffSearchTerm, setStaffSearchTerm] = useState<string>("");
  const detailPanelRef = useRef<HTMLDivElement>(null);

  // Sync if branches update
  React.useEffect(() => {
    if (branches.length > 0) {
      const match = branches.find((b) => b.id === selectedBranch?.id);
      setSelectedBranch(match || branches[0]);
    }
  }, [branches]);

  const active = selectedBranch || branches[0] || DEFAULT_BRANCH_RECORD;

  // New Branch Form State
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newCity, setNewCity] = useState("Dhaka");
  const [newAddress, setNewAddress] = useState("");
  const [newLat, setNewLat] = useState(23.7925);
  const [newLng, setNewLng] = useState(90.4078);
  const [newRadius, setNewRadius] = useState(150);
  const [newManagerId, setNewManagerId] = useState(staffList[0]?.id || "");
  const [newWifi, setNewWifi] = useState("CORP_BRANCH_5G");

  // Edit Branch Form State
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editLat, setEditLat] = useState(23.7925);
  const [editLng, setEditLng] = useState(90.4078);
  const [editRadius, setEditRadius] = useState(150);
  const [editManagerId, setEditManagerId] = useState("");
  const [editWifi, setEditWifi] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [deleteTargetBranch, setDeleteTargetBranch] = useState<Branch | null>(null);
  const [deleteErrorNotice, setDeleteErrorNotice] = useState<string | null>(null);

  const openEditModal = (b: Branch) => {
    setEditingBranch(b);
    setEditName(b.name);
    setEditCode(b.code || "");
    setEditCity(b.city || "Dhaka");
    setEditAddress(b.address || "");
    setEditLat(b.latitude || 23.7925);
    setEditLng(b.longitude || 90.4078);
    setEditRadius(b.geofenceRadiusMeters || 150);
    setEditManagerId(b.managerId || "");
    setEditWifi(b.wifiSSIDWhitelist?.[0] || "");
    setEditPhone(b.phone || "");
    setEditEmail(b.email || "");
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    const mgr = staffList.find((e) => e.id === editManagerId);

    const updated: Branch = {
      ...editingBranch,
      name: editName,
      code: editCode.toUpperCase(),
      city: editCity,
      address: editAddress,
      latitude: Number(editLat),
      longitude: Number(editLng),
      geofenceRadiusMeters: Number(editRadius),
      managerId: mgr?.id || editingBranch.managerId,
      managerName: mgr?.fullName || editingBranch.managerName,
      phone: editPhone || editingBranch.phone,
      email: editEmail || editingBranch.email,
      wifiSSIDWhitelist: editWifi ? [editWifi] : editingBranch.wifiSSIDWhitelist,
    };

    onUpdateBranch(updated);
    if (selectedBranch?.id === updated.id) {
      setSelectedBranch(updated);
    }
    setEditingBranch(null);
  };

  // Robust branch matching helper
  const getBranchEmployees = (targetBranch: Branch) => {
    return staffList.filter((emp) => {
      const matchId = emp.branchId === targetBranch.id;
      const matchExactName = emp.branchName === targetBranch.name;
      const matchPartialName =
        Boolean(emp.branchName && targetBranch.name) &&
        (emp.branchName.toLowerCase().includes(targetBranch.name.toLowerCase()) ||
          targetBranch.name.toLowerCase().includes(emp.branchName.toLowerCase()));
      const matchCode =
        Boolean(targetBranch.code) &&
        (emp.branchId?.toUpperCase() === targetBranch.code.toUpperCase() ||
          emp.employeeCode?.startsWith(targetBranch.code));

      return matchId || matchExactName || matchPartialName || matchCode;
    });
  };

  // Employees assigned to currently active branch
  const branchEmployees = useMemo(() => {
    const rawList = getBranchEmployees(active);
    return rawList.filter((emp) => {
      const matchDept =
        selectedDeptFilter === "ALL" ||
        emp.departmentId === selectedDeptFilter ||
        emp.departmentName === selectedDeptFilter;
      const matchSearch =
        staffSearchTerm === "" ||
        emp.fullName.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
        emp.designationTitle.toLowerCase().includes(staffSearchTerm.toLowerCase());

      return matchDept && matchSearch;
    });
  }, [staffList, active, selectedDeptFilter, staffSearchTerm]);

  // Unique departments present in active branch
  const branchDepts = useMemo(() => {
    const deptsSet = new Set<string>();
    getBranchEmployees(active).forEach((e) => {
      if (e.departmentName) deptsSet.add(e.departmentName);
    });
    return Array.from(deptsSet);
  }, [staffList, active]);

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mgr = staffList.find((e) => e.id === newManagerId) || staffList[0];

    const branch: Branch = {
      id: `branch-${Date.now()}`,
      companyId: "comp-01",
      name: newName,
      code: newCode.toUpperCase(),
      isHeadOffice: false,
      address: newAddress,
      city: newCity,
      state: `${newCity} Division`,
      country: "Bangladesh",
      phone: "+880 1700-000000",
      email: `${newCode.toLowerCase()}@apexglobal.tech`,
      managerId: mgr?.id || "emp-001",
      managerName: mgr?.fullName || "Branch Manager",
      latitude: Number(newLat),
      longitude: Number(newLng),
      geofenceRadiusMeters: Number(newRadius),
      wifiSSIDWhitelist: [newWifi],
      totalEmployees: 0,
      activeStatus: "ACTIVE",
    };

    onAddBranch(branch);
    setSelectedBranch(branch);
    setShowAddModal(false);
    setNewName("");
    setNewCode("");
    setNewAddress("");
  };

  const handleUpdateRadius = (newRad: number) => {
    const updated = { ...active, geofenceRadiusMeters: newRad };
    setSelectedBranch(updated);
    onUpdateBranch(updated);
  };

  const handleDelete = (b: Branch) => {
    if (b.isHeadOffice) {
      setDeleteErrorNotice(
        isBangla
          ? "প্রধান কার্যালয় (Head Office) সিস্টেমের মূল নোড হওয়ায় ডিলিট করা সম্ভব নয়।"
          : "Head Office branch cannot be deleted as it serves as the root node."
      );
      setTimeout(() => setDeleteErrorNotice(null), 4000);
      return;
    }
    setDeleteTargetBranch(b);
  };

  const confirmDeleteBranch = () => {
    if (!deleteTargetBranch) return;
    if (onDeleteBranch) {
      onDeleteBranch(deleteTargetBranch.id);
    }
    if (selectedBranch?.id === deleteTargetBranch.id) {
      const remaining = branches.filter((item) => item.id !== deleteTargetBranch.id);
      setSelectedBranch(remaining[0] || DEFAULT_BRANCH_RECORD);
    }
    setDeleteTargetBranch(null);
  };

  const handleSelectBranch = (b: Branch) => {
    setSelectedBranch(b);
    setSelectedDeptFilter("ALL");
    setStaffSearchTerm("");
    // On mobile, scroll to detail panel
    if (window.innerWidth < 1024 && detailPanelRef.current) {
      detailPanelRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Branch staff modal filtered list
  const modalStaffList = useMemo(() => {
    if (!showBranchStaffModal) return [];
    const base = getBranchEmployees(showBranchStaffModal);
    if (!staffModalSearch) return base;
    return base.filter(
      (e) =>
        e.fullName.toLowerCase().includes(staffModalSearch.toLowerCase()) ||
        e.employeeCode.toLowerCase().includes(staffModalSearch.toLowerCase()) ||
        e.designationTitle.toLowerCase().includes(staffModalSearch.toLowerCase()) ||
        e.departmentName.toLowerCase().includes(staffModalSearch.toLowerCase())
    );
  }, [showBranchStaffModal, staffList, staffModalSearch]);

  return (
    <div id="branches-geofence-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>{isBangla ? "শাখা ও জিওফেন্স ম্যানেজমেন্ট" : "Multi-Branch & Geofence"}</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            {isBangla ? "ব্রাঞ্চ হাব, জিওফেন্স পরিধি ও কর্মী ব্যবস্থাপনা" : "Branch Hierarchy & Geofence Perimeter"}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {isBangla
              ? "ব্রাঞ্চের তথ্য সম্পাদনা করুন, কর্মী তালিকা দেখুন এবং জিপিএস জিওফেন্স পরিধি নিয়ন্ত্রণ করুন"
              : "Inspect branch details, edit profiles, view branch personnel roster and calibrate GPS beacons"}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isBangla ? "+ নতুন ব্রাঞ্চ তৈরি করুন" : "+ Add Regional Branch"}</span>
        </button>
      </div>

      {deleteErrorNotice && (
        <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{deleteErrorNotice}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
            {isBangla ? "মোট শাখা (Total Branches)" : "Total Branches"}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-2">
            <span>{branches.length}</span>
            <span className="text-xs text-teal-600 dark:text-teal-400 font-normal">
              {branches.filter((b) => b.isHeadOffice).length} HQ
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
            {isBangla ? "মোট কর্মী (Branch Staff)" : "Branch Assigned Staff"}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-2">
            <span>{staffList.length}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-normal">{isBangla ? "কর্মরত" : "Active"}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
            {isBangla ? "বর্তমান নির্বাচিত শাখা" : "Selected Branch"}
          </span>
          <div className="text-base font-bold text-teal-700 dark:text-teal-400 mt-1 truncate">
            {active.name}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            {getBranchEmployees(active).length} {isBangla ? "জন কর্মী" : "Staff"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
            {isBangla ? "জিওফেন্স পরিধি (Active Radius)" : "Active Geofence"}
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {active.geofenceRadiusMeters || 150}m
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Branch List & Live Geofence Configurator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Branch Directory List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isBangla ? `শাখা তালিকা (${branches.length})` : `Registered Branches (${branches.length})`}</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isBangla ? "ক্লিক করে বিস্তারিত দেখুন" : "Click to inspect & edit"}
            </span>
          </div>

          <div className="space-y-3">
            {branches.map((b) => {
              const isSelected = active.id === b.id;
              const totalBranchStaff = getBranchEmployees(b).length;

              return (
                <div
                  key={b.id}
                  onClick={() => handleSelectBranch(b)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                    isSelected
                      ? "bg-teal-500/10 border-teal-500 shadow-md shadow-teal-500/10 ring-1 ring-teal-500/30"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{b.name}</h4>
                        {b.isHeadOffice && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                            HQ
                          </span>
                        )}
                        {b.code && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {b.code}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {b.address}, {b.city}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(b);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-teal-500/20"
                        title={isBangla ? "ব্রাঞ্চ এডিট করুন" : "Edit Branch Details"}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{isBangla ? "এডিট" : "Edit"}</span>
                      </button>

                      {/* Delete Button */}
                      {!b.isHeadOffice && onDeleteBranch ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(b);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-rose-500/20"
                          title={isBangla ? "ব্রাঞ্চ মুছে ফেলুন" : "Delete Branch"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isBangla ? "মুছুন" : "Delete"}</span>
                        </button>
                      ) : b.isHeadOffice ? (
                        <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                          {isBangla ? "HQ সুরক্ষিত" : "HQ Protected"}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Manager & Staff Counter */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                        {isBangla ? "ব্রাঞ্চ ম্যানেজার:" : "Branch Manager:"}
                      </span>
                      <span className="font-bold text-teal-700 dark:text-teal-300 text-xs block truncate max-w-[180px]">
                        {b.managerName || "Operations Lead"}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                        {isBangla ? "মোট কর্মরত কর্মী:" : "Total Staff:"}
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs font-mono">
                        {totalBranchStaff} {isBangla ? "জন কর্মী" : "Members"}
                      </span>
                    </div>
                  </div>

                  {/* Primary Action Button: View Branch Staff & Enter */}
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectBranch(b);
                        setShowBranchStaffModal(b);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <Users className="w-4 h-4" />
                      <span>
                        {isBangla
                          ? `ব্রাঞ্চে প্রবেশ করুন ও কর্মী দেখুন (${totalBranchStaff} জন)`
                          : `Enter Branch & View Staff (${totalBranchStaff})`}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Geofence Calibration & Branch Staff Explorer (7 cols) */}
        <div ref={detailPanelRef} className="lg:col-span-7 space-y-6">
          {/* Active Branch Geofence Panel */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  <span>{isBangla ? "শাখা পর্যবেক্ষণ ও জিওফেন্স পরিধি" : "Branch Calibration & Geofence"}</span>
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{active.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {active.address}, {active.city}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Active Geofence
                </span>

                <button
                  onClick={() => openEditModal(active)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={isBangla ? "শাখা তথ্য সম্পাদনা করুন" : "Edit Branch Details"}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isBangla ? "এডিট করুন" : "Edit Branch"}</span>
                </button>

                {!active.isHeadOffice && onDeleteBranch && (
                  <button
                    onClick={() => handleDelete(active)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title={isBangla ? "শাখা ডিলিট করুন" : "Delete Branch"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Radar / GPS Coordinates */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">
                  {isBangla ? "অক্ষাংশ (Latitude):" : "Latitude:"}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {active.latitude?.toFixed(5)}° N
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">
                  {isBangla ? "দ্রাঘিমাংশ (Longitude):" : "Longitude:"}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {active.longitude?.toFixed(5)}° E
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">
                  {isBangla ? "অনুমোদিত ওয়াইফাই:" : "Authorized Wi-Fi:"}
                </span>
                <span className="font-bold text-teal-700 dark:text-teal-300">
                  {active.wifiSSIDWhitelist?.[0] || "CORP_WIFI"}
                </span>
              </div>
            </div>

            {/* Radius Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>
                    {isBangla
                      ? "জিওফেন্স অনুমোদিত পরিধি (Geofence Perimeter):"
                      : "Geofence Enforcement Radius:"}
                  </span>
                </span>
                <span className="text-teal-600 dark:text-teal-400 font-mono text-sm">
                  {active.geofenceRadiusMeters || 150} Meters
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="25"
                value={active.geofenceRadiusMeters || 150}
                onChange={(e) => handleUpdateRadius(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
                <span>50m (Strict Office Room)</span>
                <span>250m (Campus Wide)</span>
                <span>500m (Industrial Zone)</span>
              </div>
            </div>
          </div>

          {/* Branch Staff Roster with Department Filter */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>{isBangla ? `${active.name}-এর কর্মরত কর্মী তালিকা` : `${active.name} Staff Directory`}</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBangla
                    ? `মোট কর্মরত: ${branchEmployees.length} জন | ডিপার্টমেন্ট অনুযায়ী ফিল্টার করুন`
                    : `Currently ${branchEmployees.length} staff members assigned | Filter by department`}
                </p>
              </div>

              {/* Department Filter for this branch */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">{isBangla ? "সকল ডিপার্টমেন্ট" : "All Departments"}</option>
                  {branchDepts.map((deptName) => (
                    <option key={deptName} value={deptName}>
                      {deptName}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={staffSearchTerm}
                    onChange={(e) => setStaffSearchTerm(e.target.value)}
                    placeholder={isBangla ? "নাম বা কোড খুঁজুন..." : "Filter staff..."}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 w-36 sm:w-44"
                  />
                </div>
              </div>
            </div>

            {/* Employees Grid */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
              {branchEmployees.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 space-y-2">
                  <Users className="w-10 h-10 mx-auto opacity-30 text-teal-500" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    {isBangla ? "এই ব্রাঞ্চে কোনো কর্মী পাওয়া যায়নি" : "No staff found for this branch filter"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {isBangla ? "কর্মচারী যুক্ত করতে এমপ্লয়ি ডিরেক্টরিতে যান" : "Assign employees from the Employee Directory"}
                  </p>
                </div>
              ) : (
                branchEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatarUrl}
                        alt={emp.fullName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                          <span>{emp.fullName}</span>
                          {emp.faceTemplateRegistered && (
                            <span className="p-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" title="Biometric Face Enrolled">
                              <CheckCircle2 className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                          {emp.designationTitle}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {emp.employeeCode} • {emp.departmentName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
                        {emp.status}
                      </span>
                      {onViewEmployee && (
                        <button
                          onClick={() => onViewEmployee(emp)}
                          className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-400 transition-colors cursor-pointer"
                          title={isBangla ? "প্রোফাইল দেখুন" : "View Profile"}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Full Branch Staff Roster Modal */}
      {showBranchStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-3xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{showBranchStaffModal.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {showBranchStaffModal.code}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isBangla
                      ? `এই ব্রাঞ্চের মোট কর্মী সংখ্যা: ${modalStaffList.length} জন`
                      : `Total assigned staff in this branch: ${modalStaffList.length}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBranchStaffModal(null);
                  setStaffModalSearch("");
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search within branch staff */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={staffModalSearch}
                onChange={(e) => setStaffModalSearch(e.target.value)}
                placeholder={isBangla ? "নাম, পদবি বা কোড দিয়ে খুঁজুন..." : "Search staff by name, designation, code..."}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Staff list */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1 max-h-[55vh] pr-1">
              {modalStaffList.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Users className="w-10 h-10 mx-auto opacity-30 text-teal-500 mb-2" />
                  <p className="font-bold text-sm text-slate-600 dark:text-slate-400">
                    {isBangla ? "এই ব্রাঞ্চে কোনো কর্মী পাওয়া যায়নি" : "No staff found"}
                  </p>
                </div>
              ) : (
                modalStaffList.map((emp) => (
                  <div
                    key={emp.id}
                    className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatarUrl}
                        alt={emp.fullName}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                          <span>{emp.fullName}</span>
                          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                            ({emp.employeeCode})
                          </span>
                        </div>
                        <div className="text-xs text-teal-700 dark:text-teal-400 font-semibold">
                          {emp.designationTitle} • {emp.departmentName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{emp.phone}</span>
                          <span>•</span>
                          <span>{emp.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        {emp.status}
                      </span>
                      {onViewEmployee && (
                        <button
                          onClick={() => {
                            setShowBranchStaffModal(null);
                            onViewEmployee(emp);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{isBangla ? "প্রোফাইল" : "View"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowBranchStaffModal(null);
                  setStaffModalSearch("");
                }}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
              >
                {isBangla ? "বন্ধ করুন" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Branch */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-lg text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>{isBangla ? "ব্রাঞ্চের তথ্য সম্পাদনা করুন" : "Edit Branch Information"}</span>
              </h3>
              <button
                onClick={() => setEditingBranch(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "শাখার নাম *" : "Branch Name *"}
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "ব্রাঞ্চ কোড *" : "Branch Code *"}
                  </label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white uppercase font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "শহর *" : "City *"}
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "ব্রাঞ্চ ম্যানেজার" : "Branch Manager"}
                  </label>
                  <select
                    value={editManagerId}
                    onChange={(e) => setEditManagerId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="">{isBangla ? "ম্যানেজার নির্বাচন করুন" : "Select Manager"}</option>
                    {staffList.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.designationTitle})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {isBangla ? "বিস্তারিত ঠিকানা *" : "Physical Address *"}
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "ফোন নম্বর" : "Phone"}
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "ইমেইল" : "Email"}
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "অক্ষাংশ (Lat)" : "Latitude"}
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editLat}
                    onChange={(e) => setEditLat(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "দ্রাঘিমাংশ (Lng)" : "Longitude"}
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editLng}
                    onChange={(e) => setEditLng(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "রেডিয়াস (মিটার)" : "Radius (M)"}
                  </label>
                  <input
                    type="number"
                    value={editRadius}
                    onChange={(e) => setEditRadius(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {isBangla ? "অনুমোদিত ওয়াইফাই SSID" : "Authorized Wi-Fi SSID"}
                </label>
                <input
                  type="text"
                  value={editWifi}
                  onChange={(e) => setEditWifi(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {isBangla ? "আপডেট সংরক্ষণ করুন" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Regional Branch */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>{isBangla ? "নতুন আঞ্চলিক শাখা নিবন্ধন" : "Register Regional Branch"}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBranchSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {isBangla ? "শাখার নাম *" : "Branch Hub Name *"}
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Chittagong Commercial Campus"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "শাখা কোড *" : "Branch Code *"}
                  </label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. CTG-01"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white uppercase font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "শহর" : "City"}
                  </label>
                  <select
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Dhaka">Dhaka</option>
                    <option value="Chittagong">Chittagong</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Khulna">Khulna</option>
                    <option value="Barisal">Barisal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {isBangla ? "ব্রাঞ্চ ম্যানেজার" : "Branch Lead / Manager"}
                </label>
                <select
                  value={newManagerId}
                  onChange={(e) => setNewManagerId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                >
                  {staffList.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.designationTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {isBangla ? "বিস্তারিত ঠিকানা *" : "Physical Address *"}
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. Agrabad Commercial Area, Chittagong"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "অক্ষাংশ (Lat)" : "Latitude"}
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLat}
                    onChange={(e) => setNewLat(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "দ্রাঘিমাংশ (Lng)" : "Longitude"}
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLng}
                    onChange={(e) => setNewLng(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {isBangla ? "রেডিয়াস (মিটার)" : "Radius (M)"}
                  </label>
                  <input
                    type="number"
                    value={newRadius}
                    onChange={(e) => setNewRadius(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {isBangla ? "ওয়াইফাই SSID" : "Authorized Wi-Fi SSID"}
                </label>
                <input
                  type="text"
                  value={newWifi}
                  onChange={(e) => setNewWifi(e.target.value)}
                  placeholder="e.g. APEX_BRANCH_5G"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  {isBangla ? "ব্রাঞ্চ তৈরি করুন" : "Publish Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Branch Confirmation Modal */}
      {deleteTargetBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isBangla ? "ব্রাঞ্চ মুছে ফেলার নিশ্চিতকরণ" : "Confirm Branch Deletion"}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {isBangla ? (
                  <>
                    আপনি কি নিশ্চিতভাবে <span className="font-bold text-rose-600">"{deleteTargetBranch.name}"</span> শাখাটি মুছে ফেলতে চান?
                    {getBranchEmployees(deleteTargetBranch).length > 0 && (
                      <span className="block mt-1 text-amber-600 font-semibold">
                        সতর্কতা: এই শাখায় বর্তমানে {getBranchEmployees(deleteTargetBranch).length} জন কর্মী নিবন্ধিত আছেন।
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Are you sure you want to delete branch <span className="font-bold text-rose-600">"{deleteTargetBranch.name}"</span>?
                    {getBranchEmployees(deleteTargetBranch).length > 0 && (
                      <span className="block mt-1 text-amber-600 font-semibold">
                        Warning: {getBranchEmployees(deleteTargetBranch).length} staff members are currently assigned to this branch.
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteTargetBranch(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
              >
                {isBangla ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={confirmDeleteBranch}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                {isBangla ? "হ্যাঁ, মুছে ফেলুন" : "Yes, Delete Branch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
