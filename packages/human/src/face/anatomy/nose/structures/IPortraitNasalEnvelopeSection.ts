/**
 * One exterior-to-vestibule section around an ordered nasal opening.
 * Width, crest and roll are independent of the opening's fitted position.
 *
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
