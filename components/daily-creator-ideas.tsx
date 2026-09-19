'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CloudSun,
  Copy,
  DollarSign,
  Hash,
  Image as ImageIcon,
  Lightbulb,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Video,
} from 'lucide-react';

import { AdsenseSlot } from '@/components/adsense-slot';
import { Button } from '@/components/ui/button';

type City = {
  id: string;
  name: string;
  ta: string;
  latitude: number;
  longitude: number;
};

type Niche = {
  id: string;
  label: string;
  ta: string;
  hashtags: string[];
  mood: string;
};

type WeatherState = {
  temperature: number;
  wind: number;
  code: number;
  rainChance: number | null;
};

type Holiday = {
  date: string;
  localName?: string;
  name: string;
};

type Rate = {
  code: string;
  inr: number;
};

const cities: City[] = [
  { id: 'chennai', name: 'Chennai', ta: 'சென்னை', latitude: 13.0827, longitude: 80.2707 },
  { id: 'madurai', name: 'Madurai', ta: 'மதுரை', latitude: 9.9252, longitude: 78.1198 },
  { id: 'coimbatore', name: 'Coimbatore', ta: 'கோயம்புத்தூர்', latitude: 11.0168, longitude: 76.9558 },
  { id: 'trichy', name: 'Trichy', ta: 'திருச்சி', latitude: 10.7905, longitude: 78.7047 },
  { id: 'jaffna', name: 'Jaffna', ta: 'யாழ்ப்பாணம்', latitude: 9.6615, longitude: 80.0255 },
  { id: 'singapore', name: 'Singapore', ta: 'சிங்கப்பூர்', latitude: 1.3521, longitude: 103.8198 },
  { id: 'dubai', name: 'Dubai', ta: 'துபாய்', latitude: 25.2048, longitude: 55.2708 },
];

const niches: Niche[] = [
  {
    id: 'ai-photo',
    label: 'AI photo trends',
    ta: 'AI படம் ட்ரெண்ட்ஸ்',
    hashtags: ['TamilAI', 'AIPhotoTrend', 'GeminiPrompt', 'TamilCreator', 'TamilReels'],
    mood: 'photorealistic, cinematic, clean social-media thumbnail',
  },
  {
    id: 'reels',
    label: 'Instagram reels',
    ta: 'Instagram Reels',
    hashtags: ['TamilReels', 'ReelsTamil', 'CreatorTamil', 'ViralReels', 'InstaTamil'],
    mood: 'fast hook, mobile-first, short-form creator energy',
  },
  {
    id: 'youtube',
    label: 'YouTube Shorts',
    ta: 'YouTube Shorts',
    hashtags: ['YouTubeShorts', 'TamilShorts', 'TamilYouTube', 'ShortsIndia', 'CreatorTips'],
    mood: 'curiosity hook, retention-focused, strong thumbnail idea',
  },
  {
    id: 'devotional',
    label: 'Devotional / festival',
    ta: 'பக்தி / விழா',
    hashtags: ['TamilDevotional', 'FestivalVibes', 'TamilCulture', 'TempleVibes', 'AIImagePrompt'],
    mood: 'respectful, warm, cultural, photorealistic devotional mood',
  },
  {
    id: 'business',
    label: 'Local business',
    ta: 'உள்ளூர் வணிகம்',
    hashtags: ['TamilBusiness', 'LocalBusiness', 'SmallBusinessIndia', 'DigitalMarketingTamil', 'BusinessReels'],
    mood: 'trust-building, offer-led, simple local business creative',
  },
  {
    id: 'cinema',
    label: 'Cinema fan content',
    ta: 'சினிமா fan content',
    hashtags: ['TamilCinema', 'Kollywood', 'FanPoster', 'TamilMovieFans', 'AIPoster'],
    mood: 'mass poster energy, dramatic light, no real actor face copying',
  },
];

const hooks = [
  'Stop scrolling — today’s trend is perfect for this look.',
  'If you post only one AI photo today, try this idea.',
  'Tamil creators, save this before the trend gets crowded.',
  'This is the easiest reel idea you can make today.',
  'Use this prompt today and change only your photo/style.',
  'Your next viral post can start from this one prompt.',
];

