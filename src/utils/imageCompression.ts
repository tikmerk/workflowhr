/**
 * Image Compression & Optimization Utility
 * Prevents Firestore document limit errors (1MB limit) by resizing and compressing
 * user-uploaded portraits and camera snaps into lightweight (25KB - 60KB), high-fidelity JPEGs.
 */

export async function compressAndOptimizeImage(
  source: File | string,
  maxWidth = 480,
  maxHeight = 480,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's a remote URL (http/https) and not a huge data URL, return as-is
    if (typeof source === "string" && !source.startsWith("data:")) {
      resolve(source);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= 0 || height <= 0) {
          resolve(typeof source === "string" ? source : "");
          return;
        }

        // Calculate aspect ratio preserving dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(typeof source === "string" ? source : "");
          return;
        }

        // Smooth image scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to lightweight JPEG data URL (~30-60 KB)
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.warn("Canvas compression warning:", err);
        resolve(typeof source === "string" ? source : "");
      }
    };

    img.onerror = (err) => {
      console.warn("Image load for compression failed:", err);
      if (typeof source === "string") {
        resolve(source);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || "");
        reader.onerror = reject;
        reader.readAsDataURL(source);
      }
    };

    if (typeof source === "string") {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = (e.target?.result as string) || "";
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    }
  });
}
