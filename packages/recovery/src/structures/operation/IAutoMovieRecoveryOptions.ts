import type { AutoMovieRecoveryCurveFormat } from "../../typings/AutoMovieRecoveryCurveFormat";

/**
 * Cooperative synchronous cancellation and progress; a blocked event loop cannot deliver a new abort.
 *
 * @evidence contracts/common.md#principled-implementation Caller-owned cancellation and progress are observed only at the synchronous operation's declared checkpoints.
 * @evidence contracts/common.md#clear-and-simple-design One options record carries observation basis selection, optional station limits and caller progress without owning geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cancellation is cooperative; these options do not promise interruption while the event loop is blocked.
 * @evidence contracts/common.md#meaningful-documentation States selector defaults, omitted station-limit meaning, callback ownership and progress-exception behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The contract owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Values belong to the caller; the type acquires no resources.
 */
export interface IAutoMovieRecoveryOptions {
  /** Saved cubic basis for observation; omitted preserves Bernstein coefficients. */
  curveFormat?: AutoMovieRecoveryCurveFormat;

  /** Optional caller-owned cancellation token. */
  signal?: AbortSignal;

  /**
   * Observe an existing synchronous progress point; a thrown error fails the operation.
   * The caller owns callback work and must return before computation continues.
   *
   * @evidence contracts/common.md#principled-implementation The caller receives phase and completed/planned counts from existing operation checkpoints; its exception becomes a failed terminal outcome.
   * @evidence contracts/common.md#clear-and-simple-design This optional observer reports progress without supplying geometry or changing the admitted policy.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No callback or global is substituted and no progress event is fabricated between checkpoints.
   * @evidence contracts/common.md#meaningful-documentation States synchronous execution, caller ownership and failure propagation.
   * @evidence contracts/performance.md#efficient-algorithms Invocation adds one function call per existing progress notification; callback time and retained data are caller-controlled and have no package-enforced bound.
   * @evidence contracts/performance.md#reuse-equivalent-work Notifications are effects and are delivered once per operation checkpoint rather than cached across operations.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Operations retain this callback only while executing synchronously and register no timer or listener; the caller owns any state it captures.
   */
  onProgress?: (phase: string, completed: number, total: number) => void;

  /** Explicit incomplete observation prefix; omitted for the full planned station set. */
  sectionLimit?: number;

  /** Collect operation timing observations without changing geometry. */
  observeWork?: boolean;
}
