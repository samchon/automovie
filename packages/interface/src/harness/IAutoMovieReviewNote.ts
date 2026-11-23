/**
 * One open correction on a built beat, the unit of the review backlog the next
 * re-block or re-perform round works from.
 *
 * Notes carry a beat id and nonblank issue/suggestion text. reviewVisualRead
 * emits visual-tier sampled root-point framing, angular-silhouette and
 * contact-distance proxy findings, preceded by supplied film-grammar notes.
 * These are numerical heuristics, not observed pixels or proof that a visual
 * review occurred. Production storage validates blank fields and the three-tier
 * vocabulary but does not join beat ids to the current script.
 */
export interface IAutoMovieReviewNote {
  /** Script beat id the note is filed on; non-blank. */
  beat: string;

  /**
   * Which review raised it: `structural` for a record that is incoherent or
   * incomplete, `physical` for a motion or contact the physics and range checks
   * object to, and `visual` for what the camera shows. The engine's own notes
   * are all `visual`.
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
