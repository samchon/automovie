/**
 * The fixed particle lattice a soft-body domain is solved on.
 *
 * Either axis may have one particle, which permits cords, but the product must be at least two. A single particle has no neighbor constraint and is refused; a one-wide cord produces no panel triangles.
 *
 * @evidence contracts/development/design.md#principled-representation validateSoftBodyDomain requires positive integer axes and at least two particles; row-major neighbour offsets define structural, shear and bend connections.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two dimensions describe the fixed topology while rest positions supply its orientation and shape.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A cord with one axis of length one remains valid but produces no panel triangles; a single unconstrained particle is refused rather than padded.
 * @evidence contracts/development/common.md#meaningful-documentation The axis counts and minimum product explain how cord domains differ from drawable panels.
 */
export interface IAutoMovieSoftLattice {
  /** Particle count along the panel's first axis; at least 1. */
  columns: number;

  /** Particle count along the panel's second axis; at least 1. */
  rows: number;
}
