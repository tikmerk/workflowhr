import * as XLSX from "xlsx";
import { Candidate, ScreeningCriteria } from "../types";

// Convert Bengali Numerals to English if present in sheets
export const parseNumberSafe = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  const str = String(val).trim();
  const banglaMap: Record<string, string> = {
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
    "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
  };
  const normalized = str.replace(/[০-৯]/g, (w) => banglaMap[w] || w);
  const matched = normalized.match(/[+-]?([0-9]*[.])?[0-9]+/);
  if (!matched) return 0;
  const num = parseFloat(matched[0]);
  return isNaN(num) ? 0 : num;
};

export interface MetadataFieldDefinition {
  key: string;
  banglaLabel: string;
  englishLabel: string;
  category: "PERSONAL" | "SSC" | "HSC" | "HONORS" | "MASTERS" | "EXPERIENCE" | "SALARY";
  acceptedAliases: string[];
  dataType: "string" | "number";
  sampleValue: string;
  description: string;
  isKeyCriteria?: boolean;
}

export type RecruitmentMetadataField = MetadataFieldDefinition;

// Complete Standard Metadata Catalog & Form Field Schema
export const RECRUITMENT_METADATA_FIELDS: MetadataFieldDefinition[] = [
  // 1. Personal Info
  {
    key: "fullName",
    banglaLabel: "প্রার্থীর পূর্ণ নাম",
    englishLabel: "Full Name",
    category: "PERSONAL",
    acceptedAliases: [
      "fullname", "full name", "name", "applicant name", "candidate name", "person name",
      "নাম", "প্রার্থীর নাম", "আবেদনকারীর নাম", "পূর্ণ নাম", "ক্যান্ডিডেট নাম", "applicant"
    ],
    dataType: "string",
    sampleValue: "Tariqul Islam / তারিকুল ইসলাম",
    description: "প্রার্থীর অফিসিয়াল বা পূর্ণ নাম",
    isKeyCriteria: true
  },
  {
    key: "phone",
    banglaLabel: "মোবাইল / যোগাযোগ নম্বর",
    englishLabel: "Phone Number",
    category: "PERSONAL",
    acceptedAliases: [
      "phone", "phone number", "mobile", "mobile number", "contact", "contact number", "cell", "cell number",
      "ফোন", "মোবাইল", "মোবাইল নম্বর", "ফোন নম্বর", "যোগাযোগ নম্বর", "মোবাইল নাম্বার"
    ],
    dataType: "string",
    sampleValue: "01711223344",
    description: "১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর"
  },
  {
    key: "email",
    banglaLabel: "ইমেইল অ্যাড্রেস",
    englishLabel: "Email Address",
    category: "PERSONAL",
    acceptedAliases: [
      "email", "email address", "e-mail", "mail", "ইমেইল", "ই-মেইল", "ইমেইল ঠিকানা", "ইমেল"
    ],
    dataType: "string",
    sampleValue: "candidate@gmail.com",
    description: "যোগাযোগের জন্য বৈধ ইমেইল আইডি"
  },
  {
    key: "nidNumber",
    banglaLabel: "জাতীয় পরিচয়পত্র নম্বর (NID)",
    englishLabel: "National ID (NID)",
    category: "PERSONAL",
    acceptedAliases: [
      "nid", "nid number", "national id", "national identity", "nid no",
      "জাতীয় পরিচয়পত্র", "জাতীয় পরিচয়পত্র", "জাতীয় পরিচয়পত্র নম্বর", "এনআইডি", "এন আইডি"
    ],
    dataType: "string",
    sampleValue: "19952691122334455",
    description: "১০, ১৩ বা ১৭ ডিজিটের এনআইডি বা জন্ম নিবন্ধন নম্বর"
  },
  {
    key: "fatherName",
    banglaLabel: "পিতার নাম",
    englishLabel: "Father's Name",
    category: "PERSONAL",
    acceptedAliases: [
      "father", "father name", "father's name", "fathers name", "পিতার নাম", "বাবার নাম", "পিতা", "বাবা"
    ],
    dataType: "string",
    sampleValue: "Md. Rafiqul Islam",
    description: "প্রার্থীর পিতার নাম"
  },
  {
    key: "motherName",
    banglaLabel: "মাতার নাম",
    englishLabel: "Mother's Name",
    category: "PERSONAL",
    acceptedAliases: [
      "mother", "mother name", "mother's name", "mothers name", "মাতার নাম", "মায়ের নাম", "মাতা", "মা"
    ],
    dataType: "string",
    sampleValue: "Rokeya Begum",
    description: "প্রার্থীর মাতার নাম"
  },
  {
    key: "address",
    banglaLabel: "বর্তমান ঠিকানা / জেলা",
    englishLabel: "Present Address",
    category: "PERSONAL",
    acceptedAliases: [
      "address", "present address", "permanent address", "location", "district", "city",
      "ঠিকানা", "বর্তমান ঠিকানা", "স্থায়ী ঠিকানা", "জেলা", "বাসার ঠিকানা"
    ],
    dataType: "string",
    sampleValue: "Dhanmondi, Dhaka",
    description: "প্রার্থীর বর্তমান বাসস্থান বা জেলার নাম"
  },

  // 2. SSC / Dakhil / O-Level
  {
    key: "sscGpa",
    banglaLabel: "এসএসসি / দাখিল / ও লেভেল জিপিএ",
    englishLabel: "SSC GPA (out of 5.0)",
    category: "SSC",
    acceptedAliases: [
      "ssc gpa", "ssc result", "ssc point", "ssc grade", "ssc gpa out of 5", "ssc", "ssc mark",
      "secondary school certificate gpa", "secondary school certificate result", "secondary school certificate",
      "সেকেন্ডারি স্কুল সার্টিফিকেট", "সেকেন্ডারি স্কুল", "ম্যাট্রিক", "ম্যাট্রিকুলেশন",
      "এসএসসি জিপিএ", "এসএসসি রেজাল্ট", "এসএসসি পয়েন্ট", "এস.এস.সি", "এসএসসি",
      "দাখিল জিপিএ", "দাখিল রেজাল্ট", "দাখিল", "ও লেভেল", "o level", "o-level", "matric"
    ],
    dataType: "number",
    sampleValue: "5.00 / 4.75",
    description: "এসএসসি পরীক্ষায় প্রাপ্ত জিপিএ (স্কেল ৫.০০)",
    isKeyCriteria: true
  },
  {
    key: "sscInstitute",
    banglaLabel: "এসএসসি শিক্ষা প্রতিষ্ঠান / স্কুল",
    englishLabel: "SSC School / Institute",
    category: "SSC",
    acceptedAliases: [
      "ssc school", "ssc institute", "ssc institution", "school name", "ssc college",
      "এসএসসি স্কুল", "এসএসসি প্রতিষ্ঠান", "বিদ্যালয়ের নাম", "মাদ্রাসার নাম", "স্কুলের নাম", "এসএসসি বিদ্যালয়"
    ],
    dataType: "string",
    sampleValue: "Dhaka Residential Model College",
    description: "এসএসসি পাসের স্কুলের নাম"
  },
  {
    key: "sscBoard",
    banglaLabel: "এসএসসি শিক্ষা বোর্ড",
    englishLabel: "SSC Education Board",
    category: "SSC",
    acceptedAliases: [
      "ssc board", "education board", "ssc edu board", "এসএসসি বোর্ড", "বোর্ড", "শিক্ষা বোর্ড"
    ],
    dataType: "string",
    sampleValue: "Dhaka / Rajshahi / Madrasah",
    description: "যে বোর্ডের অধীনে এসএসসি পরীক্ষা অনুষ্ঠিত হয়েছে"
  },
  {
    key: "sscYear",
    banglaLabel: "এসএসসি পাসের সাল",
    englishLabel: "SSC Passing Year",
    category: "SSC",
    acceptedAliases: [
      "ssc year", "ssc passing year", "ssc pass year", "এসএসসি পাসের সন", "এসএসসি পাসের সাল", "এসএসসি সন", "এসএসসি সাল"
    ],
    dataType: "string",
    sampleValue: "2013",
    description: "এসএসসি পাসের বছর"
  },
  {
    key: "sscGroup",
    banglaLabel: "এসএসসি বিভাগ (গ্রুপ)",
    englishLabel: "SSC Group / Background",
    category: "SSC",
    acceptedAliases: [
      "ssc group", "ssc background", "group", "এসএসসি গ্রুপ", "এসএসসি বিভাগ", "গ্রুপ", "বিভাগ"
    ],
    dataType: "string",
    sampleValue: "Science / Business Studies / Humanities",
    description: "বিজ্ঞান, ব্যবসায় শিক্ষা অথবা মানবিক"
  },

  // 3. HSC / Alim / A-Level
  {
    key: "hscGpa",
    banglaLabel: "এইচএসসি / আলিম / এ লেভেল জিপিএ",
    englishLabel: "HSC GPA (out of 5.0)",
    category: "HSC",
    acceptedAliases: [
      "hsc gpa", "hsc result", "hsc point", "hsc grade", "hsc gpa out of 5", "hsc",
      "higher secondary certificate gpa", "higher secondary certificate result", "higher secondary certificate",
      "হায়ার সেকেন্ডারি সার্টিফিকেট", "হায়ার সেকেন্ডারি", "ইন্টারমিডিয়েট",
      "এইচএসসি জিপিএ", "এইচএসসি রেজাল্ট", "এইচএসসি পয়েন্ট", "এইচ.এস.সি", "এইচএসসি",
      "আলিম জিপিএ", "আলিম রেজাল্ট", "আলিম", "এ লেভেল", "a level", "a-level", "intermediate gpa"
    ],
    dataType: "number",
    sampleValue: "5.00 / 4.80",
    description: "এইচএসসি পরীক্ষায় প্রাপ্ত জিপিএ (স্কেল ৫.০০)",
    isKeyCriteria: true
  },
  {
    key: "hscInstitute",
    banglaLabel: "এইচএসসি শিক্ষা প্রতিষ্ঠান / কলেজ",
    englishLabel: "HSC College / Institute",
    category: "HSC",
    acceptedAliases: [
      "hsc college", "hsc institute", "hsc institution", "college name",
      "এইচএসসি কলেজ", "এইচএসসি প্রতিষ্ঠান", "কলেজের নাম", "মাদ্রাসার নাম", "এইচএসসি মাদ্রাসা"
    ],
    dataType: "string",
    sampleValue: "Notre Dame College, Dhaka",
    description: "এইচএসসি পাসের কলেজের নাম"
  },
  {
    key: "hscBoard",
    banglaLabel: "এইচএসসি শিক্ষা বোর্ড",
    englishLabel: "HSC Education Board",
    category: "HSC",
    acceptedAliases: ["hsc board", "এইচএসসি বোর্ড", "এইচএসসি শিক্ষা বোর্ড"],
    dataType: "string",
    sampleValue: "Dhaka",
    description: "এইচএসসি পরীক্ষার শিক্ষা বোর্ড"
  },
  {
    key: "hscYear",
    banglaLabel: "এইচএসসি পাসের সাল",
    englishLabel: "HSC Passing Year",
    category: "HSC",
    acceptedAliases: ["hsc year", "hsc passing year", "এইচএসসি পাসের সন", "এইচএসসি পাসের সাল", "এইচএসসি সন"],
    dataType: "string",
    sampleValue: "2015",
    description: "এইচএসসি পাসের বছর"
  },

  // 4. Honors / Graduation / Bachelor
  {
    key: "honorsCgpa",
    banglaLabel: "অনার্স / স্নাতক / ব্যাচেলর সিজিপিএ",
    englishLabel: "Honors / Bachelor CGPA (out of 4.0)",
    category: "HONORS",
    acceptedAliases: [
      "honors cgpa", "honors result", "honors point", "bachelor cgpa", "graduation cgpa", "bsc cgpa", "bba cgpa",
      "undergraduate cgpa", "cgpa", "degree cgpa", "bachelor result",
      "অনার্স সিজিপিএ", "অনার্স রেজাল্ট", "স্নাতক সিজিপিএ", "স্নাতক রেজাল্ট", "স্নাতক সি জিপিএ",
      "গ্র্যাজুয়েশন সিজিপিএ", "অনার্স পয়েন্ট", "স্নাতক পয়েন্ট", "অনার্স"
    ],
    dataType: "number",
    sampleValue: "3.75 / 3.40",
    description: "স্নাতক বা অনার্স পরীক্ষায় প্রাপ্ত সিজিপিএ (স্কেল ৪.০০)",
    isKeyCriteria: true
  },
  {
    key: "honorsInstitute",
    banglaLabel: "অনার্স বিশ্ববিদ্যালয় / শিক্ষা প্রতিষ্ঠান",
    englishLabel: "Honors / Bachelor University",
    category: "HONORS",
    acceptedAliases: [
      "honors university", "honors institute", "honors college", "university", "bachelor university", "varsity", "institution",
      "অনার্স বিশ্ববিদ্যালয়", "অনার্স কলেজ", "বিশ্ববিদ্যালয়", "ভার্সিটি", "শিক্ষা প্রতিষ্ঠান", "স্নাতক প্রতিষ্ঠান", "স্নাতক বিশ্ববিদ্যালয়"
    ],
    dataType: "string",
    sampleValue: "BUET / Dhaka University / NSU / BRAC",
    description: "স্নাতক ডিগ্রি অর্জিত বিশ্ববিদ্যালয়ের নাম",
    isKeyCriteria: true
  },
  {
    key: "honorsDept",
    banglaLabel: "অনার্স বিভাগ / বিষয় / মেজর",
    englishLabel: "Honors Department / Major",
    category: "HONORS",
    acceptedAliases: [
      "honors department", "honors major", "bachelor department", "major", "department", "subject", "discipline",
      "অনার্স ডিপার্টমেন্ট", "অনার্স বিষয়", "মেজর", "ডিপার্টমেন্ট", "বিষয়", "স্নাতক বিভাগ", "বিভাগ", "পঠিত বিষয়"
    ],
    dataType: "string",
    sampleValue: "Computer Science & Engineering / HRM / Finance",
    description: "অনার্স বা স্নাতকের মূল বিষয় বা মেজর",
    isKeyCriteria: true
  },
  {
    key: "honorsDegree",
    banglaLabel: "ডিগ্রির নাম (B.Sc / BBA / BA)",
    englishLabel: "Bachelor Degree Title",
    category: "HONORS",
    acceptedAliases: [
      "honors degree", "bachelor degree", "undergraduate degree", "degree name", "degree",
      "অনার্স ডিগ্রি", "স্নাতক ডিগ্রি", "ডিগ্রি", "ডিগ্রির নাম"
    ],
    dataType: "string",
    sampleValue: "B.Sc in CSE / BBA / B.Com",
    description: "অনার্স বা স্নাতক সনদের ডিগ্রির ধরন"
  },
  {
    key: "honorsYear",
    banglaLabel: "অনার্স পাসের সাল",
    englishLabel: "Honors Passing Year",
    category: "HONORS",
    acceptedAliases: [
      "honors year", "honors passing year", "graduation year", "অনার্স পাসের সন", "অনার্স পাসের সাল", "স্নাতক পাসের সাল", "পাসের সন"
    ],
    dataType: "string",
    sampleValue: "2019",
    description: "স্নাতক সম্পন্ন করার বছর"
  },

  // 5. Masters / Post-Graduation
  {
    key: "mastersCgpa",
    banglaLabel: "মাস্টার্স / স্নাতকোত্তর সিজিপিএ",
    englishLabel: "Masters CGPA (out of 4.0)",
    category: "MASTERS",
    acceptedAliases: [
      "masters cgpa", "masters result", "post graduation cgpa", "msc cgpa", "mba cgpa", "masters point",
      "মাস্টার্স সিজিপিএ", "মাস্টার্স রেজাল্ট", "স্নাতকোত্তর সিজিপিএ", "স্নাতকোত্তর রেজাল্ট", "মাস্টার্স পয়েন্ট"
    ],
    dataType: "number",
    sampleValue: "3.80",
    description: "মাস্টার্স বা স্নাতকোত্তর পরীক্ষায় প্রাপ্ত সিজিপিএ",
    isKeyCriteria: true
  },
  {
    key: "mastersInstitute",
    banglaLabel: "মাস্টার্স বিশ্ববিদ্যালয়",
    englishLabel: "Masters University",
    category: "MASTERS",
    acceptedAliases: [
      "masters university", "masters institute", "মাস্টার্স বিশ্ববিদ্যালয়", "মাস্টার্স প্রতিষ্ঠান", "স্নাতকোত্তর প্রতিষ্ঠান"
    ],
    dataType: "string",
    sampleValue: "BUET / University of Dhaka",
    description: "মাস্টার্স ডিগ্রি অর্জিত বিশ্ববিদ্যালয়"
  },
  {
    key: "mastersDept",
    banglaLabel: "মাস্টার্স বিভাগ / বিষয়",
    englishLabel: "Masters Department",
    category: "MASTERS",
    acceptedAliases: [
      "masters department", "masters major", "মাস্টার্স বিভাগ", "মাস্টার্স বিষয়", "স্নাতকোত্তর বিভাগ"
    ],
    dataType: "string",
    sampleValue: "Software Engineering / MBA",
    description: "মাস্টার্স পঠিত বিষয়"
  },
  {
    key: "mastersYear",
    banglaLabel: "মাস্টার্স পাসের সাল",
    englishLabel: "Masters Passing Year",
    category: "MASTERS",
    acceptedAliases: ["masters year", "masters passing year", "মাস্টার্স পাসের সন", "মাস্টার্স পাসের সাল", "স্নাতকোত্তর পাসের সাল"],
    dataType: "string",
    sampleValue: "2021",
    description: "মাস্টার্স সম্পন্ন করার বছর"
  },

  // 6. Work Experience & Career History
  {
    key: "experienceYears",
    banglaLabel: "কাজের মোট অভিজ্ঞতা (বছর)",
    englishLabel: "Experience in Years",
    category: "EXPERIENCE",
    acceptedAliases: [
      "experience", "experience years", "total experience", "years of experience", "total years of experience", "work experience",
      "অভিজ্ঞতা", "অভিজ্ঞতা (বছর)", "চাকরির অভিজ্ঞতা", "কাজের অভিজ্ঞতা", "কাজের অভিজ্ঞতা বছর", "মোট অভিজ্ঞতা", "অভিজ্ঞতা বছর", "বাস্তব অভিজ্ঞতা"
    ],
    dataType: "number",
    sampleValue: "3.5 / 5 / 0",
    description: "শিল্পক্ষেত্রে প্রার্থীর কাজের বাস্তব মোট অভিজ্ঞতা (বছরে সংখ্যা)",
    isKeyCriteria: true
  },
  {
    key: "experienceHistory",
    banglaLabel: "কোথায় কোথায় চাকরি করেছেন (কোম্পানির বিবরণ)",
    englishLabel: "Previous Companies / Work History",
    category: "EXPERIENCE",
    acceptedAliases: [
      "experience details", "company history", "companies", "previous companies", "past companies", "work history", "employment history",
      "কোথায় কোথায় চাকরি করেছেন", "কোম্পানির নাম", "অভিজ্ঞতার বিবরণ", "পূর্ববর্তী কোম্পানি", "প্রতিষ্ঠানের তালিকা", "চাকরির ইতিহাস", "কাজের জায়গা"
    ],
    dataType: "string",
    sampleValue: "Brain Station 23 (2 yrs), Enosis Solutions (3 yrs)",
    description: "প্রার্থীর পূর্ববর্তী কোম্পানি এবং কাজের বিবরণ"
  },
  {
    key: "currentDesignation",
    banglaLabel: "বর্তমান পদবী",
    englishLabel: "Current Designation / Role",
    category: "EXPERIENCE",
    acceptedAliases: [
      "current designation", "current role", "present designation", "current title", "present job role",
      "বর্তমান পদবী", "বর্তমান পদ", "পদবী", "বর্তমান কাজের পদবী"
    ],
    dataType: "string",
    sampleValue: "Senior Software Engineer",
    description: "প্রার্থীর বর্তমান বা সর্বশেষ পদবী"
  },

  // 7. Salary Expectation
  {
    key: "expectedSalary",
    banglaLabel: "প্রত্যাশিত বেতন (৳ BDT)",
    englishLabel: "Expected Salary (BDT)",
    category: "SALARY",
    acceptedAliases: [
      "expected salary", "salary", "expected remuneration", "remuneration", "salary expectation",
      "প্রত্যাশিত বেতন", "বেতন", "প্রত্যাশিত বেতন (টাকা)", "বেতন প্রত্যাশা", "ডিমান্ড বেতন", "আশা বেতন"
    ],
    dataType: "number",
    sampleValue: "80000 / 120000",
    description: "প্রার্থী কর্তৃক দাবিকৃত মাসিক বেতন",
    isKeyCriteria: true
  }
];

