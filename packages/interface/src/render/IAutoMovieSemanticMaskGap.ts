/** One instance set whose per-slot colours were not allocated. */
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
