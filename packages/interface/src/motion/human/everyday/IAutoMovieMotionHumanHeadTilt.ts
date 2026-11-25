/**
 * A conversational head tilt toward either shoulder, then a return to the
 * posture underneath. The tilt is a roll of the cervical chain.
 */
export interface IAutoMovieMotionHumanHeadTilt {
  /**
   * Total added cervical roll in degrees, in [-20, 20]. Positive tilts toward
   * the actor's right.
   */
  degrees: number;

  /**
   * Seconds for tilt, hold and return combined. Finite and at least 0.6, 0.9
   * when omitted.
   */
  duration?: number;
}
