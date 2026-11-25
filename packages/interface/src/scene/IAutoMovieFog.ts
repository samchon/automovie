import type { IAutoMovieColor } from "../color/IAutoMovieColor";

/**
 * Scene-wide exponential-squared depth fog matching the viewer's FogExp2
 * projection.
 *
 * Transmittance is `T(d) = exp(-(density * d)^2)` and the rendered color is
 * `subject * T(d) + color * (1 - T(d))`, where `d` is camera-axis depth rather
 * than radial distance. The squared law is the renderer's convention rather
 * than physical Beer-Lambert extinction and gives equal attenuation to opposite
 * signed depths.
 *
 * Density is inverse metres; half-transmittance occurs at `sqrt(ln(2)) /
 * density`, approximately `0.8326 / density` metres. Zero density gives unit
 * transmission.
 */
export interface IAutoMovieFog {
  /**
   * Finite nonnegative squared-depth fog density in inverse metres.
   * Half-transmittance is approximately 0.8326/density metres for positive
   * density; zero gives unit transmission in this renderer convention, not a
   * measured vacuum.
   */
  density: number;

  /**
   * The color the atmosphere tends to at full extinction: what an infinitely
   * distant subject becomes. Linear components, like every other
   * {@link IAutoMovieColor}; the alpha slot is opacity-irrelevant here, so
   * `null` is its ordinary value.
   *
   * A scene usually wants this to match its background, otherwise the horizon
   * cuts a visible seam where fogged geometry meets unfogged sky.
   */
  color: IAutoMovieColor;
}
