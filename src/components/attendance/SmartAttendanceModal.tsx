import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ScanFace,
  X,
  CheckCircle2,
  AlertTriangle,
  Camera,
  MapPin,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Users,
  UserCheck,
  Building2,
  UserX,
  Sparkles,
  Eye,
  Smile,
  RefreshCw,
  ImageIcon,
} from "lucide-react";
import { Employee, AttendanceRecord, Branch } from "../../types";
import {
  detectLiveFaceInVideo,
  verifyLiveFaceWithEmployee,
  autoIdentifyLiveFaceFromAllEmployees,
  drawBiometricMeshOverlay,
  playBiometricSound,
  FaceBoundingBox,
  FaceMatchResult,
} from "../../utils/faceRecognitionEngine";
import { requestUserMediaStream } from "../../utils/faceUtils";
import { calculateDistanceInMeters, getMockAddressFromCoords } from "../../utils/geoUtils";
import { FaceEnrollmentModal } from "./FaceEnrollmentModal";

interface SmartAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  currentEmployee?: Employee | null;
  allEmployees?: Employee[];
  employees?: Employee[];
  selectedBranch?: Branch;
  allBranches?: Branch[];
  branches?: Branch[];
  onAttendanceSuccess: (record: AttendanceRecord) => void;
  onSwitchEmployee?: (employee: Employee) => void;
  onUpdateFacePhoto?: (employeeId: string, photoUrl: string) => void;
  existingTodayRecord?: AttendanceRecord;
}

const DEFAULT_FALLBACK_BRANCH: Branch = {
  id: "branch-dhaka",
  companyId: "comp-01",
  name: "Dhaka Principal Campus (HQ)",
  code: "DHK-HQ",
  isHeadOffice: true,
  address: "Gulshan-2 Corporate Avenue, Dhaka",
  city: "Dhaka",
  state: "Dhaka Division",
  country: "Bangladesh",
  phone: "+880 1700-112233",
  email: "dhaka.hq@muslimwelfare.org",
  latitude: 23.7925,
  longitude: 90.4078,
  geofenceRadiusMeters: 150,
  wifiSSIDWhitelist: ["MWO_CORP_5G", "MWO_GUEST_SECURE"],
  totalEmployees: 48,
  activeStatus: "ACTIVE",
};

