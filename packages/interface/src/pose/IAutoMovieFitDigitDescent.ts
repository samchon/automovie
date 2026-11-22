/**
 * What one descent reads.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines lexicographic metre residuals, variable projection and the supplied resolution/tolerance policy.
 * @evidence contracts/development/design.md#principled-representation start and project use one fixed coordinate dimension, clinical degrees for fitDigitToTarget; step shares that unit and tolerance returns a metre norm bound.
 * @evidence contracts/development/design.md#minimal-and-owned-surface fitDigitToTarget supplies residual and ROM projection closures to fitDigitDescent, leaving digit geometry and coordinate conventions with the caller.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The solver expects nonempty finite coordinates, positive resolution and stable residual dimensions; these callback shapes do not validate arbitrary numeric functions.
 */
export namespace IAutoMovieFitDigitDescent {
  /**
   * What one descent reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines lexicographic metre residuals, variable projection and the supplied resolution/tolerance policy.
   * @evidence contracts/development/design.md#principled-representation start and project use one fixed coordinate dimension, clinical degrees for fitDigitToTarget; step shares that unit and tolerance returns a metre norm bound.
   * @evidence contracts/development/design.md#minimal-and-owned-surface fitDigitToTarget supplies residual and ROM projection closures to fitDigitDescent, leaving digit geometry and coordinate conventions with the caller.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The solver expects nonempty finite coordinates, positive resolution and stable residual dimensions; these callback shapes do not validate arbitrary numeric functions.
   */
  export interface IProps {
    /** The start, the variables' values. */
    start: readonly number[];

    /**
     * The primary residual, metres.
     *
     * Synchronously return a nonempty finite metre residual vector of fixed length for borrowed coordinate values. The solver evaluates finite-difference probes as well as trials; leave coordinates unchanged and propagate failures. No callback is retained after descent.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Synchronously return a nonempty finite metre residual vector of fixed length for borrowed coordinate values. The solver evaluates finite-difference probes as well as trials; leave coordinates unchanged and propagate failures. No callback is retained after descent.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; fitDigitDescent and fitDigitToTarget owns the numerical method and its runtime premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; fitDigitDescent and fitDigitToTarget owns its implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in fitDigitDescent and fitDigitToTarget.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; fitDigitDescent and fitDigitToTarget owns cost for the supported workload.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; fitDigitDescent and fitDigitToTarget owns reuse and invalidation of any retained work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; fitDigitDescent and fitDigitToTarget and the documented reader/caller lifetime own retained data and release.
     */
    primary: (x: readonly number[]) => number[];

    /**
     * The secondary residual, metres; empty when there is none.
     *
     * Synchronously return a fixed-length finite metre residual vector; an empty vector disables the secondary task. Trial/probe coordinates are borrowed and must not be mutated. Exceptions abort descent and the callback is not retained.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Synchronously return a fixed-length finite metre residual vector; an empty vector disables the secondary task. Trial/probe coordinates are borrowed and must not be mutated. Exceptions abort descent and the callback is not retained.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; fitDigitDescent and fitDigitToTarget owns the numerical method and its runtime premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; fitDigitDescent and fitDigitToTarget owns its implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in fitDigitDescent and fitDigitToTarget.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; fitDigitDescent and fitDigitToTarget owns cost for the supported workload.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; fitDigitDescent and fitDigitToTarget owns reuse and invalidation of any retained work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; fitDigitDescent and fitDigitToTarget and the documented reader/caller lifetime own retained data and release.
     */
    secondary: (x: readonly number[]) => number[];

    /**
     * The variables projected into their range.
     *
     * Return a fresh finite coordinate vector with the same length and units as start, projected into its admissible ranges. Leave borrowed inputs unchanged; the initial point, derivative probes and accepted trials all rely on this projection. Exceptions propagate and no callback is retained.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Return a fresh finite coordinate vector with the same length and units as start, projected into its admissible ranges. Leave borrowed inputs unchanged; the initial point, derivative probes and accepted trials all rely on this projection. Exceptions propagate and no callback is retained.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; fitDigitDescent and fitDigitToTarget owns the numerical method and its runtime premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; fitDigitDescent and fitDigitToTarget owns its implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in fitDigitDescent and fitDigitToTarget.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; fitDigitDescent and fitDigitToTarget owns cost for the supported workload.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; fitDigitDescent and fitDigitToTarget owns reuse and invalidation of any retained work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; fitDigitDescent and fitDigitToTarget and the documented reader/caller lifetime own retained data and release.
     */
    project: (x: readonly number[]) => number[];

    /** Positive finite variable resolution: the finite-difference step and the stop. */
    step: number;

    /**
     * The primary residual's length at which the primary counts as met, at `x` with its Jacobian.
     *
     * Read borrowed current coordinates and the primary Jacobian and return a finite nonnegative metre residual-norm threshold. The callback is synchronous, leaves both inputs unchanged and is discarded after descent; failures propagate.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Read borrowed current coordinates and the primary Jacobian and return a finite nonnegative metre residual-norm threshold. The callback is synchronous, leaves both inputs unchanged and is discarded after descent; failures propagate.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; fitDigitDescent and fitDigitToTarget owns the numerical method and its runtime premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; fitDigitDescent and fitDigitToTarget owns its implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in fitDigitDescent and fitDigitToTarget.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; fitDigitDescent and fitDigitToTarget owns cost for the supported workload.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; fitDigitDescent and fitDigitToTarget owns reuse and invalidation of any retained work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; fitDigitDescent and fitDigitToTarget and the documented reader/caller lifetime own retained data and release.
     */
    tolerance: (
      x: readonly number[],
      J1: readonly (readonly number[])[],
    ) => number;
  }
}
