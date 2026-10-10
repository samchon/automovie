/**
 * One scalp tie and its free tail, expressed as angular styling measurements.
 * The actual tie is the shared growth chart's outward ray hit on current scalp,
 * not a private coordinate or saved vertex. Angles are authored styling targets,
 * not measured follicle anatomy; no clinical protocol or population fit is
 * asserted. The existing contact owner supplies the current attachment.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairGather {
  /** Tie ray polar angle from superior in [0,180] degrees. */
  polarDegrees: number;

  /** Tie ray azimuth from anterior toward anatomical left in [-180,180] degrees. */
  azimuthDegrees: number;

  /** Positive tie neighbourhood radius in millimetres. */
  radiusMm: number;

  /** Gathering attraction in (0,1], relative to the ordinary comb field. */
  strength: number;

  /** Direction of the free tail in the head frame after entering the tie. */
  tailDirection: "back" | "front" | "left" | "right" | "down";

  /** Optional nonnegative free-tail cross-section radius in millimetres; requires spreadReachMm. */
  spreadRadiusMm?: number;

  /** Optional positive spread transition arc length in millimetres; requires spreadRadiusMm. */
  spreadReachMm?: number;
}
