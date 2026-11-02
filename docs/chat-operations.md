# Private creator chat

Routes: `/community-chat`, `/community-chat/rules`, `/community-chat/moderation`.

Conversations open exclusively at `/chat/[roomId]`. New invitation links use that path with the single-use token in a fragment. Old `/community-chat#invite=...` links resolve to the dedicated page. No directory, marketing sections, ads or general site navigation are shown in the conversation view.

## Temporary image sharing

`POST /api/chat/images` accepts one authenticated multipart JPG, PNG or WebP file (max 2 MB), validates file signatures and decoding, strips metadata, rotates and resizes to 1200 pixels, and encodes WebP (max 512 KB stored). Each room holds at most ten images. Images are bytea payloads in `tamil_chat.messages` for this bounded initial version, keeping them private without a separate storage service. `GET /api/chat/images/[messageId]` requires a live participant cookie and an active, unexpired room. Images are never returned in JSON, public links, Next.js image optimization, or cacheable responses.

`database/chat-images.sql` adds the columns and an AFTER UPDATE trigger. Any transition to ended/declined immediately sets image payloads and MIME types to NULL, including all rooms affected by block, logout or moderator suspension. Expiry is checked on activity, ends the affected rooms and invokes the same trigger. Image reads reject expiry even before that check runs. Moderator image access joins through an actual report to the original active message; no copy survives the chat. Database/provider backups and files recipients saved themselves are outside this application-level clearing mechanism.

The private page revokes local preview URLs on remove/send/end/unmount. Image attempts are capped at 20/hour per guest and 30/hour per network. File access is same-origin, private, no-store, and noindex. `scripts/test-chat-images.mjs` verifies validation, participant isolation, metadata removal, consent, clearing on end/block/logout/suspension/expiry, and moderation image access.

For repeated operator-run production image tests, `CHAT_TEST_SEED_GUESTS=1 CHAT_TEST_URL=https://www.tamilaiprompt.com node scripts/test-chat-images.mjs` seeds disposable guest identities directly through the restricted local database connection instead of consuming public signup limits. All HTTP message/image access checks still run normally; no test bypass is deployed in an application route. The script removes its fixture records afterward. The separate text-chat suite verifies normal guest signup.

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
