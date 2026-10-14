import { createAutoMovieResourceRetirement } from "@automovie/viewer";
import type { HumanViewerAddress } from "@automovie/viewer/human/inspection/HumanViewerAddress";
import type { HumanViewerLane } from "@automovie/viewer/human/inspection/HumanViewerLane";
import type { HumanViewerMiddleware } from "@automovie/viewer/human/inspection/HumanViewerMiddleware";
import type { HumanViewerWork } from "@automovie/viewer/human/inspection/HumanViewerWork";
import type { IHumanViewerAdmissionBridge } from "@automovie/viewer/human/inspection/IHumanViewerAdmissionBridge";
import type { IHumanViewerAdmissionReply } from "@automovie/viewer/human/inspection/IHumanViewerAdmissionReply";
import type { IHumanViewerAdmissionWindow } from "@automovie/viewer/human/inspection/IHumanViewerAdmissionWindow";
import type { IHumanViewerCaptureStage } from "@automovie/viewer/human/inspection/IHumanViewerCaptureStage";
import type { IHumanViewerCaptureStatus } from "@automovie/viewer/human/inspection/IHumanViewerCaptureStatus";
import type { IHumanViewerCatalogue } from "@automovie/viewer/human/inspection/IHumanViewerCatalogue";
import type { IHumanViewerEdit } from "@automovie/viewer/human/inspection/IHumanViewerEdit";
import type { IHumanViewerHealth } from "@automovie/viewer/human/inspection/IHumanViewerHealth";
import type { IHumanViewerHeap } from "@automovie/viewer/human/inspection/IHumanViewerHeap";
import type { IHumanViewerHeapUsage } from "@automovie/viewer/human/inspection/IHumanViewerHeapUsage";
import type { IHumanViewerInstance } from "@automovie/viewer/human/inspection/IHumanViewerInstance";
import type { IHumanViewerNumericalRequest } from "@automovie/viewer/human/inspection/IHumanViewerNumericalRequest";
import type { IHumanViewerPageState } from "@automovie/viewer/human/inspection/IHumanViewerPageState";
import type { IHumanViewerPersistenceCommand } from "@automovie/viewer/human/inspection/IHumanViewerPersistenceCommand";
import type { IHumanViewerPhases } from "@automovie/viewer/human/inspection/IHumanViewerPhases";
import type { IHumanViewerQueueStatus } from "@automovie/viewer/human/inspection/IHumanViewerQueueStatus";
import type { IHumanViewerResidentTrimReading } from "@automovie/viewer/human/inspection/IHumanViewerResidentTrimReading";
import type { IHumanViewerWarming } from "@automovie/viewer/human/inspection/IHumanViewerWarming";
import type { IHumanViewerWindow } from "@automovie/viewer/human/inspection/IHumanViewerWindow";
import type { IHumanViewerWorkerHeap } from "@automovie/viewer/human/inspection/IHumanViewerWorkerHeap";
import { assembleHumanViewerHealth } from "@automovie/viewer/human/inspection/assembleHumanViewerHealth";
import { createHumanViewerCapture } from "@automovie/viewer/human/inspection/createHumanViewerCapture";
import { createHumanViewerCaptureLifetime } from "@automovie/viewer/human/inspection/createHumanViewerCaptureLifetime";
import { createHumanViewerCatalogueController } from "@automovie/viewer/human/inspection/createHumanViewerCatalogueController";
import { createHumanViewerGenerationWindows } from "@automovie/viewer/human/inspection/createHumanViewerGenerationWindows";
import { createHumanViewerHeapGauge } from "@automovie/viewer/human/inspection/createHumanViewerHeapGauge";
import { createHumanViewerMiddleware } from "@automovie/viewer/human/inspection/createHumanViewerMiddleware";
import { createHumanViewerNodeService } from "@automovie/viewer/human/inspection/createHumanViewerNodeService";
import { createHumanViewerQueue } from "@automovie/viewer/human/inspection/createHumanViewerQueue";
import { createHumanViewerResidency } from "@automovie/viewer/human/inspection/createHumanViewerResidency";
import { createHumanViewerResidentTrim } from "@automovie/viewer/human/inspection/createHumanViewerResidentTrim";
import { createHumanViewerSource } from "@automovie/viewer/human/inspection/createHumanViewerSource";
import { createHumanViewerSourceEvents } from "@automovie/viewer/human/inspection/createHumanViewerSourceEvents";
import { createHumanViewerStageWatch } from "@automovie/viewer/human/inspection/createHumanViewerStageWatch";
import { createHumanViewerStartupPhase } from "@automovie/viewer/human/inspection/createHumanViewerStartupPhase";
import { createHumanViewerThumbnailStore } from "@automovie/viewer/human/inspection/createHumanViewerThumbnailStore";
import { createHumanViewerWarmReadiness } from "@automovie/viewer/human/inspection/createHumanViewerWarmReadiness";
import { createNodeHumanViewerThumbnailDisk } from "@automovie/viewer/human/inspection/createNodeHumanViewerThumbnailDisk";
import { humanViewerInstance } from "@automovie/viewer/human/inspection/humanViewerInstance";
import { humanViewerLaunch } from "@automovie/viewer/human/inspection/humanViewerLaunch";
import { humanViewerProtocol } from "@automovie/viewer/human/inspection/humanViewerProtocol";
import { humanViewerThumbnailFile } from "@automovie/viewer/human/inspection/humanViewerThumbnailFile";
import { readHumanViewerCompilationStatus } from "@automovie/viewer/human/inspection/readHumanViewerCompilationStatus";
import { serveHumanViewerDisplay } from "@automovie/viewer/human/inspection/serveHumanViewerDisplay";
import { serveHumanViewerPages } from "@automovie/viewer/human/inspection/serveHumanViewerPages";
import { startHumanViewerServer } from "@automovie/viewer/human/inspection/startHumanViewerServer";
import { waitForHumanViewerGeneration } from "@automovie/viewer/human/inspection/waitForHumanViewerGeneration";
import { warmHumanViewerRevision } from "@automovie/viewer/human/inspection/warmHumanViewerRevision";
import { ProcessOwnership } from "@automovie/viewer/process/ProcessOwnership";
/**
 * Loopback-only resident GPU server, started as an attached session job:
 * `pnpm exec ttsx -P src/human/inspection/tsconfig.json src/human/inspection/server.ts`.
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

import { createHumanViewerReferenceFaceDocument } from "../examples/createHumanViewerReferenceFaceDocument.js";
import { readHumanViewerStandardPeople } from "../examples/readHumanViewerStandardPeople.js";
import { readHumanViewerSubjectPeople } from "../examples/readHumanViewerSubjectPeople.js";
import { createHumanViewerViteServer } from "./createHumanViewerViteServer.js";
import { humanViewerCompileGate } from "./humanViewerCompileGate.js";

const applicationDirectory: string = path.dirname(
  fileURLToPath(import.meta.url),
);
// Live source inspection uses the declared workspace entry. A packaged runtime
// resolves its own compiled entry and is a different consumer contract; it must
// not be guessed into this checkout's source workers and source-only aliases.
const runtimeEntry: string = fileURLToPath(
  import.meta
    .resolve("@automovie/viewer/human/inspection/createHumanViewerSource"),
);
if (!runtimeEntry.endsWith(".ts"))
  throw new Error(
    "Live Human inspection requires the declared workspace source entry.",
  );
const directory: string = path.dirname(runtimeEntry);
/** The launcher that owns this server's port and record, or null when it was started directly. */
const owner: number | null =
  process.env[humanViewerLaunch.ownerVariable] === undefined
    ? null
    : Number(process.env[humanViewerLaunch.ownerVariable]);
