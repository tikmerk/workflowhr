import { Employee, Payslip, EmployeeLoan, AttendanceRecord, CustomBonusConfig, PayrollPolicyConfig } from "../types";

export function normalizeMonthKey(m?: string): string {
  if (!m) return "";
  const trimmed = m.trim();
  if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed;
  const monthMap: Record<string, string> = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
  };
  const parts = trimmed.split(" ");
  if (parts.length >= 2) {
    const monthNum = monthMap[parts[0].toLowerCase()];
    const year = parts[1];
    if (monthNum && year) {
      return `${year}-${monthNum}`;
    }
  }
  return trimmed;
}

export interface PayrollCalculationInput {
  employee: Employee;
  month: string; // "YYYY-MM" or "Month YYYY"
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
  policy?: PayrollPolicyConfig;
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
    policy,
  } = input;

  const isFixed = Boolean(employee.isFixedSalary || employee.isFixedContractSalary);
  const basicSalary =
    employee.salary?.basic !== undefined && employee.salary?.basic !== null
      ? employee.salary.basic
      : (employee.salary?.grossSalary ?? 50000);

  // Allowances calculation: Employee individual profile takes precedence, otherwise system policy applies
  let houseRentAllowance = 0;
  let medicalAllowance = 0;
  let transportAllowance = 0;
  let specialAllowance = 0;

  if (!isFixed) {
    // 1. House Rent
    if (employee.salary?.houseRent !== undefined && employee.salary?.houseRent !== null) {
      houseRentAllowance = employee.salary.houseRent;
    } else if (policy?.houseRentCalculationMode === "FIXED_AMOUNT") {
      houseRentAllowance = policy.houseRentFixedAmount || 0;
    } else {
      const hrPerc = policy?.defaultHouseRentPercentage ?? 40;
      houseRentAllowance = Math.round(basicSalary * (hrPerc / 100));
    }

    // 2. Medical Allowance
    if (employee.salary?.medicalAllowance !== undefined && employee.salary?.medicalAllowance !== null) {
      medicalAllowance = employee.salary.medicalAllowance;
    } else if (policy?.medicalCalculationMode === "FIXED_AMOUNT") {
      medicalAllowance = policy.medicalFixedAmount || 0;
    } else {
      const medPerc = policy?.defaultMedicalPercentage ?? 10;
      medicalAllowance = Math.round(basicSalary * (medPerc / 100));
    }

    // 3. Transport / Conveyance Allowance
    if (employee.salary?.transportAllowance !== undefined && employee.salary?.transportAllowance !== null) {
      transportAllowance = employee.salary.transportAllowance;
    } else if (policy?.transportCalculationMode === "FIXED_AMOUNT") {
      transportAllowance = policy.transportFixedAmount || 0;
    } else {
      const transPerc = policy?.defaultTransportPercentage ?? 10;
      transportAllowance = Math.round(basicSalary * (transPerc / 100));
    }

    // 4. Special Allowance / Others
    if (employee.salary?.specialAllowance !== undefined && employee.salary?.specialAllowance !== null) {
      specialAllowance = employee.salary.specialAllowance;
    } else if (policy?.specialCalculationMode === "FIXED_AMOUNT") {
      specialAllowance = policy.specialFixedAmount || 0;
    } else {
      const specPerc = policy?.defaultSpecialPercentage ?? 10;
      specialAllowance = Math.round(basicSalary * (specPerc / 100));
    }
  }

  // Daily rate for deduction & overtime calculation
  const dailyRate = (totalDaysInMonth > 0 && basicSalary > 0) ? basicSalary / totalDaysInMonth : 0;

  // Overtime Calculation based on Policy:
  const isOvertimeEnabled = policy?.overtimeEnabled !== false;
  const standardHoursPerDay = policy?.standardWorkHoursPerDay || 8;
  const standardMonthlyHours = (totalDaysInMonth > 0 ? 22 : 22) * standardHoursPerDay;
  const baseHourlyRate = (basicSalary > 0 && standardMonthlyHours > 0) ? basicSalary / standardMonthlyHours : 0;

  let overtimePay = 0;
  if (isOvertimeEnabled && overtimeHours > 0) {
    if (
      policy?.overtimeCalculationType === "FIXED_PER_HOUR" ||
      policy?.overtimeCalculationType === "FIXED_RATE"
    ) {
      const rate = policy.overtimeFixedHourlyRate || policy.overtimeFixedRatePerHour || 200;
      overtimePay = Math.round(overtimeHours * rate);
    } else if (
      policy?.overtimeCalculationType === "BASIC_HOURLY_2X" ||
      policy?.overtimeCalculationType === "DOUBLE_BASIC"
    ) {
      overtimePay = Math.round(overtimeHours * baseHourlyRate * 2.0);
    } else {
      // Standard / 1.5x: 1.5x of hourly basic rate
      overtimePay = Math.round(overtimeHours * baseHourlyRate * 1.5);
    }
  }

  const grossEarnings = isFixed
    ? basicSalary + overtimePay + bonusAmount
    : basicSalary +
      houseRentAllowance +
      medicalAllowance +
      transportAllowance +
      specialAllowance +
      overtimePay +
      bonusAmount;

  // Flexible Working Hours / Attendance Exemption & Protected Salary Check:
  // If employee has flexibleHours, isAttendanceExempt, isAttendancePenaltyExempt, or salaryProtected,
  // do NOT deduct any late arrival penalty or absent penalties.
  const isExemptFromLate = Boolean(
    employee.flexibleHours ||
    employee.isAttendanceExempt ||
    employee.isAttendancePenaltyExempt ||
    employee.salaryProtected ||
    (policy?.exemptFieldStaffFromPenalty && (employee.departmentName?.toLowerCase().includes("field") || employee.flexibleHours)) ||
    (policy?.fixedSalaryStaffNoDeductions && isFixed) ||
    isFixed
  );
  const isSalaryProtected = Boolean(employee.salaryProtected || (policy?.fixedSalaryStaffNoDeductions && isFixed) || isFixed);

  // Late Arrival Penalty Deduction based on policy:
  let latePenaltyDeduction = 0;
  if (!isExemptFromLate && lateDays > 0 && (policy?.latePenaltyEnabled !== false)) {
    if (policy?.latePenaltyType === "FIXED_AMOUNT") {
      latePenaltyDeduction = lateDays * (policy.latePenaltyFixedAmount || 200);
    } else if (policy?.latePenaltyType === "PERCENTAGE") {
      const perc = policy.latePenaltyPercentage || 1;
      latePenaltyDeduction = Math.round(basicSalary * (perc / 100) * lateDays);
    } else {
      // Standard Rule: 1 day basic salary deducted for every 3 late attendances
      const lateDeductionDays = Math.floor(lateDays / 3);
      latePenaltyDeduction = Math.round(lateDeductionDays * dailyRate);
    }
  }

  // Absenteeism deduction based on policy:
  let absenteeismDeduction = 0;
  const isAbsenteeismPenaltyEnabled =
    policy?.absenteeismPenaltyEnabled !== false && policy?.absentPenaltyEnabled !== false;

  if (!isSalaryProtected && absentDays > 0 && isAbsenteeismPenaltyEnabled) {
    if (
      policy?.absenteeismPenaltyType === "FIXED_PER_DAY" ||
      policy?.absenteeismPenaltyType === "FIXED_AMOUNT"
    ) {
      const penaltyAmt = policy.absenteeismFixedPenaltyAmount || policy.absenteeismFixedAmount || 1000;
      absenteeismDeduction = absentDays * penaltyAmt;
    } else if (
      policy?.absenteeismPenaltyType === "DAILY_BASIC_1_POINT_5" ||
      policy?.absenteeismPenaltyType === "ONE_POINT_FIVE_BASIC"
    ) {
      absenteeismDeduction = Math.round(absentDays * dailyRate * 1.5);
    } else {
      // Standard 1:1 daily rate deduction
      absenteeismDeduction = Math.round(absentDays * dailyRate);
    }
  }

  // Provident Fund deduction (e.g. 8% of basic)
  const pfPerc = employee.salary?.providentFundPercentage ?? policy?.defaultProvidentFundPercentage ?? 8;
  const providentFundDeduction = Math.round(basicSalary * (pfPerc / 100));

  // Progressive Tax Deduction
  const taxPerc = employee.salary?.taxDeductionPercentage ?? policy?.defaultTaxPercentage ?? 5;
  const taxDeduction = Math.round(grossEarnings * (taxPerc / 100));

  // Separate and accurately handle Advance Salary vs Company Loan vs Employee Borrowing
  const activeEmpRecords = activeLoans.filter(
    (l) => l.employeeId === employee.id && (l.status === "ACTIVE" || l.status === "APPROVED")
  );

  // 1. Advance Salary deduction: only for ADVANCE_SALARY records (deducted over 1 month, 2 months, etc.)
  const activeAdvanceDeduction = activeEmpRecords
    .filter((l) => l.category === "ADVANCE_SALARY" || !l.category)
    .reduce((sum, loan) => {
      const duration = loan.advanceDurationMonths || loan.totalInstallments || 1;
      const deduction = loan.monthlyEmi || Math.round(loan.amount / Math.max(1, duration));
      const remaining = loan.remainingAmount !== undefined ? loan.remainingAmount : loan.amount;
      return sum + Math.min(deduction, Math.max(0, remaining));
    }, 0);

  const totalAdvanceSalaryDeduction = (advanceSalary || 0) + activeAdvanceDeduction;

  // 2. Company Loan EMI deduction: ONLY for COMPANY_LOAN with MONTHLY_INSTALLMENT repayment
  // (Lump-sum loans are returned directly to the boss/company outside payroll; EMPLOYEE_BORROWING is company borrowing from staff and is never deducted from salary)
  const loanEmiDeduction = activeEmpRecords
    .filter((l) => l.category === "COMPANY_LOAN" && l.repaymentType === "MONTHLY_INSTALLMENT")
    .reduce((sum, loan) => {
      const installments = loan.totalInstallments || 1;
      const emi = loan.monthlyEmi || Math.round(loan.amount / Math.max(1, installments));
      const remaining = loan.remainingAmount !== undefined ? loan.remainingAmount : loan.amount;
      return sum + Math.min(emi, Math.max(0, remaining));
    }, 0);

  const totalDeductions =
    providentFundDeduction +
    taxDeduction +
    latePenaltyDeduction +
    absenteeismDeduction +
    loanEmiDeduction +
    totalAdvanceSalaryDeduction;

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
    advanceSalaryDeduction: totalAdvanceSalaryDeduction,
    totalDeductions,

    netSalary,
    paymentStatus: "PENDING_APPROVAL",
    paymentMethod: "BANK_TRANSFER",
    branchId: employee.branchId,
    bankName: employee.bankName || "Authorized Corporate Bank",
    bankAccountNumber: employee.bankAccountNumber || "Verified A/C",
    festivalBonus: bonusAmount,
    houseRent: houseRentAllowance,
    lateDeductionAmount: latePenaltyDeduction,
    loanInstallmentDeduction: loanEmiDeduction,
  };
}

