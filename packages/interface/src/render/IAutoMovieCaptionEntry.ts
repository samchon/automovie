/**
 * One caption span: the output frames `[frameStart, frameEnd)` during which one beat's shot is live, with that beat's shot caption and enclosing scene slug.
 *
 * A guide-frame consumer, such as an external diffusion pass, can use the caption as the prompt for those frames and the slug as scene context. A null caption carries no prompt; this declaration does not choose a consumer's fallback behavior.
 *
 * @evidence contracts/development/design.md#principled-representation A half-open frame interval is the representation that lets consecutive spans share a boundary without overlap, so the spans tile the output frames exactly and slicing can clip them with `max` and `min`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The span repeats the `IAutoMovieBeatCaption` fields beside the beat id and range, so a consumer reads one flat record without a second lookup into the screenplay.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No field carries a consumer-specific default prompt; null caption and slug are left for the consumer to interpret.
 * @evidence contracts/development/common.md#meaningful-documentation The prose gives the interval convention and how a consumer uses each field, and each member states its bound, its frame of reference, or its null cases.
 */
export interface IAutoMovieCaptionEntry {
  /**
   * First output frame of the span, inclusive, counted from the start of the sidecar: the whole render, or the chunk after slicing.
   */
  frameStart: number;

  /** One past the last output frame of the span, exclusive. */
  frameEnd: number;

  /** Id of the beat whose shot is live across the span. */
  beat: string;

  /**
   * The beat node's shot caption, or null when the script has no tree or the beat authored none.
   */
  caption: string | null;

  /**
   * The enclosing scene's slug, `INT. LOCATION - TIMEOFDAY`, or null when the script has no tree or no scene encloses the beat.
   */
  slug: string | null;
}