// Smart Matcher: Maps ANY raw column header to canonical field key
export const smartDetectFieldKey = (rawHeader: string): string | null => {
  if (!rawHeader) return null;
  const cleanRaw = rawHeader.trim().toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, "");
  if (!cleanRaw) return null;

  for (const def of RECRUITMENT_METADATA_FIELDS) {
    for (const alias of def.acceptedAliases) {
      const cleanAlias = alias.trim().toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, "");
      if (cleanRaw === cleanAlias || cleanRaw.includes(cleanAlias) || cleanAlias.includes(cleanRaw)) {
        return def.key;
      }
    }
  }
  return null;
};

// Automatically build header map for an entire uploaded sheet
export const autoDetectColumnMapping = (headers: string[]): Record<string, string> => {
  const mapping: Record<string, string> = {};
  for (const h of headers) {
    const detected = smartDetectFieldKey(h);
    if (detected) {
      mapping[h] = detected;
    }
  }
  return mapping;
};

// Generate ready-to-copy Google Form field list
export const generateGoogleFormsQuestionsText = (): string => {
  return RECRUITMENT_METADATA_FIELDS.map((f, idx) => {
    return `${idx + 1}. ${f.englishLabel} (${f.banglaLabel}) [Type: ${f.dataType === "number" ? "Number / Short answer" : "Short answer / Paragraph"}] - Example: ${f.sampleValue}`;
  }).join("\n");
};

