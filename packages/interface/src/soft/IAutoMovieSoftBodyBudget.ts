/**
 * The bounded cost a soft-body domain adds to a shot, for the builder report.
 *
 * Every field is derived from the domain record alone, so a production can be
 * refused for an unaffordable panel before a single step is integrated.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `IAutoMovieSoftBodyBudget` as the portable data boundary for the effects soft solver state requirement.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `IAutoMovieSoftBodyBudget` for the soft collider and solver transition system contract.
 */
export interface IAutoMovieSoftBodyBudget {
  /**
   * Identity of the measured domain.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `domain` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `domain` for the soft collider and solver transition system contract.
   */
  domain: string;

  /**
   * Lattice particles, `columns * rows`.
   *
   * The derived surface carries one vertex per particle, so this is also the
   * drawn vertex count a render budget attributes device memory to.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `particles` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `particles` for the soft collider and solver transition system contract.
   */
  particles: number;

  /**
   * Triangles the derived surface draws: two per lattice quad.
   *
   * It happens to equal {@link shear}, because a quad carries two diagonals and
   * two triangles alike. They are separate statements about separate costs —
   * one is what the solver projects, the other is what the GPU rasterizes — and
   * a consumer reading the constraint count as a triangle count would be right
   * by coincidence and wrong the moment either side changes.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `triangles` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `triangles` for the soft collider and solver transition system contract.
   */
  triangles: number;

  /**
   * Row and column distance constraints.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `structural` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `structural` for the soft collider and solver transition system contract.
   */
  structural: number;

  /**
   * Diagonal distance constraints.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `shear` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `shear` for the soft collider and solver transition system contract.
   */
  shear: number;

  /**
   * Second-neighbour distance constraints.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `bend` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `bend` for the soft collider and solver transition system contract.
   */
  bend: number;

  /**
   * Declared colliders.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `colliders` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `colliders` for the soft collider and solver transition system contract.
   */
  colliders: number;

  /**
   * Bytes one state occupies as 64-bit reals: `8 * 6 * particles`.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `stateBytes` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `stateBytes` for the soft collider and solver transition system contract.
   */
  stateBytes: number;

  /**
   * Highest absolute step a sample may integrate to.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `maxSteps` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `maxSteps` for the soft collider and solver transition system contract.
   */
  maxSteps: number;

  /**
   * Constraint gathers a worst-case seek costs.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `worstCaseGathers` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `worstCaseGathers` for the soft collider and solver transition system contract.
   */
  worstCaseGathers: number;

  /**
   * Travel number `dt · referenceSpeed / shortestRestLength`. At most `1`, or a
   * particle can cross a constraint or a collider inside one step.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `travel` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `travel` for the soft collider and solver transition system contract.
   */
  travel: number;
}
