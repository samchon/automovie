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
 * @evidence contracts/common.md#principled-implementation A one-way citation from a design id to candidate ids of one document; `validateDesignEvidence` merges candidate ids of same-id documents, then requires the document to resolve, at least one resolving candidate, a non-blank rationale, and no repeated triple keyed by JSON array serialization.
 * @evidence contracts/common.md#clear-and-simple-design Four fields pointing from design to observation; nothing in the reference points back, so citing a reading never edits it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `subject` is checked only for being non-blank and is never resolved against the compiled buildings' published ids, so a renamed wall leaves a citation justifying nothing; this gap is stated, not compensated for.
 * @evidence contracts/common.md#meaningful-documentation States what `subject` should name and that it is not resolved, the candidate floor, that unsettled readings may be cited, and what the rationale explains.
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
