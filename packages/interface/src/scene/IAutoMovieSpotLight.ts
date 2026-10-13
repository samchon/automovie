import { IAutoMovieLightBase } from "./IAutoMovieLightBase";

/** Cone-shaped light from a point in a direction. */
export interface IAutoMovieSpotLight extends IAutoMovieLightBase {
  /** Discriminator. */
  type: "spot";

  /**
   * Range in meters beyond which the light contributes nothing. `0` = infinite.
   */
  range: number;

  /** Half-angle of the cone in degrees, `(0, 90]`. */
  coneAngle: number;
}
