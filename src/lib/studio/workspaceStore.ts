import type { JSRuntimeFS } from '@/lib/JSRuntime';

export type PermissionMode = 'plan' | 'ask' | 'auto-edit' | 'full-auto';

export interface StudioRule {
  id: string;
  name: string;
  scope: 'global' | 'project' | 'path';
  glob?: string;
  content: string;
  enabled: boolean;
}

export interface StudioSkill {
  id: string;
  command: string; // e.g. "/plan"
  name: string;
  description: string;
  promptTemplate: string;
  builtIn?: boolean;
}

export interface StudioHook {
  id: string;
  event: 'PreToolUse' | 'PostToolUse' | 'OnFileSave' | 'OnBuildSuccess' | 'OnCommit';
  name: string;
  command: string;
  enabled: boolean;
}

export interface StudioSubAgent {
  id: string;
  name: string;
  role: string;
  access: 'read-only' | 'read-write';
  systemPrompt: string;
}

export interface StudioSpecs {
  requirements: string;
  design: string;
  tasks: string;
}

export interface StudioConfig {
  permissionMode: PermissionMode;
}

export interface EnvVarEntry {
  key: string;
  value: string;
}

export const BUILTIN_SKILLS: StudioSkill[] = [
  {
    id: 'builtin-plan',
    command: '/plan',
    name: 'Spec & Architecture Plan',
    description: 'Draft requirements, architecture design & numbered task checklist before coding.',
    promptTemplate:
      'Enter PLAN MODE. Inspect the repository first and produce a crisp Requirements → Architecture Design → Numbered Tasks plan in `.studio/specs/` before modifying source files.',
    builtIn: true,
  },
  {
    id: 'builtin-fix',
    command: '/fix',
    name: 'Diagnose & Fix Errors',
    description: 'Inspect build, TypeScript, and runtime console errors and apply minimal verified fixes.',
    promptTemplate:
      'Inspect TypeScript diagnostics, build logs, and console errors. Identify root causes and apply minimal, clean fixes without introducing regressions.',
    builtIn: true,
  },
  {
    id: 'builtin-review',
    command: '/review',
    name: 'Pro Code Review',
    description: 'Audit git diff for correctness, security, edge cases, and maintainability.',
    promptTemplate:
      'Run a thorough code review of recent changes in this repository. Report bugs, security flaws, type issues, and concrete improvements ordered by severity.',
    builtIn: true,
  },
  {
    id: 'builtin-security',
    command: '/security',
    name: 'Security Audit',
    description: 'Check XSS, path traversal, secret leaks, CORS, and unsafe DOM usage.',
    promptTemplate:
      'Perform a strict security audit across the project: check XSS sinks, secret exposure, auth/storage boundaries, and dependency hygiene. Propose exact patches.',
    builtIn: true,
  },
  {
    id: 'builtin-refactor',
    command: '/refactor',
    name: 'Clean Refactor',
    description: 'Simplify complex modules while preserving public contracts and behavior.',
    promptTemplate:
      'Refactor the target files for clarity, strict typing, and modularity without breaking existing behavior or public APIs.',
    builtIn: true,
  },
  {
    id: 'builtin-test',
    command: '/test',
    name: 'Generate Unit & Edge Tests',
    description: 'Write targeted Vitest tests covering happy paths, error states, and edge cases.',
    promptTemplate:
      'Write concise, deterministic tests covering critical paths, error handling, and boundary conditions for the current module.',
    builtIn: true,
  },
  {
    id: 'builtin-types',
    command: '/types',
    name: 'Strict TypeScript Audit',
    description: 'Eliminate `any`, fix strict TS errors, and tighten interfaces.',
    promptTemplate:
      'Inspect TypeScript types across `src/`, eliminate unsafe `any` casts, and ensure `tsc --noEmit` passes with zero errors.',
    builtIn: true,
  },
  {
    id: 'builtin-optimize',
    command: '/optimize',
    name: 'Performance & Bundle Tuning',
    description: 'Optimize re-renders, bundle size, lazy loading, and asset weight.',
    promptTemplate:
      'Profile and optimize rendering performance, memoization, and bundle size across the application.',
    builtIn: true,
  },
  {
    id: 'builtin-docs',
    command: '/docs',
    name: 'Update README & Architecture Docs',
    description: 'Keep README, inline docs, and `.studio/MEMORY.md` aligned with code.',
    promptTemplate:
      'Update project documentation and `.studio/MEMORY.md` to accurately reflect current architecture, commands, and env vars.',
    builtIn: true,
  },
  {
    id: 'builtin-compact',
    command: '/compact',
    name: 'Compact Session Context',
    description: 'Summarize current progress, decisions & next steps into `.studio/MEMORY.md`.',
    promptTemplate:
      'Summarize our current architectural decisions, completed changes, and open tasks into `.studio/MEMORY.md` so future turns remain concise and token-efficient.',
    builtIn: true,
  },
];

