/**
 * One authored citation from a normalized design element to the observation it
 * was decided from.
 *
 * The arrow points from design to evidence, never back. The author states which
 * reading was chosen and why it beat the recorded alternatives; the observation
 * itself is left exactly as it was read.
 */
export interface IAutoMovieDesignEvidence {
  /**
   * Normalized design element, space, or boundary id this citation justifies.
   */
  subject: string;

  /** Design-reference document id. */
  document: string;

  /**
   * Candidate ids cited as the basis of the authored decision; at least one.
   */
  candidates: string[];

  /** Why the author chose this reading over the recorded alternatives. */
  rationale: string;
}
