/** Match one displayed emoji, including joined families, flags and skin tones. */
export function isSingleEmoji(value: string): boolean {
  const text = value.trim();
  if (!text || text.length > 64) return false;
  const segments = Array.from(
    new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text),
  );
  return (
    segments.length === 1 &&
    (/\p{Extended_Pictographic}/u.test(text) ||
      /^\p{Regional_Indicator}{2}$/u.test(text) ||
      /^[0-9#*]\uFE0F?\u20E3$/u.test(text))
  );
}
