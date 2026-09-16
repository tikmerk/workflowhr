import React, { useState, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  Building2,
  AlertCircle,
  RefreshCw,
  Check,
  Filter,
  X,
  Search,
  Coffee,
  Briefcase,
  Save,
  CalendarCheck,
  CalendarX,
  Sliders,
} from "lucide-react";
import { Shift, Holiday, Branch } from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { useCompanyBranding } from "../../context/CompanyBrandingContext";

interface ShiftsHolidaysViewProps {
  shifts: Shift[];
  holidays: Holiday[];
  branches: Branch[];
  onAddShift: (shift: Shift) => void;
  onUpdateShift?: (shift: Shift) => void;
  onDeleteShift?: (shiftId: string) => void;
  onAddHoliday: (holiday: Holiday) => void;
  onUpdateHoliday?: (holiday: Holiday) => void;
  onDeleteHoliday?: (holidayId: string) => void;
  weekendDays?: number[];
  onUpdateWeekendDays?: (days: number[]) => void;
}

// Bangladesh Standard Official Public Holidays Calendar (2026 & 2027 Gazetted)
const BD_OFFICIAL_HOLIDAYS_2026: Array<Omit<Holiday, "id">> = [
  {
    name: "আন্তর্জাতিক মাতৃভাষা দিবস ও শহীদ দিবস (Shaheed Day & Mother Language Day)",
    type: "NATIONAL",
    startDate: "2026-02-21",
    endDate: "2026-02-21",
    totalDays: 1,
    description: "National Gazetted Public Holiday honoring language martyrs.",
    applicableBranchIds: [],
  },
  {
    name: "পবিত্র শবে বরাত (Shab-e-Barat)",
    type: "FESTIVAL",
    startDate: "2026-03-05",
    endDate: "2026-03-05",
    totalDays: 1,
    description: "Holy Night of Fortune & Forgiveness.",
    applicableBranchIds: [],
  },
  {
    name: "জাতীয় স্বাধীনতা ও জাতীয় দিবস (Independence & National Day)",
    type: "NATIONAL",
    startDate: "2026-03-26",
    endDate: "2026-03-26",
    totalDays: 1,
    description: "National Independence Day of Bangladesh.",
    applicableBranchIds: [],
  },
  {
    name: "পবিত্র শবে কদর (Shab-e-Qadr)",
    type: "FESTIVAL",
    startDate: "2026-03-17",
    endDate: "2026-03-17",
    totalDays: 1,
    description: "Holy Night of Decree.",
    applicableBranchIds: [],
  },
  {
    name: "পবিত্র ঈদুল ফিতর (Holy Eid-ul-Fitr)",
    type: "FESTIVAL",
    startDate: "2026-03-20",
    endDate: "2026-03-23",
    totalDays: 4,
    description: "Holy Eid-ul-Fitr Celebrations (এনজিও ফিল্ড কার্যক্রম শেষে স্টাফদের সুবিধাজনক তারিখে পরিবর্তনযোগ্য)।",
    applicableBranchIds: [],
  },
  {
    name: "বাংলা নববর্ষ (Pahela Baishakh / Bengali New Year)",
    type: "NATIONAL",
    startDate: "2026-04-14",
    endDate: "2026-04-14",
    totalDays: 1,
    description: "Universal cultural celebration of Bangla New Year 1433.",
    applicableBranchIds: [],
  },
  {
    name: "মে দিবস (International Workers' Day / May Day)",
    type: "NATIONAL",
    startDate: "2026-05-01",
    endDate: "2026-05-01",
    totalDays: 1,
    description: "International Labor Solidarity Day.",
    applicableBranchIds: [],
  },
  {
    name: "বুদ্ধ পূর্ণিমা (Buddha Purnima)",
    type: "FESTIVAL",
    startDate: "2026-05-12",
    endDate: "2026-05-12",
    totalDays: 1,
    description: "Sacred festival commemorating Gautama Buddha.",
    applicableBranchIds: [],
  },
  {
    name: "পবিত্র ঈদুল আযহা (Holy Eid-ul-Adha / Qurbani Eid)",
    type: "FESTIVAL",
    startDate: "2026-05-27",
    endDate: "2026-05-30",
    totalDays: 4,
    description: "Holy Festival of Sacrifice (ঈদের ফুড/মাংস বিতরণ শেষে সুবিধাজনক সময়ে ছুটির তারিখ নির্ধারণযোগ্য)।",
    applicableBranchIds: [],
  },
  {
    name: "পবিত্র আশুরা (Holy Ashura - 10th Muharram)",
    type: "FESTIVAL",
    startDate: "2026-06-26",
    endDate: "2026-06-26",
    totalDays: 1,
    description: "Holy Day of Mourning & Reflection.",
    applicableBranchIds: [],
  },
  {
    name: "শুভ জন্মাষ্টমী (Janmashtami)",
    type: "FESTIVAL",
    startDate: "2026-09-04",
    endDate: "2026-09-04",
    totalDays: 1,
    description: "Lord Krishna's Birthday celebrations.",
    applicableBranchIds: [],
  },
  {
    name: "পবিত্র ঈদে মিলাদুন্নবী (সা.) (Eid-e-Miladunnabi SAW)",
    type: "FESTIVAL",
    startDate: "2026-09-26",
    endDate: "2026-09-26",
    totalDays: 1,
    description: "Birth & Departure Anniversary of Prophet Muhammad (SAW).",
    applicableBranchIds: [],
  },
  {
    name: "শ্রী শ্রী দুর্গাপূজা / বিজয়া দশমী (Durga Puja & Bijoya Dashami)",
    type: "FESTIVAL",
    startDate: "2026-10-20",
    endDate: "2026-10-21",
    totalDays: 2,
    description: "Grand Hindu Festival of Bengal & Public Holiday.",
    applicableBranchIds: [],
  },
  {
    name: "মহান বিজয় দিবস (National Victory Day)",
    type: "NATIONAL",
    startDate: "2026-12-16",
    endDate: "2026-12-16",
    totalDays: 1,
    description: "Glorious Victory Day of Bangladesh.",
    applicableBranchIds: [],
  },
  {
    name: "যিশু খ্রিস্টের জন্মদিন (Christmas Day / Boro Din)",
    type: "FESTIVAL",
    startDate: "2026-12-25",
    endDate: "2026-12-25",
    totalDays: 1,
    description: "Holy Christmas Celebrations & National Holiday.",
    applicableBranchIds: [],
  },
];

