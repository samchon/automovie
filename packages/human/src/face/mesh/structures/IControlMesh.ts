/**
 * A triangle control cage with one material label per face.
 *
 * @evidence contracts/common.md#principled-implementation Parallel position, triangle-index and face-label arrays preserve resident vertex identities through component attachment and shared subdivision; optional reference/color arrays use the same vertex correspondence. Runtime topology and array agreement remain the producer's responsibility.
 * @evidence contracts/common.md#clear-and-simple-design One control-cage record carries geometry and its aligned attributes so subdivision can apply identical masks without separate independently registered surfaces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This structural type adds no specimen-specific topology, generated geometry, defaults, or runtime validation; malformed arrays are not made valid by the declaration.
 * @evidence contracts/common.md#meaningful-documentation Members state millimetre coordinates, oriented triangles, per-face labels, corresponding reference coordinates, and pre-weld linear vertex colors.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface declares the cage layout and chooses no traversal or computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type carries no request coordination, cache key, or invalidation policy; actual producers own correspondence and reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This interface acquires no arrays or handles; attached/refined cage producers own the actual allocations and their transfer.
 *
 * @author Samchon
 */
export interface IControlMesh {
  /** XYZ control vertices in the caller's coordinate unit, millimetres here. */
  positions: number[][];

  /** Oriented triangle triples referencing positions, with manifold adjacency. */
  indices: number[];

  /** One opaque material-region label per triangle, inherited by all children. */
  groups: number[];

  /** Optional reference XYZ carried by the same subdivision masks as positions. */
  reference?: number[][];

  /** Optional linear RGB on the final shared vertices, before contact welding. */
  colors?: number[][];
}
