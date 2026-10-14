/**
 * Exact compact instance-set slot addressed by one palette entry.
 *
 * @evidence contracts/common.md#principled-implementation A compiled set id and zero-based slot index join palette identity to the same deterministic member regeneration used by the viewer and inspection.
 * @evidence contracts/common.md#clear-and-simple-design Two fields identify one instanced member without embedding its transform, recipe or variation in the semantic palette.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The index is a stable slot identity rather than current draw order or visible instance ordinal; capacity gaps cannot be filled by another slot's color.
 * @evidence contracts/common.md#meaningful-documentation Defines compiled set ownership and zero-based deterministic slot indexing.
 * @author Samchon
 */
export interface IAutoMovieSemanticMaskSlot {
  /** Compiled instance-set id. */
  instanceSet: string;

  /** Zero-based deterministic slot index inside that set. */
  index: number;
}
