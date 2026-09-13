'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Check,
  Code2,
  Copy,
  Home,
  Image as ImageIcon,
  Languages,
  Search,
  Sparkles,
  UserRound,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Language = 'ta' | 'en';

const categories = [
  { id: 'all', ta: 'அனைத்தும்', en: 'All', icon: Sparkles },
  { id: 'work', ta: 'வேலை', en: 'Work', icon: BriefcaseBusiness },
  { id: 'image', ta: 'படங்கள்', en: 'Images', icon: ImageIcon },
  { id: 'code', ta: 'கோடிங்', en: 'Coding', icon: Code2 },
];

const prompts = [
  {
    id: 1,
    category: 'work',
    tagTa: 'வேலை',
    tagEn: 'Work',
    titleTa: 'தொழில்முறை மின்னஞ்சல் எழுதுங்கள்',
    titleEn: 'Write a professional email',
    descriptionTa: 'உங்கள் கருத்துகளை தெளிவான, மரியாதையான மின்னஞ்சலாக மாற்றுங்கள்.',
    descriptionEn: 'Turn rough notes into a clear and respectful professional email.',
    prompt:
      'நீங்கள் ஒரு தொழில்முறை தகவல் தொடர்பு நிபுணர். கீழே உள்ள குறிப்புகளை சுருக்கமான, தெளிவான மற்றும் மரியாதையான மின்னஞ்சலாக எழுதுங்கள். பொருத்தமான subject line, greeting, முக்கிய தகவல்கள் மற்றும் தெளிவான next step சேர்க்கவும். குறிப்புகள்: [உங்கள் குறிப்புகளை இங்கே எழுதுங்கள்]',
    time: '30 வினாடிகள்',
  },
  {
    id: 2,
    category: 'image',
    tagTa: 'AI படம்',
    tagEn: 'AI Image',
    titleTa: 'சினிமா தரத்திலான புகைப்படம்',
    titleEn: 'Create a cinematic portrait',
    descriptionTa: 'Gemini, Midjourney மற்றும் DALL·E-க்கு விரிவான பட prompt.',
    descriptionEn: 'A detailed image prompt for Gemini, Midjourney, and DALL·E.',
    prompt:
      'Create a cinematic portrait of [subject], warm golden-hour lighting, authentic Tamil cultural details, natural skin texture, shallow depth of field, 85mm lens, balanced composition, editorial photography, realistic color grading, high detail, no text, no watermark.',
    time: '1 நிமிடம்',
  },
  {
    id: 3,
    category: 'code',
    tagTa: 'கோடிங்',
    tagEn: 'Coding',
    titleTa: 'கோடு பிழையை கண்டறியுங்கள்',
    titleEn: 'Debug code step by step',
    descriptionTa: 'பிழையின் காரணம், சரிசெய்தல் மற்றும் சோதனைகளை பெறுங்கள்.',
    descriptionEn: 'Get the root cause, a focused fix, and verification steps.',
    prompt:
      'நீங்கள் ஒரு senior software engineer. கீழே உள்ள code மற்றும் error message-ஐ ஆய்வு செய்யுங்கள். முதலில் root cause-ஐ எளிய தமிழில் விளக்குங்கள். பின்னர் குறைந்த மாற்றத்துடன் சரிசெய்த code, edge cases மற்றும் verification steps கொடுங்கள். Code: [paste code] Error: [paste error]',
    time: '2 நிமிடங்கள்',
  },
];

