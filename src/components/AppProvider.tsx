import { ReactNode, useCallback, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { AppContext, type AppConfig, type AppContextType, type Theme, type RelayMetadata, type GraspMetadata } from '@/contexts/AppContext';
import i18n from '@/lib/i18n';
import { MOBILE_BREAKPOINT } from '@/lib/mobileBreakpoint';

interface AppProviderProps {
  children: ReactNode;
  storageKey: string;
  defaultConfig: AppConfig;
}

const optionalUrlSchema = z.union([z.string().url(), z.literal('')]);

const RelayMetadataSchema = z.object({
  relays: z.array(
    z.object({
      url: z.string().url(),
      read: z.boolean(),
      write: z.boolean(),
    }),
  ),
  updatedAt: z.number(),
}) satisfies z.ZodType<RelayMetadata>;

const GraspMetadataSchema = z.object({
  relays: z.array(
    z.object({
      url: z.string().url(),
    }),
  ),
  updatedAt: z.number(),
}) satisfies z.ZodType<GraspMetadata>;

const ProjectTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  url: z.string().url(),
});

const fieldSchemas: Record<keyof AppConfig, z.ZodTypeAny> = {
  theme: z.enum(['dark', 'light', 'system']),
  relayMetadata: RelayMetadataSchema,
  graspMetadata: GraspMetadataSchema,
  templates: z.array(ProjectTemplateSchema),
  esmUrl: optionalUrlSchema,
  corsProxy: optionalUrlSchema,
  gitProxyOrigins: z.array(z.string()),
  faviconUrl: optionalUrlSchema,
  ngitWebUrl: optionalUrlSchema,
  previewDomain: z.string(),
  language: z.string().optional(),
  showcaseEnabled: z.boolean(),
  showcaseCurator: z.string(),
  fsPathProjects: z.string().min(1),
  fsPathConfig: z.string().min(1),
  fsPathTmp: z.string().min(1),
  fsPathPlugins: z.string().min(1),
  fsPathTemplates: z.string().min(1),
  sentryDsn: z.string(),
  sentryEnabled: z.boolean(),
  systemPrompt: z.string().optional(),
  plausibleDomain: z.string(),
  plausibleEndpoint: z.string(),
};

/**
 * Resilient field-by-field parser (fixes F-010):
 * A single malformed key in localStorage never wipes out unrelated settings.
 */
function parsePartialAppConfig(raw: unknown): Partial<AppConfig> {
  if (!raw || typeof raw !== 'object') return {};
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const schema = fieldSchemas[key as keyof AppConfig];
    if (!schema) continue;
    const parsed = schema.safeParse(value);
    if (parsed.success) {
      result[key] = parsed.data;
    }
  }
  return result as Partial<AppConfig>;
}

const configSerializer = {
  serialize: JSON.stringify,
  deserialize: (value: string) => parsePartialAppConfig(JSON.parse(value)),
};

export function AppProvider(props: AppProviderProps) {
  const { children, storageKey, defaultConfig } = props;

  const [rawConfig, setConfig] = useLocalStorage<Partial<AppConfig>>(
    storageKey,
    {},
    configSerializer,
  );

  const updateConfig = useCallback(
    (updater: (currentConfig: Partial<AppConfig>) => Partial<AppConfig>) => {
      setConfig(updater);
    },
    [setConfig],
  );

  const config = useMemo(() => ({ ...defaultConfig, ...rawConfig }), [defaultConfig, rawConfig]);

  const appContextValue = useMemo<AppContextType>(
    () => ({
      config,
      defaultConfig,
      updateConfig,
    }),
    [config, defaultConfig, updateConfig],
  );

  useApplyTheme(config.theme);
  useApplyThemeColor();
  useApplyLanguage(config.language);

  return (
    <AppContext.Provider value={appContextValue}>
      {children}
    </AppContext.Provider>
  );
}

function useApplyTheme(theme: Theme) {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
}

function useApplyThemeColor(): void {
  useEffect(() => {
    const root = document.documentElement;
    const narrow = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const apply = () => {
      const variable = narrow.matches ? '--background' : '--shell';
      const [h, s, l] = getComputedStyle(root).getPropertyValue(variable).trim().split(/\s+/);
      if (!h || !s || !l) return;

      const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
      metas.forEach((meta, i) => i > 0 && meta.remove());
      const meta =
        metas[0] ??
        document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'theme-color' }));
      meta.removeAttribute('media');
      meta.content = `hsl(${h}, ${s}, ${l})`;
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    narrow.addEventListener('change', apply);

    return () => {
      observer.disconnect();
      narrow.removeEventListener('change', apply);
    };
  }, []);
}

function useApplyLanguage(language?: string): void {
  useEffect(() => {
    i18n.changeLanguage(language ?? 'en');
  }, [language]);
}
