import React, { useState } from "react";
import {
  Layers,
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  CreditCard,
  Briefcase,
  ChevronRight,
  Sparkles,
  Eye,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  UserCheck,
  Search,
  X
} from "lucide-react";
import { Department, Designation, Employee } from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";

interface DepartmentsDesignationsViewProps {
  departments: Department[];
  designations: Designation[];
  employees?: Employee[];
  onAddDepartment: (dept: Department) => void;
  onAddDesignation: (desig: Designation) => void;
  onDeleteDepartment?: (id: string) => void;
  onDeleteDesignation?: (id: string) => void;
  onViewEmployee?: (emp: Employee) => void;
  onEditEmployee?: (emp: Employee) => void;
}

export const DepartmentsDesignationsView: React.FC<DepartmentsDesignationsViewProps> = ({
  departments,
  designations,
  employees = [],
  onAddDepartment,
  onAddDesignation,
  onDeleteDepartment,
  onDeleteDesignation,
  onViewEmployee,
  onEditEmployee,
}) => {
  const { t, isBangla } = useThemeLanguage();

  const [activeTab, setActiveTab] = useState<"DEPARTMENTS" | "DESIGNATIONS">("DEPARTMENTS");
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showDesigModal, setShowDesigModal] = useState(false);

  // Selected Department for viewing members modal
  const [selectedDeptForMembers, setSelectedDeptForMembers] = useState<Department | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");

  // New Department Form
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDeptDesc, setNewDeptDesc] = useState("");
  const [newDeptBudget, setNewDeptBudget] = useState(1500000);

  // New Designation Form
  const [newDesigTitle, setNewDesigTitle] = useState("");
  const [newDesigCode, setNewDesigCode] = useState("");
  const [newDesigDeptId, setNewDesigDeptId] = useState(departments[0]?.id || "");
  const [newDesigLevel, setNewDesigLevel] = useState<any>("SENIOR");
  const [newDesigMinSal, setNewDesigMinSal] = useState(70000);
  const [newDesigMaxSal, setNewDesigMaxSal] = useState(120000);
  const [newDesigDesc, setNewDesigDesc] = useState("");

  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddDepartment({
      id: `dept-${Date.now()}`,
      name: newDeptName,
      code: newDeptCode.toUpperCase(),
      description: newDeptDesc || "Enterprise operations & governance",
      totalEmployees: 0,
      budgetAllocated: newDeptBudget,
    });
    setShowDeptModal(false);
    setNewDeptName("");
    setNewDeptCode("");
    setNewDeptDesc("");
  };

  const handleDesigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dept = departments.find((d) => d.id === newDesigDeptId) || departments[0];
    onAddDesignation({
      id: `desig-${Date.now()}`,
      title: newDesigTitle,
      code: newDesigCode.toUpperCase(),
      departmentId: dept.id,
      departmentName: dept.name,
      level: newDesigLevel,
      minSalary: newDesigMinSal,
      maxSalary: newDesigMaxSal,
      description: newDesigDesc || "Key role responsibilities",
    });
    setShowDesigModal(false);
    setNewDesigTitle("");
    setNewDesigCode("");
  };

  // Get department members
  const deptMembers = selectedDeptForMembers
    ? employees.filter((e) => {
        const matchDept =
          e.departmentId === selectedDeptForMembers.id ||
          e.departmentName?.toLowerCase() === selectedDeptForMembers.name.toLowerCase() ||
          selectedDeptForMembers.name.toLowerCase().includes(e.departmentName?.toLowerCase() || "");
        
        const matchSearch =
          memberSearchTerm === "" ||
          e.fullName.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
          e.employeeCode.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
          e.designationTitle.toLowerCase().includes(memberSearchTerm.toLowerCase());

        return matchDept && matchSearch;
      })
    : [];

  return (
    <div id="departments-designations-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Tab Switcher */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>{isBangla ? "সাংগঠনিক কাঠামো" : "Organizational Hierarchy"}</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2">
            {isBangla ? "ডিপার্টমেন্ট, পদবি ও মেম্বার্স ম্যানেজমেন্ট" : "Department Roster & Job Architecture"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isBangla
              ? "ডিপার্টমেন্ট ভিত্তিক সকল কর্মকর্তা-কর্মচারীদের তালিকা দেখুন, প্রোফাইল পরীক্ষা করুন ও পদবি কনফিগার করুন"
              : "Inspect department member rosters, review staff profiles, salary bands and organizational designations"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab("DEPARTMENTS")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "DEPARTMENTS"
                  ? "bg-teal-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isBangla ? `ডিপার্টমেন্ট (${departments.length})` : `Departments (${departments.length})`}
            </button>
            <button
              onClick={() => setActiveTab("DESIGNATIONS")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "DESIGNATIONS"
                  ? "bg-teal-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isBangla ? `পদবি তালিকা (${designations.length})` : `Designations (${designations.length})`}
            </button>
          </div>

          <button
            onClick={() => (activeTab === "DEPARTMENTS" ? setShowDeptModal(true) : setShowDesigModal(true))}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeTab === "DEPARTMENTS"
                ? isBangla ? "+ নতুন ডিপার্টমেন্ট" : "+ Add Department"
                : isBangla ? "+ নতুন পদবি" : "+ Add Designation"}
            </span>
          </button>
        </div>
      </div>

      {/* Departments Tab Content */}
      {activeTab === "DEPARTMENTS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => {
            const actualStaffCount = employees.filter(
              (e) =>
                e.departmentId === dept.id ||
                e.departmentName?.toLowerCase() === dept.name.toLowerCase() ||
                dept.name.toLowerCase().includes(e.departmentName?.toLowerCase() || "")
            ).length;

            return (
              <div
                key={dept.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition-all space-y-4 shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                        {dept.code}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1.5">{dept.name}</h3>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-800 text-teal-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{dept.description}</p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                    <div className="p-2 rounded-xl bg-slate-800/60">
                      <span className="text-[10px] text-slate-400 block">{isBangla ? "মোট সদস্য" : "Total Staff"}</span>
                      <span className="font-bold text-white text-sm flex items-center gap-1 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-teal-400" />
                        <span>{actualStaffCount || dept.totalEmployees || 0} {isBangla ? "জন" : "Members"}</span>
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-800/60">
                      <span className="text-[10px] text-slate-400 block">{isBangla ? "বাজেট বরাদ্দ" : "Budget"}</span>
                      <span className="font-bold text-emerald-400 text-xs font-mono mt-0.5 block">
                        ৳{((dept.budgetAllocated ?? 1500000) / 100000).toFixed(1)}L BDT
                      </span>
                    </div>
                  </div>
                </div>

                {/* View Members Button */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDeptForMembers(dept);
                      setMemberSearchTerm("");
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{isBangla ? "সদস্যদের তালিকা দেখুন ➔" : "View Department Members ➔"}</span>
                  </button>

                  {onDeleteDepartment && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(isBangla ? "এই ডিপার্টমেন্ট মুছে ফেলতে চান?" : "Delete this department?")) {
                          onDeleteDepartment(dept.id);
                        }
                      }}
                      className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                      title="Delete Department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Designations Tab Content */}
      {activeTab === "DESIGNATIONS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {designations.map((desig) => (
            <div
              key={desig.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition-all space-y-3 shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {desig.code}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5">{desig.title}</h3>
                  <span className="text-xs text-teal-400 font-semibold">{desig.departmentName}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {desig.level}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1 text-xs">
                <span className="text-[10px] text-slate-400 block">{isBangla ? "বেতন কাঠামো রেঞ্জ (Salary Band):" : "Salary Band Range:"}</span>
                <div className="flex justify-between font-mono font-bold text-white">
                  <span>৳{(desig.minSalary ?? 0).toLocaleString()}</span>
                  <span className="text-slate-500">to</span>
                  <span className="text-emerald-400">৳{(desig.maxSalary ?? 0).toLocaleString()} BDT</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2">{desig.description}</p>

              {onDeleteDesignation && (
                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => {
                      if (confirm(isBangla ? "এই পদবি মুছে ফেলতে চান?" : "Delete designation?")) {
                        onDeleteDesignation(desig.id);
                      }
                    }}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isBangla ? "মুছে ফেলুন" : "Delete"}</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: View Department Members Roster */}
      {selectedDeptForMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-3xl text-slate-100 shadow-2xl space-y-4 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300">
                    {selectedDeptForMembers.code}
                  </span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-teal-400" />
                    <span>{selectedDeptForMembers.name} - {isBangla ? "সদস্য তালিকা" : "Staff Roster"}</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isBangla
                    ? `এই ডিপার্টমেন্টের অধীনে মোট ${deptMembers.length} জন কর্মচারী কর্মরত আছেন`
                    : `Currently ${deptMembers.length} employees registered under this department`}
                </p>
              </div>

              <button
                onClick={() => setSelectedDeptForMembers(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member Search Bar */}
            <div className="relative text-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                placeholder={isBangla ? "নাম, আইডি বা পদবি দিয়ে খুঁজুন..." : "Search employee by name, ID or designation..."}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[55vh]">
              {deptMembers.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  {isBangla ? "এই ডিপার্টমেন্টে কোনো কর্মী পাওয়া যায়নি" : "No employees found in this department"}
                </div>
              ) : (
                deptMembers.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-teal-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-teal-500/40 bg-slate-900 shrink-0">
                        <img
                          src={emp.avatarUrl}
                          alt={emp.fullName}
                          className="w-full h-full object-cover aspect-square"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{emp.fullName}</h4>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-900 text-teal-300 font-bold">
                            {emp.employeeCode}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            {emp.status}
                          </span>
                        </div>

                        <p className="text-xs text-teal-400 font-semibold">{emp.designationTitle}</p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            {emp.branchName}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {emp.phone}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            {emp.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-700">
                      {onViewEmployee && (
                        <button
                          type="button"
                          onClick={() => {
                            onViewEmployee(emp);
                            setSelectedDeptForMembers(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-teal-400" />
                          <span>{isBangla ? "প্রোফাইল" : "View Profile"}</span>
                        </button>
                      )}

                      {onEditEmployee && (
                        <button
                          type="button"
                          onClick={() => {
                            onEditEmployee(emp);
                            setSelectedDeptForMembers(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>{isBangla ? "এডিট" : "Edit"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDeptForMembers(null)}
                className="px-5 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs"
              >
                {isBangla ? "বন্ধ করুন" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Department */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-400" /> {isBangla ? "নতুন ডিপার্টমেন্ট তৈরি করুন" : "Add Department"}
              </h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeptSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">{isBangla ? "ডিপার্টমেন্টের নাম *" : "Department Name *"}</label>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence & Data Science"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{isBangla ? "ডিপার্টমেন্ট কোড *" : "Department Code *"}</label>
                <input
                  type="text"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  placeholder="e.g. AI-DATA"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white uppercase font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{isBangla ? "বার্ষিক বাজেট বরাদ্দ (BDT ৳)" : "Allocated Budget (BDT ৳)"}</label>
                <input
                  type="number"
                  value={newDeptBudget}
                  onChange={(e) => setNewDeptBudget(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{isBangla ? "বিবরণ ও দায়িত্ব" : "Description & Scope"}</label>
                <textarea
                  rows={2}
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  placeholder="Department operational charter..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-bold"
                >
                  {isBangla ? "সংরক্ষণ করুন" : "Save Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Designation */}
      {showDesigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-400" /> {isBangla ? "নতুন পদবি ও পে-স্কেল তৈরি" : "Add Designation"}
              </h3>
              <button onClick={() => setShowDesigModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDesigSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">{isBangla ? "পদবির নাম *" : "Designation Title *"}</label>
                <input
                  type="text"
                  value={newDesigTitle}
                  onChange={(e) => setNewDesigTitle(e.target.value)}
                  placeholder="e.g. Lead Machine Learning Engineer"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">{isBangla ? "পদবি কোড" : "Role Code"}</label>
                  <input
                    type="text"
                    value={newDesigCode}
                    onChange={(e) => setNewDesigCode(e.target.value)}
                    placeholder="e.g. LMLE-01"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white uppercase font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{isBangla ? "হায়ারার্কি লেভেল" : "Seniority Level"}</label>
                  <select
                    value={newDesigLevel}
                    onChange={(e) => setNewDesigLevel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="ENTRY">Entry Level</option>
                    <option value="MID">Mid Level</option>
                    <option value="SENIOR">Senior Level</option>
                    <option value="LEAD">Lead / Specialist</option>
                    <option value="EXECUTIVE">Executive / C-Level</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{isBangla ? "ডিপার্টমেন্ট" : "Department"}</label>
                <select
                  value={newDesigDeptId}
                  onChange={(e) => setNewDesigDeptId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">{isBangla ? "সর্বনিম্ন বেতন (৳)" : "Min Salary (৳)"}</label>
                  <input
                    type="number"
                    value={newDesigMinSal}
                    onChange={(e) => setNewDesigMinSal(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{isBangla ? "সর্বোচ্চ বেতন (৳)" : "Max Salary (৳)"}</label>
                  <input
                    type="number"
                    value={newDesigMaxSal}
                    onChange={(e) => setNewDesigMaxSal(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDesigModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-bold"
                >
                  {isBangla ? "পদবি যুক্ত করুন" : "Save Designation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
