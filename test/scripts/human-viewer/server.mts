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
import type { IHumanViewerAdmissionWindow } from "./IHumanViewerAdmissionWindow";
import type { IHumanViewerWindow } from "./IHumanViewerWindow";
import type { IHumanViewerEdit } from "./IHumanViewerEdit";
import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage";
import type { IHumanViewerPageState } from "./IHumanViewerPageState";
import type { IHumanViewerResidentPage } from "./IHumanViewerResidentPage";
import type { IHumanViewerWarming } from "./IHumanViewerWarming";
import { assembleHumanViewerHealth } from "./assembleHumanViewerHealth";
import { createHumanViewerAdmission } from "./createHumanViewerAdmission";
import { createHumanViewerCapture } from "./createHumanViewerCapture";
import { createHumanViewerCatalogueRepublish } from "./createHumanViewerCatalogueRepublish";
import { createHumanViewerCaptureLifetime } from "./createHumanViewerCaptureLifetime";
import { createHumanViewerHeapGauge } from "./createHumanViewerHeapGauge";
import { createHumanViewerGenerationWindows } from "./createHumanViewerGenerationWindows";
import { createHumanViewerQueue } from "./createHumanViewerQueue";
import { createHumanViewerResidentTrim } from "./createHumanViewerResidentTrim";
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
import { readHumanViewerWorkerHeaps } from "./readHumanViewerWorkerHeaps";
import { routeHumanViewerConsole } from "./routeHumanViewerConsole";
import { serveHumanViewerCapture } from "./serveHumanViewerCapture.mjs";
import { serveHumanViewerData } from "./serveHumanViewerData.mjs";
import { serveHumanViewerGeneration } from "./serveHumanViewerGeneration";
import { humanViewerCompileGate } from "./vite.config.mjs";
import { serveHumanViewerHeap } from "./serveHumanViewerHeap";
import { settleHumanViewerInputs } from "./settleHumanViewerInputs";
import { subscribeHumanViewerSources } from "./subscribeHumanViewerSources";
import { waitForHumanViewerGeneration } from "./waitForHumanViewerGeneration";
import { warmHumanViewerRevision } from "./warmHumanViewerRevision";
import { watchHumanViewerMainFrame } from "./watchHumanViewerMainFrame";
import { writeHumanViewerRecord } from "./writeHumanViewerRecord";
import { humanViewerLaunch } from "./humanViewerLaunch";

const directory = path.dirname(fileURLToPath(import.meta.url));
/** The launcher that owns this server's port and record, or null when it was started directly. */
const owner = process.env[humanViewerLaunch.ownerVariable] === undefined ? null : Number(process.env[humanViewerLaunch.ownerVariable]);
/** Port, origin and per-process files, chosen by `HUMAN_VIEWER_PORT` (default 5175). */
const instance = humanViewerInstance(process.env.HUMAN_VIEWER_PORT);
const source = createHumanViewerSource(directory);
const { root, storage, basisFiles, inputsDirectory, revisions, catalogue } = source;
let inventory = catalogue();
// A candidate sidecar read off the request path finished: publish its documents.
/** Republish the catalogue once per burst of requests (admission verdicts arrive by the hundred). */
const republish = createHumanViewerCatalogueRepublish(() => { inventory = catalogue(); });
source.sidecarsChanged(republish);
// Input documents are admitted by their owners in the page, which carries the
// human runtime the server does not load; a verdict republishes the catalogue.
const admission = createHumanViewerAdmission({
  page: (): IHumanViewerPageState => pageFailure !== null
    ? { state: "failed", reason: pageFailure }
    : readyRevision === ""
      ? { state: "starting", reason: pageWait ?? startup.phase }
      : { state: "ready", reason: null },
  // Through the capture lifetime, so a renderer failure refuses the request
  // instead of leaving the rescan waiting on a page that cannot answer. A
  // verdict counts only from a frame whose code is the current revision: a
  // frame on a held or older compile judges with other code than the key names.
  admit: async (domain, text) => {
    const reply = await lifetime.run(() => page.evaluate((input) => {
      const bridge = (window as unknown as IHumanViewerAdmissionWindow).__humanViewerAdmission;
      return bridge === undefined ? { available: false, reason: null, token: null } : bridge.admit(input.domain, input.text);
    }, { domain, text }));
    if (!reply.available) return reply;
    // Only a closed window has a label; a frame still loading cannot vouch
    // for its code yet, so the document waits until that window closes.
    return windows.current(reply.token) ? reply : { available: false, reason: null, token: null };
  },
  changed: republish,
});
source.admitWith(admission.of);
/** Ask the waiting admissions again on a trigger event, logging how many waited. */
const retryAdmissions = (trigger: string): void => {
  const released = admission.retry();
  if (released !== 0) console.log(`ADMISSION RETRY ${new Date().toISOString()} ${released} waiting; ${trigger}`);
  republish();
};
/**
 * Ask waiting admissions again, then publish the catalogue once every read and
 * admission it starts has finished. Only an explicit settle request calls it.
 */
