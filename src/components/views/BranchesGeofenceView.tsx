import React, { useState, useMemo } from "react";
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
  X
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
  const { t, isBangla } = useThemeLanguage();

  const staffList = allEmployees.length > 0 ? allEmployees : employees;
  const initialBranch = branches[0] || DEFAULT_BRANCH_RECORD;
  const [selectedBranch, setSelectedBranch] = useState<Branch>(initialBranch);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("ALL");
  const [staffSearchTerm, setStaffSearchTerm] = useState<string>("");

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

  // Employees assigned to this selected branch
  const branchEmployees = useMemo(() => {
    return staffList.filter((emp) => {
      const matchBranch = emp.branchId === active.id || emp.branchName === active.name;
      const matchDept = selectedDeptFilter === "ALL" || emp.departmentId === selectedDeptFilter || emp.departmentName === selectedDeptFilter;
      const matchSearch =
        staffSearchTerm === "" ||
        emp.fullName.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
        emp.designationTitle.toLowerCase().includes(staffSearchTerm.toLowerCase());

      return matchBranch && matchDept && matchSearch;
    });
  }, [staffList, active, selectedDeptFilter, staffSearchTerm]);

  // Unique departments present in this branch
  const branchDepts = useMemo(() => {
    const deptsSet = new Set<string>();
    staffList
      .filter((e) => e.branchId === active.id || e.branchName === active.name)
      .forEach((e) => {
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
  };

  const handleUpdateRadius = (newRad: number) => {
    const updated = { ...active, geofenceRadiusMeters: newRad };
    setSelectedBranch(updated);
    onUpdateBranch(updated);
  };

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
              ? "ব্রাঞ্চের ম্যানেজার, ডিপার্টমেন্ট অনুযায়ী কর্মী তালিকা ও জিপিএস জিওফেন্স রেডিয়াম কনফিগার করুন"
              : "Inspect branch details, manager profiles, filter branch staff by department & calibrate GPS beacons"}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isBangla ? "+ নতুন ব্রাঞ্চ যোগ করুন" : "+ Add Regional Branch"}</span>
        </button>
      </div>

      {/* Main 2-Column Split: Branch List & Live Geofence Configurator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Branch Directory List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
            <span>{isBangla ? `নিবন্ধিত শাখা সমূহ (${branches.length})` : `Registered Branches (${branches.length})`}</span>
          </div>

          <div className="space-y-3">
            {branches.map((b) => {
              const isSelected = active.id === b.id;
              const totalBranchStaff = staffList.filter((e) => e.branchId === b.id || e.branchName === b.name).length;

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBranch(b)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                    isSelected
                      ? "bg-teal-500/10 border-teal-500/50 shadow-lg shadow-teal-500/10"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{b.name}</h4>
                        {b.isHeadOffice && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                            HQ
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{b.address}, {b.city}</p>
                    </div>

                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0"></span>
                  </div>

                  {/* Enhanced Manager Name Display */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                        {isBangla ? "ব্রাঞ্চ ম্যানেজার:" : "Branch Manager:"}
                      </span>
                      <span className="font-bold text-teal-700 dark:text-teal-300 text-xs block truncate max-w-[200px]">
                        {b.managerName || "HR Operations Lead"}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                        {isBangla ? "কর্মী সংখ্যা:" : "Staff Count:"}
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs font-mono">
                        {totalBranchStaff || b.totalEmployees || 0} {isBangla ? "জন" : "Staff"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      Radius: {b.geofenceRadiusMeters || 150}m
                    </span>
                    <span className="text-teal-600 dark:text-teal-400 font-bold text-[11px]">
                      {isSelected ? "● Selected Branch" : "Click to inspect ➔"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Geofence Calibration & Branch Staff Explorer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Branch Geofence Panel */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  {isBangla ? "শাখা পর্যবেক্ষণ ও জিওফেন্স পরিধি" : "Branch Calibration & Geofence"}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{active.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{active.address}, {active.city}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Active Geofence
                </span>
                {onDeleteBranch && !active.isHeadOffice && (
                  <button
                    onClick={() => {
                      if (confirm(isBangla ? "এই ব্রাঞ্চটি মুছে ফেলতে চান?" : "Delete this branch?")) {
                        onDeleteBranch(active.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                    title="Delete Branch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Radar / GPS Coordinates */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">{isBangla ? "অক্ষাংশ (Latitude):" : "Latitude:"}</span>
                <span className="font-bold text-slate-900 dark:text-white">{active.latitude?.toFixed(5)}° N</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">{isBangla ? "দ্রাঘিমাংশ (Longitude):" : "Longitude:"}</span>
                <span className="font-bold text-slate-900 dark:text-white">{active.longitude?.toFixed(5)}° E</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">{isBangla ? "অনুমোদিত ওয়াইফাই:" : "Authorized Wi-Fi:"}</span>
                <span className="font-bold text-teal-700 dark:text-teal-300">{active.wifiSSIDWhitelist?.[0] || "CORP_WIFI"}</span>
              </div>
            </div>

            {/* Radius Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>{isBangla ? "জিওফেন্স অনুমোদিত পরিধি (Geofence Perimeter):" : "Geofence Enforcement Radius:"}</span>
                </span>
                <span className="text-teal-600 dark:text-teal-400 font-mono text-sm">{active.geofenceRadiusMeters || 150} Meters</span>
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
                  <span>{isBangla ? `${active.name}-এর কর্মী তালিকা` : `${active.name} Staff Directory`}</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBangla
                    ? `মোট কর্মরত: ${branchEmployees.length} জন | ডিপার্টমেন্ট অনুযায়ী ফিল্টার করুন`
                    : `Currently ${branchEmployees.length} staff members assigned | Filter by department`}
                </p>
              </div>

              {/* Department Filter for this branch */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-teal-500 cursor-pointer"
                >
                  <option value="ALL">{isBangla ? "সকল ডিপার্টমেন্ট" : "All Departments"}</option>
                  {branchDepts.map((dName) => (
                    <option key={dName} value={dName}>
                      {dName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Staff Search Input */}
            <div className="relative text-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={staffSearchTerm}
                onChange={(e) => setStaffSearchTerm(e.target.value)}
                placeholder={isBangla ? "এই ব্রাঞ্চের কর্মী খুঁজুন..." : "Search staff by name or designation..."}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Staff Members List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {branchEmployees.length === 0 ? (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  {isBangla ? "এই ব্রাঞ্চ বা ডিপার্টমেন্টে কোনো কর্মী নেই" : "No employees found matching filter"}
                </div>
              ) : (
                branchEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 transition-all flex items-center justify-between gap-3 text-xs shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatarUrl}
                        alt={emp.fullName}
                        className="w-9 h-9 rounded-full object-cover border border-teal-500/40 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{emp.fullName}</span>
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">({emp.employeeCode})</span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{emp.designationTitle} • {emp.departmentName}</span>
                      </div>
                    </div>

                    {onViewEmployee && (
                      <button
                        type="button"
                        onClick={() => onViewEmployee(emp)}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 text-[11px] font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{isBangla ? "প্রোফাইল" : "Profile"}</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Regional Branch */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-lg text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>{isBangla ? "নতুন আঞ্চলিক শাখা নিবন্ধন করুন" : "Register Regional Branch Hub"}</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBranchSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "শাখার নাম *" : "Branch Name *"}</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Chittagong Port Hub"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "শাখা কোড *" : "Branch Code *"}</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. CTG-01"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono uppercase placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "শহর *" : "City / Region *"}</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="e.g. Chattogram / Sylhet"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "ব্রাঞ্চ ম্যানেজার" : "Branch Manager"}</label>
                  <select
                    value={newManagerId}
                    onChange={(e) => setNewManagerId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    {staffList.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName} ({e.designationTitle})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "বিস্তারিত ঠিকানা *" : "Physical Address *"}</label>
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
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "অক্ষাংশ (Lat)" : "Latitude"}</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLat}
                    onChange={(e) => setNewLat(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "দ্রাঘিমাংশ (Lng)" : "Longitude"}</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLng}
                    onChange={(e) => setNewLng(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "রেডিয়াস (মিটার)" : "Radius (M)"}</label>
                  <input
                    type="number"
                    value={newRadius}
                    onChange={(e) => setNewRadius(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "ওয়াইফাই SSID" : "Authorized Wi-Fi SSID"}</label>
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
    </div>
  );
};
