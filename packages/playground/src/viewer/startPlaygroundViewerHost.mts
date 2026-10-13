import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer, loadConfigFromFile, type ViteDevServer, type UserConfig } from "vite";

import type { IncomingMessage, ServerResponse } from "node:http";
import { createAutoMovieResourceRetirement } from "@automovie/viewer";

import { createHumanViewerSourceEvents } from "@automovie/viewer/human/inspection/createHumanViewerSourceEvents";
import { serveHumanViewerDisplay } from "@automovie/viewer/human/inspection/serveHumanViewerDisplay";
import { humanViewerStorage } from "@automovie/viewer/human/inspection/humanViewerStorage";
import { ProcessOwnership } from "@automovie/viewer/process/ProcessOwnership";
import { createPlaygroundViewerSource } from "./createPlaygroundViewerSource.js";
import { servePlaygroundViewerPages } from "./servePlaygroundViewerPages.js";

/**
 * Start one loopback Playground host with immutable config and browser-controlled source replacement. Later source/config edits publish candidates without Vite HMR or config-path restart. The retained host/page bridge own restoration and actual hardware completion; listening and writing metadata do not prove a displayed model is healthy. No elapsed-time rule ends the host.
 *
 * PLAYGROUND_VIEWER_PORT selects an unused port from 1024 through 65535, with a separate storage/cache outside .shots/output. The existing display publisher owns PNG ordering/publication. host.json records this socket owner's OS creation observation and startup receipt, not a liveness heartbeat; its diagnostic record is retained after shutdown. No other process/port is adopted or stopped.
 *
 * Startup failure, native server close and SIGINT/SIGTERM request one shared retirement: signal/watch bindings, deferred refresh, event streams and the returned Vite server are all attempted independently. A completed public close is not independent proof of physical allocation release. Compiler output placement belongs to the configured runtime and is checked separately, rather than inferred from successful listening.
 *
 * @evidence contracts/common.md#principled-implementation Strict loopback listening establishes this server's socket authority; actual source receipts, canonical publication guards and same-origin display/HTML handlers preserve input/source admission while the parent controls completed-page replacement.
 * @evidence contracts/common.md#clear-and-simple-design One Vite host reuses source, event-stream, page and display owners and one canonical shared retirement, without introducing another application renderer or shutdown framework.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source changes do not reload a completed editor, process metadata cannot substitute for hardware/model readiness and startup failure retains its primary cause alongside independent cleanup failures; no foreign process is terminated.
 * @evidence contracts/common.md#meaningful-documentation The comment states port/storage/config ownership, metadata limits, separate physical/render/compiler verification and supported shutdown paths.
 * @evidence contracts/performance.md#efficient-algorithms Startup retains actual config bundling, source membership/byte scans and Vite work. One event-loop batch groups relevant edits without a quiet deadline, each refresh keeps the source owner's full IO/hash cost and retirement traverses its fixed owner list once.
 * @evidence contracts/performance.md#reuse-equivalent-work One source witness and one Vite host serve the lifetime; repeated/reentrant shutdown shares one completion and source edits do not reconstruct the active browser application automatically.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One server, source receipt, event owner and at most one deferred immediate are retained. Startup failure/close/signals withdraw bindings and request every returned resource owner independently; input/socket/display populations keep their existing owners' uncapped/bounded policies. Before Vite returns a handle its internal construction remains Vite-owned, and diagnostic metadata/cache remain storage-owned after shutdown.
 *
 * @author Samchon
 */
