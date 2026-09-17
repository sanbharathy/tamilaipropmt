'use client';

import { useMemo, useState } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';

import { AdsenseSlot } from '@/components/adsense-slot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Ratio = 'square' | 'portrait' | 'landscape';

const starterPrompts = [
  {
    label: 'Meenakshi Kumbabishekam',
    prompt:
      'Respectful devotional festival portrait concept at Madurai Meenakshi Amman Temple kumbabishekam celebration, temple gopuram in the distance, festive crowd energy, turmeric and kumkum colors, flower petals, soft morning golden light, cinematic Tamil cultural mood, no deity face recreation, no real crowd face copying, add small clean “tamilaiprompt.com” watermark bottom-right',
  },
  {
    label: '90s Saree Portrait',
    prompt:
      '1990s South Indian retro saree portrait, jasmine flowers, warm wall shadow, golden side light, natural skin texture, calm cinematic expression, subtle film grain, premium Instagram portrait look, add small clean “tamilaiprompt.com” watermark bottom-right',
  },
  {
    label: 'Tamil Hero Poster',
    prompt:
      'Tamil cinema fan poster style portrait concept, dramatic theatre banner lighting, red and gold color grading, heroic natural pose, painted poster texture, celebration crowd energy, no real actor face, add small clean “tamilaiprompt.com” watermark bottom-right',
  },
];

const ratioSize: Record<Ratio, { width: number; height: number; label: string }> = {
  square: { width: 1024, height: 1024, label: '1:1 Post' },
  portrait: { width: 768, height: 1344, label: '9:16 Reel' },
  landscape: { width: 1344, height: 768, label: '16:9 Cover' },
};

