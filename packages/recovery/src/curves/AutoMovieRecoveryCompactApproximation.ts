import { AutoMovieBernstein64 as B } from "@automovie/engine";

import { AutoMovieRecoveryConicApproximation as Conic } from "./AutoMovieRecoveryConicApproximation";

/**
 * Planar coefficient-reduction experiment, independent of source meshes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines physical units, source observation knots, coefficient charts and sampled evidence limits.
 * @evidence contracts/development/design.md#principled-representation Discriminated polynomial and positive rational coefficients retain domains and millimetre coordinates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Recovery owns the fitter contract used by the experiment and portable tests; the existing planar source contract is reused.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No specimen, baked observation, mesh fallback or global-minimum claim is represented.
 */
export namespace AutoMovieRecoveryCompactApproximation {
  /**
   * Source knots are observation locations, not mandatory output boundaries.
   * The inherited breaks alone identify actual corners that cannot be crossed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Separates source sampling support from immutable feature boundaries and inherits millimetre callback units.
   * @evidence contracts/development/design.md#principled-representation A readonly interior knot list records piecewise source support without forcing its old representation into the result.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Extends the existing planar callback owner only with support needed by fitting and independent checks.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No source controls or anatomy-specific measurements enter this generic contract.
   */
  export interface ICurve extends Conic.ICurve {
    /** Every source piece boundary, strictly inside domain, for observation coverage. */
    knots: readonly number[];
  }

  /**
   * Error and finite work controls for a fixed-degree or storage-selected fit.
   *
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

  /**
   * Source-registered polynomial or bitangent conic coefficient record.
   * Polynomial u=(t-a)/(b-a); a conic's u is its own rational parameter.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes source registration from rational speed and identifies sampled error and millimetre controls.
   * @evidence contracts/development/design.md#principled-representation The closed union requires exactly the fields for polynomial or normalized rational evaluation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One union supports fitting, coefficient-only generation and storage comparison.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No source evaluator or dense sample table is retained in output.
   */
  export type IPiece = {
    /** Selects polynomial Bernstein evaluation and linear source registration. */
    kind: "polynomial";
    /** Actual polynomial degree; there are degree plus one planar controls. */
    degree: 3 | 4 | 5;
    /** Ordered original source interval, in the callback's parameter unit. */
    domain: readonly [number, number];
    /** Bernstein controls in the source's planar millimetre coordinate frame. */
    controls: readonly Conic.Point[];
    /** Largest observed fitting/held-out correspondence discrepancy, millimetres. */
    maximumSampleErrorMm: number;
  } | {
    /** Selects rational quadratic evaluation with independent local speed. */
    kind: "conic";
    /** Source interval represented by this conic, without equal-speed implication. */
    domain: readonly [number, number];
    /** Planar millimetre endpoint, tangent intersection, endpoint coefficients. */
    controls: readonly [Conic.Point, Conic.Point, Conic.Point];
    /** Positive dimensionless middle weight; both endpoint weights are one. */
    weight: number;
    /** Largest fitting/held-out radial correspondence discrepancy, millimetres. */
    maximumSampleErrorMm: number;
  };

  /**
   * Admitted coefficients, omitted-domain status and explicit evidence scope.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines completion as sampled fit coverage, not continuous error, topology or likeness certification.
   * @evidence contracts/development/design.md#principled-representation The status union and immutable coefficients distinguish complete, incomplete and empty refused outputs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The comparison consumes every reported measurement, including numeric storage and callback cost.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts certified is always false because held-out samples do not establish continuous Hausdorff bounds.
   */
  export interface IResult {
    /** Whether sampled fitting covered the entire requested domain, only part, or none. */
    status: "complete" | "partial" | "refused";
    /** Ordered admitted coefficient records; omitted domains have no fabricated piece. */
    pieces: readonly IPiece[];
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

  /**
   * Evaluate only saved coefficients at the piece's own normalized parameter.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States normalized parameter and millimetre output, and does not borrow a source evaluator.
   * @evidence contracts/development/implementation.md#principled-implementation Existing engine Bernstein evaluation and the existing rational conic quotient implement the two admitted representations.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One dispatch keeps generation and fitter coefficient semantics identical.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No resampling, source interpolation or fallback curve changes stored coefficients.
   * @evidence contracts/development/implementation.md#efficient-algorithms Degree is at most five; two scalar Bernstein evaluations use constant bounded work and storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Rational evaluation reuses the existing conic owner; polynomial evaluation reuses engine algebra.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary scalar arrays expire after each pure call; no input or handle is retained.
   */
  export function evaluate(piece: IPiece, u: number): Conic.Point {
    if (piece.kind === "conic") return Conic.evaluate(piece, u);
    return [
      B.scalar(piece.controls.map((p: Conic.Point): number => p[0]), u),
      B.scalar(piece.controls.map((p: Conic.Point): number => p[1]), u),
    ];
  }

  /**
   * Count the actual planar numeric representation, including chart metadata.
   * Adjacent equal endpoints are counted once; corners may share position.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines two coordinates per control, one degree or weight, two interval endpoints and exact shared-endpoint accounting.
   * @evidence contracts/development/implementation.md#principled-implementation Direct coefficient cardinality measures stored numbers rather than output tessellation or source observation counts.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The same owner supplies candidate and final representation cost.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Coordinate plane reduction is not attributed to polynomial degree, and no approximate endpoint equality hides a gap.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pass over P pieces costs O(P) with scalar scratch only.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Adjacent controls are read once per seam; no sample generation is needed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The function borrows the immutable coefficient array and retains no data after return.
   */
  export function storedScalars(pieces: readonly IPiece[]): number {
    let total: number = 0;
    let previous: Conic.Point | undefined;
    for (const piece of pieces) {
      total += 2 * piece.controls.length + 3;
      const first: Conic.Point = piece.controls[0]!;
      if (previous !== undefined && previous[0] === first[0] && previous[1] === first[1]) total -= 2;
      previous = piece.controls.at(-1)!;
    }
    return total;
  }
}
