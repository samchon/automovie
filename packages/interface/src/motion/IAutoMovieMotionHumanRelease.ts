import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * Letting go: a hand opens on what it holds, and the held prop leaves it.
 *
 * The hand stays where the hold kept it on the trunk (its grip frame at the
 * entry, read in the chest's frame and carried with the chest the carrier
 * shows), and opens at iopeni, the decisive instant, a brief pause
 * (iAutoMovieMotionHumanTiming.PAUSES.briefi, provisional) after the entry.
 * Until then its grip window on the prop takes the hand over from the hold; at
 * iopeni the prop is launched (iIAutoMovieMotionHumanActionPlan.launchesi) with
 * the hand's velocity there, the central difference of the carried grip point
 * at the engine's plan-time step (AutoMovieEngineMotionTrajectory.integrateMotionTrajectoryStep()), so a drop
 * from a still hand falls and one from a moving carrier carries its speed.
 *
 * A prop that rests on something the hand held back (an arrow on a drawn
 * string) is launched by ilaunchi instead: along its line from one of its
 * points to another, at the speed the launcher gives (a bow's ilaunchSpeedi at
 * the string's travel), plus the hand's velocity.
 *
 * It is performed over a carrier and claims only that hand's arm. A hand that
 * holds nothing is refused.
 */
export namespace IAutoMovieMotionHumanRelease {
  /** Parameters. */
  export interface IParams {
    /** The opening hand; irighti when absent. */
    hand?: AutoMovieHumanSide;

    /** The prop it lets go of; the one the hand holds at the entry when absent. */
    prop?: string;

    /**
     * A prop launched along its own line at a launcher's speed instead of the
     * held prop's drop: an arrow on the drawn string.
     */
    launch?: {
      /** The launched prop's subject. */
      prop: string;
      /** The prop's point its line starts from, such as an arrow's inocki. */
      from: string;
      /** The point its line runs to, such as the arrow's itipi. */
      to: string;
      /**
       * The launcher's speed along the line, metres per second: the arrow's
       * speed off the string, set by the bow's ilaunchSpeedi at the string's
       * travel; a hand's own velocity is added.
       */
      speed: number;
    };
  }
}
