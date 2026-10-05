/**
 * Loopback-only resident GPU server, started as an attached session job:
 * `pnpm exec ttsx -P scripts/human-viewer/tsconfig.json scripts/human-viewer/server.mts`.
 * Vite transforms working-tree source; one real Chromium page serializes
 * capture requests. `HUMAN_VIEWER_PORT` selects the port (default 5175) and
 * the per-port process record, so viewers of several sessions can coexist. Numerical disk payloads and PID ownership live under the
 * ignored .shots tree. The host never edits documents or anatomical source.
 * Last-good PNGs retain their source identity; HTTP failures include a cause.
 * This file owns process state and its order: source watching, the page and
 * its failure observers, health and warming. A capture and its telemetry
 * belong to `createHumanViewerCapture`, the GPU routes to
 * `serveHumanViewerCapture` and the data routes to `serveHumanViewerData`.
 */
import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type Page, chromium } from "playwright";
import { createServer } from "vite";

import viewerConfig from "./vite.config.mjs";

import { createHumanViewerSource } from "./createHumanViewerSource.mjs";
import type { IHumanViewerWindow } from "./IHumanViewerWindow";
import type { IHumanViewerEdit } from "./IHumanViewerEdit";
import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage";
import type { IHumanViewerPageState } from "./IHumanViewerPageState";
import type { IHumanViewerStartup } from "./IHumanViewerStartup";
import type { IHumanViewerWarming } from "./IHumanViewerWarming";
import { createHumanViewerAdmission } from "./createHumanViewerAdmission";
import { createHumanViewerCapture } from "./createHumanViewerCapture";
import { createHumanViewerCaptureLifetime } from "./createHumanViewerCaptureLifetime";
import { createHumanViewerHeapGauge } from "./createHumanViewerHeapGauge";
import { createHumanViewerQueue } from "./createHumanViewerQueue";
import { createHumanViewerThumbnailStore } from "./createHumanViewerThumbnailStore";
import { createHumanViewerWarmReadiness } from "./createHumanViewerWarmReadiness";
import { createNodeHumanViewerThumbnailDisk } from "./createNodeHumanViewerThumbnailDisk";
import { humanViewerInstance } from "./humanViewerInstance";
import { humanViewerThumbnailFile } from "./humanViewerThumbnailFile";
import { judgeViewerRenderer } from "./judgeViewerRenderer";
import { observeHumanViewerRendererTarget } from "./observeHumanViewerRendererTarget";
import { openHumanViewerHref } from "./openHumanViewerHref";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress";
import { publishedHumanViewerWarmDocuments } from "./publishedHumanViewerWarmDocuments";
import { readHumanViewerCompilationStatus } from "./readHumanViewerCompilationStatus";
import { readHumanViewerWork } from "./readHumanViewerWork";
import { serveHumanViewerCapture } from "./serveHumanViewerCapture.mjs";
import { serveHumanViewerData } from "./serveHumanViewerData.mjs";
import { subscribeHumanViewerSources } from "./subscribeHumanViewerSources";
import { waitForHumanViewerGeneration } from "./waitForHumanViewerGeneration";
import { warmHumanViewerDocuments } from "./warmHumanViewerDocuments";
import { writeHumanViewerThumbnail } from "./writeHumanViewerThumbnail";

const directory = path.dirname(fileURLToPath(import.meta.url));
/** Port, origin and per-process files, chosen by `HUMAN_VIEWER_PORT` (default 5175). */
const instance = humanViewerInstance(process.env.HUMAN_VIEWER_PORT);
const source = createHumanViewerSource(directory);
const { root, storage, basisFiles, inputsDirectory, revisions, catalogue } = source;
let inventory = catalogue();
// A candidate sidecar read off the request path finished: publish its documents.
source.sidecarsChanged(() => { inventory = catalogue(); });
// Input documents are admitted by their owners in the page, which carries the
// human runtime the server does not load; a verdict republishes the catalogue.
const admission = createHumanViewerAdmission({
  page: (): IHumanViewerPageState => pageFailure !== null
    ? { state: "failed", reason: pageFailure }
    : readyRevision === ""
      ? { state: "starting", reason: startup.phase }
      : { state: "ready", reason: null },
  // Through the capture lifetime, so a renderer failure refuses the request
  // instead of leaving the rescan waiting on a page that cannot answer.
  admit: (domain, text) => lifetime.run(() => page.evaluate((input) =>
    (window as unknown as IHumanViewerWindow).__humanViewer.admit(input.domain, input.text),
  { domain, text })),
  changed: () => { inventory = catalogue(); },
});
source.admitWith(admission.of);
/**
 * Read the catalogue until the sidecar reads and page admissions it starts
 * have all finished: each finished read can start an admission, so the loop
 * ends only when one reading starts nothing new.
 */
