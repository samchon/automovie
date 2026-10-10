/**
 * Existing metre/radian wave or helix field of a connected numerical hair layer.
 * Contact may change the realised path; this is not stress-free rod mechanics.
 *
 * @author Samchon
 */
export interface IHumanFaceHairLayerCurl {
  /** Planar wave or rotating direction modulation. */
  mode: "wave" | "helix";

  /** Maximum deflection in [0,pi/2) radians. */
  angle: number;

  /** Positive centreline wavelength, metres, with eight integration intervals. */
  wavelength: number;

  /** Positive exponential onset distance, metres. */
  reach: number;
}
