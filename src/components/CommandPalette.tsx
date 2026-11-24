import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Bot,
  Database,
  FolderGit2,
  GitBranch,
  Home,
  Info,
  Moon,
  Plus,
  Rocket,
  Settings,
  Settings2,
  Sun,
  Terminal,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useProjectsManager } from '@/hooks/useProjectsManager';
import { useAppContext } from '@/hooks/useAppContext';
import { BRAND } from '@/lib/brand';
import type { Project } from '@/lib/ProjectsManager';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();
  const projectsManager = useProjectsManager();
  const { config, updateConfig } = useAppContext();

  const loadProjects = useCallback(async () => {
    try {
      await projectsManager.init();
      const list = await projectsManager.getProjects();
      setProjects(list.slice(0, 12));
    } catch {
      setProjects([]);
    }
  }, [projectsManager]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const onCustomOpen = () => setOpen(true);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('studio:open-command-palette', onCustomOpen);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('studio:open-command-palette', onCustomOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      void loadProjects();
    }
  }, [open, loadProjects]);

  const runAction = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  const toggleTheme = () => {
    const next = config.theme === 'dark' ? 'light' : 'dark';
    updateConfig((curr) => ({ ...curr, theme: next }));
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={`Search ${BRAND.name} projects, commands, settings...`} />
      <CommandList>
        <CommandEmpty>No matching commands or projects.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runAction(() => navigate('/'))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Project</span>
            <CommandShortcut>Home</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate('/clone'))}>
            <GitBranch className="mr-2 h-4 w-4" />
            <span>Import Git Repository</span>
          </CommandItem>
          <CommandItem onSelect={() => runAction(toggleTheme)}>
            {config.theme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            <span>Switch to {config.theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runAction(() => window.dispatchEvent(new CustomEvent('studio:toggle-terminal')))
            }
          >
            <Terminal className="mr-2 h-4 w-4" />
            <span>Toggle Workspace Terminal</span>
            <CommandShortcut>Ctrl+`</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`project ${p.name} ${p.id}`}
                  onSelect={() => runAction(() => navigate(`/project/${p.id}`))}
                >
                  <FolderGit2 className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{p.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground font-mono">{p.id}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Navigation & Settings">
          <CommandItem onSelect={() => runAction(() => navigate('/'))}>
            <Home className="mr-2 h-4 w-4" />
            <span>Command Center Home</span>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate('/settings/ai'))}>
            <Bot className="mr-2 h-4 w-4" />
            <span>AI Providers & MCP Servers</span>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate('/settings/git'))}>
            <GitBranch className="mr-2 h-4 w-4" />
            <span>Git & Credentials</span>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate('/settings/deploy'))}>
            <Rocket className="mr-2 h-4 w-4" />
            <span>Deploy Targets</span>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate('/settings/preferences'))}>
            <Settings2 className="mr-2 h-4 w-4" />
            <span>Appearance & Preferences</span>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate('/settings/storage'))}>
            <Database className="mr-2 h-4 w-4" />
            <span>Storage & Vault</span>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate('/settings/system'))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>System Configuration</span>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate('/settings/about'))}>
            <Info className="mr-2 h-4 w-4" />
            <span>About {BRAND.name}</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
