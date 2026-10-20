/**
 * One measured foreground-support interval in a supplied camera chart.
 * The limits are pixel-cell edges, not corresponding material points between views.
 *
 * @evidence contracts/common.md#principled-implementation A physical row centre and ordered image-U cell limits retain the measured silhouette envelope for inverse section fitting.
 * @evidence contracts/common.md#clear-and-simple-design One named row contract separates physical measurements from view provenance and fitting coefficients.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An interval neither asserts material-edge correspondence nor fills holes or missing rows.
 * @evidence contracts/common.md#meaningful-documentation Defines millimetres, row-centre Y, projected U limits and their strict ordering.
 */
export interface IAutoMovieRecoveryImageObservationRow {
  /** Finite common-frame Y of the occupied pixel-row centre, millimetres. */
  yMm: number;

  /** Finite lower foreground cell edge along positive image U, millimetres. */
  lowerMm: number;

  /** Finite upper foreground cell edge along positive image U, strictly greater than lowerMm, millimetres. */
  upperMm: number;
}
