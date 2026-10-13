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