const settleInputs = () => {
  admission.retry();
  return settleHumanViewerInputs(() => (inventory = catalogue()), [source.sidecars, source.views, admission]);
};
let page: Page;
let renderer = "";
let errors: string[] = [];
/**
 * The revision the ready generation's code is: its window's proven label, or
 * `unproven <page revision>` when the code could not be proven to be any
 * revision, which never equals a current revision, so its frames are stale.
 */
let readyRevision = "";
/** The catalogue revision the ready page reports, for the capture identity check. */
let pageRevision = "";
/** Why the page failed for good, or null while it can still draw. */
let pageFailure: string | null = null;
/** What a reloaded page waits for, or null when it never reloaded since its last generation. */
let pageWait: string | null = null;
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
/**
 * The renderer's JS heap limit, page and worker isolates together. They share
 * one 4 GiB pointer cage; the page died at 1766 MB page plus 1840–1881 MB
 * worker (about 3.6 GB). Measured on pid 35436: the worker holds 440 MB with
 * the face runtime, 810 MB with face and body, about 1.5–1.6 GB with all three
 * domains; a person build adds about 140 MB to it and a person resident
 * 25–27 MB to the page. 2.8 GB keeps 0.8 GB below the observed failure for a
 * build's transient copies, and still leaves the page about 1.2 GB (some
 * forty-five people) beside a fully loaded worker.
 */
const RENDERER_HEAP_LIMIT = 2.8e9;
const residentTrim = createHumanViewerResidentTrim({
  limit: RENDERER_HEAP_LIMIT,
  // 300 MB below the limit, about twelve people: a trim then pays for its
  // collection once instead of on every following capture.
  target: RENDERER_HEAP_LIMIT - 3e8,
  page: (collect) => collect ? readLiveHeap() : readHeap(),
  workers: (collect) => resident === null ? Promise.resolve([]) : readHumanViewerWorkerHeaps(resident.browser, collect),
  evict: () => page.evaluate(() => (window as unknown as IHumanViewerWindow).__humanViewer.evict()),
  mark: heap.mark,
  windowPeak: heap.windowPeak,
  // Measured: a person build and draw took the page from 296 MB to 1560 MB
  // (upper-arm, pid 13952, 08:34Z). Faces and bodies start at zero and learn
  // their room from their first capture, which runs while the heap is small.
  seeds: { face: 0, body: 0, person: 1.26e9 },
});
const capturer = createHumanViewerCapture({ page: () => page, renderer: () => renderer,
  startup: () => (pageWait ?? startup.phase + " since " + startup.since) +
    (errors.length === 0 ? "" : "; last error: " + errors[errors.length - 1]),
  readyRevision: () => readyRevision, pageRevision: () => pageRevision, inventory: () => inventory, lifetime,
  trim: residentTrim.trim, makeRoom: residentTrim.before, learnRoom: residentTrim.learn });
/** Candidate loading windows: they hold compile withdrawal and label each candidate's code. */
const windows = createHumanViewerGenerationWindows({ gate: humanViewerCompileGate,
  revision: () => inventory.revision, updating: () => sourceUpdating,
  closed: () => retryAdmissions("a candidate window closed") });
/**
 * Wait, at most thirty seconds, until the source settles: a generation of the
 * current revision is ready, or the current revision's candidate failed and
 * the last good generation is what can draw.
 */
const settleGeneration = (): Promise<void> => waitForHumanViewerGeneration(
  () => readyRevision !== "" && !sourceUpdating &&
    (readyRevision === inventory.revision || errors.length !== 0),
  (ms) => new Promise<undefined>((resolve) => { setTimeout(resolve, ms); }));
const thumbnails = createHumanViewerThumbnailStore(createNodeHumanViewerThumbnailDisk(fs, path.join),
  path.join(storage, instance.thumbnails), path.join);
const pruneThumbnails = (): void => thumbnails.prune(inventory.revision);
const thumbnailFile = (search: string): string | null =>
  humanViewerThumbnailFile(search, path.join(storage, instance.thumbnails), inventory);
