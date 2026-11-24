/**
 * Optional Env-Driven Favicon Resolver Worker.
 * Fixes F-022: uses url.host (not url.origin) for 127.0.0.1 checks and removes hardcoded brand SVGs.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    const reqUrl = new URL(request.url);
    const target = reqUrl.searchParams.get("url");

    if (!target) {
      return new Response("Missing `url` query parameter", { status: 400 });
    }

    let url: URL;
    try {
      url = new URL(target);
    } catch {
      return new Response("Invalid `url` parameter", { status: 400 });
    }

    let hostname = url.hostname;

    if (url.host === "localhost:11434" || url.host === "127.0.0.1:11434") {
      hostname = "ollama.com";
    } else if (url.host === "localhost:45554" || url.host === "127.0.0.1:45554") {
      hostname = "claude.ai";
    } else if (url.host === "generativelanguage.googleapis.com") {
      hostname = "gemini.google.com";
    } else if (url.host === "z.ai") {
      hostname = "docs.z.ai";
    } else if (url.host === "backboard.railway.com") {
      hostname = "railway.com";
    }

    const upstream = await fetch(
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`,
    );

    const headers = new Headers(upstream.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", upstream.ok ? "public, max-age=86400" : "no-store");

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  },
};
