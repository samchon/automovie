/**
 * One compact instance set whose individual slot identities exceed the bounded
 * palette allocation.
 */
export interface IAutoMovieSemanticMaskGap {
  /** Compiled instance-set id. */
  instanceSet: string;

  /** Slots that went unaddressed. */
  slots: number;

  /** Exactly why they were not allocated. */
  reason: string;

  /**
   * How to reduce palette demand or obtain per-slot identity from the compiled
   * runtime instead.
   */
  remedy: string;
}
