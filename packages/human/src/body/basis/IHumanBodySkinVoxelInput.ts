import type { IHumanBodyUnderwearSkinSurface } from "./IHumanBodyUnderwearSkinSurface";

/**
 * Native skin and the bounded garment neighbourhood to sample.
 *
 * @evidence contracts/common.md#principled-implementation Actual posed triangles and garment XYZ points define a common-frame neighborhood with meter padding and cubic cell length.
 * @evidence contracts/common.md#clear-and-simple-design This voxel input separates native skin geometry from the garment-defined sampling domain.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing skin closing faces are not invented and neighborhood sampling cannot redefine original reference topology.
 * @evidence contracts/common.md#meaningful-documentation Members give posed reference meaning, meter frame, padding and cell-side units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Voxel input typing performs no spatial partitioning or triangle-clearance evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Neighborhood operands describe one sampling request without storing equivalent voxel query results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The carrier owns no voxel array, native triangle hierarchy or sampling task.
 * @author Samchon
 */
export interface IHumanBodySkinVoxelInput {
  /** Actual posed reference triangles; no synthetic closing face is added. */
  skin: readonly IHumanBodyUnderwearSkinSurface[];

  /** Flat XYZ garment points in the same metre frame as the reference skin. */
  points: readonly number[];

  /** Existing neighbourhood padding around garment points, metres. */
  pad: number;

  /** Existing cubic voxel side length, metres. */
  cell: number;
}
