import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingDialog } from './OnboardingDialog';
import { TestApp } from '@/test/TestApp';

vi.mock('@/hooks/useAISettings', () => ({
  useAISettings: () => ({
    settings: { providers: [], recentlyUsedModels: [] },
    setProvider: vi.fn(),
    removeProvider: vi.fn(),
    setProviders: vi.fn(),
    addRecentlyUsedModel: vi.fn(),
    updateSettings: vi.fn(),
    isConfigured: false,
  }),
}));

describe('OnboardingDialog', () => {
  it('renders pure AI provider setup dialog when open', () => {
    render(
      <TestApp>
        <OnboardingDialog open={true} onOpenChange={vi.fn()} />
      </TestApp>,
    );

    expect(screen.getByText(/Connect an AI Provider/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save & Start Building/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <TestApp>
        <OnboardingDialog open={false} onOpenChange={vi.fn()} />
      </TestApp>,
    );

    expect(screen.queryByText(/Connect an AI Provider/i)).not.toBeInTheDocument();
  });
});
