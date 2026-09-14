export type UserRole =
  | "GRAND_ADMIN"
  | "SUPER_ADMIN"
  | "COMPANY_ADMIN"
  | "CEO"
  | "HR_MANAGER"
  | "ACCOUNTS_MANAGER"
  | "BRANCH_MANAGER"
  | "DEPARTMENT_HEAD"
  | "PROJECT_MANAGER"
  | "TEAM_LEADER"
  | "EMPLOYEE"
  | "AUDITOR"
  | "READ_ONLY";

export type NavigationTab =
  | "dashboard"
  | "self-service"
  | "employees"
  | "departments-designations"
  | "branches-geofence"
  | "ngo-programs-training"
  | "meetings-conferences"
  | "roles-permissions"
  | "attendance-logs"
  | "shifts-holidays"
  | "leaves"
  | "payroll"
  | "loans"
  | "recruitment"
  | "projects-tasks"
  | "assets"
  | "certificates"
  | "exit-management"
  | "notices-chat"
  | "audit-reports";

export interface Permission {
  id: string;
  name: string;
  category: "organization" | "employees" | "attendance" | "payroll" | "recruitment" | "projects" | "reports" | "certificates" | "system";
  description: string;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  industry: string;
  establishedYear: number;
  contactEmail: string;
  phone: string;
  website: string;
  currency: string;
  currencySymbol: string;
  country: string;
  taxId: string;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  code: string;
  isHeadOffice: boolean;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  managerId?: string;
  managerName?: string;
  // Geofencing Coordinates
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number; // e.g. 100 meters
  wifiSSIDWhitelist?: string[];
  ipWhitelist?: string[];
  totalEmployees: number;
  activeStatus: "ACTIVE" | "INACTIVE";
  // District Training Center attached to this Branch
  hasTrainingCenter?: boolean;
  trainingCenterName?: string;
  trainingCourses?: string[];
  traineesCount?: number;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  branchId?: string;
  headEmployeeId?: string;
  headEmployeeName?: string;
  description: string;
  totalEmployees: number;
  budgetAllocated?: number;
  fundingSourceId?: string;
  fundingSourceName?: string;
  lastAllocatedAt?: string;
  allocatedBy?: string;
}

export interface TreasuryAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  accountType: "CENTRAL_OPERATING" | "REVENUE_TREASURY" | "DONOR_GRANT" | "RESERVE_FUND";
  totalFund: number;
  allocatedFund?: number;
  currency: string;
  description: string;
}

export interface Designation {
  id: string;
  title: string;
  code: string;
  departmentId: string;
  departmentName: string;
  level: "ENTRY" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE";
  minSalary: number;
  maxSalary: number;
  description: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string; // "09:00"
  endTime: string; // "18:00"
  gracePeriodMinutes: number;
  halfDayAfterMinutes: number;
  breakDurationMinutes: number;
  weekendDays: number[]; // 0=Sun, 5=Fri, 6=Sat
  isRotational: boolean;
  isFlexible: boolean;
}

export interface EmployeeDocument {
  id: string;
  name: string;
  type: "CV" | "NID" | "PASSPORT" | "EDUCATIONAL_CERTIFICATE" | "APPOINTMENT_LETTER" | "JOINING_LETTER" | "EXPERIENCE_CERTIFICATE" | "OTHER";
  fileUrl: string;
  uploadDate: string;
  fileSize: string;
}

export interface SalaryBreakdown {
  basic: number;
  houseRent: number;
  medicalAllowance: number;
  transportAllowance: number;
  specialAllowance: number;
  providentFundPercentage: number;
  taxDeductionPercentage: number;
  grossSalary: number;
}

export interface Employee {
  id: string;
  employeeCode: string;
  companyId: string;
  branchId: string;
  branchName: string;
  departmentId: string;
  departmentName: string;
  designationId: string;
  designationTitle: string;
  role: UserRole;
  
  // Multiple Designations & Department Portfolios (NGO Multi-Role Allocation)
  additionalDesignations?: string[];
  additionalDepartments?: string[];
  secondaryRoleTitle?: string;
  isCeoOrOwner?: boolean;
  isSuperAdmin?: boolean;

