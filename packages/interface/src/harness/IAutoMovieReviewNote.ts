/**
 * One open correction on a built beat, the unit of the review backlog the next
 * re-block or re-perform round works from.
 *
 * A reviewer files notes through {@link IAutoMovieShotReviewWrite}, where
 * `reviewShot` requires every note to name the judged beat and carry non-blank
 * `issue` and `suggestion` text. The engine files its own notes at the
 * `visual` tier: `reviewVisualRead` reports framing, silhouette-merge and
 * missed-contact findings, and `grammarDiagnosticsToReviewNotes` files
 * film-grammar findings ahead of them. The production store refuses a stored
 * note with a blank beat, issue or suggestion, or a tier outside the three.
 *
 * @evidence contracts/common.md#principled-implementation A note is located by beat and tier and carries the observed defect and the change to make, the two texts a correction round needs; `reviewShot` and the production store refuse a note missing either, so a backlog entry is always actionable.
 * @evidence contracts/common.md#clear-and-simple-design Four fields shared by human, agent and engine reviewers, so the slate keeps one backlog list and `getNotes` filters it by beat without per-source shapes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No severity or shot field is carried, a stated limitation the grammar adapter documents when it drops those facts; no tier is special-cased by the gates.
 * @evidence contracts/common.md#meaningful-documentation States who files notes and through which gate, which tier the engine uses and for what, and every refusal; members give the beat rule, the tier meanings, and what the two texts must say.
 * @author Samchon
 */
export interface IAutoMovieReviewNote {
  /** Script beat id the note is filed on; non-blank. */
  beat: string;

  /**
   * Which review raised it: `structural` for a record that is incoherent or
   * incomplete, `physical` for a motion or contact the physics and range
   * checks object to, and `visual` for what the camera shows. The engine's own
   * notes are all `visual`.
   */
  tier: "structural" | "physical" | "visual";

  /**
   * Non-blank statement of what is wrong, located as concretely as possible,
   * such as `left foot skates at t=1.2s`.
   */
  issue: string;

  /** Non-blank change the next round should apply. */
  suggestion: string;
}
