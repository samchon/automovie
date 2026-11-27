/**
 * An affine contact condition at one clipped overlap vertex, delivered to the
 * optional visitor of `measureMeshClearance`.
 *
 * Barycentric weights belong to the original front triangle, including small
 * negative roundoff; clipping or renormalizing them would change the measured
 * plane. Advancing the three front vertices by distances `d` along the measured
 * axis changes this signed gap by `weights` dot `d`, which is how
 * `minimizeMeshClearance` turns witnesses into displacement
 * constraints. Clear witnesses are delivered too, because a coupled
 * displacement must keep them clear. Arrays are fresh per witness, independent
 * of the resident mesh, and may be retained by the visitor.
 */
export interface IAutoMovieMeshClearanceWitness {
  /** Front triangle ordinal, before any spatial indexing. */
  triangle: number;

  /** Back triangle ordinal, before any spatial indexing. */
  backTriangle: number;

  /**
   * The front triangle's three original vertex ordinals, a copy the visitor
   * owns.
   */
  vertices: number[];

  /**
   * Front-triangle barycentric coefficients in the same order as `vertices`,
   * possibly slightly negative from roundoff.
   */
  weights: number[];

  /**
   * Front-minus-back depth at the overlap vertex in mesh-local metres; positive
   * is clear, zero is contact, negative violates the ordering.
   */
  gap: number;
}
