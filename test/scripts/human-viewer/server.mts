/**
 * Loopback-only resident GPU server, started as an attached session job:
 * `pnpm exec ttsx -P scripts/human-viewer/tsconfig.json scripts/human-viewer/server.mts`.
 * Vite transforms working-tree source; one real Chromium page serializes
 * capture requests. `HUMAN_VIEWER_PORT` selects the port (default 5175) and
 * the per-port process record, so viewers of several sessions can coexist.
 * Numerical disk payloads and PID ownership use the resolved mutable storage.
 * Local photographs remain read-only at their existing location. Last-good PNGs
 * retain their source identity; HTTP failures include a cause.
 * `HUMAN_VIEWER_AUTO_WARM=off` disables automatic thumbnail warming only;
 * unset, empty or `on` retains it. Explicit document requests still perform
 * their normal admission, numerical build and hardware capture checks.
 * This composition root binds source authority, document admission, capture
 * queue and warming. The catalogue controller owns publication and selected
 * settlement; residency owns browser state and recovery; middleware owns
 * routing, and the server lifetime owns watching, listening and shutdown.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { IHumanViewerAdmissionWindow } from "./IHumanViewerAdmissionWindow";
import type { IHumanViewerEdit } from "./IHumanViewerEdit";
import type { IHumanViewerPageState } from "./IHumanViewerPageState";
import type { IHumanViewerWarming } from "./IHumanViewerWarming";
import type { IHumanViewerWindow } from "./IHumanViewerWindow";
import { assembleHumanViewerHealth } from "./assembleHumanViewerHealth";
import { createHumanViewerCapture } from "./createHumanViewerCapture";
import { createHumanViewerCaptureLifetime } from "./createHumanViewerCaptureLifetime";
import { createHumanViewerCatalogueController } from "./createHumanViewerCatalogueController";
import { createHumanViewerGenerationWindows } from "./createHumanViewerGenerationWindows";
import { createHumanViewerHeapGauge } from "./createHumanViewerHeapGauge";
import { createHumanViewerMiddleware } from "./createHumanViewerMiddleware.mjs";
import { createHumanViewerQueue } from "./createHumanViewerQueue";
import { createHumanViewerResidency } from "./createHumanViewerResidency";
import { createHumanViewerResidentTrim } from "./createHumanViewerResidentTrim";
import { createHumanViewerSource } from "./createHumanViewerSource.mjs";
import { createHumanViewerStageWatch } from "./createHumanViewerStageWatch";
import { createHumanViewerStartupPhase } from "./createHumanViewerStartupPhase";
import { createHumanViewerThumbnailStore } from "./createHumanViewerThumbnailStore";
import { createHumanViewerWarmReadiness } from "./createHumanViewerWarmReadiness";
import { createNodeHumanViewerThumbnailDisk } from "./createNodeHumanViewerThumbnailDisk";
import { humanViewerInstance } from "./humanViewerInstance";
import { humanViewerLaunch } from "./humanViewerLaunch";
import { humanViewerProtocol } from "./humanViewerProtocol";
import { humanViewerThumbnailFile } from "./humanViewerThumbnailFile";
import { readHumanViewerCompilationStatus } from "./readHumanViewerCompilationStatus";
import { startHumanViewerServer } from "./startHumanViewerServer.mjs";
import { humanViewerCompileGate } from "./vite.config.mjs";
import { waitForHumanViewerGeneration } from "./waitForHumanViewerGeneration";
import { warmHumanViewerRevision } from "./warmHumanViewerRevision";

const directory = path.dirname(fileURLToPath(import.meta.url));
/** The launcher that owns this server's port and record, or null when it was started directly. */
const owner =
  process.env[humanViewerLaunch.ownerVariable] === undefined
    ? null
    : Number(process.env[humanViewerLaunch.ownerVariable]);
/** Port, origin and per-process files, chosen by `HUMAN_VIEWER_PORT` (default 5175). */
const instance = humanViewerInstance(process.env.HUMAN_VIEWER_PORT);
const automaticWarmSetting = process.env.HUMAN_VIEWER_AUTO_WARM;
if (
  automaticWarmSetting !== undefined &&
  automaticWarmSetting !== "" &&
  automaticWarmSetting !== "on" &&
  automaticWarmSetting !== "off"
)
  throw new Error("HUMAN_VIEWER_AUTO_WARM must be on or off when set.");
const automaticWarm = automaticWarmSetting !== "off";
console.log("human-viewer automatic warm: " + (automaticWarm ? "on" : "off"));
const source = createHumanViewerSource(directory);
const { root, storage, basisFiles, inputsDirectory, revisions, catalogue } =
  source;
