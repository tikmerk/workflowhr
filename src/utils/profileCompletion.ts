import { Employee } from "../types";

export interface ProfileCompletionItem {
  id: string;
  category: "personal" | "contact" | "identity" | "cv" | "financial_biometric";
  labelEn: string;
  labelBn: string;
  isCompleted: boolean;
  weight: number;
  valueSummary?: string;
  hintBn: string;
}

export interface ProfileCategoryScore {
  category: "personal" | "contact" | "identity" | "cv" | "financial_biometric";
  titleEn: string;
  titleBn: string;
  score: number; // 0 to 100%
  earnedWeight: number;
  totalWeight: number;
  totalItems: number;
  completedItems: number;
}

export interface ProfileCompletionReport {
  percentage: number; // 0 - 100
  status: "COMPLETE" | "EXCELLENT" | "MODERATE" | "CRITICAL";
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  barColor: string;
  statusTextBn: string;
  statusTextEn: string;
  totalWeight: number;
  earnedWeight: number;
  items: ProfileCompletionItem[];
  missingItems: ProfileCompletionItem[];
  completedItems: ProfileCompletionItem[];
  categories: ProfileCategoryScore[];
}

export interface ProfileStatsSummary {
  totalEmployees: number;
  averagePercentage: number;
  completeCount: number; // 100%
  almostCompleteCount: number; // 75-99%
  moderateCount: number; // 50-74%
  criticalIncompleteCount: number; // < 50%
}

/**
 * Calculates the complete profile & CV completion status and percentage for an employee.
 */
