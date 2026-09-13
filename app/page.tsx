'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Check,
  Clapperboard,
  Code2,
  Copy,
  Flame,
  GraduationCap,
  Image as ImageIcon,
  Languages,
  Megaphone,
  Play,
  Search,
  Sparkles,
  TrendingUp,
  Video,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Language = 'ta' | 'en';
type Category = 'all' | 'image' | 'video' | 'business' | 'education' | 'coding';

type TrendPrompt = {
  id: number;
  category: Exclude<Category, 'all'>;
  image: string;
  imageAlt: string;
  titleTa: string;
  titleEn: string;
  descriptionTa: string;
  descriptionEn: string;
  prompt: string;
  models: string[];
  updatedTa: string;
  updatedEn: string;
  featured?: boolean;
  needsPhoto?: boolean;
};

const filters: { id: Category; ta: string; en: string; icon: typeof Flame }[] = [
  { id: 'all', ta: 'ட்ரெண்டிங்', en: 'Trending', icon: Flame },
  { id: 'image', ta: 'படங்கள்', en: 'Images', icon: ImageIcon },
  { id: 'video', ta: 'வீடியோக்கள்', en: 'Videos', icon: Video },
  { id: 'business', ta: 'வணிகம்', en: 'Business', icon: BriefcaseBusiness },
  { id: 'education', ta: 'கல்வி', en: 'Education', icon: GraduationCap },
  { id: 'coding', ta: 'கோடிங்', en: 'Coding', icon: Code2 },
];

const trends: TrendPrompt[] = [
  {
    id: 1,
    category: 'image',
    image: '/trends/80s-tamil-portrait.png',
    imageAlt: 'Fictional couple in an authentic 1980s Tamil studio portrait',
    titleTa: '80s தமிழ் சினிமா லுக்',
    titleEn: '80s Tamil cinema look',
    descriptionTa: 'உங்கள் selfie-ஐ 1980களின் தமிழ்நாட்டு ஸ்டூடியோ படமாக மாற்றுங்கள்.',
    descriptionEn: 'Turn your selfie into an authentic 1980s Tamil Nadu studio portrait.',
    prompt:
      'நான் பதிவேற்றும் புகைப்படத்தை முக அடையாளத்திற்கான துல்லியமான reference ஆகப் பயன்படுத்தவும். 1980களின் தமிழ்நாட்டு ஸ்டூடியோ புகைப்படமாக மாற்றவும் — காலத்திற்கேற்ற உடை, இயல்பான சிகை அலங்காரம், warm tungsten lighting, faded 35mm film grain, soft vignette. முக அமைப்பையும் இயல்பான தோற்றத்தையும் மாற்ற வேண்டாம். படத்தில் எழுத்து அல்லது watermark வேண்டாம்.',
    models: ['Gemini', 'ChatGPT Images'],
    updatedTa: '2 மணி நேரம் முன்பு',
    updatedEn: '2 hours ago',
    featured: true,
    needsPhoto: true,
  },
  {
    id: 2,
    category: 'image',
    image: '/trends/childhood-meeting.png',
    imageAlt: 'Fictional adult meeting their childhood self in a South Indian courtyard',
    titleTa: 'குழந்தைப் பருவத்தை சந்திக்கும் நீங்கள்',
    titleEn: 'Meet your childhood self',
    descriptionTa: 'இன்றைய நீங்களும் குழந்தைப் பருவ நீங்களும் ஒரே உணர்ச்சிப்பூர்வமான படத்தில்.',
    descriptionEn: 'Place your present and childhood selves in one emotional portrait.',
    prompt:
      'நான் பதிவேற்றும் தற்போதைய புகைப்படம் மற்றும் குழந்தைப் பருவ புகைப்படத்தை identity references ஆகப் பயன்படுத்தவும். இருவரும் அமைதியான தென்னிந்திய வீட்டுத் திண்ணையில் அன்புடன் ஒருவரை ஒருவர் சந்திப்பது போல இயல்பான black-and-white editorial portrait உருவாக்கவும். முக அடையாளம், வயது மற்றும் உடல் விகிதங்களை துல்லியமாக வைத்திருக்கவும். இயல்பான ஒளி, மென்மையான film grain, எழுத்து வேண்டாம்.',
    models: ['ChatGPT Images', 'Gemini'],
    updatedTa: 'நேற்று',
    updatedEn: 'Yesterday',
    needsPhoto: true,
  },
  {
    id: 3,
    category: 'video',
    image: '/trends/chennai-night-ride.png',
    imageAlt: 'Cinematic motorcycle ride through rainy neon-lit Chennai',
    titleTa: 'சென்னை Night Ride Reel',
    titleEn: 'Chennai night ride reel',
    descriptionTa: 'மழை இரவில் வேகமான cinematic tracking shot — Reels மற்றும் Shorts-க்கு.',
    descriptionEn: 'A rainy-night cinematic tracking shot for Reels and Shorts.',
    prompt:
      '9:16 vertical cinematic video. A motorcycle rides through rain-soaked Chennai streets at night. Low-angle tracking camera, neon reflections on wet asphalt, realistic wheel spray, subtle handheld energy, smooth subject motion, dramatic blue and amber lighting. 8 seconds, consistent rider and motorcycle, no text, no logo, no watermark.',
    models: ['Veo', 'Kling', 'Runway'],
    updatedTa: 'இன்று',
    updatedEn: 'Today',
  },
  {
    id: 4,
    category: 'business',
    image: '/trends/filter-coffee-ad.png',
    imageAlt: 'Premium South Indian filter coffee advertisement scene',
    titleTa: 'Filter Coffee Product Ad',
    titleEn: 'Filter coffee product ad',
    descriptionTa: 'சிறு வணிகத்திற்கான premium product photo மற்றும் video opening shot.',
    descriptionEn: 'A premium product visual and video opening shot for a local business.',
    prompt:
      'Premium South Indian filter coffee advertisement. A polished brass davara-tumbler on a dark stone counter, delicate steam rising, early-morning sunlight cutting through a traditional kitchen window, rich coffee texture, realistic condensation, cinematic 50mm product photography, warm brown and brass palette, negative space for later copy, no text, no logo, no watermark.',
    models: ['Gemini', 'Midjourney', 'ChatGPT Images'],
    updatedTa: 'இந்த வாரம்',
    updatedEn: 'This week',
  },
];

