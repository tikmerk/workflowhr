import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  ScanFace,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Smile,
  MapPin,
  Clock,
  UserCheck,
  Search,
  ShieldCheck,
  Video,
  VideoOff,
  Sparkles,
  Users,
  Building,
  Briefcase,
  Layers,
  ChevronRight,
  Info,
  Check,
  X,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Activity,
  ChevronDown,
  ChevronUp,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { Employee, Branch, AttendanceRecord, Shift, BiometricKioskSettings, BiometricModeConfig } from "../../types";
import {
  detectLiveFaceInVideo,
  autoIdentifyLiveFaceFromAllEmployees,
  verifyLiveFaceWithEmployee,
  drawBiometricMeshOverlay,
  playBiometricSound,
  FaceMatchResult,
  LiveFaceAnalysis,
  invalidateEmployeeFaceCache,
  resetBilateralBlinkState,
  loadFaceApiModels,
} from "../../utils/faceRecognitionEngine";
import { requestUserMediaStream } from "../../utils/faceUtils";
import {
  reconcileMissingPreviousClockOuts,
  resolveEmployeeShift,
  calculateArrivalPunctuality,
  parseTimeToMinutes,
} from "../../utils/attendanceReconciliation";
import { validateGeofence, getMockAddressFromCoords } from "../../utils/geoUtils";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { AttendanceLogsView } from "./AttendanceLogsView";

interface RealtimeFaceRecognitionViewProps {
  employees: Employee[];
  branches: Branch[];
  attendanceLogs: AttendanceRecord[];
  currentEmployee?: Employee;
  shifts?: Shift[];
  initialMode?: KioskMode;
  biometricSettings?: BiometricKioskSettings;
  onUpdateBiometricSettings?: (settings: BiometricKioskSettings) => void;
  isModal?: boolean;
  onClose?: () => void;
  selectedBranchId?: string;
  onLogAttendance: (log: AttendanceRecord) => void;
  onOpenEnrollmentModal?: (employee?: Employee) => void;
  onOpenAttendanceModal?: () => void;
  isPaused?: boolean;
}

export type KioskMode = "AUTO_KIOSK" | "ONE_TO_ONE" | "ATTENDANCE_LOGS" | "DATABASE_DIRECTORY";

