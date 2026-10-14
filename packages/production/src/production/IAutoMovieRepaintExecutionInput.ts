import { IAutoMovieRepaintAttemptOutput } from "./IAutoMovieRepaintAttemptOutput";
import { IAutoMovieRepaintAttemptRecord } from "./IAutoMovieRepaintAttemptRecord";
import { IAutoMovieRepaintExecutionRuntime } from "./IAutoMovieRepaintExecutionRuntime";
import { AutoMovieRepaintClaimAdmission } from "./repaintAttemptClaim";
import { IAutoMovieRepaintExecutionPolicy } from "@automovie/interface";

/**
 * Groups the existing request identity, retry envelope, injected runtime, optional signal/admission seam, asynchronous provider callback and terminal observer without adding defaults.
 *
 * @evidence contracts/common.md#principled-implementation Groups the existing request identity, retry envelope, injected runtime, optional signal/admission seam, asynchronous provider callback and terminal observer without adding defaults.
 * @evidence contracts/common.md#clear-and-simple-design Naming the original generic parameter shape avoids duplicating its long function-valued binding type while preserving the original structural API/defaults.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This structural shape introduces no runtime branch, provider substitution or fixture-specific behavior; runtime facts are admitted by its stated producer/consumer boundaries.
 * @evidence contracts/common.md#meaningful-documentation Callbacks remain caller-owned and may throw or retain external tasks; the executor owns its attempt array, cancellation relay and timeout only.
 * @evidence contracts/performance.md#efficient-algorithms This structural type erases at runtime; this named shape preserves the original generic structural parameter API; policy and identity checks happen before provider dispatch.
 * @evidence contracts/performance.md#reuse-equivalent-work This erased shape shares the same admitted facts across its stated consumers; it creates no result cache or runtime equivalence/invalidation shortcut.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Callbacks remain caller-owned and may throw or retain external tasks; the executor owns its attempt array, cancellation relay and timeout only.
 */
export interface IAutoMovieRepaintExecutionInput<T> {
  /** Names the owning production namespace checked before project/provider effects. */
  productionId: string;

  /** Names the exact shot whose deterministic source and rendition contract apply. */
  shot: string;

  /** Keeps one immutable request identity stable across admitted retry attempts. */
  requestId: string;

  /** Optionally starts ordinals after retained attempts; absence keeps the original zero offset and admission prevents safe-integer overflow. */
  ordinalOffset?: number;

  /** Carries the caller-derived immutable request fingerprint; the service derives it from source/generator/controls/references/evidence/policy while the generic executor validates canonical digest spelling. */
  requestFingerprint: string;

  /** Binds the successful current compiler input snapshot used for dispatch. */
  compileFingerprint: string;

  /** Binds the verified deterministic source frame/manifest identity. */
  sourceRenderFingerprint: string;

  /** Carries the canonical reviewed provider/model/version/execution runtime identity. */
  adapterIdentity: string;

  /** Carries a safe-integer generator control without promising external reproducibility. */
  seed: number;

  /** Supplies attempt counts, millisecond time/backoff bounds, cost ceiling and closed retry classes validated before dispatch. */
  policy: IAutoMovieRepaintExecutionPolicy;

  /** Supplies clock, attempt IDs and wait callbacks; caller-owned asynchronous callbacks have no enforced settlement deadline. */
  runtime: IAutoMovieRepaintExecutionRuntime;

  /** Optionally communicates cancellation; absence preserves the existing uncancelled request behavior. */
  signal?: AbortSignal;

  /**
   * Optionally reserves an attempt before execute; supported acquired status proceeds, while refused, throwing or malformed admissions stop without a provider dispatch.
   *
   * @evidence contracts/common.md#principled-implementation Optionally reserves an attempt before execute; supported acquired status proceeds, while refused, throwing or malformed admissions stop without a provider dispatch.
   * @evidence contracts/common.md#clear-and-simple-design The project owns reservation/lineage state and execution owns when to await admission; absence preserves the original generic no-claim callback path, while the service always supplies project acquisition.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Admission can return a PromiseLike and remain pending; cancellation during its await is relayed but the original executor can still invoke execute with an already-aborted signal afterward.
   * @evidence contracts/common.md#meaningful-documentation Admission can return a PromiseLike and remain pending; cancellation during its await is relayed but the original executor can still invoke execute with an already-aborted signal afterward. The project owns durable claims and the terminal observer settles the acquired claim; pending admission can retain request/relay state and this type supplies no independent cleanup deadline.
   * @evidence contracts/performance.md#efficient-algorithms The erased optional signature has no runtime algorithm; the service's claim acquisition freshly reads/sorts/hashes the retained attempt prefix and owns transaction work rather than a constant-time claim.
   * @evidence contracts/performance.md#reuse-equivalent-work Current request identity is shared, but each ordinal requires a fresh exact-prefix/generation acquisition; a matching request key never authorizes reusing an unsettled or unknown-outcome owner.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The project owns durable claims and the terminal observer settles the acquired claim; pending admission can retain request/relay state and this type supplies no independent cleanup deadline.
   */
  admitAttempt?: (
    attemptId: string,
    ordinal: number,
  ) =>
    | AutoMovieRepaintClaimAdmission
    | PromiseLike<AutoMovieRepaintClaimAdmission>;

