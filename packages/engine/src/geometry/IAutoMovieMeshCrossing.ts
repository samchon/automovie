/**
 * One triangle of the first mesh that a triangle of the second mesh crosses,
 * as reported by `measureAutoMovieMeshCrossings`.
 *
 * Ordinals are positions in each mesh's own `indices`, before any spatial
 * indexing, so a caller can map a report straight back to the buffer it owns.
 * The default query reports one witness per first-mesh triangle, preferring a
 * piercing pair over a coplanar one. With `allPairs`, a triangle may have
 * several entries, one for each second-mesh triangle it crosses or overlaps in
 * one plane.
 *
 * @evidence contracts/common.md#principled-implementation An ordinal pair plus the coplanar flag, because the narrow phase answers two distinct predicates, strict edge-through-triangle piercing and same-plane overlap, and a caller must know which one held.
 * @evidence contracts/common.md#clear-and-simple-design Reports which triangles meet and how, leaving depth to `measureAutoMovieMeshClearance` and repair to the caller, so the crossing census stays a containment-free predicate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinals are the original buffer positions, never hierarchy or candidate positions remapped for convenience, and no pair is reported that the strict predicates did not admit.
 * @evidence contracts/common.md#meaningful-documentation States the ordinal space, the one-per-triangle default versus every pair with `allPairs`, the default's preference for piercing, and what `coplanar` means.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record with no runtime body; the hierarchy query is answered on `measureAutoMovieMeshCrossings`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fresh record per reported pair; nothing is cached.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Three scalars; the result holds at most one per first triangle by default and at most one per crossing pair with `allPairs`.
 */
export interface IAutoMovieMeshCrossing {
  /** First-mesh triangle ordinal, before any spatial indexing. */
  triangle: number;

  /** A second-mesh triangle ordinal that pierces or overlaps it. */
  other: number;

  /** True when the two lie in one plane and overlap without either piercing. */
  coplanar: boolean;
}
