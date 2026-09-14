import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About TamilAI Prompt',
  description:
    'Learn about TamilAI Prompt, a Tamil-first AI prompt library for image, video, business, education, coding, and creator workflows.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <Sparkles className="size-4" aria-hidden="true" />
          TamilAI Prompt
        </Link>
        <h1 className="mt-6 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
          About TamilAI Prompt
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          TamilAI Prompt is a Tamil-first AI prompt library built for creators, students, small-business owners, marketers, and everyday AI users who want useful prompts without wasting time searching everywhere.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {[
            ['What we publish', 'Copy-ready Tamil and English prompts for AI images, AI videos, captions, education, coding, business, and creator workflows.'],
            ['Who it helps', 'Tamil-speaking users who want clear prompt ideas for tools like ChatGPT, Gemini, Kling, Midjourney, Runway, and Canva.'],
            ['How we choose prompts', 'We focus on usefulness, trend relevance, clarity, and safety. Prompts are edited to be easy to copy and adapt.'],
            ['Our goal', 'Make AI creation easier for Tamil-speaking communities around the world.'],
          ].map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-heading text-xl font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