  /**
   * Supplies the asynchronous provider and domain-validation callback, returning a generic admitted value with finite cost and optional available-output metadata for execution metering.
   *
   * @evidence contracts/common.md#principled-implementation Supplies the asynchronous provider and domain-validation callback, returning a generic admitted value with finite cost and optional available-output metadata for execution metering.
   * @evidence contracts/common.md#clear-and-simple-design The callback owns media/provider/currentness validation; execution owns envelope/terminal scheduling, so the generic T alone is not a video or delivery certification.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The signal communicates cooperative cancellation, including possible already-aborted invocation after async admission; elapsed timeout cannot force an external provider to settle or make its unknown outcome safe to retry.
   * @evidence contracts/common.md#meaningful-documentation The signal communicates cooperative cancellation, including possible already-aborted invocation after async admission; elapsed timeout cannot force an external provider to settle or make its unknown outcome safe to retry. The callback/provider owns running external work and service-local buffers; execution owns its timeout/relay and project publication owns raw bytes. The 512MiB retention ceiling does not bound earlier provider allocations.
   * @evidence contracts/performance.md#efficient-algorithms The erased signature adds no runtime work; service execution reads/copies/hashes source/reference/output bytes and probes media, whose own box/sample costs are not universally linear.
   * @evidence contracts/performance.md#reuse-equivalent-work The service reuses admitted local identities and captured output disclosure while freshly checking currentness; effectful provider work is never shared solely because two request keys match.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The callback/provider owns running external work and service-local buffers; execution owns its timeout/relay and project publication owns raw bytes. The 512MiB retention ceiling does not bound earlier provider allocations.
   */
  execute: (
    signal: AbortSignal,
    attemptId: string,
  ) => Promise<{
    /** Transfers the callback's domain-validated payload without cloning its owned byte buffers. */
    value: T;

    /** Carries finite nonnegative metered cost charged against the request ceiling, without estimating actual billing. */
    costUnits: number;

    /** Preserves nullable digest/byte-count/receipt metadata even for failed attempts; it owns no raw buffer. */
    availableOutput: IAutoMovieRepaintAttemptOutput | null;
  }>;

  /**
   * Observes one cloned terminal fact and settled/unknown external-outcome metadata before retry or candidate return; an observer throw stops as observer-failed without duplicating the produced record.
   *
   * @evidence contracts/common.md#principled-implementation Observes one cloned terminal fact and settled/unknown external-outcome metadata before retry or candidate return; an observer throw stops as observer-failed without duplicating the produced record.
   * @evidence contracts/common.md#clear-and-simple-design The observer owns durable project commit/claim settlement, while execution owns its terminal array and ordering; the service updates currentRequestId only after those project effects.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A refusal never becomes a retry/publication success; a pending observer can delay completion and eventual finally cleanup because the original executor awaits its result without a separate deadline.
   * @evidence contracts/common.md#meaningful-documentation A refusal never becomes a retry/publication success; a pending observer can delay completion and eventual finally cleanup because the original executor awaits its result without a separate deadline. The caller owns the observer callback and the project owns committed metadata/claims; its pending work can retain request state, while eventual executor finally releases its own timeout/relay.
   * @evidence contracts/performance.md#efficient-algorithms The erased signature has no runtime cost; cloning scales with terminal metadata, and the service's synchronous durable commit/settlement adds project transaction/read/hash work.
   * @evidence contracts/performance.md#reuse-equivalent-work The already-produced terminal identity is observed once through its clone; retries reuse immutable request identity but cannot skip this distinct attempt's durable observation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the observer callback and the project owns committed metadata/claims; its pending work can retain request state, while eventual executor finally releases its own timeout/relay.
   */
  onAttempt: (
    attempt: IAutoMovieRepaintAttemptRecord,
    observation: {
      /** Distinguishes provider-settled terminal observations from timeout without acknowledged provider settlement, which keeps the claim closed. */
      externalOutcome: "settled" | "unknown";
    },
  ) => unknown;
}
