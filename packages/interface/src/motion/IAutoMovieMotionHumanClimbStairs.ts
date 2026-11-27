import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanClimbStairsFlight } from "./IAutoMovieMotionHumanClimbStairsFlight";

/**
 * Climbing a flight of stairs up or down from standing before its first nosing,
 * step over step (one foot per tread) or step by step (both feet on each
 * tread), ending with both feet on the last tread.
 *
 * The flight lies ahead along the heading: its first nosing `start` metres
 * ahead of the toes, `count` treads of `riser` and `tread` metres, rising for
 * `up` and falling below the floor for `down`. The goals are footprints: each
 * foot lands with the middle of its sole on the middle of its tread, at its
 * standing lateral place; a sole too long to keep `EDGE` from both edges there
 * hangs its heel over the nosing ascending and its toes over the next one
 * descending, as a long foot stands on a short tread, and on the landing stands
 * `EDGE` past the last nosing. A swinging foot takes the shortest path over the
 * flight that keeps every point of its sole above the surface under it and
 * `CLEARANCE` above each edge it passes (`AutoMovieMotionHumanClearance`):
 * ascending it lifts beside the riser and follows the line of the nosings,
 * descending it moves forward and lowers once its heel is past the nosing. The
 * pelvis moves between the stances on minimum-jerk progress over the middle of
 * the two feet, half a step behind them over the floor (`climbStairsPelvis`).
 * Its height at a stance is the highest from which both legs reach their feet,
 * so the lower foot's leg is straight and the upper one's bent; it changes
 * while a foot swings and holds in double support, and is lowered wherever
 * either leg, planted or swinging, could not reach its foot.
 *
 * The trunk inclines forward by `ASCENT_LEAN` going up and by a walk's
 * inclination going down, shared between the pelvis and the spine by the
 * lumbopelvic rhythm and tipped about the hips, since the trunk flexes forward
 * more in stair ascent than in level walking (McFadyen and Winter 1988, J
 * Biomech 21:733).
 *
 * The cadence is 90 steps a minute (Mian, Narici, Minetti and Baltzopoulos
 * 2007, Gait Posture 26:463), scaled by the square root of the hip height
 * (Alexander 1984) and by the manner's tempo; each swing takes 0.8 of a step
 * and the double support the rest (provisional). Risers from 100 to 180 mm and
 * treads from 280 mm are the 2010 ADA ranges (504.2), the defaults 170 and 280
 * mm; a riser above 0.35 of the hip height or a tread shorter than 0.6 of the
 * foot is refused with the body's feasible range (provisional limits). Events:
 * `toeOff<n>` and `treadContact<n>` per step, numbered from 1.
 *
 * An optional `rail` names the bracing hand and a `bar` affordance of the fixed
 * stair prop named in `on` (`climbStairsRail`): the hand closes on the bar as
 * the climb starts, slides along its axis abreast of the pelvis while it bears,
 * and lets go before the final stance. A bar the displayed grip misses is
 * refused. A following walk on the landing turns there.
 */
export namespace IAutoMovieMotionHumanClimbStairs {
  /** Parameters. */
  export interface IParams
    extends IAutoMovieMotionHumanClimbStairsFlight.IStairs {
    /** One foot per tread, or both feet on each; `stepOverStep` when absent. */
    pattern?: "stepOverStep" | "stepByStep";

    /** The foot that steps first; `right` when absent. */
    lead?: "left" | "right";

    /**
     * The prop the flight belongs to, its subject id, so a foot on a tread
     * bears on it; a prop that moves, such as an escalator's inclined steps,
     * carries the climb planned where it stood at the start. The fixed floor
     * frame when absent.
     */
    on?: string;

    /**
     * The bar a hand bears on during the climb; requires the stair prop in
     * `on`. No rail when absent.
     */
    rail?: IRail;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /** A hand on a named bar of the flight. */
  export interface IRail {
    /** The performer's hand that braces on the rail. */
    hand: AutoMovieHumanSide;

    /** Id of the `bar` affordance on the fixed stair prop. */
    point: string;
  }
}
