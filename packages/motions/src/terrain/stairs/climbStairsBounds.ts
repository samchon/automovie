import { AutoMovieMotionHumanInterrupt } from "../../compose/AutoMovieMotionHumanInterrupt";

/**
 * The bounds a stair climb is laid by: its blend, its ascent lean, the sole's
 * edge margin and the settle.
 */
export namespace climbStairsBounds {
  /**
   * Offset decay time of a cut out of the arrived climb, seconds (a deliberate
   * change of the whole body's action,
   * `AutoMovieMotionHumanInterrupt.BLENDS.deliberate`).
   */
  export const BLEND: number = AutoMovieMotionHumanInterrupt.BLENDS.deliberate;

  /**
   * The trunk's forward inclination ascending stairs, degrees (provisional:
   * more than a walk's, McFadyen and Winter 1988, J Biomech 21:733).
   */
  export const ASCENT_LEAN: number = 8;

  /**
   * How much narrower than `EDGE` the band around a nosing that asks for
   * clearance is, metres: a planted sole held `EDGE` from the nosing lies
   * outside the band, not on its edge.
   */
  export const EDGE_MARGIN: number = 0.003;

  /**
   * Step periods the climb holds both feet on the last tread after arriving
   * (provisional).
   */
  export const SETTLE: number = 0.3;
}
