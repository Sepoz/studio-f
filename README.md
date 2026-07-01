# Studio

A single-user study app: upload PDFs, read them in a tidy viewer, and enrich them with text highlighting, page notes, freehand drawing, and AI summaries/explanations.

Stack: Laravel 13 · Inertia v3 · React 19 · TypeScript · Tailwind v4 · shadcn/ui (brutalist theme) · SQLite · pdf.js (`react-pdf`). AI via [Cortecs](https://docs.cortecs.ai) (OpenAI-compatible, streamed).

## Setup

```bash
composer setup          # install deps, .env, key, migrate, build
touch database/database.sqlite   # only if it doesn't exist yet
php artisan storage:link
```

Then set the Cortecs variables in `.env` (see below) to enable AI features.

## Running

```bash
composer run dev        # serve + queue worker + Vite + logs (concurrently)
```

The queue worker is required — uploaded PDFs are counted/parsed in a background job (database queue), and stay in **Processing** until it runs.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CORTECS_API_KEY` | Cortecs API key; enables AI summary/explanation | Yes (for AI) |
| `CORTECS_BASE_URL` | Cortecs API base URL | No (default: `https://api.cortecs.ai/v1`) |
| `CORTECS_MODEL` | Model id used for AI calls | Yes (for AI) |

Run `php artisan cortecs:models` to list model ids available to your account, then set `CORTECS_MODEL`.

Standard Laravel vars (`APP_*`, `DB_*`, `FILESYSTEM_DISK`, `QUEUE_CONNECTION`) use the defaults in `.env.example` — SQLite + database queue, PDFs stored on the private `local` disk.

## Commands

```bash
composer test           # lint + static analysis + Pest
composer ci:check       # full CI gate (eslint, prettier, tsc, phpstan, tests)
vendor/bin/pint         # format PHP
npm run lint            # eslint --fix
npm run types:check     # tsc --noEmit
```

## Project Structure

```
app/
├── Http/Controllers/DocumentController.php    # upload, library, reader, file streaming
├── Http/Controllers/Api/                       # AnnotationController, AiController (SSE)
├── Jobs/CountDocumentPages.php                 # queued page counting
├── Services/Cortecs/CortecsClient.php          # streamed OpenAI-compatible client
└── Models/{Document,Annotation,AiGeneration}.php

resources/js/pages/
├── documents/index.tsx                         # library (upload + grid)
└── reader/                                      # PDF reader feature
    ├── reader.tsx                               # page (client-only viewer via lazy import)
    ├── components/                              # PdfViewer, HighlightLayer, DrawingLayer, NotesSidebar, AiPanel, Toolbar
    ├── hooks/                                   # useAnnotations, useAiStream, useAutosave
    └── lib/                                      # pdf worker, selection→rects, pdf text extraction
```

Annotations (highlights, notes, drawings) share one `annotations` table (`type` + JSON `payload`). The JSON API lives under `/api/v1/` and is documented in `openapi.yaml`.

## Notes

- **Single-user** — no authentication; one implicit owner.
- **Large uploads** (up to 100 MB) require PHP `upload_max_filesize` / `post_max_size` ≥ 100 MB (set these in your PHP/Herd config, not just the app).
- **AI text** is extracted client-side via pdf.js and sent with the request, so the server never re-parses large PDFs.
