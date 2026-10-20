/**
 * The screenplay refinement tree's intent root states the film's logline and theme, which every descendant refines.
 *
 * renderScreenplay prints these fields as the LOGLINE and THEME header. validateScriptTree requires both to be nonblank and to match the script's flat logline and theme exactly.
 *
 * @evidence contracts/common.md#principled-implementation Two prose fields state the root editorial intent, with nonblankness and exact equality to the independent flat script header checked at tree admission before rendering.
 * @evidence contracts/common.md#clear-and-simple-design The root carries only the top-level statement; acts, scenes, groups and beats carry their own payloads, so no reasoning slot is shared across levels.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The renderer prints admitted prose verbatim; mismatched duplicate headers and blank fields refuse rather than selecting whichever representation a consumer happens to read.
 * @evidence contracts/common.md#meaningful-documentation Defines root ownership, screenplay header output and the nonblank exact-equality contract shared with the flat script fields.
 */
export interface IAutoMovieIntentPayload {
  /** One-sentence summary of the film. */
  logline: string;

  /** The mood or thematic intent every refinement below should serve. */
  theme: string;
}
