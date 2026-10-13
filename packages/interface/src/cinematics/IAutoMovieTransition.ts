/**
 * A blend between two adjacent shots in a sequence: the alternative to the
 * default hard cut. The incoming entry overlaps the previous one for `duration`
 * seconds.
 *
 * The overlap may not outlast either entry's played span, and two transitions
 * may not overlap inside one entry. Sequence playback blends the outgoing tail
 * with weight `1 - elapsed / duration` for both kinds; `kind` currently reaches
 * only the render plan's transition spans, so `fade` samples like
 * `crossDissolve`.
 *
 * @evidence contracts/common.md#principled-implementation The incoming entry starts `duration` seconds early and `resolveFromTimeline` blends the outgoing tail with incoming weight `elapsed / duration`, a linear cross-fade over the overlap.
 * @evidence contracts/common.md#clear-and-simple-design Two fields and no easing or color options; the timeline arithmetic in `sequenceTimeline` and `cutSequence` reads only `duration`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `kind: "fade"` is accepted and copied onto render-plan `transitionSpans`, but sequence frame samples blend the two shots exactly as for `crossDissolve`, so a fade renders as a dissolve.
 * @evidence contracts/common.md#meaningful-documentation States the overlap semantics, the played-span and adjacent-overlap limits, the blend weight, and that the two kinds currently sample identically.
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
