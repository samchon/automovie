import { IAutoMovieLightBase } from "./IAutoMovieLightBase";

/**
 * Omnidirectional finite-position light with physical distance falloff and optional infinite influence range.
 *
 * @evidence contracts/common.md#principled-implementation Point discrimination uses world translation and candela intensity with a finite non-negative range, where zero preserves unbounded influence and positive range cuts contribution off.
 * @evidence contracts/common.md#clear-and-simple-design Adds only range to the shared light contract because no aimed cone or rectangular extent belongs to a point source.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero range is the explicit infinite-range state rather than an inferred scene scale; unsupported VSM point-shadow combinations refuse under scene policy.
 * @evidence contracts/common.md#meaningful-documentation Defines omnidirectional emission, world position and meter range with zero meaning infinity.
 */
export interface IAutoMoviePointLight extends IAutoMovieLightBase {
  /** Discriminator. */
  type: "point";

  /**
   * Range in meters beyond which the light contributes nothing. `0` = infinite.
   */
  range: number;
}