  // Attendance & Salary Penalty Policies (Flexible for Field Staff & Fixed Salary)
  isAttendancePenaltyExempt?: boolean; // True = no late/early punch fine; flexible hours for field/volunteer staff
  flexibleHours?: boolean; // ৯-টু-৫ ডিউটির প্রয়োজন নেই, যখন মন চায় কাজ করতে পারবেন
  salaryProtected?: boolean; // স্যালারি ফিক্সড থাকবে, কোনো লেট বা জরিমানা কাটা যাবে না
  isFixedSalary?: boolean; // ফিক্সড স্যালারি
  isFixedContractSalary?: boolean; // চুক্তিবদ্ধ ফিক্সড স্যালারি
  salaryStructureType?: "FIXED" | "STANDARD_ALLOWANCES" | "CUSTOM";
  bonusEligibility?: "TWO_EIDS_FIXED" | "PERCENTAGE_BASIC" | "PERFORMANCE" | "NONE";
  fixedBonusAmount?: number;
  bonusPercentage?: number;

  // Employee Login Account & Privacy Credentials (Managed by Admin & Changeable by Employee)
  username?: string; // User ID / Account address (default to employeeCode or custom)
  password?: string; // Account password (changeable by employee, resettable by Super Admin)
  hideSalaryFromSelf?: boolean; // Super Admin toggle: if true, employee cannot view salary in Self-Service Portal
  passwordLastChangedAt?: string;
  
  // Personal Details
  fullName: string;
  email: string;
  phone: string;
  emergencyPhone?: string;
  avatarUrl: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  maritalStatus?: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
  nidNumber?: string;
  passportNumber?: string;
  presentAddress?: string;
  permanentAddress?: string;
  
  // Employment Details
  joiningDate: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACTUAL" | "INTERN" | "PROBATION";
  status: "ACTIVE" | "ON_LEAVE" | "SUSPENDED" | "RESIGNED" | "TERMINATED" | "PROBATION" | "EXITED";
  exitDate?: string; // প্রস্থান / ছেড়ে দেওয়ার তারিখ (যেমন ২০২৫ সালের তারিখ)
  exitReason?: string; // প্রতিষ্ঠান ছাড়ার কারণ
  isExited?: boolean; // সাবেক কর্মী চিহ্নিতকরণ
  deletedAt?: string; // ট্র্যাশ / ডিলিট হিস্ট্রি ট্র্যাকিং
  deletedBy?: string;
  shiftId?: string;
  shiftName?: string;
  reportingManagerId?: string;
  reportingManagerName?: string;
  
  // Bank & Payroll
  salary: SalaryBreakdown;
  bankName?: string;
  bankAccountNumber?: string;
  bkashOrNagadNumber?: string;
  
  // Face & Device Verification
  faceTemplateRegistered?: boolean;
  faceRegisteredAt?: string;
  faceRegisteredPhoto?: string;
  faceVerifiedAt?: string;
  faceVerificationScore?: number;
  faceVerified?: boolean;
  faceVerificationRequired?: boolean;
  manuallyVerifiedByAdmin?: boolean;
  verifiedByAdminName?: string;
  isAttendanceExempt?: boolean; // CEO/Chairman or executive exempt from face attendance punching
  deviceBindingEnabled?: boolean;
  boundDeviceId?: string;
  boundDeviceModel?: string;

  // Account Visibility & Access Control
  allowedTabs?: string[]; // Specific tab IDs visible to this employee's account
  accountPermissions?: {
    canViewSalary?: boolean;
    canApplyLeaves?: boolean;
    canViewAttendanceLogs?: boolean;
    canAccessLoans?: boolean;
    canAccessProjects?: boolean;
    canAccessNotices?: boolean;
    canAccessAssets?: boolean;
    canAccessCertificates?: boolean;
    canAccessMeetings?: boolean;
    canAccessExit?: boolean;
  };
  
  // Stored Signature & Custom Signatory Title
  savedSignatureUrl?: string;
  customIssuerTitle?: string;
  customIssuerDesignation?: string;
  
  // Documents
  documents?: EmployeeDocument[];
}