let inventory = catalogue();
const controller = createHumanViewerCatalogueController({
  source,
  publish: (next) => {
    inventory = next;
  },
  page: (): IHumanViewerPageState =>
    residency.pageFailure !== null
      ? { state: "failed", reason: residency.pageFailure }
      : residency.readyRevision === ""
        ? { state: "starting", reason: residency.pageWait ?? startup.phase }
        : { state: "ready", reason: null },
  // Through the capture lifetime, so a renderer failure refuses the request
  // instead of leaving the rescan waiting on a page that cannot answer. A
  // verdict counts only from a frame whose code is the current revision: a
  // frame on a held or older compile judges with other code than the key names.
  admit: async (domain, text, basis) => {
    const reply = await lifetime.run(() =>
      residency.page.evaluate(
        (input) => {
          const bridge = (window as unknown as IHumanViewerAdmissionWindow)
            .__humanViewerAdmission;
          if (bridge !== undefined && bridge.protocol !== input.protocol)
            throw new Error(
              "The host page runs an incompatible viewer protocol; its backend must be started from the same source",
            );
          return bridge === undefined
            ? { available: false, reason: null, token: null }
            : bridge.admit(input.domain, input.text, input.basis);
        },
        { domain, text, basis, protocol: humanViewerProtocol },
      ),
    );
    if (!reply.available) return reply;
    // Only a closed window has a label; a frame still loading cannot vouch
    // for its code yet, so the document waits until that window closes.
    return windows.current(reply.token)
      ? reply
      : { available: false, reason: null, token: null };
  },
});
const {
  admission,
  retry: retryAdmissions,
  settleInputs,
  readDocument,
  settleDocument,
} = controller;
let sourceUpdating = false;
const heap = createHumanViewerHeapGauge(() => residency.readHeap());
const lifetime = createHumanViewerCaptureLifetime();
// Edits arrive in bursts, so a revision warms only after sixty quiet seconds.
const warmReadiness = createHumanViewerWarmReadiness(
  (revision) => {
    if (automaticWarm)
      void warmHumanViewerRevision({
        revision,
        inventory: () => inventory,
        readyRevision: () => residency.readyRevision,
        thumbnailFile,
        capture: capturer.capture,
        queue,
        warming,
      });
  },
  { stableMs: 60000 },
);
/** Requests allowed to wait behind the running one before a new one is refused. */
const QUEUE_LIMIT = 12;
const queue = createHumanViewerQueue({
  limit: QUEUE_LIMIT,
  patience: 3,
  now: () => performance.now(),
  // Background warming starts only when no modeler has asked for a minute.
  quietMs: 60000,
});
const { startup, phase } = createHumanViewerStartupPhase(
  "starting the development server",
);
const residency = createHumanViewerResidency({
  origin: instance.origin,
  inventory: () => inventory,
  publish: () => {
    inventory = catalogue();
  },
  lifetime,
  phase,
  progress: () => stages.progress(),
  sample: (work) => heap.sample(work),
  sourceReady: (revision) => warmReadiness.source(revision),
  retryAdmissions,
});
/** The last edit that reached a build. */
let lastEdit: IHumanViewerEdit | null = null;
const warming: IHumanViewerWarming = {
  revision: "",
  total: 0,
  done: 0,
  skipped: 0,
  failures: [],
  current: null,
  lastFailure: null,
};
/**
 * Capture stages bounded by their progress. A page stage that stalls means the
 * page stopped: it is replaced like a page whose renderer exited.
 */
