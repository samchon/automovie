/**
 * A right-handed sweep of a staged two-string guitar voicing. The left index
 * stops string 3 at fret 4 and the middle stops string 2 at fret 5. The right
 * index sweeps both adjacent strings. The law admits the clock and the rigid
 * guitar affordances before planning either arm.
 */
export interface IAutoMovieMotionHumanGuitarChord {
  /** Subject id of the independently supported guitar. */
  prop: string;

  /** Down goes toward higher pitch, from string 3 to 2. Up reverses that order. */
  direction: "down" | "up";

  /** Action-local seconds to complete fretting, greater than zero. */
  stopAt: number;

  /** Action-local seconds to start the across-string sweep, after stopAt. */
  sweepStartAt: number;

  /** Action-local seconds to finish the sweep, after sweepStartAt. */
  sweepEndAt: number;

  /** Action-local seconds until the fretting fingers lift, after sweepEndAt. */
  releaseAt: number;

  /**
   * Total action-local seconds, finite and greater than releaseAt. Required:
   * the score sets it, so no natural value is defined.
   */
  duration: number;
}
