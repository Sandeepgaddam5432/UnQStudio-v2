import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useSeoMeta } from '@unhead/react';
import {
  ArrowUp,
  Command,
  FolderGit2,
  GitBranch,
  Layers,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Terminal,
  Upload,
  Zap,
} from 'lucide-react';

import { useProjectsManager } from '@/hooks/useProjectsManager';
import { useGenerateProjectInfo } from '@/hooks/useGenerateProjectInfo';
import { useFS } from '@/hooks/useFS';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAISettings } from '@/hooks/useAISettings';
import { useAppContext } from '@/hooks/useAppContext';
import { useDictationInput } from '@/hooks/useDictationInput';
import { AppLayout } from '@/components/AppLayout';
import { OnboardingDialog } from '@/components/OnboardingDialog';
import { Quilly } from '@/components/Quilly';
import { VoiceInputButton } from '@/components/Shakespeare/VoiceInputButton';
import { BrandLogo } from '@/components/BrandLogo';
import { ModelSelector } from '@/components/ModelSelector';
import { ZipImportDialog } from '@/components/ZipImportDialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileAttachment } from '@/components/ui/file-attachment';
import { DotAI } from '@/lib/DotAI';
import type { AIMessage } from '@/lib/SessionManager';
import type { Project } from '@/lib/ProjectsManager';
import { buildMessageContent } from '@/lib/buildMessageContent';
import { BRAND } from '@/lib/brand';
import { STARTER_TEMPLATES, type StarterTemplate } from '@/lib/starterTemplates';
import { cn } from '@/lib/utils';

type ComposerMode = 'build' | 'plan' | 'ask';

const QUICK_PROMPTS = [
  'Build a sleek SaaS analytics dashboard with dark mode & live filters',
  'Create a Linear-inspired personal portfolio with project cards & contact form',
  'Build a Kanban task board with drag-and-drop columns & local persistence',
  'Design an API playground tool to test REST endpoints & format JSON responses',
];

