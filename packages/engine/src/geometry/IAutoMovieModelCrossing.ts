/**
 * Two parts of one built model whose surfaces pass through each other.
 *
 * Identities are the model's own part identities, so a report names the same
 * things the exporter and an editor do. Both directions are counted because
 * they answer different questions: how much of a lip is compromised is not how
 * much of the tooth row is, and a caller repairing one needs its own side.
 *
 * `coplanar` separates the pairs that lie flat against each other from the ones
 * that pierce. Flat contact is what adjacent shells do when they are merely
 * touching, so counting it as piercing would make a resting pose look broken.
 *
 * @author Samchon
 */
export interface IAutoMovieModelCrossing {
  /** Part whose triangles are counted in `triangles`. */
  part: string;
  /** The other part of the pair, counted in `otherTriangles`. */
  other: string;
  /** Triangles of `part` that geometry of `other` crosses. */
  triangles: number;
  /** Triangles of `other` that geometry of `part` crosses. */
  otherTriangles: number;
  /** Crossings on either side that lie flat rather than piercing. */
  coplanar: number;
}
