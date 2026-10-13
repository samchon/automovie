/**
 * One caption span: the output frames `[frameStart, frameEnd)` during which one
 * beat's shot is live, with that beat's shot caption and enclosing scene slug.
 *
 * A guide-frame consumer, such as a diffusion pass, reads the caption as the
 * prompt for those frames and the slug as scene context; when `caption` is
 * null it skips the span or uses its own default prompt.
 *
 * @evidence contracts/common.md#principled-implementation A half-open frame interval is the representation that lets consecutive spans share a boundary without overlap, so the spans tile the output frames exactly and slicing can clip them with `max` and `min`.
 * @evidence contracts/common.md#clear-and-simple-design The span repeats the `IAutoMovieBeatCaption` fields beside the beat id and range, so a consumer reads one flat record without a second lookup into the screenplay.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field carries a consumer-specific default prompt; null caption and slug are left for the consumer to interpret.
 * @evidence contracts/common.md#meaningful-documentation The prose gives the interval convention and how a consumer uses each field, and each member states its bound, its frame of reference, or its null cases.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface only shapes one span and executes no algorithm; building spans is answered on `planCaptionSidecar`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A span record shares no work between phases; it is plain data written once by the planner or the slicer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A span owns no resource; it lives inside the sidecar its caller holds.
 * @author Samchon
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

/**
 * The per-beat caption track of one sequence render: the machine-readable
 * sidecar a guide-frame consumer reads next to the captured frames.
 *
 * `planCaptionSidecar` produces it for the whole render, `sliceCaptionSidecar`
 * re-bases it to one chunk, and `renderCaptionSidecar` serializes it.
 *
 * @evidence contracts/common.md#principled-implementation Spans are addressed in output frames at the render's `fps`, the same integer clock the captured frame files use, so a consumer maps a span to files by index without time arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design Four fields carry only what a consumer needs to place spans against frame files; the cut, shots and script stay with the planner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The `frameCount` is stated explicitly so a slice can refuse a window beyond coverage instead of inferring coverage from the last span.
 * @evidence contracts/common.md#meaningful-documentation The prose names the producer, slicer and serializer; members state the frame clock, how `frameCount` is computed, and the tiling guarantee of `entries`.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The sidecar type is data with no code; the cost of producing and slicing it is answered on its producer and slicer.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no work across phases; consumers receive the value the planner returned.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type holds no handle or task; its memory is bounded by its span list and owned by whoever holds the value.
 * @author Samchon
 */
export interface IAutoMovieCaptionSidecar {
  /** Id of the sequence this sidecar captions. */
  target: string;

  /** Output frames per second the spans are addressed in. */
  fps: number;

  /**
   * Total output frames covered: `round(runtime × fps)` for a whole render, or
   * the window length after slicing.
   */
  frameCount: number;

  /**
   * Caption spans in play order, covering every frame in `[0, frameCount)`
   * exactly once, with adjacent spans naming different beats.
   */
  entries: IAutoMovieCaptionEntry[];
}

/**
 * Serialize a caption sidecar for the host to write: two-space indented JSON
 * in declaration order, followed by one newline.
 *
 * @evidence contracts/common.md#principled-implementation `JSON.stringify` emits object keys in insertion order, and the planner and slicer build every object with a fixed key order, so the same sidecar always yields the same bytes.
 * @evidence contracts/common.md#clear-and-simple-design The function owns only the byte format; writing the file is the host's job, which keeps the render package free of file-system access here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It formats the value as given and adds no field or ordering for a particular consumer.
 * @evidence contracts/common.md#meaningful-documentation The doc states the indentation, the key order and the trailing newline a host writes.
 * @evidence contracts/performance.md#efficient-algorithms One stringify pass is linear in the number of spans and their text length.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Serialization of one value per call coordinates no phases or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The only allocation is the returned string, owned by the caller, and no handle or task is opened.
 * @author Samchon
 */
export const renderCaptionSidecar = (
  sidecar: IAutoMovieCaptionSidecar,
): string => `${JSON.stringify(sidecar, null, 2)}\n`;
