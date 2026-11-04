import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Tamil Chat Sticker Photo Credits | TamilAI Prompt',
  description:
    'Authors, sources and licenses for our Tamil comedy reaction cards.',
  alternates: { canonical: '/sticker-credits' },
};

export default function StickerCredits() {
  return (
    <main className="mx-auto max-w-3xl space-y-7 px-5 py-16 text-slate-800">
      <Link href="/tamil-chat" className="text-teal-700 underline">
        ← Tamil Chat
      </Link>
      <h1 className="text-3xl font-bold">Tamil sticker packs & credits</h1>
      <section className="space-y-3 rounded-2xl bg-slate-50 p-6">
        <h2 className="text-xl font-bold">Supplied Tamil sticker packs</h2>
        <p>
          The additional Tamil reaction packs were supplied from Tamil Stickers
          For WhatsApp 4.6.1. Their existing artwork and Tamil captions are
          preserved. They are separate from the original reaction cards credited
          below.
        </p>
      </section>
      <p>
        The original reaction cards credited below use original Tamil captions.
        Those captions are not quotations from the actors. No actor endorsement
        or affiliation is implied.
      </p>
      <section className="space-y-3 rounded-2xl bg-slate-50 p-6">
        <h2 className="text-xl font-bold">Vadivelu photograph</h2>
        <p>
          Photo: Sriram Narasimhan / Silverscreen Media Inc. — “Actor Vadivelu
          in Eli’s ‘Talking Eli App’ Launch Press Meet”, 13 May 2015.
        </p>
        <p>
          <a
            className="underline"
            href="https://commons.wikimedia.org/wiki/File:Actor_Vadivelu_in_Eli%E2%80%99s_%E2%80%9CTalking_Eli_App%E2%80%9D_Launch_Press_Meet.jpg"
          >
            Original photograph and license record on Wikimedia Commons
          </a>
        </p>
        <p>
          Licensed under{' '}
          <a
            className="underline"
            href="https://creativecommons.org/licenses/by-sa/3.0/"
          >
            Creative Commons Attribution–ShareAlike 3.0 Unported
          </a>
          . Our reaction-card adaptations use a display crop, a colored layout
          and original Tamil captions. These Vadivelu card adaptations are also
          available under CC BY-SA 3.0. The original photo file is unchanged.
        </p>
      </section>
      <section className="space-y-3 rounded-2xl bg-slate-50 p-6">
        <h2 className="text-xl font-bold">Vivek photograph</h2>
        <p>Photo: Kyucasio — “Vivek Tamil actor”, 9 November 2011.</p>
        <p>
          <a
            className="underline"
            href="https://commons.wikimedia.org/wiki/File:Vivek_Tamil_actor.jpg"
          >
            Original photograph and license record on Wikimedia Commons
          </a>
        </p>
        <p>
          Dedicated to the public domain under{' '}
          <a
            className="underline"
            href="https://creativecommons.org/publicdomain/zero/1.0/"
          >
            CC0 1.0
          </a>
          . Our cards add a display crop, a colored layout and original Tamil
          captions. The original photo file is unchanged.
        </p>
      </section>
      <p className="text-sm">
        The other emoji stickers and Tamil chat-life meme captions were created
        for TamilAI Prompt. Actor photographs are used only in the comedy
        reaction category.
      </p>
    </main>
  );
}
