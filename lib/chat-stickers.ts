import suppliedPacks from './chat-sticker-packs.json';
export type ChatSticker = {
  id: string;
  kind: 'sticker' | 'meme' | 'comedy';
  emoji: string;
  ta: string;
  en: string;
  tag: string;
  color: string;
  ink: string;
  photo?: string;
  actor?: string;
  credit?: string;
  artwork?: boolean;
  thumbnail?: string;
  pack?: string;
};
export const chatStickers: readonly ChatSticker[] = [
  {
    id: 'semma',
    kind: 'sticker',
    emoji: '🔥',
    ta: 'செம மச்சி!',
    en: 'Absolutely awesome!',
    tag: 'Hype',
    color: '#ffe3d5',
    ink: '#9b3e23',
  },
  {
    id: 'ayyo',
    kind: 'sticker',
    emoji: '😵',
    ta: 'அய்யய்யோ!',
    en: 'Oh no!',
    tag: 'Surprise',
    color: '#fff0b9',
    ink: '#806219',
  },
  {
    id: 'wait',
    kind: 'sticker',
    emoji: '☕',
    ta: 'ஒரு நிமிஷம்…',
    en: 'One little minute…',
    tag: 'Wait',
    color: '#e9e1fb',
    ink: '#6b509a',
  },
  {
    id: 'deal',
    kind: 'sticker',
    emoji: '😎',
    ta: 'சரி, டீல்!',
    en: 'Okay, deal!',
    tag: 'Okay',
    color: '#d8f2e6',
    ink: '#28745d',
  },
  {
    id: 'laugh',
    kind: 'sticker',
    emoji: '🤣',
    ta: 'சிரிச்சு முடியல!',
    en: 'Cannot stop laughing!',
    tag: 'LOL',
    color: '#ffe0ed',
    ink: '#a74771',
  },
  {
    id: 'thanks',
    kind: 'sticker',
    emoji: '💛',
    ta: 'ரொம்ப நன்றி!',
    en: 'Thank you so much!',
    tag: 'Thanks',
    color: '#ffedcb',
    ink: '#8f6127',
  },
  {
    id: 'five-minutes',
    kind: 'meme',
    emoji: '🫠',
    ta: 'நான்: 5 நிமிஷம் பேசலாம்.\nஒரு மணி நேரம் கழித்து: இன்னும் chat-லதான்!',
    en: 'Me: Just a five-minute chat.\nOne hour later: Still here!',
    tag: 'Chat life',
    color: '#e6edff',
    ink: '#4b5d94',
  },
  {
    id: 'prompt-life',
    kind: 'meme',
    emoji: '🪄',
    ta: 'Expectation: ஒரே prompt-ல masterpiece!\nReality: 27வது try நடக்குது…',
    en: 'Expectation: A masterpiece in one prompt!\nReality: On attempt number 27…',
    tag: 'AI life',
    color: '#ffe6d9',
    ink: '#95543b',
  },
  {
    id: 'tea-break',
    kind: 'meme',
    emoji: '☕',
    ta: 'அவங்க: இன்னும் online-லயா?\nநான்: டீ முடிஞ்சதும் போயிடுவேன்…',
    en: 'Them: Still online?\nMe: Leaving as soon as my tea is done…',
    tag: 'Tea time',
    color: '#deefdd',
    ink: '#4e7549',
  },
  {
    id: 'vadivelu-plan',
    kind: 'comedy',
    emoji: '🤔',
    ta: 'பிளான் எல்லாம் ஓகே…\nசெய்யப் போறது யாரு?',
    en: 'Great plan… who is doing it?',
    tag: 'Planning',
    color: '#fff0c9',
    ink: '#694823',
    photo: '/chat-stickers/vadivelu.jpg',
    actor: 'Vadivelu',
    credit: 'Sriram Narasimhan / Silverscreen · CC BY-SA 3.0',
  },
  {
    id: 'vadivelu-seen',
    kind: 'comedy',
    emoji: '😅',
    ta: 'மெசேஜ் பாத்தாச்சு…\nபதில் தான் யோசிக்கிறேன்!',
    en: 'Saw your message… still thinking of a reply!',
    tag: 'Reply mode',
    color: '#e7e1ff',
    ink: '#57428a',
    photo: '/chat-stickers/vadivelu.jpg',
    actor: 'Vadivelu',
    credit: 'Sriram Narasimhan / Silverscreen · CC BY-SA 3.0',
  },
  {
    id: 'vivek-logic',
    kind: 'comedy',
    emoji: '🧠',
    ta: 'கொஞ்சம் லாஜிக்…\nகொஞ்சம் மேஜிக்!',
    en: 'A little logic… a little magic!',
    tag: 'Logic',
    color: '#dff2e8',
    ink: '#286650',
    photo: '/chat-stickers/vivek.jpg',
    actor: 'Vivek',
    credit: 'Kyucasio · CC0',
  },
  {
    id: 'vivek-online',
    kind: 'comedy',
    emoji: '☕',
    ta: 'வேலை நிறைய இருக்கு…\nஆனா chat முக்கியம்!',
    en: 'So much work… but chat comes first!',
    tag: 'Chat first',
    color: '#ffe1e6',
    ink: '#8a3951',
    photo: '/chat-stickers/vivek.jpg',
    actor: 'Vivek',
    credit: 'Kyucasio · CC0',
  },
];
export const tamilStickerPacks = suppliedPacks.map((pack) => ({
  id: pack.id,
  name: pack.name,
  stickers: pack.items.map(
    (item, index): ChatSticker => ({
      id: item.id,
      kind: 'sticker',
      emoji: '🧩',
      ta: `${pack.name} sticker ${index + 1}`,
      en: `${pack.name} sticker ${index + 1}`,
      tag: pack.name,
      color: 'transparent',
      ink: '#244b42',
      photo: `/chat-stickers/tamil-packs/full/${item.asset}.webp`,
      thumbnail: `/chat-stickers/tamil-packs/thumbs/${item.asset}.webp`,
      artwork: true,
      pack: pack.id,
    }),
  ),
}));
export const suppliedChatStickers = tamilStickerPacks.flatMap(
  (pack) => pack.stickers,
);
export function stickerBody(sticker: ChatSticker) {
  return sticker.artwork
    ? `🧩 Tamil sticker ${sticker.id}`
    : `${sticker.emoji} ${sticker.ta}`;
}
const stickerByBody = new Map(
  [...chatStickers, ...suppliedChatStickers].map((sticker) => [
    stickerBody(sticker),
    sticker,
  ]),
);
export function findChatSticker(body: string) {
  return stickerByBody.get(body);
}
export function chatStickerPreview(body: string) {
  const sticker = findChatSticker(body);
  return sticker?.artwork ? sticker.en : body;
}
