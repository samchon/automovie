/**
 * The fixed particle lattice a soft-body domain is solved on.
 *
 * Either axis may be a single particle — a cord is a lattice one wide — but
 * their product must be at least two, because a single particle carries no
 * constraint at all and there would be nothing for the solver to hold
 * together.
 */
export interface IAutoMovieSoftLattice {
  /** Particle count along the panel's first axis; at least 1. */
  columns: number;

  /** Particle count along the panel's second axis; at least 1. */
  rows: number;
}
