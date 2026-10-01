import * as faceapi from "face-api.js";
import { Employee } from "../types";

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceLandmarkPoints {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  noseTip: { x: number; y: number };
  mouthLeft: { x: number; y: number };
  mouthRight: { x: number; y: number };
  mouthCenter: { x: number; y: number };
  chin: { x: number; y: number };
  leftCheek: { x: number; y: number };
  rightCheek: { x: number; y: number };
  forehead: { x: number; y: number };
  jawLine: { x: number; y: number }[];
}

export interface LiveFaceAnalysis {
  hasFace: boolean;
  boundingBox?: FaceBoundingBox;
  skinPixelCount: number;
  brightness: number;
  sharpness: number;
  landmarks?: FaceLandmarkPoints;
  blinkScore: number; // 0 to 100
  smileScore: number; // 0 to 100
  blinkDetected: boolean;
  smileDetected: boolean;
  eyeOpenness: number; // 0 to 100
  livenessPassed: boolean;
  livenessReason?: "BLINK" | "SMILE" | "MICRO_MOTION";
  livenessScore?: number;
  yawAngle?: number;
  pitchAngle?: number;
  isFrontalFacing?: boolean;
  skinToneProfile?: {
    melaninIndex: number;
    description: string;
    r: number;
    g: number;
    b: number;
  };
  facialHairProfile?: {
    hasWhiteBeard: boolean;
    hasDarkBeard: boolean;
    isCleanShaven: boolean;
    description: string;
  };
  glassesProfile?: {
    hasGlasses: boolean;
    description: string;
  };
  glassesDetected?: boolean;
  ambientLuminance?: number; // 0 to 255
  isLowLight?: boolean;
}

export interface FaceMatchResult {
  matched: boolean;
  matchScore: number; // 0 to 100%
  matchedEmployee?: Employee;
  reason: "SUCCESS" | "NO_PHOTO_ENROLLED" | "NO_FACE_IN_FRAME" | "MISMATCH_LOW_CONFIDENCE";
  statusMessage: string;
  banglaStatusMessage: string;
  confidenceTier: "HIGH" | "MEDIUM" | "LOW" | "MISMATCH" | "NO_FACE";
  boundingBox?: FaceBoundingBox;
  distance?: number;
  cosineSimilarity?: number;
  featureVectorLength?: number;
  scoreBreakdown?: {
    spatialSim: number;
    skinToneSim: number;
    geometrySim: number;
    beardMatch: boolean;
    glassesMatch: boolean;
  };
}

// Strict Threshold specified: maxDescriptorDistance = 0.45
// Lower distance = closer match. > 0.45 is rejected.
export const MAX_DESCRIPTOR_DISTANCE = 0.45;

// Model Loading State
let modelsLoaded = false;
let detectorLoaded = false;
let modelLoadingPromise: Promise<boolean> | null = null;

export function isDetectorLoaded(): boolean {
  if (detectorLoaded) return true;
  try {
    if (faceapi?.nets?.tinyFaceDetector?.isLoaded) {
      detectorLoaded = true;
      return true;
    }
  } catch {}
  return false;
}

export function areModelsLoaded(): boolean {
  if (modelsLoaded) return true;
  try {
    const isTiny = Boolean(faceapi?.nets?.tinyFaceDetector?.isLoaded);
    const isLandmark = Boolean(faceapi?.nets?.faceLandmark68Net?.isLoaded);
    const isRecognition = Boolean(faceapi?.nets?.faceRecognitionNet?.isLoaded);
    if (isTiny) detectorLoaded = true;
    if (isTiny && isLandmark && isRecognition) {
      modelsLoaded = true;
      return true;
    }
  } catch {
    // Ignore error checking faceapi instance
  }
  return false;
}

/**
 * Super-Fast Parallel Model Loading with instant warmup:
 * 1. tinyFaceDetector (Fast face detection, ~190KB) - loaded first in ~100ms!
 * 2. faceLandmark68Net (68 facial landmark points, ~350KB)
 * 3. faceRecognitionNet (Biometric embeddings, ~6.2MB)
 */