const settleInputs = async (): Promise<typeof inventory> => {
  for (;;) {
    inventory = catalogue();
    if (!source.sidecars.busy() && !source.views.busy() && !admission.busy()) return inventory;
    await Promise.all([source.sidecars.settled(), source.views.settled(), admission.settled()]);
  }
};
let page: Page;
let renderer = "";
let errors: string[] = [];
let readyRevision = "";
/** Why the page failed for good, or null while it can still draw. */
let pageFailure: string | null = null;
let sourceUpdating = false;
let work: ReturnType<typeof readHumanViewerWork> = null;
/** Heap readings of the resident page; the reader is bound once the page exists. */
let readHeap: () => Promise<IHumanViewerHeapUsage> = () => Promise.reject(new Error("No page yet"));
/** Collect the page's garbage, then read its heap: the live size, not live plus garbage. */
let readLiveHeap: () => Promise<IHumanViewerHeapUsage> = () => Promise.reject(new Error("No page yet"));
const heap = createHumanViewerHeapGauge(() => readHeap());
const lifetime = createHumanViewerCaptureLifetime();
// Edits arrive in bursts, so a revision warms only after sixty quiet seconds.
const warmReadiness = createHumanViewerWarmReadiness((revision) => { void warm(revision); },
  { stableMs: 60000 });
/** Requests allowed to wait behind the running one before a new one is refused. */
const QUEUE_LIMIT = 12;
const queue = createHumanViewerQueue({
  limit: QUEUE_LIMIT,
  patience: 3,
  now: () => performance.now(),
  // Background warming starts only when no modeler has asked for a minute.
  quietMs: 60000,
});
/** What the server is doing while it starts, logged at each change. */
const startup: IHumanViewerStartup = { phase: "starting the development server",
  since: new Date().toISOString() };
const phase = (name: string): void => {
  startup.phase = name;
  startup.since = new Date().toISOString();
  console.log(`STARTUP ${startup.since} ${name}`);
};
/** The last edit that reached a build. */
let lastEdit: IHumanViewerEdit | null = null;
const warming: IHumanViewerWarming = { revision: "", total: 0, done: 0, skipped: 0,
  failures: [], current: null };
/** What the compile process last reported, read from the file it writes. */
const sourceStatus = () => readHumanViewerCompilationStatus(() =>
  fs.readFileSync(path.join(storage, instance.sourceStatus), "utf8"));
const capturer = createHumanViewerCapture({ page: () => page, renderer: () => renderer,
  startup: () => startup.phase + " since " + startup.since +
    (errors.length === 0 ? "" : "; last error: " + errors[errors.length - 1]),
  readyRevision: () => readyRevision, inventory: () => inventory, lifetime });
/** Wait until the page has a ready generation again, at most thirty seconds. */
const settleGeneration = (): Promise<void> => waitForHumanViewerGeneration(
  () => readyRevision !== "" && !sourceUpdating,
  (ms) => new Promise<undefined>((resolve) => { setTimeout(resolve, ms); }));
const thumbnails = createHumanViewerThumbnailStore(createNodeHumanViewerThumbnailDisk(fs, path.join),
  path.join(storage, instance.thumbnails), path.join);
const pruneThumbnails = (): void => thumbnails.prune(inventory.revision);
const thumbnailFile = (search: string): string | null =>
  humanViewerThumbnailFile(search, path.join(storage, instance.thumbnails), inventory);
/**
 * Build every published document that has no numerical result on disk yet, at
 * the lowest priority, so the first person or script to ask for one finds it
 * built. Each document is its own queue entry: a request in a higher lane
 * starts as soon as the one running finishes. A new source revision ends the
 * pass, which the page reload restarts.
 */
