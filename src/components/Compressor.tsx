import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Download,
  ImageIcon,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';
import {
  compressImage,
  CompressError,
  defaultFormatForFile,
  type CompressFormat,
  type CompressResult,
  type FormatChoice,
} from '@/lib/compressor';
import {
  compressedFilename,
  formatBytes,
  labelForFormat,
  reductionPct,
} from '@/lib/format';
import { track } from '@/lib/analytics';

type TargetId = '100KB' | '200KB' | '500KB' | '1MB' | 'custom';

type OutputFormatId = 'auto' | 'jpeg' | 'webp' | 'png';

const OUTPUT_FORMATS: { id: OutputFormatId; label: string; format: FormatChoice }[] = [
  { id: 'jpeg', label: 'JPG', format: 'image/jpeg' },
  { id: 'webp', label: 'WebP', format: 'image/webp' },
  { id: 'png', label: 'PNG', format: 'image/png' },
  { id: 'auto', label: 'Same as input', format: 'auto' },
];

const PNG_SMALL_TARGET_BYTES = 500 * 1024;

const TARGETS: { id: TargetId; label: string; bytes: number }[] = [
  { id: '100KB', label: '100 KB', bytes: 100 * 1024 },
  { id: '200KB', label: '200 KB', bytes: 200 * 1024 },
  { id: '500KB', label: '500 KB', bytes: 500 * 1024 },
  { id: '1MB', label: '1 MB', bytes: 1024 * 1024 },
];

const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ACCEPT_ATTR = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
const MAX_INPUT_BYTES = 50 * 1024 * 1024; // 50 MB safety guard for browser memory

type Stage = 'idle' | 'ready' | 'compressing' | 'done' | 'error';

interface LoadedImage {
  file: File;
  url: string;
  width: number;
  height: number;
}

