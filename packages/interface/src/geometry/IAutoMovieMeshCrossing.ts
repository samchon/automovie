/**
 * A strict surface crossing witness addressed by both source triangle ordinals.
 *
 * The normal census emits one witness per first triangle, preferring a piercing
 * pair. With `allPairs` it may emit several entries for the same first-mesh
 * triangle.
 */
export interface IAutoMovieMeshCrossing {
  /**
   * Zero-based triangle ordinal in the first mesh's source order, before
   * spatial indexing.
   */
  triangle: number;

  /**
   * Zero-based triangle ordinal of the second mesh witness, before target
   * hierarchy reordering.
   */
  other: number;

  /**
   * True for an overlap admitted by the coplanar test. False for a transverse
   * piercing witness.
   */
  coplanar: boolean;
}
