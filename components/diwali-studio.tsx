'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Copy, Languages, Sparkles } from 'lucide-react';
import { diwaliGreetings, diwaliPrompts } from '@/lib/diwali';

function CopyButton({ text, tamil, label }: { text: string; tamil: boolean; label?: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
      window.setTimeout(() => setStatus('idle'), 2200);
    } catch {
      setStatus('failed');
    }
  }
  return <div>
    <button onClick={copy} type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#652a2a] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#873c31] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#873c31]">
      {status === 'copied' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      <span aria-live="polite">{status === 'copied' ? (tamil ? 'நகலெடுக்கப்பட்டது' : 'Copied!') : (label ?? (tamil ? 'நகலெடு' : 'Copy'))}</span>
    </button>
    {status === 'failed' && <p role="alert" className="mt-2 text-sm text-red-800">{tamil ? 'நகலெடுக்க முடியவில்லை. உரையைத் தேர்ந்தெடுத்து நகலெடுக்கவும்.' : 'Copy unavailable. Select the text and copy it manually.'}</p>}
  </div>;
}

const greetingTypes = [
  { id: 'All', ta: 'அனைத்தும்', en: 'All wishes' },
  { id: 'Family', ta: 'குடும்பம்', en: 'Family' },
  { id: 'Friends', ta: 'நண்பர்கள்', en: 'Friends' },
  { id: 'Welcome', ta: 'வரவேற்பு', en: 'Welcome' },
  { id: 'Business', ta: 'வாடிக்கையாளர்கள்', en: 'Customers' },
  { id: 'Short', ta: 'சிறிய வாழ்த்து', en: 'Short & sweet' },
];

