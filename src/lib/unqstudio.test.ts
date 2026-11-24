import { describe, it, expect } from 'vitest';
import { BRAND } from './brand';
import {
  isPathWithinRoot,
  isProtectedVaultPath,
  isPrivateOrLoopbackHost,
  isWriteAllowed,
} from './security';
import { pythonRequestUrl } from './python/network';
import { STARTER_TEMPLATES } from './starterTemplates';
import {
  BUILTIN_SKILLS,
  BUILTIN_SUBAGENTS,
  StudioWorkspaceStore,
} from './studio/workspaceStore';
import type { JSRuntimeFS } from './JSRuntime';

function createMemoryFS(): JSRuntimeFS {
  const files = new Map<string, string>();
  const dirs = new Set<string>(['/', '/projects', '/projects/demo']);

  return {
    async readFile(path: string) {
      const val = files.get(path);
      if (val === undefined) throw Object.assign(new Error(`ENOENT: ${path}`), { code: 'ENOENT' });
      return val;
    },
    async writeFile(path: string, data: string | Uint8Array) {
      files.set(path, typeof data === 'string' ? data : new TextDecoder().decode(data));
    },
    async mkdir(path: string) {
      dirs.add(path);
    },
    async readdir(dir: string) {
      const prefix = dir.endsWith('/') ? dir : `${dir}/`;
      const names = new Set<string>();
      for (const p of files.keys()) {
        if (p.startsWith(prefix)) {
          const rest = p.slice(prefix.length);
          names.add(rest.split('/')[0]);
        }
      }
      return Array.from(names);
    },
    async stat(path: string) {
      const val = files.get(path);
      if (val !== undefined) {
        return {
          isDirectory: () => false,
          isFile: () => true,
          isSymbolicLink: () => false,
          size: val.length,
          mtimeMs: Date.now(),
        };
      }
      if (dirs.has(path)) {
        return {
          isDirectory: () => true,
          isFile: () => false,
          isSymbolicLink: () => false,
          size: 0,
          mtimeMs: Date.now(),
        };
      }
      throw Object.assign(new Error(`ENOENT: ${path}`), { code: 'ENOENT' });
    },
  } as unknown as JSRuntimeFS;
}

describe('UnQStudio Core Security, White-Label & Agent Studio', () => {
  it('exposes clean env-driven white-label brand config with isolated vault DB', () => {
    expect(BRAND.name.length).toBeGreaterThan(0);
    expect(BRAND.vaultDbName).toContain('vault-fs');
    expect(BRAND.storageKey('theme')).toBe(`${BRAND.storagePrefix}-theme`);
  });

  it('enforces strict VFS path containment and protects /config vault paths (F-003, F-006)', () => {
    expect(isPathWithinRoot('/projects/app/src/App.tsx', '/projects/app')).toBe(true);
    expect(isPathWithinRoot('/projects/app2/secret.txt', '/projects/app')).toBe(false);
    expect(isPathWithinRoot('/projects/app/../../config/ai.json', '/projects/app')).toBe(false);
    expect(isProtectedVaultPath('/config/ai.json')).toBe(true);
    expect(isProtectedVaultPath('/projects/app/../../config/git.json')).toBe(true);
    expect(isProtectedVaultPath('/projects/app/src/config.ts')).toBe(false);
    expect(isWriteAllowed('/projects/app/src/index.ts', '/projects/app')).toBe(true);
    expect(isWriteAllowed('/config/ai.json', '/projects/app')).toBe(false);
  });

  it('blocks private, loopback, metadata, and same-origin API URLs in Python runtime (F-004)', () => {
    expect(isPrivateOrLoopbackHost('127.0.0.1')).toBe(true);
    expect(isPrivateOrLoopbackHost('169.254.169.254')).toBe(true);
    expect(isPrivateOrLoopbackHost('192.168.1.5')).toBe(true);
    expect(isPrivateOrLoopbackHost('localhost')).toBe(true);
    expect(isPrivateOrLoopbackHost('api.github.com')).toBe(false);

    expect(() =>
      pythonRequestUrl('http://169.254.169.254/latest/meta-data/', 'https://app.example/worker.js', undefined),
    ).toThrow(/Blocked/);
    expect(() =>
      pythonRequestUrl('https://app.example/api/secret', 'https://app.example/worker.js', undefined),
    ).toThrow(/Blocked/);
    expect(
      pythonRequestUrl('https://pypi.org/simple/', 'https://app.example/worker.js', undefined),
    ).toBe('https://pypi.org/simple/');
  });

  it('provides 5 offline-ready multi-stack starter templates with valid entry files', () => {
    expect(STARTER_TEMPLATES.length).toBe(5);
    for (const tpl of STARTER_TEMPLATES) {
      expect(Object.keys(tpl.files).length).toBeGreaterThan(0);
      if (tpl.category === 'Python') {
        expect(tpl.files['main.py']).toBeTruthy();
      } else {
        expect(tpl.files['index.html']).toBeTruthy();
        expect(tpl.files['package.json']).toBeTruthy();
        expect(() => JSON.parse(tpl.files['package.json'])).not.toThrow();
      }
    }
  });

  it('persists Agent Studio rules (syncing AGENTS.md), skills, specs, hooks, memory & .env', async () => {
    const fs = createMemoryFS();
    const store = new StudioWorkspaceStore(fs, '/projects/demo');

    expect(BUILTIN_SKILLS.length).toBeGreaterThanOrEqual(10);
    expect(BUILTIN_SUBAGENTS.length).toBe(5);

    await store.saveRules([
      {
        id: 'r1',
        name: 'No Hardcoded Secrets',
        scope: 'project',
        content: 'Always use environment variables.',
        enabled: true,
      },
    ]);
    const agentsMd = await fs.readFile('/projects/demo/AGENTS.md', 'utf8');
    expect(agentsMd).toContain('No Hardcoded Secrets');
    expect(agentsMd).toContain('Always use environment variables.');

    await store.saveSpecs({
      requirements: '# Req\n- [ ] Build UI',
      design: '# Design',
      tasks: '# Tasks\n- [ ] Task 1\n- [x] Task 2',
    });
    const loadedSpecs = await store.loadSpecs();
    expect(loadedSpecs.tasks).toContain('- [x] Task 2');

    await store.saveEnvVars([
      { key: 'VITE_APP_NAME', value: 'UnQStudio' },
      { key: 'API_NOTE', value: 'hello world' },
    ]);
    const parsedEnv = await store.loadEnvVars();
    expect(parsedEnv).toEqual([
      { key: 'VITE_APP_NAME', value: 'UnQStudio' },
      { key: 'API_NOTE', value: 'hello world' },
    ]);
  });
});
