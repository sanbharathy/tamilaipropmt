import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Chat Rules & Privacy | TamilAI Prompt',
  alternates: { canonical: '/community-chat/rules' },
};
const rules = [
  [
    'படங்கள் & பாதுகாப்பு சேமிப்பு · Images & security retention',
    'Accepted participants can share JPG, PNG or WebP files up to 2 MB. Images are validated, resized to at most 1200 pixels and saved as WebP without original metadata, with a ten-image limit per conversation. Chat image links stop working when a chat ends or expires. For new chats under the archive notice, smaller image copies are retained inside the restricted security PDF for 30 days after the chat ends. Existing conversations keep their original deletion policy. Other people may retain screenshots or downloaded copies.',
  ],
  [
    'உங்கள் அனுமதி முக்கியம் · Consent first',
    'Discovery is off by default. Turn on “Available to chat” to show your nickname to visitors on the chat page who choose the same interest. Directory listings expire after about 50 seconds without an update. Every conversation needs an acceptance before messages can be sent.',
  ],
  [
    'இருவர் மட்டும் · Two-person invitations',
    'An invitation reserves one seat for the first person who accepts. Share it only with the intended person. Destroy link disables the invitation and ends the conversation immediately; it does not delete the disclosed 30-day security archive for new chats. Guest identities are not verified; a nickname is not proof of identity.',
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
    'Messages are stored in an isolated Supabase PostgreSQL schema. Conversations last up to 24 hours, or end earlier if a participant session expires. The interface shows the latest 100 messages. New archived chats allow up to 1,000 messages and ten images so that the complete conversation can be preserved within service limits. Ended conversations become inaccessible to participants. Expiry maintenance removes active chat records; guest records are removed after their session has expired for seven days.',
  ],
  [
    '30 நாள் பாதுகாப்பு PDF · 30-day security PDF',
    'New chats created after the November 2, 2026 archive notice retain all message text, reduced-size shared images, nicknames, timestamps, invitation activity and end details for security review. Both participants must acknowledge the notice before joining a new archived chat. No retrospective archive is created for older chats. End, destroy, block, logout, moderator suspension and expiry create a protected snapshot before live image data is cleared. Background processing converts it into an encrypted PDF, then removes the processing snapshot. Images in the PDF are at most 512 pixels at JPEG quality 45. Exact Unicode text is also embedded as a JSON attachment. A pending snapshot remains protected until processing succeeds or its deadline arrives. Authorized moderator PDF downloads are logged. Archives are inaccessible 30 days after ending and a database job purges them every minute while the database is running. Provider backups may have separate retention schedules; downloaded copies cannot be remotely erased. These are service records, not verified proof of identity or forensic originals.',
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
