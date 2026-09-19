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
  return new Promise((resolve) => {
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
      console.warn("Image load for compression notice:", err);
      if (typeof source === "string") {
        resolve(source);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || "");
        reader.onerror = () => resolve("");
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
      reader.onerror = () => resolve("");
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Signature-Specific Image Compression & Auto-Downscaling Utility
 * Accepts mobile camera photos or scanned signatures (PNG, JPG, JPEG, WebP)
 * regardless of how large (1MB - 5MB+), downscales to optimal dimensions (~400x160)
 * and produces an ultra-lightweight, crystal-clear web signature (~15KB - 30KB).
 */
export async function compressSignatureImage(
  source: File | string,
  maxWidth = 420,
  maxHeight = 150,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof source === "string" && !source.startsWith("data:")) {
      resolve(source);
      return;
    }

    const isPng =
      (typeof source !== "string" && source.type === "image/png") ||
      (typeof source === "string" && source.startsWith("data:image/png"));

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

        // Calculate aspect-ratio fit within maxWidth & maxHeight
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        const finalWidth = Math.max(Math.round(width * ratio), 60);
        const finalHeight = Math.max(Math.round(height * ratio), 30);

        const canvas = document.createElement("canvas");
        canvas.width = finalWidth;
        canvas.height = finalHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(typeof source === "string" ? source : "");
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        if (!isPng) {
          // Fill white background for JPEG / photos of paper signatures
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, finalWidth, finalHeight);
        }

        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

        // If it's a PNG with transparent backing, keep PNG; otherwise lightweight JPEG
        const outputMime = isPng ? "image/png" : "image/jpeg";
        const compressed = canvas.toDataURL(outputMime, quality);
        resolve(compressed);
      } catch (err) {
        console.warn("Signature compression error:", err);
        resolve(typeof source === "string" ? source : "");
      }
    };

    img.onerror = (err) => {
      console.warn("Signature image load failure:", err);
      if (typeof source === "string") {
        resolve(source);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || "");
        reader.onerror = () => resolve("");
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
      reader.onerror = () => resolve("");
      reader.readAsDataURL(source);
    }
  });
}
