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
 * @evidence contracts/common.md#clear-and-simple-design The server owns the state; the health answer only reads it.
 * @evidence contracts/common.md#meaningful-documentation Names every reported source.
 *
 * @evidence contracts/common.md#principled-implementation Answer-time accessors associate health readings with their live catalogue, renderer, source and capture owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readiness, failure and resource telemetry are borrowed from actual owners, not synthesized from HTTP availability.
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

  /**
   * The current catalogue.
   *
   * @evidence contracts/common.md#principled-implementation The health answer reads the host's current complete catalogue and revision.
   * @evidence contracts/common.md#clear-and-simple-design Catalogue state is borrowed through its publication owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A retained display does not manufacture a catalogue for newer source.
   * @evidence contracts/common.md#meaningful-documentation The accessor supplies answer-time document inventory and source identity.
   */
  inventory: () => IHumanViewerCatalogue;

  /**
   * Renderer string of the GPU page, empty before it is known.
   *
   * @evidence contracts/common.md#principled-implementation The health answer reads the device identity known by the current residency.
   * @evidence contracts/common.md#clear-and-simple-design GPU observation remains with the resident page owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty startup string cannot be replaced by a presumed hardware device.
   * @evidence contracts/common.md#meaningful-documentation Empty means the GPU page has not yet supplied its renderer string.
   */
  renderer: () => string;

  /**
   * The generation the page can draw, empty while none can.
   *
   * @evidence contracts/common.md#principled-implementation The health answer identifies the generation the resident page can actually draw.
   * @evidence contracts/common.md#clear-and-simple-design Drawable source is distinct from the catalogue's current source revision.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A stale retained model cannot be relabelled current merely because the server answers.
   * @evidence contracts/common.md#meaningful-documentation Empty means no drawable ready generation; otherwise the value labels the serving source.
   */
  readyRevision: () => string;

  /**
   * What the compile process last reported.
   *
   * @evidence contracts/common.md#principled-implementation The compilation owner supplies its newest failure and last successful compile time.
   * @evidence contracts/common.md#clear-and-simple-design The health assembler reads existing compile state without starting a compile.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained successful output cannot erase a newer compile failure.
   * @evidence contracts/common.md#meaningful-documentation The result keeps compile error and goodAt separate nullable readings.
   */
  sourceStatus: () => ReturnType<typeof readHumanViewerCompilationStatus>;

  /**
   * Recent page and source errors.
   *
   * @evidence contracts/common.md#principled-implementation The current page and source owners supply their recent failures.
   * @evidence contracts/common.md#clear-and-simple-design Health reports the failure list without taking ownership of error recovery.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Readiness cannot suppress actual source or display errors.
   * @evidence contracts/common.md#meaningful-documentation The array contains recent observed page and source causes.
   */
  errors: () => string[];

  /**
   * Whether a source edit is being applied.
   *
   * @evidence contracts/common.md#principled-implementation The source owner reports whether an edit batch is still being processed.
   * @evidence contracts/common.md#clear-and-simple-design A boolean accessor exposes edit processing without the source queue itself.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Elapsed quiet time cannot serve as proof a source batch finished.
   * @evidence contracts/common.md#meaningful-documentation True denotes active source-edit processing at answer time.
   */
  sourceUpdating: () => boolean;

  /**
   * The page's latest progress record.
   *
   * @evidence contracts/common.md#principled-implementation The page reports the latest actual work record or no active record.
   * @evidence contracts/common.md#clear-and-simple-design Work telemetry stays with the residency owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No document or estimated work stage is fabricated while no record exists.
   * @evidence contracts/common.md#meaningful-documentation Null means no available latest work reading.
   */
  work: () => HumanViewerWork | null;

  /** Heap readings of the resident page. */
  heap: ReturnType<typeof createHumanViewerHeapGauge>;

  /** Revisions of the source files. */
  revisions: ReturnType<typeof createHumanViewerSource>["revisions"];

  /** The GPU queue. */
  queue: ReturnType<typeof createHumanViewerQueue>;

  /** Requests allowed to wait behind the running one. */
  queueLimit: number;

  /**
   * The last edit that reached a build.
   *
   * @evidence contracts/common.md#principled-implementation The source owner reports the latest batch that reached serving compilation.
   * @evidence contracts/common.md#clear-and-simple-design One nullable record supplies edited paths, observation time and moved domains.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A digest change cannot be represented by an invented filename or timestamp.
   * @evidence contracts/common.md#meaningful-documentation Null means no published edit record is available.
   */
  lastEdit: () => IHumanViewerEdit | null;

  /** Capture state and telemetry. */
  capture: ReturnType<typeof createHumanViewerCapture>;

  /** Progress of the background warm pass. */
  warming: IHumanViewerWarming;

  /** What the server is doing while it starts. */
  startup: IHumanViewerStartup;

  /**
   * Admissions in flight and documents waiting for a viewer frame.
   *
   * @evidence contracts/common.md#principled-implementation The admission owner reports actual requests in flight and documents waiting.
   * @evidence contracts/common.md#clear-and-simple-design Health reads the owner's counters and reasons rather than recounting catalogue rows.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unasked or pending documents cannot be counted as owner-approved results.
   * @evidence contracts/common.md#meaningful-documentation The status separates asking, waiting and the distinct reasons for waiting.
   */
  admission: () => IHumanViewerAdmissionStatus;

  /**
   * Pages opened again after their renderer exited, since the server started.
   *
   * @evidence contracts/common.md#principled-implementation The residency owner reports browser pages physically reopened after renderer exit.
   * @evidence contracts/common.md#clear-and-simple-design A single count describes the owner's completed recovery history.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Server uptime or source edits cannot stand in for renderer-recovery events.
   * @evidence contracts/common.md#meaningful-documentation The count is pages reopened since this server started.
   */
  relaunches: () => number;

  /**
   * The last resident trim decision.
   *
   * @evidence contracts/common.md#principled-implementation The heap policy reports its last actual resident-release decision.
   * @evidence contracts/common.md#clear-and-simple-design One nullable decision is read without rerunning collection or eviction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent trim is not reported as a successful zero-byte memory check.
   * @evidence contracts/common.md#meaningful-documentation Null means no trim decision yet; present quantities describe the owner's measured bytes.
   */
  trim: () => IHumanViewerResidentTrimReading | null;

  /**
   * Candidate loading windows open now, each holding compile withdrawal.
   *
   * @evidence contracts/common.md#principled-implementation The generation-window owner reports currently open compile holds.
   * @evidence contracts/common.md#clear-and-simple-design Only the count is projected; window identity and release remain with their owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Elapsed module-loading time cannot release or invent a compile hold.
   * @evidence contracts/common.md#meaningful-documentation The number counts candidate windows still open now.
   */
  holding: () => number;

  /**
   * The running capture's stage, or null between captures.
   *
   * @evidence contracts/common.md#principled-implementation The capture-stage owner reports the current room, page or trim work and progress.
   * @evidence contracts/common.md#clear-and-simple-design One nullable stage projection keeps capture observation separate from queue ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A stage's age is telemetry, not permission to cancel valid work.
   * @evidence contracts/common.md#meaningful-documentation Null means no capture stage; present times identify actual start and progress observations.
   */
  stage: () => IHumanViewerCaptureStage | null;
}
