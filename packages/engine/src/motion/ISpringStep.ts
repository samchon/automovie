/**
 * One scalar spring's updated value and velocity, carried into the next integration step; velocity uses value units per second when dt uses seconds.
 *
 * @evidence contracts/common.md#principled-implementation Couples the semi-implicit Euler value and updated velocity so the next dampedSpring call resumes the same scalar trajectory instead of discarding momentum.
 * @evidence contracts/common.md#clear-and-simple-design A two-number result carries just the integrator state; stiffness, damping, target and timestep remain caller inputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The state has no joint-specific clamping or invented rest target; callers choose how a numeric axis maps into a motion control.
 * @evidence contracts/common.md#meaningful-documentation States carry-forward ownership and the relative velocity units, without promising a stable trajectory for arbitrary timesteps.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result performs no integration; the owning spring step computes both numbers in constant work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Carrying velocity is required physical state rather than a cache; changed targets still use the previous step's momentum.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Each result owns two scalar values and retains no earlier state, handle or task.
 */
export interface ISpringStep {
  /** The sprung value this step. */
  value: number;

  /** Velocity carried into the next step. */
  velocity: number;
}
