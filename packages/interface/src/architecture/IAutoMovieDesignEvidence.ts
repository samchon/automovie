/**
 * One authored citation from a normalized design element to the observation it
 * was decided from.
 *
 * The arrow points from design to evidence, never back. The author states which
 * reading was chosen and why it beat the recorded alternatives; the observation
 * itself is left exactly as it was read.
 *
 * A citation may name an unsettled or withheld candidate on purpose. The
 * production gate refuses a blank subject, a document or candidate that does
 * not resolve, an empty candidate list, a blank rationale, and a repeated
 * subject, document, and candidate triple.
 *
 * @evidence contracts/common.md#principled-implementation Resolution is set membership: `validateDesignEvidence` builds each document's candidate id set and checks every cited candidate against it, and repeats are detected on a JSON-serialized triple so no separator inside an id can collide two citations.
 * @evidence contracts/common.md#clear-and-simple-design The citation lives on the design side and names document and candidates by id, so observation records stay unchanged and one design element can cite several documents through several citations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsettled and withheld candidates are citable by design rather than filtered, and the subject is only checked for being non-blank, a gap the member states instead of claiming resolution.
 * @evidence contracts/common.md#meaningful-documentation States the direction of the citation, every refusal the production gate applies, that unsettled candidates may be cited, that the subject is not resolved against compiled ids, and what the rationale must explain.
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

  /** Design-reference document id; it must resolve. */
  document: string;

  /**
   * Candidate ids cited as the basis of the authored decision; at least one,
   * each a candidate of {@link document}.
   */
  candidates: string[];

  /** Non-blank reason the author chose this reading over the alternatives. */
  rationale: string;
}
