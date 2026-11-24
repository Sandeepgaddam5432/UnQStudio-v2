/**
 * Single Source of Truth for White-Label Brand & Runtime Environment Config.
 * Zero domains, brand names, or external service hosts are hardcoded in source code;
 * all deployment-specific values flow from Vite environment variables (VITE_*).
 */

function readEnv(key: string, fallback = ''): string {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function getRuntimeOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
    return window.location.origin;
  }
  return '';
}

function getRuntimeHost(): string {
  if (typeof window !== 'undefined' && window.location?.host) {
    return window.location.host;
  }
  return '';
}

const rawAppName = readEnv('VITE_APP_NAME', 'AI Studio');
const rawShortName = readEnv('VITE_APP_SHORT_NAME', rawAppName);
const rawTagline = readEnv(
  'VITE_APP_TAGLINE',
  'Build, refine & ship software with autonomous AI.',
);
const rawDescription = readEnv(
  'VITE_APP_DESCRIPTION',
  `${rawAppName} — ${rawTagline} Browser-native AI IDE with Rules, Skills, Specs, Context Management, MCP & Sub-agents.`,
);
const rawStoragePrefix = readEnv('VITE_APP_STORAGE_PREFIX', 'studio')
  .toLowerCase()
  .replace(/[^a-z0-9_-]/g, '-');

export const BRAND = {
  /** Display brand name (from VITE_APP_NAME) */
  name: rawAppName,
  /** Compact short name for PWA / mobile badges */
  shortName: rawShortName,
  /** Primary tagline shown in hero & metadata */
  tagline: rawTagline,
  /** Full SEO/OG description */
  description: rawDescription,
  /** Public canonical URL (falls back to current runtime origin) */
  get url(): string {
    return readEnv('VITE_APP_URL', getRuntimeOrigin());
  },
  /** Public domain/hostname (falls back to current runtime host) */
  get domain(): string {
    return readEnv('VITE_APP_DOMAIN', getRuntimeHost());
  },
  /** Optional support email */
  supportEmail: readEnv('VITE_APP_SUPPORT_EMAIL', ''),
  /** Optional repository URL */
  repoUrl: readEnv('VITE_APP_REPO_URL', ''),
  /** Optional documentation URL */
  docsUrl: readEnv('VITE_APP_DOCS_URL', ''),
  /** Logo asset path (served statically from /public) */
  logoUrl: readEnv('VITE_APP_LOGO_URL', '/brand-logo.svg'),
  /** Namespace prefix for IndexedDB & localStorage keys */
  storagePrefix: rawStoragePrefix,
  /** Workspace LightningFS database name */
  fsDbName: `${rawStoragePrefix}-workspace-fs`,
  /** Isolated credentials Vault LightningFS database name (never exposed to AI tools/bundler) */
  vaultDbName: `${rawStoragePrefix}-vault-fs`,
  /** Helper to create namespaced localStorage keys */
  storageKey(suffix: string): string {
    return `${rawStoragePrefix}-${suffix}`;
  },
  /** Runtime optional infrastructure defaults (all env-driven) */
  infra: {
    /** Optional CORS proxy template e.g. https://proxy.example.com/?url={href} */
    corsProxy: readEnv('VITE_CORS_PROXY_URL', ''),
    /** Optional favicon proxy template e.g. https://favicon.example.com/?url={href} */
    faviconUrl: readEnv('VITE_FAVICON_URL', ''),
    /** ESM CDN URL used by in-browser bundler */
    esmUrl: readEnv('VITE_ESM_URL', 'https://esm.sh'),
    /** Isolated preview wildcard domain (empty = built-in static sandboxed srcdoc/blob fallback) */
    previewDomain: readEnv('VITE_PREVIEW_DOMAIN', ''),
    /** Optional default custom AI API endpoint */
    defaultAiApiUrl: readEnv('VITE_DEFAULT_AI_API_URL', ''),
    /** Optional default custom AI provider label */
    defaultAiName: readEnv('VITE_DEFAULT_AI_NAME', ''),
    /** Optional Sentry DSN */
    sentryDsn: readEnv('VITE_SENTRY_DSN', ''),
    /** Optional Plausible analytics */
    plausibleDomain: readEnv('VITE_PLAUSIBLE_DOMAIN', ''),
    plausibleEndpoint: readEnv('VITE_PLAUSIBLE_ENDPOINT', ''),
  },
} as const;

export type BrandConfig = typeof BRAND;
