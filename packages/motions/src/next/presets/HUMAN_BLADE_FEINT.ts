import type { IAutoMovieMotionHumanBlade } from "@automovie/interface";

/*
 * The feint preset: a cut carried to half its delivery (provisional) and
 * withdrawn. The `feint` row of `HumanBlade` reads it, so the row and the
 * preset share one value.
 */
export const HUMAN_BLADE_FEINT: IAutoMovieMotionHumanBlade.IFeintPreset = {
  feint: 0.5,
};