// Auto Column Mapping for Google Forms, WordPress Forms, or Custom Excel/CSV
export const mapRowToCandidate = (
  row: Record<string, any>,
  jobCircularId: string,
  jobTitle: string,
  index: number
): Candidate => {
  // Helper to find value across multiple alternative header aliases
  const findVal = (keyName: string): any => {
    const def = RECRUITMENT_METADATA_FIELDS.find((f) => f.key === keyName);
    const aliases = def ? def.acceptedAliases : [keyName];

    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, "");
      for (const alias of aliases) {
        const cleanAlias = alias.trim().toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, "");
        if (cleanKey === cleanAlias || cleanKey.includes(cleanAlias) || cleanAlias.includes(cleanKey)) {
          return row[key];
        }
      }
    }
    return undefined;
  };

  const fullName = String(
    findVal("fullName") || `Applicant ${index + 1}`
  ).trim();

  const phone = String(findVal("phone") || "").trim();
  const email = String(findVal("email") || `applicant.${index + 1}@example.com`).trim();
  const fatherName = String(findVal("fatherName") || "").trim();
  const motherName = String(findVal("motherName") || "").trim();
  const nidNumber = String(findVal("nidNumber") || "").trim();
  const address = String(findVal("address") || "").trim();

  // SSC
  const sscGpa = parseNumberSafe(findVal("sscGpa"));
  const sscInstitute = String(findVal("sscInstitute") || "").trim();
  const sscBoard = String(findVal("sscBoard") || "Dhaka").trim();
  const sscYear = String(findVal("sscYear") || "").trim();
  const sscGroup = String(findVal("sscGroup") || "Science").trim();

  // HSC
  const hscGpa = parseNumberSafe(findVal("hscGpa"));
  const hscInstitute = String(findVal("hscInstitute") || "").trim();
  const hscBoard = String(findVal("hscBoard") || "Dhaka").trim();
  const hscYear = String(findVal("hscYear") || "").trim();
  const hscGroup = String(findVal("hscGroup") || "Science").trim();

  // Honors / Bachelor
  const honorsCgpa = parseNumberSafe(findVal("honorsCgpa"));
  const honorsInstitute = String(findVal("honorsInstitute") || "").trim();
  const honorsDept = String(findVal("honorsDept") || "").trim();
  const honorsYear = String(findVal("honorsYear") || "").trim();
  const honorsDegree = String(findVal("honorsDegree") || "B.Sc / BBA / B.A").trim();

  // Masters
  const mastersCgpa = parseNumberSafe(findVal("mastersCgpa"));
  const mastersInstitute = String(findVal("mastersInstitute") || "").trim();
  const mastersDept = String(findVal("mastersDept") || "").trim();
  const mastersYear = String(findVal("mastersYear") || "").trim();

  // Experience & History
  const experienceYears = parseNumberSafe(findVal("experienceYears"));
  const experienceHistory = String(findVal("experienceHistory") || "").trim();
  const currentDesignation = String(findVal("currentDesignation") || "").trim();
  const expectedSalary = parseNumberSafe(findVal("expectedSalary")) || 0;

  const candidateId = `cand-sheet-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`;

  return {
    id: candidateId,
    jobCircularId,
    jobPostingId: jobCircularId,
    jobTitle,
    appliedRole: jobTitle,
    fullName,
    email,
    phone,
    fatherName,
    motherName,
    nidNumber,
    address,
    sscGpa: sscGpa || 4.5,
    sscInstitute,
    sscBoard,
    sscYear,
    sscGroup,
    hscGpa: hscGpa || 4.2,
    hscInstitute,
    hscBoard,
    hscYear,
    hscGroup,
    honorsCgpa: honorsCgpa || 3.2,
    honorsInstitute,
    honorsDept,
    honorsYear,
    honorsDegree,
    mastersCgpa: mastersCgpa > 0 ? mastersCgpa : undefined,
    mastersInstitute: mastersInstitute || undefined,
    mastersDept: mastersDept || undefined,
    mastersYear: mastersYear || undefined,
    experienceYears,
    experienceHistory,
    currentDesignation,
    expectedSalary: expectedSalary || 50000,
    appliedDate: new Date().toISOString().split("T")[0],
    stage: "APPLIED",
    screeningStatus: "PENDING",
    importedFromSheet: true,
  };
};

