/**
 * A round-off: a cartwheel that travels along the way the body faced, turns
 * half round about the vertical and lands on both feet at once, facing back
 * where it came from, the entry to a back handspring or a back salto.
 *
 * The body rolls as the cartwheel's wheel (`GymnasticsWheel`): the arms raised
 * wide and the legs straddled over the first `cartwheel.SHAPE` degrees, the
 * lowest spoke bearing at every angle. On the way to the hands it turns a
 * quarter about the vertical through what bears, so the wheel rolls along the
 * heading; past the handstand it turns the second quarter about the bearing
 * hand while the legs close, so both feet come down together, knees bent to
 * take the landing. The roll is one axis and each quarter turn is another,
 * about the vertical, and the two run at once while a quarter is being made
 * (over the wheel's first `ENTRY` degrees and over `SNAP` degrees past the
 * handstand): the posture's heading turns and its roll grows in the same
 * instant, composed as heading then roll, not solved as one rotation about a
 * moving axis (is a multi-axis case, not planned here).
 *
 * The angle follows minimum-jerk progress over the seconds; nothing is
 * integrated, and no hurdle step, push off the second hand or flight before the
 * landing is shown, a first pass.
 *
 * Events: `handsDown` (the first hand bears), `inverted` (half the wheel),
 * `feetDown` (the feet bear again), `relax` (the end).
 */
export namespace IAutoMovieMotionHumanRoundOff {
  /** Parameters. */
  export interface IParams {
    /** The hand that goes down first; `left` when absent. */
    lead?: "left" | "right";

    /**
     * Seconds the round-off takes, positive; 1.2 s when absent
     * (`roundOff.SECONDS`, provisional: quicker than the cartwheel, the entry
     * to a tumbling run).
     */
    duration?: number;
  }
}
