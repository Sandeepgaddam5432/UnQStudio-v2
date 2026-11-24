import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bot,
  Check,
  CheckSquare,
  Copy,
  Cpu,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Layers,
  Play,
  Plus,
  Save,
  Shield,
  Sparkles,
  Trash2,
  Webhook,
  Wrench,
} from 'lucide-react';
import { useNavigate } from 'react-router';

import { useFS } from '@/hooks/useFS';
import { useFSPaths } from '@/hooks/useFSPaths';
import { useAISettings } from '@/hooks/useAISettings';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  BUILTIN_SKILLS,
  BUILTIN_SUBAGENTS,
  StudioWorkspaceStore,
  estimateTokens,
  type EnvVarEntry,
  type PermissionMode,
  type StudioHook,
  type StudioRule,
  type StudioSkill,
  type StudioSpecs,
} from '@/lib/studio/workspaceStore';

interface AgentStudioPanelProps {
  projectId: string;
  onDispatchPrompt?: (prompt: string) => void;
  onPermissionModeChange?: (mode: PermissionMode) => void;
}

type StudioTab = 'rules' | 'skills' | 'specs' | 'context' | 'agents';

const PERMISSION_MODES: { id: PermissionMode; label: string; desc: string }[] = [
  { id: 'plan', label: 'Plan (Read-Only)', desc: 'Inspect & architect without writing files.' },
  { id: 'ask', label: 'Ask Before Edit', desc: 'Confirm before destructive or file writes.' },
  { id: 'auto-edit', label: 'Auto-Edit', desc: 'Edit source files freely; ask on shell/deploy.' },
  { id: 'full-auto', label: 'Full Auto', desc: 'Autonomous end-to-end build, test & verify.' },
];

