/**
 * One resident object's actual bounding box and stable population ordinal, the
 * entry `buildMeshQueryHierarchy` partitions and
 * `collectSpatialQueryCandidates` returns.
 *
 * The box encloses its geometry in the query's shared metre frame; its centre
 * chooses median partitions and never substitutes for that geometry. Mesh
 * crossings index triangles with it and lash contact indexes capsules, each
 * extending it with the geometry its narrow phase reads.
 */
export interface IAutoMovieSpatialQueryEntry {
  /** Ordinal in the owner's original resident population, unique per index. */
  ordinal: number;

  /** Componentwise XYZ minimum of the actual enclosing box. */
  low: number[];

  /** Componentwise XYZ maximum of the actual enclosing box. */
  high: number[];

  /**
   * Finite XYZ partition centre; mesh crossings take it as half-sums of the
   * extrema so it stays finite where `high - low` overflows. It does not alter
   * the box or geometry.
   */
  centre: number[];
}
