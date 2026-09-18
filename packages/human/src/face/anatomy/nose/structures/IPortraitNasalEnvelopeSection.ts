/**
 * One exterior-to-vestibule section around an ordered nasal opening.
 * Width, crest and roll are independent of the opening's fitted position.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates circumferential tissue width, crest position and inward roll instead of assigning one torus section to every nasal margin.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines an ordered unit-perimeter station with metric exterior dimensions and a signed shared-rim tangent angle.
 * @author Samchon
 */
export interface IPortraitNasalEnvelopeSection {
  /** Fraction in [0,1) from the first original cut-boundary vertex, in its winding. */
  at: number;
  /** Positive exterior attachment width, in mm. */
  width: number;
  /** Signed crest relief along the aperture section normal, in mm. */
  crest: number;
  /** Crest distance from the aperture as a fraction of width, strictly in (0,1). */
  crestPosition: number;
  /** Degrees from aperture-plane outward direction towards its outward normal. */
  roll: number;
}