// Map with explicit custom column mapping overrides
export const mapRowWithCustomMapping = (
  row: Record<string, any>,
  customMapping: Record<string, string>,
  jobCircularId: string,
  jobTitle: string,
  index: number
): Candidate => {
  // Translate row into canonical row object
  const canonicalRow: Record<string, any> = {};
  for (const [rawCol, val] of Object.entries(row)) {
    const mappedKey = customMapping[rawCol] || smartDetectFieldKey(rawCol);
    if (mappedKey) {
      canonicalRow[mappedKey] = val;
    }
  }
  return mapRowToCandidate(canonicalRow, jobCircularId, jobTitle, index);
};

// Evaluate Candidate against Screening Criteria
export const evaluateCandidateScreening = (
  candidate: Candidate,
  criteria: ScreeningCriteria
): {
  isEligible: boolean;
  passedReasons: string[];
  failedReasons: string[];
  totalScore: number;
} => {
  const passedReasons: string[] = [];
  const failedReasons: string[] = [];

  // 1. SSC GPA Check
  const sscVal = candidate.sscGpa || 0;
  if (sscVal >= criteria.minSscGpa) {
    passedReasons.push(`SSC GPA ${sscVal.toFixed(2)} meets minimum requirement (≥ ${criteria.minSscGpa.toFixed(2)})`);
  } else {
    failedReasons.push(`SSC GPA ${sscVal.toFixed(2)} is below minimum requirement (${criteria.minSscGpa.toFixed(2)})`);
  }

  // 2. HSC GPA Check
  const hscVal = candidate.hscGpa || 0;
  if (hscVal >= criteria.minHscGpa) {
    passedReasons.push(`HSC GPA ${hscVal.toFixed(2)} meets minimum requirement (≥ ${criteria.minHscGpa.toFixed(2)})`);
  } else {
    failedReasons.push(`HSC GPA ${hscVal.toFixed(2)} is below minimum requirement (${criteria.minHscGpa.toFixed(2)})`);
  }

  // 3. Honors / Bachelor CGPA Check
  const honorsVal = candidate.honorsCgpa || 0;
  if (honorsVal >= criteria.minHonorsCgpa) {
    passedReasons.push(`Honors/Bachelor CGPA ${honorsVal.toFixed(2)} meets threshold (≥ ${criteria.minHonorsCgpa.toFixed(2)})`);
  } else {
    failedReasons.push(`Honors/Bachelor CGPA ${honorsVal.toFixed(2)} is below threshold (${criteria.minHonorsCgpa.toFixed(2)})`);
  }

  // 4. Masters CGPA Check (If required)
  if (criteria.requireMasters) {
    const mastersVal = candidate.mastersCgpa || 0;
    if (mastersVal >= criteria.minMastersCgpa) {
      passedReasons.push(`Masters CGPA ${mastersVal.toFixed(2)} meets criteria (≥ ${criteria.minMastersCgpa.toFixed(2)})`);
    } else {
      failedReasons.push(`Masters degree with minimum CGPA ${criteria.minMastersCgpa.toFixed(2)} required (Candidate: ${mastersVal > 0 ? mastersVal.toFixed(2) : "Not completed"})`);
    }
  }

  // 5. Work Experience Check
  const expVal = candidate.experienceYears || 0;
  if (expVal >= criteria.minExperienceYears) {
    passedReasons.push(`Work experience ${expVal} years satisfies requirement (≥ ${criteria.minExperienceYears} years)`);
  } else {
    failedReasons.push(`Work experience ${expVal} years is below required ${criteria.minExperienceYears} years`);
  }

  // 6. Department / Major Match (if specified)
  if (criteria.departmentKeywords && criteria.departmentKeywords.trim().length > 0) {
    const keywords = criteria.departmentKeywords
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
    
    const candidateDept = (candidate.honorsDept || "").toLowerCase();
    const candidateDegree = (candidate.honorsDegree || "").toLowerCase();
    const combined = `${candidateDept} ${candidateDegree}`;

    const hasMatch = keywords.some((kw) => combined.includes(kw));
    if (hasMatch) {
      passedReasons.push(`Department / Major (${candidate.honorsDept || "Relevant"}) matches criteria [${criteria.departmentKeywords}]`);
    } else {
      failedReasons.push(`Department (${candidate.honorsDept || "Not specified"}) does not match required majors [${criteria.departmentKeywords}]`);
    }
  }

  // 7. Max Expected Salary Check
  if (criteria.maxExpectedSalary && criteria.maxExpectedSalary > 0) {
    const salary = candidate.expectedSalary || 0;
    if (salary <= criteria.maxExpectedSalary) {
      passedReasons.push(`Expected salary ৳${salary.toLocaleString()} is within budget (≤ ৳${criteria.maxExpectedSalary.toLocaleString()})`);
    } else {
      failedReasons.push(`Expected salary ৳${salary.toLocaleString()} exceeds salary band (≤ ৳${criteria.maxExpectedSalary.toLocaleString()})`);
    }
  }

  const isEligible = failedReasons.length === 0;
  const totalScore = Math.max(
    10,
    Math.round(
      ((passedReasons.length) / (passedReasons.length + failedReasons.length)) * 100
    )
  );

  return {
    isEligible,
    passedReasons,
    failedReasons,
    totalScore,
  };
};

