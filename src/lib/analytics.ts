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
    // Cloudflare Web Analytics only records page views automatically via the
    // beacon script. Custom events are not natively supported, so we expose
    // them on window for optional forwarding to another provider.
    const w = window as unknown as { __isa_events?: AnalyticsEvent[] };
    if (!w.__isa_events) w.__isa_events = [];
    w.__isa_events!.push(event);
    // Hook point: forward to your own collector here if desired.
  } catch {
    /* analytics must never break the app */
  }
}