const tamilHooks = [
  'இன்றைக்கு இதை post பண்ணினா நல்ல reach கிடைக்கும்.',
  'இந்த trend miss பண்ணாதீங்க — prompt ready.',
  'Tamil creators, இந்த idea save பண்ணிக்கோங்க.',
  'ஒரே prompt-ல reel, photo, caption எல்லாம் ready.',
  'இன்று upload பண்ண ஒரு super content idea.',
  'இந்த prompt-ஐ copy பண்ணி உங்கள் photo-வுடன் try பண்ணுங்கள்.',
];

const visualStyles = [
  'golden-hour photorealistic photo',
  'cinematic mobile reel frame',
  'premium YouTube thumbnail composition',
  'soft natural-light portrait',
  'street-style documentary photo',
  'festival poster-style realistic photo',
  'clean product-ad photography',
];

const contentAngles = [
  'before/after transformation',
  'one prompt, three outputs',
  'creator mistake vs corrected prompt',
  'Tamil audience relatable scene',
  'today’s weather as the visual mood',
  'festival/culture angle with respectful styling',
  'caption hook test: emotional vs curiosity',
];

function getDaySeed(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

function pick<T>(items: T[], seed: number, offset = 0) {
  return items[(seed + offset) % items.length];
}

function getWeatherLabel(code: number) {
  if ([0, 1].includes(code)) return 'clear / sunny';
  if ([2, 3].includes(code)) return 'cloudy';
  if ([45, 48].includes(code)) return 'misty';
  if (code >= 51 && code <= 67) return 'drizzle';
  if (code >= 71 && code <= 77) return 'snowy';
  if (code >= 80 && code <= 99) return 'rainy';
  return 'fresh outdoor';
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function daysBetween(from: Date, date: string) {
  const target = new Date(`${date}T00:00:00+05:30`);
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.ceil((target.getTime() - start.getTime()) / 86_400_000);
}

function buildHashtags(niche: Niche, city: City) {
  const cityTags = city.id === 'singapore' || city.id === 'dubai'
    ? [city.name.replace(/\s/g, ''), 'TamilAbroad']
    : [city.name.replace(/\s/g, ''), 'TamilNadu'];
  return [...niche.hashtags, ...cityTags, 'TamilAIPrompt'].map((tag) => `#${tag}`).join(' ');
}

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export function DailyCreatorIdeas() {
  const [cityId, setCityId] = useState(cities[0].id);
  const [nicheId, setNicheId] = useState(niches[0].id);
  const [copied, setCopied] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);

  const today = useMemo(() => new Date(), []);
  const seed = useMemo(() => getDaySeed(today), [today]);
  const city = cities.find((item) => item.id === cityId) ?? cities[0];
  const niche = niches.find((item) => item.id === nicheId) ?? niches[0];
  const weatherMood = weather ? getWeatherLabel(weather.code) : 'fresh outdoor';
  const selectedHook = pick(hooks, seed, niches.findIndex((item) => item.id === niche.id));
  const selectedTamilHook = pick(tamilHooks, seed, cities.findIndex((item) => item.id === city.id));
  const style = pick(visualStyles, seed, 2);
  const angle = pick(contentAngles, seed, 4);
  const upcomingHoliday = holidays
    .map((holiday) => ({ ...holiday, days: daysBetween(today, holiday.date) }))
    .filter((holiday) => holiday.days >= 0)
    .sort((a, b) => a.days - b.days)[0];

  const festivalLine = upcomingHoliday
    ? `${upcomingHoliday.name}${upcomingHoliday.days === 0 ? ' is today' : ` in ${upcomingHoliday.days} day${upcomingHoliday.days === 1 ? '' : 's'}`}`
    : 'Use today’s local culture, weather or creator niche as the hook';

  const imagePrompt = `Create an ultra realistic ${style} for ${niche.label} in ${city.name}. Scene mood: ${weatherMood}, ${niche.mood}. Content angle: ${angle}. Include Tamil creator-friendly composition for Instagram/Reels/YouTube thumbnail, natural lighting, realistic details, mobile-first framing, no copyrighted logos, no real celebrity face copying, no misleading news claim. Add small clean “tamilaiprompt.com” watermark bottom-right.`;

  const reelScript = `${selectedHook}

Scene 1: Show the final AI visual/result for 1 second.
Scene 2: Show the prompt line: “${niche.label} + ${weatherMood} + ${city.name}”.
Scene 3: Show before/after or prompt/result split screen.
CTA: Copy this prompt from TamilAI Prompt and try with your own photo.`;

  const caption = `${selectedTamilHook}

Today’s idea: ${niche.label} for ${city.name}.
Hook: ${festivalLine}.
Try this as an AI image, reel cover, or YouTube Shorts thumbnail.

Prompt source: tamilaiprompt.com`;

  const youtubeIdea = `Title: ${city.name} ${niche.label}: Today’s AI prompt idea
Thumbnail text: TRY THIS TODAY
Shorts structure: result first → prompt reveal → 3 quick variations → ask viewers to comment their city.`;

  const hashtags = buildHashtags(niche, city);

  const dailyPack = `${formatDate(today)}

AI IMAGE PROMPT:
${imagePrompt}

REEL SCRIPT:
${reelScript}

CAPTION:
${caption}

YOUTUBE SHORTS IDEA:
${youtubeIdea}

HASHTAGS:
${hashtags}`;

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      setWeatherStatus('loading');
      try {
        const params = new URLSearchParams({
          latitude: String(city.latitude),
          longitude: String(city.longitude),
          current: 'temperature_2m,weather_code,wind_speed_10m',
          daily: 'precipitation_probability_max',
          timezone: 'Asia/Kolkata',
        });
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
        if (!response.ok) throw new Error('Weather unavailable');
        const data = await response.json() as {
          current?: { temperature_2m?: number; weather_code?: number; wind_speed_10m?: number };
          daily?: { precipitation_probability_max?: Array<number | null> };
        };
        if (!cancelled && data.current) {
          setWeather({
            temperature: Math.round(data.current.temperature_2m ?? 0),
            wind: Math.round(data.current.wind_speed_10m ?? 0),
            code: data.current.weather_code ?? 0,
            rainChance: data.daily?.precipitation_probability_max?.[0] ?? null,
          });
          setWeatherStatus('ready');
        }
      } catch {
        if (!cancelled) {
          setWeather(null);
          setWeatherStatus('error');
        }
      }
    }

    void loadWeather();
    return () => {
      cancelled = true;
    };
  }, [city.latitude, city.longitude]);

  useEffect(() => {
    let cancelled = false;

    async function loadHolidays() {
      try {
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${today.getFullYear()}/IN`);
        if (!response.ok) throw new Error('Holiday API unavailable');
        const data = await response.json() as Holiday[];
        if (!cancelled) setHolidays(data);
      } catch {
        if (!cancelled) setHolidays([]);
      }
    }

    async function loadRates() {
      const codes = ['USD', 'AED', 'SGD', 'MYR', 'GBP'];
      try {
        const values = await Promise.all(
          codes.map(async (code) => {
            const response = await fetch(`https://api.frankfurter.dev/v2/rate/${code}/INR`);
            if (!response.ok) throw new Error('Rate unavailable');
            const data = await response.json() as { rate?: number };
            return { code, inr: data.rate ?? 0 };
          }),
        );
        if (!cancelled) setRates(values.filter((item) => item.inr > 0));
      } catch {
        if (!cancelled) setRates([]);
      }
    }

    void loadHolidays();
    void loadRates();

    return () => {
      cancelled = true;
    };
  }, [today]);

  async function copyItem(key: string, text: string) {
    await copyToClipboard(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,oklch(0.9_0.1_305/.55),transparent_30%),radial-gradient(circle_at_88%_25%,oklch(0.93_0.08_85/.45),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to prompts
          </Link>

          <div className="grid gap-8 py-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1.5 text-xs font-bold text-primary shadow-sm backdrop-blur">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-70 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-2 rounded-full bg-accent" />
                </span>
                Daily creator ideas · Updated every visit
              </div>
              <h1 className="mt-5 max-w-4xl font-heading text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Today’s Tamil creator ideas, prompts, captions and hashtags.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                A daily check page for Instagram, YouTube Shorts and AI image creators. Pick your city and niche, then copy today’s content pack.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button className="h-12 rounded-xl" onClick={() => copyItem('daily-pack-hero', dailyPack)}>
                  {copied === 'daily-pack-hero' ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                  {copied === 'daily-pack-hero' ? 'Copied full pack' : 'Copy today’s pack'}
                </Button>
                <Link href="/realtime-photo-generator" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-card px-5 text-sm font-bold text-primary transition-colors hover:bg-secondary">
                  <ImageIcon className="size-4" aria-hidden="true" />
                  Make realtime photo
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-5 shadow-[0_24px_80px_-44px_oklch(0.35_0.12_305/.45)]">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Today</p>
              <h2 className="mt-2 font-heading text-2xl font-black">{formatDate(today)}</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoTile icon={CloudSun} label="Weather hook" value={weather ? `${weather.temperature}°C · ${weatherMood}` : weatherStatus === 'loading' ? 'Loading live weather…' : 'Fresh outdoor'} />
                <InfoTile icon={CalendarDays} label="Festival hook" value={festivalLine} />
                <InfoTile icon={TrendingUp} label="Daily angle" value={angle} />
                <InfoTile icon={Hash} label="Hashtag pack" value={`${niche.hashtags.length + 3}+ tags ready`} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <AdsenseSlot name="daily-top" className="py-6" />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
          <aside className="rounded-3xl border border-border bg-card p-5 shadow-[0_10px_34px_-26px_oklch(0.25_0.08_300/.5)] lg:sticky lg:top-20 lg:self-start">
            <h2 className="font-heading text-xl font-bold">Choose your daily setup</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Change city or niche to get a fresh content pack.</p>

            <div className="mt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">City / audience</p>
              <div className="grid gap-2">
                {cities.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCityId(item.id)}
                    aria-pressed={cityId === item.id}
                    className={`min-h-11 rounded-2xl border px-4 text-left text-sm font-bold transition-colors ${
                      cityId === item.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/35 hover:text-primary'
                    }`}
                  >
                    {item.name} <span className="text-xs opacity-75">· {item.ta}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">Creator niche</p>
              <div className="grid gap-2">
                {niches.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setNicheId(item.id)}
                    aria-pressed={nicheId === item.id}
                    className={`min-h-11 rounded-2xl border px-4 text-left text-sm font-bold transition-colors ${
                      nicheId === item.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/35 hover:text-primary'
                    }`}
                  >
                    {item.label} <span className="text-xs opacity-75">· {item.ta}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="grid gap-5">
            <CopyCard
              icon={ImageIcon}
              eyebrow="AI image prompt"
              title="Today’s photorealistic prompt"
              body={imagePrompt}
              copied={copied === 'image-prompt'}
              onCopy={() => copyItem('image-prompt', imagePrompt)}
              actionHref={`/realtime-photo-generator?prompt=${encodeURIComponent(imagePrompt.slice(0, 1200))}`}
              actionLabel="Generate preview"
            />

            <div className="grid gap-5 md:grid-cols-2">
              <CopyCard
                icon={Video}
                eyebrow="Reel script"
                title="Quick reel structure"
                body={reelScript}
                copied={copied === 'reel-script'}
                onCopy={() => copyItem('reel-script', reelScript)}
              />
              <CopyCard
                icon={Sparkles}
                eyebrow="Caption"
                title="Tamil caption + hook"
                body={caption}
                copied={copied === 'caption'}
                onCopy={() => copyItem('caption', caption)}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <CopyCard
                icon={Lightbulb}
                eyebrow="YouTube Shorts"
                title="Title + thumbnail idea"
                body={youtubeIdea}
                copied={copied === 'youtube'}
                onCopy={() => copyItem('youtube', youtubeIdea)}
              />
              <CopyCard
                icon={Hash}
                eyebrow="Hashtags"
                title="Copy-ready hashtag set"
                body={hashtags}
                copied={copied === 'hashtags'}
                onCopy={() => copyItem('hashtags', hashtags)}
                actionHref="/hashtags"
                actionLabel="More hashtags"
              />
            </div>

            <section className="rounded-3xl border border-border bg-card p-5 shadow-[0_10px_34px_-26px_oklch(0.25_0.08_300/.5)] sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Daily checks</p>
                  <h2 className="mt-2 font-heading text-2xl font-bold">Useful live data for post ideas</h2>
                </div>
                <RefreshCw className="size-5 text-muted-foreground" aria-hidden="true" />
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-border bg-muted/45 p-4">
                  <CloudSun className="size-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-3 font-heading text-lg font-bold">Weather angle</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {weather
                      ? `${city.name}: ${weather.temperature}°C, ${weatherMood}, wind ${weather.wind} km/h${weather.rainChance === null ? '' : `, rain chance ${weather.rainChance}%`}.`
                      : weatherStatus === 'loading'
                        ? 'Loading live weather from Open-Meteo…'
                        : 'Weather API unavailable now, using safe fallback ideas.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-muted/45 p-4">
                  <CalendarDays className="size-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-3 font-heading text-lg font-bold">Holiday hook</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {upcomingHoliday
                      ? `${upcomingHoliday.name} · ${upcomingHoliday.date}${upcomingHoliday.localName ? ` · ${upcomingHoliday.localName}` : ''}`
                      : 'No upcoming public-holiday data found. Use local Tamil culture, city and weather as the angle.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-muted/45 p-4">
                  <DollarSign className="size-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-3 font-heading text-lg font-bold">INR creator hook</h3>
                  {rates.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {rates.map((rate) => (
                        <span key={rate.code} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-muted-foreground">
                          1 {rate.code} ≈ ₹{rate.inr.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Exchange-rate API unavailable now. Try diaspora money-saving or abroad Tamil creator content.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-foreground px-6 py-8 text-background sm:px-8">
              <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="text-sm font-bold text-accent">Daily habit loop</p>
                  <h2 className="mt-2 font-heading text-2xl font-bold">Bookmark this page and check it before posting.</h2>
                  <p className="mt-2 text-sm leading-6 text-background/70">
                    New combinations rotate daily and change again when users switch city or niche.
                  </p>
                </div>
                <Button className="h-12 rounded-xl bg-background px-5 text-foreground hover:bg-background/90" onClick={() => copyItem('daily-pack', dailyPack)}>
                  {copied === 'daily-pack' ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                  {copied === 'daily-pack' ? 'Copied' : 'Copy full pack'}
                </Button>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CloudSun;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/45 p-4">
      <Icon className="size-5 text-primary" aria-hidden="true" />
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold leading-5">{value}</p>
    </div>
  );
}

function CopyCard({
  icon: Icon,
  eyebrow,
  title,
  body,
  copied,
  onCopy,
  actionHref,
  actionLabel,
}: {
  icon: typeof ImageIcon;
  eyebrow: string;
  title: string;
  body: string;
  copied: boolean;
  onCopy: () => void;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <article className="flex min-h-[300px] flex-col rounded-3xl border border-border bg-card p-5 shadow-[0_10px_34px_-26px_oklch(0.25_0.08_300/.5)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">{eyebrow}</span>
      </div>
      <h2 className="mt-5 font-heading text-xl font-bold">{title}</h2>
      <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-muted/70 p-4 text-sm leading-6 text-muted-foreground">
        {body}
      </pre>
      <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
        <Button className="h-11 rounded-xl" onClick={onCopy}>
          {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
        {actionHref && actionLabel ? (
          <Link href={actionHref} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-background px-4 text-sm font-bold text-primary transition-colors hover:bg-secondary">
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