export interface AntiSpoofingResult {
  blinkDetected: boolean;
  smileDetected: boolean;
  headTurnLeftDetected: boolean;
  headTurnRightDetected: boolean;
  livenessScore: number;
  passed: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  avatarUrl: string;
  branchId: string;
  branchName: string;
  departmentName: string;
  date: string;
  
  // Check In
  checkInTime?: string;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkInAddress?: string;
  checkInDistanceMeters?: number;
  checkInGeofencePassed?: boolean;
  checkInFaceMatchScore?: number;
  checkInAntiSpoofingPassed?: boolean;
  checkInSelfieUrl?: string;
  checkInDeviceId?: string;
  
  // Check Out
  checkOutTime?: string;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  checkOutAddress?: string;
  checkOutDistanceMeters?: number;
  checkOutGeofencePassed?: boolean;
  checkOutFaceMatchScore?: number;
  checkOutSelfieUrl?: string;
  
  // Calculated Work Times
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  overtimeMinutes: number;
  status: "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT" | "ON_LEAVE" | "HOLIDAY" | "WEEKEND";
  lateMinutes: number;
  earlyExitMinutes: number;
  verificationMethod: "FACE_GPS_LIVE" | "MANUAL_OVERRIDE" | "BIOMETRIC_API";
  auditNotes?: string;
}

export interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  avatarUrl?: string;
  branchId: string;
  branchName: string;
  departmentName: string;
  leaveType: "CASUAL" | "SICK" | "ANNUAL" | "MATERNITY" | "PATERNITY" | "UNPAID";
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachmentUrl?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  appliedDate: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerComments?: string;
}

export interface LeaveBalance {
  casualLeave: { total: number; used: number; remaining: number };
  sickLeave: { total: number; used: number; remaining: number };
  annualLeave: { total: number; used: number; remaining: number };
  maternityLeave: { total: number; used: number; remaining: number };
  paternityLeave: { total: number; used: number; remaining: number };
  unpaidLeave: { total: number; used: number; remaining: number };
}

export interface Holiday {
  id: string;
  name: string;
  type: "NATIONAL" | "FESTIVAL" | "COMPANY";
  startDate: string;
  endDate: string;
  totalDays: number;
  description: string;
  applicableBranchIds: string[];
}

export interface EmployeeLoan {
  id: string;
  employeeId: string;
  employeeName: string;
  branchName?: string;
  amount: number;
  monthlyEmi: number;
  totalInstallments: number;
  paidInstallments: number;
  remainingAmount: number;
  reason: string;
  applicationDate: string;
  disbursedDate?: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "ACTIVE" | "COMPLETED" | "PENDING_APPROVAL";
}

export interface Payslip {
  id: string;
  payrollMonth: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  avatarUrl: string;
  branchName: string;
  departmentName: string;
  designationTitle: string;
  
  // Working days statistics
  totalDaysInMonth: number;
  workingDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  holidayDays: number;
  overtimeHours: number;
  
  // Earnings
  basicSalary: number;
  houseRentAllowance: number;
  medicalAllowance: number;
  transportAllowance: number;
  specialAllowance: number;
  overtimePay: number;
  bonusAmount: number;
  grossEarnings: number;
  
  // Deductions
  providentFundDeduction: number;
  taxDeduction: number;
  latePenaltyDeduction: number;
  absenteeismDeduction: number;
  loanEmiDeduction: number;
  advanceSalaryDeduction: number;
  totalDeductions: number;
  
  // Final
  netSalary: number;
  paymentStatus: "DRAFT" | "PENDING_APPROVAL" | "PAID";
  paymentDate?: string;
  paymentMethod?: "BANK_TRANSFER" | "BKASH" | "NAGAD" | "CASH";
  transactionReference?: string;
}

