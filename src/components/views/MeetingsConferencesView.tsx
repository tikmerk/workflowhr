import React, { useState, useMemo } from "react";
import {
  Presentation,
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Eye,
  X,
  UserCheck,
  Star,
  Download,
  Building2,
  Sparkles,
  CalendarDays,
  ShieldCheck,
  Award
} from "lucide-react";
import { MeetingConference, MeetingAttendeeRecord, Employee, Department, Branch } from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";

interface MeetingsConferencesViewProps {
  meetings: MeetingConference[];
  employees: Employee[];
  departments: Department[];
  branches: Branch[];
  onAddMeeting: (meeting: MeetingConference) => void;
  onUpdateMeeting: (meeting: MeetingConference) => void;
  onDeleteMeeting: (meetingId: string) => void;
  onRecordAttendeePunch?: (meetingId: string, record: MeetingAttendeeRecord) => void;
}

export const MeetingsConferencesView: React.FC<MeetingsConferencesViewProps> = ({
  meetings = [],
  employees = [],
  departments = [],
  branches = [],
  onAddMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
  onRecordAttendeePunch,
}) => {
  const { isBangla } = useThemeLanguage();

  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingConference | null>(meetings[0] || null);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingConference | null>(null);
  const [showPunchModal, setShowPunchModal] = useState<boolean>(false);
  const [selectedAttendeeForPunch, setSelectedAttendeeForPunch] = useState<Employee | null>(null);

  // Punch Form State
  const [punchCheckInTime, setPunchCheckInTime] = useState<string>("09:30");
  const [punchDate, setPunchDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [punchStatus, setPunchStatus] = useState<"ON_TIME" | "LATE" | "EXCUSED" | "ABSENT">("ON_TIME");
  const [punchRating, setPunchRating] = useState<number>(5);
  const [punchNotes, setPunchNotes] = useState<string>("");

  // Add / Edit Form State
  const [formTitle, setFormTitle] = useState<string>("");
  const [formTitleBn, setFormTitleBn] = useState<string>("");
  const [formType, setFormType] = useState<"MEETING" | "CONFERENCE" | "SEMINAR" | "FIELD_PROGRAM" | "WORKSHOP">("CONFERENCE");
  const [formPreset, setFormPreset] = useState<"SINGLE_DAY" | "THREE_DAYS" | "ONE_WEEK" | "FIFTEEN_DAYS" | "CUSTOM">("THREE_DAYS");
  const [formStartDate, setFormStartDate] = useState<string>("2026-09-15");
  const [formEndDate, setFormEndDate] = useState<string>("2026-09-17");
  const [formStartTime, setFormStartTime] = useState<string>("10:00");
  const [formReportingTime, setFormReportingTime] = useState<string>("09:30");
  const [formLocation, setFormLocation] = useState<string>("Main Auditorium / Hybrid Hub");
  const [formBranchId, setFormBranchId] = useState<string>(branches[0]?.id || "");
  const [formOrganizerName, setFormOrganizerName] = useState<string>("Md. Ibrahim Hossain");
  const [formOrganizerDesig, setFormOrganizerDesig] = useState<string>("IT Manager & Head of HR");
  const [formDescription, setFormDescription] = useState<string>("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedDeptNames, setSelectedDeptNames] = useState<string[]>([]);

  // Automatically adjust dates when preset changes
  const handlePresetChange = (preset: "SINGLE_DAY" | "THREE_DAYS" | "ONE_WEEK" | "FIFTEEN_DAYS" | "CUSTOM") => {
    setFormPreset(preset);
    const start = new Date(formStartDate || "2026-09-15");
    const end = new Date(start);

    if (preset === "SINGLE_DAY") {
      setFormEndDate(formStartDate);
    } else if (preset === "THREE_DAYS") {
      end.setDate(start.getDate() + 2);
      setFormEndDate(end.toISOString().split("T")[0]);
    } else if (preset === "ONE_WEEK") {
      end.setDate(start.getDate() + 6);
      setFormEndDate(end.toISOString().split("T")[0]);
    } else if (preset === "FIFTEEN_DAYS") {
      end.setDate(start.getDate() + 14);
      setFormEndDate(end.toISOString().split("T")[0]);
    }
  };

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const matchFilter = activeFilter === "ALL" || m.type === activeFilter || m.status === activeFilter;
      const matchSearch =
        searchTerm === "" ||
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.titleBn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.leadOrganizerName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [meetings, activeFilter, searchTerm]);

  // Open Edit Form
  const openEditModal = (meeting: MeetingConference) => {
    setEditingMeeting(meeting);
    setFormTitle(meeting.title);
    setFormTitleBn(meeting.titleBn || "");
    setFormType(meeting.type);
    setFormPreset(meeting.durationPreset as any);
    setFormStartDate(meeting.startDate);
    setFormEndDate(meeting.endDate);
    setFormStartTime(meeting.startTime);
    setFormReportingTime(meeting.reportingTime);
    setFormLocation(meeting.location);
    setFormBranchId(meeting.branchId || branches[0]?.id || "");
    setFormOrganizerName(meeting.leadOrganizerName);
    setFormOrganizerDesig(meeting.leadOrganizerDesignation || "");
    setFormDescription(meeting.description);
    setSelectedEmployeeIds(meeting.assignedEmployeeIds || []);
    setSelectedDeptNames(meeting.participatingDepartments || []);
    setShowAddModal(true);
  };

  // Open Punch Modal for an Employee
  const openPunchModal = (emp: Employee) => {
    setSelectedAttendeeForPunch(emp);
    setPunchDate(new Date().toISOString().split("T")[0]);
    setPunchCheckInTime(selectedMeeting?.reportingTime || "09:30");
    setPunchStatus("ON_TIME");
    setPunchRating(5);
    setPunchNotes("");
    setShowPunchModal(true);
  };

  // Save Punch
  const handleSavePunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting || !selectedAttendeeForPunch) return;

    const punchRecord: MeetingAttendeeRecord = {
      employeeId: selectedAttendeeForPunch.id,
      employeeName: selectedAttendeeForPunch.fullName,
      designationTitle: selectedAttendeeForPunch.designationTitle,
      departmentName: selectedAttendeeForPunch.departmentName,
      date: punchDate,
      checkInTime: punchCheckInTime,
      status: punchStatus,
      engagementRating: punchRating,
      feedbackNotes: punchNotes || (isBangla ? "উপস্থিতি যাচাই সম্পন্ন হয়েছে।" : "Attendance verified successfully."),
    };

    const updatedRecords = [
      ...(selectedMeeting.attendanceRecords?.filter(
        (r) => !(r.employeeId === punchRecord.employeeId && r.date === punchRecord.date)
      ) || []),
      punchRecord,
    ];

    const updatedMeeting: MeetingConference = {
      ...selectedMeeting,
      attendanceRecords: updatedRecords,
    };

    onUpdateMeeting(updatedMeeting);
    setSelectedMeeting(updatedMeeting);
    if (onRecordAttendeePunch) {
      onRecordAttendeePunch(selectedMeeting.id, punchRecord);
    }
    setShowPunchModal(false);
  };

  // Save Add / Edit
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    const branch = branches.find((b) => b.id === formBranchId);
    const start = new Date(formStartDate);
    const end = new Date(formEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (editingMeeting) {
      const updated: MeetingConference = {
        ...editingMeeting,
        title: formTitle,
        titleBn: formTitleBn || formTitle,
        type: formType,
        durationPreset: formPreset,
        startDate: formStartDate,
        endDate: formEndDate,
        totalDays: isNaN(totalDays) ? 1 : totalDays,
        startTime: formStartTime,
        reportingTime: formReportingTime,
        location: formLocation,
        branchId: branch?.id,
        branchName: branch?.name,
        leadOrganizerName: formOrganizerName,
        leadOrganizerDesignation: formOrganizerDesig,
        description: formDescription,
        participatingDepartments: selectedDeptNames,
        assignedEmployeeIds: selectedEmployeeIds,
      };
      onUpdateMeeting(updated);
      setSelectedMeeting(updated);
    } else {
      const newMeeting: MeetingConference = {
        id: `meet-${Date.now()}`,
        title: formTitle,
        titleBn: formTitleBn || formTitle,
        type: formType,
        durationPreset: formPreset,
        startDate: formStartDate,
        endDate: formEndDate,
        totalDays: isNaN(totalDays) ? 1 : totalDays,
        startTime: formStartTime,
        reportingTime: formReportingTime,
        location: formLocation,
        branchId: branch?.id,
        branchName: branch?.name,
        leadOrganizerName: formOrganizerName,
        leadOrganizerDesignation: formOrganizerDesig,
        description: formDescription,
        participatingDepartments: selectedDeptNames,
        assignedEmployeeIds: selectedEmployeeIds,
        status: "SCHEDULED",
        attendanceRecords: [],
      };
      onAddMeeting(newMeeting);
      setSelectedMeeting(newMeeting);
    }

    setShowAddModal(false);
    setEditingMeeting(null);
  };

  // Quick stats
  const stats = useMemo(() => {
    const totalConferences = meetings.filter((m) => m.type === "CONFERENCE").length;
    const totalSeminars = meetings.filter((m) => m.type === "SEMINAR").length;
    const totalField = meetings.filter((m) => m.type === "FIELD_PROGRAM").length;
    const totalAttended = meetings.reduce((sum, m) => sum + (m.attendanceRecords?.length || 0), 0);
    return { totalConferences, totalSeminars, totalField, totalAttended };
  }, [meetings]);

  return (
    <div id="meetings-conferences-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5">
              <Presentation className="w-3.5 h-3.5" />
              <span>{isBangla ? "মিটিং, সেমিনার ও জাতীয় সম্মেলন" : "Conferences & Program Events"}</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              {isBangla ? "প্রোগ্রাম ভিত্তিক উপস্থিতি" : "Event Attendance"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            {isBangla ? "মিটিং, সেমিনার ও ফিল্ড প্রোগ্রাম ম্যানেজমেন্ট" : "Meetings, Seminars & Conferences Hub"}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {isBangla
              ? "১ থেকে ১৫ দিনের সম্মেলন বা ফিল্ড প্রোগ্রামের শিডিউল তৈরি করুন, রিপোর্টিং সময় নির্ধারণ করুন এবং উপস্থিতি ট্র্যাক করুন"
              : "Schedule 1 to 15-day conferences, field camps & seminars, set reporting times, and record attendee check-in"}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingMeeting(null);
            setFormTitle("");
            setFormTitleBn("");
            setFormType("CONFERENCE");
            setFormPreset("THREE_DAYS");
            setFormStartDate("2026-09-15");
            setFormEndDate("2026-09-17");
            setFormStartTime("10:00");
            setFormReportingTime("09:30");
            setFormLocation("Corporate Auditorium & Online Hybrid");
            setFormOrganizerName("Md. Ibrahim Hossain");
            setFormOrganizerDesig("IT Manager & Head of HR");
            setFormDescription("");
            setSelectedEmployeeIds(employees.slice(0, 6).map((e) => e.id));
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isBangla ? "+ নতুন প্রোগ্রাম / সম্মেলন যুক্ত করুন" : "+ Add Event / Program"}</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
            {isBangla ? "জাতীয় সম্মেলন (Conferences)" : "Total Conferences"}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-2">
            <span>{stats.totalConferences}</span>
            <span className="text-xs text-teal-600 dark:text-teal-400 font-normal">৩ দিনের সেশন</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
            {isBangla ? "ফিল্ড প্রোগ্রাম (Field Relief Ops)" : "Field Relief Camps"}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-2">
            <span>{stats.totalField}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-normal">১৫ দিনের ক্যাম্প</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
            {isBangla ? "সেমিনার ও মিটিং (Seminars & Meetings)" : "Seminars & Meetings"}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-2">
            <span>{stats.totalSeminars}</span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-normal">বাজেট ও অডিট</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
            {isBangla ? "মোট উপস্থিতি রেকর্ড (Verified Punches)" : "Total Verified Check-Ins"}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-2">
            <span>{stats.totalAttended}</span>
            <span className="text-xs text-teal-600 dark:text-teal-400 font-normal">{isBangla ? "হাজিরা সম্পন্ন" : "Check-ins"}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "ALL", labelBn: "সকল প্রোগ্রাম", labelEn: "All Events" },
            { id: "CONFERENCE", labelBn: "সম্মেলন (৩ দিন)", labelEn: "Conferences (3 Days)" },
            { id: "FIELD_PROGRAM", labelBn: "ফিল্ড ক্যাম্প (১৫ দিন)", labelEn: "Field Camps (15 Days)" },
            { id: "MEETING", labelBn: "মিটিং / সভা", labelEn: "Meetings" },
            { id: "SEMINAR", labelBn: "সেমিনার", labelEn: "Seminars" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveFilter(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === item.id
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {isBangla ? item.labelBn : item.labelEn}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isBangla ? "প্রোগ্রাম বা স্থান খুঁজুন..." : "Search programs or venues..."}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Main Split: Left Program Cards & Right Detailed Program Attendance Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Event List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isBangla ? `প্রোগ্রাম তালিকা (${filteredMeetings.length})` : `Events (${filteredMeetings.length})`}</span>
            </h3>
          </div>

          <div className="space-y-3">
            {filteredMeetings.map((m) => {
              const isSelected = selectedMeeting?.id === m.id;
              const attendeeCount = m.assignedEmployeeIds?.length || 0;
              const checkInCount = m.attendanceRecords?.length || 0;

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMeeting(m)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                    isSelected
                      ? "bg-teal-500/10 border-teal-500 shadow-md shadow-teal-500/10 ring-1 ring-teal-500/30"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                          {m.type === "CONFERENCE"
                            ? "৩ দিনের সম্মেলন"
                            : m.type === "FIELD_PROGRAM"
                            ? "১৫ দিনের ফিল্ড প্রোগ্রাম"
                            : m.type}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {m.totalDays} {isBangla ? "দিন" : "Days"}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-1">
                        {isBangla && m.titleBn ? m.titleBn : m.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(m);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-teal-500/20 dark:bg-slate-800 dark:hover:bg-teal-500/30 text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 transition-colors cursor-pointer"
                        title={isBangla ? "সম্পাদনা করুন" : "Edit Event"}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(isBangla ? `আপনি কি "${m.title}" মুছে ফেলতে চান?` : `Delete "${m.title}"?`)) {
                            onDeleteMeeting(m.id);
                            if (selectedMeeting?.id === m.id) {
                              setSelectedMeeting(meetings.filter((item) => item.id !== m.id)[0] || null);
                            }
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-500/20 dark:bg-slate-800 dark:hover:bg-rose-500/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title={isBangla ? "মুছে ফেলুন" : "Delete Event"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Timing & Venue */}
                  <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-transparent">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {isBangla ? "রিপোর্টিং টাইম:" : "Reporting Time:"}
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                        {m.reportingTime}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {isBangla ? "অনুষ্ঠান শুরু:" : "Program Start:"}
                      </span>
                      <span className="font-bold text-teal-700 dark:text-teal-300 font-mono">
                        {m.startTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1 text-[11px] truncate max-w-[200px]">
                      <MapPin className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span className="truncate">{m.location}</span>
                    </span>

                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                      {checkInCount} / {attendeeCount} {isBangla ? "উপস্থিত" : "Checked-in"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Event Details & Attendance Punch List (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedMeeting ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              {/* Event Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                      {selectedMeeting.durationPreset === "THREE_DAYS"
                        ? "৩ দিনের বিশেষ সম্মেলন"
                        : selectedMeeting.durationPreset === "FIFTEEN_DAYS"
                        ? "১৫ দিনের ফিল্ড প্রোগ্রাম"
                        : selectedMeeting.durationPreset}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {selectedMeeting.startDate} to {selectedMeeting.endDate}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1.5">
                    {isBangla && selectedMeeting.titleBn ? selectedMeeting.titleBn : selectedMeeting.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {selectedMeeting.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEditModal(selectedMeeting)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{isBangla ? "এডিট" : "Edit"}</span>
                  </button>
                </div>
              </div>

              {/* Reporting & Schedule Details Banner */}
              <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase block">
                    {isBangla ? "রিপোর্টিং টাইম (Reporting Time)" : "Reporting Time"}
                  </span>
                  <span className="text-base font-black text-amber-700 dark:text-amber-400 font-mono mt-0.5 block">
                    {selectedMeeting.reportingTime}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {isBangla ? "হাজিরার শেষ সময়" : "Punch deadline"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase block">
                    {isBangla ? "সেশন শুরুর সময় (Session Start)" : "Session Start"}
                  </span>
                  <span className="text-base font-black text-teal-700 dark:text-teal-400 font-mono mt-0.5 block">
                    {selectedMeeting.startTime}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {isBangla ? "মূল আলোচনা শুরু" : "Main keynote"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase block">
                    {isBangla ? "সার্বিক সমন্বয়ক (Lead Coordinator)" : "Lead Coordinator"}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block truncate">
                    {selectedMeeting.leadOrganizerName}
                  </span>
                  <span className="text-[10px] text-teal-700 dark:text-teal-400 block truncate">
                    {selectedMeeting.leadOrganizerDesignation}
                  </span>
                </div>
              </div>

              {/* Policy note regarding field penalty exemption */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  {isBangla
                    ? "পলিসি নোট: এই প্রোগ্রাম বা কনফারেন্সে দায়িত্বপ্রাপ্তদের ক্ষেত্রে সাধারণ অফিসিয়াল ৯টা-৫টার লেট ফাইন কার্যকর হবে না।"
                    : "Policy Rule: Personnel deployed to this conference/field program are exempt from standard 9-5 office tardiness fines."}
                </span>
              </div>

              {/* Attendee Roster & Live Check-In Punching */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>
                      {isBangla
                        ? `অংশগ্রহণকারী কর্মকর্তাদের উপস্থিতি (${selectedMeeting.assignedEmployeeIds?.length || 0} জন)`
                        : `Assigned Attendees & Attendance (${selectedMeeting.assignedEmployeeIds?.length || 0})`}
                    </span>
                  </h4>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
                  {selectedMeeting.assignedEmployeeIds?.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <p>{isBangla ? "কোনো কর্মী অ্যাসাইন করা হয়নি" : "No attendees assigned"}</p>
                    </div>
                  ) : (
                    selectedMeeting.assignedEmployeeIds?.map((empId) => {
                      const emp = employees.find((e) => e.id === empId);
                      if (!emp) return null;

                      const punch = selectedMeeting.attendanceRecords?.find(
                        (r) => r.employeeId === emp.id
                      );

                      return (
                        <div
                          key={emp.id}
                          className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={emp.avatarUrl}
                              alt={emp.fullName}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                                <span>{emp.fullName}</span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  ({emp.employeeCode})
                                </span>
                              </div>
                              <div className="text-xs text-teal-700 dark:text-teal-400">
                                {emp.designationTitle} • {emp.departmentName}
                              </div>
                              {punch && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>হাজিরা টাইম: {punch.checkInTime}</span>
                                  <span>•</span>
                                  <span className="flex items-center text-amber-500">
                                    <Star className="w-3 h-3 fill-amber-500" />
                                    <span>{punch.engagementRating}/5</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {punch ? (
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                                  punch.status === "ON_TIME"
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                    : punch.status === "LATE"
                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>
                                  {punch.status === "ON_TIME"
                                    ? "সময়মতো হাজির"
                                    : punch.status === "LATE"
                                    ? "বিলম্বে হাজির"
                                    : punch.status}
                                </span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openPunchModal(emp)}
                                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>{isBangla ? "হাজিরা দিন" : "Record Punch"}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => openPunchModal(emp)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
                              title={isBangla ? "হাজিরা বা ফিডব্যাক আপডেট" : "Edit Check-in"}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Presentation className="w-12 h-12 mx-auto opacity-30 text-teal-500 mb-2" />
              <p className="font-bold text-base text-slate-700 dark:text-slate-300">
                {isBangla ? "কোনো প্রোগ্রাম নির্বাচিত নেই" : "No Program Selected"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {isBangla
                  ? "বাম পাশের তালিকা থেকে একটি প্রোগ্রাম নির্বাচন করুন"
                  : "Select an event from the left list to view attendance"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add or Edit Meeting/Conference */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-2xl text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Presentation className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>
                  {editingMeeting
                    ? isBangla
                      ? "সম্মেলন বা প্রোগ্রামের তথ্য সম্পাদনা"
                      : "Edit Event / Conference"
                    : isBangla
                    ? "নতুন মিটিং, সেমিনার বা ফিল্ড প্রোগ্রাম যুক্ত করুন"
                    : "Add Meeting, Conference or Field Program"}
                </span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">
                  {isBangla ? "প্রোগ্রামের শিরোনাম (বাংলা) *" : "Program Title (Bangla) *"}
                </label>
                <input
                  type="text"
                  value={formTitleBn}
                  onChange={(e) => setFormTitleBn(e.target.value)}
                  placeholder="e.g. বাৎসরিক জাতীয় প্রতিনিধি সম্মেলন ও ভবিষ্যৎ কর্মপরিকল্পনা ২০২৬"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">
                  {isBangla ? "প্রোগ্রামের নাম (English)" : "Program Title (English)"}
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Annual National Delegates Conference & Strategic Roadmap 2026"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">
                    {isBangla ? "প্রোগ্রামের ধরন *" : "Program Type *"}
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="CONFERENCE">সম্মেলন (Conference)</option>
                    <option value="FIELD_PROGRAM">ফিল্ড প্রোগ্রাম / ত্রাণ ক্যাম্প (Field Program)</option>
                    <option value="SEMINAR">সেমিনার (Seminar)</option>
                    <option value="MEETING">মিটিং / সাধারণ সভা (Meeting)</option>
                    <option value="WORKSHOP">ট্রেনিং ওয়ার্কশপ (Workshop)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">
                    {isBangla ? "মেয়াদ প্রিসেট (Duration Preset) *" : "Duration Preset *"}
                  </label>
                  <select
                    value={formPreset}
                    onChange={(e) => handlePresetChange(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="SINGLE_DAY">১ দিন (Single Day Event)</option>
                    <option value="THREE_DAYS">৩ দিন (৩ দিনের কনফারেন্স / সেমিনার)</option>
                    <option value="ONE_WEEK">১ সপ্তাহ (৭ দিন)</option>
                    <option value="FIFTEEN_DAYS">১৫ দিন (১৫ দিনের ফিল্ড প্রজেক্ট ক্যাম্প)</option>
                    <option value="CUSTOM">কাস্টম মেয়াদ (Custom)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">
                    {isBangla ? "শুরুর তারিখ *" : "Start Date *"}
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">
                    {isBangla ? "সমাপ্তির তারিখ *" : "End Date *"}
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold text-amber-600 dark:text-amber-400">
                    {isBangla ? "রিপোর্টিং সময় (সবার উপস্থিতির সময়) *" : "Reporting Deadline Time *"}
                  </label>
                  <input
                    type="text"
                    value={formReportingTime}
                    onChange={(e) => setFormReportingTime(e.target.value)}
                    placeholder="e.g. 09:30 or 11:30"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold text-teal-700 dark:text-teal-400">
                    {isBangla ? "মূল সেশন শুরুর সময় *" : "Main Session Start Time *"}
                  </label>
                  <input
                    type="text"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    placeholder="e.g. 10:00 or 12:00"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">
                    {isBangla ? "স্থান / ভেন্যু *" : "Venue / Location *"}
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. কর্পোরেট অডিটোরিয়াম, গুলশান বা ফিল্ড হাব"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">
                    {isBangla ? "সংশ্লিষ্ট ব্রাঞ্চ" : "Host Branch"}
                  </label>
                  <select
                    value={formBranchId}
                    onChange={(e) => setFormBranchId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">
                  {isBangla ? "প্রোগ্রামের বিবরণ ও এজেন্ডা" : "Description & Agenda"}
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="সম্মেলন বা ফিল্ড প্রোগ্রামের উদ্দেশ্য, কর্মপরিকল্পনা ও নির্দেশনাবলী..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Attendee Selection Checklist */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">
                  {isBangla ? "অংশগ্রহণকারী কর্মকর্তা নির্বাচন করুন" : "Assign Attendees"}
                </label>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2">
                  {employees.map((emp) => {
                    const isChecked = selectedEmployeeIds.includes(emp.id);
                    return (
                      <label
                        key={emp.id}
                        className="py-1.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmployeeIds([...selectedEmployeeIds, emp.id]);
                              } else {
                                setSelectedEmployeeIds(selectedEmployeeIds.filter((id) => id !== emp.id));
                              }
                            }}
                            className="rounded text-teal-600 focus:ring-teal-500"
                          />
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            {emp.fullName}
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            ({emp.designationTitle})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{emp.branchName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold cursor-pointer shadow-sm"
                >
                  {isBangla ? "সংরক্ষণ করুন" : "Save Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Attendee Check-In Punching */}
      {showPunchModal && selectedAttendeeForPunch && selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>{isBangla ? "প্রোগ্রাম উপস্থিতি যাচাই ও রেটিং" : "Record Event Attendance Punch"}</span>
              </h3>
              <button
                onClick={() => setShowPunchModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePunch} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <img
                  src={selectedAttendeeForPunch.avatarUrl}
                  alt={selectedAttendeeForPunch.fullName}
                  className="w-11 h-11 rounded-xl object-cover"
                />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedAttendeeForPunch.fullName}
                  </h4>
                  <p className="text-xs text-teal-700 dark:text-teal-400">
                    {selectedAttendeeForPunch.designationTitle}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">
                    {isBangla ? "হাজিরার তারিখ *" : "Date *"}
                  </label>
                  <input
                    type="date"
                    value={punchDate}
                    onChange={(e) => setPunchDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">
                    {isBangla ? "প্রবেশের সময় (Check-In) *" : "Check-in Time *"}
                  </label>
                  <input
                    type="text"
                    value={punchCheckInTime}
                    onChange={(e) => setPunchCheckInTime(e.target.value)}
                    placeholder="09:25"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">
                  {isBangla ? "উপস্থিতির স্ট্যাটাস *" : "Attendance Status *"}
                </label>
                <select
                  value={punchStatus}
                  onChange={(e) => setPunchStatus(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 font-semibold"
                >
                  <option value="ON_TIME">সময়মতো হাজির (On Time Check-in)</option>
                  <option value="LATE">বিলম্বে হাজির (Late Arrival)</option>
                  <option value="EXCUSED">অনুমতিপ্রাপ্ত অব্যাহতি (Excused)</option>
                  <option value="ABSENT">অনুপস্থিত (Absent)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">
                  {isBangla ? "সেশনে সম্পৃক্ততা ও পারফরম্যান্স রেটিং (১-৫)" : "Session Engagement (1-5)"}
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setPunchRating(star)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        punchRating >= star
                          ? "bg-amber-500/15 border-amber-500/30 text-amber-500"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent"
                      }`}
                    >
                      <Star className={`w-5 h-5 ${punchRating >= star ? "fill-amber-500" : ""}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">
                  {isBangla ? "ফিডব্যাক বা মন্তব্য" : "Notes / Contribution"}
                </label>
                <textarea
                  rows={2}
                  value={punchNotes}
                  onChange={(e) => setPunchNotes(e.target.value)}
                  placeholder="কর্মকর্তার অংশগ্রহণ ও কাজের অগ্রগতি..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPunchModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  {isBangla ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold cursor-pointer shadow-sm"
                >
                  {isBangla ? "হাজিরা রেকর্ড সংরক্ষণ" : "Save Check-In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
