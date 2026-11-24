import { join, normalize } from 'path-browserify';
import type { JSRuntimeFS } from '@/lib/JSRuntime';
import { isPathWithinRoot } from '@/lib/security';

/**
 * Builds a 100% static, self-contained HTML srcDoc from a project's `dist/` folder
 * so live previews work out-of-the-box with ZERO external wildcard preview host or backend.
 * Runs inside `<iframe sandbox="allow-scripts allow-forms allow-modals allow-popups">`
 * (opaque null origin — cannot access host app localStorage or IndexedDB).
 */
export async function buildStaticSrcDoc(
  fs: JSRuntimeFS,
  distDir: string,
): Promise<string> {
  const indexPath = join(distDir, 'index.html');
  const rawHtml = await fs.readFile(indexPath, 'utf8');
  if (typeof rawHtml !== 'string') {
    throw new Error('dist/index.html is not readable as UTF-8 text');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  const resolveDistAsset = (assetRef: string): string | null => {
    if (!assetRef || /^https?:\/\/|^data:|^blob:|^\/\//i.test(assetRef)) return null;
    const cleaned = assetRef.split(/[?#]/)[0].replace(/^\/+/, '');
    const full = normalize(join(distDir, cleaned));
    if (!isPathWithinRoot(full, distDir)) return null;
    return full;
  };

  // Inline local stylesheets from dist/
  const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]'));
  for (const link of links) {
    const href = link.getAttribute('href') || '';
    const assetPath = resolveDistAsset(href);
    if (!assetPath) continue;
    try {
      const css = await fs.readFile(assetPath, 'utf8');
      if (typeof css === 'string') {
        const styleEl = doc.createElement('style');
        styleEl.textContent = css;
        link.replaceWith(styleEl);
      }
    } catch {
      // Leave link as-is if missing
    }
  }

  // Inline local scripts from dist/
  const scripts = Array.from(doc.querySelectorAll('script[src]'));
  for (const script of scripts) {
    const scriptEl = script as HTMLScriptElement;
    const src = scriptEl.getAttribute('src') || '';
    const assetPath = resolveDistAsset(src);
    if (!assetPath) continue;
    try {
      const js = await fs.readFile(assetPath, 'utf8');
      if (typeof js === 'string') {
        const inlineScript = doc.createElement('script');
        if (scriptEl.type) inlineScript.type = scriptEl.type;
        // Escape </script> inside bundled JS to avoid prematurely closing the HTML tag
        inlineScript.textContent = js.replace(/<\/script>/gi, '<\\/script>');
        scriptEl.replaceWith(inlineScript);
      }
    } catch {
      // Leave external/missing script untouched
    }
  }

  // Inject lightweight console forwarding bridge into <head>
  const bridge = doc.createElement('script');
  bridge.textContent = `(function(){
    var send = function(level, args) {
      try {
        parent.postMessage({
          jsonrpc: '2.0',
          method: 'studio:console',
          params: { level: level, message: Array.prototype.map.call(args, function(a){
            try { return typeof a === 'string' ? a : JSON.stringify(a); } catch(_) { return String(a); }
          }).join(' ') }
        }, '*');
      } catch(_) {}
    };
    ['log','warn','error','info'].forEach(function(lvl){
      var orig = console[lvl];
      console[lvl] = function(){ send(lvl, arguments); return orig && orig.apply(console, arguments); };
    });
    window.addEventListener('error', function(e){ send('error', [e.message || 'Runtime error']); });
    window.addEventListener('unhandledrejection', function(e){ send('error', [String(e.reason || 'Unhandled rejection')]); });
  })();`;
  doc.head.prepend(bridge);

  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
}
