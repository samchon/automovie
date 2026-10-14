/**
 * One material point on an actual host triangle, retained independently of
 * reference geometry. Coordinates are the triangle's ordered dimensionless
 * barycentric weights; the runtime reads its current corners.
 *
 * @evidence contracts/common.md#principled-implementation Exact host-triangle ordinal and ordered dimensionless barycentric weights identify a material seat whose current corners supply geometry, independently of reference spatial position.
 * @evidence contracts/common.md#clear-and-simple-design A triangle/weights pair is the reusable attachment primitive; the containing chart supplies host/generation identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No free point, closest-triangle repair or coordinate-based welding replaces source incidence. The chart reader validates three finite unit-interval weights and their unit sum; this number-array schema itself does not.
 * @evidence contracts/common.md#meaningful-documentation The comment states material/reference independence and ordered dimensionless coordinates; members identify host ordinal and three original corners.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface performs no barycentric interpolation or triangle search.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A material seat defines correspondence without caching current geometry or repeated interpolation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The source owner holds the weight array; this type acquires no host mesh or retained query task.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceAttachmentPoint {
  /** Triangle ordinal of the registered host index buffer. */
  triangle: number;

  /** Ordered weights for the host triangle's three original corners. */
  weights: number[];
}
