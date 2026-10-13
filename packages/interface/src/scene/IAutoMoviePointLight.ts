import { IAutoMovieLightBase } from "./IAutoMovieLightBase";

/** Omni-directional light radiating from a point, with distance falloff. */
export interface IAutoMoviePointLight extends IAutoMovieLightBase {
  /** Discriminator. */
  type: "point";

  /**
   * Range in meters beyond which the light contributes nothing. `0` = infinite.
   */
  range: number;
}
