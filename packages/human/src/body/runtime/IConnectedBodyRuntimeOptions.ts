import type { IAutoMovieHumanBodyBasisBuilderOptions } from "../structures/IAutoMovieHumanBodyBasisBuilderOptions";

/**
 * Source context, completed-progress notification and cooperative scheduling for createConnectedBodyRuntime. The runtime checks elapsed time after one contact part/pair or arms-down step; sliceMs is a yield threshold, not a hard maximum for an indivisible geometric calculation. Source options remain fixed and read-only for the runtime's lifetime.
 *
 * @evidence contracts/common.md#principled-implementation Constructor source context precedes numerical evaluation; callbacks relay actual completed boundaries and yield between indivisible work units.
 * @evidence contracts/common.md#clear-and-simple-design Source admission stays in builderOptions while transport progress and cooperative scheduling are runtime integration seams.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Progress is not synthetic admission, and a slice threshold does not claim to preempt a long synchronous crossing or construction step.
 * @evidence contracts/common.md#meaningful-documentation The prose gives source immutability, callback purpose and the difference between a cooperative threshold and a hard execution bound.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This options interface does not execute the scheduling or geometry algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type implements no source compilation or result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Callback and runtime lifetime are managed by their consumers, not the erased options schema.
 *
 * @author Samchon
 */
export interface IConnectedBodyRuntimeOptions {
  /** Actual constructor source context, including same-generation head endpoint contributions when required. */
  builderOptions?: IAutoMovieHumanBodyBasisBuilderOptions;

  /**
   * Receive an actual completed construction boundary label. The builder's observer runs first; either callback's exception propagates through evaluation.
   *
   * @evidence contracts/common.md#principled-implementation The runtime formats actual construction progress and calls this notification after the source builder's observer.
   * @evidence contracts/common.md#clear-and-simple-design The callback transports a display label while the structured construction progress remains with the builder owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Labels describe execution boundaries rather than timed synthetic progress or anatomical acceptance.
   * @evidence contracts/common.md#meaningful-documentation The prose states notification ordering and exception propagation.
   * @evidence contracts/performance.md#efficient-algorithms Label formatting scales with identifier lengths; callback work is caller-defined and has no runtime-imposed bound.
   * @evidence contracts/performance.md#reuse-equivalent-work Each completed boundary is an effectful notification and is not deduplicated as an interchangeable result.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The runtime retains this callback with its closure; notification values escape only if the consumer keeps them, and no timer is owned here.
   */
  progress?: (stage: string) => void;

  /** Millisecond yield threshold, default 25; checked between complete work units, with no hard preemption guarantee. */
  sliceMs?: number;

  /**
   * Resolve after handing control back. The default is one zero-delay timer; a custom implementation must yield to the host to let newer messages run, and rejection aborts the current operation.
   *
   * @evidence contracts/common.md#principled-implementation An awaited host yield creates the scheduling boundary at which queued requests can supersede ongoing observation work.
   * @evidence contracts/common.md#clear-and-simple-design The runtime owns when to yield, while this callback owns integration with the host event loop.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A merely resolved promise is not claimed to process queued worker messages; host scheduling remains a callback premise.
   * @evidence contracts/common.md#meaningful-documentation The prose states host-yield responsibility, the default timer and rejection behavior.
   * @evidence contracts/performance.md#efficient-algorithms Callback cost is host-defined; the default schedules one timer per requested yield instead of polling.
   * @evidence contracts/performance.md#reuse-equivalent-work Yields are effectful scheduling boundaries and are awaited separately rather than cached across requests.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The invoking operation awaits completion; custom pending tasks remain callback-owned, with no cancellation or timeout contract imposed by this signature.
   */
  yieldThread?: () => Promise<unknown>;
}
