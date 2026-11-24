# UnQStudio — Project Context & Completion Record

**Status:** ALL 6 PHASES COMPLETED & VERIFIED ✅
**Workspace:** `/home/user/unqstudio`

## Final Completed Architecture
- **Phase 1 — White-Label, Logo, Android APK & Nostr Removal**:
  - Single-source env config (`src/lib/brand.ts`, `.env.example`, `.env.local`, `vite.config.ts` `brandMetadataPlugin`, `public/manifest.webmanifest`, `index.html`).
  - Brand logo (`brand-logo.svg` / `public/brand-logo.svg`) rendered into web PWA PNGs, OG image, and Android `mipmap-{mdpi..xxxhdpi}` launcher icons; Android package migrated to `com.aistudio.app` with `allowBackup="false"` and `#09090b` splash.
  - Pure AI IDE: Nostr routes, Nostr presets, Lightning NWC onboarding, and Shakespeare/Quilly theatrical clutter removed. Zero hardcoded user domains anywhere in tracked source.
- **Phase 2 — Security Hardening (`F-001`–`F-024`)**:
  - Isolated credentials vault (`vaultFs` + `vaultMigration.ts`) separated from project VFS; `ReadTool`, `GrepTool`, `BlossomUploadTool`, `BashFS`, `curl` strictly confined (`isPathWithinRoot`, `isProtectedVaultPath`).
  - Hardened `fsPlugin.ts`, `build/index.ts`, `runTsc.ts`, `tsc/packages.ts`, `Clone.tsx`, `ProjectsManager.ts` (ZIP validation & bomb limits), `useOAuth.ts`/`useVercelOAuth.ts`, `SessionManager.ts`, `MCPClient.ts`/`useMCPTools.ts`, `esbuild.ts`, `sentry.ts`, `VercelAdapter.ts`, `plugins.ts`, `AIProviderConfigDialog.tsx`, `python/network.ts` (`F-004` SSRF/loopback block), and `services/{proxy.ts,esm.js,favicon.ts}`.
  - Dependencies upgraded (`vite@^6.4.6`, `isomorphic-git@^1.44.18`, `zod@^4.6.7`, CodeMirror 6 suite).
- **Phase 3 — Linear/Vercel Minimal Pro Design System & Home Hub**:
  - Obsidian Dark (`#09090B`) default + Light Mode toggle (`src/index.css`), `CommandPalette.tsx` (`Cmd+K`), `starterTemplates.ts` (5 offline-ready multi-stack templates + `ProjectsManager.createProjectFromFiles`), rebuilt `Index.tsx` Command Center, `OnboardingDialog.tsx`, `AboutSettings.tsx`, `ProjectSidebar.tsx`, and monochrome `Quilly.tsx` alert.
- **Phase 4 — Pro IDE Core & 100% Static Preview**:
  - Replaced plain textarea with full **CodeMirror 6** editor (`FileEditor.tsx`: Obsidian Dark/Light themes, 9 language modes, folding, `Cmd+F`, `Cmd+S`, word wrap, `Ln/Col` telemetry).
  - Built **100% Static Sandboxed `srcDoc` Preview Fallback** (`src/lib/preview/buildStaticSrcDoc.ts` wired into `PreviewPane.tsx`) so live previews work with zero external wildcard server, while still supporting optional `VITE_PREVIEW_DOMAIN`.
- **Phase 5 — Claude Code / Kiro 5-Pillar Agent Studio & Status Bar**:
  - `src/lib/studio/workspaceStore.ts` + `src/components/studio/AgentStudioPanel.tsx` + `src/components/studio/IDEStatusBar.tsx` wired into `ProjectView.tsx` (Desktop resizable panel + Mobile/APK `Studio` tab) and `ChatInput.tsx` (`studio:inject-prompt`).
  - Covers Rules (`AGENTS.md` sync), 10 built-in + custom Skills, `Requirements → Design → Tasks` Specs Studio, Context/Memory Inspector (`.studio/MEMORY.md`), Permission Modes, 5 Sub-Agents, MCP status, Lifecycle Hooks, and masked `.env` manager.
- **Phase 6 — Verification**:
  - `npx tsc --noEmit`: 0 errors.
  - `npx eslint` on all new/modified modules: 0 errors, 0 warnings.
  - Zero hardcoded domain grep check: 0 matches in tracked source.
  - Vitest security, plugin & UnQStudio suite passing (`src/lib/unqstudio.test.ts`, `src/lib/security.test.ts`, `src/lib/plugins.test.ts`).