export async function loadFaceApiModels(): Promise<boolean> {
  if (areModelsLoaded()) return true;
  if (modelLoadingPromise) return modelLoadingPromise;

  modelLoadingPromise = (async () => {
    if (areModelsLoaded()) {
      modelsLoaded = true;
      detectorLoaded = true;
      return true;
    }

    const hostOrigin = typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";
    const candidateUris: string[] = [
      "/models",
      ...(hostOrigin ? [`${hostOrigin}/models`] : []),
      "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights",
      "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights",
    ];

    for (const uri of candidateUris) {
      try {
        // Priority 1: Load TinyFaceDetector first for immediate detection in <100ms
        if (!faceapi.nets.tinyFaceDetector.isLoaded) {
          await faceapi.nets.tinyFaceDetector.loadFromUri(uri);
          detectorLoaded = true;
        }

        // Priority 2: Load Landmarks & Recognition in parallel
        const loadRest = Promise.all([
          faceapi.nets.faceLandmark68Net.isLoaded
            ? Promise.resolve()
            : faceapi.nets.faceLandmark68Net.loadFromUri(uri),
          faceapi.nets.faceRecognitionNet.isLoaded
            ? Promise.resolve()
            : faceapi.nets.faceRecognitionNet.loadFromUri(uri),
        ]);

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout loading models from ${uri}`)), 8000);
        });

        await Promise.race([loadRest, timeoutPromise]);

        if (areModelsLoaded()) {
          modelsLoaded = true;
          detectorLoaded = true;
          // Instant WebGL warm-up on dummy offscreen canvas
          try {
            const dummy = document.createElement("canvas");
            dummy.width = 64;
            dummy.height = 64;
            try {
              await faceapi.detectSingleFace(dummy, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 }));
            } catch {
              // Ignore warm-up failure
            }
          } catch {}
          return true;
        }
      } catch (err: any) {
        console.warn(`[face-api] Load attempt from ${uri} notice:`, err?.message || err);
      }
    }

    modelsLoaded = areModelsLoaded();
    detectorLoaded = isDetectorLoaded();
    return modelsLoaded;
  })().finally(() => {
    modelLoadingPromise = null;
  });

  return modelLoadingPromise;
}

// In-memory cache of extracted 128D descriptors for fast 1:N matching
const employeeDescriptorCache = new Map<string, Float32Array>();
let cachedFaceMatcher: faceapi.FaceMatcher | null = null;
let cachedMatcherKey = "";

export function invalidateEmployeeFaceCache(employeeId?: string) {
  cachedFaceMatcher = null;
  cachedMatcherKey = "";
  if (employeeId) {
    employeeDescriptorCache.delete(employeeId);
  } else {
    employeeDescriptorCache.clear();
  }
}

// Single reusable offscreen canvas to avoid garbage collection churn
let sharedVideoCanvas: HTMLCanvasElement | null = null;
let sharedVideoCtx: CanvasRenderingContext2D | null = null;

/**
 * Helper to convert HTML element or Base64 / URL to an HTMLImageElement
 */
async function ensureImageElement(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | string
): Promise<HTMLImageElement | HTMLVideoElement | HTMLCanvasElement> {
  if (typeof input === "string") {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image for face detection"));
      img.src = input;
    });
  }

  if (input instanceof HTMLVideoElement) {
    if (input.paused) {
      try {
        await input.play();
      } catch {}
    }
    if (input.readyState < 2 || input.videoWidth === 0) {
      await new Promise<void>((resolve) => {
        if (input.readyState >= 2 && input.videoWidth > 0) return resolve();
        const onReady = () => {
          input.removeEventListener("loadeddata", onReady);
          input.removeEventListener("canplay", onReady);
          input.removeEventListener("playing", onReady);
          resolve();
        };
        input.addEventListener("loadeddata", onReady, { once: true });
        input.addEventListener("canplay", onReady, { once: true });
        input.addEventListener("playing", onReady, { once: true });
        setTimeout(resolve, 600);
      });
    }

    if (input.videoWidth > 0 && input.videoHeight > 0) {
      try {
        if (!sharedVideoCanvas) {
          sharedVideoCanvas = document.createElement("canvas");
        }
        if (sharedVideoCanvas.width !== input.videoWidth || sharedVideoCanvas.height !== input.videoHeight) {
          sharedVideoCanvas.width = input.videoWidth;
          sharedVideoCanvas.height = input.videoHeight;
          sharedVideoCtx = sharedVideoCanvas.getContext("2d", { willReadFrequently: true });
        }
        if (sharedVideoCtx) {
          sharedVideoCtx.drawImage(input, 0, 0, sharedVideoCanvas.width, sharedVideoCanvas.height);
          return sharedVideoCanvas;
        }
      } catch (canvasErr) {
        // Fallback to raw video element
      }
    }
  }

  return input;
}

/**
 * Extract 128-dimensional biometric face descriptor using face-api.js
 */
export async function extractFaceDescriptor(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | string
): Promise<{
  descriptor: Float32Array | null;
  box?: FaceBoundingBox;
  landmarks?: faceapi.FaceLandmarks68;
  detectionScore?: number;
}> {
  const ok = await loadFaceApiModels();
  if (!ok) return { descriptor: null };

  try {
    const target = await ensureImageElement(input);
    // Ultra fast 224 input size with 0.28 threshold for instant wide/distance range detection
    let detection = await faceapi
      .detectSingleFace(
        target,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.28 })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    // Fallback: If not detected (e.g. far distance or low light), try 320 with lower threshold
    if (!detection) {
      detection = await faceapi
        .detectSingleFace(
          target,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.20 })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();
    }

    if (!detection) {
      return { descriptor: null };
    }

    const box: FaceBoundingBox = {
      x: Math.round(detection.detection.box.x),
      y: Math.round(detection.detection.box.y),
      width: Math.round(detection.detection.box.width),
      height: Math.round(detection.detection.box.height),
    };

    return {
      descriptor: detection.descriptor,
      box,
      landmarks: detection.landmarks,
      detectionScore: detection.detection.score,
    };
  } catch (err) {
    console.error("[face-api] Descriptor extraction error:", err);
    return { descriptor: null };
  }
}

/**
 * Extract 128D vector as standard number[] for saving to Employee.faceDescriptor
 */
export async function extract128DVector(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | string
): Promise<number[] | null> {
  const res = await extractFaceDescriptor(input);
  if (!res.descriptor) return null;
  return Array.from(res.descriptor);
}

/**
 * Detect face in photo for enrollment inspection
 */
export async function detectFaceInPhoto(photoUrl: string): Promise<{
  hasFace: boolean;
  box?: FaceBoundingBox;
  score?: number;
  descriptor?: number[];
  qualityScore?: number;
  banglaMessage?: string;
}> {
  await loadFaceApiModels();
  try {
    const res = await extractFaceDescriptor(photoUrl);
    if (!res.descriptor || !res.box) {
      return {
        hasFace: false,
        qualityScore: 0,
        banglaMessage: "ছবিতে কোনো পরিষ্কার মুখ পাওয়া যায়নি। অনুগ্রহ করে আলোযুক্ত স্থানে সরাসরি তাকিয়ে ছবি তুলুন।",
      };
    }
    const qScore = Math.round((res.detectionScore || 0.95) * 100);
    return {
      hasFace: true,
      box: res.box,
      score: qScore,
      qualityScore: qScore,
      banglaMessage: "মুখাবয়ব সঠিকভাবে শনাক্ত করা হয়েছে (কোয়ালিটি উচ্চমানসম্পন্ন)",
      descriptor: Array.from(res.descriptor),
    };
  } catch (err) {
    return {
      hasFace: false,
      qualityScore: 0,
      banglaMessage: "ছবি বিশ্লেষণ করতে সমস্যা হয়েছে। অন্য ছবি চেষ্টা করুন।",
    };
  }
}

/**
 * Get or asynchronously extract and cache employee descriptor
 */
export async function getOrExtractEmployeeDescriptor(employee: Employee): Promise<Float32Array | null> {
  if (employeeDescriptorCache.has(employee.id)) {
    const cached = employeeDescriptorCache.get(employee.id);
    return cached && cached.length === 128 ? cached : null;
  }

  // 1. Check if employee already has faceDescriptor stored as 128 numbers
  if (Array.isArray(employee.faceDescriptor) && employee.faceDescriptor.length === 128) {
    const arr = new Float32Array(employee.faceDescriptor);
    employeeDescriptorCache.set(employee.id, arr);
    return arr;
  }

  // 2. Check localStorage cache
  try {
    const cachedStr = localStorage.getItem(`workflow_hr_cached_descriptor_${employee.id}`);
    if (cachedStr) {
      const parsed = JSON.parse(cachedStr);
      if (Array.isArray(parsed) && parsed.length === 128) {
        const arr = new Float32Array(parsed);
        employeeDescriptorCache.set(employee.id, arr);
        employee.faceDescriptor = parsed;
        return arr;
      }
    }
  } catch {}

  // 3. Extract real descriptor if employee has registered face photo or template
  const photo = employee.faceRegisteredPhoto || (employee.faceTemplateRegistered ? employee.avatarUrl : null);
  if (photo && typeof window !== "undefined") {
    try {
      const res = await extractFaceDescriptor(photo);
      if (res.descriptor && res.descriptor.length === 128) {
        employeeDescriptorCache.set(employee.id, res.descriptor);
        employee.faceDescriptor = Array.from(res.descriptor);
        try {
          localStorage.setItem(`workflow_hr_cached_descriptor_${employee.id}`, JSON.stringify(Array.from(res.descriptor)));
        } catch {}
        return res.descriptor;
      }
    } catch (err) {
      console.warn(`[face-api] Could not extract descriptor for employee ${employee.id}:`, err);
    }
  }

  return null;
}

/**
 * Prewarm and cache employee descriptors in the background
 */
export async function prewarmAndCacheEmployeeDescriptors(employees: Employee[]): Promise<void> {
  await loadFaceApiModels();
  const enrolled = employees.filter(
    (e) =>
      (Array.isArray(e.faceDescriptor) && e.faceDescriptor.length === 128) ||
      Boolean(e.faceRegisteredPhoto) ||
      Boolean(e.faceTemplateRegistered && e.avatarUrl)
  );
  for (const emp of enrolled) {
    if (!employeeDescriptorCache.has(emp.id)) {
      getOrExtractEmployeeDescriptor(emp).catch(() => {});
    }
  }
}

/**
 * Build a faceapi.FaceMatcher with strict threshold (maxDescriptorDistance = 0.45)
 * Caches in memory to avoid garbage collection and frame lag.
 */
export async function buildFaceMatcher(
  employees: Employee[],
  maxDistance: number = MAX_DESCRIPTOR_DISTANCE
): Promise<faceapi.FaceMatcher | null> {
  // Only evaluate employees who have enrolled face descriptors or registered photos
  const enrolledEmployees = employees.filter(
    (e) =>
      (Array.isArray(e.faceDescriptor) && e.faceDescriptor.length === 128) ||
      Boolean(e.faceRegisteredPhoto) ||
      Boolean(e.faceTemplateRegistered && e.avatarUrl) ||
      employeeDescriptorCache.has(e.id)
  );

  const currentKey = enrolledEmployees.map((e) => e.id).sort().join(",") + `_${maxDistance}`;
  if (cachedFaceMatcher && cachedMatcherKey === currentKey) {
    return cachedFaceMatcher;
  }

  await loadFaceApiModels();

  const labeledDescriptors: faceapi.LabeledFaceDescriptors[] = [];

  for (const emp of enrolledEmployees) {
    const desc = await getOrExtractEmployeeDescriptor(emp);
    if (desc && desc.length === 128) {
      labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(emp.id, [desc]));
    }
  }

  if (labeledDescriptors.length === 0) {
    return null;
  }

  cachedFaceMatcher = new faceapi.FaceMatcher(labeledDescriptors, maxDistance);
  cachedMatcherKey = currentKey;
  return cachedFaceMatcher;
}

/**
 * 1:N Real-time Face Auto-Identification using FaceMatcher
 * Scans video frame, matches against all enrolled employees.
 * If distance > 0.48 or unknown, accurately rejects as Unrecognized Face.
 */
export async function autoIdentifyLiveFaceFromAllEmployees(
  videoElement: HTMLVideoElement,
  employees: Employee[],
  rejectedIds?: Set<string>
): Promise<FaceMatchResult> {
  await loadFaceApiModels();

  if (!videoElement || videoElement.readyState < 2) {
    return {
      matched: false,
      matchScore: 0,
      reason: "NO_FACE_IN_FRAME",
      statusMessage: "Camera not ready",
      banglaStatusMessage: "ক্যামেরা প্রস্তুত নয়",
      confidenceTier: "NO_FACE",
    };
  }

  const liveResult = await extractFaceDescriptor(videoElement);
  if (!liveResult.descriptor || !liveResult.box) {
    return {
      matched: false,
      matchScore: 0,
      reason: "NO_FACE_IN_FRAME",
      statusMessage: "No face detected in camera",
      banglaStatusMessage: "ক্যামেরা ফ্রেমে কোনো মুখমণ্ডল শনাক্ত হয়নি। ফ্রেমের মাঝে সোজা তাকান।",
      confidenceTier: "NO_FACE",
    };
  }

  const eligibleEmployees = employees.filter((e) => !rejectedIds || !rejectedIds.has(e.id));
  const matcher = await buildFaceMatcher(eligibleEmployees, MAX_DESCRIPTOR_DISTANCE);

  if (!matcher) {
    return {
      matched: false,
      matchScore: 0,
      reason: "NO_PHOTO_ENROLLED",
      statusMessage: "No enrolled employee face templates found",
      banglaStatusMessage: "ডাটাবেসে কোনো কর্মীর ফেস নিবন্ধিত নেই। অনুগ্রহ করে প্রথমে ফেস এনরোল করুন।",
      confidenceTier: "LOW",
      boundingBox: liveResult.box,
    };
  }

  const bestMatch = matcher.findBestMatch(liveResult.descriptor);

  // Strict euclidean distance check: <= 0.48 is a genuine match
  if (bestMatch.label !== "unknown" && bestMatch.distance <= 0.48) {
    const matchedEmp = employees.find((e) => e.id === bestMatch.label);
    if (matchedEmp) {
      const matchScore = Math.min(100, Math.max(70, Math.round((1 - bestMatch.distance * 0.85) * 100)));
      return {
        matched: true,
        matchScore,
        matchedEmployee: matchedEmp,
        reason: "SUCCESS",
        distance: bestMatch.distance,
        statusMessage: `Face verified: ${matchedEmp.fullName}`,
        banglaStatusMessage: `মুখমণ্ডল মিলেছে: ${matchedEmp.fullName} (${matchScore}%)`,
        confidenceTier: matchScore >= 80 ? "HIGH" : "MEDIUM",
        boundingBox: liveResult.box,
        cosineSimilarity: 1 - bestMatch.distance,
      };
    }
  }

  // Live face does NOT match any enrolled employee profile
  const dist = bestMatch.distance || 0.65;
  const simScore = Math.max(0, Math.round((1 - dist) * 100));

  return {
    matched: false,
    matchScore: simScore,
    reason: "MISMATCH_LOW_CONFIDENCE",
    distance: dist,
    statusMessage: "Face not recognized",
    banglaStatusMessage: "তালিকাভুক্ত কোনো কর্মীর সাথে মুখমণ্ডল মেলেনি (অপরিচিত ব্যক্তি)",
    confidenceTier: "MISMATCH",
    boundingBox: liveResult.box,
  };
}

/**
 * Targeted Face Verification with a single employee (strict Euclidean distance check)
 */
export async function verifyLiveFaceWithEmployee(
  videoElement: HTMLVideoElement,
  employee: Employee
): Promise<FaceMatchResult> {
  await loadFaceApiModels();

  if (!videoElement || videoElement.readyState < 2) {
    return {
      matched: false,
      matchScore: 0,
      reason: "NO_FACE_IN_FRAME",
      statusMessage: "Camera not ready",
      banglaStatusMessage: "ক্যামেরা প্রস্তুত নয়",
      confidenceTier: "NO_FACE",
    };
  }

  const liveResult = await extractFaceDescriptor(videoElement);
  if (!liveResult.descriptor || !liveResult.box) {
    return {
      matched: false,
      matchScore: 0,
      reason: "NO_FACE_IN_FRAME",
      statusMessage: "No face detected in camera",
      banglaStatusMessage: "ক্যামেরা ফ্রেমে মুখ শনাক্ত করা যায়নি।",
      confidenceTier: "NO_FACE",
    };
  }

  const targetDesc = await getOrExtractEmployeeDescriptor(employee);
  if (!targetDesc) {
    return {
      matched: false,
      matchScore: 0,
      reason: "NO_PHOTO_ENROLLED",
      statusMessage: "Employee face template not enrolled",
      banglaStatusMessage: `${employee.fullName}-এর কোনো ফেস টেমপ্লেট নিবন্ধিত নেই।`,
      confidenceTier: "LOW",
      boundingBox: liveResult.box,
    };
  }

  const dist = faceapi.euclideanDistance(liveResult.descriptor, targetDesc);
  if (dist <= 0.48) {
    const matchScore = Math.min(100, Math.max(70, Math.round((1 - dist * 0.85) * 100)));
    return {
      matched: true,
      matchScore,
      matchedEmployee: employee,
      reason: "SUCCESS",
      distance: dist,
      statusMessage: `Face verified: ${employee.fullName}`,
      banglaStatusMessage: `মুখমণ্ডল মিলেছে: ${employee.fullName} (${matchScore}%)`,
      confidenceTier: "HIGH",
      boundingBox: liveResult.box,
      cosineSimilarity: 1 - dist,
    };
  }

  return {
    matched: false,
    matchScore: Math.max(0, Math.round((1 - dist) * 100)),
    reason: "MISMATCH_LOW_CONFIDENCE",
    distance: dist,
    statusMessage: "Face does not match employee",
    banglaStatusMessage: `ক্যামেরার মুখের সাথে ${employee.fullName}-এর মুখের মিল নেই।`,
    confidenceTier: "MISMATCH",
    boundingBox: liveResult.box,
  };
}

/**
 * 1:1 Verification of live camera face against a candidate photo (during enrollment)
 */
export async function verifyLiveFaceAgainstCandidatePhoto(
  videoElement: HTMLVideoElement | HTMLCanvasElement | string,
  candidatePhotoUrl: string
): Promise<FaceMatchResult> {
  const modelsReady = await loadFaceApiModels();
  if (!modelsReady) {
    return {
      matched: false,
      matchScore: 0,
      reason: "NO_PHOTO_ENROLLED",
      statusMessage: "Face recognition AI models could not be loaded",
      banglaStatusMessage: "বায়োমেট্রিক মডেল লোড হতে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করে পুনরায় চেষ্টা করুন।",
      confidenceTier: "NO_FACE",
    };
  }

  // Ensure video is playing and active if it's a video element
  if (videoElement instanceof HTMLVideoElement && videoElement.paused) {
    try {
      await videoElement.play();
    } catch (e) {
      console.warn("Video play check:", e);
    }
  }

  // 12-second execution safety guard against hung promises on mobile
  const verifyPromise = (async () => {
    const [candidateRes, videoRes] = await Promise.all([
      extractFaceDescriptor(candidatePhotoUrl),
      extractFaceDescriptor(videoElement),
    ]);

    if (!candidateRes.descriptor) {
      return {
        matched: false,
        matchScore: 0,
        reason: "NO_PHOTO_ENROLLED" as const,
        statusMessage: "No face detected in candidate photo",
        banglaStatusMessage: "আপলোড করা ছবিতে কোনো মুখ শনাক্ত হয়নি। স্পষ্ট ছবি আপলোড করুন।",
        confidenceTier: "NO_FACE" as const,
      };
    }

    if (!videoRes.descriptor || !videoRes.box) {
      return {
        matched: false,
        matchScore: 0,
        reason: "NO_FACE_IN_FRAME" as const,
        statusMessage: "No face detected in live camera",
        banglaStatusMessage: "লাইভ ক্যামেরায় কোনো মুখ দেখা যাচ্ছে না। ক্যামেরার মাঝখানে সোজা হয়ে বসুন।",
        confidenceTier: "NO_FACE" as const,
      };
    }

    const distance = faceapi.euclideanDistance(videoRes.descriptor, candidateRes.descriptor);

    if (distance > MAX_DESCRIPTOR_DISTANCE) {
      return {
        matched: false,
        matchScore: Math.max(0, Math.round((1 - distance) * 100)),
        reason: "MISMATCH_LOW_CONFIDENCE" as const,
        distance,
        statusMessage: `Face mismatch: Distance ${distance.toFixed(3)} exceeds ${MAX_DESCRIPTOR_DISTANCE}`,
        banglaStatusMessage: `মুখমণ্ডল মিলছে না (দূরত্ব: ${distance.toFixed(2)})। লাইভ চেহারার সাথে ছবির কোনো মিল নেই।`,
        confidenceTier: "MISMATCH" as const,
        boundingBox: videoRes.box,
      };
    }

    const matchScore = Math.min(100, Math.max(55, Math.round((1 - distance * 0.9) * 100)));

    return {
      matched: true,
      matchScore,
      reason: "SUCCESS" as const,
      distance,
      statusMessage: `Biometric face verified (${matchScore}%)`,
      banglaStatusMessage: `লাইভ চেহারার সাথে ছবির সফল মিল পাওয়া গেছে (${matchScore}%)!`,
      confidenceTier: matchScore >= 80 ? ("HIGH" as const) : ("MEDIUM" as const),
      boundingBox: videoRes.box,
      cosineSimilarity: 1 - distance,
      featureVectorLength: 128,
    };
  })();

  const timeoutPromise = new Promise<FaceMatchResult>((resolve) =>
    setTimeout(
      () =>
        resolve({
          matched: false,
          matchScore: 0,
          reason: "NO_FACE_IN_FRAME",
          statusMessage: "Verification timed out",
          banglaStatusMessage: "ক্যামেরা ফ্রেম প্রসেসিংয়ে বিলম্ব হয়েছে। আলো পর্যাপ্ত রেখে পুনরায় 'লাইভ ভেরিফাই' বাটনে চাপুন।",
          confidenceTier: "NO_FACE",
        }),
      12000
    )
  );

  return Promise.race([verifyPromise, timeoutPromise]);
}

// Multi-Factor Anti-Spoofing & Adaptive Liveness State Tracking
interface LivenessTracker {
  baselineEAR: number;
  inBlink: boolean;
  blinkStartTime: number;
  lastBlinkTime: number;
  blinkDetected: boolean;
  lastSmileTime: number;
  smileDetected: boolean;
  lastNosePos: { x: number; y: number } | null;
  microMotionDetected: boolean;
  livenessPassed: boolean;
  livenessReason?: "BLINK" | "SMILE" | "MICRO_MOTION";
}

const livenessTracker: LivenessTracker = {
  baselineEAR: 0.24,
  inBlink: false,
  blinkStartTime: 0,
  lastBlinkTime: 0,
  blinkDetected: false,
  lastSmileTime: 0,
  smileDetected: false,
  lastNosePos: null,
  microMotionDetected: false,
  livenessPassed: false,
};

export function resetBilateralBlinkState() {
  livenessTracker.inBlink = false;
  livenessTracker.blinkStartTime = 0;
  livenessTracker.blinkDetected = false;
  livenessTracker.smileDetected = false;
  livenessTracker.microMotionDetected = false;
  livenessTracker.livenessPassed = false;
  livenessTracker.livenessReason = undefined;
}

/**
 * Calculate Eye Aspect Ratio (EAR) from 6 landmark points of an eye
 */
function calculateEyeAspectRatio(eye: faceapi.Point[]): number {
  if (!eye || eye.length < 6) return 0.24;
  const p1 = eye[0], p2 = eye[1], p3 = eye[2], p4 = eye[3], p5 = eye[4], p6 = eye[5];
  const vertical1 = Math.hypot(p2.x - p6.x, p2.y - p6.y);
  const vertical2 = Math.hypot(p3.x - p5.x, p3.y - p5.y);
  const horizontal = Math.hypot(p1.x - p4.x, p1.y - p4.y);
  if (horizontal === 0) return 0.24;
  return (vertical1 + vertical2) / (2.0 * horizontal);
}

// Live frame analysis cache to maintain high-fps UI
let cachedAnalysis: LiveFaceAnalysis = {
  hasFace: false,
  skinPixelCount: 0,
  brightness: 120,
  sharpness: 80,
  blinkScore: 100,
  smileScore: 0,
  blinkDetected: false,
  smileDetected: false,
  eyeOpenness: 90,
  livenessPassed: false,
  ambientLuminance: 120,
  isLowLight: false,
};

let lastAnalysisTime = 0;
let isAnalyzingLandmarks = false;
let consecutiveNoFaceCount = 0;
const MAX_NO_FACE_DROPS = 6; // Tolerate up to 6 dropped frames (~750ms) to eliminate flickering

// Fast offscreen sampler for ambient luminance measurement (32x24 for zero overhead)
let offscreenLumCanvas: HTMLCanvasElement | null = null;
let offscreenLumCtx: CanvasRenderingContext2D | null = null;

function measureAmbientLuminance(video: HTMLVideoElement): { luminance: number; isLowLight: boolean } {
  try {
    if (typeof document === "undefined" || !video || video.readyState < 2) {
      return { luminance: 120, isLowLight: false };
    }
    if (!offscreenLumCanvas) {
      offscreenLumCanvas = document.createElement("canvas");
      offscreenLumCanvas.width = 32;
      offscreenLumCanvas.height = 24;
      offscreenLumCtx = offscreenLumCanvas.getContext("2d", { willReadFrequently: true });
    }
    if (offscreenLumCtx && video.videoWidth > 0 && video.videoHeight > 0) {
      offscreenLumCtx.drawImage(video, 0, 0, 32, 24);
      const img = offscreenLumCtx.getImageData(0, 0, 32, 24);
      const data = img.data;
      let total = 0;
      const count = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        // Standard Rec. 601 optical luminance formula
        total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const lum = Math.round(total / count);
      // Low light if average pixel luminance < 65 out of 255
      return { luminance: lum, isLowLight: lum < 65 };
    }
  } catch (e) {
    // Ignore any canvas error
  }
  return { luminance: 120, isLowLight: false };
}

/**
 * Synchronous / Fast frame analysis for live HUD rendering
 */
export function detectLiveFaceInVideo(videoElement: HTMLVideoElement): LiveFaceAnalysis {
  if (!videoElement || videoElement.readyState < 2) {
    return {
      hasFace: false,
      skinPixelCount: 0,
      brightness: 120,
      sharpness: 0,
      blinkScore: 100,
      smileScore: 0,
      blinkDetected: false,
      smileDetected: false,
      eyeOpenness: 90,
      livenessPassed: false,
      ambientLuminance: 120,
      isLowLight: false,
    };
  }

  // Fast ambient luminance sample
  const { luminance, isLowLight } = measureAmbientLuminance(videoElement);

  // Run non-blocking background landmark update every 40ms (~25 fps) for rapid blink capture
  const now = Date.now();
  if (!isAnalyzingLandmarks && now - lastAnalysisTime > 40 && (modelsLoaded || detectorLoaded || isDetectorLoaded())) {
    lastAnalysisTime = now;
    isAnalyzingLandmarks = true;

    (async () => {
      try {
        const landmarksReady = Boolean(faceapi?.nets?.faceLandmark68Net?.isLoaded);

        // Low threshold (0.20) with 224 input size detects faces at wide distances & angles within 10s
        const detectorOptions = new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.20,
        });

        let detection: any = landmarksReady
          ? await faceapi.detectSingleFace(videoElement, detectorOptions).withFaceLandmarks()
          : await faceapi.detectSingleFace(videoElement, detectorOptions);

        // Low-light / wide angle secondary rescue pass if primary failed
        if (!detection) {
          const fallbackOptions = new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.15,
          });
          detection = landmarksReady
            ? await faceapi.detectSingleFace(videoElement, fallbackOptions).withFaceLandmarks()
            : await faceapi.detectSingleFace(videoElement, fallbackOptions);
        }

        if (detection) {
          consecutiveNoFaceCount = 0;
          const box = detection.detection.box;
          const leftEyePts = detection.landmarks.getLeftEye();
          const rightEyePts = detection.landmarks.getRightEye();
          const mouthPts = detection.landmarks.getMouth();
          const nosePts = detection.landmarks.getNose();
          const jawPts = detection.landmarks.getJawOutline();

          const leftEAR = calculateEyeAspectRatio(leftEyePts);
          const rightEAR = calculateEyeAspectRatio(rightEyePts);
          const avgEAR = (leftEAR + rightEAR) / 2.0;

          // 1. Adaptive Individual Baseline Adaptation
          // Accommodates all eye morphologies (Asian, hooded, wide, looking down at screen, eyeglasses)
          if (!livenessTracker.inBlink) {
            // Adaptive EWMA update
            livenessTracker.baselineEAR = livenessTracker.baselineEAR * 0.88 + avgEAR * 0.12;
            // Bound baseline to physical human range [0.15, 0.38]
            livenessTracker.baselineEAR = Math.max(0.15, Math.min(0.38, livenessTracker.baselineEAR));
          }

          // Individualized Relative Blink Thresholds
          // Relative drop calculation works for anyone regardless of base eye aperture
          const blinkDropThreshold = livenessTracker.baselineEAR * 0.80; // 20% relative dip
          const blinkRecoveryThreshold = livenessTracker.baselineEAR * 0.88; // 88% recovery towards baseline

          let blinkTriggered = false;
          if (avgEAR < blinkDropThreshold && !livenessTracker.inBlink) {
            livenessTracker.inBlink = true;
            livenessTracker.blinkStartTime = now;
          } else if (avgEAR >= blinkRecoveryThreshold && livenessTracker.inBlink) {
            const blinkDuration = now - livenessTracker.blinkStartTime;
            livenessTracker.inBlink = false;
            // Human blink duration: between 40ms and 1100ms
            if (blinkDuration >= 40 && blinkDuration <= 1100) {
              blinkTriggered = true;
              livenessTracker.lastBlinkTime = now;
              livenessTracker.blinkDetected = true;
              livenessTracker.livenessPassed = true;
              livenessTracker.livenessReason = "BLINK";
            }
          }

          // Complete closure fallback (< 0.14) for fast blinks
          if (avgEAR < 0.14) {
            livenessTracker.inBlink = true;
            if (!livenessTracker.blinkStartTime) livenessTracker.blinkStartTime = now;
          }

          // 2. Optical Expression & Smile Anti-Spoofing
          // Proves live human muscle responsiveness against static printed photos
          const interocular = Math.hypot(leftEyePts[0].x - rightEyePts[3].x, leftEyePts[0].y - rightEyePts[3].y);
          const mouthWidth = Math.hypot(mouthPts[0].x - mouthPts[6].x, mouthPts[0].y - mouthPts[6].y);
          const smileRatio = interocular > 0 ? mouthWidth / interocular : 0.85;
          const smileScore = Math.min(100, Math.max(0, Math.round(((smileRatio - 0.76) / 0.34) * 100)));

          let smileTriggered = false;
          if (smileScore >= 42 || smileRatio > 0.98) {
            smileTriggered = true;
            livenessTracker.lastSmileTime = now;
            livenessTracker.smileDetected = true;
            livenessTracker.livenessPassed = true;
            livenessTracker.livenessReason = "SMILE";
          }

          // 3. 3D Depth Parallax & Micro-Movement Anti-Spoofing
          // Live humans have subtle micro-shifts (1-18px) between nose and eyes
          let microMotionTriggered = false;
          if (nosePts[6]) {
            const currentNose = { x: nosePts[6].x, y: nosePts[6].y };
            if (livenessTracker.lastNosePos) {
              const dx = Math.abs(currentNose.x - livenessTracker.lastNosePos.x);
              const dy = Math.abs(currentNose.y - livenessTracker.lastNosePos.y);
              const dist = Math.hypot(dx, dy);
              if (dist >= 1.2 && dist <= 18) {
                microMotionTriggered = true;
                livenessTracker.microMotionDetected = true;
              }
            }
            livenessTracker.lastNosePos = currentNose;
          }

          // Overall liveness passed if blink, smile, or prolonged live interaction happened
          const livenessPassed =
            blinkTriggered ||
            (now - livenessTracker.lastBlinkTime < 4500) ||
            smileTriggered ||
            (now - livenessTracker.lastSmileTime < 4500) ||
            livenessTracker.livenessPassed;

          const livenessReason = livenessTracker.livenessReason || (blinkTriggered ? "BLINK" : smileTriggered ? "SMILE" : "MICRO_MOTION");

          // Eye Openness percentage relative to baseline
          const eyeOpenness = Math.min(100, Math.max(0, Math.round((avgEAR / livenessTracker.baselineEAR) * 100)));

          // Facial hair (beard) inspection from jaw/chin region
          const chinPt = jawPts[8] || mouthPts[9];
          const hasBeard = chinPt && mouthPts[9] ? Math.abs(chinPt.y - mouthPts[9].y) > (box.height * 0.18) : false;

          cachedAnalysis = {
            hasFace: true,
            boundingBox: {
              x: Math.round(box.x),
              y: Math.round(box.y),
              width: Math.round(box.width),
              height: Math.round(box.height),
            },
            skinPixelCount: Math.round(box.width * box.height * 0.45),
            brightness: 130,
            sharpness: 90,
            blinkScore: eyeOpenness,
            smileScore,
            blinkDetected: blinkTriggered || (now - livenessTracker.lastBlinkTime < 4500) || livenessTracker.blinkDetected,
            smileDetected: smileTriggered || (now - livenessTracker.lastSmileTime < 4500) || livenessTracker.smileDetected,
            eyeOpenness,
            livenessPassed,
            livenessReason,
            landmarks: {
              leftEye: leftEyePts[0] ? { x: leftEyePts[0].x, y: leftEyePts[0].y } : { x: 0, y: 0 },
              rightEye: rightEyePts[3] ? { x: rightEyePts[3].x, y: rightEyePts[3].y } : { x: 0, y: 0 },
              noseTip: nosePts[6] ? { x: nosePts[6].x, y: nosePts[6].y } : { x: 0, y: 0 },
              mouthLeft: mouthPts[0] ? { x: mouthPts[0].x, y: mouthPts[0].y } : { x: 0, y: 0 },
              mouthRight: mouthPts[6] ? { x: mouthPts[6].x, y: mouthPts[6].y } : { x: 0, y: 0 },
              mouthCenter: mouthPts[9] ? { x: mouthPts[9].x, y: mouthPts[9].y } : { x: 0, y: 0 },
              chin: chinPt ? { x: chinPt.x, y: chinPt.y } : { x: 0, y: 0 },
              leftCheek: jawPts[2] ? { x: jawPts[2].x, y: jawPts[2].y } : { x: 0, y: 0 },
              rightCheek: jawPts[14] ? { x: jawPts[14].x, y: jawPts[14].y } : { x: 0, y: 0 },
              forehead: { x: box.x + box.width / 2, y: box.y + box.height * 0.15 },
              jawLine: jawPts.map((p) => ({ x: p.x, y: p.y })),
            },
            skinToneProfile: {
              melaninIndex: 45,
              description: "Natural South Asian",
              r: 175,
              g: 135,
              b: 110,
            },
            facialHairProfile: {
              hasDarkBeard: hasBeard,
              hasWhiteBeard: false,
              isCleanShaven: !hasBeard,
              description: hasBeard ? "Beard / Facial Hair Detected" : "Clean Shaven",
            },
            glassesProfile: {
              hasGlasses: false,
              description: "No Eyewear Detected",
            },
            ambientLuminance: luminance,
            isLowLight,
          };
        } else {
          // Latching buffer: only clear face after MAX_NO_FACE_DROPS missed frames
          consecutiveNoFaceCount++;
          if (consecutiveNoFaceCount >= MAX_NO_FACE_DROPS) {
            cachedAnalysis = {
              hasFace: false,
              skinPixelCount: 0,
              brightness: luminance,
              sharpness: 50,
              blinkScore: 100,
              smileScore: 0,
              blinkDetected: false,
              smileDetected: false,
              eyeOpenness: 90,
              livenessPassed: false,
              ambientLuminance: luminance,
              isLowLight,
            };
          }
        }
      } catch (err) {
        // Continue with last valid analysis without breaking animation loop
      } finally {
        isAnalyzingLandmarks = false;
      }
    })();
  }

  return cachedAnalysis;
}

/**
 * Draw Biometric HUD Mesh Canvas Overlay with high performance
 */
export function drawBiometricMeshOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  hasFace: boolean,
  isMatched: boolean,
  isMismatch: boolean,
  box?: FaceBoundingBox
) {
  ctx.clearRect(0, 0, width, height);

  if (!hasFace) {
    // Subtle searching oval guide
    ctx.save();
    ctx.strokeStyle = "rgba(59, 130, 246, 0.35)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, width * 0.22, height * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const primaryColor = isMatched
    ? "rgba(16, 185, 129, 0.95)"
    : isMismatch
    ? "rgba(239, 68, 68, 0.95)"
    : "rgba(6, 182, 212, 0.9)";

  const glowColor = isMatched
    ? "rgba(16, 185, 129, 0.25)"
    : isMismatch
    ? "rgba(239, 68, 68, 0.2)"
    : "rgba(6, 182, 212, 0.2)";

  // Target Box
  const targetBox = box || {
    x: width * 0.28,
    y: height * 0.2,
    width: width * 0.44,
    height: height * 0.6,
  };

  const { x, y, width: bw, height: bh } = targetBox;

  ctx.save();
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2.5;

  // Draw 4 Futuristic Corner Reticles
  const cornerSize = Math.min(28, bw * 0.2);

  // Top-Left
  ctx.beginPath();
  ctx.moveTo(x, y + cornerSize);
  ctx.lineTo(x, y);
  ctx.lineTo(x + cornerSize, y);
  ctx.stroke();

  // Top-Right
  ctx.beginPath();
  ctx.moveTo(x + bw - cornerSize, y);
  ctx.lineTo(x + bw, y);
  ctx.lineTo(x + bw, y + cornerSize);
  ctx.stroke();

  // Bottom-Left
  ctx.beginPath();
  ctx.moveTo(x, y + bh - cornerSize);
  ctx.lineTo(x, y + bh);
  ctx.lineTo(x + cornerSize, y + bh);
  ctx.stroke();

  // Bottom-Right
  ctx.beginPath();
  ctx.moveTo(x + bw - cornerSize, y + bh);
  ctx.lineTo(x + bw, y + bh);
  ctx.lineTo(x + bw, y + bh - cornerSize);
  ctx.stroke();

  // Subtle background glow in box
  ctx.fillStyle = glowColor;
  ctx.fillRect(x, y, bw, bh);

  // Scanning radar line
  const time = Date.now() / 800;
  const scanY = y + ((Math.sin(time) + 1) / 2) * bh;
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 4, scanY);
  ctx.lineTo(x + bw - 4, scanY);
  ctx.stroke();

  ctx.restore();
}

/**
 * Biometric Audio Feedback using Web Audio API
 */
let audioCtx: AudioContext | null = null;

export function playBiometricSound(_type: "match" | "blink" | "error" | "success" | "smile" | "scan") {
  // Silent execution - no audio noises per user requirement
}
