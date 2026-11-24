import { ReactNode, useState, useEffect, useRef } from 'react';
import { GitSettingsContext, type GitSettings, type GitCredential, type GitSettingsContextType } from '@/contexts/GitSettingsContext';
import { useFS } from '@/hooks/useFS';
import { useFSPaths } from '@/hooks/useFSPaths';
import { readGitSettings, writeGitSettings } from '@/lib/configUtils';
import { migrateConfigToVault } from '@/lib/vaultMigration';

interface GitSettingsProviderProps {
  children: ReactNode;
}

const DEFAULT_SETTINGS: GitSettings = {
  credentials: [],
};

export function GitSettingsProvider({ children }: GitSettingsProviderProps) {
  const { fs, vaultFs: maybeVaultFs } = useFS();
  const vaultFs = maybeVaultFs ?? fs;
  const { configPath } = useFSPaths();
  const [settings, setSettings] = useState<GitSettings>(DEFAULT_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializedPathRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    initializedPathRef.current = null;
    setIsInitialized(false);

    const initializeSettings = async () => {
      try {
        await migrateConfigToVault(fs, vaultFs, configPath);
        const loaded = await readGitSettings(vaultFs, configPath);
        if (!cancelled) {
          setSettings(loaded);
          initializedPathRef.current = configPath;
        }
      } catch (error) {
        console.error('Failed to initialize Git settings:', error);
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
        await writeGitSettings(vaultFs, settings, configPath);
      } catch (error) {
        console.error('Failed to save Git settings:', error);
      }
    };

    saveSettings();
  }, [vaultFs, settings, isInitialized, configPath]);

  const updateSettings = (newSettings: Partial<GitSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const addCredential = (credential: GitCredential) => {
    setSettings(prev => ({
      ...prev,
      credentials: [...prev.credentials, credential],
    }));
  };

  const removeCredential = (id: string) => {
    setSettings(prev => ({
      ...prev,
      credentials: prev.credentials.filter((cred) => cred.id !== id),
    }));
  };

  const setCredentials = (credentials: GitCredential[]) => {
    setSettings(prev => ({
      ...prev,
      credentials,
    }));
  };

  const value: GitSettingsContextType = {
    settings,
    updateSettings,
    addCredential,
    removeCredential,
    setCredentials,
    isConfigured: settings.credentials.length > 0,
    isInitialized,
  };

  return (
    <GitSettingsContext.Provider value={value}>
      {children}
    </GitSettingsContext.Provider>
  );
}
