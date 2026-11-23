/**
 * The fixed grid of film seconds a person's displayed poses are sampled on by a
 * reader that tabulates them: `RATE` knots a second from second zero.
 *
 * The grid is the film's, not a query's, so the frame instants of 24, 30, 60
 * and 120 frames a second are all knots and two films of the same performance
 * share their knots.
 */
export namespace HumanPoseKnots {
  /** Knots a film second. */
  export const RATE: number = 120;
}
