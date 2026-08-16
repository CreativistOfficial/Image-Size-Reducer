import { ShieldCheck, ImageIcon } from 'lucide-react';
import Compressor from '@/components/Compressor';
import {
  Benefits,
  Faq,
  Footer,
  HowItWorks,
  Privacy,
  TargetSizes,
  UseCases,
} from '@/components/Sections';

export default function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <a href="#top" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <ImageIcon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span className="font-semibold tracking-tight text-slate-900">Image Size Reducer</span>
          </a>
          <nav className="hidden gap-6 text-sm font-medium text-slate-600 sm:flex">
            <a href="#how-it-works" className="hover:text-slate-900">How it works</a>
            <a href="#why" className="hover:text-slate-900">Why use it</a>
            <a href="#faq" className="hover:text-slate-900">FAQ</a>
          </nav>
        </div>
      </header>

      {/* Hero + Tool */}
      <section id="top" className="relative overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-12 text-center sm:pt-16">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Compress Images to a Specific Size
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
            Reduce JPG, PNG, and WebP images to 100 KB, 200 KB, 500 KB, 1 MB, or a custom
            maximum size — directly in your browser.
          </p>
          <p className="mx-auto mt-3 flex max-w-xl items-center justify-center gap-2 text-sm font-medium text-green-700">
            <ShieldCheck className="h-4 w-4" />
            Your images stay on your device. Image processing happens directly in your browser.
          </p>
        </div>

        {/* Tool card */}
        <div className="mx-auto w-full max-w-6xl px-4 pb-16">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-6">
            <Compressor />
          </div>
        </div>
      </section>

      <HowItWorks />
      <Benefits />
      <UseCases />
      <TargetSizes/>
      <Faq />
      <Privacy />
      <Footer />
    </div>
  );
}
