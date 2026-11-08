import { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";

/**
 * The faces, UVs, corner coordinates and patch grids of a surface rig's
 * cage as its patches are laid out, from `layoutAutoMovieSurfacePatches`.
 *
 * @evidence contracts/development/design.md#principled-representation The per-patch quad grid with face-varying UVs and `(patch, s, t)` corners, the chart every tier shares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The arrays the cage record publishes, filled by one `emit` per patch.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `check` refuses overlapping or misoriented patches instead of dropping faces.
 * @evidence contracts/development/common.md#meaningful-documentation States what each array holds and when to check.
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
   *
   * @evidence contracts/development/implementation.md#principled-implementation Adds a structured grid of quads with its chart coordinates and UVs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call per patch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Faces are emitted as given; overlaps are caught by `check`.
   * @evidence contracts/development/common.md#meaningful-documentation States every argument.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(rows x columns).
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature; reuse is answered on `layoutAutoMovieSurfacePatches`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature; retention is answered on `layoutAutoMovieSurfacePatches`.
   */
  emit(
    patch: number,
    grid: number[][],
    columns: number,
    rows: number,
    wrap: boolean,
  ): void;

  /**
   * Lay out a patch whose faces are not a grid, each corner with its own patch coordinates.
   *
   * @param patch Index of the patch in the network
   * @param quads Each face's four corners counterclockwise: vertex index and patch coordinates
   * @param columns The count the patch's record reports along `s`
   * @param rows The count the patch's record reports along `t`
   *
   * @evidence contracts/development/implementation.md#principled-implementation Faces of a non-grid block keep the same `(patch, s, t)` chart, carried per corner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call per patch, like `emit`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Corners sharing coordinates share one UV value, so the patch has no texture seam inside it.
   * @evidence contracts/development/common.md#meaningful-documentation States the corner record and the counts reported.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(faces) with one map lookup per corner.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature; reuse is answered on `layoutAutoMovieSurfacePatches`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature; retention is answered on `layoutAutoMovieSurfacePatches`.
   */
  emitFaces(
    patch: number,
    quads: Array<Array<[number, number, number]>>,
    columns: number,
    rows: number,
  ): void;

  /**
   * Refuse a layout in which a directed edge appears twice.
   *
   * @throws Error when patches overlap or wind inconsistently
   *
   * @evidence contracts/development/implementation.md#principled-implementation A consistently wound manifold has each directed edge once.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Violations are refused, not repaired.
   * @evidence contracts/development/common.md#meaningful-documentation States the refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(F).
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature; reuse is answered on `layoutAutoMovieSurfacePatches`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature; retention is answered on `layoutAutoMovieSurfacePatches`.
   */
  check(): void;
}