export default function Compressor() {
  const [stage, setStage] = useState<Stage>('idle');
  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const [targetId, setTargetId] = useState<TargetId>('200KB');
  const [customKb, setCustomKb] = useState<string>('250');
  const [formatId, setFormatId] = useState<OutputFormatId>('jpeg');
  const [result, setResult] = useState<CompressResult | null>(null);
  const [progress, setProgress] = useState<{ pct: number; label: string }>({ pct: 0, label: '' });
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const [missedTarget, setMissedTarget] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultUrlRef = useRef<string | null>(null);
  const loadedUrlRef = useRef<string | null>(null);

  const targetBytes = (() => {
    if (targetId === 'custom') {
      const n = Number(customKb);
      return Number.isFinite(n) && n > 0 ? n * 1024 : 0;
    }
    return TARGETS.find((t) => t.id === targetId)?.bytes ?? 0;
  })();

  const pngWarning = useMemo(() => {
    if (!loaded) return null;
    if (formatId !== 'png' && !(formatId === 'auto' && loaded.file.type === 'image/png')) return null;
    if (targetBytes <= PNG_SMALL_TARGET_BYTES) {
      return `PNG is lossless, so reaching ${formatBytes(targetBytes)} requires shrinking the image's dimensions significantly — fine details may look blocky. For small targets, JPG or WebP usually gives a much better-looking result.`;
    }
    return null;
  }, [loaded, formatId, targetBytes]);

  const cleanupUrls = useCallback(() => {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
    if (loadedUrlRef.current) {
      URL.revokeObjectURL(loadedUrlRef.current);
      loadedUrlRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanupUrls(), [cleanupUrls]);

  const resetAll = useCallback(() => {
    cleanupUrls();
    setLoaded(null);
    setResult(null);
    setErrorMsg('');
    setProgress({ pct: 0, label: '' });
    setMissedTarget(false);
    setFormatId('jpeg');
    setStage('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [cleanupUrls]);

  const compressAnother = useCallback(() => {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
    setResult(null);
    setMissedTarget(false);
    setStage('ready');
  }, []);

  const handleFile = useCallback((file: File) => {
    const type = file.type.toLowerCase();
    const okType =
      ACCEPTED.includes(type) ||
      /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!okType) {
      setErrorMsg('Unsupported file type. Please choose a JPG, PNG, or WebP image.');
      setStage('error');
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setErrorMsg('This image is too large for your browser to process. Please try a smaller image (under 50 MB).');
      setStage('error');
      return;
    }
    const url = URL.createObjectURL(file);
    if (loadedUrlRef.current) URL.revokeObjectURL(loadedUrlRef.current);
    loadedUrlRef.current = url;
    const img = new Image();
    img.onload = () => {
      setLoaded({ file, url, width: img.naturalWidth, height: img.naturalHeight });
      setResult(null);
      setMissedTarget(false);
      setErrorMsg('');
      setFormatId('jpeg');
      setStage('ready');
      track({ type: 'tool_usage' });
    };
    img.onerror = () => {
      setErrorMsg('We couldn\'t read this image. It may be corrupted or unsupported.');
      setStage('error');
      URL.revokeObjectURL(url);
      loadedUrlRef.current = null;
    };
    img.src = url;
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Don't reset value here — resetAll handles it; allows re-pick of same file.
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDownload = () => {
    if (!result || !loaded) return;
    track({
      type: 'download_clicked',
      format: result.format,
      compressed_kb: Math.round(result.blob.size / 1024),
    });
    const a = document.createElement('a');
    a.href = result.url;
    a.download = compressedFilename(loaded.file.name, result.format);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const startCompress = async () => {
    if (!loaded || targetBytes <= 0) return;
    setStage('compressing');
    setProgress({ pct: 2, label: 'Starting…' });
    setResult(null);
    setMissedTarget(false);
    const start = performance.now();

    const choice = OUTPUT_FORMATS.find((f) => f.id === formatId)?.format ?? 'auto';
    const format: CompressFormat =
      choice === 'auto' ? defaultFormatForFile(loaded.file) : choice;

    track({ type: 'compress_started', target_kb: Math.round(targetBytes / 1024), format });

    try {
      const res = await compressImage({
        file: loaded.file,
        targetBytes,
        format,
        onProgress: (pct, label) => setProgress({ pct, label }),
      });
      const elapsed = performance.now() - start;
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = res.url;
      setResult(res);
      const missed = res.blob.size > targetBytes;
      setMissedTarget(missed);
      setStage('done');
      track({
        type: 'compress_completed',
        original_kb: Math.round(loaded.file.size / 1024),
        compressed_kb: Math.round(res.blob.size / 1024),
        ms: Math.round(elapsed),
        format: res.format,
      });
    } catch (err) {
      const msg =
        err instanceof CompressError ? err.userMessage
        : err instanceof Error ? err.message
        : 'Something went wrong while compressing your image. Please try again.';
      setErrorMsg(msg);
      setStage('error');
      track({ type: 'compress_failed', reason: msg });
    }
  };

  // ---- IDLE / ERROR (no image loaded) ----
  if (stage === 'idle' || (stage === 'error' && !loaded)) {
    return (
      <div className="w-full">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors sm:py-20 ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:border-blue-400'
          }`}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Upload className="h-8 w-8" strokeWidth={1.75} />
          </div>
          <p className="text-lg font-semibold text-slate-800">Drop your image here</p>
          <p className="mt-1 text-sm text-slate-500">or</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <ImageIcon className="h-5 w-5" strokeWidth={1.75} />
            Choose Image
          </button>
          <p className="mt-5 text-xs font-medium text-slate-400">
            Supported formats: JPG, JPEG, PNG, WebP
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_ATTR}
            onChange={onInputChange}
            className="sr-only"
          />
        </div>
        {stage === 'error' && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    );
  }

  // ---- ERROR with image loaded (e.g. compress failed) ----
  if (stage === 'error' && loaded) {
    return (
      <div className="w-full">
        <PreviewCard loaded={loaded} />
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => { setErrorMsg(''); setStage('ready'); }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <X className="h-4 w-4" /> Choose Another Image
          </button>
        </div>
      </div>
    );
  }

  if (!loaded) return null;

  // ---- READY / COMPRESSING / DONE (image loaded) ----
  return (
    <div className="w-full">
      <div className="grid gap-6 md:grid-cols-2">
        <PreviewCard loaded={loaded} resultUrl={result?.url} />

        <div className="flex flex-col">
          <h3 className="text-base font-semibold text-slate-800">Choose target size</h3>
          <p className="mt-1 text-sm text-slate-500">
            We'll compress your image to stay at or below this size.
          </p>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {TARGETS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTargetId(t.id)}
                className={`rounded-lg border px-2 py-2.5 text-sm font-semibold transition ${
                  targetId === t.id
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="target"
              className="h-4 w-4 accent-blue-600"
              checked={targetId === 'custom'}
              onChange={() => setTargetId('custom')}
            />
            <span className="font-medium text-slate-700">Custom maximum size</span>
          </label>
          <div
            className={`mt-2 flex items-center gap-2 rounded-lg border px-3 py-2 transition ${
              targetId === 'custom' ? 'border-blue-500 bg-blue-50/40' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={customKb}
              onChange={(e) => setCustomKb(e.target.value)}
              disabled={targetId !== 'custom'}
              className="w-28 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none disabled:opacity-50"
              aria-label="Custom maximum size in KB"
            />
            <span className="text-sm font-medium text-slate-600">KB</span>
            {targetId === 'custom' && Number(customKb) <= 0 && (
              <span className="text-xs text-red-600">Enter a size greater than 0</span>
            )}
          </div>

          <div className="mt-5">
            <h4 className="text-sm font-semibold text-slate-800">Output format</h4>
            <p className="mt-1 text-xs text-slate-500">
              JPG gives the smallest files. WebP balances size and quality. PNG is lossless but larger. Use “Same as input” to keep your original format.
            </p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {OUTPUT_FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormatId(f.id)}
                  className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                    formatId === f.id
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {pngWarning && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{pngWarning}</span>
              </div>
            )}
          </div>

          <div className="mt-6">
            {stage === 'compressing' ? (
              <button
                disabled
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white opacity-80"
              >
                <Loader2 className="h-5 w-5 animate-spin" />
                Compressing…
              </button>
            ) : stage === 'done' ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={onDownload}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Download className="h-5 w-5" />
                  Download Compressed Image
                </button>
                <button
                  type="button"
                  onClick={compressAnother}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4" /> Compress Another
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startCompress}
                disabled={targetBytes <= 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Compress Image
              </button>
            )}
          </div>

          {stage === 'compressing' && (
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">{progress.label}</p>
            </div>
          )}

          {stage === 'done' && result && loaded && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Compression Complete</span>
              </div>
              <dl className="mt-3 space-y-1.5 text-sm">
                <Row label="Original" value={formatBytes(loaded.file.size)} />
                <Row label="Compressed" value={formatBytes(result.blob.size)} highlight />
                <Row label="Reduction" value={`${reductionPct(loaded.file.size, result.blob.size).toFixed(1)}%`} />
                <Row label="Output" value={`${result.width} × ${result.height} · ${labelForFormat(result.format)}`} />
              </dl>
              {missedTarget && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  We couldn't reach {formatBytes(targetBytes)} without severely reducing image quality.
                  The smallest achievable result is shown. Try a larger target size for better quality.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {stage !== 'compressing' && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <X className="h-4 w-4" /> Choose a different image
          </button>
        </div>
      )}
    </div>
  );
}

function PreviewCard({
  loaded,
  resultUrl,
}: {
  loaded: LoadedImage;
  resultUrl?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-center overflow-hidden rounded-xl bg-slate-50" style={{ minHeight: 180 }}>
        <img
          src={resultUrl ?? loaded.url}
          alt={resultUrl ? 'Compressed image preview' : 'Original image preview'}
          className="max-h-64 w-auto max-w-full object-contain"
        />
      </div>
      <dl className="mt-3 space-y-1 text-sm">
        <Row label="Filename" value={loaded.file.name} />
        <Row label="Original size" value={formatBytes(loaded.file.size)} />
        <Row label="Dimensions" value={`${loaded.width} × ${loaded.height}`} />
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`font-medium ${highlight ? 'text-blue-700' : 'text-slate-800'} truncate`}>
        {highlight && <Check className="mr-1 inline h-3.5 w-3.5 text-blue-600" />}
        {value}
      </dd>
    </div>
  );
}