export interface CompanyAsset {
  id: string;
  assetCode: string;
  name: string;
  category: "HARDWARE" | "LAPTOP" | "DESKTOP" | "MOBILE" | "SIM_CARD" | "VEHICLE" | "ACCESSORY" | "FURNITURE";
  serialNumber: string;
  purchaseDate: string;
  purchasePrice?: number;
  purchaseCost?: number;
  assignedToEmployeeId?: string;
  assignedToEmployeeName?: string;
  assignedToBranchName?: string;
  assignedBranchId?: string;
  assignmentDate?: string;
  condition: "NEW" | "BRAND_NEW" | "GOOD" | "FAIR" | "BAD" | "SEVERE" | "NEEDS_REPAIR" | "DAMAGED";
  status: "AVAILABLE" | "ASSIGNED" | "IN_REPAIR" | "DECOMMISSIONED";
  returnHistory?: {
    returnedBy: string;
    returnDate: string;
    conditionOnReturn: string;
    notes: string;
  }[];
}

export interface JobCircular {
  id: string;
  title: string;
  code?: string;
  branchId?: string;
  branchName?: string;
  departmentId?: string;
  departmentName?: string;
  employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACTUAL" | "INTERN";
  experienceRequired?: string;
  vacancies: number;
  salaryRange?: string;
  deadline?: string;
  status: "PUBLISHED" | "DRAFT" | "CLOSED" | "OPEN";
  description?: string;
  requirements: string[];
  totalApplicants?: number;
}
export type JobPosting = JobCircular;

export interface Candidate {
  id: string;
  jobCircularId?: string;
  jobPostingId?: string;
  jobTitle?: string;
  appliedRole?: string;
  fullName: string;
  email: string;
  phone?: string;
  
  // Personal & Bio-data
  fatherName?: string;
  motherName?: string;
  nidNumber?: string;
  dateOfBirth?: string;
  address?: string;
  gender?: string;
  
  // Academic Ladder (SSC, HSC, Honors, Masters)
  sscGpa?: number;
  sscInstitute?: string;
  sscBoard?: string;
  sscYear?: number | string;
  sscGroup?: string;
  
  hscGpa?: number;
  hscInstitute?: string;
  hscBoard?: string;
  hscYear?: number | string;
  hscGroup?: string;
  
  honorsCgpa?: number;
  honorsInstitute?: string;
  honorsDept?: string;
  honorsYear?: number | string;
  honorsDegree?: string;
  
  mastersCgpa?: number;
  mastersInstitute?: string;
  mastersDept?: string;
  mastersYear?: number | string;
  mastersDegree?: string;
  
  // Work Experience
  experienceYears?: number;
  currentDesignation?: string;
  experienceHistory?: string;
  
  expectedSalary?: number;
  cvUrl?: string;
  appliedDate?: string;
  stage: "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFERED" | "HIRED" | "REJECTED";
  interviewDate?: string;
  aiScore?: number;
  aiVerdict?: string;
  aiStrengths?: string[];
  aiGaps?: string[];
  skills?: string[];
  rating?: number;
  convertedToEmployeeId?: string;
  
  // Screening Status & Feedback
  screeningStatus?: "QUALIFIED" | "DISQUALIFIED" | "PENDING";
  screeningFailedReasons?: string[];
  screeningPassedReasons?: string[];
  importedFromSheet?: boolean;
  importBatchId?: string;
}

export interface ScreeningCriteria {
  minSscGpa: number;
  minHscGpa: number;
  minHonorsCgpa: number;
  requireMasters: boolean;
  minMastersCgpa: number;
  minExperienceYears: number;
  departmentKeywords?: string;
  maxExpectedSalary?: number;
}

export interface Project {
  id: string;
  name: string;
  code?: string;
  branchId?: string;
  branchName?: string;
  departmentId?: string;
  departmentName?: string;
  managerId?: string;
  managerName?: string;
  startDate?: string;
  deadline?: string;
  status?: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "DELAYED" | "IN_PROGRESS";
  progressPercentage: number;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  budget?: number;
  spentBudget?: number;
  teamMembers?: { id: string; name: string; avatarUrl: string; role: string }[];
  teamMemberIds?: string[];
  totalTasks?: number;
  completedTasks?: number;
  description?: string;
}

export interface Task {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description?: string;
  assignedToEmployeeId: string;
  assignedToName?: string;
  assignedToEmployeeName?: string;
  assignedToAvatar?: string;
  assigneeAvatarUrl?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "DONE" | "DELAYED";
  deadline?: string;
  dueDate?: string;
  estimatedHours: number;
  loggedHours: number;
  createdAt?: string;
}
export type ProjectTask = Task;

