import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorState, Compartment } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
  HighlightStyle,
} from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { tags as t } from '@lezer/highlight';
import { Save, Loader2, ImageOff, WrapText, Search, FileCode2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useGitStatus } from '@/hooks/useGitStatus';
import { isMediaFile } from '@/lib/fileUtils';
import { useAppContext } from '@/hooks/useAppContext';

interface FileEditorProps {
  filePath: string;
  content: string;
  onSave: (content: string) => void;
  isLoading: boolean;
  projectId?: string;
}

const darkSyntaxStyle = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.moduleKeyword], color: '#c084fc' },
  { tag: [t.string, t.special(t.string)], color: '#34d399' },
  { tag: [t.number, t.bool, t.null, t.atom], color: '#fbbf24' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: '#71717a', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#38bdf8' },
  { tag: [t.typeName, t.className, t.tagName], color: '#22d3ee' },
  { tag: [t.attributeName, t.propertyName], color: '#93c5fd' },
  { tag: [t.operator, t.punctuation], color: '#a1a1aa' },
  { tag: [t.variableName], color: '#f4f4f5' },
]);

const lightSyntaxStyle = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.moduleKeyword], color: '#7c3aed' },
  { tag: [t.string, t.special(t.string)], color: '#059669' },
  { tag: [t.number, t.bool, t.null, t.atom], color: '#d97706' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: '#71717a', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#0284c7' },
  { tag: [t.typeName, t.className, t.tagName], color: '#0891b2' },
  { tag: [t.attributeName, t.propertyName], color: '#2563eb' },
  { tag: [t.operator, t.punctuation], color: '#52525b' },
  { tag: [t.variableName], color: '#18181b' },
]);

function createEditorTheme(isDark: boolean) {
  return EditorView.theme(
    {
      '&': {
        height: '100%',
        fontSize: '13px',
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
      },
      '.cm-scroller': {
        fontFamily: "'JetBrains Mono', 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        lineHeight: '1.6',
        overflow: 'auto',
      },
      '.cm-content': {
        padding: '12px 0',
        caretColor: isDark ? '#38bdf8' : '#09090b',
      },
      '.cm-gutters': {
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--muted-foreground) / 0.65)',
        borderRight: '1px solid hsl(var(--border) / 0.7)',
        paddingRight: '6px',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'hsl(var(--muted) / 0.5)',
        color: 'hsl(var(--foreground))',
      },
      '.cm-activeLine': {
        backgroundColor: 'hsl(var(--muted) / 0.35)',
      },
      '.cm-selectionBackground, ::selection': {
        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.28) !important' : 'rgba(99, 102, 241, 0.18) !important',
      },
      '.cm-cursor': {
        borderLeftColor: isDark ? '#38bdf8' : '#09090b',
      },
      '.cm-panels': {
        backgroundColor: 'hsl(var(--card))',
        color: 'hsl(var(--foreground))',
        borderTop: '1px solid hsl(var(--border))',
      },
      '.cm-searchMatch': {
        backgroundColor: 'rgba(250, 204, 21, 0.25)',
      },
    },
    { dark: isDark },
  );
}

function getLanguageExtension(path: string) {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'ts':
      return javascript({ typescript: true });
    case 'tsx':
      return javascript({ typescript: true, jsx: true });
    case 'jsx':
      return javascript({ jsx: true });
    case 'js':
    case 'mjs':
    case 'cjs':
      return javascript();
    case 'html':
    case 'htm':
    case 'svg':
      return html();
    case 'css':
    case 'scss':
      return css();
    case 'json':
    case 'webmanifest':
      return json();
    case 'md':
    case 'mdx':
      return markdown();
    case 'py':
      return python();
    default:
      return [];
  }
}

function getLanguageLabel(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'TypeScript',
    tsx: 'TypeScript JSX',
    js: 'JavaScript',
    jsx: 'JavaScript JSX',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON',
    md: 'Markdown',
    py: 'Python',
    sh: 'Shell',
    yml: 'YAML',
    yaml: 'YAML',
    svg: 'SVG',
  };
  return map[ext] || 'Plain Text';
}

