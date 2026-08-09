export type CompressFormat = 'image/jpeg' | 'image/webp' | 'image/png';

export type FormatChoice = 'auto' | CompressFormat;

export interface CompressResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  format: CompressFormat;
  attempts: number;
  quality: number;
}

export interface CompressParams {
  file: File;
  targetBytes: number;
  format: CompressFormat;
  maxDimension?: number;
  onProgress?: (pct: number, label: string) => void;
}

export class CompressError extends Error {
  userMessage: string;
  constructor(userMessage: string, detail?: string) {
    super(detail || userMessage);
    this.userMessage = userMessage;
  }
}

const MAX_DIMENSION = 8000;
const SAFETY_MARGIN = 0.97;

const yieldFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () =>
        reject(new CompressError('We couldn\'t read this image. It may be corrupted or in an unsupported format.'));
      el.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function fitDimensions(w: number, h: number, maxLong: number): [number, number] {
  const longest = Math.max(w, h);
  if (longest <= maxLong) return [w, h];
  const scale = maxLong / longest;
  return [Math.round(w * scale), Math.round(h * scale)];
}

async function encode(
  img: HTMLImageElement,
  width: number,
  height: number,
  format: CompressFormat,
  quality: number
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new CompressError('Your browser could not create an image canvas. Please try a different browser.');
  }
  // White background for JPEG (no alpha channel). PNG/WebP may keep transparency.
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);
  return await new Promise<Blob>((resolve, reject) => {
    // PNG ignores the quality argument — it is always lossless.
    const q = format === 'image/png' ? undefined : quality;
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new CompressError('Your browser failed to encode the image. Please try again.'));
      },
      format,
      q
    );
  });
}

/**
 * Compress an image to at or below targetBytes, adjusting quality then
 * dimensions. Works entirely in the browser — the file is never uploaded.
 * For PNG (lossless), only dimensions are reduced since quality is fixed.
 */
export async function compressImage({
  file,
  targetBytes,
  format,
  maxDimension = MAX_DIMENSION,
  onProgress,
}: CompressParams): Promise<CompressResult> {
  if (targetBytes <= 0) {
    throw new CompressError('Please enter a target size greater than 0 KB.');
  }

  onProgress?.(5, 'Loading image…');
  const img = await loadImage(file);
  await yieldFrame();

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;
  if (!origW || !origH) {
    throw new CompressError('This image appears to be invalid or empty.');
  }

  const [initW, initH] = fitDimensions(origW, origH, maxDimension);

  const isLossless = format === 'image/png';
  // Quality sweep only applies to lossy formats (JPEG, WebP).
  const qualities = isLossless
    ? [1]
    : [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1, 0.07, 0.05, 0.03];
  const downscaleSteps = [1.0, 0.85, 0.7, 0.55, 0.4, 0.3, 0.2];

  let best: { blob: Blob; w: number; h: number; q: number } | null = null;
  let attempts = 0;
  const targetWithMargin = targetBytes * SAFETY_MARGIN;
  const totalAttempts = qualities.length * downscaleSteps.length;

  for (let d = 0; d < downscaleSteps.length; d++) {
    const w = Math.max(1, Math.round(initW * downscaleSteps[d]));
    const h = Math.max(1, Math.round(initH * downscaleSteps[d]));
    for (const q of qualities) {
      attempts++;
      onProgress?.(
        Math.min(95, 10 + Math.round((attempts / totalAttempts) * 80)),
        isLossless
          ? `Compressing… ${w}×${h}`
          : `Compressing… ${Math.round(q * 100)}% quality · ${w}×${h}`
      );
      const blob = await encode(img, w, h, format, q);
      await yieldFrame();
      if (blob.size <= targetWithMargin) {
        const url = URL.createObjectURL(blob);
        return { blob, url, width: w, height: h, format, attempts, quality: q };
      }
      if (!best || blob.size < best.blob.size) {
        best = { blob, w, h, q };
      }
    }
  }

  if (!best) {
    throw new CompressError('We couldn\'t compress this image. Please try a different image or target size.');
  }
  const url = URL.createObjectURL(best.blob);
  return { blob: best.blob, url, width: best.w, height: best.h, format, attempts, quality: best.q };
}

export function isCompressible(blob: Blob, targetBytes: number): boolean {
  return blob.size <= targetBytes;
}

/**
 * Map an input file's MIME type to a default output CompressFormat.
 * Used when the user leaves the format selector on "Same as input".
 */
export function defaultFormatForFile(file: File): CompressFormat {
  const t = file.type.toLowerCase();
  if (t === 'image/png') return 'image/png';
  if (t === 'image/webp') return 'image/webp';
  // Treat JPEG, JPG, and unknown raster as JPEG.
  return 'image/jpeg';
}
