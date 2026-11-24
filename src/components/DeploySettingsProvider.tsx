import { useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { DeploySettingsContext, type DeploySettings, type DeployProvider } from '@/contexts/DeploySettingsContext';
import { useFS } from '@/hooks/useFS';
import { useFSPaths } from '@/hooks/useFSPaths';
import { readDeploySettings, writeDeploySettings } from '@/lib/configUtils';
import { DEFAULT_DEPLOY_PROVIDERS } from '@/lib/deployProviderPresets';
import { migrateConfigToVault } from '@/lib/vaultMigration';

const DEFAULT_SETTINGS: DeploySettings = {
  providers: [...DEFAULT_DEPLOY_PROVIDERS],
};

export function DeploySettingsProvider({ children }: { children: ReactNode }) {
  const { fs, vaultFs: maybeVaultFs } = useFS();
  const vaultFs = maybeVaultFs ?? fs;
  const { configPath } = useFSPaths();
  const [settings, setSettings] = useState<DeploySettings>(DEFAULT_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializedPathRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    initializedPathRef.current = null;
    setIsInitialized(false);

    const initializeSettings = async () => {
      try {
        await migrateConfigToVault(fs, vaultFs, configPath);
        const loaded = await readDeploySettings(vaultFs, configPath);
        if (!cancelled) {
          setSettings(loaded);
          initializedPathRef.current = configPath;
        }
      } catch (error) {
        console.error('Failed to initialize deploy settings:', error);
        if (!cancelled) {
          setSettings(DEFAULT_SETTINGS);
          initializedPathRef.current = configPath;
        }
      } finally {
        if (!cancelled) {
          setIsInitialized(true);
        }
      }
    };

    initializeSettings();
    return () => {
      cancelled = true;
    };
  }, [fs, vaultFs, configPath]);

  useEffect(() => {
    if (!isInitialized || initializedPathRef.current !== configPath) return;

    const saveSettings = async () => {
      try {
        await writeDeploySettings(vaultFs, settings, configPath);
      } catch (error) {
        console.error('Failed to save deploy settings:', error);
      }
    };

    saveSettings();
  }, [vaultFs, settings, isInitialized, configPath]);

  const updateSettings = (updates: Partial<DeploySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const removeProvider = (index: number) => {
    setSettings(prev => ({
      ...prev,
      providers: prev.providers.filter((_, i) => i !== index),
    }));
  };

  const setProviders = (providers: DeployProvider[]) => {
    setSettings(prev => ({ ...prev, providers }));
  };

  const isConfigured = useMemo(() => settings.providers.length > 0, [settings.providers]);

  const value = {
    settings,
    updateSettings,
    removeProvider,
    setProviders,
    isConfigured,
    isInitialized,
  };

  return (
    <DeploySettingsContext.Provider value={value}>
      {children}
    </DeploySettingsContext.Provider>
  );
}