/** The open page, its browser and heap readers; null before the first one opens. */
let resident: IHumanViewerResidentPage | null = null;
/** Detach the current page's renderer observer. */
let stopRenderer = async (): Promise<void> => {};
/** Pages opened again after their renderer exited, for /health. */
let relaunches = 0;
/** The failed page being replaced, so repeated reports of one exit recover once. */
let recovering: IHumanViewerResidentPage | null = null;

/** Resolves once the first page of this server is ready, whichever opening made it so. */
let announceFirstReady: () => void = () => {};
const firstReady = new Promise<undefined>((resolve) => { announceFirstReady = () => resolve(undefined); });

/**
 * Open the resident page and wait for its first source generation. A fresh
 * browser is launched when asked or when the current one is gone; otherwise
 * the connected browser is reused. The first opening reports startup phases;
 * a replacement reports through `pageWait`. Every page gets the same
 * observers, so a replacement fails, reloads and reports exactly as the first
 * one did. A page that fails while it waits is left to the recovery that
 * replaces it: its opening returns without error, since it is no longer the
 * page the server serves.
 */
async function openResidentPage(first: boolean, freshBrowser: boolean): Promise<void> {
  if (freshBrowser) await resident?.browser.close().catch(() => undefined);
  const opened = await launchHumanViewerPage(freshBrowser ? undefined : resident?.browser);
  resident = opened;
  page = opened.page;
  readHeap = opened.readHeap;
  readLiveHeap = opened.readLiveHeap;
  stopRenderer = await observeHumanViewerRendererTarget({ browser: opened.browser, page: opened.page,
    failed: (cause, physicalSettled) => recoverResidentPage(opened, cause, physicalSettled) });
  // A Vite full reload replaces the host page and its committed generation:
  // until a new generation is ready nothing can draw, which captures and
  // admissions report instead of waiting on a page that lost its handle.
  watchHumanViewerMainFrame(opened.page, () => {
    if (readyRevision === "") return;
    readyRevision = "";
    // The reloaded page's candidates opened their holds over requests the
    // reload ended; the windows close with them, never proven.
    pageWait = `the page reloaded at ${new Date().toISOString()}; waiting for a source generation`;
    console.log("PAGE RELOADED " + pageWait);
    inventory = catalogue();
  });
  opened.page.on("pageerror", (error) => {
    errors.push(error.message);
    console.error(error.message);
  });
  opened.page.on("console", (message) => routeHumanViewerConsole(message.text(), {
    work: (text) => {
      work = readHumanViewerWork(text);
      if (work !== null) heap.sample(work);
    },
    error: (cause) => { errors = [cause]; },
    ready: (line) => {
      const [revision, label] = line.split(" ");
      errors = [];
      pageRevision = revision;
      readyRevision = label === undefined || label === "-" ? "unproven " + revision : label;
      pageWait = null;
      console.log(`GENERATION READY ${new Date().toISOString()} ${readyRevision.slice(0, 21)}` +
        (readyRevision === inventory.revision ? " (current)" : " (stale)"));
      // Only code proven to be the current revision warms thumbnails.
      if (readyRevision === inventory.revision) warmReadiness.source(readyRevision);
      // A ready generation can admit the inputs still pending.
      retryAdmissions("generation " + revision.slice(0, 12) + " ready");
    },
    admission: () => retryAdmissions("a viewer frame loaded"),
    restart: (reason) => console.log(`CANDIDATE RESTART ${new Date().toISOString()} ${reason}`),
    firstAddress: (reason) => console.log(`CANDIDATE FIRST ADDRESS ${new Date().toISOString()} ${reason}`),
  }));
  if (first) phase("loading the page");
  await opened.page.goto(instance.origin + "/view?resident=1#ao=off", {
    timeout: 600000,
    waitUntil: "domcontentloaded",
  });
  // The first generation needs the whole human package compiled and the
  // standard document drawn; while source edits keep invalidating compiles
  // it cannot finish, and a failed candidate waits for the next edit. Both
  // states are reported (phase, compiles in server.log, errors in /health),
  // so the wait is observable rather than bounded by an arbitrary deadline.
  if (first) phase("waiting for the first source generation");
  try {
    await opened.page.waitForFunction(
      () =>
        Boolean((window as unknown as Partial<IHumanViewerWindow>).__humanViewer),
      undefined,
      { timeout: 0 },
    );
    renderer = await opened.page.evaluate(() =>
      (
        window as unknown as IHumanViewerWindow
      ).__humanViewer.renderer(),
    );
  } catch (error) {
    // Replaced while it waited: the recovery that replaced it owns readiness.
    if (resident !== opened || recovering === opened) return;
    throw error;
  }
  console.log("RENDERER", renderer);
  announceFirstReady();
}

