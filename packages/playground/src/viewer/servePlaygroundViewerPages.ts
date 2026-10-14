import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";

/**
 * Serve an existing top-level HTML entry as the retained host, or as its explicitly selected application child. GET paths are one basename under the supplied Playground directory; child token/generation/revision must name the current readable receipt. HTML bypasses Vite's reload injection while module requests retain normal Vite transforms. Capture-only requests receive the original entry without the hosted bridge.
 *
 * A child receives source metadata and an inline native error boundary before modules load, so dependency/runtime failures can reach the same-origin parent even if no module evaluates. Matching a source receipt permits loading only; application restoration and actual hardware-completed-frame admission belong to the page bridge/host. Source revision comes from the canonical hex-digest owner, not arbitrary untrusted markup.
 *
 * @evidence contracts/common.md#principled-implementation Basename-only HTML selection confines reads to the supplied directory, current source/token/positive-safe generation checks refuse stale children and pre-module native errors preserve actual failure authority before bridge installation.
 * @evidence contracts/common.md#clear-and-simple-design One middleware supplies the retained host or original application HTML and injects the existing page bridge; it creates no alternate editor/evaluator and leaves module transformation to Vite.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source matching is not model/render health, capture requests are an explicit existing mode and failed file reads report 500 rather than substituting fixture HTML. Trusted canonical revision text is a caller premise, not generic HTML escaping.
 * @evidence contracts/common.md#meaningful-documentation The comment defines GET/path admission, child/capture distinctions, pre-module failure routing and separate restoration/hardware authority.
 * @evidence contracts/performance.md#efficient-algorithms Dispatch uses fixed path/query checks and reads/replaces O(h) HTML characters, plus the supplied source reader's documented IO/lock-refresh cost. Vite module transformation and later app construction/rendering remain actual consumer costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every request receives current receipt admission and original entry bytes; this middleware retains no stale HTML or transformed-module cache and Vite owns its own module reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned handler retains directory/source callbacks only. Local HTML strings expire after response handoff; file size, request concurrency and Node response buffers have no local cap. Injected browser listeners belong to the child document until its disposal, and server/socket lifetime remains host-owned.
 *
 * @author Samchon
 */
export function servePlaygroundViewerPages(props: {
  /** The normal Playground directory containing its committed HTML entries. */
  directory: string;

  /** Current disk source; a failed receipt must refuse new application children. */
  source: () => {
    /** The current declared disk-input revision required by every application child. */
    revision: string;

    /** An unresolved source failure that refuses new children; omission leaves revision admission available. */
    error?: string;
  };
}): (request: IncomingMessage, response: ServerResponse) => boolean {
  return (request: IncomingMessage, response: ServerResponse): boolean => {
    if (request.method !== "GET") return false;
    const url: URL = new URL(request.url ?? "/", "http://127.0.0.1");
    const pathname: string =
      url.pathname === "/" ? "/index.html" : url.pathname;
    if (!/^\/[A-Za-z0-9_-]+\.html$/.test(pathname)) return false;
    const file: string = path.join(props.directory, pathname.slice(1));
    if (!fs.existsSync(file)) return false;
    const source: ReturnType<typeof props.source> = props.source();
    const token: string | null = url.searchParams.get("__viewer_page");
    const child: boolean = token !== null;
    const generation: number = Number(
      url.searchParams.get("__viewer_generation"),
    );
    if (
      token !== null &&
      (!/^[0-9a-f-]{36}$/.test(token) ||
        !Number.isSafeInteger(generation) ||
        generation < 1 ||
        url.searchParams.get("__viewer_revision") !== source.revision ||
        source.error !== undefined)
    ) {
      response.statusCode = 409;
      response.end(
        "The Playground candidate does not name a current readable source receipt.",
      );
      return true;
    }
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    const meta: string = `<meta name="automovie-viewer-source" content="${source.revision}">`;
    try {
      const html: string =
        child || url.searchParams.get("cap") === "1"
          ? fs.readFileSync(file, "utf8")
          : '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>automovie viewer</title></head><body><div id="app"></div><script type="module" src="/src/viewer/host.ts"></script></body></html>';
      const bootstrap: string = child
        ? `<script>
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
</script>`
        : "";
      const bridge: string = child
        ? '<script type="module" src="/src/viewer/page.ts"></script>'
        : "";
      response.end(
        html.replace(
          /<head(?:\s[^>]*)?>/i,
          (head: string): string => head + meta + bootstrap + bridge,
        ),
      );
    } catch (cause) {
      response.statusCode = 500;
      response.end("The Playground entry could not be read: " + String(cause));
    }
    return true;
  };
}
