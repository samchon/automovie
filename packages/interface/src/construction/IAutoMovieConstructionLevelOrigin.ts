import type { IAutoMovieConstructionOutline } from "./IAutoMovieConstructionOutline";

/**
 * The horizontal course of a level axis's origin: its `x` and `z` in metres as
 * natural cubic splines of the world height, C2, so the level planes' origins
 * drift smoothly with height.
 *
 * Each outline of the part stays a chart coordinate about this origin, so a
 * breadth or depth measured from the course reads back as given.
 */
export interface IAutoMovieConstructionLevelOrigin {
  /** The origin's `x` per height, metres, knots at named heights. */
  x: IAutoMovieConstructionOutline;

  /** The origin's `z` per height, metres, knots at named heights. */
  z: IAutoMovieConstructionOutline;
}
