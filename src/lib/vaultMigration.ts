import type { JSRuntimeFS } from '@/lib/JSRuntime';

const CONFIG_FILES = ['ai.json', 'git.json', 'deploy.json'] as const;

/**
 * One-time safe migration: moves any legacy plaintext credentials stored under
 * `${configPath}/{ai,git,deploy}.json` in the workspace FS into the isolated
 * `vaultFs` IndexedDB database, then deletes the workspace copies so AI tools
 * and esbuild can never read user secrets (fixes F-003).
 */
export async function migrateConfigToVault(
  workspaceFs: JSRuntimeFS,
  vaultFs: JSRuntimeFS,
  configPath = '/config',
): Promise<void> {
  if (workspaceFs === vaultFs) return;

  for (const file of CONFIG_FILES) {
    const fullPath = `${configPath}/${file}`;
    try {
      const legacyData = await workspaceFs.readFile(fullPath, 'utf8');
      if (typeof legacyData !== 'string' || !legacyData.trim()) continue;

      let vaultExists = false;
      try {
        await vaultFs.stat(fullPath);
        vaultExists = true;
      } catch {
        vaultExists = false;
      }

      if (!vaultExists) {
        try {
          await vaultFs.mkdir(configPath, { recursive: true });
        } catch {
          // Directory may already exist
        }
        await vaultFs.writeFile(fullPath, legacyData, 'utf8');
      }

      // Remove secret file from workspace FS once safely copied into vaultFs
      await workspaceFs.unlink(fullPath);
    } catch {
      // File doesn't exist in workspace FS — nothing to migrate
    }
  }
}