export default function Index() {
  const navigate = useNavigate();
  const projectsManager = useProjectsManager();
  const { fs } = useFS();
  const { generateProjectInfo } = useGenerateProjectInfo();
  const { settings, addRecentlyUsedModel, isLoading: isLoadingSettings } = useAISettings();
  const { config, updateConfig } = useAppContext();
  const isMobile = useIsMobile();

  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<ComposerMode>('build');
  const [isCreating, setIsCreating] = useState(false);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [storedPrompt, setStoredPrompt] = useLocalStorage(BRAND.storageKey('draft-prompt'), '');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showZipImport, setShowZipImport] = useState(false);
  const [providerModel, setProviderModel] = useState(() => settings.recentlyUsedModels?.[0] || '');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorBanner, setErrorBanner] = useState<Error | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [templateCategory, setTemplateCategory] = useState<string>('All');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasProvidersConfigured = !isLoadingSettings && settings.providers.length > 0;

  useSeoMeta({
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
  });

  useEffect(() => {
    if (!providerModel && settings.recentlyUsedModels?.length) {
      setProviderModel(settings.recentlyUsedModels[0]);
    }
  }, [providerModel, settings.recentlyUsedModels]);

  useEffect(() => {
    if (storedPrompt) setPrompt(storedPrompt);
  }, [storedPrompt]);

  const loadRecentProjects = useCallback(async () => {
    try {
      await projectsManager.init();
      const list = await projectsManager.getProjects();
      setRecentProjects(list.slice(0, 6));
    } catch {
      setRecentProjects([]);
    }
  }, [projectsManager]);

  useEffect(() => {
    void loadRecentProjects();
  }, [loadRecentProjects]);

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    setStoredPrompt(value);
  };

  const dictation = useDictationInput({
    textareaRef,
    value: prompt,
    onChange: handlePromptChange,
    maxHeight: 200,
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    setAttachedFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const handleLaunchTemplate = async (template: StarterTemplate) => {
    if (isCreating || creatingTemplateId) return;
    setCreatingTemplateId(template.id);
    setErrorBanner(null);
    try {
      await projectsManager.init();
      const project = await projectsManager.createProjectFromFiles(template.name, template.files);
      navigate(`/project/${project.id}?build`);
    } catch (error) {
      setErrorBanner(error instanceof Error ? error : new Error('Failed to create template project'));
    } finally {
      setCreatingTemplateId(null);
    }
  };

  const handleZipImport = async (file: File, overwrite = false, projectId?: string) => {
    await projectsManager.init();
    const project = await projectsManager.importProjectFromZip(file, projectId, overwrite);
    await loadRecentProjects();
    navigate(`/project/${project.id}`);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() && attachedFiles.length === 0) return;
    if (isCreating) return;

    if (!hasProvidersConfigured) {
      setShowOnboarding(true);
      return;
    }

    if (!providerModel) {
      setErrorBanner(new Error('Please select an AI model before creating a project.'));
      return;
    }

    setIsCreating(true);
    setErrorBanner(null);

    try {
      await projectsManager.init();
      const effectivePrompt =
        mode === 'plan'
          ? `[PLAN MODE — Produce a concise requirements, architecture & task plan first before editing files.]\n\n${prompt.trim()}`
          : mode === 'ask'
            ? `[ASK MODE — Answer and explore without modifying files.]\n\n${prompt.trim()}`
            : prompt.trim();

      const fallbackName = prompt.trim().split(/\s+/).slice(0, 4).join(' ') || 'New Project';
      let projectId: string | undefined;

      try {
        const info = await generateProjectInfo(providerModel.trim(), effectivePrompt);
        if (info?.projectId) projectId = info.projectId;
      } catch {
        // Fall back to starter template + derived name if metadata call fails
      }

      const defaultStarter = STARTER_TEMPLATES[3]; // React + TypeScript Blank Pro (100% static/instant)
      const project = await projectsManager.createProjectFromFiles(
        fallbackName,
        defaultStarter.files,
        projectId,
      );

      // Save initial user message in project history using DotAI so ChatPane starts immediately
      const dotAI = new DotAI(fs, `${config.fsPathProjects}/${project.id}`);
      const sessionName = DotAI.generateSessionName();
      const messageContent = await buildMessageContent(effectivePrompt, attachedFiles, fs, undefined);
      const initialMessage: AIMessage = {
        role: 'user',
        content: messageContent,
      };
      await dotAI.setHistory(sessionName, [initialMessage]);
      addRecentlyUsedModel(providerModel.trim());

      setPrompt('');
      setStoredPrompt('');
      setAttachedFiles([]);

      const params = new URLSearchParams({
        autostart: 'true',
        build: 'true',
        ...(providerModel.trim() && { model: providerModel.trim() }),
      });
      navigate(`/project/${project.id}?${params.toString()}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      setErrorBanner(error instanceof Error ? error : new Error('Failed to create project'));
    } finally {
      setIsCreating(false);
    }
  };

  const toggleTheme = () => {
    updateConfig((curr) => ({ ...curr, theme: curr.theme === 'dark' ? 'light' : 'dark' }));
  };

  const categories = ['All', 'Dashboard', 'Landing', 'AI', 'Web App', 'Python'];
  const filteredTemplates =
    templateCategory === 'All'
      ? STARTER_TEMPLATES
      : STARTER_TEMPLATES.filter((tpl) => tpl.category === templateCategory);

  return (
    <AppLayout>
      <div className="min-h-full flex flex-col bg-background bg-brand-soft">
        {/* Top Minimal Linear/Vercel Header */}
        <header className="sticky top-0 z-20 h-14 border-b border-border/70 bg-background/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BrandLogo showWordmark className="w-6 h-6" wordmarkClassName="text-sm" />
            <span className="hidden sm:inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              100% Static · Local-First
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.dispatchEvent(new CustomEvent('studio:open-command-palette'))}
              className="h-8 gap-2 px-2.5 text-xs text-muted-foreground hover:text-foreground border-border/80 bg-muted/40"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Command</span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Toggle Theme"
            >
              {config.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings/ai')}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Main Scroll Content */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-16 space-y-14">
          {/* Hero + v0/Linear Prompt Composer */}
          <section className="space-y-6">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Rules · Skills · Specs · Context · MCP · Sub-Agents</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.1]">
                What will you ship today?
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {BRAND.tagline}
              </p>
            </div>

            {errorBanner && (
              <div className="max-w-3xl mx-auto">
                <Quilly
                  error={errorBanner}
                  onDismiss={() => setErrorBanner(null)}
                  onNewChat={() => {
                    setPrompt('');
                    setStoredPrompt('');
                    setErrorBanner(null);
                  }}
                  onOpenModelSelector={() => navigate('/settings/ai')}
                  providerModel={providerModel}
                />
              </div>
            )}

            {/* Centered Composer Card */}
            <form
              onSubmit={handleSubmit}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handleFileSelect(e.dataTransfer.files);
              }}
              className={cn(
                'max-w-3xl mx-auto rounded-xl border bg-card/90 shadow-panel transition-all',
                isDragOver ? 'border-ring ring-2 ring-ring/20' : 'border-border/90 focus-within:border-foreground/30',
              )}
            >
              {/* Mode Switcher Bar */}
              <div className="flex items-center justify-between px-3.5 pt-3 pb-1 border-b border-border/50">
                <div className="inline-flex items-center gap-1 rounded-md bg-muted/60 p-0.5 text-xs">
                  {([
                    { id: 'build', label: 'Build', icon: Zap },
                    { id: 'plan', label: 'Plan / Spec', icon: Layers },
                    { id: 'ask', label: 'Ask', icon: Sparkles },
                  ] as const).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMode(item.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors',
                        mode === item.id
                          ? 'bg-background text-foreground shadow-sm border border-border/60'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <item.icon className="h-3 w-3" />
                      {item.label}
                    </button>
                  ))}
                </div>

                {!hasProvidersConfigured && !isLoadingSettings && (
                  <button
                    type="button"
                    onClick={() => navigate('/settings/ai')}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                  >
                    Connect AI API Key →
                  </button>
                )}
              </div>

              {/* Prompt Input */}
              <div className="p-3.5">
                <Textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
                      e.preventDefault();
                      void handleSubmit();
                    }
                  }}
                  placeholder={
                    mode === 'plan'
                      ? 'Describe your app to generate a structured Requirements → Design → Tasks spec...'
                      : 'Describe the app, dashboard, tool, or script you want to build...'
                  }
                  className="min-h-[96px] max-h-[220px] resize-none border-0 bg-transparent p-0 text-sm md:text-base shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/70"
                />

                {attachedFiles.length > 0 && (
                  <div className="mt-3">
                    <FileAttachment
                      selectedFiles={attachedFiles}
                      onFileSelect={(file) => setAttachedFiles((prev) => [...prev, file])}
                      onFileRemove={(file) =>
                        setAttachedFiles((prev) => prev.filter((f) => f !== file))
                      }
                    />
                  </div>
                )}
              </div>

              {/* Composer Footer Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-t border-border/60 bg-muted/20 rounded-b-xl">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <ModelSelector
                    value={providerModel}
                    onChange={setProviderModel}
                    disabled={isCreating}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Attach
                  </Button>
                  <VoiceInputButton
                    onStart={dictation.onStart}
                    onText={dictation.onText}
                    onEnd={dictation.onEnd}
                    disabled={isCreating}
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreating || (!prompt.trim() && attachedFiles.length === 0)}
                  className="h-8 px-3.5 gap-1.5 text-xs font-medium bg-primary text-primary-foreground hover:opacity-90"
                >
                  {isCreating ? (
                    <span>Creating...</span>
                  ) : (
                    <>
                      <span>{mode === 'plan' ? 'Plan Project' : 'Build Now'}</span>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Quick Prompt Chips */}
            <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-2">
              {QUICK_PROMPTS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handlePromptChange(chip)}
                  className="rounded-full border border-border/80 bg-card/60 hover:bg-muted px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {chip.length > 52 ? `${chip.slice(0, 52)}…` : chip}
                </button>
              ))}
            </div>
          </section>

          {/* Instant Starter Templates (100% Static / Offline Ready) */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  Instant Starter Templates
                </h2>
                <p className="text-xs text-muted-foreground">
                  Launch a live browser IDE workspace in one click — zero setup required.
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setTemplateCategory(cat)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs transition-colors border',
                      templateCategory === cat
                        ? 'bg-primary text-primary-foreground border-primary font-medium'
                        : 'bg-card text-muted-foreground border-border/70 hover:text-foreground',
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  disabled={Boolean(creatingTemplateId)}
                  onClick={() => handleLaunchTemplate(tpl)}
                  className="group text-left rounded-xl border border-border/80 bg-card/70 hover:bg-card hover:border-foreground/25 p-4 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                        {tpl.category}
                      </span>
                      <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
                        {creatingTemplateId === tpl.id ? 'Creating...' : 'Launch →'}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{tpl.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tpl.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tpl.stack.map((tag) => (
                      <span
                        key={tag}
                        className="rounded border border-border/70 bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}

              {/* Import Git / ZIP Quick Action Card */}
              <div className="rounded-xl border border-dashed border-border bg-card/40 p-4 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                    Import Existing Code
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">Git Repo or ZIP Archive</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Clone any Git repository or upload a local ZIP directly into the browser VFS.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/clone')}
                    className="flex-1 h-8 text-xs gap-1.5"
                  >
                    <GitBranch className="h-3.5 w-3.5" />
                    Clone Git
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowZipImport(true)}
                    className="flex-1 h-8 text-xs gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Import ZIP
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Projects Grid */}
          {recentProjects.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  Recent Workspaces
                </h2>
                <span className="text-xs text-muted-foreground font-mono tabular-nums">
                  {recentProjects.length} active
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="group text-left rounded-xl border border-border/80 bg-card/70 hover:bg-card hover:border-foreground/25 p-4 transition-all flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <FolderGit2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate">
                          {project.name}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground truncate">{project.id}</p>
                    </div>
                    <Terminal className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      <OnboardingDialog open={showOnboarding} onOpenChange={setShowOnboarding} />
      <ZipImportDialog
        open={showZipImport}
        onOpenChange={setShowZipImport}
        onImport={handleZipImport}
      />
    </AppLayout>
  );
}