export function calculateMonthlyPayroll(
  month: string,
  employees: Employee[],
  attendanceLogs: AttendanceRecord[] = [],
  loans: EmployeeLoan[] = [],
  customBonuses: CustomBonusConfig[] = [],
  policy?: PayrollPolicyConfig
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
    const targetMonthKey = normalizeMonthKey(month);
    const matchingBonuses = customBonuses.filter(
      (b) =>
        normalizeMonthKey(b.effectiveMonth) === targetMonthKey &&
        b.status !== "INACTIVE" &&
        b.status !== "PAUSED" &&
        (b.status === "ACTIVE" || b.status === "SCHEDULED" || b.status === "COMPLETED" || !b.status)
    );

    for (const b of matchingBonuses) {
      // Check target eligibility
      if (b.targetEligibility === "CUSTOM_DEPARTMENT" && b.targetDepartmentId && b.targetDepartmentId !== emp.departmentId) {
        continue;
      }
      if (b.targetEligibility === "PERMANENT_ONLY" && emp.employmentType !== "FULL_TIME") {
        continue;
      }

      const basic =
        emp.salary?.basic !== undefined && emp.salary?.basic !== null
          ? emp.salary.basic
          : (emp.salary?.grossSalary ?? 0);
      let singleBonus = 0;
      const rateOrAmt = b.amountOrPercentage ?? b.percentageRate ?? b.fixedAmount ?? 0;
      if (b.calculationType === "PERCENTAGE") {
        singleBonus = Math.round(basic * (rateOrAmt / 100));
      } else {
        singleBonus = rateOrAmt;
      }

      const cap = b.maxCap || b.maxCapAmount;
      if (cap && cap > 0) {
        singleBonus = Math.min(singleBonus, cap);
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
      policy,
    });
  });
}

