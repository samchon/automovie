import { IAutoMovieLightBase } from "./IAutoMovieLightBase";

/**
 * Aimed punctual source with finite-position falloff and a declared emission cone.
 *
 * @evidence contracts/development/design.md#principled-representation Spot discrimination combines shared position/orientation and candela intensity with a non-negative meter range and positive cone half-angle no greater than ninety degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Range and cone are the only extra fields because shadow controls and common emission remain inherited light state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Cone is a half-angle in degrees, not a guessed full angle; zero range explicitly means unbounded influence rather than a missing field default.
 * @evidence contracts/development/common.md#meaningful-documentation Defines aimed cone geometry, meter range and infinite-zero and half-angle bounds.
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
