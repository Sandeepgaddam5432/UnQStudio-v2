import { BRAND } from '@/lib/brand';

export interface PresetProvider {
  id: string;
  name: string;
  baseURL: string;
  apiKeysURL?: string;
  nostr?: boolean;
  tosURL?: string;
  proxy?: boolean;
  openSecret?: string;
  /** Default API key for providers where the key is a required placeholder */
  apiKey?: string;
}

const optionalEnvPreset: PresetProvider[] = BRAND.infra.defaultAiApiUrl
  ? [
      {
        id: 'studio-default',
        name: BRAND.infra.defaultAiName || `${BRAND.name} AI`,
        baseURL: BRAND.infra.defaultAiApiUrl,
      },
    ]
  : [];

export const AI_PROVIDER_PRESETS: PresetProvider[] = [
  ...optionalEnvPreset,
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    apiKeysURL: 'https://openrouter.ai/settings/keys',
    tosURL: 'https://openrouter.ai/terms',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    apiKeysURL: 'https://platform.openai.com/api-keys',
    tosURL: 'https://openai.com/policies/',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    baseURL: 'https://api.anthropic.com/v1',
    apiKeysURL: 'https://console.anthropic.com/settings/keys',
    tosURL: 'https://www.anthropic.com/legal/consumer-terms',
    proxy: true,
  },
  {
    id: 'google',
    name: 'Google Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiKeysURL: 'https://aistudio.google.com/apikey',
    tosURL: 'https://ai.google.dev/gemini-api/terms',
    proxy: true,
  },
  {
    id: 'groq',
    name: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    apiKeysURL: 'https://console.groq.com/keys',
    tosURL: 'https://groq.com/terms-of-use/',
  },
  {
    id: 'xai',
    name: 'xAI',
    baseURL: 'https://api.x.ai/v1',
    apiKeysURL: 'https://console.x.ai',
    tosURL: 'https://x.ai/legal',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    apiKeysURL: 'https://platform.deepseek.com/api_keys',
    tosURL: 'https://cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html',
  },
  {
    id: 'moonshot',
    name: 'Moonshot AI',
    baseURL: 'https://api.moonshot.ai/v1',
    apiKeysURL: 'https://platform.moonshot.ai/console/api-keys',
    tosURL: 'https://platform.moonshot.ai/docs/agreement/modeluse',
    proxy: true,
  },
  {
    id: 'vercel',
    name: 'Vercel v0',
    baseURL: 'https://api.v0.dev/v1',
    apiKeysURL: 'https://v0.app/chat/settings/billing',
    tosURL: 'https://vercel.com/legal/terms',
    proxy: true,
  },
  {
    id: 'opencode',
    name: 'OpenCode Zen',
    baseURL: 'https://opencode.ai/zen/v1',
    apiKeysURL: 'https://opencode.ai/auth',
    tosURL: 'https://opencode.ai/legal/terms-of-service',
    proxy: true,
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama',
  },
];
