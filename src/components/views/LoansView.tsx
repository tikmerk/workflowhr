import React, { useState } from "react";
import {
  Banknote,
  Plus,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Download,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  X
} from "lucide-react";
import { EmployeeLoan, Employee, Branch } from "../../types";
import { exportToCSV } from "../../utils/exportUtils";

interface LoansViewProps {
  loans: EmployeeLoan[];
  employees: Employee[];
  branches: Branch[];
  onApproveLoan: (loanId: string) => void;
  onRejectLoan: (loanId: string) => void;
  onAddLoan: (loan: EmployeeLoan) => void;
}

export const LoansView: React.FC<LoansViewProps> = ({
  loans,
  employees,
  branches,
  onApproveLoan,
  onRejectLoan,
  onAddLoan,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Loan Form State
  const [newEmpId, setNewEmpId] = useState(employees[0]?.id || "");
  const [newAmount, setNewAmount] = useState(40000);
  const [newTenor, setNewTenor] = useState(6);
  const [newReason, setNewReason] = useState("");

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === "ALL" || loan.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalDisbursed = loans
    .filter((l) => l.status === "ACTIVE" || l.status === "CLOSED")
    .reduce((sum, l) => sum + l.amount, 0);

  const totalOutstanding = loans
    .filter((l) => l.status === "ACTIVE")
    .reduce((sum, l) => sum + l.remainingAmount, 0);

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === newEmpId) || employees[0];
    const emi = Math.round(newAmount / newTenor);

    const loan: EmployeeLoan = {
      id: `loan-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      branchName: emp.branchName,
      amount: newAmount,
      monthlyEmi: emi,
      totalInstallments: newTenor,
      paidInstallments: 0,
      remainingAmount: newAmount,
      reason: newReason || "Staff advance",
      applicationDate: new Date().toISOString().split("T")[0],
      status: "PENDING_APPROVAL",
    };

    onAddLoan(loan);
    setShowAddModal(false);
    setNewReason("");
  };

  const handleExportCSV = () => {
    const data = filteredLoans.map((l) => ({
      "Loan ID": l.id,
      "Employee Name": l.employeeName,
      Branch: l.branchName,
      "Principal Amount (BDT)": l.amount,
      "Monthly EMI (BDT)": l.monthlyEmi,
      "Tenor (Months)": l.totalInstallments,
      "Paid Installments": l.paidInstallments,
      "Outstanding Balance (BDT)": l.remainingAmount,
      Status: l.status,
      Reason: l.reason,
    }));
    exportToCSV("Workflow_HR_Loans_Ledger", data);
  };

  return (
    <div id="loans-management-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Banknote className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Employee Loan & Advance Salary Management</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Disburse interest-free salary advances, configure automated monthly EMI payroll deductions & track ledgers
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Export Ledger</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Grant New Loan</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by employee name or reason..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Loan Statuses</option>
              <option value="ACTIVE">Active Repayments</option>
              <option value="PENDING_APPROVAL">Pending Review</option>
              <option value="CLOSED">Fully Repaid (Closed)</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Total Capital Disbursed</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            ৳{(totalDisbursed ?? 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-teal-700 dark:text-teal-400 mt-1 block font-medium">Company-funded advances</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Outstanding Principal</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            ৳{(totalOutstanding ?? 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">To be recovered via monthly EMIs</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-teal-500/30 bg-teal-500/5 shadow-xs">
          <span className="text-xs text-teal-700 dark:text-teal-300 block font-medium">Auto Payroll Deduction</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">100% Automated</span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-1 block font-medium">Subtracted in monthly payslip</span>
        </div>
      </div>

      {/* Loans Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Branch</th>
                <th className="p-3">Principal Amount</th>
                <th className="p-3">Monthly EMI</th>
                <th className="p-3">Tenor & Progress</th>
                <th className="p-3">Remaining Balance</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-white">{loan.employeeName}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{loan.reason}</div>
                  </td>

                  <td className="p-3 text-slate-700 dark:text-slate-300">{(loan.branchName || "Main Office").split("(")[0]}</td>

                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">৳{(loan.amount ?? 0).toLocaleString()}</td>

                  <td className="p-3 font-mono text-teal-700 dark:text-teal-300 font-semibold">৳{(loan.monthlyEmi ?? 0).toLocaleString()} / mo</td>

                  <td className="p-3">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {loan.paidInstallments} of {loan.totalInstallments} Months
                    </div>
                    <div className="w-24 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="bg-emerald-500 dark:bg-emerald-400 h-1.5 rounded-full"
                        style={{
                          width: `${(loan.paidInstallments / loan.totalInstallments) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </td>

                  <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                    ৳{(loan.remainingAmount ?? 0).toLocaleString()}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        loan.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                          : loan.status === "PENDING_APPROVAL"
                          ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                          : "bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {loan.status}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    {loan.status === "PENDING_APPROVAL" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onApproveLoan(loan.id)}
                          className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white cursor-pointer"
                          title="Approve Loan"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onRejectLoan(loan.id)}
                          className="p-1.5 rounded-lg bg-red-500/15 text-red-700 dark:text-red-300 hover:bg-red-600 hover:text-white cursor-pointer"
                          title="Reject Loan"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-mono">Active</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Grant New Loan */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Disburse Employee Advance Loan
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Select Employee</label>
                <select
                  value={newEmpId}
                  onChange={(e) => setNewEmpId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Loan Amount (৳ BDT)</label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  step={5000}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Repayment Tenor (Months)</label>
                <select
                  value={newTenor}
                  onChange={(e) => setNewTenor(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                >
                  <option value={3}>3 Months (EMI: ৳{Math.round(newAmount / 3)})</option>
                  <option value={6}>6 Months (EMI: ৳{Math.round(newAmount / 6)})</option>
                  <option value={10}>10 Months (EMI: ৳{Math.round(newAmount / 10)})</option>
                  <option value={12}>12 Months (EMI: ৳{Math.round(newAmount / 12)})</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Purpose / Reason</label>
                <textarea
                  rows={2}
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="e.g. Medical emergency advance..."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold cursor-pointer shadow-md shadow-teal-500/20"
                >
                  Authorize Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
