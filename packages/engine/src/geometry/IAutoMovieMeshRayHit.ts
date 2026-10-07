/**
 * An owned ray intersection in the snapshotted mesh's local metre frame.
 * Triangle identity is the original index-triplet ordinal, before hierarchy
 * sorting; it identifies geometry without certifying a side or volume.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Retains metric travel and native triangle identity when composing surface queries.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Reports an intersection without changing the queried triangle population or coordinate frame.
 * @author Samchon
 */
export interface IAutoMovieMeshRayHit {
  /** Metres along the normalized ray, retaining the computed sign of zero. */
  distance: number;

  /** Original triangle ordinal, with the lowest ordinal selected at equal travel. */
  triangle: number;
}
