/**
 * Signed-query data consumed by the contact gradient calculation.
 * The engine owns the geometric hit; this projection adds no surface or side.
 *
 * @evidence contracts/common.md#principled-implementation Native nearest point, side-oriented normal, distances and feature kind provide the contact owner's original signed-gradient calculation.
 * @evidence contracts/common.md#clear-and-simple-design Only the geometric query fields used by readHumanFaceContactGradient are exposed; the engine retains its complete hit representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A pseudonormal orients edge/vertex side but is not its radial distance gradient; readHumanFaceContactGradient makes that distinction rather than treating all normals as clearance directions.
 * @evidence contracts/common.md#meaningful-documentation Members identify metre point/distances and the feature-dependent normal meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This projection type implements no nearest traversal or gradient evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; contact consumes the engine's existing hit.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; hit vectors belong to the current query/correction.
 *
 * @author Samchon
 */
export interface IHumanFaceContactHit {
  /** Nearest point in basis metres. */
  point: number[];

  /** Oriented geometric normal or feature pseudonormal. */
  normal: number[];

  /** Unsigned nearest distance, metres. */
  distance: number;

  /** Oriented nearest distance, metres. */
  signedDistance: number;

  /** Engine feature identity, read to distinguish a face from an edge or vertex. */
  feature: string;
}
