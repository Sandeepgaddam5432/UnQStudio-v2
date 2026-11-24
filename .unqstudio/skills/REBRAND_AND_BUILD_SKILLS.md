# UnQStudio — Engineering Skills & Playbooks (Pillar 2)

## Skill 1: `brand-audit`
Verify zero hardcoded brand/domain leakage before closing any milestone:
- Scan `src/`, `index.html`, `public/`, `services/`, `android/`, `capacitor.config.ts`, `vite.config.ts`.
- Confirm 0 occurrences of `shakespeare.diy`, `soapbox`, `quilly`, `shakespeare.wtf`, or any hardcoded deployment domain in source files.
- Confirm all brand labels flow through `src/lib/brand.ts` and i18n `{{appName}}`.

## Skill 2: `security-gate`
Verify every security boundary after modifying VFS, bundler, workers, tools, or auth:
- Credentials vault (`vaultFS`) is strictly separate from workspace `projectFS`.
- `fsPlugin.ts` rejects `/config/*`, `../`, `file:../`, and external symlinks.
- `security.ts`, `curl.ts`, `BashFS.ts` resolve relative paths + symlinks against `cwd` before write.
- `/clone?url=` never clones without explicit user action.
- `tsc/runTsc.ts` allows only `https://registry.npmjs.org/typescript/-/typescript-*.tgz` with SRI verification.

## Skill 3: `ui-craft-review`
Check every new or redesigned screen against Linear / Vercel / v0 / Cursor / Kiro craft standards:
- Dark default (`#09090B`) + Light (`#FAFAFA`) contrast verified (WCAG AA+).
- Hairline `1px` borders, tight radius (`6px`–`8px`), consistent 4px spacing rhythm.
- Keyboard shortcuts wired (`Cmd+K` palette, `Cmd+S` save, `Cmd+Shift+F` search, ``Ctrl+` `` terminal).
- Mobile responsive layout (390px viewport) verified for Android APK parity.

## Skill 4: `static-and-apk-verify`
Verify 100% static build & Capacitor readiness:
- Clean `npm ci` (no `npm i --silent` inside scripts).
- `tsc --noEmit`, `eslint`, `vitest run`, `vite build` succeed cleanly.
- `dist/` serves as pure static files with SPA fallback (`404.html` / `_redirects`).
- `capacitor.config.ts` and `android/` manifest/gradle/icons match brand & security policy.

## Skill 5: `claude-code-parity-check`
Verify all 5 in-app Claude Code-grade pillars work end-to-end:
- Rules (Global + Project + Path-scoped auto-injection)
- Skills (Built-in + User custom `/slash` skills)
- Specs (Requirements → Design → Tasks approval & step execution)
- Context (`@file`, `@folder`, `@git`, `@problems`, `/context` token breakdown, `/compact`, persistent memory)
- MCP & Sub-agents (Isolated context sub-agent runner + live execution tree + tool permission modes + hooks + Git checkpoints/rewind)
