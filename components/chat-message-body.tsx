'use client';

export function ChatMessageBody({
  text,
  onOpenPhoto,
}: {
  text: string;
  onOpenPhoto: (id: string) => void;
}) {
  return (
    <>
      {text.split(/(https?:\/\/[^\s<>]+)/g).map((part, index) => {
        if (!/^https?:\/\//i.test(part)) return <span key={index}>{part}</span>;
        const href = part.replace(/[.,!?;]+$/g, '');
        const suffix = part.slice(href.length);
        try {
          const url = new URL(href);
          if (!['https:', 'http:'].includes(url.protocol))
            return <span key={index}>{part}</span>;
        } catch {
          return <span key={index}>{part}</span>;
        }
        return (
          <span key={index}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-medium underline decoration-current/40 underline-offset-2 hover:decoration-current"
              onClick={(event) => {
                const url = new URL(href);
                const match = url.pathname.match(
                  /^\/api\/chat\/images\/(\d+)$/,
                );
                if (url.origin === window.location.origin && match) {
                  event.preventDefault();
                  onOpenPhoto(match[1]);
                }
              }}
            >
              {href}
            </a>
            {suffix}
          </span>
        );
      })}
    </>
  );
}
