/**
 * One iframe's latest display stage, reported without geometry or photographs.
 * Frame and source identity distinguish a preparing candidate from the last
 * committed generation. Wall-clock milliseconds locate observations; they
 * are not subtracted from the worker's independent performance clock.
 *
 *
 * @evidence contracts/common.md#principled-implementation createHumanViewerWorkReporter pairs a current phase/snapshot with observed numerical completion readings; readHumanViewerWork admits finite nonnegative telemetry and discards unknown fields before host publication.
 * @evidence contracts/common.md#clear-and-simple-design Keeps frame/source/document identity, page wall-clock transition time, worker monotonic durations and resident/GPU resource readings in one progress record without geometry or photograph payloads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Page at and worker elapsed/stage clocks have different origins and are never added as one duration; an idle phase follows actual reporting, not an elapsed-time guess or hardware-success certificate.
 * @evidence contracts/common.md#meaningful-documentation Documents clock domains, optional observed completion, pending reply/resource quantities and iframe identity; these snapshots do not prove physical resource release or a completed capture on their own.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record chooses no telemetry algorithm; reporting and validation scan a fixed field set, while renderer/resident owners produce resource readings.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every phase transition needs its own current snapshot; equal frame/source strings do not justify replaying an earlier resource count as a fresh observation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records contain identifiers and numeric readings only; host/page own latest-status replacement and log retention, with no log-history cap or worker/context handle introduced by this type.
 *
 * @author Samchon
 */
export interface HumanViewerWork {
  /** Source modules loaded by this iframe. */
  revision: string;

  /** The host's candidate iframe ticket. */
  frame: string;

  /** Document currently being displayed. */
  doc: string;

  /** The outstanding operation, or idle after a completed frame. */
  phase:
    | "loading"
    | "cache-read"
    | "build"
    | "numeric-reply"
    | "cache-write"
    | "prepare"
    | "draw"
    | "idle"
    | "failed";

  /** Latest actual numerical owner completion, when this transition reports one. */
  completed?: string;

  /** Worker monotonic milliseconds from request start; not added to page spans. */
  completionElapsedMs?: number;

  /** Worker monotonic milliseconds since its preceding completion. */
  completionStageMs?: number;

  /** Wall-clock milliseconds at this transition. */
  at: number;

  /** Numerical replies the iframe still awaits. */
  pending: number;

  /** Geometries retained by the shared WebGL renderer. */
  geometries: number;

  /** Textures retained by the shared WebGL renderer. */
  textures: number;

  /** Documents the page keeps drawn-ready. */
  residents: number;

  /** Bytes of arrays those residents keep alive, the quantity their cache is bounded by. */
  residentBytes: number;
}
