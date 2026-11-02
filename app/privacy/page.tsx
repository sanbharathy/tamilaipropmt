import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - TamilAI Prompt',
  description: 'Privacy Policy for TamilAI Prompt, including analytics, advertising, cookies, and third-party links.',
  alternates: { canonical: '/privacy' },
};

const sections = [
  {
    title: 'Temporary chat images',
    body: 'Private chat image uploads are processed to remove original metadata and stored in the isolated chat database. Image data is cleared when a conversation ends, including blocking, guest logout and moderator suspension. Access stops immediately on expiry; stored expired images are cleared by activity-triggered expiry checks. Moderation reports do not retain image copies. Recipients may retain screenshots or files they saved themselves. See the chat rules for upload limits and details.',
  },
  {
    title: 'Optional private creator chat',
    body: 'Community Chat stores guest nicknames, invitation records, chat messages, blocks, reports, and hashed identifiers used for spam limits. A secure HTTP-only cookie identifies your guest session for up to 24 hours. Availability is off by default. Chat is not end-to-end encrypted. Conversations expire after 24 hours, and expired conversations are removed by hourly cleanup triggered by chat activity. Reports are retained for seven days subject to that cleanup. See /community-chat/rules for full retention and moderation details.',
  },
  {
    title: 'Information we collect',
    body: 'TamilAI Prompt is mainly a public content website. We do not ask visitors to create an account. We may collect basic technical information such as pages visited, device type, browser type, approximate location, and referral source through analytics and hosting logs.',
  },
  {
    title: 'Analytics',
    body: 'We use privacy-conscious site analytics to understand page visits, popular prompts, and site performance. This helps us improve content and user experience.',
  },
  {
    title: 'Advertising',
    body: 'If advertising is enabled, third-party ad partners such as Google AdSense may use cookies or similar technologies to serve and measure ads. These partners may personalize ads based on your visits to this and other websites, depending on your settings and applicable law.',
  },
  {
    title: 'Cookies',
    body: 'The site may use cookies or local storage for basic functionality such as saved prompts and for analytics or advertising measurement. You can control cookies through your browser settings.',
  },
  {
    title: 'Third-party links',
    body: 'TamilAI Prompt links to external AI tools and websites. We are not responsible for the privacy practices or content of third-party websites. Please review their policies before using them.',
  },
  {
    title: 'Contact',
    body: 'For privacy questions, corrections, or removal requests, please contact TamilAI Prompt through the Contact page.',
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <Sparkles className="size-4" aria-hidden="true" />
          TamilAI Prompt
        </Link>
        <h1 className="mt-6 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: November 2, 2026</p>
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
