import { IAutoMovieRepaintAttemptOutput } from "./IAutoMovieRepaintAttemptOutput";
import { AutoMovieRepaintFailureClass } from "@automovie/interface";

/**
 * Defines one immutable terminal transport fact with request identity, ordinal, times, classified failure, charged cost and optional available-output address.
 *
 * @evidence contracts/common.md#principled-implementation Defines one immutable terminal transport fact with request identity, ordinal, times, classified failure, charged cost and optional available-output address.
 * @evidence contracts/common.md#clear-and-simple-design The terminal record is the shared journal/observer contract; execution owns its construction and the project owns durable chronological admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This structural shape introduces no runtime branch, provider substitution or fixture-specific behavior; runtime facts are admitted by its stated producer/consumer boundaries.
 * @evidence contracts/common.md#meaningful-documentation Digest/byte-count/receipt metadata may survive a failed attempt; the record owns no raw bytes, timer or provider task.
 * @evidence contracts/performance.md#efficient-algorithms This structural type erases at runtime; validation and durable chronological lineage belong to project attempt admission/readers; this interface performs no work.
 * @evidence contracts/performance.md#reuse-equivalent-work This erased shape shares the same admitted facts across its stated consumers; it creates no result cache or runtime equivalence/invalidation shortcut.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Digest/byte-count/receipt metadata may survive a failed attempt; the record owns no raw bytes, timer or provider task.
 */
export interface IAutoMovieRepaintAttemptRecord {
  /** Versions the immutable attempt record. */
  version: 1;

  /** Names the owning production. */
  productionId: string;

  /** Names the exact shot. */
  shot: string;

  /** Keeps retry request identity stable. */
  requestId: string;

  /** Detects request mutation across retry. */
  requestFingerprint: string;

  /** Gives each provider call a distinct identity. */
  attemptId: string;

  /** Records budget order. */
  ordinal: number;

  /** Locks builder input. */
  compileFingerprint: string;

  /** Locks deterministic source bytes. */
  sourceRenderFingerprint: string;

  /** Retains provider and model identity. */
  adapterIdentity: string;

  /** Retains the seed as a control rather than a reproducibility promise. */
  seed: number;

  /** Records provider-call start. */
  startedAt: string;

  /** Records terminal time. */
  completedAt: string;

  /** Distinguishes accepted, failed, cancelled, invalid, and stale attempts. */
  status: "succeeded" | "failed" | "cancelled" | "invalid" | "stale";

  /** Preserves classified refusal and retryability. */
  failure: {
    /** Records the closed terminal failure cause admitted by the executor. */
    class: AutoMovieRepaintFailureClass;

    /** Carries admitted diagnostic text; hostile inspection is contained by the owning classifier. */
    message: string;

    /** Records eligibility under the unchanged retry policy; unknown external outcomes and clock failures remain closed. */
    retryable: boolean;
  } | null;

  /** Charges the request cost ceiling. */
  costUnits: number;

  /** Preserves available partial bytes without admitting a candidate. */
  availableOutput: IAutoMovieRepaintAttemptOutput | null;
}
