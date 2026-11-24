import type { DeployProvider, NpanelProvider, NsiteProvider } from '@/contexts/DeploySettingsContext';
import type { PresetDeployProvider } from './deploy/types';

export const DEFAULT_NPANEL_PROVIDER: NpanelProvider = {
  id: 'npanel',
  name: 'Custom Gateway',
  type: 'npanel',
  dashboardHost: '',
  domain: '',
  relayUrls: [],
  blossomServers: [],
};

export const DEFAULT_NSITE_PROVIDER: NsiteProvider = {
  id: 'nsite',
  name: 'Static Gateway',
  type: 'nsite',
  gateway: '',
  relayUrls: [],
  blossomServers: [],
};

/** Pure AI IDE starts cleanly with standard web deploy targets configured on demand. */
export const DEFAULT_DEPLOY_PROVIDERS: DeployProvider[] = [];

export function migrateDeployProvider(provider: unknown): unknown {
  return provider;
}

export const PRESET_DEPLOY_PROVIDERS: PresetDeployProvider[] = [
  {
    id: 'vercel',
    type: 'vercel',
    name: 'Vercel',
    description: 'Deploy static & frontend apps directly to Vercel',
    baseURL: 'https://api.vercel.com',
    apiKeyLabel: 'Access Token',
    apiKeyURL: 'https://vercel.com/account/tokens',
    proxy: true,
  },
  {
    id: 'netlify',
    type: 'netlify',
    name: 'Netlify',
    description: 'Deploy directly to Netlify global CDN',
    baseURL: 'https://api.netlify.com/api/v1',
    apiKeyLabel: 'Personal Access Token',
    apiKeyURL: 'https://app.netlify.com/user/applications#personal-access-tokens',
    proxy: true,
  },
  {
    id: 'cloudflare',
    type: 'cloudflare',
    name: 'Cloudflare',
    description: 'Deploy to Cloudflare Workers & Static Assets',
    baseURL: 'https://api.cloudflare.com/client/v4',
    apiKeyLabel: 'API Token',
    apiKeyURL: 'https://dash.cloudflare.com/profile/api-tokens',
    accountIdLabel: 'Account ID',
    accountIdURL: 'https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/',
    proxy: true,
  },
  {
    id: 'deno',
    type: 'deno',
    name: 'Deno Deploy',
    description: 'Deploy to Deno Deploy edge network',
    baseURL: 'https://api.deno.com/v1',
    apiKeyLabel: 'Access Token',
    apiKeyURL: 'https://dash.deno.com/account#access-tokens',
    organizationIdLabel: 'Organization ID',
    organizationIdURL: 'https://dash.deno.com/orgs',
    proxy: true,
  },
  {
    id: 'railway',
    type: 'railway',
    name: 'Railway',
    description: 'Deploy to Railway',
    baseURL: 'https://backboard.railway.com',
    apiKeyLabel: 'API Token',
    apiKeyURL: 'https://railway.app/account/tokens',
    proxy: true,
  },
];
