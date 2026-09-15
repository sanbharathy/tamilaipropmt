'use client';

import type React from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  Check,
  Copy,
  ExternalLink,
  Hash,
  Link2,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Zap,
} from 'lucide-react';

import { AdsenseSlot } from '@/components/adsense-slot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const niches = [
  'AI creator',
  'Fashion / beauty',
  'Food / restaurant',
  'Travel',
  'Fitness',
  'Cinema / fan edits',
  'Business / local shop',
  'Photography',
  'Education',
  'Personal brand',
];

const hookIdeas = [
  'Stop scrolling — this one prompt changes your next post.',
  'Most creators miss this simple profile mistake.',
  'Use this before posting your next reel.',
  'Your bio should answer this in 3 seconds.',
  'One small change that makes your page look professional.',
];

function parseMetric(value: string) {
  const clean = value.trim().toLowerCase().replace(/,/g, '');
  if (!clean) return 0;
  const number = Number.parseFloat(clean.replace(/[km]/g, ''));
  if (Number.isNaN(number)) return 0;
  if (clean.includes('m')) return number * 1_000_000;
  if (clean.includes('k')) return number * 1_000;
  return number;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getGrade(score: number) {
  if (score >= 85) return { label: 'Strong', ta: 'வலுவான Profile', color: 'text-emerald-600' };
  if (score >= 70) return { label: 'Good', ta: 'நல்ல Profile', color: 'text-lime-600' };
  if (score >= 50) return { label: 'Needs polish', ta: 'மேம்படுத்தலாம்', color: 'text-amber-600' };
  return { label: 'Needs work', ta: 'மாற்றம் தேவை', color: 'text-rose-600' };
}

export function InstagramProfileChecker() {
  const [profileUrl, setProfileUrl] = useState('');
  const [bio, setBio] = useState('');
  const [niche, setNiche] = useState(niches[0]);
  const [followers, setFollowers] = useState('');
  const [avgLikes, setAvgLikes] = useState('');
  const [avgViews, setAvgViews] = useState('');
  const [captions, setCaptions] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const analysis = useMemo(() => {
    const followerCount = parseMetric(followers);
    const likeCount = parseMetric(avgLikes);
    const viewCount = parseMetric(avgViews);
    const bioLower = bio.toLowerCase();
    const captionLines = captions.split('\n').map((line) => line.trim()).filter(Boolean);
    const username = profileUrl.match(/instagram\.com\/([^/?#]+)/i)?.[1]?.replace('@', '') || '';

    const hasClearBio = bio.trim().length >= 45;
    const hasCTA = /(dm|message|whatsapp|book|order|follow|link|contact|shop|call|learn|join|subscribe|buy|collab|email)/i.test(bio);
    const hasNicheWords = niche
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((word) => word.length > 2)
      .some((word) => bioLower.includes(word));
    const hasProfile = /instagram\.com\/[^/?#]+/i.test(profileUrl);
    const hasCaptionData = captionLines.length >= 3 || captions.length >= 140;
    const hasHooks = /(how|why|stop|secret|mistake|before|after|இத|எப்படி|ஏன்|பாருங்க|தவறு)/i.test(captions);
    const hasHashtags = /#[\p{L}\p{N}_]+/u.test(captions);
    const engagementRate = followerCount > 0 ? (likeCount / followerCount) * 100 : 0;
    const viewRate = followerCount > 0 ? (viewCount / followerCount) * 100 : 0;

    const bioScore = (hasClearBio ? 10 : 0) + (hasNicheWords ? 7 : 0) + (hasCTA ? 8 : 0);
    const profileScore = (hasProfile ? 8 : 0) + (username.length >= 4 && username.length <= 24 ? 7 : 0);
    const metricsScore =
      followerCount > 0
        ? Math.min(20, (engagementRate >= 3 ? 10 : engagementRate >= 1 ? 6 : 3) + (viewRate >= 40 ? 10 : viewRate >= 15 ? 6 : viewRate > 0 ? 3 : 0))
        : 4;
    const contentScore = (hasCaptionData ? 10 : 0) + (hasHooks ? 8 : 0) + (hasHashtags ? 4 : 0) + (captions.length > 250 ? 3 : 0);
    const focusScore = niche ? 15 : 0;
    const score = clampScore(bioScore + profileScore + metricsScore + contentScore + focusScore);
    const grade = getGrade(score);

    const issues = [
      !hasProfile ? 'Paste the full Instagram profile link so the report feels specific.' : '',
      !hasClearBio ? 'Bio is too short. Add who you help, what content you post, and why people should follow.' : '',
      !hasNicheWords ? `Make the niche clearer. Mention “${niche}” or a similar keyword in the bio.` : '',
      !hasCTA ? 'Add one clear CTA: DM, WhatsApp, book, shop, subscribe, or follow for daily tips.' : '',
      followerCount === 0 ? 'Add followers, average likes, and average views for a stronger engagement estimate.' : '',
      !hasCaptionData ? 'Paste 3–5 recent captions so the checker can judge hooks and consistency.' : '',
      !hasHooks ? 'Use stronger first-line hooks in reels/captions.' : '',
      !hasHashtags ? 'Use a small set of relevant hashtags instead of no hashtags or too many generic ones.' : '',
    ].filter(Boolean);

    const improvedBio = `${niche} creator helping Tamil audiences with simple, useful content.\n🎯 Follow for reels, ideas, tips & trends\n📩 DM for collab / enquiries\n👇 Latest links & resources`;
    const contentIdeas = [
      `3 mistakes ${niche} pages make on Instagram`,
      `Before vs after: improve a weak ${niche} post`,
      `One reel idea ${niche} creators can use today`,
      `Tamil audience-friendly caption template for ${niche}`,
      `Weekly trend breakdown: what to post next`,
    ];
    const hashtagSet = ['TamilCreator', 'InstagramTamil', 'ReelsTamil', 'ContentTips', niche.replace(/[^a-z0-9]/gi, '')].filter(Boolean);

    return {
      score,
      grade,
      username,
      engagementRate,
      viewRate,
      issues,
      improvedBio,
      contentIdeas,
      hashtagSet,
      hookIdeas,
    };
  }, [avgLikes, avgViews, bio, captions, followers, niche, profileUrl]);

  async function copyText(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  }

  const fullReport = [
    `Instagram Profile Strength: ${analysis.score}/100 (${analysis.grade.label})`,
    analysis.username ? `Profile: @${analysis.username}` : '',
    `Niche: ${niche}`,
    `Estimated engagement: ${analysis.engagementRate.toFixed(1)}% likes / ${analysis.viewRate.toFixed(1)}% views`,
    '',
    'Top improvements:',
    ...analysis.issues.slice(0, 5).map((issue) => `- ${issue}`),
    '',
    'Improved bio:',
    analysis.improvedBio,
    '',
    'Content ideas:',
    ...analysis.contentIdeas.map((idea) => `- ${idea}`),
    '',
    `Hashtags: ${analysis.hashtagSet.map((tag) => `#${tag}`).join(' ')}`,
  ].filter(Boolean).join('\n');

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="overflow-hidden border-b border-border/70 bg-[radial-gradient(circle_at_15%_10%,oklch(0.89_0.11_305/.65),transparent_28%),radial-gradient(circle_at_88%_18%,oklch(0.92_0.08_190/.5),transparent_30%)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-full text-sm font-bold text-primary hover:underline">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to TamilAI Prompt
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/75 px-3 py-1.5 text-xs font-bold text-primary shadow-sm backdrop-blur">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Live Instagram audit for Tamil creators
              </div>
              <h1 className="mt-5 max-w-4xl font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Instagram Profile Strength Checker
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                Paste your profile details and get an instant score, weak points, improved bio, reel ideas and hashtags. No login needed — analysis updates live as you type.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ['Bio', 'clarity + CTA'],
                  ['Content', 'hooks + consistency'],
                  ['Growth', 'engagement signals'],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-2xl border border-border bg-card/85 p-4 shadow-sm">
                    <p className="font-heading text-lg font-extrabold">{title}</p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-5 shadow-[0_22px_70px_-38px_oklch(0.35_0.14_305/.65)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Live score</p>
                  <p className={`mt-2 font-heading text-5xl font-extrabold ${analysis.grade.color}`}>{analysis.score}</p>
                </div>
                <div className="grid size-16 place-items-center rounded-3xl bg-primary/10 text-primary">
                  <BarChart3 className="size-8" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${analysis.score}%` }} />
              </div>
              <p className="mt-4 text-lg font-bold">{analysis.grade.label} · {analysis.grade.ta}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {analysis.username ? `Checking @${analysis.username}` : 'Paste an Instagram link to personalize the report.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <AdsenseSlot name="hashtags-top" className="py-6" />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr]">
        <form className="space-y-5 rounded-[2rem] border border-border bg-card p-5 shadow-[0_12px_42px_-30px_oklch(0.25_0.08_300/.55)] sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Step 1</p>
            <h2 className="mt-2 font-heading text-2xl font-bold">Paste profile details</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This MVP analyzes the details you paste manually. It does not scrape private Instagram data.
            </p>
          </div>

          <Field label="Instagram profile link" icon={<Link2 className="size-4" aria-hidden="true" />}>
            <Input value={profileUrl} onChange={(event) => setProfileUrl(event.target.value)} placeholder="https://instagram.com/username" className="h-12 rounded-2xl" />
          </Field>

          <Field label="Niche / category" icon={<Target className="size-4" aria-hidden="true" />}>
            <select value={niche} onChange={(event) => setNiche(event.target.value)} className="h-12 w-full rounded-2xl border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              {niches.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>

          <Field label="Bio text" icon={<UserRound className="size-4" aria-hidden="true" />}>
            <Textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Paste your Instagram bio here…" className="min-h-28 rounded-2xl" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Followers" compact>
              <Input value={followers} onChange={(event) => setFollowers(event.target.value)} placeholder="12.5K" className="h-12 rounded-2xl" />
            </Field>
            <Field label="Avg likes" compact>
              <Input value={avgLikes} onChange={(event) => setAvgLikes(event.target.value)} placeholder="650" className="h-12 rounded-2xl" />
            </Field>
            <Field label="Avg views" compact>
              <Input value={avgViews} onChange={(event) => setAvgViews(event.target.value)} placeholder="18K" className="h-12 rounded-2xl" />
            </Field>
          </div>

          <Field label="Last 3–5 captions or post ideas" icon={<TrendingUp className="size-4" aria-hidden="true" />}>
            <Textarea value={captions} onChange={(event) => setCaptions(event.target.value)} placeholder="Paste recent captions, hooks, or reel ideas. One per line works best…" className="min-h-36 rounded-2xl" />
          </Field>
        </form>

        <div className="space-y-5">
          <section className="rounded-[2rem] border border-border bg-card p-5 shadow-[0_12px_42px_-30px_oklch(0.25_0.08_300/.55)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Instant report</p>
                <h2 className="mt-2 font-heading text-2xl font-bold">What to improve first</h2>
              </div>
              <Button className="h-11 rounded-xl" onClick={() => copyText('report', fullReport)} type="button">
                {copied === 'report' ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                {copied === 'report' ? 'Copied' : 'Copy report'}
              </Button>
            </div>

            <div className="mt-5 grid gap-3">
              {(analysis.issues.length ? analysis.issues.slice(0, 5) : ['Profile looks balanced. Keep testing hooks, posting consistently, and improving your CTA.']).map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-muted/70 p-4 text-sm leading-6 text-muted-foreground">
                  <Zap className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            <ResultCard title="Improved bio" icon={<UserRound className="size-5" aria-hidden="true" />} action={<CopyButton copied={copied === 'bio'} onClick={() => copyText('bio', analysis.improvedBio)} />}>
              <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{analysis.improvedBio}</p>
            </ResultCard>

            <ResultCard title="Hashtag set" icon={<Hash className="size-5" aria-hidden="true" />} action={<CopyButton copied={copied === 'hashtags'} onClick={() => copyText('hashtags', analysis.hashtagSet.map((tag) => `#${tag}`).join(' '))} />}>
              <div className="flex flex-wrap gap-2">
                {analysis.hashtagSet.map((tag) => (
                  <span key={tag} className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">#{tag}</span>
                ))}
              </div>
            </ResultCard>
          </section>

          <ResultCard title="Next 5 content ideas" icon={<Lightbulb className="size-5" aria-hidden="true" />} action={<CopyButton copied={copied === 'ideas'} onClick={() => copyText('ideas', analysis.contentIdeas.join('\n'))} />}>
            <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
              {analysis.contentIdeas.map((idea) => (
                <li key={idea} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
          </ResultCard>

          <ResultCard title="Reel hooks to test" icon={<Sparkles className="size-5" aria-hidden="true" />}>
            <div className="grid gap-2 sm:grid-cols-2">
              {hookIdeas.map((hook) => (
                <button key={hook} type="button" onClick={() => copyText(hook, hook)} className="rounded-2xl border border-border bg-background p-3 text-left text-sm font-semibold leading-5 transition-colors hover:border-primary/30 hover:text-primary">
                  {copied === hook ? 'Copied ✓' : hook}
                </button>
              ))}
            </div>
          </ResultCard>

          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5 text-sm leading-7 text-muted-foreground">
            <p className="font-bold text-foreground">Important note</p>
            <p className="mt-1">
              This gives a live estimate from the public details you enter. For exact Instagram insights, the account owner must connect an official Business/Creator account later.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/55 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-3xl bg-foreground px-6 py-8 text-background sm:px-10">
            <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="font-heading text-2xl font-bold">Use the score, then copy prompts.</h2>
                <p className="mt-2 text-sm leading-6 text-background/70">
                  After improving the profile, pick image prompts, reel prompts, and hashtags from TamilAI Prompt.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-background px-5 text-sm font-bold text-foreground transition-colors hover:bg-background/90"
              >
                Explore prompts
                <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ label, icon, compact = false, children }: { label: string; icon?: React.ReactNode; compact?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={`mb-2 flex items-center gap-2 font-bold ${compact ? 'text-xs' : 'text-sm'}`}>
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function ResultCard({ title, icon, action, children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-border bg-card p-5 shadow-[0_12px_42px_-30px_oklch(0.25_0.08_300/.55)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</span>
          <h2 className="font-heading text-xl font-bold">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function CopyButton({ copied, onClick }: { copied: boolean; onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" className="rounded-xl border-primary/20 text-primary" onClick={onClick} type="button">
      {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}
