/**
 * One caption span: the output frames `[frameStart, frameEnd)` during which one
 * beat's shot is live, with that beat's shot caption and enclosing scene slug.
 *
 * A guide-frame consumer, such as an external diffusion pass, can use the
 * caption as the prompt for those frames and the slug as scene context. A null
 * caption carries no prompt; this declaration does not choose a consumer's
 * fallback behavior.
 */
export interface IAutoMovieCaptionEntry {
  /**
   * First output frame of the span, inclusive, counted from the start of the
   * sidecar: the whole render, or the chunk after slicing.
   */
  frameStart: number;

  /** One past the last output frame of the span, exclusive. */
  frameEnd: number;

  /** Id of the beat whose shot is live across the span. */
  beat: string;

  /**
   * The beat node's shot caption, or null when the script has no tree or the
   * beat authored none.
   */
  caption: string | null;

  /**
   * The enclosing scene's slug, `INT. LOCATION - TIMEOFDAY`, or null when the
   * script has no tree or no scene encloses the beat.
   */
  slug: string | null;
}
