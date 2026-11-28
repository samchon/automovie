import type { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";

/**
 * Mutable cage layout writer with vertex quads, UV buffers and one normalized
 * chart per face corner.
 *
 * Emit faces before checking the accumulated directed edges. At a wrapped grid
 * seam, the same geometry ordinal can carry distinct UV values on either side.
 */
export interface IAutoMovieSurfaceLayout {
  /**
   * Accumulated quads of zero-based cage vertex ordinals in the patch's
   * counterclockwise chart order.
   */
  faces: number[][];

  /**
   * Packed UV pairs generated from each patch texture rectangle or its default
   * band of the unit square.
   */
  uvs: number[];

  /** Zero-based UV pair ordinals in the same face and corner order as faces. */
  uvFaces: number[][];

  /**
   * Parallel patch addresses for each face's four corners, indexed by face and
   * local corner.
   */
  corners: IAutoMovieSurfaceCage["corners"];

  /**
   * One accumulated patch layout at each emitted network patch ordinal,
   * carrying that patch's original name and face list.
   */
  grids: IAutoMovieSurfaceCage.IPatch[];

  /**
   * Append one regular patch as row-major quads, with s across columns and t
   * across rows.
   *
   * @param patch Ordinal of the network patch.
   * @param grid Cage vertex ordinals by row and column from zero.
   * @param columns Positive face count along s.
   * @param rows Positive face count along t.
   * @param wrap Whether the last geometry column wraps to the first.
   */
  emit(
    patch: number,
    grid: number[][],
    columns: number,
    rows: number,
    wrap: boolean,
  ): void;

  /**
   * Append explicit charted quads for a non-grid patch, preserving input face
   * and corner order.
   *
   * @param patch Ordinal of the network patch.
   * @param quads Four triples per face in chart winding order, each with vertex
   *   ordinal, s and t.
   * @param columns Column count recorded in the patch layout.
   * @param rows Row count recorded in the patch layout.
   */
  emitFaces(
    patch: number,
    quads: Array<Array<[number, number, number]>>,
    columns: number,
    rows: number,
  ): void;

  /**
   * Throw when an ordered cage edge occurs more than once in the accumulated
   * faces.
   *
   * @throws Error identifying the first repeated directed edge.
   */
  check(): void;
}
