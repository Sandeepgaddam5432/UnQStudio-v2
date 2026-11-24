import { proxyUrl } from '../proxyUrl';
import { isPrivateOrLoopbackHost } from '../security';

/** Hosts reached directly: they allow CORS, and Pyodide and micropip load packages from them. */
const DIRECT_HOSTS = new Set(['cdn.jsdelivr.net', 'pypi.org', 'files.pythonhosted.org']);

/**
 * The URL a request from Python should go to: other sites are reached
 * through the CORS proxy, as `curl` does, since most of them don't allow
 * cross-origin requests.
 * Hardened (F-004): blocks private/loopback/metadata hosts and prevents
 * non-http(s) protocol smuggling.
 */
export function pythonRequestUrl(url: string, base: string, corsProxy: string | undefined): string {
  let parsed: URL;
  try {
    parsed = new URL(url, base);
  } catch {
    throw new Error('Blocked invalid URL in Python runtime');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Blocked non-HTTP(S) protocol in Python runtime: ${parsed.protocol}`);
  }
  const baseOrigin = new URL(base).origin;
  if (parsed.origin === baseOrigin) {
    // Allow same-origin only for worker script / wasm assets, never app APIs
    if (!/\.(js|mjs|wasm|data|json)$/i.test(parsed.pathname)) {
      throw new Error('Blocked same-origin request from Python sandbox');
    }
    return url;
  }
  if (isPrivateOrLoopbackHost(parsed.hostname)) {
    throw new Error(`Blocked request to private/loopback host: ${parsed.hostname}`);
  }
  if (!corsProxy || DIRECT_HOSTS.has(parsed.hostname)) return url;
  const proxied = proxyUrl({ template: corsProxy, url: parsed });
  if (new URL(proxied, base).origin === parsed.origin) return url;
  return proxied;
}

let corsProxy: string | undefined;

/** Set the proxy that `fetch` and `XMLHttpRequest` in this worker send requests through. */
export function setPythonCorsProxy(template: string | undefined): void {
  corsProxy = template;
}

/** Route the worker's `fetch` and `XMLHttpRequest` through `pythonRequestUrl`. */
export function installPythonNetwork(scope: typeof globalThis): void {
  const base = scope.location.href;
  const rewrite = (url: string) => pythonRequestUrl(url, base, corsProxy);

  const origFetch = scope.fetch.bind(scope);
  scope.fetch = (input, init) => {
    const safeInit: RequestInit = { ...init, credentials: 'omit' };
    if (input instanceof Request) {
      return origFetch(new Request(rewrite(input.url), input), safeInit);
    }
    return origFetch(rewrite(String(input)), safeInit);
  };

  const open = scope.XMLHttpRequest.prototype.open as (this: XMLHttpRequest, ...args: unknown[]) => void;
  scope.XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, method: string, url: string | URL, ...rest: unknown[]) {
    this.withCredentials = false;
    open.call(this, method, rewrite(String(url)), ...rest);
  };
}
