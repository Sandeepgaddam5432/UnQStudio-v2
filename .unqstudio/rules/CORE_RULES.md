# UnQStudio — Core Engineering Rules (Pillar 1)

## 1. Zero Hardcoding Rule (Strict)
- NEVER hardcode any deployment domain (e.g. `app.example.com`), brand name (`UnQStudio`, `Shakespeare`), or external infrastructure host inside `src/`, `services/`, `index.html`, `manifest.webmanifest`, or `capacitor.config.ts`.
- Every brand string, URL, storage prefix, OAuth client ID, and optional infrastructure endpoint MUST resolve through `src/lib/brand.ts` backed by `VITE_*` environment variables with clean generic fallbacks.
- `.env.example` MUST only contain generic placeholder values (`app.example.com`). Production values belong exclusively in `.env` / `.env.local` or host CI/CD environment settings.

## 2. 100% Pure AI IDE & 100% Static Architecture
- Remove all Nostr, NIP-07/NIP-46, Lightning NWC, Nsite, Npanel, Blossom, and Shakespeare/Quilly/Act1 theatrical UI clutter so UnQStudio ships as a razor-sharp, 100% pure general-purpose AI IDE.
- The web application MUST build to a 100% static bundle (`dist/`) deployable to Cloudflare Pages, Vercel, Netlify, GitHub Pages, or any static CDN with ZERO mandatory backend server.
- All core features (IDE, CodeMirror 6 editor, interactive `just-bash` terminal, Git, esbuild-wasm bundler, TypeScript compiler, Pyodide Python, AI streaming, Rules/Skills/Specs/Context/Hooks/MCP/Sub-agents) execute client-side.

## 3. Web Static + Android APK 100% Parity
- Desktop Web, Mobile Web, and Capacitor Android APK MUST share identical design tokens, component hierarchy, dark-first Linear/Vercel Minimal Pro aesthetic, and complete feature parity.
- Android `AndroidManifest.xml` MUST set `android:allowBackup="false"`, sync `versionName`/`versionCode` from `package.json`, and bundle icons generated from the project brand SVG (`brand-logo.svg`).

## 4. Linear / Vercel Minimal Pro Aesthetic
- Default theme: Obsidian Dark (`#09090B` canvas, `#111113` panels, `1px` `rgba(255,255,255,0.08)` borders, `#FAFAFA` crisp primary CTAs, subtle `#6366F1` accent strictly for AI active states/focus/diffs). Full Light Mode (`#FAFAFA` / `#FFFFFF` / `#E4E4E7`) parity.
- Typography: Clean geometric sans + `JetBrains Mono` / monospace for code with `tabular-nums` on telemetry/costs/tokens.
- Zero purple/gold theatrical remnants, zero cartoonish chrome, zero placeholder/stub UI controls — every visible button and panel must be wired to real working functionality.

## 5. Security-First Architecture (Non-Negotiable)
- Isolate user credentials (`/config/{ai,git,deploy}.json`) into a dedicated LightningFS IndexedDB vault NEVER exposed to `esbuild`, `ReadTool`, `GrepTool`, `ShellTool`, or `BashFS`.
- Enforce canonical `cwd` + `realpath` boundary checks on bundler (`fsPlugin.ts`, `build/index.ts`), VFS writes (`security.ts`, `curl.ts`, `BashFS.ts`), and AI file tools (`ScopedFS`).
- Require explicit confirmation on `/clone?url=`, lock TypeScript compiler downloads to `registry.npmjs.org` with mandatory SRI, patch `isomorphic-git`/`vite`/`zod` CVEs, escape HTML in print windows, and harden `services/proxy.ts` against SSRF/XSS.

## 6. Production Quality Gate
- Every milestone MUST pass: `tsc --noEmit` (0 errors), `eslint` (0 errors), `vitest run` (all tests green), zero leftover `shakespeare`/`soapbox`/`ditto.pub` leaks in active code, and visual live-preview verification before advancing.
