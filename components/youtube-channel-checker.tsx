'use client';

import type React from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Copy,
  DollarSign,
  ExternalLink,
  Hash,
  Lightbulb,
  Link2,
  LoaderCircle,
  PlayCircle,
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
  { name: 'Tamil entertainment / cinema', rpm: 0.7 },
  { name: 'AI tools / tech', rpm: 1.8 },
  { name: 'Finance / business', rpm: 2.6 },
  { name: 'Food / travel', rpm: 1.1 },
  { name: 'Education / career', rpm: 1.5 },
  { name: 'News / politics commentary', rpm: 0.9 },
  { name: 'Vlogs / lifestyle', rpm: 0.8 },
  { name: 'Gaming', rpm: 0.65 },
  { name: 'Beauty / fashion', rpm: 1.2 },
];

const uploadOptions = [
  { label: 'Daily', score: 12 },
  { label: '3–4 videos/week', score: 10 },
  { label: '1–2 videos/week', score: 8 },
  { label: 'Few videos/month', score: 4 },
  { label: 'Not consistent', score: 1 },
];

type YouTubeApiData = {
  title: string;
  description: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  recentVideos: {
    title: string;
    publishedAt: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
  }[];
};

function parseMetric(value: string) {
  const clean = value.trim().toLowerCase().replace(/,/g, '');
  if (!clean) return 0;
  const number = Number.parseFloat(clean.replace(/[km]/g, ''));
  if (Number.isNaN(number)) return 0;
  if (clean.includes('m')) return number * 1_000_000;
  if (clean.includes('k')) return number * 1_000;
  return number;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

function formatCompactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return Math.round(value).toString();
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getGrade(score: number) {
  if (score >= 85) return { label: 'Monetization ready', ta: 'வருமானத்திற்கு வலுவான Channel', color: 'text-emerald-600' };
  if (score >= 70) return { label: 'Good growth base', ta: 'நல்ல வளர்ச்சி வாய்ப்பு', color: 'text-lime-600' };
  if (score >= 50) return { label: 'Needs optimization', ta: 'மேம்படுத்த வேண்டும்', color: 'text-amber-600' };
  return { label: 'Needs stronger basics', ta: 'அடிப்படை மாற்றம் தேவை', color: 'text-rose-600' };
}

function guessUploadFrequency(videos: YouTubeApiData['recentVideos']) {
  const dates = videos
    .map((video) => new Date(video.publishedAt).getTime())
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => b - a);

  if (dates.length < 2) return uploadOptions[2].label;

  const daysCovered = Math.max(1, (dates[0] - dates[dates.length - 1]) / 86_400_000);
  const averageGap = daysCovered / (dates.length - 1);

  if (averageGap <= 1.5) return uploadOptions[0].label;
  if (averageGap <= 2.5) return uploadOptions[1].label;
  if (averageGap <= 7) return uploadOptions[2].label;
  if (averageGap <= 16) return uploadOptions[3].label;
  return uploadOptions[4].label;
}

function estimateMonthlyViewsFromRecentVideos(videos: YouTubeApiData['recentVideos'], frequency: string) {
  if (!videos.length) return 0;

  const averageViews = videos.reduce((sum, video) => sum + video.viewCount, 0) / videos.length;
  const videosPerMonthByFrequency: Record<string, number> = {
    Daily: 26,
    '3–4 videos/week': 14,
    '1–2 videos/week': 6,
    'Few videos/month': 3,
    'Not consistent': 1.5,
  };

  return averageViews * (videosPerMonthByFrequency[frequency] ?? 6);
}

