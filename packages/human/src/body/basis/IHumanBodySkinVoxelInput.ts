import type { IHumanBodyUnderwearSkinSurface } from "./IHumanBodyUnderwearSkinSurface";

/** Native skin and the bounded garment neighbourhood to sample. */
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
