import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAISettings } from '@/hooks/useAISettings';
import { discoverMCPTools, type MCPClient } from '@/lib/MCPClient';
import type OpenAI from 'openai';

export interface UseMCPToolsResult {
  tools: Record<string, OpenAI.Chat.Completions.ChatCompletionTool>;
  clients: Record<string, MCPClient>;
  isLoading: boolean;
  error: Error | null;
}

function closeUniqueClients(clients?: Record<string, MCPClient>) {
  if (!clients) return;
  const seen = new Set<MCPClient>();
  for (const client of Object.values(clients)) {
    if (seen.has(client)) continue;
    seen.add(client);
    void client.close().catch(() => {});
  }
}

/**
 * Hook to discover and manage MCP tools from configured servers
 * with deterministic transport cleanup on refetch and unmount (fixes F-014).
 */
export function useMCPTools(): UseMCPToolsResult {
  const { settings } = useAISettings();
  const mcpServers = useMemo(() => settings.mcpServers || {}, [settings.mcpServers]);
  const prevClientsRef = useRef<Record<string, MCPClient> | undefined>(undefined);

  const { data, isLoading, error } = useQuery({
    queryKey: ['mcp-tools', mcpServers],
    queryFn: async () => {
      if (Object.keys(mcpServers).length === 0) {
        return { tools: {}, clients: {} };
      }
      return await discoverMCPTools(mcpServers);
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    const previous = prevClientsRef.current;
    if (previous && previous !== data?.clients) {
      closeUniqueClients(previous);
    }
    prevClientsRef.current = data?.clients;
  }, [data?.clients]);

  useEffect(() => {
    return () => {
      closeUniqueClients(prevClientsRef.current);
      prevClientsRef.current = undefined;
    };
  }, []);

  return {
    tools: data?.tools || {},
    clients: data?.clients || {},
    isLoading,
    error: error as Error | null,
  };
}