export function YouTubeChannelChecker() {
  const [channelUrl, setChannelUrl] = useState('');
  const [channelName, setChannelName] = useState('');
  const [niche, setNiche] = useState(niches[0].name);
  const [about, setAbout] = useState('');
  const [subscribers, setSubscribers] = useState('');
  const [monthlyViews, setMonthlyViews] = useState('');
  const [shortsViews, setShortsViews] = useState('');
  const [customRpm, setCustomRpm] = useState('');
  const [uploadFrequency, setUploadFrequency] = useState(uploadOptions[2].label);
  const [titles, setTitles] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [apiMessage, setApiMessage] = useState('');
  const [lastFetchedChannel, setLastFetchedChannel] = useState<YouTubeApiData | null>(null);

  const analysis = useMemo(() => {
    const nicheData = niches.find((item) => item.name === niche) ?? niches[0];
    const rpm = Number.parseFloat(customRpm) || nicheData.rpm;
    const longViews = parseMetric(monthlyViews);
    const shortViews = parseMetric(shortsViews);
    const subscriberCount = parseMetric(subscribers);
    const titleLines = titles.split('\n').map((line) => line.trim()).filter(Boolean);
    const hasChannelLink = /(youtube\.com|youtu\.be)/i.test(channelUrl);
    const hasClearName = channelName.trim().length >= 3 && channelName.trim().length <= 45;
    const hasAbout = about.trim().length >= 80;
    const hasCTA = /(subscribe|follow|join|comment|share|watch|dm|contact|mail|email|whatsapp|சப்ஸ்க்ரைப்|பாருங்க)/i.test(about);
    const hasTitles = titleLines.length >= 3;
    const hasStrongHooks = /(how|why|top|before|after|secret|mistake|earn|trend|review|எப்படி|ஏன்|ட்ரெண்ட்|ரகசியம்|தவறு)/i.test(titles);
    const frequencyScore = uploadOptions.find((item) => item.label === uploadFrequency)?.score ?? 6;
    const viewToSubscriberRate = subscriberCount > 0 ? (longViews / subscriberCount) * 100 : 0;

    const monthlyLongRevenue = (longViews / 1000) * rpm;
    const monthlyShortsRevenue = (shortViews / 1000) * 0.04;
    const monthlyEstimate = monthlyLongRevenue + monthlyShortsRevenue;
    const lowEstimate = monthlyEstimate * 0.55;
    const highEstimate = monthlyEstimate * 1.65;

    const score = clampScore(
      (hasChannelLink ? 8 : 0) +
      (hasClearName ? 8 : 0) +
      (hasAbout ? 12 : 0) +
      (hasCTA ? 7 : 0) +
      (subscriberCount >= 1000 ? 10 : subscriberCount > 0 ? 5 : 0) +
      (longViews >= 10000 ? 13 : longViews > 0 ? 7 : 0) +
      (viewToSubscriberRate >= 100 ? 12 : viewToSubscriberRate >= 30 ? 8 : viewToSubscriberRate > 0 ? 4 : 0) +
      frequencyScore +
      (hasTitles ? 10 : 0) +
      (hasStrongHooks ? 10 : 0),
    );

    const issues = [
      !hasChannelLink ? 'Paste the YouTube channel link so the report feels specific.' : '',
      !hasClearName ? 'Use a clear channel name that instantly explains the topic or creator identity.' : '',
      !hasAbout ? 'About section is too thin. Add who the channel is for, what viewers get, and upload promise.' : '',
      !hasCTA ? 'Add a CTA in About: subscribe, comment, join, contact, or WhatsApp/email for business.' : '',
      subscriberCount === 0 ? 'Add subscriber count to calculate view-to-subscriber strength.' : '',
      longViews === 0 && shortViews === 0 ? 'Add monthly long-video views or Shorts views to estimate revenue.' : '',
      !hasTitles ? 'Paste at least 3 recent video titles so the checker can rate title hooks.' : '',
      !hasStrongHooks ? 'Make titles more clickable with “how”, “why”, “mistake”, “trend”, “before/after”, or Tamil curiosity hooks.' : '',
    ].filter(Boolean);

    const titleIdeas = [
      `How to grow a ${niche} channel in Tamil — 5 mistakes to avoid`,
      `I tested this ${niche} trend for 7 days — results explained`,
      `Before you upload your next video, fix these title mistakes`,
      `Tamil creator income breakdown: views, RPM and real strategy`,
      `One simple Shorts format ${niche} creators can post daily`,
    ];

    const aboutTemplate = `${channelName.trim() || 'Your Channel'} helps Tamil viewers with simple, useful ${niche.toLowerCase()} content.\n\nSubscribe for weekly videos, Shorts, tips and trend breakdowns.\n\nFor business / collaboration:\nEmail: yourmail@example.com`;

    const hashtags = ['TamilYouTube', 'TamilCreator', 'YouTubeTamil', 'TamilShorts', niche.replace(/[^a-z0-9]/gi, '')].filter(Boolean);

    return {
      rpm,
      score,
      grade: getGrade(score),
      monthlyEstimate,
      lowEstimate,
      highEstimate,
      yearlyEstimate: monthlyEstimate * 12,
      longViews,
      shortViews,
      viewToSubscriberRate,
      issues,
      titleIdeas,
      aboutTemplate,
      hashtags,
    };
  }, [about, channelName, channelUrl, customRpm, monthlyViews, niche, shortsViews, subscribers, titles, uploadFrequency]);

  async function copyText(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  }

  async function fetchChannelData() {
    const input = channelUrl.trim();

    if (!input) {
      setApiStatus('error');
      setApiMessage('Paste a YouTube channel URL or @handle first.');
      return;
    }

    setApiStatus('loading');
    setApiMessage('Fetching public YouTube data…');

    try {
      const response = await fetch(`/api/youtube-channel?url=${encodeURIComponent(input)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Could not fetch YouTube data.');
      }

      const channel = data as YouTubeApiData;
      const frequency = guessUploadFrequency(channel.recentVideos);
      const estimatedMonthlyViews = estimateMonthlyViewsFromRecentVideos(channel.recentVideos, frequency);

      setChannelName(channel.title);
      setAbout(channel.description);
      setSubscribers(formatCompactNumber(channel.subscriberCount));
      setUploadFrequency(frequency);
      setMonthlyViews(estimatedMonthlyViews ? formatCompactNumber(estimatedMonthlyViews) : '');
      setTitles(channel.recentVideos.map((video) => video.title).join('\n'));
      setLastFetchedChannel(channel);
      setApiStatus('success');
      setApiMessage(`Fetched ${channel.recentVideos.length} recent videos. Monthly views are estimated from recent public video performance.`);
    } catch (error) {
      setApiStatus('error');
      setApiMessage(error instanceof Error ? error.message : 'Could not fetch YouTube data.');
      setLastFetchedChannel(null);
    }
  }

  const fullReport = [
    `YouTube Channel Strength: ${analysis.score}/100 (${analysis.grade.label})`,
    `Estimated monthly revenue: ${formatMoney(analysis.lowEstimate)} - ${formatMoney(analysis.highEstimate)}`,
    `Middle estimate: ${formatMoney(analysis.monthlyEstimate)} / month, ${formatMoney(analysis.yearlyEstimate)} / year`,
    `Assumed long-video RPM: ${formatMoney(analysis.rpm)} per 1,000 views`,
    `Long views: ${formatNumber(analysis.longViews)} | Shorts views: ${formatNumber(analysis.shortViews)}`,
    '',
    'Top improvements:',
    ...analysis.issues.slice(0, 5).map((issue) => `- ${issue}`),
    '',
    'About section template:',
    analysis.aboutTemplate,
    '',
    'Next video ideas:',
    ...analysis.titleIdeas.map((idea) => `- ${idea}`),
    '',
    `Hashtags: ${analysis.hashtags.map((tag) => `#${tag}`).join(' ')}`,
  ].join('\n');

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="overflow-hidden border-b border-border/70 bg-[radial-gradient(circle_at_12%_10%,oklch(0.88_0.14_24/.55),transparent_28%),radial-gradient(circle_at_88%_12%,oklch(0.9_0.08_190/.45),transparent_30%)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-full text-sm font-bold text-primary hover:underline">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to TamilAI Prompt
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/75 px-3 py-1.5 text-xs font-bold text-primary shadow-sm backdrop-blur">
                <PlayCircle className="size-3.5" aria-hidden="true" />
                Live YouTube audit + revenue estimate
              </div>
              <h1 className="mt-5 max-w-4xl font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                YouTube Channel Strength & Revenue Checker
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                Paste channel details manually and get an instant score, estimated monthly revenue, title ideas, about-section rewrite and growth actions for Tamil creators.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ['Revenue', 'monthly + yearly range'],
                  ['Growth', 'views vs subscribers'],
                  ['SEO', 'titles + About section'],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-2xl border border-border bg-card/85 p-4 shadow-sm">
                    <p className="font-heading text-lg font-extrabold">{title}</p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-5 shadow-[0_22px_70px_-38px_oklch(0.35_0.14_24/.65)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Estimated revenue</p>
                  <p className="mt-2 font-heading text-4xl font-extrabold text-emerald-600">
                    {formatMoney(analysis.monthlyEstimate)}
                  </p>
                  <p className="mt-1 text-xs font-bold text-muted-foreground">per month middle estimate</p>
                </div>
                <div className="grid size-16 place-items-center rounded-3xl bg-emerald-500/10 text-emerald-600">
                  <DollarSign className="size-8" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-5 rounded-2xl bg-muted/70 p-4">
                <p className="text-sm font-bold">Range: {formatMoney(analysis.lowEstimate)} – {formatMoney(analysis.highEstimate)}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Based on {formatMoney(analysis.rpm)} RPM for long videos and a small Shorts estimate. This is not official YouTube Studio revenue.
                </p>
              </div>
              <div className="mt-5 flex items-center justify-between gap-4">
                <div>
                  <p className={`font-heading text-4xl font-extrabold ${analysis.grade.color}`}>{analysis.score}</p>
                  <p className="text-xs font-bold text-muted-foreground">channel strength</p>
                </div>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${analysis.score}%` }} />
                </div>
              </div>
              <p className="mt-4 text-lg font-bold">{analysis.grade.label} · {analysis.grade.ta}</p>
            </div>
          </div>
        </div>
      </section>

      <AdsenseSlot name="hashtags-top" className="py-6" />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr]">
        <form className="space-y-5 rounded-[2rem] border border-border bg-card p-5 shadow-[0_12px_42px_-30px_oklch(0.25_0.08_300/.55)] sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Step 1</p>
            <h2 className="mt-2 font-heading text-2xl font-bold">Paste YouTube details</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Manual input keeps it fast and avoids YouTube login/API limits. Add approximate values from YouTube Studio.
            </p>
          </div>

          <div>
            <Field label="YouTube channel link" icon={<Link2 className="size-4" aria-hidden="true" />}>
              <Input value={channelUrl} onChange={(event) => setChannelUrl(event.target.value)} placeholder="https://youtube.com/@channel" className="h-12 rounded-2xl" />
            </Field>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button type="button" className="h-11 rounded-xl" onClick={fetchChannelData} disabled={apiStatus === 'loading'}>
                {apiStatus === 'loading' ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                {apiStatus === 'loading' ? 'Fetching…' : 'Fetch from YouTube API'}
              </Button>
              {apiMessage ? (
                <p className={`text-xs font-semibold ${apiStatus === 'error' ? 'text-rose-600' : apiStatus === 'success' ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                  {apiMessage}
                </p>
              ) : null}
            </div>
          </div>

          <Field label="Channel name" icon={<UserRound className="size-4" aria-hidden="true" />}>
            <Input value={channelName} onChange={(event) => setChannelName(event.target.value)} placeholder="Your channel name" className="h-12 rounded-2xl" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Niche / category" icon={<Target className="size-4" aria-hidden="true" />}>
              <select value={niche} onChange={(event) => setNiche(event.target.value)} className="h-12 w-full rounded-2xl border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                {niches.map((item) => <option key={item.name}>{item.name}</option>)}
              </select>
            </Field>
            <Field label="Upload frequency" icon={<TrendingUp className="size-4" aria-hidden="true" />}>
              <select value={uploadFrequency} onChange={(event) => setUploadFrequency(event.target.value)} className="h-12 w-full rounded-2xl border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                {uploadOptions.map((item) => <option key={item.label}>{item.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Subscribers" compact>
              <Input value={subscribers} onChange={(event) => setSubscribers(event.target.value)} placeholder="25K" className="h-12 rounded-2xl" />
            </Field>
            <Field label="Monthly long views" compact>
              <Input value={monthlyViews} onChange={(event) => setMonthlyViews(event.target.value)} placeholder="250K" className="h-12 rounded-2xl" />
            </Field>
            <Field label="Monthly Shorts views" compact>
              <Input value={shortsViews} onChange={(event) => setShortsViews(event.target.value)} placeholder="1.2M" className="h-12 rounded-2xl" />
            </Field>
            <Field label="Custom RPM $" compact>
              <Input value={customRpm} onChange={(event) => setCustomRpm(event.target.value)} placeholder={analysis.rpm.toString()} className="h-12 rounded-2xl" />
            </Field>
          </div>

          <Field label="About section" icon={<Sparkles className="size-4" aria-hidden="true" />}>
            <Textarea value={about} onChange={(event) => setAbout(event.target.value)} placeholder="Paste the channel About section…" className="min-h-28 rounded-2xl" />
          </Field>

          <Field label="Last 3–5 video titles" icon={<PlayCircle className="size-4" aria-hidden="true" />}>
            <Textarea value={titles} onChange={(event) => setTitles(event.target.value)} placeholder="Paste video titles. One title per line works best…" className="min-h-32 rounded-2xl" />
          </Field>
        </form>

        <div className="space-y-5">
          <section className="rounded-[2rem] border border-border bg-card p-5 shadow-[0_12px_42px_-30px_oklch(0.25_0.08_300/.55)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Instant report</p>
                <h2 className="mt-2 font-heading text-2xl font-bold">Revenue + growth actions</h2>
              </div>
              <Button className="h-11 rounded-xl" onClick={() => copyText('report', fullReport)} type="button">
                {copied === 'report' ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                {copied === 'report' ? 'Copied' : 'Copy report'}
              </Button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MetricCard label="Monthly estimate" value={`${formatMoney(analysis.lowEstimate)} – ${formatMoney(analysis.highEstimate)}`} />
              <MetricCard label="Yearly middle" value={formatMoney(analysis.yearlyEstimate)} />
              <MetricCard label="Views/subscribers" value={`${analysis.viewToSubscriberRate.toFixed(0)}%`} />
            </div>

            {lastFetchedChannel ? (
              <div className="mt-5 grid gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm sm:grid-cols-3">
                <MetricCard label="API subscribers" value={formatCompactNumber(lastFetchedChannel.subscriberCount)} />
                <MetricCard label="Total channel views" value={formatCompactNumber(lastFetchedChannel.viewCount)} />
                <MetricCard label="Total videos" value={formatNumber(lastFetchedChannel.videoCount)} />
              </div>
            ) : null}

            <div className="mt-5 grid gap-3">
              {(analysis.issues.length ? analysis.issues.slice(0, 5) : ['Channel looks balanced. Keep improving title hooks, thumbnails, audience retention and upload consistency.']).map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-muted/70 p-4 text-sm leading-6 text-muted-foreground">
                  <Zap className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            <ResultCard title="About rewrite" icon={<UserRound className="size-5" aria-hidden="true" />} action={<CopyButton copied={copied === 'about'} onClick={() => copyText('about', analysis.aboutTemplate)} />}>
              <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{analysis.aboutTemplate}</p>
            </ResultCard>

            <ResultCard title="Tags / hashtags" icon={<Hash className="size-5" aria-hidden="true" />} action={<CopyButton copied={copied === 'hashtags'} onClick={() => copyText('hashtags', analysis.hashtags.map((tag) => `#${tag}`).join(' '))} />}>
              <div className="flex flex-wrap gap-2">
                {analysis.hashtags.map((tag) => (
                  <span key={tag} className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">#{tag}</span>
                ))}
              </div>
            </ResultCard>
          </section>

          <ResultCard title="Next 5 video ideas" icon={<Lightbulb className="size-5" aria-hidden="true" />} action={<CopyButton copied={copied === 'ideas'} onClick={() => copyText('ideas', analysis.titleIdeas.join('\n'))} />}>
            <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
              {analysis.titleIdeas.map((idea) => (
                <li key={idea} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
          </ResultCard>

          <div className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-5 text-sm leading-7 text-muted-foreground">
            <p className="font-bold text-foreground">Revenue note</p>
            <p className="mt-1">
              This is an estimate only. Real YouTube income depends on monetization status, RPM, audience country, niche, ad inventory, Shorts revenue share, copyright claims and watch time.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/55 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-3xl bg-foreground px-6 py-8 text-background sm:px-10">
            <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="font-heading text-2xl font-bold">Improve the channel, then create faster.</h2>
                <p className="mt-2 text-sm leading-6 text-background/70">
                  Use TamilAI Prompt for YouTube titles, Shorts scripts, thumbnails, image prompts and hashtag sets.
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/55 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-xl font-extrabold">{value}</p>
    </div>
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