async function warm(revision: string): Promise<void> {
  const thumbnail = (id: string): string =>
    openHumanViewerHref(id).thumbnail.slice("/render?".length);
  await warmHumanViewerDocuments({
    revision,
    documents: publishedHumanViewerWarmDocuments(inventory.documents),
    currentRevision: () => readyRevision,
    cached: (id) => {
      const file = thumbnailFile(thumbnail(id));
      return file === null || fs.existsSync(file);
    },
    capture: async (id) => {
      const search = thumbnail(id);
      const png = await capturer.capture(parseHumanViewerAddress(search));
      const file = thumbnailFile(search);
      if (file !== null) await writeHumanViewerThumbnail(file, png);
    },
    queue: (id, run) => queue.run("warm " + id, run, "bulk"),
    status: warming,
  });
}
async function main(): Promise<void> {
  fs.mkdirSync(path.join(storage, "cache"), { recursive: true });
  const middleware = (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ): void => {
    const url = new URL(request.url ?? "/", instance.origin);
    const json = (value: unknown): void => {
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(value));
    };
    if (url.pathname === "/health")
      return json({
        service: "automovie-human-viewer",
        pid: process.pid,
        port: instance.port,
        revision: inventory.revision,
        renderer,
        // A ready server can draw. It may be drawing the last good build
        // while the newest source fails: `serving` and `sourceError` say so.
        ready: readyRevision !== "" && renderer !== "",
        serving: {
          revision: readyRevision,
          current: inventory.revision,
          stale: readyRevision !== inventory.revision,
          goodAt: sourceStatus().goodAt,
        },
        sourceError: sourceStatus().error ?? errors[errors.length - 1] ?? null,
        compilation: sourceStatus(),
        errors,
        sourceUpdating,
        work,
        heap: heap.status(),
        revisions: revisions.current(),
        queue: { limit: QUEUE_LIMIT, ...queue.status() },
        lastEdit,
        ...capturer.status(),
        warm: warming,
        startup,
        uptimeMs: Math.round(process.uptime() * 1000),
      });
    // A heap reading after a full collection, outside the GPU queue: the
    // sampled readings in /health include garbage not yet collected.
    if (url.pathname === "/heap") {
      void readLiveHeap().then((live) => json({ live, residents: work?.residents ?? null,
        residentBytes: work?.residentBytes ?? null, revision: readyRevision }))
        .catch((error: unknown) => {
          response.statusCode = 503;
          json({ error: "Heap reading unavailable: " + (error instanceof Error ? error.message : String(error)) });
        });
      return;
    }
    if (serveHumanViewerData({ url, request, response, root, storage,
      basisFiles, generationFiles: source.generationFiles, inputsDirectory, inventory, json, settleInputs,
      publish: (nextInventory) => { inventory = nextInventory; },
    })) return;
    if (serveHumanViewerCapture({ url, request, response, json, root, queue,
      inventory: () => inventory, readyRevision: () => readyRevision, renderer: () => renderer,
      page: () => page, lifetime, capture: capturer, settle: settleGeneration, thumbnails,
      thumbnailFile })) return;
    if (url.pathname === "/view") request.url = "/view.html" + url.search;
    next();
  };
  // The configuration is passed as a value, not as a config file: Vite
  // restarts a server whose config file or any module it imports changes,
  // and a restart replaces the file watcher this host subscribed to, so every
  // later source edit would be silently lost while health still read current.
  // Server-side viewer code takes effect when the server is started again.
  const vite = await createServer({
    ...viewerConfig,
    configFile: false,
    plugins: [
      ...(viewerConfig.plugins ?? []),
      {
        name: "human-viewer-http",
        configureServer: (server) => {
          server.middlewares.use(middleware);
        },
      },
    ],
  });
  await vite.listen();
  // The record names this process from the moment it owns the port, so
  // status and stop can verify ownership of a server that is still starting.
  fs.writeFileSync(
    path.join(storage, instance.record),
    JSON.stringify({
      pid: process.pid,
      startedAt: new Date().toISOString(),
      port: instance.port,
    }),
  );

  // Sources are watched from the start: an edit made while the page loads
  // reaches it, and its progress is reported, instead of being missed until
  // the first generation is ready.
  fs.mkdirSync(inputsDirectory, { recursive: true });
  const stopSources = subscribeHumanViewerSources({
    source,
    add: (files) => vite.watcher.add(files),
    watch: (changed) => { vite.watcher.on("all", changed); },
    inputs: () => { inventory = catalogue(); },
    updating: (value) => { sourceUpdating = value; },
    publish: (files, moved) => {
      lastEdit = { files: files.map((file) => path.relative(root, file)),
        at: new Date().toISOString(), moved };
      capturer.edited(Date.now());
      inventory = catalogue();
      pruneThumbnails();
    },
    browser: () => vite.ws.send({ type: "custom", event: "human:revision",
      data: { revision: inventory.revision } }),
    error: (error) => errors.push(error instanceof Error ? error.message : String(error)),
  });
  phase("launching the browser");
  const browser = await chromium.launch({
    channel: "chromium",
    headless: true,
    args: ["--use-gl=angle", "--ignore-gpu-blocklist"],
  });
  page = await browser.newPage({
    viewport: { width: 1160, height: 930 },
    deviceScaleFactor: 1,
  });
  // A session of its own, so heap readings never wait behind capture calls.
  const heapSession = await page.context().newCDPSession(page);
  readHeap = () => heapSession.send("Runtime.getHeapUsage");
  readLiveHeap = async () => {
    await heapSession.send("HeapProfiler.collectGarbage");
    return heapSession.send("Runtime.getHeapUsage");
  };
  const stopRenderer = await observeHumanViewerRendererTarget({ browser, page,
    failed: (cause, physicalSettled) => {
    errors = [cause];
    readyRevision = "";
    pageFailure = cause;
    // The failure is permanent for this server; it is logged so server.log
    // records why every later capture and admission is refused.
    console.error(`PAGE FAILED ${new Date().toISOString()} ${cause}` +
      (physicalSettled ? "" : " (renderer may still be running)"));
    lifetime.fail(new Error(cause), physicalSettled);
    // Inputs awaiting admission are now refused by name; publish that.
    inventory = catalogue();
  } });
  page.on("pageerror", (error) => {
    errors.push(error.message);
    console.error(error.message);
  });
  page.on("console", (message) => {
    if (message.text().startsWith("HUMAN_WORK ")) {
      work = readHumanViewerWork(message.text().slice(11));
      if (work !== null) heap.sample(work);
      return;
    }
    if (message.text().startsWith("HUMAN_ERROR ")) {
      errors = [message.text().slice(12)];
      return;
    }
    if (message.text().startsWith("HUMAN_READY ")) {
      errors = [];
      readyRevision = message.text().slice(12);
      warmReadiness.source(readyRevision);
      // A ready generation can admit the inputs still pending.
      inventory = catalogue();
    }
  });
  phase("loading the page");
  await page.goto(instance.origin + "/view?resident=1#ao=off", {
    timeout: 600000,
    waitUntil: "domcontentloaded",
  });
  // The first generation needs the whole human package compiled and the
  // standard document drawn; while source edits keep invalidating compiles
  // it cannot finish, and a failed candidate waits for the next edit. Both
  // states are reported (phase, compiles in server.log, errors in /health),
  // so the wait is observable rather than bounded by an arbitrary deadline.
  phase("waiting for the first source generation");
  await page.waitForFunction(
    () =>
      Boolean((window as unknown as Partial<IHumanViewerWindow>).__humanViewer),
    undefined,
    { timeout: 0 },
  );
  renderer = await page.evaluate(() =>
    (
      window as unknown as IHumanViewerWindow
    ).__humanViewer.renderer(),
  );
  console.log("RENDERER", renderer);
  phase("ready");
  if (!judgeViewerRenderer(renderer).real)
    throw new Error("Software renderer refused");
  pruneThumbnails();
  warmReadiness.hardware();
  const close = async (): Promise<void> => {
    stopSources();
    await browser.close();
    await stopRenderer();
    await vite.close();
    fs.rmSync(path.join(storage, instance.record), { force: true });
    process.exit(0);
  };
  process.once("SIGINT", () => void close());
  process.once("SIGTERM", () => void close());
  console.log("human-viewer ready " + instance.origin + "/view", process.pid);
}
void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