export interface CompanyBranding {
  companyName: string;
  companyNameBn: string;
  tagline: string;
  taglineBn: string;
  logoUrl?: string; // Base64 or URL for custom client logo
  address: string;
  addressBn?: string;
  phone: string;
  email: string;
  website: string;
  registrationNumber?: string;
  employeeIdPrefix?: string; // Client-configurable prefix, e.g. "MWO"
}

export interface Notice {
  id: string;
  memoNumber?: string; // স্মারক নং (e.g. WFHR/HQ/2026/09-082)
  language?: "bn" | "en"; // নোটিশের ভাষা (বাংলা বা English)
  title: string; // নোটিশ শিরোনাম / সারসংক্ষেপ
  subject?: string; // বিষয়
  category?: "HOLIDAY" | "EMERGENCY" | "PAYROLL" | "OFFICE_TIME" | "GENERAL" | "TRAINING" | "POLICY" | "CELEBRATION" | string;
  content: string; // নোটিশের বিস্তারিত বিবরণ / মূল বক্তব্য
  priority?: "NORMAL" | "HIGH" | "URGENT" | "CRITICAL";
  publishedBy?: string;
  publishedDate: string;
  authorName?: string;
  authorRole?: string;
  
  // Targeting Scope & Multi-Branch / Project Selection
  targetAudience?: string; // প্রাপক / যাদের জন্য প্রযোজ্য
  targetScope?: "ALL_BRANCHES" | "SPECIFIC_BRANCH" | "SPECIFIC_PROJECT";
  targetBranchIds?: string[]; // Multiple branch IDs
  targetBranchId?: string;
  targetBranchNames?: string[]; // Multiple branch names
  targetBranchName?: string;
  targetProjectIds?: string[]; // Multiple project IDs
  targetProjectId?: string; // 'ALL' or specific projectId
  targetProjectNames?: string[];
  targetProjectName?: string;
  targetDepartmentName?: string;
  
  // Official Letterhead & Signatory Clearance
  issuerName?: string; // স্বাক্ষরকারীর নাম
  issuerDesignation?: string; // পদবী
  issuerDepartment?: string; // বিভাগ
  issuerBranch?: string; // শাখা
  issuerOrganization?: string; // প্রতিষ্ঠানের নাম
  signatureImageUrl?: string; // পিএনজি/জেপিজি/ওয়েবপি ডিজিটাল স্বাক্ষর
  
  // Organization Letterhead branding
  companyLogoUrl?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  
  expiresDate?: string;
  attachmentUrl?: string;
  isPinned?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: string;
  recipientId?: string;
  recipientName?: string;
  channelName?: string;
  channel?: string;
  channelType?: "DIRECT" | "CHANNEL" | "GROUP" | "DEPARTMENT" | "PROJECT";
  groupId?: string;
  groupName?: string;
  projectId?: string;
  departmentName?: string;
  content?: string;
  message?: string;
  timestamp: string;
  attachmentUrl?: string;
  read?: boolean;
}

export type CertificateType =
  | "NOC"
  | "NOC_LETTER"
  | "EXPERIENCE_CERTIFICATE"
  | "APPOINTMENT_LETTER"
  | "OFFER_LETTER"
  | "PROMOTION_LETTER"
  | "TRANSFER_LETTER"
  | "WARNING_LETTER"
  | "SALARY_CERTIFICATE"
  | "RELIEVING_LETTER"
  | "RELEASE_LETTER"
  | "INCREMENT_LETTER"
  | "INTERNSHIP_COMPLETION"
  | "RECOMMENDATION_LETTER";

export interface CertificateRecord {
  id: string;
  referenceNumber?: string;
  certificateNumber?: string;
  title?: string;
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  designationTitle?: string;
  departmentName?: string;
  branchName?: string;
  type: CertificateType;
  issueDate: string;
  issuedBy?: string;
  authorizedSignatory?: string;
  signatoryTitle?: string;
  customDetails?: Record<string, string>;
  generatedContent?: string;
  contentHtml?: string;
  verifiedQrCode?: string;
  status?: "ISSUED" | "DRAFT" | "REVOKED";
}