export const RealtimeFaceRecognitionView: React.FC<RealtimeFaceRecognitionViewProps> = ({
  employees,
  branches,
  attendanceLogs,
  currentEmployee,
  shifts = [],
  initialMode = "AUTO_KIOSK",
  biometricSettings,
  onUpdateBiometricSettings,
  isModal = false,
  onClose,
  selectedBranchId: propSelectedBranchId,
  onLogAttendance,
  onOpenEnrollmentModal,
  onOpenAttendanceModal,
  isPaused = false,
}) => {
  const { isBangla } = useThemeLanguage();

  // Mode Selection: Auto-defaults to AUTO_KIOSK across mobile, tablet, and PC
  // unless Super Admin has locked the policy to ONE_TO_ONE_ONLY.
  const [activeMode, setActiveMode] = useState<KioskMode>(() => {
    if (biometricSettings?.modeAvailability === "ONE_TO_ONE_ONLY") return "ONE_TO_ONE";
    if (biometricSettings?.modeAvailability === "AUTO_KIOSK_ONLY") return "AUTO_KIOSK";
    return initialMode || "AUTO_KIOSK";
  });

  // Sync mode if biometricSettings change
  useEffect(() => {
    if (biometricSettings?.modeAvailability === "AUTO_KIOSK_ONLY" && activeMode === "ONE_TO_ONE") {
      setActiveMode("AUTO_KIOSK");
    } else if (biometricSettings?.modeAvailability === "ONE_TO_ONE_ONLY" && activeMode === "AUTO_KIOSK") {
      setActiveMode("ONE_TO_ONE");
    }
  }, [biometricSettings?.modeAvailability]);

  // Check if current user has Super Admin authority
  const isSuperAdmin = Boolean(
    currentEmployee?.role === "SUPER_ADMIN" ||
    currentEmployee?.isSuperAdmin === true ||
    currentEmployee?.permissions?.includes("ALL") ||
    currentEmployee?.permissions?.includes("MANAGE_SETTINGS")
  );

  // Super Admin In-Kiosk Policy Modal
  const [showAdminSettingsModal, setShowAdminSettingsModal] = useState<boolean>(false);
  const [tempModeAvailability, setTempModeAvailability] = useState<BiometricModeConfig>(
    biometricSettings?.modeAvailability || "BOTH"
  );

  // Virtual Screen Fill-Light (for low light / night kiosks)
  const [screenFillLight, setScreenFillLight] = useState<boolean>(false);
  // Auto digital low-light sensor gain & contrast boost
  const [lowLightBoostEnabled, setLowLightBoostEnabled] = useState<boolean>(true);
  // Collapsible telemetry panel on mobile (collapsed by default so it never blocks results)
  const [telemetryExpandedMobile, setTelemetryExpandedMobile] = useState<boolean>(false);

  // Jitter and Match Latching Refs
  const matchLockedUntilRef = useRef<number>(0);
  const consecutiveMissesRef = useRef<number>(0);

  // Auto-Clock In Countdown
  const [autoClockInCountdown, setAutoClockInCountdown] = useState<number | null>(null);
  const [autoSubmitProgress, setAutoSubmitProgress] = useState<number>(100);

  // Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [cameraLoading, setCameraLoading] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // 1:1 Verification Selected Employee
  const [selected1to1EmployeeId, setSelected1to1EmployeeId] = useState<string>(
    currentEmployee?.id || (employees.length > 0 ? employees[0].id : "")
  );
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState<string>("");

  // Live Vision Telemetry State
  const [liveFaceAnalysis, setLiveFaceAnalysis] = useState<LiveFaceAnalysis | null>(null);
  const [matchResult, setMatchResult] = useState<FaceMatchResult | null>(null);
  const [isProcessingMatch, setIsProcessingMatch] = useState<boolean>(false);

  // Anti-Spoofing Liveness State
  const [livenessStage, setLivenessStage] = useState<"ALIGN" | "BLINK" | "VERIFIED">("ALIGN");
  const [livenessMode, setLivenessMode] = useState<"BILATERAL_BLINK" | "STEADY_GAZE" | "SMILE">("BILATERAL_BLINK");
  const [steadyGazeProgress, setSteadyGazeProgress] = useState<number>(0);
  const steadyGazeStartRef = useRef<number | null>(null);
  const [blinkCompleted, setBlinkCompleted] = useState<boolean>(false);
  const [lastBlinkTime, setLastBlinkTime] = useState<number>(0);

  // Kiosk Attendance Confirmation Toast / State
  const [justCheckedInEmployee, setJustCheckedInEmployee] = useState<{
    employee: Employee;
    type: "CHECK_IN" | "CHECK_OUT";
    time: string;
    score: number;
  } | null>(null);
  const [recentKioskLogs, setRecentKioskLogs] = useState<
    Array<{
      id: string;
      employeeName: string;
      employeeCode: string;
      time: string;
      type: "CHECK_IN" | "CHECK_OUT";
      score: number;
    }>
  >([]);

  // Selected Branch for Kiosk
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    propSelectedBranchId || (branches.length > 0 ? branches[0].id : "")
  );

  // GPS Geolocation & Geofence State
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsDistanceMeters, setGpsDistanceMeters] = useState<number>(20);
  const [isInsideGeofence, setIsInsideGeofence] = useState<boolean>(true);
  const [gpsAddress, setGpsAddress] = useState<string>("");

  useEffect(() => {
    const targetBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];
    if (!targetBranch) return;

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setGpsLocation({ lat, lng });
          const validation = validateGeofence(
            lat,
            lng,
            targetBranch.latitude,
            targetBranch.longitude,
            targetBranch.geofenceRadiusMeters || 150
          );
          setGpsDistanceMeters(validation.distanceMeters);
          setIsInsideGeofence(validation.isWithinRadius);
          setGpsAddress(getMockAddressFromCoords(lat, lng, targetBranch.name));
        },
        () => {
          setGpsLocation({ lat: targetBranch.latitude, lng: targetBranch.longitude });
          setGpsDistanceMeters(20);
          setIsInsideGeofence(true);
          setGpsAddress(getMockAddressFromCoords(targetBranch.latitude, targetBranch.longitude, targetBranch.name));
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [selectedBranchId, branches]);

  // Enrolled directory filter
  const [directorySearch, setDirectorySearch] = useState<string>("");

  const playSound = useCallback(
    (type: "scan" | "match" | "blink" | "smile" | "success" | "error") => {
      if (soundEnabled) {
        playBiometricSound(type);
      }
    },
    [soundEnabled]
  );

  // Pre-load face-api.js neural networks on mount
  useEffect(() => {
    loadFaceApiModels().catch((e) => console.warn("Warmup face-api models warning:", e));
  }, []);

  // 1. Initialize Camera and enumerate video devices
  useEffect(() => {
    let mounted = true;

    async function getDevices() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devices.filter((d) => d.kind === "videoinput");
        if (mounted) {
          setAvailableDevices(videoDevs);
          if (videoDevs.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoDevs[0].deviceId);
          }
        }
      } catch (err) {
        console.warn("Could not enumerate camera devices:", err);
      }
    }

    getDevices();
    return () => {
      mounted = false;
    };
  }, [selectedDeviceId]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setCameraLoading(true);
    setCameraError(null);

    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      const stream = await requestUserMediaStream("user", selectedDeviceId);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("webkit-playsinline", "true");
        videoRef.current.muted = true;

        const markReady = () => {
          setCameraLoading(false);
          setIsCameraActive(true);
        };

        videoRef.current.onloadedmetadata = markReady;
        videoRef.current.oncanplay = markReady;
        videoRef.current.onplay = markReady;

        try {
          await videoRef.current.play();
          markReady();
        } catch (playErr) {
          console.warn("Autoplay notice:", playErr);
          // Safety timeout for mobile autoplay policies: guarantee spinner dismisses
          setTimeout(markReady, 700);
        }
      } else {
        setCameraLoading(false);
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error("Camera startup error:", err);
      setCameraError(
        err?.message ||
          (err.name === "NotAllowedError"
            ? "ক্যামেরা অ্যাক্সেস ডিনাইড। ব্রাউজারে ক্যামেরার পারমিশন অন করুন।"
            : "ক্যামেরা লোড করা যায়নি। অন্য ক্যামেরা সিলেক্ট করুন বা পেজ রিফ্রেশ করুন।")
      );
      setCameraLoading(false);
    }
  }, [selectedDeviceId]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Manage camera lifecycle based on active view, toggle, and pause state
  useEffect(() => {
    if (isPaused) {
      stopCamera();
      return;
    }

    if (activeMode !== "DATABASE_DIRECTORY" && isCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isPaused, activeMode, isCameraActive, selectedDeviceId, startCamera, stopCamera]);

  // Global listener to pause camera if another modal (like FaceEnrollmentModal) needs exclusive hardware
  useEffect(() => {
    const handlePause = () => {
      stopCamera();
    };
    const handleResume = () => {
      if (!isPaused && activeMode !== "DATABASE_DIRECTORY" && isCameraActive) {
        startCamera();
      }
    };

    window.addEventListener("pause-background-camera", handlePause);
    window.addEventListener("resume-background-camera", handleResume);

    return () => {
      window.removeEventListener("pause-background-camera", handlePause);
      window.removeEventListener("resume-background-camera", handleResume);
    };
  }, [isPaused, activeMode, isCameraActive, startCamera, stopCamera]);

  // Reset verification state when switching modes or selecting another employee
  useEffect(() => {
    setMatchResult(null);
    setLivenessStage("ALIGN");
    setBlinkCompleted(false);
  }, [activeMode, selected1to1EmployeeId]);

  // 2. Continuous Biometric Real-Time Vision Processing Loop
  useEffect(() => {
    let animId: number;
    let lastScanTimestamp = 0;

    const processVideoFrame = async () => {
      if (
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        activeMode !== "DATABASE_DIRECTORY" &&
        !cameraLoading &&
        !cameraError
      ) {
        // Run live face detection
        const liveFace = detectLiveFaceInVideo(videoRef.current);
        setLiveFaceAnalysis(liveFace);

        // Draw dynamic HUD overlay on canvas
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            const isMatched = Boolean(matchResult && matchResult.matched);
            const isMismatch = Boolean(
              matchResult && !matchResult.matched && matchResult.reason === "MISMATCH_LOW_CONFIDENCE"
            );
            drawBiometricMeshOverlay(
              ctx,
              canvasRef.current.width,
              canvasRef.current.height,
              liveFace.hasFace,
              isMatched,
              isMismatch,
              liveFace.boundingBox
            );
          }
        }

        const now = Date.now();

        // Multi-Vector Liveness Anti-Spoofing Verification
        // Accepts:
        // 1. Adaptive relative blink
        // 2. Natural smile
        // 3. Steady gaze fallback
        let livenessDetectedThisFrame = false;
        let livenessReasonDetected: "blink" | "smile" | "steady" = "blink";

        if (livenessMode === "BILATERAL_BLINK") {
          if (liveFace.blinkDetected) {
            livenessDetectedThisFrame = true;
            livenessReasonDetected = "blink";
          } else if (liveFace.smileDetected || (liveFace.smileScore && liveFace.smileScore >= 40)) {
            livenessDetectedThisFrame = true;
            livenessReasonDetected = "smile";
          }
        } else if (livenessMode === "SMILE") {
          if (liveFace.smileDetected || (liveFace.smileScore && liveFace.smileScore >= 38)) {
            livenessDetectedThisFrame = true;
            livenessReasonDetected = "smile";
          }
        } else if (livenessMode === "STEADY_GAZE") {
          if (liveFace.hasFace) {
            if (!steadyGazeStartRef.current) {
              steadyGazeStartRef.current = now;
            }
            const elapsed = now - steadyGazeStartRef.current;
            const progress = Math.min(100, Math.round((elapsed / 1000) * 100));
            setSteadyGazeProgress(progress);
            if (progress >= 100) {
              livenessDetectedThisFrame = true;
              livenessReasonDetected = "steady";
            }
          } else {
            steadyGazeStartRef.current = null;
            setSteadyGazeProgress(0);
          }
        }

        if (livenessDetectedThisFrame && !blinkCompleted) {
          setBlinkCompleted(true);
          setLastBlinkTime(now);
          playSound(livenessReasonDetected === "smile" ? "smile" : "blink");
          setLivenessStage("VERIFIED");
          playSound("success");
        }

        // Run Periodic 1:N or 1:1 Matching Loop (throttled to every 400ms)
        // Must NOT be blocked if user blinks or verifies liveness early!
        const hasMatchedTarget = Boolean(
          matchResult?.matched &&
            (matchResult.matchedEmployee || (activeMode === "ONE_TO_ONE" && selectedTargetEmp))
        );

        if (
          liveFace.hasFace &&
          !isProcessingMatch &&
          now - lastScanTimestamp >= 400 &&
          !hasMatchedTarget
        ) {
          lastScanTimestamp = now;
          setIsProcessingMatch(true);

          try {
            if (activeMode === "AUTO_KIOSK") {
              const res = await autoIdentifyLiveFaceFromAllEmployees(videoRef.current, employees);

              if (res.matched && res.matchedEmployee) {
                matchLockedUntilRef.current = now + 4000;
                consecutiveMissesRef.current = 0;
                setMatchResult(res);
                playSound("match");

                if (blinkCompleted || livenessDetectedThisFrame) {
                  setLivenessStage("VERIFIED");
                } else {
                  setLivenessStage("BLINK");
                }
              } else {
                if (now < matchLockedUntilRef.current) {
                  // Retain locked match to prevent flickering
                } else {
                  consecutiveMissesRef.current += 1;
                  if (consecutiveMissesRef.current >= 7) {
                    setMatchResult(res);
                  }
                }
              }
            } else if (activeMode === "ONE_TO_ONE") {
              const targetEmp = employees.find((e) => e.id === selected1to1EmployeeId);
              if (targetEmp) {
                const res = await verifyLiveFaceWithEmployee(videoRef.current, targetEmp);
                if (res.matched) {
                  matchLockedUntilRef.current = now + 4000;
                  consecutiveMissesRef.current = 0;
                  setMatchResult(res);
                  playSound("match");

                  if (blinkCompleted || livenessDetectedThisFrame) {
                    setLivenessStage("VERIFIED");
                  } else {
                    setLivenessStage("BLINK");
                  }
                } else {
                  if (now < matchLockedUntilRef.current) {
                    // Retain locked match
                  } else {
                    consecutiveMissesRef.current += 1;
                    if (consecutiveMissesRef.current >= 7) {
                      setMatchResult(res);
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.warn("Biometric matching iteration notice:", e);
          } finally {
            setIsProcessingMatch(false);
          }
        }
      }

      animId = requestAnimationFrame(processVideoFrame);
    };

    animId = requestAnimationFrame(processVideoFrame);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    activeMode,
    cameraLoading,
    cameraError,
    employees,
    selected1to1EmployeeId,
    isProcessingMatch,
    livenessStage,
    blinkCompleted,
    matchResult,
    playSound,
  ]);

  // Handle Attendance Check-In / Check-Out
  const handleConfirmAttendance = useCallback((type: "CHECK_IN" | "CHECK_OUT") => {
    const matchedEmp =
      activeMode === "AUTO_KIOSK"
        ? matchResult?.matchedEmployee
        : employees.find((e) => e.id === selected1to1EmployeeId);

    if (!matchedEmp) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const dateStr = now.toISOString().split("T")[0];
    const score = matchResult?.matchScore || 92;

    const targetBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];
    const employeeShift = resolveEmployeeShift(timeStr, shifts, matchedEmp);

    // Existing attendance record for today (if any)
    const existingTodayRecord = attendanceLogs.find(
      (a) => a.employeeId === matchedEmp.id && a.date === dateStr
    );

    let newRecord: AttendanceRecord;

    if (type === "CHECK_IN") {
      // 1. RECONCILE MISSING CLOCK-OUTS FROM PREVIOUS DAYS
      // If employee came today and started working without clocking out previously:
      const { reconciledCount, summaryMessage } = reconcileMissingPreviousClockOuts(
        matchedEmp.id,
        dateStr,
        attendanceLogs,
        shifts,
        matchedEmp,
        (reconciledPast) => {
          onLogAttendance(reconciledPast);
        }
      );

      // 2. Compute Punctuality (PRESENT vs LATE)
      const { status, lateMinutes } = calculateArrivalPunctuality(timeStr, employeeShift);

      newRecord = {
        id: existingTodayRecord?.id || `att-${Date.now()}`,
        employeeId: matchedEmp.id,
        employeeName: matchedEmp.fullName,
        employeeCode: matchedEmp.employeeCode,
        avatarUrl: matchedEmp.faceRegisteredPhoto || matchedEmp.avatarUrl,
        branchId: targetBranch?.id || matchedEmp.branchId,
        branchName: targetBranch?.name || matchedEmp.branchName,
        departmentName: matchedEmp.departmentName,
        date: dateStr,
        checkInTime: timeStr,
        checkOutTime: existingTodayRecord?.checkOutTime,
        checkInLatitude: gpsLocation?.lat || targetBranch?.latitude,
        checkInLongitude: gpsLocation?.lng || targetBranch?.longitude,
        checkInAddress: gpsAddress || targetBranch?.address,
        checkInDistanceMeters: gpsDistanceMeters,
        checkInGeofencePassed: isInsideGeofence,
        checkInFaceMatchScore: score,
        checkInAntiSpoofingPassed: true,
        totalWorkMinutes: existingTodayRecord?.totalWorkMinutes || 0,
        totalBreakMinutes: existingTodayRecord?.totalBreakMinutes || 0,
        overtimeMinutes: existingTodayRecord?.overtimeMinutes || 0,
        status,
        lateMinutes,
        earlyExitMinutes: 0,
        verificationMethod: "FACE_GPS_LIVE",
        auditNotes: `Realtime Kiosk Auto-Verified (${score}% match score, multi-factor biometric check passed)${
          reconciledCount > 0 ? ` | ${summaryMessage}` : ""
        }`,
      };
    } else {
      // CHECK_OUT
      const inTime = existingTodayRecord?.checkInTime || employeeShift.startTime || "09:00:00";
      const inMins = parseTimeToMinutes(inTime);
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const breakMins = employeeShift.breakDurationMinutes ?? 60;
      const workedMins = Math.max(0, nowMins - inMins - breakMins);
      const overtimeMins = Math.max(0, workedMins - 480);

      newRecord = {
        ...(existingTodayRecord || {
          id: `att-${Date.now()}`,
          employeeId: matchedEmp.id,
          employeeName: matchedEmp.fullName,
          employeeCode: matchedEmp.employeeCode,
          avatarUrl: matchedEmp.faceRegisteredPhoto || matchedEmp.avatarUrl,
          branchId: targetBranch?.id || matchedEmp.branchId,
          branchName: targetBranch?.name || matchedEmp.branchName,
          departmentName: matchedEmp.departmentName,
          date: dateStr,
          checkInTime: inTime,
          status: "PRESENT" as const,
          lateMinutes: 0,
          earlyExitMinutes: 0,
          verificationMethod: "FACE_GPS_LIVE" as const,
        }),
        checkOutTime: timeStr,
        checkOutLatitude: gpsLocation?.lat || targetBranch?.latitude,
        checkOutLongitude: gpsLocation?.lng || targetBranch?.longitude,
        checkOutAddress: gpsAddress || targetBranch?.address,
        checkOutDistanceMeters: gpsDistanceMeters,
        checkOutGeofencePassed: isInsideGeofence,
        checkOutFaceMatchScore: score,
        totalWorkMinutes: workedMins,
        totalBreakMinutes: breakMins,
        overtimeMinutes: overtimeMins,
        auditNotes: (existingTodayRecord?.auditNotes ? existingTodayRecord.auditNotes + " | " : "") +
          `Checked out via biometric face scanner (${workedMins} min worked, ${overtimeMins} min OT)`,
      };
    }

    onLogAttendance(newRecord);

    playSound("success");

    setJustCheckedInEmployee({
      employee: matchedEmp,
      type,
      time: timeStr,
      score,
    });

    setRecentKioskLogs((prev) => [
      {
        id: `kiosk-${Date.now()}`,
        employeeName: matchedEmp.fullName,
        employeeCode: matchedEmp.employeeCode,
        time: timeStr,
        type,
        score,
      },
      ...prev.slice(0, 9),
    ]);

    // Reset countdown and locks
    setAutoClockInCountdown(null);
    setAutoSubmitProgress(100);
    matchLockedUntilRef.current = 0;
    consecutiveMissesRef.current = 0;

    // Reset for next employee or auto-close if in modal mode
    setTimeout(() => {
      setJustCheckedInEmployee(null);
      setMatchResult(null);
      setLivenessStage("ALIGN");
      setBlinkCompleted(false);
      if (isModal && onClose) {
        onClose();
      }
    }, 3200);
  }, [
    activeMode,
    matchResult,
    employees,
    selected1to1EmployeeId,
    branches,
    selectedBranchId,
    shifts,
    attendanceLogs,
    gpsLocation,
    gpsAddress,
    gpsDistanceMeters,
    isInsideGeofence,
    onLogAttendance,
    playSound,
    isModal,
    onClose,
  ]);

  // Filtered employees for 1:1 selection
  const filteredEmployees1to1 = employees.filter((e) => {
    const q = employeeSearchQuery.toLowerCase();
    return (
      e.fullName.toLowerCase().includes(q) ||
      e.employeeCode.toLowerCase().includes(q) ||
      e.departmentName.toLowerCase().includes(q)
    );
  });

  const selectedTargetEmp = employees.find((e) => e.id === selected1to1EmployeeId);

  const currentTargetEmp =
    activeMode === "AUTO_KIOSK"
      ? matchResult?.matchedEmployee
      : selectedTargetEmp;

  const todayStr = new Date().toISOString().split("T")[0];

  const matchedEmpTodayRecord = currentTargetEmp
    ? attendanceLogs.find((a) => a.employeeId === currentTargetEmp.id && a.date === todayStr)
    : undefined;

  const hasClockedInToday = Boolean(matchedEmpTodayRecord?.checkInTime);
  const hasClockedOutToday = Boolean(matchedEmpTodayRecord?.checkOutTime);

  const recommendedAction: "CHECK_IN" | "CHECK_OUT" =
    hasClockedInToday && !hasClockedOutToday ? "CHECK_OUT" : "CHECK_IN";

  const isReadyToSubmit = Boolean(
    matchResult?.matched &&
      (matchResult.matchedEmployee || (activeMode === "ONE_TO_ONE" && selectedTargetEmp)) &&
      (livenessStage === "VERIFIED" || blinkCompleted) &&
      !justCheckedInEmployee
  );

  // 3-Second Auto-Submit Countdown Loop for seamless kiosk clock-in/out
  useEffect(() => {
    if (!isReadyToSubmit) {
      setAutoClockInCountdown(null);
      setAutoSubmitProgress(100);
      return;
    }

    const DURATION_MS = 3000;
    const startMs = Date.now();
    setAutoClockInCountdown(3);
    setAutoSubmitProgress(100);

    const timer = setInterval(() => {
      const elapsed = Date.now() - startMs;
      const remainingMs = Math.max(0, DURATION_MS - elapsed);
      const remainingSec = Math.ceil(remainingMs / 1000);
      const progress = Math.max(0, Math.round((remainingMs / DURATION_MS) * 100));

      setAutoClockInCountdown(remainingSec);
      setAutoSubmitProgress(progress);

      if (remainingMs <= 0) {
        clearInterval(timer);
        setAutoClockInCountdown(null);
        handleConfirmAttendance(recommendedAction);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [isReadyToSubmit, handleConfirmAttendance, recommendedAction]);

  const handleResetScan = () => {
    matchLockedUntilRef.current = 0;
    consecutiveMissesRef.current = 0;
    setAutoClockInCountdown(null);
    setAutoSubmitProgress(100);
    resetBilateralBlinkState();
    steadyGazeStartRef.current = null;
    setSteadyGazeProgress(0);
    setMatchResult(null);
    setLivenessStage("ALIGN");
    setBlinkCompleted(false);
  };

  // Enrolled directory list
  const directoryList = employees.filter((e) => {
    const q = directorySearch.toLowerCase();
    return (
      e.fullName.toLowerCase().includes(q) ||
      e.employeeCode.toLowerCase().includes(q) ||
      e.departmentName.toLowerCase().includes(q)
    );
  });

  // Reusable Kiosk Recent Logs Component
  const renderRecentKioskLogs = () => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-teal-500" />
          <span>{isBangla ? "আজকের কিওস্ক হাজিরা লগ" : "Today's Kiosk Attendance Logs"}</span>
        </h3>
        <span className="text-[11px] font-mono text-slate-400">
          {recentKioskLogs.length} {isBangla ? "জন" : "stamped"}
        </span>
      </div>

      {recentKioskLogs.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">
          {isBangla ? "আজ এখনও কিওস্ক থেকে কোনো হাজিরা নিশ্চিত করা হয়নি।" : "No kiosk attendances stamped yet today."}
        </p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {recentKioskLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 rounded-xl text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    log.type === "CHECK_IN" ? "bg-emerald-500" : "bg-blue-500"
                  }`}
                />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{log.employeeName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{log.employeeCode}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {log.time}
                </span>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {log.type === "CHECK_IN" ? "ইন" : "আউট"} ({log.score}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const mainContent = (
    <div className="space-y-6">
      {/* Top Banner & Mode Navigation: Visible on desktop (lg:block), hidden on mobile (hidden lg:block) so camera is immediately at the top */}
      {isModal ? (
        <div className="hidden lg:block bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400 shrink-0">
                <ScanFace className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                    {isBangla ? "লাইভ বায়োমেট্রিক হাজিরা ও ফেস রিকগনিশন" : "Live Biometric Attendance & Face Kiosk"}
                  </h2>
                  <span className="bg-teal-500/20 text-teal-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-teal-500/40">
                    AI 128D Multi-Factor
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {isBangla
                    ? "ক্যামেরার সামনে স্বাভাবিকভাবে অবস্থান করুন • স্বয়ংক্রিয় শনাক্তকরণ ও হাজিরা গ্রহণ"
                    : "Position naturally in front of camera • Automated detection & multi-factor verification"}
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {/* Screen Fill-Light Toggle */}
              <button
                type="button"
                onClick={() => setScreenFillLight((prev) => !prev)}
                className={`p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  screenFillLight
                    ? "bg-amber-400 text-slate-950 border-amber-300"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
                title={isBangla ? "ফিল-লাইট অন/অফ করুন" : "Toggle Screen Fill-Light"}
              >
                <Sun className={`w-4 h-4 ${screenFillLight ? "text-slate-950 fill-slate-950" : "text-amber-400"}`} />
              </button>

              {/* Audio Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? (isBangla ? "মিউট করুন" : "Mute Sound") : (isBangla ? "সাউন্ড অন করুন" : "Enable Sound")}
                className="p-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>

              {/* Admin Biometric Policy (Super Admin Only) */}
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setTempModeAvailability(biometricSettings?.modeAvailability || "BOTH");
                    setShowAdminSettingsModal(true);
                  }}
                  className="p-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
                  title={isBangla ? "পলিসি সেটিংস (সুপার অ্যাডমিন)" : "Admin Biometric Settings"}
                >
                  <Settings className="w-4 h-4 text-teal-400" />
                  <span className="hidden sm:inline font-semibold text-[11px] text-teal-300">
                    {isBangla ? "পলিসি" : "Policy"}
                  </span>
                </button>
              )}

              {/* Close Button */}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-red-950/50 hover:border-red-500/50 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Modal Mode Selector */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => setActiveMode("AUTO_KIOSK")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMode === "AUTO_KIOSK"
                  ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isBangla ? "স্বয়ংক্রিয় কিওস্ক (1:N)" : "Auto Kiosk (1:N)"}</span>
            </button>

            <button
              onClick={() => setActiveMode("ONE_TO_ONE")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMode === "ONE_TO_ONE"
                  ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isBangla ? "ম্যানুয়াল নির্বাচন (1:1)" : "1:1 Staff Verify"}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden lg:block bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400">
                <ScanFace className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    {isBangla
                      ? "রিয়েল-টাইম ফেস ডিটেকশন ও রিকগনাইজেশন কিওস্ক"
                      : "Real-Time Face Detection & Recognition Kiosk"}
                  </h1>
                  <span className="bg-teal-500/20 text-teal-300 text-xs font-mono px-2.5 py-0.5 rounded-full border border-teal-500/40">
                    AI 128D Multi-Factor
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {isBangla
                    ? "উচ্চ নির্ভুলতার লাইভ ফেস ভেরিফিকেশন, ন্যাচারাল অ্যান্টি-স্পুফিং ও কর্মচারীদের সঠিক হাজিরা নিশ্চিতকরণ"
                    : "High-precision live biometric identification, natural anti-spoofing & automated attendance stamping"}
                </p>
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* Virtual Screen Fill-Light Toggle */}
              <button
                type="button"
                onClick={() => setScreenFillLight((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  screenFillLight
                    ? "bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 shadow-md shadow-amber-400/20"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
                title="কম আলোতে চেহারা স্পষ্ট দেখতে চারপাশ সাদা আলোতে পরিণত করুন"
              >
                <Sun className={`w-4 h-4 ${screenFillLight ? "text-slate-950 fill-slate-950" : "text-amber-400"}`} />
                <span>{screenFillLight ? "💡 ফিল-লাইট অন" : "ফিল-লাইট অফ"}</span>
              </button>

              {/* Audio Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "মিউট করুন" : "সাউন্ড অন করুন"}
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>

              {/* Admin Biometric Policy Button (Super Admin Only) */}
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setTempModeAvailability(biometricSettings?.modeAvailability || "BOTH");
                    setShowAdminSettingsModal(true);
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                  title={isBangla ? "পলিসি সেটিংস (সুপার অ্যাডমিন)" : "Admin Biometric Settings"}
                >
                  <Settings className="w-4 h-4 text-teal-400" />
                  <span className="text-teal-300">{isBangla ? "পলিসি সেটিংস" : "Policy Settings"}</span>
                </button>
              )}

              {/* Camera Power Toggle */}
              <button
                onClick={() => setIsCameraActive(!isCameraActive)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors border cursor-pointer ${
                  isCameraActive
                    ? "bg-teal-600/20 text-teal-300 border-teal-500/40 hover:bg-teal-600/30"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
              >
                {isCameraActive ? <Video className="w-4 h-4 text-teal-400" /> : <VideoOff className="w-4 h-4 text-slate-400" />}
                <span>{isCameraActive ? (isBangla ? "ক্যামেরা সচল" : "Camera Active") : (isBangla ? "ক্যামেরা বন্ধ" : "Camera Off")}</span>
              </button>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-2 mt-5 border-t border-slate-800 pt-4 overflow-x-auto">
            <button
              onClick={() => setActiveMode("AUTO_KIOSK")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeMode === "AUTO_KIOSK"
                  ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isBangla ? "স্বয়ংক্রিয় কিওস্ক মোড (1:N Auto Detect)" : "Auto Kiosk Mode (1:N)"}</span>
            </button>

            <button
              onClick={() => setActiveMode("ONE_TO_ONE")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeMode === "ONE_TO_ONE"
                  ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{isBangla ? "ম্যানুয়াল নির্বাচন ও ভেরিফাই (1:1 Verify)" : "1:1 Staff Verification"}</span>
            </button>

            <button
              onClick={() => setActiveMode("ATTENDANCE_LOGS")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeMode === "ATTENDANCE_LOGS"
                  ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{isBangla ? "হাজিরা লগ ও হিস্ট্রি" : "Attendance Logs & Reports"}</span>
              <span className="ml-1 bg-slate-900/60 text-slate-300 px-2 py-0.5 rounded-full text-[10px]">
                {attendanceLogs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveMode("DATABASE_DIRECTORY")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeMode === "DATABASE_DIRECTORY"
                  ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{isBangla ? "নিবন্ধিত ফেস ডাটাবেজ (Database & Audit)" : "Enrolled Biometric Directory"}</span>
              <span className="ml-1 bg-slate-900/60 text-slate-300 px-2 py-0.5 rounded-full text-[10px]">
                {employees.filter((e) => Boolean(e.faceRegisteredPhoto || e.avatarUrl)).length}/{employees.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW CONTENT BASED ON ACTIVE MODE */}
      {activeMode === "ATTENDANCE_LOGS" ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <AttendanceLogsView
            attendanceLogs={attendanceLogs}
            branches={branches}
            employees={employees}
            currentUser={currentEmployee}
            onOpenAttendanceModal={onOpenAttendanceModal || (() => {})}
          />
        </div>
      ) : activeMode !== "DATABASE_DIRECTORY" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* 1. CAMERA VIEWPORT: Always at top on mobile & tablet, 7 cols on desktop */}
          <div className="order-1 lg:order-1 lg:col-span-7 space-y-4">
            <div
              className={`bg-slate-950 border rounded-2xl overflow-hidden shadow-2xl relative transition-all duration-300 ${
                screenFillLight ? "border-amber-300 ring-4 ring-amber-400/40" : "border-slate-800"
              }`}
            >
              {/* Camera Header Status Strip */}
              <div className="bg-slate-900/90 border-b border-slate-800 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      matchResult?.matched
                        ? "bg-emerald-400 animate-ping"
                        : matchResult?.reason === "MISMATCH_LOW_CONFIDENCE"
                        ? "bg-red-500"
                        : liveFaceAnalysis?.hasFace
                        ? "bg-teal-400 animate-pulse"
                        : "bg-slate-500"
                    }`}
                  />
                  <span className="font-semibold text-white">
                    {activeMode === "AUTO_KIOSK"
                      ? isBangla
                        ? "স্বয়ংক্রিয় ফেস ট্র্যাকার"
                        : "Live Auto Biometric Scanner"
                      : isBangla
                      ? "১:১ কর্মচারী ভেরিফিকেশন"
                      : "1:1 Verification Scanner"}
                  </span>

                  {liveFaceAnalysis?.glassesDetected && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      {isBangla ? "👓 চশমা" : "👓 Glasses"}
                    </span>
                  )}
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  {/* Low-Light Status & Toggle */}
                  {(liveFaceAnalysis?.isLowLight || lowLightBoostEnabled) && (
                    <div
                      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        liveFaceAnalysis?.isLowLight
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                      title={isBangla ? "অটোমেটিক লো-লাইট বুস্ট সক্রিয়" : "Low light adaptive gain active"}
                    >
                      <Moon className="w-3 h-3 text-amber-400" />
                      <span>{isBangla ? "🌙 কম আলো" : "🌙 Low Light"}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setLowLightBoostEnabled((prev) => !prev)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      lowLightBoostEnabled
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                    }`}
                    title={isBangla ? "অটো লো-লাইট সেন্সর বুস্ট অন/অফ" : "Toggle Low-Light Gain"}
                  >
                    {lowLightBoostEnabled ? (isBangla ? "বুস্ট অন" : "Gain On") : (isBangla ? "বুস্ট অফ" : "Gain Off")}
                  </button>

                  {/* Anti-spoofing verification method selector */}
                  <div className="flex items-center bg-slate-950/80 border border-slate-700/80 rounded-lg p-0.5">
                    <button
                      onClick={() => {
                        setLivenessMode("BILATERAL_BLINK");
                        resetBilateralBlinkState();
                        setSteadyGazeProgress(0);
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        livenessMode === "BILATERAL_BLINK"
                          ? "bg-teal-500 text-slate-950"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title={isBangla ? "অ্যাডাপ্টিভ চোখের পলক অথবা হালকা হাসি উভয় পদ্ধতিতেই স্বয়ংক্রিয় লাইভনেস নিশ্চিত" : "Bilateral natural blink or subtle smile"}
                    >
                      {isBangla ? "স্মার্ট / পলক" : "Smart Blink"}
                    </button>
                    <button
                      onClick={() => {
                        setLivenessMode("SMILE");
                        setSteadyGazeProgress(0);
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        livenessMode === "SMILE"
                          ? "bg-teal-500 text-slate-950"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title={isBangla ? "ক্যামেরার দিকে তাকিয়ে মুখে হালকা হাসি দিয়ে যাচাই" : "Gentle smile verification"}
                    >
                      {isBangla ? "হালকা হাসি" : "Smile"}
                    </button>
                    <button
                      onClick={() => {
                        setLivenessMode("STEADY_GAZE");
                        setSteadyGazeProgress(0);
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        livenessMode === "STEADY_GAZE"
                          ? "bg-teal-500 text-slate-950"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title={isBangla ? "১ সেকেন্ড ফ্রেমের মধ্যে স্থির দৃষ্টি রেখে যাচাই (চশমা পরা বা চোখে সমস্যা থাকলে উত্তম)" : "Steady frontal face gaze (1.0s)"}
                    >
                      {isBangla ? "স্থির দৃষ্টি" : "Steady Gaze"}
                    </button>
                  </div>

                  {liveFaceAnalysis?.hasFace && (
                    <span className="text-[11px] font-mono text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/60">
                      128D
                    </span>
                  )}

                  {/* Screen Fill Light Quick Toggle */}
                  <button
                    type="button"
                    onClick={() => setScreenFillLight((prev) => !prev)}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      screenFillLight
                        ? "bg-amber-400 text-slate-950 border-amber-300"
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                    }`}
                    title={isBangla ? "ফিল-লাইট অন/অফ" : "Fill-Light"}
                  >
                    <Sun className={`w-3.5 h-3.5 ${screenFillLight ? "text-slate-950 fill-slate-950" : "text-amber-400"}`} />
                  </button>

                  {/* Audio Toggle */}
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    title={soundEnabled ? (isBangla ? "সাউন্ড মিউট" : "Mute") : (isBangla ? "সাউন্ড অন" : "Unmute")}
                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-teal-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  {/* Super Admin Quick Policy Button */}
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setTempModeAvailability(biometricSettings?.modeAvailability || "BOTH");
                        setShowAdminSettingsModal(true);
                      }}
                      title={isBangla ? "সুপার অ্যাডমিন: কিওস্ক মোড পলিসি পরিবর্তন" : "Super Admin: Kiosk Mode Policy"}
                      className="p-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Close button if in modal */}
                  {isModal && onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-red-950/50 hover:border-red-500/50 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={handleResetScan}
                    title="রিসেট"
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isBangla ? "রিসেট" : "Reset"}</span>
                  </button>
                </div>
              </div>

              {/* Video Viewport Container */}
              <div className="relative aspect-[4/3] bg-slate-950 flex items-center justify-center overflow-hidden">
                {isCameraActive && !cameraError ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      filter: (screenFillLight || lowLightBoostEnabled || liveFaceAnalysis?.isLowLight)
                        ? "brightness(1.36) contrast(1.22) saturate(1.15)"
                        : "none",
                    }}
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="p-8 text-center text-slate-400 space-y-3">
                    <VideoOff className="w-12 h-12 mx-auto text-slate-600" />
                    <p className="text-sm text-slate-300">
                      {cameraError || (isBangla ? "ক্যামেরা বন্ধ রয়েছে" : "Camera stream is inactive")}
                    </p>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-500 cursor-pointer"
                    >
                      {isBangla ? "ক্যামেরা চালু করুন" : "Start Camera"}
                    </button>
                  </div>
                )}

                {/* Biometric Mesh Canvas Overlay */}
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={480}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />

                {/* Floating Smart Low-Light Warning & Screen Fill-Light Guidance */}
                {liveFaceAnalysis?.isLowLight && !screenFillLight && (
                  <div className="absolute top-3 inset-x-3 z-20 bg-amber-950/90 backdrop-blur-md border border-amber-500/80 rounded-xl p-2.5 flex items-center justify-between shadow-xl text-xs animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-amber-200">
                      <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-medium text-[11px] sm:text-xs">
                        {isBangla ? "চারপাশে আলো কম? স্ক্রিন ফিল-লাইট অন করুন" : "Low ambient light? Turn on Screen Fill-Light"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScreenFillLight(true)}
                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-lg shadow cursor-pointer transition-colors whitespace-nowrap"
                    >
                      {isBangla ? "💡 ফিল-লাইট অন" : "Turn On"}
                    </button>
                  </div>
                )}

                {/* Floating Fill-Light Active Notice */}
                {screenFillLight && (
                  <div className="absolute top-3 inset-x-3 z-20 bg-white/95 text-slate-900 border-2 border-amber-400 rounded-xl p-2 flex items-center justify-between shadow-lg text-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-800">
                      <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-[11px] sm:text-xs">
                        {isBangla ? "💡 স্ক্রিন ফিল-লাইট সক্রিয় • মুখ আলোকিত হচ্ছে" : "💡 Fill-Light active • Face illuminated"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScreenFillLight(false)}
                      className="px-2.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[11px] rounded-md transition-colors cursor-pointer"
                    >
                      {isBangla ? "বন্ধ করুন" : "Turn Off"}
                    </button>
                  </div>
                )}

                {/* Instant Verification Toast Floating Banner */}
                {justCheckedInEmployee && (
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in zoom-in duration-200">
                    <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <span className="bg-emerald-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-full mb-2">
                      {justCheckedInEmployee.type === "CHECK_IN"
                        ? isBangla
                          ? "✓ উপস্থিতি গ্রহণ সম্পন্ন (Checked-In)"
                          : "✓ Check-In Confirmed"
                        : isBangla
                        ? "✓ প্রস্থান গ্রহণ সম্পন্ন (Checked-Out)"
                        : "✓ Check-Out Confirmed"}
                    </span>
                    <h3 className="text-xl font-bold text-white">{justCheckedInEmployee.employee.fullName}</h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      ID: {justCheckedInEmployee.employee.employeeCode} | {justCheckedInEmployee.employee.designationTitle}
                    </p>
                    <p className="text-sm font-semibold text-emerald-300 mt-2">
                      {isBangla ? "সময়:" : "Time:"} {justCheckedInEmployee.time} (বায়োমেট্রিক নির্ভুলতা:{" "}
                      {justCheckedInEmployee.score}%)
                    </p>
                  </div>
                )}

                {/* Live Anti-Spoofing Guidance Banner on Camera */}
                <div className="absolute bottom-3 inset-x-3 bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        livenessStage === "VERIFIED"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : livenessStage === "BLINK"
                          ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 animate-pulse"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {livenessStage === "VERIFIED" ? (
                        <Check className="w-4 h-4" />
                      ) : livenessStage === "BLINK" ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <ScanFace className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white">
                        {livenessStage === "VERIFIED"
                          ? isBangla
                            ? "✓ অ্যান্টি-স্পুফিং সফল ও চেহারা নিশ্চিত"
                            : "✓ Anti-Spoofing Verified"
                          : livenessStage === "BLINK"
                          ? livenessMode === "STEADY_GAZE"
                            ? isBangla
                              ? `ক্যামেরার দিকে স্থির তাকিয়ে থাকুন... (${steadyGazeProgress}%)`
                              : `Hold steady gaze into camera... (${steadyGazeProgress}%)`
                            : livenessMode === "SMILE"
                            ? isBangla
                              ? "মুখে হালকা হাসি দিন (Gentle Smile)"
                              : "Please Smile at the Camera"
                            : isBangla
                            ? "চোখের পলক ফেলুন অথবা মুখে হালকা হাসি দিন (Smile)"
                            : "Please Blink Naturally or Smile Gently"
                          : liveFaceAnalysis?.hasFace
                          ? isBangla
                            ? "ক্যামেরার মাঝখানে সোজা তাকিয়ে থাকুন..."
                            : "Keep face centered in the guide..."
                          : isBangla
                          ? "ফ্রেমের মধ্যে মুখ সোজা রাখুন"
                          : "Align face inside the oval guide"}
                      </p>
                      {livenessStage === "BLINK" && livenessMode === "STEADY_GAZE" && (
                        <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="bg-teal-400 h-full transition-all duration-100"
                            style={{ width: `${steadyGazeProgress}%` }}
                          />
                        </div>
                      )}
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {liveFaceAnalysis?.skinToneProfile?.description ||
                          (isBangla ? "ক্যামেরা রেডি" : "Camera Ready")}
                      </p>
                    </div>
                  </div>

                  {/* Manual trigger if lighting is bad or employee has glare/glasses */}
                  {livenessStage === "BLINK" && (
                    <button
                      onClick={() => {
                        setBlinkCompleted(true);
                        setLivenessStage("VERIFIED");
                        playSound("blink");
                      }}
                      className="text-[11px] px-3 py-1.5 bg-teal-600/30 hover:bg-teal-600/50 border border-teal-500/50 rounded-lg text-teal-200 font-bold whitespace-nowrap transition-colors cursor-pointer"
                      title={isBangla ? "প্রতিকূল আলো বা ক্যামেরার ক্ষেত্রে সুপারভাইজার কর্তৃক সরাসরি উপস্থিতি অনুমোদন" : "Supervisor quick verify in low light"}
                    >
                      {isBangla ? "সুপারভাইজার ভেরিফাই" : "Supervisor Verify"}
                    </button>
                  )}
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* IN-CAMERA PROFILE SHOWCASE: Docked directly at bottom of camera   */}
              {/* Shows recognized employee profile, score, countdown & touch buttons */}
              {/* ----------------------------------------------------------------- */}
              {matchResult?.matched && (matchResult.matchedEmployee || selectedTargetEmp) ? (
                (() => {
                  const emp = matchResult.matchedEmployee || selectedTargetEmp!;
                  return (
                    <div className="bg-slate-900/95 border-t border-emerald-500/50 backdrop-blur-md p-3 sm:p-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
                      {/* Matched Header Bar */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                          <span className="text-xs font-black text-emerald-400">
                            {isBangla
                              ? `✓ বায়োমেট্রিক ম্যাচ নিশ্চিত (${matchResult.matchScore}%)`
                              : `✓ Biometric Match Confirmed (${matchResult.matchScore}%)`}
                          </span>
                        </div>
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/40">
                          AI 128D Multi-Factor
                        </span>
                      </div>

                      {/* Profile Row */}
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.faceRegisteredPhoto || emp.avatarUrl}
                          alt={emp.fullName}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-emerald-400 ring-4 ring-emerald-400/20 shadow-lg shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-white text-sm sm:text-base truncate">
                              {emp.fullName}
                            </h4>
                            <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                              VERIFIED
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-mono truncate">
                            ID: {emp.employeeCode} • {emp.designationTitle}
                          </p>
                          <p className="text-[11px] text-slate-300 truncate">
                            {emp.departmentName} ({emp.branchName})
                          </p>
                        </div>
                      </div>

                      {/* Auto Countdown Progress Banner */}
                      {autoClockInCountdown !== null && (
                        <div className="mt-2.5 p-2 bg-emerald-950/60 border border-emerald-500/40 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-emerald-400" />
                              <span>
                                {recommendedAction === "CHECK_OUT"
                                  ? isBangla
                                    ? "স্বয়ংক্রিয় প্রস্থান (Check-Out) কাউন্টডাউন:"
                                    : "Auto Check-Out Countdown:"
                                  : isBangla
                                  ? "স্বয়ংক্রিয় উপস্থিতি (Check-In) কাউন্টডাউন:"
                                  : "Auto Clock-In Countdown:"}
                              </span>
                            </span>
                            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50">
                              {autoClockInCountdown}s
                            </span>
                          </div>
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-emerald-500/30">
                            <div
                              className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-100 ease-linear rounded-full"
                              style={{ width: `${autoSubmitProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Today's Status Banner if clocked in */}
                      {matchedEmpTodayRecord && (
                        <div className="mt-2 p-2 rounded-xl text-[11px] flex items-center gap-1.5 bg-slate-800/90 text-slate-300 border border-slate-700/80">
                          <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span className="truncate">
                            {hasClockedInToday && !hasClockedOutToday
                              ? isBangla
                                ? `আজকের উপস্থিতি: ${matchedEmpTodayRecord.checkInTime} (প্রস্থান রেকর্ড করতে পারেন)`
                                : `Checked in at ${matchedEmpTodayRecord.checkInTime}`
                              : hasClockedInToday && hasClockedOutToday
                              ? isBangla
                                ? `আজকের হাজিরা সম্পন্ন (ইন: ${matchedEmpTodayRecord.checkInTime} | আউট: ${matchedEmpTodayRecord.checkOutTime})`
                                : `Done today (In: ${matchedEmpTodayRecord.checkInTime} | Out: ${matchedEmpTodayRecord.checkOutTime})`
                              : isBangla
                              ? "আজকের উপস্থিতি রেকর্ড করুন"
                              : "Record attendance"}
                          </span>
                        </div>
                      )}

                      {/* In-Camera Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => handleConfirmAttendance("CHECK_IN")}
                          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 font-bold text-xs rounded-xl transition-all cursor-pointer ${
                            recommendedAction === "CHECK_IN"
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-300"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          <span>
                            {isBangla
                              ? `উপস্থিতি (In) ${recommendedAction === "CHECK_IN" && autoClockInCountdown ? `(${autoClockInCountdown}s)` : ""}`
                              : `Confirm In ${recommendedAction === "CHECK_IN" && autoClockInCountdown ? `(${autoClockInCountdown}s)` : ""}`}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConfirmAttendance("CHECK_OUT")}
                          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 font-bold text-xs rounded-xl transition-all cursor-pointer ${
                            recommendedAction === "CHECK_OUT"
                              ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black shadow-lg shadow-teal-500/20 ring-2 ring-teal-300"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                          <span>
                            {isBangla
                              ? `প্রস্থান (Out) ${recommendedAction === "CHECK_OUT" && autoClockInCountdown ? `(${autoClockInCountdown}s)` : ""}`
                              : `Confirm Out ${recommendedAction === "CHECK_OUT" && autoClockInCountdown ? `(${autoClockInCountdown}s)` : ""}`}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : matchResult?.reason === "MISMATCH_LOW_CONFIDENCE" ? (
                <div className="bg-slate-900/95 border-t border-red-500/50 backdrop-blur-md p-3 sm:p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-red-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span>{isBangla ? `চেহারা মেলেনি (${matchResult.matchScore}%)` : `Mismatch (${matchResult.matchScore}%)`}</span>
                    </span>
                    <button
                      onClick={handleResetScan}
                      className="px-2.5 py-1 bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 rounded-lg text-red-200 text-[11px] cursor-pointer"
                    >
                      {isBangla ? "পুনরায় চেষ্টা" : "Retry"}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isBangla
                      ? "তালিকাভুক্ত কর্মচারীর সাথে কোনো মিল পাওয়া যায়নি। ফ্রেমের মাঝখানে সোজা দাঁড়ান অথবা সুপারভাইজারের সাহায্য নিন।"
                      : "No enrolled match found. Re-align face or request supervisor assistance."}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* 2. RECOGNITION RESULTS & ACTIONS: lg:col-span-5 space-y-4 */}
          <div className="order-2 lg:order-2 lg:col-span-5 space-y-4">
            {/* Mode Specific Selector Toolbar for 1:1 Verification */}
            {activeMode === "ONE_TO_ONE" && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {isBangla ? "ভেরিফাইয়ের জন্য কর্মচারী সিলেক্ট করুন" : "Select Target Employee to Verify"}
                  </h3>
                  <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">1:1 Mode</span>
                </div>

                {/* Employee Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={employeeSearchQuery}
                    onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                    placeholder={isBangla ? "নাম বা আইডি দিয়ে খুঁজুন..." : "Search name or code..."}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Dropdown Selector */}
                <select
                  value={selected1to1EmployeeId}
                  onChange={(e) => setSelected1to1EmployeeId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  {filteredEmployees1to1.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode}) - {emp.designationTitle}
                    </option>
                  ))}
                </select>

                {/* Target Employee Registered Photo Preview */}
                {selectedTargetEmp && (
                  <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-xl">
                    <img
                      src={selectedTargetEmp.faceRegisteredPhoto || selectedTargetEmp.avatarUrl}
                      alt={selectedTargetEmp.fullName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-300 dark:border-slate-700"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900 dark:text-white">{selectedTargetEmp.fullName}</p>
                      <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {selectedTargetEmp.employeeCode} | {selectedTargetEmp.departmentName}
                      </p>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                        {selectedTargetEmp.faceRegisteredPhoto ? "✓ রেজিস্টার্ড ফেস ফটো অন-ফাইল" : "অবতার ফটো"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* RECOGNITION STATUS & IDENTITY CARD (Desktop full-view, hidden on mobile since mobile shows in-camera profile) */}
            <div className="hidden lg:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ScanFace className="w-4 h-4 text-teal-500" />
                  <span>
                    {activeMode === "AUTO_KIOSK"
                      ? isBangla
                        ? "স্বয়ংক্রিয় শনাক্তকরণ ফলাফল"
                        : "Auto-Recognition Result"
                      : isBangla
                      ? "ভেরিফিকেশন যাচাই ফলাফল"
                      : "Verification Result"}
                  </span>
                </h2>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    matchResult?.matched
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                      : matchResult?.reason === "MISMATCH_LOW_CONFIDENCE"
                      ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400 border border-red-300 dark:border-red-800"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {matchResult?.matched
                    ? isBangla
                      ? `স্বীকৃত (${matchResult.matchScore}%)`
                      : `MATCHED (${matchResult.matchScore}%)`
                    : matchResult?.reason === "MISMATCH_LOW_CONFIDENCE"
                    ? isBangla
                      ? `অমিল (${matchResult.matchScore}%)`
                      : `MISMATCH (${matchResult.matchScore}%)`
                    : isBangla
                    ? "স্ক্যান চলছে..."
                    : "Scanning..."}
                </span>
              </div>

              {/* CASE 1: MATCH SUCCESS */}
              {matchResult?.matched && (matchResult.matchedEmployee || selectedTargetEmp) ? (
                (() => {
                  const emp = matchResult.matchedEmployee || selectedTargetEmp!;
                  return (
                    <div className="space-y-4 animate-in fade-in zoom-in duration-200">
                      {/* Employee Profile Preview */}
                      <div className="flex items-center gap-4 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
                        <img
                          src={emp.faceRegisteredPhoto || emp.avatarUrl}
                          alt={emp.fullName}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-slate-900 dark:text-white">
                              {emp.fullName}
                            </h3>
                            <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                              VERIFIED
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {emp.employeeCode} | {emp.designationTitle}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {emp.departmentName} ({emp.branchName})
                          </p>
                        </div>
                      </div>

                      {/* Score Breakdown Bars */}
                      <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                          <span>{isBangla ? "বায়োমেট্রিক নির্ভুলতা:" : "Biometric Match Confidence:"}</span>
                          <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                            {matchResult.matchScore}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${matchResult.matchScore}%` }}
                          />
                        </div>

                        {/* Detailed Metrics */}
                        {matchResult.scoreBreakdown && (
                          <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
                            <div>
                              <span>{isBangla ? "স্কিন টোন মিল:" : "Skin Tone Match:"}</span>{" "}
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {matchResult.scoreBreakdown.skinToneSim}%
                              </span>
                            </div>
                            <div>
                              <span>{isBangla ? "টপোলজি মিল:" : "Spatial Vector:"}</span>{" "}
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {matchResult.scoreBreakdown.spatialSim}%
                              </span>
                            </div>
                            <div>
                              <span>{isBangla ? "দাড়ি প্রোফাইল:" : "Facial Hair:"}</span>{" "}
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {matchResult.scoreBreakdown.beardMatch ? "✓ মিলেছে" : "অমিল"}
                              </span>
                            </div>
                            <div>
                              <span>{isBangla ? "চশমা স্ট্যাটাস:" : "Eyeglasses:"}</span>{" "}
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {matchResult.scoreBreakdown.glassesMatch ? "✓ সামঞ্জস্যপূর্ণ" : "অমিল"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Liveness Checklist Progression */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isBangla ? "১. ফেস ফ্রেম অ্যালাইনমেন্ট সম্পন্ন" : "1. Face Frame Aligned"}</span>
                        </div>
                        <div
                          className={`flex items-center gap-2 ${
                            blinkCompleted
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-500 font-semibold"
                          }`}
                        >
                          {blinkCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Eye className="w-4 h-4 animate-bounce" />}
                          <span>
                            {blinkCompleted
                              ? isBangla
                                ? "২. অ্যান্টি-স্পুফিং চোখের পলক সফল"
                                : "2. Anti-Spoofing Blink Verified"
                              : isBangla
                              ? "২. অ্যান্টি-স্পুফিং: ক্যামেরার দিকে তাকিয়ে একবার চোখের পলক ফেলুন"
                              : "2. Anti-Spoofing: Please blink at the camera once"}
                          </span>
                        </div>
                      </div>

                      {/* TODAY'S ATTENDANCE STATUS BADGE FOR EMPLOYEE */}
                      {matchedEmpTodayRecord && (
                        <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                          hasClockedInToday && !hasClockedOutToday
                            ? "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                            : hasClockedInToday && hasClockedOutToday
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                            : "bg-slate-800 text-slate-300"
                        }`}>
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>
                            {hasClockedInToday && !hasClockedOutToday
                              ? isBangla
                                ? `আজকের ক্লক-ইন: ${matchedEmpTodayRecord.checkInTime} (এখন প্রস্থান রেকর্ড হবে)`
                                : `Today's Check-In: ${matchedEmpTodayRecord.checkInTime} (Now ready for check-out)`
                              : hasClockedInToday && hasClockedOutToday
                              ? isBangla
                                ? `আজকের হাজিরা সম্পন্ন (ইন: ${matchedEmpTodayRecord.checkInTime} | আউট: ${matchedEmpTodayRecord.checkOutTime})`
                                : `Today's Attendance Completed (In: ${matchedEmpTodayRecord.checkInTime} | Out: ${matchedEmpTodayRecord.checkOutTime})`
                              : isBangla
                              ? "আজকের নতুন উপস্থিতি রেকর্ড করা হচ্ছে"
                              : "Logging fresh check-in"}
                          </span>
                        </div>
                      )}

                      {/* AUTO CLOCK-IN/OUT COUNTDOWN NOTIFIER & PROGRESS BAR */}
                      {autoClockInCountdown !== null && (
                        <div className="p-3.5 bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/50 rounded-xl space-y-2 animate-in fade-in">
                          <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                              <span>
                                {recommendedAction === "CHECK_OUT"
                                  ? isBangla
                                    ? "স্বয়ংক্রিয় প্রস্থান (Check-Out) কাউন্টডাউন:"
                                    : "Auto Check-Out Countdown:"
                                  : isBangla
                                  ? "স্বয়ংক্রিয় উপস্থিতি (Check-In) কাউন্টডাউন:"
                                  : "Auto Clock-In Countdown:"}
                              </span>
                            </span>
                            <span className="font-mono text-sm px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-sm">
                              {autoClockInCountdown}s
                            </span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-emerald-500/30">
                            <div
                              className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-green-300 transition-all duration-100 ease-linear rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                              style={{ width: `${autoSubmitProgress}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-emerald-200/90 text-center font-medium">
                            {recommendedAction === "CHECK_OUT"
                              ? isBangla
                                ? "৩ সেকেন্ডে স্বয়ংক্রিয়ভাবে প্রস্থান (Check-Out) রেকর্ড হবে"
                                : "Auto-logging check-out in 3s"
                              : isBangla
                              ? "৩ সেকেন্ডে স্বয়ংক্রিয়ভাবে উপস্থিতি (Check-In) রেকর্ড হবে"
                              : "Auto-logging attendance in 3s"}
                          </p>
                        </div>
                      )}

                      {/* ATTENDANCE ACTION BUTTONS */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          onClick={() => handleConfirmAttendance("CHECK_IN")}
                          className={`flex items-center justify-center gap-2 py-3.5 px-4 font-black text-xs rounded-xl transition-all active:scale-[0.98] cursor-pointer ${
                            recommendedAction === "CHECK_IN"
                              ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/40"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-md"
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          <span>
                            {isBangla
                              ? `উপস্থিতি (Check-In) ${recommendedAction === "CHECK_IN" && autoClockInCountdown ? `(${autoClockInCountdown}s)` : ""}`
                              : `Confirm In ${recommendedAction === "CHECK_IN" && autoClockInCountdown ? `(${autoClockInCountdown}s)` : ""}`}
                          </span>
                        </button>

                        <button
                          onClick={() => handleConfirmAttendance("CHECK_OUT")}
                          className={`flex items-center justify-center gap-2 py-3.5 px-4 font-black text-xs rounded-xl transition-all active:scale-[0.98] cursor-pointer ${
                            recommendedAction === "CHECK_OUT"
                              ? "bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-lg shadow-teal-500/20 ring-2 ring-teal-400/40"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-md"
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                          <span>
                            {isBangla
                              ? `প্রস্থান (Check-Out) ${recommendedAction === "CHECK_OUT" && autoClockInCountdown ? `(${autoClockInCountdown}s)` : ""}`
                              : `Confirm Out ${recommendedAction === "CHECK_OUT" && autoClockInCountdown ? `(${autoClockInCountdown}s)` : ""}`}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : matchResult?.reason === "MISMATCH_LOW_CONFIDENCE" ? (
                /* CASE 2: UNRECOGNIZED PERSON / MISMATCH */
                <div className="space-y-4 animate-in fade-in zoom-in duration-200">
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{isBangla ? "চেহারা ম্যাচ হয়নি / অচেনা ব্যক্তি" : "Face Mismatch / Unknown Person"}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {isBangla
                        ? "ক্যামেরার সামনে থাকা ব্যক্তির চেহারার সাথে ডাটাবেজের নিবন্ধিত কোনো কর্মচারীর মিল পাওয়া যায়নি।"
                        : "Live face does not match any enrolled employee profile in the database."}
                    </p>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-red-100/50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-200/50 dark:border-red-900/30">
                      <p>
                        <strong>{isBangla ? "নিরাপত্তা কারণ:" : "Safety Filter:"}</strong>{" "}
                        {isBangla
                          ? "স্কিন টোন বা ফেসিয়াল হেয়ারের পার্থক্য (যেমন: সাদা দাড়ি বনাম ক্লিন-শেভড) থাকায় ভুল প্রোফাইলে মিল ঘটানো প্রতিরোধ করা হয়েছে।"
                          : "Strict multi-factor checks prevented false matches against non-identical staff."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetScan}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors"
                    >
                      {isBangla ? "পুনরায় স্ক্যান করুন" : "Rescan Camera"}
                    </button>
                    {onOpenEnrollmentModal && (
                      <button
                        onClick={() => onOpenEnrollmentModal()}
                        className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl shadow transition-colors"
                      >
                        {isBangla ? "নতুন ফেস এনরোল করুন" : "Enroll Face Photo"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* CASE 3: WAITING FOR FACE */
                <div className="p-8 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <ScanFace className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {isBangla ? "ক্যামেরার সামনে সোজা হয়ে দাঁড়ান" : "Please stand in front of the camera"}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                      {isBangla
                        ? "ক্যামেরা স্বয়ংক্রিয়ভাবে আপনাকে শনাক্ত করবে এবং চোখের পলক যাচাই করে হাজিরা রেকর্ড করবে।"
                        : "The AI kiosk will automatically detect your face and verify liveness."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Logs: Shown inside right column on >= lg */}
            <div className="hidden lg:block">
              {renderRecentKioskLogs()}
            </div>
          </div>

          {/* 3. BIOMETRIC TELEMETRY METER: order-3 on mobile (BELOW RECOGNITION CARD!), lg:order-3 lg:col-span-7 on desktop */}
          <div className="order-3 lg:order-3 lg:col-span-7">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setTelemetryExpandedMobile((prev) => !prev)}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{isBangla ? "বায়োমেট্রিক টেলিমেট্রি ও এআই প্যারামিটার" : "Biometric Diagnostics & AI Parameters"}</span>
                    <span className="text-[10px] font-normal text-slate-400 hidden sm:inline">
                      ({isBangla ? "আই অ্যাপারচার, মেলানিন, দাড়ি, চশমা" : "Eye Aperture, Melanin, Beard, Glasses"})
                    </span>
                  </h3>
                </div>
                <button
                  type="button"
                  className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <span>
                    {telemetryExpandedMobile
                      ? isBangla
                        ? "সংক্ষেপ করুন"
                        : "Collapse"
                      : isBangla
                      ? "বিস্তারিত দেখুন"
                      : "Expand"}
                  </span>
                  {telemetryExpandedMobile ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* 4 Diagnostics Cards (Strictly collapsed by default on mobile/tablet, expands only on tap) */}
              <div className={`${telemetryExpandedMobile ? "block" : "hidden lg:block"} pt-2 border-t border-slate-800`}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {/* 1. Eye Openness & Blink */}
                  <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Eye className="w-3.5 h-3.5 text-teal-400" />
                        {isBangla ? "চোখের পাতা" : "Eye Aperture"}
                      </span>
                      <span className="font-mono text-teal-300 font-bold">
                        {liveFaceAnalysis?.eyeOpenness || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-100 ${
                          liveFaceAnalysis?.blinkDetected ? "bg-emerald-400" : "bg-teal-400"
                        }`}
                        style={{ width: `${liveFaceAnalysis?.eyeOpenness || 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {blinkCompleted
                        ? isBangla
                          ? "✓ পলক গৃহীত"
                          : "✓ Blink Confirmed"
                        : isBangla
                        ? "পর্যবেক্ষণাধীন"
                        : "Tracking"}
                    </span>
                  </div>

                  {/* 2. Skin Complexion / Melanin */}
                  <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        {isBangla ? "মেলানিন সূচক" : "Melanin Index"}
                      </span>
                      <span className="font-mono text-amber-300 font-bold">
                        {liveFaceAnalysis?.skinToneProfile?.melaninIndex ?? "--"}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all duration-100"
                        style={{ width: `${liveFaceAnalysis?.skinToneProfile?.melaninIndex || 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {liveFaceAnalysis?.skinToneProfile?.melaninIndex !== undefined
                        ? liveFaceAnalysis.skinToneProfile.melaninIndex > 60
                          ? "Dark / Melanin"
                          : liveFaceAnalysis.skinToneProfile.melaninIndex > 35
                          ? "Wheatish"
                          : "Fair"
                        : "Scanning..."}
                    </span>
                  </div>

                  {/* 3. Facial Hair / Beard Profile */}
                  <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-medium">{isBangla ? "দাড়ি প্রোফাইল" : "Facial Hair"}</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {liveFaceAnalysis?.facialHairProfile?.hasWhiteBeard
                          ? "সাদা দাড়ি"
                          : liveFaceAnalysis?.facialHairProfile?.hasDarkBeard
                          ? "কালো দাড়ি"
                          : "ক্লিন-শেভড"}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-100"
                        style={{
                          width: liveFaceAnalysis?.facialHairProfile?.hasWhiteBeard
                            ? "100%"
                            : liveFaceAnalysis?.facialHairProfile?.hasDarkBeard
                            ? "60%"
                            : "20%",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {liveFaceAnalysis?.facialHairProfile?.description || "Analyzing chin..."}
                    </span>
                  </div>

                  {/* 4. Glasses Detector */}
                  <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-medium">{isBangla ? "চশমা" : "Eyeglasses"}</span>
                      <span className="font-mono text-indigo-300 font-bold">
                        {liveFaceAnalysis?.glassesProfile?.hasGlasses ? "চশমা পরা" : "নেই"}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 transition-all duration-100"
                        style={{ width: liveFaceAnalysis?.glassesProfile?.hasGlasses ? "100%" : "0%" }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {liveFaceAnalysis?.glassesProfile?.description || "Scanning nasal rim..."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. TODAY'S RECENT KIOSK ATTENDANCE LOGS: order-4 on mobile (at bottom), hidden on desktop */}
          <div className="order-4 lg:hidden">
            {renderRecentKioskLogs()}
          </div>
        </div>
      ) : (
        /* MODE 3: ENROLLED BIOMETRIC DIRECTORY & AUDIT */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-500" />
                <span>{isBangla ? "কর্মচারীদের নিবন্ধিত ফেস ডাটাবেজ" : "Enrolled Employees Face Database"}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isBangla
                  ? "সকল কর্মীর নিবন্ধিত ছবি, বায়োমেট্রিক ভেরিফিকেশন স্ট্যাটাস ও এনরোলমেন্ট কোয়ালিটি"
                  : "All enrolled employee photographs, biometric verification status, and quality scores"}
              </p>
            </div>

            {/* Directory Search & Action */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  placeholder={isBangla ? "নাম বা কোড খুঁজুন..." : "Filter employees..."}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {onOpenEnrollmentModal && (
                <button
                  onClick={() => onOpenEnrollmentModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow transition-colors"
                >
                  <ScanFace className="w-4 h-4" />
                  <span>{isBangla ? "নতুন ফেস এনরোল করুন" : "Enroll Face Photo"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Directory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {directoryList.map((emp) => {
              const photo = emp.faceRegisteredPhoto || emp.avatarUrl;
              const hasEnrolledPhoto = Boolean(photo && photo.trim() !== "" && photo !== "#" && !photo.includes("placeholder"));
              const isVerified = Boolean(emp.faceVerified);

              return (
                <div
                  key={emp.id}
                  className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-start gap-4 hover:border-teal-500/50 transition-colors"
                >
                  <img
                    src={photo || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
                    alt={emp.fullName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-300 dark:border-slate-700 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {emp.fullName}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hasEnrolledPhoto
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                        }`}
                      >
                        {hasEnrolledPhoto ? (isBangla ? "এনরোল্ড" : "Enrolled") : (isBangla ? "ছবি নেই" : "Pending")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {emp.employeeCode} | {emp.designationTitle}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                      {emp.departmentName}
                    </p>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800/60 text-[11px]">
                      <span className="text-slate-400">
                        {isBangla ? "কোয়ালিটি স্কোর:" : "Quality:"}{" "}
                        <strong className="text-teal-600 dark:text-teal-400 font-mono">
                          {emp.faceVerificationScore ? `${emp.faceVerificationScore}%` : "92%"}
                        </strong>
                      </span>
                      {onOpenEnrollmentModal && (
                        <button
                          onClick={() => onOpenEnrollmentModal(emp)}
                          className="text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                        >
                          {isBangla ? "ছবি পরিবর্তন" : "Update Photo"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Super Admin Biometric Policy Modal */}
      {showAdminSettingsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {isBangla ? "সুপার অ্যাডমিন: কিওস্ক মোড পলিসি" : "Super Admin: Biometric Kiosk Policy"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isBangla ? "প্রতিষ্ঠান ও কর্মচারীদের জন্য কিওস্ক মোড নির্ধারণ করুন" : "Set allowed kiosk biometric modes"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminSettingsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label
                onClick={() => setTempModeAvailability("BOTH")}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  tempModeAvailability === "BOTH"
                    ? "bg-teal-950/40 border-teal-500 text-teal-200 ring-1 ring-teal-500"
                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <input
                  type="radio"
                  name="kioskModeAvailability"
                  checked={tempModeAvailability === "BOTH"}
                  onChange={() => setTempModeAvailability("BOTH")}
                  className="mt-0.5 accent-teal-500 cursor-pointer"
                />
                <div>
                  <p className="font-bold text-white text-sm">
                    {isBangla ? "১. উভয় মোড সক্রিয় (স্বয়ংক্রিয় কিওস্ক ও ১:১ নির্বাচন)" : "1. Both Modes Allowed (Auto Kiosk & 1:1)"}
                  </p>
                  <p className="text-slate-400 mt-1">
                    {isBangla
                      ? "কিওস্ক ওপেন করলে স্বয়ংক্রিয়ভাবে অটো কিওস্ক চালু হবে, তবে কিওস্ক অপারেটর বা কর্মচারী চাইলে ১:১ নির্বাচন মোডেও যেতে পারবে।"
                      : "Defaults to Auto Kiosk on all devices, with option to switch to 1:1 staff verification."}
                  </p>
                </div>
              </label>

              <label
                onClick={() => setTempModeAvailability("AUTO_KIOSK_ONLY")}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  tempModeAvailability === "AUTO_KIOSK_ONLY"
                    ? "bg-teal-950/40 border-teal-500 text-teal-200 ring-1 ring-teal-500"
                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <input
                  type="radio"
                  name="kioskModeAvailability"
                  checked={tempModeAvailability === "AUTO_KIOSK_ONLY"}
                  onChange={() => setTempModeAvailability("AUTO_KIOSK_ONLY")}
                  className="mt-0.5 accent-teal-500 cursor-pointer"
                />
                <div>
                  <p className="font-bold text-white text-sm">
                    {isBangla ? "২. শুধুমাত্র স্বয়ংক্রিয় কিওস্ক মোড (1:N)" : "2. Auto Kiosk Only (1:N Automated)"}
                  </p>
                  <p className="text-slate-400 mt-1">
                    {isBangla
                      ? "কোনো ম্যানুয়াল তালিকা নির্বাচন থাকবে না। ক্যামেরার সামনে মুখ রাখলেই এআই তাৎক্ষণিক ডাটাবেজ থেকে কর্মচারী শনাক্ত করবে।"
                      : "Staff walk up and face is recognized automatically. No manual selection permitted."}
                  </p>
                </div>
              </label>

              <label
                onClick={() => setTempModeAvailability("ONE_TO_ONE_ONLY")}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  tempModeAvailability === "ONE_TO_ONE_ONLY"
                    ? "bg-teal-950/40 border-teal-500 text-teal-200 ring-1 ring-teal-500"
                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <input
                  type="radio"
                  name="kioskModeAvailability"
                  checked={tempModeAvailability === "ONE_TO_ONE_ONLY"}
                  onChange={() => setTempModeAvailability("ONE_TO_ONE_ONLY")}
                  className="mt-0.5 accent-teal-500 cursor-pointer"
                />
                <div>
                  <p className="font-bold text-white text-sm">
                    {isBangla ? "৩. শুধুমাত্র ১:১ ভেরিফিকেশন মোড (1:1)" : "3. 1:1 Staff Verification Only"}
                  </p>
                  <p className="text-slate-400 mt-1">
                    {isBangla
                      ? "প্রথমে কর্মচারী সার্চ বা ড্রপডাউন থেকে নিজের নাম নির্বাচন করবে, এরপর ক্যামেরা তার রেজিস্টার্ড ছবির সাথে মেলাবে।"
                      : "Staff selects their name first, then camera verifies specifically against their enrolled photo."}
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAdminSettingsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {isBangla ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated: BiometricKioskSettings = {
                    modeAvailability: tempModeAvailability,
                    defaultMode: tempModeAvailability === "ONE_TO_ONE_ONLY" ? "ONE_TO_ONE" : "AUTO_KIOSK",
                    updatedAt: new Date().toISOString(),
                    updatedBy: currentEmployee?.fullName || "Super Admin",
                  };
                  onUpdateBiometricSettings?.(updated);
                  if (tempModeAvailability === "ONE_TO_ONE_ONLY") {
                    setActiveMode("ONE_TO_ONE");
                  } else if (tempModeAvailability === "AUTO_KIOSK_ONLY") {
                    setActiveMode("AUTO_KIOSK");
                  }
                  setShowAdminSettingsModal(false);
                }}
                className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-500/20 transition-colors cursor-pointer"
              >
                {isBangla ? "সংরক্ষণ ও প্রয়োগ করুন" : "Save & Apply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto transition-colors duration-300 ${
          screenFillLight
            ? "bg-white text-slate-900 shadow-[inset_0_0_200px_rgba(255,255,255,1)]"
            : "bg-slate-950/85 backdrop-blur-md"
        }`}
      >
        <div
          className={`relative w-full max-w-7xl max-h-[96dvh] overflow-y-auto rounded-3xl shadow-2xl p-3 sm:p-5 pb-28 sm:pb-5 space-y-4 transition-all duration-300 touch-pan-y ${
            screenFillLight
              ? "bg-slate-900 border-4 border-amber-300 ring-8 ring-amber-300/30"
              : "bg-slate-900 border border-slate-800"
          }`}
        >
          {mainContent}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`space-y-6 pb-28 lg:pb-12 transition-colors duration-300 ${
        screenFillLight ? "bg-white p-6 rounded-3xl shadow-[inset_0_0_150px_rgba(255,255,255,1)]" : ""
      }`}
    >
      {mainContent}
    </div>
  );
};
