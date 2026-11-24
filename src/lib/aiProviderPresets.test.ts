import { describe, it, expect } from 'vitest';
import { AI_PROVIDER_PRESETS } from './aiProviderPresets';

describe('AI Provider Presets', () => {
  it('should export pure AI preset providers array without Nostr/Shakespeare providers', () => {
    expect(AI_PROVIDER_PRESETS).toBeDefined();
    expect(Array.isArray(AI_PROVIDER_PRESETS)).toBe(true);
    expect(AI_PROVIDER_PRESETS.length).toBeGreaterThan(0);
    expect(AI_PROVIDER_PRESETS.find((p) => p.id === 'shakespeare')).toBeUndefined();
    expect(AI_PROVIDER_PRESETS.every((p) => !p.nostr)).toBe(true);
  });

  it('should include major modern AI providers', () => {
    const providerIds = AI_PROVIDER_PRESETS.map((p) => p.id);
    expect(providerIds).toContain('openai');
    expect(providerIds).toContain('openrouter');
  });

  it('should get preset provider by id', () => {
    const openai = AI_PROVIDER_PRESETS.find((p) => p.id === 'openai');
    expect(openai).toBeDefined();
    expect(openai?.name).toBe('OpenAI');
    expect(AI_PROVIDER_PRESETS.find((p) => p.id === 'non-existent')).toBeUndefined();
  });

  it('should have valid preset structure', () => {
    AI_PROVIDER_PRESETS.forEach((preset) => {
      expect(preset.id).toBeDefined();
      expect(typeof preset.id).toBe('string');
      expect(preset.name).toBeDefined();
      expect(typeof preset.name).toBe('string');
      expect(preset.baseURL).toMatch(/^https?:\/\//);
      if (preset.apiKeysURL) {
        expect(preset.apiKeysURL).toMatch(/^https?:\/\//);
      }
    });
  });
});
