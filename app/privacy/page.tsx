import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - TamilAI Prompt',
  description:
    'Privacy Policy for TamilAI Prompt, including analytics, advertising, cookies, and third-party links.',
  alternates: { canonical: '/privacy' },
};

const sections = [
  {
    title: 'Chat screen presence',
    body: 'Accepted chat participants can see when the other person has that chat screen visible and focused, or their last visit time in that conversation. Presence is approximate, not a read receipt, and disappears with the expired live room record. Activity elsewhere on the site is not shared as chat presence.',
  },
  {
    title: 'Chat images & 30-day security archives',
    body: 'For new chats created after the archive notice was introduced on November 2, 2026, messages, smaller copies of shared images, nicknames, timestamps and chat activity are retained in an admin-only security PDF for 30 days after ending, link destruction or expiry. Images in the PDF are reduced to at most 512 pixels at JPEG quality 45. The PDF is encrypted in storage; authorized moderator access is logged. A protected processing snapshot may temporarily hold the chat while the PDF is generated. The archive becomes inaccessible at its 30-day deadline and a database job removes expired archives every minute while the database is running. Provider-managed backups may follow separate backup retention schedules. Downloaded copies or screenshots cannot be remotely erased. Existing chats keep their original retention policy. Images stop being available through participant chat links when a chat ends.',
  },
  {
    title: 'Optional private creator chat',
    body: 'Community Chat stores guest nicknames, invitations, messages, blocks, reports, security archives and hashed identifiers for spam limits. A secure HTTP-only cookie identifies your guest session for up to 24 hours. Availability is off by default. Chat is not end-to-end encrypted. New chats require acknowledgement of the 30-day archive notice before joining. Conversations expire after 24 hours or earlier if a participant session expires. Active message records are removed through expiry maintenance; security PDFs have a separate 30-day deadline. Reports are retained for seven days subject to maintenance. See /community-chat/rules for full details.',
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
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          TamilAI Prompt
        </Link>
        <h1 className="mt-6 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: November 2, 2026
        </p>
        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h2 className="font-heading text-xl font-bold">
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {section.body}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
