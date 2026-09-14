import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms and Conditions - TamilAI Prompt',
  description: 'Terms and Conditions for using TamilAI Prompt prompts, AI tips, and third-party tool links.',
  alternates: { canonical: '/terms' },
};

const sections = [
  {
    title: 'Use of the website',
    body: 'TamilAI Prompt provides educational prompt ideas, AI tips, and links to useful AI tools. You may copy and adapt prompts for personal, creative, educational, and business use.',
  },
  {
    title: 'AI output responsibility',
    body: 'AI tools can produce unexpected or inaccurate outputs. Users are responsible for reviewing generated images, videos, text, code, and business content before publishing or using them.',
  },
  {
    title: 'No guarantee',
    body: 'We try to keep prompts useful and up to date, but we do not guarantee that every prompt will work perfectly with every AI model or tool.',
  },
  {
    title: 'Third-party tools',
    body: 'Links to tools such as ChatGPT, Gemini, Kling, Midjourney, Runway, and Canva are provided for convenience. TamilAI Prompt is not affiliated with or responsible for these third-party services unless clearly stated.',
  },
  {
    title: 'Acceptable use',
    body: 'Do not use prompts from this site to create illegal, harmful, deceptive, abusive, or rights-infringing content. Respect copyright, privacy, likeness, platform rules, and local laws.',
  },
  {
    title: 'Changes',
    body: 'We may update the website, prompts, policies, and terms as the site grows. Continued use of the site means you accept the latest version.',
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <Sparkles className="size-4" aria-hidden="true" />
          TamilAI Prompt
        </Link>
        <h1 className="mt-6 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
          Terms and Conditions
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: September 14, 2026</p>
        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-heading text-xl font-bold">{section.title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