export interface ExitRecord {
  id: string;
  employeeId: string;
  employeeCode?: string;
  employeeName: string;
  avatarUrl?: string;
  branchName?: string;
  departmentName?: string;
  designationTitle?: string;
  resignationDate?: string;
  noticePeriodDays?: number;
  lastWorkingDay?: string;
  reason?: string;
  exitType?: "RESIGNATION" | "TERMINATION" | "RETIREMENT";
  noticeDate?: string;
  exitInterviewNotes?: string;
  assetClearancePassed?: boolean;
  departmentClearancePassed?: boolean;
  accountsClearancePassed?: boolean;
  gratuityAmount?: number;
  providentFundRefund?: number;
  unusedLeaveEncashment?: number;
  totalSettlementAmount?: number;
  status: "INITIATED" | "NOTICE_PERIOD" | "CLEARANCE_IN_PROGRESS" | "SETTLED" | "COMPLETED";
  clearanceStatus?: {
    itClearance: boolean;
    accountsClearance: boolean;
    adminClearance: boolean;
    hrClearance: boolean;
  };
  finalSettlement?: {
    pendingSalary: number;
    gratuityAmount: number;
    leaveEncashment: number;
    providentFundRefund: number;
    deductions: number;
    netPayable: number;
    settlementStatus: string;
  };
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  branchName?: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  deviceInfo: string;
  status?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ALERT";
  module: string;
  timestamp: string;
  targetRole?: UserRole;
  targetEmployeeId?: string;
  read: boolean;
  link?: string;
}

// NGO Humanitarian & Relief Aid Program Scope
export interface ReliefProgram {
  id: string;
  name: string;
  nameBn: string;
  category: "WATER_WELL" | "WINTER_AID" | "FOOD_DISTRIBUTION" | "EDUCATION_SUPPORT" | "SHELTER_HOUSING" | "OTHER";
  code: string;
  projectManagerId?: string;
  projectManagerName?: string;
  fieldOperationsManagerId?: string;
  fieldOperationsManagerName?: string;
  fieldStaffNames?: string[];
  targetDistricts: string[];
  allocatedBudget: number;
  spentBudget: number;
  targetBeneficiaries: number;
  servedBeneficiaries: number;
  startDate: string;
  endDate?: string;
  status: "PLANNING" | "ACTIVE" | "COMPLETED";
  description: string;
  unitsCompleted?: number;
  targetUnits?: number;
  unitLabel?: string; // e.g. "টি গভীর নলকূপ", "পরিবার", "টি কম্বল"
}

// NGO District Vocational Training Center attached to Branches
export interface TrainingCenter {
  id: string;
  branchId: string;
  branchName: string;
  district: string;
  name: string;
  nameBn: string;
  code: string;
  leadInstructorId?: string;
  leadInstructorName?: string;
  status: "ACTIVE" | "UPCOMING" | "INACTIVE";
  totalEnrolled: number;
  totalGraduated: number;
  jobsFacilitated: number; // কর্মসংস্থান সংখ্যা
  contactPhone: string;
  address: string;
  courses: {
    id: string;
    title: string;
    titleBn: string;
    duration: string;
    capacity: number;
    currentBatchTrainees: number;
    instructorName: string;
    jobPlacementPartner?: string;
  }[];
}

// NGO Microfinance & Savings Project
export interface MicrofinanceProject {
  id: string;
  name: string;
  nameBn: string;
  code: string;
  branchId: string;
  branchName: string;
  managerName: string;
  totalDisbursedLoan: number;
  totalSavingsDeposits: number;
  activeBorrowers: number;
  recoveryRatePercent: number;
  status: "ACTIVE" | "EXPANDING";
}

// Special Meeting, Conference, Seminar & Field Programs
export interface MeetingAttendeeRecord {
  employeeId: string;
  employeeName: string;
  designationTitle: string;
  departmentName: string;
  date: string;
  checkInTime?: string;
  status: "ON_TIME" | "LATE" | "ABSENT" | "EXCUSED";
  engagementRating?: number; // 1-5 rating of focus and participation
  feedbackNotes?: string;
}