const stages = createHumanViewerStageWatch((stage) => {
  console.error(
    `CAPTURE STALLED ${new Date().toISOString()} ${stage.doc} in ${stage.name} since ${stage.progress}`,
  );
  if (stage.name === "page")
    residency.stalled(
      `the page made no progress capturing ${stage.doc} since ${stage.progress}`,
    );
});
/** What the compile process last reported, read from the file it writes. */
const sourceStatus = () =>
  readHumanViewerCompilationStatus(() =>
    fs.readFileSync(path.join(storage, instance.sourceStatus), "utf8"),
  );
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
  page: (collect) => (collect ? residency.readLiveHeap() : residency.readHeap()),
  workers: (collect) => residency.readWorkerHeaps(collect),
  evict: () =>
    residency.page.evaluate(() =>
      (window as unknown as IHumanViewerWindow).__humanViewer.evict(),
    ),
  mark: heap.mark,
  windowPeak: heap.windowPeak,
  // Measured: a person build and draw took the page from 296 MB to 1560 MB
  // (upper-arm, pid 13952, 08:34Z). Faces and bodies start at zero and learn
  // their room from their first capture, which runs while the heap is small.
  seeds: { face: 0, body: 0, person: 1.26e9 },
});
const capturer = createHumanViewerCapture({
  page: () => residency.page,
  renderer: () => residency.renderer,
  startup: () =>
    (residency.pageWait ?? startup.phase + " since " + startup.since) +
    (residency.errors.length === 0
      ? ""
      : "; last error: " + residency.errors[residency.errors.length - 1]),
  readyRevision: () => residency.readyRevision,
  pageRevision: () => residency.pageRevision,
  inventory: () => inventory,
  lifetime,
  trim: residentTrim.trim,
  makeRoom: residentTrim.before,
  learnRoom: residentTrim.learn,
  stages,
});
/** Candidate loading windows: they hold compile withdrawal and label each candidate's code. */
const windows = createHumanViewerGenerationWindows({
  gate: humanViewerCompileGate,
  revision: () => inventory.revision,
  updating: () => sourceUpdating,
  closed: () => retryAdmissions("a candidate window closed"),
});
/**
 * Wait, at most thirty seconds, until the source settles: a generation of the
 * current revision is ready, or the current revision's candidate failed and
 * the last good generation is what can draw.
 */
const settleGeneration = (): Promise<void> =>
  waitForHumanViewerGeneration(
    () =>
      residency.readyRevision !== "" &&
      !sourceUpdating &&
      (residency.readyRevision === inventory.revision ||
        residency.errors.length !== 0),
    (ms) =>
      new Promise<undefined>((resolve) => {
        setTimeout(resolve, ms);
      }),
  );
const thumbnails = createHumanViewerThumbnailStore(
  createNodeHumanViewerThumbnailDisk(fs, path.join),
  path.join(storage, instance.thumbnails),
  path.join,
);
const pruneThumbnails = (): void => thumbnails.prune(inventory.revision);
const thumbnailFile = (search: string): string | null =>
  humanViewerThumbnailFile(
    search,
    path.join(storage, instance.thumbnails),
    inventory,
  );

async function main(): Promise<void> {
  fs.mkdirSync(path.join(storage, "cache"), { recursive: true });
  const middleware = createHumanViewerMiddleware({
    origin: instance.origin,
    health: () =>
      assembleHumanViewerHealth({
        port: instance.port,
        storage,
        inventory: () => inventory,
        renderer: () => residency.renderer,
        readyRevision: () => residency.readyRevision,
        sourceStatus,
        errors: () => residency.errors,
        sourceUpdating: () => sourceUpdating,
        work: () => residency.work,
        heap,
        owner,
        revisions,
        queue,
        queueLimit: QUEUE_LIMIT,
        lastEdit: () => lastEdit,
        capture: capturer,
        warming,
        startup,
        admission: admission.status,
        relaunches: () => residency.relaunches,
        trim: residentTrim.status,
        holding: windows.holding,
        stage: stages.current,
      }),
    generation: { windows },
    heap: {
      readLiveHeap: () => residency.readLiveHeap(),
      readWorkerHeaps: () => residency.readWorkerHeaps(true),
      work: () => residency.work,
      readyRevision: () => residency.readyRevision,
    },
    data: () => ({
      root,
      storage,
      referenceDirectory: source.referenceDirectory,
      basisFiles,
      generationFiles: source.generationFiles,
      inputsDirectory,
      inventory,
      settleInputs,
      readDocument,
      settleDocument,
      currentCode: windows.current,
      publish: (nextInventory) => {
        inventory = nextInventory;
      },
    }),
    capture: {
      root,
      queue,
      inventory: () => inventory,
      readyRevision: () => residency.readyRevision,
      renderer: () => residency.renderer,
      page: () => residency.page,
      lifetime,
      capture: capturer,
      settle: settleGeneration,
      settleDocument,
      thumbnails,
      thumbnailFile,
    },
  });
  await startHumanViewerServer({
    source,
    instance,
    owner,
    middleware,
    watching: {
      inputs: () => {
        inventory = catalogue();
      },
      updating: (value) => {
        sourceUpdating = value;
      },
      publish: (files, moved) => {
        lastEdit = {
          files: files.map((file) => path.relative(root, file)),
          at: new Date().toISOString(),
          moved,
        };
        capturer.edited(Date.now());
        inventory = catalogue();
        pruneThumbnails();
      },
      error: residency.error,
      reached: () => windows.edited(),
    },
    inventory: () => inventory,
    openPage: residency.open,
    firstReady: residency.firstReady,
    renderer: () => residency.renderer,
    phase,
    ready: () => {
      pruneThumbnails();
      warmReadiness.hardware();
    },
    closeRenderer: residency.close,
  });
}
void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