/** Port, origin and per-process files, chosen by `HUMAN_VIEWER_PORT` (default 5175). */
const instance: IHumanViewerInstance = humanViewerInstance(
  process.env.HUMAN_VIEWER_PORT,
);
const automaticWarmSetting: string | undefined =
  process.env.HUMAN_VIEWER_AUTO_WARM;
if (
  automaticWarmSetting !== undefined &&
  automaticWarmSetting !== "" &&
  automaticWarmSetting !== "on" &&
  automaticWarmSetting !== "off"
)
  throw new Error("HUMAN_VIEWER_AUTO_WARM must be on or off when set.");
const automaticWarm: boolean = automaticWarmSetting !== "off";
console.log("human-viewer automatic warm: " + (automaticWarm ? "on" : "off"));
const source: ReturnType<typeof createHumanViewerSource> =
  createHumanViewerSource(directory, applicationDirectory, {
    documentsFile: path.resolve(applicationDirectory, "../examples/faces.json"),
    bodyExamplesFile: path.resolve(
      applicationDirectory,
      "../examples/bodies.json",
    ),
    cameraPosesFile: path.resolve(
      applicationDirectory,
      "../examples/cameras/poses-lens-frame.json",
    ),
    reference: createHumanViewerReferenceFaceDocument,
    standardPeople: readHumanViewerStandardPeople,
    subjectPeople: readHumanViewerSubjectPeople,
  });
