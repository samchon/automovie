import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";

/**
 * Serve a retained editor host or its explicitly requested application child.
 * HTML is delivered before Vite's HTML middleware, so no development reload
 * client owns a completed document or camera. Module requests still use the
 * normal Vite transform. A child keeps the original path and query, and must
 * name the current declared source receipt before its application can load.
 * The browser bridge owns restoration and completion admission after loading.
 * An owned inline boundary precedes module loading: a failed bridge dependency
 * reports its actual error to the retained parent even when no module evaluates.
 *
 * @evidence contracts/common.md#principled-implementation Routes only existing top-level HTML entries and admits a requested child only with a valid token, generation and current readable source revision; the browser bridge separately owns restoration and completed-frame admission.
 * @evidence contracts/common.md#clear-and-simple-design Keeps retained-host HTML and original child HTML in one pre-Vite routing boundary while normal module requests remain with Vite's transform middleware.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The capability query serves the original entry, and the owned pre-module error reporter preserves dependency failures without a reload client or fabricated readiness; neither path certifies model or GPU output.
 * @evidence contracts/common.md#meaningful-documentation Explains retained-parent ownership, explicit child revision admission and pre-module failure reporting; file-read failure returns an actual error while unmatched routes remain with the next middleware.
 */
export function servePlaygroundViewerPages(props: {
  /** The normal Playground directory containing its committed HTML entries. */
  directory: string;

  /** Current disk source; a failed receipt must refuse new application children. */
  source: () => {
    /** The current declared disk-input revision required by every application child. */
    revision: string;

    /** An unresolved source failure that refuses new children; omission leaves revision admission available. */
    error?: string
  };
}) {
  return (request: IncomingMessage, response: ServerResponse): boolean => {
    if (request.method !== "GET") return false;
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    if (!/^\/[A-Za-z0-9_-]+\.html$/.test(pathname)) return false;
    const file = path.join(props.directory, pathname.slice(1));
    if (!fs.existsSync(file)) return false;
    const source = props.source();
    const token = url.searchParams.get("__viewer_page");
    const child = token !== null;
    const generation = Number(url.searchParams.get("__viewer_generation"));
    if (child && (!/^[0-9a-f-]{36}$/.test(token) ||
        !Number.isSafeInteger(generation) || generation < 1 ||
        url.searchParams.get("__viewer_revision") !== source.revision || source.error !== undefined)) {
      response.statusCode = 409;
      response.end("The Playground candidate does not name a current readable source receipt.");
      return true;
    }
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    const meta = `<meta name="automovie-viewer-source" content="${source.revision}">`;
    try {
      const html = child || url.searchParams.get("cap") === "1" ? fs.readFileSync(file, "utf8") :
        '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>automovie viewer</title></head><body><div id="app"></div><script type="module" src="/src/viewer/host.ts"></script></body></html>';
      const bootstrap = child ? `<script>
(() => {
  const token = new URL(location.href).searchParams.get("__viewer_page");
  const revision = document.querySelector('meta[name="automovie-viewer-source"]')?.content;
  if (typeof token !== "string" || !/^[0-9a-f-]{36}$/.test(token) ||
      typeof revision !== "string" || !/^[0-9a-f]{64}$/.test(revision) || parent === window) return;
  const bootstrap = window.__playgroundViewerBootstrap = { failed: false };
  const report = (error) => {
    bootstrap.failed = true;
    parent.postMessage({ type: "automovie:error", token, revision, error }, location.origin);
  };
  window.addEventListener("error", (event) => {
    const resource = event.target instanceof HTMLScriptElement ? event.target.src :
      event.target instanceof HTMLLinkElement ? event.target.href : "";
    report(resource || (event instanceof ErrorEvent ? event.message : event.type));
  }, true);
  window.addEventListener("unhandledrejection", (event) => {
    report(event.reason instanceof Error ? event.reason.message : String(event.reason));
  });
})();
</script>` : "";
      const bridge = child ? '<script type="module" src="/src/viewer/page.ts"></script>' : "";
      response.end(html.replace(/<head(?:\s[^>]*)?>/i, (head) => head + meta + bootstrap + bridge));
    } catch (cause) {
      response.statusCode = 500;
      response.end("The Playground entry could not be read: " + String(cause));
    }
    return true;
  };
}
