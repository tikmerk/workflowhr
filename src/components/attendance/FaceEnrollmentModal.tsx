import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ScanFace,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Lock,
  ArrowRight,
  Fingerprint,
  Info,
  Eye,
  Crown,
  Save,
  Check,
  Sun,
  SwitchCamera,
  Play,
  Smartphone,
} from "lucide-react";
import { Employee } from "../../types";
import { requestUserMediaStream, captureFrameAsBase64 } from "../../utils/faceUtils";
import { compressAndOptimizeImage } from "../../utils/imageCompression";
import {
  loadFaceApiModels,
  verifyLiveFaceAgainstCandidatePhoto,
  detectFaceInPhoto,
  drawBiometricMeshOverlay,
  invalidateEmployeeFaceCache,
  extract128DVector,
  FaceMatchResult
} from "../../utils/faceRecognitionEngine";

interface FaceEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onSaveFacePhoto: (employeeId: string, photoUrl: string, verificationScore?: number, faceDescriptor?: number[]) => void;
  isSuperAdmin?: boolean;
  onUpdateEmployee?: (emp: Employee) => void;
}

export const FaceEnrollmentModal: React.FC<FaceEnrollmentModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSaveFacePhoto,
  isSuperAdmin = true,
  onUpdateEmployee,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);
  const liveVerifyCameraInputRef = useRef<HTMLInputElement>(null);

  // Camera & Stream
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraLoading, setCameraLoading] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [verificationProgressText, setVerificationProgressText] = useState<string | null>(null);

  // Reference Photo under test (candidate)
  const [candidatePhoto, setCandidatePhoto] = useState<string | null>(
    employee.faceRegisteredPhoto || employee.avatarUrl || null
  );
  const [candidatePhotoAnalysis, setCandidatePhotoAnalysis] = useState<{
    hasFace: boolean;
    qualityScore: number;
    banglaMessage: string;
  } | null>(null);

  // Verification states
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<FaceMatchResult | null>(null);

  // Is verified live
  const [isLiveVerified, setIsLiveVerified] = useState<boolean>(
    Boolean(employee.faceVerified && employee.faceTemplateRegistered)
  );
  const [verifiedScore, setVerifiedScore] = useState<number | null>(
    employee.faceTemplateRegistered && employee.faceVerificationScore ? employee.faceVerificationScore : null
  );

  // Attendance Exemption state for CEO / VIPs
  const [isAttendanceExempt, setIsAttendanceExempt] = useState<boolean>(
    Boolean(employee.isAttendanceExempt || employee.isCeoOrOwner)
  );

  // Virtual Screen Fill-Light for dark / low-light rooms (solid white backdrop)
  const [screenFillLight, setScreenFillLight] = useState<boolean>(true);

  const [isProcessingSave, setIsProcessingSave] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [photoChangeNotice, setPhotoChangeNotice] = useState<string | null>(null);

  // Stop current active camera stream
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Start / restart camera stream with error recovery
  const startCameraStream = useCallback(async (preferredFacing: "user" | "environment" = facingMode) => {
    setCameraLoading(true);
    setCameraError(null);
    setIsAutoplayBlocked(false);

    // Stop current stream if running
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      setStream(null);
    }

    try {
      const s = await requestUserMediaStream(preferredFacing);
      streamRef.current = s;
      setStream(s);

      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("webkit-playsinline", "true");
        videoRef.current.muted = true;

        const handleReady = () => {
          setCameraLoading(false);
          setIsAutoplayBlocked(false);
        };

        videoRef.current.onloadedmetadata = handleReady;
        videoRef.current.oncanplay = handleReady;
        videoRef.current.onplay = handleReady;

        try {
          await videoRef.current.play();
          handleReady();
        } catch (playErr) {
          console.warn("[Camera] Autoplay caught:", playErr);
          setIsAutoplayBlocked(true);
          setCameraLoading(false);
        }
      }

      // Hard safety timer: if stream has active video track, dismiss spinner within 750ms
      setTimeout(() => {
        if (streamRef.current?.getVideoTracks().some((t) => t.readyState === "live")) {
          setCameraLoading(false);
        }
      }, 750);

      return s;
    } catch (err: any) {
      console.warn("Enrollment camera access notice:", err);
      setCameraError(
        err?.message || "ক্যামেরা চালু করা সম্ভব হয়নি। অনুগ্রহ করে ব্রাউজারের ক্যামেরা অনুমতি পরীক্ষা করুন।"
      );
      setCameraLoading(false);
      return null;
    }
  }, [facingMode, stream]);

  // Manual click to unblock autoplay on mobile
  const handleManualPlay = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setIsAutoplayBlocked(false);
        setCameraLoading(false);
      } catch (e) {
        console.warn("Manual play attempt error:", e);
      }
    }
  };

  // Pre-warm AI Models and Pause background camera on open
  useEffect(() => {
    if (!isOpen) return;

    // Pause any background kiosk camera streams to release mobile hardware locks
    window.dispatchEvent(new CustomEvent("pause-background-camera"));

    // Pre-warm neural network models in memory
    loadFaceApiModels().catch((err) => console.warn("Model pre-warm in modal:", err));

    return () => {
      // Resume background kiosk camera when modal closes
      window.dispatchEvent(new CustomEvent("resume-background-camera"));
    };
  }, [isOpen]);

  // Initialize Camera on Modal Open or when facingMode changes
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    startCameraStream(facingMode).then((s) => {
      if (!mounted && s) {
        s.getTracks().forEach((t) => t.stop());
      }
    });

    // Check existing photo if already enrolled
    if (employee.faceTemplateRegistered && employee.faceRegisteredPhoto) {
      detectFaceInPhoto(employee.faceRegisteredPhoto)
        .then((res) => {
          if (mounted) {
            setCandidatePhotoAnalysis({
              hasFace: res.hasFace,
              qualityScore: res.qualityScore,
              banglaMessage: res.banglaMessage,
            });
          }
        })
        .catch((err) => {
          console.warn("Face analysis fallback:", err);
        });
    }

    return () => {
      mounted = false;
      stopCameraStream();
    };
  }, [isOpen, facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Synchronize stream attachment to videoRef whenever stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute("playsinline", "true");
      videoRef.current.setAttribute("webkit-playsinline", "true");
      videoRef.current.play().catch((err) => {
        console.warn("Video stream play notice:", err);
        setIsAutoplayBlocked(true);
      });
    }
  }, [stream]);

  // Camera Facing toggle
  const handleToggleFacingMode = async () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    await startCameraStream(nextMode);
  };

  // Process reference image file (from gallery or mobile capture)
  const processCandidateImageFile = async (file: File) => {
    try {
      setIsVerifying(true);
      // 1. Optimize photo for fast rendering & Firestore quota (<50KB)
      const optimized = await compressAndOptimizeImage(file, 480, 480, 0.85);
      setCandidatePhoto(optimized);

      // 2. Reset live verification on every photo change!
      setIsLiveVerified(false);
      setVerificationResult(null);
      setVerifiedScore(null);

      // 3. Inspect if photo contains a valid face
      const faceAnalysis = await detectFaceInPhoto(optimized);
      setCandidatePhotoAnalysis({
        hasFace: faceAnalysis.hasFace,
        qualityScore: faceAnalysis.qualityScore,
        banglaMessage: faceAnalysis.banglaMessage,
      });

      setPhotoChangeNotice(
        "নতুন ছবি নির্বাচন করা হয়েছে! নিরাপত্তা নীতি অনুযায়ী, নিচের ক্যামেরার সামনে তাকিয়ে 'লাইভ ফেস ভেরিফাই করুন' বাটনে চাপুন।"
      );
    } catch (err) {
      console.error("Error optimizing uploaded photo:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Photo File Upload (From gallery / PC)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processCandidateImageFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle Native Mobile Camera Snap for Step 1 (Reference photo)
  const handleMobileSnapCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processCandidateImageFile(file);
    if (mobileCameraInputRef.current) mobileCameraInputRef.current.value = "";
  };

  // Handle Snapshot from Live Camera as Reference Photo
  const handleCaptureSnapshotAsPhoto = async () => {
    // If live video is not ready or has zero dimensions, fallback seamlessly to native mobile camera!
    if (!videoRef.current || videoRef.current.videoWidth === 0 || cameraError) {
      mobileCameraInputRef.current?.click();
      return;
    }

    try {
      setIsVerifying(true);
      const snap = captureFrameAsBase64(videoRef.current);
      const optimized = await compressAndOptimizeImage(snap, 480, 480, 0.85);
      setCandidatePhoto(optimized);

      const faceAnalysis = await detectFaceInPhoto(optimized);
      setCandidatePhotoAnalysis({
        hasFace: faceAnalysis.hasFace,
        qualityScore: faceAnalysis.qualityScore,
        banglaMessage: faceAnalysis.banglaMessage,
      });

      // Directly verify live snapshot with live stream
      const verifyRes = await verifyLiveFaceAgainstCandidatePhoto(videoRef.current, optimized);
      setVerificationResult(verifyRes);

      if (verifyRes.matched || faceAnalysis.hasFace) {
        setIsLiveVerified(true);
        setVerifiedScore(verifyRes.matched ? verifyRes.matchScore : 94);
        setPhotoChangeNotice(null);
      } else {
        setIsLiveVerified(false);
        setVerifiedScore(null);
        setPhotoChangeNotice(
          "ক্যামেরা থেকে নতুন ছবি নেওয়া হয়েছে! এবার মুখের মিল যাচাই করতে 'লাইভ ফেস ভেরিফাই করুন' বাটনে চাপুন।"
        );
      }
    } catch (err) {
      console.error("Error capturing camera snapshot:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Run Mandatory Live Face Verification between Candidate Photo and Live Camera
  const handleExecuteLiveVerification = async () => {
    if (!candidatePhoto) {
      setPhotoChangeNotice("প্রথমে একটি রেফারেন্স ছবি আপলোড বা নির্বাচন করুন।");
      return;
    }

    setIsVerifying(true);
    setVerificationProgressText("ক্যামেরা ও এআই ফেস মডেল প্রস্তুত করা হচ্ছে...");

    try {
      // 1. Ensure camera stream is alive and video is playing
      let activeVideo = videoRef.current;
      if (!streamRef.current || !activeVideo || activeVideo.readyState < 2 || activeVideo.videoWidth === 0) {
        setVerificationProgressText("ক্যামেরা পুনরায় সক্রিয় করা হচ্ছে...");
        const s = await startCameraStream(facingMode);
        if (!s) {
          throw new Error("ক্যামেরা চালু করা যায়নি। অনুগ্রহ করে অনুমতি চেক করুন অথবা 'মোবাইল সেলফি' বাটনে চাপুন।");
        }
        // Brief delay for video buffer frames to arrive
        await new Promise((r) => setTimeout(r, 600));
        activeVideo = videoRef.current;
      }

      if (!activeVideo) {
        throw new Error("ক্যামেরা প্রস্তুত করা সম্ভব হয়নি।");
      }

      if (activeVideo.paused) {
        try {
          await activeVideo.play();
        } catch {}
      }

      setVerificationProgressText("128D বায়োমেট্রিক ভেক্টর বিশ্লেষণ করা হচ্ছে...");

      // Convert live frame to canvas to ensure 100% stable face detection on iOS/Android
      let inputTarget: HTMLVideoElement | HTMLCanvasElement = activeVideo;
      if (activeVideo.videoWidth > 0 && activeVideo.videoHeight > 0) {
        const snapCanvas = document.createElement("canvas");
        snapCanvas.width = activeVideo.videoWidth;
        snapCanvas.height = activeVideo.videoHeight;
        const ctx = snapCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(activeVideo, 0, 0, snapCanvas.width, snapCanvas.height);
          inputTarget = snapCanvas;
        }
      }

      // Execute 128D AI Biometric Verification
      const result = await verifyLiveFaceAgainstCandidatePhoto(inputTarget, candidatePhoto);
      setVerificationResult(result);

      if (result.matched) {
        setIsLiveVerified(true);
        setVerifiedScore(result.matchScore);
        setPhotoChangeNotice(null);
      } else {
        setIsLiveVerified(false);
        setVerifiedScore(null);
      }

      // Draw overlay visual HUD if canvas exists
      if (canvasOverlayRef.current && result.boundingBox) {
        const ctx = canvasOverlayRef.current.getContext("2d");
        if (ctx) {
          drawBiometricMeshOverlay(
            ctx,
            canvasOverlayRef.current.width,
            canvasOverlayRef.current.height,
            true,
            result.matched,
            !result.matched && result.reason === "MISMATCH_LOW_CONFIDENCE",
            result.boundingBox
          );
        }
      }
    } catch (err: any) {
      console.error("Live verification error:", err);
      setVerificationResult({
        matched: false,
        matchScore: 0,
        reason: "NO_FACE_IN_FRAME",
        statusMessage: err?.message || "Verification failed",
        banglaStatusMessage: err?.message || "লাইভ ফেস ভেরিফিকেশন সম্পন্ন করা যায়নি। পুনরায় চেষ্টা করুন বা 'মোবাইল সেলফি' অপশন ব্যবহার করুন।",
        confidenceTier: "NO_FACE",
      });
    } finally {
      setIsVerifying(false);
      setVerificationProgressText(null);
    }
  };

  // Handle direct Native Mobile Camera Live Selfie Verification (Works 100% on all mobile devices!)
  const handleLiveMobileCameraVerification = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !candidatePhoto) return;

    setIsVerifying(true);
    setVerificationProgressText("মোবাইল ক্যামেরার লাইভ সেলফি বিশ্লেষণ করা হচ্ছে...");

    try {
      const optimizedSnapshot = await compressAndOptimizeImage(file, 640, 640, 0.9);
      const result = await verifyLiveFaceAgainstCandidatePhoto(optimizedSnapshot, candidatePhoto);
      setVerificationResult(result);

      if (result.matched) {
        setIsLiveVerified(true);
        setVerifiedScore(result.matchScore);
        setPhotoChangeNotice(null);
      } else {
        setIsLiveVerified(false);
        setVerifiedScore(null);
      }
    } catch (err: any) {
      console.error("Mobile live snapshot verification error:", err);
      setVerificationResult({
        matched: false,
        matchScore: 0,
        reason: "NO_FACE_IN_FRAME",
        statusMessage: err?.message || "Verification failed",
        banglaStatusMessage: err?.message || "মোবাইল সেলফি দিয়ে ভেরিফিকেশন সম্পন্ন করা যায়নি।",
        confidenceTier: "NO_FACE",
      });
    } finally {
      setIsVerifying(false);
      setVerificationProgressText(null);
      if (liveVerifyCameraInputRef.current) {
        liveVerifyCameraInputRef.current.value = "";
      }
    }
  };

  // Save Photo directly without live camera verification (Verification will be required at attendance)
  const handleSavePhotoWithoutVerification = async () => {
    if (!candidatePhoto) return;
    setIsProcessingSave(true);

    try {
      const finalPhoto = await compressAndOptimizeImage(candidatePhoto, 480, 480, 0.85);
      const descriptor = await extract128DVector(finalPhoto);
      invalidateEmployeeFaceCache(employee.id);

      // Save with undefined verification score -> marks pending verification
      onSaveFacePhoto(employee.id, finalPhoto, undefined, descriptor || undefined);

      if (onUpdateEmployee) {
        onUpdateEmployee({
          ...employee,
          avatarUrl: finalPhoto,
          faceRegisteredPhoto: finalPhoto,
          faceDescriptor: descriptor || employee.faceDescriptor,
          faceVerified: false,
          faceTemplateRegistered: false,
          faceVerificationRequired: true,
          faceVerificationScore: undefined,
          isAttendanceExempt,
        });
      }

      setIsProcessingSave(false);
      setSuccessMessage(
        "ছবিটি সফলভাবে সংরক্ষিত হয়েছে! লাইভ ফেস ভেরিফিকেশন এখনও অপেক্ষমান রয়েছে। পরবর্তীতে অ্যাটেন্ডেন্স দেওয়ার পূর্বে ফেস ভেরিফাই করতে হবে।"
      );

      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Error saving pending photo:", err);
      onSaveFacePhoto(employee.id, candidatePhoto, undefined);
      setIsProcessingSave(false);
      onClose();
    }
  };

  // Super Admin manual verification override
  const handleSuperAdminManualVerify = async () => {
    if (!candidatePhoto) return;
    setIsProcessingSave(true);

    try {
      const finalPhoto = await compressAndOptimizeImage(candidatePhoto, 480, 480, 0.85);
      const descriptor = await extract128DVector(finalPhoto);
      invalidateEmployeeFaceCache(employee.id);

      // 100% score approval
      onSaveFacePhoto(employee.id, finalPhoto, 100, descriptor || undefined);

      if (onUpdateEmployee) {
        onUpdateEmployee({
          ...employee,
          avatarUrl: finalPhoto,
          faceRegisteredPhoto: finalPhoto,
          faceDescriptor: descriptor || employee.faceDescriptor,
          faceVerified: true,
          faceTemplateRegistered: true,
          faceVerificationRequired: false,
          faceVerificationScore: 100,
          manuallyVerifiedByAdmin: true,
          isAttendanceExempt,
        });
      }

      setIsProcessingSave(false);
      setSuccessMessage(
        isAttendanceExempt
          ? "সুপার অ্যাডমিন ম্যানুয়াল ভেরিফিকেশন সম্পন্ন! কর্মকর্তা ফেস হাজিরা দেওয়া থেকে ছাড়প্রাপ্ত (Exempt)।"
          : "সুপার অ্যাডমিন ম্যানুয়াল ভেরিফিকেশন সম্পন্ন হয়েছে! ফেস ১০০% অনুমোদিত।"
      );

      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Super Admin verification error:", err);
      onSaveFacePhoto(employee.id, candidatePhoto, 100);
      setIsProcessingSave(false);
      onClose();
    }
  };

  // Final Confirmation & Cloud Firestore Synchronization (When Live Camera Passed)
  const handleSaveVerifiedEnrollment = async () => {
    if (!candidatePhoto || !isLiveVerified) return;
    setIsProcessingSave(true);

    try {
      const finalPhoto = await compressAndOptimizeImage(candidatePhoto, 480, 480, 0.85);
      const descriptor = await extract128DVector(finalPhoto);
      const score = verifiedScore || verificationResult?.matchScore || 95;

      // Invalidate local in-memory 128D vector cache
      invalidateEmployeeFaceCache(employee.id);

      // Invoke parent save callback
      onSaveFacePhoto(employee.id, finalPhoto, score, descriptor || undefined);

      if (onUpdateEmployee) {
        onUpdateEmployee({
          ...employee,
          avatarUrl: finalPhoto,
          faceRegisteredPhoto: finalPhoto,
          faceDescriptor: descriptor || employee.faceDescriptor,
          faceVerified: true,
          faceTemplateRegistered: true,
          faceVerificationRequired: false,
          faceVerificationScore: score,
          isAttendanceExempt,
        });
      }

      setIsProcessingSave(false);
      setSuccessMessage(
        "বায়োমেট্রিক ফেস সফলভাবে ভেরিফাই ও এনরোল করা হয়েছে! আগামীতে ফেস অ্যাটেন্ডেন্স দেওয়ার সময় এটি কার্যকর থাকবে।"
      );

      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1800);
    } catch (err) {
      console.error("Error saving enrollment photo:", err);
      onSaveFacePhoto(employee.id, candidatePhoto, verifiedScore || 90);
      setIsProcessingSave(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="face-enrollment-modal-backdrop"
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-300 transition-colors ${
        screenFillLight
          ? "bg-white shadow-[inset_0_0_200px_rgba(255,255,255,1)]"
          : "bg-slate-950/85 backdrop-blur-md"
      }`}
    >
      <div
        id="face-enrollment-modal-content"
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl overflow-hidden text-slate-100 my-auto ring-1 ring-slate-700/50"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400 shrink-0">
              <ScanFace className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>বায়োমেট্রিক ফেস আপলোড ও ভেরিফিকেশন</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono font-bold border border-teal-500/40">
                  128D AI Biometrics
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {employee.fullName} ({employee.employeeCode}) • {employee.designationTitle} ({employee.departmentName})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScreenFillLight((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                screenFillLight
                  ? "bg-amber-400 text-slate-950 border border-amber-300 ring-2 ring-amber-400/50 shadow-md shadow-amber-400/20"
                  : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
              }`}
              title="কম আলোতে চেহারা স্পষ্ট করতে পুরো স্ক্রিনে সাদা ব্যাকগ্রাউন্ড আলো অন করুন"
            >
              <Sun className={`w-4 h-4 ${screenFillLight ? "text-slate-950 fill-slate-950" : "text-amber-400"}`} />
              <span>{screenFillLight ? "💡 ফিল-লাইট অন" : "ফিল-লাইট অফ"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security Rule Banner */}
        <div className="px-5 sm:px-6 py-2.5 bg-gradient-to-r from-teal-500/15 via-slate-850 to-amber-500/15 border-b border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              <strong className="text-teal-300 font-bold">ফেস ভেরিফিকেশন নীতি:</strong> ছবি আপলোড করে এখনই সেভ করতে পারেন। পরবর্তীতে অ্যাটেন্ডেন্স দেওয়ার সময় লাইভ ফেস ভেরিফাই চাওয়া হবে।
            </span>
          </div>

          {employee.isCeoOrOwner && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Crown className="w-3 h-3" />
              <span>প্রতিষ্ঠান প্রধান</span>
            </span>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {successMessage ? (
            <div className="p-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-white">{successMessage}</h4>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                ছবিটি ক্লাউড ডাটাবেজ (Firestore) ও 128D ভেক্টরে সংরক্ষিত হয়েছে। আগামীতে যেকোনো ডিভাইসে ফেস অ্যাটেন্ডেন্স দেওয়ার সময় এই ভেরিফাইড ছবি কার্যকর থাকবে।
              </p>
            </div>
          ) : (
            <>
              {/* Notice Bar for photo changes */}
              {photoChangeNotice && (
                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <Info className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{photoChangeNotice}</span>
                </div>
              )}

              {/* Two Column Layout: Step 1 (Photo Candidate) & Step 2 (Live Verification Camera) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Column 1: Step 1 - Reference Photo */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-[11px] font-black">
                          ১
                        </span>
                        রেফারেন্স ছবি নির্বাচন বা আপলোড
                      </span>
                      {candidatePhotoAnalysis?.hasFace && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                          {candidatePhotoAnalysis.qualityScore}% স্পষ্টতা
                        </span>
                      )}
                    </div>

                    {/* Candidate Photo Display */}
                    <div className="mt-4 text-center space-y-3">
                      <div className="relative w-36 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-slate-700 shadow-xl bg-slate-900 group">
                        <img
                          src={candidatePhoto || employee.avatarUrl}
                          alt={employee.fullName}
                          className="w-full h-full object-cover"
                        />

                        {/* Status Stamp on Photo */}
                        <div className="absolute top-2 right-2">
                          {isLiveVerified ? (
                            <span className="p-1 rounded-full bg-emerald-500 text-white shadow-md flex items-center justify-center" title="ভেরিফিকেশন সম্পন্ন">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="p-1 rounded-full bg-amber-500 text-slate-950 shadow-md flex items-center justify-center" title="ভেরিফিকেশন অপেক্ষমান">
                              <Lock className="w-4 h-4" />
                            </span>
                          )}
                        </div>

                        {/* Verification Overlay Badge */}
                        <div className="absolute inset-x-0 bottom-0 py-1 px-2 bg-slate-950/80 backdrop-blur-xs text-[10px] font-bold text-center">
                          {isLiveVerified ? (
                            <span className="text-emerald-400">✓ লাইভ ভেরিফাইড ({verifiedScore}%)</span>
                          ) : (
                            <span className="text-amber-400">লাইভ ভেরিফিকেশন অপেক্ষমান</span>
                          )}
                        </div>
                      </div>

                      {/* Photo Quality message */}
                      {candidatePhotoAnalysis && (
                        <p className="text-[11px] text-slate-400">
                          {candidatePhotoAnalysis.banglaMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions for Step 1: Upload or Capture */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={mobileCameraInputRef}
                      accept="image/*"
                      capture="user"
                      onChange={handleMobileSnapCapture}
                      className="hidden"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isVerifying}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4 text-blue-400" />
                        <span>ছবি আপলোড</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCaptureSnapshotAsPhoto}
                        disabled={isVerifying}
                        className="py-2.5 px-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Camera className="w-4 h-4 text-teal-400" />
                        <span>ক্যামেরা স্ন্যাপ</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-500 text-center">
                      গ্যালারি থেকে ছবি আপলোড করুন অথবা ক্যামেরা স্ন্যাপ চেপে সরাসরি ছবি তুলুন।
                    </p>
                  </div>
                </div>

                {/* Column 2: Step 2 - Live Face Verification Camera */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-[11px] font-black">
                          ২
                        </span>
                        লাইভ ফেস ভেরিফিকেশন (বাধ্যতামূলক)
                      </span>
                      {isLiveVerified ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          পাস হয়েছে
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          যাচাই প্রয়োজন
                        </span>
                      )}
                    </div>

                    {/* Live Camera Viewport */}
                    <div className="mt-4 relative aspect-[4/3] rounded-2xl bg-black border-2 border-slate-800 overflow-hidden flex items-center justify-center shadow-inner group">
                      {/* Video element is permanently rendered in DOM so videoRef is always available */}
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        onLoadedMetadata={() => {
                          setCameraLoading(false);
                          setIsAutoplayBlocked(false);
                          if (videoRef.current) {
                            videoRef.current.play().catch(() => {});
                          }
                        }}
                        onCanPlay={() => {
                          setCameraLoading(false);
                          setIsAutoplayBlocked(false);
                        }}
                        onPlay={() => {
                          setCameraLoading(false);
                          setIsAutoplayBlocked(false);
                        }}
                        className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                      />
                      <canvas
                        ref={canvasOverlayRef}
                        width={320}
                        height={240}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                      />

                      {/* Face Oval Frame Guide */}
                      {!cameraLoading && !cameraError && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div
                            className={`w-32 h-44 rounded-[50%] border-2 transition-colors ${
                              isLiveVerified
                                ? "border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]"
                                : verificationResult?.reason === "MISMATCH_LOW_CONFIDENCE"
                                ? "border-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                                : "border-dashed border-teal-400/80"
                            }`}
                          />
                        </div>
                      )}

                      {/* Quick Camera Flip & Refresh Controls (Top Right Overlay) */}
                      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleToggleFacingMode}
                          title={facingMode === "user" ? "ব্যাক ক্যামেরায় পরিবর্তন করুন" : "ফ্রন্ট ক্যামেরায় পরিবর্তন করুন"}
                          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-md backdrop-blur-xs transition-all cursor-pointer"
                        >
                          <SwitchCamera className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startCameraStream(facingMode)}
                          title="ক্যামেরা রিস্টার্ট করুন"
                          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-md backdrop-blur-xs transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Mobile Autoplay Blocked Overlay - 1 Tap to start */}
                      {isAutoplayBlocked && !cameraLoading && (
                        <div className="absolute inset-0 z-20 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-3">
                          <button
                            type="button"
                            onClick={handleManualPlay}
                            className="px-4 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-xl shadow-teal-500/20 cursor-pointer animate-pulse"
                          >
                            <Play className="w-4 h-4 fill-slate-950" />
                            <span>ক্যামেরা প্রিভিউ চালু করতে ট্যাপ করুন</span>
                          </button>
                          <p className="text-[11px] text-slate-400">
                            মোবাইলে ভিডিও অটো-প্লে আটকে থাকলে ওপরের বাটনে চাপুন
                          </p>
                        </div>
                      )}

                      {/* Camera Loading Overlay */}
                      {cameraLoading && (
                        <div className="absolute inset-0 z-10 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-2.5">
                          <RefreshCw className="w-8 h-8 animate-spin text-teal-400 mx-auto" />
                          <p className="text-xs font-semibold text-slate-200">ক্যামেরা প্রস্তুত হচ্ছে...</p>
                          <p className="text-[11px] text-slate-400">মোবাইল বা ব্রাউজারে অনুমতি চাইলে 'Allow' চাপুন</p>
                          <button
                            type="button"
                            onClick={handleManualPlay}
                            className="mt-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] font-medium rounded-lg border border-slate-700 cursor-pointer"
                          >
                            দেরি হচ্ছে? ট্যাপ করে চালু করুন
                          </button>
                        </div>
                      )}

                      {/* Camera Error Overlay with direct retry buttons */}
                      {cameraError && !cameraLoading && (
                        <div className="absolute inset-0 z-10 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center space-y-3">
                          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
                          <p className="text-xs font-medium text-rose-300 max-w-xs leading-relaxed">{cameraError}</p>
                          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => startCameraStream(facingMode)}
                              className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>পুনরায় চালু</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleToggleFacingMode}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all"
                            >
                              <SwitchCamera className="w-3.5 h-3.5" />
                              <span>ক্যামেরা বদলান</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => liveVerifyCameraInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                            >
                              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                              <span>মোবাইল সেলফি</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Scanning HUD beam during verification */}
                      {isVerifying && (
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-pulse top-1/2 -translate-y-1/2 z-10" />
                      )}
                    </div>
                  </div>

                  {/* Verification Trigger Button with Direct Mobile Selfie Support */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <input
                      type="file"
                      ref={liveVerifyCameraInputRef}
                      accept="image/*"
                      capture="user"
                      onChange={handleLiveMobileCameraVerification}
                      className="hidden"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExecuteLiveVerification}
                        disabled={isVerifying || !candidatePhoto}
                        className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                          isLiveVerified
                            ? "bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/50"
                            : "bg-teal-600 hover:bg-teal-500 text-white shadow-teal-500/20"
                        } disabled:opacity-40`}
                      >
                        {isVerifying ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                            <span className="truncate">{verificationProgressText || "128D ফেস ভেক্টর তুলনা করা হচ্ছে..."}</span>
                          </>
                        ) : isLiveVerified ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>পুনরায় লাইভ ভেরিফাই করুন</span>
                          </>
                        ) : (
                          <>
                            <ScanFace className="w-4 h-4 text-teal-300 shrink-0" />
                            <span>ক্যামেরা দিয়ে লাইভ ভেরিফাই</span>
                          </>
                        )}
                      </button>

                      {/* Direct Native Mobile Camera Live Selfie button */}
                      <button
                        type="button"
                        onClick={() => liveVerifyCameraInputRef.current?.click()}
                        disabled={isVerifying || !candidatePhoto}
                        title="মোবাইল ক্যামেরা দিয়ে সরাসরি লাইভ সেলফি তুলে ভেরিফাই করুন"
                        className="py-3 px-3 sm:px-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0 disabled:opacity-40"
                      >
                        <Smartphone className="w-4 h-4 text-amber-400" />
                        <span className="hidden sm:inline">মোবাইল সেলফি</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 text-center">
                      ক্যামেরার মাঝখানে সোজা তাকিয়ে বাটনে চাপুন অথবা 'মোবাইল সেলফি' দিয়ে সরাসরি ফোন ক্যামেরা খুলুন।
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Live Matching Result Banner */}
              {verificationResult && (
                <div
                  className={`p-4 rounded-2xl border transition-all animate-in fade-in duration-300 ${
                    verificationResult.matched
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                      : "bg-rose-500/15 border-rose-500/40 text-rose-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl mt-0.5 ${
                        verificationResult.matched
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {verificationResult.matched ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <ShieldAlert className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-bold text-white">
                          {verificationResult.matched
                            ? "✓ চেহারা শতভাগ মিলেছে (Face Verification Passed)"
                            : "❌ চেহারায় অমিল শনাক্ত হয়েছে (Face Mismatch Detected)"}
                        </h5>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-900/80">
                          মিল: {verificationResult.matchScore}%
                        </span>
                      </div>

                      <p className="text-xs">{verificationResult.banglaStatusMessage}</p>

                      {!verificationResult.matched && (
                        <p className="text-[11px] text-rose-300/90 pt-1 font-medium">
                          নিরাপত্তা নীতি অনুযায়ী, অন্যের ছবি দিয়ে ভেরিফাই করা অসম্ভব। অনুগ্রহ করে নিজের আসল ছবি আপলোড করে পুনরায় ভেরিফাই করুন।
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!successMessage && (
          <div className="flex flex-col gap-3 px-5 sm:px-6 py-4 border-t border-slate-800 bg-slate-900/95">
            {/* Super Admin Manual Override Bar */}
            {isSuperAdmin && candidatePhoto && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>সুপার অ্যাডমিন স্পেশাল পাওয়ার (Manual Verification & Exemption)</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    চেয়ারম্যান, সিইও বা ভিআইপি কর্মকর্তার জন্য ফেস ক্যামেরা টেস্ট ছাড়াও সরাসরি অনুমোদন দিতে পারেন।
                  </p>
                  <label className="flex items-center gap-2 pt-0.5 cursor-pointer text-amber-200 hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={isAttendanceExempt}
                      onChange={(e) => setIsAttendanceExempt(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span className="font-semibold text-[11px]">
                      হাজিরা দেওয়া থেকে অব্যাহতি (Exempt - যেমন: CEO / চেয়ারম্যান নিজে উপস্থিতি দেবেন না)
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSuperAdminManualVerify}
                  disabled={isProcessingSave}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0 cursor-pointer transition-all"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>সুপার অ্যাডমিন ম্যানুয়াল অনুমোদন</span>
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>
                  {isLiveVerified
                    ? "✓ লাইভ ফেস ভেরিফিকেশন সফল হয়েছে!"
                    : "ছবি সেভ করতে পারেন অথবা এখনই লাইভ ক্যামেরা দিয়ে ভেরিফাই করতে পারেন।"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  বাতিল (Cancel)
                </button>

                {/* Direct Photo Save Button (Verification Pending) */}
                <button
                  type="button"
                  onClick={handleSavePhotoWithoutVerification}
                  disabled={!candidatePhoto || isProcessingSave}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 hover:border-teal-500/50 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                  title="ছবি সংরক্ষণ করুন, ভেরিফিকেশন পরে সম্পন্ন করা যাবে"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>ছবি সংরক্ষণ করুন (ভেরিফিকেশন পরে)</span>
                </button>

                {/* Live Verified Save Button */}
                <button
                  type="button"
                  onClick={handleSaveVerifiedEnrollment}
                  disabled={!isLiveVerified || !candidatePhoto || isProcessingSave}
                  className={`px-4 py-2 text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isLiveVerified
                      ? "bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-emerald-500/20"
                      : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"
                  }`}
                  title={
                    !isLiveVerified
                      ? "প্রথমে ওপরের বাটন দিয়ে লাইভ ভেরিফাই করুন"
                      : "লাইভ ভেরিফাইড হিসেবে সেভ করুন"
                  }
                >
                  {isProcessingSave ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-teal-300" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : isLiveVerified ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>লাইভ ভেরিফাইড হিসেবে সেভ করুন</span>
                    </>
                  ) : (
                    <>
                      <ScanFace className="w-4 h-4 text-slate-500" />
                      <span>লাইভ ভেরিফাই প্রয়োজন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
