/**
 * The fixed particle lattice a soft-body domain is solved on.
 *
 * Either axis may be a single particle — a cord is a lattice one wide — but
 * their product must be at least two, because a single particle carries no
 * constraint at all and there would be nothing for the solver to hold
 * together.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `IAutoMovieSoftLattice` as the portable data boundary for the effects soft solver state requirement.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `IAutoMovieSoftLattice` for the soft collider and solver transition system contract.
 */
export interface IAutoMovieSoftLattice {
  /**
   * Particle count along the panel's first axis; at least 1.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `columns` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `columns` for the soft collider and solver transition system contract.
   */
  columns: number;

  /**
   * Particle count along the panel's second axis; at least 1.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `rows` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `rows` for the soft collider and solver transition system contract.
   */
  rows: number;
}
