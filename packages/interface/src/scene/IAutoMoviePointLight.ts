import type { IAutoMovieLightBase } from "./IAutoMovieLightBase";

/**
 * Omnidirectional finite-position light with physical distance falloff and
 * optional infinite influence range.
 */
export interface IAutoMoviePointLight extends IAutoMovieLightBase {
  /** Discriminator. */
  type: "point";

  /** Range in meters beyond which the light contributes nothing. `0` = infinite. */
  range: number;
}
