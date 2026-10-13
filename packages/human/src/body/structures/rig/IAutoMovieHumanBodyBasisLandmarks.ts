/**
 * Shape-dependent joint landmarks in the common right-handed, Y-up,
 * Z-forward body and face frame, in metres.
 *
 * The current study uses centroids of its source joint cubes as points;
 * its extraction receipt records their origin and the common collar frame.
 * `evaluateHumanBodyShape` applies the same endpoint names to landmarks and
 * skin so `resolveHumanBodySkeleton` places pivots after shape evaluation.
 * Sparse `[landmark, dx, dy, dz]` rows index `ids`, and a basis revision must
 * change when these positions or rows change. A landmark is a rig estimate,
 * not an independently imaged articular centre.
 *
 * @evidence contracts/common.md#principled-implementation Flat XYZ landmark positions and sparse endpoint rows share basis revision and shape evaluation with the skin.
 * @evidence contracts/common.md#clear-and-simple-design Stable landmark ids separate source identity from sparse indexed offsets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rig estimates are not independently imaged articular centres and are not promoted to such by this schema.
 * @evidence contracts/common.md#meaningful-documentation The comment gives the common frame, metre units, sparse row order and revision invalidation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape-dependent landmark schema declares data and signatures without implementing runtime algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape-dependent landmark schema declaration shares no computations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The shape-dependent landmark schema type has no runtime acquisition, retention or release operation.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisLandmarks {
  /** Stable names used by joints and authored shape endpoints. */
  ids: string[];

  /** Flat XYZ per landmark, in the basis frame. */
  positions: number[];

  /** Sparse rows per endpoint name, strictly increasing by landmark. */
  targets: Record<string, number[]>;
}
