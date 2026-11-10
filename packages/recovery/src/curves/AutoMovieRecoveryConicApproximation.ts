import { findAutoMovieRecoveryCubicCriticalParameters } from "./findAutoMovieRecoveryCubicCriticalParameters";

/**
 * Shared planar, millimetre-valued contract for experimental conic recovery.
 * Rational quadratics use endpoint weights one and a positive middle weight;
 * a collinear control triple with weight one is the admitted line primitive.
 * The contract does not imply a Hausdorff certificate or a globally minimal net.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States units, coefficient normalization, line representation and the limits of reported evidence.
 * @evidence contracts/development/design.md#principled-representation Readonly planar tuples and explicit domains represent source charts and conic coefficients; finite values, positive weights and ordered domains require runtime admission.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Recovery owns the shared contract consumed by the two paper experiments and their reconstruction caller.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No specimen, source artifact, rendering option or optional algorithm-specific state enters this planar contract.
 */
export namespace AutoMovieRecoveryConicApproximation {
  /**
   * A point or derivative in the caller's fixed planar millimetre frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed frame and physical unit; derivative orders inherit the source parameter.
   * @evidence contracts/development/design.md#principled-representation A readonly two-tuple excludes changing dimension; finite arithmetic remains a runtime condition.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both algorithms and their caller share this single point owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No fixture-specific axes or numeric wrapper is introduced.
   */
  export type Point = readonly [number, number];

  /**
   * Borrowed parametric planar source, with source-span and singularity breaks.
   * Derivatives are with respect to the original parameter, not normalized arc
   * length. At a declared break the derivative callback must supply the exact
   * requested one-sided limit; no epsilon displacement approximates a corner.
   * Smooth callbacks may ignore side. Callbacks must be deterministic and leave
   * their input unchanged; algorithms snapshot returned coordinate tuples.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents callback parameterization, exact one-sided derivatives at breaks, domain, breaks and coordinate snapshot ownership.
   * @evidence contracts/development/design.md#principled-representation The ordered domain and derivatives through order five support both papers; regularity is checked numerically by the selected algorithm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Recovery accepts a pure evaluator so source basis and artifact I/O remain with existing owners.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The interface accepts arbitrary planar source charts without a Human or polynomial-degree dependency.
   */
  export interface ICurve {
    /** Inclusive source parameter interval, strictly increasing. */
    domain: readonly [number, number];

    /** Ordered or unordered interior parameter boundaries that may not be crossed. */
    breaks: readonly number[];

    /** Whether the source identifies its two domain endpoints. */
    closed: boolean;

    /** Evaluate in millimetres; nonfinite coordinates refuse the affected arc. */
    evaluate(t: number): Point;

    /**
     * Evaluate mm/parameter^order. At a nonsmooth break, left/right requests
     * select the exact incident chart's endpoint derivative; omission selects
     * the caller's ordinary point value and makes no one-sided promise.
     */
    derivative(
      t: number,
      order: 1 | 2 | 3 | 4 | 5,
      side?: "left" | "right",
    ): Point;
  }

  /**
   * Physical fit tolerance and explicit work limits, with no implicit defaults.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes physical tolerance from arc and subdivision budgets.
   * @evidence contracts/development/design.md#principled-representation Positive finite tolerance and positive integer budgets require admission; reaching a budget returns partial evidence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The caller supplies the three controls needed to bound adaptive approximation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No specimen-dependent preset or hidden quality option is exposed.
   */
  export interface IOptions {
    /** Requested sampled geometric tolerance, in millimetres. */
    toleranceMm: number;

    /** Maximum accepted and unresolved leaf intervals in the resulting net. */
    maximumArcs: number;

    /** Maximum bisection depth per supplied source interval. */
    maximumDepth: number;
  }

