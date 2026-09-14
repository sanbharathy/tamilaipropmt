import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact TamilAI Prompt',
  description: 'Contact TamilAI Prompt for feedback, prompt corrections, partnerships, and advertising enquiries.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <Sparkles className="size-4" aria-hidden="true" />
          TamilAI Prompt
        </Link>
        <h1 className="mt-6 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
          Contact
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          Have feedback, a correction, a partnership idea, or an advertising enquiry? Contact TamilAI Prompt.
        </p>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Mail className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-xl font-bold">Email</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                For feedback, corrections, partnerships, and advertising enquiries, email{' '}
                <a href="mailto:hello@tamilaiprompt.com" className="font-semibold text-primary hover:underline">
                  hello@tamilaiprompt.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-sm leading-6 text-muted-foreground">
          We review prompt quality, broken links, copyright concerns, and user feedback to keep the site useful for Tamil creators.
        </p>
      </section>
    </main>
  );
}
