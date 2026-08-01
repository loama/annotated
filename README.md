# Annotated

Annotated is a source-first public notebook for the web. The Chrome side panel captures selected text and media timing from the current page. The public web app turns each capture into a shareable annotation with commentary, discussion, and a permanent route back to the original source.

## Product requirements covered

- Chrome side-panel extension as the primary capture surface
- YouTube and video clips capped at 90 seconds and presented at 240p
- Article passage capture with publisher and source metadata
- Podcast and audio excerpts capped at 90 seconds
- Text and browser-recorded audio commentary
- Public feed, profiles, follow controls, and comments
- Original source link on every annotation
- Visible fair-use claim flow on every annotation
- Google OAuth sign-in with a verified server session and no password form

## Run locally

```bash
bun install
bun run dev
```

Open `http://localhost:3000`.

## Validate

```bash
bun run test
bun run typecheck
bun run build
```

## Persistence

Production annotations, comments, follows, claims, and generated media use private Vercel Blob storage through `BLOB_READ_WRITE_TOKEN`. Timed video excerpts are transcoded to H.264 at 240 pixels high, and audio excerpts and voice commentary are stored as durable MP3 assets. Seed annotations remain visible without credentials, while publishing and social mutations require a verified Google session.

## Environment

Create `.env.local` with:

```bash
BLOB_READ_WRITE_TOKEN=...
AUTH_SECRET=...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

On macOS, set `YT_DLP_PATH` to a current local `yt-dlp` binary for YouTube clip development. Production uses the bundled Linux binary in `bin/yt-dlp`.

## Extension

The `extension` directory contains the complete Manifest V3 side-panel extension. Its `APP_ORIGIN` and `frame-src` values point to the production deployment. The guided installation page is published at `/extension`; its developer-preview archive is available at `/annotated-sidepanel.zip` while the Chrome Web Store listing is pending.