  /**
   * One positive-weight rational quadratic over an original source interval.
   * Its parameter runs independently from zero to one; domain only registers
   * the source interval, since a fitted conic need not retain source speed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States normalized conic parameter, source registration and sampled error meaning.
   * @evidence contracts/development/design.md#principled-representation Three planar controls and one positive middle weight encode exactly a rational quadratic, including explicitly admitted straight lines.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Reconstruction consumes these coefficients without source geometry or a parallel curve representation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No dense source samples or original topology is retained in the result.
   */
  export interface IArc {
    /** Source interval represented by this coefficient record. */
    domain: readonly [number, number];

    /** Endpoint, tangent intersection, endpoint in the same millimetre frame. */
    controls: readonly [Point, Point, Point];

    /** Positive finite middle weight; endpoint weights are exactly one. */
    weight: number;

    /** Largest sampled geometric discrepancy, not a certified supremum. */
    maximumSampleErrorMm: number;
  }

  /**
   * Fitted coefficients and explicit limits of the supporting evidence.
   * Partial results may omit unresolved intervals and must not be mistaken for
   * a complete reconstruction; refused results have no admitted coefficients.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines status, omission, certification and query accounting.
   * @evidence contracts/development/design.md#principled-representation The closed status union separates complete, limited and refused operations; runtime logic owns consistency with coefficients.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both experiments report their coefficients and limitations through one recovery result owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Diagnostics preserve unsupported premises rather than hiding them behind an empty successful fit.
   */
  export interface IResult {
    /** Honest algorithm/provenance label, including adaptation where applicable. */
    method: string;

    /** Completeness of admitted source coverage. */
    status: "complete" | "partial" | "refused";

    /** Ordered coefficients; no source samples are retained. */
    arcs: readonly IArc[];

    /** Admission failures, approximation limits and provenance qualifications. */
    diagnostics: readonly string[];

    /** Maximum of accepted arcs' sampled error; zero for an empty result. */
    maximumSampleErrorMm: number;

    /** True only with a proven continuous error bound, never mere sampling. */
    certified: boolean;

    /** Number of source evaluate/derivative callback invocations. */
    queries: number;
  }

  /**
   * Isolated numerical source-cubic critical candidates on normalized (0,1).
   * D=0 includes inflections and stationary points; categories may overlap.
   * No endpoint or unresolved continuum is fabricated as an isolated root.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines normalized parameters, overlapping categories, degeneracy and numerical limitations.
   * @evidence contracts/development/design.md#principled-representation Readonly parameter arrays separate zero curvature numerator, affine extrema and velocity zeros; finite interior admission belongs to the polynomial-root owner.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both conic algorithms and the cubic source adapter share Recovery's critical-event result, with no reference-artifact dependency.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No sampled data, specimen option or presumed future critical-event vocabulary is exposed.
   */
  export interface ICubicCriticalParameters {
    /** Sorted exact-value union of the three numerical candidate arrays. */
    breaks: readonly number[];

    /** Interior roots of cross(p',p''); not necessarily regular inflections. */
    zeroCurvature: readonly number[];

    /** Interior roots of the affine-curvature critical equations where defined. */
    affineCritical: readonly number[];

    /** Interior velocity common-root candidates, checked in both coordinates. */
    stationary: readonly number[];

    /** Computed curvature-numerator polynomial is identically zero. */
    collinear: boolean;

    /** Degenerate continua and finite arithmetic/root-observation limitations. */
    diagnostics: readonly string[];
  }

  /**
   * Observe cubic critical parameters without changing its points or jets.
   * The four planar Bernstein controls define normalized t in [0,1]; the caller
   * maps interior candidates to its source chart and reports unrepresentable
   * mapped intervals. Close distinct roots are not merged by an epsilon.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States coefficient basis, normalized parameter, caller mapping responsibility and unaltered source semantics.
   * @evidence contracts/development/implementation.md#principled-implementation The coefficient helper differentiates the source cubic and delegates D=0, affine critical and stationary candidates to the existing engine polynomial-root owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This namespace entry exposes one shared numerical owner to the two algorithms and their actual input adapter.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No finite-difference endpoint movement, source samples or epsilon root merging is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed degree-two equations give bounded work independent of any mesh or source curve count.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned classification is reusable by both methods for the same admitted coefficients.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The pure wrapper retains no controls, callbacks or external resources.
   */
  export function cubicCriticalParameters(
    controls: readonly [Point, Point, Point, Point],
  ): ICubicCriticalParameters {
    return findAutoMovieRecoveryCubicCriticalParameters(controls);
  }

