import { AttendanceRecord, Shift, Employee } from "../types";

/**
 * Parses diverse time strings ("09:15:00 AM", "09:15 AM", "18:00", "20:00:00") into minutes from midnight (0 - 1439).
 */
export function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr || typeof timeStr !== "string") return 9 * 60; // default 09:00 AM (540 mins)

  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes("PM");
  const isAM = clean.includes("AM");

  // Strip AM/PM and non-time characters
  const timeOnly = clean.replace(/[^0-9:]/g, "");
  const parts = timeOnly.split(":").map(Number);
  let hours = parts[0] || 0;
  const minutes = parts[1] || 0;

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight into standard formatted 12-hour time string ("08:00:00 PM").
 */
export function formatMinutesToTimeString(totalMinutes: number): string {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(norm / 60);
  const minutes = norm % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

  const hStr = hours12.toString().padStart(2, "0");
  const mStr = minutes.toString().padStart(2, "0");
  return `${hStr}:${mStr}:00 ${period}`;
}

/**
 * Determines the best matching shift for an employee and check-in time.
 * If flexible shift exists or office shift (e.g. 09:00 - 20:00 / 09:00 - 18:00),
 * finds the shift closest to arrival or assigned flexible shift.
 */
export function resolveEmployeeShift(
  checkInTimeStr: string | undefined,
  shifts: Shift[],
  employee?: Employee
): Shift {
  if (!shifts || shifts.length === 0) {
    // Standard default shift: 09:00 AM to 08:00 PM (as described by user: flexible 9 AM to 8 PM)
    return {
      id: "shift-default",
      name: "Corporate Flexible Shift",
      startTime: "09:00",
      endTime: "20:00",
      gracePeriodMinutes: 15,
      halfDayAfterMinutes: 180,
      breakDurationMinutes: 60,
      weekendDays: [5, 6],
      isRotational: false,
      isFlexible: true,
    };
  }

  // 1. If employee role or name matches flexible hours or executive
  const flexShift = shifts.find((s) => s.isFlexible || s.id === "shift-04" || s.endTime === "20:00");

  const checkInMins = parseTimeToMinutes(checkInTimeStr);

  // 2. Find closest shift based on startTime
  let bestShift = flexShift || shifts[0];
  let minDiff = Infinity;

  for (const s of shifts) {
    const shiftStartMins = parseTimeToMinutes(s.startTime);
    const diff = Math.abs(shiftStartMins - checkInMins);
    if (diff < minDiff) {
      minDiff = diff;
      bestShift = s;
    }
  }

  return bestShift;
}

/**
 * Calculates arrival status (PRESENT or LATE) and late minutes based on shift and grace period.
 */
export function calculateArrivalPunctuality(
  checkInTimeStr: string,
  shift: Shift
): { status: "PRESENT" | "LATE"; lateMinutes: number } {
  const arrivalMinutes = parseTimeToMinutes(checkInTimeStr);
  const shiftStartMinutes = parseTimeToMinutes(shift.startTime);
  const gracePeriod = shift.gracePeriodMinutes ?? 15;

  const diff = arrivalMinutes - shiftStartMinutes;

  if (diff > gracePeriod) {
    return {
      status: "LATE",
      lateMinutes: diff,
    };
  }

  return {
    status: "PRESENT",
    lateMinutes: 0,
  };
}

export interface ReconcileResult {
  updatedLogs: AttendanceRecord[];
  reconciledRecords: AttendanceRecord[];
  reconciledCount: number;
  summaryMessage?: string;
}

/**
 * Automatic Clock-Out Reconciler:
 * When an employee clocks in today, check if they clocked in previously (e.g. yesterday or earlier)
 * but forgot to clock out.
 * Retroactively closes the previous day's open session at the scheduled shift end time (e.g. 08:00:00 PM),
 * calculating exact worked minutes, overtime, and audit notes.
 */
export function reconcileMissingPreviousClockOuts(
  employeeId: string,
  currentDateStr: string,
  attendanceLogs: AttendanceRecord[],
  shifts: Shift[],
  employee?: Employee,
  onSaveRecord?: (record: AttendanceRecord) => void
): ReconcileResult {
  if (!employeeId || !attendanceLogs || attendanceLogs.length === 0) {
    return {
      updatedLogs: attendanceLogs || [],
      reconciledRecords: [],
      reconciledCount: 0,
    };
  }

  const reconciledRecords: AttendanceRecord[] = [];
  const updatedLogs = attendanceLogs.map((log) => {
    // Only check past logs for this specific employee
    if (log.employeeId !== employeeId) return log;

    // Check if the record is from an earlier date than currentDateStr
    const isPastDate = log.date < currentDateStr;

    // If it has checkInTime, but lacks checkOutTime
    const isMissingClockOut = Boolean(
      log.checkInTime && (!log.checkOutTime || log.checkOutTime.trim() === "" || log.checkOutTime === "-")
    );

    if (isPastDate && isMissingClockOut) {
      // Find shift for this record
      const shift = resolveEmployeeShift(log.checkInTime, shifts, employee);
      const shiftEndMins = parseTimeToMinutes(shift.endTime);
      const formattedEndTime = formatMinutesToTimeString(shiftEndMins);

      const inMins = parseTimeToMinutes(log.checkInTime);
      const totalElapsedMins = Math.max(0, shiftEndMins - inMins);
      const breakMins = shift.breakDurationMinutes ?? 60;
      const totalWorkMins = Math.max(0, totalElapsedMins - breakMins);
      const overtimeMins = Math.max(0, totalWorkMins - 480);

      const autoReconciledRecord: AttendanceRecord = {
        ...log,
        checkOutTime: formattedEndTime,
        totalWorkMinutes: totalWorkMins,
        totalBreakMinutes: breakMins,
        overtimeMinutes: overtimeMins,
        auditNotes: (log.auditNotes ? `${log.auditNotes} | ` : "") +
          `[স্বয়ংক্রিয় ক্লক-আউট] পূর্ববর্তী দিনের (${log.date}) মিসিং ক্লক-আউট নির্ধারিত শিফট সমাপ্তির সময় (${formattedEndTime}) অনুযায়ী স্বয়ংক্রিয়ভাবে সমন্বয় করা হয়েছে।`,
      };

      reconciledRecords.push(autoReconciledRecord);
      if (onSaveRecord) {
        onSaveRecord(autoReconciledRecord);
      }

      return autoReconciledRecord;
    }

    return log;
  });

  let summaryMessage: string | undefined;
  if (reconciledRecords.length > 0) {
    const dates = reconciledRecords.map((r) => r.date).join(", ");
    summaryMessage = `পূর্ববর্তী দিনের (${dates}) মিসিং ক্লক-আউট নির্ধারিত শিফট অনুযায়ী স্বয়ংক্রিয়ভাবে সমন্বয় করা হয়েছে।`;
  }

  return {
    updatedLogs,
    reconciledRecords,
    reconciledCount: reconciledRecords.length,
    summaryMessage,
  };
}