// Download Sample Template for External Google Forms / WordPress Excel
export const downloadCandidateExcelTemplate = () => {
  const sampleHeaders = [
    {
      "Full Name (প্রার্থীর নাম)": "Tariqul Islam",
      "Phone Number (মোবাইল)": "+880 1711-223344",
      "Email Address (ইমেইল)": "tariqul.candidate@gmail.com",
      "Father's Name (পিতার নাম)": "Md. Rafiqul Islam",
      "Mother's Name (মাতার নাম)": "Rokeya Begum",
      "NID Number (জাতীয় পরিচয়পত্র)": "19952691122334455",
      "Address (বর্তমান ঠিকানা)": "Dhanmondi 27, Dhaka",
      "SSC GPA (এসএসসি জিপিএ)": 5.0,
      "SSC School (প্রতিষ্ঠান)": "Dhaka Residential Model College",
      "SSC Board (বোর্ড)": "Dhaka",
      "SSC Passing Year (পাসের সন)": 2011,
      "SSC Group (বিভাগ)": "Science",
      "HSC GPA (এইচএসসি জিপিএ)": 5.0,
      "HSC College (প্রতিষ্ঠান)": "Notre Dame College, Dhaka",
      "HSC Board (বোর্ড)": "Dhaka",
      "HSC Passing Year (পাসের সন)": 2013,
      "HSC Group (বিভাগ)": "Science",
      "Honors CGPA (অনার্স সিজিপিএ)": 3.78,
      "Honors University (বিশ্ববিদ্যালয়)": "BUET / DU",
      "Honors Department (বিভাগ / মেজর)": "Computer Science & Engineering",
      "Honors Degree (ডিগ্রি)": "B.Sc in CSE",
      "Honors Passing Year (পাসের সন)": 2018,
      "Masters CGPA (মাস্টার্স সিজিপিএ)": 3.85,
      "Masters University (বিশ্ববিদ্যালয়)": "BUET",
      "Masters Department (বিভাগ)": "CSE",
      "Masters Passing Year (পাসের সন)": 2020,
      "Experience Years (অভিজ্ঞতা বছর)": 5.5,
      "Previous Companies (কোথায় চাকরি করেছেন)": "Brain Station 23 (2 yrs), Enosis Solutions (3.5 yrs)",
      "Current Designation (বর্তমান পদবী)": "Senior Software Engineer",
      "Expected Salary (প্রত্যাশিত বেতন)": 140000,
    },
    {
      "Full Name (প্রার্থীর নাম)": "Sadia Rahman",
      "Phone Number (মোবাইল)": "+880 1819-556677",
      "Email Address (ইমেইল)": "sadia.rahman.hr@gmail.com",
      "Father's Name (পিতার নাম)": "Anwar Hossain",
      "Mother's Name (মাতার নাম)": "Farida Yasmin",
      "NID Number (জাতীয় পরিচয়পত্র)": "19972698877665544",
      "Address (বর্তমান ঠিকানা)": "Uttara Sector 7, Dhaka",
      "SSC GPA (এসএসসি জিপিএ)": 4.85,
      "SSC School (প্রতিষ্ঠান)": "Viqarunnisa Noon School",
      "SSC Board (বোর্ড)": "Dhaka",
      "SSC Passing Year (পাসের সন)": 2013,
      "SSC Group (বিভাগ)": "Commerce",
      "HSC GPA (এইচএসসি জিপিএ)": 4.75,
      "HSC College (প্রতিষ্ঠান)": "Holy Cross College",
      "HSC Board (বোর্ড)": "Dhaka",
      "HSC Passing Year (পাসের সন)": 2015,
      "HSC Group (বিভাগ)": "Commerce",
      "Honors CGPA (অনার্স সিজিপিএ)": 3.65,
      "Honors University (বিশ্ববিদ্যালয়)": "University of Dhaka (IBA)",
      "Honors Department (বিভাগ / মেজর)": "Human Resource Management (HRM)",
      "Honors Degree (ডিগ্রি)": "BBA",
      "Honors Passing Year (পাসের সন)": 2019,
      "Masters CGPA (মাস্টার্স সিজিপিএ)": 3.70,
      "Masters University (বিশ্ববিদ্যালয়)": "University of Dhaka",
      "Masters Department (বিভাগ)": "MBA in HRM",
      "Masters Passing Year (পাসের সন)": 2021,
      "Experience Years (অভিজ্ঞতা বছর)": 4.0,
      "Previous Companies (কোথায় চাকরি করেছেন)": "Square Pharmaceuticals (2 yrs), Grameenphone (2 yrs)",
      "Current Designation (বর্তমান পদবী)": "HR Executive & Payroll Specialist",
      "Expected Salary (প্রত্যাশিত বেতন)": 85000,
    },
    {
      "Full Name (প্রার্থীর নাম)": "Tanvir Ahmed",
      "Phone Number (মোবাইল)": "+880 1912-334455",
      "Email Address (ইমেইল)": "tanvir.eng@yahoo.com",
      "Father's Name (পিতার নাম)": "Siraj Uddin",
      "Mother's Name (মাতার নাম)": "Nargis Akhter",
      "NID Number (জাতীয় পরিচয়পত্র)": "19982693344556677",
      "Address (বর্তমান ঠিকানা)": "GEC Circle, Chittagong",
      "SSC GPA (এসএসসি জিপিএ)": 4.25,
      "SSC School (প্রতিষ্ঠান)": "Chittagong Collegiate School",
      "SSC Board (বোর্ড)": "Chittagong",
      "SSC Passing Year (পাসের সন)": 2014,
      "SSC Group (বিভাগ)": "Science",
      "HSC GPA (এইচএসসি জিপিএ)": 3.90,
      "HSC College (প্রতিষ্ঠান)": "Chittagong College",
      "HSC Board (বোর্ড)": "Chittagong",
      "HSC Passing Year (পাসের সন)": 2016,
      "HSC Group (বিভাগ)": "Science",
      "Honors CGPA (অনার্স সিজিপিএ)": 2.85,
      "Honors University (বিশ্ববিদ্যালয়)": "Premier University, Chittagong",
      "Honors Department (বিভাগ / মেজর)": "Electrical & Electronic Engineering (EEE)",
      "Honors Degree (ডিগ্রি)": "B.Sc in EEE",
      "Honors Passing Year (পাসের সন)": 2020,
      "Masters CGPA (মাস্টার্স সিজিপিএ)": "",
      "Masters University (বিশ্ববিদ্যালয়)": "",
      "Masters Department (বিভাগ)": "",
      "Masters Passing Year (পাসের সন)": "",
      "Experience Years (অভিজ্ঞতা বছর)": 1.5,
      "Previous Companies (কোথায় চাকরি করেছেন)": "Local Telecom Vendor (1.5 yrs)",
      "Current Designation (বর্তমান পদবী)": "Junior Support Engineer",
      "Expected Salary (প্রত্যাশিত বেতন)": 45000,
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleHeaders);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Candidate_Applications");
  XLSX.writeFile(wb, "WorkflowHR_Recruitment_CV_Form_Template.xlsx");
};

// Generate Demo Dataset with 10+ Diverse Candidates across Education & Experience
export const getDemoExternalCandidates = (jobCircularId: string, jobTitle: string): Candidate[] => {
  const rawList = [
    {
      fullName: "Engr. Mahmudul Hasan",
      phone: "+880 1715-112233",
      email: "mahmud.buet@gmail.com",
      fatherName: "Kazi Nurul Islam",
      motherName: "Salma Begum",
      nidNumber: "19932691122334411",
      address: "Mirpur DOHS, Dhaka",
      sscGpa: 5.0,
      sscInstitute: "Rajshahi Cadet College",
      sscBoard: "Rajshahi",
      sscYear: 2010,
      sscGroup: "Science",
      hscGpa: 5.0,
      hscInstitute: "Rajshahi Cadet College",
      hscBoard: "Rajshahi",
      hscYear: 2012,
      hscGroup: "Science",
      honorsCgpa: 3.82,
      honorsInstitute: "BUET",
      honorsDept: "Computer Science & Engineering",
      honorsDegree: "B.Sc in CSE",
      honorsYear: 2017,
      mastersCgpa: 3.90,
      mastersInstitute: "BUET",
      mastersDept: "CSE",
      mastersYear: 2019,
      experienceYears: 6,
      experienceHistory: "Samsung R&D (3 yrs), Pathao (3 yrs)",
      currentDesignation: "Lead Systems Architect",
      expectedSalary: 160000,
    },
    {
      fullName: "Farhana Binte Morshed",
      phone: "+880 1812-445566",
      email: "farhana.morshed@gmail.com",
      fatherName: "Morshed Alam",
      motherName: "Nasima Akhter",
      nidNumber: "19962692233445522",
      address: "Banani, Block C, Dhaka",
      sscGpa: 4.90,
      sscInstitute: "Holy Cross Girls' High School",
      sscBoard: "Dhaka",
      sscYear: 2012,
      sscGroup: "Science",
      hscGpa: 4.85,
      hscInstitute: "Holy Cross College",
      hscBoard: "Dhaka",
      hscYear: 2014,
      hscGroup: "Science",
      honorsCgpa: 3.65,
      honorsInstitute: "North South University (NSU)",
      honorsDept: "Computer Science & Engineering",
      honorsDegree: "B.Sc in CSE",
      honorsYear: 2019,
      mastersCgpa: 0,
      mastersInstitute: "",
      mastersDept: "",
      mastersYear: "",
      experienceYears: 4.5,
      experienceHistory: "Chaldal Tech (2.5 yrs), Augmedix (2 yrs)",
      currentDesignation: "Senior Frontend Engineer (React/TypeScript)",
      expectedSalary: 125000,
    },
    {
      fullName: "Md. Rashedul Karim",
      phone: "+880 1911-778899",
      email: "rashed.karim.dev@gmail.com",
      fatherName: "Abdul Karim",
      motherName: "Razia Sultana",
      nidNumber: "19952693344556633",
      address: "Khulna Sadar, Khulna",
      sscGpa: 4.50,
      sscInstitute: "Khulna Zilla School",
      sscBoard: "Jessore",
      sscYear: 2011,
      sscGroup: "Science",
      hscGpa: 4.20,
      hscInstitute: "Govt. BL College, Khulna",
      hscBoard: "Jessore",
      hscYear: 2013,
      hscGroup: "Science",
      honorsCgpa: 3.15,
      honorsInstitute: "KUET",
      honorsDept: "Electrical & Electronic Engineering (EEE)",
      honorsDegree: "B.Sc in EEE",
      honorsYear: 2018,
      mastersCgpa: 0,
      mastersInstitute: "",
      mastersDept: "",
      mastersYear: "",
      experienceYears: 3.0,
      experienceHistory: "Walton Hi-Tech (1 yr), Energypac (2 yrs)",
      currentDesignation: "Firmware & Embedded Engineer",
      expectedSalary: 85000,
    },
    {
      fullName: "Nusrat Jahan Chowdhury",
      phone: "+880 1610-332211",
      email: "nusrat.du.iba@gmail.com",
      fatherName: "Jahangir Chowdhury",
      motherName: "Kamrun Nahar",
      nidNumber: "19972694455667744",
      address: "Dhanmondi, Dhaka",
      sscGpa: 5.0,
      sscInstitute: "Viqarunnisa Noon School",
      sscBoard: "Dhaka",
      sscYear: 2013,
      sscGroup: "Commerce",
      hscGpa: 5.0,
      hscInstitute: "Viqarunnisa Noon College",
      hscBoard: "Dhaka",
      hscYear: 2015,
      hscGroup: "Commerce",
      honorsCgpa: 3.72,
      honorsInstitute: "University of Dhaka (IBA)",
      honorsDept: "Human Resource Management (HRM)",
      honorsDegree: "BBA in HRM",
      honorsYear: 2019,
      mastersCgpa: 3.80,
      mastersInstitute: "University of Dhaka (IBA)",
      mastersDept: "MBA",
      mastersYear: 2021,
      experienceYears: 3.5,
      experienceHistory: "BAT Bangladesh (2 yrs), bKash HR Team (1.5 yrs)",
      currentDesignation: "Assistant Manager - HR & Talent",
      expectedSalary: 95000,
    },
    {
      fullName: "Kamal Hossain Rubel",
      phone: "+880 1718-990011",
      email: "kamal.rubel1998@gmail.com",
      fatherName: "Moklesur Rahman",
      motherName: "Fatema Khatun",
      nidNumber: "19992695566778855",
      address: "Jatrabari, Dhaka",
      sscGpa: 3.80, // Low SSC
      sscInstitute: "Jatrabari High School",
      sscBoard: "Dhaka",
      sscYear: 2015,
      sscGroup: "Humanities",
      hscGpa: 3.40, // Low HSC
      hscInstitute: "Dania College",
      hscBoard: "Dhaka",
      hscYear: 2017,
      hscGroup: "Humanities",
      honorsCgpa: 2.65, // Low Honors
      honorsInstitute: "National University (Tejgaon College)",
      honorsDept: "Political Science",
      honorsDegree: "B.A",
      honorsYear: 2022,
      mastersCgpa: 0,
      mastersInstitute: "",
      mastersDept: "",
      mastersYear: "",
      experienceYears: 1.0,
      experienceHistory: "Local NGO Office Assistant (1 yr)",
      currentDesignation: "Data Entry Operator",
      expectedSalary: 35000,
    },
    {
      fullName: "Shuvro Dev Nath",
      phone: "+880 1521-776655",
      email: "shuvro.dev.cuet@gmail.com",
      fatherName: "Bishwajit Dev Nath",
      motherName: "Anjali Nath",
      nidNumber: "19942696677889966",
      address: "Chawkbazar, Chittagong",
      sscGpa: 4.80,
      sscInstitute: "Chittagong Govt. High School",
      sscBoard: "Chittagong",
      sscYear: 2011,
      sscGroup: "Science",
      hscGpa: 4.60,
      hscInstitute: "Chittagong College",
      hscBoard: "Chittagong",
      hscYear: 2013,
      hscGroup: "Science",
      honorsCgpa: 3.45,
      honorsInstitute: "CUET",
      honorsDept: "Computer Science & Engineering",
      honorsDegree: "B.Sc in CSE",
      honorsYear: 2018,
      mastersCgpa: 0,
      mastersInstitute: "",
      mastersDept: "",
      mastersYear: "",
      experienceYears: 5.0,
      experienceHistory: "Kona Software Lab (3 yrs), Therap BD (2 yrs)",
      currentDesignation: "Senior Backend Developer (Node.js & Go)",
      expectedSalary: 135000,
    },
    {
      fullName: "Ayesha Siddiqua",
      phone: "+880 1815-223344",
      email: "ayesha.siddiqua.hr@gmail.com",
      fatherName: "Dr. Siddiqur Rahman",
      motherName: "Shamsun Nahar",
      nidNumber: "19982697788990077",
      address: "Shantinagar, Dhaka",
      sscGpa: 4.95,
      sscInstitute: "Motijheel Govt. Girls' High School",
      sscBoard: "Dhaka",
      sscYear: 2014,
      sscGroup: "Science",
      hscGpa: 4.70,
      hscInstitute: "Dhaka City College",
      hscBoard: "Dhaka",
      hscYear: 2016,
      hscGroup: "Science",
      honorsCgpa: 3.55,
      honorsInstitute: "BRAC University",
      honorsDept: "Computer Science",
      honorsDegree: "B.Sc in CS",
      honorsYear: 2021,
      mastersCgpa: 0,
      mastersInstitute: "",
      mastersDept: "",
      mastersYear: "",
      experienceYears: 2.5,
      experienceHistory: "ShopUp (1.5 yrs), ShareTrip (1 yr)",
      currentDesignation: "Full Stack Engineer",
      expectedSalary: 90000,
    },
  ];

  return rawList.map((item, idx) => ({
    id: `cand-demo-${Date.now()}-${idx}`,
    jobCircularId,
    jobPostingId: jobCircularId,
    jobTitle,
    appliedRole: jobTitle,
    fullName: item.fullName,
    email: item.email,
    phone: item.phone,
    fatherName: item.fatherName,
    motherName: item.motherName,
    nidNumber: item.nidNumber,
    address: item.address,
    sscGpa: item.sscGpa,
    sscInstitute: item.sscInstitute,
    sscBoard: item.sscBoard,
    sscYear: item.sscYear,
    sscGroup: item.sscGroup,
    hscGpa: item.hscGpa,
    hscInstitute: item.hscInstitute,
    hscBoard: item.hscBoard,
    hscYear: item.hscYear,
    hscGroup: item.hscGroup,
    honorsCgpa: item.honorsCgpa,
    honorsInstitute: item.honorsInstitute,
    honorsDept: item.honorsDept,
    honorsYear: item.honorsYear,
    honorsDegree: item.honorsDegree,
    mastersCgpa: item.mastersCgpa || undefined,
    mastersInstitute: item.mastersInstitute || undefined,
    mastersDept: item.mastersDept || undefined,
    mastersYear: item.mastersYear || undefined,
    experienceYears: item.experienceYears,
    experienceHistory: item.experienceHistory,
    currentDesignation: item.currentDesignation,
    expectedSalary: item.expectedSalary,
    appliedDate: "2026-08-30",
    stage: "APPLIED",
    screeningStatus: "PENDING",
    importedFromSheet: true,
  }));
};
