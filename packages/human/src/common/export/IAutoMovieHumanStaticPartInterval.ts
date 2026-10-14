/**
 * One prepared source member's element intervals in a merged static primitive.
 *
 * Offsets and counts address the primitive's final POSITION and index
 * accessors, not bytes or anatomical parts. Members appear in the primitive's
 * declared merge order and together partition both accessors.
 *
 *
 * @evidence contracts/common.md#principled-implementation Defines one source member's final vertex and scalar-index intervals; declared order must partition both accessors completely.
 * @evidence contracts/common.md#clear-and-simple-design Explicit offsets and counts let the correspondence reader admit actual output without repeating the original merge.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Index ordinals are scalars rather than triangle/byte offsets, and part IDs cannot substitute material-derived anatomical names.
 * @evidence contracts/common.md#meaningful-documentation Documents source identity, offset units and final-accessor ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interval record implements no partition-validation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One member's carried interval is a result value, not cached execution or request reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Primitive metadata owners retain interval records; this shape acquires no handle or task.
 *
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
