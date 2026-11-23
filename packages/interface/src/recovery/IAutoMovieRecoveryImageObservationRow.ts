/**
 * One measured foreground-support interval in a supplied camera chart. The
 * limits are pixel-cell edges, not corresponding material points between
 * views.
 */
export interface IAutoMovieRecoveryImageObservationRow {
  /** Finite common-frame Y of the occupied pixel-row centre, millimetres. */
  yMm: number;

  /** Finite lower foreground cell edge along positive image U, millimetres. */
  lowerMm: number;

  /**
   * Finite upper foreground cell edge along positive image U, strictly greater
   * than lowerMm, millimetres.
   */
  upperMm: number;
}