export interface MeetingConference {
  id: string;
  title: string;
  titleBn: string;
  type: "MEETING" | "CONFERENCE" | "SEMINAR" | "FIELD_PROGRAM" | "WORKSHOP";
  durationPreset: "SINGLE_DAY" | "THREE_DAYS" | "ONE_WEEK" | "FIFTEEN_DAYS" | "THIRTY_DAYS" | "CUSTOM";
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  startTime: string; // "10:00" or "12:00"
  reportingTime: string; // "09:30" or "11:30"
  location: string;
  branchId?: string;
  branchName?: string;
  leadOrganizerName: string;
  leadOrganizerDesignation?: string;
  description: string;
  participatingDepartments?: string[];
  assignedEmployeeIds?: string[];
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "POSTPONED";
  attendanceRecords: MeetingAttendeeRecord[];
}

// System Role Permissions Matrix Definition
export interface RolePermissionConfig {
  role: UserRole;
  roleTitleBn: string;
  roleTitleEn: string;
  descriptionBn: string;
  canAccessAllBranches: boolean;
  allowedNavTabs: NavigationTab[];
  canEditEmployees: boolean;
  canDeleteEmployees: boolean;
  canManageDepartments: boolean;
  canManageBranches: boolean;
  canApproveLeaves: boolean;
  canManagePayroll: boolean;
  canConfigurePolicies: boolean;
  canViewAuditLogs: boolean;
}

// Dynamic Custom Festival Bonus & Allowance Model
export interface CustomBonusConfig {
  id: string;
  title: string; // e.g., "ঈদ-উল-ফিতর উৎসব বোনাস", "পহেলা বৈশাখী ভাতা (Pohela Boishakh)", "শারদীয় দুর্গাপূজা উৎসব ভাতা", "বার্ষিক পারফরম্যান্স ইনসেন্টিভ"
  category: "EID_UL_FITR" | "EID_UL_ADHA" | "BOISHAKHI" | "PUJA" | "PERFORMANCE" | "YEAR_END" | "SPECIAL_ALLOWANCE" | "OTHER" | "POHELA_BOISHAKH" | "DURGA_PUJA";
  effectiveMonth: string; // "YYYY-MM", e.g. "2026-04" or "2026-06"
  effectiveDate?: string; // e.g. "2026-04-14"
  calculationType: "PERCENTAGE" | "FIXED_AMOUNT";
  amountOrPercentage?: number; // e.g. 50 (50% of Basic) or 15000 (৳15,000 fixed)
  percentageRate?: number;
  fixedAmount?: number;
  maxCap?: number; // Optional maximum ceiling
  maxCapAmount?: number;
  targetEligibility: "ALL_EMPLOYEES" | "MUSLIM_ONLY" | "HINDU_ONLY" | "CUSTOM_DEPARTMENT" | "PERMANENT_ONLY";
  targetDepartmentId?: string;
  targetDepartmentName?: string;
  status: "ACTIVE" | "SCHEDULED" | "COMPLETED";
  description?: string;
  notes?: string;
  createdAt?: string;
  authorizedBy?: string;
}

// Global Super Admin Payroll & Attendance Penalty Policy
export interface PayrollPolicyConfig {
  id: string;
  twoEidsFixedBonusAmount: number; // e.g. ৳15,000 per Eid
  percentageBonusRate: number; // e.g. 50% of Basic
  bonusMaxCap: number; // e.g. ৳50,000 max cap
  isBonusFixedAmount: boolean; // True = fixed amount, False = percentage
  activeBonusTitle: string; // e.g. "বাৎসরিক ২ ঈদ ফিক্সড বোনাস (Two Eids Fixed Festival Bonus)"
  latePenaltyEnabled: boolean; // Whether penalty is cut
  latePenaltyPercentage: number; // e.g. 1% or 2% per late arrival
  lateGracePeriodMinutes: number; // e.g. 15 minutes
  exemptFieldStaffFromPenalty: boolean; // Default true: Field and flexible staff have no penalty
  fixedSalaryStaffNoDeductions: boolean; // Default true: staff on fixed salary get no deductions
  effectiveYear: number;
  customBonuses?: CustomBonusConfig[]; // Dynamic custom festival bonuses & allowances
}