export function FileEditor({ filePath, content, onSave, isLoading, projectId }: FileEditorProps) {
  const { t: translate } = useTranslation();
  const { config } = useAppContext();
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const { data: gitStatus } = useGitStatus(projectId || null);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const saveRef = useRef<() => Promise<void>>(async () => {});
  const initialWordWrapRef = useRef(wordWrap);
  initialWordWrapRef.current = wordWrap;
  const wrapCompartment = useMemo(() => new Compartment(), []);

  const isDark =
    config.theme === 'dark' ||
    (config.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    setEditedContent(content);
    setHasChanges(false);
  }, [content, filePath]);

  const handleSave = async () => {
    const latest = viewRef.current ? viewRef.current.state.doc.toString() : editedContent;
    setIsSaving(true);
    try {
      await onSave(latest);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save file:', error);
    } finally {
      setIsSaving(false);
    }
  };

  saveRef.current = handleSave;

  // Mount / rebuild CodeMirror 6 instance when file or theme changes
  useEffect(() => {
    if (!editorContainerRef.current || isLoading || isMediaFile(filePath)) return;

    const saveKeyBinding = keymap.of([
      {
        key: 'Mod-s',
        run: () => {
          void saveRef.current();
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        foldGutter(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        highlightSelectionMatches(),
        saveKeyBinding,
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          indentWithTab,
        ]),
        getLanguageExtension(filePath),
        syntaxHighlighting(isDark ? darkSyntaxStyle : lightSyntaxStyle),
        createEditorTheme(isDark),
        wrapCompartment.of(initialWordWrapRef.current ? EditorView.lineWrapping : []),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const nextVal = update.state.doc.toString();
            setEditedContent(nextVal);
            setHasChanges(nextVal !== content);
          }
          if (update.selectionSet) {
            const head = update.state.selection.main.head;
            const line = update.state.doc.lineAt(head);
            setCursorPos({ line: line.number, col: head - line.from + 1 });
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorContainerRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [filePath, content, isDark, isLoading, wrapCompartment]);

  // Toggle word wrap dynamically without recreating editor
  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: wrapCompartment.reconfigure(wordWrap ? EditorView.lineWrapping : []),
    });
  }, [wordWrap, wrapCompartment]);

  const fileGitStatus = useMemo(() => {
    if (!gitStatus?.changedFiles) return null;
    const found = gitStatus.changedFiles.find((c) => c.filepath === filePath);
    return found?.status || null;
  }, [gitStatus, filePath]);

  const statusBadgeClass =
    fileGitStatus === 'added' || fileGitStatus === 'untracked'
      ? 'text-emerald-500'
      : fileGitStatus === 'modified' || fileGitStatus === 'staged'
        ? 'text-amber-500'
        : 'text-foreground';

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{translate('loadingFile')}</span>
        </div>
      </div>
    );
  }

  if (isMediaFile(filePath)) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background p-6 text-center space-y-2">
        <ImageOff className="h-8 w-8 text-muted-foreground/60" />
        <p className="text-sm font-medium text-foreground">{filePath}</p>
        <p className="text-xs text-muted-foreground">Binary/media files cannot be edited as text.</p>
      </div>
    );
  }

  const lineCount = editedContent.split('\n').length;

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Crisp Zed/Cursor-style Editor Header Bar */}
      <div className="h-10 px-3 border-b border-border/80 bg-card/50 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className={cn('text-xs font-mono truncate', statusBadgeClass)}>
            {filePath}
          </span>
          {hasChanges && (
            <span
              className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"
              title="Unsaved changes"
            />
          )}
          <span className="hidden sm:inline-flex rounded border border-border/70 bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            {getLanguageLabel(filePath)}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setWordWrap((w) => !w)}
            className={cn('h-7 px-2 text-xs text-muted-foreground', wordWrap && 'bg-muted text-foreground')}
            title="Toggle Word Wrap"
          >
            <WrapText className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              // Trigger CodeMirror search panel via Ctrl/Cmd+F
              if (viewRef.current) {
                viewRef.current.focus();
                viewRef.current.contentDOM.dispatchEvent(
                  new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true }),
                );
              }
            }}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Find in File (Ctrl+F)"
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={hasChanges ? 'default' : 'ghost'}
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="h-7 px-2.5 gap-1.5 text-xs"
            title="Save (Cmd/Ctrl+S)"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>{translate('save')}</span>
          </Button>
        </div>
      </div>

      {/* CodeMirror 6 Mount Container */}
      <div ref={editorContainerRef} className="flex-1 min-h-0 overflow-hidden" />

      {/* Minimal Editor Footer Telemetry */}
      <div className="h-6 px-3 border-t border-border/70 bg-card/40 flex items-center justify-between text-[10px] font-mono text-muted-foreground tabular-nums flex-shrink-0">
        <span>
          Ln {cursorPos.line}, Col {cursorPos.col}
        </span>
        <div className="flex items-center gap-3">
          <span>{lineCount} lines</span>
          <span>UTF-8</span>
          <span>Cmd+S to save</span>
        </div>
      </div>
    </div>
  );
}
