/**
 * Two parts of one built model whose surfaces pass through each other, as
 * `measureModelCrossings` reports them.
 *
 * Identities are the model's own part identities, so a report names the same
 * things the exporter and an editor do. Both directions are counted because
 * they answer different questions: how much of a lip is compromised is not how
 * much of the tooth row is, and a caller repairing one needs its own side.
 *
 * A part measured against itself (`measureModelCrossings` with
 * `withinParts`) names itself as both `part` and `other`, and both counts are
 * the triangles of that part another of its own triangles crosses.
 *
 * `coplanar` separates the pairs that lie flat against each other from the ones
 * that pierce. Flat contact is what adjacent shells do when they are merely
 * touching, so counting it as piercing would make a resting pose look broken.
 */
export interface IAutoMovieModelCrossing {
  /** Part whose triangles are counted in `triangles`. */
  part: string;

  /**
   * The other part of the pair, counted in `otherTriangles`; `part` itself for
   * a self entry.
   */
  other: string;

  /** Triangles of `part` that geometry of `other` crosses. */
  triangles: number;

  /** Triangles of `other` that geometry of `part` crosses. */
  otherTriangles: number;

  /**
   * Crossed triangles whose crossing lies flat rather than piercing: summed
   * over both sides for a pair, counted once for a self entry.
   */
  coplanar: number;
}
