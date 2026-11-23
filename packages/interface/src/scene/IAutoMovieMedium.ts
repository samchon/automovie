/**
 * A participating medium filling the scene's air: haze, smoke or dust that dims
 * what lies behind it and glows where the scene's lights cross it.
 *
 * Physical single scattering (Max 1995, "Optical models for direct volume
 * rendering", IEEE Transactions on Visualization and Computer Graphics): along
 * a view ray, light from a surface at distance `s` keeps `exp(−σt × s)` with
 * `σt = scattering + absorption`, and each metre of air adds the scene's light
 * scattered toward the camera, weighted by the Henyey-Greenstein phase function
 * of `anisotropy`. A directly rendered film draws it in its linear beauty
 * target, so a scene with a medium needs the film's `optics`.
 *
 * A scene declares either a medium or the depth `fog`, never both: the fog is a
 * renderer convention that fades toward one colour and reads no light. Staging
 * admits the ranges below; structural passes ignore the medium.
 */
export interface IAutoMovieMedium {
  /**
   * Scattering coefficient σs per metre, finite and at least zero: the share of
   * light per metre redirected by the medium.
   */
  scattering: number;

  /**
   * Absorption coefficient σa per metre, finite and at least zero: the share of
   * light per metre the medium absorbs.
   */
  absorption: number;

  /**
   * The Henyey-Greenstein phase parameter g, within (−1, 1) (Henyey and
   * Greenstein 1941, "Diffuse radiation in the galaxy", Astrophysical Journal
   * 93): 0 scatters equally in every direction, positive values scatter
   * forward, so a light behind the haze glows toward the camera, and negative
   * values scatter back.
   */
  anisotropy: number;
}
