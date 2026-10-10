/**
 * The occupied-site distance transform consumed by garment voxel queries.
 * Squared distances retain grid-cell units; actual triangle clearance remains
 * the separate metre-valued query owned by the posed skin sampler.
 */
export interface IHumanBodySkinVoxelDistance {
  /** Squared distance to the nearest occupied voxel site, in cell units. */
  squared: Float64Array;

  /** Nearest occupied voxel ordinal; -1 retains the original no-site result. */
  source: Int32Array;
}
