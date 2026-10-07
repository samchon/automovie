/**
 * Coarse visible regional skin relief on the connected source. Persistent
 * signed offset is separate from additional fold depth and its independent
 * performed fraction. These are authored millimetres, never ordinal clinical
 * grades or an inferred age-to-tissue conversion.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceRegionalRelief {
  /** Persistent outward ridge (+) or inward hollow (-) along the current host normal, finite mm. */
  restOffsetMm?: number;
  /** Extra inward depth along the current host normal at full performance, nonnegative finite mm. */
  foldDepthMm?: number;
  /** Independent performed fold fraction, [0,1]; omission is resting. */
  performance?: number;
  /** Compact three-dimensional support radius, positive finite mm. */
  widthMm: number;
  /** Forehead transverse or glabellar vertical guide length, positive mm. */
  lengthMm?: number;
  /** Forehead guide height above current source glabella, nonnegative mm. */
  elevationMm?: number;
}
