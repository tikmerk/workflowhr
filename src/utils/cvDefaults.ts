/**
 * CV Defaults and Standard Career Objectives
 * Crafted to be universally applicable for all organizational employees and roles.
 */

export const DEFAULT_CAREER_OBJECTIVE_BN =
  "প্রতিষ্ঠানের লক্ষ্য ও দৃষ্টিভঙ্গির সাথে একাত্ম হয়ে সততা, নিষ্ঠা ও পেশাগত দক্ষতার সর্বোচ্চ প্রয়োগের মাধ্যমে অর্পিত দায়িত্ব যথাযথভাবে পালন করতে আগ্রহী। নিরবচ্ছিন্ন প্রাতিষ্ঠানিক সেবা, দলগত সহযোগিতা ও কার্যকর যোগাযোগ দক্ষতার সমন্বয়ে সংস্থার টেকসই উন্নয়ন ও সামগ্রিক উৎকর্ষ সাধনে দৃঢ়ভাবে প্রতিশ্রুতিবদ্ধ।";

export const DEFAULT_CAREER_OBJECTIVE_EN =
  "A dedicated, results-oriented, and highly motivated professional seeking a responsible role to utilize proven organizational, communication, and operational capabilities in supporting corporate objectives. Committed to upholding strict institutional integrity, workplace ethics, and operational diligence while actively collaborating with cross-functional teams to drive continuous organizational excellence, community impact, and sustainable institutional growth in dynamic work environments.";

export const getDefaultCareerObjective = (isBangla: boolean = false): string => {
  return isBangla ? DEFAULT_CAREER_OBJECTIVE_BN : DEFAULT_CAREER_OBJECTIVE_EN;
};

/**
 * Standard 4-Tier Academic Degrees template (Master's, Bachelor's, HSC, SSC)
 * Provided so the A4 CV always formats flawlessly even with complete higher education history.
 */
export const getStandardEducationsTemplate = (isBangla: boolean = true) => [
  {
    id: "edu-mba",
    degreeName: isBangla ? "মাস্টার্স / এমবিএ (MBA / Master's)" : "Master of Business Administration (MBA)",
    subjectOrGroup: isBangla ? "ম্যানেজমেন্ট / ব্যবসায় প্রশাসন" : "Management / Business Studies",
    institution: isBangla ? "ঢাকা বিশ্ববিদ্যালয়" : "University of Dhaka",
    boardOrUniversity: isBangla ? "ঢাকা বিশ্ববিদ্যালয়" : "Dhaka University",
    result: "3.70 / 4.00",
    passingYear: "2022",
  },
  {
    id: "edu-bba",
    degreeName: isBangla ? "স্নাতক / বিবিএ (BBA / Bachelor's)" : "Bachelor of Business Administration (BBA)",
    subjectOrGroup: isBangla ? "হিসাববিজ্ঞান / ফিন্যান্স" : "Finance & Accounting",
    institution: isBangla ? "ঢাকা বিশ্ববিদ্যালয়" : "University of Dhaka",
    boardOrUniversity: isBangla ? "ঢাকা বিশ্ববিদ্যালয়" : "Dhaka University",
    result: "3.65 / 4.00",
    passingYear: "2020",
  },
  {
    id: "edu-hsc",
    degreeName: isBangla ? "উচ্চ মাধ্যমিক (HSC)" : "Higher Secondary Certificate (HSC)",
    subjectOrGroup: isBangla ? "ব্যবসায় শিক্ষা / বিজ্ঞান" : "Business Studies",
    institution: isBangla ? "ঢাকা সিটি কলেজ" : "Dhaka City College",
    boardOrUniversity: isBangla ? "ঢাকা শিক্ষা বোর্ড" : "Dhaka Board",
    result: "GPA 5.00",
    passingYear: "2016",
  },
  {
    id: "edu-ssc",
    degreeName: isBangla ? "মাধ্যমিক (SSC)" : "Secondary School Certificate (SSC)",
    subjectOrGroup: isBangla ? "বিজ্ঞান / সাধারণ" : "Science",
    institution: isBangla ? "আইডিয়াল স্কুল অ্যান্ড কলেজ" : "Ideal School and College",
    boardOrUniversity: isBangla ? "ঢাকা শিক্ষা বোর্ড" : "Dhaka Board",
    result: "GPA 5.00",
    passingYear: "2014",
  },
];