export const BUILTIN_SUBAGENTS: StudioSubAgent[] = [
  {
    id: 'explore',
    name: 'Explore Agent',
    role: 'Fast read-only codebase explorer, file map & dependency tracer',
    access: 'read-only',
    systemPrompt:
      '[SUB-AGENT: EXPLORE (READ-ONLY)] Map the codebase structure, trace data flow, and answer questions without editing any files.',
  },
  {
    id: 'architect',
    name: 'Architect / Planner',
    role: 'System design, data modeling, and Spec-Driven task decomposition',
    access: 'read-only',
    systemPrompt:
      '[SUB-AGENT: ARCHITECT] Design clean modular architecture, define TypeScript contracts, and break work into verifiable steps.',
  },
  {
    id: 'reviewer',
    name: 'Code Reviewer',
    role: 'Line-by-line bug, regression & maintainability inspection',
    access: 'read-only',
    systemPrompt:
      '[SUB-AGENT: REVIEWER] Inspect git diff & modified files for bugs, race conditions, missing error handling, and UX regressions.',
  },
  {
    id: 'security',
    name: 'Security Auditor',
    role: 'OWASP, XSS, sandbox isolation & credential hygiene specialist',
    access: 'read-only',
    systemPrompt:
      '[SUB-AGENT: SECURITY AUDITOR] Audit inputs, HTML sinks, storage boundaries, fetch URLs, and secrets exposure.',
  },
  {
    id: 'tester',
    name: 'Test & QA Engineer',
    role: 'Edge-case discovery, automated test authoring & verification',
    access: 'read-write',
    systemPrompt:
      '[SUB-AGENT: TEST ENGINEER] Author thorough tests for critical paths and verify edge-case resilience.',
  },
];

export const DEFAULT_RULES: StudioRule[] = [
  {
    id: 'rule-clean-ts',
    name: 'Strict TypeScript & Clean Code',
    scope: 'project',
    content:
      'Write strictly typed TypeScript with zero `any` leaks. Keep components small, accessible, and responsive across desktop & mobile.',
    enabled: true,
  },
  {
    id: 'rule-security',
    name: 'Security & Secret Hygiene',
    scope: 'global',
    content:
      'Never hardcode API keys, tokens, or domains in source code. Sanitize all dynamic HTML and validate untrusted URLs.',
    enabled: true,
  },
];

export const DEFAULT_SPECS: StudioSpecs = {
  requirements: `# Requirements\n\n- [ ] Define core user stories and acceptance criteria\n- [ ] Ensure responsive dark/light UI across desktop & mobile\n- [ ] Verify error states and empty states\n`,
  design: `# Architecture & Design\n\n## Components\n- Layout shell & navigation\n- Domain state & storage layer\n\n## Verification Plan\n- Typecheck with zero errors\n- Preview renders cleanly\n`,
  tasks: `# Execution Tasks\n\n- [ ] Scaffold core data types & state\n- [ ] Build primary UI views\n- [ ] Wire persistence & interactions\n- [ ] Verify build & responsive layout\n`,
};

export const DEFAULT_HOOKS: StudioHook[] = [
  {
    id: 'hook-tsc',
    event: 'OnBuildSuccess',
    name: 'Verify TypeScript Strict Check',
    command: 'tsc --noEmit',
    enabled: false,
  },
  {
    id: 'hook-memory',
    event: 'OnCommit',
    name: 'Refresh Context Memory Snapshot',
    command: 'echo "Checkpoint committed"',
    enabled: true,
  },
];

async function ensureDir(fs: JSRuntimeFS, dir: string): Promise<void> {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // Ignore if exists
  }
}

