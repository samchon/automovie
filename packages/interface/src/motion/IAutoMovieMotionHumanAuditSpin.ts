import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";

/**
 * Whether every bone turns continuously: the orientation counterpart of the
 * joint-centre continuity audit.
 *
 * A joint centre shows a bone's snap only through the bones below it, so a bone
 * with nothing below it (a fingertip's phalanx, the toes, an eye, the jaw) can
 * flip without any centre moving, and a head or a hand that snaps by a few
 * degrees moves the centres below it by less than the jump limit. This audit
 * reads the orientations themselves.
 *
 * - `spin`: the fastest any bone turns over a grid interval, degrees per second.
 * - `turn`: the largest turn of any bone that is still there when the interval
 *   around it has been halved `LEVELS` times, degrees. A bone that turns
 *   smoothly turns half as far in half the time, so after ten halvings a
 *   thousandth of its interval's turn is left; a snap keeps its size. An
 *   interval is resolved only where a bone's turn exceeds the mean of its
 *   neighbouring intervals' (of the one neighbour at either end of the motion)
 *   by more than `limit`, so a smooth motion costs no pose beyond the grid.
 */
export namespace IAutoMovieMotionHumanAuditSpin {
  /** The two readings of {@link measure}. */
  export interface IResult {
    /**
     * The largest turn left at full resolution, degrees, with the bone and the
     * start of its final interval; zero at `none` when every bone turns
     * continuously at the limit.
     */
    turn: IAutoMovieMotionHumanAuditMeasure;

    /**
     * The fastest turn over a grid interval, degrees per second, with the bone
     * and the interval's start.
     */
    spin: IAutoMovieMotionHumanAuditMeasure;
  }
}
