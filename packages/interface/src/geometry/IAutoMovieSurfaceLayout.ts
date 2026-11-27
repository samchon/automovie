import type { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";

/**
 * The faces, UVs, corner coordinates and patch grids of a surface rig's cage as
 * its patches are laid out, from `layoutAutoMovieSurfacePatches`.
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
   * @param wrap Whether column `columns` is column 0, for a patch closing on
   *   itself
   */
  emit(
    patch: number,
    grid: number[][],
    columns: number,
    rows: number,
    wrap: boolean,
  ): void;

  /**
   * Lay out a patch whose faces are not a grid, each corner with its own patch
   * coordinates.
   *
   * @param patch Index of the patch in the network
   * @param quads Each face's four corners counterclockwise: vertex index and
   *   patch coordinates
   * @param columns The count the patch's record reports along `s`
   * @param rows The count the patch's record reports along `t`
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
   */
  check(): void;
}
