/**
 * Lightweight, privacy-respecting analytics shim.
 *
 * Cloudflare Web Analytics is a free, privacy-friendly, cookie-free solution.
 * To enable it, add your Cloudflare Web Analytics beacon token to the script
 * placeholder in index.html (search for "CLOUDFLARE_WEB_ANALYTICS_TOKEN").
 *
 * Custom events (tool_usage, compress_started, etc.) are collected locally
 * in this array so you can later forward them to any analytics provider.
 * Nothing is sent automatically except the beacon page view (once enabled).
 * No image data, filenames, or personal information is ever tracked.
 */

export type AnalyticsEvent =
  | { type: 'tool_usage' }
  | { type: 'compress_started'; target_kb: number; format: string }
  | { type: 'compress_completed'; original_kb: number; compressed_kb: number; ms: number; format: string }
  | { type: 'compress_failed'; reason: string }
  | { type: 'download_clicked'; format: string; compressed_kb: number };

export function track(event: AnalyticsEvent): void {
  try {
    const w = window as unknown as {
      __isa_events?: AnalyticsEvent[];
      gtag?: (...args: unknown[]) => void;
    };

    // Keep the local event log
    if (!w.__isa_events) w.__isa_events = [];
    w.__isa_events.push(event);

    // Send event to Google Analytics
    if (typeof w.gtag === 'function') {
      const { type, ...params } = event;

      w.gtag('event', type, params);
    }
  } catch {
    // Analytics must never break the app
  }
}
