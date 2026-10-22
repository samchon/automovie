import type { AutoMovieRecoveryCurveFormat } from "../../typings/AutoMovieRecoveryCurveFormat";
import type { IAutoMovieRecoverySlabObservation } from "../observation/IAutoMovieRecoverySlabObservation";
import type { IAutoMovieRecoverySourceLineage } from "../observation/IAutoMovieRecoverySourceLineage";

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

  /**
   * Receive copied source incidence once per observed section contour, outside the coefficient result. The callback runs synchronously after fitting or local rejection; throwing fails observation, and records already delivered remain provisional until a successful terminal result. Cancellation can stop delivery before the next contour. The caller owns callback cost and any retained records.
   *
   * @evidence contracts/common.md#principled-implementation Existing contour incidence supplies original triangle addresses and exact publication indices without altering fitting or reconstruction.
   * @evidence contracts/common.md#clear-and-simple-design Acquisition provenance has one optional observer and stays outside source-free coefficients.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback supplies no geometry or part classification and cannot replace generated coefficients.
   * @evidence contracts/common.md#meaningful-documentation States synchronous delivery, source ownership, provisional records, cancellation and failure effects.
   * @evidence contracts/performance.md#efficient-algorithms Enabled delivery copies each contour's F incident face IDs in O(F) time and storage; omitted delivery allocates no lineage record or face copy. Callback work has no package-enforced bound.
   * @evidence contracts/performance.md#reuse-equivalent-work Existing per-contour face support is reused; callbacks are effects delivered once per visited contour and are never cached.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The operation retains the callback only for its synchronous call. Copied IDs transfer to the observer, which owns any retention; no listener or timer is registered.
   */
  onSourceLineage?: (observation: IAutoMovieRecoverySourceLineage) => void;

  /**
   * Receive acquisition-only incidence for every requested source slab after section processing. Delivery is synchronous and provisional until the operation succeeds; throwing fails the operation, and callback-triggered cancellation stops later delivery. Copied source addresses stay outside the coefficient value. Slab-only observation binds saved publications without fitting and delivers independent metadata copies.
   *
   * @evidence contracts/common.md#principled-implementation Existing clipped source-cell topology and PL critical owners supply exact port and event evidence on the admitted scalar chart.
   * @evidence contracts/common.md#clear-and-simple-design One optional observer separates acquisition metadata from generated coefficient input.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The observer supplies no source geometry, normals, inferred cap or physical-jet fallback.
   * @evidence contracts/common.md#meaningful-documentation States delivery order, provisional ownership, callback exceptions and cooperative cancellation.
   * @evidence contracts/performance.md#efficient-algorithms One invocation per requested slab adds caller-owned work with no package-enforced cost bound; omitted slab requests perform no slab observation.
   * @evidence contracts/performance.md#reuse-equivalent-work Slab source preparation is reused within one observation; effectful callback delivery is never cached across calls.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The operation retains the observer only during its synchronous call; the observer owns any retained copied records and no listener or timer is registered.
   */
  onSourceSlab?: (observation: IAutoMovieRecoverySlabObservation) => void;

  /** Explicit incomplete observation prefix; omitted for the full planned station set. */
  sectionLimit?: number;

  /** Collect operation timing observations without changing geometry. */
  observeWork?: boolean;
}