export function calculateEmployeeProfileCompletion(emp: Employee): ProfileCompletionReport {
  const cv = emp.cvData;

  // 1. Personal Details (24 pts)
  const hasFullName = Boolean(emp.fullName && emp.fullName.trim().length >= 3);
  const hasAvatar = Boolean(
    emp.avatarUrl &&
    emp.avatarUrl.trim().length > 10 &&
    !emp.avatarUrl.includes("placeholder-avatar") &&
    !emp.avatarUrl.includes("default-avatar")
  );
  const hasFatherName = Boolean(
    (emp.fatherName && emp.fatherName.trim().length >= 2) ||
    (cv?.fatherName && cv.fatherName.trim().length >= 2)
  );
  const hasMotherName = Boolean(
    (emp.motherName && emp.motherName.trim().length >= 2) ||
    (cv?.motherName && cv.motherName.trim().length >= 2)
  );
  const hasDob = Boolean(emp.dateOfBirth || cv?.dateOfBirth);
  const hasBloodAndGender = Boolean(
    (emp.bloodGroup || cv?.bloodGroup) &&
    (emp.gender || cv?.gender)
  );

  // 2. Contact & Addresses (20 pts)
  const hasContact = Boolean(
    ((emp.phone && emp.phone.trim().length >= 6) || (cv?.mobile && cv.mobile.trim().length >= 6)) &&
    ((emp.email && emp.email.includes("@")) || (cv?.email && cv.email.includes("@")))
  );
  const hasEmergencyPhone = Boolean(emp.emergencyPhone && emp.emergencyPhone.trim().length >= 6);
  const hasPresentAddress = Boolean(
    (emp.presentAddress && emp.presentAddress.trim().length >= 5) ||
    (cv?.presentAddress && cv.presentAddress.trim().length >= 5)
  );
  const hasPermanentAddress = Boolean(
    (emp.permanentAddress && emp.permanentAddress.trim().length >= 5) ||
    (cv?.permanentAddress && cv.permanentAddress.trim().length >= 5)
  );

  // 3. Identity & Documents (18 pts)
  const hasNidNumber = Boolean(
    (emp.nidNumber && emp.nidNumber.trim().length >= 6) ||
    (emp.passportNumber && emp.passportNumber.trim().length >= 5) ||
    (cv?.nidNumber && cv.nidNumber.trim().length >= 6)
  );
  const hasNidPhotos = Boolean(
    ((emp.nidCardFrontUrl || cv?.nidCardFrontUrl) && (emp.nidCardBackUrl || cv?.nidCardBackUrl)) ||
    (emp.documents && emp.documents.some((d) => d.type === "NID"))
  );
  const hasSignature = Boolean(
    emp.savedSignatureUrl ||
    emp.signatureUrl ||
    cv?.signatureUrl
  );

  // 4. CV & Qualifications (28 pts)
  const hasSummary = Boolean(
    (cv?.summary && cv.summary.trim().length >= 15 && !cv.summary.includes("is an active employee at this organization")) ||
    (emp.documents && emp.documents.some((d) => d.type === "CV"))
  );
  const hasEducation = Boolean(
    (cv?.educations && cv.educations.length > 0 && cv.educations.some((e) => e.degreeName && e.degreeName.trim().length > 0)) ||
    (emp.documents && emp.documents.some((d) => d.type === "EDUCATIONAL_CERTIFICATE" || d.type === "CV"))
  );
  const hasExperience = Boolean(
    (cv?.experiences && cv.experiences.length > 0 && cv.experiences.some((e) => e.organizationName && e.organizationName.trim().length > 0)) ||
    (emp.documents && emp.documents.some((d) => d.type === "EXPERIENCE_CERTIFICATE" || d.type === "APPOINTMENT_LETTER")) ||
    emp.employmentType === "INTERN"
  );
  const hasSkills = Boolean(
    (cv?.computerSkills && cv.computerSkills.length > 0) ||
    (cv?.professionalSkills && cv.professionalSkills.length > 0)
  );
  const hasLanguageOrSocial = Boolean(
    (cv?.languages && cv.languages.length > 0) ||
    emp.socialLink ||
    emp.linkedinUrl ||
    cv?.socialLink ||
    cv?.linkedinUrl
  );

  // 5. Financial & Biometrics (10 pts)
  const hasBanking = Boolean(
    (emp.bankAccountNumber && emp.bankAccountNumber.trim().length >= 4) ||
    (emp.bkashOrNagadNumber && emp.bkashOrNagadNumber.trim().length >= 6) ||
    (emp.bankName && emp.bankName.trim().length >= 3)
  );
  const hasFaceEnrolled = Boolean(emp.faceTemplateRegistered);

  // Build items array
  const items: ProfileCompletionItem[] = [
    // Personal Details
    {
      id: "full_name",
      category: "personal",
      labelEn: "Full Name",
      labelBn: "পূর্ণ নাম",
      isCompleted: hasFullName,
      weight: 4,
      valueSummary: emp.fullName,
      hintBn: "কর্মীর অফিসিয়াল পুরো নাম লিখুন",
    },
    {
      id: "avatar",
      category: "personal",
      labelEn: "Profile Photo",
      labelBn: "প্রোফাইল ছবি",
      isCompleted: hasAvatar,
      weight: 4,
      valueSummary: hasAvatar ? "আপলোড করা আছে" : undefined,
      hintBn: "অফিসিয়াল পাসপোর্ট সাইজ ছবি আপলোড করুন",
    },
    {
      id: "father_name",
      category: "personal",
      labelEn: "Father's Name",
      labelBn: "পিতার নাম",
      isCompleted: hasFatherName,
      weight: 4,
      valueSummary: emp.fatherName || cv?.fatherName,
      hintBn: "পিতার নাম পূরণ করুন",
    },
    {
      id: "mother_name",
      category: "personal",
      labelEn: "Mother's Name",
      labelBn: "মাতার নাম",
      isCompleted: hasMotherName,
      weight: 4,
      valueSummary: emp.motherName || cv?.motherName,
      hintBn: "মাতার নাম পূরণ করুন",
    },
    {
      id: "dob",
      category: "personal",
      labelEn: "Date of Birth",
      labelBn: "জন্ম তারিখ",
      isCompleted: hasDob,
      weight: 4,
      valueSummary: emp.dateOfBirth || cv?.dateOfBirth,
      hintBn: "জাতীয় পরিচয়পত্র অনুযায়ী জন্মতারিখ দিন",
    },
    {
      id: "blood_gender",
      category: "personal",
      labelEn: "Blood Group & Gender",
      labelBn: "রক্তের গ্রুপ ও লিঙ্গ",
      isCompleted: hasBloodAndGender,
      weight: 4,
      valueSummary: emp.bloodGroup ? `${emp.bloodGroup}, ${emp.gender}` : undefined,
      hintBn: "রক্তের গ্রুপ ও লিঙ্গ সিলেক্ট করুন",
    },

    // Contact & Addresses
    {
      id: "contact",
      category: "contact",
      labelEn: "Phone & Email",
      labelBn: "মোবাইল ও ইমেইল",
      isCompleted: hasContact,
      weight: 5,
      valueSummary: emp.phone,
      hintBn: "সচল মোবাইল নম্বর ও অফিসিয়াল ইমেইল দিন",
    },
    {
      id: "emergency_phone",
      category: "contact",
      labelEn: "Emergency Contact",
      labelBn: "জরুরী যোগাযোগ নম্বর",
      isCompleted: hasEmergencyPhone,
      weight: 5,
      valueSummary: emp.emergencyPhone,
      hintBn: "জরুরী প্রয়োজনে যোগাযোগের ফোন নম্বর",
    },
    {
      id: "present_address",
      category: "contact",
      labelEn: "Present Address",
      labelBn: "বর্তমান ঠিকানা",
      isCompleted: hasPresentAddress,
      weight: 5,
      valueSummary: emp.presentAddress || cv?.presentAddress,
      hintBn: "বর্তমান বসবাসের ঠিকানা দিন",
    },
    {
      id: "permanent_address",
      category: "contact",
      labelEn: "Permanent Address",
      labelBn: "স্থায়ী ঠিকানা",
      isCompleted: hasPermanentAddress,
      weight: 5,
      valueSummary: emp.permanentAddress || cv?.permanentAddress,
      hintBn: "গ্রাম/রোড, থানা, জেলা সহ স্থায়ী ঠিকানা দিন",
    },

    // Identity & Documents
    {
      id: "nid_number",
      category: "identity",
      labelEn: "NID / Passport Number",
      labelBn: "জাতীয় পরিচয়পত্র নম্বর (NID)",
      isCompleted: hasNidNumber,
      weight: 6,
      valueSummary: emp.nidNumber || emp.passportNumber || cv?.nidNumber,
      hintBn: "১০/১৩/১৭ ডিজিটের জাতীয় পরিচয়পত্র নম্বর দিন",
    },
    {
      id: "nid_photos",
      category: "identity",
      labelEn: "NID Card Photos (Front & Back)",
      labelBn: "NID কার্ডের সামনের ও পেছনের ছবি",
      isCompleted: hasNidPhotos,
      weight: 6,
      valueSummary: hasNidPhotos ? "সংযুক্ত আছে" : undefined,
      hintBn: "NID ফ্রন্ট ও ব্যাক পার্টের স্পষ্ট স্ক্যান/ছবি দিন",
    },
    {
      id: "signature",
      category: "identity",
      labelEn: "Digital Signature",
      labelBn: "ডিজিটাল স্বাক্ষর",
      isCompleted: hasSignature,
      weight: 6,
      valueSummary: hasSignature ? "সংরক্ষিত" : undefined,
      hintBn: "অফিসিয়াল ডিজিটাল সিগনেচার আপলোড করুন",
    },

    // CV & Qualifications
    {
      id: "cv_summary",
      category: "cv",
      labelEn: "CV Professional Summary",
      labelBn: "সিভি ক্যারিয়ার উদ্দেশ্য / সারসংক্ষেপ",
      isCompleted: hasSummary,
      weight: 5,
      valueSummary: cv?.summary ? `${cv.summary.slice(0, 30)}...` : undefined,
      hintBn: "পেশাগত ক্যারিয়ার অবজেক্টিভ বা সারসংক্ষেপ লিখুন",
    },
    {
      id: "cv_education",
      category: "cv",
      labelEn: "Educational Qualifications",
      labelBn: "শিক্ষাগত যোগ্যতা (ডিগ্রি ও প্রতিষ্ঠান)",
      isCompleted: hasEducation,
      weight: 8,
      valueSummary: cv?.educations?.[0]
        ? `${cv.educations[0].degreeName} (${cv.educations[0].institution})`
        : undefined,
      hintBn: "ন্যূনতম একটি শিক্ষাগত ডিগ্রির বিস্তারিত তথ্য যোগ করুন",
    },
    {
      id: "cv_experience",
      category: "cv",
      labelEn: "Work Experience",
      labelBn: "কাজের অভিজ্ঞতা / কর্মজীবন",
      isCompleted: hasExperience,
      weight: 6,
      valueSummary: cv?.experiences?.[0]
        ? `${cv.experiences[0].designation} (${cv.experiences[0].organizationName})`
        : emp.employmentType === "INTERN"
        ? "ইন্টার্নশিপ"
        : undefined,
      hintBn: "পূর্ববর্তী বা বর্তমান কাজের অভিজ্ঞতার তথ্য যোগ করুন",
    },
    {
      id: "cv_skills",
      category: "cv",
      labelEn: "Computer & Professional Skills",
      labelBn: "কম্পিউটার ও পেশাগত দক্ষতা (Skills)",
      isCompleted: hasSkills,
      weight: 5,
      valueSummary:
        cv?.computerSkills && cv.computerSkills.length > 0
          ? `${cv.computerSkills.length} টি স্কিল`
          : undefined,
      hintBn: "কম্পিউটার ও প্রফেশনাল স্কিলস নির্বাচন করুন",
    },
    {
      id: "cv_languages",
      category: "cv",
      labelEn: "Languages & LinkedIn/Social",
      labelBn: "ভাষা জ্ঞান ও লিঙ্কডইন প্রোফাইল",
      isCompleted: hasLanguageOrSocial,
      weight: 4,
      valueSummary:
        cv?.languages && cv.languages.length > 0
          ? `${cv.languages.length} টি ভাষা`
          : emp.linkedinUrl || cv?.linkedinUrl || emp.socialLink,
      hintBn: "ভাষাগত দক্ষতা বা সোশ্যাল প্রোফাইল লিংক দিন",
    },

    // Financial & Biometrics
    {
      id: "banking",
      category: "financial_biometric",
      labelEn: "Bank or Mobile Banking (bKash/Nagad)",
      labelBn: "ব্যাংক একাউন্ট বা বিকাশ/নগদ নম্বর",
      isCompleted: hasBanking,
      weight: 5,
      valueSummary:
        emp.bankAccountNumber || emp.bkashOrNagadNumber || emp.bankName,
      hintBn: "বেতন প্রাপ্তির ব্যাংক একাউন্ট বা মোবাইল ব্যাংকিং নম্বর",
    },
    {
      id: "face_biometric",
      category: "financial_biometric",
      labelEn: "Biometric Face Enrolled",
      labelBn: "বায়োমেট্রিক ফেস রেজিস্ট্রেশন",
      isCompleted: hasFaceEnrolled,
      weight: 5,
      valueSummary: hasFaceEnrolled ? "এনরোল্ড" : undefined,
      hintBn: "ডিজিটাল হাজিরা নিশ্চিত করতে ফেস এনরোল করুন",
    },
  ];

  let earnedWeight = 0;
  const missingItems: ProfileCompletionItem[] = [];
  const completedItems: ProfileCompletionItem[] = [];

  for (const item of items) {
    if (item.isCompleted) {
      earnedWeight += item.weight;
      completedItems.push(item);
    } else {
      missingItems.push(item);
    }
  }

  // Calculate percentage: exactly 0 - 100
  const percentage = Math.min(100, Math.max(0, Math.round(earnedWeight)));

  // Category breakdown calculation
  const categoryDefs: Array<{
    category: "personal" | "contact" | "identity" | "cv" | "financial_biometric";
    titleEn: string;
    titleBn: string;
  }> = [
    { category: "personal", titleEn: "Personal Information", titleBn: "ব্যক্তিগত তথ্য" },
    { category: "contact", titleEn: "Contact & Address", titleBn: "যোগাযোগ ও ঠিকানা" },
    { category: "identity", titleEn: "Identification & Documents", titleBn: "পরিচয়পত্র ও ডকুমেন্টস" },
    { category: "cv", titleEn: "CV & Qualifications", titleBn: "সিভি ও শিক্ষাগত যোগ্যতা" },
    { category: "financial_biometric", titleEn: "Banking & Biometrics", titleBn: "ব্যাংকিং ও বায়োমেট্রিক" },
  ];

  const categories: ProfileCategoryScore[] = categoryDefs.map((cd) => {
    const catItems = items.filter((i) => i.category === cd.category);
    const catTotalWeight = catItems.reduce((acc, i) => acc + i.weight, 0);
    const catEarnedWeight = catItems
      .filter((i) => i.isCompleted)
      .reduce((acc, i) => acc + i.weight, 0);
    const catCompletedCount = catItems.filter((i) => i.isCompleted).length;
    const catScore = catTotalWeight > 0 ? Math.round((catEarnedWeight / catTotalWeight) * 100) : 0;

    return {
      category: cd.category,
      titleEn: cd.titleEn,
      titleBn: cd.titleBn,
      score: catScore,
      earnedWeight: catEarnedWeight,
      totalWeight: catTotalWeight,
      totalItems: catItems.length,
      completedItems: catCompletedCount,
    };
  });

  // Status mapping
  let status: "COMPLETE" | "EXCELLENT" | "MODERATE" | "CRITICAL";
  let badgeBg: string;
  let badgeText: string;
  let badgeBorder: string;
  let barColor: string;
  let statusTextBn: string;
  let statusTextEn: string;

  if (percentage === 100) {
    status = "COMPLETE";
    badgeBg = "bg-emerald-500/15";
    badgeText = "text-emerald-700 dark:text-emerald-300";
    badgeBorder = "border-emerald-500/30";
    barColor = "bg-emerald-500";
    statusTextBn = "১০০% সম্পূর্ণ";
    statusTextEn = "100% Complete";
  } else if (percentage >= 75) {
    status = "EXCELLENT";
    badgeBg = "bg-teal-500/15";
    badgeText = "text-teal-700 dark:text-teal-300";
    badgeBorder = "border-teal-500/30";
    barColor = "bg-teal-500";
    statusTextBn = `সন্তোষজনক (${percentage}%)`;
    statusTextEn = `Good (${percentage}%)`;
  } else if (percentage >= 45) {
    status = "MODERATE";
    badgeBg = "bg-amber-500/15";
    badgeText = "text-amber-700 dark:text-amber-300";
    badgeBorder = "border-amber-500/30";
    barColor = "bg-amber-500";
    statusTextBn = `অসম্পূর্ণ (${percentage}%)`;
    statusTextEn = `Partial (${percentage}%)`;
  } else {
    status = "CRITICAL";
    badgeBg = "bg-rose-500/15";
    badgeText = "text-rose-700 dark:text-rose-300";
    badgeBorder = "border-rose-500/30";
    barColor = "bg-rose-500";
    statusTextBn = `অতি জরুরি (${percentage}%)`;
    statusTextEn = `Urgent (${percentage}%)`;
  }

  return {
    percentage,
    status,
    badgeBg,
    badgeText,
    badgeBorder,
    barColor,
    statusTextBn,
    statusTextEn,
    totalWeight: 100,
    earnedWeight,
    items,
    missingItems,
    completedItems,
    categories,
  };
}

