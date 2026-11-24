import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type React from 'react';
import { TestApp } from '@/test/TestApp';
import { AISettings } from './AISettings';

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({ user: undefined, users: [] })),
}));

vi.mock('@/hooks/useAISettings', () => ({
  useAISettings: vi.fn(() => ({
    settings: { providers: [] },
    setProvider: vi.fn(),
    removeProvider: vi.fn(),
    setProviders: vi.fn(),
    updateSettings: vi.fn(),
    addRecentlyUsedModel: vi.fn(),
    isConfigured: false,
    isLoading: false,
  })),
}));

vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

describe('AISettings', () => {
  it('shows pure AI provider tiles for standard presets without Nostr dependency', () => {
    render(
      <TestApp>
        <AISettings />
      </TestApp>,
    );

    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('OpenRouter')).toBeInTheDocument();
    expect(screen.queryByText('Shakespeare AI')).not.toBeInTheDocument();
  });
});
