import type { IAutoMovieStageSetPiece } from "../authoring/IAutoMovieStageSetPiece";
import type { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";

/** Registered prop geometry and staged placement used for world occupancy. */
export namespace IAutoMoviePropOccupancyBounds {
  /**
   * The world-axis-aligned volume one staged prop occupies.
   *
   * A declared `placement.footprint` wins because it is the prop's own
   * statement of what it takes up; otherwise the bound is derived from the
   * prop's own model parts, each placed under its part transform and read
   * through `tessellate` for a primitive. Either way the volume travels through
   * the piece's full staged transform before the world bound is taken, so a
   * rotated prop widens rather than being re-fitted to its local box.
   *
   * Those parts are the prop's geometry, not necessarily what a viewer draws. A
   * prop citing an external appearance keeps its registered deterministic
   * proxy; this engine query does not open imported asset bytes. An explicit
   * footprint states the use volume when the proxy is too crude. If no part
   * carries a vertex, builtPlacedPartBoxes returns a zero box at the staged
   * piece's world origin.
   */
  export type IProps = {
    /**
     * Borrowed registry entry. placement.footprint overrides model geometry;
     * without it, portable model part geometry defines occupancy.
     */
    prop: IAutoMoviePropSpec;
    /**
     * Borrowed staged transform for the same prop node, a correspondence the
     * caller must establish. Full rotation and scale affect the world-axis
     * bound; the output box is newly allocated.
     */
    piece: IAutoMovieStageSetPiece;
  };
}