function buildPollinationsUrl(prompt: string, ratio: Ratio, seed: number) {
  const size = ratioSize[ratio];
  const safePrompt = `${prompt.trim()} high quality, realistic, sharp details, social media ready`;
  const params = new URLSearchParams({
    width: String(size.width),
    height: String(size.height),
    seed: String(seed),
    model: 'flux',
    nologo: 'true',
    private: 'true',
    safe: 'true',
    enhance: 'true',
  });

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(safePrompt)}?${params.toString()}`;
}

export function RealtimePhotoGenerator() {
  const [prompt, setPrompt] = useState(() => {
    if (typeof window === 'undefined') {
      return starterPrompts[0].prompt;
    }

    const params = new URLSearchParams(window.location.search);
    const promptFromUrl = params.get('prompt');
    return promptFromUrl?.trim() ? promptFromUrl.slice(0, 1600) : starterPrompts[0].prompt;
  });
  const [ratio, setRatio] = useState<Ratio>('portrait');
  const [seed, setSeed] = useState(20260917);
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const nextUrl = useMemo(() => buildPollinationsUrl(prompt, ratio, seed), [prompt, ratio, seed]);

  function generateImage() {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setImageUrl(nextUrl);
  }

  function remixImage() {
    const nextSeed = Math.floor(Math.random() * 2_000_000_000);
    setSeed(nextSeed);
    setIsLoading(true);
    window.setTimeout(() => setImageUrl(buildPollinationsUrl(prompt, ratio, nextSeed)), 0);
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,oklch(0.89_0.1_305/.6),transparent_28%),radial-gradient(circle_at_90%_45%,oklch(0.92_0.08_85/.5),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to prompts
          </Link>
          <div className="grid gap-8 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1.5 text-xs font-bold text-primary shadow-sm backdrop-blur">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-70 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-2 rounded-full bg-accent" />
                </span>
                Realtime AI photo maker
              </div>
              <h1 className="mt-5 font-heading text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Create instant AI photos from Tamil trend prompts.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Paste any TamilAI Prompt, choose a social-media ratio, and generate a preview photo in seconds. Best for thumbnails, trend previews, reel covers, and content ideas.
              </p>
              <div className="mt-5 rounded-2xl border border-amber-300/40 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                <strong>Note:</strong> This instant generator is text-to-image. For exact face replacement, copy the prompt and use Gemini or ChatGPT Images with your uploaded photo.
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-4 shadow-[0_24px_80px_-44px_oklch(0.35_0.12_305/.45)] sm:p-5">
              <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-[1.5rem] bg-[linear-gradient(135deg,oklch(0.22_0.06_300),oklch(0.36_0.1_35))]">
                {imageUrl ? (
                  <NextImage
                    src={imageUrl}
                    alt="Generated preview"
                    fill
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="object-cover"
                    unoptimized
                    onLoad={() => setIsLoading(false)}
                    onError={() => setIsLoading(false)}
                  />
                ) : (
                  <div className="px-8 text-center text-white">
                    <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-white/14 backdrop-blur">
                      <ImageIcon className="size-9" aria-hidden="true" />
                    </div>
                    <p className="mt-5 font-heading text-2xl font-black">Your realtime photo appears here</p>
                    <p className="mt-2 text-sm leading-6 text-white/72">Start with the Meenakshi Kumbabishekam prompt or paste your own.</p>
                  </div>
                )}
                {isLoading ? (
                  <div className="absolute inset-0 grid place-items-center bg-black/45 text-white backdrop-blur-sm">
                    <div className="text-center">
                      <Sparkles className="mx-auto size-9 animate-pulse" aria-hidden="true" />
                      <p className="mt-3 text-sm font-bold">Generating photo…</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <AdsenseSlot name="prompt-inline" className="py-6" />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.75fr]">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-[0_14px_44px_-32px_oklch(0.25_0.08_300/.35)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Prompt</p>
              <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight">Write or paste your photo idea</h2>
            </div>
            <Button variant="outline" className="h-11 cursor-pointer rounded-xl" onClick={copyPrompt}>
              <Copy className="size-4" aria-hidden="true" />
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {starterPrompts.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setPrompt(item.prompt);
                  setImageUrl('');
                }}
                className="min-h-10 rounded-full border border-primary/20 bg-primary/5 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                {item.label}
              </button>
            ))}
          </div>

          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={8}
            className="mt-5 min-h-56 rounded-2xl border-border bg-background text-sm leading-6"
            placeholder="Describe the photo you want to create..."
          />

          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_180px]">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Social ratio</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(ratioSize) as Ratio[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setRatio(key);
                      setImageUrl('');
                    }}
                    className={`min-h-12 rounded-2xl border px-3 text-sm font-bold transition-colors ${
                      ratio === key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {ratioSize[key].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="seed" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Seed
              </label>
              <Input id="seed" type="number" value={seed} onChange={(event) => setSeed(Number(event.target.value) || 0)} className="h-12 rounded-2xl" />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button className="h-12 flex-1 cursor-pointer rounded-2xl text-base font-black" onClick={generateImage} disabled={!prompt.trim()}>
              <Wand2 className="size-5" aria-hidden="true" />
              Generate realtime photo
            </Button>
            <Button variant="outline" className="h-12 cursor-pointer rounded-2xl" onClick={remixImage} disabled={!prompt.trim()}>
              <RefreshCcw className="size-4" aria-hidden="true" />
              Remix
            </Button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-[0_14px_44px_-32px_oklch(0.25_0.08_300/.35)]">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-heading text-lg font-bold">Safe creator workflow</h2>
                <p className="text-sm text-muted-foreground">Private + safe image URL parameters are enabled.</p>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
              <li>• Do not generate misleading news photos.</li>
              <li>• Do not copy real devotees, celebrities, or private people.</li>
              <li>• Add “tamilaiprompt.com” watermark for website marketing.</li>
              <li>• Use the result as a draft/thumbnail, then refine in your main AI tool.</li>
            </ul>
          </div>

            {imageUrl ? (
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5">
              <h2 className="font-heading text-lg font-bold">Generated image actions</h2>
              <div className="mt-4 grid gap-3">
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/80"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Open full image
                </a>
                <a
                  href={imageUrl}
                  download="tamilaiprompt-ai-photo.jpg"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-bold transition-colors hover:bg-muted"
                >
                  <Download className="size-4" aria-hidden="true" />
                  Download image
                </a>
              </div>
            </div>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
