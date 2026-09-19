'use client';

import { useEffect } from 'react';

type AdsenseSlotName = 'home-top' | 'home-mid' | 'prompt-inline' | 'prompt-sidebar' | 'hashtags-top' | 'daily-top';

type AdsenseSlotProps = {
  name: AdsenseSlotName;
  label?: string;
  className?: string;
};

const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

const adSlots: Record<AdsenseSlotName, string | undefined> = {
  'home-top': process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP,
  'home-mid': process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_MID,
  'prompt-inline': process.env.NEXT_PUBLIC_ADSENSE_SLOT_PROMPT_INLINE,
  'prompt-sidebar': process.env.NEXT_PUBLIC_ADSENSE_SLOT_PROMPT_SIDEBAR,
  'hashtags-top': process.env.NEXT_PUBLIC_ADSENSE_SLOT_HASHTAGS_TOP,
  'daily-top': process.env.NEXT_PUBLIC_ADSENSE_SLOT_HASHTAGS_TOP ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP,
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdsenseSlot({ name, label = 'Advertisement', className = '' }: AdsenseSlotProps) {
  const slot = adSlots[name];
  const canRenderAd = Boolean(publisherId && slot);

  useEffect(() => {
    if (!canRenderAd) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // Ad blockers or delayed AdSense scripts can throw here. The placeholder still keeps layout stable.
    }
  }, [canRenderAd, name, slot]);

  return (
    <aside
      aria-label={label}
      className={`mx-auto w-full max-w-7xl px-4 sm:px-6 ${className}`}
    >
      <div className="overflow-hidden rounded-3xl border border-dashed border-border bg-card/70 p-3 text-center shadow-[0_8px_28px_-26px_oklch(0.2_0.04_300/.35)]">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        {canRenderAd ? (
          <ins
            className="adsbygoogle block min-h-[90px] w-full"
            data-ad-client={publisherId}
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          <div className="grid min-h-[90px] place-items-center rounded-2xl bg-muted/70 px-4 text-xs font-semibold text-muted-foreground">
            Ad space ready for Google AdSense
          </div>
        )}
      </div>
    </aside>
  );
}