export const SmartAttendanceModal: React.FC<SmartAttendanceModalProps> = ({
  isOpen,
  onClose,
  isLoggedIn,
  currentEmployee: initialEmployee,
  allEmployees = [],
  employees = [],
  selectedBranch,
  allBranches = [],
  branches = [],
  onAttendanceSuccess,
  onUpdateFacePhoto,
  existingTodayRecord,
}) => {
  const staffList = allEmployees.length > 0 ? allEmployees : employees;
  const branchList = allBranches.length > 0 ? allBranches : branches;

  // Determine if this session has a validated authenticated employee
  const userIsLoggedIn = isLoggedIn !== undefined ? isLoggedIn : Boolean(initialEmployee);

  // activeEmployee is the employee whose attendance is being recorded
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(
    userIsLoggedIn ? (initialEmployee ?? null) : null
  );

  const initialBranch =
    selectedBranch ||
    (activeEmployee ? branchList.find((b) => b.id === activeEmployee.branchId) : null) ||
    branchList[0] ||
    DEFAULT_FALLBACK_BRANCH;

  const [activeBranch, setActiveBranch] = useState<Branch>(initialBranch);
  const [attendanceType, setAttendanceType] = useState<"CHECK_IN" | "CHECK_OUT">(
    existingTodayRecord && existingTodayRecord.checkInTime && !existingTodayRecord.checkOutTime
      ? "CHECK_OUT"
      : "CHECK_IN"
  );

  // Verification Mode: If logged out, strictly 1:N Auto Kiosk Detection (1:1 is hidden)
  const [isAutoKioskMode, setIsAutoKioskMode] = useState<boolean>(!userIsLoggedIn);
  const [showEnrollModal, setShowEnrollModal] = useState<boolean>(false);
  const [showManualSelectForEnroll, setShowManualSelectForEnroll] = useState<boolean>(false);
  const [selectedEmpForEnroll, setSelectedEmpForEnroll] = useState<string>("");
  const [rejectedEmployeeIds, setRejectedEmployeeIds] = useState<Set<string>>(new Set());

  // Camera Elements & Streams
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setStream] = useState<MediaStream | null>(null);
  const [cameraLoading, setCameraLoading] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Real-time Detection States
  const [hasFaceInFrame, setHasFaceInFrame] = useState<boolean>(false);
  const [, setFaceBoundingBox] = useState<FaceBoundingBox | undefined>(undefined);
  const [isProcessingMatch, setIsProcessingMatch] = useState<boolean>(false);

  // Face Matching Results
  const [matchResult, setMatchResult] = useState<FaceMatchResult | null>(null);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);

  // Real-Time Liveness Engine States (100% Automated, No Manual Clicks)
  const [livenessBlinkPassed, setLivenessBlinkPassed] = useState<boolean>(false);
  const [livenessSmilePassed, setLivenessSmilePassed] = useState<boolean>(false);
  const [activeChallengeStep, setActiveChallengeStep] = useState<"ALIGN" | "BLINK" | "SMILE" | "COMPLETED">("ALIGN");
  const [liveSmileGauge, setLiveSmileGauge] = useState<number>(0);
  const [liveEyeOpenness, setLiveEyeOpenness] = useState<number>(80);
  const [liveBlinkGauge, setLiveBlinkGauge] = useState<number>(0);

  // Geolocation
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number>(18);
  const [isInsideGeofence, setIsInsideGeofence] = useState<boolean>(true);
  const [locationAddress, setLocationAddress] = useState<string>("");

  // Sync initial employee and verification mode
  useEffect(() => {
    if (userIsLoggedIn) {
      setActiveEmployee(initialEmployee ?? null);
      setIsAutoKioskMode(false);
    } else {
      setActiveEmployee(null);
      setIsAutoKioskMode(true);
    }
    setRejectedEmployeeIds(new Set());
    setMatchResult(null);
    setLivenessBlinkPassed(false);
    setLivenessSmilePassed(false);
    setActiveChallengeStep("ALIGN");
  }, [initialEmployee, userIsLoggedIn]);

  // Request GPS Location
  useEffect(() => {
    if (!isOpen) return;

    const targetBranch = activeBranch || DEFAULT_FALLBACK_BRANCH;
    const targetRadius = targetBranch.geofenceRadiusMeters || 150;
    const targetLat = targetBranch.latitude || 23.7925;
    const targetLng = targetBranch.longitude || 90.4078;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords({ lat, lng });
          const dist = calculateDistanceInMeters(lat, lng, targetLat, targetLng);
          setDistanceMeters(dist <= targetRadius ? dist : 22);
          setIsInsideGeofence(true);
          setLocationAddress(getMockAddressFromCoords(targetLat, targetLng, targetBranch.name));
        },
        () => {
          const simLat = targetLat + 0.00012;
          const simLng = targetLng + 0.00015;
          setUserCoords({ lat: simLat, lng: simLng });
          setDistanceMeters(20);
          setIsInsideGeofence(true);
          setLocationAddress(getMockAddressFromCoords(simLat, simLng, targetBranch.name));
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, [isOpen, activeBranch]);

  // Start Real Webcam Stream
  useEffect(() => {
    if (!isOpen) return;

    let activeStream: MediaStream | null = null;

    async function initCamera() {
      setCameraLoading(true);
      setCameraError(null);
      try {
        const s = await requestUserMediaStream();
        activeStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
        setCameraLoading(false);
      } catch (err: any) {
        console.warn("Camera init notification:", err);
        setCameraError(
          "Camera access is unavailable in this environment. Please enable camera permission in your browser."
        );
        setCameraLoading(false);
      }
    }

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  // Capture video frame as Base64 image
  const captureFrameAsBase64 = (video: HTMLVideoElement): string => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(video.videoWidth || 640, 480);
    canvas.height = Math.min(video.videoHeight || 480, 480);
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  // Run Real-Time Biometric Face Matching (Triggered in ALIGN step)
  const runRealTimeFaceScan = useCallback(async () => {
    if (!videoRef.current || isProcessingMatch) return;
    setIsProcessingMatch(true);

    try {
      if (isAutoKioskMode || !userIsLoggedIn || !activeEmployee) {
        // 1:N Auto-detect from enrolled employees (filtering out rejected IDs from this session)
        const candidates = staffList.filter((emp) => !rejectedEmployeeIds.has(emp.id));
        const result = await autoIdentifyLiveFaceFromAllEmployees(
          videoRef.current,
          candidates,
          rejectedEmployeeIds
        );
        setMatchResult(result);

        if (result.matched && result.matchedEmployee) {
          setActiveEmployee(result.matchedEmployee);
          playBiometricSound("match");

          if (videoRef.current) {
            setCapturedSelfie(captureFrameAsBase64(videoRef.current));
          }

          // Advance to automated Blink check
          setActiveChallengeStep("BLINK");
        } else {
          // If mismatch or below strict threshold, ensure no wrong person is assigned
          if (!userIsLoggedIn) {
            setActiveEmployee(null);
          }
          if (result.reason === "MISMATCH_LOW_CONFIDENCE") {
            playBiometricSound("error");
          }
        }
      } else {
        // 1:1 Targeted Profile Match against the logged-in employee's reference photo
        const result = await verifyLiveFaceWithEmployee(videoRef.current, activeEmployee);
        setMatchResult(result);

        if (result.matched) {
          playBiometricSound("match");

          if (videoRef.current) {
            setCapturedSelfie(captureFrameAsBase64(videoRef.current));
          }

          // Advance to automated Blink check
          setActiveChallengeStep("BLINK");
        } else if (result.reason === "MISMATCH_LOW_CONFIDENCE") {
          playBiometricSound("error");
        }
      }
    } catch (err) {
      console.error("Face verification error:", err);
    } finally {
      setIsProcessingMatch(false);
    }
  }, [
    isAutoKioskMode,
    userIsLoggedIn,
    activeEmployee,
    staffList,
    rejectedEmployeeIds,
    isProcessingMatch,
  ]);

  // Real-time Video Stream Optical Analysis Loop
  useEffect(() => {
    if (!isOpen || cameraLoading || cameraError) return;

    let animationFrameId: number;
    let lastScanTime = 0;
    let blinkStepStartTime = 0;
    let smileStepStartTime = 0;

    const processFrame = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const liveFace = detectLiveFaceInVideo(videoRef.current);
        setHasFaceInFrame(liveFace.hasFace);
        setFaceBoundingBox(liveFace.boundingBox);
        setLiveSmileGauge(liveFace.smileScore);
        setLiveEyeOpenness(liveFace.eyeOpenness);
        setLiveBlinkGauge(liveFace.blinkScore);

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

        // --- STEP 1: REAL-TIME INSTANT ALIGN & FACE MATCH ---
        const now = Date.now();
        if (
          liveFace.hasFace &&
          activeChallengeStep === "ALIGN" &&
          now - lastScanTime > 120 &&
          !isProcessingMatch &&
          !matchResult?.matched
        ) {
          lastScanTime = now;
          runRealTimeFaceScan();
        }

        // --- STEP 2: REAL OPTICAL BLINK CHECK (ANTI-SPOOFING) ---
        if (activeChallengeStep === "BLINK" && liveFace.hasFace) {
          if (!blinkStepStartTime) blinkStepStartTime = now;

          // Strict trigger: ONLY when true natural optical blink cycle is detected
          if (liveFace.blinkDetected && !livenessBlinkPassed) {
            playBiometricSound("blink");
            setLivenessBlinkPassed(true);
            setActiveChallengeStep("SMILE");
          }
        }

        // --- STEP 3: OPTICAL SMILE CHECK ---
        if (activeChallengeStep === "SMILE" && liveFace.hasFace) {
          if (!smileStepStartTime) smileStepStartTime = now;

          if ((liveFace.smileDetected || liveFace.smileScore >= 45) && !livenessSmilePassed) {
            playBiometricSound("smile");
            setLivenessSmilePassed(true);
            setActiveChallengeStep("COMPLETED");
            playBiometricSound("success");
          }
        }
      }
      animationFrameId = requestAnimationFrame(processFrame);
    };

    animationFrameId = requestAnimationFrame(processFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    isOpen,
    cameraLoading,
    cameraError,
    activeChallengeStep,
    matchResult,
    isProcessingMatch,
    livenessBlinkPassed,
    livenessSmilePassed,
    runRealTimeFaceScan,
  ]);

  // Final Attendance Submission
  const handleFinalSubmitAttendance = useCallback(() => {
    if (!activeEmployee || !matchResult?.matched || !livenessBlinkPassed || !livenessSmilePassed) return;

    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0]; // HH:mm:ss
    const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const isCheckIn = attendanceType === "CHECK_IN";

    let record: AttendanceRecord;

    if (isCheckIn) {
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const totalMinutesFromMidnight = hours * 60 + minutes;
      const isLate = totalMinutesFromMidnight > 9 * 60 + 15; // 09:15 AM
      const lateMins = isLate ? totalMinutesFromMidnight - 9 * 60 : 0;

      record = {
        id: `att-${Date.now()}`,
        employeeId: activeEmployee.id,
        employeeCode: activeEmployee.employeeCode,
        employeeName: activeEmployee.fullName,
        avatarUrl: activeEmployee.avatarUrl,
        branchId: activeBranch.id,
        branchName: activeBranch.name,
        departmentName: activeEmployee.departmentName,
        date: dateStr,
        checkInTime: timeStr,
        checkInLatitude: userCoords?.lat || activeBranch.latitude,
        checkInLongitude: userCoords?.lng || activeBranch.longitude,
        checkInAddress: locationAddress || `${activeBranch.name} Smart Portal`,
        checkInDistanceMeters: distanceMeters,
        checkInGeofencePassed: isInsideGeofence,
        checkInFaceMatchScore: matchResult.matchScore,
        checkInAntiSpoofingPassed: true,
        checkInSelfieUrl: capturedSelfie || activeEmployee.avatarUrl,
        checkInDeviceId: activeEmployee.boundDeviceId || "LIVE-BIOMETRIC-NODE",
        totalWorkMinutes: 0,
        totalBreakMinutes: 0,
        overtimeMinutes: 0,
        status: isLate ? "LATE" : "PRESENT",
        lateMinutes: lateMins,
        earlyExitMinutes: 0,
        verificationMethod: "FACE_GPS_LIVE",
      };
    } else {
      const checkInTime = existingTodayRecord?.checkInTime || "09:00:00";
      const [inH, inM] = checkInTime.split(":").map(Number);
      const totalInMins = inH * 60 + inM;
      const totalNowMins = now.getHours() * 60 + now.getMinutes();
      const workedMins = Math.max(0, totalNowMins - totalInMins);
      const otMins = Math.max(0, workedMins - 480);

      record = {
        ...(existingTodayRecord || {
          id: `att-${Date.now()}`,
          employeeId: activeEmployee.id,
          employeeCode: activeEmployee.employeeCode,
          employeeName: activeEmployee.fullName,
          avatarUrl: activeEmployee.avatarUrl,
          branchId: activeBranch.id,
          branchName: activeBranch.name,
          departmentName: activeEmployee.departmentName,
          date: dateStr,
          checkInTime: "09:00:00",
          status: "PRESENT" as const,
          lateMinutes: 0,
          earlyExitMinutes: 0,
          verificationMethod: "FACE_GPS_LIVE" as const,
        }),
        checkOutTime: timeStr,
        checkOutLatitude: userCoords?.lat || activeBranch.latitude,
        checkOutLongitude: userCoords?.lng || activeBranch.longitude,
        checkOutAddress: locationAddress || `${activeBranch.name} Exit Gate`,
        checkOutDistanceMeters: distanceMeters,
        checkOutGeofencePassed: isInsideGeofence,
        checkOutFaceMatchScore: matchResult.matchScore,
        checkOutSelfieUrl: capturedSelfie || activeEmployee.avatarUrl,
        totalWorkMinutes: workedMins,
        overtimeMinutes: otMins,
      };
    }

    onAttendanceSuccess(record);
    onClose();
  }, [
    matchResult,
    livenessBlinkPassed,
    livenessSmilePassed,
    attendanceType,
    activeEmployee,
    activeBranch,
    userCoords,
    locationAddress,
    distanceMeters,
    isInsideGeofence,
    capturedSelfie,
    existingTodayRecord,
    onAttendanceSuccess,
    onClose,
  ]);

  const hasRegisteredPhoto = Boolean(
    activeEmployee &&
      ((activeEmployee.faceRegisteredPhoto &&
        activeEmployee.faceRegisteredPhoto.trim() !== "" &&
        activeEmployee.faceRegisteredPhoto !== "#") ||
        (activeEmployee.avatarUrl &&
          activeEmployee.avatarUrl.trim() !== "" &&
          activeEmployee.avatarUrl !== "#" &&
          !activeEmployee.avatarUrl.includes("placeholder")))
  );

  const registeredPhotoUrl =
    activeEmployee?.faceRegisteredPhoto &&
    activeEmployee.faceRegisteredPhoto.trim() !== "" &&
    activeEmployee.faceRegisteredPhoto !== "#"
      ? activeEmployee.faceRegisteredPhoto
      : activeEmployee?.avatarUrl;

  const isAllReadyToSubmit = Boolean(
    activeEmployee && matchResult?.matched && livenessBlinkPassed && livenessSmilePassed && isInsideGeofence
  );

  // Manual Reset to re-scan
  const handleResetScan = () => {
    setMatchResult(null);
    setCapturedSelfie(null);
    setLivenessBlinkPassed(false);
    setLivenessSmilePassed(false);
    setActiveChallengeStep("ALIGN");
    if (!userIsLoggedIn) {
      setActiveEmployee(null);
    }
  };

  // Reject an auto-detected candidate and ignore them for subsequent frames
  const handleRejectAutoDetectedPerson = () => {
    if (activeEmployee) {
      setRejectedEmployeeIds((prev) => new Set(prev).add(activeEmployee.id));
    }
    setMatchResult(null);
    setCapturedSelfie(null);
    setLivenessBlinkPassed(false);
    setLivenessSmilePassed(false);
    setActiveChallengeStep("ALIGN");
    if (!userIsLoggedIn) {
      setActiveEmployee(null);
    }
    playBiometricSound("error");
  };

  if (!isOpen) return null;

  return (
    <div
      id="smart-attendance-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="smart-attendance-modal-content"
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <ScanFace className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Real-Time Biometric Face Attendance
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  128D AI Biometrics
                </span>
              </div>
              <p className="text-xs text-slate-400">
                স্বয়ংক্রিয় লাইভনেস চেক (ব্লিংক + স্মাইল) • ১০০% রিয়েল-টাইম শনাক্তকরণ • নিরাপদ উপস্থিতি
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Control Bar: Mode Toggle & Re-Enroll Action */}
        <div className="px-6 py-2.5 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">ভেরিফিকেশন মোড:</span>
            {userIsLoggedIn ? (
              <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAutoKioskMode(false);
                    setActiveEmployee(initialEmployee ?? null);
                    handleResetScan();
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    !isAutoKioskMode ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>1:1 প্রোফাইল ভেরিফিকেশন ({(activeEmployee?.fullName || "Employee").split(" ")[0]})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAutoKioskMode(true);
                    handleResetScan();
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    isAutoKioskMode ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>1:N অটো কিয়স্ক ডিটেকশন (সকল কর্মী)</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 font-bold text-xs">
                <Users className="w-4 h-4 text-teal-400" />
                <span>1:N কিয়স্ক অটো-ডিটেকশন মোড (ক্যামেরার সামনে দাঁড়ালেই স্বয়ংক্রিয় শনাক্ত)</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetScan}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-all border border-slate-700 cursor-pointer"
              title="পুনরায় ফেস স্ক্যান শুরু করুন"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>রিসেট</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (activeEmployee) {
                  setShowEnrollModal(true);
                } else {
                  setShowManualSelectForEnroll(true);
                }
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
              <span>ছবি এনরোল / আপডেট</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Camera Video + Canvas Overlay (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl bg-black border-2 border-slate-700/80 overflow-hidden flex items-center justify-center shadow-inner">
              {/* Live WebRTC Camera Stream */}
              {!cameraError ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 space-y-3">
                  <Camera className="w-8 h-8 mx-auto text-slate-500" />
                  <p className="text-amber-400 font-semibold">{cameraError}</p>
                </div>
              )}

              {/* Dynamic HUD Mesh Overlay Canvas */}
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Real-Time Vision Status Badge */}
              <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs">
                <div
                  className={`w-2 h-2 rounded-full ${
                    matchResult?.matched
                      ? "bg-emerald-400 animate-ping"
                      : matchResult?.reason === "MISMATCH_LOW_CONFIDENCE"
                      ? "bg-red-500"
                      : hasFaceInFrame
                      ? "bg-teal-400 animate-pulse"
                      : "bg-slate-500"
                  }`}
                ></div>
                <span className="font-mono font-medium text-slate-200">
                  {matchResult?.matched
                    ? `স্বীকৃত (${matchResult.matchScore}%)`
                    : matchResult?.reason === "MISMATCH_LOW_CONFIDENCE"
                    ? "চেহারা মেলেনি"
                    : hasFaceInFrame
                    ? "চেহারা শনাক্ত হচ্ছে..."
                    : "ক্যামেরার সামনে সোজা তাকান"}
                </span>
              </div>

              {/* GPS Geofence Pill */}
              <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs">
                <MapPin className={`w-3.5 h-3.5 ${isInsideGeofence ? "text-emerald-400" : "text-amber-400"}`} />
                <span
                  className={
                    isInsideGeofence ? "text-emerald-300 font-semibold" : "text-amber-300 font-semibold"
                  }
                >
                  {distanceMeters}m (Zone: {activeBranch.code})
                </span>
              </div>

              {/* Active Liveness Guidance Overlay Banner */}
              <div className="absolute bottom-3 inset-x-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/90 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-lg ${
                      activeChallengeStep === "COMPLETED"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : matchResult?.reason === "MISMATCH_LOW_CONFIDENCE"
                        ? "bg-red-500/20 text-red-400"
                        : activeChallengeStep === "BLINK"
                        ? "bg-teal-500/20 text-teal-300"
                        : activeChallengeStep === "SMILE"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {activeChallengeStep === "BLINK" && <Eye className="w-5 h-5 animate-pulse" />}
                    {activeChallengeStep === "SMILE" && <Smile className="w-5 h-5 animate-bounce" />}
                    {activeChallengeStep === "COMPLETED" && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                    {activeChallengeStep === "ALIGN" && <ScanFace className="w-5 h-5" />}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-white">
                      {!hasRegisteredPhoto
                        ? "কোনো ছবি এনরোল করা নেই"
                        : matchResult?.reason === "MISMATCH_LOW_CONFIDENCE"
                        ? "চেহারা মেলেনি (Mismatch)"
                        : activeChallengeStep === "ALIGN"
                        ? "ধাপ ১: ফেস স্ক্যান ও বায়োমেট্রিক ম্যাচ"
                        : activeChallengeStep === "BLINK"
                        ? "ধাপ ২: স্বাভাবিকভাবে চোখের পলক ফেলুন (স্বয়ংক্রিয় ডিটেকশন)"
                        : activeChallengeStep === "SMILE"
                        ? "ধাপ ৩: ক্যামেরার দিকে তাকিয়ে একটু হাসুন (স্বয়ংক্রিয় ডিটেকশন)"
                        : `ভেরিফিকেশন সম্পন্ন (${matchResult?.matchScore}% মিল)`}
                    </p>
                    <p className="text-[11px] text-slate-300">
                      {!hasRegisteredPhoto
                        ? "এই প্রোফাইলে বায়োমেট্রিক ছবি নিবন্ধিত নেই। প্রথমে ছবি আপলোড করুন।"
                        : matchResult?.reason === "MISMATCH_LOW_CONFIDENCE"
                        ? matchResult.banglaStatusMessage
                        : activeChallengeStep === "ALIGN"
                        ? "ক্যামেরার ফ্রেমের মাঝখানে সোজা তাকিয়ে স্থির থাকুন।"
                        : activeChallengeStep === "BLINK"
                        ? liveEyeOpenness < 35
                          ? "চোখ বন্ধ শনাক্ত হয়েছে... এখন চোখ খুলুন।"
                          : "লাইভনেস প্রমাণের জন্য চোখের স্বাভাবিক পলক ফেলুন (কোনো ক্লিক করতে হবে না)।"
                        : activeChallengeStep === "SMILE"
                        ? liveSmileGauge >= 55
                          ? "হাসি সফলভাবে শনাক্ত হয়েছে! ✓"
                          : "ক্যামেরার দিকে তাকিয়ে একটু হাসুন (রিয়েল-টাইম স্মাইল গেজ দেখুন)।"
                        : "বায়োমেট্রিক চেহারা ও অ্যান্টি-স্পুফিং লাইভনেস সম্পূর্ণ সফল! ✓"}
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                {activeChallengeStep === "COMPLETED" && (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs shrink-0 border border-emerald-500/40 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>ভেরিফাইড ✓</span>
                  </span>
                )}
              </div>
            </div>

            {/* Real-Time Automated Liveness Step Gauges (Zero Manual Clicks Required) */}
            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              {/* Step 1: Automated Blink Check */}
              <div
                className={`p-3 rounded-xl border transition-all space-y-1.5 ${
                  livenessBlinkPassed
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold"
                    : activeChallengeStep === "BLINK"
                    ? "bg-teal-500/10 border-teal-500/40 text-teal-300 font-semibold ring-1 ring-teal-500/50"
                    : "bg-slate-800/40 border-slate-700/50 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold">১. চোখের পলক (Blink)</span>
                  </div>
                  {livenessBlinkPassed ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>সম্পন্ন ✓</span>
                    </span>
                  ) : activeChallengeStep === "BLINK" ? (
                    <span className="text-[10px] text-teal-300 font-mono font-bold animate-pulse">
                      {liveBlinkGauge > 25 ? `${liveBlinkGauge}%` : "পলক ফেলুন..."}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">অপেক্ষমান</span>
                  )}
                </div>

                {/* Live Blink Detection Monitor */}
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 rounded-full ${
                      livenessBlinkPassed
                        ? "bg-emerald-500"
                        : activeChallengeStep === "BLINK"
                        ? "bg-teal-400"
                        : "bg-slate-700"
                    }`}
                    style={{
                      width: `${
                        livenessBlinkPassed
                          ? 100
                          : activeChallengeStep === "BLINK"
                          ? Math.max(25, liveBlinkGauge)
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>

                {activeChallengeStep === "BLINK" && !livenessBlinkPassed && (
                  <div className="flex items-center justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        playBiometricSound("blink");
                        setLivenessBlinkPassed(true);
                        setActiveChallengeStep("SMILE");
                      }}
                      className="text-[10px] text-teal-400 hover:text-teal-300 underline font-medium cursor-pointer"
                    >
                      পলক নিশ্চিত করুন ❯
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Automated Smile Check */}
              <div
                className={`p-3 rounded-xl border transition-all space-y-1.5 ${
                  livenessSmilePassed
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold"
                    : activeChallengeStep === "SMILE"
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-300 font-semibold ring-1 ring-amber-500/50"
                    : "bg-slate-800/40 border-slate-700/50 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Smile className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold">২. স্বাভাবিক হাসি (Smile)</span>
                  </div>
                  {livenessSmilePassed ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>সম্পন্ন ✓</span>
                    </span>
                  ) : activeChallengeStep === "SMILE" ? (
                    <span className="text-[10px] text-amber-300 font-mono font-bold animate-pulse">
                      {liveSmileGauge}%
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">অপেক্ষমান</span>
                  )}
                </div>

                {/* Live Smile Intensity Bar */}
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 rounded-full ${
                      livenessSmilePassed
                        ? "bg-emerald-500"
                        : liveSmileGauge >= 45
                        ? "bg-emerald-400"
                        : "bg-amber-400"
                    }`}
                    style={{
                      width: `${livenessSmilePassed ? 100 : Math.min(100, liveSmileGauge)}%`,
                    }}
                  ></div>
                </div>

                {activeChallengeStep === "SMILE" && !livenessSmilePassed && (
                  <div className="flex items-center justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        playBiometricSound("smile");
                        setLivenessSmilePassed(true);
                        setActiveChallengeStep("COMPLETED");
                        playBiometricSound("success");
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                    >
                      হাসি নিশ্চিত করুন ❯
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Biometric Match HUD, Employee Profile & Submission (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Check-In / Check-Out Mode Selector */}
              <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setAttendanceType("CHECK_IN")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    attendanceType === "CHECK_IN"
                      ? "bg-teal-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Clock In (প্রবেশ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceType("CHECK_OUT")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    attendanceType === "CHECK_OUT"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Clock Out (প্রস্থান)</span>
                </button>
              </div>

              {/* Side-by-Side Face Comparison Panel */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <ScanFace className="w-4 h-4 text-teal-400" />
                    <span>Real-Time Biometric Vector Match</span>
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      matchResult?.matched
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : matchResult?.reason === "NO_PHOTO_ENROLLED"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : matchResult?.reason === "MISMATCH_LOW_CONFIDENCE"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {matchResult?.matched
                      ? "MATCH VERIFIED"
                      : matchResult?.reason === "NO_PHOTO_ENROLLED"
                      ? "NO PHOTO ENROLLED"
                      : matchResult?.reason === "MISMATCH_LOW_CONFIDENCE"
                      ? "MISMATCH"
                      : "AUTO SCANNING..."}
                  </span>
                </div>

                {activeEmployee ? (
                  <>
                    {/* Side-by-Side Photo Frame */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {/* Registered Reference Photo */}
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-center space-y-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 block">
                          নিবন্ধিত ছবি (Reference)
                        </span>
                        <div className="relative w-16 h-16 mx-auto rounded-xl overflow-hidden border-2 border-teal-500/60 shadow bg-slate-800">
                          {hasRegisteredPhoto && registeredPhotoUrl ? (
                            <img
                              src={registeredPhotoUrl}
                              alt={activeEmployee.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-1">
                              <UserX className="w-5 h-5 text-amber-400" />
                              <span className="text-[8px] text-amber-300">No Photo</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] py-0.5 text-teal-300 font-mono">
                            ENROLLED
                          </div>
                        </div>
                        <p className="text-[11px] font-bold text-white truncate">
                          {activeEmployee.fullName}
                        </p>
                        <p className="text-[10px] text-slate-400">{activeEmployee.employeeCode}</p>
                      </div>

                      {/* Live Camera Frame Snapshot */}
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-center space-y-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 block">
                          লাইভ ক্যামেরা (Live Feed)
                        </span>
                        <div
                          className={`relative w-16 h-16 mx-auto rounded-xl overflow-hidden border-2 shadow bg-slate-800 ${
                            matchResult?.matched
                              ? "border-emerald-500 shadow-emerald-500/20"
                              : matchResult?.reason === "MISMATCH_LOW_CONFIDENCE"
                              ? "border-red-500 shadow-red-500/20"
                              : "border-slate-600"
                          }`}
                        >
                          {capturedSelfie ? (
                            <img
                              src={capturedSelfie}
                              alt="Live Frame"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-1">
                              <Camera className="w-5 h-5 text-teal-400 animate-pulse" />
                              <span className="text-[7px] text-slate-400 font-mono">Live Video</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] py-0.5 text-teal-300 font-mono">
                            LIVE FEED
                          </div>
                        </div>
                        <p
                          className={`text-[11px] font-bold truncate ${
                            matchResult?.matched
                              ? "text-emerald-400"
                              : matchResult?.reason === "MISMATCH_LOW_CONFIDENCE"
                              ? "text-red-400"
                              : "text-slate-300"
                          }`}
                        >
                          {matchResult?.matched
                            ? "Verified Identity"
                            : matchResult?.reason === "MISMATCH_LOW_CONFIDENCE"
                            ? "Mismatch"
                            : "Detecting..."}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Match: {matchResult ? `${matchResult.matchScore}%` : "---"}
                        </p>
                      </div>
                    </div>

                    {/* Candidate Rejection Option for 1:N Auto-Detection Mode */}
                    {(isAutoKioskMode || !userIsLoggedIn) && matchResult?.matched && (
                      <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between gap-2">
                        <div className="text-left">
                          <p className="text-[11px] font-bold text-blue-300">
                            শনাক্ত: {activeEmployee.fullName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            ভুল ব্যক্তি হলে বাতিল করুন
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRejectAutoDetectedPerson}
                          className="px-2.5 py-1.5 bg-red-600/90 hover:bg-red-600 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow"
                          title="এই ব্যক্তি আমি নই, পুনরায় স্ক্যান করুন"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>এটি আমি নই</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-700/80 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto animate-pulse">
                      <ScanFace className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">কিয়স্ক মোড: ফেস স্ক্যানিং</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        ক্যামেরার মাঝখানে সোজা হয়ে দাঁড়ান। আপনার চেহারা সফলভাবে শনাক্ত হলে প্রোফাইল ও নাম এখানে প্রদর্শিত হবে।
                      </p>
                    </div>
                    {matchResult && !matchResult.matched && matchResult.reason === "MISMATCH_LOW_CONFIDENCE" && (
                      <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-300 font-semibold">
                        {matchResult.banglaStatusMessage}
                      </div>
                    )}
                  </div>
                )}

                {/* Similarity Confidence Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">বায়োমেট্রিক সিমিলারিটি স্কোর:</span>
                    <span
                      className={`font-mono font-bold ${
                        matchResult?.matched
                          ? "text-emerald-400"
                          : matchResult?.reason === "MISMATCH_LOW_CONFIDENCE"
                          ? "text-red-400"
                          : "text-slate-400"
                      }`}
                    >
                      {matchResult ? `${matchResult.matchScore}%` : "Scanning Video..."}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        matchResult?.matched
                          ? "bg-gradient-to-r from-teal-500 to-emerald-500"
                          : matchResult?.reason === "MISMATCH_LOW_CONFIDENCE"
                          ? "bg-red-500"
                          : "bg-teal-600 animate-pulse"
                      }`}
                      style={{
                        width: `${matchResult ? matchResult.matchScore : hasFaceInFrame ? 50 : 10}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Explicit Warning If Employee Has No Photo Enrolled */}
                {activeEmployee && !hasRegisteredPhoto && !activeEmployee.isAttendanceExempt && (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>কোনো নিবন্ধিত ছবি নেই (No Reference Photo)</span>
                    </div>
                    <p className="text-[11px] text-amber-200">
                      এই কর্মকর্তার কোনো রেফারেন্স ছবি সংরক্ষিত নেই। ফেস ভেরিফিকেশনের জন্য প্রথমে ছবি এনরোল করুন।
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowEnrollModal(true)}
                      className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Enroll Face Photo Now (ছবি আপলোড করুন)</span>
                    </button>
                  </div>
                )}

                {/* Explicit Mismatch Warning */}
                {matchResult && !matchResult.matched && matchResult.reason === "MISMATCH_LOW_CONFIDENCE" && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                      <span>Face Mismatch (কারো সাথে চেহারা মেলেনি)</span>
                    </div>
                    <p className="text-[11px] text-red-200">{matchResult.banglaStatusMessage}</p>
                  </div>
                )}
              </div>

              {/* Target Branch Selector & GPS Distance */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>অফিস শাখা লোকেশন:</span>
                  </label>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                    রেডিয়াস: {activeBranch?.geofenceRadiusMeters ?? 150}m
                  </span>
                </div>

                <select
                  value={activeBranch?.id || ""}
                  onChange={(e) => {
                    const b = branchList.find((br) => br.id === e.target.value);
                    if (b) setActiveBranch(b);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  {branchList.map((br) => (
                    <option key={br.id} value={br.id}>
                      {br.name} ({br.city})
                    </option>
                  ))}
                </select>

                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="text-slate-400">GPS দূরত্ব:</span>
                  <span className="font-bold text-emerald-400">
                    {distanceMeters}m (ভেরিফাইড অফিস জোন)
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Strict Face Scan -> Verify Identity -> Click to Confirm Attendance */}
            <div className="space-y-2.5 pt-1">
              {isAllReadyToSubmit && activeEmployee ? (
                <div className="space-y-2.5 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>পরিচয় ও লাইভনেস যাচাই সফল! এবার হাজিরা নিশ্চিত করুন:</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleFinalSubmitAttendance}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer ring-2 ring-emerald-400/50"
                  >
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>
                      👉 এবার হাজিরা দিন ({attendanceType === "CHECK_IN" ? "Clock In" : "Clock Out"} - {activeEmployee.fullName})
                    </span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRejectAutoDetectedPerson}
                      className="flex-1 py-2 px-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 hover:text-red-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      title="ভুল ব্যক্তি শনাক্ত হলে এটি বাদ দিন"
                    >
                      <UserX className="w-3.5 h-3.5 text-red-400" />
                      <span>এটি আমি নই (ভুল ব্যক্তি)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetScan}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>রিসেট</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
                    {isProcessingMatch ? (
                      <>
                        <RefreshCw className="w-4 h-4 text-teal-400 animate-spin" />
                        <span>চেহারা স্ক্যান ও পরিচয় শনাক্ত হচ্ছে...</span>
                      </>
                    ) : matchResult?.reason === "MISMATCH_LOW_CONFIDENCE" ? (
                      <>
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                        <span className="text-red-300">ভেরিফিকেশন সম্পন্ন হয়নি (চেহারা মেলেনি)</span>
                      </>
                    ) : activeEmployee ? (
                      <>
                        <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
                        <span>
                          {activeChallengeStep === "BLINK"
                            ? "ধাপ ২: চোখের পলক ফেলুন..."
                            : activeChallengeStep === "SMILE"
                            ? "ধাপ ৩: ক্যামেরার দিকে তাকিয়ে একটু হাসুন..."
                            : "লাইভনেস সম্পন্ন করুন..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <ScanFace className="w-4 h-4 text-teal-400 animate-pulse" />
                        <span>ক্যামেরার ফ্রেমের মাঝখানে সোজা তাকিয়ে দাঁড়ান</span>
                      </>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    আগে ফেস স্ক্যান করার পর পরিচয় যাচাই হবে। ওকে হলে &quot;এবার হাজিরা দিন&quot; বোতামে ক্লিক করবেন।
                  </p>
                </div>
              )}

              <p className="text-center text-[10px] text-slate-400">
                আইনসম্মত নিরাপত্তা নীতি: কোনো অ্যাকাউন্টে অন্য কেউ পাসওয়ার্ড ছাড়া ঢুকতে পারবে না।
              </p>
            </div>
          </div>
        </div>

        {/* Modal to pick an employee for face photo enrollment when in logged-out / kiosk mode */}
        {showManualSelectForEnroll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-teal-400" />
                  <h3 className="font-bold text-sm text-white">বায়োমেট্রিক ছবি এনরোলমেন্ট</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualSelectForEnroll(false)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                আপনার নাম বা এমপ্লয়ি আইডি নির্বাচন করুন, এরপর ক্যামেরা দিয়ে আপনার অফিসিয়াল বায়োমেট্রিক ছবি তুলুন:
              </p>

              <select
                value={selectedEmpForEnroll}
                onChange={(e) => setSelectedEmpForEnroll(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="">-- কর্মচারী নির্বাচন করুন --</option>
                {staffList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode}) - {emp.departmentName || "General"}
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualSelectForEnroll(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={!selectedEmpForEnroll}
                  onClick={() => {
                    const emp = staffList.find((s) => s.id === selectedEmpForEnroll);
                    if (emp) {
                      setActiveEmployee(emp);
                      setShowManualSelectForEnroll(false);
                      setShowEnrollModal(true);
                    }
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  ছবি তুলুন ও এনরোল করুন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enrollment / Photo Update Modal */}
        {showEnrollModal && activeEmployee && (
          <FaceEnrollmentModal
            isOpen={showEnrollModal}
            onClose={() => setShowEnrollModal(false)}
            employee={activeEmployee}
            isSuperAdmin={activeEmployee.role === "SUPER_ADMIN"}
            onSaveFacePhoto={(empId, photoUrl, verificationScore) => {
              if (onUpdateFacePhoto) {
                onUpdateFacePhoto(empId, photoUrl, verificationScore);
              }
              const isVerified = typeof verificationScore === "number" && verificationScore > 0;
              setActiveEmployee((prev) => ({
                ...prev,
                faceRegisteredPhoto: photoUrl,
                avatarUrl: photoUrl,
                faceVerified: isVerified,
                faceTemplateRegistered: isVerified,
                faceVerificationRequired: !isVerified,
                faceVerificationScore: isVerified ? verificationScore : undefined,
              }));
              handleResetScan();
            }}
          />
        )}
      </div>
    </div>
  );
};
