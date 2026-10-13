/**
 * The intent payload, the refinement root's thought: what film this is and what
 * it should feel like. The whole tree below refines this single statement, so
 * it carries only the top-of-funnel decomposition.
 */
export interface IAutoMovieIntentPayload {
  /** One-sentence summary of the film. */
  logline: string;

  /** The mood / thematic intent every refinement below should serve. */
  theme: string;
}
