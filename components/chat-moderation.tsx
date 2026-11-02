'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Report = {
  id: string;
  excerpt: string;
  has_image?: boolean;
  reason: string;
  status: string;
  created_at: string;
};
type Archive = {
  room_id: string;
  ended_at: string;
  expires_at: string;
  ready_at: string | null;
};
export function ChatModeration() {
  const [key, setKey] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [archives, setArchives] = useState<Archive[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch('/api/chat/moderation', { cache: 'no-store' });
    const data = await response.json();
    if (response.status === 401) {
      setSignedIn(false);
      return;
    }
    if (!response.ok) throw new Error(data.error);
    setReports(data.reports);
    const archiveResponse = await fetch('/api/chat/moderation/archives', {
      cache: 'no-store',
    });
    if (!archiveResponse.ok)
      throw new Error('Could not load security archives.');
    setArchives((await archiveResponse.json()).archives);
    setSignedIn(true);
  }, []);
  useEffect(() => {
    // Authentication state is applied asynchronously after the network response.
    // oxlint-disable-next-line
    load().catch((err) => setError(err.message));
  }, [load]);
  async function act(action: string, reportId?: string) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/chat/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reportId, key }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setKey('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please retry.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-3xl">
        <Link href="/community-chat" className="text-sm font-bold text-primary">
          ← Community Chat
        </Link>
        <h1 className="mt-6 text-3xl font-bold">Chat moderation</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Review reports and restricted security archives for new chats. Archive
          PDFs contain messages and reduced-size images, expire after 30 days
          and must only be used for security review. Downloads are logged.
        </p>
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </p>
        )}
        {!signedIn ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void act('login');
            }}
            className="mt-7 max-w-md rounded-2xl border bg-card p-6"
          >
            <label className="text-sm font-bold">
              Moderator key
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                autoComplete="current-password"
                required
                className="mt-2 min-h-12 w-full rounded-xl border px-3"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="mt-4 min-h-11 rounded-xl bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50"
            >
              Sign in
            </button>
          </form>
        ) : (
          <>
            <div className="my-6 flex gap-4">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void load().catch((err) => setError(err.message))
                }
                className="min-h-11 rounded-xl border px-4 text-sm font-bold"
              >
                Refresh reports
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void act('logout')}
                className="min-h-11 rounded-xl border px-4 text-sm font-bold"
              >
                Sign out
              </button>
            </div>
            <div className="space-y-5">
              <section className="rounded-2xl border bg-card p-5">
                <h2 className="text-xl font-bold">30-day security archives</h2>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  Newest 100 ended chats. Pending archives are generated when
                  opened. Older chats retain their original policy.
                </p>
                {!archives.length && (
                  <p className="mt-4 text-sm">No retained archives.</p>
                )}
                {archives.map((archive) => (
                  <article key={archive.room_id} className="mt-4 border-t pt-4">
                    <p className="break-all font-mono text-xs">
                      {archive.room_id}
                    </p>
                    <p className="mt-1 text-xs leading-6">
                      Ended: {new Date(archive.ended_at).toLocaleString()} ·
                      Expires: {new Date(archive.expires_at).toLocaleString()}
                    </p>
                    <a
                      href={`/api/chat/moderation/archives/${archive.room_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-bold"
                    >
                      {archive.ready_at ? 'Open PDF' : 'Generate & open PDF'}
                    </a>
                  </article>
                ))}
              </section>
              {!reports.length && (
                <p className="rounded-xl border bg-card p-6 text-sm">
                  No reports.
                </p>
              )}
              {reports.map((report) => (
                <article
                  key={report.id}
                  className="rounded-2xl border bg-card p-5"
                >
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    {report.status} ·{' '}
                    {new Date(report.created_at).toLocaleString()}
                  </p>
                  <blockquote className="my-4 whitespace-pre-wrap break-words rounded-xl bg-muted p-4 text-sm leading-7">
                    {report.has_image && (
                      // Moderator-only image URL; it stops working when the chat ends.
                      // oxlint-disable-next-line
                      <img
                        src={`/api/chat/moderation/images/${report.id}`}
                        alt="Reported attachment, available only while its chat is active"
                        className="mb-3 max-h-64 max-w-full rounded-xl"
                      />
                    )}
                    {report.excerpt}
                  </blockquote>
                  <p className="text-sm leading-7">
                    <strong>Reason:</strong> {report.reason}
                  </p>
                  {report.status === 'open' && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      {[
                        ['resolve', 'Mark reviewed'],
                        ['remove-message', 'Remove reported message'],
                        ['suspend', 'Suspend guest session'],
                      ].map(([action, label]) => (
                        <button
                          key={action}
                          type="button"
                          disabled={busy}
                          onClick={() => void act(action, report.id)}
                          className="min-h-11 rounded-xl border px-4 text-xs font-bold disabled:opacity-50"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
            <p className="mt-7 text-xs leading-6 text-muted-foreground">
              Suspensions affect the current guest identity. A guest may be able
              to create a new identity after clearing cookies. Reports expire
              after seven days and are removed by activity-triggered cleanup.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
