/**
 * One resident object's actual bounding box and stable population ordinal,
 * the entry `buildAutoMovieMeshQueryHierarchy` partitions and
 * `collectAutoMovieSpatialQueryCandidates` returns.
 *
 * The box encloses its geometry in the query's shared metre frame; its centre
 * chooses median partitions and never substitutes for that geometry. Mesh
 * crossings index triangles with it and lash contact indexes capsules, each
 * extending it with the geometry its narrow phase reads.
 *
 * @evidence contracts/common.md#principled-implementation Hierarchy nodes take the componentwise extrema of their entries' boxes, so a node encloses everything below it and a disjoint node can be skipped; the centre only orders entries for the median split and the ordinal only breaks candidate-order ties.
 * @evidence contracts/common.md#clear-and-simple-design A base record of box, centre and ordinal that triangle and capsule indexes extend, so one hierarchy builder and one candidate walk serve both without knowing what the boxes enclose.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The box must be the actual enclosure, not an inflated or sampled one, so pruning by it can only skip geometry that truly cannot meet the subject.
 * @evidence contracts/common.md#meaningful-documentation States its builder and walker, the frame, the role of each field and that the centre never stands in for geometry, and which indexes extend it.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; partition and candidate costs are answered on the hierarchy builder and the candidate walk.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built once per indexed object when its owner compiles an index and reused by every query on that index.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns three three-element arrays per entry, retained by the hierarchy that holds the entry until its owner drops the index.
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
