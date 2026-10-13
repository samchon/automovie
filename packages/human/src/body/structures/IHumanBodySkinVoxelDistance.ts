/**
 * The occupied-site distance transform consumed by garment voxel queries.
 * Squared distances retain grid-cell units; actual triangle clearance remains
 * the separate metre-valued query owned by the posed skin sampler.
 *
 * @evidence contracts/common.md#principled-implementation Squared distances and nearest occupied ordinals describe a sampled-site distance transform, separately from actual triangle clearance.
 * @evidence contracts/common.md#clear-and-simple-design The two aligned typed arrays expose the transform data required by garment queries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A negative source ordinal preserves the no-site result rather than inventing a skin witness.
 * @evidence contracts/common.md#meaningful-documentation Members state squared cell units and the minus-one absence sentinel.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The occupied voxel distance record declares data and signatures without implementing runtime algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The occupied voxel distance record declaration shares no computations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The occupied voxel distance record type has no runtime acquisition, retention or release operation.
 *
 * @author Samchon
 */
export interface IHumanBodySkinVoxelDistance {
  /** Squared distance to the nearest occupied voxel site, in cell units. */
  squared: Float64Array;

  /** Nearest occupied voxel ordinal; -1 retains the original no-site result. */
  source: Int32Array;
}
