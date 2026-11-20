# TAIE permanent contact entry

The Android editor's three-tap logo shortcut opens `/taie-contact` inside its isolated remote WebView. The gesture is discoverability only. Each visitor has a different server-side identity and private bearer return link; a visitor cannot select someone else's conversation. Owner sign-in is separate and uses `TAIE_CONTACT_OWNER_KEY`, kept only on the server and in the owner's private setup file.

The return identity persists independently from conversations. There is at most one live room per visitor/owner pair, enforced by locking the visitor session during room creation. Each room uses the existing 24-hour expiry, destroy/end controls, image clearing, archive triggers, PDF generation, encryption, and 30-day archive retention. A return after expiry or destruction creates a new room. A copied return link grants access to that visitor identity; it must remain private. Suspending a visitor invalidates their return link.

No database migration is required. The existing `tamil_chat.sessions` table stores the persistent contact identities, and namespaced markers in the existing `tamil_chat.limits` key/value table distinguish contact identities from ordinary guest sessions. They remain unavailable to the browser's Supabase Data API. Link identity records have a 100-year horizon; live chat content and PDFs retain their existing shorter limits.

Owner authentication uses random, revocable server-side sessions, valid for seven days. Signing in on another device replaces the previous owner chat token. Signing out removes its authorization marker, so replaying the former chat cookie cannot retrieve messages. No owner key is embedded in APKs, public bundles, URLs, or browser storage.

The owner key also derives the stable owner ID. Do not rotate it casually: rotation creates a new owner identity. Use a deliberate session migration if an identity must be retained while replacing the key.

The contact and conversation pages do not load advertising or analytics scripts. The return credential travels in a URL fragment and is removed from the address on restoration, then exchanged for an HttpOnly cookie. POST requests enforce same origin and JSON content type; starts, owner authentication, polling and room creation are rate limited.

`max_pipeline: 1` keeps queries compatible with the Supavisor transaction pool under concurrent requests. Tests reproduced queued-transaction stalls with pipelining and passed concurrent opens after this change. The PostgreSQL client is pinned to 4.1.1; Next.js is patched to the current 16.4.6 security release.

## Verification

- `node scripts/test-chat-contact.mjs`, against a local server configured with a separate disposable owner key: owner authentication and logout/replay prevention, visitor isolation, simultaneous open deduplication, permanent link restoration, room destruction and expiry, image capture in an encrypted PDF, 30-day retention. All fixtures and their PDFs are removed afterwards.
- `node scripts/test-chat.mjs`: existing guest chat regression checks.
- Mobile browser checks: consent, nickname entry, owner sign-in, no horizontal overflow, no ad/analytics scripts.
- `npx tsc --noEmit`, targeted `oxlint`, and production build.
