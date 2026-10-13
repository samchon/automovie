/**
 * The payload of the intent root of the screenplay refinement tree: what film
 * this is and what it should feel like. Every other node refines this one
 * statement.
 *
 * `renderScreenplay` prints these two fields as the `LOGLINE:` and `THEME:`
 * header of a script that carries a tree, in place of the flat
 * `IAutoMovieScript.logline` and `theme`. No validator compares the two pairs
 * or checks that either field is non-blank, so an author keeps them in step.
 *
 * @evidence contracts/common.md#principled-implementation Two prose fields, the logline and theme a screenplay header states, read by the renderer as the tree's authored truth.
 * @evidence contracts/common.md#clear-and-simple-design The root carries only the top-level statement; acts, scenes, groups and beats carry their own payloads, so no reasoning slot is shared across levels.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The renderer prints the fields verbatim, and the documentation states the unchecked duplication with the flat script fields instead of implying that the two are reconciled.
 * @evidence contracts/common.md#meaningful-documentation States the node it belongs to, its consumer and output form, which flat fields it overrides there, and that agreement and non-blankness are unchecked; members say what each sentence holds.
 * @author Samchon
 */
export interface IAutoMovieIntentPayload {
  /** One-sentence summary of the film. */
  logline: string;

  /** The mood or thematic intent every refinement below should serve. */
  theme: string;
}
