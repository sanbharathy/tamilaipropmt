'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, Hash, Search, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hashtagSets, type HashtagSet } from '@/lib/hashtag-sets';

const categories: { id: HashtagSet['category'] | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ai-image', label: 'AI Images' },
  { id: 'ai-video', label: 'AI Video' },
  { id: 'creator', label: 'Creators' },
  { id: 'business', label: 'Business' },
  { id: 'festival', label: 'Festival' },
  { id: 'education', label: 'Education' },
];

export function HashtagLibrary() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<HashtagSet['category'] | 'all'>('all');
  const [copied, setCopied] = useState<string | null>(null);

  const visibleSets = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return hashtagSets.filter((set) => {
      const categoryMatch = category === 'all' || set.category === category;
      const searchText = `${set.titleTa} ${set.titleEn} ${set.descriptionTa} ${set.descriptionEn} ${set.tags.join(' ')} ${set.bestFor.join(' ')}`.toLocaleLowerCase();
      return categoryMatch && (!term || searchText.includes(term));
    });
  }, [category, query]);

  async function copyText(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/70 bg-[radial-gradient(circle_at_20%_0%,oklch(0.9_0.08_305/.58),transparent_30%),radial-gradient(circle_at_90%_20%,oklch(0.93_0.07_190/.42),transparent_26%)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to TamilAI Prompt
          </Link>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/75 px-3 py-1.5 text-xs font-bold text-primary shadow-sm backdrop-blur">
            <Sparkles className="size-3.5" aria-hidden="true" />
            30 copy-ready hashtag sets
          </div>
          <h1 className="mt-5 max-w-4xl font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Trending hashtags for Instagram, TikTok, YouTube Shorts and social media
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
            Use these short, relevant hashtag sets for Tamil AI prompts, image trends, video reels, local business posts, festival greetings and creator content. Copy 5 tags for Instagram/TikTok or 2 tags for X/Facebook.
          </p>

          <div className="mt-8 grid gap-3 rounded-3xl border border-border bg-card p-4 shadow-[0_16px_50px_-28px_oklch(0.4_0.12_300/.45)] md:grid-cols-[1fr_auto]">
            <label htmlFor="hashtag-search" className="sr-only">Search hashtag sets</label>
            <div className="flex items-center gap-2 rounded-2xl bg-muted px-3">
              <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <Input
                id="hashtag-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search AI saree, reels, business, festival…"
                className="h-12 border-0 bg-transparent px-1 text-base shadow-none focus-visible:ring-0"
              />
            </div>
            <Button
              className="h-12 rounded-2xl"
              onClick={() => {
                setQuery('');
                setCategory('all');
              }}
            >
              Show all sets
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex snap-x gap-2 overflow-x-auto pb-3" aria-label="Hashtag categories">
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={category === item.id}
              onClick={() => setCategory(item.id)}
              className={`min-h-11 shrink-0 snap-start rounded-full border px-4 text-sm font-bold transition-colors ${
                category === item.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-primary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleSets.map((set) => {
            const fullSet = set.tags.map((tag) => `#${tag}`).join(' ');
            const shortSet = set.tags.slice(0, 2).map((tag) => `#${tag}`).join(' ');
            const copiedFull = copied === `${set.id}-full`;
            const copiedShort = copied === `${set.id}-short`;

            return (
              <article key={set.id} className="flex min-h-[390px] flex-col rounded-3xl border border-border bg-card p-5 shadow-[0_10px_34px_-26px_oklch(0.25_0.08_300/.5)]">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Hash className="size-6" aria-hidden="true" />
                  </span>
                  <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                    Set {set.id}
                  </span>
                </div>

                <h2 className="mt-5 font-heading text-xl font-extrabold leading-snug">{set.titleEn}</h2>
                <p className="mt-1 text-sm font-semibold text-primary">{set.titleTa}</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{set.descriptionEn}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {set.tags.map((tag) => (
                    <a
                      key={tag}
                      href={`https://www.instagram.com/explore/tags/${tag.toLowerCase()}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary hover:border-primary/35 hover:bg-primary/10"
                    >
                      #{tag}
                    </a>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl bg-muted p-4 text-sm leading-6 text-muted-foreground">
                  <p className="font-bold text-foreground">Fact / usage note</p>
                  <p className="mt-1">{set.factEn}</p>
                  <p className="mt-2 text-xs leading-5">{set.factTa}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                  {set.bestFor.map((platform) => (
                    <span key={platform} className="rounded-md border border-border bg-background px-2 py-1 font-semibold">
                      {platform}
                    </span>
                  ))}
                </div>

                <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
                  <Button className="h-11 rounded-xl" onClick={() => copyText(`${set.id}-full`, fullSet)} aria-live="polite">
                    {copiedFull ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                    {copiedFull ? 'Copied' : 'Copy 5 tags'}
                  </Button>
                  <Button variant="outline" className="h-11 rounded-xl border-primary/20 text-primary" onClick={() => copyText(`${set.id}-short`, shortSet)} aria-live="polite">
                    {copiedShort ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                    {copiedShort ? 'Copied' : 'Copy 2 tags'}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>

        {!visibleSets.length ? (
          <div className="mt-8 rounded-3xl border border-dashed border-border bg-muted/45 px-5 py-14 text-center text-muted-foreground">
            <Search className="mx-auto mb-3 size-7" aria-hidden="true" />
            <p>No hashtag set matches this search.</p>
          </div>
        ) : null}
      </section>

      <section className="border-t border-border bg-card/55 py-10">
        <div className="mx-auto max-w-6xl px-4 text-sm leading-7 text-muted-foreground sm:px-6">
          <h2 className="font-heading text-2xl font-bold text-foreground">How to use these hashtag sets</h2>
          <p className="mt-3">
            Pick the set closest to your post, then change one or two tags to match the exact image, video, city, product or festival. Avoid pasting unrelated viral hashtags. For better discovery, write your real keywords inside the caption too.
          </p>
        </div>
      </section>
    </main>
  );
}
