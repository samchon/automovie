import type { IAutoMovieConicApproximation } from "@automovie/interface";
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
    controls: readonly [IAutoMovieConicApproximation.Point, IAutoMovieConicApproximation.Point, IAutoMovieConicApproximation.Point, IAutoMovieConicApproximation.Point],
  ): IAutoMovieConicApproximation.ICubicCriticalParameters {
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
  export function evaluate(arc: IAutoMovieConicApproximation.IArc, u: number): IAutoMovieConicApproximation.Point {
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
  export function distance(a: IAutoMovieConicApproximation.Point, b: IAutoMovieConicApproximation.Point): number {
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
  export function cross(a: IAutoMovieConicApproximation.Point, b: IAutoMovieConicApproximation.Point): number {
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
  export function validate(curve: IAutoMovieConicApproximation.ICurve, options: IAutoMovieConicApproximation.IOptions): string[] {
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
