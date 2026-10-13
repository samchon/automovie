/**
 * One authored citation from a normalized design element to the observation it
 * was decided from.
 *
 * The arrow points from design to evidence, never back. The author states which
 * reading was chosen and why it beat the recorded alternatives; the observation
 * itself is left exactly as it was read.
 *
 * A citation may name an unsettled or withheld candidate on purpose. The
 * production gate refuses a document or candidate that does not resolve, a
 * blank rationale, and a repeated subject, document, and candidate triple.
 *
 * @author Samchon
 */
export interface IAutoMovieDesignEvidence {
  /**
   * Normalized design element, space, or boundary id this citation justifies.
   *
   * Only checked for being non-blank; no gate resolves it against the ids the
   * compiled buildings publish.
   */
  subject: string;

  /** Design-reference document id. */
  document: string;

  /**
   * Candidate ids cited as the basis of the authored decision; at least one,
   * each a candidate of {@link document}.
   */
  candidates: string[];

  /** Why the author chose this reading over the recorded alternatives. */
  rationale: string;
}
