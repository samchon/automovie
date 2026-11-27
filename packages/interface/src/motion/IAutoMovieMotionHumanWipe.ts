import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanBalance } from "./IAutoMovieMotionHumanBalance";

/**
 * Wiping a table, counter or other level surface with the flat palm in circles,
 * standing before it: a household task that the composed laws lacked, the
 * palm's circling stroke on a work surface.
 *
 * The goal is the palm flat on the surface, circling its centre with a radius
 * of a quarter of the forearm (provisional) `cycles` times. The hand comes to
 * the surface in the aimed movement time (McIntosh et al. 2018), circles over
 * `PERIOD` seconds a cycle (provisional) with the palm on the surface
 * throughout, and returns. A patch whose far side lies beyond the standing arm
 * is leaned into (`AutoMovieMotionHumanLeanInto`): the trunk tips about the
 * hips by the least pitch that keeps the wrist within `REACH` of the arm's
 * length; one still out of reach at the lean's limit is refused, since it is
 * walked up to first. The preferred working height lies 200 to 250 mm below the
 * elbow (Li, Chang and Zhang 2024, Sensors 24:7056); the law accepts any
 * reachable height and the author places the surface. Events: the phrase's
 * `ready` (palm down), `strokeStart`, `strokeEnd`, `relax` (palm lifted).
 *
 * Not yet: leaning on the counter with the free hand (Iwakiri et al. 2007), a
 * held cloth as a prop, and the task sequences (dishwashing, laundry, bed
 * making) that chain this with the grasp, affordance and bend laws.
 */
export namespace IAutoMovieMotionHumanWipe {
  /** Parameters. */
  export interface IParams {
    /**
     * A balancing shift (`IAutoMovieMotionHumanBalance`): one closed-form shift
     * of its part, scaled by its weight between its two event-named instants,
     * each field absent taking the law's recommendation. Absent, none: the
     * posture is the law's own kinematic one with no balance shift or
     * centre-of-mass reading.
     */
    balance?: IAutoMovieMotionHumanBalance;

    /** The middle of the patch wiped, on the surface's top. */
    on: IAutoMovieMotionTarget;

    /** The hand; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** How many circles, a whole number of at least 1; 3 when absent. */
    count?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }
}
