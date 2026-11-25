import type { IAutoMovieConstructionProfileLoop } from "./IAutoMovieConstructionProfileLoop";

/** Adaptive station/piece-coordinate grids for original profile tessellation. */
export namespace IAutoMovieConstructionProfileGrid {
  /**
   * Tessellation marks of one actual loop; true collapsed rows stay separate
   * from regular face grids.
   *
   * Arrays are freshly built and mutable; the loop is borrowed from the
   * prepared definition. ProfileBody retains station arrays and nonperiodic
   * phase arrays, so callers must not alter them after publication.
   */
  export interface IGrid {
    /** Same copied declaration whose original functions were sampled. */
    loop: IAutoMovieConstructionProfileLoop;

    /**
     * Strictly increasing regular station rows in millimetres; declared
     * collapsed endpoints are omitted.
     */
    stations: number[];

    /**
     * Piece IDs map to increasing coordinates including 0 and 1 and every
     * declared guide; each array is mutable despite the readonly map view.
     */
    phases: ReadonlyMap<string, number[]>;
  }
}
