/** Image capture helpers: draw the live frame (never mirrored) and compress to a small JPEG. */

const MAX_SIDE = 1280;
const MAX_BYTES = 300 * 1024;

export interface CapturedPhoto {
  blob: Blob;
  base64: string; // without the data: prefix
  mimeType: "image/jpeg";
  objectUrl: string;
}

/** Draw the current video frame to a canvas, resizing the longest side to <= 1280 px. */
export function drawVideoFrame(video: HTMLVideoElement): HTMLCanvasElement {
  const w = video.videoWidth || 1280;
  const h = video.videoHeight || 720;
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-canvas-context");
  // No mirroring: the preview may be mirrored, the capture never is.
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("encode-failed"))),
      "image/jpeg",
      quality,
    );
  });
}

/** Encode a canvas as a JPEG <= 300 KB, walking quality 0.9 -> 0.5. */
export async function compressCanvas(canvas: HTMLCanvasElement): Promise<{ blob: Blob; base64: string; objectUrl: string }> {
  const qualities = [0.9, 0.8, 0.7, 0.6, 0.5];
  let blob: Blob | null = null;
  for (const q of qualities) {
    blob = await canvasToJpeg(canvas, q);
    if (blob.size <= MAX_BYTES) break;
  }
  if (!blob) throw new Error("encode-failed");
  const objectUrl = URL.createObjectURL(blob);
  const base64 = await blobToBase64(blob);
  return { blob, base64, objectUrl };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(blob);
  });
}

/** Capture the live frame and compress it. */
export async function capturePhoto(video: HTMLVideoElement): Promise<CapturedPhoto> {
  const canvas = drawVideoFrame(video);
  const { blob, base64, objectUrl } = await compressCanvas(canvas);
  return { blob, base64, objectUrl, mimeType: "image/jpeg" };
}

export function revokeObjectUrl(url: string | null | undefined) {
  if (url) URL.revokeObjectURL(url);
}
