import { Employee, Payslip, EmployeeLoan, AttendanceRecord, CustomBonusConfig } from "../types";

export interface PayrollCalculationInput {
  employee: Employee;
  month: string; // "YYYY-MM"
  totalDaysInMonth: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  holidayDays: number;
  overtimeHours: number;
  bonusAmount?: number;
  bonusTitle?: string;
  activeLoans?: EmployeeLoan[];
  advanceSalary?: number;
}

export function generateEmployeePayslip(input: PayrollCalculationInput): Payslip {
  const {
    employee,
    month,
    totalDaysInMonth,
    presentDays,
    lateDays,
    absentDays,
    leaveDays,
    holidayDays,
    overtimeHours,
    bonusAmount = 0,
    activeLoans = [],
    advanceSalary = 0,
  } = input;

  const basicSalary = employee.salary?.basic || 50000;
  const houseRentAllowance = employee.salary?.houseRent || 25000;
  const medicalAllowance = employee.salary?.medicalAllowance || 5000;
  const transportAllowance = employee.salary?.transportAllowance || 5000;
  const specialAllowance = employee.salary?.specialAllowance || 5000;

  // Hourly rate based on 22 standard working days, 8 hours/day = 176 hours
  const hourlyRate = basicSalary / 176;
  const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5); // 1.5x rate

  const grossEarnings =
    basicSalary +
    houseRentAllowance +
    medicalAllowance +
    transportAllowance +
    specialAllowance +
    overtimePay +
    bonusAmount;

  // Daily rate for deduction calculation
  const dailyRate = basicSalary / totalDaysInMonth;

  // Flexible Working Hours / Attendance Exemption & Protected Salary Check:
  // If employee has flexibleHours, isAttendanceExempt, isAttendancePenaltyExempt, or salaryProtected,
  // do NOT deduct any late arrival penalty or absent penalties.
  const isExemptFromLate = Boolean(
    employee.flexibleHours ||
    employee.isAttendanceExempt ||
    employee.isAttendancePenaltyExempt ||
    employee.salaryProtected
  );
  const isSalaryProtected = Boolean(employee.salaryProtected);

  // Rule: 1 day basic salary deducted for every 3 late attendances
  const lateDeductionDays = isExemptFromLate ? 0 : Math.floor(lateDays / 3);
  const latePenaltyDeduction = isExemptFromLate ? 0 : Math.round(lateDeductionDays * dailyRate);

  // Absenteeism deduction: daily rate * absent days (0 if salary is protected)
  const absenteeismDeduction = isSalaryProtected ? 0 : Math.round(absentDays * dailyRate);

  // Provident Fund deduction (e.g. 8% of basic)
  const pfPerc = employee.salary?.providentFundPercentage ?? 8;
  const providentFundDeduction = Math.round(basicSalary * (pfPerc / 100));

  // Progressive Tax Deduction
  const taxPerc = employee.salary?.taxDeductionPercentage ?? 5;
  const taxDeduction = Math.round(grossEarnings * (taxPerc / 100));

  // Loan EMI deduction from active loans
  const loanEmiDeduction = activeLoans
    .filter((l) => l.employeeId === employee.id && (l.status === "ACTIVE" || l.status === "APPROVED"))
    .reduce((sum, loan) => sum + loan.monthlyEmi, 0);

  const totalDeductions =
    providentFundDeduction +
    taxDeduction +
    latePenaltyDeduction +
    absenteeismDeduction +
    loanEmiDeduction +
    advanceSalary;

  const netSalary = Math.max(0, grossEarnings - totalDeductions);

  return {
    id: `PS-${employee.employeeCode}-${month.replace("-", "")}`,
    payrollMonth: month,
    employeeId: employee.id,
    employeeCode: employee.employeeCode,
    employeeName: employee.fullName,
    avatarUrl: employee.avatarUrl,
    branchName: employee.branchName,
    departmentName: employee.departmentName,
    designationTitle: employee.designationTitle,

    totalDaysInMonth,
    workingDays: totalDaysInMonth - (holidayDays + 8),
    presentDays,
    lateDays,
    absentDays,
    leaveDays,
    holidayDays,
    overtimeHours,

    basicSalary,
    houseRentAllowance,
    medicalAllowance,
    transportAllowance,
    specialAllowance,
    overtimePay,
    bonusAmount,
    grossEarnings,

    providentFundDeduction,
    taxDeduction,
    latePenaltyDeduction,
    absenteeismDeduction,
    loanEmiDeduction,
    advanceSalaryDeduction: advanceSalary,
    totalDeductions,

    netSalary,
    paymentStatus: "PENDING_APPROVAL",
    paymentMethod: "BANK_TRANSFER",
  };
}

export function calculateMonthlyPayroll(
  month: string,
  employees: Employee[],
  attendanceLogs: AttendanceRecord[] = [],
  loans: EmployeeLoan[] = [],
  customBonuses: CustomBonusConfig[] = []
): Payslip[] {
  // Only process active/probation employees or those who were active during the month
  const eligibleEmployees = employees.filter((emp) => emp.status !== "EXITED" && !emp.deletedAt);

  return eligibleEmployees.map((emp) => {
    // calculate attendance for this employee
    const empAtt = attendanceLogs.filter((a) => a.employeeId === emp.id);
    const presentDays = empAtt.filter((a) => a.status === "PRESENT" || a.status === "LATE").length || 21;
    const lateDays = empAtt.filter((a) => a.status === "LATE").length || 1;
    const absentDays = empAtt.filter((a) => a.status === "ABSENT").length || 0;
    const leaveDays = empAtt.filter((a) => a.status === "ON_LEAVE").length || 1;
    const overtimeHours = empAtt.reduce((sum, a) => sum + (a.overtimeMinutes || 0) / 60, 0) || 4;

    // Calculate dynamic custom festival bonus applicable for this month and employee
    let calculatedBonus = 0;
    const matchingBonuses = customBonuses.filter(
      (b) => b.effectiveMonth === month && (b.status === "ACTIVE" || b.status === "SCHEDULED" || b.status === "COMPLETED")
    );

    for (const b of matchingBonuses) {
      // Check target eligibility
      if (b.targetEligibility === "CUSTOM_DEPARTMENT" && b.targetDepartmentId && b.targetDepartmentId !== emp.departmentId) {
        continue;
      }
      if (b.targetEligibility === "PERMANENT_ONLY" && emp.employmentType !== "FULL_TIME") {
        continue;
      }

      const basic = emp.salary?.basic || 50000;
      let singleBonus = 0;
      if (b.calculationType === "PERCENTAGE") {
        singleBonus = Math.round(basic * (b.amountOrPercentage / 100));
      } else {
        singleBonus = b.amountOrPercentage;
      }

      if (b.maxCap && b.maxCap > 0) {
        singleBonus = Math.min(singleBonus, b.maxCap);
      }

      calculatedBonus += singleBonus;
    }

    return generateEmployeePayslip({
      employee: emp,
      month,
      totalDaysInMonth: 30,
      presentDays,
      lateDays,
      absentDays,
      leaveDays,
      holidayDays: 2,
      overtimeHours: Math.round(overtimeHours),
      bonusAmount: calculatedBonus,
      activeLoans: loans,
    });
  });
}