const {
  root,
  storage,
  basisFiles,
  inputsDirectory,
  revisions,
  catalogue,
}: typeof source = source;
let inventory: IHumanViewerCatalogue = catalogue();
const sourceEvents: ReturnType<typeof createHumanViewerSourceEvents> =
  createHumanViewerSourceEvents((): string => inventory.revision);
const numerical: ReturnType<typeof createHumanViewerNodeService> =
  createHumanViewerNodeService({
    origin: instance.origin,
    directory,
    revision: (): string => inventory.revision,
    inputs: source.numericalInputs,
  });
const controller: ReturnType<typeof createHumanViewerCatalogueController> =
  createHumanViewerCatalogueController({
    source,
    publish: (next: IHumanViewerCatalogue): void => {
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
    admit: async (
      domain: string,
      text: string,
      basis: string,
    ): Promise<IHumanViewerAdmissionReply> => {
      const reply: IHumanViewerAdmissionReply = await lifetime.run(
        (): Promise<IHumanViewerAdmissionReply> =>
          residency.page.evaluate(
            (input: {
              domain: string;
              text: string;
              basis: string;
              protocol: string;
            }):
              | Promise<IHumanViewerAdmissionReply>
              | { available: boolean; reason: null; token: null } => {
              const bridge: IHumanViewerAdmissionBridge | undefined = (
                window as unknown as IHumanViewerAdmissionWindow
              ).__humanViewerAdmission;
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
}: typeof controller = controller;
let sourceUpdating: boolean = false;
const heap: {
  sample: (work: HumanViewerWork) => void;
  status: () => IHumanViewerHeap;
  mark: () => void;
  windowPeak: () => number | null;
} = createHumanViewerHeapGauge(
  (): Promise<IHumanViewerHeapUsage> => residency.readHeap(),
);
const lifetime: ReturnType<typeof createHumanViewerCaptureLifetime> =
  createHumanViewerCaptureLifetime();
// Edits arrive in bursts, so a revision warms only after sixty quiet seconds.
const warmReadiness: {
  source: (revision: string) => void;
  hardware: () => void;
} = createHumanViewerWarmReadiness(
  (revision: string): void => {
    if (automaticWarm)
      void warmHumanViewerRevision({
        revision,
        inventory: (): IHumanViewerCatalogue => inventory,
        readyRevision: (): string => residency.readyRevision,
        thumbnailFile,
        capture: capturer.capture,
        queue,
        warming,
      });
  },
  { stableMs: 60000 },
);
/** Requests allowed to wait behind the running one before a new one is refused. */
const QUEUE_LIMIT: number = 12;
const queue: ReturnType<typeof createHumanViewerQueue> = createHumanViewerQueue(
  {
    limit: QUEUE_LIMIT,
    patience: 3,
    now: (): number => performance.now(),
    // Background warming starts only when no modeler has asked for a minute.
    quietMs: 60000,
  },
);
const { startup, phase }: ReturnType<typeof createHumanViewerStartupPhase> =
  createHumanViewerStartupPhase("starting the development server");
const residency: ReturnType<typeof createHumanViewerResidency> =
  createHumanViewerResidency({
    origin: instance.origin,
    inventory: (): IHumanViewerCatalogue => inventory,
    publish: (): void => {
      inventory = catalogue();
    },
    lifetime,
    phase,
    progress: (): void => stages.progress(),
    sample: (work: HumanViewerWork): void => heap.sample(work),
    sourceReady: (revision: string): void => warmReadiness.source(revision),
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
/** Capture stage telemetry; actual renderer failures own recovery. */
const stages: ReturnType<typeof createHumanViewerStageWatch> =
  createHumanViewerStageWatch();
/** Capture once: older reports cannot adopt this server, including a reused PID. */
const compilationProcessStartedAt: string | null = ProcessOwnership.read(
  process.pid,
);
if (compilationProcessStartedAt === null)
  throw new Error("The compilation reader has no process creation identity.");
/** What this actual server's compiler last reported, read from the file it writes. */
const sourceStatus: () => {
  error: string | null;
  goodAt: string | null;
} = (): { error: string | null; goodAt: string | null } =>
  readHumanViewerCompilationStatus(
    (): string =>
      fs.readFileSync(path.join(storage, instance.sourceStatus), "utf8"),
    { pid: process.pid, processStartedAt: compilationProcessStartedAt },
  );
/**
 * The retained renderer heap policy predates the separate Node numerical
 * processes. It bounds browser page resources and any actual browser workers
 * reported by CDP; Node process heaps are outside this renderer measurement.
 * Resident geometry and decode copies still occupy the browser's heap, so
 * moving computation does not remove this guard or change its existing limit.
 */
const RENDERER_HEAP_LIMIT: number = 2.8e9;
const residentTrim: {
  before: (domain: "face" | "body" | "person") => Promise<void>;
  learn: (domain: "face" | "body" | "person") => void;
  room: () => Record<"face" | "body" | "person", number>;
  trim: () => Promise<void>;
  status: () => IHumanViewerResidentTrimReading | null;
} = createHumanViewerResidentTrim({
  limit: RENDERER_HEAP_LIMIT,
  // 300 MB below the limit, about twelve people: a trim then pays for its
  // collection once instead of on every following capture.
  target: RENDERER_HEAP_LIMIT - 3e8,
  page: (collect: boolean): Promise<IHumanViewerHeapUsage> =>
    collect ? residency.readLiveHeap() : residency.readHeap(),
  workers: (collect: boolean): Promise<IHumanViewerWorkerHeap[]> =>
    residency.readWorkerHeaps(collect),
  evict: (): Promise<boolean> =>
    residency.page.evaluate(
      (): Promise<boolean> =>
        (window as unknown as IHumanViewerWindow).__humanViewer.evict(),
    ),
  mark: heap.mark,
  windowPeak: heap.windowPeak,
  // Measured: a person build and draw took the page from 296 MB to 1560 MB
  // (upper-arm, pid 13952, 08:34Z). Faces and bodies start at zero and learn
  // their room from their first capture, which runs while the heap is small.
  seeds: { face: 0, body: 0, person: 1.26e9 },
});
const capturer: {
  capture: (address: HumanViewerAddress) => Promise<Buffer>;
  edited: (at: number) => void;
  responded: (http: IHumanViewerPhases) => IHumanViewerPhases;
  build: () => string;
  status: () => IHumanViewerCaptureStatus;
} = createHumanViewerCapture({
  page: (): typeof residency.page => residency.page,
  renderer: (): string => residency.renderer,
  startup: (): string =>
    (residency.pageWait ?? startup.phase + " since " + startup.since) +
    (residency.errors.length === 0
      ? ""
      : "; last error: " + residency.errors[residency.errors.length - 1]),
  readyRevision: (): string => residency.readyRevision,
  pageRevision: (): string => residency.pageRevision,
  inventory: (): IHumanViewerCatalogue => inventory,
  lifetime,
  trim: residentTrim.trim,
  makeRoom: residentTrim.before,
  learnRoom: residentTrim.learn,
  stages,
});
/** Candidate loading windows: they hold compile withdrawal and label each candidate's code. */
const windows: {
  open: () => string;
  close: (token: string) => void;
  edited: () => void;
  label: (token: string | null) => Promise<string | null | undefined>;
  current: (token: string | null) => boolean;
  closeAll: () => void;
  holding: () => number;
} = createHumanViewerGenerationWindows({
  gate: humanViewerCompileGate,
  revision: (): string => inventory.revision,
  updating: (): boolean => sourceUpdating,
  closed: (): void => retryAdmissions("a candidate window closed"),
});
/**
 * Wait until the source settles: a generation of the
 * current revision is ready, or the current revision's candidate failed and
 * the last good generation is what can draw.
 */
const settleGeneration: () => Promise<void> = (): Promise<void> =>
  waitForHumanViewerGeneration(
    (): boolean =>
      residency.readyRevision !== "" &&
      !sourceUpdating &&
      (residency.readyRevision === inventory.revision ||
        residency.errors.length !== 0),
    (ms: number): Promise<undefined> =>
      new Promise<undefined>(
        (
          resolve: (value: PromiseLike<undefined> | undefined) => void,
        ): void => {
          setTimeout(resolve, ms);
        },
      ),
  );
const thumbnails: {
  prune: (revision: string) => void;
  stale: (file: string, revision: string) => string | null;
} = createHumanViewerThumbnailStore(
  createNodeHumanViewerThumbnailDisk(fs, path.join),
  path.join(storage, instance.thumbnails),
  path.join,
);
const pruneThumbnails: () => void = (): void =>
  thumbnails.prune(inventory.revision);
const thumbnailFile: (search: string) => string | null = (
  search: string,
): string | null =>
  humanViewerThumbnailFile(
    search,
    path.join(storage, instance.thumbnails),
    inventory,
  );

async function main(): Promise<void> {
  fs.mkdirSync(path.join(storage, "cache"), { recursive: true });
  const display: ReturnType<typeof serveHumanViewerDisplay> =
    serveHumanViewerDisplay({
      root,
      storage,
      port: instance.port,
      origin: instance.origin,
      revision: (): string => inventory.revision,
    });
  const middleware: HumanViewerMiddleware = createHumanViewerMiddleware({
    origin: instance.origin,
    sourceEvents,
    pages: serveHumanViewerPages(applicationDirectory),
    display,
    health: (): IHumanViewerHealth =>
      assembleHumanViewerHealth({
        port: instance.port,
        storage,
        inventory: (): IHumanViewerCatalogue => inventory,
        renderer: (): string => residency.renderer,
        readyRevision: (): string => residency.readyRevision,
        sourceStatus,
        errors: (): string[] => residency.errors,
        sourceUpdating: (): boolean => sourceUpdating,
        work: (): HumanViewerWork | null => residency.work,
        heap,
        owner,
        revisions,
        queue,
        queueLimit: QUEUE_LIMIT,
        lastEdit: (): IHumanViewerEdit | null => lastEdit,
        capture: capturer,
        warming,
        startup,
        admission: admission.status,
        relaunches: (): number => residency.relaunches,
        trim: residentTrim.status,
        holding: windows.holding,
        stage: stages.current,
      }),
    numerical,
    generation: { windows },
    heap: {
      readLiveHeap: (): Promise<IHumanViewerHeapUsage> =>
        residency.readLiveHeap(),
      readWorkerHeaps: (): Promise<IHumanViewerWorkerHeap[]> =>
        residency.readWorkerHeaps(true),
      work: (): HumanViewerWork | null => residency.work,
      readyRevision: (): string => residency.readyRevision,
    },
    data: (): ReturnType<
      Parameters<typeof createHumanViewerMiddleware>[0]["data"]
    > => ({
      storage,
      referenceDirectory: source.referenceDirectory,
      cameraPosesFile: source.cameraPosesFile,
      basisFiles,
      generationFiles: source.generationFiles,
      inputsDirectory,
      inventory,
      settleInputs,
      readDocument,
      settleDocument,
      currentCode: windows.current,
      publish: (nextInventory: IHumanViewerCatalogue): void => {
        inventory = nextInventory;
      },
    }),
    capture: {
      cameraPosesDirectory: path.dirname(source.cameraPosesFile),
      queue,
      inventory: (): IHumanViewerCatalogue => inventory,
      readyRevision: (): string => residency.readyRevision,
      renderer: (): string => residency.renderer,
      page: (): typeof residency.page => residency.page,
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
    createVite: (): ReturnType<typeof createHumanViewerViteServer> =>
      createHumanViewerViteServer(middleware),
    publishRevision: sourceEvents.publish,
    watching: {
      inputs: (): void => {
        inventory = catalogue();
      },
      updating: (value: boolean): void => {
        sourceUpdating = value;
      },
      publish: (files: string[], moved: string[]): void => {
        lastEdit = {
          files: files.map((file: string): string => path.relative(root, file)),
          at: new Date().toISOString(),
          moved,
        };
        capturer.edited(Date.now());
        inventory = catalogue();
        pruneThumbnails();
      },
      error: residency.error,
      reached: (): void => {
        windows.edited();
        void numerical
          .shutdown()
          .catch((error: unknown): void => residency.error(error));
      },
    },
    inventory: (): IHumanViewerCatalogue => inventory,
    openPage: residency.open,
    firstReady: residency.firstReady,
    renderer: (): string => residency.renderer,
    phase,
    ready: (): void => {
      pruneThumbnails();
      warmReadiness.hardware();
    },
    closeRenderer: createAutoMovieResourceRetirement([
      (): Promise<void> => display.close(),
      (): void => sourceEvents.close(),
      (): Promise<void> => numerical.shutdown(),
      (): Promise<void> => residency.close(),
    ]),
  });
}
void main().catch((error: unknown): never => {
  console.error(error);
  process.exit(1);
});
