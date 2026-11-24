# UnQStudio — AI Software Studio & Browser IDE

A 100% static, local-first, white-label AI IDE built for Web & Capacitor Android APK.
Engineered with a Linear/Vercel Minimal Pro dark-default design system, CodeMirror 6 editor, interactive browser terminal (Bash + Git + TypeScript + Pyodide Python), isolated credentials vault, and a Claude Code / Kiro-grade **5-Pillar Agent Studio** (Rules, Skills, Specs, Context Memory, Sub-Agents, MCP, Hooks & `.env` Manager).

---

## Key Capabilities

- **Zero-Hardcode White-Label Config**: All branding (`VITE_APP_NAME`, `VITE_APP_DOMAIN`, `VITE_STORAGE_PREFIX`, OAuth client IDs, and optional infrastructure URLs) is driven purely by environment variables (`.env.example` → `.env.local`).
- **100% Static Hosting + Sandboxed Preview**: Deploy `dist/` to Cloudflare Pages, Vercel, Netlify, GitHub Pages, or any static host with zero mandatory backend. Live previews run inside a built-in sandboxed `srcDoc` iframe by default, or an optional isolated subdomain preview host (`VITE_PREVIEW_DOMAIN`).
- **Identical Web + Android APK Experience**: Full Capacitor Android project (`android/`) with matching launcher icons, dark splash (`#09090b`), and unified mobile navigation (`Chat · Preview · Code · Studio`).
- **CodeMirror 6 Pro Editor**: Syntax highlighting (TS/TSX/JS/JSX/HTML/CSS/JSON/Markdown/Python), Obsidian Dark & Light themes, line numbers, folding, `Cmd/Ctrl+F` search, word wrap, `Cmd/Ctrl+S` save, and live `Ln / Col` telemetry.
- **Claude Code / Kiro Agent Studio**:
  - **Rules Manager** — Global, project & path-scoped rules synced automatically to `AGENTS.md`.
  - **Skills & Slash Commands** — 10 built-in workflows (`/plan`, `/fix`, `/review`, `/security`, `/refactor`, `/test`, `/types`, `/optimize`, `/docs`, `/compact`) plus custom skills.
  - **Specs Studio** — Structured `Requirements → Design → Tasks` workspace with clickable task execution.
  - **Context & Memory Inspector** — Live project file & token budget metrics, `@files`/`@git-diff`/`@problems` shortcuts, and `.studio/MEMORY.md`.
  - **Agents, Permissions, Hooks & `.env`** — Permission modes (`Plan` / `Ask` / `Auto-Edit` / `Full Auto`), 5 specialized sub-agents, MCP server integration, lifecycle hooks, and masked project `.env` editor.
- **Hardened Security Architecture**:
  - Dedicated IndexedDB credentials vault (`vaultFs`) physically isolated from project workspaces and AI tools.
  - Canonical VFS path containment (`isPathWithinRoot`), `/config` read/write blocking, ZIP bomb caps, Pyodide SSRF/private-network blocking, and hardened optional Cloudflare Worker templates in `services/`.

---

## Quick Start (Web Static Site)

```bash
# 1. Copy environment template and configure your brand/domain
cp .env.example .env.local

# 2. Install dependencies (Node 22+ recommended)
npm ci

# 3. Start local dev server
npm run dev

# 4. Build 100% static production bundle into dist/
npm run build
```

Deploy the `dist/` directory to any static host (Cloudflare Pages, Vercel, Netlify, S3/R2, Nginx).

---

## Deploy on Cloudflare Pages (Recommended)

1. Connect this GitHub repository in **Cloudflare Dashboard → Workers & Pages → Create → Pages**.
2. Use these exact build settings:
   - **Framework preset**: `Vite` (or `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: Automatically pinned to **Node 22** via `.node-version` / `.nvmrc` (or set `NODE_VERSION=22`).
3. Add your white-label environment variables under **Settings → Environment variables**:
   - `VITE_APP_NAME` (e.g., `UnQStudio`)
   - `VITE_APP_DOMAIN` (your custom domain)
   - `VITE_APP_URL` (e.g., `https://your-domain`)
   - `VITE_STORAGE_PREFIX` (e.g., `unqstudio`)
4. SPA routing (`public/_redirects`) and production security/caching headers (`public/_headers`) are pre-configured automatically.

---

## Build Matching Android APK (Capacitor)

```bash
# 1. Build web bundle and sync assets into android/
npm run build
npx cap sync android

# 2. Build debug or release APK
cd android
./gradlew assembleDebug
# Release (signed):
./gradlew assembleRelease
```

---

## Optional Hardened Edge Workers (`services/`)

Zero backend is required by default. If you want optional self-hosted CORS proxy, ESM CDN, or favicon workers on your own domain, hardened env-driven Cloudflare Worker templates are included under `services/`:
- `services/proxy.ts` — Allowlist-enforced, private-IP-blocked CORS proxy
- `services/esm.js` — Strict npm package proxy
- `services/favicon.ts` — SSRF-safe favicon proxy

Configure `VITE_CORS_PROXY_URL`, `VITE_ESM_URL`, or `VITE_PREVIEW_DOMAIN` in `.env.local` only if you deploy them.

---

## Verification Commands

```bash
npx tsc --noEmit          # Strict TypeScript check
npx eslint src/           # Lint check
npm test                  # Vitest suite
```
