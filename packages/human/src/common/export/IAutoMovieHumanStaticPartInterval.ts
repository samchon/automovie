/**
 * One prepared source member's element intervals in a merged static primitive.
 *
 * Offsets and counts address the primitive's final POSITION and index
 * accessors, not bytes or anatomical parts. Members appear in the primitive's
 * declared merge order and together partition both accessors.
 *
 * @evidence contracts/common.md#principled-implementation Binds a source ID to the exact accessor intervals its member occupies, so the reader admits the partition without reconstructing a merge.
 * @evidence contracts/common.md#clear-and-simple-design One named member record replaces the correspondence's anonymous part element.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A source part ID is never derived from a material name or treated as anatomical qualification.
 * @evidence contracts/common.md#meaningful-documentation States which accessor each interval addresses, its unit and the ordering.
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
