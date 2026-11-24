import { useQueryClient } from '@tanstack/react-query';
import { ReactNode, useState, useEffect, useRef } from 'react';
import { AISettingsContext, type AISettings, type AIProvider, type MCPServer, type AISettingsContextType } from '@/contexts/AISettingsContext';
import { useFS } from '@/hooks/useFS';
import { useFSPaths } from '@/hooks/useFSPaths';
import { readAISettings, writeAISettings } from '@/lib/configUtils';
import { migrateConfigToVault } from '@/lib/vaultMigration';

interface AISettingsProviderProps {
  children: ReactNode;
}

const DEFAULT_SETTINGS: AISettings = {
  providers: [],
  recentlyUsedModels: [],
  mcpServers: {},
};

export function AISettingsProvider({ children }: AISettingsProviderProps) {
  const queryClient = useQueryClient();
  const { fs, vaultFs: maybeVaultFs } = useFS();
  const vaultFs = maybeVaultFs ?? fs;
  const { configPath } = useFSPaths();
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);
  // Track which configPath has finished loading so switching configPath never clobbers the new path (fixes F-024)
  const initializedPathRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    initializedPathRef.current = null;
    setIsInitialized(false);

    const initializeSettings = async () => {
      try {
        await migrateConfigToVault(fs, vaultFs, configPath);
        const loaded = await readAISettings(vaultFs, configPath);
        if (!cancelled) {
          setSettings(loaded);
          initializedPathRef.current = configPath;
        }
      } catch (error) {
        console.error('Failed to initialize AI settings:', error);
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
        await writeAISettings(vaultFs, settings, configPath);
      } catch (error) {
        console.error('Failed to save AI settings:', error);
      }
    };

    saveSettings();
  }, [vaultFs, settings, isInitialized, configPath]);

  const updateSettings = (newSettings: Partial<AISettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));

    if ('providers' in newSettings) {
      queryClient.invalidateQueries({ queryKey: ['provider-models'] });
      queryClient.invalidateQueries({ queryKey: ['ai-credits'] });
    }
  };

  const setProvider = (provider: AIProvider) => {
    setSettings(prev => {
      const existingIndex = prev.providers.findIndex(p => p.id === provider.id);
      if (existingIndex >= 0) {
        return {
          ...prev,
          providers: prev.providers.map(p => (p.id === provider.id ? provider : p)),
        };
      }
      return {
        ...prev,
        providers: [...prev.providers, provider],
      };
    });
    queryClient.invalidateQueries({ queryKey: ['provider-models'] });
    queryClient.invalidateQueries({ queryKey: ['ai-credits'] });
  };

  const removeProvider = (id: string) => {
    setSettings(prev => ({
      ...prev,
      providers: prev.providers.filter(provider => provider.id !== id),
    }));
    queryClient.invalidateQueries({ queryKey: ['provider-models'] });
    queryClient.invalidateQueries({ queryKey: ['ai-credits'] });
  };

  const setProviders = (providers: AIProvider[]) => {
    setSettings(prev => ({
      ...prev,
      providers,
    }));
    queryClient.invalidateQueries({ queryKey: ['provider-models'] });
    queryClient.invalidateQueries({ queryKey: ['ai-credits'] });
  };

  const addRecentlyUsedModel = (modelId: string) => {
    setSettings(prev => {
      const existingIndex = prev.recentlyUsedModels.indexOf(modelId);
      if (existingIndex === 0) {
        return prev;
      } else if (existingIndex === -1) {
        return {
          ...prev,
          recentlyUsedModels: [modelId, ...prev.recentlyUsedModels].slice(0, 10),
        };
      } else {
        const filtered = prev.recentlyUsedModels.filter(m => m !== modelId);
        return {
          ...prev,
          recentlyUsedModels: [modelId, ...filtered].slice(0, 10),
        };
      }
    });
  };

  const setMCPServer = (name: string, server: MCPServer) => {
    setSettings(prev => ({
      ...prev,
      mcpServers: {
        ...(prev.mcpServers || {}),
        [name]: server,
      },
    }));
  };

  const removeMCPServer = (name: string) => {
    setSettings(prev => {
      const updated = { ...(prev.mcpServers || {}) };
      delete updated[name];
      return {
        ...prev,
        mcpServers: updated,
      };
    });
  };

  const value: AISettingsContextType = {
    settings,
    updateSettings,
    setProvider,
    removeProvider,
    setProviders,
    addRecentlyUsedModel,
    setMCPServer,
    removeMCPServer,
    isConfigured: settings.providers.length > 0,
    isLoading: !isInitialized,
  };

  return (
    <AISettingsContext.Provider value={value}>
      {children}
    </AISettingsContext.Provider>
  );
}
