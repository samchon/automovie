import type { IAutoMovieMotionHumanLieDown } from "../floor/IAutoMovieMotionHumanLieDown";

/**
 * Preset data for floor action laws.
 */
export namespace IAutoMovieMotionHumanFloor {
  /**
   * The kind and hold that a named lying or sitting down fixes: the `kind` and
   * `hold` of `lieDown`. Spread into `lieDown`'s parameters;
   * `AutoMovieMotionHumanFloor.SIT_ON_FLOOR`, `SIT_CROSS_LEGGED`,
   * `SIT_SIDEWAYS` and `LIE_STILL` are its data and the rows of the same names
   * read them.
   */
  export type ILieDownPreset = Pick<
    IAutoMovieMotionHumanLieDown.IParams,
    "kind" | "hold"
  >;
}
