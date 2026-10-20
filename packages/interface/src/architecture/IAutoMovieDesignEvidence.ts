/**
 * One authored citation from a normalized design element to the observation it
 * was decided from.
 *
 * The arrow points from design to evidence, never back. The author states which
 * reading was chosen and why it beat the recorded alternatives; the observation
 * itself is left exactly as it was read.
 *
 * A citation may name an unsettled or withheld candidate. Explicit Engine validateDesignEvidence checks subject/rationale text, cited documents/candidates and duplicate triples; declaring the citation does not invoke that validator.
 *
 * @evidence contracts/common.md#principled-implementation validateDesignEvidence unions candidate ids by document id, checks cited membership and detects repeats with JSON-array subject/document/candidate keys. A missing document skips candidate count/membership/duplicate checks after subject/rationale checks; callers must establish unique consistent document identities because production merging is retired. The validator neither validates the whole reference nor verifies rationale truth or subject ownership.
 * @evidence contracts/common.md#clear-and-simple-design The citation lives on the design side and names document and candidates by id, so observation records stay unchanged and one design element can cite several documents through several citations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsettled and withheld candidates are citable by design rather than filtered, and the subject is only checked for being non-blank, a gap the member states instead of claiming resolution.
 * @evidence contracts/common.md#meaningful-documentation States citation direction, explicit Engine validation, unsettled-candidate allowance, unresolved subject ownership and the rationale's intended explanation.
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
