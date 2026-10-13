import type { HumanViewerWork } from "./HumanViewerWork.js";
import type { IHumanViewerAdmissionStatus } from "./IHumanViewerAdmissionStatus.js";
import type { IHumanViewerCaptureStage } from "./IHumanViewerCaptureStage.js";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { IHumanViewerEdit } from "./IHumanViewerEdit.js";
import type { IHumanViewerResidentTrimReading } from "./IHumanViewerResidentTrimReading.js";
import type { IHumanViewerStartup } from "./IHumanViewerStartup.js";
import type { IHumanViewerWarming } from "./IHumanViewerWarming.js";
import type { createHumanViewerCapture } from "./createHumanViewerCapture.js";
import type { createHumanViewerHeapGauge } from "./createHumanViewerHeapGauge.js";
import type { createHumanViewerQueue } from "./createHumanViewerQueue.js";
import type { createHumanViewerSource } from "./createHumanViewerSource.mjs";
import type { readHumanViewerCompilationStatus } from "./readHumanViewerCompilationStatus.js";

/**
 * The server state `/health` reports, read through accessors at answer time.
 *
 * Answer-time accessors contribute the existing owners’ local identities, counts, status, resources and causes. This snapshot interface does not calculate whole-job ETA, classify credentials or implement a causal event ledger.
 *
 * @author Samchon
 */
export interface IHumanViewerHealthSources {
  /** Resolved mutable storage served by this process. */
  storage: string;

  /** Port the server listens on. */
  port: number;

  /**
   * The launcher that owns the port and record, or null for a server started directly.
   */
  owner: number | null;

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

  /** Admissions in flight and documents waiting for a viewer frame. */
  admission: () => IHumanViewerAdmissionStatus;

  /**
   * Pages opened again after their renderer exited, since the server started.
   */
  relaunches: () => number;

  /** The last resident trim decision. */
  trim: () => IHumanViewerResidentTrimReading | null;

  /** Candidate loading windows open now, each holding compile withdrawal. */
  holding: () => number;

  /** The running capture's stage, or null between captures. */
  stage: () => IHumanViewerCaptureStage | null;
}
