import { Command, GitBranch, Moon, Shield, Sparkles, Sun } from 'lucide-react';
import { useAppContext } from '@/hooks/useAppContext';
import { useGitStatus } from '@/hooks/useGitStatus';
import { BRAND } from '@/lib/brand';
import type { PermissionMode } from '@/lib/studio/workspaceStore';
import { cn } from '@/lib/utils';

interface IDEStatusBarProps {
  projectId: string;
  permissionMode: PermissionMode;
  isStudioOpen: boolean;
  onToggleStudio: () => void;
}

export function IDEStatusBar({
  projectId,
  permissionMode,
  isStudioOpen,
  onToggleStudio,
}: IDEStatusBarProps) {
  const { config, updateConfig } = useAppContext();
  const { data: gitStatus } = useGitStatus(projectId);
  const changedCount = gitStatus?.changedFiles?.length ?? 0;
  const isStaticPreview = !config.previewDomain;

  return (
    <footer className="h-7 px-3 border-t border-border/80 bg-card/70 backdrop-blur-sm flex items-center justify-between text-[11px] font-mono text-muted-foreground select-none flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="inline-flex items-center gap-1.5 text-foreground/90">
          <GitBranch className="w-3 h-3" />
          <span>main</span>
          {changedCount > 0 && (
            <span className="rounded bg-amber-500/15 text-amber-500 px-1 text-[10px] tabular-nums">
              {changedCount}Δ
            </span>
          )}
        </span>

        <button
          type="button"
          onClick={onToggleStudio}
          className={cn(
            'inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors',
            isStudioOpen
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground',
          )}
          title="Toggle Agent Studio (Rules, Skills, Specs, Context, Sub-Agents)"
        >
          <Sparkles className="w-3 h-3" />
          <span>Studio</span>
        </button>

        <span className="hidden sm:inline-flex items-center gap-1 text-muted-foreground">
          <Shield className="w-3 h-3" />
          <span>{permissionMode}</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden md:inline text-[10px] text-muted-foreground">
          {isStaticPreview ? 'Static Sandbox' : 'Isolated Preview'}
        </span>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('studio:open-command-palette'))}
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          title="Open Command Palette (Cmd/Ctrl+K)"
        >
          <Command className="w-3 h-3" />
          <span className="hidden sm:inline">K</span>
        </button>
        <button
          type="button"
          onClick={() =>
            updateConfig((curr) => ({ ...curr, theme: curr.theme === 'dark' ? 'light' : 'dark' }))
          }
          className="inline-flex items-center hover:text-foreground transition-colors"
          title="Toggle Dark / Light Mode"
        >
          {config.theme === 'dark' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
        </button>
        <span className="hidden lg:inline text-[10px] opacity-75">{BRAND.name}</span>
      </div>
    </footer>
  );
}