const sectorPrompts = [
  {
    id: 5,
    category: 'business' as const,
    icon: Megaphone,
    titleTa: 'Instagram விற்பனை Caption',
    titleEn: 'Instagram sales caption',
    descriptionTa: 'தமிழ் வாடிக்கையாளர்களுக்கான இயல்பான விற்பனை பதிவு.',
    descriptionEn: 'A natural sales post written for Tamil customers.',
    prompt: 'நீங்கள் ஒரு தமிழ் social media copywriter. [தயாரிப்பு] பற்றிய Instagram caption எழுதுங்கள். முதல் வரியில் கவனம் ஈர்க்கும் hook, பின்னர் 3 தெளிவான பயன்கள், நம்பகமான தமிழ் பேச்சு நடை, மென்மையான call-to-action மற்றும் 5 தொடர்புடைய hashtags சேர்க்கவும். மிகைப்படுத்திய வாக்குறுதிகள் வேண்டாம்.',
  },
  {
    id: 6,
    category: 'education' as const,
    icon: GraduationCap,
    titleTa: 'எளிய தமிழில் பாடம் விளக்கம்',
    titleEn: 'Explain a lesson in simple Tamil',
    descriptionTa: 'கடினமான கருத்தை உதாரணங்களுடன் எளிதாக கற்றுக்கொள்ளுங்கள்.',
    descriptionEn: 'Learn a difficult concept through clear Tamil examples.',
    prompt: '[பாடம்/கருத்து] என்பதை 12 வயது மாணவருக்கும் புரியும் எளிய தமிழில் விளக்குங்கள். முதலில் ஒரு தினசரி வாழ்க்கை ஒப்புமை, பின்னர் படிப்படியான விளக்கம், ஒரு சிறிய உதாரணம், இறுதியில் 3 கேள்விகள் கொண்ட self-check சேர்க்கவும்.',
  },
  {
    id: 7,
    category: 'video' as const,
    icon: Clapperboard,
    titleTa: '30-வினாடி Reel Script',
    titleEn: '30-second reel script',
    descriptionTa: 'Hook முதல் CTA வரை முழு தமிழ் short-video script.',
    descriptionEn: 'A complete Tamil short-video script from hook to CTA.',
    prompt: '[தலைப்பு] பற்றி 30-வினாடி Instagram Reel script எழுதுங்கள். 2 வினாடி spoken hook, 3 வேகமான scenes, ஒவ்வொரு scene-க்கும் visual direction மற்றும் on-screen text, இயல்பான தமிழ் narration, இறுதியில் ஒரு தெளிவான CTA சேர்க்கவும். அட்டவணை வடிவில் கொடுக்கவும்.',
  },
  {
    id: 8,
    category: 'coding' as const,
    icon: Code2,
    titleTa: 'Code பிழை கண்டறிதல்',
    titleEn: 'Debug code step by step',
    descriptionTa: 'Root cause, குறைந்த மாற்றம் மற்றும் சரிபார்ப்பு வழிமுறை.',
    descriptionEn: 'Find the root cause, smallest fix, and verification steps.',
    prompt: 'நீங்கள் ஒரு senior software engineer. கீழே உள்ள code மற்றும் error message-ஐ ஆய்வு செய்யுங்கள். முதலில் root cause-ஐ எளிய தமிழில் விளக்குங்கள். பின்னர் குறைந்த மாற்றத்துடன் சரிசெய்த code, edge cases மற்றும் verification steps கொடுங்கள். Code: [paste code] Error: [paste error]',
  },
];

