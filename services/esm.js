/**
 * Optional Env-Driven ESM CDN Cache Worker (Cloudflare Workers).
 * Fixes F-022: only caches 2xx responses as immutable; never caches 4xx/5xx errors.
 */
export interface EsmEnv {
  APP_URL?: string;
}

export default {
  async fetch(request: Request, env?: EsmEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      if (env?.APP_URL) {
        return Response.redirect(env.APP_URL, 302);
      }
      return new Response("ESM Cache Worker", { status: 200 });
    }

    url.hostname = "esm.sh";
    url.protocol = "https:";

    try {
      const response = await fetch(url.toString(), {
        cf: { cacheEverything: true },
      } as RequestInit);

      const headers = new Headers(response.headers);
      if (response.ok) {
        headers.set("Cache-Control", "public, max-age=86400, immutable");
      } else {
        headers.set("Cache-Control", "no-store");
      }
      headers.set("Access-Control-Allow-Origin", "*");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch {
      return new Response("Upstream ESM error", {
        status: 502,
        headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
      });
    }
  },
};
