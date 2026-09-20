import React, { useState, useMemo } from "react";
import {
  Laptop,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  Smartphone,
  Download,
  Trash2,
  Undo2,
  RefreshCw,
  Edit2,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Flame,
  X
} from "lucide-react";
import { CompanyAsset, Employee, Branch } from "../../types";
import { exportToCSV } from "../../utils/exportUtils";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";

interface AssetsViewProps {
  assets: CompanyAsset[];
  employees: Employee[];
  branches: Branch[];
  currentUser?: Employee;
  onAddAsset: (asset: CompanyAsset) => void;
  onAssignAsset: (assetId: string, empId: string) => void;
  onWithdrawAsset?: (assetId: string, conditionOnReturn: string, note: string) => void;
  onUpdateAssetCondition?: (assetId: string, condition: CompanyAsset["condition"]) => void;
  onDeleteAsset?: (assetId: string) => void;
}

export const AssetsView: React.FC<AssetsViewProps> = ({
  assets,
  employees,
  branches,
  currentUser,
  onAddAsset,
  onAssignAsset,
  onWithdrawAsset,
  onUpdateAssetCondition,
  onDeleteAsset,
}) => {
  const { t, isBangla } = useThemeLanguage();

  // Role Scoping for Assets: General employees only see their assigned company assets
  const isSuperAdminOrCeo = Boolean(
    currentUser?.isSuperAdmin ||
    currentUser?.isCeoOrOwner ||
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.role === "CEO" ||
    currentUser?.role === "HR_MANAGER"
  );
  const isBranchManager = currentUser?.role === "BRANCH_MANAGER";
  const isGeneralEmp = !isSuperAdminOrCeo && !isBranchManager;

  const scopedAssets = useMemo(() => {
    if (!currentUser) return assets;
    if (isSuperAdminOrCeo) return assets;
    if (isBranchManager) {
      return assets.filter(
        (a) =>
          a.assignedBranchId === currentUser.branchId ||
          employees.find((e) => e.id === a.assignedToEmployeeId)?.branchId === currentUser.branchId
      );
    }
    // General Employee: strictly see assets assigned to self
    return assets.filter((a) => a.assignedToEmployeeId === currentUser.id);
  }, [assets, currentUser, isSuperAdminOrCeo, isBranchManager, employees]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedCondition, setSelectedCondition] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState<CompanyAsset | null>(null);
  const [showReassignModal, setShowReassignModal] = useState<CompanyAsset | null>(null);

  // New Asset Form State
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<CompanyAsset["category"]>("HARDWARE");
  const [newSerial, setNewSerial] = useState("");
  const [newCost, setNewCost] = useState(150000);
  const [newCondition, setNewCondition] = useState<CompanyAsset["condition"]>("BRAND_NEW");
  const [newAssigneeId, setNewAssigneeId] = useState("");

  // Withdraw Asset Form State
  const [withdrawCondition, setWithdrawCondition] = useState<CompanyAsset["condition"]>("GOOD");
  const [withdrawNote, setWithdrawNote] = useState("");

  // Reassign Form State
  const [reassignEmpId, setReassignEmpId] = useState("");

  const filteredAssets = useMemo(() => {
    return scopedAssets.filter((ast) => {
      const matchesSearch =
        searchTerm === "" ||
        ast.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ast.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ast.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ast.assignedToEmployeeName &&
          ast.assignedToEmployeeName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = selectedCategory === "ALL" || ast.category === selectedCategory;
      const matchesCond = selectedCondition === "ALL" || ast.condition === selectedCondition;
      const matchesStat = selectedStatus === "ALL" || ast.status === selectedStatus;

      return matchesSearch && matchesCat && matchesCond && matchesStat;
    });
  }, [scopedAssets, searchTerm, selectedCategory, selectedCondition, selectedStatus]);

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const assignee = employees.find((e) => e.id === newAssigneeId);

    const asset: CompanyAsset = {
      id: `asset-${Date.now()}`,
      assetCode: `AST-${Math.floor(Math.random() * 9000 + 1000)}`,
      name: newName,
      category: newCategory,
      serialNumber: newSerial || `SN-${Date.now().toString().slice(-6)}`,
      purchaseDate: new Date().toISOString().split("T")[0],
      purchaseCost: Number(newCost),
      assignedToEmployeeId: assignee?.id,
      assignedToEmployeeName: assignee?.fullName,
      assignedBranchId: assignee?.branchId || branches[0]?.id,
      assignmentDate: assignee ? new Date().toISOString().split("T")[0] : undefined,
      condition: newCondition,
      status: assignee ? "ASSIGNED" : "AVAILABLE",
    };

    onAddAsset(asset);
    setShowAddModal(false);
    setNewName("");
    setNewSerial("");
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showWithdrawModal) return;

    if (onWithdrawAsset) {
      onWithdrawAsset(showWithdrawModal.id, withdrawCondition, withdrawNote);
    } else {
      // Fallback
      onAssignAsset(showWithdrawModal.id, "");
      if (onUpdateAssetCondition) {
        onUpdateAssetCondition(showWithdrawModal.id, withdrawCondition);
      }
    }

    setShowWithdrawModal(null);
    setWithdrawNote("");
  };

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReassignModal) return;
    onAssignAsset(showReassignModal.id, reassignEmpId);
    setShowReassignModal(null);
    setReassignEmpId("");
  };

  const handleExportCSV = () => {
    const data = filteredAssets.map((a) => ({
      "Asset Code": a.assetCode,
      "Asset Name": a.name,
      Category: a.category,
      "Serial Number": a.serialNumber,
      "Assigned To": a.assignedToEmployeeName || "Unassigned",
      "Cost (BDT)": a.purchaseCost,
      Condition: a.condition,
      Status: a.status,
    }));
    exportToCSV("Workflow_HR_Company_Assets", data);
  };

  const getConditionBadge = (cond: CompanyAsset["condition"]) => {
    switch (cond) {
      case "BRAND_NEW":
      case "NEW":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">✨ Brand New</span>;
      case "GOOD":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">👍 Good (ভালো)</span>;
      case "FAIR":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">👌 Fair (চলনসই)</span>;
      case "BAD":
      case "NEEDS_REPAIR":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">⚠️ Bad / Repair (খারাপ)</span>;
      case "SEVERE":
      case "DAMAGED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">🚨 Severe / Damaged (গুরুতর নষ্ট)</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">{cond}</span>;
    }
  };

  return (
    <div id="assets-management-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5" />
                <span>{isBangla ? "অ্যাসেট ও হার্ডওয়্যার ইনভেন্টরি" : "Asset Management"}</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
              {isBangla ? "কোম্পানির ডিভাইস ও অ্যাসেট ট্র্যাকিং" : "Hardware, Devices & Asset Allocations"}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {isBangla
                ? "কর্মীদের ডিভাইস বরাদ্দ, কন্ডিশন (Good/Bad/Severe) আপডেট, ফেরত/উইথড্র ও ইনভেন্টরি সার্চ করুন"
                : "Search inventory, assign devices to staff, update conditions (Good/Bad/Severe), process returns and track custody"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isBangla ? "ইনভেন্টরি এক্সপোর্ট" : "Export CSV"}</span>
            </button>

            {!isGeneralEmp && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isBangla ? "+ নতুন অ্যাসেট যোগ" : "+ Register Asset"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isBangla ? "অ্যাসেটের নাম, কোড, সিরিয়াল বা কর্মী..." : "Search name, code, serial, custodian..."}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="ALL">{isBangla ? "সকল ক্যাটাগরি" : "All Categories"}</option>
              <option value="HARDWARE">Laptops & Desktops</option>
              <option value="MOBILE">Mobile Phones & Tablets</option>
              <option value="ACCESSORY">Monitors & Accessories</option>
              <option value="VEHICLE">Company Vehicles</option>
              <option value="FURNITURE">Office Furniture</option>
            </select>
          </div>

          {/* Condition Filter (Good, Bad, Severe, Brand New) */}
          <div>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="ALL">{isBangla ? "সকল কন্ডিশন (All Conditions)" : "All Conditions"}</option>
              <option value="BRAND_NEW">{isBangla ? "✨ Brand New (নতুন)" : "Brand New"}</option>
              <option value="GOOD">{isBangla ? "👍 Good (ভালো)" : "Good"}</option>
              <option value="FAIR">{isBangla ? "👌 Fair (চলনসই)" : "Fair"}</option>
              <option value="BAD">{isBangla ? "⚠️ Bad (খারাপ / মেরামতযোগ্য)" : "Bad / Needs Repair"}</option>
              <option value="SEVERE">{isBangla ? "🚨 Severe (গুরুতর নষ্ট / অচল)" : "Severe / Damaged"}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="ALL">{isBangla ? "সকল স্ট্যাটাস (All Status)" : "All Status"}</option>
              <option value="ASSIGNED">{isBangla ? "বরাদ্দকৃত (Assigned to Staff)" : "Assigned"}</option>
              <option value="AVAILABLE">{isBangla ? "মজুত আছে (Available in Pool)" : "Available in Pool"}</option>
              <option value="IN_REPAIR">{isBangla ? "মেরামতে আছে (In Repair)" : "In Repair"}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <Laptop className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              {isBangla ? "কোনো অ্যাসেট পাওয়া যায়নি" : "No matching assets found in inventory"}
            </p>
          </div>
        ) : (
          filteredAssets.map((ast) => (
            <div
              key={ast.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 hover:border-teal-500/40 transition-all shadow-xs dark:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-mono">
                      {ast.assetCode}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{ast.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{ast.category}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ast.status === "ASSIGNED"
                          ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                          : ast.status === "AVAILABLE"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {ast.status}
                    </span>
                    {getConditionBadge(ast.condition)}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{isBangla ? "সিরিয়াল নম্বর:" : "Serial Number:"}</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{ast.serialNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{isBangla ? "ক্রয়মূল্য:" : "Asset Value:"}</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
                      ৳{(ast.purchaseCost ?? 0).toLocaleString()} BDT
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">{isBangla ? "কন্ডিশন:" : "Condition:"}</span>
                    {!isGeneralEmp ? (
                      <select
                        value={ast.condition}
                        onChange={(e) => {
                          if (onUpdateAssetCondition) {
                            onUpdateAssetCondition(ast.id, e.target.value as any);
                          }
                        }}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[10px] rounded px-1.5 py-0.5 cursor-pointer"
                      >
                        <option value="BRAND_NEW">Brand New</option>
                        <option value="GOOD">Good (ভালো)</option>
                        <option value="FAIR">Fair (চলনসই)</option>
                        <option value="BAD">Bad (খারাপ)</option>
                        <option value="SEVERE">Severe (নষ্ট)</option>
                      </select>
                    ) : (
                      getConditionBadge(ast.condition)
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-transparent flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{isBangla ? "বরাদ্দকৃত কর্মী" : "Assigned Custodian"}</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {ast.assignedToEmployeeName || (isBangla ? "ইনভেন্টরি পুলে মজুদ" : "Inventory Pool")}
                    </span>
                  </div>
                  {ast.assignedToEmployeeName ? (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                      {isBangla ? "ব্যবহাররত" : "In Use"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-900 px-2 py-1 rounded">
                      {isBangla ? "ফ্রি / মজুদ" : "Available"}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Withdraw / Reassign / Delete (Admin / Manager only) */}
              {!isGeneralEmp && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  {ast.assignedToEmployeeId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowWithdrawModal(ast);
                        setWithdrawCondition(ast.condition);
                      }}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>{isBangla ? "উইথড্র / ফেরত নিন" : "Withdraw / Return"}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowReassignModal(ast)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{isBangla ? "কর্মী বরাদ্দ দিন" : "Assign Custodian"}</span>
                    </button>
                  )}

                  {onDeleteAsset && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(isBangla ? "আপনি কি এই অ্যাসেটটি মুছে ফেলতে চান?" : "Are you sure you want to delete this asset?")) {
                          onDeleteAsset(ast.id);
                        }
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal: Add New Asset */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Laptop className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>{isBangla ? "নতুন কোম্পানি অ্যাসেট নিবন্ধন" : "Register Company Asset"}</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "অ্যাসেট নাম ও মডেল *" : "Asset Name & Model *"}</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Apple MacBook Pro 16 M3 Max 36GB"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "ক্যাটাগরি" : "Category"}</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="HARDWARE">Laptop / PC</option>
                    <option value="MOBILE">Mobile Phone</option>
                    <option value="ACCESSORY">Monitor / Peripheral</option>
                    <option value="VEHICLE">Company Vehicle</option>
                    <option value="FURNITURE">Office Furniture</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "সিরিয়াল নম্বর" : "Serial Number"}</label>
                  <input
                    type="text"
                    value={newSerial}
                    onChange={(e) => setNewSerial(e.target.value)}
                    placeholder="e.g. C02G9988H"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "ক্রয়মূল্য (৳)" : "Purchase Cost (৳)"}</label>
                  <input
                    type="number"
                    value={newCost}
                    onChange={(e) => setNewCost(Number(e.target.value))}
                    step={5000}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "বর্তমান কন্ডিশন" : "Initial Condition"}</label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="BRAND_NEW">✨ Brand New (নতুন)</option>
                    <option value="GOOD">👍 Good (ভালো)</option>
                    <option value="FAIR">👌 Fair (চলনসই)</option>
                    <option value="BAD">⚠️ Bad (খারাপ)</option>
                    <option value="SEVERE">🚨 Severe (নষ্ট)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "বরাদ্দ দিন (ঐচ্ছিক)" : "Assign Custodian (Optional)"}</label>
                <select
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="">{isBangla ? "ইনভেন্টরি পুলে মজুদ রাখুন" : "Keep in Inventory Pool"}</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.employeeCode})
                    </option>
                  ))}
                </select>
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
                  {isBangla ? "সংরক্ষণ করুন" : "Save Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Withdraw / Return Asset */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Undo2 className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <span>{isBangla ? "অ্যাসেট উইথড্র / ফেরত গ্রহণ" : "Withdraw / Return Asset to Pool"}</span>
              </h3>
              <button onClick={() => setShowWithdrawModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">{showWithdrawModal.name} ({showWithdrawModal.assetCode})</div>
              <div className="text-slate-600 dark:text-slate-400">
                {isBangla ? "বর্তমান ব্যবহারকারী:" : "Current Custodian:"}{" "}
                <span className="text-teal-700 dark:text-teal-300 font-bold">{showWithdrawModal.assignedToEmployeeName}</span>
              </div>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">
                  {isBangla ? "ফেরতকালীন কন্ডিশন উল্লেখ করুন *" : "Specify Return Condition *"}
                </label>
                <select
                  value={withdrawCondition}
                  onChange={(e) => setWithdrawCondition(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="GOOD">👍 Good (ভালো কন্ডিশনে ফেরত)</option>
                  <option value="FAIR">👌 Fair (স্বাভাবিক ব্যবহারজনিত দাগ/চলনসই)</option>
                  <option value="BAD">⚠️ Bad (মেরামত প্রয়োজন)</option>
                  <option value="SEVERE">🚨 Severe (গুরুতর ক্ষতিগ্রস্থ / ড্যামেজ)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{isBangla ? "মন্তব্য / নোট" : "Return Clearance Notes"}</label>
                <textarea
                  rows={2}
                  value={withdrawNote}
                  onChange={(e) => setWithdrawNote(e.target.value)}
                  placeholder={isBangla ? "ডিভাইসের বর্তমান অবস্থা ও কোনো সমস্যা থাকলে লিখুন..." : "Inspection remarks..."}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow cursor-pointer"
                >
                  {isBangla ? "উইথড্র সম্পন্ন করুন" : "Confirm Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reassign Custodian */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>{isBangla ? "অ্যাসেট কর্মী বরাদ্দ করুন" : "Assign Asset Custodian"}</span>
              </h3>
              <button onClick={() => setShowReassignModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">{showReassignModal.name} ({showReassignModal.assetCode})</div>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">
                  {isBangla ? "কর্মকর্তা / কর্মচারী নির্বাচন করুন *" : "Select Staff Member *"}
                </label>
                <select
                  value={reassignEmpId}
                  onChange={(e) => setReassignEmpId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  required
                >
                  <option value="">{isBangla ? "কর্মী নির্বাচন করুন..." : "Choose employee..."}</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.designationTitle} - {e.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  {isBangla ? "বরাদ্দ নিশ্চিত করুন" : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