const text = {
  ta: {
    navTrending: 'ட்ரெண்டிங்',
    navImages: 'படங்கள்',
    navVideos: 'வீடியோக்கள்',
    navSectors: 'அனைத்து துறைகள்',
    kicker: 'தமிழர்களுக்கான AI Trend Hub',
    heading: 'ட்ரெண்ட் ஆகும் முன்பே உருவாக்குங்கள்.',
    subheading: 'வைரல் படங்கள், வீடியோக்கள் மற்றும் பயனுள்ள வேலைகளுக்கான copy-ready prompts — அனைத்தும் தமிழில்.',
    search: '80s படம், cinematic video என தேடுங்கள்…',
    trending: 'இப்போது ட்ரெண்டிங்கில்',
    updated: 'தினமும் புதுப்பிக்கப்படுகிறது',
    copy: 'Prompt-ஐ நகலெடு',
    copied: 'நகலெடுக்கப்பட்டது',
    photo: 'உங்கள் படம் தேவை',
    sectors: 'உங்கள் துறைக்கான Prompt',
    sectorsDesc: 'படைப்பாற்றல் மட்டுமல்ல — தினசரி வேலைக்கும் நேரத்தை சேமியுங்கள்.',
    empty: 'இந்த தேடலுக்கு prompt கிடைக்கவில்லை.',
    clear: 'அனைத்தையும் பார்க்க',
    home: 'ட்ரெண்ட்',
    saved: 'சேமித்தவை',
  },
  en: {
    navTrending: 'Trending',
    navImages: 'Images',
    navVideos: 'Videos',
    navSectors: 'All sectors',
    kicker: 'The AI trend hub for Tamil creators',
    heading: 'Create it before the trend moves on.',
    subheading: 'Copy-ready Tamil prompts for viral images, videos, and useful everyday work.',
    search: 'Search 80s photo, cinematic video…',
    trending: 'Trending right now',
    updated: 'Updated every day',
    copy: 'Copy prompt',
    copied: 'Copied',
    photo: 'Your photo needed',
    sectors: 'Prompts for every sector',
    sectorsDesc: 'Not just creativity—save time on useful everyday work.',
    empty: 'No prompt matches this search.',
    clear: 'View all',
    home: 'Trends',
    saved: 'Saved',
  },
};