/**
 * Calculates aggregate profile stats for an entire employee directory.
 */
export function calculateEmployeesProfileStats(employees: Employee[]): ProfileStatsSummary {
  if (!employees || employees.length === 0) {
    return {
      totalEmployees: 0,
      averagePercentage: 0,
      completeCount: 0,
      almostCompleteCount: 0,
      moderateCount: 0,
      criticalIncompleteCount: 0,
    };
  }

  let totalPercentage = 0;
  let completeCount = 0;
  let almostCompleteCount = 0;
  let moderateCount = 0;
  let criticalIncompleteCount = 0;

  for (const emp of employees) {
    const report = calculateEmployeeProfileCompletion(emp);
    totalPercentage += report.percentage;

    if (report.percentage === 100) {
      completeCount++;
    } else if (report.percentage >= 75) {
      almostCompleteCount++;
    } else if (report.percentage >= 45) {
      moderateCount++;
    } else {
      criticalIncompleteCount++;
    }
  }

  const averagePercentage = Math.round(totalPercentage / employees.length);

  return {
    totalEmployees: employees.length,
    averagePercentage,
    completeCount,
    almostCompleteCount,
    moderateCount,
    criticalIncompleteCount,
  };
}

/**
 * Generates an official, polite HR reminder notice message that Super Admin can copy or send.
 */
