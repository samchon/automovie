/**
 * One prepared source member's element intervals in a merged static primitive.
 *
 * Offsets and counts address the primitive's final POSITION and index
 * accessors, not bytes or anatomical parts. Members appear in the primitive's
 * declared merge order and together partition both accessors.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanStaticPartInterval {
  /** Source model part ID, never a material-derived anatomical identity. */
  id: string;

  /** Zero-based POSITION vertex ordinal. */
  vertexOffset: number;

  /** Number of POSITION vertices belonging to this member. */
  vertexCount: number;

  /** Zero-based scalar index ordinal, not a triangle or byte ordinal. */
  indexOffset: number;

  /** Number of triangle index scalars belonging to this member. */
  indexCount: number;
}
