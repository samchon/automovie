import type { IAutoMovieLightBase } from "./IAutoMovieLightBase";

/**
 * Aimed punctual source with finite-position falloff and a declared emission
 * cone.
 */
export interface IAutoMovieSpotLight extends IAutoMovieLightBase {
  /** Discriminator. */
  type: "spot";

  /** Range in meters beyond which the light contributes nothing. `0` = infinite. */
  range: number;

  /** Half-angle of the cone in degrees, `(0, 90]`. */
  coneAngle: number;
}
