import type { AutoMovieViewLoftInputsQuarters } from "./AutoMovieViewLoftInputsQuarters";
import type { AutoMovieViewLoftInputsScalar } from "./AutoMovieViewLoftInputsScalar";

/**
 * Raw signed lengths and fullness readers prepared for ViewLoft and cap-ring
 * spacing. Pass physical station in millimetres. Preserve the prepared sources
 * while the callbacks use them. A source read failure reports its identity and
 * returns NaN. Quarter readers return fresh arrays.
 */
export interface IAutoMovieViewLoftInputsInputs {
  /**
   * Front-positive u outline in chart millimetres, with its source sign and
   * declared pole coordinate.
   */
  lateral: AutoMovieViewLoftInputsScalar;

  /**
   * Front-negative u outline in chart millimetres. ViewLoft negates this raw
   * value to obtain the −u box extent.
   */
  medial: AutoMovieViewLoftInputsScalar;

  /**
   * Side-positive v outline in chart millimetres, with its original pole
   * coordinate.
   */
  ahead: AutoMovieViewLoftInputsScalar;

  /**
   * Side-negative v outline in chart millimetres. ViewLoft negates the signed
   * value to obtain the −v box extent.
   */
  behind: AutoMovieViewLoftInputsScalar;

  /**
   * Original girth in millimetres in girth mode, common dimensionless share in
   * shoulder mode, or zero in top mode. Top mode uses its four direct shares.
   */
  owner: AutoMovieViewLoftInputsScalar;

  /**
   * Four direct top shares or shared-law departures, in cyclic quarter order.
   * Omitted departures read as four zeros.
   */
  shoulders: AutoMovieViewLoftInputsQuarters;
}
