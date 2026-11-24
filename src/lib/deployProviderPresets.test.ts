import { describe, it, expect } from 'vitest';
import { DEFAULT_DEPLOY_PROVIDERS, migrateDeployProvider } from './deployProviderPresets';

describe('migrateDeployProvider', () => {
  it('defaults to pure non-Nostr deploy providers', () => {
    expect(Array.isArray(DEFAULT_DEPLOY_PROVIDERS)).toBe(true);
    expect(DEFAULT_DEPLOY_PROVIDERS).toHaveLength(0);
  });

  it('leaves modern deploy providers untouched', () => {
    const netlify = { id: 'netlify', name: 'Netlify', type: 'netlify', apiKey: 'token' };
    const cloudflare = { id: 'cf', name: 'Cloudflare', type: 'cloudflare', apiKey: 'token', accountId: 'acc' };

    expect(migrateDeployProvider(netlify)).toBe(netlify);
    expect(migrateDeployProvider(cloudflare)).toBe(cloudflare);
  });

  it('passes through non-object entries safely', () => {
    expect(migrateDeployProvider(null)).toBe(null);
    expect(migrateDeployProvider('nonsense')).toBe('nonsense');
  });
});
