import type * as SentryTypes from '@sentry/react';

let sentryInstance: typeof SentryTypes | null = null;
let isInitialized = false;
let isEnabled = false;

const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/nsec1[023456789acdefghjklmnpqrstuvwxyz]{58}/g, 'nsec1[REDACTED]'],
  [/nostr\+walletconnect:\/\/[^\s"'<>]+/gi, 'nostr+walletconnect://[REDACTED]'],
  [/bunker:\/\/[^\s"'<>]+/gi, 'bunker://[REDACTED]'],
  [/nbunksec1[023456789acdefghjklmnpqrstuvwxyz]+/g, 'nbunksec1[REDACTED]'],
  [/sk-[a-zA-Z0-9_-]{12,}/g, 'sk-[REDACTED]'],
  [/(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{20,}/g, 'gh_[REDACTED]'],
  [/github_pat_[a-zA-Z0-9_]{20,}/g, 'github_pat_[REDACTED]'],
  [/Bearer\s+[a-zA-Z0-9._~+/=-]{16,}/gi, 'Bearer [REDACTED]'],
  [/([?&#](?:apiKey|api_key|secret|token|code)=)[^&\s#]+/gi, '$1[REDACTED]'],
];

function censorSensitiveData(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === 'string') {
    let sanitized = value;
    for (const [regex, replacement] of SECRET_PATTERNS) {
      sanitized = sanitized.replace(regex, replacement);
    }
    return sanitized;
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    return value.map((item) => censorSensitiveData(item, seen));
  }
  if (value && typeof value === 'object') {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = censorSensitiveData(val, seen);
    }
    return result;
  }
  return value;
}

/**
 * Dynamically imports and initializes Sentry
 * @param dsn - Sentry DSN
 * @returns Promise that resolves when Sentry is initialized
 */
export async function initializeSentry(dsn: string): Promise<void> {
  // Don't initialize if DSN is empty
  if (!dsn) {
    console.log('Sentry DSN is empty, skipping initialization');
    return;
  }

  // If Sentry was already initialized once, just re-enable it
  if (isInitialized && sentryInstance) {
    console.log('Sentry already initialized, re-enabling');
    const client = sentryInstance.getClient();
    if (client) {
      client.getOptions().enabled = true;
    }
    isEnabled = true;
    return;
  }

  try {
    // Dynamic import to avoid loading Sentry unless needed
    const Sentry = await import('@sentry/react');
    sentryInstance = Sentry;

    // Initialize Sentry
    Sentry.init({
      dsn,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring
      // Session Replay
      replaysSessionSampleRate: 0.1, // Sample 10% of sessions
      replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors
      // Environment
      environment: import.meta.env.MODE,
      // Release
      release: import.meta.env.VERSION,
      // Censor sensitive data before sending to Sentry (fixes F-017)
      beforeSend(event) {
        return censorSensitiveData(event) as typeof event;
      },
      beforeBreadcrumb(breadcrumb) {
        return censorSensitiveData(breadcrumb) as typeof breadcrumb;
      },
    });

    isInitialized = true;
    isEnabled = true;
    console.log('Sentry initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
    throw error;
  }
}

/**
 * Disables Sentry by setting enabled to false
 */
export async function disableSentry(): Promise<void> {
  if (!isInitialized || !sentryInstance || !isEnabled) {
    return;
  }

  try {
    const client = sentryInstance.getClient();
    if (client) {
      // Just disable the client instead of closing it
      // This allows re-enabling without re-initializing
      client.getOptions().enabled = false;
    }
    isEnabled = false;
    console.log('Sentry disabled successfully');
  } catch (error) {
    console.error('Failed to disable Sentry:', error);
  }
}

/**
 * Checks if Sentry is currently initialized and enabled
 */
export function isSentryInitialized(): boolean {
  return isInitialized && isEnabled;
}

/**
 * Gets the Sentry instance (if initialized)
 */
export function getSentryInstance(): typeof SentryTypes | null {
  return sentryInstance;
}
