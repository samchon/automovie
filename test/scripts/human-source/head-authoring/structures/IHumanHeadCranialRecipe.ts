/** Source-neutral cranial exterior differences, not reconstructed skull or clinical norms.
 * Values act on the shared licensed source and its joint witnesses.
 * @author Samchon
 */
export interface IHumanHeadCranialRecipe {
  /** Positive millimetres widen the superior vault bilaterally. */
  vaultBreadthOffsetMillimetres: number;

  /** Positive millimetres raise the source vault. */
  vaultHeightOffsetMillimetres: number;

  /** Positive millimetres advance the occipital exterior posteriorly. */
  occipitalProjectionOffsetMillimetres: number;

  /** Degrees of anterior forehead inclination about source glabella. */
  foreheadInclinationOffsetDegrees: number;

  /** Positive millimetres widen the temporal source section bilaterally. */
  temporalBreadthOffsetMillimetres: number;
}
