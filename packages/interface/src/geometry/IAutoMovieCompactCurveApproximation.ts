import type { IAutoMovieRegisteredPlanarCurvePiece } from "./IAutoMovieRegisteredPlanarCurvePiece";

/**
 * Planar coefficient-reduction experiment, independent of source meshes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines physical units, source observation knots, coefficient charts and sampled evidence limits.
 * @evidence contracts/development/design.md#principled-representation Discriminated polynomial and positive rational coefficients retain domains and millimetre coordinates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Recovery owns the fitter contract used by the experiment and portable tests; the existing planar source contract is reused.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No specimen, baked observation, mesh fallback or global-minimum claim is represented.
 */

export namespace IAutoMovieCompactCurveApproximation {
  /** Error and finite work controls for a fixed-degree or storage-selected fit.
   * @evidence contracts/development/common.md#meaningful-documentation States geometric tolerance, candidate degrees and distinct output, subdivision and callback budgets.
   * @evidence contracts/development/design.md#principled-representation Closed degree choices prevent unsupported fitting modes; positive finite limits require runtime admission.
   * @evidence contracts/development/design.md#minimal-and-owned-surface These controls are read by the current fitter and comparison consumer.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No specimen preset, hidden quality mode or tolerance relaxation is supplied.
   */
  export interface IOptions {
    /** Maximum admitted held-out correspondence discrepancy, millimetres. */
    toleranceMm: number;

    /** Mixed admits one conic and polynomial degrees three through five. */
    degree: 3 | 4 | 5 | "mixed";

    /** Maximum accepted plus unresolved leaf pieces. */
    maximumPieces: number;

    /** Maximum binary subdivision depth per initial chart. */
    maximumDepth: number;

    /** Maximum source evaluate/derivative invocations, including conic fitting. */
    maximumQueries: number;
  }

  /** Admitted coefficients, omitted-domain status and explicit evidence scope.
   * @evidence contracts/development/common.md#meaningful-documentation Defines completion as sampled fit coverage, not continuous error, topology or likeness certification.
   * @evidence contracts/development/design.md#principled-representation The status union and immutable coefficients distinguish complete, incomplete and empty refused outputs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The comparison consumes every reported measurement, including numeric storage and callback cost.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts certified is always false because held-out samples do not establish continuous Hausdorff bounds.
   */
  export interface IResult {
    /** Whether sampled fitting covered the entire requested domain, only part, or none. */
    status: "complete" | "partial" | "refused";

    /** Ordered admitted coefficient records; omitted domains have no fabricated piece. */
    pieces: readonly IAutoMovieRegisteredPlanarCurvePiece[];

    /** Maximum sampled discrepancy across retained pieces, millimetres; zero when empty. */
    maximumSampleErrorMm: number;

    /** Numeric coefficient/chart count under storedScalars' planar seam-sharing convention. */
    storedScalars: number;

    /** Actual source position and derivative callback invocations, including nested conic fitting. */
    queries: number;

    /** Representation limitations, numerical admission failures and omitted-domain reasons. */
    diagnostics: readonly string[];

    /** Always false: finite fitting/held-out observations are not continuous error certificates. */
    certified: false;
  }
}
