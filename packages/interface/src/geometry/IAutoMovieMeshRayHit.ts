/**
 * An owned ray intersection in the snapshotted mesh's local metre frame,
 * returned by {@link IAutoMovieMeshRayCaster.nearestHit}.
 *
 * Triangle identity is the original index-triplet ordinal, before the caster's
 * hierarchy sorts its triangles; it identifies the face hit without certifying
 * which side the ray came from or that the origin is inside a volume.
 */
export interface IAutoMovieMeshRayHit {
  /**
   * Metres along the normalized ray from the origin, inside the query's
   * [minimum, maximum] interval and keeping the computed sign of zero.
   */
  distance: number;

  /**
   * Original triangle ordinal in the caster's input index buffer; the lowest
   * ordinal wins among triangles hit at equal travel.
   */
  triangle: number;
}