export function DiwaliStudio() {
  const [tamil, setTamil] = useState(true);
  const [tab, setTab] = useState<'prompts' | 'wishes'>('prompts');
  const [name, setName] = useState('');
  const [audience, setAudience] = useState('All');
  const [format, setFormat] = useState('4:5');
  const signed = (message: string) => name.trim() ? `${message}\n\n${tamil ? 'அன்புடன்' : 'With warm wishes'},\n${name.trim()}` : message;
  const promptFor = (item: typeof diwaliPrompts[number]) => {
    const personal = ['Portrait', 'Family', 'Welcome', 'Couple'].includes(item.tag);
    return tamil
      ? `${personal ? 'நான் upload செய்யும் புகைப்படத்தை reference ஆக பயன்படுத்தவும். முக அடையாளம், வயது, இயல்பான தோல் நிறம் ஆகியவற்றை மாற்ற வேண்டாம். ' : ''}${item.sceneTa}\nபட விகிதம் ${format}. உண்மையான புகைப்படத் தோற்றம்; ஓவியமாகவோ cartoon ஆகவோ வேண்டாம். ${item.tag === 'Business' ? 'உங்கள் நிறுவனப் பெயரால் [BUSINESS NAME] பகுதியை மாற்றவும். ' : ''}கீழ் வலது மூலையில் சிறிய “tamilaiprompt.com” watermark சேர்க்கவும். வேறு எழுத்துகள் வேண்டாம்.`
      : `${personal ? 'Use my uploaded photo as the reference. Preserve facial identity, age and natural skin tone. ' : ''}${item.scene}\nAspect ratio ${format}. Photorealistic, not a painting or cartoon. ${item.tag === 'Business' ? 'Replace [BUSINESS NAME] with your business name. ' : ''}Add a small readable “tamilaiprompt.com” watermark in the bottom-right corner. No other text.`;
  };

  return (
    <main className="min-h-screen bg-[#fffaf0] text-[#382323]">
      <header className="border-b border-[#e6d8bf] bg-[#fffaf0]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold"><ArrowLeft size={17} aria-hidden="true" />TamilAI Prompt</Link>
          <button type="button" onClick={() => setTamil(!tamil)} aria-label={tamil ? 'Switch to English' : 'தமிழுக்கு மாற்றவும்'} className="flex min-h-11 items-center gap-2 rounded-full border border-[#d8c3a0] px-4 text-sm font-semibold"><Languages size={16} aria-hidden="true" />{tamil ? 'English' : 'தமிழ்'}</button>
        </div>
      </header>

      <section className="overflow-hidden bg-[#38151d] text-[#fff2d5]">
        <div className="mx-auto grid max-w-6xl items-center gap-2 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
          <div className="relative z-10">
            <p className="mb-5 text-xs font-bold uppercase tracking-[.24em] text-[#efbd75]">DIWALI · தீபாவளி</p>
            <h1 className="text-3xl font-bold leading-[1.6] sm:text-5xl sm:leading-[1.5]">{tamil ? <>ஒளியுடன் ஒரு படம்.<br /><span className="text-[#f5c87e]">அன்புடன் ஒரு வாழ்த்து.</span></> : <>A little light.<br /><span className="text-[#f5c87e]">A lot of love.</span></>}</h1>
            <p className="mt-5 max-w-lg text-sm leading-8 text-[#ead1c5] sm:text-base">{tamil ? 'உங்கள் புகைப்படத்தை தீபாவளி நினைவாக மாற்றுங்கள். மனம் நிறைந்த தமிழ் வாழ்த்துகளையும் வரவேற்புச் செய்திகளையும் பகிருங்கள்.' : 'Turn your photo into a festive keepsake. Share heartfelt Diwali wishes and a warm welcome with the people who matter.'}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#diwali-content" onClick={() => setTab('prompts')} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c87e] px-5 text-sm font-bold text-[#38151d]">{tamil ? 'Photo prompts' : 'Explore photo prompts'}<ArrowRight size={17} aria-hidden="true" /></a>
              <a href="#diwali-content" onClick={() => setTab('wishes')} className="inline-flex min-h-12 items-center rounded-full border border-[#a0715e] px-5 text-sm font-bold">{tamil ? 'தமிழ் வாழ்த்துகள்' : 'Find a greeting'}</a>
            </div>
          </div>
          <Image src="/diwali-lamps.svg" alt={tamil ? 'மலர் இதழ்களுடன் ஒளிரும் அகல் விளக்குகளின் ஓவியம்' : 'Illustrated clay lamps glowing beside flower petals'} width={1200} height={800} priority className="mx-auto w-full max-w-xl rounded-[3rem]" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-10 grid gap-5 border-b border-[#e6d8bf] pb-8 text-sm leading-7 sm:grid-cols-3">
          {[tamil ? '01 · உங்கள் படத்தை Gemini / ChatGPT-ல் upload செய்யுங்கள்' : '01 · Upload your photo in Gemini / ChatGPT', tamil ? '02 · விருப்பமான prompt-ஐ copy செய்து பயன்படுத்துங்கள்' : '02 · Copy a prompt and create your festive image', tamil ? '03 · தமிழ் வாழ்த்தைச் சேர்த்து பகிருங்கள்' : '03 · Add your greeting and share the joy'].map(step => <p key={step}>{step}</p>)}
        </div>

        <section id="diwali-content" className="scroll-mt-6">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div role="tablist" aria-label={tamil ? 'தீபாவளி தொகுப்புகள்' : 'Diwali collections'} className="inline-flex max-w-full gap-1 rounded-2xl bg-[#eee3cf] p-1.5">
              {(['prompts', 'wishes'] as const).map(value => <button key={value} type="button" role="tab" id={`tab-${value}`} aria-selected={tab === value} aria-controls={`panel-${value}`} onClick={() => setTab(value)} className={`min-h-12 rounded-xl px-4 text-sm font-bold sm:px-6 ${tab === value ? 'bg-[#fffaf0] shadow-sm' : 'text-[#715d4d]'}`}>{value === 'prompts' ? (tamil ? '8 பட prompts' : '8 photo prompts') : (tamil ? '12 வாழ்த்துகள்' : '12 greetings')}</button>)}
            </div>
            <p className="text-xs text-[#715d4d]">{tamil ? 'இலவசமாக copy செய்யுங்கள் · உங்கள் விருப்பப்படி மாற்றுங்கள்' : 'Free to copy · Make it your own'}</p>
          </div>

          {tab === 'prompts' ? <div role="tabpanel" id="panel-prompts" aria-labelledby="tab-prompts" className="mt-8">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
              <div><h2 className="text-2xl font-bold leading-relaxed">{tamil ? 'உங்கள் தீபாவளி. உங்கள் ஸ்டைல்.' : 'Your Diwali. Your style.'}</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-[#715d4d]">{tamil ? 'முகம் உள்ள படங்களுக்கு உங்கள் reference photo தேவை. AI உருவாக்கும் முகம் அல்லது தமிழ் எழுத்துகள் சரியாக இல்லாவிட்டால் மீண்டும் முயற்சிக்கவும்; வாழ்த்தை Canva-வில் தனியாகச் சேர்க்கலாம்.' : 'Portrait prompts need your reference photo. AI faces and Tamil lettering can vary; add the greeting separately in Canva for clean text.'}</p></div>
              <label className="flex items-center gap-3 text-sm font-semibold">{tamil ? 'பட அளவு' : 'Image ratio'}<select value={format} onChange={e => setFormat(e.target.value)} className="min-h-11 rounded-xl border border-[#d8c3a0] bg-white px-3"><option value="4:5">4:5 · Post</option><option value="9:16">9:16 · Story</option><option value="1:1">1:1 · Square</option></select></label>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {diwaliPrompts.map((item, index) => <article key={item.titleEn} className="flex flex-col rounded-3xl border border-[#e6d8bf] bg-white p-5 sm:p-7">
                <div className="flex items-center justify-between gap-3"><span className="font-heading text-3xl text-[#b58c50]">{String(index + 1).padStart(2, '0')}</span><span className="rounded-full bg-[#f8efdf] px-3 py-1 text-xs font-bold text-[#76522e]">{item.tag}</span></div>
                <h3 className="mt-4 text-lg font-bold leading-8">{tamil ? item.titleTa : item.titleEn}</h3>
                <details className="my-5 flex-1 rounded-2xl bg-[#fcf8f0] p-4"><summary className="cursor-pointer text-sm font-semibold">{tamil ? 'முழு prompt-ஐப் படிக்க' : 'Read the full prompt'}</summary><p className="mt-4 whitespace-pre-line break-words text-sm leading-8 text-[#655048]">{promptFor(item)}</p></details>
                <CopyButton text={promptFor(item)} tamil={tamil} label={tamil ? 'Prompt நகலெடு' : 'Copy prompt'} />
              </article>)}
            </div>
            <div className="mt-6 rounded-2xl border border-[#e6d8bf] p-5 text-sm leading-7"><p className="font-bold">{tamil ? 'படம் உருவாக்கத் தயாரா?' : 'Ready to create?'}</p><p>{tamil ? 'Prompt-ஐ copy செய்து உங்களுக்கு விருப்பமான image tool-ல் பயன்படுத்துங்கள். அந்த tool-ன் இலவச வரம்புகள் அல்லது கட்டணம் பொருந்தும்.' : 'Copy a prompt and use it in your preferred image tool. That tool’s free limits or charges apply.'}</p><div className="mt-3 flex flex-wrap gap-5 font-bold text-[#873c31]"><a href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer">Gemini ↗</a><a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">ChatGPT ↗</a></div></div>
          </div> : <div role="tabpanel" id="panel-wishes" aria-labelledby="tab-wishes" className="mt-8">
            <h2 className="text-2xl font-bold leading-relaxed">{tamil ? 'அன்பைச் சொல்ல அழகான வார்த்தைகள்.' : 'Words that feel like a warm hug.'}</h2>
            <label className="mt-5 block max-w-md text-sm font-semibold">{tamil ? 'உங்கள் பெயர் / நிறுவனப் பெயர் (விருப்பம்)' : 'Your name / business name (optional)'}<input value={name} onChange={e => setName(e.target.value)} maxLength={80} placeholder={tamil ? 'உதா: கார்த்திக் & குடும்பத்தினர்' : 'e.g. Karthik & family'} className="mt-2 min-h-12 w-full rounded-xl border border-[#d8c3a0] bg-white px-4 font-normal" /></label>
            <div className="my-6 flex flex-wrap gap-2" aria-label={tamil ? 'வாழ்த்து வகை' : 'Greeting category'}>{greetingTypes.map(type => <button key={type.id} type="button" aria-pressed={audience === type.id} onClick={() => setAudience(type.id)} className={`min-h-11 rounded-full border px-4 text-sm ${audience === type.id ? 'border-[#652a2a] bg-[#652a2a] text-white' : 'border-[#d8c3a0] bg-white'}`}>{tamil ? type.ta : type.en}</button>)}</div>
            <div className="grid gap-5 md:grid-cols-2">{diwaliGreetings.filter(item => audience === 'All' || item.type === audience).map(item => <article key={item.en} className="flex flex-col rounded-3xl border border-[#e6d8bf] bg-white p-6"><span className="mb-4 text-xs font-bold uppercase tracking-widest text-[#9a6938]">{greetingTypes.find(type => type.id === item.type)?.[tamil ? 'ta' : 'en']}</span><p className="mb-6 flex-1 whitespace-pre-line break-words text-base leading-9">{signed(tamil ? item.ta : item.en)}</p><CopyButton text={signed(tamil ? item.ta : item.en)} tamil={tamil} label={tamil ? 'வாழ்த்தை நகலெடு' : 'Copy greeting'} /></article>)}</div>
          </div>}
        </section>

        <section className="mt-12 rounded-3xl bg-[#eee3cf] p-6 sm:p-8">
          <Sparkles className="mb-3 text-[#873c31]" aria-hidden="true" /><h2 className="text-lg font-bold">{tamil ? 'பகிர்வதற்கு முன் ஒரு சிறிய குறிப்பு' : 'A thoughtful finishing touch'}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-8 text-[#655048]">{tamil ? 'வாழ்த்தை உங்கள் சொந்த வார்த்தைகளால் மாற்றுங்கள். AI உருவாக்கிய படத்தை உண்மையான நிகழ்வின் புகைப்படமாகக் குறிப்பிட வேண்டாம். விளக்குகளை துணி, பூக்கள் மற்றும் குழந்தைகளிடமிருந்து பாதுகாப்பான தூரத்தில் வைத்திருங்கள்.' : 'Make each greeting personal. Describe AI creations as AI images when sharing them. Keep real lamps safely away from fabric, flowers, and children.'}</p>
        </section>
        <footer className="mt-10 flex flex-wrap gap-6 border-t border-[#e6d8bf] pt-6 text-sm font-semibold text-[#715d4d]"><Link href="/">{tamil ? 'அனைத்து prompts' : 'All prompts'}</Link><Link href="/hashtags">Hashtags</Link><Link href="/daily-creator-ideas">Daily ideas</Link><Link href="/privacy">Privacy</Link><Link href="/contact">Contact</Link></footer>
      </div>
    </main>
  );
}
