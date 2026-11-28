/**
 * One owned ray intersection returned by the mesh caster's nearestHit query.
 * Travel uses the snapshotted mesh's local metre frame. The face ordinal
 * addresses the original triangle before hierarchy ordering.
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
