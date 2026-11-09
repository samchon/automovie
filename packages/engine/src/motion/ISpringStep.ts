/**
 * One scalar spring's updated value and velocity, carried into the next integration step; velocity uses value units per second when dt uses seconds.
 *
 * @evidence contracts/development/design.md#principled-representation Couples the semi-implicit Euler value and updated velocity so the next dampedSpring call resumes the same scalar trajectory instead of discarding momentum.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A two-number result carries just the integrator state; stiffness, damping, target and timestep remain caller inputs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The state has no joint-specific clamping or invented rest target; callers choose how a numeric axis maps into a motion control.
 * @evidence contracts/development/common.md#meaningful-documentation States carry-forward ownership and the relative velocity units, without promising a stable trajectory for arbitrary timesteps.
 */
export interface ISpringStep {
  /** The sprung value this step. */
  value: number;

  /** Velocity carried into the next step. */
  velocity: number;
}
