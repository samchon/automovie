/**
 * A blend between two adjacent shots in a sequence: the alternative to the
 * default hard cut. The incoming entry overlaps the previous one for `duration`
 * seconds.
 *
 * `cutSequence` refuses an overlap that outlasts either entry's played span and
 * two transitions that would overlap inside one entry. Sequence playback blends
 * the outgoing tail with weight `1 - elapsed / duration` for both kinds; `kind`
 * currently reaches only the render plan's transition spans, so `fade` samples
 * like `crossDissolve`.
 *
 * @evidence contracts/common.md#principled-implementation `playbackCursor` and `resolveFromTimeline` sample the previous entry's tail beside the live entry with incoming weight `elapsed / duration`, a linear dissolve over the overlap `sequenceTimeline` created by pulling the entry forward.
 * @evidence contracts/common.md#clear-and-simple-design A style tag and a length are all the edit needs; the overlap placement and blend weight are derived by the timeline instead of being stored per entry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The documentation states that `fade` samples like a dissolve instead of implying a fade-through-black the sampler does not perform, and an over-long transition is refused rather than shortened.
 * @evidence contracts/common.md#meaningful-documentation States the overlap semantics, every refusal, the blend weight, and that the kind is not yet distinguished by frame sampling.
 * @author Samchon
 */
export interface IAutoMovieTransition {
  /**
   * The blend style. Only the render plan's transition spans distinguish the
   * two values; frame sampling treats both as a dissolve.
   */
  kind: "crossDissolve" | "fade";

  /** Finite positive overlap length, in seconds. */
  duration: number;
}
