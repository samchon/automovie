import type { IAutoMovieConicApproximation } from "../index";

/**
 * Planar coefficient-reduction experiment, independent of source meshes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines physical units, source observation knots, coefficient charts and sampled evidence limits.
 * @evidence contracts/development/design.md#principled-representation Discriminated polynomial and positive rational coefficients retain domains and millimetre coordinates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Recovery owns the fitter contract used by the experiment and portable tests; the existing planar source contract is reused.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No specimen, baked observation, mesh fallback or global-minimum claim is represented.
 */

export namespace IAutoMovieCompactCurveApproximation {
  /** Source knots are observation locations, not mandatory output boundaries.
   * The inherited breaks alone identify actual corners that cannot be crossed.
   * @evidence contracts/development/common.md#meaningful-documentation Separates source sampling support from immutable feature boundaries and inherits millimetre callback units.
   * @evidence contracts/development/design.md#principled-representation A readonly interior knot list records piecewise source support without forcing its old representation into the result.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Extends the existing planar callback owner only with support needed by fitting and independent checks.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No source controls or anatomy-specific measurements enter this generic contract.
   */
  export interface ICurve extends IAutoMovieConicApproximation.ICurve {
    /** Every source piece boundary, strictly inside domain, for observation coverage. */
    knots: readonly number[];
  }

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

  /** Source-registered polynomial or bitangent conic coefficient record.
   * Polynomial u=(t-a)/(b-a); a conic's u is its own rational parameter.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes source registration from rational speed and identifies sampled error and millimetre controls.
   * @evidence contracts/development/design.md#principled-representation The closed union requires exactly the fields for polynomial or normalized rational evaluation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One union supports fitting, coefficient-only generation and storage comparison.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No source evaluator or dense sample table is retained in output.
   */
  export type IPiece =
    | {
        /** Selects polynomial Bernstein evaluation and linear source registration. */
        kind: "polynomial";

        /** Actual polynomial degree; there are degree plus one planar controls. */
        degree: 3 | 4 | 5;

        /** Ordered original source interval, in the callback's parameter unit. */
        domain: readonly [number, number];

        /** Bernstein controls in the source's planar millimetre coordinate frame. */
        controls: readonly IAutoMovieConicApproximation.Point[];

        /** Largest observed fitting/held-out correspondence discrepancy, millimetres. */
        maximumSampleErrorMm: number;
      }
    | {
        /** Selects rational quadratic evaluation with independent local speed. */
        kind: "conic";

        /** Source interval represented by this conic, without equal-speed implication. */
        domain: readonly [number, number];

        /** Planar millimetre endpoint, tangent intersection, endpoint coefficients. */
        controls: readonly [
          IAutoMovieConicApproximation.Point,
          IAutoMovieConicApproximation.Point,
          IAutoMovieConicApproximation.Point,
        ];

        /** Positive dimensionless middle weight; both endpoint weights are one. */
        weight: number;

        /** Largest fitting/held-out radial correspondence discrepancy, millimetres. */
        maximumSampleErrorMm: number;
      };

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
    pieces: readonly IAutoMovieCompactCurveApproximation.IPiece[];

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
