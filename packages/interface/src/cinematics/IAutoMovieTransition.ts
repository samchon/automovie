/**
 * A blend between two adjacent shots in a sequence: the alternative to the
 * default hard cut. The incoming entry overlaps the previous one for `duration`
 * seconds.
 *
 * `cutSequence` refuses an overlap that outlasts either entry's played span and
 * two transitions that would overlap inside one entry. With `elapsed` the
 * output seconds since the incoming entry's start, `playbackLayersAt` weighs
 * the two shots:
 *
 * - `crossDissolve` mixes them, the outgoing tail at `1 - elapsed / duration` and
 *   the incoming shot at `elapsed / duration`;
 * - `fade` dips through black: the outgoing tail alone fades to black over the
 *   first half of the overlap, at `1 - 2 × elapsed / duration`, and the
 *   incoming shot alone fades up from black over the second half, at `2 ×
 *   elapsed / duration - 1`, so the midpoint is black. Over a transparent
 *   background the dip falls to alpha 0 instead of black.
 */
export interface IAutoMovieTransition {
  /** The blend style: a mix of the two shots, or a dip through black. */
  kind: "crossDissolve" | "fade";

  /** Finite positive overlap length, in seconds. */
  duration: number;
}
