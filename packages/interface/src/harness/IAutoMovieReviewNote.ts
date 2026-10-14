/**
 * One open correction on a built beat, the unit of the review backlog the next re-block or re-perform round works from.
 *
 * Notes carry a beat id and nonblank issue/suggestion text. reviewVisualRead emits visual-tier sampled root-point framing, angular-silhouette and contact-distance proxy findings, preceded by supplied film-grammar notes. These are numerical heuristics, not observed pixels or proof that a visual review occurred. Production storage validates blank fields and the three-tier vocabulary but does not join beat ids to the current script.
 *
 * @evidence contracts/common.md#principled-implementation A note is located by beat and tier and carries the observed defect and the change to make, the two texts a correction round needs; the production store refuses blank beat, issue or suggestion instead of persisting an unlocated correction.
 * @evidence contracts/common.md#clear-and-simple-design Four fields share correction structure between visual grammar findings and persisted review notes, so each producer supplies the same located correction without per-reviewer payloads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Grammar adaptation drops severity and shot fields and relies on the supplied beat to preserve location; storage accepts a structurally valid note without proving beat membership, review provenance or the truth of its text. Numerical proxy findings remain claims for a reviewer, with no text-quality grade.
 * @evidence contracts/common.md#meaningful-documentation States who files notes and through which gate, which tier the engine uses and for what, and every refusal; members give the beat rule, the tier meanings, and what the two texts must say.
 * @author Samchon
 */
export interface IAutoMovieReviewNote {
  /** Script beat id the note is filed on; non-blank. */
  beat: string;

  /**
   * Which review raised it: `structural` for a record that is incoherent or incomplete, `physical` for a motion or contact the physics and range checks object to, and `visual` for what the camera shows. The engine's own notes are all `visual`.
   */
  tier: "structural" | "physical" | "visual";

  /**
   * Non-blank statement of what is wrong, located as concretely as possible, such as `left foot skates at t=1.2s`.
   */
  issue: string;

  /** Non-blank change the next round should apply. */
  suggestion: string;
}
