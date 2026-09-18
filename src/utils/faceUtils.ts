import { AntiSpoofingResult } from "../types";

export type LivenessChallengeStep = "ALIGN" | "BLINK" | "SMILE" | "COMPLETED";

export interface ChallengePrompt {
  step: LivenessChallengeStep;
  title: string;
  instruction: string;
  banglaInstruction: string;
  iconName: string;
}

export const LIVENESS_CHALLENGES: ChallengePrompt[] = [
  {
    step: "ALIGN",
    title: "Align Face in Center",
    instruction: "Look directly into the camera frame within the oval guide.",
    banglaInstruction: "ক্যামেরার দিকে সোজা তাকান এবং ফ্রেমের মাঝখানে মুখ রাখুন।",
    iconName: "ScanFace",
  },
  {
    step: "BLINK",
    title: "Blink Eyes Check",
    instruction: "Blink your eyes naturally to verify real-time live human presence.",
    banglaInstruction: "লাইভ উপস্থিতি নিশ্চিত করতে স্বাভাবিকভাবে চোখের পলক ফেলুন।",
    iconName: "Eye",
  },
  {
    step: "SMILE",
    title: "Smile Detection Check",
    instruction: "Give a gentle smile to verify facial muscle responsiveness.",
    banglaInstruction: "চেহারার মাইক্রো-মুভমেন্ট চেকের জন্য সামান্য স্বাভাবিকভাবে হাসুন।",
    iconName: "Smile",
  },
];

export function checkCameraSupport(): { isSupported: boolean; isSecure: boolean; errorMessage?: string } {
  if (typeof window === "undefined") {
    return { isSupported: false, isSecure: true };
  }

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".localhost");

  const isSecure = window.isSecureContext || isLocalhost;

  const hasMediaDevices = Boolean(
    (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia
  );

  if (!isSecure && !isLocalhost) {
    return {
      isSupported: hasMediaDevices,
      isSecure: false,
      errorMessage:
        "মোবাইল ও পিসি ব্রাউজারে ক্যামেরা ব্যবহারের জন্য সুরক্ষিত সংযোগ (HTTPS) আবশ্যক। বর্তমান সংযোগটি অসুরক্ষিত HTTP।",
    };
  }

  if (!hasMediaDevices) {
    return {
      isSupported: false,
      isSecure,
      errorMessage:
        "আপনার ব্রাউজারে ওয়েব-ক্যামেরা সুবিধা নেই বা ইন-অ্যাপ ব্রাউজারে ব্লক করা আছে। সাধারণ ক্রোম বা সাফারি ব্রাউজার ব্যবহার করুন।",
    };
  }

  return { isSupported: true, isSecure: true };
}

export async function requestUserMediaStream(
  preferredFacingMode: "user" | "environment" = "user",
  deviceId?: string
): Promise<MediaStream> {
  const support = checkCameraSupport();
  if (!support.isSupported && !support.isSecure) {
    throw new Error(
      support.errorMessage ||
        "মোবাইল বা পিসিতে ক্যামেরা চালু করার জন্য ব্রাউজারে HTTPS লিঙ্ক প্রয়োজন। অনুগ্রহ করে HTTPS লিঙ্ক ব্যবহার করুন অথবা নিচের মোবাইল ক্যামেরা স্ন্যাপ অপশন ব্যবহার করুন।"
    );
  }

  const isMobile =
    typeof navigator !== "undefined" &&
    (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (typeof window !== "undefined" && window.innerWidth < 768));

  // Legacy API adapter
  const getUserMedia = async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      return await navigator.mediaDevices.getUserMedia(constraints);
    }
    const legacyFn =
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia ||
      (navigator as any).getUserMedia;
    if (legacyFn) {
      return new Promise<MediaStream>((resolve, reject) => {
        legacyFn.call(navigator, constraints, resolve, reject);
      });
    }
    throw new Error("ক্যামেরা এপিআই পাওয়া যায়নি।");
  };

  // Tier 1 for Mobile: Use unconstrained aspect ratio (vital for portrait sensor orientation on Android/iOS)
  if (isMobile && !deviceId) {
    try {
      const mobileConstraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: preferredFacingMode },
          width: { ideal: 480 },
          height: { ideal: 640 },
        },
        audio: false,
      };
      return await getUserMedia(mobileConstraints);
    } catch (errMob1) {
      console.warn("[Camera] Mobile ideal portrait failed, trying flexible facingMode...", errMob1);
    }

    try {
      return await getUserMedia({
        video: { facingMode: preferredFacingMode },
        audio: false,
      });
    } catch (errMob2) {
      console.warn("[Camera] Mobile facingMode failed, falling to generic...", errMob2);
    }
  }

  // Tier 1 for Desktop / Specific Device
  try {
    const constraints: MediaStreamConstraints = {
      video: deviceId
        ? { deviceId: { exact: deviceId } }
        : {
            facingMode: preferredFacingMode,
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
      audio: false,
    };
    return await getUserMedia(constraints);
  } catch (err1) {
    console.warn("[Camera] Tier 1 constraint failed, trying flexible facingMode fallback...", err1);
  }

  // Tier 2: Flexible ideal facingMode without resolution lock
  try {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: preferredFacingMode },
      },
      audio: false,
    };
    return await getUserMedia(constraints);
  } catch (err2) {
    console.warn("[Camera] Tier 2 fallback failed, trying generic video constraint...", err2);
  }

  // Tier 3: Universal fallback - any available video input stream
  try {
    return await getUserMedia({
      video: true,
      audio: false,
    });
  } catch (err3: any) {
    console.error("[Camera] All media stream attempts failed:", err3);
    if (err3?.name === "NotAllowedError" || err3?.name === "PermissionDeniedError") {
      throw new Error("ক্যামেরা ব্যবহারের অনুমতি বাতিল বা ব্লক করা হয়েছে। ব্রাউজারের সেটিংস বা এড্রেস বার থেকে ক্যামেরা পারমিশন 'Allow' করুন।");
    }
    if (err3?.name === "NotFoundError" || err3?.name === "DevicesNotFoundError") {
      throw new Error("আপনার ডিভাইসে কোনো সক্রিয় ক্যামেরা পাওয়া যায়নি। ক্যামেরা সংযুক্ত আছে কিনা পরীক্ষা করুন।");
    }
    if (err3?.name === "NotReadableError" || err3?.name === "TrackStartError") {
      throw new Error("অন্য কোনো অ্যাপ বা ট্যাব ক্যামেরাটি লক করে রেখেছে। অন্য ক্যামেরা অ্যাপ বন্ধ করে পুনরায় চেষ্টা করুন।");
    }
    if (err3?.name === "OverconstrainedError") {
      throw new Error("ক্যামেরা রেজোলিউশন ডিভাইসে সাপোর্ট করছে না। ক্যামেরা বদলান বাটনে চাপুন।");
    }
    throw new Error("ক্যামেরা চালু করতে সমস্যা হয়েছে: " + (err3?.message || "অজ্ঞাত সমস্যা"));
  }
}

export function captureFrameAsBase64(videoElement: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  const vw = videoElement.videoWidth || 640;
  const vh = videoElement.videoHeight || 480;
  canvas.width = vw;
  canvas.height = vh;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // Mirror the selfie horizontally for natural preview capture if user camera
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  }
  return canvas.toDataURL("image/jpeg", 0.9);
}
