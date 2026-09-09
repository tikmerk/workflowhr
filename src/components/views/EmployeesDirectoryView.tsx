import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  ScanFace,
  Smartphone,
  Edit2,
  Trash2,
  Eye,
  Download,
  Building2,
  Layers,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  X
} from "lucide-react";
import {
  Employee,
  Branch,
  Department,
  Designation,
  Shift,
  UserRole
} from "../../types";
import { exportToCSV } from "../../utils/exportUtils";
import { FaceEnrollmentModal } from "../attendance/FaceEnrollmentModal";

interface EmployeesDirectoryViewProps {
  employees: Employee[];
  branches: Branch[];
  departments: Department[];
  designations: Designation[];
  shifts: Shift[];
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onOpenDigitalIdCard?: (emp: Employee) => void;
}

export const EmployeesDirectoryView: React.FC<EmployeesDirectoryViewProps> = ({
  employees,
  branches,
  departments,
  designations,
  shifts,
  onAddEmployee,
  onUpdateEmployee,
  onOpenDigitalIdCard,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBranch, setFilterBranch] = useState("ALL");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [enrollingEmployee, setEnrollingEmployee] = useState<Employee | null>(null);

  // New Employee Form State (Comprehensive 30+ Enterprise Fields)
  const [newEmpCode, setNewEmpCode] = useState(`WF-${1000 + employees.length + 1}`);
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("+880 1");
  const [newBranchId, setNewBranchId] = useState(branches[0]?.id || "");
  const [newDeptId, setNewDeptId] = useState(departments[0]?.id || "");
  const [newDesigId, setNewDesigId] = useState(designations[0]?.id || "");
  const [newRole, setNewRole] = useState<UserRole>("EMPLOYEE");
  const [newShiftId, setNewShiftId] = useState(shifts[0]?.id || "");
  const [newJoiningDate, setNewJoiningDate] = useState("2026-09-01");
  const [newBasicSalary, setNewBasicSalary] = useState(60000);
  const [newNid, setNewNid] = useState("");
  const [newBloodGroup, setNewBloodGroup] = useState<any>("O+");
  const [newAddress, setNewAddress] = useState("");

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designationTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBranch = filterBranch === "ALL" || emp.branchId === filterBranch;
    const matchesDept = filterDept === "ALL" || emp.departmentId === filterDept;
    const matchesStatus = filterStatus === "ALL" || emp.status === filterStatus;

    return matchesSearch && matchesBranch && matchesDept && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const branch = branches.find((b) => b.id === newBranchId) || branches[0];
    const dept = departments.find((d) => d.id === newDeptId) || departments[0];
    const desig = designations.find((d) => d.id === newDesigId) || designations[0];
    const shift = shifts.find((s) => s.id === newShiftId) || shifts[0];

    const gross = Math.round(newBasicSalary * 1.77);

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      employeeCode: newEmpCode,
      companyId: "comp-01",
      branchId: branch.id,
      branchName: branch.name,
      departmentId: dept.id,
      departmentName: dept.name,
      designationId: desig.id,
      designationTitle: desig.title,
      role: newRole,
      fullName: newFullName,
      email: newEmail,
      phone: newPhone,
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + employees.length}?w=200&h=200&fit=crop&crop=face`,
      dateOfBirth: "1994-05-15",
      gender: "MALE",
      bloodGroup: newBloodGroup,
      maritalStatus: "SINGLE",
      nidNumber: newNid || "19942699988776655",
      presentAddress: newAddress || "Dhaka, Bangladesh",
      permanentAddress: "Bangladesh",
      joiningDate: newJoiningDate,
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      shiftId: shift.id,
      shiftName: shift.name,
      salary: {
        basic: newBasicSalary,
        houseRent: Math.round(newBasicSalary * 0.4),
        medicalAllowance: Math.round(newBasicSalary * 0.12),
        transportAllowance: Math.round(newBasicSalary * 0.12),
        specialAllowance: Math.round(newBasicSalary * 0.13),
        providentFundPercentage: 8,
        taxDeductionPercentage: 6,
        grossSalary: gross,
      },
      bankName: "City Bank Ltd.",
      bankAccountNumber: `11029837${Math.floor(Math.random() * 9000 + 1000)}`,
      faceTemplateRegistered: true,
      deviceBindingEnabled: true,
      boundDeviceId: `DEV-${newEmpCode}`,
      documents: [],
    };

    onAddEmployee(newEmp);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNewFullName("");
    setNewEmail("");
    setNewPhone("+880 1");
    setNewNid("");
    setNewAddress("");
    setNewBasicSalary(60000);
  };

  const handleExportCSV = () => {
    const data = filteredEmployees.map((e) => ({
      "Employee ID": e.employeeCode,
      "Full Name": e.fullName,
      Role: e.role,
      Designation: e.designationTitle,
      Department: e.departmentName,
      Branch: e.branchName,
      Email: e.email,
      Phone: e.phone,
      "Gross Salary (BDT)": e.salary?.grossSalary || 0,
      "Face Template Enrolled": e.faceTemplateRegistered ? "Yes" : "No",
      "Bound Device ID": e.boundDeviceId || "N/A",
      Status: e.status,
    }));
    exportToCSV("Workflow_HR_Workforce_Directory", data);
  };

  return (
    <div id="employees-directory-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Action & Search Bar */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Workforce & Employee Database</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage complete employee lifecycle, biometric face templates, hardware binding & salary structures
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Employee</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, email, role..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Branch Locations</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Employees</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="PROBATION">Probation Period</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table List / Mobile Card Layout */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Showing {filteredEmployees.length} of {employees.length} Employees</span>
        </div>

        {/* Mobile View: Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={emp.avatarUrl}
                    alt={emp.fullName}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">{emp.fullName}</h4>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{emp.employeeCode}</p>
                    <p className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold mt-0.5">
                      {emp.designationTitle}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    emp.status === "ACTIVE"
                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {emp.status}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-200/80 dark:border-slate-700/50">
                <div className="flex justify-between">
                  <span>Branch / Dept:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {(emp.branchName || "Main Office").split("(")[0]} • {emp.departmentName || "General"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Biometrics:</span>
                  {emp.faceTemplateRegistered ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <ScanFace className="w-3 h-3" /> Enrolled
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
                      <ScanFace className="w-3 h-3" /> No Photo
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span>Gross Salary:</span>
                  <span className="text-slate-900 dark:text-white font-mono font-bold">
                    ৳{(emp.salary?.grossSalary ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/50">
                {onOpenDigitalIdCard && (
                  <button
                    type="button"
                    onClick={() => onOpenDigitalIdCard(emp)}
                    className="p-2 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-800 dark:text-teal-300 border border-teal-500/30 transition-colors cursor-pointer"
                    title="Digital ID Card (ডিজিটাল আইডি কার্ড)"
                  >
                    <CreditCard className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEnrollingEmployee(emp)}
                  className="flex-1 py-2 px-2.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-800 dark:text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ScanFace className="w-3.5 h-3.5" />
                  <span>{emp.faceTemplateRegistered ? "Update Photo" : "Enroll Face"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEmployee(emp)}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="View Profile"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Full Data Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Role & Designation</th>
                <th className="p-3">Branch & Dept</th>
                <th className="p-3">Biometrics & Device</th>
                <th className="p-3">Gross Salary</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatarUrl}
                        alt={emp.fullName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{emp.fullName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {emp.employeeCode} • {emp.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-200">{emp.designationTitle}</div>
                    <div className="text-[10px] text-teal-700 dark:text-teal-400 font-medium">
                      {emp.role.replace("_", " ")}
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="font-medium text-slate-900 dark:text-slate-200">{(emp.branchName || "Main Office").split("(")[0]}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{emp.departmentName}</div>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      {emp.faceTemplateRegistered ? (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                          title="Biometric Face Enrolled"
                        >
                          <ScanFace className="w-3 h-3" /> Enrolled
                        </span>
                      ) : (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30"
                          title="No Face Photo Enrolled"
                        >
                          <ScanFace className="w-3 h-3" /> No Photo
                        </span>
                      )}
                      {emp.boundDeviceId && (
                        <span
                          className="p-1 rounded bg-blue-500/15 text-blue-800 dark:text-blue-300 text-[10px] font-bold"
                          title={`Bound to ${emp.boundDeviceId}`}
                        >
                          <Smartphone className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-3 font-mono font-semibold text-slate-900 dark:text-white">
                    ৳{(emp.salary?.grossSalary ?? 0).toLocaleString()}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        emp.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {onOpenDigitalIdCard && (
                        <button
                          onClick={() => onOpenDigitalIdCard(emp)}
                          className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/25 text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 border border-teal-500/30 transition-colors cursor-pointer"
                          title="View & Download Digital ID Card (ডিজিটাল আইডি কার্ড)"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setEnrollingEmployee(emp)}
                        className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 border border-teal-500/30 transition-colors cursor-pointer"
                        title="Enroll / Update Biometric Face Photo"
                      >
                        <ScanFace className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedEmployee(emp)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                        title="View Full Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Full Employee Profile Details */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-2xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={selectedEmployee.avatarUrl}
                  alt={selectedEmployee.fullName}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-500"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedEmployee.fullName}</h3>
                  <p className="text-xs text-teal-700 dark:text-teal-400">
                    {selectedEmployee.designationTitle} • {selectedEmployee.employeeCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Official Role</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedEmployee.role.replace("_", " ")}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Assigned Branch</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedEmployee.branchName}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Department</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedEmployee.departmentName}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Work Shift</span>
                <span className="font-bold text-teal-700 dark:text-teal-300">{selectedEmployee.shiftName}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">National ID (NID)</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedEmployee.nidNumber}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Gross Salary</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  ৳{(selectedEmployee.salary?.grossSalary ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-slate-200">Biometric & Device Binding Status</h4>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Face Vector Recognition:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">Enrolled (98%+ Match Precision)</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Hardware Signature:</span>
                <span className="font-mono text-teal-700 dark:text-teal-300">
                  {selectedEmployee.boundDeviceId || "DEV-MAC-PRO-M3-99"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEnrollingEmployee(selectedEmployee);
                    setSelectedEmployee(null);
                  }}
                  className="px-3.5 py-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-800 dark:text-teal-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ScanFace className="w-4 h-4" />
                  <span>Re-Enroll Face</span>
                </button>

                {onOpenDigitalIdCard && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenDigitalIdCard(selectedEmployee);
                    }}
                    className="px-3.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>ডিজিটাল আইডি কার্ড (Digital ID)</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Biometric Face Enrollment Modal */}
      {enrollingEmployee && (
        <FaceEnrollmentModal
          isOpen={Boolean(enrollingEmployee)}
          onClose={() => setEnrollingEmployee(null)}
          employee={enrollingEmployee}
          onSaveFacePhoto={(empId, photoUrl) => {
            const updated = {
              ...enrollingEmployee,
              faceRegisteredPhoto: photoUrl,
              avatarUrl: photoUrl,
              faceTemplateRegistered: true,
            };
            onUpdateEmployee(updated);
            setEnrollingEmployee(null);
          }}
        />
      )}

      {/* Modal: Add New Employee (30+ Fields) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-3xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Enroll New Employee Record</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Employee Code / ID</label>
                  <input
                    type="text"
                    value={newEmpCode}
                    onChange={(e) => setNewEmpCode(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Mahfuzur Rahman"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="mahfuz@apexglobal.tech"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Branch Office</label>
                  <select
                    value={newBranchId}
                    onChange={(e) => setNewBranchId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Department</label>
                  <select
                    value={newDeptId}
                    onChange={(e) => setNewDeptId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Designation</label>
                  <select
                    value={newDesigId}
                    onChange={(e) => setNewDesigId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">System Role (RBAC)</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="EMPLOYEE">Employee (General Staff)</option>
                    <option value="PROJECT_MANAGER">Project Manager / Team Lead</option>
                    <option value="BRANCH_MANAGER">Branch Manager</option>
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="ACCOUNTS_MANAGER">Accounts Manager</option>
                    <option value="COMPANY_ADMIN">Company Admin</option>
                    <option value="SUPER_ADMIN">Super Admin (Full Access)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Assigned Shift</label>
                  <select
                    value={newShiftId}
                    onChange={(e) => setNewShiftId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Basic Monthly Salary (৳ BDT)</label>
                  <input
                    type="number"
                    value={newBasicSalary}
                    onChange={(e) => setNewBasicSalary(Number(e.target.value))}
                    step={2000}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">National ID (NID)</label>
                  <input
                    type="text"
                    value={newNid}
                    onChange={(e) => setNewNid(e.target.value)}
                    placeholder="199XXXXXXXXXXXXXX"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Blood Group</label>
                  <select
                    value={newBloodGroup}
                    onChange={(e) => setNewBloodGroup(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Present Residential Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. House 14, Road 5, Dhanmondi, Dhaka"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  Save & Enroll Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
