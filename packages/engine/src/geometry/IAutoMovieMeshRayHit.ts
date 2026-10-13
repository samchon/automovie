/**
 * An owned ray intersection in the snapshotted mesh's local metre frame.
 * Triangle identity is the original index-triplet ordinal, before hierarchy
 * sorting; it identifies geometry without certifying a side or volume.
 *
 * @author Samchon
 */
export interface IAutoMovieMeshRayHit {
  /** Metres along the normalized ray, retaining the computed sign of zero. */
  distance: number;

  /** Original triangle ordinal, with the lowest ordinal selected at equal travel. */
  triangle: number;
}
