/**
 * The fixed particle lattice a soft-body domain is solved on.
 *
 * Either axis may have one particle, which permits cords, but the product must
 * be at least two. A single particle has no neighbor constraint and is refused;
 * a one-wide cord produces no panel triangles.
 */
export interface IAutoMovieSoftLattice {
  /** Particle count along the panel's first axis; at least 1. */
  columns: number;

  /** Particle count along the panel's second axis; at least 1. */
  rows: number;
}