export default function HomePage() {
  const [language, setLanguage] = useState<Language>('ta');
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const t = text[language];

  useEffect(() => {
    const saved = window.localStorage.getItem('tamilai-saved-prompts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSavedIds(parsed.filter((id): id is number => typeof id === 'number'));
        }
      } catch {
        window.localStorage.removeItem('tamilai-saved-prompts');
      }
    }
    setSavedLoaded(true);
  }, []);

  useEffect(() => {
    if (savedLoaded) {
      window.localStorage.setItem('tamilai-saved-prompts', JSON.stringify(savedIds));
    }
  }, [savedIds, savedLoaded]);

  const visibleTrends = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return trends.filter((item) => {
      const categoryMatch = activeCategory === 'all' || item.category === activeCategory;
      const savedMatch = !showSaved || savedIds.includes(item.id);
      const searchMatch =
        !term ||
        `${item.titleTa} ${item.titleEn} ${item.descriptionTa} ${item.descriptionEn} ${item.models.join(' ')}`
          .toLocaleLowerCase()
          .includes(term);
      return categoryMatch && savedMatch && searchMatch;
    });
  }, [activeCategory, query, savedIds, showSaved]);

  const visibleSectors = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return sectorPrompts.filter((item) => {
      const categoryMatch = activeCategory === 'all' || item.category === activeCategory;
      const savedMatch = !showSaved || savedIds.includes(item.id);
      const searchMatch = !term || `${item.titleTa} ${item.titleEn} ${item.descriptionTa} ${item.descriptionEn}`.toLocaleLowerCase().includes(term);
      return categoryMatch && savedMatch && searchMatch;
    });
  }, [activeCategory, query, savedIds, showSaved]);

  async function copyPrompt(id: number, prompt: string) {
    await navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1800);
  }

  function toggleSaved(id: number) {
    setSavedIds((current) =>
      current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id],
    );
  }

  function selectCategory(category: Category) {
    setActiveCategory(category);
    setShowSaved(false);
    document.querySelector('#library')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetFilters() {
    setActiveCategory('all');
    setShowSaved(false);
    setQuery('');
  }

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground md:pb-0">
      <a href="#library" className="sr-only z-[100] bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to prompts
      </a>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button type="button" onClick={resetFilters} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <span className="font-heading text-[17px] font-bold tracking-tight">TamilAI<span className="text-primary">Prompt</span></span>
          </button>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground lg:flex" aria-label="Primary navigation">
            <button type="button" onClick={() => selectCategory('all')} className="cursor-pointer transition-colors hover:text-foreground">{t.navTrending}</button>
            <button type="button" onClick={() => selectCategory('image')} className="cursor-pointer transition-colors hover:text-foreground">{t.navImages}</button>
            <button type="button" onClick={() => selectCategory('video')} className="cursor-pointer transition-colors hover:text-foreground">{t.navVideos}</button>
            <a href="#sectors" className="transition-colors hover:text-foreground">{t.navSectors}</a>
          </nav>

          <Button
            variant="outline"
            className="h-11 cursor-pointer rounded-xl px-3 text-sm"
            onClick={() => setLanguage(language === 'ta' ? 'en' : 'ta')}
            aria-label={language === 'ta' ? 'Switch to English' : 'தமிழுக்கு மாற்றவும்'}
          >
            <Languages className="size-4" aria-hidden="true" />
            {language === 'ta' ? 'தமிழ்' : 'EN'}
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border/70">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,oklch(0.89_0.09_305/.58),transparent_28%),radial-gradient(circle_at_85%_45%,oklch(0.93_0.06_190/.48),transparent_25%)]" />
        <div className="relative mx-auto max-w-5xl px-4 py-11 text-center sm:px-6 sm:py-16 lg:py-20">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/75 px-3 py-1.5 text-xs font-bold text-primary shadow-sm backdrop-blur">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-70 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            {t.kicker}
          </div>
          <h1 className="font-heading text-balance text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            {t.heading}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">{t.subheading}</p>

          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-border bg-card p-2 shadow-[0_16px_50px_-22px_oklch(0.45_0.2_305/.45)]">
            <label htmlFor="prompt-search" className="sr-only">{t.search}</label>
            <div className="flex items-center gap-2">
              <Search className="ml-3 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <Input
                id="prompt-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.search}
                className="h-12 border-0 bg-transparent px-1 text-base shadow-none focus-visible:ring-0"
              />
              <Button className="hidden h-11 cursor-pointer rounded-xl px-5 sm:inline-flex" onClick={() => document.querySelector('#library')?.scrollIntoView({ behavior: 'smooth' })}>
                <Search className="size-4" aria-hidden="true" />
                {language === 'ta' ? 'தேடுக' : 'Search'}
              </Button>
            </div>
          </div>

          <div className="mt-5 flex snap-x gap-2 overflow-x-auto pb-2 sm:justify-center" aria-label="Prompt filters">
            {filters.map((filter) => {
              const Icon = filter.icon;
              const selected = activeCategory === filter.id && !showSaved;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => selectCategory(filter.id)}
                  aria-pressed={selected}
                  className={`flex min-h-11 shrink-0 snap-start cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 ${
                    selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {filter[language]}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section id="library" className="scroll-mt-20 mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">
              <TrendingUp className="size-4" aria-hidden="true" />
              {t.updated}
            </div>
            <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{showSaved ? t.saved : t.trending}</h2>
          </div>
          {(query || activeCategory !== 'all' || showSaved) && (
            <Button variant="ghost" className="h-11 cursor-pointer rounded-xl text-primary" onClick={resetFilters}>{t.clear}</Button>
          )}
        </div>

        {visibleTrends.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {visibleTrends.map((item) => {
              const copied = copiedId === item.id;
              const saved = savedIds.includes(item.id);
              return (
                <article key={item.id} className={`group overflow-hidden rounded-3xl border border-border bg-card shadow-[0_10px_36px_-24px_oklch(0.25_0.08_300/.45)] transition-[border-color,box-shadow] duration-200 hover:border-primary/30 hover:shadow-[0_20px_55px_-28px_oklch(0.45_0.18_305/.48)] ${item.featured ? 'md:col-span-2 xl:col-span-2' : ''}`}>
                  <div className={`relative overflow-hidden bg-muted ${item.featured ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
                    <Image src={item.image} alt={item.imageAlt} fill priority={item.featured} sizes={item.featured ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 100vw, 25vw'} className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.02]" />
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                      <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-foreground/88 px-3 text-xs font-bold text-background shadow-sm backdrop-blur">
                        {item.category === 'video' ? <Play className="size-3.5 fill-current" aria-hidden="true" /> : <Flame className="size-3.5" aria-hidden="true" />}
                        {item.category === 'video' ? 'Video prompt' : language === 'ta' ? 'ட்ரெண்டிங்' : 'Trending'}
                      </span>
                      <button type="button" onClick={() => toggleSaved(item.id)} aria-label={saved ? 'Remove saved prompt' : 'Save prompt'} aria-pressed={saved} className={`grid size-11 cursor-pointer place-items-center rounded-full border border-white/30 bg-foreground/72 text-white shadow-sm backdrop-blur transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/70 ${saved ? 'bg-primary' : 'hover:bg-foreground/90'}`}>
                        <Bookmark className={`size-4 ${saved ? 'fill-current' : ''}`} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="flex min-h-[260px] flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{language === 'ta' ? item.updatedTa : item.updatedEn}</span>
                      {item.needsPhoto && <span className="rounded-full bg-secondary px-2 py-1 font-semibold text-secondary-foreground">{t.photo}</span>}
                    </div>
                    <h3 className="mt-3 font-heading text-xl font-bold leading-snug tracking-tight">{language === 'ta' ? item.titleTa : item.titleEn}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{language === 'ta' ? item.descriptionTa : item.descriptionEn}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {item.models.map((model) => <span key={model} className="rounded-md border border-border bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">{model}</span>)}
                    </div>
                    <Button className="mt-auto h-11 w-full cursor-pointer rounded-xl" onClick={() => copyPrompt(item.id, item.prompt)} aria-live="polite">
                      {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                      {copied ? t.copied : t.copy}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-muted/45 px-5 py-14 text-center text-muted-foreground">
            <Search className="mx-auto mb-3 size-7" aria-hidden="true" />
            <p>{t.empty}</p>
            <Button variant="outline" className="mt-5 h-11 cursor-pointer rounded-xl" onClick={resetFilters}>{t.clear}</Button>
          </div>
        )}
      </section>

      {(visibleSectors.length > 0 || (!query && activeCategory === 'all' && !showSaved)) && (
        <section id="sectors" className="border-y border-border bg-card/55 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-7 max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Work smarter</p>
              <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{t.sectors}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">{t.sectorsDesc}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {visibleSectors.map((item) => {
                const Icon = item.icon;
                const copied = copiedId === item.id;
                const saved = savedIds.includes(item.id);
                return (
                  <article key={item.id} className="flex min-h-[300px] flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_8px_28px_-24px_oklch(0.2_0.04_300/.35)]">
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-11 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Icon className="size-5" aria-hidden="true" /></span>
                      <button type="button" onClick={() => toggleSaved(item.id)} aria-label={saved ? 'Remove saved prompt' : 'Save prompt'} aria-pressed={saved} className="grid size-11 cursor-pointer place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40">
                        <Bookmark className={`size-4 ${saved ? 'fill-current text-primary' : ''}`} aria-hidden="true" />
                      </button>
                    </div>
                    <h3 className="mt-5 font-heading text-lg font-bold leading-snug">{language === 'ta' ? item.titleTa : item.titleEn}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{language === 'ta' ? item.descriptionTa : item.descriptionEn}</p>
                    <Button variant="outline" className="mt-auto h-11 w-full cursor-pointer rounded-xl border-primary/20 text-primary hover:bg-secondary" onClick={() => copyPrompt(item.id, item.prompt)}>
                      {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                      {copied ? t.copied : t.copy}
                    </Button>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-3xl bg-foreground px-6 py-9 text-background sm:px-10 sm:py-11">
          <div className="grid items-center gap-7 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-bold text-accent">TamilAI Prompt</p>
              <h2 className="mt-2 max-w-2xl font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                {language === 'ta' ? 'ஒரு trend-ஐ தவறவிடாதீர்கள்.' : 'Never miss the next trend.'}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-background/70">
                {language === 'ta' ? 'தமிழ் creators-க்காக தேர்ந்தெடுக்கப்பட்ட புதிய prompts தினமும்.' : 'Fresh prompts selected daily for Tamil creators.'}
              </p>
            </div>
            <Button className="h-12 cursor-pointer rounded-xl bg-background px-5 text-foreground hover:bg-background/90" onClick={() => { resetFilters(); document.querySelector<HTMLInputElement>('#prompt-search')?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              {language === 'ta' ? 'Prompts தேடுங்கள்' : 'Explore prompts'}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 TamilAI Prompt · தமிழர்களால், தமிழர்களுக்காக.</p>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {[
            { label: t.home, icon: Flame, active: activeCategory === 'all' && !showSaved, action: () => selectCategory('all') },
            { label: language === 'ta' ? 'படங்கள்' : 'Images', icon: ImageIcon, active: activeCategory === 'image' && !showSaved, action: () => selectCategory('image') },
            { label: language === 'ta' ? 'வீடியோ' : 'Video', icon: Video, active: activeCategory === 'video' && !showSaved, action: () => selectCategory('video') },
            { label: t.saved, icon: Bookmark, active: showSaved, action: () => { setShowSaved(true); setActiveCategory('all'); setQuery(''); document.querySelector('#library')?.scrollIntoView({ behavior: 'smooth' }); } },
          ].map(({ label, icon: Icon, active, action }) => (
            <button key={label} type="button" onClick={action} className={`flex min-h-12 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}>
              <Icon className={`size-5 ${active && Icon === Bookmark ? 'fill-current' : ''}`} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
