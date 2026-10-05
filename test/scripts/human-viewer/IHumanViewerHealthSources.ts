import type { HumanViewerWork } from "./HumanViewerWork";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue";
import type { IHumanViewerEdit } from "./IHumanViewerEdit";
import type { IHumanViewerStartup } from "./IHumanViewerStartup";
import type { IHumanViewerWarming } from "./IHumanViewerWarming";
import type { createHumanViewerCapture } from "./createHumanViewerCapture";
import type { createHumanViewerHeapGauge } from "./createHumanViewerHeapGauge";
import type { createHumanViewerQueue } from "./createHumanViewerQueue";
import type { createHumanViewerSource } from "./createHumanViewerSource.mjs";
import type { readHumanViewerCompilationStatus } from "./readHumanViewerCompilationStatus";

/**
 * The server state `/health` reports, read through accessors at answer time.
 *
 * @evidence contracts/common.md#clear-and-simple-design The server owns the state; the health answer only reads it.
 * @evidence contracts/common.md#meaningful-documentation Names every reported source.
 * @author Samchon
 */
export interface IHumanViewerHealthSources {
  /** Port the server listens on. */
  port: number;

  /** The current catalogue. */
  inventory: () => IHumanViewerCatalogue;

  /** Renderer string of the GPU page, empty before it is known. */
  renderer: () => string;

  /** The generation the page can draw, empty while none can. */
  readyRevision: () => string;

  /** What the compile process last reported. */
  sourceStatus: () => ReturnType<typeof readHumanViewerCompilationStatus>;

  /** Recent page and source errors. */
  errors: () => string[];

  /** Whether a source edit is being applied. */
  sourceUpdating: () => boolean;

  /** The page's latest progress record. */
  work: () => HumanViewerWork | null;

  /** Heap readings of the resident page. */
  heap: ReturnType<typeof createHumanViewerHeapGauge>;

  /** Revisions of the source files. */
  revisions: ReturnType<typeof createHumanViewerSource>["revisions"];

  /** The GPU queue. */
  queue: ReturnType<typeof createHumanViewerQueue>;

  /** Requests allowed to wait behind the running one. */
  queueLimit: number;

  /** The last edit that reached a build. */
  lastEdit: () => IHumanViewerEdit | null;

  /** Capture state and telemetry. */
  capture: ReturnType<typeof createHumanViewerCapture>;

  /** Progress of the background warm pass. */
  warming: IHumanViewerWarming;

  /** What the server is doing while it starts. */
  startup: IHumanViewerStartup;
}
