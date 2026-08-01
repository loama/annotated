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
- Google and X account entry points with no password form

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

Production annotations, comments, and claims use Vercel Blob through `BLOB_READ_WRITE_TOKEN`. Without that environment variable, the app remains fully explorable with its editorial seed feed and keeps newly published annotations in the current browser plus the share URL.

## Extension

The `extension` directory contains the complete Manifest V3 side-panel extension. Its `APP_ORIGIN` and `frame-src` values point to the production deployment. Zip that directory for distribution after deployment.
