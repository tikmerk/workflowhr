import React, { useState } from "react";
import {
  Landmark,
  Building2,
  DollarSign,
  PieChart,
  Plus,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Banknote,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Department, TreasuryAccount } from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";

interface BudgetAllocationSectionProps {
  departments: Department[];
  treasuryAccounts: TreasuryAccount[];
  onUpdateDepartment?: (dept: Department) => void;
  onUpdateTreasuryAccounts?: (accounts: TreasuryAccount[]) => void;
}

export const BudgetAllocationSection: React.FC<BudgetAllocationSectionProps> = ({
  departments,
  treasuryAccounts,
  onUpdateDepartment,
  onUpdateTreasuryAccounts,
}) => {
  const { isBangla } = useThemeLanguage();

  // Allocation Modal State
  const [allocatingDept, setAllocatingDept] = useState<Department | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [allocAmount, setAllocAmount] = useState<number>(1500000);
  const [allocAuthorizedBy, setAllocAuthorizedBy] = useState<string>("Super Admin (Finance Directorate)");

  // Add Treasury Account Modal State
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const [newAccNumber, setNewAccNumber] = useState("");
  const [newBankName, setNewBankName] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [newAccType, setNewAccType] = useState<TreasuryAccount["accountType"]>("CENTRAL_OPERATING");
  const [newTotalFund, setNewTotalFund] = useState(10000000);
  const [newAccDesc, setNewAccDesc] = useState("");

  // Calculate Aggregates
  const totalTreasuryFunds = treasuryAccounts.reduce((acc, a) => acc + (a.totalFund || 0), 0);
  const totalAllocatedBudget = departments.reduce((acc, d) => acc + (d.budgetAllocated || 0), 0);
  const totalLiquidityReserve = Math.max(0, totalTreasuryFunds - totalAllocatedBudget);
  const utilizationPercentage = totalTreasuryFunds > 0 ? Math.min(100, Math.round((totalAllocatedBudget / totalTreasuryFunds) * 100)) : 0;

  // Open Allocation Modal for a Department
  const handleOpenAllocateModal = (dept: Department) => {
    setAllocatingDept(dept);
    setSelectedAccountId(dept.fundingSourceId || treasuryAccounts[0]?.id || "");
    setAllocAmount(dept.budgetAllocated || 1500000);
    setAllocAuthorizedBy(dept.allocatedBy || "Super Admin (Finance Directorate)");
  };

  // Submit Budget Allocation
  const handleAllocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatingDept || !onUpdateDepartment) return;

    const sourceAccount = treasuryAccounts.find((a) => a.id === selectedAccountId) || treasuryAccounts[0];

    const updatedDept: Department = {
      ...allocatingDept,
      budgetAllocated: Number(allocAmount),
      fundingSourceId: sourceAccount?.id,
      fundingSourceName: sourceAccount ? `${sourceAccount.bankName} (${sourceAccount.accountName})` : undefined,
      lastAllocatedAt: new Date().toISOString().split("T")[0],
      allocatedBy: allocAuthorizedBy,
    };

    onUpdateDepartment(updatedDept);

    // Update treasury account allocation tracking
    if (onUpdateTreasuryAccounts) {
      const updatedAccounts = treasuryAccounts.map((acc) => {
        // Calculate new allocated funds based on departments assigned to this account
        const accountDepts = departments.map((d) => (d.id === updatedDept.id ? updatedDept : d));
        const totalForThisAccount = accountDepts
          .filter((d) => (d.fundingSourceId || treasuryAccounts[0]?.id) === acc.id)
          .reduce((sum, d) => sum + (d.budgetAllocated || 0), 0);

        return {
          ...acc,
          allocatedFund: totalForThisAccount,
        };
      });
      onUpdateTreasuryAccounts(updatedAccounts);
    }

    setAllocatingDept(null);
  };

  // Submit New Treasury Account
  const handleAddAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateTreasuryAccounts) return;

    const newAccount: TreasuryAccount = {
      id: `acc-${Date.now()}`,
      accountName: newAccName,
      accountNumber: newAccNumber,
      bankName: newBankName,
      branchName: newBranchName,
      accountType: newAccType,
      totalFund: Number(newTotalFund),
      allocatedFund: 0,
      currency: "BDT",
      description: newAccDesc || "Corporate treasury fund",
    };

    onUpdateTreasuryAccounts([...treasuryAccounts, newAccount]);
    setShowAddAccountModal(false);
    setNewAccName("");
    setNewAccNumber("");
    setNewBankName("");
    setNewBranchName("");
    setNewAccDesc("");
  };

  const getAccountTypeBadge = (type: TreasuryAccount["accountType"]) => {
    switch (type) {
      case "CENTRAL_OPERATING":
        return {
          label: isBangla ? "কেন্দ্রীয় পরিচালন তহবিল" : "Central Operating",
          color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
        };
      case "REVENUE_TREASURY":
        return {
          label: isBangla ? "রাজস্ব ও রিটেইন্ড আর্নিংস" : "Revenue Treasury",
          color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
        };
      case "DONOR_GRANT":
        return {
          label: isBangla ? "প্রকল্প অনুদান ও সিএসআর" : "Donor & Grants",
          color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
        };
      case "RESERVE_FUND":
      default:
        return {
          label: isBangla ? "জরুরি ও লিকুইডিটি রিজার্ভ" : "Contingency Reserve",
          color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
        };
    }
  };

  const selectedAccountForModal = treasuryAccounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="space-y-6">
      {/* Top Treasury Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isBangla ? "মোট কর্পোরেট ট্রেজারি ফান্ড" : "Total Treasury Funds"}
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              ৳{(totalTreasuryFunds / 10000000).toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {isBangla ? "কোটি টাকা" : "Cr BDT"}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            {isBangla ? `${treasuryAccounts.length} টি সচল ব্যাংক অ্যাকাউন্ট` : `${treasuryAccounts.length} active treasury accounts`}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isBangla ? "বিভাগীয় মোট বাজেট বরাদ্দ" : "Allocated Dept Budgets"}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              ৳{(totalAllocatedBudget / 10000000).toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {isBangla ? "কোটি টাকা" : "Cr BDT"}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            {isBangla ? `${departments.length} টি বিভাগে কার্যকর বরাদ্দ` : `Allocated across ${departments.length} depts`}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isBangla ? "অবরাদ্দকৃত জরুরি লিকুইডিটি" : "Unallocated Reserves"}
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
              ৳{(totalLiquidityReserve / 10000000).toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {isBangla ? "কোটি টাকা" : "Cr BDT"}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            {isBangla ? "জরুরি ব্যাকআপ ও বিনিয়োগের জন্য সংরক্ষিত" : "Available liquid buffer"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isBangla ? "তহবিল বরাদ্দ হার" : "Treasury Utilization"}
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
              {utilizationPercentage}%
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {isBangla ? "বরাদ্দকৃত" : "Committed"}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-purple-600 h-full rounded-full transition-all"
              style={{ width: `${utilizationPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Section 1: Treasury Bank Accounts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Landmark className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isBangla ? "কোম্পানি ট্রেজারি ও তহবিল ব্যাংক অ্যাকাউন্টসমূহ" : "Corporate Treasury & Funding Accounts"}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isBangla
                ? "যেসব ব্যাংক অ্যাকাউন্ট বা রিজার্ভ ফান্ড থেকে ডিপার্টমেন্টগুলোর মাসিক ও বার্ষিক বাজেট অনুমোদিত ও ছাড় করা হয়"
                : "Bank accounts and reserve funds from which department budgets are authorized and disbursed"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddAccountModal(true)}
            className="px-3.5 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isBangla ? "+ নতুন ট্রেজারি অ্যাকাউন্ট" : "+ Add Treasury Account"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {treasuryAccounts.map((account) => {
            const badge = getAccountTypeBadge(account.accountType);
            const allocated = account.allocatedFund || 0;
            const available = Math.max(0, account.totalFund - allocated);
            const pct = account.totalFund > 0 ? Math.round((allocated / account.totalFund) * 100) : 0;

            return (
              <div
                key={account.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-500/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{account.currency}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2 leading-snug">
                    {account.accountName}
                  </h4>
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
                    {account.bankName}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    A/C: {account.accountNumber}
                  </p>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-1">
                    {account.branchName}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">{isBangla ? "মোট ফান্ড:" : "Total Fund:"}</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      ৳{(account.totalFund / 100000).toFixed(1)}L
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">{isBangla ? "বরাদ্দকৃত:" : "Allocated:"}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      ৳{(allocated / 100000).toFixed(1)}L ({pct}%)
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">{isBangla ? "অবশিষ্ট উদ্বৃত্ত:" : "Available:"}</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                      ৳{(available / 100000).toFixed(1)}L
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Department Budget Allocation Matrix */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isBangla ? "ডিপার্টমেন্ট বাজেট এলোকেশন ও ফান্ডিং সোর্স ম্যাট্রিক্স" : "Department Budget & Funding Matrix"}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isBangla
                ? "কোন ডিপার্টমেন্টের বাজেট কোন ব্যাংক অ্যাকাউন্ট বা ট্রেজারি ফান্ড থেকে বরাদ্দ হয়েছে তা দেখুন এবং নতুন বাজেট বরাদ্দ দিন"
                : "Inspect which bank or treasury account funds each department and reallocate budgets dynamically"}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
              <tr>
                <th className="p-3.5">{isBangla ? "ডিপার্টমেন্ট" : "Department"}</th>
                <th className="p-3.5">{isBangla ? "কোড" : "Code"}</th>
                <th className="p-3.5">{isBangla ? "কর্মী সংখ্যা" : "Staff"}</th>
                <th className="p-3.5">{isBangla ? "বরাদ্দকৃত বাজেট (BDT ৳)" : "Budget (BDT ৳)"}</th>
                <th className="p-3.5">{isBangla ? "তহবিল উৎস (Funding Account)" : "Funding Account Source"}</th>
                <th className="p-3.5">{isBangla ? "বরাদ্দকারী কর্তৃপক্ষ" : "Authorized By"}</th>
                <th className="p-3.5">{isBangla ? "সর্বশেষ বরাদ্দ তারিখ" : "Allocated Date"}</th>
                <th className="p-3.5 text-right">{isBangla ? "অ্যাকশন" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {departments.map((dept) => {
                const fundingAcc = treasuryAccounts.find((a) => a.id === dept.fundingSourceId) || treasuryAccounts[0];
                const budgetAmount = dept.budgetAllocated || 1500000;

                return (
                  <tr key={dept.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{dept.name}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{dept.description}</div>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20">
                        {dept.code}
                      </span>
                    </td>

                    <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                      {dept.totalEmployees || 0} {isBangla ? "জন" : "staff"}
                    </td>

                    <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                      ৳{budgetAmount.toLocaleString()}
                      <span className="text-[10px] text-slate-400 font-normal block">
                        ({(budgetAmount / 100000).toFixed(1)} Lakh BDT)
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {fundingAcc ? fundingAcc.accountName : (dept.fundingSourceName || "Central Operating Treasury")}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {fundingAcc ? `${fundingAcc.bankName} • ${fundingAcc.accountNumber}` : "Dutch-Bangla Bank PLC"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      <div className="font-medium text-[11px]">
                        {dept.allocatedBy || "Super Admin (Finance Directorate)"}
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {dept.lastAllocatedAt || "2026-07-01"}
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenAllocateModal(dept)}
                        className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1"
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>{isBangla ? "বাজেট পরিবর্তন" : "Allocate"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Allocate / Reallocate Budget to Department */}
      {allocatingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isBangla ? "ডিপার্টমেন্ট বাজেট ও তহবিল বরাদ্দ" : "Department Budget Allocation"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAllocatingDept(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs">
              <span className="text-slate-500 dark:text-slate-400 block font-medium">নির্বাচিত ডিপার্টমেন্ট:</span>
              <span className="font-bold text-sm text-teal-700 dark:text-teal-300">
                {allocatingDept.name} ({allocatingDept.code})
              </span>
              <span className="block text-[11px] text-slate-500 mt-0.5">
                বর্তমানে কর্মরত কর্মী: {allocatingDept.totalEmployees || 0} জন
              </span>
            </div>

            <form onSubmit={handleAllocationSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  {isBangla ? "তহবিল উৎস ব্যাংক অ্যাকাউন্ট নির্বাচন করুন *" : "Funding Treasury Account *"}
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:border-teal-500"
                  required
                >
                  {treasuryAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} - {acc.accountName} (তহবিল: ৳{(acc.totalFund / 100000).toFixed(1)}L)
                    </option>
                  ))}
                </select>
                {selectedAccountForModal && (
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    অ্যাকাউন্ট নম্বর: <span className="font-mono">{selectedAccountForModal.accountNumber}</span> • শাখা: {selectedAccountForModal.branchName}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  {isBangla ? "বরাদ্দকৃত বাজেট পরিমাণ (BDT ৳) *" : "Allocated Budget Amount (BDT ৳) *"}
                </label>
                <input
                  type="number"
                  value={allocAmount}
                  onChange={(e) => setAllocAmount(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono text-sm font-bold focus:border-teal-500"
                  required
                  min={10000}
                  step={50000}
                />
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                  = ৳{(allocAmount / 100000).toFixed(2)} Lakh BDT
                </span>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  {isBangla ? "অনুমোদনকারী কর্মকর্তা / বোর্ড *" : "Authorized / Approved By *"}
                </label>
                <input
                  type="text"
                  value={allocAuthorizedBy}
                  onChange={(e) => setAllocAuthorizedBy(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:border-teal-500"
                  required
                  placeholder="e.g. Super Admin (Finance Directorate) / CEO"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAllocatingDept(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isBangla ? "বাজেট অনুমোদন ও নিশ্চিত করুন" : "Authorize & Allocate"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Treasury Account */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isBangla ? "নতুন ট্রেজারি / ব্যাংক অ্যাকাউন্ট যুক্ত করুন" : "Add Treasury / Bank Account"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAccountModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAccountSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  {isBangla ? "অ্যাকাউন্ট / তহবিলের নাম *" : "Account / Fund Name *"}
                </label>
                <input
                  type="text"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="e.g. CSR ও টেকসই উন্নয়ন তহবিল"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:border-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {isBangla ? "ব্যাংকের নাম *" : "Bank Name *"}
                  </label>
                  <input
                    type="text"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    placeholder="e.g. Dutch-Bangla Bank PLC"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {isBangla ? "হিসাব নম্বর (Account No) *" : "Account Number *"}
                  </label>
                  <input
                    type="text"
                    value={newAccNumber}
                    onChange={(e) => setNewAccNumber(e.target.value)}
                    placeholder="e.g. DBBL-110-230-998811"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {isBangla ? "শাখা (Branch) *" : "Branch *"}
                  </label>
                  <input
                    type="text"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="e.g. Gulshan Corporate Branch"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {isBangla ? "অ্যাকাউন্টের ধরন *" : "Account Type *"}
                  </label>
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:border-teal-500"
                  >
                    <option value="CENTRAL_OPERATING">Central Operating (কেন্দ্রীয় পরিচালন)</option>
                    <option value="REVENUE_TREASURY">Revenue Treasury (রাজস্ব ও লাভ)</option>
                    <option value="DONOR_GRANT">Donor / Grant Fund (প্রকল্প অনুদান)</option>
                    <option value="RESERVE_FUND">Contingency Reserve (জরুরি রিজার্ভ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  {isBangla ? "প্রাথমিক মোট তহবিল ব্যালেন্স (BDT ৳) *" : "Total Fund Balance (BDT ৳) *"}
                </label>
                <input
                  type="number"
                  value={newTotalFund}
                  onChange={(e) => setNewTotalFund(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  {isBangla ? "উদ্দেশ্য ও বিবরণ" : "Description & Scope"}
                </label>
                <textarea
                  rows={2}
                  value={newAccDesc}
                  onChange={(e) => setNewAccDesc(e.target.value)}
                  placeholder="অ্যাকাউন্টের পরিচালনার শর্ত বা উদ্দেশ্য..."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isBangla ? "অ্যাকাউন্ট যুক্ত করুন" : "Add Account"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
