/**
 * Two parts of one built model whose surfaces pass through each other, as
 * `measureAutoMovieModelCrossings` reports them.
 *
 * Identities are the model's own part identities, so a report names the same
 * things the exporter and an editor do. Both directions are counted because
 * they answer different questions: how much of a lip is compromised is not how
 * much of the tooth row is, and a caller repairing one needs its own side.
 *
 * A part measured against itself (`measureAutoMovieModelCrossings` with
 * `withinParts`) names itself as both `part` and `other`, and both counts
 * are the triangles of that part another of its own triangles crosses.
 *
 * `coplanar` separates the pairs that lie flat against each other from the ones
 * that pierce. Flat contact is what adjacent shells do when they are merely
 * touching, so counting it as piercing would make a resting pose look broken.
 *
 * @evidence contracts/development/design.md#principled-representation Each count is the length of `measureAutoMovieMeshCrossings`'s per-triangle report in one direction, a strict segment-through-triangle test where touching is not crossing, so a seam shared by two shells contributes nothing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One entry per crossing pair with both sides' counts, which is what the face panel diffs between a before and an after reading and the body contact watch displays; the per-triangle reports stay inside the measurement.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No part, pose or asset is exempted and no allowance subtracts expected layering; the entry reports geometry, and judging whether a crossing is intended stays with the caller's before-and-after comparison.
 * @evidence contracts/development/common.md#meaningful-documentation States the identity source, why both directions are kept, the self-entry convention, what coplanar separates and how it sums for a pair versus a self entry.
 */
export interface IAutoMovieModelCrossing {
  /** Part whose triangles are counted in `triangles`. */
  part: string;

  /** The other part of the pair, counted in `otherTriangles`; `part` itself for a self entry. */
  other: string;

  /** Triangles of `part` that geometry of `other` crosses. */
  triangles: number;

  /** Triangles of `other` that geometry of `part` crosses. */
  otherTriangles: number;

  /**
   * Crossed triangles whose crossing lies flat rather than piercing: summed over
   * both sides for a pair, counted once for a self entry.
   */
  coplanar: number;
}