export function AgentStudioPanel({
  projectId,
  onDispatchPrompt,
  onPermissionModeChange,
}: AgentStudioPanelProps) {
  const { fs } = useFS();
  const { projectsPath } = useFSPaths();
  const { settings } = useAISettings();
  const { toast } = useToast();
  const navigate = useNavigate();

  const store = useMemo(
    () => new StudioWorkspaceStore(fs, `${projectsPath}/${projectId}`),
    [fs, projectsPath, projectId],
  );

  const [tab, setTab] = useState<StudioTab>('rules');
  const [rules, setRules] = useState<StudioRule[]>([]);
  const [customSkills, setCustomSkills] = useState<StudioSkill[]>([]);
  const [specs, setSpecs] = useState<StudioSpecs>({ requirements: '', design: '', tasks: '' });
  const [specStep, setSpecStep] = useState<'requirements' | 'design' | 'tasks'>('requirements');
  const [memory, setMemory] = useState('');
  const [permissionMode, setPermissionMode] = useState<PermissionMode>('auto-edit');
  const [hooks, setHooks] = useState<StudioHook[]>([]);
  const [envVars, setEnvVars] = useState<EnvVarEntry[]>([]);
  const [showSecrets, setShowSecrets] = useState(false);
  const [projectStats, setProjectStats] = useState({ fileCount: 0, approxTokens: 0 });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Rule form
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleScope, setNewRuleScope] = useState<'global' | 'project' | 'path'>('project');
  const [newRuleGlob, setNewRuleGlob] = useState('src/**/*.tsx');
  const [newRuleContent, setNewRuleContent] = useState('');

  // New Skill form
  const [newSkillCmd, setNewSkillCmd] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillPrompt, setNewSkillPrompt] = useState('');

  // New Env Var form
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvVal, setNewEnvVal] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const [r, sk, sp, mem, cfg, hk, env, stats] = await Promise.all([
        store.loadRules(),
        store.loadCustomSkills(),
        store.loadSpecs(),
        store.loadMemory(),
        store.loadConfig(),
        store.loadHooks(),
        store.loadEnvVars(),
        store.scanProjectStats(),
      ]);
      setRules(r);
      setCustomSkills(sk);
      setSpecs(sp);
      setMemory(mem);
      setPermissionMode(cfg.permissionMode);
      setHooks(hk);
      setEnvVars(env);
      setProjectStats(stats);
    } catch (err) {
      console.error('Failed to load Agent Studio state:', err);
    }
  }, [store]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const dispatchOrCopy = async (id: string, prompt: string, label: string) => {
    if (onDispatchPrompt) {
      onDispatchPrompt(prompt);
    }
    window.dispatchEvent(new CustomEvent('studio:inject-prompt', { detail: { prompt } }));
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // Clipboard optional
    }
    toast({
      title: `${label} ready`,
      description: 'Prompt dispatched to chat & copied to clipboard.',
    });
  };

  // Rules handlers
  const handleToggleRule = async (id: string) => {
    const next = rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    setRules(next);
    await store.saveRules(next);
  };

  const handleDeleteRule = async (id: string) => {
    const next = rules.filter((r) => r.id !== id);
    setRules(next);
    await store.saveRules(next);
  };

  const handleAddRule = async () => {
    if (!newRuleName.trim() || !newRuleContent.trim()) return;
    const created: StudioRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      scope: newRuleScope,
      glob: newRuleScope === 'path' ? newRuleGlob.trim() : undefined,
      content: newRuleContent.trim(),
      enabled: true,
    };
    const next = [...rules, created];
    setRules(next);
    await store.saveRules(next);
    setNewRuleName('');
    setNewRuleContent('');
    toast({ title: 'Rule saved & synced to AGENTS.md' });
  };

  // Skills handlers
  const handleAddSkill = async () => {
    if (!newSkillCmd.trim() || !newSkillPrompt.trim()) return;
    const cmd = newSkillCmd.trim().startsWith('/') ? newSkillCmd.trim() : `/${newSkillCmd.trim()}`;
    const created: StudioSkill = {
      id: `skill-${Date.now()}`,
      command: cmd,
      name: newSkillName.trim() || cmd,
      description: 'Custom project skill',
      promptTemplate: newSkillPrompt.trim(),
    };
    const next = [...customSkills, created];
    setCustomSkills(next);
    await store.saveCustomSkills(next);
    setNewSkillCmd('');
    setNewSkillName('');
    setNewSkillPrompt('');
    toast({ title: `Skill ${cmd} created` });
  };

  const handleDeleteSkill = async (id: string) => {
    const next = customSkills.filter((s) => s.id !== id);
    setCustomSkills(next);
    await store.saveCustomSkills(next);
  };

  // Specs handlers
  const handleSaveSpecs = async () => {
    await store.saveSpecs(specs);
    toast({ title: 'Specs saved to .studio/specs/' });
  };

  const parsedTasks = useMemo(() => {
    return specs.tasks
      .split('\n')
      .map((line, index) => {
        const match = line.match(/^(\s*[-*]\s*)\[([ xX])\]\s+(.*)$/);
        if (!match) return null;
        return { index, done: match[2].toLowerCase() === 'x', text: match[3] };
      })
      .filter((item): item is { index: number; done: boolean; text: string } => item !== null);
  }, [specs.tasks]);

  const handleToggleTaskLine = async (lineIndex: number) => {
    const lines = specs.tasks.split('\n');
    const line = lines[lineIndex];
    if (!line) return;
    lines[lineIndex] = line.includes('[x]') || line.includes('[X]')
      ? line.replace(/\[[xX]\]/, '[ ]')
      : line.replace(/\[ \]/, '[x]');
    const nextSpecs = { ...specs, tasks: lines.join('\n') };
    setSpecs(nextSpecs);
    await store.saveSpecs(nextSpecs);
  };

  // Permission mode handler
  const handlePermissionMode = async (mode: PermissionMode) => {
    setPermissionMode(mode);
    await store.saveConfig({ permissionMode: mode });
    onPermissionModeChange?.(mode);
    window.dispatchEvent(new CustomEvent('studio:permission-mode', { detail: { mode } }));
    toast({ title: `Permission Mode: ${mode}` });
  };

  // Hooks handlers
  const handleToggleHook = async (id: string) => {
    const next = hooks.map((h) => (h.id === id ? { ...h, enabled: !h.enabled } : h));
    setHooks(next);
    await store.saveHooks(next);
  };

  // Env vars handlers
  const handleAddEnvVar = async () => {
    if (!newEnvKey.trim()) return;
    const next = [...envVars.filter((e) => e.key !== newEnvKey.trim()), { key: newEnvKey.trim(), value: newEnvVal }];
    setEnvVars(next);
    await store.saveEnvVars(next);
    setNewEnvKey('');
    setNewEnvVal('');
    toast({ title: 'Saved to project .env' });
  };

  const handleDeleteEnvVar = async (key: string) => {
    const next = envVars.filter((e) => e.key !== key);
    setEnvVars(next);
    await store.saveEnvVars(next);
  };

  const activeRulesTokens = useMemo(
    () => estimateTokens(rules.filter((r) => r.enabled).map((r) => r.content).join('\n')),
    [rules],
  );
  const memoryTokens = useMemo(() => estimateTokens(memory), [memory]);
  const mcpCount = Array.isArray(settings.mcpServers)
    ? settings.mcpServers.length
    : Object.keys(settings.mcpServers || {}).length;

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Studio Header + 5-Pillar Tab Strip */}
      <div className="border-b border-border/80 bg-card/50 px-3 pt-2.5 pb-2 space-y-2 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-foreground" />
            <h2 className="text-xs font-semibold tracking-tight uppercase text-foreground">
              Agent Studio
            </h2>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground rounded border border-border/70 px-1.5 py-0.5">
            Mode: {permissionMode}
          </span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {([
            { id: 'rules', label: 'Rules', icon: Shield, badge: rules.filter((r) => r.enabled).length },
            { id: 'skills', label: 'Skills', icon: Wrench, badge: BUILTIN_SKILLS.length + customSkills.length },
            { id: 'specs', label: 'Specs', icon: Layers, badge: parsedTasks.length },
            { id: 'context', label: 'Context', icon: Cpu },
            { id: 'agents', label: 'Agents & .env', icon: Bot },
          ] as const).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors border',
                tab === item.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted/70 hover:text-foreground',
              )}
            >
              <item.icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {'badge' in item && typeof item.badge === 'number' && (
                <span className="text-[10px] font-mono opacity-75">{item.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Body */}
      <ScrollArea className="flex-1">
        <div className="p-3.5 space-y-4">
          {/* 1. RULES MANAGER */}
          {tab === 'rules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Active rules automatically sync to project <code className="font-mono text-foreground">AGENTS.md</code>.</span>
                <span className="font-mono tabular-nums">~{activeRulesTokens} tok</span>
              </div>

              <div className="space-y-2">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="rounded-lg border border-border/80 bg-card/60 p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => void handleToggleRule(rule.id)}
                        />
                        <span className="text-xs font-medium text-foreground truncate">{rule.name}</span>
                        <span className="text-[10px] font-mono rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                          {rule.scope === 'path' && rule.glob ? rule.glob : rule.scope}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => void handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{rule.content}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-dashed border-border p-3 space-y-2.5 bg-card/30">
                <p className="text-xs font-medium text-foreground">Add Rule</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    placeholder="Rule title (e.g. Tailwind v4 tokens)"
                    className="h-8 text-xs"
                  />
                  <div className="flex gap-1">
                    {(['project', 'global', 'path'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNewRuleScope(s)}
                        className={cn(
                          'flex-1 rounded border text-[11px] font-mono py-1',
                          newRuleScope === s
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border text-muted-foreground',
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                {newRuleScope === 'path' && (
                  <Input
                    value={newRuleGlob}
                    onChange={(e) => setNewRuleGlob(e.target.value)}
                    placeholder="Glob pattern (e.g. src/components/**/*.tsx)"
                    className="h-8 text-xs font-mono"
                  />
                )}
                <Textarea
                  value={newRuleContent}
                  onChange={(e) => setNewRuleContent(e.target.value)}
                  placeholder="Instruction the AI agent must follow..."
                  className="min-h-[70px] text-xs"
                />
                <Button size="sm" onClick={() => void handleAddRule()} className="h-7 text-xs gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Save Rule
                </Button>
              </div>
            </div>
          )}

          {/* 2. SKILLS & SLASH COMMANDS */}
          {tab === 'skills' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                {[...customSkills, ...BUILTIN_SKILLS].map((skill) => (
                  <div
                    key={skill.id}
                    className="rounded-lg border border-border/80 bg-card/60 p-3 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded">
                          {skill.command}
                        </code>
                        <span className="text-xs font-medium text-foreground truncate">{skill.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{skill.description}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => void dispatchOrCopy(skill.id, skill.promptTemplate, skill.command)}
                      >
                        {copiedId === skill.id ? <Check className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        Run
                      </Button>
                      {!skill.builtIn && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => void handleDeleteSkill(skill.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-dashed border-border p-3 space-y-2 bg-card/30">
                <p className="text-xs font-medium text-foreground">Create Custom Skill</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={newSkillCmd}
                    onChange={(e) => setNewSkillCmd(e.target.value)}
                    placeholder="/deploy-check"
                    className="h-8 text-xs font-mono"
                  />
                  <Input
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="Skill display name"
                    className="h-8 text-xs"
                  />
                </div>
                <Textarea
                  value={newSkillPrompt}
                  onChange={(e) => setNewSkillPrompt(e.target.value)}
                  placeholder="Reusable instruction template..."
                  className="min-h-[68px] text-xs"
                />
                <Button size="sm" onClick={() => void handleAddSkill()} className="h-7 text-xs gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Add Skill
                </Button>
              </div>
            </div>
          )}

          {/* 3. SPECS STUDIO (Requirements -> Design -> Tasks) */}
          {tab === 'specs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex rounded-md bg-muted/60 p-0.5 text-xs">
                  {(['requirements', 'design', 'tasks'] as const).map((step, i) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setSpecStep(step)}
                      className={cn(
                        'px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors',
                        specStep === step
                          ? 'bg-background text-foreground shadow-sm border border-border/60'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {i + 1}. {step}
                    </button>
                  ))}
                </div>
                <Button size="sm" variant="outline" onClick={() => void handleSaveSpecs()} className="h-7 text-xs gap-1.5">
                  <Save className="w-3.5 h-3.5" />
                  Save
                </Button>
              </div>

              <Textarea
                value={specs[specStep]}
                onChange={(e) => setSpecs((prev) => ({ ...prev, [specStep]: e.target.value }))}
                className="min-h-[210px] font-mono text-xs leading-relaxed"
              />

              {specStep === 'tasks' && parsedTasks.length > 0 && (
                <div className="rounded-lg border border-border/80 bg-card/60 p-3 space-y-2">
                  <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" />
                    Executable Task Checklist
                  </p>
                  {parsedTasks.map((task) => (
                    <div key={task.index} className="flex items-center justify-between gap-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer min-w-0">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => void handleToggleTaskLine(task.index)}
                          className="rounded border-border"
                        />
                        <span className={cn('truncate', task.done && 'line-through text-muted-foreground')}>
                          {task.text}
                        </span>
                      </label>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[11px] flex-shrink-0"
                        onClick={() =>
                          void dispatchOrCopy(
                            `task-${task.index}`,
                            `Implement the following task from .studio/specs/tasks.md according to .studio/specs/design.md:\n\n- ${task.text}`,
                            'Task',
                          )
                        }
                      >
                        Execute →
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. CONTEXT & PERSISTENT MEMORY */}
          {tab === 'context' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border/80 bg-card/60 p-3">
                  <p className="text-[10px] uppercase font-mono text-muted-foreground">Project Files</p>
                  <p className="text-lg font-semibold tabular-nums mt-0.5">{projectStats.fileCount}</p>
                </div>
                <div className="rounded-lg border border-border/80 bg-card/60 p-3">
                  <p className="text-[10px] uppercase font-mono text-muted-foreground">Repo Tokens</p>
                  <p className="text-lg font-semibold tabular-nums mt-0.5">
                    ~{projectStats.approxTokens.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-border/80 bg-card/60 p-3">
                  <p className="text-[10px] uppercase font-mono text-muted-foreground">Rules + Mem</p>
                  <p className="text-lg font-semibold tabular-nums mt-0.5">
                    ~{(activeRulesTokens + memoryTokens).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '@files', prompt: 'Inspect the project file tree and summarize key entrypoints.' },
                  { label: '@git-diff', prompt: 'Inspect `git status` and `git diff` to review uncommitted work.' },
                  { label: '@problems', prompt: 'Check all TypeScript diagnostics and console errors across the project.' },
                  { label: '/compact', prompt: 'Compact our current progress, decisions & next steps into `.studio/MEMORY.md`.' },
                ].map((ctx) => (
                  <Button
                    key={ctx.label}
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-xs font-mono gap-1.5"
                    onClick={() => void dispatchOrCopy(ctx.label, ctx.prompt, ctx.label)}
                  >
                    <Copy className="w-3 h-3" />
                    {ctx.label}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Persistent Memory (.studio/MEMORY.md)
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5"
                    onClick={async () => {
                      await store.saveMemory(memory);
                      toast({ title: 'Memory saved' });
                    }}
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Memory
                  </Button>
                </div>
                <Textarea
                  value={memory}
                  onChange={(e) => setMemory(e.target.value)}
                  className="min-h-[190px] font-mono text-xs leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* 5. AGENTS, PERMISSIONS, HOOKS, MCP & .ENV */}
          {tab === 'agents' && (
            <div className="space-y-5">
              {/* Permission Modes */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">Permission Mode</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PERMISSION_MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => void handlePermissionMode(m.id)}
                      className={cn(
                        'text-left rounded-lg border p-2.5 transition-colors',
                        permissionMode === m.id
                          ? 'border-foreground bg-muted/60'
                          : 'border-border/80 bg-card/50 hover:border-foreground/30',
                      )}
                    >
                      <p className="text-xs font-medium text-foreground">{m.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-Agents */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">Specialized Sub-Agents</p>
                <div className="space-y-1.5">
                  {BUILTIN_SUBAGENTS.map((agent) => (
                    <div
                      key={agent.id}
                      className="rounded-lg border border-border/80 bg-card/60 p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">{agent.name}</span>
                          <span className="text-[10px] font-mono rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                            {agent.access}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{agent.role}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs gap-1 flex-shrink-0"
                        onClick={() => void dispatchOrCopy(agent.id, agent.systemPrompt, agent.name)}
                      >
                        <Play className="w-3 h-3" />
                        Invoke
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* MCP Status */}
              <div className="rounded-lg border border-border/80 bg-card/60 p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground">MCP Tool Servers</p>
                  <p className="text-[11px] text-muted-foreground">
                    {mcpCount} server{mcpCount === 1 ? '' : 's'} configured in encrypted vault
                  </p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate('/settings/ai')}>
                  Manage MCP →
                </Button>
              </div>

              {/* Lifecycle Hooks */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Webhook className="w-3.5 h-3.5" />
                  Lifecycle Hooks (.studio/hooks.json)
                </p>
                {hooks.map((hook) => (
                  <div
                    key={hook.id}
                    className="rounded-lg border border-border/80 bg-card/60 p-2.5 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-[10px] font-mono rounded bg-muted px-1.5 py-0.5">{hook.event}</code>
                        <span className="text-xs font-medium truncate">{hook.name}</span>
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">{hook.command}</p>
                    </div>
                    <Switch checked={hook.enabled} onCheckedChange={() => void handleToggleHook(hook.id)} />
                  </div>
                ))}
              </div>

              {/* Project .env Secrets Manager */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Project Environment (.env)
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-muted-foreground"
                    onClick={() => setShowSecrets((s) => !s)}
                  >
                    {showSecrets ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
                    {showSecrets ? 'Hide' : 'Reveal'}
                  </Button>
                </div>
                {envVars.map((entry) => (
                  <div
                    key={entry.key}
                    className="flex items-center justify-between gap-2 rounded border border-border/70 bg-card/40 px-2.5 py-1.5 text-xs font-mono"
                  >
                    <span className="text-foreground truncate">{entry.key}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground truncate max-w-[140px]">
                        {showSecrets ? entry.value : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleDeleteEnvVar(entry.key)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-1.5">
                  <Input
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value)}
                    placeholder="VITE_API_URL"
                    className="h-8 text-xs font-mono"
                  />
                  <Input
                    type={showSecrets ? 'text' : 'password'}
                    value={newEnvVal}
                    onChange={(e) => setNewEnvVal(e.target.value)}
                    placeholder="value"
                    className="h-8 text-xs font-mono"
                  />
                  <Button size="sm" onClick={() => void handleAddEnvVar()} className="h-8 px-2.5 text-xs">
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
