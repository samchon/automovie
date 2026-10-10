/**
 * Authored direction modulation along a scalp lock. Angle and wavelength describe the integrated centreline's desired wave or helix, not a measured natural curl grade, mechanical stress-free shape or physiological capacity. Contact can change the realised path.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairCurl {
  /** Closed choice of planar oscillation or rotating modulation. */
  mode: "wave" | "helix";

  /** Maximum direction deflection in [0,90) degrees; zero is straight. */
  angleDegrees: number;

  /** Positive modulation period in millimetres of centreline arc length. */
  wavelengthMm: number;

  /** Positive arc length in millimetres for the exponential onset. */
  onsetMm: number;
}
