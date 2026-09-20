/**
 * One triangle of the first mesh that a triangle of the second mesh crosses.
 *
 * Ordinals are positions in each mesh's own `indices`, before any spatial
 * indexing, so a caller can map a report straight back to the buffer it owns.
 * A triangle is reported once with a single witness rather than once per
 * crossing pair, because the question a caller asks of this is which of its
 * triangles are compromised, not how many ways each one is.
 *
 * @author Samchon
 */
export interface IAutoMovieMeshCrossing {
  /** First-mesh triangle ordinal, before any spatial indexing. */
  triangle: number;
  /** A second-mesh triangle ordinal that pierces it. */
  other: number;
  /** True when the two lie in one plane and overlap without either piercing. */
  coplanar: boolean;
}
