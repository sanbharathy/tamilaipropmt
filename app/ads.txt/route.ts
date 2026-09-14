export const dynamic = 'force-static';

export function GET() {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  const body = publisherId
    ? `google.com, ${publisherId.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`
    : '# TamilAI Prompt ads.txt\n# Add NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX in Vercel after AdSense approval.\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
