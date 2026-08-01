/**
 * Compresses an image file entirely in the browser before upload — no
 * server round-trip, no external library. This matters for two real
 * reasons: it keeps Supabase Storage usage down (the free tier is 1GB),
 * and it saves the person's own mobile data on the upload itself, which
 * matters a lot more here than it would for a typical office-wifi user.
 *
 * Approach: draw the image onto a canvas at a capped max dimension, then
 * re-encode as JPEG. If the result is still larger than the target size,
 * step the quality down a couple of times before giving up and returning
 * whatever the best attempt produced.
 */

interface CompressOptions {
  /** Longest side gets capped to this many pixels; aspect ratio preserved. */
  maxDimension?: number;
  /** Starting JPEG quality, 0–1. */
  quality?: number;
  /** If the compressed result is still bigger than this, try a lower quality pass. */
  targetMaxBytes?: number;
}

export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  const { maxDimension = 1600, quality = 0.8, targetMaxBytes = 800 * 1024 } = options;

  // Skip compression entirely for anything that isn't a raster image we
  // can safely redraw (e.g. someone somehow picks a non-image file — the
  // file input is already filtered to image/*, but this is a cheap guard).
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // decoding failed — fall back to the original rather than losing the upload

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Try progressively lower quality until we're under the target size or
  // run out of steps to try.
  const qualitySteps = [quality, 0.6, 0.45];
  let bestBlob: Blob | null = null;

  for (const q of qualitySteps) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", q)
    );
    if (!blob) continue;
    bestBlob = blob;
    if (blob.size <= targetMaxBytes) break;
  }

  if (!bestBlob) return file; // canvas encoding failed entirely — fall back to original

  // Only use the compressed version if it's actually smaller — for
  // already-small or already-compressed images, re-encoding can
  // sometimes come out larger, in which case just keep the original.
  if (bestBlob.size >= file.size) return file;

  const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([bestBlob], newName, { type: "image/jpeg" });
}

/** Compresses a batch of files in parallel. */
export async function compressImages(files: File[], options?: CompressOptions): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, options)));
}