const copyText = {
  ta: {
    eyebrow: 'தமிழில் AI — அனைவருக்கும் எளிதாக',
    heading: 'சரியான Prompt. சிறந்த முடிவு.',
    subheading: 'வேலை, கல்வி, படங்கள் மற்றும் கோடிங்கிற்கான தரமான AI prompts-ஐ தமிழில் கண்டறியுங்கள்.',
    search: 'எதை உருவாக்க விரும்புகிறீர்கள்?',
    popular: 'பிரபலமான Prompts',
    viewAll: 'அனைத்தையும் பார்க்க',
    copy: 'Prompt-ஐ நகலெடு',
    copied: 'நகலெடுக்கப்பட்டது',
    empty: 'உங்கள் தேடலுக்கு prompts கிடைக்கவில்லை.',
    home: 'முகப்பு',
    explore: 'தேடல்',
    saved: 'சேமித்தவை',
    profile: 'சுயவிவரம்',
  },
  en: {
    eyebrow: 'AI in Tamil — made simple for everyone',
    heading: 'The right prompt. Better results.',
    subheading: 'Discover high-quality Tamil AI prompts for work, learning, images, and coding.',
    search: 'What would you like to create?',
    popular: 'Popular prompts',
    viewAll: 'View all',
    copy: 'Copy prompt',
    copied: 'Copied',
    empty: 'No prompts match your search.',
    home: 'Home',
    explore: 'Explore',
    saved: 'Saved',
    profile: 'Profile',
  },
};

