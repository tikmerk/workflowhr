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

export async function requestUserMediaStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("WebRTC camera access is not supported by your browser environment.");
  }
  return navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: "user",
    },
    audio: false,
  });
}

export function captureFrameAsBase64(videoElement: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = videoElement.videoWidth || 640;
  canvas.height = videoElement.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // Mirror the selfie horizontally for natural preview capture
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  }
  return canvas.toDataURL("image/jpeg", 0.9);
}
