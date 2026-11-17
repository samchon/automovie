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
     * @evidence contracts/development/implementation.md#principled-implementation Supplies the fourth residual: phase difference, rotating-plane dot product or reference-spline normal-plane dot product.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure A scalar callback lets the meeting solver append this constraint to its three world-coordinate equations.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Zero residual selects a local constraint branch, not a global nearest foot or unique intersection certificate.
     * @evidence contracts/development/common.md#meaningful-documentation Names world point, part phase and trace parameter and explicitly leaves residual units with the law.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature has no body; the chosen constructor's g callback owns its arithmetic.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Calls share their prepared law geometry; current arc callbacks still recompute the reference jet per invocation.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The scalar result retains no state; callback lifetime belongs to its law owner.
     */
    g(p: AutoMovieVector3Tuple, phi: number, t: number): number;

    /**
     * [dg/dP,dg/dphi], valid for the constructors' point/phase-affine constraints.
     *
     * @evidence contracts/development/implementation.md#principled-implementation Provides the point gradient and direct phase coefficient used to form the fourth Jacobian row by the surface chain rule.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One pair separates the three-dimensional gradient from the direct phase term.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Dependence only on t is part of this law representation; arbitrary nonlinear point/phase constraints are not supported by this signature.
     * @evidence contracts/development/common.md#meaningful-documentation Gives derivative ordering and the affine-constraint premise.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration chooses no gradient evaluation algorithm; the law constructor does.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work A meeting Jacobian uses one returned gradient for all surface components; separate gradient calls are not memoized by the interface.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The consumer owns the returned pair/vector according to its implementation; the interface establishes no retained gradient cache.
     */
    grad(t: number): [AutoMovieVector3Tuple, number];

    /**
     * Partial derivative dg/dt with world point/part phase held fixed.
     *
     * @evidence contracts/development/implementation.md#principled-implementation Supplies the explicit parameter derivative on the right-hand side of the first implicit rate solve.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Keeps explicit parameter motion separate from the point/phase gradient's chain-rule contribution.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts This partial is not the total derivative along the solved curve; the solver combines both terms.
     * @evidence contracts/development/common.md#meaningful-documentation States held-fixed variables and the derivative's solver role.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature executes no derivative formula.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the law's prepared geometry; the current arc implementation performs a new reference-jet reading for this callback.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a scalar and acquires no resource independently of the law object.
     */
    gt(p: AutoMovieVector3Tuple, t: number): number;

    /**
     * Second total-derivative remainder after the solver's Jacobian-times-acceleration and grad(P).Q_A terms.
     *
     * @evidence contracts/development/implementation.md#principled-implementation Supplies the explicit/mixed parameter terms: zero for phase, the rotating-plane remainder for angle and the reference-spline remainder written on arc.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar remainder lets the common rate solver reuse its surface quadratic terms for every parameter kind.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Excludes the part surface's Q_A contribution because the caller adds it with grad; double-counting that term would change the implicit second rate.
     * @evidence contracts/development/common.md#meaningful-documentation Names the excluded terms and the supplied world velocity dp used by the law's remainder.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This callable type implements no second-derivative calculation.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The trace shares its already computed world velocity with this callback; current arc evaluation still rebuilds its local reference jet.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned scalar owns no vector, cache or handle.
     */
    extra(
      p: AutoMovieVector3Tuple,
      dp: AutoMovieVector3Tuple,
      t: number,
    ): number;

    /**
     * Seed angle from a world point for angle mode; phase/arc constructors return unused zero placeholders.
     *
     * @evidence contracts/development/implementation.md#principled-implementation The angle constructor projects a point into its prepared orthogonal footprint basis and uses atan2 to initialize the branch.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One seed-query callback keeps the angle basis with the law that later evaluates its plane.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts This is not a general inverse parameterization: phase/arc provide zero because their trace branches do not use this callback to infer the seed parameter.
     * @evidence contracts/development/common.md#meaningful-documentation States supported mode, world-point input and the other modes' placeholder behavior.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The interface member contains no atan2 implementation or search.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Angle inference reuses its law's prepared basis instead of reconstructing a separate footprint frame.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returning an angle retains no query point or resource.
     */
    angle(p: AutoMovieVector3Tuple): number;
  }
}
