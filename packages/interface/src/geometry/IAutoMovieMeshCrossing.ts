/**
 * One triangle of the first mesh that a triangle of the second mesh crosses, as
 * reported by `measureAutoMovieMeshCrossings`.
 *
 * Ordinals are positions in each mesh's own `indices`, before any spatial
 * indexing, so a caller can map a report straight back to the buffer it owns.
 * The default query reports one witness per first-mesh triangle, preferring a
 * piercing pair over a coplanar one. With `allPairs`, a triangle may have
 * several entries, one for each second-mesh triangle it crosses or overlaps in
 * one plane.
 */
export interface IAutoMovieMeshCrossing {
  /** First-mesh triangle ordinal, before any spatial indexing. */
  triangle: number;

  /** A second-mesh triangle ordinal that pierces or overlaps it. */
  other: number;

  /** True when the two lie in one plane and overlap without either piercing. */
  coplanar: boolean;
}
