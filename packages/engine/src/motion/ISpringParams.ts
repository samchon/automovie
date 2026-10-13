/**
 * Finite nonnegative coefficients for a unit-mass scalar spring; stiffness uses inverse seconds squared and damping inverse seconds when dt is seconds.
 *
 * @evidence contracts/common.md#principled-implementation These coefficients parameterize acceleration=k(target-current)-c*velocity in dampedSpring's unit-mass equation; nonnegative values allow zero restoring force or zero damping.
 * @evidence contracts/common.md#clear-and-simple-design The record holds only the two physical coefficients; current value, velocity, target and timestep belong to each integration step.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No joint, body or preferred timestep is encoded in this generic scalar parameter record; stability depends on the caller's coefficients and timestep.
 * @evidence contracts/common.md#meaningful-documentation Gives coefficient units, finite nonnegative domain and the unit-mass interpretation needed to choose a timestep.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Two numbers contain no integration algorithm; dampedSpring owns constant-cost semi-implicit Euler stepping.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Coefficients may be reused by independent spring axes, but this input records no cached trajectory or equivalence key.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller-owned coefficients hold no resource or evolving history and need no release action.
 *
 * @author Samchon
 */
export interface ISpringParams {
  /** How hard the spring pulls toward the target. Higher = snappier. */
  stiffness: number;


  /** How fast oscillation decays. Higher = less overshoot. */
  damping: number;
}
