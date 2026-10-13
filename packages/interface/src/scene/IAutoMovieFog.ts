import { IAutoMovieColor } from "../color/IAutoMovieColor";

/**
 * Scene-wide exponential-squared depth fog matching the viewer's FogExp2 projection.
 *
 * Transmittance is `T(d) = exp(-(density * d)^2)` and the rendered color is `subject * T(d) + color * (1 - T(d))`, where `d` is camera-axis depth rather than radial distance. The squared law is the renderer's convention rather than physical Beer-Lambert extinction and gives equal attenuation to opposite signed depths.
 *
 * Density is inverse metres; half-transmittance occurs at `sqrt(ln(2)) / density`, approximately `0.8326 / density` metres. Zero density gives unit transmission.
 *
 * @evidence contracts/common.md#principled-implementation The shared fog transmittance uses exp of negative squared density-times-camera-depth to match the viewer's FogExp2 shader, with inverse-meter density and zero as unit transmission.
 * @evidence contracts/common.md#clear-and-simple-design One scene-wide density and linear target color describe the supported depth cue without per-region particle or volumetric simulation data.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This squared-depth renderer law is not physical Beer-Lambert extinction and treats opposite signed depths equally; structural guide passes suspend fog rather than tint exact geometry evidence.
 * @evidence contracts/common.md#meaningful-documentation Defines camera-axis depth, density units, transmittance and half-visibility formulas, zero state and linear color with unused alpha.
 * @author Samchon
 */
export interface IAutoMovieFog {
  /**
   * Extinction coefficient per meter, `>= 0`. Half-visibility sits at `0.8326 / density` meters; `0` is a vacuum.
   */
  density: number;

  /**
   * The color the atmosphere tends to at full extinction: what an infinitely distant subject becomes. Linear components, like every other {@link IAutoMovieColor}; the alpha slot is opacity-irrelevant here, so `null` is its ordinary value.
   *
   * A scene usually wants this to match its background, otherwise the horizon cuts a visible seam where fogged geometry meets unfogged sky.
   */
  color: IAutoMovieColor;
}
