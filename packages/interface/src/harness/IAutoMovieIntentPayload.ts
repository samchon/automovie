/**
 * The screenplay refinement tree's intent root states the film's logline and
 * theme, which every descendant refines.
 *
 * RenderScreenplay prints these fields as the LOGLINE and THEME header.
 * validateScriptTree requires both to be nonblank and to match the script's
 * flat logline and theme exactly.
 */
export interface IAutoMovieIntentPayload {
  /** One-sentence summary of the film. */
  logline: string;

  /** The mood or thematic intent every refinement below should serve. */
  theme: string;
}
