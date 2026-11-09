/**
 * Exact compact instance-set slot addressed by one palette entry.
 *
 * @evidence contracts/development/design.md#principled-representation A compiled set id and zero-based slot index join palette identity to the same deterministic member regeneration used by the viewer and inspection.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two fields identify one instanced member without embedding its transform, model or variation in the semantic palette.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The index is a stable slot identity rather than current draw order or visible instance ordinal; capacity gaps cannot be filled by another slot's color.
 * @evidence contracts/development/common.md#meaningful-documentation Defines compiled set ownership and zero-based deterministic slot indexing.
 */
export interface IAutoMovieSemanticMaskSlot {
  /** Compiled instance-set id. */
  instanceSet: string;

  /** Zero-based deterministic slot index inside that set. */
  index: number;
}
