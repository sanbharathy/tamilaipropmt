import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ImagePlus,
  Link2,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Smile,
  Sparkles,
} from 'lucide-react';
import { ChatStickerCard } from '@/components/chat-sticker-card';
import { chatStickers } from '@/lib/chat-stickers';

export const metadata: Metadata = {
  title: 'Free Tamil Chat with Private Links & Stickers | TamilAI',
  description:
    'Free Tamil chat with a private invite link. Send photos, original Tamil stickers and funny meme cards with friends. No email or phone. Destroy your link anytime.',
  alternates: { canonical: '/tamil-chat' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'தமிழில் பேசலாம் — Private Chat, Stickers & Memes',
    description: 'One private link. Two friends. A little Tamil chat energy.',
    url: '/tamil-chat',
    images: [
      {
        url: '/og.jpg',
        width: 800,
        height: 420,
        alt: 'TamilAI Prompt — Tamil private chat',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Tamil Chat, Private Links & Stickers',
    description:
      'Chat with friends in Tamil. Share temporary photos, original stickers and funny meme cards.',
    images: ['/og.jpg'],
  },
};
const faqs = [
  [
    'How do I start a private Tamil chat?',
    'Open Creator Chat, choose a nickname, and create a private link. Send it to your friend. The conversation starts when they accept the invitation. You can also opt in to find creators with the same interests.',
  ],
  [
    'Can we use Tamil and English together?',
    'Yes. Type in Tamil, English or Tanglish. The chat supports original Tamil stickers, reaction emojis and comic meme cards, alongside ordinary messages and clickable links.',
  ],
  [
    'Are shared pictures private and temporary?',
    'Only accepted participants can open chat pictures. You can send JPG, PNG or WebP files up to 2 MB. Images are cleared from the chat when it ends, including block or guest logout. A friend may still keep a screenshot or a file they saved themselves.',
  ],
  [
    'Can I destroy my invitation link?',
    'Yes. The creator can choose Destroy link from the chat options menu or their conversation list, before or after someone joins. This ends the conversation and clears shared images. An invitation is also single-use: after a friend accepts, nobody else can join through it.',
  ],
  [
    'Is this end-to-end encrypted messaging?',
    'No. Access is restricted and connections use HTTPS, but messages are stored on our server. This is not end-to-end encrypted chat. Avoid sending passwords, OTPs, financial information or sensitive personal details. You can block or report someone at any time.',
  ],
  [
    'Will private chats show up on Google?',
    'This information page is intended for search. Individual conversations and attachments are marked to stay out of search results, are not included in the public sitemap, and require participant access. Do not post your invitation publicly.',
  ],
  [
    'How long does a guest chat last?',
    'Guest sessions and conversations last up to 24 hours. Use the same browser to return while your session is valid. Clearing cookies or changing browsers loses access to existing conversations. You do not need to provide an email or phone number.',
  ],
];
const data = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Free Tamil Chat with Private Links & Stickers',
  url: 'https://tamilaiprompt.com/tamil-chat',
  description:
    'A public guide to TamilAI Prompt private Tamil chat, temporary photos, original stickers, consent and invitation controls.',
  inLanguage: ['ta', 'en'],
  isPartOf: {
    '@type': 'WebSite',
    name: 'TamilAI Prompt',
    url: 'https://tamilaiprompt.com',
  },
};

export default function TamilChatLanding() {
  return (
    <main className="min-h-screen bg-[#fbfcf7] text-[#183c32]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
      <header className="border-b border-[#e2eadf] bg-white">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6"
          aria-label="Chat navigation"
        >
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2 text-sm font-bold"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-[#176d59] text-white">
              <Sparkles size={18} aria-hidden="true" />
            </span>
            TamilAI Prompt
          </Link>
          <Link
            href="/community-chat"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e6f0df] px-5 text-xs font-bold"
          >
            Open chat
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </nav>
      </header>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-[#6c8b73]">
            <MessageCircle size={14} aria-hidden="true" />
            FREE TAMIL PRIVATE CHAT
          </p>
          <h1 className="text-3xl font-bold leading-[1.65] sm:text-5xl sm:leading-[1.55]">
            தமிழில் பேசலாம்.
            <br />
            <span className="text-[#28836a]">கொஞ்சம் சிரிக்கலாம்.</span>
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-8 text-[#60745f] sm:text-base">
            நண்பருக்கு ஒரு private link. பேச, படம் பகிர, தமிழ் stickers அனுப்ப—ஒரே
            இடம். உங்கள் அனுமதியுடன் தொடங்கும், உங்கள் விருப்பப்படி முடியும் உரையாடல்.
          </p>
          <h2 className="mt-5 text-sm font-bold text-[#426d52]">
            Private link chat for Tamil-speaking friends & creators
          </h2>
          <p className="mt-2 max-w-lg text-xs leading-7 text-[#64765f]">
            No email or phone. Just a nickname, an invitation, and a
            conversation both people choose.
          </p>
          <Link
            href="/community-chat"
            className="mt-7 inline-flex min-h-14 items-center gap-3 rounded-full bg-[#1c765f] px-7 text-sm font-bold text-white shadow-[0_8px_25px_#1c765f25] transition hover:bg-[#155c4b]"
          >
            {`Let's chat · பேசலாம்`}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-[#64765b]">
            {[
              'Two people only',
              'Accept before chatting',
              'Creator-controlled links',
            ].map((text) => (
              <span key={text} className="flex items-center gap-1.5">
                <Check
                  size={13}
                  className="text-[#57906b]"
                  aria-hidden="true"
                />
                {text}
              </span>
            ))}
          </div>
        </div>
        <div className="relative rounded-[36px] bg-[#173f32] p-5 sm:p-8">
          <div
            aria-label="Example conversation, not a live chat"
            className="overflow-hidden rounded-[26px] bg-[#eef3e9] shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-[#dfe8d9] bg-white px-4 py-4">
              <span className="grid size-10 place-items-center rounded-full bg-[#e5f0d4] text-xl">
                😎
              </span>
              <div>
                <p className="text-sm font-bold">Your friend</p>
                <p className="mt-1 text-[9px] text-[#687c61]">
                  Example conversation · தமிழ் vibe
                </p>
              </div>
              <LockKeyhole
                size={14}
                className="ml-auto text-[#a0ad92]"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-4 p-4 sm:p-5">
              <p className="max-w-[85%] rounded-[18px] rounded-bl-sm bg-white px-4 py-3 text-xs leading-7 shadow-sm">
                சும்மா ஒரு வணக்கம் சொல்ல வந்தேன் 👋
              </p>
              <p className="ml-auto max-w-[85%] rounded-[18px] rounded-br-sm bg-[#d7efce] px-4 py-3 text-xs leading-7 shadow-sm">
                அப்போ ஒரு meme-ம் அனுப்பு 😂
              </p>
              <div className="max-w-[80%] rotate-[-3deg]">
                <ChatStickerCard sticker={chatStickers[0]} />
              </div>
              <p className="py-2 text-center text-[9px] text-[#9aaa8f]">
                Private invite. Shared laughs.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white p-3">
              <Smile size={21} className="text-[#8daa8c]" aria-hidden="true" />
              <span className="flex-1 rounded-full bg-[#f0f5eb] px-4 py-3 text-[10px] text-[#a0ae94]">
                ஒரு வணக்கம் சொல்லுங்கள்…
              </span>
              <span className="grid size-9 place-items-center rounded-full bg-[#328068] text-white">
                <ArrowRight size={16} aria-hidden="true" />
              </span>
            </div>
          </div>
          <span className="absolute -bottom-4 right-6 rounded-full border border-[#dee8cf] bg-[#f2f7e7] px-5 py-3 text-xs font-bold shadow-sm">
            ✨ Little chats. Big Tamil energy.
          </span>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [
              Link2,
              'ஒரு link போதும்',
              'Invite your friend',
              'Create a private two-person invitation. Your friend accepts before any message or image can be sent.',
            ],
            [
              Smile,
              'சிரிப்புக்கு stickers',
              'Tamil stickers & meme cards',
              'Send original Tamil reactions, funny chat-life cards and emojis. No third-party sticker account needed.',
            ],
            [
              ImagePlus,
              'படம் பகிரலாம்',
              'Temporary photo sharing',
              'Tap to open a shared picture, zoom in, or view the original. Pictures clear when the conversation ends.',
            ],
          ].map(([Icon, ta, en, description]) => {
            const I = Icon as typeof Link2;
            return (
              <article
                key={String(en)}
                className="rounded-[26px] border border-[#e2eadc] bg-white p-6"
              >
                <I
                  size={23}
                  className="mb-5 text-[#679772]"
                  aria-hidden="true"
                />
                <h2 className="text-base font-bold leading-8">{String(ta)}</h2>
                <h3 className="mt-2 text-xs font-bold text-[#69906f]">
                  {String(en)}
                </h3>
                <p className="mt-3 text-xs leading-7 text-[#64765b]">
                  {String(description)}
                </p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="rounded-[30px] border border-[#dfe8d5] bg-[#edf4e4] p-6 sm:p-10">
          <div className="flex items-center gap-3">
            <ShieldCheck
              size={25}
              className="text-[#6b9566]"
              aria-hidden="true"
            />
            <h2 className="text-xl font-bold">உங்கள் chat. உங்கள் கட்டுப்பாடு.</h2>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-[#70856a]">
            Destroy your invite anytime, end a conversation, block a guest or
            report a message. Finding other creators is optional and switched
            off until you choose to be available.
          </p>
          <p className="mt-4 max-w-3xl text-xs leading-7 text-[#67785d]">
            <strong className="text-[#677b59]">A clear privacy promise:</strong>{' '}
            this is invitation-based chat with protected access, not end-to-end
            encrypted messaging. Keep sensitive information out of chat.{' '}
            <Link
              href="/community-chat/rules"
              className="font-semibold underline underline-offset-2"
            >
              Read the chat rules and privacy details.
            </Link>
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#64765b]">
          BEFORE YOU SAY HELLO
        </p>
        <h2 className="mt-3 text-2xl font-bold leading-relaxed">
          Tamil private chat: your questions
        </h2>
        <div className="mt-7 divide-y divide-[#e3eadb]">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group py-5">
              <summary className="cursor-pointer text-sm font-bold leading-7">
                {question}
              </summary>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-[#62745b]">
                {answer}
              </p>
            </details>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/community-chat"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#1c765f] px-7 text-sm font-bold text-white"
          >
            Create your private chat
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <footer className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center justify-between gap-5 border-t border-[#e2eadc] px-4 py-7 text-xs text-[#64765b] sm:px-6">
        <span>TamilAI Prompt · தமிழில் connect ஆகலாம்.</span>
        <nav aria-label="Footer" className="flex gap-5">
          <Link href="/">Prompts</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </footer>
    </main>
  );
}