async function readTextSafe(fs: JSRuntimeFS, filePath: string): Promise<string | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return typeof raw === 'string' ? raw : null;
  } catch {
    return null;
  }
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export class StudioWorkspaceStore {
  constructor(
    private fs: JSRuntimeFS,
    private projectPath: string,
  ) {}

  private studioPath(...parts: string[]): string {
    return `${this.projectPath}/.studio/${parts.join('/')}`;
  }

  async loadRules(): Promise<StudioRule[]> {
    const raw = await readTextSafe(this.fs, this.studioPath('rules.json'));
    if (!raw) return DEFAULT_RULES;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : DEFAULT_RULES;
    } catch {
      return DEFAULT_RULES;
    }
  }

  async saveRules(rules: StudioRule[]): Promise<void> {
    await ensureDir(this.fs, `${this.projectPath}/.studio`);
    await this.fs.writeFile(this.studioPath('rules.json'), JSON.stringify(rules, null, 2), 'utf8');

    // Sync enabled rules into project AGENTS.md so AI sessions automatically honor them!
    const enabled = rules.filter((r) => r.enabled);
    const md = [
      '# Project Agent Rules',
      '',
      '<!-- Managed by Agent Studio Rules Manager -->',
      '',
      ...enabled.map((r) => {
        const scopeLabel = r.scope === 'path' && r.glob ? `path: ${r.glob}` : r.scope;
        return `## ${r.name} (${scopeLabel})\n${r.content.trim()}\n`;
      }),
    ].join('\n');
    await this.fs.writeFile(`${this.projectPath}/AGENTS.md`, md, 'utf8');
  }

  async loadCustomSkills(): Promise<StudioSkill[]> {
    const raw = await readTextSafe(this.fs, this.studioPath('skills.json'));
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async saveCustomSkills(skills: StudioSkill[]): Promise<void> {
    await ensureDir(this.fs, `${this.projectPath}/.studio`);
    await this.fs.writeFile(this.studioPath('skills.json'), JSON.stringify(skills, null, 2), 'utf8');
  }

  async loadSpecs(): Promise<StudioSpecs> {
    const [requirements, design, tasks] = await Promise.all([
      readTextSafe(this.fs, this.studioPath('specs', 'requirements.md')),
      readTextSafe(this.fs, this.studioPath('specs', 'design.md')),
      readTextSafe(this.fs, this.studioPath('specs', 'tasks.md')),
    ]);
    return {
      requirements: requirements ?? DEFAULT_SPECS.requirements,
      design: design ?? DEFAULT_SPECS.design,
      tasks: tasks ?? DEFAULT_SPECS.tasks,
    };
  }

  async saveSpecs(specs: StudioSpecs): Promise<void> {
    await ensureDir(this.fs, `${this.projectPath}/.studio/specs`);
    await Promise.all([
      this.fs.writeFile(this.studioPath('specs', 'requirements.md'), specs.requirements, 'utf8'),
      this.fs.writeFile(this.studioPath('specs', 'design.md'), specs.design, 'utf8'),
      this.fs.writeFile(this.studioPath('specs', 'tasks.md'), specs.tasks, 'utf8'),
    ]);
  }

  async loadMemory(): Promise<string> {
    const raw = await readTextSafe(this.fs, this.studioPath('MEMORY.md'));
    return (
      raw ??
      `# Project Persistent Memory\n\nRecord key architecture decisions, conventions, and open TODOs here.\n`
    );
  }

  async saveMemory(content: string): Promise<void> {
    await ensureDir(this.fs, `${this.projectPath}/.studio`);
    await this.fs.writeFile(this.studioPath('MEMORY.md'), content, 'utf8');
  }

  async loadConfig(): Promise<StudioConfig> {
    const raw = await readTextSafe(this.fs, this.studioPath('config.json'));
    if (!raw) return { permissionMode: 'auto-edit' };
    try {
      const parsed = JSON.parse(raw);
      return {
        permissionMode: parsed.permissionMode || 'auto-edit',
      };
    } catch {
      return { permissionMode: 'auto-edit' };
    }
  }

  async saveConfig(config: StudioConfig): Promise<void> {
    await ensureDir(this.fs, `${this.projectPath}/.studio`);
    await this.fs.writeFile(this.studioPath('config.json'), JSON.stringify(config, null, 2), 'utf8');
  }

  async loadHooks(): Promise<StudioHook[]> {
    const raw = await readTextSafe(this.fs, this.studioPath('hooks.json'));
    if (!raw) return DEFAULT_HOOKS;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : DEFAULT_HOOKS;
    } catch {
      return DEFAULT_HOOKS;
    }
  }

  async saveHooks(hooks: StudioHook[]): Promise<void> {
    await ensureDir(this.fs, `${this.projectPath}/.studio`);
    await this.fs.writeFile(this.studioPath('hooks.json'), JSON.stringify(hooks, null, 2), 'utf8');
  }

  async loadEnvVars(): Promise<EnvVarEntry[]> {
    const raw = await readTextSafe(this.fs, `${this.projectPath}/.env`);
    if (!raw) return [];
    const entries: EnvVarEntry[] = [];
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key) entries.push({ key, value });
    }
    return entries;
  }

  async saveEnvVars(entries: EnvVarEntry[]): Promise<void> {
    const lines = entries
      .filter((e) => e.key.trim().length > 0)
      .map((e) => {
        const cleanKey = e.key.trim().replace(/[^A-Za-z0-9_]/g, '_');
        const needsQuotes = /[\s#"']/.test(e.value);
        const formatted = needsQuotes ? JSON.stringify(e.value) : e.value;
        return `${cleanKey}=${formatted}`;
      });
    await this.fs.writeFile(`${this.projectPath}/.env`, lines.join('\n') + (lines.length ? '\n' : ''), 'utf8');
  }

  async scanProjectStats(): Promise<{ fileCount: number; approxTokens: number }> {
    let fileCount = 0;
    let totalBytes = 0;
    const walk = async (dir: string, depth: number) => {
      if (depth > 5) return;
      let entries: string[];
      try {
        entries = await this.fs.readdir(dir);
      } catch {
        return;
      }
      for (const entry of entries) {
        if (entry === '.git' || entry === 'node_modules' || entry === 'dist') continue;
        const full = `${dir}/${entry}`;
        try {
          const st = await this.fs.stat(full);
          if (st.isDirectory()) {
            await walk(full, depth + 1);
          } else {
            fileCount += 1;
            totalBytes += st.size || 0;
          }
        } catch {
          // Skip unreadable entry
        }
      }
    };
    await walk(this.projectPath, 0);
    return { fileCount, approxTokens: Math.ceil(totalBytes / 4) };
  }
}
