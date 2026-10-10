/**
 * Renderer diffusion distances per linear RGB primary, in metres.
 * These radii are appearance parameters, not individually observed photon
 * paths or a calibrated measurement of personal tissue.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkinScattering {
  /** Red primary, metres. */
  r: number;

  /** Green primary, metres. */
  g: number;

  /** Blue primary, metres. */
  b: number;
}
