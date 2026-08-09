import {
  Download,
  ShieldCheck,
  Smartphone,
  Gauge,
  Wand2,
  Coins,
  Boxes,
  MonitorSmartphone,
} from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: Wand2,
      title: '1. Upload',
      body: 'Choose your JPG, PNG, or WebP image by dragging it in or tapping the button.',
    },
    {
      icon: Gauge,
      title: '2. Choose size',
      body: 'Select 100 KB, 200 KB, 500 KB, 1 MB, or enter a custom maximum size.',
    },
    {
      icon: Download,
      title: '3. Download',
      body: 'Download your compressed image instantly — ready to upload anywhere.',
    },
  ];
  return (
    <section id="how-it-works" className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
      <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        How it works
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-slate-500">
        Three simple steps. No accounts, no uploads, no waiting.
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {steps.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <s.icon className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Benefits() {
  const items = [
    { icon: Coins, title: 'Free to use', body: 'No cost, no limits, no hidden fees.' },
    { icon: ShieldCheck, title: 'Private by design', body: 'Images are processed in your browser and never uploaded.' },
    { icon: Boxes, title: 'No registration', body: 'No account, no email, no sign-up required.' },
    { icon: MonitorSmartphone, title: 'Works everywhere', body: 'Runs on phones, tablets, and desktops.' },
    { icon: Wand2, title: 'No installation', body: 'It\'s a web page — nothing to install.' },
    { icon: Gauge, title: 'Pick your size', body: 'Compress to 100 KB, 200 KB, 500 KB, 1 MB, or custom.' },
  ];
  return (
    <section id="why" className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Why use Image Size Reducer?
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <div key={i.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <i.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{i.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{i.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function UseCases() {
  const cases = [
    'Online applications',
    'Government forms',
    'University applications',
    'Job applications',
    'Passport & photo uploads',
    'Websites with file-size limits',
    'Email attachments',
    'Social media profiles',
  ];
  return (
    <section id="use-cases" className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
      <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Common use cases
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-slate-500">
        Whenever a form, site, or service asks for an image under a specific size limit.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {cases.map((c) => (
          <span
            key={c}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
          >
            {c}
          </span>
        ))}
      </div>
    </section>
  );
}

export function Faq() {
  const faqs = [
    {
      q: 'Are my images uploaded to a server?',
      a: 'No. All image processing happens directly in your browser. Your images never leave your device, and we do not store them anywhere.',
    },
    {
      q: 'What image formats are supported?',
      a: 'You can upload JPG, JPEG, PNG, and WebP images. Compressed output is produced in WebP, which offers strong compression and is supported by all modern browsers.',
    },
    {
      q: 'Can I compress an image to exactly 100 KB?',
      a: 'You can target 100 KB, 200 KB, 500 KB, 1 MB, or a custom size. The tool adjusts quality and dimensions to get at or below your target. Some images cannot be reduced to very small sizes without major quality loss — in that case you\'ll see the smallest achievable result and a suggestion to try a larger target.',
    },
    {
      q: 'Does it work on my phone?',
      a: 'Yes. The tool is designed mobile-first and works in modern mobile browsers on Android and iPhone. Use the "Choose Image" button to pick a photo from your device.',
    },
    {
      q: 'Is it really free?',
      a: 'Yes. There is no cost, no account, and no limit on how many images you compress.',
    },
    {
      q: 'Why is my PNG converted to WebP?',
      a: 'WebP produces much smaller files than PNG while preserving good quality and transparency. This makes it far easier to reach a specific file size. The downloaded file will have a .webp extension, which is accepted by most modern sites.',
    },
  ];
  return (
    <section id="faq" className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Frequently asked questions
        </h2>
        <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {faqs.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-left font-semibold text-slate-800 list-none">
                <span>{f.q}</span>
                <span className="text-slate-400 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Privacy() {
  return (
    <section id="privacy" className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Privacy</h2>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          We do not upload or store your images. All image processing happens directly in
          your browser using built-in browser capabilities. Your image data is never sent
          to any server, and nothing about your images is collected or transmitted.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          The only thing we may measure is anonymous usage counts (such as how often the
          tool is used) via a privacy-friendly, cookie-free analytics beacon. This never
          includes image content or personal information.
        </p>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-8 text-center">
        <div className="flex items-center gap-2 text-slate-700">
          <Smartphone className="h-5 w-5 text-blue-600" />
          <span className="font-semibold">Image Size Reducer</span>
        </div>
        <p className="text-xs text-slate-400">
          Compress any image to your exact size — directly in your browser. Free, private, no sign-up.
        </p>
        <p className="text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Image Size Reducer.
        </p>
      </div>
    </footer>
  );
}
