# Private creator chat

Routes: `/community-chat`, `/community-chat/rules`, `/community-chat/moderation`.

Two-person guest conversations with single-use invite links and explicit acceptance. The optional people list shows only guests who enabled availability, chose the same interest, and updated presence within 50 seconds. Discovery operates while the chat page is open. Messages refresh every four seconds while the tab is visible; this version uses polling, not WebSockets.

## Storage and credentials

The `tamil_chat` schema is isolated in the existing Mumbai Supabase database. The `tamilaiprompt_chat` PostgreSQL login has no access to host application tables; setup checks this and rolls back if it detects inherited table access. Anonymous and authenticated Supabase Data API roles have no chat table access. The chat app connects through Supavisor with a server-only restricted-role connection URL. Existing application tables and authentication settings are unchanged.

Production secrets: `CHAT_DATABASE_URL`, `CHAT_RATE_SALT`, `CHAT_MODERATOR_KEY`. Never give them `NEXT_PUBLIC_` names. Local copies are ignored in `.env.chat.local`; the moderator key alone is in `.env.chat-moderator.local`. No email, password or phone signup is implemented. Guest cookies are HTTP-only, SameSite=Strict, and Secure in production, and last up to 24 hours. Guest nicknames are not verified or unique. Clearing cookies loses access.

The schema migration is `database/chat.sql`. `scripts/setup-chat.mjs` bootstraps a new restricted role only once and refuses to rotate an existing role. It requires a private temporary admin JSON connection file; do not commit or retain that file after setup. Do not run setup against an unrelated database. Runtime code must use the restricted role only.

## Moderation

Open `/community-chat/moderation` and enter the key from the owner-only local moderator file. The key is not a public account password. Successful login creates a one-hour HTTP-only moderator cookie. Review reported excerpts; remove the reported message, suspend the reported guest session, or mark the report reviewed. The dashboard does not expose whole conversations. Moderators and database administrators can technically access stored data: this is **not end-to-end encrypted**.

Blocking ends existing conversations between the two guest identities and prevents new requests or invite acceptance. A guest who clears cookies may create another identity, subject to network/session limits. No automated content classifier or 24/7 human moderation is supplied. Operator review of reports remains necessary.

## Retention and limits

Rooms expire 24 hours after creation. Reads and writes check session and room expiry. Cleanup is triggered by chat activity at most once per hour and removes expired rooms (cascading messages), reports older than seven days, and guest sessions expired for seven days. When traffic stops, records remain until the next cleanup. This is activity-driven retention, not a scheduled deletion guarantee.

Per guest: 15 message attempts/minute, 10 new room/request attempts/hour, 5 reports/hour, and 60 mutation attempts/minute. Network limits: 8 guest joins/hour, 30 room/request attempts/hour, and 120 messages/5 minutes. Rate limiting uses a keyed network-address hash; raw addresses are not stored in chat tables. Provider logs may retain addresses independently. No per-message AI costs are incurred; chat shares the existing database's capacity and Vercel hosting usage.

## Validation

Run the local server with `.env.chat.local` loaded, then `node scripts/test-chat.mjs`. It tests independent guests, consent, privacy, concurrent invitation claims, duplicate sends, discovery, blocking, reporting, moderator access, and cleanup of its own test records. For a live smoke test, set `CHAT_TEST_URL` to the production origin. Do not run repeated load tests against the shared free database.

Before launch, run lint, TypeScript, and the production build. Confirm public pages, server origin checks, Secure cookies, and independent-session messaging after deployment. Chat pages and APIs are excluded from indexing so private conversations never become search results.