  /**
   * Evaluate positive-weight rational Bernstein coefficients on [0,1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives parameter range and assumes an admitted finite coefficient record.
   * @evidence contracts/development/implementation.md#principled-implementation The quadratic Bernstein quotient is the standard rational conic representation with endpoint weights one.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared evaluation prevents basis differences between fitting and reconstruction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No source samples, weight correction or specimen branch changes the coefficients.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic and one output tuple are independent of source complexity.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Bernstein factors and denominator are calculated once per evaluation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The pure call retains no input or resources after return.
   */
  export function evaluate(arc: IArc, u: number): Point {
    const a: number = (1 - u) ** 2;
    const b: number = 2 * arc.weight * u * (1 - u);
    const c: number = u * u;
    const denominator: number = a + b + c;
    return [
      (a * arc.controls[0][0] + b * arc.controls[1][0] + c * arc.controls[2][0]) / denominator,
      (a * arc.controls[0][1] + b * arc.controls[1][1] + c * arc.controls[2][1]) / denominator,
    ];
  }

  /**
   * Euclidean separation in millimetres between two same-frame points.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the returned physical unit and same-frame premise.
   * @evidence contracts/development/implementation.md#principled-implementation Math.hypot computes the Euclidean norm of the coordinate difference.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shared scalar geometry has no fitting or I/O responsibility.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No rounding, clamping or specimen constants alter the distance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic requires no retained storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each coordinate difference is evaluated once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No resources or state survive the call.
   */
  export function distance(a: Point, b: Point): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  }

  /**
   * Signed planar determinant, used for orientation and tangent intersection.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the signed determinant and its geometric consumers.
   * @evidence contracts/development/implementation.md#principled-implementation The 2-by-2 determinant measures oriented parallelogram area.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Both algorithms share the primitive without a solver dependency.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance or absolute value erases orientation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two products and one subtraction have constant cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work No repeated source work is performed by this arithmetic helper.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The call owns no retained state or external handle.
   */
  export function cross(a: Point, b: Point): number {
    return a[0] * b[1] - a[1] * b[0];
  }

  /**
   * Admit a finite source chart and positive explicit numerical budgets.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Lists invalid-domain, boundary and budget effects; callbacks are checked when queried.
   * @evidence contracts/development/implementation.md#principled-implementation Finite interval and budget checks establish the adaptive subdivision preconditions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Common admission owns structural checks; each paper owns differential premises.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid options produce diagnostics without defaults, clamping or callback invocation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Admission scans B source breaks once, using O(B) diagnostic storage only on failure.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Callers validate once before fitting their intervals.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No callbacks, source arrays or process resources are retained.
   */
  export function validate(curve: ICurve, options: IOptions): string[] {
    const errors: string[] = [];
    if (!Number.isFinite(curve.domain[0]) || !Number.isFinite(curve.domain[1]) || curve.domain[0] >= curve.domain[1])
      errors.push("Source domain must be finite and strictly increasing.");
    if (curve.breaks.some((t: number): boolean => !Number.isFinite(t) || t <= curve.domain[0] || t >= curve.domain[1]))
      errors.push("Every supplied break must be finite and strictly inside the source domain.");
    if (!Number.isFinite(options.toleranceMm) || options.toleranceMm <= 0)
      errors.push("toleranceMm must be finite and positive.");
    if (!Number.isSafeInteger(options.maximumArcs) || options.maximumArcs < 1 || !Number.isSafeInteger(options.maximumDepth) || options.maximumDepth < 1 || options.maximumDepth > 52)
      errors.push("Budgets must be positive safe integers; maximumDepth must not exceed binary64's 52-bit subdivision precision.");
    return errors;
  }
}
