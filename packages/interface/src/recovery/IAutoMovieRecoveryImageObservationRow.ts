/**
 * One occupied silhouette row in the supplied camera. Store its center Y and
 * the two outer foreground pixel-cell edges in millimetres.
 */
export interface IAutoMovieRecoveryImageObservationRow {
  /** Finite Y coordinate of the occupied pixel-row center, in millimetres. */
  yMm: number;

  /**
   * Finite lower occupied pixel-cell edge along positive image U, in
   * millimetres.
   */
  lowerMm: number;

  /**
   * Finite upper occupied pixel-cell edge along positive image U, in
   * millimetres. Greater than lowerMm.
   */
  upperMm: number;
}
