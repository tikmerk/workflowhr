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

export async function requestUserMediaStream(
  preferredFacingMode: "user" | "environment" = "user",
  deviceId?: string
): Promise<MediaStream> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("আপনার ব্রাউজারে বা অ্যাপে ওয়েব-ক্যামেরা (WebRTC) সুবিধা সাপোর্ট করে না। অন্য আধুনিক ব্রাউজার ব্যবহার করুন।");
  }

  // Tier 1: Try requested deviceId or exact facingMode with ideal dimensions
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
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err1) {
    console.warn("[Camera] Tier 1 constraint failed, trying flexible facingMode fallback...", err1);
  }

  // Tier 2: Try flexible ideal facingMode without resolution lock (Crucial for mobile portrait cameras)
  try {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: preferredFacingMode },
      },
      audio: false,
    };
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err2) {
    console.warn("[Camera] Tier 2 fallback failed, trying generic video constraint...", err2);
  }

  // Tier 3: Universal fallback - any available video input stream
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  } catch (err3: any) {
    console.error("[Camera] All media stream attempts failed:", err3);
    if (err3?.name === "NotAllowedError" || err3?.name === "PermissionDeniedError") {
      throw new Error("ক্যামেরা ব্যবহারের অনুমতি বাতিল করা হয়েছে। ব্রাউজারের সেটিংস বা এড্রেস বার থেকে ক্যামেরা পারমিশন 'Allow' করুন।");
    }
    if (err3?.name === "NotFoundError" || err3?.name === "DevicesNotFoundError") {
      throw new Error("আপনার ডিভাইসে কোনো সক্রিয় ক্যামেরা পাওয়া যায়নি। ক্যামেরা সংযুক্ত আছে কিনা পরীক্ষা করুন।");
    }
    if (err3?.name === "NotReadableError" || err3?.name === "TrackStartError") {
      throw new Error("অন্য কোনো অ্যাপ বা উইন্ডো ক্যামেরাটি ব্যবহার করছে। অনুগ্রহ করে অন্য ক্যামেরা অ্যাপ বন্ধ করে পুনরায় চেষ্টা করুন।");
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
    // Mirror the selfie horizontally for natural preview capture
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  }
  return canvas.toDataURL("image/jpeg", 0.9);
}
