/**
 * Optional Env-Driven Hardened CORS Proxy Worker (Cloudflare Workers / Deno Deploy).
 * Zero hardcoded domains — configure APP_NAME, APP_URL, and ALLOWED_ORIGINS in Worker env.
 *
 * Security hardening (fixes F-005):
 * - Validates http/https target URLs only
 * - Blocks private, loopback, link-local, metadata, and IPv6 ULA/loopback targets
 * - Manually inspects redirects (max 5 hops) against SSRF rules
 * - Enforces optional ALLOWED_ORIGINS allowlist
 * - Strips Set-Cookie and forces Content-Security-Policy: sandbox + nosniff
 */

export interface ProxyEnv {
  APP_NAME?: string;
  APP_URL?: string;
  /** Comma-separated allowed Origin headers, e.g. "https://app.example.com,http://localhost:8080" */
  ALLOWED_ORIGINS?: string;
}

const PRIVATE_IPV4_PATTERNS = [
  /^0\./,
  /^10\./,
  /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.0\.0\./,
  /^192\.168\./,
  /^198\.1[89]\./,
  /^22[4-9]\./,
  /^23\d\./,
  /^24\d\./,
  /^25[0-5]\./,
];

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal" ||
    host === "::1" ||
    host === "::" ||
    host.startsWith("fe80:") ||
    host.startsWith("fc") ||
    host.startsWith("fd") ||
    host.startsWith("::ffff:")
  ) {
    return true;
  }
  return PRIVATE_IPV4_PATTERNS.some((rx) => rx.test(host));
}

function parseSafeTargetUrl(raw: string): URL | null {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (parsed.username || parsed.password) return null;
    if (isBlockedHostname(parsed.hostname)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function resolveAllowedOrigin(request: Request, env?: ProxyEnv): string | null {
  const allowedRaw = env?.ALLOWED_ORIGINS?.trim();
  const origin = request.headers.get("origin");
  if (!allowedRaw) return origin || "*";
  const allowed = allowedRaw.split(",").map((s) => s.trim()).filter(Boolean);
  if (origin && allowed.includes(origin)) return origin;
  return null;
}

export default {
  async fetch(request: Request, env?: ProxyEnv): Promise<Response> {
    const reqUrl = new URL(request.url);
    const allowedOrigin = resolveAllowedOrigin(request, env);
    if (!allowedOrigin) {
      return new Response("Origin not allowed", { status: 403 });
    }

    const corsHeaders: Record<string, string> = {
      "access-control-allow-origin": allowedOrigin,
      "access-control-allow-methods": "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": "*",
      "access-control-max-age": "86400",
      ...(allowedOrigin !== "*" ? { vary: "Origin" } : {}),
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const targetParam = reqUrl.searchParams.get("url");
    if (!targetParam) {
      return new Response("Missing `url` query parameter", { status: 400, headers: corsHeaders });
    }

    let currentUrl = parseSafeTargetUrl(targetParam);
    if (!currentUrl) {
      return new Response("Invalid or disallowed target URL", { status: 400, headers: corsHeaders });
    }

    const appName = env?.APP_NAME || "AI Studio";
    const appUrl = env?.APP_URL || "";
    const headers = new Headers(request.headers);
    headers.set("user-agent", appUrl ? `${appName} Proxy <${appUrl}>` : `${appName} Proxy`);
    headers.delete("origin");
    headers.delete("host");
    headers.delete("cookie");
    headers.delete("cf-connecting-ip");
    headers.delete("x-forwarded-for");

    try {
      let upstream: Response | undefined;
      for (let hop = 0; hop < 5; hop++) {
        upstream = await fetch(currentUrl.toString(), {
          method: hop === 0 ? request.method : "GET",
          headers,
          body: hop === 0 && !["GET", "HEAD"].includes(request.method) ? request.body : undefined,
          redirect: "manual",
        });

        if (upstream.status >= 300 && upstream.status < 400) {
          const location = upstream.headers.get("location");
          if (!location) break;
          const next = parseSafeTargetUrl(new URL(location, currentUrl).toString());
          if (!next) {
            return new Response("Blocked redirect to disallowed URL", { status: 403, headers: corsHeaders });
          }
          currentUrl = next;
          continue;
        }
        break;
      }

      if (!upstream) {
        return new Response("Upstream request failed", { status: 502, headers: corsHeaders });
      }

      const outHeaders = new Headers(upstream.headers);
      outHeaders.delete("set-cookie");
      outHeaders.set("content-security-policy", "sandbox");
      outHeaders.set("x-content-type-options", "nosniff");
      for (const [k, v] of Object.entries(corsHeaders)) {
        outHeaders.set(k, v);
      }

      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: outHeaders,
      });
    } catch {
      return new Response("Bad gateway: failed to reach target", { status: 502, headers: corsHeaders });
    }
  },
};
