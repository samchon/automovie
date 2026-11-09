/**
 * Finite nonnegative coefficients for a unit-mass scalar spring; stiffness uses inverse seconds squared and damping inverse seconds when dt is seconds.
 *
 * @evidence contracts/development/design.md#principled-representation These coefficients parameterize acceleration=k(target-current)-c*velocity in dampedSpring's unit-mass equation; nonnegative values allow zero restoring force or zero damping.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record holds only the two physical coefficients; current value, velocity, target and timestep belong to each integration step.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No joint, body or preferred timestep is encoded in this generic scalar parameter record; stability depends on the caller's coefficients and timestep.
 * @evidence contracts/development/common.md#meaningful-documentation Gives coefficient units, finite nonnegative domain and the unit-mass interpretation needed to choose a timestep.
 */
export interface ISpringParams {
  /** How hard the spring pulls toward the target. Higher = snappier. */
  stiffness: number;

  /** How fast oscillation decays. Higher = less overshoot. */
  damping: number;
}