const WEEKDAY_NAMES = [
  { dayIndex: 0, label: "Sunday", labelBn: "রবিবার", short: "Sun" },
  { dayIndex: 1, label: "Monday", labelBn: "সোমবার", short: "Mon" },
  { dayIndex: 2, label: "Tuesday", labelBn: "মঙ্গলবার", short: "Tue" },
  { dayIndex: 3, label: "Wednesday", labelBn: "বুধবার", short: "Wed" },
  { dayIndex: 4, label: "Thursday", labelBn: "বৃহস্পতিবার", short: "Thu" },
  { dayIndex: 5, label: "Friday", labelBn: "শুক্রবার", short: "Fri" },
  { dayIndex: 6, label: "Saturday", labelBn: "শনিবার", short: "Sat" },
];

export const ShiftsHolidaysView: React.FC<ShiftsHolidaysViewProps> = ({
  shifts,
  holidays,
  branches,
  onAddShift,
  onUpdateShift,
  onDeleteShift,
  onAddHoliday,
  onUpdateHoliday,
  onDeleteHoliday,
  weekendDays = [5, 6],
  onUpdateWeekendDays,
}) => {
  const { t, isBangla } = useThemeLanguage();
  const { branding, getCompanyDisplayName } = useCompanyBranding();

  const organizationName = getCompanyDisplayName(isBangla) || branding.companyName || "Muslim Welfare Organization";

  const [activeTab, setActiveTab] = useState<"SHIFTS" | "HOLIDAYS" | "WEEKEND_RULES">("HOLIDAYS");
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Shift Form State
  const [shiftName, setShiftName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [graceMins, setGraceMins] = useState(15);
  const [halfDayMins, setHalfDayMins] = useState(120);
  const [isRotational, setIsRotational] = useState(false);
  const [isFlexible, setIsFlexible] = useState(false);
  const [shiftWeekendDays, setShiftWeekendDays] = useState<number[]>([5, 6]);

  // Holiday Form State
  const [holName, setHolName] = useState("");
  const [holType, setHolType] = useState<"NATIONAL" | "FESTIVAL" | "COMPANY">("FESTIVAL");
  const [holStart, setHolStart] = useState("2026-05-27");
  const [holEnd, setHolEnd] = useState("2026-05-30");
  const [holDays, setHolDays] = useState(4);
  const [holDesc, setHolDesc] = useState("");
  const [holBranchIds, setHolBranchIds] = useState<string[]>([]);

  // Holidays Filter & Search State
  const [holidaySearchQuery, setHolidaySearchQuery] = useState("");
  const [holidayYearFilter, setHolidayYearFilter] = useState<string>("ALL");
  const [holidayTypeFilter, setHolidayTypeFilter] = useState<string>("ALL");

  // Weekend Rules State
  const [localWeekendDays, setLocalWeekendDays] = useState<number[]>(weekendDays);
  const [applyWeekendToAllShifts, setApplyWeekendToAllShifts] = useState(true);

  // Calculate day difference
  const calculateDays = (start: string, end: string) => {
    try {
      const s = new Date(start);
      const e = new Date(end);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
      const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? diff : 1;
    } catch {
      return 1;
    }
  };

  // Set date from preset duration
  const applyPresetDuration = (numDays: number) => {
    try {
      const s = new Date(holStart);
      if (!isNaN(s.getTime())) {
        const e = new Date(s);
        e.setDate(s.getDate() + numDays - 1);
        const yyyy = e.getFullYear();
        const mm = String(e.getMonth() + 1).padStart(2, "0");
        const dd = String(e.getDate()).padStart(2, "0");
        setHolEnd(`${yyyy}-${mm}-${dd}`);
        setHolDays(numDays);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open Holiday Modal for Create
  const handleOpenAddHoliday = () => {
    setEditingHoliday(null);
    setHolName("");
    setHolType("FESTIVAL");
    const today = new Date().toISOString().split("T")[0];
    setHolStart(today);
    setHolEnd(today);
    setHolDays(1);
    setHolDesc("");
    setHolBranchIds([]);
    setShowHolidayModal(true);
  };

  // Open Holiday Modal for Edit
  const handleOpenEditHoliday = (h: Holiday) => {
    setEditingHoliday(h);
    // Sanitize any remaining "Apex" reference
    const cleanName = h.name.replace(/Apex Global/gi, organizationName);
    const cleanDesc = (h.description || "").replace(/Apex Global/gi, organizationName);
    setHolName(cleanName);
    setHolType(h.type);
    setHolStart(h.startDate);
    setHolEnd(h.endDate);
    setHolDays(h.totalDays || calculateDays(h.startDate, h.endDate));
    setHolDesc(cleanDesc);
    setHolBranchIds(h.applicableBranchIds || []);
    setShowHolidayModal(true);
  };

  // Submit Holiday (Add or Update)
  const handleHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const days = calculateDays(holStart, holEnd);

    if (editingHoliday) {
      const updated: Holiday = {
        ...editingHoliday,
        name: holName,
        type: holType,
        startDate: holStart,
        endDate: holEnd,
        totalDays: days,
        description: holDesc || "Official corporate holiday",
        applicableBranchIds: holBranchIds,
      };
      if (onUpdateHoliday) {
        onUpdateHoliday(updated);
      }
      setSyncStatusMsg(
        isBangla
          ? `সফলভাবে '${holName}' ছুটির তারিখ ও তথ্য আপডেট করা হয়েছে!`
          : `Holiday '${holName}' schedule updated successfully!`
      );
    } else {
      const newHol: Holiday = {
        id: `hol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: holName,
        type: holType,
        startDate: holStart,
        endDate: holEnd,
        totalDays: days,
        description: holDesc || "Official corporate holiday",
        applicableBranchIds: holBranchIds,
      };
      onAddHoliday(newHol);
      setSyncStatusMsg(
        isBangla
          ? `সফলভাবে '${holName}' ছুটি ক্যালেন্ডারে যুক্ত করা হয়েছে!`
          : `Holiday '${holName}' added successfully!`
      );
    }

    setShowHolidayModal(false);
    setTimeout(() => setSyncStatusMsg(null), 5000);
  };

  // Delete Holiday
  const handleDeleteHolidayClick = (h: Holiday) => {
    const cleanName = h.name.replace(/Apex Global/gi, organizationName);
    const confirmMsg = isBangla
      ? `আপনি কি নিশ্চিত যে '${cleanName}' ছুটিটি মুছে ফেলতে চান?\n\nমুছে ফেললে কর্মীদের ক্যালেন্ডার ও উপস্থিতি তালিকা থেকে ছুটিটি বাতিল হয়ে যাবে (যেমন জন্মাষ্টমী বা অন্য ছুটি পালন না করতে চাইলে)।`
      : `Are you sure you want to delete '${cleanName}' from corporate holidays?`;

    if (window.confirm(confirmMsg)) {
      if (onDeleteHoliday) {
        onDeleteHoliday(h.id);
        setSyncStatusMsg(
          isBangla
            ? `'${cleanName}' ছুটিটি তালিকা থেকে সফলভাবে মুছে ফেলা হয়েছে!`
            : `Holiday '${cleanName}' was deleted successfully!`
        );
        setTimeout(() => setSyncStatusMsg(null), 5000);
      }
    }
  };

  // Sync Bangladesh Government Public Holidays
  const handleAutoSyncBangladeshHolidays = () => {
    let countAdded = 0;
    BD_OFFICIAL_HOLIDAYS_2026.forEach((bh) => {
      const alreadyExists = holidays.some(
        (h) => h.startDate === bh.startDate && (h.name.includes(bh.name.split(" ")[0]) || h.name === bh.name)
      );
      if (!alreadyExists) {
        onAddHoliday({
          id: `hol-bd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          ...bh,
        });
        countAdded++;
      }
    });

    setSyncStatusMsg(
      isBangla
        ? `সফলভাবে গণপ্রজাতন্ত্রী বাংলাদেশের ২০২৬ সালের ${countAdded} টি গেজেটেড সরকারি ছুটি ক্যালেন্ডারে যুক্ত হয়েছে! প্রয়োজন অনুযায়ী যেকোনো ছুটির তারিখ ও মেয়াদ 'এডিট' করতে পারেন বা অপ্রয়োজনীয় ছুটি 'মুছে' ফেলতে পারেন।`
        : `Successfully synchronized ${countAdded} official Bangladesh Government Gazetted Public Holidays! You can edit dates/durations or delete any non-observed holiday.`
    );
    setTimeout(() => setSyncStatusMsg(null), 7000);
  };

  // Organization Foundation Day shortcut
  const foundationHoliday = useMemo(() => {
    return holidays.find(
      (h) =>
        h.type === "COMPANY" ||
        h.name.toLowerCase().includes("foundation") ||
        h.name.includes("প্রতিষ্ঠাবার্ষিকী")
    );
  }, [holidays]);

  const eidHolidays = useMemo(() => {
    return holidays.filter(
      (h) =>
        h.name.includes("ঈদ") ||
        h.name.toLowerCase().includes("eid")
    );
  }, [holidays]);

  const handleShiftHolidayDays = (h: Holiday, shiftDaysCount: number) => {
    try {
      const s = new Date(h.startDate);
      const e = new Date(h.endDate);
      s.setDate(s.getDate() + shiftDaysCount);
      e.setDate(e.getDate() + shiftDaysCount);
      const toYMD = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      };
      const updated: Holiday = {
        ...h,
        startDate: toYMD(s),
        endDate: toYMD(e),
        description: isBangla
          ? `${h.description || ""} (এনজিও মাঠপর্যায়ের কার্যক্রম ও খাদ্য/কুরবানি বিতরণের সুবিধার্থে ছুটির তারিখ ${shiftDaysCount > 0 ? "+" + shiftDaysCount : shiftDaysCount} দিন স্থানান্তর করা হয়েছে)`
          : `${h.description || ""} (Rescheduled for NGO field operations)`,
      };
      if (onUpdateHoliday) {
        onUpdateHoliday(updated);
        setSyncStatusMsg(
          isBangla
            ? `'${h.name}' ছুটির তারিখ সফলভাবে পরিবর্তন করে ${updated.startDate} থেকে ${updated.endDate} করা হয়েছে!`
            : `'${h.name}' rescheduled to ${updated.startDate} - ${updated.endDate}!`
        );
        setTimeout(() => setSyncStatusMsg(null), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfigureFoundationDay = () => {
    if (foundationHoliday) {
      handleOpenEditHoliday(foundationHoliday);
    } else {
      // Create new foundation day
      setEditingHoliday(null);
      setHolName(isBangla ? `${organizationName} প্রতিষ্ঠাবার্ষিকী ও বার্ষিক সংহতি দিবস` : `${organizationName} Foundation Day`);
      setHolType("COMPANY");
      setHolStart("2026-10-15");
      setHolEnd("2026-10-15");
      setHolDays(1);
      setHolDesc(isBangla ? "সংস্থার বাৎসরিক প্রতিষ্ঠাবার্ষিকী, সমাজকল্যাণ ও মানবিক কার্যক্রম দিবস।" : "Annual Organization Foundation & Humanitarian Gala Day.");
      setHolBranchIds([]);
      setShowHolidayModal(true);
    }
  };

  // Filtered Holidays List
  const sanitizedHolidays = useMemo(() => {
    return holidays.map((h) => ({
      ...h,
      name: h.name.replace(/Apex Global/gi, organizationName),
      description: (h.description || "").replace(/Apex Global/gi, organizationName),
    }));
  }, [holidays, organizationName]);

  const filteredHolidays = useMemo(() => {
    return sanitizedHolidays.filter((h) => {
      // Year filter
      if (holidayYearFilter !== "ALL" && !h.startDate.startsWith(holidayYearFilter)) {
        return false;
      }
      // Type filter
      if (holidayTypeFilter !== "ALL" && h.type !== holidayTypeFilter) {
        return false;
      }
      // Search query
      if (holidaySearchQuery.trim()) {
        const q = holidaySearchQuery.toLowerCase();
        const matchesName = h.name.toLowerCase().includes(q);
        const matchesDesc = (h.description || "").toLowerCase().includes(q);
        const matchesDate = h.startDate.includes(q) || h.endDate.includes(q);
        if (!matchesName && !matchesDesc && !matchesDate) {
          return false;
        }
      }
      return true;
    });
  }, [sanitizedHolidays, holidayYearFilter, holidayTypeFilter, holidaySearchQuery]);

  // Shifts Form Handlers
  const handleOpenAddShift = () => {
    setEditingShift(null);
    setShiftName("");
    setStartTime("09:00");
    setEndTime("18:00");
    setGraceMins(15);
    setHalfDayMins(120);
    setIsRotational(false);
    setIsFlexible(false);
    setShiftWeekendDays(localWeekendDays);
    setShowShiftModal(true);
  };

  const handleOpenEditShift = (s: Shift) => {
    setEditingShift(s);
    setShiftName(s.name);
    setStartTime(s.startTime);
    setEndTime(s.endTime);
    setGraceMins(s.gracePeriodMinutes || 15);
    setHalfDayMins(s.halfDayAfterMinutes || 120);
    setIsRotational(!!s.isRotational);
    setIsFlexible(!!s.isFlexible);
    setShiftWeekendDays(s.weekendDays || [5, 6]);
    setShowShiftModal(true);
  };

  const handleShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingShift) {
      const updated: Shift = {
        ...editingShift,
        name: shiftName,
        startTime,
        endTime,
        gracePeriodMinutes: Number(graceMins),
        halfDayAfterMinutes: Number(halfDayMins),
        weekendDays: shiftWeekendDays,
        isRotational,
        isFlexible,
      };
      if (onUpdateShift) {
        onUpdateShift(updated);
      }
      setSyncStatusMsg(
        isBangla
          ? `সফলভাবে '${shiftName}' শিফটের সময়সূচি ও সাপ্তাহিক ছুটি আপডেট করা হয়েছে!`
          : `Shift '${shiftName}' updated successfully!`
      );
    } else {
      const newShift: Shift = {
        id: `shift-${Date.now()}`,
        name: shiftName,
        startTime,
        endTime,
        gracePeriodMinutes: Number(graceMins),
        halfDayAfterMinutes: Number(halfDayMins),
        breakDurationMinutes: 60,
        weekendDays: shiftWeekendDays,
        isRotational,
        isFlexible,
      };
      onAddShift(newShift);
      setSyncStatusMsg(
        isBangla
          ? `নতুন শিফট '${shiftName}' সফলভাবে তৈরি হয়েছে!`
          : `New shift '${shiftName}' created successfully!`
      );
    }
    setShowShiftModal(false);
    setTimeout(() => setSyncStatusMsg(null), 5000);
  };

  const toggleShiftWeekendDay = (dayIdx: number) => {
    if (shiftWeekendDays.includes(dayIdx)) {
      setShiftWeekendDays(shiftWeekendDays.filter((d) => d !== dayIdx));
    } else {
      setShiftWeekendDays([...shiftWeekendDays, dayIdx]);
    }
  };

  // Toggle Organization Weekend Day
  const handleToggleOrgWeekendDay = (dayIdx: number) => {
    if (localWeekendDays.includes(dayIdx)) {
      setLocalWeekendDays(localWeekendDays.filter((d) => d !== dayIdx));
    } else {
      setLocalWeekendDays([...localWeekendDays, dayIdx]);
    }
  };

  // Quick Preset Weekend Selection
  const applyWeekendPreset = (days: number[]) => {
    setLocalWeekendDays(days);
  };

  // Save Weekend Rules
  const handleSaveWeekendRules = () => {
    if (onUpdateWeekendDays) {
      onUpdateWeekendDays(localWeekendDays);
    }

    // Also update all shifts if checked
    if (applyWeekendToAllShifts && onUpdateShift) {
      shifts.forEach((s) => {
        onUpdateShift({
          ...s,
          weekendDays: localWeekendDays,
        });
      });
    }

    const dayLabels = localWeekendDays
      .map((idx) => {
        const w = WEEKDAY_NAMES.find((d) => d.dayIndex === idx);
        return isBangla ? w?.labelBn : w?.label;
      })
      .join(", ");

    setSyncStatusMsg(
      isBangla
        ? `সাপ্তাহিক ছুটির নিয়ম সফলভাবে সংরক্ষিত হয়েছে! সাপ্তাহিক বন্ধ: [${dayLabels || "কোনো ছুটি নেই"}] (${localWeekendDays.length} দিন ছুটি, ${7 - localWeekendDays.length} দিন কর্মদিবস)।`
        : `Company weekend rules saved! Weekend off: [${dayLabels || "None"}].`
    );
    setTimeout(() => setSyncStatusMsg(null), 6000);
  };

  return (
    <div id="shifts-holidays-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{isBangla ? "শিফট, কর্মঘণ্টা ও ছুটির ব্যবস্থাপনা" : "Shifts, Working Hours & Holidays"}</span>
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
              {organizationName}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            {isBangla ? "শিফট ও ছুটির ক্যালেন্ডার নিয়ন্ত্রণ" : "Shift Rosters, Weekend Policy & Holiday Management"}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            {isBangla
              ? "বাংলাদেশ সরকারি গেজেটেড ছুটি অটো-সিঙ্ক করুন, ঈদের কাজের পর স্টাফদের সুবিধাজনক তারিখে কাস্টম ছুটি এডিট/রি-শিডিউল করুন, যেকোনো অপ্রয়োজনীয় ছুটি মুছে ফেলুন এবং যেকোনো বারকে (যেমন শুক্রবারের বদলে মঙ্গলবার) সাপ্তাহিক ছুটি হিসেবে নির্ধারণ করুন।"
              : "Auto-sync BD gazetted holidays, reschedule post-Eid operations leaves with custom dates/durations, remove non-observed holidays, and set any weekday (e.g. Tuesday instead of Friday) as your weekly weekend."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main Tab Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              id="tab-btn-holidays"
              onClick={() => setActiveTab("HOLIDAYS")}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "HOLIDAYS"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isBangla ? `ছুটির ক্যালেন্ডার (${holidays.length})` : `Holidays (${holidays.length})`}</span>
            </button>
            <button
              id="tab-btn-weekend-rules"
              onClick={() => setActiveTab("WEEKEND_RULES")}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "WEEKEND_RULES"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isBangla ? "উইকেন্ড রুল ও কর্মদিবস" : "Weekend & Working Days"}</span>
            </button>
            <button
              id="tab-btn-shifts"
              onClick={() => setActiveTab("SHIFTS")}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "SHIFTS"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isBangla ? `শিফট রস্টার (${shifts.length})` : `Shifts (${shifts.length})`}</span>
            </button>
          </div>

          {activeTab === "HOLIDAYS" && (
            <div className="flex items-center gap-2">
              <button
                id="btn-auto-sync-bd-holidays"
                onClick={handleAutoSyncBangladeshHolidays}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl border border-emerald-500/40 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                title={isBangla ? "বাংলাদেশ সরকারের গেজেটেড ছুটিগুলো ক্যালেন্ডারে আনুন" : "Auto sync BD gazetted holidays"}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isBangla ? "🇧🇩 বিডি ছুটি অটো-সিঙ্ক" : "🇧🇩 Auto-Sync BD"}</span>
              </button>

              <button
                id="btn-add-custom-holiday"
                onClick={handleOpenAddHoliday}
                className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isBangla ? "+ নিজস্ব ছুটি যোগ" : "+ Add Holiday"}</span>
              </button>
            </div>
          )}

          {activeTab === "SHIFTS" && (
            <button
              id="btn-add-new-shift"
              onClick={handleOpenAddShift}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isBangla ? "+ নতুন শিফট তৈরি" : "+ Create Shift"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync / Action Notification Alert */}
      {syncStatusMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{syncStatusMsg}</span>
          </div>
          <button
            onClick={() => setSyncStatusMsg(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: HOLIDAYS MANAGEMENT */}
      {activeTab === "HOLIDAYS" && (
        <div className="space-y-4">
          {/* Organization Foundation Day Highlight Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 dark:from-slate-900 dark:via-teal-950/30 dark:to-slate-900 border border-teal-200 dark:border-teal-800/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-teal-600/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-600/20 text-teal-800 dark:text-teal-200 border border-teal-500/30">
                    {isBangla ? "সংস্থার নিজস্ব দিবস" : "Company Foundation Day"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">•</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {foundationHoliday ? `${foundationHoliday.totalDays} ${isBangla ? "দিন ছুটি" : "Day Off"}` : isBangla ? "নির্ধারিত হয়নি" : "Not Set"}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {foundationHoliday
                    ? foundationHoliday.name
                    : isBangla
                    ? `${organizationName} প্রতিষ্ঠাবার্ষিকী ও মানবিক সেবা দিবস`
                    : `${organizationName} Foundation Day`}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {foundationHoliday
                    ? `${isBangla ? "নির্ধারিত তারিখ:" : "Scheduled Date:"} ${foundationHoliday.startDate} ➔ ${foundationHoliday.endDate} (${foundationHoliday.description})`
                    : isBangla
                    ? "আপনার প্রতিষ্ঠানের বাৎসরিক প্রতিষ্ঠাবার্ষিকীর তারিখ নির্ধারণ করুন এবং স্টাফদের জন্য ছুটি ঘোষণা করুন।"
                    : "Configure your organization's annual anniversary date and declare custom employee holiday."}
                </p>
              </div>
            </div>

            <button
              id="btn-configure-foundation-day"
              onClick={handleConfigureFoundationDay}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer self-start md:self-auto"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>
                {foundationHoliday
                  ? isBangla ? "তারিখ ও মেয়াদ পরিবর্তন" : "Change Foundation Date"
                  : isBangla ? "প্রতিষ্ঠাবার্ষিকীর তারিখ ফিক্স করুন" : "Set Foundation Day"}
              </span>
            </button>
          </div>

          {/* NGO Field Operations & Eid Holiday Rescheduling Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-amber-950/20 border border-amber-300 dark:border-amber-700/50 shadow-xs space-y-3.5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30">
                      {isBangla ? "এনজিও ফিল্ড কার্যক্রম ও ছুটির তারিখ শিডিউল" : "NGO Field Operations & Eid Rescheduling"}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {isBangla
                      ? "ঈদের দিনে এনজিও ফিল্ড কাজ থাকলে ছুটির বিকল্প তারিখ নির্ধারণ"
                      : "Eid Holiday Override & Flexible Dates for Field Operations"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {isBangla
                      ? "এনজিওর কুরবানি বা ফিতরা বিতরণ কার্যক্রমে ঈদের দিনে স্টাফদের ডিউটি থাকলে, তাদের ছুটি ঈদের ২/৩ দিন পরে স্থানান্তর করুন বা যেকোনো সুবিধাজনক তারিখে এডিট করে নিন।"
                      : "If NGO staff operate on festival days for relief/qurbani distribution, adjust the holiday schedule to take off on alternate dates."}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Eid Holiday Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-amber-200/80 dark:border-amber-800/40">
              {eidHolidays.length === 0 ? (
                <div className="text-xs text-slate-500 p-2 col-span-2 flex items-center justify-between">
                  <span>
                    {isBangla
                      ? "তালিকায় কোনো ঈদের ছুটি পাওয়া যায়নি। 'বাংলাদেশ ছুটি অটো-সিঙ্ক' বাটনে ক্লিক করে সরকারি গেজেটেড ছুটি যুক্ত করুন।"
                      : "No Eid holidays currently listed. Auto-sync BD holidays to load."}
                  </span>
                  <button
                    onClick={handleAutoSyncBangladeshHolidays}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold"
                  >
                    {isBangla ? "ঈদের ছুটি সিঙ্ক করুন" : "Sync Holidays"}
                  </button>
                </div>
              ) : (
                eidHolidays.map((eh) => (
                  <div
                    key={eh.id}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/60 flex flex-col justify-between gap-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{eh.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                          {eh.totalDays || calculateDays(eh.startDate, eh.endDate)} {isBangla ? "দিন" : "Days"}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-1">
                        📅 {eh.startDate} ➔ {eh.endDate}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <button
                        onClick={() => handleOpenEditHoliday(eh)}
                        className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>{isBangla ? "কাস্টম তারিখ এডিট" : "Edit Dates"}</span>
                      </button>
                      <button
                        onClick={() => handleShiftHolidayDays(eh, 2)}
                        className="px-2.5 py-1 bg-teal-500/15 hover:bg-teal-500/25 text-teal-800 dark:text-teal-200 text-[11px] font-bold rounded-lg transition-colors"
                        title={isBangla ? "ঈদের ২ দিন পর থেকে ছুটি কার্যকর করুন" : "Shift +2 days"}
                      >
                        {isBangla ? "+২ দিন পর স্থানান্তর" : "+2 Days Shift"}
                      </button>
                      <button
                        onClick={() => handleShiftHolidayDays(eh, 3)}
                        className="px-2.5 py-1 bg-teal-500/15 hover:bg-teal-500/25 text-teal-800 dark:text-teal-200 text-[11px] font-bold rounded-lg transition-colors"
                        title={isBangla ? "ঈদের ৩ দিন পর থেকে ছুটি কার্যকর করুন" : "Shift +3 days"}
                      >
                        {isBangla ? "+৩ দিন পর স্থানান্তর" : "+3 Days Shift"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Filters, Search & Counter */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search box */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={holidaySearchQuery}
                  onChange={(e) => setHolidaySearchQuery(e.target.value)}
                  placeholder={isBangla ? "ছুটি খুঁজুন (যেমন: ঈদ, জন্মাষ্টমী)..." : "Search holidays (e.g. Eid, Day)..."}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 text-xs"
                />
                {holidaySearchQuery && (
                  <button
                    onClick={() => setHolidaySearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Year Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600 dark:text-slate-400">{isBangla ? "বছর:" : "Year:"}</span>
                <select
                  value={holidayYearFilter}
                  onChange={(e) => setHolidayYearFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white cursor-pointer focus:outline-none"
                >
                  <option value="ALL">{isBangla ? "সকল বছর" : "All Years"}</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600 dark:text-slate-400">{isBangla ? "ধরন:" : "Type:"}</span>
                <select
                  value={holidayTypeFilter}
                  onChange={(e) => setHolidayTypeFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white cursor-pointer focus:outline-none"
                >
                  <option value="ALL">{isBangla ? "সকল ধরন" : "All Types"}</option>
                  <option value="FESTIVAL">{isBangla ? "উৎসব ও ধর্মীয়" : "Festival"}</option>
                  <option value="NATIONAL">{isBangla ? "জাতীয় দিবস" : "National"}</option>
                  <option value="COMPANY">{isBangla ? "প্রাতিষ্ঠানিক ছুটি" : "Company"}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 font-bold">
                {isBangla ? `মোট প্রদর্শিত ছুটি: ${filteredHolidays.length} টি` : `Showing: ${filteredHolidays.length}`}
              </span>
            </div>
          </div>

          {/* Holidays Card Grid */}
          {filteredHolidays.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <CalendarX className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isBangla ? "কোনো তালিকাভুক্ত ছুটি পাওয়া যায়নি" : "No holidays found"}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {isBangla
                  ? "ফিল্টার পরিবর্তন করুন অথবা '🇧🇩 বিডি ছুটি অটো-সিঙ্ক' বাটনে ক্লিক করে বাংলাদেশের সরকারি ছুটির তালিকা যুক্ত করুন।"
                  : "Change your search filters or click 'Auto-Sync BD Holidays' to load gazetted public holidays."}
              </p>
              <button
                onClick={handleAutoSyncBangladeshHolidays}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isBangla ? "বাংলাদেশ ছুটির তালিকা সিঙ্ক করুন" : "Sync BD Gazetted Holidays"}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHolidays.map((h) => {
                const isEidHoliday = h.name.includes("ঈদ") || h.name.toLowerCase().includes("eid");
                return (
                  <div
                    key={h.id}
                    id={`holiday-card-${h.id}`}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 transition-all flex flex-col justify-between shadow-xs dark:shadow-md space-y-3"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            h.type === "FESTIVAL"
                              ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30"
                              : h.type === "NATIONAL"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                              : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          {h.type === "FESTIVAL"
                            ? isBangla ? "ধর্মীয় ও উৎসবের ছুটি" : "Festival Holiday"
                            : h.type === "NATIONAL"
                            ? isBangla ? "জাতীয় দিবস" : "National Holiday"
                            : isBangla ? "কর্পোরেট / প্রাতিষ্ঠানিক" : "Corporate"}
                        </span>

                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 font-bold text-[10px] font-mono">
                          {h.totalDays || calculateDays(h.startDate, h.endDate)} {isBangla ? "দিন" : "Days"}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {h.name}
                        </h3>
                        {isEidHoliday && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                            {isBangla ? "💡 এনজিও কাজের সুবিধার্থে তারিখ এডিট করা যাবে" : "Flexible post-distribution dates"}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {h.description || (isBangla ? "সরকারি গেজেটেড ছুটি।" : "Official gazetted public holiday.")}
                      </p>

                      {/* Date Range Block */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                          <span className="font-bold">{h.startDate}</span>
                        </div>
                        {h.startDate !== h.endDate ? (
                          <>
                            <span className="text-slate-400 dark:text-slate-500 font-bold">➔</span>
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <span className="font-bold">{h.endDate}</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-sans">
                            {isBangla ? "১ দিনের ছুটি" : "Single day"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons: EDIT & DELETE */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        id={`btn-edit-holiday-${h.id}`}
                        onClick={() => handleOpenEditHoliday(h)}
                        className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title={isBangla ? "ছুটির তারিখ ও মেয়াদ পরিবর্তন করুন" : "Edit holiday dates"}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{isBangla ? "এডিট / তারিখ পরিবর্তন" : "Edit Schedule"}</span>
                      </button>

                      <button
                        id={`btn-delete-holiday-${h.id}`}
                        onClick={() => handleDeleteHolidayClick(h)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title={isBangla ? "ছুটিটি তালিকা থেকে মুছে ফেলুন (যেমন জন্মাষ্টমী বা অন্য অপ্রয়োজনীয় ছুটি)" : "Delete holiday"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isBangla ? "মুছুন" : "Delete"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WEEKEND RULES & WORKING DAYS CONFIG */}
      {activeTab === "WEEKEND_RULES" && (
        <div className="space-y-6">
          {/* Overview Info Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isBangla
                      ? "সাপ্তাহিক ছুটি ও কর্মদিবস নির্ধারণ (Weekly Weekend & Working Days Config)"
                      : "Weekly Weekend & Working Days Configuration"}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                  {isBangla
                    ? "সপ্তাহের কোন কোন দিন আপনার এনজিও/প্রতিষ্ঠান কাজ করাবে এবং কোন দিন সাপ্তাহিক ছুটি থাকবে তা নিজের ইচ্ছামতো নির্বাচন করুন। উদাহরণস্বরূপ: শুক্রবারের বদলে মঙ্গলবার অথবা শুক্রবার ও শনিবার দুটোই ছুটি রাখতে পারেন।"
                    : "Customize which days of the week are working days and which are weekend holidays. For example, make Tuesday your off day instead of Friday, or pick any combination."}
                </p>
              </div>

              {/* Status Pill */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">{isBangla ? "সাপ্তাহিক বন্ধ:" : "Weekend Days:"}</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {localWeekendDays.length} {isBangla ? "দিন" : "Days"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">{isBangla ? "সাপ্তাহিক কর্মদিবস:" : "Working Days:"}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {7 - localWeekendDays.length} {isBangla ? "দিন" : "Days"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {isBangla ? "দ্রুত প্রিসেট নির্বাচন করুন (Quick Presets):" : "Select a Standard Preset:"}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyWeekendPreset([5, 6])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    localWeekendDays.length === 2 && localWeekendDays.includes(5) && localWeekendDays.includes(6)
                      ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-500"
                  }`}
                >
                  🇧🇩 {isBangla ? "শুক্রবার ও শনিবার ছুটি (২ দিন বন্ধ, ৫ কর্মদিবস)" : "Friday & Saturday (Standard)"}
                </button>

                <button
                  type="button"
                  onClick={() => applyWeekendPreset([5])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    localWeekendDays.length === 1 && localWeekendDays.includes(5)
                      ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-500"
                  }`}
                >
                  🕌 {isBangla ? "শুধুমাত্র শুক্রবার ছুটি (১ দিন বন্ধ, ৬ কর্মদিবস)" : "Friday Only (6-Day Work Week)"}
                </button>

                <button
                  type="button"
                  onClick={() => applyWeekendPreset([2])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    localWeekendDays.length === 1 && localWeekendDays.includes(2)
                      ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-500"
                  }`}
                >
                  🔄 {isBangla ? "শুধুমাত্র মঙ্গলবার ছুটি (১ দিন বন্ধ - ব্যবহারকারীর পছন্দ)" : "Tuesday Only (Custom Off Day)"}
                </button>

                <button
                  type="button"
                  onClick={() => applyWeekendPreset([0, 6])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    localWeekendDays.length === 2 && localWeekendDays.includes(0) && localWeekendDays.includes(6)
                      ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-500"
                  }`}
                >
                  🌍 {isBangla ? "শনিবার ও রবিবার ছুটি (আন্তর্জাতিক শিডিউল)" : "Saturday & Sunday"}
                </button>

                <button
                  type="button"
                  onClick={() => applyWeekendPreset([0])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    localWeekendDays.length === 1 && localWeekendDays.includes(0)
                      ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-500"
                  }`}
                >
                  🌟 {isBangla ? "শুধুমাত্র রবিবার ছুটি" : "Sunday Only"}
                </button>
              </div>
            </div>

            {/* Interactive 7-Day Matrix */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {isBangla
                  ? "সপ্তাহের প্রতিটি দিনের স্ট্যাটাস (ক্লিক করে কর্মদিবস বা সাপ্তাহিক ছুটি টগল করুন):"
                  : "7-Day Interactive Matrix (Click to toggle Working Day vs Weekend):"}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                {WEEKDAY_NAMES.map((wd) => {
                  const isWeekend = localWeekendDays.includes(wd.dayIndex);
                  return (
                    <div
                      key={wd.dayIndex}
                      id={`day-card-${wd.short.toLowerCase()}`}
                      onClick={() => handleToggleOrgWeekendDay(wd.dayIndex)}
                      className={`p-4 rounded-xl border text-center transition-all cursor-pointer select-none space-y-2.5 ${
                        isWeekend
                          ? "bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/15"
                          : "bg-teal-500/10 border-teal-500/40 hover:bg-teal-500/15"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-500 dark:text-slate-400">{wd.short}</span>
                        {isWeekend ? (
                          <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <Briefcase className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {isBangla ? wd.labelBn : wd.label}
                        </h4>
                        <span
                          className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isWeekend
                              ? "bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30"
                              : "bg-teal-500/20 text-teal-800 dark:text-teal-200 border border-teal-500/30"
                          }`}
                        >
                          {isWeekend
                            ? isBangla ? "সাপ্তাহিক ছুটি" : "Weekend Off"
                            : isBangla ? "কর্মদিবস" : "Working Day"}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {isWeekend
                          ? isBangla ? "অফিস বন্ধ থাকবে" : "Office Closed"
                          : isBangla ? "নিয়মিত কাজের দিন" : "Active Office Day"}
                      </p>

                      <div className="pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                        <span className="text-[10px] text-slate-400 hover:underline">
                          {isWeekend
                            ? isBangla ? "কর্মদিবস করুন" : "Set as Work Day"
                            : isBangla ? "ছুটি ঘোষণা করুন" : "Set as Weekend"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sync to Shifts & Save Button */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyWeekendToAllShifts}
                  onChange={(e) => setApplyWeekendToAllShifts(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                />
                <span>
                  {isBangla
                    ? "সংস্থার সকল শিফট রস্টারে এই সাপ্তাহিক ছুটির নিয়ম স্বয়ংক্রিয়ভাবে আপডেট করুন"
                    : "Automatically apply this weekend configuration to all active shift rosters"}
                </span>
              </label>

              <button
                id="btn-save-weekend-rules"
                type="button"
                onClick={handleSaveWeekendRules}
                className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isBangla ? "উইকেন্ড রুল সংরক্ষণ করুন" : "Save Weekend Rules"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SHIFTS MANAGEMENT */}
      {activeTab === "SHIFTS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((s) => (
            <div
              key={s.id}
              id={`shift-card-${s.id}`}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 transition-all space-y-4 shadow-xs dark:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                      {s.isFlexible
                        ? isBangla ? "ফ্লেক্সিবল সময়" : "Flexible Hours"
                        : s.isRotational
                        ? isBangla ? "ঘূর্ণায়মান রোস্টার" : "Rotational Shift"
                        : isBangla ? "ফিক্সড রেগুলার" : "Fixed Regular"}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{s.name}</h3>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">
                      {isBangla ? "শুরুর সময়" : "Start Time"}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{s.startTime}</span>
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 font-bold">to</span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">
                      {isBangla ? "শেষের সময়" : "End Time"}
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{s.endTime}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{isBangla ? "গ্রেস পিরিয়ড:" : "Grace Period:"}</span>
                    <span className="font-semibold text-teal-700 dark:text-teal-300">{s.gracePeriodMinutes} {isBangla ? "মিনিট" : "Minutes"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{isBangla ? "হাফ-ডে কাটঅফ:" : "Half-Day Threshold:"}</span>
                    <span>{isBangla ? `${s.halfDayAfterMinutes} মিনিট পর` : `After ${s.halfDayAfterMinutes} Mins`}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">{isBangla ? "সাপ্তাহিক ছুটি:" : "Weekend Days:"}</span>
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {(s.weekendDays || [5, 6]).map((dayIdx) => {
                        const dayObj = WEEKDAY_NAMES.find((w) => w.dayIndex === dayIdx);
                        return (
                          <span
                            key={dayIdx}
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                          >
                            {isBangla ? dayObj?.labelBn : dayObj?.short}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: EDIT & DELETE SHIFT */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  id={`btn-edit-shift-${s.id}`}
                  onClick={() => handleOpenEditShift(s)}
                  className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isBangla ? "শিফট এডিট" : "Edit Shift"}</span>
                </button>

                {onDeleteShift && (
                  <button
                    id={`btn-delete-shift-${s.id}`}
                    onClick={() => {
                      if (confirm(isBangla ? `আপনি কি '${s.name}' শিফটটি মুছে ফেলতে চান?` : `Delete shift '${s.name}'?`)) {
                        onDeleteShift(s.id);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isBangla ? "মুছুন" : "Delete"}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD / EDIT HOLIDAY */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-lg text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>
                  {editingHoliday
                    ? isBangla ? "ছুটি সম্পাদনা ও পুনঃনির্ধারণ (Edit Holiday Schedule)" : "Edit Holiday Schedule"
                    : isBangla ? "নতুন কর্পোরেট ছুটির তালিকাভুক্ত করুন" : "Add Corporate Holiday"}
                </span>
              </h3>
              <button
                onClick={() => setShowHolidayModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleHolidaySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  {isBangla ? "ছুটির শিরোনাম *" : "Holiday Title *"}
                </label>
                <input
                  type="text"
                  value={holName}
                  onChange={(e) => setHolName(e.target.value)}
                  placeholder={
                    isBangla
                      ? "যেমন: পবিত্র ঈদুল আযহা পরবর্তী বিশেষ ছুটি / বার্ষিক প্রতিষ্ঠাবার্ষিকী"
                      : "e.g. Holy Eid-ul-Adha Extended Leaves"
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  {isBangla ? "ছুটির ক্যাটাগরি" : "Holiday Classification"}
                </label>
                <select
                  value={holType}
                  onChange={(e) => setHolType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="FESTIVAL">{isBangla ? "ধর্মীয় ও উৎসবের ছুটি (Festival Holiday)" : "Festival Holiday"}</option>
                  <option value="NATIONAL">{isBangla ? "জাতীয় দিবস (National Gazetted Day)" : "National Day"}</option>
                  <option value="COMPANY">{isBangla ? "প্রতিষ্ঠানিক ছুটি / প্রতিষ্ঠাবার্ষিকী (Company Day)" : "Company Holiday"}</option>
                </select>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {isBangla ? "শুরুর তারিখ *" : "Start Date *"}
                  </label>
                  <input
                    type="date"
                    value={holStart}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setHolStart(newStart);
                      if (holEnd < newStart) {
                        setHolEnd(newStart);
                        setHolDays(1);
                      } else {
                        setHolDays(calculateDays(newStart, holEnd));
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {isBangla ? "শেষের তারিখ *" : "End Date *"}
                  </label>
                  <input
                    type="date"
                    value={holEnd}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      setHolEnd(newEnd);
                      setHolDays(calculateDays(holStart, newEnd));
                    }}
                    min={holStart}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              {/* Quick Duration Buttons (3, 5, 7, 10, 15 days) */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {isBangla ? "দ্রুত ছুটির মেয়াদ নির্ধারণ (এনজিওর ঈদের কার্যক্রমোত্তর ছুটি):" : "Quick Duration Preset:"}
                  </span>
                  <span className="font-bold text-teal-700 dark:text-teal-300 font-mono">
                    {holDays} {isBangla ? "দিন ছুটি" : "Days Total"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 3, 5, 7, 10, 15].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => applyPresetDuration(d)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        holDays === d
                          ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-500"
                      }`}
                    >
                      {d} {isBangla ? "দিন" : "Days"}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isBangla
                    ? "💡 ঈদের ত্রাণ, খাদ্যপ্যাকেজ বা কোরবানির মাংস বিতরণ কার্যক্রম শেষে যে কয়দিন ছুটি দিতে চান এখান থেকে এক ক্লিকে মেয়াদ সেট করুন।"
                    : "Select how many vacation days to grant after field operations wrap up."}
                </p>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  {isBangla ? "ছুটির সার্কুলার ও বিবরণ" : "Holiday Circular Details & Announcement"}
                </label>
                <textarea
                  rows={3}
                  value={holDesc}
                  onChange={(e) => setHolDesc(e.target.value)}
                  placeholder={
                    isBangla
                      ? "যেমন: ঈদের প্রথম ৩ দিন মাঠপর্যায়ের কার্যক্রম সম্পন্ন হওয়ার পর সকল কর্মকর্তা-কর্মচারীদের জন্য এই বিশেষ ছুটি ঘোষিত হলো..."
                      : "Official circular announcement for staff..."
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowHolidayModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-md shadow-teal-500/20 cursor-pointer"
                >
                  {editingHoliday
                    ? isBangla ? "পরিবর্তন সংরক্ষণ করুন" : "Save Changes"
                    : isBangla ? "ছুটি প্রকাশ করুন" : "Publish Holiday"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SHIFT */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>
                  {editingShift
                    ? isBangla ? "শিফট রোস্টার সম্পাদনা" : "Edit Shift Roster"
                    : isBangla ? "নতুন শিফট তৈরি করুন" : "Add Shift Roster"}
                </span>
              </h3>
              <button
                onClick={() => setShowShiftModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleShiftSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  {isBangla ? "শিফটের নাম *" : "Shift Name *"}
                </label>
                <input
                  type="text"
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  placeholder="e.g. Regular NGO Day Shift / Field Operations"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {isBangla ? "শুরুর সময় *" : "Start Time *"}
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {isBangla ? "শেষের সময় *" : "End Time *"}
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {isBangla ? "গ্রেস পিরিয়ড (মিনিট)" : "Grace Period (Mins)"}
                  </label>
                  <input
                    type="number"
                    value={graceMins}
                    onChange={(e) => setGraceMins(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {isBangla ? "হাফ-ডে (মিনিট পর)" : "Half-Day After (Mins)"}
                  </label>
                  <input
                    type="number"
                    value={halfDayMins}
                    onChange={(e) => setHalfDayMins(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Weekend Days Selector for this Shift */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-bold">
                  {isBangla ? "এই শিফটের সাপ্তাহিক ছুটির দিন নির্বাচন করুন:" : "Select Weekend Days for this Shift:"}
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAY_NAMES.map((wd) => {
                    const isSelected = shiftWeekendDays.includes(wd.dayIndex);
                    return (
                      <button
                        key={wd.dayIndex}
                        type="button"
                        onClick={() => toggleShiftWeekendDay(wd.dayIndex)}
                        className={`py-1.5 text-[11px] font-bold rounded-lg transition-colors text-center cursor-pointer ${
                          isSelected
                            ? "bg-teal-600 text-white shadow-xs"
                            : "bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                        }`}
                      >
                        {isBangla ? wd.labelBn.slice(0, 2) : wd.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFlexible}
                    onChange={(e) => setIsFlexible(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-teal-600"
                  />
                  <span>{isBangla ? "ফ্লেক্সিবল ওয়ার্কিং আওয়ারস (Flexible Working Hours)" : "Flexible Working Hours"}</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRotational}
                    onChange={(e) => setIsRotational(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-teal-600"
                  />
                  <span>{isBangla ? "ঘূর্ণায়মান শিফট রোস্টার (Rotational Roster)" : "Rotational Shift Roster"}</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-md shadow-teal-500/20 cursor-pointer"
                >
                  {editingShift
                    ? isBangla ? "শিফট আপডেট করুন" : "Update Shift"
                    : isBangla ? "শিফট সংরক্ষণ" : "Save Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