export async function startPlaygroundViewerHost(): Promise<void> {
  const root: string = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
  const directory: string = path.join(root, "packages/playground");
  // Vite's public config loader supplies its documented bundled-file globals.
  // Passing the resulting value, rather than its path, to createServer keeps
  // later config edits from restarting this owned host and watcher lifetime.
  const loaded: Awaited<ReturnType<typeof loadConfigFromFile>> = await loadConfigFromFile(
    { command: "serve", mode: "development" },
    path.join(directory, "vite.config.ts"),
    directory,
  );
  if (loaded === null) throw new Error("The Playground Vite configuration was not found.");
  const playgroundConfig: UserConfig = loaded.config;
  const port: number = Number(process.env.PLAYGROUND_VIEWER_PORT ?? "5173");
  if (!Number.isSafeInteger(port) || port < 1024 || port > 65535)
    throw new Error("PLAYGROUND_VIEWER_PORT must name a loopback port from 1024 through 65535.");
  const origin: string = `http://127.0.0.1:${port}`;
  const storage: string = humanViewerStorage(root, process.env.PLAYGROUND_VIEWER_STORAGE_ROOT || `.shots/playground-viewer/${port}`);
  const output: string = humanViewerStorage(root, ".shots/output");
  const outputRelative: string = path.relative(output, storage);
  if (outputRelative === "" || (!path.isAbsolute(outputRelative) && outputRelative !== ".." && !outputRelative.startsWith(".." + path.sep)))
    throw new Error("Playground viewer metadata and cache must remain outside .shots/output.");
  const source: ReturnType<typeof createPlaygroundViewerSource> = createPlaygroundViewerSource(root);
  const started: ReturnType<typeof source.current> = source.current();
  if (started.error !== undefined) throw new Error(started.error);
  const events: ReturnType<typeof createHumanViewerSourceEvents> = createHumanViewerSourceEvents(
    (): string => source.current().revision,
    (): string | undefined => source.current().error,
  );
  const pages: ReturnType<typeof servePlaygroundViewerPages> = servePlaygroundViewerPages({ directory, source: source.current });
  const display: ReturnType<typeof serveHumanViewerDisplay> = serveHumanViewerDisplay({ root, storage, port, origin, revision: (): string => source.current().revision });
  let server: ViteDevServer | undefined;
  let stopping: boolean = false;
  let refreshPending: NodeJS.Immediate | undefined;
  const retire: () => Promise<void> = createAutoMovieResourceRetirement([
    (): void => { stopping = true; },
    (): void => { process.off("SIGINT", signal); },
    (): void => { process.off("SIGTERM", signal); },
    (): void => {
      if (refreshPending !== undefined) clearImmediate(refreshPending);
      refreshPending = undefined;
    },
    (): void => { server?.watcher.off("all", changed); },
    (): void => { server?.httpServer?.off("close", nativeClosed); },
    events.close,
    async (): Promise<void> => { if (server !== undefined) await server.close(); },
  ]);
  function signal(): void {
    stopping = true;
    void retire().catch((error: unknown): void => { console.error(error); process.exitCode = 1; });
  }
  function nativeClosed(): void {
    stopping = true;
    void retire().catch((error: unknown): void => { console.error(error); process.exitCode = 1; });
  }
  function changed(_event: string, file: string): void {
    if (stopping) return;
    const resolved: string = path.resolve(file);
    const applicationHtml: boolean = path.dirname(resolved) === directory && resolved.endsWith(".html");
    if (!applicationHtml && !source.watched.some((input: string): boolean => resolved === input || resolved.startsWith(input + path.sep))) return;
    if (refreshPending !== undefined) return;
    refreshPending = setImmediate((): void => {
      refreshPending = undefined;
      if (!stopping && source.refresh()) events.publish();
    });
  }
  try {
  server = await createServer({
    ...playgroundConfig,
    root: directory,
    configFile: false,
    cacheDir: path.join(storage, "vite-cache"),
    server: { ...playgroundConfig.server, host: "127.0.0.1", port, strictPort: true, hmr: false, ws: false },
    plugins: [...(playgroundConfig.plugins ?? []), {
      name: "playground-retained-viewer-host",
      configureServer(vite: ViteDevServer): void {
        vite.middlewares.use((request: IncomingMessage, response: ServerResponse, next: (error?: unknown) => void): void => {
          response.setHeader("Cache-Control", "no-store");
          const pathname: string = new URL(request.url ?? "/", origin).pathname;
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
  server.watcher.on("all", changed);
  server.httpServer?.once("close", nativeClosed);
  process.once("SIGINT", signal);
  process.once("SIGTERM", signal);
  await server.listen();
  if (stopping) throw new Error("Playground viewer startup was stopped.");
  const processStartedAt: ReturnType<typeof ProcessOwnership.read> = ProcessOwnership.read(process.pid);
  if (processStartedAt === null) throw new Error("The Playground socket owner has no OS creation identity.");
  source.refresh();
  await fs.mkdir(storage, { recursive: true });
  if (stopping) throw new Error("Playground viewer startup was stopped.");
  await fs.writeFile(path.join(storage, "host.json"), JSON.stringify({
    pid: process.pid, processStartedAt,
    origin, storage, startedAt: new Date().toISOString(),
    startedRevision: started.revision, startedInputs: started.inputs,
    authority: "Declared application source, emitted modules and data; transformed responses and full installed SDK require separate acceptance receipts.",
  }, null, 2));
  if (stopping) throw new Error("Playground viewer startup was stopped.");
  console.log(`Playground retained viewer host: ${origin}`);
  } catch (error) {
    return createAutoMovieResourceRetirement([retire], { error })();
  }
}
