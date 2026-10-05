/**
 * Loopback-only resident GPU server, started as an attached session job:
 * `pnpm exec ttsx -P scripts/human-viewer/tsconfig.json scripts/human-viewer/server.mts`.
 * Vite transforms working-tree source; one real Chromium page serializes
 * capture requests. `HUMAN_VIEWER_PORT` selects the port (default 5175) and
 * the per-port process record, so viewers of several sessions can coexist.
 * Numerical disk payloads and PID ownership live under the ignored .shots
 * tree. The host never edits documents or anatomical source. Last-good PNGs
 * retain their source identity; HTTP failures include a cause.
 * This file owns process state and its order: source watching, the page and
 * its failure observers, and the request routing. Each step it orders lives
 * in its own module: the page launch, the console protocol, health, heap,
 * warming, captures (`createHumanViewerCapture`, `serveHumanViewerCapture`)
 * and the data routes (`serveHumanViewerData`).
 */
import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "playwright";

import { createHumanViewerSource } from "./createHumanViewerSource.mjs";
import { createHumanViewerViteServer } from "./createHumanViewerViteServer.mjs";
import type { HumanViewerWork } from "./HumanViewerWork";
import type { IHumanViewerWindow } from "./IHumanViewerWindow";
import type { IHumanViewerEdit } from "./IHumanViewerEdit";
import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage";
import type { IHumanViewerPageState } from "./IHumanViewerPageState";
import type { IHumanViewerWarming } from "./IHumanViewerWarming";
import { assembleHumanViewerHealth } from "./assembleHumanViewerHealth";
import { createHumanViewerAdmission } from "./createHumanViewerAdmission";
import { createHumanViewerCapture } from "./createHumanViewerCapture";
import { createHumanViewerCaptureLifetime } from "./createHumanViewerCaptureLifetime";
import { createHumanViewerHeapGauge } from "./createHumanViewerHeapGauge";
import { createHumanViewerQueue } from "./createHumanViewerQueue";
import { createHumanViewerStartupPhase } from "./createHumanViewerStartupPhase";
import { createHumanViewerThumbnailStore } from "./createHumanViewerThumbnailStore";
import { createHumanViewerWarmReadiness } from "./createHumanViewerWarmReadiness";
import { createNodeHumanViewerThumbnailDisk } from "./createNodeHumanViewerThumbnailDisk";
import { humanViewerInstance } from "./humanViewerInstance";
import { humanViewerThumbnailFile } from "./humanViewerThumbnailFile";
import { judgeViewerRenderer } from "./judgeViewerRenderer";
import { launchHumanViewerPage } from "./launchHumanViewerPage";
import { observeHumanViewerRendererTarget } from "./observeHumanViewerRendererTarget";
import { readHumanViewerCompilationStatus } from "./readHumanViewerCompilationStatus";
import { readHumanViewerWork } from "./readHumanViewerWork";
import { routeHumanViewerConsole } from "./routeHumanViewerConsole";
import { serveHumanViewerCapture } from "./serveHumanViewerCapture.mjs";
import { serveHumanViewerData } from "./serveHumanViewerData.mjs";
import { serveHumanViewerHeap } from "./serveHumanViewerHeap";
import { settleHumanViewerInputs } from "./settleHumanViewerInputs";
import { subscribeHumanViewerSources } from "./subscribeHumanViewerSources";
import { waitForHumanViewerGeneration } from "./waitForHumanViewerGeneration";
import { warmHumanViewerRevision } from "./warmHumanViewerRevision";
import { writeHumanViewerRecord } from "./writeHumanViewerRecord";

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
/** Publish the catalogue once every read and admission it starts has finished. */
const settleInputs = () => settleHumanViewerInputs(() => (inventory = catalogue()),
  [source.sidecars, source.views, admission]);
let page: Page;
let renderer = "";
let errors: string[] = [];
let readyRevision = "";
/** Why the page failed for good, or null while it can still draw. */
let pageFailure: string | null = null;
let sourceUpdating = false;
let work: HumanViewerWork | null = null;
/** Heap readings of the resident page; the readers are bound once the page exists. */
let readHeap: () => Promise<IHumanViewerHeapUsage> = () => Promise.reject(new Error("No page yet"));
let readLiveHeap: () => Promise<IHumanViewerHeapUsage> = () => Promise.reject(new Error("No page yet"));
const heap = createHumanViewerHeapGauge(() => readHeap());
const lifetime = createHumanViewerCaptureLifetime();
// Edits arrive in bursts, so a revision warms only after sixty quiet seconds.
const warmReadiness = createHumanViewerWarmReadiness((revision) => {
  void warmHumanViewerRevision({ revision, inventory: () => inventory,
    readyRevision: () => readyRevision, thumbnailFile, capture: capturer.capture, queue, warming });
}, { stableMs: 60000 });
/** Requests allowed to wait behind the running one before a new one is refused. */
const QUEUE_LIMIT = 12;
const queue = createHumanViewerQueue({
  limit: QUEUE_LIMIT,
  patience: 3,
  now: () => performance.now(),
  // Background warming starts only when no modeler has asked for a minute.
  quietMs: 60000,
});
const { startup, phase } = createHumanViewerStartupPhase("starting the development server");
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
      return json(assembleHumanViewerHealth({ port: instance.port, inventory: () => inventory,
        renderer: () => renderer, readyRevision: () => readyRevision, sourceStatus,
        errors: () => errors, sourceUpdating: () => sourceUpdating, work: () => work, heap,
        revisions, queue, queueLimit: QUEUE_LIMIT, lastEdit: () => lastEdit,
        capture: capturer, warming, startup }));
    if (url.pathname === "/heap")
      return serveHumanViewerHeap({ response, json, readLiveHeap: () => readLiveHeap(),
        work: () => work, readyRevision: () => readyRevision });
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
  const vite = await createHumanViewerViteServer(middleware);
  await vite.listen();
  writeHumanViewerRecord(path.join(storage, instance.record), instance.port);

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
  const resident = await launchHumanViewerPage();
  const browser = resident.browser;
  page = resident.page;
  readHeap = resident.readHeap;
  readLiveHeap = resident.readLiveHeap;
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
  page.on("console", (message) => routeHumanViewerConsole(message.text(), {
    work: (text) => {
      work = readHumanViewerWork(text);
      if (work !== null) heap.sample(work);
    },
    error: (cause) => { errors = [cause]; },
    ready: (revision) => {
      errors = [];
      readyRevision = revision;
      warmReadiness.source(readyRevision);
      // A ready generation can admit the inputs still pending.
      inventory = catalogue();
    },
  }));
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
