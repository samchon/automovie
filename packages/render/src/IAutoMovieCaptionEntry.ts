
/**
 * One caption span: the output frames `[frameStart, frameEnd)` during which one beat's shot is live, with that beat's shot caption and enclosing scene slug.
 *
 * A guide-frame consumer, such as an external diffusion pass, can use the caption as the prompt for those frames and the slug as scene context. A null caption carries no prompt; this declaration does not choose a consumer's fallback behavior.
 *
 * @evidence contracts/common.md#principled-implementation A half-open frame interval is the representation that lets consecutive spans share a boundary without overlap, so the spans tile the output frames exactly and slicing can clip them with `max` and `min`.
 * @evidence contracts/common.md#clear-and-simple-design The span repeats the `IAutoMovieBeatCaption` fields beside the beat id and range, so a consumer reads one flat record without a second lookup into the screenplay.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field carries a consumer-specific default prompt; null caption and slug are left for the consumer to interpret.
 * @evidence contracts/common.md#meaningful-documentation The prose gives the interval convention and how a consumer uses each field, and each member states its bound, its frame of reference, or its null cases.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface only shapes one span and executes no algorithm; building spans is answered on `planCaptionSidecar`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A span record shares no work between phases; it is plain data written once by the planner or the slicer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased span type acquires no caption or frame; planCaptionSidecar and sliceCaptionSidecar produce interval records whose enclosing sidecar caller retains their beat, caption and slug strings.
 * @author Samchon
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
