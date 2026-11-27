import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";

/**
 * Whether every joint centre of a displayed motion travels a continuous,
 * humanly fast path: no jump, no out-and-back spike and no impossible speed.
 *
 * A body is continuous in time, so the distance a joint centre covers shrinks
 * with the interval it is read over, while a branch flip of an
 * inverse-kinematics fit, a swapped reference or a mis-phased blend moves it by
 * the same distance however short the interval. Three readings follow, all on
 * the displayed bones over the whole motion:
 *
 * - `jump`: the displacement that is still there when the interval around it is
 *   `1 / (rate * 4^LEVELS)` long ({@link resolve}). At 24 Hz that is 41
 *   microseconds, in which a joint at 100 m/s covers 4 mm. A frame interval is
 *   resolved when some joint's displacement over it departs from the mean of
 *   its two neighbours' by more than the limit.
 * - `reversal`: a joint that goes out and straight back within two intervals of
 *   `1 / REVERSAL` seconds, read as the shorter of the two displacements times
 *   the cosine of their opposition. A fit that flips for one frame and returns
 *   shows here even where each displacement alone is a plausible speed. The
 *   window is a time, not the caller's grid: on a coarser grid a stroke that
 *   oscillates by design (a rub, a wave) would go out and back within two
 *   intervals, so a turn found on the coarse grid is read again on intervals of
 *   that length across its two.
 * - `speed`: the fastest any joint centre travels over a grid interval, metres
 *   per second, the bound a caller sets from the action (a hand raised to the
 *   face does not reach a punch's speed).
 */
export namespace IAutoMovieMotionHumanAuditContinuity {
  /** The three readings of {@link measure}. */
  export interface IResult {
    /** The largest displacement left at full resolution, metres. */
    jump: IAutoMovieMotionHumanAuditMeasure;

    /** The largest out-and-back within two grid intervals, metres. */
    reversal: IAutoMovieMotionHumanAuditMeasure;

    /** The fastest joint centre over a grid interval, metres per second. */
    speed: IAutoMovieMotionHumanAuditMeasure;
  }
}
