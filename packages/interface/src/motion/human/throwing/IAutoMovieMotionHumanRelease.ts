import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Letting go: a hand opens on what it holds, and the held prop leaves it.
 *
 * The hand stays where the hold kept it on the trunk (its grip frame at the
 * entry, read in the chest's frame and carried with the chest the carrier
 * shows), and opens at `open`, the decisive instant, a brief pause
 * (`AutoMovieMotionHumanTiming.PAUSES.brief`, provisional) after the entry.
 * Until then its grip window on the prop takes the hand over from the hold; at
 * `open` the prop is launched (`IAutoMovieMotionHumanActionPlan.launches`) with
 * the hand's velocity there, the central difference of the carried grip point
 * at the engine's plan-time step (`integrateMotionTrajectory.STEP`), so a drop
 * from a still hand falls and one from a moving carrier carries its speed.
 *
 * A prop that rests on something the hand held back (an arrow on a drawn
 * string) is launched by `launch` instead: along its line from one of its
 * points to another, at the speed the launcher gives (a bow's `launchSpeed` at
 * the string's travel), plus the hand's velocity.
 *
 * It is performed over a carrier and claims only that hand's arm. A hand that
 * holds nothing is refused.
 */
export namespace IAutoMovieMotionHumanRelease {
  /** Parameters. */
  export interface IParams {
    /** The opening hand; `right` when absent. */
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
      /** The prop's point its line starts from, such as an arrow's `nock`. */
      from: string;
      /** The point its line runs to, such as the arrow's `tip`. */
      to: string;
      /**
       * The launcher's speed along the line, metres per second: the arrow's
       * speed off the string, set by the bow's `launchSpeed` at the string's
       * travel; a hand's own velocity is added.
       */
      speed: number;
    };
  }
}