/**
 * The page's renderer exited (a V8 out-of-memory error, a GPU process loss or
 * a kill) or its whole browser went away. Captures and admissions are refused
 * as starting while the page is replaced in this process: the failed page is
 * closed, which releases every capture it held, the capture lifetime is
 * renewed and a new page opens on the same browser, or, when that browser
 * cannot open one, in a newly launched browser. Only a replacement that
 * cannot open even in a new browser makes the failure permanent, with that
 * cause. A report about a page already replaced is ignored.
 */
function recoverResidentPage(failed: IHumanViewerResidentPage, cause: string, physicalSettled: boolean): void {
  // One exit raises several reports (crash, detach, destroy): the first one
  // recovers, the rest are ignored.
  if (failed !== resident || recovering === failed) return;
  recovering = failed;
  errors = [cause];
  readyRevision = "";
  pageWait = `the renderer exited at ${new Date().toISOString()} (${cause}); the page is being opened again`;
  console.error(`PAGE FAILED ${new Date().toISOString()} ${cause}` +
    (physicalSettled ? "" : " (renderer may still be running)") + "; opening the page again");
  lifetime.fail(new Error(cause), physicalSettled);
  inventory = catalogue();
  const stopFailed = stopRenderer;
  void (async () => {
    // The dead page's observer and page are cleaned up beside the recovery,
    // never before it: detaching from a crashed target was seen to never
    // settle, which left the server refusing every capture for good.
    void Promise.allSettled([stopFailed(), failed.page.close()]);
    // The dead renderer cannot finish any capture: release them all.
    lifetime.fail(new Error(cause), true);
    lifetime.renew();
    ++relaunches;
    try {
      await openResidentPage(false, false);
    } catch (error) {
      // The browser itself is gone or going (a killed browser process closes
      // every page before it reports the disconnect): launch a new one.
      console.error(`BROWSER RELAUNCH ${new Date().toISOString()} the page could not open on the old browser: ` +
        (error instanceof Error ? error.message : String(error)));
      await openResidentPage(false, true);
    }
    console.log(`PAGE RELAUNCHED ${new Date().toISOString()} (${relaunches} since start)`);
  })().catch((error: unknown) => {
    pageFailure = "the page could not be opened again after its renderer exited, even in a new browser: " +
      (error instanceof Error ? error.message : String(error));
    console.error(`PAGE FAILED ${new Date().toISOString()} ${pageFailure}`);
    inventory = catalogue();
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
      return json(assembleHumanViewerHealth({ port: instance.port, inventory: () => inventory,
        renderer: () => renderer, readyRevision: () => readyRevision, sourceStatus,
        errors: () => errors, sourceUpdating: () => sourceUpdating, work: () => work, heap, owner,
        revisions, queue, queueLimit: QUEUE_LIMIT, lastEdit: () => lastEdit,
        capture: capturer, warming, startup, admission: admission.status, relaunches: () => relaunches,
        trim: residentTrim.status, holding: windows.holding }));
    if (serveHumanViewerGeneration({ url, response, json, windows })) return;
    if (url.pathname === "/heap")
      return serveHumanViewerHeap({ response, json, readLiveHeap: () => readLiveHeap(),
        readWorkerHeaps: () => resident === null ? Promise.resolve([]) : readHumanViewerWorkerHeaps(resident.browser, true),
        work: () => work, readyRevision: () => readyRevision });
    if (serveHumanViewerData({ url, request, response, root, storage,
      basisFiles, generationFiles: source.generationFiles, inputsDirectory, inventory, json, settleInputs,
      currentCode: windows.current,
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
  // A launcher owns the public port and the record; this server listens on a
  // free internal port and announces it. Started directly, it owns both.
  if (owner === null) writeHumanViewerRecord(path.join(storage, instance.record), instance.port);
  else {
    const address = vite.httpServer?.address();
    if (address === null || address === undefined || typeof address === "string")
      throw new Error("The development server did not report its internal port");
    console.log(humanViewerLaunch.upstreamPrefix + address.port);
  }

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
    reached: () => windows.edited(),
  });
  phase("launching the browser");
  // A first page that fails while it starts is replaced by the recovery, which
  // then makes the server ready; only a failure nothing recovers is fatal.
  void openResidentPage(true, false).catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
  await firstReady;
  phase("ready");
  if (!judgeViewerRenderer(renderer).real)
    throw new Error("Software renderer refused");
  pruneThumbnails();
  warmReadiness.hardware();
  const close = async (): Promise<void> => {
    stopSources();
    await resident?.browser.close();
    await stopRenderer();
    await vite.close();
    if (owner === null) fs.rmSync(path.join(storage, instance.record), { force: true });
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
