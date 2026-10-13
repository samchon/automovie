/**
 * One compact instance set whose individual slot identities exceed the bounded palette allocation.
 *
 * @evidence contracts/common.md#principled-implementation Palette collection preserves the logical instance-set entry while recording exact omitted per-slot population and the capacity reason instead of expanding an arbitrarily large set.
 * @evidence contracts/common.md#clear-and-simple-design Set id, slot count, cause and remedy expose one bounded identity gap without listing every unallocated member.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The set remains addressable as a whole, but its missing slot colors are not claimed complete or approximated as distinct slot evidence.
 * @evidence contracts/common.md#meaningful-documentation Defines compiled set identity, unaddressed slot count and exact allocation cause and correction.
 * @author Samchon
 */
export interface IAutoMovieSemanticMaskGap {
  /** Compiled instance-set id. */
  instanceSet: string;

  /** Slots that went unaddressed. */
  slots: number;

  /** Exactly why they were not allocated. */
  reason: string;

  /** Exactly what would allocate them. */
  remedy: string;
}
