'use client';

import { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

declare global {
  interface Window {
    instgrm?: {
      Embeds?: {
        process: () => void;
      };
    };
  }
}

type InstagramEmbedProps = {
  url: string;
  caption: string;
  source: string;
};

export function InstagramEmbed({ url, caption, source }: InstagramEmbedProps) {
  useEffect(() => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.instagram.com/embed.js"]');

    if (existingScript) {
      window.instgrm?.Embeds?.process();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.instagram.com/embed.js';
    script.onload = () => window.instgrm?.Embeds?.process();
    document.body.appendChild(script);
  }, [url]);

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-white p-3 shadow-[0_10px_34px_-24px_oklch(0.24_0.08_300/.5)]">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{
          background: '#fff',
          border: 0,
          borderRadius: 16,
          margin: '0 auto',
          maxWidth: 540,
          minWidth: 280,
          width: '100%',
        }}
      >
        <a href={url} target="_blank" rel="noopener noreferrer">
          View this trend example on Instagram
        </a>
      </blockquote>
      <div className="mt-3 rounded-2xl bg-muted px-4 py-3 text-sm leading-6 text-muted-foreground">
        <p>{caption}</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 font-bold text-primary hover:underline">
          Open {source} on Instagram
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
