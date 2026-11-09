/**
 * An affine contact condition at one clipped overlap vertex, delivered to the
 * optional visitor of `measureAutoMovieMeshClearance`.
 *
 * Barycentric weights belong to the original front triangle, including small
 * negative roundoff; clipping or renormalizing them would change the measured
 * plane. Advancing the three front vertices by distances `d` along the
 * measured axis changes this signed gap by `weights` dot `d`, which is how
 * `minimizeAutoMovieMeshClearance` turns witnesses into displacement
 * constraints. Clear witnesses are delivered too, because a coupled
 * displacement must keep them clear. Arrays are fresh per witness, independent
 * of the resident mesh, and may be retained by the visitor.
 *
 * @evidence contracts/development/design.md#principled-representation Depth difference is affine on each triangle-pair intersection polygon, so its minimum lies at a clipped polygon vertex and one witness per vertex with the front triangle's barycentric weights expresses the gap as a linear function of the front vertices' travel.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Carries exactly the linear constraint a solver needs, the pair, the front vertex ordinals, their weights and the current gap, so the minimizer builds its rows without re-clipping.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Weights are not clamped or renormalized to hide roundoff, and already clear witnesses are not filtered, so the solver sees every inequality its displacement must keep.
 * @evidence contracts/development/common.md#meaningful-documentation States the ordinal space, the order and roundoff of weights, the sign and unit of `gap`, the linear sensitivity, and that the arrays may be retained.
 */
export interface IAutoMovieMeshClearanceWitness {
  /** Front triangle ordinal, before any spatial indexing. */
  triangle: number;

  /** Back triangle ordinal, before any spatial indexing. */
  backTriangle: number;

  /** The front triangle's three original vertex ordinals, a copy the visitor owns. */
  vertices: number[];

  /** Front-triangle barycentric coefficients in the same order as `vertices`, possibly slightly negative from roundoff. */
  weights: number[];

  /** Front-minus-back depth at the overlap vertex in mesh-local metres; positive is clear, zero is contact, negative violates the ordering. */
  gap: number;
}
