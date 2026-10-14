/**
 * Defines injected Date observations, unique attempt IDs and an abort-aware millisecond wait boundary.
 *
 * @evidence contracts/common.md#principled-implementation Defines injected Date observations, unique attempt IDs and an abort-aware millisecond wait boundary.
 * @evidence contracts/common.md#clear-and-simple-design The clock/ID/wait seam remains injected so execution owns scheduling decisions and the host owns effectful clock/wait implementations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This structural shape introduces no runtime branch, provider substitution or fixture-specific behavior; runtime facts are admitted by its stated producer/consumer boundaries.
 * @evidence contracts/common.md#meaningful-documentation The executor releases its own timers/relay listeners; an injected wait or provider may retain external work beyond cancellation.
 * @evidence contracts/performance.md#efficient-algorithms This structural type erases at runtime; clock observations must be valid and monotonic; executeAutoMovieRepaintRequest checks IDs and proves elapsed backoff rather than trusting completion alone.
 * @evidence contracts/performance.md#reuse-equivalent-work This erased shape shares the same admitted facts across its stated consumers; it creates no result cache or runtime equivalence/invalidation shortcut.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The executor releases its own timers/relay listeners; an injected wait or provider may retain external work beyond cancellation.
 */
export interface IAutoMovieRepaintExecutionRuntime {
  /**
   * Supplies Date observations; the executor clones/validates each observation and rejects backward time instead of reopening elapsed budget.
   *
   * @evidence contracts/common.md#principled-implementation Supplies Date observations; the executor clones/validates each observation and rejects backward time instead of reopening elapsed budget.
   * @evidence contracts/common.md#clear-and-simple-design The host owns the clock implementation while execution owns monotonic bookkeeping; the service's wrapper preserves its first post-preflight observation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Clock validity and monotonicity are enforced, while a slow or throwing host clock cannot be given a hard runtime bound by this signature.
   * @evidence contracts/common.md#meaningful-documentation Clock validity and monotonicity are enforced, while a slow or throwing host clock cannot be given a hard runtime bound by this signature. The host owns the callback; Date clones/latest millisecond state are request-local and no timer or provider task is acquired by this type.
   * @evidence contracts/performance.md#efficient-algorithms The erased callback signature adds no runtime work; observations incur host clock cost plus constant Date cloning/finite/comparison checks in the executor.
   * @evidence contracts/performance.md#reuse-equivalent-work One latest admitted timestamp is reused within execution; the original Date is cloned and each later observation remains fresh rather than cached by a request key.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The host owns the callback; Date clones/latest millisecond state are request-local and no timer or provider task is acquired by this type.
   */
  now: () => Date;

  /**
   * Supplies a nonblank attempt ID before provider dispatch; the service uses randomUUID and its project claim boundary validates the canonical claim identity.
   *
   * @evidence contracts/common.md#principled-implementation Supplies a nonblank attempt ID before provider dispatch; the service uses randomUUID and its project claim boundary validates the canonical claim identity.
   * @evidence contracts/common.md#clear-and-simple-design ID generation stays with the injected host and request/ordinal lineage stays with execution and project claim admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The generic executor checks trimmed nonblank text rather than global uniqueness or UUIDv4; uniqueness is a host premise and UUID admission belongs to the service's project boundary.
   * @evidence contracts/common.md#meaningful-documentation The generic executor checks trimmed nonblank text rather than global uniqueness or UUIDv4; uniqueness is a host premise and UUID admission belongs to the service's project boundary. Only the generated string is retained in that attempt's metadata; the callback is caller-owned and allocates no executor timer or external task through this type.
   * @evidence contracts/performance.md#efficient-algorithms The erased signature has no runtime cost; callback generation and string admission follow host work and ID length without a new retry population cap.
   * @evidence contracts/performance.md#reuse-equivalent-work Immutable request identity is reused, while every actual attempt obtains a fresh host ID; an old attempt ID cannot substitute for a new claim generation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the generated string is retained in that attempt's metadata; the callback is caller-owned and allocates no executor timer or external task through this type.
   */
  attemptId: () => string;

  /**
   * Supplies an asynchronous millisecond backoff wait with the existing cancellation signal; execution also requires the next clock observation to prove the full delay elapsed.
   *
   * @evidence contracts/common.md#principled-implementation Supplies an asynchronous millisecond backoff wait with the existing cancellation signal; execution also requires the next clock observation to prove the full delay elapsed.
   * @evidence contracts/common.md#clear-and-simple-design The host owns wait implementation, and execution owns retry sequencing; the service provides the timer/listener helper without introducing a new scheduling host.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An early completed wait does not admit retry before the clock proves elapsed backoff; a pending or abort-ignoring custom wait can keep execution pending without a hard settlement bound.
   * @evidence contracts/common.md#meaningful-documentation An early completed wait does not admit retry before the clock proves elapsed backoff; a pending or abort-ignoring custom wait can keep execution pending without a hard settlement bound. The implementation owns and releases its wait resources; the service removes its listener at completion/abort and clears its timer on abort, while this signature cannot force a custom wait to clean up.
   * @evidence contracts/performance.md#efficient-algorithms The erased signature adds no runtime work; the service's implementation allocates one timer/listener per wait, and injected implementations can have their own costs.
   * @evidence contracts/performance.md#reuse-equivalent-work Backoff belongs to one attempt transition and its signal; identical milliseconds do not permit sharing an effectful wait across requests.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The implementation owns and releases its wait resources; the service removes its listener at completion/abort and clears its timer on abort, while this signature cannot force a custom wait to clean up.
   */
  wait: (milliseconds: number, signal: AbortSignal) => Promise<void>;
}
