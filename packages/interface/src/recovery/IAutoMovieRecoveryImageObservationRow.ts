/**
 * One measured foreground-support interval in a supplied camera chart.
 * The limits are pixel-cell edges, not corresponding material points between views.
 *
 * @evidence contracts/development/design.md#principled-representation A physical row centre and ordered image-U cell limits retain the measured silhouette envelope for inverse section fitting.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named row contract separates physical measurements from view provenance and fitting coefficients.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An interval neither asserts material-edge correspondence nor fills holes or missing rows.
 * @evidence contracts/development/common.md#meaningful-documentation Defines millimetres, row-centre Y, projected U limits and their strict ordering.
 */
export interface IAutoMovieRecoveryImageObservationRow {
  /** Finite common-frame Y of the occupied pixel-row centre, millimetres. */
  yMm: number;

  /** Finite lower foreground cell edge along positive image U, millimetres. */
  lowerMm: number;

  /** Finite upper foreground cell edge along positive image U, strictly greater than lowerMm, millimetres. */
  upperMm: number;
}
