import { IAutoMovieLightBase } from "./IAutoMovieLightBase";

/**
 * Aimed punctual source with finite-position falloff and a declared emission cone.
 *
 * @evidence contracts/common.md#principled-implementation Spot discrimination combines shared position/orientation and candela intensity with a non-negative meter range and positive cone half-angle no greater than ninety degrees.
 * @evidence contracts/common.md#clear-and-simple-design Range and cone are the only extra fields because shadow controls and common emission remain inherited light state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cone is a half-angle in degrees, not a guessed full angle; zero range explicitly means unbounded influence rather than a missing field default.
 * @evidence contracts/common.md#meaningful-documentation Defines aimed cone geometry, meter range and infinite-zero and half-angle bounds.
 */
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
