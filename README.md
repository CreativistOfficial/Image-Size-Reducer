# Image Size Reducer

Compress any JPG, PNG, or WebP image to a specific maximum file size — **100 KB, 200 KB, 500 KB, 1 MB, or a custom size** — entirely in the browser.

No backend. No database. No accounts. No uploads. Your images never leave your device.

## What it does

A single-page utility that lets a user:

1. Upload an image (drag-and-drop or file picker).
2. Choose a target maximum file size.
3. Compress the image locally and download the result.

Typical use cases: online applications, government forms, university/job applications, passport and photo uploads, email attachments, and any site with a file-size restriction.

## How it works

All processing happens client-side using the browser's native Canvas API. The image is loaded into an `<img>` element, drawn onto a `<canvas>`, and re-encoded as WebP at progressively lower quality levels and (if needed) smaller dimensions until the output is at or below the requested target size. No image data is ever sent over the network.

Output format is **WebP** (`.webp`) because it offers the best compression among formats supported by all modern browsers and preserves transparency.

## Run it locally

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

## Deploy to Cloudflare Pages

This is a static site — build it and serve the `dist/` folder.

### Option A — Git integration (recommended)

1. Push this repo to GitHub/GitLab.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**.
3. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Deploy. Cloudflare builds and hosts it automatically on every push.

### Option B — Direct upload

```bash
npm run build
```

Then upload the `dist/` folder via **Cloudflare Pages → Create → Direct Upload**.

No environment variables are required for core functionality.

## Add Cloudflare Web Analytics

1. Sign up at https://cloudflare.com/web-analytics (free, cookie-free).
2. Add your site and copy the beacon token from the generated snippet.
3. In `index.html`, find the commented-out `<script>` block labelled
   `CLOUDFLARE WEB ANALYTICS` and replace `CLOUDFLARE_WEB_ANALYTICS_TOKEN`
   with your token, then uncomment it.

The beacon records anonymous page views only. Custom tool events
(compress started, completed, download clicked, selected target size) are
collected in `src/lib/analytics.ts` and exposed on `window.__isa_events` for
optional forwarding to another provider. No image data or personal
information is ever tracked.

## Main compression logic

| File | Purpose |
| --- | --- |
| `src/lib/compressor.ts` | Core compression engine — loads the image, sweeps quality and dimensions, encodes via Canvas. |
| `src/lib/format.ts` | Helpers for formatting file sizes, computing reduction %, and building output filenames. |
| `src/lib/analytics.ts` | Privacy-friendly analytics shim and custom-event tracking. |
| `src/components/Compressor.tsx` | The tool UI — upload, target-size controls, progress, result, download. |

## Change the supported target sizes

Open `src/components/Compressor.tsx` and edit the `TARGETS` array:

```ts
const TARGETS: { id: TargetId; label: string; bytes: number }[] = [
  { id: '100KB', label: '100 KB', bytes: 100 * 1024 },
  { id: '200KB', label: '200 KB', bytes: 200 * 1024 },
  { id: '500KB', label: '500 KB', bytes: 500 * 1024 },
  { id: '1MB',  label: '1 MB',   bytes: 1024 * 1024 },
];
```

Add or remove entries, and update the `TargetId` union type accordingly. The custom-size input always lets users enter any value in KB.
