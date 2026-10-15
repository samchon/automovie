import { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";

/**
 * The faces, UVs, corner coordinates and patch grids of a surface rig's
 * cage as its patches are laid out, from `layoutAutoMovieSurfacePatches`.
 *
 * @evidence contracts/common.md#principled-implementation The per-patch quad grid with face-varying UVs and `(patch, s, t)` corners, the chart every tier shares.
 * @evidence contracts/common.md#clear-and-simple-design The arrays the cage record publishes, filled by one `emit` per patch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `check` refuses overlapping or misoriented patches instead of dropping faces.
 * @evidence contracts/common.md#meaningful-documentation States what each array holds and when to check.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; costs are on its producer.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record whose arrays the cage record takes over.
 * @author Samchon
 */
export interface IAutoMovieSurfaceLayout {
  /** Quads as four vertex indices, counterclockwise seen from outside. */
  faces: number[][];

  /** Packed UV values. */
  uvs: number[];

  /** UV indices per face corner. */
  uvFaces: number[][];

  /** Surface coordinate of each face corner. */
  corners: IAutoMovieSurfaceCage["corners"];

  /** Each patch's grid, by patch index. */
  grids: IAutoMovieSurfaceCage.IPatch[];

  /**
   * Lay out one patch's grid of faces.
   *
   * @param patch Index of the patch in the network
   * @param grid Vertex indices by row from `t` 0 and column from `s` 0
   * @param columns Faces along `s`
   * @param rows Faces along `t`
   * @param wrap Whether column `columns` is column 0, for a patch closing on itself
   */
  emit(patch: number, grid: number[][], columns: number, rows: number, wrap: boolean): void;

  /**
   * Refuse a layout in which a directed edge appears twice.
   *
   * @throws Error when patches overlap or wind inconsistently
   */
  check(): void;
}
