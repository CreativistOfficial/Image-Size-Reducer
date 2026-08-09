export function formatBytes(bytes: number, digits = 1): string {
  if (!bytes || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  const d = i === 0 ? 0 : digits;
  return `${value.toFixed(d)} ${units[i]}`;
}

export function reductionPct(original: number, compressed: number): number {
  if (original <= 0) return 0;
  return Math.max(0, (1 - compressed / original) * 100);
}

export function baseName(filename: string): string {
  const dot = filename.lastIndexOf('.');
  const slash = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'));
  const base = slash >= 0 ? filename.slice(slash + 1) : filename;
  return dot > slash ? base.slice(0, dot) : base;
}

export function extForFormat(format: 'image/jpeg' | 'image/webp' | 'image/png'): string {
  if (format === 'image/webp') return 'webp';
  if (format === 'image/png') return 'png';
  return 'jpg';
}

export function labelForFormat(format: 'image/jpeg' | 'image/webp' | 'image/png'): string {
  if (format === 'image/webp') return 'WebP';
  if (format === 'image/png') return 'PNG';
  return 'JPG';
}

export function compressedFilename(
  originalName: string,
  format: 'image/jpeg' | 'image/webp' | 'image/png'
): string {
  const base = baseName(originalName) || 'image';
  return `${base}-compressed.${extForFormat(format)}`;
}
