import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import path from "node:path";

import react from "@vitejs/plugin-react-swc";
import { loadEnv, type Plugin } from "vite";
import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";

const require = createRequire(import.meta.url);
const pkg = require("./package.json") as { version: string };

/** Short commit SHA — prefer CI env var, fall back to git. */
function getCommitSha(): string {
  if (process.env.CI_COMMIT_SHORT_SHA) return process.env.CI_COMMIT_SHORT_SHA;
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

/** Git tag for the current commit — prefer CI env var, fall back to git. Empty string if untagged. */
function getCommitTag(): string {
  if (process.env.CI_COMMIT_TAG) return process.env.CI_COMMIT_TAG;
  try {
    return execSync("git describe --exact-match --tags HEAD 2>/dev/null", { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

/**
 * Injects env-driven white-label brand metadata into index.html and
 * dynamically serves/emits manifest.webmanifest with zero hardcoded domains.
 */
function brandMetadataPlugin(env: Record<string, string>): Plugin {
  const appName = env.VITE_APP_NAME || "AI Studio";
  const shortName = env.VITE_APP_SHORT_NAME || appName;
  const tagline = env.VITE_APP_TAGLINE || "Build, refine & ship software with autonomous AI.";
  const description =
    env.VITE_APP_DESCRIPTION ||
    `${appName} — ${tagline}`;
  const appUrl = (env.VITE_APP_URL || "").replace(/\/$/, "");
  const ogImage = appUrl ? `${appUrl}/og-image.png` : "/og-image.png";

  const manifestJson = JSON.stringify(
    {
      name: appName,
      short_name: shortName,
      description,
      start_url: "/",
      display: "standalone",
      background_color: "#09090b",
      theme_color: "#09090b",
      orientation: "any",
      icons: [
        { src: "/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icon-maskable-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
        { src: "/icon-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    null,
    2,
  );

  return {
    name: "brand-metadata-plugin",
    transformIndexHtml(html) {
      return html
        .replaceAll("%VITE_APP_NAME%", appName)
        .replaceAll("%VITE_APP_TAGLINE%", tagline)
        .replaceAll("%VITE_APP_DESCRIPTION%", description)
        .replaceAll("%VITE_APP_OG_IMAGE%", ogImage);
    },
    configureServer(server) {
      server.middlewares.use("/manifest.webmanifest", (_req, res) => {
        res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
        res.end(manifestJson);
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "manifest.webmanifest",
        source: manifestJson,
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "0.0.0.0",
      port: 8080,
      allowedHosts: true,
    },
    define: {
      "import.meta.env.VERSION": JSON.stringify(pkg.version),
      "import.meta.env.BUILD_DATE": JSON.stringify(new Date().toISOString()),
      "import.meta.env.COMMIT_SHA": JSON.stringify(getCommitSha()),
      "import.meta.env.COMMIT_TAG": JSON.stringify(getCommitTag()),
    },
    plugins: [
      brandMetadataPlugin(env),
      react(),
      VitePWA({
        includeAssets: [
          "brand-logo.svg",
          "icon-192x192.png",
          "icon-512x512.png",
          "icon-maskable-192x192.png",
          "icon-maskable-512x512.png",
          "sine.mp3",
          "CHANGELOG.md",
        ],
        manifest: false, // Emitted dynamically from env by brandMetadataPlugin
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,wasm,mp3}"],
          globIgnores: ["**/ort-wasm-*"],
          maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
          cleanupOutdatedCaches: true,
        },
        devOptions: {
          enabled: false,
          type: "module",
        },
      }),
    ],
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      onConsoleLog(log) {
        return !log.includes("React Router Future Flag Warning");
      },
      env: {
        DEBUG_PRINT_LIMIT: "0",
      },
      css: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "node:zlib": path.resolve(__dirname, "./src/lib/shell/zlib.ts"),
      },
    },
  };
});
