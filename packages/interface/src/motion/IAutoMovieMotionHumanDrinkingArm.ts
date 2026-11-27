/**
 * The arm a held vessel is brought to the lips with, read as a person drinks:
 * the arm the resolver fits for a goal, read on its displayed bones, and
 * whether it holds the posture of drinking from a glass, its shoulder flexed
 * and abducted within the range healthy drinkers use (Alt Murphy, Sunnerhagen,
 * Johnels and Willén 2006, J NeuroEng Rehabil 3:18, Table 2, twenty healthy
 * controls; the table of Murphy, Willén and Sunnerhagen 2011, Neurorehabil
 * Neural Repair 25:71, was not read), and the hand's attitude on the way there.
 * `AutoMovieMotionHumanTouchUpright` searches a vessel's facing and
 * `AutoMovieMotionHumanTouchDrink` its lean by it, and the touch stroke carries
 * a held vessel by its attitude.
 */
export namespace IAutoMovieMotionHumanDrinkingArm {
  /** What a fitted arm reads. */
  export interface IArm {
    /**
     * How far the reached hand carries the vessel's axis off the asked one,
     * degrees.
     */
    tilt: number;

    /** The shoulder's flexion, degrees, as the source measures it (`measured`). */
    flexion: number;

    /**
     * The shoulder's abduction, degrees, as the source measures it
     * (`measured`).
     */
    abduction: number;

    /**
     * How far the forearm's twist lies inside its range, degrees; negative
     * outside.
     */
    room: number;

    /**
     * The forearm's clinical twist, degrees, pronation positive
     * (`AutoMovieEngineHumanoidRestFrame`); what `room` is measured from, read by the
     * refusal.
     */
    twist: number;
  }

  /**
   * The arm a search tried that lies least past the drinking range, for its
   * refusal.
   */
  export interface INearest {
    /** Its fitted arm. */
    arm: IAutoMovieMotionHumanDrinkingArm.IArm;

    /** Where it was tried, in words. */
    at: string;
  }

  /**
   * The shoulder's flexion and abduction as Alt Murphy et al. 2006 measure them
   * for the drinking task, in whose definition `FLEXION` and `ABDUCTION` are
   * bounds: "for shoulder flexion/extension in sagittal plane and
   * abduction/adduction in frontal plane", the angle "between the vectors
   * joining the shoulder and elbow markers and the vertical vector from the
   * shoulder marker toward the hip". Each is the unsigned angle between the
   * shoulder-to-elbow vector and the shoulder-to-hip vector, both projected on
   * one plane through the body's heading: the sagittal one (forward and up) for
   * the flexion, the frontal one (to the side and up) for the abduction. What
   * still differs from the source: the planes are the body's heading's, where
   * the source's are the laboratory's; the points are the joints' centres,
   * where the source's are skin markers; and the source's own caution holds,
   * that these "are not the true joint angles". Result returned by
   * AutoMovieMotionHumanDrinkingArm.measured. The flexion and the abduction,
   * degrees, unsigned.
   */
  export type IMeasuredResult = {
    /**
     * Unsigned angle in degrees between shoulder-elbow and shoulder-hip vectors
     * projected on the body's sagittal plane; this is the drinking study's
     * measurement, not the shoulder joint's clinical flexion coordinate.
     */
    flexion: number;
    /**
     * Unsigned angle in degrees between shoulder-elbow and shoulder-hip vectors
     * projected on the body's frontal plane; this is a measured direction, not
     * the clinical abduction coordinate.
     */
    abduction: number;
  };
}
