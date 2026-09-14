import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Sparkles } from 'lucide-react';

import { AdsenseSlot } from '@/components/adsense-slot';
import { InstagramEmbed } from '@/components/instagram-embed';
import { PromptCopyButton } from '@/components/prompt-copy-button';
import { getPromptLandingPage, promptLandingPages } from '@/lib/prompt-pages';

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return promptLandingPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getPromptLandingPage(slug);

  if (!page) {
    return {};
  }

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: `/prompts/${page.slug}` },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `https://tamilaiprompt.com/prompts/${page.slug}`,
      type: 'article',
      siteName: 'TamilAI Prompt',
      locale: 'ta_IN',
      images: [{ url: '/og.jpg', width: 800, height: 420, alt: page.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle,
      description: page.metaDescription,
      images: ['/og.jpg'],
    },
  };
}

export default async function PromptLandingPage({ params }: Props) {
  const { slug } = await params;
  const page = getPromptLandingPage(slug);

  if (!page) {
    notFound();
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.metaTitle,
    description: page.metaDescription,
    url: `https://tamilaiprompt.com/prompts/${page.slug}`,
    inLanguage: ['ta-IN', 'en'],
    datePublished: '2026-09-14',
    dateModified: '2026-09-14',
    publisher: {
      '@type': 'Organization',
      name: 'TamilAI Prompt',
      url: 'https://tamilaiprompt.com',
    },
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="border-b border-border/70 bg-[radial-gradient(circle_at_20%_0%,oklch(0.9_0.08_305/.6),transparent_34%),radial-gradient(circle_at_90%_10%,oklch(0.92_0.06_190/.45),transparent_28%)]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to TamilAI Prompt
          </Link>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/75 px-3 py-1.5 text-xs font-bold text-primary shadow-sm backdrop-blur">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Tamil AI prompt guide
          </div>
          <h1 className="mt-5 font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {page.h1}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{page.intro}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px]">
        <article className="space-y-8">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-[0_10px_36px_-24px_oklch(0.25_0.08_300/.45)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Tamil prompt</p>
                <h2 className="mt-2 font-heading text-2xl font-bold">Copy-ready prompt</h2>
              </div>
              <PromptCopyButton prompt={page.promptTa} />
            </div>
            <p className="mt-5 rounded-2xl bg-muted p-4 text-sm leading-7 text-muted-foreground">{page.promptTa}</p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">English version</p>
                <h2 className="mt-2 font-heading text-2xl font-bold">Use with global AI tools</h2>
              </div>
              <PromptCopyButton prompt={page.promptEn} />
            </div>
            <p className="mt-5 rounded-2xl bg-muted p-4 text-sm leading-7 text-muted-foreground">{page.promptEn}</p>
          </div>

          <AdsenseSlot name="prompt-inline" className="px-0" />

          <div className="grid gap-5 md:grid-cols-2">
            <InfoCard title="Tips to get better output" items={page.tips} />
            <InfoCard title="Mistakes to avoid" items={page.mistakes} />
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-heading text-2xl font-bold">Who should use this prompt?</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {page.audience.map((item) => (
                <span key={item} className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {(page.instagramExamples?.length || page.hashtags?.length) ? (
            <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Trend discovery</p>
              <h2 className="mt-2 font-heading text-2xl font-bold">Instagram trend examples</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                These are public Instagram references and hashtag links for trend research. We embed or link to the original posts instead of copying creator images.
              </p>

              {page.instagramExamples?.length ? (
                <div className="mt-5 grid gap-5">
                  {page.instagramExamples.map((example) => (
                    <InstagramEmbed
                      key={example.url}
                      url={example.url}
                      caption={example.caption}
                      source={example.source}
                    />
                  ))}
                </div>
              ) : null}

              {page.hashtags?.length ? (
                <div className="mt-5">
                  <h3 className="text-sm font-bold text-foreground">Explore related hashtags</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {page.hashtags.map((tag) => (
                      <a
                        key={tag}
                        href={`https://www.instagram.com/explore/tags/${tag.toLowerCase()}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:border-primary/35 hover:bg-primary/10"
                      >
                        #{tag}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </article>

        <aside className="space-y-5">
          <AdsenseSlot name="prompt-sidebar" className="px-0" />

          <div className="rounded-3xl border border-border bg-card p-5">
            <h2 className="font-heading text-xl font-bold">Best AI tools</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {page.tools.map((tool) => (
                <span key={tool} className="rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
                  {tool}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5">
            <h2 className="font-heading text-xl font-bold">Related Tamil prompts</h2>
            <div className="mt-4 space-y-3">
              {page.related.map((relatedSlug) => {
                const related = getPromptLandingPage(relatedSlug);
                if (!related) {
                  return null;
                }

                return (
                  <Link
                    key={related.slug}
                    href={`/prompts/${related.slug}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background p-3 text-sm font-semibold transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    {related.shortTitle}
                    <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <h2 className="font-heading text-xl font-bold">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
