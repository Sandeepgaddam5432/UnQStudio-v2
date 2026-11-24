import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  serializer?: {
    serialize: (value: T) => string;
    deserialize: (value: string) => T;
  },
) {
  const serialize = serializer?.serialize || JSON.stringify;
  const deserialize = serializer?.deserialize || JSON.parse;

  const queryClient = useQueryClient();

  const defaultValueRef = useRef(defaultValue);
  defaultValueRef.current = defaultValue;
  const serializeRef = useRef(serialize);
  serializeRef.current = serialize;
  const deserializeRef = useRef(deserialize);
  deserializeRef.current = deserialize;

  const queryFn = useCallback(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? deserializeRef.current(item) : defaultValueRef.current;
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
      return defaultValueRef.current;
    }
  }, [key]);

  const { data: state } = useQuery<T>({
    queryKey: ['localStorage', key],
    queryFn,
    initialData: queryFn,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Fix F-015: read latest value from React Query cache instead of stale closure & memoize setValue
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const cached = queryClient.getQueryData<T>(['localStorage', key]);
        const currentValue = cached !== undefined ? cached : defaultValueRef.current;
        const valueToStore = value instanceof Function ? value(currentValue) : value;
        localStorage.setItem(key, serializeRef.current(valueToStore));
        queryClient.setQueryData(['localStorage', key], valueToStore);
      } catch (error) {
        console.warn(`Failed to save ${key} to localStorage:`, error);
      }
    },
    [key, queryClient],
  );

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = deserializeRef.current(e.newValue);
          queryClient.setQueryData(['localStorage', key], newValue);
        } catch (error) {
          console.warn(`Failed to sync ${key} from localStorage:`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, queryClient]);

  return [state ?? defaultValue, setValue] as const;
}
