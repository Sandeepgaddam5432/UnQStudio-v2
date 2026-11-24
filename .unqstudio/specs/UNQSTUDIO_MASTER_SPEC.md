# UnQStudio — Master Product & Architecture Spec (Pillar 3)

## 1. Requirements Summary
- **Product:** UnQStudio (100% env-driven white-label brand via `VITE_APP_NAME` & `VITE_APP_URL`).
- **Tagline (suggested, env-overridable):** `"Build, refine & ship software with autonomous AI."`
- **Brand Icon:** Bundled locally as `brand-logo.svg` -> used across Navbar, Favicon, PWA icons (`192`, `512`, maskable), and Android adaptive/launcher icons.
- **Mode:** 100% Pure Modern AI IDE (Nostr/NIP-07/NIP-46/NWC/Nsite/Npanel UI cleanly removed).
- **Theme:** Dark Mode Default (`Linear / Vercel Minimal Pro`) + Full Light Mode Toggle.
- **Deployment Target:** 100% Static Site (`dist/`) + Identical Capacitor Android APK.
- **Optional Infrastructure:** Env-driven optional CORS proxy / preview host / favicon / esm endpoints (zero hardcoded URLs; app works out-of-the-box statically even when optional services are omitted).

## 2. Core Architecture — Claude Code-Grade Customization Built Into UnQStudio
Every project workspace includes a first-class **Agent Control Center** backed by `.studio/` (and compatible with `CLAUDE.md` / `AGENTS.md`) inside the project VFS:

1. **Rules Engine (Global + Project + Path-Scoped):**
   - Global user rules + Project `RULES.md` / `AGENTS.md` + glob-scoped rules (e.g. `src/**/*.tsx`).
   - Toggleable active/inactive pills + visual Markdown editor; auto-injected into system prompt with token count badge.
2. **Skills & Slash Commands Engine:**
   - Built-in pro skills: `/plan`, `/fix`, `/review`, `/refactor`, `/test`, `/types`, `/security`, `/optimize`, `/deploy`, `/docs`, `/compact`, `/context`, `/rewind`, `/clear`, `/cost`.
   - User-defined custom Skills stored in `/skills/*.md` (YAML frontmatter: `name`, `description`, `allowedTools`, `mode`) invokable by user (`/skill-name`) OR autonomously by the AI via `SkillTool`.
3. **Spec-Driven Development Studio (Kiro + Claude Code Plan Mode):**
   - Structured workflow tab inside the IDE: **Requirements (`requirements.md`) → Design (`design.md`) → Tasks (`tasks.md`)**.
   - Interactive task checklist where each task can be executed individually ("Run Task") or sequentially with approval gates, linked directly to Git checkpoints.
4. **Context Management & Memory Engine:**
   - Rich `@` mention autocomplete in Chat Composer: `@file`, `@folder`, `@git` (diff/log), `@problems` (TypeScript/console errors), `@terminal` (last output), `@spec`, `@url`.
   - `/context` Visual Token Breakdown Inspector (System Prompt vs Rules vs Skills vs History vs Pinned Files vs Remaining Budget).
   - Manual `/compact` & configurable auto-compaction summary before context overflow + Persistent Project Memory (`MEMORY.md`) across sessions.
5. **MCP Manager + Browser-Native Sub-Agents + Hooks + Permissions:**
   - **MCP Servers:** Streamable-HTTP MCP server manager with health status, tool explorer, per-tool toggle, and proper connection lifecycle cleanup (fixes `F-014`).
   - **Sub-Agents Runner:** Spawn specialized sub-agents (`Explore`, `Architect/Planner`, `Code Reviewer`, `Security Auditor`, `Test Engineer`, or custom user agents) with isolated message history, scoped tool allowlists, parallel execution support, and a live collapsible Sub-Agent Activity Tree in Chat.
   - **Permission Modes (Claude Code style):** `Plan (Read-Only)` | `Ask Before Edit` | `Auto-Edit` | `Full Auto`, plus per-tool allow/ask/deny rules.
   - **Lifecycle Hooks:** Configurable browser hooks (`PreToolUse`, `PostToolUse`, `OnFileSave`, `OnBuildSuccess`, `OnBuildError`, `OnCommit`) executing shell commands or agent notifications.
   - **Git Checkpoints & `/rewind`:** Automatic git snapshot per AI turn with visual side-by-side Diff Viewer and 1-click Rewind (restore code only, chat only, or both).

## 3. 100x Modern IDE & Preview Studio
- **Home Hub (`/`):** Centered v0/Linear prompt composer (mode selector, model pill, `@` attachments, voice input), categorized Multi-Stack Template Gallery (React+Vite SaaS, Landing Page, Dashboard, AI Chat, Python Data, Blank TS), and Smart Project Grid (search, pin, tags, git badges, ZIP/Git import).
- **Pro Code Editor (`CodeMirror 6`):** Multi-tab files, syntax highlighting (TS/TSX/JS/CSS/HTML/JSON/PY/MD), line numbers, folding, `Cmd+S`, `Cmd+F` search/replace, project-wide `Cmd+Shift+F` search, inline Git diff view.
- **Interactive Terminal Drawer (``Ctrl+` ``):** Direct terminal UI wired to `just-bash` + `git` + `tsc` + `python3` + `curl` + 1-click "Fix Error with AI".
- **Preview Studio:** Responsive device frames (Desktop / Tablet / Mobile / Custom), Visual Element Picker ("Click element → attach to AI chat"), integrated Console + Network + Build Telemetry drawer (`ms`, bundle size, TS errors).
- **Global `Cmd+K` Command Palette & Bottom IDE Status Bar:** Instant file/action/model/theme/project switcher + live branch, TS error count, model, context %, and session cost.
- **Project `.env` Manager & Linear-Style Settings Hub:** Split monolithic 43 KB settings into crisp modular sections + masked project `.env` editor.

## 4. Security & Reliability Fixes (From Audit)
All 24 verified audit findings (`F-001` through `F-024`) addressed directly during rebuild, including:
- Isolated `vaultFS` IndexedDB for `/config/{ai,git,deploy}.json` (`F-003`).
- Strict `cwd` + `realpath` containment in `fsPlugin.ts`, `build/index.ts`, `security.ts`, `curl.ts`, `BashFS.ts`, `ReadTool`/`GrepTool` (`F-002`, `F-006`).
- Explicit confirmation on `/clone?url=` & npm-only SRI-verified `tsc` compiler fetch (`F-001`).
- Patched `isomorphic-git`, `vite`, `zod` (`F-007`).
- Fixed `useOAuth`, `ProjectsManager.importZip`, `useLocalStorage`, `AppProvider`, `SessionManager`, `MCPClient`, `esbuild`, `VercelAdapter`, `RailwayAdapter`, `AIProviderConfigDialog`, `Sentry`, `AndroidManifest.xml`, and `CI`/scripts (`F-008`–`F-024`).
- Hardened env-driven `services/proxy.ts`, `services/favicon.ts`, `services/esm.js` (`F-005`, `F-022`).
