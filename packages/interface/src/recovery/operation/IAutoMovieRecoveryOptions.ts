import type {
  AutoMovieRecoveryCurveFormat,
  IAutoMovieRecoverySlabObservation,
  IAutoMovieRecoverySourceLineage,
} from "../../index";

/** Cooperative synchronous cancellation and progress; a blocked event loop cannot deliver a new event-loop cancellation.
 *
 * @evidence contracts/development/design.md#principled-representation Caller-owned cancellation and progress are observed only at the synchronous operation's declared checkpoints.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One options record carries observation basis selection, optional station limits and caller progress without owning geometry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Cancellation is cooperative; these options do not promise interruption while the event loop is blocked.
 * @evidence contracts/development/common.md#meaningful-documentation States selector defaults, omitted station-limit meaning, callback ownership and progress-exception behavior.
 */
export interface IAutoMovieRecoveryOptions {
  /** Saved cubic basis for observation; omitted preserves Bernstein coefficients. */
  curveFormat?: AutoMovieRecoveryCurveFormat;

  /** Synchronous cooperative cancellation query; absent means continue.
   * Return true to stop at the next existing checkpoint without publishing a value;
   * false continues. Throwing or returning a nonboolean value fails the operation.
   * The caller owns callback cost and captured state; it must not return a Promise.
   * No listener or background task is registered, and a blocked event loop cannot
   * change caller state until control returns. Observation and fitting check their documented progress boundaries.
   * The recovery caller implements the synchronous query; observation and fitting invoke it at their existing cooperative checkpoints and own terminal cancellation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States checkpoint timing, absent/true/false meanings, invalid-result failure and event-loop limits.
   */
  cancelled?: () => boolean;

  /** Observe an existing synchronous progress point; a thrown error fails the operation.
   * The caller owns callback work and must return before computation continues.
   * @evidence contracts/development/common.md#meaningful-documentation States synchronous execution, caller ownership and failure propagation.
   */
  onProgress?: (phase: string, completed: number, total: number) => void;

  /** Receive copied source incidence once per observed section contour, outside the coefficient result. The callback runs synchronously after fitting or local rejection; throwing fails observation, and records already delivered remain provisional until a successful terminal result. Cancellation can stop delivery before the next contour. The caller owns callback cost and any retained records.
   * @evidence contracts/development/common.md#meaningful-documentation States synchronous delivery, source ownership, provisional records, cancellation and failure effects.
   */
  onSourceLineage?: (observation: IAutoMovieRecoverySourceLineage) => void;

  /** Receive acquisition-only incidence for every requested source slab after section processing. Delivery is synchronous and provisional until the operation succeeds; throwing fails the operation, and callback-triggered cancellation stops later delivery. Copied source addresses stay outside the coefficient value. Slab-only observation binds saved publications without fitting and delivers independent metadata copies.
   * @evidence contracts/development/common.md#meaningful-documentation States delivery order, provisional ownership, callback exceptions and cooperative cancellation.
   */
  onSourceSlab?: (observation: IAutoMovieRecoverySlabObservation) => void;

  /** Explicit incomplete observation prefix; omitted for the full planned station set. */
  sectionLimit?: number;

  /** Collect operation timing observations without changing geometry. */
  observeWork?: boolean;
}
