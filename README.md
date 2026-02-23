# Zowe Jobs Viewer

A lightweight desktop app for viewing z/OS jobs via Zowe, built with [Electrobun](https://electrobun.dev) and [Preact](https://preactjs.com).

## Prerequisites

- [Bun](https://bun.sh/) installed
- A configured Zowe `zosmf` profile (via `zowe.config.json`)

## Getting Started

```bash
bun install
bun start
```

This builds the app and launches it in dev mode.

## Features

- **Profile selector** — switch between zosmf profiles from the toolbar dropdown
- **Job table** — sortable, filterable data grid with pagination (5 / 10 / 20 per page)
- **Expandable rows** — click a job row to expand and view its spool files inline
- **Spool file viewer** — click a spool file to download and open it in your OS default text editor
- **Status badges** — color-coded job status and return code indicators

## Project Structure

```
src/
├── bun/
│   └── index.ts                # Main process — window, menu, Zowe SDK calls via RPC
├── shared/
│   ├── rpc-types.ts            # Shared RPC type definitions (main <-> renderer)
│   └── mappers.ts              # Data mapping helpers (job, spool file, profile selection)
├── test/
│   └── run.test.ts             # Unit tests for shared logic (bun:test)
└── app/                        # Renderer (Preact)
    ├── index.html              # HTML shell
    ├── index.tsx               # Entry point — Electroview RPC init, renders <App />
    ├── styles.css              # Global styles
    ├── App.tsx                 # Root component with profile state management
    ├── context/
    │   └── electrobun.ts       # Preact context for Electroview RPC access
    ├── components/
    │   ├── NavBar.tsx           # Toolbar with profile selector and refresh
    │   ├── JobTable.tsx         # Sortable, filterable, paginated data grid (TanStack Table)
    │   ├── SpoolFileList.tsx    # Inline spool file listing with open-externally
    │   └── StatusBadge.tsx      # Status badge & return code display
    └── pages/
        └── HomePage.tsx         # Job list with loading/error states
```

## Tech Stack

- **Electrobun** — native webview desktop shell (replaces Electron)
- **Preact** — 3KB UI framework with hooks and JSX
- **TanStack Table** — headless data grid with sorting, filtering, pagination
- **Bun** — runtime for the main process and bundler for both processes
- **Zowe SDK** — z/OS job retrieval and spool file access via `@zowe/zos-jobs-for-zowe-sdk`

## Tests

```bash
bun run test
```

Tests live in `src/test/` and use `bun:test`. They cover the shared mapping and selection logic (`src/shared/mappers.ts`) with no z/OS connection required.

## Building for Distribution

```bash
bun run build:stable
```
