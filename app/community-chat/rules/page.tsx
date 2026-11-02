import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Chat Rules & Privacy | TamilAI Prompt',
  alternates: { canonical: '/community-chat/rules' },
};
const rules = [
  [
    'உங்கள் அனுமதி முக்கியம் · Consent first',
    'Discovery is off by default. Turn on “Available to chat” to show your nickname to visitors on the chat page who choose the same interest. Directory listings expire after about 50 seconds without an update. Every conversation needs an acceptance before messages can be sent.',
  ],
  [
    'இருவர் மட்டும் · Two-person invitations',
    'An invitation link reserves one additional seat for the first person who accepts. Treat the link like a private invitation and share it only with the intended person. We do not verify a guest’s real identity. A nickname is not proof of identity.',
  ],
  [
    'மரியாதையாகப் பேசுங்கள் · Be respectful',
    'No harassment, threats, sexual exploitation, hate, impersonation, scams, spam, or illegal content. Respect other people’s privacy. Do not share passwords, OTPs, financial information, or anyone else’s personal details. This is a creator discussion tool, not an emergency service.',
  ],
  [
    'Guest session & cookies',
    'No email or phone is required. A secure HTTP-only cookie identifies your guest session for up to 24 hours. Clearing cookies or switching browsers loses access to existing conversations. Nicknames are not unique.',
  ],
  [
    'Messages & retention',
    'Messages are stored on our server in an isolated Supabase PostgreSQL schema. Each conversation expires after 24 hours; the interface shows its most recent 100 messages. Expired conversations and their messages are removed by cleanup triggered by chat activity at most once per hour. If the service is inactive, expired records may remain until it is used again. Guest records are removed after their session has been expired for seven days.',
  ],
  [
    'இது end-to-end encryption அல்ல · Privacy limits',
    'Access to conversations is restricted to their participants through our server. Connections use HTTPS, but this is not end-to-end encrypted messaging. Server administrators can technically access stored data. Do not use it for sensitive conversations.',
  ],
  [
    'Report, block & moderation',
    'Report a specific message to share that message and your reason with a moderator. Reports retain a copy for up to seven days, subject to activity-triggered cleanup. Moderators can remove reported messages or suspend guest sessions. Blocking ends conversations between those guest identities. A guest who creates a new identity may be able to contact you again; choose who you accept.',
  ],
  [
    'Spam prevention',
    'We limit guest creation, chat requests, messages and reports. The server stores a keyed hash of your network address for rate limiting, rather than the raw address in chat tables. Hosting providers may separately keep technical request logs. Blocking and rate limits reduce abuse but do not eliminate it.',
  ],
];
export default function ChatRulesPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto max-w-3xl">
        <Link href="/community-chat" className="text-sm font-bold text-primary">
          ← Community Chat
        </Link>
        <h1 className="mt-6 text-3xl font-bold">Chat விதிகள் & Privacy</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Updated November 2, 2026
        </p>
        <div className="mt-8 space-y-5">
          {rules.map(([title, body]) => (
            <section key={title} className="rounded-2xl border bg-card p-5">
              <h2 className="font-bold leading-8">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {body}
              </p>
            </section>
          ))}
        </div>
        <p className="mt-7 text-sm leading-7">
          For privacy and removal requests, use our{' '}
          <Link href="/contact" className="font-bold text-primary underline">
            Contact page
          </Link>
          . See the{' '}
          <Link href="/privacy" className="font-bold text-primary underline">
            site privacy policy
          </Link>{' '}
          and{' '}
          <Link href="/terms" className="font-bold text-primary underline">
            terms
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
