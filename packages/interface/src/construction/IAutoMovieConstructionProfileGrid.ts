import type { IAutoMovieConstructionProfileLoop } from "./IAutoMovieConstructionProfileLoop";

/** Adaptive station/piece-coordinate grids for original profile tessellation. */
export namespace IAutoMovieConstructionProfileGrid {
  /**
   * One loop's adaptive section tessellation grid. Station rows are regular
   * physical millimetres. Phase marks use each piece's normalized interval.
   * Preserve these arrays while the published body reads them.
   */
  export interface IGrid {
    /**
     * Loop from the prepared definition whose original pieces supply grid
     * points.
     */
    loop: IAutoMovieConstructionProfileLoop;

    /**
     * Increasing regular physical station rows in kernel millimetres, with
     * declared collapsed tips omitted.
     */
    stations: number[];

    /**
     * Normalized [0, 1] coordinates by piece ID, including both endpoints and
     * declared guides. Each piece array is mutable and shared with its
     * consumer.
     */
    phases: ReadonlyMap<string, number[]>;
  }
}
