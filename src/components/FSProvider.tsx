import { ReactNode, useMemo } from 'react';
import { FSContext, type FSContextType } from '@/contexts/FSContext';
import type { JSRuntimeFS } from '@/lib/JSRuntime';

interface FSProviderProps {
  children: ReactNode;
  fs: JSRuntimeFS;
  /** Dedicated vault FS for credentials; falls back to `fs` only in isolated unit tests */
  vaultFs?: JSRuntimeFS;
}

export function FSProvider({ children, fs, vaultFs }: FSProviderProps) {
  const contextValue = useMemo<FSContextType>(
    () => ({
      fs,
      vaultFs: vaultFs ?? fs,
    }),
    [fs, vaultFs],
  );

  return (
    <FSContext.Provider value={contextValue}>
      {children}
    </FSContext.Provider>
  );
}
