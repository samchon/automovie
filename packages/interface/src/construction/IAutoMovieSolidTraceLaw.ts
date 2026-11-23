import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Data and callback contracts shared by the SolidTraceLaw operations.
 *
 * @evidence contracts/development/design.md#principled-representation ILaw exposes a point/part-phase-affine equation and the derivatives required by implicit tracing; residual units follow phase, angle or reference-arc mode.
 * @evidence contracts/development/design.md#minimal-and-owned-surface SolidTraceLaw constructs these callbacks for intersection trace solvers using world-mm points and their declared curve clock.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The callback set does not certify a solved intersection or interchangeable residual scales; the selected law retains its own units.
 * @evidence contracts/development/common.md#meaningful-documentation Explains equation derivatives, second-order remainder and mode-specific angle reading.
 */
export namespace IAutoMovieSolidTraceLaw {
  /**
   * An equation affine in world point/part phase at fixed t, with the derivatives used by implicit tracing.
   * Residual units differ between phase, angle and reference-arc laws.
   *
   * @evidence contracts/development/design.md#principled-representation A scalar constraint plus its point/phase gradient, parameter derivative and second-order remainder closes the three surface-meeting equations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five callbacks separate the common Newton/predictor consumer from the selected parameter representation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The interface does not validate derivative consistency or transversality; its grad(t) form assumes the point/phase-affine laws provided by the current constructors.
   * @evidence contracts/development/common.md#meaningful-documentation Names every derivative role, point-affine premise and the fact that raw residual units depend on the law.
   */
  export interface ILaw {
    /**
     * Scalar parameter constraint g(P,phi,t), with units determined by the selected law.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Names world point, part phase and trace parameter and explicitly leaves residual units with the law.
     */
    g(p: AutoMovieVector3Tuple, phi: number, t: number): number;

    /**
     * [dg/dP,dg/dphi], valid for the constructors' point/phase-affine constraints.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Gives derivative ordering and the affine-constraint premise.
     */
    grad(t: number): [AutoMovieVector3Tuple, number];

    /**
     * Partial derivative dg/dt with world point/part phase held fixed.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States held-fixed variables and the derivative's solver role.
     */
    gt(p: AutoMovieVector3Tuple, t: number): number;

    /**
     * Second total-derivative remainder after the solver's Jacobian-times-acceleration and grad(P).Q_A terms.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Names the excluded terms and the supplied world velocity dp used by the law's remainder.
     */
    extra(
      p: AutoMovieVector3Tuple,
      dp: AutoMovieVector3Tuple,
      t: number,
    ): number;

    /**
     * Seed angle from a world point for angle mode; phase/arc constructors return unused zero placeholders.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States supported mode, world-point input and the other modes' placeholder behavior.
     */
    angle(p: AutoMovieVector3Tuple): number;
  }
}
