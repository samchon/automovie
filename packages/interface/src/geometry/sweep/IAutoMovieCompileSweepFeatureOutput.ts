/**
 * A feature's compiled domain course and radial displacement field, shared by sweep evaluation and construction observations.
 *
 * The closures retain the compiled course coefficients and the feature width. Treat the source feature as immutable while they live. compileAutoMovieSweep admits the authored feature before compilation; these query signatures do not enforce finite arguments. Returned domain records are newly allocated and caller-owned.
 *
 * @evidence contracts/development/design.md#principled-representation Separates a dimensionless domain course from a metre displacement; angle arguments use radians while returned v uses turns.
 * @evidence contracts/development/design.md#minimal-and-owned-surface compileAutoMovieSweep reads displacement and exposes point through its feature query; prepareAutoMovieSurfaceConstruction reads that same course.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The two queries share the fitted course instead of substituting a sampled display polyline for the displacement curve.
 * @evidence contracts/development/common.md#meaningful-documentation Gives parameter units, callback lifetime, source retention, returned-record ownership and the feature admission owner.
 */
export interface IAutoMovieCompileSweepFeatureOutput {
  /**
   * Signed radial change in metres, zero outside the feature band. Nearest-course search uses a local cylindrical metric and is not a global nearest-point guarantee.
   *
   * @param u Normalized spine coordinate of the query
   * @param angle Polar direction in radians about the section origin
   * @param local Positive pre-feature, unscaled radius at the query, in metres
   * @param length Spine polygon length in metres, scaling longitudinal differences
   * @param guided Synchronous pre-feature unscaled radius evaluator taking u and radians and returning metres; called for absolute-radius features, never retained, and exceptions propagate
   * @returns Offset feature value, or absolute feature radius minus guided radius at the selected course point, multiplied by the compact band falloff
   *
   * @evidence contracts/development/common.md#meaningful-documentation States normalized u, radian angle, metre query scales, local-search limits and the synchronous nonretained guided-radius callback with propagated errors.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; compileAutoMovieSweepFeature's compiled course and displacement closures own the numerical method under the documented units and input premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature exposes the callback boundary; compileAutoMovieSweepFeature's compiled course and displacement closures own executable decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration supplies no algorithm, compensation or fallback; the actual behavior is implemented by compileAutoMovieSweepFeature's compiled course and displacement closures.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no traversal or allocation strategy; compileAutoMovieSweepFeature's compiled course and displacement closures own its evaluation cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration schedules no work; compileAutoMovieSweepFeature's compiled course and displacement closures decide whether calls share coefficients, identities or mutable state.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no storage or handles; compileAutoMovieSweepFeature's compiled course and displacement closures own references retained by the supplied callable.
   */
  displacement: (
    u: number,
    angle: number,
    local: number,
    length: number,
    guided: (u: number, angle: number) => number,
  ) => number;

  /**
   * Domain point at a clamped share of the centripetal knot span; v is in unwrapped turns and a collapsed course is constant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States clamped knot-span share, unwrapped output turns, possible u overshoot and constant collapsed courses.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; compileAutoMovieSweepFeature's compiled course and displacement closures own the numerical method under the documented units and input premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature exposes the callback boundary; compileAutoMovieSweepFeature's compiled course and displacement closures own executable decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration supplies no algorithm, compensation or fallback; the actual behavior is implemented by compileAutoMovieSweepFeature's compiled course and displacement closures.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no traversal or allocation strategy; compileAutoMovieSweepFeature's compiled course and displacement closures own its evaluation cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration schedules no work; compileAutoMovieSweepFeature's compiled course and displacement closures decide whether calls share coefficients, identities or mutable state.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no storage or handles; compileAutoMovieSweepFeature's compiled course and displacement closures own references retained by the supplied callable.
   */
  point: (t: number) => {
    /** Spine coordinate on the fitted course. The query share is clamped, but the cubic course itself can overshoot its authored u values. */
    u: number;

    /** Unwrapped angular course coordinate in turns; divide the fitted radian angle by 2*pi without wrapping the result. */
    v: number;
  };
}
