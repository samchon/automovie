
/**
 * Shared planar, millimetre-valued contract for experimental conic recovery.
 * Rational quadratics use endpoint weights one and a positive middle weight;
 * a collinear control triple with weight one is the admitted line primitive.
 * The contract does not imply a Hausdorff certificate or a globally minimal net.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States units, coefficient normalization, line representation and the limits of reported evidence.
 * @evidence contracts/development/design.md#principled-representation Readonly planar tuples and explicit domains represent source charts and conic coefficients; finite values, positive weights and ordered domains require runtime admission.
 * @evidence contracts/development/design.md#minimal-and-owned-surface approximateAutoMovieRecoveryCompactCurves, approximateAutoMovieRecoveryConicsAhn, approximateAutoMovieRecoveryConicsGhosh share IAutoMovieConicApproximation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No specimen, source artifact, rendering option or optional algorithm-specific state enters this planar contract.
 */

export namespace IAutoMovieConicApproximation {
/** A point or derivative in the caller's fixed planar millimetre frame.
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed frame and physical unit; derivative orders inherit the source parameter.
   * @evidence contracts/development/design.md#principled-representation A readonly two-tuple excludes changing dimension; finite arithmetic remains a runtime condition.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both algorithms and their caller share this single point owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No fixture-specific axes or numeric wrapper is introduced.
   */
export type Point = readonly [number, number];

/** Borrowed parametric planar source, with source-span and singularity breaks.
   * Derivatives are with respect to the original parameter, not normalized arc
   * length. At a declared break the derivative callback must supply the exact
   * requested one-sided limit; no epsilon displacement approximates a corner.
   * Smooth callbacks may ignore side. Callbacks must be deterministic and leave
   * their input unchanged; algorithms snapshot returned coordinate tuples.
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

 
   /** Evaluate in millimetres; nonfinite coordinates refuse the affected arc.
     * @evidence contracts/development/common.md#meaningful-documentation States the unit of the returned point and what a nonfinite coordinate does to the arc that reads it; the interface comment states determinism and input ownership.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation The point evaluator is a callback the caller supplies: this declaration has no body whose method could be judged.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The point evaluator is a callback the caller supplies: no structure is implemented here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The point evaluator is a callback the caller supplies: no implementation exists here to take a shortcut.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The point evaluator is a callback the caller supplies: its cost belongs to the supplied source.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The point evaluator is a callback the caller supplies: the algorithms that call it own their caching.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The point evaluator is a callback the caller supplies: it declares no state or resource.
     */
    evaluate(t: number): IAutoMovieConicApproximation.Point;

 
   /** Evaluate mm/parameter^order. At a nonsmooth break, left/right requests
     * select the exact incident chart's endpoint derivative; omission selects
     * the caller's ordinary point value and makes no one-sided promise.
     * @evidence contracts/development/common.md#meaningful-documentation States the derivative's unit per order, the one-sided selection at a break and what omitting the side promises.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation The derivative evaluator is a callback the caller supplies: no method is implemented under this signature.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The derivative evaluator is a callback the caller supplies: its structure is the source chart's own.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The derivative evaluator is a callback the caller supplies: exactness at breaks is demanded of it, not implemented here.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The derivative evaluator is a callback the caller supplies: the cost of each order is the source chart's.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The derivative evaluator is a callback the caller supplies: Ahn and Ghosh cache its jets themselves.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The derivative evaluator is a callback the caller supplies: the signature holds no state between orders or sides.
     */
    derivative(
      t: number,
      order: 1 | 2 | 3 | 4 | 5,
      side?: "left" | "right",
    ): IAutoMovieConicApproximation.Point;
  }

/** Physical fit tolerance and explicit work limits, with no implicit defaults.
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

/** One positive-weight rational quadratic over an original source interval.
   * Its parameter runs independently from zero to one; domain only registers
   * the source interval, since a fitted conic need not retain source speed.
   * @evidence contracts/development/common.md#meaningful-documentation States normalized conic parameter, source registration and sampled error meaning.
   * @evidence contracts/development/design.md#principled-representation Three planar controls and one positive middle weight encode exactly a rational quadratic, including explicitly admitted straight lines.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Reconstruction consumes these coefficients without source geometry or a parallel curve representation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No dense source samples or original topology is retained in the result.
   */
export interface IArc {
 
   /** Source interval represented by this coefficient record. */
    domain: readonly [number, number];

 
   /** Endpoint, tangent intersection, endpoint in the same millimetre frame. */
    controls: readonly [IAutoMovieConicApproximation.Point, IAutoMovieConicApproximation.Point, IAutoMovieConicApproximation.Point];

 
   /** Positive finite middle weight; endpoint weights are exactly one. */
    weight: number;

 
   /** Largest sampled geometric discrepancy, not a certified supremum. */
    maximumSampleErrorMm: number;
  }

/** Fitted coefficients and explicit limits of the supporting evidence.
   * Partial results may omit unresolved intervals and must not be mistaken for
   * a complete reconstruction; refused results have no admitted coefficients.
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
    arcs: readonly IAutoMovieConicApproximation.IArc[];

 
   /** Admission failures, approximation limits and provenance qualifications. */
    diagnostics: readonly string[];

 
   /** Maximum of accepted arcs' sampled error; zero for an empty result. */
    maximumSampleErrorMm: number;

 
   /** True only with a proven continuous error bound, never mere sampling. */
    certified: boolean;

 
   /** Number of source evaluate/derivative callback invocations. */
    queries: number;
  }

/** Isolated numerical source-cubic critical candidates on normalized (0,1).
   * D=0 includes inflections and stationary points; categories may overlap.
   * No endpoint or unresolved continuum is fabricated as an isolated root.
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
}

