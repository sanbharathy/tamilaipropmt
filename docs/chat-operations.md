# Private creator chat

Public search page: /tamil-chat. Lobby: /community-chat. Conversations: /chat/[roomId]. Moderator dashboard: /community-chat/moderation. Rules: /community-chat/rules. Conversations and APIs are noindex; only the public landing page is in the sitemap. Ads never load on conversation pages.

## Access and controls

A guest nickname requires no email or phone. A 24-hour HTTP-only, SameSite=Strict cookie identifies the guest; production cookies are Secure. Nicknames are not verified or unique. Clearing cookies loses access. Discovery is off by default and only lists opted-in guests with the same interest and presence within 50 seconds. Chat starts only after acceptance; two people maximum. Invites use single-use random tokens in fragments, with only their hashes stored. Legacy lobby links resolve to dedicated rooms. Chat polls every four seconds while visible.

Only the creator can destroy an invitation. End, destroy, block, logout, moderator suspension and expiry make the chat inaccessible and clear live image payloads. Destroying a new chat does not delete its disclosed 30-day security archive. Old rooms keep their original retention policy and are never retrospectively archived.

The messenger has an options menu, clickable image viewer with zoom, safe HTTP(S) links, and original Tamil stickers/memes. Four actor-photo comedy cards use licensed local assets; sources and credits are at /sticker-credits. Captions are fan-made. No actor endorsement is implied.

## Images

JPG, PNG or WebP source files up to 2 MB are checked by signature and decoded with a 16 MP limit. Animated files are rejected. Sharp strips original metadata, resizes to 1200px and outputs WebP up to 512 KB. Maximum ten images per chat. Participant image endpoints require an accepted active room and return no-store, noindex responses. The public Next.js image optimizer is allowlisted to artwork, so private API images cannot enter its shared cache.

Local previews are revoked on remove, send, end and unmount. The viewer unmounts after chat end. Reports refer to the original live image rather than copying it. Moderators can review reported live attachments; archived copies have separate access controls and retention.

## Security archive

New rooms require acknowledgement of the updated archive notice. Existing guest sessions see a blocking notice before continuing; new join forms disclose the policy. Backend consent checks prevent older clients from joining or sending into a new archived room without acknowledgement.

Database triggers atomically capture all message text, shared images, guest nicknames and IDs, timestamps, status events and end reason before live image clearing. A durable RLS-protected processing snapshot survives room/session removal. New rooms have a 1,000-message and ten-image cap to bound archive generation.

Background workers select snapshots with FOR UPDATE SKIP LOCKED, generate PDFs, encrypt them with AES-256-GCM and room-ID authenticated data, store SHA-256 digests and clear the snapshot in one transaction. Failed or interrupted work leaves the snapshot for retry rather than a partial PDF. Processing snapshots temporarily contain original chat image data; final PDFs contain reduced copies at most 512px at JPEG quality 45. Sticker captions and actor photos are included. Exact Unicode text is embedded as transcript-utf8.json to preserve emoji that the print font cannot display. Tamil text uses the bundled open licensed Noto Sans Tamil font.

PDF generation runs after chat activity and moderator operations. Opening a pending archive generates it on demand. An authenticated daily Vercel cron at /api/chat/maintenance is a recovery path. This is separate from the database expiry/purge scheduler.

The Supabase pg_cron job tamilaiprompt-chat-retention runs tamil_chat.archive_retention() every minute. It ends expired rooms, deletes expired room/message records, cleans seven-day reports/session leftovers and removes expired archives. Its queries touch only tamil_chat. Archived data is inaccessible at ended_at + 30 days; physical purge normally follows within a minute while the database is running. Pending snapshots share that deadline. Downloaded copies/screenshots and provider-managed backup retention cannot be remotely erased by this application. These are service records, not verified identities or forensic originals.

## Database and credentials

The isolated tamil_chat schema lives in the previously approved Mumbai Supabase database. Runtime uses the restricted tamilaiprompt_chat login. Anonymous/authenticated Supabase Data API roles have no chat access; the app role has no host-application table access. All browser requests go through server route authorization.

Production secrets: CHAT_DATABASE_URL, CHAT_RATE_SALT, CHAT_MODERATOR_KEY and CRON_SECRET. Never expose them with NEXT_PUBLIC_ names or logs. Local copies are ignored in .env.chat.local; the moderator key alone is in .env.chat-moderator.local. Archive encryption derives a domain-separated key from CHAT_RATE_SALT using HMAC-SHA256. Do not rotate that salt without migrating retained archives.

Base schema: database/chat.sql. Images: database/chat-images.sql. Forward-only archives: database/chat-archives.sql. Setup/migration scripts use a temporary admin connection file and remove it afterward; runtime must always use the restricted role. Never inspect or modify unrelated application tables.

## Moderation

The owner signs in at /community-chat/moderation using the local moderator key. A one-hour HTTP-only cookie is scoped to moderation API paths. The dashboard lists reported messages and the newest 100 ended-chat archives. Every PDF download is logged. Participant cookies, invitation tokens and unauthenticated requests cannot access archives. PDF responses are private/no-store/noindex and are never public storage URLs.

For new rooms, moderator message removal hides a message from participants while preserving it and its removal timestamp for the archive. Suspensions affect a guest identity; a person can potentially create another identity after clearing cookies. No automated content classifier or 24/7 human review is provided. This service is not end-to-end encrypted.

## Limits and operations

Per guest: 15 messages/minute, 10 room attempts/hour, 5 reports/hour, 60 mutations/minute, 20 image attempts/hour. Network: 8 joins/hour, 30 room attempts/hour, 120 messages/5 minutes and 30 image attempts/hour. Network identifiers are keyed hashes, not raw IPs in chat tables. Hosting logs may separately retain technical identifiers.

The chat shares the existing free database and Vercel hosting usage. No paid upgrade was configured. Monitor database size as 30-day archives accumulate. Provider pause/outage can delay physical maintenance; access checks still enforce timestamps whenever the service is serving requests.

## Validation

Run the local server with .env.chat.local loaded. Run node scripts/test-chat-archives.mjs and CHAT_TEST_SEED_GUESTS=1 node scripts/test-chat-images.mjs. These exercise notice gating, end/destroy/block/logout/expiry, image checks, outsider isolation, archive encryption and hash verification, moderator-only download logging, deadline denial/purge, and legacy exclusion. Test identities and archives are removed afterward. The text and destroy suites cover discovery, deduplication, concurrent invite claims and creator-only controls.

Use CHAT_TEST_URL for one production smoke test; avoid repeated load tests against the shared free database. Run lint, TypeScript and production build before release. Render sample PDFs with Poppler and inspect Tamil text, photos, pagination and embedded Unicode transcript.
