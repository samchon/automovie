/** Exact compact instance-set slot addressed by one palette entry. */
export interface IAutoMovieSemanticMaskSlot {
  /** Compiled instance-set id. */
  instanceSet: string;

  /** Zero-based deterministic slot index inside that set. */
  index: number;
}
