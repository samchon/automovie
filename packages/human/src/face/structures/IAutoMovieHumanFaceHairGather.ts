/**
 * One scalp tie and its free tail, expressed as angular styling measurements.
 * The actual tie is the shared growth chart's outward ray hit on current scalp,
 * not a private coordinate or saved vertex. Angles are authored styling targets,
 * not measured follicle anatomy; no clinical protocol or population fit is
 * asserted. The existing contact owner supplies the current attachment.
 *
 * @evidence contracts/common.md#principled-implementation Two angles select one ray from the shared chart origin and named lengths define gathering and tail spread; the current scalp owns the hit.
 * @evidence contracts/common.md#clear-and-simple-design One numerical tie record introduces no guide curve or personal anchor coordinate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tie vertex or hidden bundle geometry is authored.
 * @evidence contracts/common.md#meaningful-documentation States ray ownership, units, absent spread and the scientific limitation.
 * @evidence contracts/modeling.md#parameter-channels Tie location, attraction and free-tail spread vary independent named styling traits.
 * @evidence contracts/modeling.md#spatial-conventions Polar degrees start at +Y; azimuth degrees run from +Z toward +X in the neutral head frame. Lengths are millimetres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The population layer owns hair identity.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The existing gather and hair owners emit geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Existing ray-hit registration constructs the current tie attachment.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair assembly observes realised gathering.
 * @evidence contracts/anatomy.md#anatomical-source Values are authored styling measurements without biological population calibration or acquisition protocol; clinical capacity is unknown.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing gather admission bounds numerical representation.
 * @evidence contracts/anatomy.md#parametric-authority Only angular location, named lengths and a closed tail direction enter; no private point or curve enters.
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
