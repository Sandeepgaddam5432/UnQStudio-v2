import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createHead, UnheadProvider } from '@unhead/react/client';
import { InferSeoMetaPlugin } from '@unhead/addons';
import { Suspense, useEffect } from 'react';
import LightningFS from '@isomorphic-git/lightning-fs';
import NostrProvider from '@/components/NostrProvider';
import { TooltipProvider } from "@/components/ui/tooltip";
import { NostrLoginProvider } from '@nostrify/react/login';
import { AppProvider } from '@/components/AppProvider';
import { AppConfig } from '@/contexts/AppContext';
import { useAppContext } from '@/hooks/useAppContext';
import { SentryProvider } from '@/components/SentryProvider';
import { PlausibleProvider } from '@/components/PlausibleProvider';
import { AISettingsProvider } from '@/components/AISettingsProvider';
import { GitSettingsProvider } from '@/components/GitSettingsProvider';
import { DeploySettingsProvider } from '@/components/DeploySettingsProvider';
import { SessionManagerProvider } from '@/components/SessionManagerProvider';
import { FSProvider } from '@/components/FSProvider';
import { ConsoleErrorProvider } from '@/components/ConsoleErrorProvider';
import { GitSyncProvider } from '@/components/GitSyncProvider';
import { LightningFSAdapter } from '@/lib/LightningFSAdapter';
import { cleanupTmpDirectory } from '@/lib/tmpCleanup';
import { DynamicFavicon } from '@/components/DynamicFavicon';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { PWAUpdatePrompt } from '@/components/PWAUpdatePrompt';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LockdownModeDetector } from '@/components/LockdownModeDetector';
import { BRAND } from '@/lib/brand';

import AppRouter from './AppRouter';

const head = createHead({
  plugins: [InferSeoMetaPlugin()],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000,
      gcTime: Infinity,
    },
  },
});

// 100% env-driven defaults — zero hardcoded brand domains or Nostr relays
const defaultConfig: AppConfig = {
  theme: "dark",
  relayMetadata: {
    relays: [],
    updatedAt: 0,
  },
  graspMetadata: {
    relays: [],
    updatedAt: 0,
  },
  templates: [],
  esmUrl: BRAND.infra.esmUrl,
  corsProxy: BRAND.infra.corsProxy,
  gitProxyOrigins: ["https://github.com", "https://gitlab.com"],
  faviconUrl: BRAND.infra.faviconUrl,
  ngitWebUrl: "",
  previewDomain: BRAND.infra.previewDomain,
  language: "en",
  showcaseEnabled: false,
  showcaseCurator: "",
  fsPathProjects: "/projects",
  fsPathConfig: "/config",
  fsPathTmp: "/tmp",
  fsPathPlugins: "/plugins",
  fsPathTemplates: "/templates",
  sentryDsn: BRAND.infra.sentryDsn,
  sentryEnabled: Boolean(BRAND.infra.sentryDsn),
  plausibleDomain: BRAND.infra.plausibleDomain,
  plausibleEndpoint: BRAND.infra.plausibleEndpoint,
};

// Workspace LightningFS (project code, git repos, tmp)
const workspaceFs = new LightningFSAdapter(new LightningFS(BRAND.fsDbName).promises);

// Isolated Credentials Vault LightningFS (API keys, Git tokens, Deploy tokens — fixes F-003)
const vaultFs = new LightningFSAdapter(new LightningFS(BRAND.vaultDbName).promises);

function FSCleanupHandler() {
  const { config } = useAppContext();

  useEffect(() => {
    const initializeAndCleanup = async () => {
      try {
        try {
          await workspaceFs.stat(config.fsPathTmp);
        } catch {
          await workspaceFs.mkdir(config.fsPathTmp, { recursive: true });
        }
        await cleanupTmpDirectory(workspaceFs, config.fsPathTmp);
      } catch (error) {
        console.error('Error during filesystem initialization:', error);
      }
    };

    initializeAndCleanup();
  }, [config.fsPathTmp]);

  return null;
}

export function App() {
  return (
    <ErrorBoundary>
      <UnheadProvider head={head}>
        <QueryClientProvider client={queryClient}>
          <AppProvider storageKey={BRAND.storageKey('app-config')} defaultConfig={defaultConfig}>
            <PlausibleProvider>
              <SentryProvider>
                <FSProvider fs={workspaceFs} vaultFs={vaultFs}>
                  <ConsoleErrorProvider>
                    <FSCleanupHandler />
                    <NostrLoginProvider storageKey={BRAND.storageKey('session')}>
                      <NostrProvider>
                        <AISettingsProvider>
                          <GitSettingsProvider>
                            <DeploySettingsProvider>
                              <GitSyncProvider>
                                <SessionManagerProvider>
                                  <TooltipProvider>
                                    <DynamicFavicon />
                                    <OfflineIndicator />
                                    <PWAUpdatePrompt />
                                    <LockdownModeDetector />
                                    <Suspense>
                                      <AppRouter />
                                    </Suspense>
                                  </TooltipProvider>
                                </SessionManagerProvider>
                              </GitSyncProvider>
                            </DeploySettingsProvider>
                          </GitSettingsProvider>
                        </AISettingsProvider>
                      </NostrProvider>
                    </NostrLoginProvider>
                  </ConsoleErrorProvider>
                </FSProvider>
              </SentryProvider>
            </PlausibleProvider>
          </AppProvider>
        </QueryClientProvider>
      </UnheadProvider>
    </ErrorBoundary>
  );
}

export default App;
