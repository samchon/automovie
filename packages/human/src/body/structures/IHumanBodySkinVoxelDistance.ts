/**
 * The occupied-site distance transform consumed by garment voxel queries.
 * Squared distances retain grid-cell units; actual triangle clearance remains
 * the separate metre-valued query owned by the posed skin sampler.
 *
 * @evidence contracts/common.md#principled-implementation Squared grid distances and their actual site ordinals travel together without converting them into triangle clearance.
 * @evidence contracts/common.md#clear-and-simple-design One existing distance pair has one named carrier.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original distance and no-site values are retained without substituted sites.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes sampled grid units, site identity and the separate continuous metre query.
 * @evidence contracts/modeling.md#spatial-conventions Squared distances use voxel-cell units; source ordinals are dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical grid readings define no body or garment part.
 * @evidenceExclude contracts/modeling.md#parameter-channels This carrier adds no authoring control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The arrays contain numerical samples, not emitted primitives.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The existing skin sampler and garment owner define surfaces.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical readings have no independent rendered appearance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The carrier adds no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Grid readings do not bound anatomical values.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Callers cannot author personal anatomy through these result arrays.
 */
export interface IHumanBodySkinVoxelDistance {
  /** Squared distance to the nearest occupied voxel site, in cell units. */
  squared: Float64Array;

  /** Nearest occupied voxel ordinal; -1 retains the original no-site result. */
  source: Int32Array;
}
