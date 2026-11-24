# UnQStudio — Sub-Agents & MCP Architecture (Pillar 5)

## A. Engineering Sub-Agent Disciplines (Used During Our Build)
1. **Brand & Config Architect:** Enforces `brand.ts` env-only contract, removes all legacy branding/Nostr UI, verifies zero hardcoded domains.
2. **Security & Runtime Engineer:** Implements `vaultFS`, `ScopedFS`, `fsPlugin` containment, `tsc` SRI pinning, `isomorphic-git` upgrade, `SessionManager`/`OAuth`/`ZIP`/`MCP` fixes.
3. **Design Systems & UI Craft Engineer:** Builds Linear/Vercel Minimal Pro tokens, Home Hub, Command Palette, Responsive Mobile/APK parity, Preview Studio.
4. **IDE & Agent Platform Engineer:** Builds CodeMirror 6 editor, Terminal drawer, Rules/Skills/Specs/Context/Hooks/Permissions/Sub-Agent runtime.
5. **QA & Static Release Verifier:** Runs `tsc`, `eslint`, `vitest`, static build check, live preview inspection, and Android Capacitor verification.

## B. Runtime Sub-Agents Shipped Inside UnQStudio (Claude Code-Grade)
Users can invoke built-in or custom sub-agents directly inside UnQStudio via `@agent` or the Agent Studio panel (and the main agent can delegate via `SubAgentTool`):

| Sub-Agent | Mode | Default Tools | Purpose |
|---|---|---|---|
| **Explore** | Read-Only | `read`, `glob`, `grep`, `shell (read-only)` | Fast codebase mapping & symbol discovery without polluting main context |
| **Planner / Architect** | Plan | `read`, `glob`, `grep`, `spec_write` | Produces structured `Requirements → Design → Tasks` specs |
| **Builder** | Auto-Edit | Full project tools (scoped to `cwd`) | Implements approved spec tasks cleanly with git checkpoints |
| **Code Reviewer** | Read-Only | `read`, `glob`, `grep`, `git diff` | Audits diffs for bugs, edge cases, performance & conventions |
| **Security Auditor** | Read-Only | `read`, `glob`, `grep` | Checks auth, XSS, injection, secret leaks & dependency risks |
| **Test Engineer** | Auto-Edit | `read`, `write`, `edit`, `shell (tsc/test)` | Writes & verifies unit/integration tests and fixes failures |

## C. MCP Integration Contract
- Protocol: Streamable HTTP MCP (100% browser-compatible, static-site friendly).
- Lifecycle: Ref-counted `MCPConnectionManager` outside React Query cache — guarantees `client.close()` on error, config change, and unmount.
- Security: MCP server auth headers stored strictly in isolated `vaultFS`, never readable by workspace tools; per-tool allow/ask/deny permission controls.
