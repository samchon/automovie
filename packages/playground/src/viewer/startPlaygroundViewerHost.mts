import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer, loadConfigFromFile } from "vite";

import { createHumanViewerSourceEvents } from "@automovie/viewer/human/inspection/createHumanViewerSourceEvents";
import { serveHumanViewerDisplay } from "@automovie/viewer/human/inspection/serveHumanViewerDisplay";
import { humanViewerStorage } from "@automovie/viewer/human/inspection/humanViewerStorage";
import { ProcessOwnership } from "@automovie/viewer/process/ProcessOwnership";
import { createPlaygroundViewerSource } from "./createPlaygroundViewerSource.js";
import { servePlaygroundViewerPages } from "./servePlaygroundViewerPages.js";

/**
 * Start an independent loopback Playground host whose lifetime is immutable.
 * A config or source edit publishes a candidate notification and cannot reload
 * the visible application, replace its camera or restart this owned process.
 * The retained host and application bridge decide replacement after real
 * restoration and a completed hardware frame. No timer ends this host.
 *
 * PLAYGROUND_VIEWER_PORT selects an unused explicit port; storage defaults to
 * that port's own .shots runtime directory. The existing publisher owns PNG
 * ordering and atomic replacement. Only this origin can publish its displays.
 * Process metadata records OS creation identity and the startup disk receipt;
 * it never adopts or stops an already running process on another port.
 *
 * The normal Node project consumes workspace package source under the checkout
 * rootDir and owns its emitted files under Playground's ignored lib directory.
 * Startup therefore checks and transforms the regular project without writing
 * JavaScript beside another package's maintained source or bypassing plugins.
 *
 * @evidence contracts/common.md#principled-implementation Composes Vite's public configuration and server APIs with the original source, page and display owners; source changes publish candidate notifications while browser restoration and actual hardware completion remain separate admission responsibilities.
 * @evidence contracts/common.md#clear-and-simple-design One loopback host wires the source receipt, event stream and retained-page router; its original configuration and watcher lifetime remain fixed, with event-loop batching only grouping real source edits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Strict port binding refuses occupied ports without adopting their processes, HMR is disabled to preserve the retained display, and no elapsed deadline restarts the host or expires publication ownership.
 * @evidence contracts/common.md#meaningful-documentation Defines port and storage ownership, OS creation metadata and startup receipt scope; transformed responses, installed SDK identity and actual browser output require their own acceptance rather than a listening-server claim.
 */
export async function startPlaygroundViewerHost(): Promise<void> {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
  const directory = path.join(root, "packages/playground");
  // Vite's public config loader supplies its documented bundled-file globals.
  // Passing the resulting value, rather than its path, to createServer keeps
  // later config edits from restarting this owned host and watcher lifetime.
  const loaded = await loadConfigFromFile(
    { command: "serve", mode: "development" },
    path.join(directory, "vite.config.ts"),
    directory,
  );
  if (loaded === null) throw new Error("The Playground Vite configuration was not found.");
  const playgroundConfig = loaded.config;
  const port = Number(process.env.PLAYGROUND_VIEWER_PORT ?? "5173");
  if (!Number.isSafeInteger(port) || port < 1024 || port > 65535)
    throw new Error("PLAYGROUND_VIEWER_PORT must name a loopback port from 1024 through 65535.");
  const origin = `http://127.0.0.1:${port}`;
  const storage = humanViewerStorage(root, process.env.PLAYGROUND_VIEWER_STORAGE_ROOT || `.shots/playground-viewer/${port}`);
  const output = humanViewerStorage(root, ".shots/output");
  const outputRelative = path.relative(output, storage);
  if (outputRelative === "" || (!path.isAbsolute(outputRelative) && outputRelative !== ".." && !outputRelative.startsWith(".." + path.sep)))
    throw new Error("Playground viewer metadata and cache must remain outside .shots/output.");
  const source = createPlaygroundViewerSource(root);
  const started = source.current();
  if (started.error !== undefined) throw new Error(started.error);
  const events = createHumanViewerSourceEvents(
    () => source.current().revision,
    () => source.current().error,
  );
  const pages = servePlaygroundViewerPages({ directory, source: source.current });
  const display = serveHumanViewerDisplay({ root, storage, port, origin, revision: () => source.current().revision });
  const server = await createServer({
    ...playgroundConfig,
    root: directory,
    configFile: false,
    cacheDir: path.join(storage, "vite-cache"),
    server: { ...playgroundConfig.server, host: "127.0.0.1", port, strictPort: true, hmr: false, ws: false },
    plugins: [...(playgroundConfig.plugins ?? []), {
      name: "playground-retained-viewer-host",
      configureServer(vite) {
        vite.middlewares.use((request, response, next) => {
          response.setHeader("Cache-Control", "no-store");
          const pathname = new URL(request.url ?? "/", origin).pathname;
          if (pathname === "/viewer/source" || pathname === "/viewer/source/receipt") {
            response.setHeader("Content-Type", "application/json");
            response.end(JSON.stringify(pathname.endsWith("/receipt")
              ? { ...source.current(), hostStartedRevision: started.revision }
              : { revision: source.current().revision, error: source.current().error }));
          } else if (pathname === "/viewer/source-events") events.subscribe(response);
          else if (pathname === "/display") display(request, response);
          else if (!pages(request, response)) next();
        });
      },
    }],
  });
  server.watcher.add(source.watched);
  let refreshPending = false;
  server.watcher.on("all", (_event, file) => {
    const resolved = path.resolve(file);
    const applicationHtml = path.dirname(resolved) === directory && resolved.endsWith(".html");
    if (!applicationHtml && !source.watched.some((input) => resolved === input || resolved.startsWith(input + path.sep))) return;
    if (refreshPending) return;
    refreshPending = true;
    // One event-loop batch groups edits without a quiet-period deadline.
    setImmediate(() => {
      refreshPending = false;
      if (source.refresh()) events.publish();
    });
  });
  server.httpServer?.once("close", () => events.close());
  await server.listen();
  source.refresh();
  await fs.mkdir(storage, { recursive: true });
  await fs.writeFile(path.join(storage, "host.json"), JSON.stringify({
    pid: process.pid, processStartedAt: ProcessOwnership.read(process.pid),
    origin, storage, startedAt: new Date().toISOString(),
    startedRevision: started.revision, startedInputs: started.inputs,
    authority: "Declared application source, emitted modules and data; transformed responses and full installed SDK require separate acceptance receipts.",
  }, null, 2));
  console.log(`Playground retained viewer host: ${origin}`);
}
