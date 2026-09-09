import React, { useState } from "react";
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
  Globe2,
  Check,
  CheckSquare,
  Square,
  Filter,
  X
} from "lucide-react";
import { Shift, Holiday, Branch } from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";

interface ShiftsHolidaysViewProps {
  shifts: Shift[];
  holidays: Holiday[];
  branches: Branch[];
  onAddShift: (shift: Shift) => void;
  onAddHoliday: (holiday: Holiday) => void;
  onDeleteHoliday?: (holidayId: string) => void;
  onDeleteShift?: (shiftId: string) => void;
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
    description: "Holy Eid-ul-Fitr Grand Holiday Celebrations.",
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
    description: "Festival of Sacrifice & Gazetted Public Holiday.",
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
  onAddHoliday,
  onDeleteHoliday,
  onDeleteShift,
}) => {
  const { t, isBangla } = useThemeLanguage();

  const [activeTab, setActiveTab] = useState<"SHIFTS" | "HOLIDAYS" | "WEEKEND_RULES">("SHIFTS");
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // New Shift Form State
  const [newShiftName, setNewShiftName] = useState("");
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("18:00");
  const [newGraceMins, setNewGraceMins] = useState(15);
  const [newHalfDayMins, setNewHalfDayMins] = useState(120);
  const [newIsRotational, setNewIsRotational] = useState(false);
  const [newIsFlexible, setNewIsFlexible] = useState(false);
  const [newShiftWeekends, setNewShiftWeekends] = useState<number[]>([5, 6]); // Friday, Saturday

  // New Holiday Form State
  const [newHolName, setNewHolName] = useState("");
  const [newHolType, setNewHolType] = useState<"NATIONAL" | "FESTIVAL" | "COMPANY">("FESTIVAL");
  const [newHolStart, setNewHolStart] = useState("2026-10-15");
  const [newHolEnd, setNewHolEnd] = useState("2026-10-15");
  const [newHolDesc, setNewHolDesc] = useState("");

  // Filter Holidays by Year
  const [holidayYearFilter, setHolidayYearFilter] = useState<string>("ALL");

  const filteredHolidays = holidays.filter((h) => {
    if (holidayYearFilter === "ALL") return true;
    return h.startDate.startsWith(holidayYearFilter);
  });

  const handleShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddShift({
      id: `shift-${Date.now()}`,
      name: newShiftName,
      startTime: newStartTime,
      endTime: newEndTime,
      gracePeriodMinutes: Number(newGraceMins),
      halfDayAfterMinutes: Number(newHalfDayMins),
      breakDurationMinutes: 60,
      weekendDays: newShiftWeekends,
      isRotational: newIsRotational,
      isFlexible: newIsFlexible,
    });
    setShowShiftModal(false);
    setNewShiftName("");
  };

  const handleHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(newHolStart);
    const end = new Date(newHolEnd);
    const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    onAddHoliday({
      id: `hol-${Date.now()}`,
      name: newHolName,
      type: newHolType,
      startDate: newHolStart,
      endDate: newHolEnd,
      totalDays: days,
      description: newHolDesc || "Official corporate holiday",
      applicableBranchIds: [],
    });
    setShowHolidayModal(false);
    setNewHolName("");
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
        ? `সফলভাবে গণপ্রজাতন্ত্রী বাংলাদেশের ২০২৬-২০২৭ সালের ${countAdded} টি সরকারি গেজেটেড ছুটি ক্যালেন্ডারে যুক্ত হয়েছে!`
        : `Successfully synchronized ${countAdded} official Bangladesh Government Gazetted Public Holidays!`
    );
    setTimeout(() => setSyncStatusMsg(null), 6000);
  };

  const toggleWeekendDay = (dayIdx: number) => {
    if (newShiftWeekends.includes(dayIdx)) {
      setNewShiftWeekends(newShiftWeekends.filter((d) => d !== dayIdx));
    } else {
      setNewShiftWeekends([...newShiftWeekends, dayIdx]);
    }
  };

  return (
    <div id="shifts-holidays-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{isBangla ? "রোস্টার ও ছুটির ক্যালেন্ডার" : "Shift Rosters & Holiday Calendar"}</span>
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400">
              {isBangla ? "বাংলাদেশ সরকারি ছুটির গেজেট ও সাপ্তাহিক ছুটি নির্ধারণ" : "Bangladesh Gazetted Holidays & Weekend Rules"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2">
            {isBangla ? "শিফট শিডিউলিং ও সার্বজনীন ছুটির তালিকা" : "Shift Scheduling & Universal Corporate Holidays"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isBangla
              ? "অটোমেটিক বাংলাদেশ সরকারি ছুটি যুক্ত করুন, সাপ্তাহিক ছুটির দিন নির্ধারণ করুন এবং শিফট কনফিগার করুন"
              : "Auto-sync Bangladesh gazetted public holidays, set custom weekend days & configure flexible/rotational shifts"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab("SHIFTS")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "SHIFTS"
                  ? "bg-teal-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isBangla ? `শিফট রস্টার (${shifts.length})` : `Shifts (${shifts.length})`}
            </button>
            <button
              onClick={() => setActiveTab("HOLIDAYS")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "HOLIDAYS"
                  ? "bg-teal-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isBangla ? `ছুটির ক্যালেন্ডার (${holidays.length})` : `Holidays (${holidays.length})`}
            </button>
            <button
              onClick={() => setActiveTab("WEEKEND_RULES")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "WEEKEND_RULES"
                  ? "bg-teal-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isBangla ? "সাপ্তাহিক ছুটি কনফিগ" : "Weekend Rules"}
            </button>
          </div>

          {activeTab === "HOLIDAYS" && (
            <button
              onClick={handleAutoSyncBangladeshHolidays}
              className="px-4 py-2 bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl border border-emerald-500/40 shadow flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-4 h-4 text-emerald-300" />
              <span>{isBangla ? "🇧🇩 বাংলাদেশ ছুটি অটো-সিঙ্ক" : "🇧🇩 Auto-Sync BD Holidays"}</span>
            </button>
          )}

          <button
            onClick={() => (activeTab === "SHIFTS" ? setShowShiftModal(true) : setShowHolidayModal(true))}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeTab === "SHIFTS"
                ? isBangla ? "+ নতুন শিফট যোগ" : "+ Add Shift Roster"
                : isBangla ? "+ নিজস্ব ছুটি যোগ" : "+ Add Custom Holiday"}
            </span>
          </button>
        </div>
      </div>

      {/* Sync Success Alert */}
      {syncStatusMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{syncStatusMsg}</span>
          </div>
          <button onClick={() => setSyncStatusMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Shifts View Content */}
      {activeTab === "SHIFTS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition-all space-y-4 shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    {s.isFlexible
                      ? isBangla ? "ফ্লেক্সিবল সময়" : "Flexible Hours"
                      : s.isRotational
                      ? isBangla ? "ঘূর্ণায়মান রোস্টার" : "Rotational Shift"
                      : isBangla ? "ফিক্সড রেগুলার" : "Fixed Regular"}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5">{s.name}</h3>
                </div>
                <div className="p-2 rounded-xl bg-slate-800 text-teal-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">
                    {isBangla ? "শুরুর সময়" : "Start Time"}
                  </span>
                  <span className="font-bold text-emerald-400 text-sm">{s.startTime}</span>
                </div>
                <span className="text-slate-500 font-bold">to</span>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-sans">
                    {isBangla ? "শেষের সময়" : "End Time"}
                  </span>
                  <span className="font-bold text-blue-400 text-sm">{s.endTime}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">{isBangla ? "গ্রেস পিরিয়ড:" : "Grace Period:"}</span>
                  <span className="font-semibold text-teal-300">{s.gracePeriodMinutes} {isBangla ? "মিনিট" : "Minutes"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isBangla ? "হাফ-ডে কাটঅফ:" : "Half-Day Threshold:"}</span>
                  <span>{isBangla ? `${s.halfDayAfterMinutes} মিনিট পর` : `After ${s.halfDayAfterMinutes} Mins`}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{isBangla ? "সাপ্তাহিক ছুটি:" : "Weekend Days:"}</span>
                  <div className="flex items-center gap-1">
                    {(s.weekendDays || [5, 6]).map((dayIdx) => {
                      const dayObj = WEEKDAY_NAMES.find((w) => w.dayIndex === dayIdx);
                      return (
                        <span
                          key={dayIdx}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-emerald-500/20"
                        >
                          {isBangla ? dayObj?.labelBn : dayObj?.short}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {onDeleteShift && (
                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => {
                      if (confirm(isBangla ? "এই শিফটটি মুছে ফেলতে চান?" : "Delete this shift?")) {
                        onDeleteShift(s.id);
                      }
                    }}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isBangla ? "মুছে ফেলুন" : "Delete Shift"}</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Holidays Tab Content */}
      {activeTab === "HOLIDAYS" && (
        <div className="space-y-4">
          {/* Year & Search Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-teal-400" />
                <span>{isBangla ? "বছর ফিল্টার:" : "Filter by Year:"}</span>
              </span>
              <select
                value={holidayYearFilter}
                onChange={(e) => setHolidayYearFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
              >
                <option value="ALL">{isBangla ? "সকল বছর (All Years)" : "All Years"}</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>

            <span className="text-slate-400 text-xs">
              {isBangla ? `মোট তালিকাভুক্ত ছুটি: ${filteredHolidays.length} টি` : `Total Holidays: ${filteredHolidays.length}`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHolidays.map((h) => (
              <div
                key={h.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition-all space-y-3 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      h.type === "FESTIVAL"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : h.type === "NATIONAL"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    }`}
                  >
                    {h.type === "FESTIVAL"
                      ? isBangla ? "ধর্মীয় ও উৎসবের ছুটি" : "Festival Holiday"
                      : h.type === "NATIONAL"
                      ? isBangla ? "জাতীয় দিবস" : "National Holiday"
                      : isBangla ? "কর্পোরেট ছুটি" : "Corporate"}
                  </span>

                  <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-bold text-[10px] font-mono">
                    {h.totalDays} {isBangla ? "দিন" : "Days"}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">{h.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{h.description}</p>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" />
                    <span>{h.startDate}</span>
                  </div>
                  {h.startDate !== h.endDate && (
                    <>
                      <span className="text-slate-500 font-bold">➔</span>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <span>{h.endDate}</span>
                      </div>
                    </>
                  )}
                </div>

                {onDeleteHoliday && (
                  <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                    <button
                      onClick={() => {
                        if (confirm(isBangla ? "এই ছুটিটি মুছে ফেলতে চান?" : "Delete this holiday?")) {
                          onDeleteHoliday(h.id);
                        }
                      }}
                      className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isBangla ? "মুছুন" : "Delete"}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekend Rules Tab Content */}
      {activeTab === "WEEKEND_RULES" && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-400" />
              <span>{isBangla ? "কোম্পানির সাপ্তাহিক ছুটির দিন নির্ধারণ (Weekly Weekend Config)" : "Company Weekly Weekend Configuration"}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBangla
                ? "বাংলাদেশে সাধারণত শুক্রবার ও শনিবার বা শুধু শুক্রবার সাপ্তাহিক ছুটি হিসেবে গণ্য হয়। আপনার প্রতিষ্ঠানের নিয়ম অনুযায়ী সিলেক্ট করুন।"
                : "Configure standard company weekend days. Attendance records will automatically recognize these as non-working holidays."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-teal-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-300">🇧🇩 Bangladesh Standard</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="font-bold text-white text-sm">Friday & Saturday (শুক্রবার ও শনিবার)</h4>
              <p className="text-[11px] text-slate-400">2 days weekly weekend for corporate & banks.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400">Single Day Weekend</span>
              <h4 className="font-bold text-white text-sm">Friday Only (শুধুমাত্র শুক্রবার)</h4>
              <p className="text-[11px] text-slate-400">6-day work week for factories & retail outlets.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400">International Standard</span>
              <h4 className="font-bold text-white text-sm">Saturday & Sunday</h4>
              <p className="text-[11px] text-slate-400">For global offshore client teams & IT exporters.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400">Custom Shift Roster</span>
              <h4 className="font-bold text-white text-sm">Rotational Day Off</h4>
              <p className="text-[11px] text-slate-400">Configured individually per shift profile.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Shift */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-400" /> {isBangla ? "নতুন শিফট তৈরি করুন" : "Add Shift Roster"}
              </h3>
              <button onClick={() => setShowShiftModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleShiftSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">{isBangla ? "শিফটের নাম *" : "Shift Name *"}</label>
                <input
                  type="text"
                  value={newShiftName}
                  onChange={(e) => setNewShiftName(e.target.value)}
                  placeholder="e.g. Morning Regular / General Day Shift"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">{isBangla ? "শুরুর সময় *" : "Start Time *"}</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{isBangla ? "শেষের সময় *" : "End Time *"}</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">{isBangla ? "গ্রেস পিরিয়ড (মিনিট)" : "Grace Period (Mins)"}</label>
                  <input
                    type="number"
                    value={newGraceMins}
                    onChange={(e) => setNewGraceMins(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{isBangla ? "হাফ-ডে (মিনিট পর)" : "Half-Day After (Mins)"}</label>
                  <input
                    type="number"
                    value={newHalfDayMins}
                    onChange={(e) => setNewHalfDayMins(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              {/* Weekend Days Selector */}
              <div>
                <label className="block text-slate-400 mb-1.5 font-bold">
                  {isBangla ? "সাপ্তাহিক ছুটির দিন নির্বাচন করুন:" : "Select Weekend Days for this Shift:"}
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAY_NAMES.map((wd) => {
                    const isSelected = newShiftWeekends.includes(wd.dayIndex);
                    return (
                      <button
                        key={wd.dayIndex}
                        type="button"
                        onClick={() => toggleWeekendDay(wd.dayIndex)}
                        className={`py-1.5 text-[11px] font-bold rounded-lg transition-colors text-center ${
                          isSelected
                            ? "bg-teal-600 text-white shadow"
                            : "bg-slate-950 text-slate-400 hover:bg-slate-800"
                        }`}
                      >
                        {isBangla ? wd.labelBn.slice(0, 2) : wd.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsFlexible}
                    onChange={(e) => setNewIsFlexible(e.target.checked)}
                    className="rounded border-slate-700 text-teal-600"
                  />
                  <span>{isBangla ? "ফ্লেক্সিবল ওয়ার্কিং আওয়ারস (Flexible Working Hours)" : "Flexible Working Hours"}</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsRotational}
                    onChange={(e) => setNewIsRotational(e.target.checked)}
                    className="rounded border-slate-700 text-teal-600"
                  />
                  <span>{isBangla ? "ঘূর্ণায়মান শিফট রোস্টার (Rotational Roster)" : "Rotational Shift Roster"}</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-bold"
                >
                  {isBangla ? "শিফট সংরক্ষণ" : "Save Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Holiday */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-400" /> {isBangla ? "কর্পোরেট ছুটির তালিকাভুক্ত করুন" : "Add Corporate Holiday"}
              </h3>
              <button onClick={() => setShowHolidayModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleHolidaySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">{isBangla ? "ছুটির শিরোনাম *" : "Holiday Title *"}</label>
                <input
                  type="text"
                  value={newHolName}
                  onChange={(e) => setNewHolName(e.target.value)}
                  placeholder="e.g. পবিত্র ঈদুল আযহা / Corporate Annual Gala"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{isBangla ? "ছুটির ক্যাটাগরি" : "Holiday Classification"}</label>
                <select
                  value={newHolType}
                  onChange={(e) => setNewHolType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option value="FESTIVAL">Festival Holiday (উৎসব ছুটি)</option>
                  <option value="NATIONAL">National Holiday (জাতীয় দিবস)</option>
                  <option value="COMPANY">Company Specific (প্রতিষ্ঠানিক ছুটি)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">{isBangla ? "শুরুর তারিখ *" : "Start Date *"}</label>
                  <input
                    type="date"
                    value={newHolStart}
                    onChange={(e) => setNewHolStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{isBangla ? "শেষের তারিখ *" : "End Date *"}</label>
                  <input
                    type="date"
                    value={newHolEnd}
                    onChange={(e) => setNewHolEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{isBangla ? "বিবরণ" : "Holiday Circular Details"}</label>
                <textarea
                  rows={2}
                  value={newHolDesc}
                  onChange={(e) => setNewHolDesc(e.target.value)}
                  placeholder="Official office closure announcement..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowHolidayModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-bold"
                >
                  {isBangla ? "ছুটি যুক্ত করুন" : "Publish Holiday"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
