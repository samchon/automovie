import type { AutoMovieRecoveryCurveFormat } from "../../typings/AutoMovieRecoveryCurveFormat";
import type { IAutoMovieRecoverySlabObservation } from "../observation/IAutoMovieRecoverySlabObservation";
import type { IAutoMovieRecoverySourceLineage } from "../observation/IAutoMovieRecoverySourceLineage";

/**
 * Cooperative synchronous cancellation and progress; a blocked event loop cannot deliver a new abort.
 *
 * @evidence contracts/development/design.md#principled-representation Caller-owned cancellation and progress are observed only at the synchronous operation's declared checkpoints.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One options record carries observation basis selection, optional station limits and caller progress without owning geometry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Cancellation is cooperative; these options do not promise interruption while the event loop is blocked.
 * @evidence contracts/development/common.md#meaningful-documentation States selector defaults, omitted station-limit meaning, callback ownership and progress-exception behavior.
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
   * @evidence contracts/development/implementation.md#principled-implementation The caller receives phase and completed/planned counts from existing operation checkpoints; its exception becomes a failed terminal outcome.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This optional observer reports progress without supplying geometry or changing the admitted policy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No callback or global is substituted and no progress event is fabricated between checkpoints.
   * @evidence contracts/development/common.md#meaningful-documentation States synchronous execution, caller ownership and failure propagation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Invocation adds one function call per existing progress notification; callback time and retained data are caller-controlled and have no package-enforced bound.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Notifications are effects and are delivered once per operation checkpoint rather than cached across operations.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Operations retain this callback only while executing synchronously and register no timer or listener; the caller owns any state it captures.
   */
  onProgress?: (phase: string, completed: number, total: number) => void;

  /**
   * Receive copied source incidence once per observed section contour, outside the coefficient result. The callback runs synchronously after fitting or local rejection; throwing fails observation, and records already delivered remain provisional until a successful terminal result. Cancellation can stop delivery before the next contour. The caller owns callback cost and any retained records.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Existing contour incidence supplies original triangle addresses and exact publication indices without altering fitting or reconstruction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Acquisition provenance has one optional observer and stays outside source-free coefficients.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The callback supplies no geometry or part classification and cannot replace generated coefficients.
   * @evidence contracts/development/common.md#meaningful-documentation States synchronous delivery, source ownership, provisional records, cancellation and failure effects.
   * @evidence contracts/development/implementation.md#efficient-algorithms Enabled delivery copies each contour's F incident face IDs in O(F) time and storage; omitted delivery allocates no lineage record or face copy. Callback work has no package-enforced bound.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing per-contour face support is reused; callbacks are effects delivered once per visited contour and are never cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The operation retains the callback only for its synchronous call. Copied IDs transfer to the observer, which owns any retention; no listener or timer is registered.
   */
  onSourceLineage?: (observation: IAutoMovieRecoverySourceLineage) => void;

  /**
   * Receive acquisition-only incidence for every requested source slab after section processing. Delivery is synchronous and provisional until the operation succeeds; throwing fails the operation, and callback-triggered cancellation stops later delivery. Copied source addresses stay outside the coefficient value. Slab-only observation binds saved publications without fitting and delivers independent metadata copies.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Existing clipped source-cell topology and PL critical owners supply exact port and event evidence on the admitted scalar chart.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional observer separates acquisition metadata from generated coefficient input.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The observer supplies no source geometry, normals, inferred cap or physical-jet fallback.
   * @evidence contracts/development/common.md#meaningful-documentation States delivery order, provisional ownership, callback exceptions and cooperative cancellation.
   * @evidence contracts/development/implementation.md#efficient-algorithms One invocation per requested slab adds caller-owned work with no package-enforced cost bound; omitted slab requests perform no slab observation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Slab source preparation is reused within one observation; effectful callback delivery is never cached across calls.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The operation retains the observer only during its synchronous call; the observer owns any retained copied records and no listener or timer is registered.
   */
  onSourceSlab?: (observation: IAutoMovieRecoverySlabObservation) => void;

  /** Explicit incomplete observation prefix; omitted for the full planned station set. */
  sectionLimit?: number;

  /** Collect operation timing observations without changing geometry. */
  observeWork?: boolean;
}