export function generateEmployeeProfileReminderMessage(
  emp: Employee,
  report: ProfileCompletionReport,
  isBangla: boolean = true
): string {
  if (isBangla) {
    const missingList = report.missingItems
      .map((item, idx) => `  ${idx + 1}. ${item.labelBn} (${item.hintBn})`)
      .join("\n");

    return `[অফিসিয়াল এইচআর নোটিশ - প্রোফাইল ও সিভি পূরণ রিমাইন্ডার]
তারিখ: ${new Date().toLocaleDateString("bn-BD")}
প্রাপক: ${emp.fullName} (${emp.designationTitle}, ${emp.employeeCode})
প্রতিষ্ঠান: ${emp.branchName || "হেড অফিস"}

প্রিয় ${emp.fullName},
সুপার অ্যাডমিন ও এইচআর ড্যাশবোর্ড থেকে নিরীক্ষা করে দেখা গেছে যে, সিস্টেমে আপনার প্রোফাইল ও সিভি বর্তমানে ${report.percentage}% পূরণ করা হয়েছে (${report.statusTextBn})।

এখনও আপনার প্রোফাইলে নিম্নোক্ত প্রয়োজনীয় তথ্য ও ডকুমেন্টসগুলো অসম্পূর্ণ রয়েছে:
${missingList}

দয়া করে দ্রুত আপনার Employee Self-Service (ESS) পোর্টালে লগইন করে 'এডিট সিভি (Edit CV)' এবং 'প্রোফাইল তথ্য' অপশন থেকে উপরের তথ্যগুলো পরিপূর্ণভাবে পূরণ করুন। অন্যথায় অফিসিয়াল সার্ভিস রেকর্ড ও বার্ষিক মূল্যায়নে সমস্যা হতে পারে।

ধন্যবাদান্তে,
সুপার অ্যাডমিন / এইচআর প্রশাসন বিভাগ`;
  } else {
    const missingList = report.missingItems
      .map((item, idx) => `  ${idx + 1}. ${item.labelEn} (${item.hintBn})`)
      .join("\n");

    return `[OFFICIAL HR NOTICE - PROFILE & CV COMPLETION REMINDER]
Date: ${new Date().toLocaleDateString("en-US")}
To: ${emp.fullName} (${emp.designationTitle}, ${emp.employeeCode})
Organization: ${emp.branchName || "Head Office"}

Dear ${emp.fullName},
An audit of employee records indicates that your official profile and CV completion status currently stands at ${report.percentage}% (${report.statusTextEn}).

The following required information and documents are still missing:
${missingList}

Please log into your Employee Self-Service (ESS) portal and complete your profile via the 'Edit CV' and 'Edit Profile' sections as soon as possible to maintain compliant records.

Sincerely,
Super Admin / HR Administration Department`;
  }
}
