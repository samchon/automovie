/**
 * Exact admission facts for one live deterministic wearable solve.
 *
 * @evidence requirements/motion/secondary-motion.md#motion-secondary-adoption-choice Reports the explicitly selected expensive path.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Keeps solver adoption and cost inspectable.
 */
export interface IAutoMovieWearableSoftBudget {
  /**
   * Zero-based admitted subject slot.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-adoption-choice Does not enable a crowd implicitly.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Identifies the selected live solve.
   */
  subjectIndex: number;
  /**
   * Declared maximum simultaneous wearable subjects.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Bounds additional work.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition States the admission ceiling.
   */
  maxSubjects: number;
  /**
   * Moving anchor count per step.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-anchors Reports attachment work.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-static-moving-anchor-input Counts resolved anchor inputs.
   */
  anchorsPerStep: number;
  /**
   * Moving body-capsule count per step.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-colliders Reports shared collision work.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Counts resolved capsule inputs.
   */
  capsulesPerStep: number;
  /**
   * Total moving boundary records consumed for the seek.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Reports exact bounded work.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Accounts for each fixed-step input.
   */
  boundaryRecords: number;
}
