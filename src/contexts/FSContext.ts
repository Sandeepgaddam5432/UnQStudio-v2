import { createContext } from 'react';
import type { JSRuntimeFS } from '@/lib/JSRuntime';

export interface FSContextType {
  /** Project workspace virtual filesystem (exposed to editor, bundler, AI tools) */
  fs: JSRuntimeFS;
  /**
   * Isolated credentials vault filesystem (stored in a dedicated IndexedDB database).
   * NEVER passed to esbuild, ReadTool, GrepTool, ShellTool, or BashFS (fixes F-003).
   */
  vaultFs?: JSRuntimeFS;
}

export const FSContext = createContext<FSContextType | undefined>(undefined);