export default function HomePage() {
  const [language, setLanguage] = useState<Language>('ta');
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const t = copyText[language];

  const filteredPrompts = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return prompts.filter((prompt) => {
      const categoryMatch = activeCategory === 'all' || prompt.category === activeCategory;
      const searchMatch =
        !term ||
        `${prompt.titleTa} ${prompt.titleEn} ${prompt.descriptionTa} ${prompt.descriptionEn}`
          .toLocaleLowerCase()
          .includes(term);
      const savedMatch = !showSaved || savedIds.includes(prompt.id);
      return categoryMatch && searchMatch && savedMatch;
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

  function resetFilters() {
    setQuery('');
    setActiveCategory('all');
    setShowSaved(false);
  }

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground md:pb-0">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#top" className="flex min-h-11 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <span className="font-heading text-[17px] font-bold tracking-tight">TamilAI<span className="text-primary">Prompt</span></span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground md:flex" aria-label="Primary navigation">
            <a href="#prompts" className="transition-colors hover:text-foreground">Prompts</a>
            <a href="#categories" className="transition-colors hover:text-foreground">Categories</a>
            <a href="#about" className="transition-colors hover:text-foreground">About</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-11 rounded-xl px-3 text-sm"
              onClick={() => setLanguage(language === 'ta' ? 'en' : 'ta')}
              aria-label={language === 'ta' ? 'Switch to English' : 'தமிழுக்கு மாற்றவும்'}
            >
              <Languages className="size-4" aria-hidden="true" />
              {language === 'ta' ? 'தமிழ்' : 'EN'}
            </Button>
          </div>
        </div>
      </header>

      <section id="top" className="relative overflow-hidden border-b border-border/70">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,oklch(0.89_0.09_305/.55),transparent_28%),radial-gradient(circle_at_85%_40%,oklch(0.93_0.06_190/.55),transparent_25%)]" />
        <div className="relative mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:py-20">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-3 py-1.5 text-xs font-bold text-primary shadow-sm backdrop-blur">
            <span className="size-1.5 rounded-full bg-accent" />
            {t.eyebrow}
          </div>
          <h1 className="font-heading text-balance text-4xl font-extrabold leading-[1.1] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
            {t.heading}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            {t.subheading}
          </p>

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
              <Button className="hidden h-11 rounded-xl px-5 sm:inline-flex" onClick={() => document.querySelector('#prompts')?.scrollIntoView({ behavior: 'smooth' })}>
                <Search className="size-4" aria-hidden="true" />
                {language === 'ta' ? 'தேடுக' : 'Search'}
              </Button>
            </div>
          </div>

          <div id="categories" className="mt-5 flex snap-x gap-2 overflow-x-auto pb-2 sm:justify-center" aria-label="Prompt categories">
            {categories.map((category) => {
              const Icon = category.icon;
              const selected = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  aria-pressed={selected}
                  className={`flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 ${
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {category[language]}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section id="prompts" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Curated for you</p>
            <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{t.popular}</h2>
          </div>
          <Button variant="ghost" className="hidden h-11 rounded-xl text-primary sm:inline-flex" onClick={resetFilters}>
            {t.viewAll}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {filteredPrompts.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPrompts.map((prompt) => {
              const copied = copiedId === prompt.id;
              const saved = savedIds.includes(prompt.id);
              return (
                <article key={prompt.id} className="group flex min-h-[285px] flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_-20px_oklch(0.2_0.03_300/.32)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_18px_45px_-25px_oklch(0.45_0.18_305/.42)] sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-primary/8 px-2.5 py-1 text-xs font-bold text-primary">
                      {language === 'ta' ? prompt.tagTa : prompt.tagEn}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">{prompt.time}</span>
                  </div>
                  <h3 className="mt-5 font-heading text-xl font-bold leading-snug tracking-tight">
                    {language === 'ta' ? prompt.titleTa : prompt.titleEn}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {language === 'ta' ? prompt.descriptionTa : prompt.descriptionEn}
                  </p>
                  <div className="mt-auto flex gap-2 pt-6">
                    <Button
                      className="h-11 flex-1 rounded-xl"
                      onClick={() => copyPrompt(prompt.id, prompt.prompt)}
                      aria-live="polite"
                    >
                      {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                      {copied ? t.copied : t.copy}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className={`size-11 rounded-xl ${saved ? 'border-primary bg-primary/8 text-primary' : ''}`}
                      aria-label={saved ? 'Remove saved prompt' : 'Save prompt'}
                      aria-pressed={saved}
                      onClick={() => toggleSaved(prompt.id)}
                    >
                      <Bookmark className={`size-4 ${saved ? 'fill-current' : ''}`} aria-hidden="true" />
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/50 px-5 py-14 text-center text-muted-foreground">
            <Search className="mx-auto mb-3 size-7" aria-hidden="true" />
            {t.empty}
          </div>
        )}
      </section>

      <section id="about" className="mx-auto mb-8 max-w-6xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-foreground px-6 py-9 text-background sm:px-10 sm:py-11">
          <div className="grid items-center gap-7 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-bold text-accent">TamilAI Prompt</p>
              <h2 className="mt-2 max-w-2xl font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                {language === 'ta' ? 'AI-ஐ உங்கள் மொழியில் பயன்படுத்த தொடங்குங்கள்.' : 'Start using AI in your language.'}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-background/70">
                {language === 'ta' ? 'எளிய வழிகாட்டுதல்கள், சோதிக்கப்பட்ட prompts, சிறந்த AI முடிவுகள்.' : 'Simple guidance, tested prompts, and better AI results.'}
              </p>
            </div>
            <Button
              className="h-12 rounded-xl bg-background px-5 text-foreground hover:bg-background/90"
              onClick={() => {
                resetFilters();
                document.querySelector<HTMLInputElement>('#prompt-search')?.focus();
                document.querySelector('#top')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {language === 'ta' ? 'இப்போது தொடங்குங்கள்' : 'Get started'}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 TamilAI Prompt · Made for Tamil creators.</p>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {[
            { label: t.home, icon: Home, active: !showSaved, action: () => { resetFilters(); document.querySelector('#top')?.scrollIntoView({ behavior: 'smooth' }); } },
            { label: t.explore, icon: Search, active: false, action: () => { setShowSaved(false); document.querySelector<HTMLInputElement>('#prompt-search')?.focus(); } },
            { label: t.saved, icon: Bookmark, active: showSaved, action: () => { setShowSaved(true); setActiveCategory('all'); setQuery(''); document.querySelector('#prompts')?.scrollIntoView({ behavior: 'smooth' }); } },
            { label: t.profile, icon: UserRound, active: false, action: () => document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' }) },
          ].map(({ label, icon: Icon, active, action }) => (
            <button key={label} type="button" onClick={action} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold ${active ? 'text-primary' : 'text-muted-foreground'}`}>
              <Icon className="size-5" strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
